// Fleet Master Sync Verified: 2026-10-16T08:04:15.425Z
const fetch = globalThis.fetch;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let _wsClass = globalThis.WebSocket || null;
async function getWebSocketClass() {
  if (_wsClass) return _wsClass;
  try {
    const mod = await import("ws");
    _wsClass = mod.default || mod;
    return _wsClass;
  } catch (e) {
    return globalThis.WebSocket || null;
  }
}
// Native .env environment loader (zero third-party package dependency)
try {
  for (const ep of [".env", ".env.local", "../.env", "/home/ubuntu/trading-bots/.env"]) {
    if (fs.existsSync(ep)) {
      const raw = fs.readFileSync(ep, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
            if (!process.env[key]) process.env[key] = val;
          }
        }
      }
    }
  }
} catch (e) {}

// ==================== UNIVERSAL TIMESTAMP LOGGING INTERCEPTOR ====================
// Injects precision ISO UTC timestamps into all console output for audit tracking in PM2 and the dashboard
const _rawLog = console.log;
const _rawErr = console.error;
const _rawWarn = console.warn;

function formatLogTimestamp() {
  return `[${new Date().toISOString().replace("T", " ").substring(0, 19)} UTC]`;
}

console.log = (...args) => {
  if (args.length > 0 && typeof args[0] === "string" && !args[0].startsWith("[202") && !args[0].startsWith("202") && !args[0].startsWith("[" + REPO_LABEL)) {
    _rawLog(formatLogTimestamp(), ...args);
  } else {
    _rawLog(...args);
  }
};

console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === "string" && !args[0].startsWith("[202") && !args[0].startsWith("202") && !args[0].startsWith("[" + REPO_LABEL)) {
    _rawErr(formatLogTimestamp(), ...args);
  } else {
    _rawErr(...args);
  }
};

console.warn = (...args) => {
  if (args.length > 0 && typeof args[0] === "string" && !args[0].startsWith("[202") && !args[0].startsWith("202") && !args[0].startsWith("[" + REPO_LABEL)) {
    _rawWarn(formatLogTimestamp(), ...args);
  } else {
    _rawWarn(...args);
  }
};

// ==================== AUTO-RELOAD ON CODE UPDATE ====================
// Automatically monitors alert.js on disk. When git pull or a sync script updates the file,
// this watcher detects the timestamp change and gracefully exits (code 0) so PM2
// immediately respawns the daemon with the updated code in RAM.
const SCRIPT_PATH = fileURLToPath(import.meta.url);
let reloadTimer = null;
try {
  fs.watchFile(SCRIPT_PATH, { interval: 2000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      if (reloadTimer) clearTimeout(reloadTimer);
      console.log(`[AUTO-RELOAD] Code update detected on disk for ${path.basename(SCRIPT_PATH)}. Scheduling clean PM2 restart in 2s...`);
      reloadTimer = setTimeout(() => {
        console.log(`[AUTO-RELOAD] Exiting process cleanly now (code 1 for PM2 auto-respawn). PM2 will immediately respawn with updated code.`);
        process.exit(1);
      }, 2000);
    }
  });
} catch (e) {
  console.error("[AUTO-RELOAD] Watcher initialization error:", e.message);
}

// ==================== MASTER INSTRUMENT PROFILES (CALIBRATED EMPIRICAL MATRIX) ====================
// Authoritative multi-asset quantitative specifications aligned with MetaTrader 5 visual audit
// and multi-day flight recorder ledger analysis across Deriv Multiplier tick dynamics.
export const INSTRUMENT_PROFILES = {
  "R_75": {
    symbol: "R_75",
    symbolName: "Volatility 75 Index",
    repoLabel: "Lery's Alerts (V75 Demo)",
    server: "S1",
    multiplier: 50,
    lotSize: 0.005,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_EMA_STOCH15",
    gateType: "EMA_STOCH15_RETRACEMENT",
    stochParams: { k: 15, d: 2, slowing: 5, method: "Simple", levels: [20, 80] },
    emaPeriod: 100,
    minTakeProfitPoints: 1330.0,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 180.0,
    slType: "M15_FRACTAL",
    notes: "Condition 1: M5 EMA 100 vs 200 Trend Filter; Condition 2: M5 EMA 100/200 Pullback Retracement Touch; Condition 3: M5 Stoch (15,2,5, Simple) %K/%D extreme zone 25/75 cross; Early Exit: Active trade in loss liquidates on opposite %K/%D crossover."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    lotSize: 0.005,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_1S_TREND_MACD_STOCH533",
    gateType: "STOCH200_MACD_EMA100_STOCH533",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    macdParams: { fast: 25, slow: 75, signal: 1 },
    emaPeriod: 100,
    stoch533Params: { k: 5, d: 3, slowing: 3 },
    minTakeProfitPoints: 5.10,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 18.0,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch (200,1,1) Level 50 Gate & Initial Trigger + M5 MACD (25,75,1) Zero Line Alignment + M5 EMA 100 Baseline + M5 Stoch (5,3,3) 20/80 Re-Entry Trigger + 3 Consecutive Adverse M5 Candle & Stoch 200 Invalidation Exits + Stoch 533 Level 50 Loss Exit + $3.00/$1.50 Trailing Stop."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 40,
    lotSize: 0.20,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_STOCH200_STOCH15",
    gateType: "STOCH200_STOCH15",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 2, slowing: 5 },
    minTakeProfitPoints: 10.70,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 3.00,
    slType: "M15_FRACTAL",
    notes: "40x multiplier; Condition 1: M5 Stoch 200 (48/52) Main Trend Identifier; Condition 2: M5 Stoch (15,2,5) Initial (Lvl 50 +/-2 bars) & Re-Entry (Lvl 20/80); Early Exits: Opposite M5 Fractal Break & Entry-Hour H1 Adverse Close; Min $4.00 TP & Trailing ($3.00 act / $1.50 buffer)."
  },
  "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 40,
    lotSize: 0.20,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_1S_TREND_MACD_STOCH",
    gateType: "STOCH200_MACD_EMA100_STOCH533",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    macdParams: { fast: 25, slow: 75, signal: 1 },
    stoch533Params: { k: 5, d: 3, slowing: 3 },
    emaPeriod: 100, // M5 EMA 100
    minTakeProfitPoints: 30.80,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 5.50,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch 200 Level 50 Gate & MACD Confirmation + M5 EMA 100 Baseline + M5 Fast Stoch (5,3,3) 20/80 Re-Entry Trigger + 3-Candle, Stoch 200 & Stoch 533 Midline Invalidation Exits + $2.20/$5.00 Trailing Stop."
  },
  "R_25": {
    symbol: "R_25",
    symbolName: "Volatility 25 Index",
    repoLabel: "Tea (V25 Demo)",
    server: "S1",
    multiplier: 400,
    lotSize: 0.50,
    stakeUsd: 5.0,
    commissionUsd: 0.32,
    strategyProfile: "PROFILE_V25_STOCH200_CCI100",
    gateType: "STOCH200_CCI100_M5FRACTAL",
    stochParams: { k: 200, d: 1, slowing: 1 },
    minTakeProfitPoints: 5.52,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 3.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 18.00,
    slType: "M5_FRACTAL",
    notes: "400x multiplier ($1.38 pts/$1); Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (cross above 50 arms BUY, cross below 50 arms SELL, no timer window); Condition 2: M5 CCI 100 zero-line cross execution (>0 for BUY, <0 for SELL); Condition 1 must happen before Condition 2, except simultaneous cross on same M5 candle close; Early Exit: Previous M5 Fractal break in loss; Fib TP min $4.00."
  },
  "R_50": {
    symbol: "R_50",
    symbolName: "Volatility 50 Index",
    repoLabel: "OmniSight (V50)",
    server: "S2",
    multiplier: 80,
    lotSize: 4.00,
    stakeUsd: 5.0,
    commissionUsd: 0.16,
    strategyProfile: "PROFILE_V50_STOCH200_CCI150",
    gateType: "STOCH200_CCI150_M5FRACTAL",
    stochParams: { k: 200, d: 1, slowing: 1 },
    cciPeriod: 150,
    minTakeProfitPoints: 1.63,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 0.20,
    slType: "M5_FRACTAL",
    notes: "80x multiplier ($0.23 pts/$1); Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (cross above 50 arms BUY, cross below 50 arms SELL); Condition 2: M5 CCI 150 zero-line cross execution (>0 for BUY, <0 for SELL); Condition 1 must happen before Condition 2, except simultaneous cross on same M5 candle close; Special Rule: If CCI crosses first, 15-minute timer waits for Stoch cross, else disarms; Early Exit: Previous M5 Fractal break in loss; Fib TP min $4.00."
  },
  "R_10": {
    symbol: "R_10",
    symbolName: "Volatility 10 Index",
    repoLabel: "Test Bot (V10 Live)",
    server: "S2",
    multiplier: 400,
    lotSize: 0.50,
    stakeUsd: 5.0,
    commissionUsd: 0.80,
    strategyProfile: "PROFILE_V10_TREND_MACD_STOCH533",
    gateType: "STOCH200_MACD_EMA100_STOCH533",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    macdParams: { fast: 25, slow: 75, signal: 1 },
    emaPeriod: 100,
    stoch533Params: { k: 5, d: 3, slowing: 3 },
    minTakeProfitPoints: 9.60,
    minTakeProfitUsd: 4.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 3.00,
    maxHardStopPoints: 8.00,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch (200,1,1) Level 50 Gate & Initial Trigger + M5 MACD (25,75,1) Zero Line Alignment + M5 EMA 100 Baseline + M5 Stoch (5,3,3) 20/80 Re-Entry Trigger + 3 Consecutive Adverse M5 Candle & Stoch 200 Invalidation Exits + Stoch 533 Level 50 Loss Exit + $3.00/$1.50 Trailing Stop (Mapped from V75 1s Institutional Model)."
  }
};

// ==================== ACTIVE INSTANCE SELECTOR ====================
// Select via environment variable SYMBOL (e.g. SYMBOL=R_75) or fallback to default
// Auto-detect symbol from working directory path if process.env.SYMBOL is omitted
const _cwd = process.cwd();
let _autoSymbol = null;
if (_cwd.includes("OmniSight") || _cwd.includes("omnisight")) _autoSymbol = "R_50";
else if (_cwd.includes("ice-cream") || _cwd.includes("icecream")) _autoSymbol = "1HZ100V";
else if (_cwd.includes("Test-Bot") || _cwd.includes("test")) _autoSymbol = "R_10";
else if (_cwd.includes("tea")) _autoSymbol = "R_25";
else if (_cwd.includes("milk")) _autoSymbol = "R_100";
else if (_cwd.includes("coffee")) _autoSymbol = "1HZ75V";
else if (_cwd.includes("Lery")) _autoSymbol = "R_75";

const ACTIVE_SYMBOL = process.env.SYMBOL || _autoSymbol || "R_75";
const PROFILE = INSTRUMENT_PROFILES[ACTIVE_SYMBOL] || INSTRUMENT_PROFILES["R_75"];

const SYMBOL = PROFILE.symbol;
const SYMBOL_NAME = PROFILE.symbolName;
const REPO_LABEL = PROFILE.repoLabel;
const MULTIPLIER = PROFILE.multiplier;
const LOT_SIZE = PROFILE.lotSize || 0.50;
const COMMISSION_USD = PROFILE.commissionUsd;
const STAKE_USD = PROFILE.stakeUsd || 5.0;
const STOCH_SEPARATION_MIN = 0; // Pure directional crossover (zero separation barrier)
const MIN_TP_POINTS_FLOOR = PROFILE.minTakeProfitPoints;
const MAX_HARD_SL_POINTS = PROFILE.maxHardStopPoints;
const GATE_TYPE = PROFILE.gateType;
const STRATEGY_PROFILE = PROFILE.strategyProfile;

const TRADING_SYMBOL = SYMBOL;

// ── Execution Mode & Lot Size Configuration (Deriv Standard Architecture, matching S1) ──
// Default execution engine: cTrader (CFD) across all bots unless manually overridden via EXECUTION_MODE in .env
const EXECUTION_MODE = (process.env.EXECUTION_MODE || "ctrader").toLowerCase();
const CTRADER_LOT_SIZE = parseFloat(process.env.LOT_SIZE || (PROFILE.lotSize !== undefined ? String(PROFILE.lotSize) : (SYMBOL === "1HZ75V" || SYMBOL === "R_75" ? "0.005" : "0.50")));

// ── Configurable Software Stop Loss per Instrument Profile ──
const INSTRUMENT_SOFTWARE_SL_MAP = {
  "R_25": -3.50,     // Tea Machine (V25, 400x) — Calibrated breathing room ($3.50 custom SL)
  "1HZ75V": -2.50,   // Coffee (V75-1s, 100x)
  "R_75": -2.50,     // Lery's Alerts (V75, 50x)
  "R_100": -2.50,    // Milk (V100, 40x)
  "1HZ100V": -2.50,  // Ice Cream (V100-1s, 40x)
  "R_50": -2.50,     // OmniSight (V50, 80x)
  "R_10": -2.50      // Test Bot (V10, 400x)
};

const DEFAULT_SOFTWARE_SL_USD = -2.50;
const rawEnvSl = process.env.SOFTWARE_SL_USD ? parseFloat(process.env.SOFTWARE_SL_USD) : null;
const SOFTWARE_SL_USD = rawEnvSl !== null
  ? (rawEnvSl > 0 ? -rawEnvSl : rawEnvSl)
  : (typeof PROFILE.softwareSlUsd === "number" ? -Math.abs(PROFILE.softwareSlUsd) : (INSTRUMENT_SOFTWARE_SL_MAP[SYMBOL] ?? DEFAULT_SOFTWARE_SL_USD));

const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const DAILY_PROFIT_TARGET_USD = 7.00;
const rawAppId = String(process.env.DERIV_APP_ID || process.env.APP_ID || "1089").trim();
const MARKET_DATA_APP_ID = /^\d+$/.test(rawAppId) ? rawAppId : "1089";
const TARGET_MIN_PROFIT = PROFILE.minTakeProfitUsd || 4.00;

// Continuous Dollar Trailing Stop Settings (High Activation + Wide Buffer Calibration)
const TRAIL_ACTIVATION_USD = PROFILE.trailActivationUsd || 3.00; // Activated once profit reaches +$3.00 net
const TRAIL_BUFFER_USD = 1.50;     // Trail $1.50 behind peak unrealized profit
const TRAIL_INITIAL_FLOOR_USD = 1.50; // Initial guaranteed lock at activation (+$3.00 peak - $1.50 buffer = +$1.50)

const STOCH_MIDLINE_FALLBACK_SYMBOLS = ["R_50"];

const GATEWAY_URL = process.env.GATEWAY_URL || process.env.PROXY_URL || "http://138.2.169.72:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || process.env.PROXY_SECRET || "secret_vault_8899_auth";

const TG_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const MODE = process.env.MODE || "live";

const M5  = 5  * 60;
const M15 = 15 * 60;
const M30 = 30 * 60;
const D1  = 24 * 60 * 60;

