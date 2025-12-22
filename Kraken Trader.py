#!/usr/bin/env python3
# Kraken Trader.py
# Termux-friendly crypto trading bot template (paper + real mode) with persistent learning.
# NOTE: This is educational software. Crypto trading is risky. No profit is guaranteed.

import os
import sys
import json
import time
import math
import signal
import random
import hashlib
import traceback
import subprocess
from datetime import datetime, timezone

# ----------------------------
# Auto-install dependencies
# ----------------------------
REQUIRED_PACKAGES = ["ccxt", "requests"]

def pip_install(pkgs):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade"] + pkgs)
        return True
    except Exception:
        return False

def ensure_deps():
    missing = []
    for p in REQUIRED_PACKAGES:
        try:
            __import__(p)
        except Exception:
            missing.append(p)
    if missing:
        print(f"[i] Installing missing packages: {', '.join(missing)}")
        ok = pip_install(missing)
        if not ok:
            print("[!] Failed to install dependencies. Try:")
            print("    python -m pip install --upgrade pip")
            print("    python -m pip install ccxt")
            sys.exit(1)

ensure_deps()
import ccxt  # noqa
import requests  # noqa

# ----------------------------
# Paths / storage
# ----------------------------
BASE_DIR = os.path.join(os.path.expanduser("~"), "Kraken Trader")
os.makedirs(BASE_DIR, exist_ok=True)

FILES = {
    "keys": os.path.join(BASE_DIR, "keys.json"),  # sensitive
    "learning": os.path.join(BASE_DIR, "learning.json"),
    "profits": os.path.join(BASE_DIR, "profits.json"),
    "market_prices": os.path.join(BASE_DIR, "market_prices.json"),
    "history16m": os.path.join(BASE_DIR, "previous_16_months_market_movements_for_most_50_known_crypto.json"),
    "paper_state": os.path.join(BASE_DIR, "paper_state.json"),
    "settings": os.path.join(BASE_DIR, "settings.json"),
    "logs": os.path.join(BASE_DIR, "run_logs.json"),
    "real_state": os.path.join(BASE_DIR, "real_state.json"),
}

DEFAULT_SETTINGS = {
    "run_max_seconds": 3 * 60 * 60,  # 3 hours per run
    "base_currency": "EUR",          # used for paper mode + selecting pairs
    "paper_start_amount": 10.0,
    "paper_reset_floor": 8.0,
    "paper_target_learn": 12.0,      # once reached, stop resetting on dips
    "real_trade_cap": 10.0,          # first stage: cap usage for real mode
    "min_trade_value": 5.0,          # avoid dust trades
    "fee_rate": 0.0026,              # rough taker fee assumption for paper mode
    "loop_sleep_seconds": 25,
    "max_symbols_considered": 30,
    "market_refresh_seconds": 60,
    "risk": {
        "max_position_fraction": 0.25,  # max of available base balance in one position
        "stop_loss_pct": 0.03,
        "take_profit_pct": 0.025,
        "min_edge": 0.0015,             # minimum expected edge to trade (risk-adjusted)
        "cooldown_seconds": 180,
    },
    "strategy": {
        "use_limit_orders_real": True,
        "limit_price_offset_pct": 0.001,  # 0.1% from mid
        "human_noise": 0.15,              # adds exploration
    },

    "gemini": {
        "enabled": False,
        "model": "gemini-1.5-flash",
        "temperature": 0.2,
        "max_output_tokens": 512,
        "notes": "Optional. If enabled and a Gemini API key exists in keys.json, the bot will ask Gemini for small bias/risk tweaks based on recent performance."
    },
    "stage2": {
        "unlocked": False,
        "enabled": False,
        "notes": "Stage 2 'huge profit mode' unlocks ONLY after the paper equity curve is consistently good (not one lucky hit).",
        "unlock_rules": {
            "window_points": 240,
            "min_days": 3,
            "min_return_pct": 0.06,
            "max_drawdown_pct": 0.04
        },
        "overrides": {
            "real_trade_cap": 1e9,
            "risk": {
                "max_position_fraction": 0.45,
                "stop_loss_pct": 0.035,
                "take_profit_pct": 0.04,
                "cooldown_seconds": 90
            },
            "strategy": {
                "human_noise": 0.08
            }
        }
    }

}

# A practical "top coins" universe (not all exist on Kraken; we skip missing)
TOP_COINS = [
    "BTC","ETH","SOL","XRP","ADA","DOGE","AVAX","DOT","LINK","MATIC","TON","TRX","LTC","BCH","ATOM","XLM",
    "ETC","NEAR","ICP","FIL","APT","ARB","OP","INJ","IMX","GRT","AAVE","MKR","RUNE","SUI","SEI","KAS",
    "HBAR","ALGO","UNI","SNX","EGLD","XMR","FTM","FLOW","TIA","PEPE","WIF","BONK","JUP","STX","THETA","EOS"
]

# ----------------------------
# Helpers: JSON safe load/save (never overwrite existing structure)
# ----------------------------
def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def safe_read_json(path, default):
    try:
        if not os.path.exists(path):
            return default
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def safe_write_json(path, data, sensitive=False):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)
    if sensitive:
        try:
            os.chmod(path, 0o600)
        except Exception:
            pass

def ensure_files():
    # Create shareable files if missing, with no sensitive data inside
    if not os.path.exists(FILES["learning"]):
        safe_write_json(FILES["learning"], {
            "version": 1,
            "created_at": _now_iso(),
            "notes": "Shareable. No API keys. Stores model-like learning signals and preferences.",
            "symbols": {},
            "meta": {"total_cycles": 0, "total_trades_paper": 0, "total_trades_real": 0}
        })
    if not os.path.exists(FILES["profits"]):
        safe_write_json(FILES["profits"], {
            "version": 1,
            "created_at": _now_iso(),
            "notes": "Shareable. No API keys. Stores PnL summary for paper + real.",
            "paper": {"equity_curve": [], "trades": []},
            "real": {"equity_curve": [], "trades": []}
        })
    if not os.path.exists(FILES["market_prices"]):
        safe_write_json(FILES["market_prices"], {
            "version": 1,
            "updated_at": _now_iso(),
            "notes": "Shareable. Last seen prices, spreads, and timestamps.",
            "prices": {}
        })
    if not os.path.exists(FILES["history16m"]):
        safe_write_json(FILES["history16m"], {
            "version": 1,
            "created_at": _now_iso(),
            "notes": "Shareable. Incrementally collected OHLCV snapshots for available symbols (daily).",
            "symbols": {}
        })
    if not os.path.exists(FILES["paper_state"]):
        safe_write_json(FILES["paper_state"], {
            "version": 1,
            "created_at": _now_iso(),
            "base": DEFAULT_SETTINGS["base_currency"],
            "phase": "learning",  # learning -> normal
            "start_amount": DEFAULT_SETTINGS["paper_start_amount"],
            "cash": DEFAULT_SETTINGS["paper_start_amount"],
            "holdings": {},  # symbol-> {"amount":..., "avg_price":..., "entry_price":..., "last_action":...}
            "last_reset_at": None,
            "last_trade_at": 0
        })
    if not os.path.exists(FILES["settings"]):
        safe_write_json(FILES["settings"], DEFAULT_SETTINGS)
    if not os.path.exists(FILES["logs"]):
        safe_write_json(FILES["logs"], {"version": 1, "runs": []})

    if not os.path.exists(FILES["real_state"]):
        safe_write_json(FILES["real_state"], {
            "version": 1,
            "created_at": _now_iso(),
            "notes": "Shareable. Tracks real-mode position management state (no API keys).",
            "last_my_trades_fetch_ms": 0,
            "last_positions": {}
        })

