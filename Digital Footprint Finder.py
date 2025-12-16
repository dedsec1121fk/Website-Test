#!/usr/bin/env python3
# Digital Footprint Finder - UPDATED
# - Added extra false-positive elimination checks
# - Incremental saving while scanning (partial results & cache)
# - More robust confidence scoring
# - Compatible with Android/Termux (saves results under SAVE_DIR)
# Legitimate OSINT use only

import os, sys, json, time, random, re, socket, subprocess, threading, signal
from concurrent.futures import ThreadPoolExecutor, as_completed

SITES_JSON = "websites_updated.json"
THREADS = 12
BASE_DELAY = 0.5
JITTER = 0.3

FP_CACHE = "fp_cache.json"
SAVE_DIR = "/storage/emulated/0/Download/Digital Footprint Finder"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Digital Footprint Finder OSINT)"
}

# Colors
RESET = "\\033[0m"
GREEN = "\\033[92m"
CYAN = "\\033[96m"
YELLOW = "\\033[93m"
RED = "\\033[91m"
DIM = "\\033[2m"

# Dependencies
def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    import requests
except Exception:
    install("requests")
    import requests

# TOR auto-detect
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

# Global
progress_lock = threading.Lock()
results_lock = threading.Lock()
completed = 0
start_time = None
stop_event = threading.Event()
fp_cache_global = {}
partial_results = {}

signal.signal(signal.SIGINT, lambda s,f: handle_exit())

def handle_exit():
    print(f"\\n\\n{RED}[!] Scan interrupted by user (Ctrl+C){RESET}")
    print(f"{YELLOW}[*] Saving cache and partial results and exiting safely...{RESET}")
    save_json(FP_CACHE, fp_cache_global)
    save_json(os.path.join(SAVE_DIR, "partial_results.json"), partial_results)
    stop_event.set()
    sys.exit(0)

def rate_limit():
    time.sleep(BASE_DELAY + random.uniform(0, JITTER))

def load_json(path, default=None):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else {}

def save_json(path, data):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def format_time(seconds):
    seconds = int(seconds)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def progress_bar(current, total, site):
    elapsed = time.time() - start_time if start_time else 1
    speed = current / elapsed if elapsed > 0 else 0
    remaining = (total - current) / speed if speed > 0 else 0
    percent = int((current / total) * 100) if total else 0
    bar_len = 28
    filled = int(bar_len * percent / 100)
    bar = f"{GREEN}{'█' * filled}{DIM}{'─' * (bar_len - filled)}{RESET}"
    sys.stdout.write(
        f"\\r{CYAN}[{bar}{CYAN}] {percent:3d}% {YELLOW}{current}/{total}{RESET} | {GREEN}{speed:5.2f} sites/s{RESET} | {CYAN}ETA {format_time(remaining)}{RESET} | {DIM}{site[:22]:22}{RESET}"
    )
    sys.stdout.flush()

def regex_check(text, patterns):
    for p in patterns:
        try:
            if not re.search(p, text, re.IGNORECASE):
                return False
        except re.error:
            # invalid regex in config: fallback to simple substring check
            if p.lower() not in text.lower():
                return False
    return True

def content_check(text, rules, response):
    # multiple heuristics to reduce false positives
    t = text or ""
    t_low = t.lower()
    # 1) must_not_contain / must_contain checks
    for bad in rules.get("must_not_contain", []):
        if bad.lower() in t_low:
            return False
    for good in rules.get("must_contain", []):
        if good.lower() not in t_low:
            return False
    # 2) regex checks (supports both list and single string)
    if "regex" in rules and rules["regex"]:
        if not regex_check(text, rules["regex"]):
            return False
    # 3) page length - tiny pages are often placeholders or errors
    if len(t) < rules.get("min_content_length", 100):
        return False
    # 4) check final URL or redirect for username presence
    try:
        final_url = getattr(response, "url", "") or ""
        if "{}" in rules.get("url","") and rules.get("require_username_in_url", True):
            if username_not_in_string(final_url, rules.get("username_pattern", None)):
                return False
    except Exception:
        pass
    # 5) check username appears in page as whole word somewhere
    uname = rules.get("_username_for_check", "")
    if uname:
        if not re.search(rf"\\b{re.escape(uname)}\\b", t, re.IGNORECASE):
            # allow some sites that don't show username clearly
            if not rules.get("allow_no_username_match", False):
                return False
    return True

def username_not_in_string(s, pattern=None):
    if not s:
        return True
    if pattern:
        try:
            return not re.search(pattern, s, re.IGNORECASE)
        except re.error:
            return pattern.lower() not in s.lower()
    return True  # conservative default

def make_request(session, method, url):
    if method.upper() == "HEAD":
        return session.head(url, timeout=12, allow_redirects=True)
    return session.get(url, timeout=12, allow_redirects=True)

def calculate_confidence(site_cfg, fp_hits, signals):
    # signals is number of positive signals (e.g. username in page, username in URL, meta tags, length)
    base = site_cfg.get("confidence_weight", 0.6)
    add = min(signals * 0.12, 0.35)
    penalty = min(fp_hits * 0.08, 0.4)
    conf = base + add - penalty
    return round(max(0.0, min(1.0, conf)), 2)