const DEBUG = process.env.DEBUG === "true";
function dbg(...a) { if (DEBUG) console.log("[DBG]", ...a); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getContractSymbol(c) {
  if (!c) return "";
  return c.underlying_symbol || c.symbol || (c.shortcode ? c.shortcode.split("_")[1] : "");
}

function escapeMarkdown(text) {
  if (!text) return "";
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

// ==================== TELEGRAM & UTILS ====================
function toAsciiJson(obj) {
  const json = JSON.stringify(obj);
  return json.replace(/[\u007F-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (c) => {
    if (c.length === 1) {
      return "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
    }
    return (
      "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0") +
      "\\u" + c.charCodeAt(1).toString(16).padStart(4, "0")
    );
  });
}

async function sendTelegram(msg) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: "missing_credentials" };
  const send = async (text, parseMode) => {
    const body = { chat_id: TG_CHAT_ID, text };
    if (parseMode) body.parse_mode = parseMode;
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: toAsciiJson(body)
    });
    let json;
    try { json = await res.json(); } catch (e) { json = { ok: false }; }
    return json;
  };
  try {
    const data = await send(msg, "Markdown");
    if (!data.ok) return await send(msg.replace(/[*_`\[\]]/g, ""), "");
    return data;
  } catch (e) { return { ok: false }; }
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ==================== DAILY LEDGER FLIGHT RECORDER ====================
function writeToLedger(epoch, closePrice, cci, stochK, stochD, envUp, envLo, phase, extra = "") {
  const dateStr = new Date(epoch * 1000).toISOString().split('T')[0];
  const file = `ledger_${SYMBOL}_${dateStr}.csv`;
  const timeStr = new Date(epoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const extraStr = extra ? `,${extra}` : "";
  const line = `${timeStr},${closePrice.toFixed(4)},${(cci !== null ? cci.toFixed(2) : "0.00")},${(stochK !== null ? stochK.toFixed(2) : "0.00")},${(stochD !== null ? stochD.toFixed(2) : "0.00")},${(envUp !== null ? envUp.toFixed(4) : "0.0000")},${(envLo !== null ? envLo.toFixed(4) : "0.0000")},${phase || "IDLE"}${extraStr}\n`;
  
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "Time,Close,CCI,Stoch_K,Stoch_D,Env_Up,Env_Lo,Phase,Extra\n");
  }
  fs.appendFileSync(file, line);
}

// ==================== GATEWAY CLIENT CALLS ====================
async function gatewayFetch(endpoint, method = "GET", body = null, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", "x-gateway-secret": GATEWAY_SECRET },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Gateway HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function getOpenPortfolio() {
  if (EXECUTION_MODE === "ctrader") {
    try {
      const res = await gatewayFetch("/ctrader/positions");
      if (res && res.ok && Array.isArray(res.positions)) {
        const CTRADER_ID_TO_SYMBOL = {
          2435: "1HZ75V",
          2434: "R_75",
          2431: "R_50",
          2430: "R_25",
          2428: "R_10",
          2436: "R_100",
          2437: "1HZ100V"
        };
        return res.positions.map(p => {
          const symId = p.tradeData?.symbolId || p.symbolId;
          const mappedSym = CTRADER_ID_TO_SYMBOL[symId] || SYMBOL;
          return {
            contract_id: String(p.positionId),
            symbol: mappedSym,
            underlying_symbol: mappedSym,
            contract_type: p.tradeData?.tradeSide === 1 ? "MULTUP" : "MULTDOWN",
            buy_price: p.price,
            lots: (p.tradeData?.volume ? p.tradeData.volume / 100 : CTRADER_LOT_SIZE),
            unrealizedPnl: p.unrealizedPnl,
            date_start: Math.floor((p.tradeData?.openTimestamp || Date.now()) / 1000)
          };
        });
      }
    } catch (e) {
      dbg(`[PORTFOLIO] cTrader query failed (${e.message}), falling back to Deriv gateway...`);
    }
  }

  try {
    const res = await gatewayFetch("/portfolio");
    if (res && res.ok !== false) {
      const rawList = Array.isArray(res.portfolio)
        ? res.portfolio
        : (Array.isArray(res.portfolio?.contracts)
            ? res.portfolio.contracts
            : (Array.isArray(res.contracts) ? res.contracts : []));
      return Array.isArray(rawList) ? rawList : [];
    }
  } catch (e) {
    dbg(`[PORTFOLIO] Deriv gateway query failed (${e.message}). Returning empty array.`);
  }
  return [];
}

async function executeTrade(direction, orderContext = {}) {
  if (EXECUTION_MODE === "ctrader") {
    try {
      const payload = {
        symbol: SYMBOL_NAME || SYMBOL,
        side: direction,
        lots: CTRADER_LOT_SIZE,
        slPrice: orderContext.slPrice || null,
        tpPrice: orderContext.tpPrice || orderContext.fibTpPrice || null,
        slUsd: Math.abs(SOFTWARE_SL_USD) || 3.60,
        tpUsd: TARGET_MIN_PROFIT || 4.00,
        comment: `${REPO_LABEL} cTrader`
      };
      console.log(`[CTRADER ORDER] Sending ${direction} order: ${CTRADER_LOT_SIZE} lots on ${SYMBOL_NAME || SYMBOL} (SL: ${payload.slPrice || payload.slUsd}, TP: ${payload.tpPrice || payload.tpUsd})`);
      const res = await gatewayFetch("/ctrader/order", "POST", payload);
      if (res && res.ok && res.order?.positionId) {
        console.log(`[CTRADER ORDER SUCCESS] Position ID #${res.order.positionId} confirmed by broker.`);
        return String(res.order.positionId);
      }
      const errDetail = res?.error || res?.message || (res ? JSON.stringify(res) : "Unknown broker error");
      throw new Error(`cTrader order rejected by broker: ${errDetail}`);
    } catch (e) {
      console.error(`[TRADE EXECUTION ERROR] cTrader order failed: ${e.message}`);
      // User policy: STRICT cTrader execution. Never silently fall back to Deriv!
      throw e;
    }
  }

  // Fallback Deriv Multiplier branch ONLY executed if user explicitly sets EXECUTION_MODE=deriv in .env
  const expectedContractType = direction === "BUY" ? "MULTUP" : "MULTDOWN";
  const slDollars = parseFloat(STAKE_USD.toFixed(2));
  const payload = {
    buy: "1", price: STAKE_USD,
    parameters: { 
      contract_type: expectedContractType, 
      underlying_symbol: TRADING_SYMBOL, 
      currency: "USD", 
      amount: STAKE_USD, 
      basis: "stake", 
      multiplier: MULTIPLIER, 
      limit_order: { stop_loss: slDollars, take_profit: SERVER_TP_USD } 
    }
  };
  const data = await gatewayFetch("/buy", "POST", payload);
  if (data.error) throw new Error(data.error.message);
  return data.buy?.contract_id;
}

async function closeContract(contractId) {
  if (EXECUTION_MODE === "ctrader") {
    try {
      const res = await gatewayFetch("/ctrader/close", "POST", { positionId: Number(contractId) });
      if (res && (res.alreadyClosed || res.positionNotFound || res.ok)) {
        return res;
      }
      return res || { ok: true };
    } catch (err) {
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("not found") || errMsg.includes("already closed") || errMsg.includes("500") || errMsg.includes("404")) {
        return { ok: true, positionNotFound: true, error: { code: "ContractNotFound", message: err.message } };
      }
      console.error(`[CLOSE CONTRACT ERROR] cTrader position close error for #${contractId}: ${err.message}`);
      throw err;
    }
  }
  const numericId = Number(contractId);
  const payloadSell = (!isNaN(numericId) && numericId > 0) ? numericId : contractId;
  const data = await gatewayFetch("/sell", "POST", { sell: payloadSell, price: 0 });
  if (data.error && data.error.code !== "ContractNotFound") throw new Error(data.error.message);
  return data;
}

async function getContractProfitFromHistory(contractId, approxOpenEpoch) {
  if (EXECUTION_MODE === "ctrader") {
    try {
      const res = await gatewayFetch("/ctrader/deals");
      if (res && res.ok && Array.isArray(res.deals)) {
        const match = res.deals.find(d => String(d.positionId) === String(contractId));
        if (match) {
          const detail = match.closePositionDetail;
          let profit = 0;
          if (detail && typeof detail.grossProfit === "number") {
            const moneyDigits = detail.moneyDigits ?? match.moneyDigits ?? 2;
            profit = (detail.grossProfit + (detail.swap || 0) + (detail.commission || 0)) / Math.pow(10, moneyDigits);
          } else if (typeof match.netProfit === "number") {
            profit = match.netProfit;
          }
          return {
            profit: parseFloat(profit.toFixed(2)),
            sellTime: Math.floor((match.executionTimestamp || Date.now()) / 1000)
          };
        }
      }
    } catch (e) {
      dbg(`[CTRADER DEALS] Reconciliation query error: ${e.message}`);
    }
    return null;
  }
  const data = await gatewayFetch("/profit_table", "POST", { 
    profit_table: 1, 
    description: 1, 
    limit: 25, 
    sort: "DESC", 
    date_from: approxOpenEpoch ? approxOpenEpoch - 300 : undefined 
  });
  const match = (data.profit_table?.transactions || []).find(tx => String(tx.contract_id) === String(contractId));
  if (!match) return null;
  return { 
    profit: typeof match.profit === "number" ? match.profit : (parseFloat(match.sell_price) - parseFloat(match.buy_price)), 
    sellTime: match.sell_time 
  };
}

// ==================== MARKET DATA FETCHERS (GATEWAY MULTIPLEXED + WS FALLBACK) ====================
async function fetchAllData() {
  // 1. Primary Path: Query authenticated deriv-gateway (0ms connection overhead, zero Cloudflare blocks)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const [resM5, resM15, resM30, resD1] = await Promise.all([
        gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M5,  count: 500, end: "latest", style: "candles" }, 15000),
        gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }, 15000),
        gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }, 15000),
        gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }, 15000)
      ]);

      if (resM5?.candles && resM15?.candles && resM30?.candles && resD1?.candles) {
        return { m5: resM5.candles, m15: resM15.candles, m30: resM30.candles, d1: resD1.candles };
      }
    } catch (gwErr) {
      dbg(`[GATEWAY CANDLES] Gateway query attempt ${attempt} failed (${gwErr.message}).`);
      if (attempt === 1) await sleep(1500);
    }
  }

  // 2. Fallback Path: Direct standard WebSocket query
  const WS = await getWebSocketClass();
  if (!WS) {
    throw new Error("Market data gateway query failed.");
  }

  const endpoints = [
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
  ];

  let lastError = null;
  for (const endpointUrl of endpoints) {
    try {
      return await new Promise((resolve, reject) => {
        const ws = new WS(endpointUrl);
        const results = {};
        let timer = null;
        let isSettled = false;

        const cleanup = () => {
          if (timer) clearTimeout(timer);
          try {
            if (ws.readyState === WS.OPEN || ws.readyState === WS.CONNECTING) {
              if (typeof ws.terminate === "function") ws.terminate();
              else ws.close();
            }
          } catch (e) {}
        };

        timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(new Error(`fetchAllData timeout on ${endpointUrl} (15s exceeded)`));
          }
        }, 15000);

        ws.on("open", () => {
          try {
            ws.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 500, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
            ws.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }));
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("message", d => {
          try {
            const msg = JSON.parse(d);
            if (msg.error) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(new Error(`Deriv WS error: ${msg.error.message || msg.error.code}`));
              }
              return;
            }
            if (msg.req_id === 1) results.m5  = msg.candles;
            if (msg.req_id === 4) results.m15 = msg.candles;
            if (msg.req_id === 6) results.m30 = msg.candles;
            if (msg.req_id === 5) results.d1  = msg.candles;
            if (results.m5 && results.m15 && results.m30 && results.d1) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                resolve(results);
              }
            }
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("error", err => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(err);
          }
        });
      });
    } catch (err) {
      lastError = err;
      dbg(`[MARKET DATA] Endpoint ${endpointUrl} failed (${err.message}). Trying fallback...`);
      await sleep(1000);
    }
  }
  throw lastError || new Error("All Deriv market data endpoints failed");
}

async function fetchCurrentSpotPrice() {
  // 1. Primary Path: Query authenticated deriv-gateway
  try {
    const res = await gatewayFetch("/ticks_history", "POST", { ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" });
    if (res?.history?.prices?.length > 0) {
      return parseFloat(res.history.prices[res.history.prices.length - 1]);
    }
  } catch (e) {}

  // 2. Fallback Path: Direct standard WebSocket query
  const WS = await getWebSocketClass();
  if (!WS) return 0;

  const endpoints = [
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
  ];

  let lastError = null;
  for (const endpointUrl of endpoints) {
    try {
      return await new Promise((resolve, reject) => {
        const ws = new WS(endpointUrl);
        let timer = null;
        let isSettled = false;

        const cleanup = () => {
          if (timer) clearTimeout(timer);
          try {
            if (ws.readyState === WS.OPEN || ws.readyState === WS.CONNECTING) {
              if (typeof ws.terminate === "function") ws.terminate();
              else ws.close();
            }
          } catch (e) {}
        };

        timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(new Error(`fetchCurrentSpotPrice timeout on ${endpointUrl} (4s exceeded)`));
          }
        }, 4000);

        ws.on("open", () => {
          try {
            ws.send(JSON.stringify({ req_id: 3, ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" }));
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("message", d => {
          try {
            const msg = JSON.parse(d);
            if (msg.error) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(new Error(`Deriv WS spot error: ${msg.error.message || msg.error.code}`));
              }
              return;
            }
            if (msg.req_id === 3 && msg.history && msg.history.prices && msg.history.prices.length > 0) {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                resolve(parseFloat(msg.history.prices[msg.history.prices.length - 1]));
              }
            }
          } catch (err) {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          }
        });

        ws.on("error", err => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(err);
          }
        });
      });
    } catch (err) {
      lastError = err;
      dbg(`[SPOT PRICE] Endpoint ${endpointUrl} failed (${err.message}). Trying fallback...`);
      await sleep(500);
    }
  }
  throw lastError || new Error("All Deriv spot price endpoints failed");
}

// ==================== TECHNICAL ANALYSIS ====================
function sma(data, period) {
  return data.map((_, i) => (i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period));
}

export function calculateEMA(candles, period = 100) {
  const closes = candles.map(c => parseFloat(c.close));
  const out = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  let prevEma = sum / period;
  out[period - 1] = prevEma;
  for (let i = period; i < closes.length; i++) {
    const curEma = (closes[i] * k) + (prevEma * (1 - k));
    out[i] = curEma;
    prevEma = curEma;
  }
  return out;
}

function emaArray(data, period) {
  const out = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let firstIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== null && !isNaN(data[i])) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx === -1 || data.length - firstIdx < period) return out;
  let sum = 0;
  for (let i = firstIdx; i < firstIdx + period; i++) sum += data[i];
  let prevEma = sum / period;
  out[firstIdx + period - 1] = prevEma;
  for (let i = firstIdx + period; i < data.length; i++) {
    const val = data[i];
    if (val !== null && !isNaN(val)) {
      const curEma = (val * k) + (prevEma * (1 - k));
      out[i] = curEma;
      prevEma = curEma;
    } else {
      out[i] = prevEma;
    }
  }
  return out;
}

export function calculateStoch(candles, kPeriod = 18, dPeriod = 12, slowing = 25, method = "Simple") {
  const fastK = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const sl = candles.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...sl.map(c => parseFloat(c.high)));
    const ll = Math.min(...sl.map(c => parseFloat(c.low)));
    const c = parseFloat(candles[i].close);
    fastK[i] = hh === ll ? 100 : ((c - ll) / (hh - ll)) * 100;
  }
  const isExp = String(method).toLowerCase() === "exponential";
  const smoothFn = isExp ? emaArray : sma;
  const slowK = smoothFn(fastK.map(v => (v !== null ? v : 50)), slowing).map((v, i) => (fastK[i] === null ? null : v));
  const slowD = smoothFn(slowK.map(v => (v !== null ? v : 50)), dPeriod).map((v, i) => (slowK[i] === null ? null : v));
  return { k: slowK, d: slowD };
}

export function calculateEnvelopes(candles, period = 50, devPct = 0.05) {
  const closes = candles.map(c => parseFloat(c.close));
  const mid = sma(closes, period);
  return {
    upper: mid.map(m => (m !== null ? m * (1 + devPct / 100) : null)),
    lower: mid.map(m => (m !== null ? m * (1 - devPct / 100) : null))
  };
}

export function calculateCCI(candles, n = 100) {
  const out = new Array(candles.length).fill(null);
  for (let i = n - 1; i < candles.length; i++) {
    const sl = candles.slice(i - n + 1, i + 1);
    const tp = sl.map(c => (parseFloat(c.high) + parseFloat(c.low) + parseFloat(c.close)) / 3);
    const m = tp.reduce((a, b) => a + b, 0) / n;
    const md = tp.reduce((s, v) => s + Math.abs(v - m), 0) / n;
    out[i] = md === 0 ? 0 : (tp[tp.length - 1] - m) / (0.015 * md);
  }
  return out;
}

export function calculateMACD(candles, fastPeriod = 25, slowPeriod = 75, signalPeriod = 1) {
  const closes = candles.map(c => parseFloat(c.close));
  const fastEma = emaArray(closes, fastPeriod);
  const slowEma = emaArray(closes, slowPeriod);
  const macdLine = new Array(closes.length).fill(null);
  
  for (let i = 0; i < closes.length; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      macdLine[i] = fastEma[i] - slowEma[i];
    }
  }
  
  // MT5 Standard Specification: Signal Line uses Simple Moving Average (MACD SMA)
  const validMacd = macdLine.map(v => (v !== null ? v : 0));
  const rawSignal = sma(validMacd, signalPeriod);
  const signalLine = rawSignal.map((v, i) => (macdLine[i] === null ? null : v));
  const histogram = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }
  return { macd: macdLine, signal: signalLine, histogram };
}

export function computeDailyFibLevels(d1Candles) {
  if (!d1Candles || d1Candles.length < 2) return null;
  const yesterday = d1Candles[d1Candles.length - 2];
  const today     = d1Candles[d1Candles.length - 1];

  const h = parseFloat(yesterday.high), l = parseFloat(yesterday.low), o = parseFloat(yesterday.open), c = parseFloat(yesterday.close);
  const rng = h - l;
  if (rng <= 0) return null;

  const bullish = c > o;
  const dailyBiasPrice = parseFloat(today.open);

  return bullish
    ? { bullish, fibM50: h + 0.5*rng, fib0: h, fib50: h - 0.5*rng, fib79: h - 0.79*rng, fib100: l, fib1618: h - 1.618*rng, dailyBiasPrice }
    : { bullish, fibM50: l - 0.5*rng, fib0: l, fib50: l + 0.5*rng, fib79: l + 0.79*rng, fib100: h, fib1618: l + 1.618*rng, dailyBiasPrice };
}

// Finds previous institutional swing fractal on M15 timeframe (Top for SELL, Down for BUY)
export function findRecentFractalM15(m15Candles, direction) {
  if (!m15Candles || m15Candles.length < 5) return null;
  for (let k = m15Candles.length - 3; k >= 2; k--) {
    if (direction === "BUY") {
      const low = parseFloat(m15Candles[k].low);
      if (low < parseFloat(m15Candles[k - 1].low) && low < parseFloat(m15Candles[k - 2].low) &&
          low < parseFloat(m15Candles[k + 1].low) && low < parseFloat(m15Candles[k + 2].low)) {
        return low;
      }
    } else {
      const high = parseFloat(m15Candles[k].high);
      if (high > parseFloat(m15Candles[k - 1].high) && high > parseFloat(m15Candles[k - 2].high) &&
          high > parseFloat(m15Candles[k + 1].high) && high > parseFloat(m15Candles[k + 2].high)) {
        return high;
      }
    }
  }
  return null;
}

// Finds if an opposing M15 swing fractal has formed after trade entry (Fakeout Detection)
// For BUY trade: looks for an UPPER (Bearish swing high) fractal formed at or after entryEpoch
// For SELL trade: looks for a LOWER (Bullish swing low) fractal formed at or after entryEpoch
export function findNewOpposingFractalM15(m15Candles, direction, entryEpoch) {
  if (!m15Candles || m15Candles.length < 5 || !entryEpoch) return null;
  for (let k = m15Candles.length - 3; k >= 2; k--) {
    const candleEpoch = m15Candles[k].epoch;
    if (candleEpoch < (entryEpoch - 900)) break;

    if (direction === "BUY") {
      const high = parseFloat(m15Candles[k].high);
      if (high > parseFloat(m15Candles[k - 1].high) && high > parseFloat(m15Candles[k - 2].high) &&
          high > parseFloat(m15Candles[k + 1].high) && high > parseFloat(m15Candles[k + 2].high)) {
        return { price: high, epoch: candleEpoch, type: "UPPER_BEARISH" };
      }
    } else {
      const low = parseFloat(m15Candles[k].low);
      if (low < parseFloat(m15Candles[k - 1].low) && low < parseFloat(m15Candles[k - 2].low) &&
          low < parseFloat(m15Candles[k + 1].low) && low < parseFloat(m15Candles[k + 2].low)) {
        return { price: low, epoch: candleEpoch, type: "LOWER_BULLISH" };
      }
    }
  }
  return null;
}