ensure_files()

SETTINGS = safe_read_json(FILES["settings"], DEFAULT_SETTINGS)

# ----------------------------
# Security note about "encrypted/hidden"
# ----------------------------
SECURITY_NOTE = (
    "Network connections to exchanges are made over HTTPS/TLS (encrypted in transit). "
    "They cannot be 'hidden' from your device/ISP, but their contents are encrypted."
)

# ----------------------------
# Exchange setup + key management
# ----------------------------
def load_keys():
    return safe_read_json(FILES["keys"], {
        "created_at": _now_iso(),
        "kraken": {"apiKey": "", "secret": ""},
        "gemini": {"apiKey": ""},
        "notes": "Sensitive. Keep private. File permissions are restricted where possible."
    })

def save_keys(keys):
    safe_write_json(FILES["keys"], keys, sensitive=True)

def prompt_nonempty(label):
    while True:
        v = input(label).strip()
        if v:
            return v
        print("[!] Empty input, try again.")

def make_kraken_client(apiKey, secret):
    ex = ccxt.kraken({
        "apiKey": apiKey,
        "secret": secret,
        "enableRateLimit": True,
        "timeout": 30000,
    })
    return ex

def validate_kraken_keys(ex):
    # We try a private endpoint call. If it fails, keys likely wrong or permissions missing.
    try:
        _ = ex.fetch_balance()
        return True, "Kraken keys look valid (private access OK)."
    except Exception as e:
        msg = str(e)
        return False, msg

def setup_keys_interactive():
    keys = load_keys()

    attempts = 0
    while True:
        attempts += 1
        print("\n--- Preventing typos: paste carefully ---")
        api = prompt_nonempty("Kraken API key: ")
        sec = prompt_nonempty("Kraken Private key (secret): ")
        gem = prompt_nonempty("Gemini API key (stored for future use): ")

        ex = make_kraken_client(api, sec)
        ok, msg = validate_kraken_keys(ex)
        if ok:
            keys["kraken"]["apiKey"] = api
            keys["kraken"]["secret"] = sec
            keys["gemini"]["apiKey"] = gem
            keys["updated_at"] = _now_iso()
            save_keys(keys)
            print(f"[✓] {msg}")
            print("[✓] Keys saved.")
            return True
        else:
            print("[!] Keys seem invalid or lacking permissions.")
            print(f"    Reason: {msg}")
            if attempts >= 5:
                print("[!] Too many failed attempts. Returning to menu.")
                return False
            print("[i] Try again.\n")

# ----------------------------
# Market / history utilities
# ----------------------------
def load_markets_cached(ex):
    return ex.load_markets()

def available_pairs_for_base(ex, base="EUR"):
    markets = load_markets_cached(ex)
    pairs = []
    for sym, m in markets.items():
        # Prefer spot pairs quoted in base currency
        if isinstance(sym, str) and sym.endswith("/" + base):
            if m.get("active", True):
                pairs.append(sym)
    return sorted(set(pairs))

def pick_universe_pairs(ex, base="EUR"):
    pairs = []
    markets = load_markets_cached(ex)
    for coin in TOP_COINS:
        s = f"{coin}/{base}"
        if s in markets and markets[s].get("active", True):
            pairs.append(s)
    # If not enough, fallback to any base pairs
    if len(pairs) < 8:
        pairs = available_pairs_for_base(ex, base=base)[:SETTINGS["max_symbols_considered"]]
    return pairs[:SETTINGS["max_symbols_considered"]]

def fetch_tickers_safe(ex, symbols):
    out = {}
    for s in symbols:
        try:
            t = ex.fetch_ticker(s)
            out[s] = t
        except Exception:
            continue
    return out

def update_market_prices_store(tickers):
    mp = safe_read_json(FILES["market_prices"], {"version": 1, "prices": {}})
    mp["updated_at"] = _now_iso()
    for sym, t in tickers.items():
        mp["prices"][sym] = {
            "timestamp": t.get("timestamp"),
            "datetime": t.get("datetime"),
            "last": t.get("last"),
            "bid": t.get("bid"),
            "ask": t.get("ask"),
            "high": t.get("high"),
            "low": t.get("low"),
            "baseVolume": t.get("baseVolume"),
            "quoteVolume": t.get("quoteVolume"),
        }
    safe_write_json(FILES["market_prices"], mp)

def update_history_incremental(ex, symbols, days_target=30):
    """
    Incrementally store daily OHLCV snapshots. (16 months is large; we build over time.)
    Keeps RAM low by appending small chunks.
    """
    hist = safe_read_json(FILES["history16m"], {"version": 1, "symbols": {}})
    changed = False
    timeframe = "1d"

    for sym in symbols:
        try:
            existing = hist["symbols"].get(sym, [])
            since = None
            if existing:
                # last candle timestamp + 1ms
                since = int(existing[-1][0]) + 1
            # fetch a small chunk
            candles = ex.fetch_ohlcv(sym, timeframe=timeframe, since=since, limit=min(days_target, 60))
            if candles:
                # merge without duplicates
                if not existing:
                    merged = candles
                else:
                    seen = set(c[0] for c in existing)
                    merged = existing + [c for c in candles if c[0] not in seen]
                    merged.sort(key=lambda x: x[0])
                hist["symbols"][sym] = merged[-600:]  # keep last ~600 days in file for size control
                changed = True
        except Exception:
            continue

    if changed:
        hist["updated_at"] = _now_iso()
        safe_write_json(FILES["history16m"], hist)

# ----------------------------
# "Learning" model (simple, persistent, human-like heuristics)
# ----------------------------
def compute_returns(prices):
    rets = []
    for i in range(1, len(prices)):
        p0, p1 = prices[i-1], prices[i]
        if p0 and p1 and p0 > 0:
            rets.append((p1 / p0) - 1.0)
    return rets

def mean(xs):
    return sum(xs)/len(xs) if xs else 0.0

def stdev(xs):
    if len(xs) < 2:
        return 0.0
    m = mean(xs)
    v = sum((x-m)**2 for x in xs)/(len(xs)-1)
    return math.sqrt(v)

def load_learning():
    return safe_read_json(FILES["learning"], {"version": 1, "symbols": {}, "meta": {"total_cycles": 0}})

def save_learning(learn):
    safe_write_json(FILES["learning"], learn)

