#!/usr/bin/env python3
# Digital Footprint Finder - FIXED VERSION
# Syntax-safe for Termux / Python 3.10+

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

RESET="\033[0m"; GREEN="\033[92m"; CYAN="\033[96m"
YELLOW="\033[93m"; RED="\033[91m"; DIM="\033[2m"

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    import requests
except Exception:
    install("requests")
    import requests

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

progress_lock = threading.Lock()
results_lock = threading.Lock()
stop_event = threading.Event()
fp_cache = {}
partial_results = {}
completed = 0
start_time = None

def save_json(path, data):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def handle_exit(sig=None, frame=None):
    print("\n[!] Interrupted — saving partial results")
    save_json(FP_CACHE, fp_cache)
    save_json(os.path.join(SAVE_DIR, "partial_results.json"), partial_results)
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)

def rate_limit():
    time.sleep(BASE_DELAY + random.uniform(0, JITTER))

def content_valid(text, username, rules):
    if len(text) < rules.get("min_content_length", 120):
        return False
    if not re.search(rf"\b{re.escape(username)}\b", text, re.I):
        if not rules.get("allow_no_username_match", False):
            return False
    for bad in rules.get("must_not_contain", []):
        if bad.lower() in text.lower():
            return False
    for good in rules.get("must_contain", []):
        if good.lower() not in text.lower():
            return False
    return True

def save_partial(username, result):
    with results_lock:
        partial_results.setdefault(username, []).append(result)
        os.makedirs(SAVE_DIR, exist_ok=True)

        save_json(os.path.join(SAVE_DIR, "partial_results.json"), partial_results)

        txt = os.path.join(SAVE_DIR, f"{username}_partial.txt")
        with open(txt, "w", encoding="utf-8") as f:
            f.write("Partial results for %s\n\n" % username)
            for r in partial_results[username]:
                f.write("[%s] %s\n%s\nConfidence: %.2f\n\n" % (
                    r["category"], r["site"], r["url"], r["confidence"]
                ))

def check_site(session, site, cfg, username, total):
    global completed
    if stop_event.is_set():
        return None

    url = cfg["url"].format(username)
    try:
        r = session.get(url, timeout=12, allow_redirects=True)
        rate_limit()

        if r.status_code not in cfg.get("valid_status", [200]):
            return None

        if not content_valid(r.text or "", username, cfg):
            fp_cache[f"{site}:{username}"] = fp_cache.get(f"{site}:{username}", 0) + 1
            return None

        signals = 0
        if username.lower() in r.url.lower():
            signals += 1
        if len(r.text) > 800:
            signals += 1

        confidence = min(1.0, cfg.get("confidence_weight", 0.6) + signals * 0.15)

        result = {
            "site": site,
            "category": cfg.get("category", "Unknown"),
            "url": url,
            "final_url": r.url,
            "confidence": round(confidence, 2)
        }

        save_partial(username, result)
        return result

    finally:
        with progress_lock:
            completed += 1
            percent = int((completed / total) * 100)
            sys.stdout.write(f"\rScanning: {percent}% ({completed}/{total})")
            sys.stdout.flush()

def scan(username):
    global completed, start_time
    with open(SITES_JSON, "r", encoding="utf-8") as f:
        sites = json.load(f)

    completed = 0
    start_time = time.time()
    session = get_session()
    results = []

    print(f"[*] Scanning {len(sites)} platforms… Ctrl+C safe")

    with ThreadPoolExecutor(max_workers=THREADS) as exe:
        futures = [
            exe.submit(check_site, s, c, username, len(sites))
            for s, c in sites.items()
        ]
        for f in as_completed(futures):
            r = f.result()
            if r:
                results.append(r)

    return results

def save_final(username, results):
    os.makedirs(SAVE_DIR, exist_ok=True)
    path = os.path.join(SAVE_DIR, f"{username}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write("Digital Footprint Finder Results\n")
        f.write("Username: %s\n\n" % username)
        for r in sorted(results, key=lambda x: x["confidence"], reverse=True):
            f.write("[%s] %s\n%s\nConfidence: %.2f\n\n" % (
                r["category"], r["site"], r["url"], r["confidence"]
            ))
    print("\n[✓] Results saved to", path)

def main():
    os.system("clear")
    username = input("Enter username: ").strip()
    if not username:
        print("Username required")
        return
    results = scan(username)
    save_final(username, results)
    print("[✓] Found", len(results), "profiles")

if __name__ == "__main__":
    main()