// Stochastic Continuous State-Based Arming (Unbounded by time: remains armed as long as %K is on the valid side of the threshold)
function checkStochastic8HrLookback(candles, stoch, dir, type = "MIDLINE") {
  if (!candles || candles.length < 2 || !stoch || !stoch.k) return false;
  
  // Evaluation index: latest completed candle
  const lastK = stoch.k[candles.length - 2];
  if (lastK === null || isNaN(lastK)) return false;

  if (type === "MIDLINE") {
    // BUY is armed whenever %K >= 50.0; SELL is armed whenever %K <= 50.0
    if (dir === "BUY") return lastK >= 50.0;
    if (dir === "SELL") return lastK <= 50.0;
  } else if (type === "BOUNDARIES_20_80") {
    // BUY is armed whenever %K >= 20.0; SELL is armed whenever %K <= 80.0
    if (dir === "BUY") return lastK >= 20.0;
    if (dir === "SELL") return lastK <= 80.0;
  }

  return false;
}

// Finds the candle epoch when the latest continuous cross/arming occurred
function findStochasticCrossCandleEpoch(candles, stoch, dir, type = "MIDLINE") {
  if (!candles || candles.length < 2 || !stoch || !stoch.k) return null;
  const lastIdx = candles.length - 2;

  // Walk backwards from latest completed candle
  for (let i = lastIdx; i >= 1; i--) {
    const k = stoch.k[i];
    const prevK = stoch.k[i - 1];
    if (k === null || prevK === null || isNaN(k) || isNaN(prevK)) break;

    if (type === "MIDLINE") {
      if (dir === "BUY") {
        if (k < 50.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK <= 50.0 && k >= 50.0) return candles[i].epoch;
      } else if (dir === "SELL") {
        if (k > 50.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK >= 50.0 && k <= 50.0) return candles[i].epoch;
      }
    } else if (type === "BOUNDARIES_20_80") {
      if (dir === "BUY") {
        if (k < 20.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK <= 20.0 && k >= 20.0) return candles[i].epoch;
      } else if (dir === "SELL") {
        if (k > 80.0) return candles[i + 1] ? candles[i + 1].epoch : null;
        if (prevK >= 80.0 && k <= 80.0) return candles[i].epoch;
      }
    }
  }
  return null;
}

const checkStochasticStateArmed = checkStochastic8HrLookback;

function deriveHardStopPrice(entry, direction, lots = CTRADER_LOT_SIZE) {
  const targetLoss = -5.00;
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  if (EXECUTION_MODE === "ctrader") {
    const activeLots = (lots && lots > 0) ? lots : CTRADER_LOT_SIZE;
    const priceMove = requiredRawPnl / activeLots;
    return direction === "BUY" ? entry + priceMove : entry - priceMove;
  }
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  return direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);
}

function calcUnrealizedPnL(trade, currentPrice) {
  // 1. Direct Live Broker PnL (Highest Fidelity from cTrader / Deriv)
  if (typeof trade.liveBrokerPnl === "number" && !isNaN(trade.liveBrokerPnl)) {
    return trade.liveBrokerPnl;
  }
  if (typeof trade.unrealizedPnl === "number" && !isNaN(trade.unrealizedPnl)) {
    return trade.unrealizedPnl;
  }

  // 2. High-Precision Price Point Calculation Fallback
  const pointsDiff = trade.direction === "BUY"
    ? (currentPrice - trade.entry)
    : (trade.entry - currentPrice);

  const activeLots = (trade.lots && trade.lots > 0) ? trade.lots : CTRADER_LOT_SIZE;
  const rawPnl = EXECUTION_MODE === "ctrader"
    ? pointsDiff * activeLots
    : (pointsDiff / trade.entry) * STAKE_USD * MULTIPLIER;

  return rawPnl - COMMISSION_USD;
}

export function aggregateCandles(candles, timeframeSeconds) {
  if (!Array.isArray(candles) || candles.length === 0) return [];
  const map = new Map();
  for (const c of candles) {
    const bucket = c.epoch - (c.epoch % timeframeSeconds);
    if (!map.has(bucket)) {
      map.set(bucket, {
        epoch: bucket,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: c.volume || 0
      });
    } else {
      const b = map.get(bucket);
      b.high = Math.max(b.high, parseFloat(c.high));
      b.low = Math.min(b.low, parseFloat(c.low));
      b.close = parseFloat(c.close);
      b.volume += (c.volume || 0);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.epoch - b.epoch);
}

function evaluateH1AdverseClose(trade, candles, si) {
  if (!trade.entryEpoch || trade.h1Checked) return { triggered: false };
  const entryHourStart = Math.floor(trade.entryEpoch / 3600) * 3600;
  const entryHourEnd = entryHourStart + 3600;
  const currentCandleCloseEpoch = candles[si].epoch + 300;

  // Evaluate when current closed candle reaches or crosses the entry hour close boundary
  if (currentCandleCloseEpoch >= entryHourEnd) {
    trade.h1Checked = true;
    const entryHourCandle = candles.find(c => c.epoch === entryHourStart);
    const h1OpenPrice = entryHourCandle ? parseFloat(entryHourCandle.open) : parseFloat(trade.entry);
    const h1ClosePrice = parseFloat(candles[si].close);
    const isBuy = trade.direction === "BUY";
    const adverseClose = isBuy ? (h1ClosePrice < h1OpenPrice) : (h1ClosePrice > h1OpenPrice);
    return {
      triggered: adverseClose,
      h1OpenPrice,
      h1ClosePrice
    };
  }
  return { triggered: false };
}

function findRecentFractal(candles, currentIndex, direction) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    if (direction === "BUY") {
      const low = parseFloat(candles[k].low);
      if (low < parseFloat(candles[k - 1].low) && low < parseFloat(candles[k - 2].low) &&
          low < parseFloat(candles[k + 1].low) && low < parseFloat(candles[k + 2].low)) return low;
    } else {
      const high = parseFloat(candles[k].high);
      if (high > parseFloat(candles[k - 1].high) && high > parseFloat(candles[k - 2].high) &&
          high > parseFloat(candles[k + 1].high) && high > parseFloat(candles[k + 2].high)) return high;
    }
  }
  return null;
}

function findRecentFractalBelow(candles, currentIndex, maxPrice) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    const low = parseFloat(candles[k].low);
    if (low < parseFloat(candles[k - 1].low) && low < parseFloat(candles[k - 2].low) &&
        low < parseFloat(candles[k + 1].low) && low < parseFloat(candles[k + 2].low)) {
      if (maxPrice === undefined || low < maxPrice) return low;
    }
  }
  return null;
}

function findRecentFractalAbove(candles, currentIndex, minPrice) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    const high = parseFloat(candles[k].high);
    if (high > parseFloat(candles[k - 1].high) && high > parseFloat(candles[k - 2].high) &&
        high > parseFloat(candles[k + 1].high) && high > parseFloat(candles[k + 2].high)) {
      if (minPrice === undefined || high > minPrice) return high;
    }
  }
  return null;
}

