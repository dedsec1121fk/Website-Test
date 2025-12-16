#!/usr/bin/env python3
# Digital Footprint Finder
# Sherlock-grade OSINT username searcher
# Legitimate OSINT use only

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

# ---------------- CONFIG ----------------

SITES_JSON = "websites.json"
THREADS = 8
BASE_DELAY = 0.6
JITTER = 0.4

FP_CACHE = "fp_cache.json"
SAVE_DIR = "/storage/emulated/0/Download/Digital Footprint Finder"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Digital Footprint Finder OSINT)"
}

# ---------------- ANSI COLORS ----------------

RESET = "\033[0m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
DIM = "\033[2m"

# ---------------- DEPENDENCIES ----------------

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    import requests
except ImportError:
    install("requests")
    import requests

# ---------------- TOR AUTO-DETECT ----------------

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
completed = 0
start_time = None
stop_event = threading.Event()
fp_cache_global = {}

# ---------------- CTRL+C HANDLER ----------------

def handle_exit(sig, frame):
    print(f"\n\n{RED}[!] Scan interrupted by user (Ctrl+C){RESET}")
    print(f"{YELLOW}[*] Saving cache and exiting safely...{RESET}")
    save_json(FP_CACHE, fp_cache_global)
    stop_event.set()
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)

# ---------------- UTILS ----------------

def rate_limit():
    time.sleep(BASE_DELAY + random.uniform(0, JITTER))

def load_json(path, default=None):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else {}

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# ---------------- PROGRESS BAR ----------------

def format_time(seconds):
    seconds = int(seconds)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def progress_bar(current, total, site):
    elapsed = time.time() - start_time
    speed = current / elapsed if elapsed > 0 else 0
    remaining = (total - current) / speed if speed > 0 else 0
    percent = int((current / total) * 100)

    bar_len = 28
    filled = int(bar_len * percent / 100)
    bar = f"{GREEN}{'█' * filled}{DIM}{'─' * (bar_len - filled)}{RESET}"

    sys.stdout.write(
        f"\r{CYAN}[{bar}{CYAN}] "
        f"{percent:3d}% "
        f"{YELLOW}{current}/{total}{RESET} | "
        f"{GREEN}{speed:5.2f} sites/s{RESET} | "
        f"{CYAN}ETA {format_time(remaining)}{RESET} | "
        f"{DIM}{site[:22]:22}{RESET}"
    )
    sys.stdout.flush()

# ---------------- VERIFICATION ----------------

def regex_check(text, patterns):
    for p in patterns:
        if not re.search(p, text, re.IGNORECASE):
            return False
    return True

def content_check(text, rules):
    t = text.lower()
    for bad in rules.get("must_not_contain", []):
        if bad.lower() in t:
            return False
    for good in rules.get("must_contain", []):
        if good.lower() not in t:
            return False
    if "regex" in rules:
        if not regex_check(text, rules["regex"]):
            return False
    return True

def make_request(session, method, url):
    if method.upper() == "HEAD":
        return session.head(url, timeout=10, allow_redirects=True)
    return session.get(url, timeout=10, allow_redirects=True)

# ---------------- CONFIDENCE ----------------

def calculate_confidence(site_cfg, fp_hits):
    base = site_cfg.get("confidence_weight", 0.6)
    penalty = min(fp_hits * 0.1, 0.4)
    return round(max(0.0, min(1.0, base - penalty)), 2)

# ---------------- CORE SCAN ----------------

def check_site(session, site, cfg, username, total):
    global completed

    if stop_event.is_set():
        return None

    url = cfg["url"].format(username)
    method = cfg.get("method", "GET")
    valid_status = cfg.get("valid_status", [200])
    category = cfg.get("category", "Uncategorized")
    key = f"{site}:{username}"

    try:
        r = make_request(session, method, url)
        rate_limit()

        if r.status_code not in valid_status:
            fp_cache_global[key] = fp_cache_global.get(key, 0) + 1
            result = None
        else:
            if method != "HEAD" and not content_check(r.text, cfg):
                fp_cache_global[key] = fp_cache_global.get(key, 0) + 1
                result = None
            else:
                confidence = calculate_confidence(cfg, fp_cache_global.get(key, 0))
                result = {
                    "site": site,
                    "category": category,
                    "url": url,
                    "confidence": confidence
                }

    except requests.RequestException:
        result = None

    with progress_lock:
        completed += 1
        progress_bar(completed, total, site)

    return result

def scan(username):
    global start_time, fp_cache_global

    sites = load_json(SITES_JSON)
    if not sites:
        print("[-] websites.json missing or empty")
        sys.exit(1)

    fp_cache_global = load_json(FP_CACHE, {})
    session = get_session()
    results = []
    total = len(sites)

    print(f"\n{CYAN}[*] Scanning {total} platforms... (Ctrl+C to stop safely){RESET}\n")
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        futures = [
            executor.submit(check_site, session, site, cfg, username, total)
            for site, cfg in sites.items()
        ]

        for f in as_completed(futures):
            r = f.result()
            if r:
                results.append(r)

    print(f"\n\n{GREEN}[✓] Scan completed successfully{RESET}")
    save_json(FP_CACHE, fp_cache_global)
    return results

# ---------------- SAVE RESULTS ----------------

def save_results(username, results):
    os.makedirs(SAVE_DIR, exist_ok=True)
    path = os.path.join(SAVE_DIR, f"{username}.txt")

    with open(path, "w", encoding="utf-8") as f:
        f.write("Digital Footprint Finder Results\n")
        f.write(f"Username: {username}\n")
        f.write(f"Tor Used: {'YES' if USE_TOR else 'NO'}\n\n")

        for r in sorted(results, key=lambda x: x["confidence"], reverse=True):
            level = "HIGH" if r["confidence"] >= 0.85 else \
                    "MEDIUM" if r["confidence"] >= 0.65 else "LOW"
            f.write(f"[{level}] {r['site']} ({r['category']})\n")
            f.write(f"URL: {r['url']}\n")
            f.write(f"Confidence: {r['confidence']}\n\n")

    print(f"\n{GREEN}[✓] Results saved to:{RESET}\n{path}")

# ---------------- MAIN ----------------

def main():
    os.system("clear")
    username = input("Enter username: ").strip()
    if not username:
        print("[-] Username cannot be empty")
        return

    results = scan(username)
    print(f"\n{CYAN}[•] Found {len(results)} confirmed profiles{RESET}")
    save_results(username, results)

if __name__ == "__main__":
    main()

