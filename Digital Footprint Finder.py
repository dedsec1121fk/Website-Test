#!/usr/bin/env python3
# Digital Footprint Finder - ENHANCED VERSION
# Optimized for False Positive Reduction

import os
import sys
import json
import time
import random
import re
import socket
import subprocess
import threading
import signal
from concurrent.futures import ThreadPoolExecutor, as_completed
import html

# ---------------- CONFIGURATION ----------------

SITES_JSON = "websites.json"
THREADS = 15
BASE_DELAY = 1.0  # Slightly increased to avoid soft-bans
JITTER = 0.5
FP_CACHE_FILE = "fp_cache.json"

# Universal strings that indicate a page is dead/empty across MOST sites
GLOBAL_SOFT_404 = [
    "page not found", "404 not found", "user not found",
    "doesn't exist", "does not exist", "page cannot be found",
    "content not available", "account suspended", "profile not found",
    "removed", "deactivated", "nothing here", "no longer available"
]

# Detect Environment for Save Path
if os.path.exists("/storage/emulated/0"):
    SAVE_DIR = "/storage/emulated/0/Download/Digital Footprint Finder"
else:
    SAVE_DIR = os.path.join(os.getcwd(), "DFF_Results")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
}

# ---------------- ANSI COLORS ----------------

RESET = "\033[0m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
DIM = "\033[2m"
BOLD = "\033[1m"

# ---------------- DEPENDENCY MANAGEMENT ----------------

def install(pkg):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
    except Exception as e:
        print(f"{RED}[!] Failed to install {pkg}: {e}{RESET}")
        sys.exit(1)

try:
    import requests
except ImportError:
    print(f"{YELLOW}[*] Installing requests library...{RESET}")
    install("requests")
    import requests

# ---------------- NETWORK & TOR ----------------

def tor_running(host="127.0.0.1", port=9050):
    try:
        with socket.create_connection((host, port), timeout=2):
            return True
    except OSError:
        return False

USE_TOR = tor_running()

def get_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    if USE_TOR:
        s.proxies = {
            "http": "socks5h://127.0.0.1:9050",
            "https": "socks5h://127.0.0.1:9050"
        }
    return s

# ---------------- GLOBAL STATE ----------------

progress_lock = threading.Lock()
results_lock = threading.Lock()
stop_event = threading.Event()

completed = 0
start_time = None
fp_cache = {}
partial_results = {}

# ---------------- FILE HELPERS ----------------

def load_json(path, default=None):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return default if default is not None else {}

def save_json(path, data):
    try:
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"\n{RED}[!] Error saving {path}: {e}{RESET}")

def save_partial_hit(username, result):
    with results_lock:
        partial_results.setdefault(username, []).append(result)
        json_path = os.path.join(SAVE_DIR, "partial_results.json")
        save_json(json_path, partial_results)

# ---------------- INTERRUPT HANDLER ----------------

def handle_exit(sig=None, frame=None):
    print(f"\n\n{RED}[!] Scan interrupted. Saving data...{RESET}")
    save_json(FP_CACHE_FILE, fp_cache)
    print(f"{GREEN}[✓] Data saved. Exiting.{RESET}")
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)

# ---------------- UI & PROGRESS ----------------

def format_time(seconds):
    seconds = int(seconds)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def update_progress(total, site_name):
    global completed
    elapsed = time.time() - start_time
    
    with progress_lock:
        completed += 1
        speed = completed / elapsed if elapsed > 0 else 0
        remaining = (total - completed) / speed if speed > 0 else 0
        percent = int((completed / total) * 100)

        bar_len = 25
        filled = int(bar_len * percent / 100)
        bar = f"{GREEN}{'█' * filled}{DIM}{'─' * (bar_len - filled)}{RESET}"

        sys.stdout.write(
            f"\r{CYAN}[{bar}{CYAN}] "
            f"{BOLD}{percent:3d}%{RESET} "
            f"| {GREEN}{speed:4.1f} req/s{RESET} "
            f"| ETA: {YELLOW}{format_time(remaining)}{RESET} "
            f"| {DIM}{site_name[:15]:15}{RESET}"
        )
        sys.stdout.flush()

# ---------------- VALIDATION LOGIC ----------------

def rate_limit():
    time.sleep(BASE_DELAY + random.uniform(0, JITTER))

def extract_title(text):
    """Safe extraction of HTML title for validation."""
    match = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE | re.DOTALL)
    if match:
        return html.unescape(match.group(1)).strip()
    return ""

def is_login_redirect(final_url, original_url):
    """Check if the URL redirected to a login page or homepage."""
    final = final_url.rstrip('/').lower()
    orig = original_url.rstrip('/').lower()
    
    if final == orig:
        return False

    bad_indicators = ["login", "signin", "auth", "account/restricted", "home"]
    
    # If we started at /user and ended at /login or root /, it's a fail
    if any(x in final for x in bad_indicators):
        return True
    
    # Redirected to root domain (e.g. twitter.com/user -> twitter.com)
    from urllib.parse import urlparse
    parsed = urlparse(final)
    if parsed.path == "" or parsed.path == "/":
        return True

    return False