// ==================== STATE MANAGEMENT ====================
let state = {
  symbol: SYMBOL,
  currentPrice: null,
  lastPriceUpdate: null,
  lastProcessedEpoch: null, lastTgUpdateId: 0, armed: null, armedEpoch: null, armedTime: null, confirm: null, dailyBiasPrice: null,
  last50Origin: null,
  lastTriggeredSetup: null,
  lastTriggeredEpoch: null,
  dailyNetPnl: 0,
  dailyTargetReached: false,
  dailyTargetDate: null,
  // Persistent directional state tracking
  stochState: null,
  stochSeparation: null,
  cciState: null,
  nextPhase: null, h1TdiDir: null,
  cciAligned: false, stochAligned: false, envAligned: false, emaAligned: false,
  // Indicator telemetry values
  strategyProfile: STRATEGY_PROFILE,
  stochVal: null,
  stochSignal: null,
  cciVal: null,
  envUpper: null,
  envLower: null,
  ema100Val: null,
  stoch533Val: null,
  stoch50CrossUp: false,
  stoch50CrossDown: false,
  stoch50Above: false,
  stoch50Below: false,
  stoch50Cross: false,
  ema100BuyArmed: false,
  ema100SellArmed: false,
  stoch533BuyCross: false,
  stoch533SellCross: false,
  envBuyActive: false,
  envSellActive: false,
  cciCrossBuy: false,
  cciCrossSell: false,
  stoch20CrossUp: false,
  stoch80CrossDown: false,
  stoch20Above: false,
  stoch80Below: false,
  // V100 (1s) Two-stage state machine
  v100_1s_armed: false,
  v100_1s_armDir: null,
  latchStoch533_BUY: false,
  latchStoch533_SELL: false,
  // V75 Retracement Touch Latches
  v75_emaTouched_BUY: false,
  v75_emaTouched_SELL: false,
  // V25 Stoch (200,1,1) Trend Indicator Arming
  v25_trendDirection: null,
  // V50 Stoch (200,1,1) Trend Indicator & Pending CCI 15m Timer
  v50_trendDirection: null,
  v50_pending_cci: null,
  latchCci_BUY: false,
  latchCci_SELL: false,
  latchStoch_BUY: false,
  latchStoch_SELL: false,
  engineVersion: "v6.2-master",
  codeTimestamp: "2026-10-03T10:35:00Z"
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE_PATH = path.resolve(__dirname, "state.json");
const TRADES_FILE_PATH = path.resolve(__dirname, "trades.json");

const ENGINE_VERSION = "v6.2-master";
const CODE_TIMESTAMP = "2026-10-03T10:35:00Z";

const ALLOWED_STATE_KEYS = new Set([
  "engineVersion", "codeTimestamp", "symbol", "strategyProfile", "currentPrice",
  "lastPriceUpdate", "lastProcessedEpoch", "lastTgUpdateId", "armed", "armedEpoch",
  "armedTime", "confirm", "dailyBiasPrice", "last50Origin", "lastTriggeredSetup",
  "lastTriggeredEpoch", "dailyNetPnl", "dailyTargetReached", "dailyTargetDate",
  "currentDayDate", "dailyKeyLevelTouchedToday", "keyLevelTouched", "levelTouched",
  "cciAligned", "stochAligned", "envAligned", "emaAligned", "emaAlignedDir",
  "h1TdiDir", "stochVal", "stochSignal", "stoch200Val", "stoch1525Val", "stoch533Val",
  "cciVal", "envUpper", "envLower", "ema100Val", "ema200Val", "macdVal",
  "stoch50CrossUp", "stoch50CrossDown", "stoch50Above", "stoch50Below", "stoch50Cross",
  "stoch50CrossDir", "stoch50CrossEpoch", "ema100BuyArmed", "ema100SellArmed",
  "ema100AlignEpoch", "stoch533BuyCross", "stoch533SellCross", "stoch533CrossDir",
  "stoch533CrossEpoch", "stoch1525Signal", "envBuyActive", "envSellActive",
  "envBreakoutDir", "envBreakoutEpoch", "cciCrossBuy", "cciCrossSell", "cciCrossDir",
  "cciCrossEpoch", "stoch20CrossUp", "stoch80CrossDown", "stoch20Above", "stoch80Below",
  "stochBoundaryDir", "stochBoundaryEpoch", "latchStoch_BUY", "latchStoch_SELL",
  "latchStoch533_BUY", "latchStoch533_SELL", "latchCci_BUY", "latchCci_SELL",
  "latchFib_BUY", "latchFib_SELL", "fib0", "fib100", "fib50", "fib618", "fib79",
  "fibBullish", "rescueStochArmed", "v75_emaTouched_BUY", "v75_emaTouched_SELL",
  "v75_stochOverboughtArmed", "v75_stochOversoldArmed", "v75_1s_emaTouched_BUY",
  "v75_1s_emaTouched_SELL", "v75_1s_trend", "v75_1s_ema100", "v75_1s_macd",
  "v75_1s_stoch200", "v75_1s_stoch533", "v100_initialEntryDone", "v100_trendDir",
  "v100_stoch200Armed", "v100_stoch200CrossEpoch", "v100_stoch15_50_crossDir",
  "v100_stoch15_50_crossEpoch", "v100_1s_armed", "v100_1s_armDir", "v100_1s_initialBuyDone",
  "v100_1s_initialSellDone", "v100_1s_stochArmedBuy", "v100_1s_stochArmedSell",
  "v100_1s_macdArmedBuy", "v100_1s_macdArmedSell", "v100_1s_trend", "v100_1s_ema100",
  "v100_1s_macd", "v100_1s_stoch200", "v100_1s_stoch533", "v100_1s_stoch15",
  "v50_trendDirection", "v50_pending_cci", "v50_initialBuyDone", "v50_initialSellDone",
  "v50_stochArmedBuy", "v50_stochArmedSell", "v50_cciArmedBuy", "v50_cciArmedSell",
  "v25_trendDirection", "v25_initialBuyDone", "v25_initialSellDone", "v25_stochArmedBuy",
  "v25_stochArmedSell", "v25_cciArmedBuy", "v25_cciArmedSell", "v10_trend",
  "v10_ema100", "v10_macd", "v10_stoch200", "v10_stoch533", "stochState", "stochSeparation",
  "cciState", "nextPhase"
]);

function sanitizeState(s) {
  if (s && typeof s === "object") {
    Object.keys(s).forEach(k => {
      if (!ALLOWED_STATE_KEYS.has(k)) {
        delete s[k];
      }
    });
  }
  return s;
}

try { 
  state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf8")) }; 
} catch {}

sanitizeState(state);
state.engineVersion = ENGINE_VERSION;
state.codeTimestamp = CODE_TIMESTAMP;

function saveState() {
  state.engineVersion = ENGINE_VERSION;
  state.codeTimestamp = CODE_TIMESTAMP;
  sanitizeState(state);
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

function loadTrades() { try { return JSON.parse(fs.readFileSync(TRADES_FILE_PATH, "utf8")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync(TRADES_FILE_PATH, JSON.stringify(t, null, 2)); }

// ==================== FAST PATH: RISK MANAGEMENT (ADAPTIVE: 3S IN-TRADE / 10S IDLE) ====================
const closingContracts = new Set();

async function manageOpenTradesFastPath() {
  let trades = loadTrades();
  let openTrades = trades.filter(t => !t.result && !t.pending);

  // 🛡️ Universal Live Portfolio Adoption & Self-Healing: Always query deriv-gateway for active broker positions.
  // Ensures any live contract running on Deriv for this instrument is instantly adopted and monitored by Fast-Path Software SL.
  try {
    const allPortfolio = await getOpenPortfolio();
    const allLiveIdSet = new Set((Array.isArray(allPortfolio) ? allPortfolio : []).map(c => String(c.contract_id || c.id || c.contractId)));
    const liveContracts = (Array.isArray(allPortfolio) ? allPortfolio : []).filter(c => getContractSymbol(c).toUpperCase() === TRADING_SYMBOL.toUpperCase());
    let modified = false;

    // Live Broker PnL & Volume Synchronization:
    for (const live of liveContracts) {
      const liveCid = String(live.contract_id || live.contractId || live.id);
      const tracked = trades.find(t => String(t.contractId) === liveCid && !t.result);
      if (tracked) {
        if (typeof live.unrealizedPnl === "number" && !isNaN(live.unrealizedPnl)) {
          tracked.liveBrokerPnl = live.unrealizedPnl;
          tracked.unrealizedPnl = live.unrealizedPnl;
        }
        if (live.lots && live.lots > 0 && tracked.lots !== live.lots) {
          tracked.lots = live.lots;
          modified = true;
        }
      }
    }

    // Self-Healing Step: If a contract was falsely marked closed in trades.json but is STILL LIVE on broker, restore t.result = null
    for (const t of trades.filter(t => t.result && t.contractId)) {
      if (allLiveIdSet.has(String(t.contractId))) {
        console.log(`[SELF-HEALING] Contract ${t.contractId} was marked '${t.result}', but is STILL LIVE on broker portfolio! Restoring active state.`);
        const prevResult = t.result;
        t.result = null;
        t.closeTime = null;
        t.serverPnl = null;
        closingContracts.delete(t.contractId);
        closingContracts.delete(Number(t.contractId));
        modified = true;
        await sendTelegram(
          `🩹 *${REPO_LABEL} — AUTOMATED SELF-HEALING RECOVERY* 🩹\n\n` +
          `Contract \`${t.contractId}\` (*${t.direction}*) was falsely marked as \`${prevResult}\`, but is STILL LIVE on Deriv!\n\n` +
          `Restored active state in V8 RAM. Fast-Path Software SL ($-\\ $2.50) and Trailing Stop are now actively monitoring this position.`
        );
      }
    }

    if (liveContracts.length > 0) {
      for (const live of liveContracts) {
        const liveCid = String(live.contract_id || live.contractId || live.id);
        const alreadyTracked = trades.find(t => String(t.contractId) === liveCid && !t.result);
        if (!alreadyTracked) {
          const entryPrice = live.buy_price ? parseFloat(live.buy_price) : (live.entry_price ? parseFloat(live.entry_price) : await fetchCurrentSpotPrice()); 
          const dir = (live.contract_type === "MULTUP" || (live.shortcode && live.shortcode.startsWith("MULTUP"))) ? "BUY" : "SELL";
          trades.push({
            id: `${SYMBOL}-${Date.now()}`, contractId: Number(liveCid) || liveCid, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
            direction: dir, entry: entryPrice, sl: deriveHardStopPrice(entryPrice, dir, live.lots || CTRADER_LOT_SIZE), rr: null, entryType: "RECOVERED_LIVE_FAST", brokerSlAmount: STAKE_USD,
            lots: live.lots || CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
            entryEpoch: live.date_start || Math.floor(Date.now() / 1000), fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false, fibTpPrice: null, keyLevel: null,
            openTime: new Date((live.date_start || Math.floor(Date.now() / 1000)) * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
          });
          modified = true;
          await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted live contract \`${liveCid}\` (${dir}) in Fast Path.`);
        }
      }
    }
    if (modified) {
      saveTrades(trades);
      openTrades = trades.filter(t => !t.result && !t.pending);
    }
  } catch (pErr) {
    dbg("Fast portfolio adoption skipped:", pErr.message);
  }

  if (openTrades.length === 0) return false;

  let currentPrice;
  try {
    currentPrice = await fetchCurrentSpotPrice();
    if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice)) {
      dbg(`[FAST PATH] Transient invalid spot price (${currentPrice}). Maintaining in-trade state.`);
      return true;
    }
    state.symbol = SYMBOL;
    state.currentPrice = currentPrice;
    state.lastPriceUpdate = new Date().toISOString();
    saveState();
  } catch (e) {
    // If transient price fetch failure occurred but trade is open, maintain in-trade flag
    return true;
  }

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);

    // =========================================================================
    // 🛡️ DYNAMIC PROFIT RATCHET & TREND-RIDER ACTIVATION (STRICTLY IN PROFIT)
    // =========================================================================
openTrade.maxUnrealizedPnL = Math.max(openTrade.maxUnrealizedPnL || 0, pnl);

    if (pnl >= 4.00 || (openTrade.maxUnrealizedPnL && openTrade.maxUnrealizedPnL >= 4.00)) {
      if (!openTrade.trendRidingActive) {
        openTrade.trendRidingActive = true;
        console.log(`[${REPO_LABEL}] 🚀 Trend-Rider ACTIVATED for #${openTrade.contractId} (${openTrade.direction}): Current PnL +${pnl.toFixed(2)} (>= +$4.00). Base floor $2.50 + $4.00 trailing interval activated.`);
      }
      // Initial floor locked at $2.50, trailing with $4.00 interval behind peak profit (every increase in peak expands floor)
      const trailingFloor = Math.max(2.50, parseFloat((openTrade.maxUnrealizedPnL - 4.00).toFixed(2)));
      if (!openTrade.lockedPnlFloor || trailingFloor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = trailingFloor;
        saveTrades(trades);
        console.log(`[TRAILING RATCHET] #${openTrade.contractId} Peak PnL +$${openTrade.maxUnrealizedPnL.toFixed(2)} -> Base floor expanded to +$${openTrade.lockedPnlFloor.toFixed(2)} ($4.00 trailing interval).`);
      }
    } else if (pnl >= 2.20 && !openTrade.trendRidingActive) {
      // Early Capital Shield before reaching +$4.00: locks +$0.50 net (covers commission)
      let targetFloor = 0.50;
      if (!openTrade.lockedPnlFloor || targetFloor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = targetFloor;
        saveTrades(trades);
        console.log(`[CAPITAL-SHIELD] ${openTrade.contractId} PnL +${pnl.toFixed(2)} -> Breakeven floor set to +${openTrade.lockedPnlFloor.toFixed(2)}.`);
      }
    }

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    const activeTpTarget = openTrade.tpPrice || openTrade.fibTpPrice || null;
    let tpHit = false;
    if (activeTpTarget) {
      tpHit = isBuy ? currentPrice >= activeTpTarget : currentPrice <= activeTpTarget;
    }
    // If Trend-Rider is active (pnl >= 4.00 reached), do NOT exit on initial TP!
    // Hold position wide open until closed M5 indicator invalidation or locked +$2.50 floor.
    if (openTrade.trendRidingActive) {
      tpHit = false;
    }

    // 🛡️ Rescue Retracement Exit: If this is an old parent trade with an active rescue position,
    // and price retraces back to old trade's entry price, close the old trade once its profit reaches at least +$0.20
    const activeRescueTrade = trades.find(t => !t.result && !t.pending && t.isRescue && (t.parentId === openTrade.id || t.parentContractId === openTrade.contractId));
    let rescueBreakevenHit = false;
    if (activeRescueTrade && !openTrade.isRescue) {
      const reachedOldEntry = isBuy ? currentPrice >= openTrade.entry : currentPrice <= openTrade.entry;
      if (reachedOldEntry && pnl >= 0.20) {
        rescueBreakevenHit = true;
      }
    }

    // 🛡️ Opposite M15 Fractal Fakeout Protection:
    // If trade has an opposing M15 fractal detected and is retracing in loss (adverse to entry)
    let fakeoutExitTriggered = false;
    if (openTrade.opposingM15Fractal && pnl < 0) {
      const isRetracing = isBuy ? currentPrice < openTrade.entry : currentPrice > openTrade.entry;
      if (isRetracing) {
        fakeoutExitTriggered = true;
      }
    }

    // 🏆 Stoch 50 / CCI 0 Midline Momentum Profit Exit (Real-Time Fast-Path Check)
    let stoch50ProfitExit = false;
    let stochExitDetail = "";
    const isCciInst = (
      STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || 
      STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || 
      STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || 
      STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || 
      SYMBOL === "R_25" || 
      SYMBOL === "R_50"
    );
    if (pnl > 0.00) {
      if (isCciInst && typeof state.cciVal === "number") {
        if ((isBuy && state.cciVal <= 0.0) || (!isBuy && state.cciVal >= 0.0)) {
          stoch50ProfitExit = true;
          stochExitDetail = `M5 CCI (${state.cciVal.toFixed(1)}) crossed 0.0 baseline against profit (+${pnl.toFixed(2)})`;
        }
      } else if (typeof state.stoch1525Val === "number") {
        if ((isBuy && state.stoch1525Val <= 50.0) || (!isBuy && state.stoch1525Val >= 50.0)) {
          stoch50ProfitExit = true;
          stochExitDetail = `M5 Aux Stoch (15,2,5) %K (${state.stoch1525Val.toFixed(1)}) crossed 50.0 midline against profit (+${pnl.toFixed(2)})`;
        }
      }
    }

    let reason = null;
    if (tpHit) { 
      reason = `Take Profit Target reached at ${currentPrice.toFixed(4)} (+ ${pnl.toFixed(2)})`; 
    } 
    else if (stoch50ProfitExit) {
      reason = stochExitDetail;
    } 
    else if (rescueBreakevenHit) {
      reason = `Rescue Retracement Target hit — Old position closed at +$${pnl.toFixed(2)} (>= +$0.20 profit) while rescue contract ${activeRescueTrade.contractId} runs to TP`;
    }
    else if (fakeoutExitTriggered) {
      reason = `Opposite M15 Fractal Fakeout Exit — Closed at ${currentPrice.toFixed(4)} ($${pnl.toFixed(2)}) to avoid full -$2.50 SL (Opposing ${openTrade.opposingM15Fractal.type} at ${Number(openTrade.opposingM15Fractal.price).toFixed(4)})`;
    }
    else if (openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) { 
      reason = `Profit-Lock hit — Secured +$${openTrade.lockedPnlFloor.toFixed(2)}`; 
    }
    else if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit — PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit — PnL $${pnl.toFixed(2)}`; }

    if (reason) {
      closingContracts.add(openTrade.contractId);
      console.log(`[RISK] Closing ${openTrade.contractId}: ${reason}`);
      let serverPnl = pnl, resultSource = "estimated_fallback";
      
      try {
        const closeRes = await closeContract(openTrade.contractId);
        const errStr = typeof closeRes?.error === "string" ? closeRes.error.toLowerCase() : (closeRes?.error?.message || "").toLowerCase();
        const isNotFound = closeRes?.positionNotFound || closeRes?.alreadyClosed || closeRes?.error?.code === "ContractNotFound" || errStr.includes("not found") || errStr.includes("already closed") || errStr.includes("not exist");

        if (closeRes && (closeRes.error || !closeRes.ok) && !isNotFound) {
          console.error(`[RISK ERROR] Failed to close contract ${openTrade.contractId} on broker: ${closeRes.error?.message || closeRes.error || JSON.stringify(closeRes)}`);
          closingContracts.delete(openTrade.contractId);
          continue; // Do NOT mark as closed if broker sell failed! Retry on next pulse.
        } else if (isNotFound) {
          serverPnl = pnl;
          resultSource = "broker_already_closed";
        } else if (closeRes && (closeRes.ok || closeRes.sell || closeRes.result)) {
          serverPnl = closeRes.sell?.profit ?? closeRes.result?.profit ?? pnl;
          resultSource = "server_close_confirmed";
        }
      } catch (e) {
        console.error(`[RISK EXCEPTION] closeContract failed for ${openTrade.contractId}:`, e.message);
        closingContracts.delete(openTrade.contractId);
        continue;
      }

      const finalResult = serverPnl >= 0 ? "WIN" : "LOSS";
      openTrade.result = finalResult;
      openTrade.resultSource = resultSource;
      openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
      openTrade.serverPnl = serverPnl;
      
      // Update cumulative daily net PnL
      state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
      if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
        state.dailyTargetReached = true;
        state.dailyTargetDate = new Date().toISOString().split("T")[0];
        console.log(`[DAILY TARGET] +$${DAILY_PROFIT_TARGET_USD.toFixed(2)} Daily Goal Achieved ($${state.dailyNetPnl.toFixed(2)}). Switching to IDLE_DAILY_TARGET_REACHED.`);
        await sendTelegram(`🎯 *${REPO_LABEL} — DAILY TARGET ACHIEVED!* 🎯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      }

      // Disarm setup upon trade exit to require a fresh key level re-test or fresh indicator reset
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.keyLevelTouched = false;
      state.levelTouched = null;
      // v75_emaTouched preserved across trade exits per user specification
      state.v75_1s_emaTouched_BUY = false;
      state.v75_1s_emaTouched_SELL = false;
      state.v100_1s_armed = false;
      state.v100_1s_armDir = null;
      state.latchStoch533_BUY = false;
      state.latchStoch533_SELL = false;
      state.latchFib_BUY = false;
      state.latchFib_SELL = false;
      state.latchCci_BUY = false;
      state.latchCci_SELL = false;
      state.latchStoch_BUY = false;
      state.latchStoch_SELL = false;
      state.rescueStochArmed = false;

      saveTrades(trades);
      saveState();
      closingContracts.delete(openTrade.contractId);
      
      const icon = finalResult === "WIN" ? "✅" : "❌";
      const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
      const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
      await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${finalResult}*\n\nDirection: ${openTrade.direction}\n📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n🏁 Exit: ${currentPrice.toFixed(4)}\n\n💵 P&L: *${pnlStr}* (Net of comm.)\nReason: ${reason}\nDuration: ${formatDuration(durationMs)}\nDaily Net Total: $${state.dailyNetPnl.toFixed(2)}\nContract: \`${openTrade.contractId}\``);
    }
  }

  // Return whether any trades remain actively open and unclosed
  const remainingTrades = loadTrades();
  return remainingTrades.some(t => !t.result && !t.pending);
}

// =========================================================================
// 🛡️ OPPOSITE M15 FRACTAL FAKEOUT PROTECTION (STOCHASTIC 18,12,25 INSTRUMENTS)
// If trade retraces immediately after entry and an M15 fractal draws on the opposite
// side of the trade while in negative PnL, exit immediately to prevent hitting full -$2.50 SL.
// =========================================================================
async function checkOppositeFractalFakeoutExit(m15Candles, currentPrice) {
  const isStoch18Profile = 
    PROFILE.stochParams?.k === 18 && 
    PROFILE.stochParams?.d === 12 && 
    (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" ||
     STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES");

  if (!isStoch18Profile || !m15Candles || m15Candles.length < 5) return;

  let trades = loadTrades();
  const openTrades = trades.filter(t => !t.result && !t.pending && !closingContracts.has(t.contractId));
  if (openTrades.length === 0) return;

  for (const openTrade of openTrades) {
    if (!openTrade.contractId) continue;
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);

    // Only triggers if trade is retracing in loss (floating loss, price adverse to entry)
    const isRetracing = isBuy ? (currentPrice < openTrade.entry && pnl < 0) : (currentPrice > openTrade.entry && pnl < 0);

    // Look for opposing M15 fractal formed after trade entry
    const oppFractal = findNewOpposingFractalM15(m15Candles, openTrade.direction, openTrade.entryEpoch);
    if (!oppFractal) continue;

    // Tag opposing fractal on the trade record
    openTrade.opposingM15Fractal = oppFractal;
    saveTrades(trades);

    if (!isRetracing) continue;

    // Confirmed Fakeout: Opposite M15 fractal drawn while trade is retracing in loss
    console.log(`[FAKEOUT PROTECTION] 🚨 ${SYMBOL} Trade #${openTrade.contractId} (${openTrade.direction}) Fakeout detected!`);
    console.log(`  • Entry: ${Number(openTrade.entry).toFixed(4)} at epoch ${openTrade.entryEpoch}`);
    console.log(`  • Current Price: ${currentPrice.toFixed(4)} (PnL: $${pnl.toFixed(2)})`);
    console.log(`  • Opposing M15 Fractal: ${oppFractal.type} at ${oppFractal.price.toFixed(4)} (epoch ${oppFractal.epoch})`);
    console.log(`  • Action: Executing early exit to prevent full -$2.50 SL hit.`);

    closingContracts.add(openTrade.contractId);
    let serverPnl = pnl, resultSource = "fakeout_exit_fallback";
    try {
      const closeRes = await closeContract(openTrade.contractId);
      if (closeRes && !closeRes.error) {
        serverPnl = closeRes.sell?.profit ?? pnl;
        resultSource = "server_close_confirmed";
      }
    } catch (e) {
      closingContracts.delete(openTrade.contractId);
      continue;
    }

    openTrade.result = "LOSS";
    openTrade.resultSource = resultSource;
    openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
    openTrade.serverPnl = serverPnl;

    state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
    // Disarm setup upon fakeout exit to require a fresh key level re-test or fresh indicator reset
    state.armed = null;
    state.armedEpoch = null;
    state.armedTime = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
    // v75_emaTouched preserved across trade exits per user specification
    state.v75_1s_emaTouched_BUY = false;
    state.v75_1s_emaTouched_SELL = false;
    state.v100_1s_armed = false;
    state.v100_1s_armDir = null;
    state.latchStoch533_BUY = false;
    state.latchStoch533_SELL = false;
    state.latchFib_BUY = false;
    state.latchFib_SELL = false;
    state.latchCci_BUY = false;
    state.latchCci_SELL = false;
    state.latchStoch_BUY = false;
    state.latchStoch_SELL = false;
    state.rescueStochArmed = false;

    saveTrades(trades);
    saveState();
    closingContracts.delete(openTrade.contractId);

    const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
    await sendTelegram(
      `🛡️ *${REPO_LABEL} — OPPOSITE M15 FRACTAL FAKEOUT EXIT* 🛡️\n\n` +
      `Direction: ${openTrade.direction}\n` +
      `📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n` +
      `🏁 Early Exit: ${currentPrice.toFixed(4)}\n` +
      `🛑 Avoided SL: -$2.50 Full Barrier\n\n` +
      `💵 P&L: *-$${Math.abs(serverPnl).toFixed(2)}* (Capped Loss)\n` +
      `Reason: Opposite M15 ${oppFractal.type} Fractal formed at ${oppFractal.price.toFixed(4)} while retracing. Structural fakeout confirmed.\n` +
      `Duration: ${formatDuration(durationMs)}\n` +
      `Daily Net Total: $${state.dailyNetPnl.toFixed(2)}\n` +
      `Contract: \`${openTrade.contractId}\``
    );
  }
}