def update_learning_from_history(learn, hist, symbols):
    """
    Create/update per-symbol estimates:
    - drift (avg daily return)
    - vol (std dev daily return)
    - confidence increases with samples
    """
    for sym in symbols:
        candles = hist.get("symbols", {}).get(sym, [])
        if len(candles) < 20:
            continue
        closes = [c[4] for c in candles[-180:]]  # last ~6 months max
        rets = compute_returns(closes)
        if len(rets) < 15:
            continue

        drift = mean(rets)
        vol = stdev(rets)
        n = len(rets)

        srec = learn["symbols"].get(sym, {
            "drift": 0.0, "vol": 0.0, "samples": 0,
            "wins": 0, "losses": 0, "last_trade_ts": 0,
            "bias": 0.0  # gets updated by trade outcomes
        })

        # Blend old with new (EMA-like)
        alpha = 0.35
        srec["drift"] = (1-alpha)*srec["drift"] + alpha*drift
        srec["vol"] = (1-alpha)*srec["vol"] + alpha*vol
        srec["samples"] = max(srec["samples"], n)
        learn["symbols"][sym] = srec

    learn["meta"]["total_cycles"] = learn.get("meta", {}).get("total_cycles", 0) + 1
    learn["updated_at"] = _now_iso()
    return learn

def score_symbol(learn, sym):
    s = learn["symbols"].get(sym)
    if not s:
        return -1e9
    drift = s.get("drift", 0.0)
    vol = s.get("vol", 0.0)
    bias = s.get("bias", 0.0)
    samples = s.get("samples", 0)

    # risk-adjusted expected value (very rough)
    if vol <= 1e-9:
        base = drift
    else:
        base = drift / vol

    # confidence
    conf = min(1.0, samples / 120.0)
    score = conf * base + 0.35 * bias
    return score

# ----------------------------
# Profit tracking (shareable)
# ----------------------------
def profits_log_trade(mode, trade):
    prof = safe_read_json(FILES["profits"], {"paper": {"trades": []}, "real": {"trades": []}})
    prof.setdefault(mode, {}).setdefault("trades", []).append(trade)
    safe_write_json(FILES["profits"], prof)

def profits_log_equity(mode, equity):
    prof = safe_read_json(FILES["profits"], {"paper": {"equity_curve": []}, "real": {"equity_curve": []}})
    prof.setdefault(mode, {}).setdefault("equity_curve", []).append({"ts": int(time.time()*1000), "iso": _now_iso(), "equity": equity})
    # keep file size reasonable
    prof[mode]["equity_curve"] = prof[mode]["equity_curve"][-2000:]
    safe_write_json(FILES["profits"], prof)

# ----------------------------
# Paper trading engine
# ----------------------------
def load_paper_state():
    return safe_read_json(FILES["paper_state"], {})

def save_paper_state(st):
    safe_write_json(FILES["paper_state"], st)

def paper_equity(st, tickers):
    cash = float(st.get("cash", 0.0))
    total = cash
    for sym, pos in st.get("holdings", {}).items():
        amt = float(pos.get("amount", 0.0))
        last = None
        t = tickers.get(sym)
        if t:
            last = t.get("last")
        if last and amt:
            total += amt * float(last)
    return total

def paper_buy(st, sym, price, spend):
    fee = SETTINGS["fee_rate"]
    spend = max(0.0, float(spend))
    if spend <= 0:
        return False, "Spend<=0"
    if st["cash"] < spend:
        return False, "Not enough cash"
    net = spend * (1.0 - fee)
    amt = net / price
    pos = st["holdings"].get(sym, {"amount": 0.0, "avg_price": 0.0, "entry_price": price})
    old_amt = pos["amount"]
    new_amt = old_amt + amt
    if new_amt <= 0:
        return False, "Invalid amount"
    # avg price update
    pos["avg_price"] = (pos["avg_price"]*old_amt + price*amt) / new_amt if old_amt > 0 else price
    pos["amount"] = new_amt
    pos["entry_price"] = pos.get("entry_price", price) if old_amt > 0 else price
    pos["last_action"] = {"type": "BUY", "price": price, "iso": _now_iso()}
    st["holdings"][sym] = pos
    st["cash"] -= spend
    st["last_trade_at"] = int(time.time())
    return True, f"Bought {amt:.8f} of {sym} @ {price}"

def paper_sell(st, sym, price, amount):
    fee = SETTINGS["fee_rate"]
    amount = float(amount)
    pos = st["holdings"].get(sym)
    if not pos:
        return False, "No position"
    if amount <= 0 or amount > pos["amount"]:
        return False, "Invalid amount"
    gross = amount * price
    net = gross * (1.0 - fee)
    pos["amount"] -= amount
    if pos["amount"] <= 1e-12:
        st["holdings"].pop(sym, None)
    else:
        st["holdings"][sym] = pos
    st["cash"] += net
    st["last_trade_at"] = int(time.time())
    return True, f"Sold {amount:.8f} of {sym} @ {price}"

# ----------------------------
# Decision logic (human-like conservative)
# ----------------------------
def decide_trade(learn, st, tickers):
    base = SETTINGS["base_currency"]
    risk = SETTINGS["risk"]
    now = int(time.time())

    # cooldown to avoid overtrading
    if now - int(st.get("last_trade_at", 0)) < risk["cooldown_seconds"]:
        return None

    # pick candidate symbols with tickers
    symbols = [s for s in tickers.keys() if s.endswith("/" + base)]
    if not symbols:
        return None

    # exploration: sometimes try a different symbol
    ranked = sorted(symbols, key=lambda s: score_symbol(learn, s), reverse=True)
    if not ranked:
        return None

    human_noise = float(SETTINGS["strategy"].get("human_noise", 0.15))
    if random.random() < human_noise and len(ranked) >= 3:
        sym = random.choice(ranked[:min(8, len(ranked))])
    else:
        sym = ranked[0]

    t = tickers.get(sym, {})
    last = t.get("last")
    bid = t.get("bid") or last
    ask = t.get("ask") or last
    if not last or not bid or not ask:
        return None

    # risk estimate
    srec = learn["symbols"].get(sym, {})
    drift = float(srec.get("drift", 0.0))
    vol = float(srec.get("vol", 0.0))
    bias = float(srec.get("bias", 0.0))

    # expected edge (very rough)
    # more conservative when cash is small
    edge = (drift + 0.15*bias)
    vol_safe = max(vol, 1e-6)
    risk_adj = edge / vol_safe

    # minimum edge gate
    if risk_adj < float(risk["min_edge"]):
        return None

    # If holding it already, manage with TP/SL
    pos = st.get("holdings", {}).get(sym)
    if pos:
        entry = float(pos.get("entry_price", float(last)))
        change = (float(last)/entry) - 1.0
        if change <= -abs(float(risk["stop_loss_pct"])):
            return {"action": "SELL", "symbol": sym, "reason": "stop_loss", "price": float(bid)}
        if change >= abs(float(risk["take_profit_pct"])):
            return {"action": "SELL", "symbol": sym, "reason": "take_profit", "price": float(bid)}
        # otherwise hold
        return None

    # If not holding: consider buy small position
    cash = float(st.get("cash", 0.0))
    if cash < SETTINGS["min_trade_value"]:
        return None

    max_frac = float(risk["max_position_fraction"])
    spend = min(cash * max_frac, cash)
    spend = max(0.0, spend)

    # don't buy if spend too tiny
    if spend < SETTINGS["min_trade_value"]:
        return None

    return {"action": "BUY", "symbol": sym, "reason": "risk_adjusted_edge", "price": float(ask), "spend": float(spend)}