def save_partial_result(username, result):
    with results_lock:
        partial_results.setdefault(username, [])
        partial_results[username].append(result)
        # save immediately so partial results persist if the script is killed
        os.makedirs(SAVE_DIR, exist_ok=True)
        save_json(os.path.join(SAVE_DIR, "partial_results.json"), partial_results)
        # also save human-readable incremental file
        path = os.path.join(SAVE_DIR, f"{username}_partial.txt")
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(f\"\"\"Partial results for {username}\n\n\"\"\")
                for r in sorted(partial_results[username], key=lambda x: x.get("confidence",0), reverse=True):
                    level = "HIGH" if r["confidence"] >= 0.85 else ("MEDIUM" if r["confidence"] >= 0.65 else "LOW")
                    f.write(f\"[{level}] {r['site']} ({r.get('category','')})\\nURL: {r['url']}\\nConfidence: {r['confidence']}\\n\\n\")
        except Exception:
            pass

def check_site(session, site, cfg, username, total):
    global completed, fp_cache_global
    if stop_event.is_set():
        return None
    url = cfg["url"].format(username)
    method = cfg.get("method", "GET")
    valid_status = cfg.get("valid_status", [200])
    category = cfg.get("category", "Uncategorized")
    key = f\"{site}:{username}\"
    # attach username to cfg for checks
    cfg["_username_for_check"] = username

    try:
        r = make_request(session, method, url)
        rate_limit()
        # status check
        if r is None or getattr(r, 'status_code', None) not in valid_status:
            fp_cache_global[key] = fp_cache_global.get(key, 0) + 1
            result = None
        else:
            # content checks and heuristics
            text = r.text or ""
            # run content_check with extra info
            if method.upper() != "HEAD" and not content_check(text, cfg, r):
                fp_cache_global[key] = fp_cache_global.get(key, 0) + 1
                result = None
            else:
                # compute extra signals
                signals = 0
                # username in page body
                if re.search(rf\"\\b{re.escape(username)}\\b\", text, re.IGNORECASE):
                    signals += 1
                # username in final URL
                if username.lower() in (getattr(r, 'url', '') or '').lower():
                    signals += 1
                # presence of social meta tags (og:title/og:description) containing username
                if 'og:title' in text.lower() or 'og:description' in text.lower():
                    if re.search(re.escape(username), text, re.IGNORECASE):
                        signals += 1
                # page length signal
                if len(text) > 800:
                    signals += 1
                confidence = calculate_confidence(cfg, fp_cache_global.get(key, 0), signals)
                result = {
                    "site": site,
                    "category": category,
                    "url": url,
                    "final_url": getattr(r, 'url', None),
                    "confidence": confidence,
                    "signals": signals
                }
                # incremental save when we find a result
                save_partial_result(username, result)
    except requests.RequestException:
        result = None
    except Exception:
        result = None

    with progress_lock:
        completed += 1
        progress_bar(completed, total, site)

    return result

def scan(username):
    global start_time, fp_cache_global, partial_results, completed
    sites = load_json(SITES_JSON)
    if not sites:
        print(\"[-] websites JSON missing or empty -> make sure websites_updated.json is present\") 
        sys.exit(1)
    fp_cache_global = load_json(FP_CACHE, {})
    partial_results = load_json(os.path.join(SAVE_DIR, \"partial_results.json\"), {})
    session = get_session()
    results = []
    total = len(sites)
    print(f\"\\n{CYAN}[*] Scanning {total} platforms... (Ctrl+C to stop safely){RESET}\\n\")
    start_time = time.time()
    completed = 0

    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        futures = [
            executor.submit(check_site, session, site, cfg, username, total)
            for site, cfg in sites.items()
        ]
        for f in as_completed(futures):
            r = f.result()
            if r:
                results.append(r)

    print(f\"\\n\\n{GREEN}[✓] Scan completed{RESET}\")
    save_json(FP_CACHE, fp_cache_global)
    # save full results
    if results:
        save_full_results(username, results)
    return results

def save_full_results(username, results):
    os.makedirs(SAVE_DIR, exist_ok=True)
    path = os.path.join(SAVE_DIR, f\"{username}.txt\")
    with open(path, \"w\", encoding=\"utf-8\") as f:
        f.write(\"Digital Footprint Finder Results\\n\")
        f.write(f\"Username: {username}\\n\")
        f.write(f\"Tor Used: {'YES' if USE_TOR else 'NO'}\\n\\n\")
        for r in sorted(results, key=lambda x: x.get(\"confidence\",0), reverse=True):
            level = \"HIGH\" if r[\"confidence\"] >= 0.85 else (\"MEDIUM\" if r[\"confidence\"] >= 0.65 else \"LOW\")
            f.write(f\"[{level}] {r['site']} ({r.get('category','')})\\n\")
            f.write(f\"URL: {r['url']}\\nFinal: {r.get('final_url')}\\nSignals: {r.get('signals')}\\nConfidence: {r['confidence']}\\n\\n\")
    print(f\"\\n{GREEN}[✓] Results saved to:{RESET}\\n{path}\")


def main():
    os.system(\"clear\")
    username = input(\"Enter username: \").strip()
    if not username:
        print(\"[-] Username cannot be empty\")
        return
    results = scan(username)
    print(f\"\\n{CYAN}[•] Found {len(results)} confirmed profiles{RESET}\")
    if results:
        save_full_results(username, results)

if __name__ == \"__main__\":
    main()