// =========================================================================
// 🚑 LOSS RECOVERY / RESCUE ENTRY ENGINE (FOR STOCH 50 MIDLINE INSTRUMENTS)
// =========================================================================
async function checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch) {
  // Early trade recovery applies EXCLUSIVELY to instruments utilizing Stochastic (18, 12, 25)
  const isStoch18Profile = 
    PROFILE.stochParams?.k === 18 && 
    PROFILE.stochParams?.d === 12 && 
    (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
     STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" ||
     STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES");
  
  if (!isStoch18Profile) return;

  let trades = loadTrades();
  const openTrades = trades.filter(t => !t.result && !t.pending);
  const parentTrade = openTrades.find(t => !t.isRescue);

  if (!parentTrade || !parentTrade.contractId) {
    state.rescueStochArmed = false;
    return;
  }

  // Verify that no rescue trade is already active for this parent trade
  const existingRescue = openTrades.find(t => t.isRescue && (t.parentId === parentTrade.id || t.parentContractId === parentTrade.contractId));
  if (existingRescue) {
    return;
  }

  // Must be in floating loss
  const parentPnl = calcUnrealizedPnL(parentTrade, currentPrice);
  if (parentPnl >= 0) {
    state.rescueStochArmed = false;
    return;
  }

  const si = candles.length - 2;

  // 1. Fast Stoch (5,3,3) Extreme Retracement & Level Crossing Trigger
  // For BUY: retrace to 20 level and cross > 20
  // For SELL: retrace to 80 level and cross < 80
  const stoch533 = calculateStoch(candles, 5, 3, 3);
  const sK533 = stoch533.k[si], sD533 = stoch533.d[si], prevK533 = stoch533.k[si - 1], prevD533 = stoch533.d[si - 1];
  if (sK533 === null || prevK533 === null) return;

  let stoch533Cross = false;
  if (parentTrade.direction === "BUY") {
    if (prevK533 <= 20.0 || sK533 <= 20.0) state.rescueStochArmed = true;
    stoch533Cross = (prevK533 <= 20.0 && sK533 > 20.0) || (state.rescueStochArmed && sK533 > 20.0);
  } else if (parentTrade.direction === "SELL") {
    if (prevK533 >= 80.0 || sK533 >= 80.0) state.rescueStochArmed = true;
    stoch533Cross = (prevK533 >= 80.0 && sK533 < 80.0) || (state.rescueStochArmed && sK533 < 80.0);
  }

  if (!stoch533Cross) {
    return;
  }

  // 2. Main Stochastic Indicator %K vs %D Directional Alignment
  // The bot can only enter a trade recovery if %K is below %D for a SELL and %K is above %D for a BUY on the Main Stoch
  const mainStochParams = PROFILE.stochParams || { k: 18, d: 12, slowing: 25 };
  const mainStoch = calculateStoch(candles, mainStochParams.k, mainStochParams.d, mainStochParams.slowing, mainStochParams.method || "Simple");
  const mainK = mainStoch.k[si], mainD = mainStoch.d[si];
  if (mainK === null || mainD === null) return;

  const mainStochAligned = parentTrade.direction === "BUY" ? mainK > mainD : mainK < mainD;
  if (!mainStochAligned) {
    console.log(`[RESCUE ENGINE] ${SYMBOL} Fast Stoch (5,3,3) triggered, but Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}) is not aligned: %K ${mainK.toFixed(1)} vs %D ${mainD.toFixed(1)} (Requires ${parentTrade.direction === "BUY" ? "%K > %D" : "%K < %D"}). Rescue gated.`);
    return;
  }

  console.log(`[RESCUE ENGINE] 🚨 All conditions satisfied for ${SYMBOL} Loss Recovery / Rescue Entry!`);
  console.log(`  • Parent Trade: #${parentTrade.contractId} (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)}, PnL: $${parentPnl.toFixed(2)})`);
  console.log(`  • Fast Stoch (5,3,3) Trigger: CONFIRMED (%K: ${sK533.toFixed(1)}, prev: ${prevK533.toFixed(1)})`);
  console.log(`  • Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}) Alignment: CONFIRMED (%K: ${mainK.toFixed(1)} ${parentTrade.direction === "BUY" ? ">" : "<"} %D: ${mainD.toFixed(1)})`);

  const direction = parentTrade.direction;
  const entry = currentPrice;
  const sl = parentTrade.sl; // Inherited opposite M15 fractal recorded when the old trade was placed
  const fibTpPrice = parentTrade.fibTpPrice; // Same TP target as old trade
  const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

  const pendingRescueRecord = {
    id: `${SYMBOL}-RESCUE-${Date.now()}`,
    contractId: null,
    pending: true,
    repo: REPO_LABEL,
    symbol: SYMBOL,
    direction,
    entry,
    sl,
    rr: null,
    entryType: "RESCUE_ENTRY_STOCH533",
    brokerSlAmount: STAKE_USD,
    lots: CTRADER_LOT_SIZE,
    executionMode: EXECUTION_MODE,
    entryEpoch: m5BoundaryEpoch,
    fractalSl: parentTrade.fractalSl || parentTrade.sl,
    fractalEpoch: null,
    fractalTimeframe: parentTrade.fractalTimeframe || "M15",
    m30FractalUpgraded: false,
    fibTpPrice,
    keyLevel: parentTrade.keyLevel || null,
    openTime: timeFormatted,
    closeTime: null,
    result: null,
    isRescue: true,
    is_ctrader: EXECUTION_MODE === "ctrader",
    parentId: parentTrade.id,
    parentContractId: parentTrade.contractId
  };

  trades.push(pendingRescueRecord);
  saveTrades(trades);

  const rescueMessage = 
    `🚑 *${SYMBOL_NAME.toUpperCase()} — LOSS RECOVERY / RESCUE ENTRY* 🚑\n\n` +
    `Direction: *${dirEmoji}*\n` +
    `Setup: *Loss Recovery (Fast Stoch 5,3,3 Cross + Main Stoch %K/%D Alignment)*\n` +
    `📍 Rescue Entry: *${entry.toFixed(4)}*\n` +
    `🛑 Stop Loss: *${Number(sl).toFixed(4)}* (Inherited from Parent Trade)\n` +
    `🎯 Take Profit: *${fibTpPrice ? Number(fibTpPrice).toFixed(4) : "Parent TP Target"}*\n` +
    `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n\n` +
    `🔗 *Parent Trade Reference:*\n` +
    `• Parent Contract: \`${parentTrade.contractId}\` (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)})\n` +
    `• Floating Loss at Rescue: *$${parentPnl.toFixed(2)}*\n` +
    `• Fast Stoch (5,3,3): *%K ${sK533.toFixed(1)}* (${direction === "BUY" ? "> 20 Cross" : "< 80 Cross"})\n` +
    `• Main Stoch (${mainStochParams.k},${mainStochParams.d},${mainStochParams.slowing}): *%K ${mainK.toFixed(1)}* ${direction === "BUY" ? ">" : "<"} *%D ${mainD.toFixed(1)}* (*Validated*)\n` +
    `• Strategy: *When price retraces to ${Number(parentTrade.entry).toFixed(4)}, parent trade will close at >= +$0.20 while this rescue position runs to TP.*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ Time (UTC): ${timeFormatted}`;

  try {
    const contractId = await executeTrade(direction, { slPrice: sl, fibTpPrice });
    if (!contractId) {
      trades.splice(trades.findIndex(t => t.id === pendingRescueRecord.id), 1);
      saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Rescue entry triggered, but broker returned no contract ID. Aborted.`);
      return;
    }
    pendingRescueRecord.contractId = contractId;
    pendingRescueRecord.pending = false;
    saveTrades(trades);

    state.rescueStochArmed = false;
    saveState();

    await sendTelegram(rescueMessage);
  } catch (execErr) {
    trades.splice(trades.findIndex(t => t.id === pendingRescueRecord.id), 1);
    saveTrades(trades);
    await sendTelegram(`❌ *${REPO_LABEL}* — Rescue entry live execution failed: ${execErr.message}`);
  }
}

// ==================== SLOW PATH (RUNS ON CLOSED M5 CANDLE) ====================
async function runSlowPathScan(m5BoundaryEpoch) {
  console.log(`[${REPO_LABEL}] Scanning closed M5 candle: ${new Date(m5BoundaryEpoch * 1000).toISOString()}`);
  state.lastProcessedEpoch = m5BoundaryEpoch;
  saveState();
  let trades = loadTrades();

  // Daily UTC Rollover Reset for Target Cap & PnL Accumulator
  const todayStr = new Date(m5BoundaryEpoch * 1000).toISOString().split("T")[0];
  if (!state.currentDayDate || state.currentDayDate !== todayStr) {
    console.log(`[DAILY ROLLOVER] New UTC Day detected (${todayStr}). Resetting daily net PnL, target lock, and daily key level touch state.`);
    state.currentDayDate = todayStr;
    state.dailyTargetDate = todayStr;
    state.dailyTargetReached = false;
    state.dailyNetPnl = 0;
    state.dailyKeyLevelTouchedToday = false;
    // Disarm previous calendar day setups to eliminate outdated or irrelevant signals
    state.armed = null;
    state.armedEpoch = null;
    state.armedTime = null;
    state.confirm = null;
    state.nextPhase = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
    saveState();
  }

  // Note: Daily target check safely positioned before new signal evaluation to ensure open positions are managed
  
  try {
    // 1. Gateway Portfolio Sync
    const allPortfolio = await getOpenPortfolio();
    const allLiveIdSet = new Set((Array.isArray(allPortfolio) ? allPortfolio : []).map(c => String(c.contract_id || c.id || c.contractId)));
    const liveContracts = (Array.isArray(allPortfolio) ? allPortfolio : []).filter(c => getContractSymbol(c).toUpperCase() === TRADING_SYMBOL.toUpperCase());
    
    for (const live of liveContracts) {
      if (!trades.find(t => String(t.contractId) === String(live.contract_id))) {
        const entryPrice = live.buy_price ? parseFloat(live.buy_price) : await fetchCurrentSpotPrice(); 
        const dir = (live.contract_type === "MULTUP" || (live.shortcode && live.shortcode.startsWith("MULTUP"))) ? "BUY" : "SELL";
        trades.push({
          id: `${SYMBOL}-${Date.now()}`, contractId: live.contract_id, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
          direction: dir, entry: entryPrice, sl: deriveHardStopPrice(entryPrice, dir, live.lots || CTRADER_LOT_SIZE), rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
          lots: live.lots || CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
          entryEpoch: live.date_start, fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false, fibTpPrice: null, keyLevel: null,
          openTime: new Date((live.date_start || Math.floor(Date.now() / 1000)) * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
        });
        await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted unmanaged live contract \`${live.contract_id}\` (${dir}).`);
      }
    }
    
    for (const t of trades.filter(t => !t.result && t.contractId)) {
      // Strict Check: Only reconcile as closed if contract is absent from the ENTIRE broker portfolio (all symbols)
      const isStillInBrokerPortfolio = allLiveIdSet.has(String(t.contractId));
      if (!isStillInBrokerPortfolio && !closingContracts.has(t.contractId)) {
        const rec = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
        if (rec && typeof rec.profit === "number") {
          t.result = rec.profit >= 0 ? "WIN" : "LOSS"; t.serverPnl = rec.profit; t.resultSource = "server_history_verified";
          t.closeTime = new Date(rec.sellTime * 1000).toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + rec.profit;
          if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
            state.dailyTargetReached = true;
            state.dailyTargetDate = todayStr;
          }
          await sendTelegram(`${t.result === "WIN" ? "✅" : "❌"} *${REPO_LABEL} — Trade ${t.result} (Broker Native Exit)*\n\n💵 P&L: *${rec.profit >= 0 ? `+$${rec.profit.toFixed(2)}` : `-$${Math.abs(rec.profit).toFixed(2)}`}*`);
        } else {
          // Fallback: Contract is confirmed closed on Deriv (absent from entire broker portfolio). Reconcile to unblock execution gate.
          t.result = "CLOSED_EXTERNAL";
          t.serverPnl = 0;
          t.resultSource = "server_portfolio_reconciled";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          console.log(`[PORTFOLIO SYNC] Contract ${t.contractId} no longer in portfolio. Reconciled as CLOSED_EXTERNAL to unblock bot.`);
        }
      }
    }
    saveTrades(trades);
    saveState();
  } catch (e) { dbg("Portfolio sync skipped:", e.message); }

  // 2. Fetch Market Candles
  let scanData;
  try {
    scanData = await fetchAllData();
  } catch (e) {
    console.error(`[${REPO_LABEL}] fetchAllData error: ${e.message}`);
    return;
  }
  const { m5: candles, m15: m15Candles, m30: m30Candles, d1: d1Candles } = scanData;

  if (!candles || candles.length < 120 || !m15Candles || !m30Candles || !d1Candles) {
    console.warn(`[${REPO_LABEL}] Incomplete candle set: m5=${candles?.length || 0}, m15=${m15Candles?.length || 0}, m30=${m30Candles?.length || 0}, d1=${d1Candles?.length || 0}`);
    return;
  }
  const si = candles.length - 2; 
  const currentPrice = parseFloat(candles[si].close);
  state.symbol = SYMBOL;
  state.currentPrice = currentPrice;
  state.lastPriceUpdate = new Date().toISOString();

  // 3. Calculate Daily Fibonacci Grid Levels & Open Bias
  const fib = computeDailyFibLevels(d1Candles);
  if (!fib) return;

  const newBiasPrice = parseFloat(fib.dailyBiasPrice.toFixed(4));
  if (state.dailyBiasPrice !== null && state.dailyBiasPrice !== newBiasPrice) {
    dbg(`[ROLLOVER] Updating daily bias to ${newBiasPrice}. Keeping active setups intact.`);
    state.dailyBiasPrice = newBiasPrice;
  } else if (state.dailyBiasPrice === null) {
    state.dailyBiasPrice = newBiasPrice;
  }

  state.fibBullish = fib.bullish; state.fib0 = parseFloat(fib.fib0.toFixed(4)); state.fib50 = parseFloat(fib.fib50.toFixed(4));
  state.fib618 = parseFloat(fib.fib1618?.toFixed(4) || 0); state.fib79 = parseFloat(fib.fib79.toFixed(4)); state.fib100 = parseFloat(fib.fib100.toFixed(4));
  state.h1TdiDir = fib.bullish ? "BULL" : "BEAR";

  const prevM15 = m15Candles[m15Candles.length - 3];
  const currM15 = m15Candles[m15Candles.length - 2];
  const prevM15Close = parseFloat(prevM15.close);
  const m15Close     = parseFloat(currM15.close);
  const m15Open      = parseFloat(currM15.open);

  // 4. Calculate Technical Indicators Based on Active Instrument Architecture
  const cci = calculateCCI(candles, PROFILE.cciPeriod || 100);
  const stochParams = PROFILE.stochParams || { k: 18, d: 12, slowing: 25 };
  const stoch = calculateStoch(candles, stochParams.k, stochParams.d, stochParams.slowing, stochParams.method || "Simple");
  const envParams = PROFILE.envParams || { period: 50, devPct: 0.05 };
  const env = calculateEnvelopes(candles, envParams.period, envParams.devPct);

  // EMA 100 & EMA 200 for Trend Filters & Active Exits
  const ema100 = calculateEMA(candles, 100);
  const ema200 = calculateEMA(candles, 200);
  const currentEma100 = ema100[si];
  const currentEma200 = ema200[si];

  // Indicators for V100 1s Trend & Re-Entry Architecture
  const stoch200 = calculateStoch(candles, 200, 1, 1);
  const macd2575 = calculateMACD(candles, 25, 75, 1);
  const stoch1558 = calculateStoch(candles, 15, 5, 8);

  const sK200 = stoch200.k[si], prevK200 = stoch200.k[si - 1];
  const macdVal = macd2575.macd[si], prevMacdVal = macd2575.macd[si - 1];
  const sK15 = stoch1558.k[si], prevK15 = stoch1558.k[si - 1];

  // Stoch (15,2,5) for Volatility 100 (R_100 Milk Machine)
  const stoch1525 = calculateStoch(candles, 15, 2, 5);
  const sK1525 = stoch1525.k[si], sD1525 = stoch1525.d[si], prevK1525 = stoch1525.k[si - 1], prevD1525 = stoch1525.d[si - 1];

  // Secondary Fast Stoch (5,3,3) for backward compatibility
  const stoch533 = calculateStoch(candles, 5, 3, 3);
  const sK533 = stoch533.k[si], sD533 = stoch533.d[si], prevK533 = stoch533.k[si - 1], prevD533 = stoch533.d[si - 1];

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];

  if (STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
    if (sK200 === null || prevK200 === null || macdVal === null || sK533 === null || prevK533 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    if (sK200 === null || prevK200 === null || macdVal === null || sK533 === null || prevK533 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
    if (sK200 === null || prevK200 === null || sK1525 === null || prevK1525 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    if (sK === null || prevK === null || cVal === null || prevCci === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else {
    if (sK === null || sD === null || prevK === null || prevD === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  }

  // 5. Manage Structure & Early Exits on Active Trades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    // =========================================================================
    // 🏆 DYNAMIC TREND-RIDER & STOCH 50 MOMENTUM EXHAUSTION EXIT (STRICTLY IN PROFIT)
    // =========================================================================
    const isBuy = t.direction === "BUY";
    const currentPnl = calcUnrealizedPnL(t, currentPrice);
    const inProfitExhaustion = (currentPnl > 0.00 || t.trendRidingActive);
    if (inProfitExhaustion) {
      const isCciInstrument = (
        STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || 
        STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || 
        STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || 
        STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || 
        SYMBOL === "R_25" || 
        SYMBOL === "R_50"
      );

      let trendExhausted = false;
      let exhaustionDetail = "";

      if (isCciInstrument) {
        // CCI Level 0 Adverse Invalidation for CCI Instruments (V50, V25)
        const cciExhausted = isBuy ? (cVal !== null && cVal <= 0.0) : (cVal !== null && cVal >= 0.0);
        if (cciExhausted) {
          trendExhausted = true;
          exhaustionDetail = `M5 CCI (${cVal !== null ? cVal.toFixed(1) : 0}) crossed ${isBuy ? "<= 0.0 baseline" : ">= 0.0 baseline"}`;
        }
      } else {
        // Standardized Auxiliary Stochastic (15, 2, 5) Level 50 Midline Adverse Cross
        // Applies to all Stoch instruments: V75, V75-1s, V100, V100-1s, V10
        const stoch1525Exhausted = isBuy ? (sK1525 !== null && sK1525 <= 50.0) : (sK1525 !== null && sK1525 >= 50.0);
        if (stoch1525Exhausted) {
          trendExhausted = true;
          exhaustionDetail = `M5 Aux Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : 50}) crossed ${isBuy ? "<= 50.0 midline" : ">= 50.0 midline"}`;
        }
      }

      if (trendExhausted) {
        closingContracts.add(t.contractId);
        console.log(`[TREND-RIDER EXIT] Active ${t.direction} #${t.contractId}: ${exhaustionDetail}. Current PnL: +${currentPnl.toFixed(2)}. Liquidating to bank extended trend gains.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[TREND-RIDER EXIT ERROR] Broker close failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(currentPnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
            state.dailyTargetReached = true;
            state.dailyTargetDate = todayStr;
          }
          saveTrades(trades);
          saveState();
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(
            `🏆 *${REPO_LABEL} — Trend-Rider Momentum Exhaustion Exit*\n\n` +
            `Active *${t.direction}* banked extended trend profit: *${pnlStr}*!\n` +
            `• ${exhaustionDetail}\n` +
            `• Exit Price: *${currentPrice.toFixed(4)}*\n` +
            `• Daily Net Total: *${state.dailyNetPnl.toFixed(2)}*\n` +
            `Contract: \`${t.contractId}\``
          );
        } catch (e) {
          console.error(`[TREND-RIDER EXIT EXCEPTION] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Fractal SL Market Structure Break (Evaluated strictly on M15 Candle Close)
    const isM15CloseBoundary = m5BoundaryEpoch % 900 === 0;
    if (t.sl && isM15CloseBoundary) {
      const isBuy = t.direction === "BUY";
      const structureBroken = isBuy ? m15Close < t.sl : m15Close > t.sl;
      if (structureBroken) {
        closingContracts.add(t.contractId);
        console.log(`[STRUCTURE] M15 candle closed at ${m15Close.toFixed(4)} breaking ${t.fractalTimeframe || "M15"} fractal SL ${t.sl.toFixed(4)}. Exiting.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[STRUCTURE ERROR] Failed to close contract ${t.contractId} on broker: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, m15Close);
          t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — ${t.fractalTimeframe || "M15"} Structure Break*\n\nM15 Candle closed at *${m15Close.toFixed(4)}* breaking fractal SL *${t.sl.toFixed(4)}*.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[STRUCTURE] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V100_STOCH200_STOCH15 (Volatility 100 Milk Machine)
    if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
      const isBuy = t.direction === "BUY";
      const m5Close = parseFloat(candles[si].close);

      // Early Exit 1: Stoch (15,2,5) Crossing Level 50 in Opposite Direction
      const stoch15OppositeCross = isBuy
        ? (sK1525 !== null && prevK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0)
        : (sK1525 !== null && prevK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0);

      // Early Exit 2: Opposite M5 Fractal Cross
      // For BUY trade: M5 candle closes below recent M5 swing low (support) or opposite fractal
      // For SELL trade: M5 candle closes above recent M5 swing high (resistance) or opposite fractal
      const fracAnchor = t.m5Fractal || (isBuy ? findRecentFractalBelow(candles, si, t.entry) : findRecentFractalAbove(candles, si, t.entry));
      const m5FractalCrossed = isBuy
        ? (fracAnchor !== null && m5Close < fracAnchor)
        : (fracAnchor !== null && m5Close > fracAnchor);

      // Early Exit 3: Entry-Hour H1 Candle Closed Against Position
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      // Whichever early exit triggers first closes the trade immediately
      let earlyExitTriggered = false;
      let earlyExitType = "";
      let earlyExitDesc = "";

      if (stoch15OppositeCross) {
        earlyExitTriggered = true;
        earlyExitType = "Stoch (15,2,5) Opposite Level 50 Cross Exit";
        earlyExitDesc = `M5 Stoch (15,2,5) %K crossed Level 50 in opposite direction (%K: ${sK1525 !== null ? sK1525.toFixed(2) : "N/A"}, prev: ${prevK1525 !== null ? prevK1525.toFixed(2) : "N/A"})`;
      } else if (m5FractalCrossed) {
        earlyExitTriggered = true;
        earlyExitType = "Opposite M5 Fractal Cross Exit";
        earlyExitDesc = `M5 candle closed at ${m5Close.toFixed(4)} crossing opposite M5 fractal (${fracAnchor !== null ? fracAnchor.toFixed(4) : "N/A"})`;
      } else if (h1ClosedAgainst) {
        earlyExitTriggered = true;
        earlyExitType = "Entry-Hour H1 Adverse Close Exit";
        earlyExitDesc = `Entry hour H1 closed adverse (H1 Open: ${h1OpenPrice !== null ? h1OpenPrice.toFixed(4) : "N/A"}, H1 Close: ${m5Close.toFixed(4)})`;
      }

      if (earlyExitTriggered) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY EXIT] Active ${t.direction} trade: ${earlyExitDesc}. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[EARLY EXIT ERROR] Failed to close contract ${t.contractId} on broker: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, currentPrice);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(
            `${icon} *${REPO_LABEL} — ${earlyExitType}*\n\n` +
            `Active *${t.direction}* closed at *${m5Close.toFixed(4)}*.\n` +
            `• ${earlyExitDesc}\n` +
            `💵 Final P&L: *${pnlStr}*\n` +
            `Contract: \`${t.contractId}\``
          );
        } catch (e) {
          console.error(`[EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V100_1S_TREND_MACD_STOCH
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      const isBuy = t.direction === "BUY";

      // Early Invalidation #1: 3 Consecutive M5 Candles Closed Against Position Immediately After Entry
      let adverseCandleCount = 0;
      for (let ci = si; ci >= 0; ci--) {
        const cEpoch = candles[ci].epoch;
        if (cEpoch < t.entryEpoch) break;
        const cOpen = parseFloat(candles[ci].open);
        const cClose = parseFloat(candles[ci].close);
        const isAdverse = isBuy ? (cClose < cOpen) : (cClose > cOpen);
        if (isAdverse) {
          adverseCandleCount++;
        } else {
          break; // Must be consecutive
        }
      }

      if (adverseCandleCount >= 3) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY INVALIDATION] 3 consecutive M5 candles closed against ${t.direction} position. Exiting immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[EARLY INVALIDATION ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, currentPrice);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — 3 Adverse M5 Candles Invalidation*\n\n3 consecutive M5 candles closed against ${t.direction} position.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[EARLY INVALIDATION] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }

      // Early Invalidation #2: M5 Stoch 200 Crosses Adverse to Position Confirmed on M5 Close
      if (sK200 !== null) {
        const stoch200Adverse = isBuy ? (sK200 < 50.0) : (sK200 > 50.0);
        if (stoch200Adverse) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH 200 EXIT] M5 Stoch 200 crossed ${isBuy ? "below" : "above"} 50.0 (${sK200.toFixed(1)}). Invalidation exit triggered.`);
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error(`[STOCH 200 EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
              closingContracts.delete(t.contractId);
              continue;
            }
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            const pnl = calcUnrealizedPnL(t, currentPrice);
            t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
            t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(`${icon} *${REPO_LABEL} — Stoch 200 Adverse Invalidation*\n\nM5 Stoch 200 crossed *${isBuy ? "below" : "above"} 50.0* (${sK200.toFixed(1)}) on M5 close.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 200 EXIT] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Early Invalidation #3: Stoch (5,3,3) crosses Level 50 in opposite direction and trade is in loss
      const pnl = calcUnrealizedPnL(t, currentPrice);
      if (sK533 !== null && pnl < 0) {
        const stoch533Adverse = isBuy ? (sK533 < 50.0) : (sK533 > 50.0);
        if (stoch533Adverse) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH 533 LEVEL 50 LOSS EXIT] Active ${t.direction} in loss ($${pnl.toFixed(2)}): Stoch (5,3,3) %K crossed Level 50 in opposite direction (${sK533.toFixed(1)}). Liquidating immediately.`);
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error(`[STOCH 533 LEVEL 50 LOSS EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
              closingContracts.delete(t.contractId);
              continue;
            }
            const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
            t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
            t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
            t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
            t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
            state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
            saveTrades(trades);
            saveState();
            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(`${icon} *${REPO_LABEL} — Stoch (5,3,3) Midline Loss Exit*\n\nStoch (5,3,3) %K crossed *Level 50 in opposite direction* (${sK533.toFixed(1)}) while in floating loss.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 533 LEVEL 50 LOSS EXIT] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Early Invalidation #4: Entry-Hour H1 Adverse Close Exit
      const m5Close = parseFloat(candles[si].close);
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      if (h1ClosedAgainst) {
        closingContracts.add(t.contractId);
        console.log(`[H1 ADVERSE CLOSE EXIT] Entry-hour H1 candle closed adverse to ${t.direction} position. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[H1 ADVERSE CLOSE EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, currentPrice);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — Entry-Hour H1 Adverse Close Exit*\n\nEntry hour H1 closed adverse (H1 Open: *${h1OpenPrice.toFixed(4)}*, Close: *${m5Close.toFixed(4)}*).\n💵 Final P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[H1 ADVERSE CLOSE EXIT] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V75_EMA_STOCH15 (V75 4-Condition Structural Retracement Model)
    if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    // V75 4-Condition Structural Retracement & Breakout Model (Trader Rules Oct 17 2026)
    const ema100Above200 = currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200;
    const ema100Below200 = currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200;
    const currCandle = candles[si];
    const low = parseFloat(currCandle.low), high = parseFloat(currCandle.high);
    // True Retracement Touch Verification:
    // A candle MUST physically intersect the EMA 100 line (Low <= EMA 100 AND High >= EMA 100) to arm a retracement setup.
    let recentTouchBuy = false;
    let recentTouchSell = false;
    const lookbackLimit = Math.max(0, si - 30);
    for (let k = si; k >= lookbackLimit; k--) {
      if (state.lastTriggeredEpoch && candles[k].epoch <= state.lastTriggeredEpoch) break;
      const cLow = parseFloat(candles[k].low), cHigh = parseFloat(candles[k].high);
      const e100 = ema100[k];
      if (e100 !== null) {
        // Physical EMA 100 Intersection: Candle low <= EMA 100 AND Candle high >= EMA 100
        const candleTouchesEma = cLow <= e100 && cHigh >= e100;
        if (candleTouchesEma) {
          recentTouchBuy = true;
          recentTouchSell = true;
        }
      }
    }

    if (recentTouchBuy) {
      state.v75_emaTouched_BUY = true;
      state.ema100BuyArmed = true;
      if (!state.armed || state.armed.dir !== "BUY") {
        state.armed = { dir: "BUY", lbl: `V75 EMA 100 Retrace (BUY Armed @ ${currentEma100 ? currentEma100.toFixed(2) : "EMA100"})`, lvl: currentEma100 };
        if (!state.armedEpoch) {
          state.armedEpoch = m5BoundaryEpoch;
          state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        }
      }
    }

    if (recentTouchSell) {
      state.v75_emaTouched_SELL = true;
      state.ema100SellArmed = true;
      if (!state.armed || state.armed.dir !== "SELL") {
        state.armed = { dir: "SELL", lbl: `V75 EMA 100 Retrace (SELL Armed @ ${currentEma100 ? currentEma100.toFixed(2) : "EMA100"})`, lvl: currentEma100 };
        if (!state.armedEpoch) {
          state.armedEpoch = m5BoundaryEpoch;
          state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        }
      }
    }

    const emaTouched = state.v75_emaTouched_BUY || state.v75_emaTouched_SELL;
    const trendDir = ema100Above200 ? "BUY" : ema100Below200 ? "SELL" : (currentPrice > currentEma100 ? "BUY" : "SELL");
    state.keyLevelTouched = emaTouched;
    state.levelTouched = emaTouched ? `EMA 100 Touch (${trendDir})` : null;
    state.nextPhase = `${trendDir} Trend (EMA 100 ${ema100Above200 ? ">" : "<"} 200)` + (emaTouched ? " [EMA Retrace Touched - ARMED]" : " [Awaiting Retrace Touch]");
  } else if (STRATEGY_PROFILE !== "PROFILE_V50_STOCH200_CCI150" && STRATEGY_PROFILE !== "PROFILE_V25_STOCH200_CCI100" && STRATEGY_PROFILE !== "PROFILE_V100_STOCH200_STOCH15" && STRATEGY_PROFILE !== "PROFILE_V100_1S_TREND_MACD_STOCH" && STRATEGY_PROFILE !== "PROFILE_V75_1S_TREND_MACD_STOCH533" && STRATEGY_PROFILE !== "PROFILE_V10_TREND_MACD_STOCH533") {
    state.armed = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
    state.nextPhase = "Monitoring Strategy Signals";
  }

  // ── B. QUANTITATIVE STRATEGY DISPATCHER & CONFLUENCE ENGINE ──
  // Universal Daily Fibonacci Grid for Take Profit Target Calculations
  const keyLevels = [
    { lvl: fib.fib0,    name: "0%" },
    ...(PROFILE.excludeFib50 ? [] : [{ lvl: fib.fib50, name: "50%" }]),
    { lvl: fib.fib79,   name: "79%" },
    { lvl: fib.fib100,  name: "100%" },
    { lvl: fib.fibM50,  name: "-50%" },
    { lvl: fib.fib1618, name: "161.8%" }
  ];

  let indicatorsSatisfied = false;
  let signalDirection = "";
  let setupLabel = "";

  // 1. UNIFIED V75 MIDLINE FRACTAL ENGINE (Legacy V75 Profile)
  if (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL") {
    
    // Stoch (18,12,25) Level 50 Midline Crossover (Handbook Section 5 Core Mandate #4)
    const stoch50CrossUp = prevK <= 50.0 && sK > 50.0;
    const stoch50CrossDown = prevK >= 50.0 && sK < 50.0;

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch50CrossUp) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch50CrossDown) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }
  // 1.5 VOLATILITY 75 (R_75) 4-CONDITION STRUCTURAL RETRACEMENT MODEL
  else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    /*
     VERBATIM TRADER RULES (OCTOBER 17 2026 @ 18:18 UTC):
     1. Bot should NOT sell when price is above EMA 100.
     2. Bot should NOT buy when price is below EMA 100.
     3. Initial BUY: Price > EMA 100 & 200 + fresh Stoch %K cross > 80.
     4. Initial SELL: Price < EMA 100 & 200 + fresh Stoch %K cross < 20.
     5. Retrace BUY: EMA 100 touched + fresh Stoch %K cross > 20 + Price closes > EMA 100.
     6. Retrace SELL: EMA 100 touched + fresh Stoch %K cross < 80 + Price closes < EMA 100.
    */
    const currCandle = candles[si];
    const cClose = parseFloat(currCandle.close);

    const isAboveBothEma = currentEma100 !== null && currentEma200 !== null && currentPrice > currentEma100 && currentPrice > currentEma200 && cClose > currentEma100 && cClose > currentEma200;
    const isBelowBothEma = currentEma100 !== null && currentEma200 !== null && currentPrice < currentEma100 && currentPrice < currentEma200 && cClose < currentEma100 && cClose < currentEma200;

    // 1. Level Boundary Crosses (Level 20 and Level 80)
    const stochLevelCrossUp80 = prevK !== null && sK !== null && prevK <= 80.0 && sK > 80.0;
    const stochLevelCrossDown20 = prevK !== null && sK !== null && prevK >= 20.0 && sK < 20.0;
    const stochLevelCrossUp20 = prevK !== null && sK !== null && prevK <= 20.0 && sK > 20.0;
    const stochLevelCrossDown80 = prevK !== null && sK !== null && prevK >= 80.0 && sK < 80.0;

    // 2. Signal Line (%K / %D) Bullish / Bearish Crosses in Extreme Zones (<=25 Oversold / >=75 Overbought)
    const stochKdCrossUpOversold = prevK !== null && sK !== null && prevD !== null && sD !== null && prevK <= prevD && sK > sD && sK <= 30.0;
    const stochKdCrossDownOverbought = prevK !== null && sK !== null && prevD !== null && sD !== null && prevK >= prevD && sK < sD && sK >= 70.0;

    // Combined Fresh Stochastic Trigger Conditions (Level Cross OR %K/%D Signal Line Cross)
    const stochCrossUp80 = stochLevelCrossUp80;
    const stochCrossDown20 = stochLevelCrossDown20;
    const stochCrossUp20 = stochLevelCrossUp20 || stochKdCrossUpOversold;
    const stochCrossDown80 = stochLevelCrossDown80 || stochKdCrossDownOverbought;

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime);

    // Initial Entries (Breakout / Strong Momentum Continuation)
    if (isAboveBothEma && stochCrossUp80 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_INITIAL_BREAKOUT_STOCH80 (BUY)";
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    } else if (isBelowBothEma && stochCrossDown20 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_INITIAL_BREAKOUT_STOCH20 (SELL)";
      state.v75_emaTouched_SELL = false;
      state.ema100SellArmed = false;
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    }
    // Retracement Entries (EMA 100 Touch + Fresh Stoch Level Cross + Price Close Confirmation)
    else if (state.v75_emaTouched_BUY && stochCrossUp20 && cClose > currentEma100 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_RETRACE_EMA100_STOCH20 (BUY)";
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    } else if (state.v75_emaTouched_SELL && stochCrossDown80 && cClose < currentEma100 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_RETRACE_EMA100_STOCH80 (SELL)";
      state.v75_emaTouched_SELL = false;
      state.ema100SellArmed = false;
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    }
  }

    // 2. VOLATILITY 100 (R_100) M5 STOCH 200 (48/52) & M5 STOCH (15,2,5) ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
    // Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (Levels 48 and 52 Hysteresis Band)
    // - Crossing strictly above 52.0 arms BUY trend.
    // - Crossing strictly below 48.0 arms SELL trend.
    // - Hysteresis: Stays armed BUY as long as sK200 >= 48.0; stays armed SELL as long as sK200 <= 52.0.
    const stoch200FreshBuyArm = prevK200 !== null && sK200 !== null && sK200 > 52.0 && (prevK200 <= 52.0 || state.v100_trendDir !== "BUY");
    const stoch200FreshSellArm = prevK200 !== null && sK200 !== null && sK200 < 48.0 && (prevK200 >= 48.0 || state.v100_trendDir !== "SELL");

    if (stoch200FreshBuyArm) {
      state.v100_trendDir = "BUY";
      state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
      state.v100_stoch200Armed = true;
      state.v100_initialEntryDone = false; // Fresh trend wave: initial entry unlocked
      dbg(`[V100 TREND] Stoch 200 crossed above 52.0 (%K: ${sK200.toFixed(2)}). BUY ARMED.`);
    } else if (stoch200FreshSellArm) {
      state.v100_trendDir = "SELL";
      state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
      state.v100_stoch200Armed = true;
      state.v100_initialEntryDone = false; // Fresh trend wave: initial entry unlocked
      dbg(`[V100 TREND] Stoch 200 crossed below 48.0 (%K: ${sK200.toFixed(2)}). SELL ARMED.`);
    } else if (sK200 !== null) {
      // Dynamic Dealignment Check:
      // If trend is BUY but sK200 drops below 48.0 -> Dealignment from BUY, immediately flips to SELL!
      if (state.v100_trendDir === "BUY" && sK200 < 48.0) {
        state.v100_trendDir = "SELL";
        state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
        state.v100_stoch200Armed = true;
        state.v100_initialEntryDone = false;
        dbg(`[V100 DEALIGN] Stoch 200 dropped below 48.0 (%K: ${sK200.toFixed(2)}). BUY dealigned -> SELL armed.`);
      } else if (state.v100_trendDir === "SELL" && sK200 > 52.0) {
        // If trend is SELL but sK200 rises above 52.0 -> Dealignment from SELL, immediately flips to BUY!
        state.v100_trendDir = "BUY";
        state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
        state.v100_stoch200Armed = true;
        state.v100_initialEntryDone = false;
        dbg(`[V100 DEALIGN] Stoch 200 rose above 52.0 (%K: ${sK200.toFixed(2)}). SELL dealigned -> BUY armed.`);
      } else if (!state.v100_trendDir) {
        // Initialize on startup/restart
        if (sK200 >= 50.0) {
          state.v100_trendDir = "BUY";
          state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
          state.v100_stoch200Armed = true;
        } else {
          state.v100_trendDir = "SELL";
          state.v100_stoch200CrossEpoch = m5BoundaryEpoch;
          state.v100_stoch200Armed = true;
        }
      }
    }

    // Condition 2: M5 Stoch (15,2,5) Levels 20, 50, 80
    const stoch15CrossUp50 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0;
    const stoch15CrossDown50 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0;

    if (stoch15CrossUp50) {
      state.v100_stoch15_50_crossEpoch = m5BoundaryEpoch;
      state.v100_stoch15_50_crossDir = "BUY";
    } else if (stoch15CrossDown50) {
      state.v100_stoch15_50_crossEpoch = m5BoundaryEpoch;
      state.v100_stoch15_50_crossDir = "SELL";
    }

    // Stoch 15 Dealignment:
    if (state.v100_stoch15_50_crossDir === "BUY" && sK1525 !== null && sK1525 < 50.0) {
      state.v100_stoch15_50_crossDir = null;
      state.v100_stoch15_50_crossEpoch = null;
    } else if (state.v100_stoch15_50_crossDir === "SELL" && sK1525 !== null && sK1525 > 50.0) {
      state.v100_stoch15_50_crossDir = null;
      state.v100_stoch15_50_crossEpoch = null;
    }

    const noActiveTrades = openTrades.length === 0;

    // 1. Initial Entry Trigger:
    // Unbounded: 600s limit removed. Initial entry stays open as long as Stochastic 200 remains armed without dealignment.
    // "Once one of them crosses, it waits for the next indicator to cross unless there is a dealignment."
    const stoch200AlignedBuy = state.v100_trendDir === "BUY" && sK200 !== null && sK200 >= 48.0;
    const stoch200AlignedSell = state.v100_trendDir === "SELL" && sK200 !== null && sK200 <= 52.0;

    const isInitialBuy = 
      noActiveTrades &&
      !state.v100_initialEntryDone &&
      stoch200AlignedBuy &&
      (
        stoch15CrossUp50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 UP
        (stoch200FreshBuyArm && state.v100_stoch15_50_crossDir === "BUY" && sK1525 !== null && sK1525 >= 50.0) // Stoch 15 crossed 50 UP first; Stoch 200 freshly arms BUY
      );

    const isInitialSell = 
      noActiveTrades &&
      !state.v100_initialEntryDone &&
      stoch200AlignedSell &&
      (
        stoch15CrossDown50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 DOWN
        (stoch200FreshSellArm && state.v100_stoch15_50_crossDir === "SELL" && sK1525 !== null && sK1525 <= 50.0) // Stoch 15 crossed 50 DOWN first; Stoch 200 freshly arms SELL
      );

    // 2. Re-Entry Rule:
    // If Stoch 200 is already armed and aligned for Buy or Sell and there is NO existing open trade,
    // enter immediately when Stoch (15,2,5) freshly crosses level 20 for Buy or level 80 for Sell in trend direction.
    const stoch15FreshCross20Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 20.0 && sK1525 > 20.0;
    const stoch15FreshCross80Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 80.0 && sK1525 < 80.0;

    const isReentryBuy = noActiveTrades && stoch200AlignedBuy && stoch15FreshCross20Buy;
    const isReentrySell = noActiveTrades && stoch200AlignedSell && stoch15FreshCross80Sell;

    if (stoch200AlignedBuy) {
      state.armed = { dir: "BUY", lbl: "V100 Stoch200 > 52 (BUY Armed)", lvl: currentPrice };
      if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
      state.nextPhase = "V100 BUY Trend Armed — Awaiting Stoch 15 Cross";
    } else if (stoch200AlignedSell) {
      state.armed = { dir: "SELL", lbl: "V100 Stoch200 < 48 (SELL Armed)", lvl: currentPrice };
      if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
      state.nextPhase = "V100 SELL Trend Armed — Awaiting Stoch 15 Cross";
    } else if (!state.armed) {
      state.armed = null; state.armedEpoch = null; state.armedTime = null;
    }

    if (isInitialBuy || isReentryBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = isInitialBuy ? "V100_INITIAL_STOCH200_STOCH15 (BUY)" : "V100_REENTRY_STOCH15_20 (BUY)";
      if (isInitialBuy) {
        state.v100_initialEntryDone = true;
      }
    } else if (isInitialSell || isReentrySell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = isInitialSell ? "V100_INITIAL_STOCH200_STOCH15 (SELL)" : "V100_REENTRY_STOCH15_80 (SELL)";
      if (isInitialSell) {
        state.v100_initialEntryDone = true;
      }
    }
  }
  // 3. VOLATILITY 100 (1s) MACRO TREND STOCH 200, MACD (25,75,1), EMA 100 & FAST STOCH (5,3,3) RE-ENTRY ENGINE
  // 3. VOLATILITY 100 (1s) MACRO TREND STOCH 200, MACD (25,75,1), EMA 100 & FAST STOCH (5,3,3) RE-ENTRY ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    // 1. Trend & Baseline Alignments
    const stoch200AlignedBuy = sK200 !== null && sK200 >= 50.0;
    const stoch200AlignedSell = sK200 !== null && sK200 <= 50.0;
    const macdAlignedBuy = macdVal !== null && macdVal >= 0.0;
    const macdAlignedSell = macdVal !== null && macdVal <= 0.0;
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    // Cross events
    const stoch200CrossUp50 = prevK200 !== null && sK200 !== null && prevK200 <= 50.0 && sK200 > 50.0;
    const stoch200CrossDown50 = prevK200 !== null && sK200 !== null && prevK200 >= 50.0 && sK200 < 50.0;
    const macdCrossUpZero = prevMacdVal !== null && macdVal !== null && prevMacdVal <= 0.0 && macdVal > 0.0;
    const macdCrossDownZero = prevMacdVal !== null && macdVal !== null && prevMacdVal >= 0.0 && macdVal < 0.0;

    // State Tracking & Arming (No timer window; stays armed until dealignment)
    if (stoch200CrossUp50) state.v100_1s_stochArmedBuy = true;
    if (stoch200CrossDown50) state.v100_1s_stochArmedSell = true;
    if (macdCrossUpZero) state.v100_1s_macdArmedBuy = true;
    if (macdCrossDownZero) state.v100_1s_macdArmedSell = true;

    // Dealignment checks: if an indicator breaks its threshold, immediately disarm
    if (!stoch200AlignedBuy) { state.v100_1s_stochArmedBuy = false; state.v100_1s_initialBuyDone = false; }
    if (!stoch200AlignedSell) { state.v100_1s_stochArmedSell = false; state.v100_1s_initialSellDone = false; }
    if (!macdAlignedBuy) { state.v100_1s_macdArmedBuy = false; }
    if (!macdAlignedSell) { state.v100_1s_macdArmedSell = false; }

    const bothBuyArmed = stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy && (state.v100_1s_stochArmedBuy || stoch200CrossUp50) && (state.v100_1s_macdArmedBuy || macdCrossUpZero);
    const bothSellArmed = stoch200AlignedSell && macdAlignedSell && emaBaselineSell && (state.v100_1s_stochArmedSell || stoch200CrossDown50) && (state.v100_1s_macdArmedSell || macdCrossDownZero);
    const hasFreshBuyEvent = stoch200CrossUp50 || macdCrossUpZero;
    const hasFreshSellEvent = stoch200CrossDown50 || macdCrossDownZero;

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime);

    // Initial BUY Trigger
    if (bothBuyArmed && hasFreshBuyEvent && !state.v100_1s_initialBuyDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch200CrossUp50 && macdCrossUpZero) ? "V100_1S_INITIAL_TREND_SIMULTANEOUS (BUY)" : "V100_1S_INITIAL_TREND (BUY)";
      state.v100_1s_initialBuyDone = true;
      state.v100_1s_stochArmedBuy = false;
      state.v100_1s_macdArmedBuy = false;
    }
    // Initial SELL Trigger
    else if (bothSellArmed && hasFreshSellEvent && !state.v100_1s_initialSellDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch200CrossDown50 && macdCrossDownZero) ? "V100_1S_INITIAL_TREND_SIMULTANEOUS (SELL)" : "V100_1S_INITIAL_TREND (SELL)";
      state.v100_1s_initialSellDone = true;
      state.v100_1s_stochArmedSell = false;
      state.v100_1s_macdArmedSell = false;
    }
    // Rule 2: Pullback Re-Entry Trigger on Fast Stoch (5,3,3) Level 20/80 Cross
    else if (prevK533 !== null && sK533 !== null && prevK533 <= 20.0 && sK533 > 20.0 && stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V100_1S_REENTRY_STOCH533 (BUY)";
    }
    else if (prevK533 !== null && sK533 !== null && prevK533 >= 80.0 && sK533 < 80.0 && stoch200AlignedSell && macdAlignedSell && emaBaselineSell && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V100_1S_REENTRY_STOCH533 (SELL)";
    }

    // State Tracking for Dashboard Telemetry
    state.v100_1s_trend = stoch200AlignedBuy ? "BULLISH" : (stoch200AlignedSell ? "BEARISH" : "NEUTRAL");
    state.v100_1s_macd = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
    state.v100_1s_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
    state.v100_1s_stoch200 = sK200 !== null ? parseFloat(sK200.toFixed(1)) : null;
    state.v100_1s_stoch533 = sK533 !== null ? parseFloat(sK533.toFixed(1)) : null;
    state.v100_1s_stoch15 = state.v100_1s_stoch533; // Backward-compatibility mapping

    // Determine Fib TP target from key levels grid
    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 3.5 VOLATILITY 75 (1s) & VOLATILITY 10 ENGINE (EXACTLY 2 ENTRY RULES: INITIAL EMA 100 BREAKOUT & SUBSEQUENT STOCH 15,2,5)
  else if (STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
    const isV10 = SYMBOL === "R_10";
    const prefix = isV10 ? "V10" : "V75_1S";

    const currCandle = candles[si];
    const prevCandle = candles[si - 1];
    const cClose = parseFloat(currCandle.close);
    const prevClose = parseFloat(prevCandle.close);
    const prevEma100 = ema100[si - 1];

    // Mandatory Hard Baseline Filters
    const emaBaselineBuy = currentEma100 !== null && cClose > currentEma100;
    const emaBaselineSell = currentEma100 !== null && cClose < currentEma100;

    const macdAlignedBuy = macdVal !== null && macdVal >= 0.0;
    const macdAlignedSell = macdVal !== null && macdVal <= 0.0;

    // RULE 1: Initial Entry — Fresh EMA 100 Breakout Cross
    const freshEmaCrossUp = prevEma100 !== null && currentEma100 !== null && prevClose <= prevEma100 && cClose > currentEma100;
    const freshEmaCrossDown = prevEma100 !== null && currentEma100 !== null && prevClose >= prevEma100 && cClose < currentEma100;

    // RULE 2: Subsequent Entry — Fresh Stochastic (15,2,5 Simple) Crossover
    const stoch15CrossUp20 = (prevK1525 !== null && sK1525 !== null && prevK1525 <= 20.0 && sK1525 > 20.0) || (prevK1525 !== null && sK1525 !== null && prevD1525 !== null && sD1525 !== null && prevK1525 <= prevD1525 && sK1525 > sD1525 && sK1525 <= 30.0);
    const stoch15CrossDown80 = (prevK1525 !== null && sK1525 !== null && prevK1525 >= 80.0 && sK1525 < 80.0) || (prevK1525 !== null && sK1525 !== null && prevD1525 !== null && sD1525 !== null && prevK1525 >= prevD1525 && sK1525 < sD1525 && sK1525 >= 70.0);

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime);

    // BUY EXECUTION: Initial EMA 100 Breakout OR Subsequent Stoch (15,2,5) Re-entry (Filtered by close > EMA 100 & MACD >= 0)
    if (noActiveTrades && emaBaselineBuy && macdAlignedBuy) {
      if (freshEmaCrossUp) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = `${prefix}_INITIAL_EMA100_BREAKOUT (BUY)`;
      } else if (stoch15CrossUp20) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = `${prefix}_SUBSEQUENT_STOCH15 (BUY)`;
      }
    }
    // SELL EXECUTION: Initial EMA 100 Breakout OR Subsequent Stoch (15,2,5) Re-entry (Filtered by close < EMA 100 & MACD <= 0)
    else if (noActiveTrades && emaBaselineSell && macdAlignedSell) {
      if (freshEmaCrossDown) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = `${prefix}_INITIAL_EMA100_BREAKOUT (SELL)`;
      } else if (stoch15CrossDown80) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = `${prefix}_SUBSEQUENT_STOCH15 (SELL)`;
      }
    }

    // State Tracking for Dashboard Telemetry
    state.v75_1s_trend = (currentEma100 !== null && cClose > currentEma100) ? "BULLISH" : "BEARISH";
    state.v75_1s_macd = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
    state.v75_1s_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
    state.v75_1s_stoch15 = sK1525 !== null ? parseFloat(sK1525.toFixed(1)) : null;

    // Determine Fib TP target from Daily Fibonacci Grid
    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }

  // 4. VOLATILITY 25 (R_25) M5 STOCH (200,1,1) MAIN TREND + M5 CCI 100 EXECUTION ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V25_EMA_STOCH15") {
    // Condition 1: M5 Stoch (200,1,1) Level 50 Gate
    const stoch200CrossUp50 = prevK !== null && prevK <= 50.0 && sK > 50.0;
    const stoch200CrossDown50 = prevK !== null && prevK >= 50.0 && sK < 50.0;
    const stoch200AlignedBuy = sK !== null && sK >= 50.0;
    const stoch200AlignedSell = sK !== null && sK <= 50.0;

    // Condition 2: M5 CCI 100 Zero-Line Cross Trigger
    const cciCrossUpZero = prevCci !== null && prevCci <= 0.0 && cVal > 0.0;
    const cciCrossDownZero = prevCci !== null && prevCci >= 0.0 && cVal < 0.0;
    const cciAlignedBuy = cVal !== null && cVal >= 0.0;
    const cciAlignedSell = cVal !== null && cVal <= 0.0;

    // State Tracking & Arming (No timer window; stays armed until dealignment)
    if (stoch200CrossUp50) state.v25_stochArmedBuy = true;
    if (stoch200CrossDown50) state.v25_stochArmedSell = true;
    if (cciCrossUpZero) state.v25_cciArmedBuy = true;
    if (cciCrossDownZero) state.v25_cciArmedSell = true;

    // Dealignment checks: if an indicator breaks its threshold, immediately disarm
    if (!stoch200AlignedBuy) { state.v25_stochArmedBuy = false; state.v25_initialBuyDone = false; }
    if (!stoch200AlignedSell) { state.v25_stochArmedSell = false; state.v25_initialSellDone = false; }
    if (!cciAlignedBuy) { state.v25_cciArmedBuy = false; }
    if (!cciAlignedSell) { state.v25_cciArmedSell = false; }

    const bothBuyAligned = stoch200AlignedBuy && cciAlignedBuy && (state.v25_stochArmedBuy || stoch200CrossUp50) && (state.v25_cciArmedBuy || cciCrossUpZero);
    const bothSellAligned = stoch200AlignedSell && cciAlignedSell && (state.v25_stochArmedSell || stoch200CrossDown50) && (state.v25_cciArmedSell || cciCrossDownZero);
    const hasFreshBuyEvent = stoch200CrossUp50 || cciCrossUpZero;
    const hasFreshSellEvent = stoch200CrossDown50 || cciCrossDownZero;

    const noActiveTrades = !trades.some(t => !t.result);

    if (bothBuyAligned && hasFreshBuyEvent && !state.v25_initialBuyDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch200CrossUp50 && cciCrossUpZero) ? "V25_STOCH200_CCI100_SIMULTANEOUS (BUY)" : "V25_STOCH200_CCI100 (BUY)";
      state.v25_initialBuyDone = true;
      state.v25_stochArmedBuy = false;
      state.v25_cciArmedBuy = false;
    } else if (bothSellAligned && hasFreshSellEvent && !state.v25_initialSellDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch200CrossDown50 && cciCrossDownZero) ? "V25_STOCH200_CCI100_SIMULTANEOUS (SELL)" : "V25_STOCH200_CCI100 (SELL)";
      state.v25_initialSellDone = true;
      state.v25_stochArmedSell = false;
      state.v25_cciArmedSell = false;
    }

    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 5. VOLATILITY 50 (R_50) M5 STOCH (200,1,1) MAIN TREND + M5 CCI 150 EXECUTION ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    // Condition 1: M5 Stoch (200,1,1) Level 50 Gate
    const stoch200CrossUp50 = prevK !== null && prevK <= 50.0 && sK > 50.0;
    const stoch200CrossDown50 = prevK !== null && prevK >= 50.0 && sK < 50.0;
    const stoch200AlignedBuy = sK !== null && sK >= 50.0;
    const stoch200AlignedSell = sK !== null && sK <= 50.0;

    // Condition 2: M5 CCI 150 Zero-Line Cross Trigger
    const cciCrossUpZero = prevCci !== null && prevCci <= 0.0 && cVal > 0.0;
    const cciCrossDownZero = prevCci !== null && prevCci >= 0.0 && cVal < 0.0;
    const cciAlignedBuy = cVal !== null && cVal >= 0.0;
    const cciAlignedSell = cVal !== null && cVal <= 0.0;

    // State Tracking & Arming (No timer window; stays armed until dealignment)
    if (stoch200CrossUp50) state.v50_stochArmedBuy = true;
    if (stoch200CrossDown50) state.v50_stochArmedSell = true;
    if (cciCrossUpZero) state.v50_cciArmedBuy = true;
    if (cciCrossDownZero) state.v50_cciArmedSell = true;

    // Dealignment checks: if an indicator breaks its threshold, immediately disarm
    if (!stoch200AlignedBuy) { state.v50_stochArmedBuy = false; state.v50_initialBuyDone = false; }
    if (!stoch200AlignedSell) { state.v50_stochArmedSell = false; state.v50_initialSellDone = false; }
    if (!cciAlignedBuy) { state.v50_cciArmedBuy = false; }
    if (!cciAlignedSell) { state.v50_cciArmedSell = false; }

    const bothBuyAligned = stoch200AlignedBuy && cciAlignedBuy && (state.v50_stochArmedBuy || stoch200CrossUp50) && (state.v50_cciArmedBuy || cciCrossUpZero);
    const bothSellAligned = stoch200AlignedSell && cciAlignedSell && (state.v50_stochArmedSell || stoch200CrossDown50) && (state.v50_cciArmedSell || cciCrossDownZero);
    const hasFreshBuyEvent = stoch200CrossUp50 || cciCrossUpZero;
    const hasFreshSellEvent = stoch200CrossDown50 || cciCrossDownZero;

    const noActiveTrades = !trades.some(t => !t.result);

    if (bothBuyAligned && hasFreshBuyEvent && !state.v50_initialBuyDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch200CrossUp50 && cciCrossUpZero) ? "V50_STOCH200_CCI150_SIMULTANEOUS (BUY)" : "V50_STOCH200_CCI150 (BUY)";
      state.v50_initialBuyDone = true;
      state.v50_stochArmedBuy = false;
      state.v50_cciArmedBuy = false;
    } else if (bothSellAligned && hasFreshSellEvent && !state.v50_initialSellDone && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch200CrossDown50 && cciCrossDownZero) ? "V50_STOCH200_CCI150_SIMULTANEOUS (SELL)" : "V50_STOCH200_CCI150 (SELL)";
      state.v50_initialSellDone = true;
      state.v50_stochArmedSell = false;
      state.v50_cciArmedSell = false;
    }

    if (indicatorsSatisfied) {
      const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
      if (signalDirection === "BUY") {
        const higher = sortedLevels.filter(l => l > currentPrice);
        calculatedFibTp = higher.length > 0 ? higher[0] : null;
      } else if (signalDirection === "SELL") {
        const lower = sortedLevels.filter(l => l < currentPrice);
        calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
      }
    }
  }
  // 6. GENERAL / LEGACY CONFLUENCE FALLBACK
  else {
    const crossUp = prevK <= prevD && sK > sD;
    const crossDown = prevK >= prevD && sK < sD;
    const crossedAbove50 = prevK < 50 && sK >= 50;
    const crossedBelow50 = prevK > 50 && sK <= 50;
    const envAligned = (currentPrice > eUp && state.armed?.dir === "BUY") || (currentPrice < eLo && state.armed?.dir === "SELL");

    if (state.armed) {
      if (state.armed.dir === "BUY" && (crossUp || crossedAbove50)) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = setupLabel || `ARMED_BUY_TRIGGER (${state.armed.lbl || "Stoch Cross"})`;
      } else if (state.armed.dir === "SELL" && (crossDown || crossedBelow50)) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = setupLabel || `ARMED_SELL_TRIGGER (${state.armed.lbl || "Stoch Cross"})`;
      }
    }
  }

  // Calculate Fibonacci Target TP Level from Daily Grid
  let calculatedFibTp = null;
  if (indicatorsSatisfied && signalDirection && keyLevels && keyLevels.length > 0) {
    const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(v => typeof v === "number" && !isNaN(v)))).sort((a, b) => a - b);
    if (signalDirection === "BUY") {
      const higher = sortedLevels.filter(l => l > currentPrice);
      calculatedFibTp = higher.length > 0 ? higher[0] : null;
    } else if (signalDirection === "SELL") {
      const lower = sortedLevels.filter(l => l < currentPrice);
      calculatedFibTp = lower.length > 0 ? lower[lower.length - 1] : null;
    }
  }

  // ── C. TRIGGER EXECUTION GATE & CONTRACT CREATION ──
  let signalTriggered = false;
  let direction = signalDirection;
  let entryType = setupLabel || "STRATEGY_EXECUTION";

  if (indicatorsSatisfied && direction) {
    signalTriggered = true;
    state.lastTriggeredSetup = entryType;
    state.lastTriggeredEpoch = m5BoundaryEpoch;
    state.v100_1s_armed = false;
    state.v100_1s_armDir = null;
    state.v75_1s_emaTouched_BUY = false;
    state.v75_1s_emaTouched_SELL = false;
    state.v75_emaTouched_BUY = false;
    state.v75_emaTouched_SELL = false;
    state.latchStoch533_BUY = false;
    state.latchStoch533_SELL = false;
    state.latchCci_BUY = false;
    state.latchCci_SELL = false;
    state.latchStoch_BUY = false;
    state.latchStoch_SELL = false;
  }

  if (signalTriggered) {
    // Just-In-Time Execution Gate: If opposing contract is active, flip position; if same direction, gate
    trades = loadTrades();
    const activeTrade = trades.find(t => !t.result);
    if (activeTrade) {
      if (activeTrade.direction !== direction) {
        console.log(`[POSITION FLIP] Reversal signal ${entryType} (${direction}) confirmed while opposing contract ${activeTrade.contractId} (${activeTrade.direction}) is active. Liquidating opposing trade immediately.`);
        closingContracts.add(activeTrade.contractId);
        try {
          const closeRes = await closeContract(activeTrade.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[POSITION FLIP ERROR] Failed to close opposing contract ${activeTrade.contractId} on broker: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(activeTrade.contractId);
            return;
          }
          const settled = await getContractProfitFromHistory(activeTrade.contractId, activeTrade.entryEpoch);
          const pnl = calcUnrealizedPnL(activeTrade, currentPrice);
          activeTrade.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          activeTrade.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
          activeTrade.result = activeTrade.serverPnl >= 0 ? "WIN" : "LOSS";
          activeTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + activeTrade.serverPnl;
          saveTrades(trades);
          saveState();
        } catch (e) {
          console.error(`[POSITION FLIP] Error closing opposing contract ${activeTrade.contractId}:`, e.message);
        }
        closingContracts.delete(activeTrade.contractId);
      } else {
        console.log(`[EXECUTION GATED] Signal ${entryType} confirmed, but contract ${activeTrade.contractId} (${activeTrade.direction}) is active in same direction. Maintaining active trade.`);
        state.lastProcessedEpoch = m5BoundaryEpoch;
        saveState();
        return;
      }
    }
    const entry = currentPrice;

    // Daily Fibonacci Target TP Level with $4.00 Minimum Floor Enforcement
    let fibTpPrice = calculatedFibTp || null;
    let calibratedMinPts = MIN_TP_POINTS_FLOOR;
    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const dollarTpPrice = EXECUTION_MODE === "ctrader"
      ? (direction === "BUY" ? entry + (requiredRawPnl / CTRADER_LOT_SIZE) : entry - (requiredRawPnl / CTRADER_LOT_SIZE))
      : (direction === "BUY" ? entry * (1 + requiredRawPnl / (STAKE_USD * MULTIPLIER)) : entry * (1 - requiredRawPnl / (STAKE_USD * MULTIPLIER)));
    const pointsTpPrice = direction === "BUY" ? entry + calibratedMinPts : entry - calibratedMinPts;

    const minRequiredTp = direction === "BUY" ? Math.max(pointsTpPrice, dollarTpPrice) : Math.min(pointsTpPrice, dollarTpPrice);

    if (!fibTpPrice || (direction === "BUY" && minRequiredTp > fibTpPrice)) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    } else if (direction === "SELL" && minRequiredTp < fibTpPrice) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    }

    const tpPrice = fibTpPrice;

    // Initial Stop Loss Anchor: Previous M15 / M5 Institutional Fractal Capped at $2.50 SL
    let initialM15Fractal = findRecentFractalM15(m15Candles, direction);
    let initialM5Fractal = direction === "BUY"
      ? findRecentFractalBelow(candles, si, entry)
      : findRecentFractalAbove(candles, si, entry);
    const hardStopPrice = deriveHardStopPrice(entry, direction, CTRADER_LOT_SIZE); // -$5.00 broker hard stop
    
    // Calculate maximum initial Stop Loss price capped by configured Software SL (-$3.50 for V25, -$2.50 standard)
    const reqPnlSoft = SOFTWARE_SL_USD + COMMISSION_USD;
    const slCapPrice = EXECUTION_MODE === "ctrader"
      ? (direction === "BUY" ? entry + (reqPnlSoft / CTRADER_LOT_SIZE) : entry - (reqPnlSoft / CTRADER_LOT_SIZE))
      : (direction === "BUY" ? entry * (1 + reqPnlSoft / (STAKE_USD * MULTIPLIER)) : entry * (1 - reqPnlSoft / (STAKE_USD * MULTIPLIER)));

    let sl;
    if (PROFILE.slType === "HARD_POINTS") {
      sl = hardStopPrice;
    } else if (PROFILE.slType === "M5_FRACTAL") {
      if (direction === "BUY") {
        sl = (initialM5Fractal && initialM5Fractal > slCapPrice && initialM5Fractal < entry) ? initialM5Fractal : slCapPrice;
      } else {
        sl = (initialM5Fractal && initialM5Fractal < slCapPrice && initialM5Fractal > entry) ? initialM5Fractal : slCapPrice;
      }
    } else {
      if (direction === "BUY") {
        // Use M15 Fractal ONLY IF it is tighter than Software SL price cap
        sl = (initialM15Fractal && initialM15Fractal > slCapPrice && initialM15Fractal < entry) ? initialM15Fractal : slCapPrice;
      } else {
        sl = (initialM15Fractal && initialM15Fractal < slCapPrice && initialM15Fractal > entry) ? initialM15Fractal : slCapPrice;
      }
    }

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

    // Build Dynamic Confluence Verification Lines Matching Exact Instrument Strategy Profile
    let confluenceLines = `• Gate Engine: *${GATE_TYPE}*\n`;
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      confluenceLines += `• M5 Stoch 200: *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 MACD (25,75,1): *${(macdVal !== null ? macdVal.toFixed(4) : "N/A")}* (${direction === "BUY" ? ">0 [BULLISH MOMENTUM]" : "<0 [BEARISH MOMENTUM]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Fast Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Pullback Exit" : "<80 Pullback Exit"})\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Adverse M5 Closes / Stoch 200 Invalidation / Stoch 533 Midline Exit*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      confluenceLines += `• M5 EMA 100 vs 200: *EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) ${direction === "BUY" ? ">" : "<"} EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})* [${direction === "BUY" ? "UPTREND" : "DOWNTREND"}]\n` +
                         `• M5 EMA Retracement: *EMA 100/200 Touch Verified* [LATCHED]\n` +
                         `• M5 Stoch (15,2,5 Simple): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">%D Oversold Cross (<=25)" : "<%D Overbought Cross (>=75)"} [TRIGGERED])\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(2)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Stop)\n` +
                         `• Early Exit Engine: *Loss Protection (%K/%D Cross) / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
      confluenceLines += `• M5 Stoch 200: *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 MACD (25,75,1): *${(macdVal !== null ? macdVal.toFixed(4) : "N/A")}* (${direction === "BUY" ? ">0 [BULLISH MOMENTUM]" : "<0 [BEARISH MOMENTUM]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Oversold Cross" : "<80 Overbought Cross"} [TRIGGERED])\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Consecutive Adverse M5 Closes / Stoch 200 / Stoch (5,3,3) Loss Exit*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
      confluenceLines += `• M5 Stoch 200 (48/52): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">48 [BULLISH TREND]" : "<52 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• Early Exits: *Stoch (15,2,5) Opposite Lvl 50 / Opposite M5 Fractal / Entry-Hour H1 Adverse Close*\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH ARMED]" : "<50 [BEARISH ARMED]"})\n` +
                         `• M5 CCI 100 Trigger: *${(cVal !== null ? cVal.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">0 Cross [TRIGGERED]" : "<0 Cross [TRIGGERED]"})\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Loss Protection — Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break*\n`;
    } else {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH ARMED]" : "<50 [BEARISH ARMED]"})\n` +
                         `• M5 CCI 150 Trigger: *${(cVal !== null ? cVal.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">0 Cross [TRIGGERED]" : "<0 Cross [TRIGGERED]"})\n` +
                         `• Trigger Mode: *${setupLabel || "STANDARD"}*\n` +
                         `• Take Profit Target: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Loss Protection — Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break*\n`;
    }
    confluenceLines += `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)}*`;

    const message = 
      `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Strategy Profile: *${STRATEGY_PROFILE}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (${initialM5Fractal ? "M5 Fractal Anchor" : (initialM15Fractal ? "M15 Fractal Anchor" : "Hard Stop Barrier")})\n` +
      `🎯 Take Profit: *${tpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n\n` +
      `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n\n` +
      `📐 *Technical Confluence Verification:*\n` +
      confluenceLines + `\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
      entryEpoch: m5BoundaryEpoch, purchaseTimeEpoch: m5BoundaryEpoch, purchase_time: m5BoundaryEpoch,
      fractalSl: initialM5Fractal || initialM15Fractal,
      fractalEpoch: null,
      fractalTimeframe: initialM5Fractal ? "M5" : (initialM15Fractal ? "M15" : null),
      m5Fractal: initialM5Fractal,
      m30FractalUpgraded: false, tpPrice, fibTpPrice: tpPrice,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    saveTrades(trades);

    try {
      const contractId = await executeTrade(direction, { slPrice: sl, fibTpPrice: tpPrice, tpPrice });
      if (!contractId) {
        trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
        await sendTelegram(`❌ *${REPO_LABEL}* — Signal triggered, but broker returned no contract ID. Aborted.`);
      } else {
        pendingTradeRecord.contractId = contractId;
        pendingTradeRecord.pending = false;
        saveTrades(trades);
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.confirm = null;
        state.nextPhase = null;
        await sendTelegram(message);
      }
    } catch (execErr) {
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Live execution failed: ${execErr.message}`);
    }
  }

  state.lastProcessedEpoch = m5BoundaryEpoch; saveState();
}