# ----------------------------
# Real trading helpers (Kraken)
# ----------------------------
def real_can_trade():
    keys = load_keys()
    return bool(keys.get("kraken", {}).get("apiKey")) and bool(keys.get("kraken", {}).get("secret"))

def real_trade_cap_left(ex, base="EUR", cap_override=None):
    """
    Keep a conservative cap for early stage.
    """
    cap = float(cap_override) if cap_override is not None else float(SETTINGS.get("real_trade_cap", 10.0))
    try:
        bal = ex.fetch_balance()
        free = bal.get(base, {}).get("free")
        if free is None:
            # some ccxt balance formats use 'free' inside dicts; fallback
            free = bal.get("free", {}).get(base)
        if free is None:
            free = 0.0
        free = float(free)
        return min(free, cap)
    except Exception:
        return 0.0

def place_real_order(ex, action, symbol, spend_or_amount, price_hint=None):
    """
    Conservative default: limit orders close to mid, unless settings disable.
    """
    use_limit = bool(SETTINGS["strategy"].get("use_limit_orders_real", True))
    offset = float(SETTINGS["strategy"].get("limit_price_offset_pct", 0.001))

    # fetch ticker for best bid/ask
    t = ex.fetch_ticker(symbol)
    bid = t.get("bid") or t.get("last")
    ask = t.get("ask") or t.get("last")
    last = t.get("last")
    if not last:
        raise RuntimeError("No market price available.")

    if action == "BUY":
        # spend_or_amount is QUOTE spend (EUR)
        spend = float(spend_or_amount)
        if spend <= 0:
            raise RuntimeError("Invalid spend.")
        # approximate base amount
        amount = spend / float(ask)
        if use_limit and bid and ask:
            # buy a bit below ask
            price = float(ask) * (1.0 - offset)
            return ex.create_limit_buy_order(symbol, amount, price)
        else:
            return ex.create_market_buy_order(symbol, amount)

    if action == "SELL":
        amount = float(spend_or_amount)
        if amount <= 0:
            raise RuntimeError("Invalid amount.")
        if use_limit and bid and ask:
            # sell a bit above bid
            price = float(bid) * (1.0 + offset)
            return ex.create_limit_sell_order(symbol, amount, price)
        else:
            return ex.create_market_sell_order(symbol, amount)


# ----------------------------
# Stage 2 unlock + Gemini-assisted learning (optional)
# ----------------------------
def compute_max_drawdown(equity_curve):
    """
    equity_curve: list of floats
    Returns max drawdown as fraction (e.g. 0.05 = -5% from peak).
    """
    peak = None
    max_dd = 0.0
    for e in equity_curve:
        if e is None:
            continue
        e = float(e)
        if peak is None or e > peak:
            peak = e
        if peak and peak > 0:
            dd = (peak - e) / peak
            if dd > max_dd:
                max_dd = dd
    return max_dd

def paper_equity_consistency_ok(rules=None):
    """
    Consistency gate for Stage 2.
    Not a single 'hit' — it checks the recent equity curve window for:
    - positive return
    - limited drawdown
    - enough time/points
    """
    rules = rules or SETTINGS.get("stage2", {}).get("unlock_rules", {})
    window_points = int(rules.get("window_points", 240))
    min_return_pct = float(rules.get("min_return_pct", 0.06))
    max_dd_pct = float(rules.get("max_drawdown_pct", 0.04))
    min_days = int(rules.get("min_days", 3))

    prof = safe_read_json(FILES["profits"], {})
    curve = prof.get("paper", {}).get("equity_curve", [])
    if len(curve) < max(20, window_points // 2):
        return False, "Not enough paper equity history yet."

    w = curve[-window_points:] if len(curve) >= window_points else curve[:]
    eq = [float(p.get("equity", 0.0)) for p in w if p.get("equity") is not None]

    if len(eq) < 20:
        return False, "Not enough usable equity points."

    start = eq[0]
    end = eq[-1]
    if start <= 0:
        return False, "Invalid start equity."
    ret = (end / start) - 1.0
    dd = compute_max_drawdown(eq)

    # time span
    try:
        t0 = w[0].get("ts", 0) / 1000.0
        t1 = w[-1].get("ts", 0) / 1000.0
        days = max(0.0, (t1 - t0) / 86400.0)
    except Exception:
        days = 0.0

    if days < float(min_days):
        return False, f"Need at least {min_days} days of stable paper curve in the window."

    if ret < min_return_pct:
        return False, f"Return too small in window ({ret*100:.2f}% < {min_return_pct*100:.2f}%)."

    if dd > max_dd_pct:
        return False, f"Drawdown too high in window ({dd*100:.2f}% > {max_dd_pct*100:.2f}%)."

    return True, f"OK (return {ret*100:.2f}%, max DD {dd*100:.2f}%, days {days:.1f})."

def stage2_update_unlock():
    """
    Stores the unlock state in learning.json (shareable, no keys).
    """
    learn = load_learning()
    stage2 = learn.get("meta", {}).get("stage2", {})
    if stage2.get("unlocked"):
        return True

    ok, msg = paper_equity_consistency_ok()
    if ok:
        learn.setdefault("meta", {}).setdefault("stage2", {})
        learn["meta"]["stage2"]["unlocked"] = True
        learn["meta"]["stage2"]["unlocked_at"] = _now_iso()
        learn["meta"]["stage2"]["unlock_msg"] = msg
        save_learning(learn)

        # Also mirror to settings for UX (settings is shareable, too)
        s = safe_read_json(FILES["settings"], DEFAULT_SETTINGS)
        s.setdefault("stage2", {}).update({"unlocked": True})
        safe_write_json(FILES["settings"], s)
        global SETTINGS
        SETTINGS = s
        return True
    return False

def stage2_is_unlocked():
    learn = load_learning()
    return bool(learn.get("meta", {}).get("stage2", {}).get("unlocked", False) or SETTINGS.get("stage2", {}).get("unlocked", False))

def apply_stage2_overrides_if_enabled():
    """
    Returns an effective SETTINGS dict (copy) with overrides applied
    only if stage2.enabled=True and stage2 is unlocked.
    """
    eff = json.loads(json.dumps(SETTINGS))  # deep copy via json (simple dict)
    st2 = eff.get("stage2", {})
    if not st2.get("enabled"):
        return eff
    if not stage2_is_unlocked():
        # force off if not unlocked
        eff["stage2"]["enabled"] = False
        return eff

    ov = st2.get("overrides", {})
    # top-level overrides
    if "real_trade_cap" in ov:
        eff["real_trade_cap"] = float(ov["real_trade_cap"])
    # nested overrides
    for k in ["risk", "strategy"]:
        if isinstance(ov.get(k), dict):
            eff.setdefault(k, {}).update(ov[k])
    return eff

def gemini_suggest_adjustments(recent_summary):
    """
    Optional: ask Gemini for tiny numeric adjustments (bias & risk gate).
    This is OFF by default and MUST be enabled in settings + have a Gemini key.

    We do NOT send API keys. We only send recent PnL summary & metrics.
    """
    if not SETTINGS.get("gemini", {}).get("enabled", False):
        return None

    keys = load_keys()
    gem_key = (keys.get("gemini", {}) or {}).get("apiKey", "")
    if not gem_key:
        return None

    model = SETTINGS.get("gemini", {}).get("model", "gemini-1.5-flash")
    temperature = float(SETTINGS.get("gemini", {}).get("temperature", 0.2))
    max_out = int(SETTINGS.get("gemini", {}).get("max_output_tokens", 512))

    # Gemini Generative Language API (v1beta). Users may need to enable it in Google AI Studio.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gem_key}"

    prompt = (
        "You are helping tune a very conservative crypto trading bot. "
        "Return ONLY strict JSON with keys: "
        '{"global": {"min_edge_delta": float, "human_noise_delta": float}, '
        '"symbols": {"SYMBOL": {"bias_delta": float}}} '
        "Constraints: keep deltas small: min_edge_delta within [-0.0005, 0.0005], "
        "human_noise_delta within [-0.05, 0.05], bias_delta within [-0.10, 0.10].\n\n"
        f"Recent summary:\n{recent_summary}\n"
    )

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_out},
    }

    try:
        r = requests.post(url, json=body, timeout=25)
        if r.status_code != 200:
            return None
        data = r.json()
        # Extract text
        txt = None
        cand = (data.get("candidates") or [{}])[0]
        content = cand.get("content", {})
        parts = content.get("parts") or []
        if parts:
            txt = parts[0].get("text")
        if not txt:
            return None
        # try parse JSON
        txt = txt.strip()
        # allow ```json ... ```
        if txt.startswith("```"):
            txt = re.sub(r"^```[a-zA-Z]*\n", "", txt)
            txt = txt.replace("```", "").strip()
        adj = json.loads(txt)
        return adj
    except Exception:
        return None