def content_valid(response, username, rules, original_url):
    text = response.text
    text_lower = text.lower()
    
    # 0. Check for empty/junk responses
    if len(text) < 300: # Increase threshold for meaningful content
        return False

    # 1. Global Soft 404 Check (Unless disabled by specific site)
    if not rules.get("ignore_global_soft_404", False):
        title = extract_title(text).lower()
        
        # Check title for 404s
        for soft_404 in GLOBAL_SOFT_404:
            if soft_404 in title:
                return False
        
        # Check Body for major error phrases if title was ambiguous
        # We limit this to the first 2000 chars to avoid false positives in random comments
        head_text = text_lower[:2000] 
        for soft_404 in GLOBAL_SOFT_404:
            if soft_404 in head_text:
                return False

    # 2. Redirect Verification
    if is_login_redirect(response.url, original_url):
        return False

    # 3. Explicit "Must Not Contain"
    for bad in rules.get("must_not_contain", []):
        if bad.lower() in text_lower:
            return False

    # 4. Explicit "Must Contain"
    for good in rules.get("must_contain", []):
        if good.lower() not in text_lower:
            return False

    # 5. Regex Checks
    if "regex" in rules:
        for pattern in rules["regex"]:
            if not re.search(pattern, text, re.IGNORECASE):
                return False

    # 6. Username Verification
    # This is the strictest check. If the username isn't in the page, it's risky.
    if not rules.get("allow_no_username_match", False):
        if not re.search(rf"\b{re.escape(username)}\b", text, re.IGNORECASE):
            return False

    return True

def check_site(session, site, cfg, username, total):
    if stop_event.is_set():
        return None

    url = cfg["url"].format(username)
    method = cfg.get("method", "GET")
    valid_status = cfg.get("valid_status", [200])
    category = cfg.get("category", "Uncategorized")
    
    try:
        if method == "HEAD":
            r = session.head(url, timeout=10, allow_redirects=True)
        else:
            r = session.get(url, timeout=15, allow_redirects=True)
        
        rate_limit()

        result = None
        is_valid = False

        if r.status_code in valid_status:
            if method == "HEAD":
                is_valid = True
            elif content_valid(r, username, cfg, url):
                is_valid = True

        if is_valid:
            # Calculate Confidence
            conf = cfg.get("confidence_weight", 0.6)
            
            # Boost if username is in the title
            title = extract_title(r.text)
            if username.lower() in title.lower():
                conf += 0.2
            
            # Boost if URL is exact match and not redirected
            if r.url.rstrip('/') == url.rstrip('/'):
                conf += 0.1
                
            final_conf = round(min(1.0, max(0.0, conf)), 2)

            result = {
                "site": site,
                "category": category,
                "url": url,
                "final_url": r.url,
                "confidence": final_conf,
                "title": title[:50].strip()
            }
            
            save_partial_hit(username, result)

    except Exception:
        result = None

    update_progress(total, site)
    return result

# ---------------- MAIN SCANNER ----------------

def scan(username):
    global start_time, completed, fp_cache
    
    sites = load_json(SITES_JSON)
    fp_cache = load_json(FP_CACHE_FILE)
    
    if not sites:
        print(f"\n{RED}[!] Error: '{SITES_JSON}' not found or invalid.{RESET}")
        return []

    completed = 0
    start_time = time.time()
    session = get_session()
    results = []
    
    print(f"\n{BOLD}[*] Target: {CYAN}{username}{RESET}")
    print(f"{BOLD}[*] Sites:  {CYAN}{len(sites)}{RESET}")
    print(f"{BOLD}[*] Threads:{CYAN} {THREADS}{RESET}")
    print(f"{DIM}--------------------------------------------------{RESET}")

    with ThreadPoolExecutor(max_workers=THREADS) as exe:
        futures = [
            exe.submit(check_site, session, site, cfg, username, len(sites))
            for site, cfg in sites.items()
        ]
        
        for f in as_completed(futures):
            r = f.result()
            if r:
                results.append(r)

    return results

def save_final_report(username, results):
    os.makedirs(SAVE_DIR, exist_ok=True)
    path = os.path.join(SAVE_DIR, f"{username}_FINAL.txt")

    with open(path, "w", encoding="utf-8") as f:
        f.write("DIGITAL FOOTPRINT FINDER - FINAL REPORT\n")
        f.write("=======================================\n")
        f.write(f"Username: {username}\n")
        f.write(f"Total Found: {len(results)}\n\n")

        for r in sorted(results, key=lambda x: x["confidence"], reverse=True):
            f.write(f"[{r['category']}] {r['site']} (Conf: {int(r['confidence']*100)}%)\n")
            f.write(f"URL: {r['url']}\n")
            if r['title']:
                f.write(f"Title: {r['title']}\n")
            f.write("-" * 30 + "\n")
    
    print(f"\n\n{GREEN}[✓] Final report saved to:{RESET}\n{path}")

# ---------------- ENTRY POINT ----------------

def main():
    os.system("cls" if os.name == "nt" else "clear")
    print(f"{CYAN}Digital Footprint Finder - Enhanced{RESET}")

    username = input(f"{BOLD}Enter username to scan: {RESET}").strip()
    if not username:
        return

    try:
        results = scan(username)
        save_final_report(username, results)
        print(f"{CYAN}[•] Scan complete. Found {len(results)} profiles.{RESET}")
    except KeyboardInterrupt:
        handle_exit()

if __name__ == "__main__":
    main()