// ==================== 24/7 CONTINUOUS ENGINE ====================
async function checkTelegramCommands() {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    const offset = (state.lastTgUpdateId || 0) + 1;
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=10&timeout=0`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;
    for (const update of data.result) {
      state.lastTgUpdateId = update.update_id;
      const text = update.message?.text?.trim()?.toLowerCase();
      if (text === "/status") {
        const t = loadTrades().filter(x => !x.result && !x.pending);
        const reply = t.length ? `📍 *Active Trades:*\n` + t.map(x => `• ${x.symbol || SYMBOL} ${x.direction} @ ${Number(x.entry).toFixed(4)} (SL: ${Number(x.sl).toFixed(4)})`).join("\n") : `⚪ No open trades.`;
        await sendTelegram(reply);
      }
    }
    saveState();
  } catch (e) {}
}

export async function startContinuousEngine() {
  console.log(`[${REPO_LABEL}] 🚀 24/7 Continuous Master Trading Engine Initialized.`);
  console.log(`[${REPO_LABEL}] ⚙️ Profile: ${STRATEGY_PROFILE} | Mode: ${EXECUTION_MODE.toUpperCase()} (${EXECUTION_MODE === "ctrader" ? `${CTRADER_LOT_SIZE} lots (equiv ${MULTIPLIER}x)` : `${MULTIPLIER}x`})`);
  console.log(`[${REPO_LABEL}] 🛡️ Risk Settings: Software SL: $${SOFTWARE_SL_USD.toFixed(2)} | Hard SL: -$5.00 | TP Floor: $${TARGET_MIN_PROFIT.toFixed(2)}`);
  
  setInterval(checkTelegramCommands, 15000);

  let isScanning = false;

  // Immediate Initial Scan on Startup: Resolve market structure and arm state immediately
  try {
    const initEpoch = Math.floor(Date.now() / 1000);
    const initM5Boundary = initEpoch - (initEpoch % 300);
    console.log(`[${REPO_LABEL}] 🔄 Executing initial startup slow-path scan to resolve market state...`);
    isScanning = true;
    await runSlowPathScan(initM5Boundary);
    isScanning = false;
  } catch (initErr) {
    console.error(`[${REPO_LABEL}] Initial Startup Scan Warning:`, initErr.message);
    isScanning = false;
  }

  while (true) {
    let hasOpenTrade = false;
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      const currentM5Boundary = nowEpoch - (nowEpoch % 300);

      hasOpenTrade = await manageOpenTradesFastPath();

      // Ensure spot price is refreshed periodically in state.json even if no open trades
      if (!state.currentPrice || !state.lastPriceUpdate || (Date.now() - new Date(state.lastPriceUpdate).getTime() > 30000)) {
        try {
          const freshPrice = await fetchCurrentSpotPrice();
          if (freshPrice > 0) {
            state.symbol = SYMBOL;
            state.currentPrice = freshPrice;
            state.lastPriceUpdate = new Date().toISOString();
            saveState();
          }
        } catch (e) {
          dbg(`Periodic spot fetch skipped: ${e.message}`);
        }
      }

      const secondsIntoCandle = nowEpoch % 300;
      if (currentM5Boundary > (state.lastProcessedEpoch || 0) && secondsIntoCandle >= 3 && !isScanning) {
        isScanning = true;
        await runSlowPathScan(currentM5Boundary);
        isScanning = false;
      }
    } catch (err) {
      console.error(`[${REPO_LABEL}] Engine Loop Error:`, err.message);
      isScanning = false;
    }

    // Adaptive Risk Pulse: 2 seconds when managing an active live trade, 3 seconds when idle
    await sleep(hasOpenTrade ? 2000 : 3000);
  }
}

// ==================== EXECUTION HOOK ====================
(async () => {
  await startContinuousEngine();
})();