def apply_gemini_adjustments(adj):
    """
    Applies adjustments to learning + settings gently.
    """
    if not isinstance(adj, dict):
        return

    # global deltas
    g = adj.get("global", {}) if isinstance(adj.get("global"), dict) else {}
    if g:
        try:
            delta = float(g.get("min_edge_delta", 0.0))
            if -0.0005 <= delta <= 0.0005:
                SETTINGS["risk"]["min_edge"] = max(0.0, float(SETTINGS["risk"]["min_edge"]) + delta)
        except Exception:
            pass
        try:
            delta = float(g.get("human_noise_delta", 0.0))
            if -0.05 <= delta <= 0.05:
                SETTINGS["strategy"]["human_noise"] = min(0.6, max(0.0, float(SETTINGS["strategy"]["human_noise"]) + delta))
        except Exception:
            pass
        # persist settings
        safe_write_json(FILES["settings"], SETTINGS)

    # symbol bias deltas
    sym_adj = adj.get("symbols", {})
    if isinstance(sym_adj, dict):
        learn = load_learning()
        for sym, v in sym_adj.items():
            if not isinstance(v, dict):
                continue
            try:
                delta = float(v.get("bias_delta", 0.0))
                if -0.10 <= delta <= 0.10:
                    srec = learn["symbols"].get(sym, {})
                    srec["bias"] = float(srec.get("bias", 0.0)) + delta
                    learn["symbols"][sym] = srec
            except Exception:
                continue
        save_learning(learn)

def build_recent_summary(max_trades=20):
    prof = safe_read_json(FILES["profits"], {})
    pt = (prof.get("paper", {}) or {}).get("trades", [])[-max_trades:]
    rt = (prof.get("real", {}) or {}).get("trades", [])[-max_trades:]
    pe = (prof.get("paper", {}) or {}).get("equity_curve", [])[-50:]
    re = (prof.get("real", {}) or {}).get("equity_curve", [])[-50:]
    return json.dumps({
        "paper_last_equity": (pe[-1]["equity"] if pe else None),
        "real_last_equity": (re[-1]["equity"] if re else None),
        "paper_recent_trades": pt,
        "real_recent_trades": rt,
        "settings_snapshot": {
            "risk": SETTINGS.get("risk", {}),
            "strategy": SETTINGS.get("strategy", {}),
            "stage2": SETTINGS.get("stage2", {})
        }
    }, ensure_ascii=False)[:8000]

# ----------------------------
# Real position tracking + TP/SL management (Kraken)
# ----------------------------
def load_real_state():
    return safe_read_json(FILES["real_state"], {"version": 1, "last_my_trades_fetch_ms": 0, "last_positions": {}})

def save_real_state(rs):
    safe_write_json(FILES["real_state"], rs)

def _trade_fee_in_quote(trade):
    """
    Try to estimate fees in quote currency (EUR) to include in cost.
    ccxt trade fee format varies per exchange.
    """
    fee = trade.get("fee")
    if isinstance(fee, dict):
        try:
            cost = float(fee.get("cost", 0.0) or 0.0)
            # If fee currency is base, we can't easily convert here; ignore in that case.
            currency = fee.get("currency")
            # If currency looks like quote or same as quote, treat as quote.
            return cost
        except Exception:
            return 0.0
    return 0.0

def compute_position_from_trades(trades):
    """
    Returns (net_amount_base, avg_entry_price_quote) based on filled trades.
    Uses moving weighted average for the remaining inventory.
    """
    qty = 0.0
    cost = 0.0  # in quote currency
    for tr in sorted(trades, key=lambda x: x.get("timestamp", 0) or 0):
        side = (tr.get("side") or "").lower()
        amount = float(tr.get("amount") or 0.0)
        price = float(tr.get("price") or 0.0)
        if amount <= 0 or price <= 0:
            continue
        fee_q = _trade_fee_in_quote(tr)

        if side == "buy":
            # add inventory & cost (include fee if quote)
            qty_new = qty + amount
            cost_new = cost + (amount * price) + fee_q
            qty, cost = qty_new, cost_new

        elif side == "sell":
            if qty <= 0:
                continue
            sell_amt = min(amount, qty)
            # reduce remaining cost proportional to avg
            avg = (cost / qty) if qty > 0 else price
            qty_new = qty - sell_amt
            cost_new = max(0.0, cost - (sell_amt * avg))
            qty, cost = qty_new, cost_new

    avg_entry = (cost / qty) if qty > 1e-12 else 0.0
    return qty, avg_entry

def fetch_positions_from_kraken_trades(ex, base="EUR", lookback_days=30):
    """
    Builds current positions for assets quoted in `base` (EUR) using:
    - balances (source of truth for how much you own now)
    - my trades to estimate avg entry (filled orders)
    """
    markets = load_markets_cached(ex)
    bal = ex.fetch_balance()
    free_map = bal.get("free") if isinstance(bal.get("free"), dict) else {}
    total_map = bal.get("total") if isinstance(bal.get("total"), dict) else {}

    # pick held assets that can be traded vs base
    held_assets = []
    for asset, amt in (total_map or {}).items():
        try:
            a = float(amt or 0.0)
        except Exception:
            continue
        if asset.upper() == base.upper():
            continue
        if a > 0:
            held_assets.append((asset.upper(), a))

    # candidate symbols: ASSET/BASE existing markets
    symbols = []
    for asset, _amt in held_assets:
        sym = f"{asset}/{base}"
        if sym in markets and markets[sym].get("active", True):
            symbols.append(sym)

    # fetch my trades for each symbol
    since_ms = int((time.time() - (lookback_days * 86400)) * 1000)
    positions = {}
    for sym in symbols:
        try:
            trs = ex.fetch_my_trades(sym, since=since_ms, limit=200)
            qty_tr, avg_entry = compute_position_from_trades(trs)
        except Exception:
            qty_tr, avg_entry = 0.0, 0.0

        base_asset = sym.split("/")[0]
        # use balance as truth for current size
        bal_amt = 0.0
        try:
            bal_amt = float(total_map.get(base_asset) or 0.0)
        except Exception:
            bal_amt = 0.0

        if bal_amt <= 0:
            continue

        positions[sym] = {
            "asset": base_asset,
            "amount_total": bal_amt,
            "amount_free": float((free_map or {}).get(base_asset) or 0.0),
            "avg_entry": float(avg_entry) if avg_entry > 0 else None,
            "qty_from_trades_est": float(qty_tr),
            "updated_at": _now_iso(),
        }

    return positions

def manage_real_positions_tp_sl(ex, tickers, eff_settings):
    """
    Executes real SELL orders when TP/SL is hit for real positions.
    It relies on filled trades (avg entry) + current balances.
    """
    base = eff_settings["base_currency"]
    risk = eff_settings["risk"]

    # build positions
    positions = fetch_positions_from_kraken_trades(ex, base=base, lookback_days=45)
    rs = load_real_state()
    rs["last_positions"] = positions
    save_real_state(rs)

    actions = []

    for sym, p in positions.items():
        avg_entry = p.get("avg_entry")
        free_amt = float(p.get("amount_free") or 0.0)
        total_amt = float(p.get("amount_total") or 0.0)
        amt = free_amt if free_amt > 0 else total_amt

        if amt <= 0:
            continue
        if avg_entry is None or float(avg_entry) <= 0:
            # If we don't know avg entry, we cannot do TP/SL safely.
            continue

        t = tickers.get(sym)
        if not t:
            try:
                t = ex.fetch_ticker(sym)
            except Exception:
                continue

        last = t.get("last")
        bid = t.get("bid") or last
        if not bid or float(bid) <= 0:
            continue

        change = (float(bid) / float(avg_entry)) - 1.0

        sl = -abs(float(risk.get("stop_loss_pct", 0.03)))
        tp = abs(float(risk.get("take_profit_pct", 0.025)))

        trigger = None
        if change <= sl:
            trigger = "stop_loss"
        elif change >= tp:
            trigger = "take_profit"

        if not trigger:
            continue

        # minimum value gate
        if float(bid) * float(amt) < float(eff_settings.get("min_trade_value", 5.0)):
            continue

        try:
            order = place_real_order(ex, "SELL", sym, spend_or_amount=amt)
            trade = {
                "ts": int(time.time()*1000),
                "iso": _now_iso(),
                "action": "SELL",
                "symbol": sym,
                "amount_base": amt,
                "price_ref": float(bid),
                "avg_entry": float(avg_entry),
                "pnl_pct_est": float(change),
                "reason": trigger,
                "order_id": order.get("id"),
                "info": {"type": order.get("type"), "status": order.get("status")},
                "note": "Auto-managed TP/SL SELL based on avg entry from Kraken trades."
            }
            profits_log_trade("real", trade)
            actions.append(trade)
            print(f"[real] SELL {sym} amt={amt:.8f} reason={trigger} pnl_est={change*100:.2f}% order={order.get('id')}")
        except Exception as e:
            print(f"[!] TP/SL sell failed for {sym}: {e}")

    return actions


    raise RuntimeError("Unknown action.")

# ----------------------------
# Run control + graceful exit
# ----------------------------
STOP = False

def handle_sigint(sig, frame):
    global STOP
    STOP = True
    print("\n[i] Stopping gracefully... saving state.")

signal.signal(signal.SIGINT, handle_sigint)

def log_run(entry):
    logs = safe_read_json(FILES["logs"], {"runs": []})
    logs["runs"].append(entry)
    logs["runs"] = logs["runs"][-200:]
    safe_write_json(FILES["logs"], logs)

# ----------------------------
# Modes
# ----------------------------
def paper_mode():
    print("\n[Paper Trades Mode]")
    print(" - Starts with €10 (or base currency).")
    print(" - If equity drops below €8 while learning, it resets back to €10.")
    print(" - Once it reaches €12 once, it stops resetting and just seeks profit.\n")

    keys = load_keys()
    if not keys.get("kraken", {}).get("apiKey") or not keys.get("kraken", {}).get("secret"):
        print("[!] Kraken keys not set. You can still paper trade with public data, but setting keys helps validation later.")
    # Public data works without keys, but ccxt Kraken still loads markets without auth.
    ex = ccxt.kraken({"enableRateLimit": True, "timeout": 30000})

    st = load_paper_state()
    base = SETTINGS["base_currency"]
    st["base"] = base
    if "holdings" not in st:
        st["holdings"] = {}
    if "cash" not in st:
        st["cash"] = float(SETTINGS["paper_start_amount"])

    start_ts = time.time()
    last_market_pull = 0

    while not STOP:
        # enforce max run time
        if time.time() - start_ts > float(SETTINGS["run_max_seconds"]):
            print("[i] Reached max run time for today (3 hours). Saving and exiting.")
            break

        # market refresh
        if time.time() - last_market_pull >= float(SETTINGS["market_refresh_seconds"]):
            symbols = pick_universe_pairs(ex, base=base)
            tickers = fetch_tickers_safe(ex, symbols)
            update_market_prices_store(tickers)

            # history incremental update (small chunk)
            update_history_incremental(ex, symbols, days_target=30)
            hist = safe_read_json(FILES["history16m"], {"symbols": {}})

            # learning update
            learn = load_learning()
            learn = update_learning_from_history(learn, hist, symbols)
            save_learning(learn)

            last_market_pull = time.time()
        else:
            # use cached market prices file to avoid too many calls
            mp = safe_read_json(FILES["market_prices"], {"prices": {}})
            tickers = {}
            for sym, p in mp.get("prices", {}).items():
                tickers[sym] = {"last": p.get("last"), "bid": p.get("bid"), "ask": p.get("ask")}

            learn = load_learning()

        eq = paper_equity(st, tickers)
        profits_log_equity("paper", eq)
        # Stage 2 unlock check (requires consistent equity curve, not a single hit)
        stage2_update_unlock()

        # Optional: Gemini suggestions (very small tweaks). Runs rarely.
        if SETTINGS.get("gemini", {}).get("enabled", False) and (random.random() < 0.04):
            adj = gemini_suggest_adjustments(build_recent_summary())
            if adj:
                apply_gemini_adjustments(adj)

        # learning phase reset rules
        if st.get("phase", "learning") == "learning":
            if eq < float(SETTINGS["paper_reset_floor"]):
                st["cash"] = float(SETTINGS["paper_start_amount"])
                st["holdings"] = {}
                st["last_reset_at"] = _now_iso()
                print(f"[i] Paper equity dropped below {SETTINGS['paper_reset_floor']:.2f}. Resetting to {SETTINGS['paper_start_amount']:.2f}.")
            elif eq >= float(SETTINGS["paper_target_learn"]):
                st["phase"] = "normal"
                print(f"[✓] Learning milestone reached: equity >= {SETTINGS['paper_target_learn']:.2f}. Switching to normal profit mode.")

        decision = decide_trade(learn, st, tickers)

        if decision:
            sym = decision["symbol"]
            t = tickers.get(sym, {})
            last = float(t.get("last") or 0.0)
            bid = float(t.get("bid") or last)
            ask = float(t.get("ask") or last)
            if last <= 0:
                time.sleep(SETTINGS["loop_sleep_seconds"])
                continue

            if decision["action"] == "BUY":
                spend = float(decision["spend"])
                ok, msg = paper_buy(st, sym, ask if ask > 0 else last, spend)
                if ok:
                    print(f"[paper] BUY {sym} spend={spend:.2f} eq={eq:.2f} reason={decision['reason']}")
                    profits_log_trade("paper", {
                        "ts": int(time.time()*1000),
                        "iso": _now_iso(),
                        "action": "BUY",
                        "symbol": sym,
                        "price": ask if ask > 0 else last,
                        "spend_quote": spend,
                        "equity": eq,
                        "reason": decision["reason"],
                    })
                else:
                    # no-op
                    pass

            elif decision["action"] == "SELL":
                pos = st.get("holdings", {}).get(sym)
                if pos:
                    amt = float(pos.get("amount", 0.0))
                    if amt > 0:
                        ok, msg = paper_sell(st, sym, bid if bid > 0 else last, amt)
                        # update learning bias from outcome
                        if ok:
                            entry = float(pos.get("entry_price", last))
                            pnl_pct = (float((bid if bid > 0 else last))/entry) - 1.0 if entry > 0 else 0.0
                            learn = load_learning()
                            srec = learn["symbols"].get(sym, {})
                            if pnl_pct >= 0:
                                srec["wins"] = int(srec.get("wins", 0)) + 1
                                srec["bias"] = float(srec.get("bias", 0.0)) + 0.10
                            else:
                                srec["losses"] = int(srec.get("losses", 0)) + 1
                                srec["bias"] = float(srec.get("bias", 0.0)) - 0.12
                            srec["last_trade_ts"] = int(time.time())
                            learn["symbols"][sym] = srec
                            save_learning(learn)

                            print(f"[paper] SELL {sym} amt={amt:.8f} eq={eq:.2f} reason={decision['reason']} pnl={pnl_pct*100:.2f}%")
                            profits_log_trade("paper", {
                                "ts": int(time.time()*1000),
                                "iso": _now_iso(),
                                "action": "SELL",
                                "symbol": sym,
                                "price": bid if bid > 0 else last,
                                "amount_base": amt,
                                "equity": eq,
                                "reason": decision["reason"],
                                "pnl_pct": pnl_pct
                            })

        save_paper_state(st)
        time.sleep(float(SETTINGS["loop_sleep_seconds"]))

    save_paper_state(st)
    print("[i] Paper mode exited. State saved.")

def real_mode():
    print("\n[Real Trades Mode]")
    print(" - Uses Kraken real orders (very conservative by default).")
    print(" - Uses learned signals from Paper mode.")
    print(" - Respects a cap (default €10) until you change settings.\n")
    print("[i] " + SECURITY_NOTE + "\n")

    if not real_can_trade():
        print("[!] Kraken API keys not set/valid. Go to menu -> Set/Change API keys.")
        return

    keys = load_keys()
    ex = make_kraken_client(keys["kraken"]["apiKey"], keys["kraken"]["secret"])

    ok, msg = validate_kraken_keys(ex)
    if not ok:
        print("[!] Kraken key validation failed. Fix keys first.")
        print("    " + msg)
        return

    base = SETTINGS["base_currency"]
    learn = load_learning()

    start_ts = time.time()
    last_market_pull = 0
    last_action = None

    while not STOP:
        if time.time() - start_ts > float(SETTINGS["run_max_seconds"]):
            print("[i] Reached max run time for today (3 hours). Exiting.")
            break

        # market refresh
        if time.time() - last_market_pull >= float(SETTINGS["market_refresh_seconds"]):
            symbols = pick_universe_pairs(ex, base=base)
            tickers = fetch_tickers_safe(ex, symbols)
            update_market_prices_store(tickers)

            update_history_incremental(ex, symbols, days_target=30)
            hist = safe_read_json(FILES["history16m"], {"symbols": {}})

            learn = load_learning()
            learn = update_learning_from_history(learn, hist, symbols)
            save_learning(learn)

            last_market_pull = time.time()
        else:
            mp = safe_read_json(FILES["market_prices"], {"prices": {}})
            tickers = {}
            for sym, p in mp.get("prices", {}).items():
                tickers[sym] = {"last": p.get("last"), "bid": p.get("bid"), "ask": p.get("ask")}
            learn = load_learning()

        # Effective settings (Stage 2 overrides applied ONLY if unlocked+enabled)
        eff = apply_stage2_overrides_if_enabled()

        # First priority: manage REAL sells (TP/SL on real positions) using Kraken filled trades + avg entry
        try:
            _ = manage_real_positions_tp_sl(ex, tickers, eff)
        except Exception:
            pass

        # compute equity (approx) using balances
        equity = None
        try:
            bal = ex.fetch_balance()
            free_base = bal.get(base, {}).get("free")
            if free_base is None:
                free_base = bal.get("free", {}).get(base, 0.0)
            equity = float(free_base or 0.0)
        except Exception:
            equity = None

        if equity is not None:
            profits_log_equity("real", equity)

        # Decide: only one open decision per loop; very conservative
        # We don't track positions deeply here (Kraken balances are the source of truth).
        # We'll only do BUY when we have cap room, and SELL only if we detect holdings and TP/SL based on learned entry in profits log.
        cap_left = real_trade_cap_left(ex, base=base, cap_override=eff.get("real_trade_cap"))
        if cap_left < float(SETTINGS["min_trade_value"]):
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        # pick best symbol to buy now if edge exists
        symbols = [s for s in tickers.keys() if s.endswith("/" + base)]
        if not symbols:
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        ranked = sorted(symbols, key=lambda s: score_symbol(learn, s), reverse=True)
        best = ranked[0]
        t = tickers.get(best, {})
        last = t.get("last")
        bid = t.get("bid") or last
        ask = t.get("ask") or last
        if not last or not ask:
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        # risk gate
        srec = learn["symbols"].get(best, {})
        drift = float(srec.get("drift", 0.0))
        vol = max(float(srec.get("vol", 0.0)), 1e-6)
        bias = float(srec.get("bias", 0.0))
        risk_adj = (drift + 0.15*bias) / vol
        if risk_adj < float(eff["risk"]["min_edge"]):
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        # "human-like" pause randomness
        if random.random() < 0.35:
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        spend = min(cap_left, float(eff["risk"]["max_position_fraction"]) * cap_left)
        spend = max(0.0, float(spend))
        if spend < float(SETTINGS["min_trade_value"]):
            time.sleep(float(SETTINGS["loop_sleep_seconds"]))
            continue

        try:
            order = place_real_order(ex, "BUY", best, spend_or_amount=spend)
            trade = {
                "ts": int(time.time()*1000),
                "iso": _now_iso(),
                "action": "BUY",
                "symbol": best,
                "spend_quote": spend,
                "order_id": order.get("id"),
                "info": {"type": order.get("type"), "status": order.get("status")},
                "score": score_symbol(learn, best),
                "note": "Conservative buy. Consider managing sells manually or expand sell logic."
            }
            profits_log_trade("real", trade)

            # update learning bias slightly for taking a trade (neutral)
            learn = load_learning()
            srec = learn["symbols"].get(best, {})
            srec["last_trade_ts"] = int(time.time())
            srec["bias"] = float(srec.get("bias", 0.0)) + 0.01
            learn["symbols"][best] = srec
            save_learning(learn)

            print(f"[real] BUY {best} spend={spend:.2f} score={trade['score']:.4f} order={trade['order_id']}")
        except Exception as e:
            print(f"[!] Real order failed: {e}")
            # penalize slightly to avoid retrying the same symbol forever
            learn = load_learning()
            srec = learn["symbols"].get(best, {})
            srec["bias"] = float(srec.get("bias", 0.0)) - 0.03
            learn["symbols"][best] = srec
            save_learning(learn)

        time.sleep(float(SETTINGS["loop_sleep_seconds"]))

    print("[i] Real mode exited.")

# ----------------------------
# Settings / utilities
# ----------------------------
def show_files():
    print("\n[Kraken Trader folder]")
    print("  " + BASE_DIR)
    for k, v in FILES.items():
        print(f"  - {os.path.basename(v)}")
    print("\nShareable (NO KEYS): learning.json, profits.json, market_prices.json, previous_16_months_*.json\n")

def change_settings():
    global SETTINGS
    s = safe_read_json(FILES["settings"], DEFAULT_SETTINGS)

    print("\n[Settings]")
    print(f"1) Base currency            : {s.get('base_currency')}")
    print(f"2) Max run seconds (per run): {s.get('run_max_seconds')}")
    print(f"3) Paper start amount       : {s.get('paper_start_amount')}")
    print(f"4) Paper reset floor        : {s.get('paper_reset_floor')}")
    print(f"5) Paper learn target       : {s.get('paper_target_learn')}")
    print(f"6) Real trade cap           : {s.get('real_trade_cap')}")
    print(f"7) Loop sleep seconds       : {s.get('loop_sleep_seconds')}")
    print(f"8) Min trade value          : {s.get('min_trade_value')}")
    print(f"9) Stage 2 enabled          : {bool((s.get('stage2') or {}).get('enabled', False))} (unlocked={stage2_is_unlocked()})")
    print(f"10) Gemini learning enabled  : {bool((s.get('gemini') or {}).get('enabled', False))}")
    print("0) Back")

    choice = input("Select: ").strip()
    if choice == "1":
        s["base_currency"] = prompt_nonempty("Enter base currency (e.g., EUR, USD): ").upper()
    elif choice == "2":
        s["run_max_seconds"] = int(prompt_nonempty("Seconds (e.g., 10800 for 3 hours): "))
    elif choice == "3":
        s["paper_start_amount"] = float(prompt_nonempty("Paper start amount: "))
    elif choice == "4":
        s["paper_reset_floor"] = float(prompt_nonempty("Paper reset floor: "))
    elif choice == "5":
        s["paper_target_learn"] = float(prompt_nonempty("Paper learn target: "))
    elif choice == "6":
        s["real_trade_cap"] = float(prompt_nonempty("Real trade cap (in base currency): "))
    elif choice == "7":
        s["loop_sleep_seconds"] = float(prompt_nonempty("Loop sleep seconds: "))
    elif choice == "8":
        s["min_trade_value"] = float(prompt_nonempty("Min trade value: "))
    elif choice == "9":
        s.setdefault("stage2", {})
        if not stage2_is_unlocked():
            print("[!] Stage 2 is NOT unlocked yet. Keep paper mode running until the equity curve is consistently good.")
            s["stage2"]["enabled"] = False
        else:
            s["stage2"]["enabled"] = not bool(s.get("stage2", {}).get("enabled", False))
            print(f"[i] Stage 2 enabled = {s['stage2']['enabled']}")
    elif choice == "10":
        s.setdefault("gemini", {})
        s["gemini"]["enabled"] = not bool(s.get("gemini", {}).get("enabled", False))
        print(f"[i] Gemini learning enabled = {s['gemini']['enabled']}")
    else:
        return

    safe_write_json(FILES["settings"], s)
    SETTINGS = s
    print("[✓] Settings saved.\n")

def show_status():
    learn = load_learning()
    prof = safe_read_json(FILES["profits"], {})
    mp = safe_read_json(FILES["market_prices"], {})
    paper = load_paper_state()

    print("\n[Status]")
    print(f"- Updated learning at : {learn.get('updated_at', 'N/A')}")
    print(f"- Known symbols learned: {len(learn.get('symbols', {}))}")
    print(f"- Paper phase         : {paper.get('phase', 'N/A')}")
    print(f"- Stage 2 unlocked    : {stage2_is_unlocked()}")
    print(f"- Stage 2 enabled     : {bool(SETTINGS.get('stage2', {}).get('enabled', False))}")
    print(f"- Paper cash          : {paper.get('cash', 0.0):.2f} {SETTINGS['base_currency']}")
    print(f"- Paper holdings      : {len(paper.get('holdings', {}))}")
    print(f"- Market prices updated: {mp.get('updated_at', 'N/A')}")
    # show last equity points
    try:
        peq = prof.get("paper", {}).get("equity_curve", [])
        req = prof.get("real", {}).get("equity_curve", [])
        if peq:
            print(f"- Paper last equity   : {peq[-1]['equity']:.2f}")
        if req:
            print(f"- Real last equity    : {req[-1]['equity']:.2f}")
    except Exception:
        pass
    print("")

# ----------------------------
# Main menu
# ----------------------------
def main_menu():
    print("\nKraken Trader")
    print("-------------")
    print("1) Set/Change API keys (Kraken + Gemini)")
    print("2) Paper Trades Mode")
    print("3) Real Trades Mode")
    print("4) Status")
    print("5) Settings")
    print("6) Show storage files")
    print("0) Exit")

def main():
    print("[i] Storage:", BASE_DIR)
    print("[i] " + SECURITY_NOTE)

    while True:
        main_menu()
        c = input("Select: ").strip()

        if c == "1":
            setup_keys_interactive()
        elif c == "2":
            try:
                paper_mode()
            except Exception:
                print("[!] Paper mode crashed. Saving state and returning to menu.")
                traceback.print_exc()
        elif c == "3":
            try:
                real_mode()
            except Exception:
                print("[!] Real mode crashed. Returning to menu.")
                traceback.print_exc()
        elif c == "4":
            show_status()
        elif c == "5":
            change_settings()
        elif c == "6":
            show_files()
        elif c == "0":
            print("Bye.")
            break
        else:
            print("[!] Invalid option.")

if __name__ == "__main__":
    main()
