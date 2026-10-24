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
    lotSize: 0.01,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_EMA_STOCH15",
    gateType: "EMA_STOCH15_RETRACEMENT",
    stochParams: { k: 15, d: 2, slowing: 5, method: "Simple", levels: [20, 50, 80] },
    emaPeriod: 100,
    minTakeProfitPoints: 400.0,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 250.0,
    slType: "M15_FRACTAL",
    notes: "Initial Entry: Condition 1 Price crosses above/below EMA 100 & EMA 200 -> Condition 2 Fresh M5 Stoch (15,2,5 Simple) %K cross > 50 (BUY) or < 50 (SELL); invalid if already beyond 50. Retracement Entry: Condition 1 Price physically touches EMA 100 -> Condition 2 Fresh Stoch %K cross > 20 with close > EMA 100 (BUY) or < 80 with close < EMA 100 (SELL)."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    lotSize: 0.05,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_1S_STOCH100_STOCH30",
    gateType: "STOCH100_STOCH30_EMA100_STOCH15",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch30Params: { k: 30, d: 2, slowing: 5, method: "Simple", level: 50 },
    emaPeriod: 100,
    auxStochParams: { k: 15, d: 2, slowing: 5, method: "Simple", levels: [20, 80] },
    minTakeProfitPoints: 70.0,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 80.0,
    slType: "M15_FRACTAL",
    notes: "Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Baseline Price vs M5 EMA 100; Condition 3: Trigger M5 Stoch (30,2,5 Simple) %K cross Level 50 (±3 candles tolerance from Stoch 100 cross or simultaneous); Re-Entry: Stoch 100 aligned + fresh M5 Stoch (15,2,5 Simple) %K cross > 20 (BUY) / < 80 (SELL) with Price beyond EMA 100."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 40,
    lotSize: 1.00,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_STOCH200_STOCH15",
    gateType: "STOCH200_STOCH15",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 2, slowing: 5 },
    stoch25Params: { k: 25, d: 2, slowing: 5 },
    minTakeProfitPoints: 4.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.50,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 4.00,
    slType: "M15_FRACTAL",
    notes: "1.00 lot cTrader minimum; Condition 1: M5 Stoch 200 (48/52) Main Trend Identifier; Condition 2: M5 Stoch (15,2,5) Initial (Lvl 50) & Re-Entry (Lvl 20/80); Early Exits: 1) Closed-M5 Stoch (25,2,5) 65/35 Profit Exit, 2) Opposite M5 Fractal Break in loss, 3) Entry-Hour H1 Adverse Close in loss; Dynamic Runner (Tiered Ratchet & $20 Super-Runner Ceiling)."
  },
    "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine (Legacy)",
    server: "S2",
    multiplier: 40,
    lotSize: 1.00,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_1S_TREND_MACD_STOCH",
    gateType: "STOCH200_MACD_EMA100_STOCH533",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    macdParams: { fast: 25, slow: 75, signal: 1 },
    stoch533Params: { k: 5, d: 3, slowing: 3 },
    emaPeriod: 100, // M5 EMA 100
    minTakeProfitPoints: 4.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.50,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 5.50,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch 200 Level 50 Gate & MACD Confirmation + M5 EMA 100 Baseline + M5 Fast Stoch (5,3,3) 20/80 Re-Entry Trigger + 3-Candle, Stoch 200 & Closed-M5 Stoch (15,2,5) Level 50 Opposite Cross Loss Exits + Stoch (25,2,5) Midline 50 Profit Exit + Dynamic Runner ($20 Ceiling & Tiered Trailing Ratchet)."
  },
  "1HZ25V": {
    symbol: "1HZ25V",
    symbolName: "Volatility 25 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 400,
    lotSize: 0.005,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V25_1S_STOCH200_STOCH15",
    gateType: "STOCH200_STOCH15_EMA100",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 2, slowing: 5 },
    stoch25Params: { k: 25, d: 2, slowing: 5 },
    emaPeriod: 100,
    minTakeProfitPoints: 600.0,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 800.0,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch (200,1,1) Level 45/55 Cross + Trigger Oscillator Stoch (15,2,5) Level 75/25 Cross (Any-Order Confluence) + M5 EMA 100 Filter (Skip & Await Re-Entry if Not Aligned); Re-Entry: Stoch 200 Directional Alignment + Fresh Stoch (15,2,5) Cross > 25 (BUY) / < 75 (SELL) + M5 Price vs EMA 100 Filter; Trade Management: Tier 0 Early Capital Shield ($1.50 -> $0.50), Closed-M5 Stoch (25,2,5) Midline 50 Profit Exit (>= $0.50), Dynamic Runner (Tiered Ratchet & $20 Super-Runner Ceiling)."
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
    strategyProfile: "PROFILE_V25_STOCH100_STOCH30",
    gateType: "STOCH100_STOCH30_EMA100_STOCH302515",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch30Params: { k: 30, d: 2, slowing: 5, method: "Simple", level: 50 },
    emaPeriod: 100,
    auxStochParams: { k: 30, d: 25, slowing: 15, method: "Simple", level: 50 },
    minTakeProfitPoints: 8.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 10.00,
    slType: "M5_FRACTAL",
    notes: "Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Baseline Price vs M5 EMA 100; Condition 3: Trigger M5 Stoch (30,2,5 Simple) %K cross Level 50 (±3 candles tolerance from Stoch 100 cross or simultaneous); Re-Entry: Stoch 100 aligned + fresh M5 Stoch (30,25,15 Simple) %K touches/crosses Level 50 then crosses %D with Price beyond EMA 100."
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
    strategyProfile: "PROFILE_V100_STOCH200_STOCH15",
    gateType: "STOCH200_STOCH15",
    stoch200Params: { k: 200, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 2, slowing: 5 },
    stoch25Params: { k: 25, d: 2, slowing: 5 },
    minTakeProfitPoints: 1.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 1.25,
    slType: "M5_FRACTAL",
    notes: "80x multiplier (4.00 lots); V100 Standardized Engine; Condition 1: M5 Stoch 200 (48/52) Main Trend Identifier; Baseline: M5 EMA 100 filter; Condition 2: M5 Stoch (15,2,5) Initial (Lvl 50) & Re-Entry (Lvl 20/80); Trade Management: -$4.00 Software SL, Tier 0 Breakeven Shield at +$1.00 -> $0.50 floor, Dynamic Runner (Tiered Ratchet & $20 Super-Runner Ceiling); Early Loss Exits: Opposite M5 Fractal & H1 Adverse Close in loss."
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
    minTakeProfitPoints: 8.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 5.00,
    slType: "M15_FRACTAL",
    notes: "400x multiplier (0.50 lots); Initial Entry: Triggered immediately when all 3 conditions are met in any order — 1) M5 Stoch (200,1,1) %K >= 50.0 (BUY) / <= 50.0 (SELL), 2) M5 MACD (25,75,1) >= 0.0 (BUY) / <= 0.0 (SELL), 3) Price > M5 EMA 100 (BUY) / < M5 EMA 100 (SELL); Re-Entry: M5 Fast Stoch (5,3,3) 20/80 Cross while all 3 conditions remain aligned; Early Exits: 1) 3 Consecutive Adverse M5 Candles, 2) Stoch 200 Adverse Cross, 3) M5 Stoch (15,2,5) Level 50 Loss Exit, 4) Entry-Hour H1 Adverse Close Exit."
  }
};

// ==================== ACTIVE INSTANCE SELECTOR ====================
// Select via environment variable SYMBOL (e.g. SYMBOL=R_75) or fallback to default
// Auto-detect symbol from working directory path if process.env.SYMBOL is omitted
const _cwd = process.cwd();
let _autoSymbol = null;
if (_cwd.includes("OmniSight") || _cwd.includes("omnisight")) _autoSymbol = "R_50";
else if (_cwd.includes("ice-cream") || _cwd.includes("icecream")) _autoSymbol = "1HZ25V";
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

// ── Execution Mode & Lot Size Configuration (Enforcing cTrader Broker Minimum Volume Floors) ──
// Default execution engine: cTrader (CFD) across all bots unless manually overridden via EXECUTION_MODE in .env
const EXECUTION_MODE = (process.env.EXECUTION_MODE || "ctrader").toLowerCase();
const CTRADER_MIN_LOT_MAP = {
  "R_75": 0.01,
  "1HZ75V": 0.05,
  "R_100": 1.00,
  "1HZ100V": 1.00,
  "1HZ25V": 0.005,
  "R_25": 0.50,
  "R_50": 4.00,
  "R_10": 0.50
};
const _rawLotSize = parseFloat(process.env.LOT_SIZE || (PROFILE.lotSize !== undefined ? String(PROFILE.lotSize) : "0.50"));
const CTRADER_LOT_SIZE = Math.max(isNaN(_rawLotSize) ? 0.01 : _rawLotSize, CTRADER_MIN_LOT_MAP[SYMBOL] || 0.01);

// ── Configurable Software Stop Loss per Instrument Profile ──
const INSTRUMENT_SOFTWARE_SL_MAP = {
  "R_25": -2.00,     // Tea Machine (V25, 400x) — Max 2% loss risk ($2.00)
  "1HZ75V": -2.00,   // Coffee (V75-1s, 0.05 lots) — Max 2% loss risk ($2.00)
  "R_75": -2.00,     // Lery's Alerts (V75, 50x) — Max 2% loss risk ($2.00)
  "R_100": -2.50,    // Milk (V100, 40x) — Calibrated breathing room ($2.50 SL)
  "1HZ100V": -2.50,  // Ice Cream Legacy (V100-1s, 40x) ($2.50 SL)
  "1HZ25V": -2.00,   // Ice Cream Machine (V25-1s, 400x) ($2.00 SL)
  "R_50": -2.00,     // OmniSight (V50, 4.00 lots) ($2.00 SL)
  "R_10": -2.00      // Test Bot (V10, 400x) ($2.00 SL)
};

const DEFAULT_SOFTWARE_SL_USD = -2.00;
const DAILY_MAX_LOSS_USD = -4.00; // Stop bot trading if down -$4.00 in a day to safeguard $100 capital
const rawEnvSl = process.env.SOFTWARE_SL_USD ? parseFloat(process.env.SOFTWARE_SL_USD) : null;
const SOFTWARE_SL_USD = rawEnvSl !== null
  ? (rawEnvSl > 0 ? -rawEnvSl : rawEnvSl)
  : (typeof PROFILE.softwareSlUsd === "number" ? -Math.abs(PROFILE.softwareSlUsd) : (INSTRUMENT_SOFTWARE_SL_MAP[SYMBOL] ?? DEFAULT_SOFTWARE_SL_USD));

const SERVER_TP_USD = 7.00;
const CATASTROPHIC_PNL_FLOOR = -5.00;
const DAILY_PROFIT_TARGET_USD = 7.00;
const rawAppId = String(process.env.DERIV_APP_ID || process.env.APP_ID || "1089").trim();
const MARKET_DATA_APP_ID = /^\d+$/.test(rawAppId) ? rawAppId : "1089";
const TARGET_MIN_PROFIT = PROFILE.minTakeProfitUsd || 3.50;

// Continuous Dollar Trailing Stop Settings (High Activation + Wide Buffer Calibration)
const TRAIL_ACTIVATION_USD = PROFILE.trailActivationUsd || 2.20; // Activated once profit reaches +$3.00 net
const TRAIL_BUFFER_USD = 1.20;     // Trail $1.50 behind peak unrealized profit
const TRAIL_INITIAL_FLOOR_USD = 1.00; // Initial guaranteed lock at activation (+$3.00 peak - $1.50 buffer = +$1.50)

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
    if (!res.ok) {
      let errText = "";
      try { errText = await res.text(); } catch {}
      let parsedMsg = "";
      try {
        const j = JSON.parse(errText);
        parsedMsg = j.error || j.message || errText;
      } catch {
        parsedMsg = errText || `status ${res.status}`;
      }
      throw new Error(`Gateway HTTP error ${res.status}: ${parsedMsg}`);
    }
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
          2432: "R_50",
          2431: "1HZ25V",
          2433: "1HZ50V",
          2430: "R_25",
          2428: "R_10",
          2429: "1HZ10V",
          2436: "R_100",
          2437: "1HZ100V"
        };
        return res.positions.map(p => {
          const symId = Number(p.tradeData?.symbolId || p.symbolId);
          const mappedSym = CTRADER_ID_TO_SYMBOL[symId] || null;
          if (!mappedSym) return null;
          const rawVol = p.tradeData?.volume ?? p.volume;
          const actualLots = (typeof rawVol === "number" && rawVol > 0)
            ? rawVol / 100
            : (typeof p.lots === "number" && p.lots > 0 ? p.lots : (CTRADER_MIN_LOT_MAP[mappedSym] || CTRADER_LOT_SIZE));
          return {
            contract_id: String(p.positionId),
            symbol: mappedSym,
            underlying_symbol: mappedSym,
            contract_type: p.tradeData?.tradeSide === 1 ? "MULTUP" : "MULTDOWN",
            buy_price: p.price,
            lots: actualLots,
            stopLoss: p.stopLoss || null,
            takeProfit: p.takeProfit || null,
            unrealizedPnl: typeof p.unrealizedPnl === "number" ? p.unrealizedPnl : undefined,
            date_start: Math.floor((p.tradeData?.openTimestamp || Date.now()) / 1000)
          };
        }).filter(Boolean);
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
      const isDynamicRunner = true; // Centralized Dynamic Runner Architecture active across all fleet instruments
      const payload = {
        symbol: SYMBOL_NAME || SYMBOL,
        side: direction,
        lots: CTRADER_LOT_SIZE,
        slPrice: orderContext.slPrice || null,
        tpPrice: isDynamicRunner ? null : (orderContext.tpPrice || orderContext.fibTpPrice || null),
        slUsd: Math.abs(SOFTWARE_SL_USD) || 4.00,
        tpUsd: isDynamicRunner ? null : (TARGET_MIN_PROFIT || 4.00),
        comment: `${REPO_LABEL} cTrader`
      };
      console.log(`[CTRADER ORDER] Sending ${direction} order: ${CTRADER_LOT_SIZE} lots on ${SYMBOL_NAME || SYMBOL} (SL: ${payload.slPrice || payload.slUsd}, TP: ${payload.tpPrice || payload.tpUsd})`);
      let lastError = null;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await gatewayFetch("/ctrader/order", "POST", payload, 20000);
          if (res && res.ok && res.order?.positionId) {
            console.log(`[CTRADER ORDER SUCCESS] Position ID #${res.order.positionId} confirmed by broker (attempt ${attempt}/${maxAttempts}) (${res.order.lots || CTRADER_LOT_SIZE} lots @ ${res.order.entryPrice || 'market'}).`);
            return String(res.order.positionId);
          }
          const errDetail = res?.error || res?.message || (res ? JSON.stringify(res) : "Unknown broker error");
          throw new Error(`cTrader order rejected by broker: ${errDetail}`);
        } catch (attemptErr) {
          lastError = attemptErr;
          console.warn(`[CTRADER ORDER ATTEMPT ${attempt}/${maxAttempts} FAILED] ${attemptErr.message}`);
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 1500 * attempt));
          }
        }
      }
      throw lastError;
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
        // Match only the CLOSING deal (which contains closePositionDetail), never the opening deal
        const match = res.deals.find(d => String(d.positionId) === String(contractId) && d.closePositionDetail);
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
    `wss://red.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
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
    `wss://red.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.derivws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`,
    `wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`
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
  
  const signalLine = emaArray(macdLine, signalPeriod);
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
  if (EXECUTION_MODE === "ctrader") {
    const activeLots = (lots && lots > 0) ? lots : CTRADER_LOT_SIZE;
    const priceMove = targetLoss / activeLots;
    return direction === "BUY" ? entry + priceMove : entry - priceMove;
  }
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  return direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);
}

function calcUnrealizedPnL(trade, currentPrice) {
  // 1. Direct Live Broker PnL (Used for Deriv Multipliers when liveBrokerPnl is present)
  if (EXECUTION_MODE !== "ctrader" && typeof trade.liveBrokerPnl === "number" && !isNaN(trade.liveBrokerPnl)) {
    return trade.liveBrokerPnl;
  }

  // 2. High-Precision Price Point Calculation for cTrader CFD & Deriv Fallback
  const pointsDiff = trade.direction === "BUY"
    ? (currentPrice - trade.entry)
    : (trade.entry - currentPrice);

  const activeLots = (trade.lots && trade.lots > 0) ? trade.lots : CTRADER_LOT_SIZE;
  if (EXECUTION_MODE === "ctrader") {
    return parseFloat((pointsDiff * activeLots).toFixed(2));
  }

  const rawPnl = (pointsDiff / trade.entry) * STAKE_USD * MULTIPLIER;
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

  // Evaluate when current closed candle reaches or crosses the entry hour close boundary.
  // Guard: Position must be at least 30 minutes (1800s) old before evaluating H1 close.
  // This prevents trades opened at :50 or :55 from being liquidated after only 1 candle (5m)
  // based on an H1 candle open that occurred 50+ minutes BEFORE the trade was even placed.
  const tradeAgeSeconds = currentCandleCloseEpoch - trade.entryEpoch;
  if (tradeAgeSeconds < 1800) {
    return { triggered: false };
  }

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
  openTrade: null,
  lastProcessedEpoch: null, lastTgUpdateId: 0, armed: null, armedEpoch: null, armedTime: null, confirm: null, dailyBiasPrice: null,
  last50Origin: null,
  lastTriggeredSetup: null,
  lastTriggeredEpoch: null,
  dailyNetPnl: 0,
  dailyTargetReached: false,
  dailyTargetDate: null,
  dailyMaxLossReached: false,
  dailyMaxLossDate: null,
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
  // V75 Initial & Retracement Latches
  v75_initialBuyArmed: false,
  v75_initialSellArmed: false,
  v75_initialBuyDone: false,
  v75_initialSellDone: false,
  v75_emaTouched_BUY: false,
  v75_emaTouched_SELL: false,
  // V25 Stoch (200,1,1) Trend Indicator Arming
  v25_trendDirection: null,
  // V50 Stoch (200,1,1) Trend Indicator & Re-Entry Latches
  v50_trendDirection: null,
  v50_pending_cci: null,
  v50_initialBuyDone: false,
  v50_initialSellDone: false,
  v50_stochArmedBuy: false,
  v50_stochArmedSell: false,
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

const ENGINE_VERSION = "v6.7-gateway-resilience-hardened";
const CODE_TIMESTAMP = "2026-10-21T07:45:00Z";

const ALLOWED_STATE_KEYS = new Set([
  "engineVersion", "codeTimestamp", "symbol", "strategyProfile", "currentPrice",
  "lastPriceUpdate", "openTrade", "lastProcessedEpoch", "lastTgUpdateId", "armed", "armedEpoch",
  "armedTime", "confirm", "dailyBiasPrice", "last50Origin", "lastTriggeredSetup",
  "lastTriggeredEpoch", "dailyNetPnl", "dailyTargetReached", "dailyTargetDate", "dailyMaxLossReached", "dailyMaxLossDate",
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
  "fibBullish", "rescueStochArmed", "v75_initialBuyArmed", "v75_initialSellArmed",
  "v75_initialBuyDone", "v75_initialSellDone", "v75_emaTouched_BUY", "v75_emaTouched_SELL",
  "v75_stochOverboughtArmed", "v75_stochOversoldArmed", "v75_1s_emaTouched_BUY",
  "v75_1s_emaTouched_SELL", "v75_1s_stochArmedBuy", "v75_1s_stochArmedSell",
  "v75_1s_macdArmedBuy", "v75_1s_macdArmedSell", "v75_1s_initialBuyDone", "v75_1s_initialSellDone", "v75_1s_stoch100CrossEpochBuy", "v75_1s_stoch100CrossEpochSell", "v75_1s_stoch30CrossEpochBuy", "v75_1s_stoch30CrossEpochSell", "v75_1s_stoch100", "v75_1s_stoch30",
  "v75_1s_trend", "v75_1s_ema100", "v75_1s_macd",
  "v75_1s_stoch200", "v75_1s_stoch533", "v100_initialEntryDone", "v100_trendDir",
  "v100_stoch200Armed", "v100_stoch200CrossEpoch", "v100_stoch15_50_crossDir",
  "v100_stoch15_50_crossEpoch", "v100_1s_armed", "v100_1s_armDir", "v100_1s_initialBuyDone",
  "v100_1s_initialSellDone", "v100_1s_stochArmedBuy", "v100_1s_stochArmedSell",
  "v100_1s_macdArmedBuy", "v100_1s_macdArmedSell", "v100_1s_trend", "v100_1s_ema100",
  "v100_1s_macd", "v100_1s_stoch200", "v100_1s_stoch533", "v100_1s_stoch15",
  "v50_trendDirection", "v50_pending_cci", "v50_initialBuyDone", "v50_initialSellDone",
  "v50_stochArmedBuy", "v50_stochArmedSell", "v50_cciArmedBuy", "v50_cciArmedSell",
  "v25_trendDirection", "v25_initialBuyDone", "v25_initialSellDone", "v25_stochArmedBuy",
  "v25_stochArmedSell", "v25_cciArmedBuy", "v25_cciArmedSell", "v25_cciCrossEpochBuy", "v25_cciCrossEpochSell",
  "v10_stochArmedBuy", "v10_stochArmedSell", "v10_macdArmedBuy", "v10_macdArmedSell",
  "v10_initialBuyDone", "v10_initialSellDone", "v10_trend",
  "v10_ema100", "v10_macd", "v10_stoch200", "v10_stoch533",
  "v25_1s_trendDir", "v25_1s_initialDone", "v25_1s_stoch200CrossEpoch",
  "v25_1s_stoch15ArmedBuy", "v25_1s_stoch15ArmedSell", "v25_1s_trend",
  "v25_1s_ema100", "v25_1s_stoch200", "v25_1s_stoch15", "v25_1s_emaAligned",
  "v25_stoch100CrossEpochBuy", "v25_stoch100CrossEpochSell",
  "v25_stoch30CrossEpochBuy", "v25_stoch30CrossEpochSell",
  "v25_stoch302515_touched_50_BUY", "v25_stoch302515_touched_50_SELL",
  "stoch100Val", "stoch3025Val", "stoch3025Signal", "stoch302515Val", "stoch302515Signal",
  "queuedPendingOrder", "dailyLossLockout",
  "healthStatus", "blockerReason", "nextTrigger", "lastScanTime",
  "lastSuccessfulScan", "lastError", "lastErrorTime", "lastErrorStack", "errorCount",
  "stochState", "stochSeparation", "cciState", "nextPhase",
  "lastClosedTradeEpoch", "isReentryMode", "activeReentryOpportunity"
]);

function onTradeClosedCleanup(closedEpoch) {
  state.lastClosedTradeEpoch = closedEpoch || Math.floor(Date.now() / 1000);
  state.v75_emaTouched_BUY = false;
  state.v75_emaTouched_SELL = false;
  state.v75_1s_emaTouched_BUY = false;
  state.v75_1s_emaTouched_SELL = false;
  state.v25_cciCrossEpochBuy = null;
  state.v25_cciCrossEpochSell = null;
  state.v25_stoch302515_touched_50_BUY = false;
  state.v25_stoch302515_touched_50_SELL = false;
  state.activeReentryOpportunity = null;
}

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

state.strategyProfile = STRATEGY_PROFILE;
sanitizeState(state);
state.engineVersion = ENGINE_VERSION;
state.codeTimestamp = CODE_TIMESTAMP;

function saveState() {
  state.engineVersion = ENGINE_VERSION;
  state.codeTimestamp = CODE_TIMESTAMP;
  state.strategyProfile = STRATEGY_PROFILE;
  sanitizeState(state);
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

function loadTrades() { try { return JSON.parse(fs.readFileSync(TRADES_FILE_PATH, "utf8")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync(TRADES_FILE_PATH, JSON.stringify(t, null, 2)); }

// ==================== FAST PATH: RISK MANAGEMENT (ADAPTIVE: 3S IN-TRADE / 10S IDLE) ====================
const closingContracts = new Set();

async function processQueuedPendingOrder(currentPrice) {
  const queued = state.queuedPendingOrder;
  if (!queued) return;
  const nowEpoch = Math.floor(Date.now() / 1000);
  let trades = loadTrades();

  // Check if expired (2.5 minutes elapsed without gateway reconnection)
  if (nowEpoch > queued.expiresEpoch) {
    console.warn(`[${REPO_LABEL}] Queued pending order expired after 2.5 minutes without gateway reconnection.`);
    const tIdx = trades.findIndex(t => t.id === queued.tradeRecordId || (t.pending && !t.contractId));
    if (tIdx !== -1) {
      trades.splice(tIdx, 1);
      saveTrades(trades);
    }
    state.queuedPendingOrder = null;
    saveState();
    await sendTelegram(`⌛ *${REPO_LABEL}* — Execution window expired (gateway was unavailable for 2.5 minutes). Trade aborted safely.`);
    return;
  }

  // Throttle retries to once every 5 seconds so we don't spam during an outage
  if (nowEpoch - (queued.lastAttemptEpoch || 0) < 5) {
    return;
  }
  queued.lastAttemptEpoch = nowEpoch;
  queued.retryAttempts = (queued.retryAttempts || 1) + 1;

  console.log(`[${REPO_LABEL}] Retrying queued pending order (attempt ${queued.retryAttempts}, ${queued.expiresEpoch - nowEpoch}s remaining)...`);

  try {
    const contractId = await executeTrade(queued.direction, queued.orderContext);
    if (contractId) {
      const tIdx = trades.findIndex(t => t.id === queued.tradeRecordId);
      if (tIdx !== -1) {
        trades[tIdx].contractId = contractId;
        trades[tIdx].pending = false;
        trades[tIdx].entry = currentPrice || trades[tIdx].entry;
        saveTrades(trades);
        state.openTrade = {
          ...trades[tIdx],
          entryPrice: trades[tIdx].entry,
          stopLoss: trades[tIdx].sl,
          tpPrice: trades[tIdx].tpPrice,
          unrealizedPnl: 0,
          livePnl: 0,
          profit: 0
        };
      }
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.confirm = null;
      state.nextPhase = null;
      state.queuedPendingOrder = null;
      saveState();

      await sendTelegram(
        `⚡ *${REPO_LABEL} — RECONNECTED & FILLED!* ⚡\n\n` +
        `Gateway connection restored! Order executed successfully after ${queued.retryAttempts} attempts.`
      );
      if (queued.message) {
        await sendTelegram(queued.message);
      }
    }
  } catch (err) {
    console.warn(`[${REPO_LABEL}] Queued order retry failed: ${err.message}. Retrying until expiration...`);
  }
}

async function manageOpenTradesFastPath() {
  let trades = loadTrades();
  // 🛡️ Self-Healing: Prune expired / orphaned pending trades older than 180 seconds with no contractId
  const nowEpoch = Math.floor(Date.now() / 1000);
  const initialTradesCount = trades.length;
  trades = trades.filter(t => {
    if (t.pending && !t.contractId && (nowEpoch - (t.entryEpoch || 0) > 180)) {
      console.warn(`[PRUNE ZOMBIE TRADE] Pruned unfulfilled pending order ${t.id} (${t.direction} ${t.symbol}) after 180s timeout.`);
      return false;
    }
    return true;
  });
  if (trades.length !== initialTradesCount) {
    saveTrades(trades);
  }
  let openTrades = trades.filter(t => !t.result && !t.pending);

  // 🛡️ Universal Live Portfolio Adoption & Self-Healing: Always query deriv-gateway for active broker positions.
  // Ensures any live contract running on cTrader / Deriv for this instrument is instantly adopted and monitored by Fast-Path Software SL.
  try {
    const allPortfolio = await getOpenPortfolio();
    const allLiveIdSet = new Set((Array.isArray(allPortfolio) ? allPortfolio : []).map(c => String(c.contract_id || c.id || c.contractId)));
    const liveContracts = (Array.isArray(allPortfolio) ? allPortfolio : []).filter(c => getContractSymbol(c).toUpperCase() === TRADING_SYMBOL.toUpperCase());
    let modified = false;

    // Live Broker PnL, Entry & Actual Volume Synchronization:
    for (const live of liveContracts) {
      const liveCid = String(live.contract_id || live.contractId || live.id);
      const tracked = trades.find(t => String(t.contractId) === liveCid && !t.result);
      if (tracked) {
        if (typeof live.unrealizedPnl === "number" && !isNaN(live.unrealizedPnl)) {
          tracked.liveBrokerPnl = live.unrealizedPnl;
          tracked.unrealizedPnl = live.unrealizedPnl;
        }
        const brokerLots = (typeof live.lots === "number" && live.lots > 0) ? live.lots : CTRADER_LOT_SIZE;
        if (tracked.lots !== brokerLots) {
          tracked.lots = brokerLots;
          modified = true;
        }
        const brokerEntry = live.buy_price ? parseFloat(live.buy_price) : null;
        if (brokerEntry && brokerEntry > 0 && tracked.entry !== brokerEntry) {
          tracked.entry = brokerEntry;
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
          `Contract \`${t.contractId}\` (*${t.direction}*) was falsely marked as \`${prevResult}\`, but is STILL LIVE on broker!\n\n` +
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
          const actualLots = (typeof live.lots === "number" && live.lots > 0) ? live.lots : CTRADER_LOT_SIZE;
          trades.push({
            id: `${SYMBOL}-${Date.now()}`, contractId: Number(liveCid) || liveCid, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
            direction: dir, entry: entryPrice, sl: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), rr: null, entryType: "RECOVERED_LIVE_FAST", brokerSlAmount: STAKE_USD,
            lots: actualLots, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
            entryEpoch: live.date_start || Math.floor(Date.now() / 1000), fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false,
            tpPrice: live.takeProfit || null, fibTpPrice: live.takeProfit || null, keyLevel: null,
            openTime: new Date((live.date_start || Math.floor(Date.now() / 1000)) * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
          });
          modified = true;
          await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted live contract \`${liveCid}\` (${dir}, ${actualLots} lots) in Fast Path.`);
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

  if (openTrades.length === 0) {
    if (state.openTrade) {
      state.openTrade = null;
      saveState();
    }
    return false;
  }

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
    openTrade.unrealizedPnl = pnl;

    // =========================================================================
    // 🎯 TARGET $7.00/DAY CAPITAL PROTECTION & DYNAMIC RUNNER ENGINE
    // =========================================================================
    openTrade.maxUnrealizedPnL = Math.max(openTrade.maxUnrealizedPnL || 0, pnl);
    const peak = openTrade.maxUnrealizedPnL;

    // Daily Target Strike Ceiling: Cash out full position when trade hits $7.00 target
    // or when this trade's profit completes the remaining daily quota for the bot!
    let dailyTargetCeilingHit = false;
    let superRunnerCeilingHit = false;
    const remainingToDailyTarget = Math.max(0, DAILY_PROFIT_TARGET_USD - (state.dailyNetPnl || 0));
    if (pnl >= DAILY_PROFIT_TARGET_USD || (remainingToDailyTarget > 0 && pnl >= remainingToDailyTarget)) {
      dailyTargetCeilingHit = true;
    } else if (pnl >= 12.00) {
      superRunnerCeilingHit = true;
    }

    // =========================================================================
    // UNIFIED PROFIT RATCHET & BREATHING ROOM ARCHITECTURE
    // Rule 1: Breathing Zone ($0.00 to $2.19) -> Zero premature exit. Full room for M5 candle wicks.
    // Rule 2: Breakeven Shield (Peak >= $2.20) -> Locks +$1.00 net floor ($1.20 wick buffer).
    // Rule 3: Half-Target Lock (Peak >= $3.50) -> Locks +$2.20 net floor ($1.30 wick buffer).
    // Rule 4: Pre-Target Runner (Peak >= $5.00) -> Locks +$3.80 net floor ($1.20 wick buffer).
    // Rule 5: Daily Target Strike (pnl >= remainingToDailyTarget or >= $7.00) -> Instant Cash-Out!
    // =========================================================================
    if (peak >= 5.00) {
      // Tier 3: Pre-Target Runner (Peak >= $5.00)
      openTrade.trendRidingActive = true;
      const tier3Floor = Math.max(
        3.80,
        parseFloat((peak * 0.75).toFixed(2)),
        parseFloat((peak - 1.50).toFixed(2))
      );
      if (!openTrade.lockedPnlFloor || tier3Floor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = tier3Floor;
        saveTrades(trades);
        console.log(`[TIER 3 PRE-TARGET RUNNER] #${openTrade.contractId} Peak PnL +${peak.toFixed(2)} -> Floor secured at +${openTrade.lockedPnlFloor.toFixed(2)}.`);
      }
    } else if (peak >= 3.50) {
      // Tier 2: Half-Target Quota Lock (Peak >= $3.50)
      openTrade.trendRidingActive = true;
      const tier2Floor = Math.max(
        2.20,
        parseFloat((peak * 0.65).toFixed(2)),
        parseFloat((peak - 1.30).toFixed(2))
      );
      if (!openTrade.lockedPnlFloor || tier2Floor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = tier2Floor;
        saveTrades(trades);
        console.log(`[TIER 2 HALF-TARGET LOCK] #${openTrade.contractId} Peak PnL +${peak.toFixed(2)} -> Base floor locked at +${openTrade.lockedPnlFloor.toFixed(2)} (Guarantees >= $2.20 win).`);
      }
    } else if (peak >= 2.20) {
      // Tier 1: Breakeven Capital Shield (Peak >= $2.20)
      // Locks +$1.00 net floor: Guarantees trade never turns into a loss while giving $1.20 of breathing room for M5 wicks
      const tier1Floor = 1.00;
      if (!openTrade.lockedPnlFloor || tier1Floor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = tier1Floor;
        saveTrades(trades);
        console.log(`[TIER 1 BREAKEVEN SHIELD] #${openTrade.contractId} Peak PnL +${peak.toFixed(2)} -> Guaranteed profit floor locked at +${openTrade.lockedPnlFloor.toFixed(2)} ($1.20 breathing buffer active).`);
      }
    }
    // =========================================================================

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction, openTrade.lots);

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    const isDynamicRunner = STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || SYMBOL === "1HZ100V" || STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V";
    const activeTpTarget = isDynamicRunner ? null : (openTrade.tpPrice || openTrade.fibTpPrice || null);
    let tpHit = false;
    if (activeTpTarget) {
      tpHit = isBuy ? currentPrice >= activeTpTarget : currentPrice <= activeTpTarget;
    }
    // If Trend-Rider is active (pnl >= 4.00 reached) or Dynamic Runner (V25/V100), do NOT exit on initial TP!
    // Hold position wide open until closed M5 indicator invalidation or dynamic ratchet floor.
    if (openTrade.trendRidingActive || isDynamicRunner) {
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

    // Note: Stoch 50 / CCI 0 midline momentum exhaustion exits are evaluated strictly on confirmed closed M5 candles in runSlowPathScan()
    // using genuine crossover verification (prevK1525 > 50 && sK1525 <= 50 for BUY; prevK1525 < 50 && sK1525 >= 50 for SELL)
    // to prevent premature 3-second exits on trades entered near levels 20 or 80.

    let reason = null;
    if (dailyTargetCeilingHit) {
      reason = "Daily Target TP Hit (+ $" + pnl.toFixed(2) + ") — Secured 100% of Daily $" + DAILY_PROFIT_TARGET_USD.toFixed(2) + " Target!";
    }
    else if (superRunnerCeilingHit) {
      reason = "Super Runner TP Ceiling reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ")";
    }
    else if (tpHit) { 
      reason = "Take Profit Target reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ")"; 
    } 
    else if (rescueBreakevenHit) {
      reason = `Rescue Retracement Target hit — Old position closed at +$${pnl.toFixed(2)} (>= +$0.20 profit) while rescue contract ${activeRescueTrade.contractId} runs to TP`;
    }
    else if (fakeoutExitTriggered) {
      reason = `Opposite M15 Fractal Fakeout Exit — Closed at ${currentPrice.toFixed(4)} ($${pnl.toFixed(2)}) to avoid full -$2.50 SL (Opposing ${openTrade.opposingM15Fractal.type} at ${Number(openTrade.opposingM15Fractal.price).toFixed(4)})`;
    }
    else if (openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) { 
      reason = `Profit-Lock hit — Secured +$${openTrade.lockedPnlFloor.toFixed(2)} (Peak: +$${(openTrade.maxUnrealizedPnL || 0).toFixed(2)})`; 
    }
    else if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit — PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit — PnL $${pnl.toFixed(2)}`; }

    if (!reason) {
      state.openTrade = {
        ...openTrade,
        entryPrice: openTrade.entry,
        stopLoss: openTrade.sl,
        tpPrice: openTrade.tpPrice || openTrade.fibTpPrice,
        unrealizedPnl: pnl,
        livePnl: pnl,
        profit: pnl,
        peakPnl: openTrade.maxUnrealizedPnL || 0,
        lockedProfit: openTrade.lockedPnlFloor || 0,
        trailingActive: !!openTrade.trendRidingActive
      };
      saveTrades(trades);
      saveState();
      continue;
    }

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
          serverPnl = closeRes.sell?.profit ?? closeRes.result?.profit ?? closeRes.profit ?? pnl;
          resultSource = "server_close_confirmed";
        }

        // In cTrader CFD mode, immediately verify the official net settled deal (including broker commission)
        if (EXECUTION_MODE === "ctrader") {
          try {
            await new Promise(r => setTimeout(r, 600));
            const rec = await getContractProfitFromHistory(openTrade.contractId, openTrade.entryEpoch);
            if (rec && typeof rec.profit === "number") {
              serverPnl = rec.profit;
              resultSource = "ctrader_deal_confirmed";
            }
          } catch (e) {}
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
      state.openTrade = null;
      onTradeClosedCleanup(Math.floor(Date.now() / 1000));
      
      // Update cumulative daily net PnL
      state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
      if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
        state.dailyTargetReached = true;
        state.dailyTargetDate = new Date().toISOString().split("T")[0];
        console.log(`[DAILY TARGET] +$${DAILY_PROFIT_TARGET_USD.toFixed(2)} Daily Goal Achieved ($${state.dailyNetPnl.toFixed(2)}). Switching to IDLE_DAILY_TARGET_REACHED.`);
        await sendTelegram(`🎯 *${REPO_LABEL} — DAILY TARGET ACHIEVED!* 🎯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      } else if (typeof DAILY_MAX_LOSS_USD === "number" && state.dailyNetPnl <= DAILY_MAX_LOSS_USD) {
        state.dailyMaxLossReached = true;
        state.dailyMaxLossDate = new Date().toISOString().split("T")[0];
        console.log(`[DAILY LOSS LIMIT] $${state.dailyNetPnl.toFixed(2)} Daily Loss Limit reached. Locking bot to protect $100 account until 00:00 UTC rollover.`);
        await sendTelegram(`🛡️ *${REPO_LABEL} — CAPITAL PROTECTION LIMIT REACHED* 🛡️\n\nDaily Net PnL reached -$4.00 ($${state.dailyNetPnl.toFixed(2)}).\nTrading paused until 00:00 UTC to protect account capital.`);
      }

      // Disarm setup upon trade exit to require a fresh key level re-test or fresh indicator reset
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.keyLevelTouched = false;
      state.levelTouched = null;
      state.v75_emaTouched_BUY = false;
      state.v75_emaTouched_SELL = false;
      state.v75_1s_emaTouched_BUY = false;
      state.v75_1s_emaTouched_SELL = false;
  state.v25_cciCrossEpochBuy = null;
  state.v25_cciCrossEpochSell = null;
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

      // ⚡ Immediate Re-Entry Opportunity Evaluation: If a re-entry opportunity was latched while trade was running, fire immediately!
      if (!state.dailyTargetReached && state.activeReentryOpportunity) {
        try {
          await checkAndExecuteImmediateReentry(currentPrice);
        } catch (e) {
          console.error(`[${REPO_LABEL}] Immediate re-entry attempt error:`, e.message);
        }
      }
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
    onTradeClosedCleanup(Math.floor(Date.now() / 1000));

    state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
    // Disarm setup upon fakeout exit to require a fresh key level re-test or fresh indicator reset
    state.armed = null;
    state.armedEpoch = null;
    state.armedTime = null;
    state.keyLevelTouched = false;
    state.levelTouched = null;
    state.v75_emaTouched_BUY = false;
    state.v75_emaTouched_SELL = false;
    state.v75_1s_emaTouched_BUY = false;
    state.v75_1s_emaTouched_SELL = false;
  state.v25_cciCrossEpochBuy = null;
  state.v25_cciCrossEpochSell = null;
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

// ==================== IMMEDIATE RE-ENTRY ENGINE ====================
async function checkAndExecuteImmediateReentry(spotPrice) {
  if (state.dailyTargetReached) return;
  const opp = state.activeReentryOpportunity;
  if (!opp) return;

  const nowEpoch = Math.floor(Date.now() / 1000);
  if (nowEpoch > (opp.expiresEpoch || 0)) {
    state.activeReentryOpportunity = null;
    return;
  }

  const trades = loadTrades();
  const hasActive = trades.some(t => !t.result && !t.pending);
  if (hasActive) return;

  const price = spotPrice || (await fetchCurrentSpotPrice());
  if (!price || price <= 0) return;

  // Strict Universal EMA 100 Directional Filter Verification
  const e100 = opp.currentEma100 || (state.ema100Val || null);
  if (e100 !== null) {
    if (opp.direction === "BUY" && price <= e100) {
      console.log(`[${REPO_LABEL}] Immediate re-entry BUY blocked: Spot (${price.toFixed(2)}) is BELOW EMA 100 (${e100.toFixed(2)})`);
      state.activeReentryOpportunity = null;
      return;
    }
    if (opp.direction === "SELL" && price >= e100) {
      console.log(`[${REPO_LABEL}] Immediate re-entry SELL blocked: Spot (${price.toFixed(2)}) is ABOVE EMA 100 (${e100.toFixed(2)})`);
      state.activeReentryOpportunity = null;
      return;
    }
  }

  // Strict Macro EMA 100 vs EMA 200 Filter for Re-Entries (Applicable ONLY to V75)
  if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    const e200 = opp.currentEma200 || (state.ema200Val || null);
    if (e100 !== null && e200 !== null) {
      if (opp.direction === "BUY" && e100 <= e200) {
        console.log(`[${REPO_LABEL}] Immediate re-entry BUY blocked: EMA 100 (${e100.toFixed(2)}) is not above EMA 200 (${e200.toFixed(2)})`);
        state.activeReentryOpportunity = null;
        return;
      }
      if (opp.direction === "SELL" && e100 >= e200) {
        console.log(`[${REPO_LABEL}] Immediate re-entry SELL blocked: EMA 100 (${e100.toFixed(2)}) is not below EMA 200 (${e200.toFixed(2)})`);
        state.activeReentryOpportunity = null;
        return;
      }
    }
  }

  console.log(`[${REPO_LABEL}] 🚀 Firing Immediate Re-Entry Order (${opp.direction}) on ${opp.setupLabel} at ${price.toFixed(4)}!`);
  state.activeReentryOpportunity = null;

  const direction = opp.direction;
  const setupLabel = opp.setupLabel;

  let initialM5Fractal = opp.initialM5Fractal || null;
  let initialM15Fractal = opp.initialM15Fractal || null;

  try {
    const { m5: cM5, m15: cM15 } = await fetchAllData();
    if (cM5 && cM5.length >= 20) {
      const idx = cM5.length - 2;
      initialM5Fractal = direction === "BUY" ? findRecentFractalBelow(cM5, idx, price) : findRecentFractalAbove(cM5, idx, price);
    }
    if (cM15 && cM15.length >= 10) {
      initialM15Fractal = findRecentFractalM15(cM15, direction);
    }
  } catch (_) {}

  const hardStopPrice = deriveHardStopPrice(price, direction, CTRADER_LOT_SIZE);
  const reqPnlSoft = EXECUTION_MODE === "ctrader" ? SOFTWARE_SL_USD : (SOFTWARE_SL_USD + COMMISSION_USD);
  const slCapPrice = EXECUTION_MODE === "ctrader"
    ? (direction === "BUY" ? price + (reqPnlSoft / CTRADER_LOT_SIZE) : price - (reqPnlSoft / CTRADER_LOT_SIZE))
    : (direction === "BUY" ? price * (1 + reqPnlSoft / (STAKE_USD * MULTIPLIER)) : price * (1 - reqPnlSoft / (STAKE_USD * MULTIPLIER)));

  let sl;
  if (PROFILE.slType === "HARD_POINTS") {
    sl = hardStopPrice;
  } else if (PROFILE.slType === "M5_FRACTAL") {
    // Hardened Fractal SL Buffer: Do not anchor SL tighter than minimum buffer distance
    // For R_25: minimum 6.00 points ($3.00), preventing tight sub-5-minute wick stopouts
    const minFractalDist = (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100") ? 6.00 : 0;
    const fracDistBuy = initialM5Fractal ? (price - initialM5Fractal) : 0;
    const fracDistSell = initialM5Fractal ? (initialM5Fractal - price) : 0;

    if (direction === "BUY") {
      sl = (initialM5Fractal && initialM5Fractal > slCapPrice && initialM5Fractal < price && fracDistBuy >= minFractalDist) ? initialM5Fractal : slCapPrice;
    } else {
      sl = (initialM5Fractal && initialM5Fractal < slCapPrice && initialM5Fractal > price && fracDistSell >= minFractalDist) ? initialM5Fractal : slCapPrice;
    }
  } else {
    if (direction === "BUY") {
      sl = (initialM15Fractal && initialM15Fractal > slCapPrice && initialM15Fractal < price) ? initialM15Fractal : slCapPrice;
    } else {
      sl = (initialM15Fractal && initialM15Fractal < slCapPrice && initialM15Fractal > price) ? initialM15Fractal : slCapPrice;
    }
  }

  const minRequiredTp = EXECUTION_MODE === "ctrader"
    ? (direction === "BUY" ? price + (TARGET_MIN_PROFIT / CTRADER_LOT_SIZE) : price - (TARGET_MIN_PROFIT / CTRADER_LOT_SIZE))
    : (direction === "BUY" ? price * (1 + TARGET_MIN_PROFIT / (STAKE_USD * MULTIPLIER)) : price * (1 - TARGET_MIN_PROFIT / (STAKE_USD * MULTIPLIER)));

  let tpPrice = opp.calculatedFibTp || minRequiredTp;
  if (direction === "BUY" && tpPrice < minRequiredTp) tpPrice = minRequiredTp;
  if (direction === "SELL" && tpPrice > minRequiredTp) tpPrice = minRequiredTp;

  const timeFormatted = new Date(nowEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);

  const pendingTradeRecord = {
    id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry: price, sl, rr: null, entryType: setupLabel, brokerSlAmount: STAKE_USD,
    lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
    entryEpoch: nowEpoch, purchaseTimeEpoch: nowEpoch, purchase_time: nowEpoch,
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
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1);
      saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Immediate Re-Entry triggered, but broker returned no contract ID.`);
    } else {
      pendingTradeRecord.contractId = contractId;
      pendingTradeRecord.pending = false;
      saveTrades(trades);
      state.openTrade = {
        ...pendingTradeRecord,
        entryPrice: pendingTradeRecord.entry,
        stopLoss: pendingTradeRecord.sl,
        tpPrice: pendingTradeRecord.tpPrice,
        unrealizedPnl: 0,
        livePnl: 0,
        profit: 0
      };
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      saveState();

      const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";
      await sendTelegram(
        `⚡ *${SYMBOL_NAME.toUpperCase()} — IMMEDIATE RE-ENTRY EXECUTED* ⚡\n\n` +
        `Direction: *${dirEmoji}*\n` +
        `Setup: *${escapeMarkdown(setupLabel)}*\n` +
        `📍 Entry: *${price.toFixed(4)}*\n` +
        `🛑 Initial SL: *${sl.toFixed(4)}*\n` +
        `🎯 Take Profit: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
        `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n` +
        `⏰ Time (UTC): ${timeFormatted}`
      );
    }
  } catch (execErr) {
    console.error(`[${REPO_LABEL}] Immediate re-entry execution initial attempt failed: ${execErr.message}. Queueing for 2.5-min reconnect...`);
    state.queuedPendingOrder = {
      tradeRecordId: pendingTradeRecord.id,
      direction,
      orderContext: { slPrice: sl, fibTpPrice: tpPrice, tpPrice },
      signalEpoch: nowEpoch,
      expiresEpoch: nowEpoch + 150,
      message: `⚡ *${SYMBOL_NAME.toUpperCase()} — IMMEDIATE RE-ENTRY EXECUTED* ⚡\n\nDirection: *${direction}*\nSetup: *${escapeMarkdown(setupLabel)}*`,
      firstFailureMessage: execErr.message,
      retryAttempts: 1,
      lastAttemptEpoch: nowEpoch
    };
    saveState();
    await sendTelegram(
      `⚠️ *${REPO_LABEL} — Immediate Re-Entry Paused (Gateway Transient Error)*\n\n` +
      `Reason: \`${escapeMarkdown(execErr.message)}\`\n` +
      `🔄 *Auto-Reconnect Engine Active*: Retrying order execution continuously over the next 2.5 minutes.`
    );
  }
}

// ==================== SLOW PATH (RUNS ON CLOSED M5 CANDLE) ====================
async function runSlowPathScan(m5BoundaryEpoch) {
  try {
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
    state.dailyMaxLossReached = false;
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
      const liveCid = String(live.contract_id || live.contractId || live.id);
      const actualLots = (typeof live.lots === "number" && live.lots > 0) ? live.lots : CTRADER_LOT_SIZE;
      if (!trades.find(t => String(t.contractId) === liveCid)) {
        const entryPrice = live.buy_price ? parseFloat(live.buy_price) : await fetchCurrentSpotPrice(); 
        const dir = (live.contract_type === "MULTUP" || (live.shortcode && live.shortcode.startsWith("MULTUP"))) ? "BUY" : "SELL";
        trades.push({
          id: `${SYMBOL}-${Date.now()}`, contractId: Number(liveCid) || liveCid, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
          direction: dir, entry: entryPrice, sl: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
          lots: actualLots, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
          entryEpoch: live.date_start, fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false,
          tpPrice: live.takeProfit || null, fibTpPrice: live.takeProfit || null, keyLevel: null,
          openTime: new Date((live.date_start || Math.floor(Date.now() / 1000)) * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
        });
        await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted unmanaged live contract \`${liveCid}\` (${dir}, ${actualLots} lots).`);
      }
    }
    
    for (const t of trades.filter(t => t.contractId && (!t.result || (EXECUTION_MODE === "ctrader" && t.resultSource !== "ctrader_deal_confirmed")))) {
      // Strict Check: Only reconcile as closed if contract is absent from the ENTIRE broker portfolio (all symbols)
      const isStillInBrokerPortfolio = allLiveIdSet.has(String(t.contractId));
      if (!isStillInBrokerPortfolio && !closingContracts.has(t.contractId)) {
        const rec = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
        if (rec && typeof rec.profit === "number") {
          const hadResult = Boolean(t.result);
          const oldPnl = typeof t.serverPnl === "number" ? t.serverPnl : (typeof t.profit === "number" ? t.profit : 0);
          t.result = rec.profit >= 0 ? "WIN" : "LOSS";
          t.serverPnl = rec.profit;
          t.profit = rec.profit;
          t.amount = rec.profit;
          t.resultSource = "ctrader_deal_confirmed";
          t.closeTime = new Date(rec.sellTime * 1000).toISOString().replace("T", " ").substring(0, 19);
          state.openTrade = null;
          const diff = hadResult ? (rec.profit - oldPnl) : rec.profit;
          state.dailyNetPnl = Number(((state.dailyNetPnl || 0) + diff).toFixed(2));
          saveState();
          saveTrades(trades);
          if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
            state.dailyTargetReached = true;
            state.dailyTargetDate = todayStr;
          }
          await sendTelegram(`${t.result === "WIN" ? "✅" : "❌"} *${REPO_LABEL} — Trade ${t.result} (Broker Native Exit)*\n\n💵 P&L: *${rec.profit >= 0 ? `+$${rec.profit.toFixed(2)}` : `-$${Math.abs(rec.profit).toFixed(2)}`}*`);
        } else {
          // Fallback: Contract is confirmed closed on broker (absent from entire broker portfolio). Reconcile to unblock execution gate.
          t.result = "CLOSED_EXTERNAL";
          t.serverPnl = 0;
          t.resultSource = "server_portfolio_reconciled";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.openTrade = null;
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
    console.log(`[${REPO_LABEL}] fetchAllData error: ${e.message}`);
    return;
  }
  const { m5: candles, m15: m15Candles, m30: m30Candles, d1: d1Candles } = scanData;

  if (!candles || candles.length < 120 || !m15Candles || !m30Candles || !d1Candles) {
    console.log(`[${REPO_LABEL}] Incomplete candle set: m5=${candles?.length || 0}, m15=${m15Candles?.length || 0}, m30=${m30Candles?.length || 0}, d1=${d1Candles?.length || 0}`);
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

  // Indicators for V100 1s & V75 1s Architecture
  const stoch200 = calculateStoch(candles, 200, 1, 1);
  const macd2575 = calculateMACD(candles, 25, 75, 1);
  const stoch1558 = calculateStoch(candles, 15, 5, 8);
  const stoch100 = calculateStoch(candles, 100, 1, 1);
  const sK100 = stoch100.k[si], prevK100 = stoch100.k[si - 1];
  const stoch3025 = calculateStoch(candles, 30, 2, 5, "Simple");
  const sK3025 = stoch3025.k[si], sD3025 = stoch3025.d[si], prevK3025 = stoch3025.k[si - 1], prevD3025 = stoch3025.d[si - 1];

  // Stoch (30,25,15 Simple) for V25 Tea Re-Entry Engine
  const stoch302515 = calculateStoch(candles, 30, 25, 15, "Simple");
  const sK302515 = stoch302515.k[si], sD302515 = stoch302515.d[si], prevK302515 = stoch302515.k[si - 1], prevD302515 = stoch302515.d[si - 1];

  const sK200 = stoch200.k[si], prevK200 = stoch200.k[si - 1];
  const macdVal = macd2575.macd[si], prevMacdVal = macd2575.macd[si - 1];
  const sK15 = stoch1558.k[si], prevK15 = stoch1558.k[si - 1];

  // Stoch (15,2,5) for Volatility 100 (R_100 Milk Machine) & Auxiliary Re-Entries
  const stoch1525 = calculateStoch(candles, 15, 2, 5);
  const sK1525 = stoch1525.k[si], sD1525 = stoch1525.d[si], prevK1525 = stoch1525.k[si - 1], prevD1525 = stoch1525.d[si - 1];

  // Stoch (25,2,5) for V25 Midline Momentum Exhaustion
  const stoch2525 = calculateStoch(candles, 25, 2, 5);
  const sK2525 = stoch2525.k[si], sD2525 = stoch2525.d[si], prevK2525 = stoch2525.k[si - 1], prevD2525 = stoch2525.d[si - 1];

  // Secondary Fast Stoch (5,3,3) for backward compatibility
  const stoch533 = calculateStoch(candles, 5, 3, 3);
  const sK533 = stoch533.k[si], sD533 = stoch533.d[si], prevK533 = stoch533.k[si - 1], prevD533 = stoch533.d[si - 1];

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];

  if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" || SYMBOL === "R_25") {
    console.log(`[${REPO_LABEL}] V25 Null Check: sK100=${sK100}, prevK100=${prevK100}, sK3025=${sK3025}, prevK3025=${prevK3025}, sK302515=${sK302515}, prevK302515=${prevK302515}, sD302515=${sD302515}, prevD302515=${prevD302515}, currentEma100=${currentEma100}`);
    if (sK100 === null || prevK100 === null || sK3025 === null || prevK3025 === null || sK302515 === null || prevK302515 === null || sD302515 === null || prevD302515 === null || currentEma100 === null) {
      console.log(`[${REPO_LABEL}] ⚠️ V25 Null check TRIPPED! Returning early.`);
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || SYMBOL === "1HZ75V") {
    if (sK100 === null || prevK100 === null || sK3025 === null || prevK3025 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
    if (sK200 === null || prevK200 === null || macdVal === null || sK533 === null || prevK533 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    if (sK200 === null || prevK200 === null || macdVal === null || sK533 === null || prevK533 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") {
    if (sK200 === null || prevK200 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || SYMBOL === "R_50" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
    if (sK200 === null || prevK200 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
    if (sK === null || prevK === null || cVal === null || prevCci === null || sK1525 === null || prevK1525 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    if (sK === null || prevK === null || sK1525 === null || prevK1525 === null) {
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
    const pnl = currentPnl;
    // 🛡️ RUNNER IMMUNITY: Trades with PnL >= $3.50 or active Trend-Rider ratchet are managed by the Tiered Dynamic Ratchet
    // and are immune to sensitive M5 indicator exhaustion exits (Stoch 50, Stoch 65/35, CCI 0)
    const isRunner = Boolean(t.trendRidingActive || currentPnl >= 3.50 || (t.maxUnrealizedPnL && t.maxUnrealizedPnL >= 4.00));
    const inProfitExhaustion = !isRunner && (currentPnl > 0.00) && (!t.entryEpoch || candles[si].epoch > t.entryEpoch);
    if (inProfitExhaustion) {
      const isCciInstrument = (
        STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || 
        STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || 
        SYMBOL === "R_25"
      );

      let trendExhausted = false;
      let exhaustionDetail = "";

      if (isCciInstrument) {
        // CCI Level 0 Adverse Crossover Invalidation & Stoch Midline (50) Profit Exit for V25
        const cciExhausted = isBuy
          ? (prevCci !== null && cVal !== null && prevCci > 0.0 && cVal <= 0.0)
          : (prevCci !== null && cVal !== null && prevCci < 0.0 && cVal >= 0.0);
        // Stoch Midline (50) Profit Exit: Evaluates genuine momentum exhaustion on confirmed closed M5 candle
        // Checks both Stoch (15,2,5) and Stoch (25,2,5) crossing Level 50 opposite while in profit (>= +$1.00)
        const stoch15Cross50Adverse = isBuy
          ? (prevK1525 !== null && sK1525 !== null && prevK1525 > 50.0 && sK1525 <= 50.0)
          : (prevK1525 !== null && sK1525 !== null && prevK1525 < 50.0 && sK1525 >= 50.0);
        const stoch25Cross50Adverse = isBuy
          ? (prevK2525 !== null && sK2525 !== null && prevK2525 > 50.0 && sK2525 <= 50.0)
          : (prevK2525 !== null && sK2525 !== null && prevK2525 < 50.0 && sK2525 >= 50.0);
        const v25Stoch50ProfitExit = (stoch15Cross50Adverse || stoch25Cross50Adverse) && currentPnl >= 0.50;

        if (v25Stoch50ProfitExit) {
          trendExhausted = true;
          exhaustionDetail = `Closed-M5 Stoch Midline (50) Profit Exit — %K crossed Level 50 opposite (%K15: ${sK1525?.toFixed(1)}, %K25: ${sK2525?.toFixed(1)}) securing +${currentPnl.toFixed(2)}`;
        } else if (cciExhausted && !isRunner && currentPnl >= 0.50) {
          trendExhausted = true;
          exhaustionDetail = `M5 CCI (${cVal !== null ? cVal.toFixed(1) : 0}, prev: ${prevCci !== null ? prevCci.toFixed(1) : 0}) crossed ${isBuy ? "<= 0.0 baseline" : ">= 0.0 baseline"}`;
        }
      } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || SYMBOL === "R_50" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
        // Volatility 100 (R_100) Closed-M5 Stoch (25,2,5) 65/35 Profit Exit (when in profit >= $1.00):
        // BUY: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses below 65.0
        // SELL: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses above 35.0
        const v100Stoch25Cross65Buy = isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 >= 65.0 && sK2525 < 65.0;
        const v100Stoch25Cross35Sell = !isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 <= 35.0 && sK2525 > 35.0;
        const v100Exhausted = (v100Stoch25Cross65Buy || v100Stoch25Cross35Sell) && currentPnl >= 0.50;
        if (v100Exhausted) {
          trendExhausted = true;
          exhaustionDetail = `Closed-M5 Stoch (25,2,5) 65/35 Profit Exit — %K (${sK2525 !== null ? sK2525.toFixed(1) : "N/A"}, prev: ${prevK2525 !== null ? prevK2525.toFixed(1) : "N/A"}) crossed ${isBuy ? "below 65.0" : "above 35.0"} securing +${currentPnl.toFixed(2)}`;
        }
      } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50") {
        // Volatility 50 (R_50) Closed-M5 Stoch (25,2,5) Midline (50) Profit Exit (when in profit >= $0.50):
        // BUY: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses below 50.0
        // SELL: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses above 50.0
        const v50Stoch25Cross50Buy = isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 >= 50.0 && sK2525 < 50.0;
        const v50Stoch25Cross50Sell = !isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 <= 50.0 && sK2525 > 50.0;
        const v50Exhausted = (v50Stoch25Cross50Buy || v50Stoch25Cross50Sell) && currentPnl >= 0.50;
        if (v50Exhausted) {
          trendExhausted = true;
          exhaustionDetail = `Closed-M5 Stoch (25,2,5) Midline (50) Profit Exit — %K (${sK2525 !== null ? sK2525.toFixed(1) : "N/A"}, prev: ${prevK2525 !== null ? prevK2525.toFixed(1) : "N/A"}) crossed Level 50 opposite securing +${currentPnl.toFixed(2)}`;
        }
      } else if (
        STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || 
        STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || 
        SYMBOL === "1HZ75V" ||
        STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || 
        STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || 
        SYMBOL === "1HZ100V" ||
        STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" ||
        SYMBOL === "1HZ25V"
      ) {
        // Volatility 75 (1s) (1HZ75V), Volatility 100 (1s) (1HZ100V) & Volatility 25 (1s) (1HZ25V) Closed-M5 Stoch (25,2,5) Midline (50) Profit Exit (when in profit >= $0.50):
        // BUY: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses below 50.0
        // SELL: Closes on a closed M5 candle if Stoch (25,2,5) %K crosses above 50.0
        const vStoch25Cross50Buy = isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 >= 50.0 && sK2525 < 50.0;
        const vStoch25Cross50Sell = !isBuy && prevK2525 !== null && sK2525 !== null && prevK2525 <= 50.0 && sK2525 > 50.0;
        // Profitable trades are strictly managed by the Centralized Dynamic Trailing Ratchet;
        // Midline oscillator exits are ONLY evaluated as early invalidations when in LOSS (currentPnl < 0).
        const vExhausted = (vStoch25Cross50Buy || vStoch25Cross50Sell) && currentPnl < 0;
        if (vExhausted) {
          trendExhausted = true;
          exhaustionDetail = `Closed-M5 Stoch (25,2,5) Midline (50) Loss Invalidation — %K (${sK2525 !== null ? sK2525.toFixed(1) : "N/A"}, prev: ${prevK2525 !== null ? prevK2525.toFixed(1) : "N/A"}) crossed Level 50 opposite in adverse position (${currentPnl.toFixed(2)})`;
        }
      } else {
        // Standardized Auxiliary Stochastic (15, 2, 5) Level 50 Midline Adverse Crossover (Only when in LOSS)
        const stoch1525Exhausted = isBuy
          ? (prevK1525 !== null && sK1525 !== null && prevK1525 > 50.0 && sK1525 <= 50.0)
          : (prevK1525 !== null && sK1525 !== null && prevK1525 < 50.0 && sK1525 >= 50.0);
        if (stoch1525Exhausted && currentPnl < 0) {
          trendExhausted = true;
          exhaustionDetail = `M5 Aux Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : 50}, prev: ${prevK1525 !== null ? prevK1525.toFixed(1) : 50}) crossed ${isBuy ? "<= 50.0 midline" : ">= 50.0 midline"} in loss (${currentPnl.toFixed(2)})`;
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

    // Active Trade Exits for PROFILE_V100_STOCH200_STOCH15 (Standardized: V100 Milk, V25 Tea, V50 OmniSight)
    if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || SYMBOL === "R_50" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
      const isBuy = t.direction === "BUY";
      const m5Close = parseFloat(candles[si].close);
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = currentPnl < 0;

      // Early Exit 2: Opposite M5 Fractal Cross (Strictly when in loss)
      const fracAnchor = t.m5Fractal || (isBuy ? findRecentFractalBelow(candles, si, t.entry) : findRecentFractalAbove(candles, si, t.entry));
      const m5FractalCrossed = isPostEntryCandle && (isBuy
        ? (fracAnchor !== null && m5Close < fracAnchor)
        : (fracAnchor !== null && m5Close > fracAnchor));

      // Early Exit 3: Entry-Hour H1 Candle Closed Against Position (Strictly when in loss)
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      let earlyExitTriggered = false;
      let earlyExitType = "";
      let earlyExitDesc = "";

      if (isRunner) {
        // 🛡️ RUNNER IMMUNITY: Position is in profit and protected by Tiered Ratchet (Tier 2-4: 70-80% locked)
        // Do NOT close on minor pullback oscillations
      } else if (inLoss && m5FractalCrossed) {
        earlyExitTriggered = true;
        earlyExitType = "Opposite M5 Fractal Cross Exit";
        earlyExitDesc = `M5 candle closed at ${m5Close.toFixed(4)} crossing opposite M5 fractal (${fracAnchor !== null ? fracAnchor.toFixed(4) : "N/A"}) while in loss (${currentPnl.toFixed(2)})`;
      } else if (inLoss && h1ClosedAgainst) {
        earlyExitTriggered = true;
        earlyExitType = "Entry-Hour H1 Adverse Close Exit";
        earlyExitDesc = `Entry hour H1 closed adverse (H1 Open: ${h1OpenPrice !== null ? h1OpenPrice.toFixed(4) : "N/A"}, H1 Close: ${m5Close.toFixed(4)}) while in loss (${currentPnl.toFixed(2)})`;
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

    // Active Trade Exits for PROFILE_V25_1S_STOCH200_STOCH15 (Ice Cream V25 1s)
    if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") {
      const isBuy = t.direction === "BUY";
      const m5Close = parseFloat(candles[si].close);
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;

      // Early Invalidation #1: 3 Consecutive M5 Candles Closed Against Position Immediately After Entry (Strictly in loss)
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
          break;
        }
      }

      if (!isRunner && currentPnl < 0 && adverseCandleCount >= 3) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY INVALIDATION] 3 consecutive M5 candles closed against ${t.direction} position while in loss (${currentPnl.toFixed(2)}). Exiting immediately.`);
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

      // Early Invalidation #2: M5 Stoch 200 Crosses Adverse to Trend Direction (Strictly in loss on closed M5)
      // BUY: Stoch 200 < 45.0 / SELL: Stoch 200 > 55.0
      if (!isRunner && currentPnl < 0 && isPostEntryCandle && sK200 !== null) {
        const stoch200Adverse = isBuy ? (sK200 < 45.0) : (sK200 > 55.0);
        if (stoch200Adverse) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH 200 EXIT] M5 Stoch 200 crossed ${isBuy ? "below 45.0" : "above 55.0"} (${sK200.toFixed(1)}) while in loss (${currentPnl.toFixed(2)}). Invalidation exit triggered.`);
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
            await sendTelegram(`${icon} *${REPO_LABEL} — Stoch 200 Adverse Trend Invalidation*\n\nM5 Stoch 200 crossed *${isBuy ? "below 45.0" : "above 55.0"}* (${sK200.toFixed(1)}) on M5 close.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 200 EXIT] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Early Invalidation #3: Entry-Hour H1 Candle Closed Against Position (Strictly in loss with 30m age gate)
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      if (!isRunner && currentPnl < 0 && h1Eval.triggered) {
        closingContracts.add(t.contractId);
        console.log(`[H1 ADVERSE CLOSE] Entry hour H1 closed adverse against active ${t.direction} trade while in loss (${currentPnl.toFixed(2)}). Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[H1 ADVERSE ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          await sendTelegram(`${icon} *${REPO_LABEL} — Entry-Hour H1 Adverse Close Exit*\n\nEntry hour H1 candle closed against ${t.direction} position.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[H1 ADVERSE] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
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

      if (!isRunner && currentPnl < 0 && adverseCandleCount >= 3) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY INVALIDATION] 3 consecutive M5 candles closed against ${t.direction} position while in loss (${currentPnl.toFixed(2)}). Exiting immediately.`);
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

      // Early Invalidation #2: M5 Stoch 200 Crosses Adverse to Position Confirmed on M5 Close (Strictly in loss)
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;
      if (!isRunner && currentPnl < 0 && isPostEntryCandle && sK200 !== null) {
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
            await sendTelegram(`${icon} *${REPO_LABEL} — Stoch 200 Adverse Invalidation*\n\nM5 ${macroTrendStochLabel} crossed *${isBuy ? "below" : "above"} 50.0* (${macroTrendStochVal.toFixed(1)}) on M5 close.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 200 EXIT] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Early Invalidation #3: Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction Early Exit (Strictly in loss)
      const stoch15OppositeCross = isPostEntryCandle && (isBuy
        ? (sK1525 !== null && prevK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0)
        : (sK1525 !== null && prevK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0));

      if (!isRunner && currentPnl < 0 && stoch15OppositeCross) {
        closingContracts.add(t.contractId);
        console.log(`[STOCH 1525 LEVEL 50 EXIT] Active ${t.direction} #${t.contractId}: Closed-M5 Stoch (15,2,5) %K crossed Level 50 in opposite direction (%K: ${sK1525.toFixed(1)}, prev: ${prevK1525.toFixed(1)}) while in loss ($${currentPnl.toFixed(2)}). Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[STOCH 1525 LEVEL 50 EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          await sendTelegram(`${icon} *${REPO_LABEL} — Stoch (15,2,5) Opposite Level 50 Cross Exit*\n\nClosed-M5 Stoch (15,2,5) %K crossed *Level 50 in opposite direction* (%K: ${sK1525.toFixed(1)}, prev: ${prevK1525.toFixed(1)}).\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[STOCH 1525 LEVEL 50 EXIT] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V75_EMA_STOCH15 (V75 4-Condition Structural Retracement Model)
    if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      const isBuy = t.direction === "BUY";
      const pnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = pnl < 0;
      const m5Close = parseFloat(candles[si].close);

      // Early Exit 1: Stoch (15,2,5 Simple) %K crossing %D in opposite direction while in loss (on candle after entry)
      let stochOpposite = false;
      if (sK !== null && sD !== null && prevK !== null && prevD !== null && inLoss && (!t.entryEpoch || candles[si].epoch > t.entryEpoch)) {
        const oppositeCross = isBuy ? (prevK >= prevD && sK < sD) : (prevK <= prevD && sK > sD);
        if (oppositeCross) {
          stochOpposite = true;
        }
      }

      // Early Exit 2: Entry-Hour H1 Adverse Close Exit
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      let earlyExitTriggered = false;
      let exitReason = "";
      let exitDetail = "";

      if (stochOpposite) {
        earlyExitTriggered = true;
        exitReason = "Stoch %K/%D Opposite Cross Early Exit";
        exitDetail = `M5 Stoch (15,2,5 Simple) opposite direction (%K: ${sK.toFixed(1)} vs %D: ${sD.toFixed(1)}) while in loss ($${pnl.toFixed(2)})`;
      } else if (!isRunner && h1ClosedAgainst) {
        earlyExitTriggered = true;
        exitReason = "Entry-Hour H1 Adverse Close Exit";
        exitDetail = `Entry-hour H1 closed adverse (H1 Open: ${h1OpenPrice.toFixed(2)}, H1 Close: ${m5Close.toFixed(2)})`;
      }

      if (earlyExitTriggered) {
        closingContracts.add(t.contractId);
        console.log(`[V75 EARLY EXIT] Active ${t.direction}: ${exitDetail}. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[V75 EARLY EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          await sendTelegram(
            `${icon} *${REPO_LABEL} — ${exitReason}*\n\n` +
            `Active *${t.direction}* in floating loss: *${pnlStr}*.\n` +
            `• ${exitDetail}\n` +
            `Position liquidated immediately to protect capital.\n` +
            `Contract: \`${t.contractId}\``
          );
        } catch (e) {
          console.error(`[V75 EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V75_1S_TREND_MACD_STOCH533, PROFILE_V10_TREND_MACD_STOCH533 (and PROFILE_V75_1S_EMA_STOCH15)
    if (STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
      const isBuy = t.direction === "BUY";
      const pnl = calcUnrealizedPnL(t, currentPrice);

      // Invalidation 1: 3 Consecutive M5 Candles Closed Against Position Immediately After Entry
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

      if (!isRunner && pnl < 0 && adverseCandleCount >= 3) {
        closingContracts.add(t.contractId);
        console.log(`[EARLY INVALIDATION] 3 consecutive M5 candles closed against ${t.direction} position while not in runner status. Exiting immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[EARLY INVALIDATION ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          await sendTelegram(`${icon} *${REPO_LABEL} — 3 Adverse M5 Candles Invalidation*\n\n3 consecutive M5 candles closed against ${t.direction} position.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[EARLY INVALIDATION] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }

      // Invalidation 2: Macro Trend Stoch (100 for 1HZ75V, 200 for others) Crosses Adverse to Position on M5 Close
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;
      const macroTrendStochVal = (SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30") ? sK100 : sK200;
      const macroTrendStochLabel = (SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30") ? "Stoch 100" : "Stoch 200";
      if (!isRunner && pnl < 0 && isPostEntryCandle && macroTrendStochVal !== null) {
        const macroTrendAdverse = isBuy ? (macroTrendStochVal < 50.0) : (macroTrendStochVal > 50.0);
        if (macroTrendAdverse) {
          closingContracts.add(t.contractId);
          console.log(`[${macroTrendStochLabel.toUpperCase()} EXIT] M5 ${macroTrendStochLabel} crossed ${isBuy ? "below" : "above"} 50.0 (${macroTrendStochVal.toFixed(1)}). Invalidation exit triggered.`);
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error(`[STOCH 200 EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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

      // Invalidation 3 (V10 only — Stoch 5,3,3 completely removed from 1HZ75V per Trader Mandate Oct 18, 2026):
      // M5 Stoch (15,2,5) genuinely crosses Level 50 in opposite direction while trade is in loss on candle after entry
      if (SYMBOL !== "1HZ75V" && sK1525 !== null && prevK1525 !== null && pnl < 0 && (!t.entryEpoch || candles[si].epoch > t.entryEpoch)) {
        const stoch1525Adverse = isBuy ? (prevK1525 >= 50.0 && sK1525 < 50.0) : (prevK1525 <= 50.0 && sK1525 > 50.0);
        if (stoch1525Adverse) {
          closingContracts.add(t.contractId);
          console.log(`[STOCH 1525 LEVEL 50 LOSS EXIT] Active ${t.direction} in loss ($${pnl.toFixed(2)}): Stoch (15,2,5) %K crossed Level 50 in opposite direction (${sK1525.toFixed(1)}, prev: ${prevK1525.toFixed(1)}). Liquidating immediately.`);
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error(`[STOCH 1525 LEVEL 50 LOSS EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
            await sendTelegram(`${icon} *${REPO_LABEL} — Stoch (15,2,5) Midline Loss Exit*\n\nM5 Stoch (15,2,5) %K crossed *Level 50 in opposite direction* (${sK1525.toFixed(1)}, prev: ${prevK1525.toFixed(1)}) while in floating loss.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
          } catch (e) {
            console.error(`[STOCH 1525 LEVEL 50 LOSS EXIT] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      // Invalidation 4: Entry-Hour H1 Adverse Close Exit
      const m5Close = parseFloat(candles[si].close);
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      if (pnl < 0 && h1ClosedAgainst) {
        closingContracts.add(t.contractId);
        console.log(`[H1 ADVERSE CLOSE EXIT] Entry-hour H1 candle closed adverse to ${t.direction} position while in loss (${pnl.toFixed(2)}). Liquidating immediately.`);
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

    // Active Trade Early Exit for PROFILE_V25_STOCH200_CCI100 & PROFILE_V50_STOCH200_CCI150
    if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
      const isBuy = t.direction === "BUY";
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = currentPnl < 0;
      const m5Close = parseFloat(candles[si].close);
      const m5FractalSl = t.m5Fractal || t.sl;
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;
      const isV25Profile = (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || SYMBOL === "R_25");
      const isRunner = Boolean(t.runnerActive || t.isRunner);

      // 1. Previous M5 Fractal Break in loss
      const fractalBroken = isPostEntryCandle && (isBuy
        ? (m5FractalSl && m5Close < m5FractalSl)
        : (m5FractalSl && m5Close > m5FractalSl));

      // 2. Stoch (200,1,1) Adverse Cross (Strictly when in loss and not running in profit)
      const stoch200Adverse = isPostEntryCandle && sK !== null && (isBuy ? sK < 50.0 : sK > 50.0);

      // 3. Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction (V25 ONLY — V50 enters at 50 & uses Stoch 25 Midline profit exit)
      const stoch15OppositeCross = isV25Profile && isPostEntryCandle && (isBuy
        ? (sK1525 !== null && prevK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0)
        : (sK1525 !== null && prevK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0));

      // 4. Entry-Hour H1 Adverse Close Exit
      const h1Eval = evaluateH1AdverseClose(t, candles, si);
      const h1ClosedAgainst = h1Eval.triggered;
      const h1OpenPrice = h1Eval.h1OpenPrice || t.entry;

      let earlyExitTriggered = false;
      let exitReason = "";
      let exitDetail = "";

      if (inLoss && fractalBroken) {
        earlyExitTriggered = true;
        exitReason = "Previous M5 Fractal Early Exit";
        exitDetail = `M5 candle closed at ${m5Close.toFixed(2)} breaking previous M5 Fractal (${m5FractalSl.toFixed(2)}) while in loss (${currentPnl.toFixed(2)})`;
      } else if (!isRunner && inLoss && stoch200Adverse) {
        earlyExitTriggered = true;
        exitReason = "Stoch (200,1,1) Adverse Invalidation Exit";
        exitDetail = `M5 Stoch (200,1,1) crossed adverse to position (%K: ${sK.toFixed(1)} ${isBuy ? '< 50.0' : '> 50.0'}) while in loss (${currentPnl.toFixed(2)})`;
      } else if (inLoss && stoch15OppositeCross) {
        earlyExitTriggered = true;
        exitReason = "Stoch (15,2,5) Opposite Level 50 Cross Exit";
        exitDetail = `Closed-M5 Stoch (15,2,5) %K crossed Level 50 in opposite direction (%K: ${sK1525.toFixed(1)}, prev: ${prevK1525.toFixed(1)}) while in loss (${currentPnl.toFixed(2)})`;
      } else if (inLoss && h1ClosedAgainst) {
        earlyExitTriggered = true;
        exitReason = "Entry-Hour H1 Adverse Close Exit";
        exitDetail = `Entry-hour H1 closed adverse (H1 Open: ${h1OpenPrice.toFixed(2)}, H1 Close: ${m5Close.toFixed(2)}) while in loss (${currentPnl.toFixed(2)})`;
      }

      if (earlyExitTriggered) {
        closingContracts.add(t.contractId);
        console.log(`[${SYMBOL} EARLY EXIT] Active ${t.direction}: ${exitDetail}. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[EARLY EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          await sendTelegram(`${icon} *${REPO_LABEL} — ${exitReason}*\n\nActive *${t.direction}*: *${pnlStr}*.\n• ${exitDetail}\n💵 Final P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // =========================================================================
    // ADVERSE M15 FRACTAL EARLY EXIT (FAKEOUT MITIGATION FOR STOCH 18,12,25 BOTS)
    // =========================================================================
    const isStoch18Asset = 
      PROFILE.stochParams?.k === 18 && 
      PROFILE.stochParams?.d === 12 && 
      (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
       STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV");

    if (isStoch18Asset && m15Candles && m15Candles.length >= 5) {
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      
      // Only evaluate if the trade is in floating loss (underwater)
      if (currentPnl < 0) {
        const c = m15Candles;
        let adverseFractalDetected = false;
        let adverseFractalPrice = 0;

        for (let k = 2; k <= c.length - 3; k++) {
          const confirmationBarEpoch = c[k + 2].epoch;

          // The fractal must have completed after our entry was executed
          if (confirmationBarEpoch > t.entryEpoch) {
            if (t.direction === "BUY") {
              // For BUY: An opposing TOP fractal (swing high) formed at or below entry price
              const isTop = parseFloat(c[k].high) === Math.max(
                parseFloat(c[k-2].high), parseFloat(c[k-1].high), 
                parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high)
              );
              const fracHigh = parseFloat(c[k].high);
              if (isTop && fracHigh <= t.entry && currentPrice < t.entry) {
                adverseFractalDetected = true;
                adverseFractalPrice = fracHigh;
                break;
              }
            } else if (t.direction === "SELL") {
              // For SELL: An opposing BOTTOM fractal (swing low) formed at or above entry price
              const isBottom = parseFloat(c[k].low) === Math.min(
                parseFloat(c[k-2].low), parseFloat(c[k-1].low), 
                parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low)
              );
              const fracLow = parseFloat(c[k].low);
              if (isBottom && fracLow >= t.entry && currentPrice > t.entry) {
                adverseFractalDetected = true;
                adverseFractalPrice = fracLow;
                break;
              }
            }
          }
        }

        if (adverseFractalDetected) {
          closingContracts.add(t.contractId);
          console.log(`[FAKEOUT MITIGATION] Adverse M15 ${t.direction === "BUY" ? "Top" : "Bottom"} Fractal formed at ${adverseFractalPrice.toFixed(4)} opposite ${t.direction} trade while underwater (Entry: ${t.entry.toFixed(4)}, Spot: ${currentPrice.toFixed(4)}). Closing early.`);
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error(`[FAKEOUT MITIGATION ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
            const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
            await sendTelegram(
              `⚠️ *${REPO_LABEL} — Adverse M15 Fractal Early Exit (Fakeout Mitigated)*\n\n` +
              `Opposing M15 ${t.direction === "BUY" ? "Top" : "Bottom"} Fractal formed at *${adverseFractalPrice.toFixed(4)}* opposite entry *${t.entry.toFixed(4)}* while in loss.\n` +
              `Trade liquidated early to prevent -$2.50 full SL.\n` +
              `💵 P&L: *${pnlStr}*\n` +
              `Contract: \`${t.contractId}\``
            );
          } catch (e) {
            console.error(`[FAKEOUT MITIGATION] Failed to close contract ${t.contractId}:`, e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    }

    // Upgrade M15 Fractal SL if new favorable M15 structure forms
    if (m15Candles.length >= 5) {
      for (let k = 2; k <= m15Candles.length - 4; k++) {
        if (m15Candles[k + 2].epoch + M15 > t.entryEpoch) {
          const c = m15Candles;
          if (t.direction === "BUY") {
            const isBottom = parseFloat(c[k].low) === Math.min(parseFloat(c[k-2].low), parseFloat(c[k-1].low), parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low));
            const frac = parseFloat(c[k].low);
            if (isBottom && frac > t.sl) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded BUY SL to M15 Bottom Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (isTop && frac < t.sl) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded SELL SL to M15 Top Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          }
        }
      }
    }
  }

  // ── LIVE INDICATOR TELEMETRY UPDATES FOR DASHBOARD SYNCHRONIZATION ──
  state.strategyProfile = STRATEGY_PROFILE;
  state.stochVal = sK;
  state.stochSignal = sD;
  state.cciVal = cVal;
  state.envUpper = eUp;
  state.envLower = eLo;
  state.ema100Val = currentEma100;
  state.ema200Val = currentEma200;
  state.macdVal = macdVal;
  state.stoch533Val = sK533;
  state.stoch200Val = sK200;
  state.stoch1525Val = sK1525;
  state.stoch1525Signal = sD1525;
  state.stoch100Val = sK100;
  state.stoch3025Val = sK3025;
  state.stoch3025Signal = sD3025;
  state.stoch302515Val = sK302515;
  state.stoch302515Signal = sD302515;

  // Stoch 50 cross & status (Current cross OR 8-Hour Rolling Lookback OR Position Relative to 50)
  const stoch50CrossUpLookback = (prevK <= 50.0 && sK > 50.0) || checkStochastic8HrLookback(candles, stoch, "BUY", "MIDLINE");
  const stoch50CrossDownLookback = (prevK >= 50.0 && sK < 50.0) || checkStochastic8HrLookback(candles, stoch, "SELL", "MIDLINE");

  state.stoch50CrossUp = stoch50CrossUpLookback;
  state.stoch50CrossDown = stoch50CrossDownLookback;
  state.stoch50Above = sK > 50.0;
  state.stoch50Below = sK < 50.0;
  state.stoch50Cross = stoch50CrossUpLookback || stoch50CrossDownLookback || sK > 50.0 || sK < 50.0;

  // Track persistent cross epoch for Stoch 50
  if (stoch50CrossUpLookback || sK > 50.0) {
    if (!state.stoch50CrossEpoch || !state.stoch50CrossDir || state.stoch50CrossDir !== "BUY") {
      state.stoch50CrossEpoch = findStochasticCrossCandleEpoch(candles, stoch, "BUY", "MIDLINE") || m5BoundaryEpoch;
      state.stoch50CrossDir = "BUY";
    }
  } else if (stoch50CrossDownLookback || sK < 50.0) {
    if (!state.stoch50CrossEpoch || !state.stoch50CrossDir || state.stoch50CrossDir !== "SELL") {
      state.stoch50CrossEpoch = findStochasticCrossCandleEpoch(candles, stoch, "SELL", "MIDLINE") || m5BoundaryEpoch;
      state.stoch50CrossDir = "SELL";
    }
  } else {
    state.stoch50CrossEpoch = null;
    state.stoch50CrossDir = null;
  }

  // EMA 100 alignment status & persistent alignment epoch
  const emaBuyArmed = currentPrice > currentEma100;
  const emaSellArmed = currentPrice < currentEma100;
  state.ema100BuyArmed = emaBuyArmed;
  state.ema100SellArmed = emaSellArmed;
  state.emaAligned = emaBuyArmed ? "BUY" : (emaSellArmed ? "SELL" : null);

  if (emaBuyArmed) {
    if (!state.ema100AlignEpoch || state.emaAlignedDir !== "BUY") {
      state.ema100AlignEpoch = m5BoundaryEpoch;
      state.emaAlignedDir = "BUY";
    }
  } else if (emaSellArmed) {
    if (!state.ema100AlignEpoch || state.emaAlignedDir !== "SELL") {
      state.ema100AlignEpoch = m5BoundaryEpoch;
      state.emaAlignedDir = "SELL";
    }
  } else {
    state.ema100AlignEpoch = null;
    state.emaAlignedDir = null;
  }

  // Fast Stoch (5,3,3) status, directional latching & persistent cross epoch
  const stoch533BuyCross = (prevK533 <= 20.0 && sK533 > 20.0) || (prevD533 !== null && sD533 !== null && prevK533 <= prevD533 && sK533 > sD533 && (prevK533 <= 25.0 || sK533 <= 25.0));
  const stoch533SellCross = (prevK533 >= 80.0 && sK533 < 80.0) || (prevD533 !== null && sD533 !== null && prevK533 >= prevD533 && sK533 < sD533 && (prevK533 >= 75.0 || sK533 >= 75.0));

  if (stoch533BuyCross) {
    state.latchStoch533_BUY = true;
    state.latchStoch533_SELL = false;
  }
  if (stoch533SellCross) {
    state.latchStoch533_SELL = true;
    state.latchStoch533_BUY = false;
  }

  // De-alignment Protocol: If BUY-latched and candle subsequently closes back below 50, disarm
  if (state.latchStoch533_BUY && prevK533 >= 50.0 && sK533 < 50.0) {
    state.latchStoch533_BUY = false;
    dbg(`[STOCH 5,3,3 DISARM] Fast Stoch %K (${sK533.toFixed(2)}) closed back below 50. BUY trigger disarmed; awaiting fresh cross > 20.`);
  }
  // De-alignment Protocol: If SELL-latched and candle subsequently closes back above 50, disarm
  if (state.latchStoch533_SELL && prevK533 <= 50.0 && sK533 > 50.0) {
    state.latchStoch533_SELL = false;
    dbg(`[STOCH 5,3,3 DISARM] Fast Stoch %K (${sK533.toFixed(2)}) closed back above 50. SELL trigger disarmed; awaiting fresh cross < 80.`);
  }

  state.stoch533BuyCross = Boolean(stoch533BuyCross || state.latchStoch533_BUY);
  state.stoch533SellCross = Boolean(stoch533SellCross || state.latchStoch533_SELL);

  if (stoch533BuyCross || state.latchStoch533_BUY) {
    if (!state.stoch533CrossEpoch || state.stoch533CrossDir !== "BUY") {
      state.stoch533CrossEpoch = m5BoundaryEpoch;
      state.stoch533CrossDir = "BUY";
    }
  } else if (stoch533SellCross || state.latchStoch533_SELL) {
    if (!state.stoch533CrossEpoch || state.stoch533CrossDir !== "SELL") {
      state.stoch533CrossEpoch = m5BoundaryEpoch;
      state.stoch533CrossDir = "SELL";
    }
  } else {
    state.stoch533CrossEpoch = null;
    state.stoch533CrossDir = null;
  }

  // Envelope status (50 or 200 depending on profile)
  const envBuyActive = currentPrice > eUp;
  const envSellActive = currentPrice < eLo;
  state.envBuyActive = envBuyActive;
  state.envSellActive = envSellActive;
  state.envAligned = envBuyActive ? "BUY" : (envSellActive ? "SELL" : null);

  if (envBuyActive) {
    if (!state.envBreakoutEpoch || state.envBreakoutDir !== "BUY") {
      state.envBreakoutEpoch = m5BoundaryEpoch;
      state.envBreakoutDir = "BUY";
    }
  } else if (envSellActive) {
    if (!state.envBreakoutEpoch || state.envBreakoutDir !== "SELL") {
      state.envBreakoutEpoch = m5BoundaryEpoch;
      state.envBreakoutDir = "SELL";
    }
  } else {
    state.envBreakoutEpoch = null;
    state.envBreakoutDir = null;
  }

  // CCI status
  const cciCrossBuy = (prevCci !== null && cVal !== null) ? (prevCci <= -100.0 && cVal > -100.0) : false;
  const cciCrossSell = (prevCci !== null && cVal !== null) ? (prevCci >= 100.0 && cVal < 100.0) : false;
  state.cciCrossBuy = cciCrossBuy;
  state.cciCrossSell = cciCrossSell;
  state.cciAligned = (cVal !== null && cVal > 0) ? "BUY" : (cVal !== null && cVal < 0 ? "SELL" : null);

  if (cciCrossBuy) {
    state.cciCrossEpoch = m5BoundaryEpoch;
    state.cciCrossDir = "BUY";
  } else if (cciCrossSell) {
    state.cciCrossEpoch = m5BoundaryEpoch;
    state.cciCrossDir = "SELL";
  } else if (!state.cciCrossEpoch && cVal !== null) {
    if (cVal > -100 && cVal < 100) {
      state.cciCrossEpoch = m5BoundaryEpoch;
      state.cciCrossDir = cVal >= 0 ? "BUY" : "SELL";
    }
  }

  // Stoch Boundary status (20/80)
  const stoch20Cross8Hr = checkStochastic8HrLookback(candles, stoch, "BUY", "BOUNDARIES_20_80");
  const stoch80Cross8Hr = checkStochastic8HrLookback(candles, stoch, "SELL", "BOUNDARIES_20_80");
  state.stoch20CrossUp = (prevK <= 20.0 && sK > 20.0) || stoch20Cross8Hr;
  state.stoch80CrossDown = (prevK >= 80.0 && sK < 80.0) || stoch80Cross8Hr;
  state.stoch20Above = sK > 20.0;
  state.stoch80Below = sK < 80.0;
  state.stochAligned = (sK > sD) ? "BUY" : "SELL";

  if (state.stoch20CrossUp || sK > 20.0) {
    if (!state.stochBoundaryEpoch || state.stochBoundaryDir !== "BUY") {
      state.stochBoundaryEpoch = findStochasticCrossCandleEpoch(candles, stoch, "BUY", "BOUNDARIES_20_80") || m5BoundaryEpoch;
      state.stochBoundaryDir = "BUY";
    }
  } else if (state.stoch80CrossDown || sK < 80.0) {
    if (!state.stochBoundaryEpoch || state.stochBoundaryDir !== "SELL") {
      state.stochBoundaryEpoch = findStochasticCrossCandleEpoch(candles, stoch, "SELL", "BOUNDARIES_20_80") || m5BoundaryEpoch;
      state.stochBoundaryDir = "SELL";
    }
  } else {
    state.stochBoundaryEpoch = null;
    state.stochBoundaryDir = null;
  }
  saveState();

  writeToLedger(m5BoundaryEpoch, currentPrice, cVal, sK, sD, eUp, eLo, (state.armed && state.armed.lbl) ? state.armed.lbl : "IDLE", `EMA100:${currentEma100 ? currentEma100.toFixed(2) : "0"}`);

  // Evaluate Opposite M15 Fractal Fakeout Early Exit for open trades on Stoch 18,12,25 instruments
  await checkOppositeFractalFakeoutExit(m15Candles, currentPrice);

  // Evaluate Loss Recovery / Rescue Entry if parent trade is active and floating in loss
  await checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch);

  // Protect profits: If daily target or daily max loss limit reached, do NOT evaluate new trade entries!
  if (state.dailyTargetReached) {
    console.log(`[${REPO_LABEL}] 🎯 Daily target (+$7.00) already secured today. Idling until 00:00 UTC rollover.`);
    state.lastProcessedEpoch = m5BoundaryEpoch;
    saveState();
    return;
  }
  if (state.dailyMaxLossReached) {
    console.log(`[${REPO_LABEL}] 🛡️ Daily max loss limit (-$4.00) reached. Idling until 00:00 UTC rollover to protect capital.`);
    state.lastProcessedEpoch = m5BoundaryEpoch;
    saveState();
    return;
  }

  // ── A. QUANTITATIVE STATE MACHINE & SIGNAL RESOLUTION ──
  if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    /*
     AUTHORITATIVE V75 TRADER SPECIFICATION (OCTOBER 17-22, 2026):
     - Hard Filters: Never BUY when price is below EMA 100; Never SELL when price is above EMA 100.
     - Initial Entry (2-Step Breakout Wave):
       1. Condition 1 (Arming): Price crosses above both EMA 100 & EMA 200 (BUY) or below both EMA 100 & EMA 200 (SELL).
       2. Condition 2 (Trigger): Fresh M5 Stoch (15,2,5 Simple) %K cross above 50.0 (BUY) or below 50.0 (SELL).
          Strict Invalidation: If M5 Stoch is already beyond 50.0 (>50 BUY / <50 SELL), the setup is invalid and will not trigger.
     - Retracement Entry (2-Step Pullback Wave):
       1. Condition 1 (Arming): Price physically touches EMA 100 (Low <= EMA 100 && High >= EMA 100).
       2. Condition 2 (Trigger): Fresh M5 Stoch (15,2,5 Simple) %K cross above 20 with Close > EMA 100 (BUY), or below 80 with Close < EMA 100 (SELL).
    */
    const currCandle = candles[si];
    const prevCandle = candles[si - 1];
    const cClose = parseFloat(currCandle.close);
    const cLow = parseFloat(currCandle.low);
    const cHigh = parseFloat(currCandle.high);
    const prevClose = parseFloat(prevCandle.close);
    const prevEma100 = ema100[si - 1];
    const prevEma200 = ema200[si - 1];

    const isAboveBothEma = currentEma100 !== null && currentEma200 !== null && cClose > currentEma100 && cClose > currentEma200;
    const isBelowBothEma = currentEma100 !== null && currentEma200 !== null && cClose < currentEma100 && cClose < currentEma200;

    // 1. Wave Management & Initial Entry Arming
    // Confirmation of BUY wave: Price closes ABOVE both EMA 100 & EMA 200
    if (isAboveBothEma) {
      // If price broke out upwards from a SELL wave, terminate the SELL wave!
      if (state.v75_initialSellDone || state.v75_initialSellArmed) {
        dbg(`[V75 WAVE] Price broke above both EMAs (${cClose.toFixed(2)} > EMA100 ${currentEma100?.toFixed(2)} & EMA200 ${currentEma200?.toFixed(2)}). Terminating SELL trend wave.`);
        state.v75_initialSellArmed = false;
        state.v75_initialSellDone = false;
        state.v75_emaTouched_SELL = false;
        state.ema100SellArmed = false;
      }
      // If initial BUY has NOT yet fired in this wave, arm Initial BUY
      if (!state.v75_initialBuyDone) {
        state.v75_initialBuyArmed = true;
      }
    }

    // Confirmation of SELL wave: Price closes BELOW both EMA 100 & EMA 200
    if (isBelowBothEma) {
      // If price broke out downwards from a BUY wave, terminate the BUY wave!
      if (state.v75_initialBuyDone || state.v75_initialBuyArmed) {
        dbg(`[V75 WAVE] Price broke below both EMAs (${cClose.toFixed(2)} < EMA100 ${currentEma100?.toFixed(2)} & EMA200 ${currentEma200?.toFixed(2)}). Terminating BUY trend wave.`);
        state.v75_initialBuyArmed = false;
        state.v75_initialBuyDone = false;
        state.v75_emaTouched_BUY = false;
        state.ema100BuyArmed = false;
      }
      // If initial SELL has NOT yet fired in this wave, arm Initial SELL
      if (!state.v75_initialSellDone) {
        state.v75_initialSellArmed = true;
      }
    }

    // Initial Entry Arm Disarming (ONLY before initial trade fires):
    // If price drops back below EMA 100 or EMA 200 before initial BUY triggers, disarm initial BUY arming
    if (!isAboveBothEma && !state.v75_initialBuyDone) {
      state.v75_initialBuyArmed = false;
    }
    // If price rises back above EMA 100 or EMA 200 before initial SELL triggers, disarm initial SELL arming
    if (!isBelowBothEma && !state.v75_initialSellDone) {
      state.v75_initialSellArmed = false;
    }

    // 2. Retracement Entry Condition 1: Price Physically Touches EMA 100 (Low <= EMA 100 && High >= EMA 100)
    // Freshness Mandate: Retrace touch must occur strictly AFTER the previous trade entry AND after previous trade closed!
    let lastTradeClosedEpoch = state.lastClosedTradeEpoch || 0;
    if (!lastTradeClosedEpoch && trades && trades.length > 0) {
      const closed = trades.filter(t => t.result && t.closeTime);
      if (closed.length > 0) {
        const lastT = closed[closed.length - 1];
        lastTradeClosedEpoch = lastT.closeEpoch || Math.floor(new Date(lastT.closeTime).getTime() / 1000) || 0;
      }
    }
    const touchFloorEpoch = Math.max(state.lastTriggeredEpoch || 0, lastTradeClosedEpoch || 0);

    let recentTouchEma100Buy = false;
    let recentTouchEma100Sell = false;
    const lookbackLimit = Math.max(0, si - 30);

    for (let k = si; k >= lookbackLimit; k--) {
      if (touchFloorEpoch && candles[k].epoch <= touchFloorEpoch) break;
      const kLow = parseFloat(candles[k].low), kHigh = parseFloat(candles[k].high);
      const e100 = ema100[k];
      if (e100 !== null && kLow <= e100 && kHigh >= e100) {
        // BUY re-entry requires macro alignment EMA 100 > EMA 200
        if (currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200) {
          recentTouchEma100Buy = true;
        }
        // SELL re-entry requires macro alignment EMA 100 < EMA 200
        if (currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200) {
          recentTouchEma100Sell = true;
        }
        break;
      }
    }

    if (recentTouchEma100Buy && state.v75_initialBuyDone) {
      state.v75_emaTouched_BUY = true;
    }
    if (recentTouchEma100Sell && state.v75_initialSellDone) {
      state.v75_emaTouched_SELL = true;
    }

    // Macro filter safety dealignment: if EMAs cross adversely, clear the touch latch!
    if (currentEma100 !== null && currentEma200 !== null) {
      if (currentEma100 <= currentEma200) {
        state.v75_emaTouched_BUY = false;
        state.ema100BuyArmed = false;
      }
      if (currentEma100 >= currentEma200) {
        state.v75_emaTouched_SELL = false;
        state.ema100SellArmed = false;
      }
    }

    // Dashboard arming telemetry
    const isV75Reentry = Boolean(state.v75_initialBuyDone || state.v75_initialSellDone);
    state.isReentryMode = isV75Reentry;
    const emaTouched = Boolean(state.v75_emaTouched_BUY || state.v75_emaTouched_SELL);
    const trendDir = isAboveBothEma ? "BUY" : isBelowBothEma ? "SELL" : (currentEma100 !== null && cClose > currentEma100 ? "BUY" : "SELL");

    if (isV75Reentry) {
      if (state.v75_initialBuyDone) {
        const macroBuy = currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200;
        if (!macroBuy) {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V75 BUY Re-Entry Paused — Macro Trend Mismatched (EMA 100 ${currentEma100 ? currentEma100.toFixed(2) : "N/A"} <= EMA 200 ${currentEma200 ? currentEma200.toFixed(2) : "N/A"})`;
        } else if (state.v75_emaTouched_BUY) {
          state.ema100BuyArmed = true;
          state.ema100SellArmed = false;
          state.armed = { dir: "BUY", lbl: `V75 EMA 100 Touched (BUY Re-Entry Armed @ ${currentEma100 ? currentEma100.toFixed(2) : "EMA100"})`, type: "RE_ENTRY", lvl: currentEma100 };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = `V75 Pullback Touched EMA 100 — Awaiting Stoch %K Fresh Cross > 20 for BUY Re-Entry`;
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V75 Awaiting EMA 100 Pullback Touch for BUY Re-Entry (BUY Trend Active | EMA 100 > EMA 200)`;
        }
      } else if (state.v75_initialSellDone) {
        const macroSell = currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200;
        if (!macroSell) {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V75 SELL Re-Entry Paused — Macro Trend Mismatched (EMA 100 ${currentEma100 ? currentEma100.toFixed(2) : "N/A"} >= EMA 200 ${currentEma200 ? currentEma200.toFixed(2) : "N/A"})`;
        } else if (state.v75_emaTouched_SELL) {
          state.ema100SellArmed = true;
          state.ema100BuyArmed = false;
          state.armed = { dir: "SELL", lbl: `V75 EMA 100 Touched (SELL Re-Entry Armed @ ${currentEma100 ? currentEma100.toFixed(2) : "EMA100"})`, type: "RE_ENTRY", lvl: currentEma100 };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = `V75 Pullback Touched EMA 100 — Awaiting Stoch %K Fresh Cross < 80 for SELL Re-Entry`;
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V75 Awaiting EMA 100 Pullback Touch for SELL Re-Entry (SELL Trend Active | EMA 100 < EMA 200)`;
        }
      }
    } else {
      // INITIAL ENTRY MODE:
      if (state.v75_initialBuyArmed && isAboveBothEma) {
        state.armed = { dir: "BUY", lbl: "V75 Price > EMA 100 & 200 (Initial BUY Armed)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `BUY Trend (Price > EMA 100 & 200) [Initial BUY Armed: Await Fresh %K > 50 (Invalid if already > 50)]`;
      } else if (state.v75_initialSellArmed && isBelowBothEma) {
        state.armed = { dir: "SELL", lbl: "V75 Price < EMA 100 & 200 (Initial SELL Armed)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `SELL Trend (Price < EMA 100 & 200) [Initial SELL Armed: Await Fresh %K < 50 (Invalid if already < 50)]`;
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.nextPhase = isAboveBothEma ? "BUY Trend (Price > EMA 100 & 200)" : isBelowBothEma ? "SELL Trend (Price < EMA 100 & 200)" : "Monitoring V75 Price vs EMAs";
      }
    }

    state.keyLevelTouched = emaTouched;
    state.levelTouched = emaTouched ? `EMA 100 Touch (${trendDir})` : null;
  } else if (STRATEGY_PROFILE !== "PROFILE_V50_STOCH200_CCI150" && STRATEGY_PROFILE !== "PROFILE_V25_STOCH200_CCI100" && STRATEGY_PROFILE !== "PROFILE_V100_STOCH200_STOCH15" && STRATEGY_PROFILE !== "PROFILE_V100_1S_TREND_MACD_STOCH" && STRATEGY_PROFILE !== "PROFILE_V75_1S_TREND_MACD_STOCH533" && STRATEGY_PROFILE !== "PROFILE_V10_TREND_MACD_STOCH533" && STRATEGY_PROFILE !== "PROFILE_V25_1S_STOCH200_STOCH15") {
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
  let calculatedFibTp = null;

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
  // 1.5 VOLATILITY 75 (R_75) 2-STEP INITIAL & RETRACEMENT MODEL
  else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
    const currCandle = candles[si];
    const cClose = parseFloat(currCandle.close);

    // Hard Directional Filters (Never BUY below EMA 100; Never SELL above EMA 100)
    const isAboveEma100 = currentEma100 !== null && cClose > currentEma100;
    const isBelowEma100 = currentEma100 !== null && cClose < currentEma100;
    const isAboveBothEma = currentEma100 !== null && currentEma200 !== null && cClose > currentEma100 && cClose > currentEma200;
    const isBelowBothEma = currentEma100 !== null && currentEma200 !== null && cClose < currentEma100 && cClose < currentEma200;

    // Fresh Stochastic (15,2,5 Simple) %K Level 50 Crossover for Initial Entry; Level 20/80 for Retracement Entry
    const stochFreshCrossUp50 = prevK !== null && sK !== null && prevK <= 50.0 && sK > 50.0;
    const stochFreshCrossDown50 = prevK !== null && sK !== null && prevK >= 50.0 && sK < 50.0;
    const stochAlreadyAbove50 = prevK !== null && sK !== null && prevK > 50.0 && sK > 50.0;
    const stochAlreadyBelow50 = prevK !== null && sK !== null && prevK < 50.0 && sK < 50.0;
    const stochFreshCrossUp20 = prevK !== null && sK !== null && prevK <= 20.0 && sK > 20.0;
    const stochFreshCrossDown80 = prevK !== null && sK !== null && prevK >= 80.0 && sK < 80.0;

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    // Setup 1: Initial Entries (Price > EMA 100 & 200 + Fresh %K > 50 for BUY / Price < EMA 100 & 200 + Fresh %K < 50 for SELL)
    // NOTE: Initial entries do NOT require EMA 100 vs EMA 200 alignment!
    // INVALIDATION RULE: If M5 Stoch (15,2,5 Simple) %K is already beyond Level 50.0, the setup is invalid and will not trigger.
    if (isAboveBothEma && state.v75_initialBuyArmed && !state.v75_initialBuyDone && stochFreshCrossUp50 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_INITIAL_BREAKOUT_STOCH50 (BUY)";
      state.v75_initialBuyDone = true;
      state.v75_initialBuyArmed = false;
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
    } else if (isAboveBothEma && state.v75_initialBuyArmed && !state.v75_initialBuyDone && stochAlreadyAbove50) {
      // Invalidation: Stoch %K is already above 50.0 -> do not trigger trade. Skip initial breakout to await EMA 100 pullback retracement
      dbg(`[V75 INITIAL] BUY Setup Invalid: Stoch %K (${sK.toFixed(1)}) already above 50.0 without fresh cross. Skipping initial trade -> awaiting Retracement.`);
      state.v75_initialBuyDone = true; // Mark initial wave passed so bot can watch for EMA 100 pullback
      state.v75_initialBuyArmed = false;
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
    } else if (isBelowBothEma && state.v75_initialSellArmed && !state.v75_initialSellDone && stochFreshCrossDown50 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_INITIAL_BREAKOUT_STOCH50 (SELL)";
      state.v75_initialSellDone = true;
      state.v75_initialSellArmed = false;
      state.v75_emaTouched_SELL = false;
      state.ema100SellArmed = false;
    } else if (isBelowBothEma && state.v75_initialSellArmed && !state.v75_initialSellDone && stochAlreadyBelow50) {
      // Invalidation: Stoch %K is already below 50.0 -> do not trigger trade. Skip initial breakout to await EMA 100 pullback retracement
      dbg(`[V75 INITIAL] SELL Setup Invalid: Stoch %K (${sK.toFixed(1)}) already below 50.0 without fresh cross. Skipping initial trade -> awaiting Retracement.`);
      state.v75_initialSellDone = true; // Mark initial wave passed so bot can watch for EMA 100 pullback
      state.v75_initialSellArmed = false;
      state.v75_emaTouched_SELL = false;
      state.ema100SellArmed = false;
    }
    // Setup 2: Retracement Entries (Subsequent trades strictly require EMA 100 > EMA 200 for BUY / EMA 100 < EMA 200 for SELL + EMA 100 retrace touch after last trade + fresh Stoch cross)
    else if (state.v75_initialBuyDone && currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200 && state.v75_emaTouched_BUY && isAboveEma100 && stochFreshCrossUp20 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_RETRACE_EMA100_STOCH20 (BUY)";
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
    } else if (state.v75_initialSellDone && currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200 && state.v75_emaTouched_SELL && isBelowEma100 && stochFreshCrossDown80 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V75_RETRACE_EMA100_STOCH80 (SELL)";
      state.v75_emaTouched_SELL = false;
      state.ema100SellArmed = false;
    }

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    if (state.v75_initialBuyDone && currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200 && state.v75_emaTouched_BUY && isAboveEma100 && stochFreshCrossUp20) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: "V75_RETRACE_EMA100_STOCH20 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100,
        currentEma200
      };
    } else if (state.v75_initialSellDone && currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200 && state.v75_emaTouched_SELL && isBelowEma100 && stochFreshCrossDown80) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: "V75_RETRACE_EMA100_STOCH80 (SELL)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100,
        currentEma200
      };
    }
  }
  // 2. STANDARDIZED M5 STOCH 200 (48/52) & M5 STOCH (15,2,5) ENGINE (V100, V50)
  else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || SYMBOL === "R_50" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
    const botPrefix = SYMBOL === "R_50" ? "V50" : "V100";
    const pfx = botPrefix.toLowerCase();
    const trendDirKey = pfx + "_trendDir";
    const stoch200CrossEpochKey = pfx + "_stoch200CrossEpoch";
    const stoch200ArmedKey = pfx + "_stoch200Armed";
    const initialEntryDoneKey = pfx + "_initialEntryDone";
    const stoch15CrossEpochKey = pfx + "_stoch15_50_crossEpoch";
    const stoch15CrossDirKey = pfx + "_stoch15_50_crossDir";

    // Migrate prior initialBuyDone / initialSellDone flags if initialEntryDone is not yet set
    if (state[initialEntryDoneKey] === undefined) {
      if (state[pfx + "_initialBuyDone"] || state[pfx + "_initialSellDone"]) {
        state[initialEntryDoneKey] = true;
      } else {
        state[initialEntryDoneKey] = false;
      }
    }

    // Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (Levels 48 and 52 Hysteresis Band)
    // - Crossing strictly above 52.0 arms BUY trend.
    // - Crossing strictly below 48.0 arms SELL trend.
    // - Hysteresis: Stays armed BUY as long as sK200 >= 48.0; stays armed SELL as long as sK200 <= 52.0.
    const stoch200FreshBuyArm = prevK200 !== null && sK200 !== null && sK200 > 52.0 && (prevK200 <= 52.0 || state[trendDirKey] !== "BUY");
    const stoch200FreshSellArm = prevK200 !== null && sK200 !== null && sK200 < 48.0 && (prevK200 >= 48.0 || state[trendDirKey] !== "SELL");

    if (stoch200FreshBuyArm) {
      state[trendDirKey] = "BUY";
      state[stoch200CrossEpochKey] = m5BoundaryEpoch;
      state[stoch200ArmedKey] = true;
      state[initialEntryDoneKey] = false; // Fresh trend wave: initial entry unlocked
      dbg("[" + botPrefix + " TREND] Stoch 200 crossed above 52.0 (%K: " + sK200.toFixed(2) + "). BUY ARMED.");
    } else if (stoch200FreshSellArm) {
      state[trendDirKey] = "SELL";
      state[stoch200CrossEpochKey] = m5BoundaryEpoch;
      state[stoch200ArmedKey] = true;
      state[initialEntryDoneKey] = false; // Fresh trend wave: initial entry unlocked
      dbg("[" + botPrefix + " TREND] Stoch 200 crossed below 48.0 (%K: " + sK200.toFixed(2) + "). SELL ARMED.");
    } else if (sK200 !== null) {
      // Dynamic Dealignment Check:
      // If trend is BUY but sK200 drops below 48.0 -> Dealignment from BUY, immediately flips to SELL!
      if (state[trendDirKey] === "BUY" && sK200 < 48.0) {
        state[trendDirKey] = "SELL";
        state[stoch200CrossEpochKey] = m5BoundaryEpoch;
        state[stoch200ArmedKey] = true;
        state[initialEntryDoneKey] = false;
        dbg("[" + botPrefix + " DEALIGN] Stoch 200 dropped below 48.0 (%K: " + sK200.toFixed(2) + "). BUY dealigned -> SELL armed.");
      } else if (state[trendDirKey] === "SELL" && sK200 > 52.0) {
        // If trend is SELL but sK200 rises above 52.0 -> Dealignment from SELL, immediately flips to BUY!
        state[trendDirKey] = "BUY";
        state[stoch200CrossEpochKey] = m5BoundaryEpoch;
        state[stoch200ArmedKey] = true;
        state[initialEntryDoneKey] = false;
        dbg("[" + botPrefix + " DEALIGN] Stoch 200 rose above 52.0 (%K: " + sK200.toFixed(2) + "). SELL dealigned -> BUY armed.");
      } else if (!state[trendDirKey]) {
        // Initialize on startup/restart
        if (sK200 >= 50.0) {
          state[trendDirKey] = "BUY";
          state[stoch200CrossEpochKey] = m5BoundaryEpoch;
          state[stoch200ArmedKey] = true;
        } else {
          state[trendDirKey] = "SELL";
          state[stoch200CrossEpochKey] = m5BoundaryEpoch;
          state[stoch200ArmedKey] = true;
        }
      }
    }

    // Condition 2: M5 Stoch (15,2,5) Levels 20, 50, 80
    const stoch15CrossUp50 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0;
    const stoch15CrossDown50 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0;

    if (stoch15CrossUp50) {
      state[stoch15CrossEpochKey] = m5BoundaryEpoch;
      state[stoch15CrossDirKey] = "BUY";
    } else if (stoch15CrossDown50) {
      state[stoch15CrossEpochKey] = m5BoundaryEpoch;
      state[stoch15CrossDirKey] = "SELL";
    }

    // Stoch 15 Dealignment:
    if (state[stoch15CrossDirKey] === "BUY" && sK1525 !== null && sK1525 < 50.0) {
      state[stoch15CrossDirKey] = null;
      state[stoch15CrossEpochKey] = null;
    } else if (state[stoch15CrossDirKey] === "SELL" && sK1525 !== null && sK1525 > 50.0) {
      state[stoch15CrossDirKey] = null;
      state[stoch15CrossEpochKey] = null;
    }

    const noActiveTrades = openTrades.length === 0;

    // 1. Initial Entry Trigger:
    // Unbounded: Initial entry stays open as long as Stochastic 200 remains armed without dealignment.
    // "Once one of them crosses, it waits for the next indicator to cross unless there is a dealignment."
    const stoch200AlignedBuy = state[trendDirKey] === "BUY" && sK200 !== null && sK200 >= 48.0;
    const stoch200AlignedSell = state[trendDirKey] === "SELL" && sK200 !== null && sK200 <= 52.0;

    // Universal EMA 100 Filter: BUY only if Price > EMA 100; SELL only if Price < EMA 100
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    const isInitialBuy = 
      noActiveTrades &&
      !state[initialEntryDoneKey] &&
      stoch200AlignedBuy &&
      emaBaselineBuy &&
      (
        stoch15CrossUp50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 UP
        (stoch200FreshBuyArm && state[stoch15CrossDirKey] === "BUY" && sK1525 !== null && sK1525 >= 50.0) // Stoch 15 crossed 50 UP first; Stoch 200 freshly arms BUY
      );

    const isInitialSell = 
      noActiveTrades &&
      !state[initialEntryDoneKey] &&
      stoch200AlignedSell &&
      emaBaselineSell &&
      (
        stoch15CrossDown50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 DOWN
        (stoch200FreshSellArm && state[stoch15CrossDirKey] === "SELL" && sK1525 !== null && sK1525 <= 50.0) // Stoch 15 crossed 50 DOWN first; Stoch 200 freshly arms SELL
      );

    // 2. Re-Entry Rule:
    // Strictly require initialEntryDone === true!
    // If Stoch 200 is already armed and aligned for Buy or Sell and there is NO existing open trade,
    // enter immediately when Stoch (15,2,5) freshly crosses level 20 for Buy (with Price > EMA 100) or level 80 for Sell (with Price < EMA 100).
    const stoch15FreshCross20Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 20.0 && sK1525 > 20.0;
    const stoch15FreshCross80Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 80.0 && sK1525 < 80.0;

    const isReentryBuy = noActiveTrades && state[initialEntryDoneKey] && stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross20Buy;
    const isReentrySell = noActiveTrades && state[initialEntryDoneKey] && stoch200AlignedSell && emaBaselineSell && stoch15FreshCross80Sell;

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    if (state[initialEntryDoneKey] && stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross20Buy) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: botPrefix + "_REENTRY_STOCH15_20 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (state[initialEntryDoneKey] && stoch200AlignedSell && emaBaselineSell && stoch15FreshCross80Sell) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: botPrefix + "_REENTRY_STOCH15_80 (SELL)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    }

    // Dashboard Arming State (Distinguish Initial Arming vs Re-Entry Waiting)
    if (stoch200AlignedBuy) {
      if (!state[initialEntryDoneKey]) {
        state.armed = { dir: "BUY", lbl: botPrefix + " Stoch200 > 52 (Initial BUY Armed" + (emaBaselineBuy ? "" : " - Await Price > EMA100") + ")", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = botPrefix + " Initial BUY Armed — Awaiting Stoch 15 Level 50 Cross (EMA100 Filter: " + (emaBaselineBuy ? "PASS" : "BLOCK") + ")";
      } else {
        state.isReentryMode = true;
        const inPullback = sK1525 !== null && sK1525 <= 25.0;
        if (inPullback && emaBaselineBuy) {
          state.armed = { dir: "BUY", lbl: botPrefix + " BUY Pullback Armed (%K: " + sK1525.toFixed(1) + " <= 25)", type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = botPrefix + " BUY Re-Entry Armed — In Pullback Zone (%K: " + sK1525.toFixed(1) + "). Awaiting Cross > 20";
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = botPrefix + " Awaiting BUY Re-Entry — Awaiting Stoch (15,2,5) Pullback < 20 (Current %K: " + (sK1525 !== null ? sK1525.toFixed(1) : "N/A") + ")";
        }
      }
    } else if (stoch200AlignedSell) {
      if (!state[initialEntryDoneKey]) {
        state.armed = { dir: "SELL", lbl: botPrefix + " Stoch200 < 48 (Initial SELL Armed" + (emaBaselineSell ? "" : " - Await Price < EMA100") + ")", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = botPrefix + " Initial SELL Armed — Awaiting Stoch 15 Level 50 Cross (EMA100 Filter: " + (emaBaselineSell ? "PASS" : "BLOCK") + ")";
      } else {
        state.isReentryMode = true;
        const inRally = sK1525 !== null && sK1525 >= 75.0;
        if (inRally && emaBaselineSell) {
          state.armed = { dir: "SELL", lbl: botPrefix + " SELL Pullback Armed (%K: " + sK1525.toFixed(1) + " >= 75)", type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = botPrefix + " SELL Re-Entry Armed — In Overbought Zone (%K: " + sK1525.toFixed(1) + "). Awaiting Cross < 80";
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = botPrefix + " Awaiting SELL Re-Entry — Awaiting Stoch (15,2,5) Rally > 80 (Current %K: " + (sK1525 !== null ? sK1525.toFixed(1) : "N/A") + ")";
        }
      }
    } else {
      state.armed = null; state.armedEpoch = null; state.armedTime = null;
      state.nextPhase = "Monitoring " + botPrefix + " Confluence";
    }

    if (isInitialBuy || isReentryBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = isInitialBuy ? botPrefix + "_INITIAL_STOCH200_STOCH15 (BUY)" : botPrefix + "_REENTRY_STOCH15_20 (BUY)";
      state[initialEntryDoneKey] = true;
    } else if (isInitialSell || isReentrySell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = isInitialSell ? botPrefix + "_INITIAL_STOCH200_STOCH15 (SELL)" : botPrefix + "_REENTRY_STOCH15_80 (SELL)";
      state[initialEntryDoneKey] = true;
    }
  }
  // =========================================================================
  // 3. VOLATILITY 25 (1s) QUANTITATIVE HYSTERESIS & MOMENTUM CONFLUENCE STRATEGY
  // Profile: PROFILE_V25_1S_STOCH200_STOCH15
  // =========================================================================
  else if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") {
    // 1. Condition 1: M5 Stoch (200,1,1) Main Trend Identifier (Levels 45 / 55 Hysteresis Band)
    // - Cross above 55.0 arms BUY trend
    // - Cross below 45.0 arms SELL trend
    // - Hysteresis: Stays in BUY trend while sK200 >= 45.0; stays in SELL trend while sK200 <= 55.0
    const stoch200CrossUp55 = prevK200 !== null && sK200 !== null && prevK200 <= 55.0 && sK200 > 55.0;
    const stoch200CrossDown45 = prevK200 !== null && sK200 !== null && prevK200 >= 45.0 && sK200 < 45.0;

    if (stoch200CrossUp55) {
      if (state.v25_1s_trendDir !== "BUY") {
        state.v25_1s_initialDone = false; // Fresh trend wave: initial entry unlocked
        state.v25_1s_stoch15ArmedBuy = false;
      }
      state.v25_1s_trendDir = "BUY";
      state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
      dbg(`[V25 1S TREND] Stoch 200 crossed above 55.0 (%K: ${sK200.toFixed(2)}). BUY trend armed.`);
    } else if (stoch200CrossDown45) {
      if (state.v25_1s_trendDir !== "SELL") {
        state.v25_1s_initialDone = false; // Fresh trend wave: initial entry unlocked
        state.v25_1s_stoch15ArmedSell = false;
      }
      state.v25_1s_trendDir = "SELL";
      state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
      dbg(`[V25 1S TREND] Stoch 200 crossed below 45.0 (%K: ${sK200.toFixed(2)}). SELL trend armed.`);
    } else if (sK200 !== null) {
      // Dynamic Dealignment / Trend Flip:
      if (state.v25_1s_trendDir === "BUY" && sK200 < 45.0) {
        state.v25_1s_trendDir = "SELL";
        state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
        state.v25_1s_initialDone = false;
        state.v25_1s_stoch15ArmedBuy = false;
        dbg(`[V25 1S DEALIGN] Stoch 200 dropped below 45.0 (%K: ${sK200.toFixed(2)}). Switched to SELL trend.`);
      } else if (state.v25_1s_trendDir === "SELL" && sK200 > 55.0) {
        state.v25_1s_trendDir = "BUY";
        state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
        state.v25_1s_initialDone = false;
        state.v25_1s_stoch15ArmedSell = false;
        dbg(`[V25 1S DEALIGN] Stoch 200 rose above 55.0 (%K: ${sK200.toFixed(2)}). Switched to BUY trend.`);
      } else if (!state.v25_1s_trendDir) {
        // Startup bootstrap
        if (sK200 >= 55.0) {
          state.v25_1s_trendDir = "BUY";
          state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
        } else if (sK200 <= 45.0) {
          state.v25_1s_trendDir = "SELL";
          state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
        }
      }
    }

    const stoch200InBuyTrend = state.v25_1s_trendDir === "BUY" && sK200 !== null && sK200 >= 45.0;
    const stoch200InSellTrend = state.v25_1s_trendDir === "SELL" && sK200 !== null && sK200 <= 55.0;

    // 2. Condition 2: Stoch (15,2,5) Initial Momentum Breakout
    // - BUY: Cross above Level 75.0
    // - SELL: Cross below Level 25.0
    const stoch15CrossUp75 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 75.0 && sK1525 > 75.0;
    const stoch15CrossDown25 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 25.0 && sK1525 < 25.0;

    if (stoch15CrossUp75) state.v25_1s_stoch15ArmedBuy = true;
    if (stoch15CrossDown25) state.v25_1s_stoch15ArmedSell = true;

    // Disarm if indicator drops back out of the zone
    if (sK1525 !== null && sK1525 < 75.0) state.v25_1s_stoch15ArmedBuy = false;
    if (sK1525 !== null && sK1525 > 25.0) state.v25_1s_stoch15ArmedSell = false;

    // 3. Condition 3: EMA 100 Baseline Filter
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    // Order-Independent Alignment (Condition 1 may happen before 2, or 2 before 1)
    // Fresh event trigger (either Stoch 200 fresh cross while Stoch 15 is aligned, OR Stoch 15 fresh cross while Stoch 200 is aligned)
    const freshConfluenceBuy = (stoch200CrossUp55 && (sK1525 !== null && sK1525 > 75.0)) || (stoch15CrossUp75 && stoch200InBuyTrend);
    const freshConfluenceSell = (stoch200CrossDown45 && (sK1525 !== null && sK1525 < 25.0)) || (stoch15CrossDown25 && stoch200InSellTrend);

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    // Initial Entry Evaluation
    if (!state.v25_1s_initialDone) {
      if (freshConfluenceBuy) {
        if (emaBaselineBuy) {
          if (noActiveTrades) {
            indicatorsSatisfied = true;
            signalDirection = "BUY";
            setupLabel = (stoch200CrossUp55 && stoch15CrossUp75) ? "V25_1S_INITIAL_SIMULTANEOUS (BUY)" : "V25_1S_INITIAL_CONFLUENCE (BUY)";
          }
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedBuy = false;
        } else {
          // "If EMA is not aligned, skip the trade and wait for a re entry signal"
          console.log(`[${REPO_LABEL}] Initial BUY confluence met (Stoch 200: ${sK200?.toFixed(1)}, Stoch 15: ${sK1525?.toFixed(1)}), but M5 Price (${currentPrice.toFixed(2)}) is NOT above EMA 100 (${currentEma100?.toFixed(2)}). SKIPPING initial trade and waiting for re-entry signal.`);
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedBuy = false;
        }
      } else if (freshConfluenceSell) {
        if (emaBaselineSell) {
          if (noActiveTrades) {
            indicatorsSatisfied = true;
            signalDirection = "SELL";
            setupLabel = (stoch200CrossDown45 && stoch15CrossDown25) ? "V25_1S_INITIAL_SIMULTANEOUS (SELL)" : "V25_1S_INITIAL_CONFLUENCE (SELL)";
          }
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedSell = false;
        } else {
          // "If EMA is not aligned, skip the trade and wait for a re entry signal"
          console.log(`[${REPO_LABEL}] Initial SELL confluence met (Stoch 200: ${sK200?.toFixed(1)}, Stoch 15: ${sK1525?.toFixed(1)}), but M5 Price (${currentPrice.toFixed(2)}) is NOT below EMA 100 (${currentEma100?.toFixed(2)}). SKIPPING initial trade and waiting for re-entry signal.`);
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedSell = false;
        }
      }
    }

    // Re-Entry Condition: After initial entry has been taken (or skipped)
    // 1. Stoch 200 still in the right direction
    // 2. Stoch (15,2,5) freshly crosses above level 25 for BUY or below level 75 for SELL
    // 3. EMA 100 filter: M5 Price > EMA 100 for BUY / M5 Price < EMA 100 for SELL
    const stoch15FreshCrossUp25 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 25.0 && sK1525 > 25.0;
    const stoch15FreshCrossDown75 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 75.0 && sK1525 < 75.0;

    const reentryBuyTrigger = state.v25_1s_initialDone && stoch200InBuyTrend && stoch15FreshCrossUp25 && emaBaselineBuy;
    const reentrySellTrigger = state.v25_1s_initialDone && stoch200InSellTrend && stoch15FreshCrossDown75 && emaBaselineSell;

    if (!indicatorsSatisfied) {
      if (reentryBuyTrigger && noActiveTrades) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = "V25_1S_REENTRY_STOCH15 (BUY)";
      } else if (reentrySellTrigger && noActiveTrades) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = "V25_1S_REENTRY_STOCH15 (SELL)";
      }
    }

    // Latch Re-Entry Opportunity while a trade is running (for immediate entry upon trade close)
    if (stoch200InBuyTrend && stoch15FreshCrossUp25 && emaBaselineBuy) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: "V25_1S_REENTRY_STOCH15 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        price: currentPrice
      };
      dbg(`[${REPO_LABEL}] Latched active BUY re-entry opportunity during open trade.`);
    } else if (stoch200InSellTrend && stoch15FreshCrossDown75 && emaBaselineSell) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: "V25_1S_REENTRY_STOCH15 (SELL)",
        detectedEpoch: m5BoundaryEpoch,
        price: currentPrice
      };
      dbg(`[${REPO_LABEL}] Latched active SELL re-entry opportunity during open trade.`);
    }

    // Update state indicators for UI telemetry and diagnostics
    state.v25_1s_trend = state.v25_1s_trendDir || "NEUTRAL";
    state.v25_1s_stoch200 = sK200 !== null ? parseFloat(sK200.toFixed(2)) : null;
    state.v25_1s_stoch15 = sK1525 !== null ? parseFloat(sK1525.toFixed(2)) : null;
    state.v25_1s_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(2)) : null;
    state.v25_1s_emaAligned = (stoch200InBuyTrend && emaBaselineBuy) ? "BUY" : ((stoch200InSellTrend && emaBaselineSell) ? "SELL" : "NEUTRAL");
    state.isReentryMode = Boolean(state.v25_1s_initialDone);
    state.nextPhase = state.v25_1s_initialDone
      ? `Re-Entry Watch (${state.v25_1s_trendDir === "BUY" ? "Stoch 15 > 25 & Price > EMA100" : "Stoch 15 < 75 & Price < EMA100"})`
      : `Initial Confluence (Stoch 200 45/55 + Stoch 15 75/25 + EMA100)`;
  }
  // 4. VOLATILITY 100 (1s) MACRO TREND STOCH 200, MACD (25,75,1), EMA 100 & FAST STOCH (5,3,3) RE-ENTRY ENGINE
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

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

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

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    if (stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy && prevK533 !== null && sK533 !== null && prevK533 <= 20.0 && sK533 > 20.0) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: "V100_1S_REENTRY_STOCH533 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (stoch200AlignedSell && macdAlignedSell && emaBaselineSell && prevK533 !== null && sK533 !== null && prevK533 >= 80.0 && sK533 < 80.0) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: "V100_1S_REENTRY_STOCH533 (SELL)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    }

    // State Tracking for Dashboard Telemetry
    state.v100_1s_trend = stoch200AlignedBuy ? "BULLISH" : (stoch200AlignedSell ? "BEARISH" : "NEUTRAL");
    state.v100_1s_macd = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
    state.v100_1s_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
    state.v100_1s_stoch200 = sK200 !== null ? parseFloat(sK200.toFixed(1)) : null;
    state.v100_1s_stoch533 = sK533 !== null ? parseFloat(sK533.toFixed(1)) : null;
    state.v100_1s_stoch15 = state.v100_1s_stoch533; // Backward-compatibility mapping

    // Dashboard Arming State (Distinguish Initial Arming vs Re-Entry Waiting)
    const isV100_1sReentry = Boolean(state.v100_1s_initialBuyDone || state.v100_1s_initialSellDone);
    state.isReentryMode = isV100_1sReentry;
    if (stoch200AlignedBuy && macdAlignedBuy) {
      if (!state.v100_1s_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V100-1s Initial BUY Armed (Await Trigger${emaBaselineBuy ? "" : " & Price > EMA100"})`, lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V100-1s Initial BUY Armed — Awaiting Stoch/MACD Trigger (EMA100: ${emaBaselineBuy ? "PASS" : "BLOCK"})`;
      } else {
        const inPullback = sK533 !== null && sK533 <= 20.0;
        if (inPullback && emaBaselineBuy) {
          state.armed = { dir: "BUY", lbl: `V100-1s BUY Pullback Armed (%K: ${sK533.toFixed(1)} <= 20)`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V100-1s BUY Re-Entry Armed — In Pullback Zone (%K: ${sK533.toFixed(1)}). Awaiting Cross > 20`;
        } else {
          state.armed = null; state.armedEpoch = null; state.armedTime = null;
          state.nextPhase = `V100-1s Awaiting BUY Re-Entry — Awaiting Fast Stoch (5,3,3) Pullback <= 20 (Current %K: ${sK533 !== null ? sK533.toFixed(1) : "N/A"})`;
        }
      }
    } else if (stoch200AlignedSell && macdAlignedSell) {
      if (!state.v100_1s_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V100-1s Initial SELL Armed (Await Trigger${emaBaselineSell ? "" : " & Price < EMA100"})`, lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V100-1s Initial SELL Armed — Awaiting Stoch/MACD Trigger (EMA100: ${emaBaselineSell ? "PASS" : "BLOCK"})`;
      } else {
        const inPullback = sK533 !== null && sK533 >= 80.0;
        if (inPullback && emaBaselineSell) {
          state.armed = { dir: "SELL", lbl: `V100-1s SELL Pullback Armed (%K: ${sK533.toFixed(1)} >= 80)`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V100-1s SELL Re-Entry Armed — In Pullback Zone (%K: ${sK533.toFixed(1)}). Awaiting Cross < 80`;
        } else {
          state.armed = null; state.armedEpoch = null; state.armedTime = null;
          state.nextPhase = `V100-1s Awaiting SELL Re-Entry — Awaiting Fast Stoch (5,3,3) Pullback >= 80 (Current %K: ${sK533 !== null ? sK533.toFixed(1) : "N/A"})`;
        }
      }
    } else {
      state.armed = null; state.armedEpoch = null; state.armedTime = null;
      state.nextPhase = "Monitoring V100-1s Confluence";
    }

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
  // 3.5 VOLATILITY 75 (1s) INDEX (1HZ75V COFFEE MACHINE) — STOCH 100, STOCH 30 (±3 CANDLES), EMA 100 & STOCH 15 RE-ENTRY
  else if (STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
    const prefix = "V75_1S";

    // 1. Trend & Baseline Alignments
    const stoch100AlignedBuy = sK100 !== null && sK100 >= 50.0;
    const stoch100AlignedSell = sK100 !== null && sK100 <= 50.0;
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;
    const stoch30AlignedBuy = sK3025 !== null && sK3025 >= 50.0;
    const stoch30AlignedSell = sK3025 !== null && sK3025 <= 50.0;

    // Cross events
    const stoch100CrossUp50 = prevK100 !== null && sK100 !== null && prevK100 <= 50.0 && sK100 > 50.0;
    const stoch100CrossDown50 = prevK100 !== null && sK100 !== null && prevK100 >= 50.0 && sK100 < 50.0;
    const stoch30CrossUp50 = prevK3025 !== null && sK3025 !== null && prevK3025 <= 50.0 && sK3025 > 50.0;
    const stoch30CrossDown50 = prevK3025 !== null && sK3025 !== null && prevK3025 >= 50.0 && sK3025 < 50.0;

    // Track cross epochs for 3-candle tolerance window
    if (stoch100CrossUp50) state.v75_1s_stoch100CrossEpochBuy = m5BoundaryEpoch;
    if (stoch100CrossDown50) state.v75_1s_stoch100CrossEpochSell = m5BoundaryEpoch;
    if (stoch30CrossUp50) state.v75_1s_stoch30CrossEpochBuy = m5BoundaryEpoch;
    if (stoch30CrossDown50) state.v75_1s_stoch30CrossEpochSell = m5BoundaryEpoch;

    // Startup recovery: If Stoch 100 is already aligned > 50 (or < 50) and no epoch is recorded, latch current epoch so bot is ready
    if (stoch100AlignedBuy && !state.v75_1s_stoch100CrossEpochBuy && !state.v75_1s_initialBuyDone) {
      state.v75_1s_stoch100CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch100AlignedSell && !state.v75_1s_stoch100CrossEpochSell && !state.v75_1s_initialSellDone) {
      state.v75_1s_stoch100CrossEpochSell = m5BoundaryEpoch;
    }
    if (stoch30AlignedBuy && !state.v75_1s_stoch30CrossEpochBuy) {
      state.v75_1s_stoch30CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch30AlignedSell && !state.v75_1s_stoch30CrossEpochSell) {
      state.v75_1s_stoch30CrossEpochSell = m5BoundaryEpoch;
    }

    // Reset cross epochs and initial flags upon indicator dealignment
    if (!stoch100AlignedBuy) {
      state.v75_1s_stoch100CrossEpochBuy = null;
      state.v75_1s_initialBuyDone = false;
    }
    if (!stoch100AlignedSell) {
      state.v75_1s_stoch100CrossEpochSell = null;
      state.v75_1s_initialSellDone = false;
    }
    if (!stoch30AlignedBuy) {
      state.v75_1s_stoch30CrossEpochBuy = null;
    }
    if (!stoch30AlignedSell) {
      state.v75_1s_stoch30CrossEpochSell = null;
    }

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    // Timing check: cross can happen 3 candles before, 3 candles after, or simultaneously (900 seconds)
    const buyWithin3Candles = Boolean(
      state.v75_1s_stoch100CrossEpochBuy &&
      state.v75_1s_stoch30CrossEpochBuy &&
      Math.abs(state.v75_1s_stoch100CrossEpochBuy - state.v75_1s_stoch30CrossEpochBuy) <= 900
    );

    const sellWithin3Candles = Boolean(
      state.v75_1s_stoch100CrossEpochSell &&
      state.v75_1s_stoch30CrossEpochSell &&
      Math.abs(state.v75_1s_stoch100CrossEpochSell - state.v75_1s_stoch30CrossEpochSell) <= 900
    );

    const freshBuyTrigger = (stoch100CrossUp50 && stoch30AlignedBuy) || (stoch30CrossUp50 && stoch100AlignedBuy);
    const freshSellTrigger = (stoch100CrossDown50 && stoch30AlignedSell) || (stoch30CrossDown50 && stoch100AlignedSell);

    // Skip to re-entry if timing window was met but Price failed EMA 100 baseline
    if (!state.v75_1s_initialBuyDone && buyWithin3Candles && !emaBaselineBuy && freshBuyTrigger) {
      console.log(`[${REPO_LABEL}] Initial BUY confluence met, but Price (${currentPrice.toFixed(4)}) is NOT above EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state.v75_1s_initialBuyDone = true;
    }
    if (!state.v75_1s_initialSellDone && sellWithin3Candles && !emaBaselineSell && freshSellTrigger) {
      console.log(`[${REPO_LABEL}] Initial SELL confluence met, but Price (${currentPrice.toFixed(4)}) is NOT below EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state.v75_1s_initialSellDone = true;
    }

    const isInitialBuyTrigger = stoch100AlignedBuy && stoch30AlignedBuy && emaBaselineBuy && buyWithin3Candles && freshBuyTrigger && !state.v75_1s_initialBuyDone && noActiveTrades;
    const isInitialSellTrigger = stoch100AlignedSell && stoch30AlignedSell && emaBaselineSell && sellWithin3Candles && freshSellTrigger && !state.v75_1s_initialSellDone && noActiveTrades;

    // Initial BUY Trigger
    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch100CrossUp50 && stoch30CrossUp50)
        ? `${prefix}_INITIAL_STOCH100_STOCH30_SIMULTANEOUS (BUY)`
        : `${prefix}_INITIAL_STOCH100_STOCH30 (BUY)`;
      state.v75_1s_initialBuyDone = true;
    }
    // Initial SELL Trigger
    else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch100CrossDown50 && stoch30CrossDown50)
        ? `${prefix}_INITIAL_STOCH100_STOCH30_SIMULTANEOUS (SELL)`
        : `${prefix}_INITIAL_STOCH100_STOCH30 (SELL)`;
      state.v75_1s_initialSellDone = true;
    }
    // Re-Entry BUY Trigger: While Stoch 100 aligned > 50, Price > EMA 100, initialBuyDone, fresh Stoch (15,2,5) %K cross > 20
    else if (stoch100AlignedBuy && emaBaselineBuy && Boolean(state.v75_1s_initialBuyDone) && prevK1525 !== null && sK1525 !== null && prevK1525 <= 20.0 && sK1525 > 20.0 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_REENTRY_STOCH15_20 (BUY)`;
    }
    // Re-Entry SELL Trigger: While Stoch 100 aligned < 50, Price < EMA 100, initialSellDone, fresh Stoch (15,2,5) %K cross < 80
    else if (stoch100AlignedSell && emaBaselineSell && Boolean(state.v75_1s_initialSellDone) && prevK1525 !== null && sK1525 !== null && prevK1525 >= 80.0 && sK1525 < 80.0 && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_REENTRY_STOCH15_80 (SELL)`;
    }

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    const hasReentryBuyOpp = stoch100AlignedBuy && emaBaselineBuy && Boolean(state.v75_1s_initialBuyDone) && prevK1525 !== null && sK1525 !== null && prevK1525 <= 20.0 && sK1525 > 20.0;
    const hasReentrySellOpp = stoch100AlignedSell && emaBaselineSell && Boolean(state.v75_1s_initialSellDone) && prevK1525 !== null && sK1525 !== null && prevK1525 >= 80.0 && sK1525 < 80.0;
    if (hasReentryBuyOpp) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: `${prefix}_REENTRY_STOCH15_20 (BUY)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (hasReentrySellOpp) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: `${prefix}_REENTRY_STOCH15_80 (SELL)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    }

    // Telemetry updates for dashboard
    if (stoch100AlignedBuy) {
      if (!state.v75_1s_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V75-1s Initial BUY Armed (Stoch 100: ${sK100.toFixed(1)} > 50)`, lvl: currentPrice };
        state.nextPhase = `V75-1s Initial BUY Armed — Awaiting Stoch (30,2,5) %K (${sK3025.toFixed(1)}) cross > 50 (within 3 candles of Stoch 100 cross)`;
      } else {
        state.nextPhase = `V75-1s Awaiting BUY Re-Entry — Await Stoch (15,2,5) %K (${sK1525.toFixed(1)}) cross > 20`;
      }
    } else if (stoch100AlignedSell) {
      if (!state.v75_1s_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V75-1s Initial SELL Armed (Stoch 100: ${sK100.toFixed(1)} < 50)`, lvl: currentPrice };
        state.nextPhase = `V75-1s Initial SELL Armed — Awaiting Stoch (30,2,5) %K (${sK3025.toFixed(1)}) cross < 50 (within 3 candles of Stoch 100 cross)`;
      } else {
        state.nextPhase = `V75-1s Awaiting SELL Re-Entry — Await Stoch (15,2,5) %K (${sK1525.toFixed(1)}) cross < 80`;
      }
    }
  }
  // 3.6 VOLATILITY 10 (R_10 TEST BOT) — STOCH 200, MACD (25,75,1), EMA 100 & FAST STOCH (5,3,3) RE-ENTRY
  else if (STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
    const isV10 = true;
    const prefix = "V10";

    const stoch200AlignedBuy = sK200 !== null && sK200 >= 50.0;
    const stoch200AlignedSell = sK200 !== null && sK200 <= 50.0;
    const macdAlignedBuy = macdVal !== null && macdVal >= 0.0;
    const macdAlignedSell = macdVal !== null && macdVal <= 0.0;
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    const stoch200CrossUp50 = prevK200 !== null && sK200 !== null && prevK200 <= 50.0 && sK200 > 50.0;
    const stoch200CrossDown50 = prevK200 !== null && sK200 !== null && prevK200 >= 50.0 && sK200 < 50.0;
    const macdCrossUpZero = prevMacdVal !== null && macdVal !== null && prevMacdVal <= 0.0 && macdVal > 0.0;
    const macdCrossDownZero = prevMacdVal !== null && macdVal !== null && prevMacdVal >= 0.0 && macdVal < 0.0;

    const stochArmedKeyBuy = "v10_stochArmedBuy";
    const stochArmedKeySell = "v10_stochArmedSell";
    const macdArmedKeyBuy = "v10_macdArmedBuy";
    const macdArmedKeySell = "v10_macdArmedSell";
    const initialBuyDoneKey = "v10_initialBuyDone";
    const initialSellDoneKey = "v10_initialSellDone";

    if (stoch200CrossUp50) state[stochArmedKeyBuy] = true;
    if (stoch200CrossDown50) state[stochArmedKeySell] = true;
    if (macdCrossUpZero) state[macdArmedKeyBuy] = true;
    if (macdCrossDownZero) state[macdArmedKeySell] = true;

    if (stoch200AlignedBuy && !state[stochArmedKeyBuy] && !state[initialBuyDoneKey]) state[stochArmedKeyBuy] = true;
    if (stoch200AlignedSell && !state[stochArmedKeySell] && !state[initialSellDoneKey]) state[stochArmedKeySell] = true;

    if (!stoch200AlignedBuy) { state[stochArmedKeyBuy] = false; state[initialBuyDoneKey] = false; }
    if (!stoch200AlignedSell) { state[stochArmedKeySell] = false; state[initialSellDoneKey] = false; }
    if (!macdAlignedBuy) state[macdArmedKeyBuy] = false;
    if (!macdAlignedSell) state[macdArmedKeySell] = false;

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    const freshConfluenceBuyV10 = (stoch200CrossUp50 && macdAlignedBuy) || (macdCrossUpZero && stoch200AlignedBuy);
    const freshConfluenceSellV10 = (stoch200CrossDown50 && macdAlignedSell) || (macdCrossDownZero && stoch200AlignedSell);

    if (!state[initialBuyDoneKey] && freshConfluenceBuyV10 && !emaBaselineBuy) {
      console.log(`[${REPO_LABEL}] Initial BUY confluence met for V10, but Price (${currentPrice.toFixed(4)}) is NOT above EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state[initialBuyDoneKey] = true;
    }
    if (!state[initialSellDoneKey] && freshConfluenceSellV10 && !emaBaselineSell) {
      console.log(`[${REPO_LABEL}] Initial SELL confluence met for V10, but Price (${currentPrice.toFixed(4)}) is NOT below EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state[initialSellDoneKey] = true;
    }

    const isInitialBuyTrigger = freshConfluenceBuyV10 && emaBaselineBuy && !state[initialBuyDoneKey] && noActiveTrades;
    const isInitialSellTrigger = freshConfluenceSellV10 && emaBaselineSell && !state[initialSellDoneKey] && noActiveTrades;

    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch200CrossUp50 && macdCrossUpZero) ? `${prefix}_INITIAL_TREND_SIMULTANEOUS (BUY)` : `${prefix}_INITIAL_TREND (BUY)`;
      state[initialBuyDoneKey] = true;
      state[stochArmedKeyBuy] = false;
      state[macdArmedKeyBuy] = false;
    } else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch200CrossDown50 && macdCrossDownZero) ? `${prefix}_INITIAL_TREND_SIMULTANEOUS (SELL)` : `${prefix}_INITIAL_TREND (SELL)`;
      state[initialSellDoneKey] = true;
      state[stochArmedKeySell] = false;
      state[macdArmedKeySell] = false;
    } else if (prevK533 !== null && sK533 !== null && prevK533 <= 20.0 && sK533 > 20.0 && stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy && Boolean(state[initialBuyDoneKey]) && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_REENTRY_STOCH533 (BUY)`;
    } else if (prevK533 !== null && sK533 !== null && prevK533 >= 80.0 && sK533 < 80.0 && stoch200AlignedSell && macdAlignedSell && emaBaselineSell && Boolean(state[initialSellDoneKey]) && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_REENTRY_STOCH533 (SELL)`;
    }

    const hasReentryBuyOpp = prevK533 !== null && sK533 !== null && prevK533 <= 20.0 && sK533 > 20.0 && stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy;
    const hasReentrySellOpp = prevK533 !== null && sK533 !== null && prevK533 >= 80.0 && sK533 < 80.0 && stoch200AlignedSell && macdAlignedSell && emaBaselineSell;
    if (hasReentryBuyOpp) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: `${prefix}_REENTRY_STOCH533 (BUY)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (hasReentrySellOpp) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: `${prefix}_REENTRY_STOCH533 (SELL)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    }

    // Dashboard Arming & Phase Telemetry
    if (isV10) {
      const isV10Reentry = Boolean(state[initialBuyDoneKey] || state[initialSellDoneKey]);
      state.isReentryMode = isV10Reentry;
      if (stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy) {
        if (!state[initialBuyDoneKey]) {
          state.armed = { dir: "BUY", lbl: "V10 Initial BUY Armed (All Conditions Met)", lvl: currentPrice };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = "V10 Initial BUY Triggered/Armed";
        } else {
          const inPullback = sK533 !== null && sK533 <= 20.0;
          if (inPullback) {
            state.armed = { dir: "BUY", lbl: `V10 BUY Pullback Armed (%K: ${sK533.toFixed(1)} <= 20)`, type: "RE_ENTRY", lvl: currentPrice };
            state.nextPhase = `V10 BUY Re-Entry Armed — In Pullback Zone (%K: ${sK533.toFixed(1)}). Await Cross > 20`;
          } else {
            state.armed = null; state.armedEpoch = null; state.armedTime = null;
            state.nextPhase = `V10 Awaiting BUY Re-Entry — Await Stoch (5,3,3) Pullback <= 20 (Current %K: ${sK533 !== null ? sK533.toFixed(1) : "N/A"})`;
          }
        }
      } else if (stoch200AlignedSell && macdAlignedSell && emaBaselineSell) {
        if (!state[initialSellDoneKey]) {
          state.armed = { dir: "SELL", lbl: "V10 Initial SELL Armed (All Conditions Met)", lvl: currentPrice };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = "V10 Initial SELL Triggered/Armed";
        } else {
          const inPullback = sK533 !== null && sK533 >= 80.0;
          if (inPullback) {
            state.armed = { dir: "SELL", lbl: `V10 SELL Pullback Armed (%K: ${sK533.toFixed(1)} >= 80)`, type: "RE_ENTRY", lvl: currentPrice };
            state.nextPhase = `V10 SELL Re-Entry Armed — In Pullback Zone (%K: ${sK533.toFixed(1)}). Await Cross < 80`;
          } else {
            state.armed = null; state.armedEpoch = null; state.armedTime = null;
            state.nextPhase = `V10 Awaiting SELL Re-Entry — Await Stoch (5,3,3) Pullback >= 80 (Current %K: ${sK533 !== null ? sK533.toFixed(1) : "N/A"})`;
          }
        }
      } else if (stoch200AlignedBuy && macdAlignedBuy && !emaBaselineBuy) {
        state.armed = { dir: "BUY", lbl: "V10 Stoch200 & MACD Bullish (Await Price > EMA100)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V10 Initial BUY Armed (Stoch200 >= 50, MACD >= 0) — Awaiting Price (${currentPrice.toFixed(2)}) > EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
      } else if (stoch200AlignedSell && macdAlignedSell && !emaBaselineSell) {
        state.armed = { dir: "SELL", lbl: "V10 Stoch200 & MACD Bearish (Await Price < EMA100)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V10 Initial SELL Armed (Stoch200 <= 50, MACD <= 0) — Awaiting Price (${currentPrice.toFixed(2)}) < EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.nextPhase = "Monitoring Stoch 200, MACD (25,75,1) & EMA 100 Confluence";
      }
    } else {
      // 1HZ75V (V75-1s)
      const isV75_1sReentry = Boolean(state[initialBuyDoneKey] || state[initialSellDoneKey]);
      state.isReentryMode = isV75_1sReentry;
      if (stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy) {
        if (!state[initialBuyDoneKey]) {
          state.armed = { dir: "BUY", lbl: "V75-1s Bullish Trend Armed (Await MACD Cross)", lvl: currentPrice };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = "Initial BUY Armed — Awaiting MACD (25,75,1) Zero Cross > 0";
        } else {
          const inPullback = sK1525 !== null && sK1525 <= 20.0;
          if (inPullback) {
            state.armed = { dir: "BUY", lbl: `V75-1s BUY Pullback Armed (%K: ${sK1525.toFixed(1)} <= 20)`, type: "RE_ENTRY", lvl: currentPrice };
            state.nextPhase = `V75-1s BUY Re-Entry Armed — In Pullback Zone (%K: ${sK1525.toFixed(1)}). Await Cross > 20`;
          } else {
            state.armed = null; state.armedEpoch = null; state.armedTime = null;
            state.nextPhase = `V75-1s Awaiting BUY Re-Entry — Await Aux Stoch (15,2,5) Pullback <= 20 (Current %K: ${sK1525 !== null ? sK1525.toFixed(1) : "N/A"})`;
          }
        }
      } else if (stoch200AlignedSell && macdAlignedSell && emaBaselineSell) {
        if (!state[initialSellDoneKey]) {
          state.armed = { dir: "SELL", lbl: "V75-1s Bearish Trend Armed (Await MACD Cross)", lvl: currentPrice };
          if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
          state.nextPhase = "Initial SELL Armed — Awaiting MACD (25,75,1) Zero Cross < 0";
        } else {
          const inPullback = sK1525 !== null && sK1525 >= 80.0;
          if (inPullback) {
            state.armed = { dir: "SELL", lbl: `V75-1s SELL Pullback Armed (%K: ${sK1525.toFixed(1)} >= 80)`, type: "RE_ENTRY", lvl: currentPrice };
            state.nextPhase = `V75-1s SELL Re-Entry Armed — In Pullback Zone (%K: ${sK1525.toFixed(1)}). Await Cross < 80`;
          } else {
            state.armed = null; state.armedEpoch = null; state.armedTime = null;
            state.nextPhase = `V75-1s Awaiting SELL Re-Entry — Await Aux Stoch (15,2,5) Pullback >= 80 (Current %K: ${sK1525 !== null ? sK1525.toFixed(1) : "N/A"})`;
          }
        }
      } else if (stoch200AlignedBuy && state[stochArmedKeyBuy] && !macdAlignedBuy) {
        state.armed = { dir: "BUY", lbl: "V75-1s Stoch200 > 50 Armed (Await MACD > 0)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = "Initial BUY Armed (Stoch200 > 50) — Awaiting MACD (25,75,1) Zero Cross > 0 & Price > EMA100";
      } else if (stoch200AlignedSell && state[stochArmedKeySell] && !macdAlignedSell) {
        state.armed = { dir: "SELL", lbl: "V75-1s Stoch200 < 50 Armed (Await MACD < 0)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = "Initial SELL Armed (Stoch200 < 50) — Awaiting MACD (25,75,1) Zero Cross < 0 & Price < EMA100";
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.nextPhase = "Monitoring Stoch 200, MACD (25,75,1) & EMA 100 Confluence";
      }
    }

    // State Tracking for Dashboard Telemetry
    if (isV10) {
      state.v10_trend = stoch200AlignedBuy ? "BULLISH" : (stoch200AlignedSell ? "BEARISH" : "NEUTRAL");
      state.v10_macd = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
      state.v10_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
      state.v10_stoch200 = sK200 !== null ? parseFloat(sK200.toFixed(1)) : null;
      state.v10_stoch533 = sK533 !== null ? parseFloat(sK533.toFixed(1)) : null;
    } else {
      state.v75_1s_trend = stoch200AlignedBuy ? "BULLISH" : (stoch200AlignedSell ? "BEARISH" : "NEUTRAL");
      state.v75_1s_macd = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
      state.v75_1s_ema100 = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
      state.v75_1s_stoch200 = sK200 !== null ? parseFloat(sK200.toFixed(1)) : null;
      state.v75_1s_stoch533 = sK1525 !== null ? parseFloat(sK1525.toFixed(1)) : null;
    }
    state.stoch200Val = sK200 !== null ? parseFloat(sK200.toFixed(1)) : null;
    state.macdVal = macdVal !== null ? parseFloat(macdVal.toFixed(4)) : null;
    state.ema100Val = currentEma100 !== null ? parseFloat(currentEma100.toFixed(4)) : null;
    state.stoch533Val = sK533 !== null ? parseFloat(sK533.toFixed(1)) : null;

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
  // 4. VOLATILITY 25 (R_25 TEA MACHINE) — STOCH 100, STOCH 30 (±3 CANDLES), EMA 100 & STOCH (30,25,15) RE-ENTRY
  else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V25_EMA_STOCH15") {
    const prefix = "V25";

    // 1. Trend & Baseline Alignments
    const stoch100AlignedBuy = sK100 !== null && sK100 >= 50.0;
    const stoch100AlignedSell = sK100 !== null && sK100 <= 50.0;
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;
    const stoch30AlignedBuy = sK3025 !== null && sK3025 >= 50.0;
    const stoch30AlignedSell = sK3025 !== null && sK3025 <= 50.0;

    // Cross events
    const stoch100CrossUp50 = prevK100 !== null && sK100 !== null && prevK100 <= 50.0 && sK100 > 50.0;
    const stoch100CrossDown50 = prevK100 !== null && sK100 !== null && prevK100 >= 50.0 && sK100 < 50.0;
    const stoch30CrossUp50 = prevK3025 !== null && sK3025 !== null && prevK3025 <= 50.0 && sK3025 > 50.0;
    const stoch30CrossDown50 = prevK3025 !== null && sK3025 !== null && prevK3025 >= 50.0 && sK3025 < 50.0;

    // Track cross epochs for 3-candle tolerance window
    if (stoch100CrossUp50) state.v25_stoch100CrossEpochBuy = m5BoundaryEpoch;
    if (stoch100CrossDown50) state.v25_stoch100CrossEpochSell = m5BoundaryEpoch;
    if (stoch30CrossUp50) state.v25_stoch30CrossEpochBuy = m5BoundaryEpoch;
    if (stoch30CrossDown50) state.v25_stoch30CrossEpochSell = m5BoundaryEpoch;

    // Startup recovery: If Stoch 100 is already aligned > 50 (or < 50) and no epoch is recorded, latch current epoch so bot is ready
    if (stoch100AlignedBuy && !state.v25_stoch100CrossEpochBuy && !state.v25_initialBuyDone) {
      state.v25_stoch100CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch100AlignedSell && !state.v25_stoch100CrossEpochSell && !state.v25_initialSellDone) {
      state.v25_stoch100CrossEpochSell = m5BoundaryEpoch;
    }
    if (stoch30AlignedBuy && !state.v25_stoch30CrossEpochBuy) {
      state.v25_stoch30CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch30AlignedSell && !state.v25_stoch30CrossEpochSell) {
      state.v25_stoch30CrossEpochSell = m5BoundaryEpoch;
    }

    // Reset cross epochs and initial flags upon indicator dealignment
    if (!stoch100AlignedBuy) {
      state.v25_stoch100CrossEpochBuy = null;
      state.v25_initialBuyDone = false;
      state.v25_stoch302515_touched_50_BUY = false;
    }
    if (!stoch100AlignedSell) {
      state.v25_stoch100CrossEpochSell = null;
      state.v25_initialSellDone = false;
      state.v25_stoch302515_touched_50_SELL = false;
    }
    if (!stoch30AlignedBuy) {
      state.v25_stoch30CrossEpochBuy = null;
    }
    if (!stoch30AlignedSell) {
      state.v25_stoch30CrossEpochSell = null;
    }

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    // Timing check: cross can happen 3 candles before, 3 candles after, or simultaneously (900 seconds)
    const buyWithin3Candles = Boolean(
      state.v25_stoch100CrossEpochBuy &&
      state.v25_stoch30CrossEpochBuy &&
      Math.abs(state.v25_stoch100CrossEpochBuy - state.v25_stoch30CrossEpochBuy) <= 900
    );

    const sellWithin3Candles = Boolean(
      state.v25_stoch100CrossEpochSell &&
      state.v25_stoch30CrossEpochSell &&
      Math.abs(state.v25_stoch100CrossEpochSell - state.v25_stoch30CrossEpochSell) <= 900
    );

    const freshBuyTrigger = (stoch100CrossUp50 && stoch30AlignedBuy) || (stoch30CrossUp50 && stoch100AlignedBuy);
    const freshSellTrigger = (stoch100CrossDown50 && stoch30AlignedSell) || (stoch30CrossDown50 && stoch100AlignedSell);

    // Skip to re-entry if timing window was met but Price failed EMA 100 baseline
    if (!state.v25_initialBuyDone && buyWithin3Candles && !emaBaselineBuy && freshBuyTrigger) {
      console.log(`[${REPO_LABEL}] Initial BUY confluence met, but Price (${currentPrice.toFixed(4)}) is NOT above EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state.v25_initialBuyDone = true;
    }
    if (!state.v25_initialSellDone && sellWithin3Candles && !emaBaselineSell && freshSellTrigger) {
      console.log(`[${REPO_LABEL}] Initial SELL confluence met, but Price (${currentPrice.toFixed(4)}) is NOT below EMA 100 (${currentEma100?.toFixed(4)}). Skipping initial trade & unlocking re-entry.`);
      state.v25_initialSellDone = true;
    }

    const isInitialBuyTrigger = stoch100AlignedBuy && stoch30AlignedBuy && emaBaselineBuy && buyWithin3Candles && freshBuyTrigger && !state.v25_initialBuyDone && noActiveTrades;
    const isInitialSellTrigger = stoch100AlignedSell && stoch30AlignedSell && emaBaselineSell && sellWithin3Candles && freshSellTrigger && !state.v25_initialSellDone && noActiveTrades;

    // Track Re-Entry Stoch (30,25,15 Simple) Level 50 Touch / Cross
    // For Buy: %K touches or crosses <= 50.0
    // For Sell: %K touches or crosses >= 50.0
    if (stoch100AlignedBuy && Boolean(state.v25_initialBuyDone)) {
      if (sK302515 !== null && sK302515 <= 50.0) {
        state.v25_stoch302515_touched_50_BUY = true;
      }
    }
    if (stoch100AlignedSell && Boolean(state.v25_initialSellDone)) {
      if (sK302515 !== null && sK302515 >= 50.0) {
        state.v25_stoch302515_touched_50_SELL = true;
      }
    }

    // Fresh %K cross %D
    const kCrossUpD = prevK302515 !== null && prevD302515 !== null && sK302515 !== null && sD302515 !== null && prevK302515 <= prevD302515 && sK302515 > sD302515;
    const kCrossDownD = prevK302515 !== null && prevD302515 !== null && sK302515 !== null && sD302515 !== null && prevK302515 >= prevD302515 && sK302515 < sD302515;

    const touched50Buy = Boolean(state.v25_stoch302515_touched_50_BUY || (sK302515 !== null && sK302515 <= 50.0) || (prevK302515 !== null && prevK302515 <= 50.0));
    const touched50Sell = Boolean(state.v25_stoch302515_touched_50_SELL || (sK302515 !== null && sK302515 >= 50.0) || (prevK302515 !== null && prevK302515 >= 50.0));

    // Initial BUY Trigger
    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = (stoch100CrossUp50 && stoch30CrossUp50)
        ? `${prefix}_INITIAL_STOCH100_STOCH30_SIMULTANEOUS (BUY)`
        : `${prefix}_INITIAL_STOCH100_STOCH30 (BUY)`;
      state.v25_initialBuyDone = true;
    }
    // Initial SELL Trigger
    else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = (stoch100CrossDown50 && stoch30CrossDown50)
        ? `${prefix}_INITIAL_STOCH100_STOCH30_SIMULTANEOUS (SELL)`
        : `${prefix}_INITIAL_STOCH100_STOCH30 (SELL)`;
      state.v25_initialSellDone = true;
    }
    // Re-Entry BUY Trigger: While Stoch 100 aligned > 50, Price > EMA 100, initialBuyDone, %K touched/crossed <= 50, fresh %K cross %D up
    else if (stoch100AlignedBuy && emaBaselineBuy && Boolean(state.v25_initialBuyDone) && touched50Buy && kCrossUpD && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_REENTRY_STOCH302515_TOUCH50_CROSS_D (BUY)`;
      state.v25_stoch302515_touched_50_BUY = false;
    }
    // Re-Entry SELL Trigger: While Stoch 100 aligned < 50, Price < EMA 100, initialSellDone, %K touched/crossed >= 50, fresh %K cross %D down
    else if (stoch100AlignedSell && emaBaselineSell && Boolean(state.v25_initialSellDone) && touched50Sell && kCrossDownD && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_REENTRY_STOCH302515_TOUCH50_CROSS_D (SELL)`;
      state.v25_stoch302515_touched_50_SELL = false;
    }

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    const hasReentryBuyOpp = stoch100AlignedBuy && emaBaselineBuy && Boolean(state.v25_initialBuyDone) && touched50Buy && kCrossUpD;
    const hasReentrySellOpp = stoch100AlignedSell && emaBaselineSell && Boolean(state.v25_initialSellDone) && touched50Sell && kCrossDownD;
    if (hasReentryBuyOpp) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: `${prefix}_REENTRY_STOCH302515_TOUCH50_CROSS_D (BUY)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
      state.v25_stoch302515_touched_50_BUY = false;
    } else if (hasReentrySellOpp) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: `${prefix}_REENTRY_STOCH302515_TOUCH50_CROSS_D (SELL)`,
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
      state.v25_stoch302515_touched_50_SELL = false;
    }

    // Telemetry updates for dashboard
    if (stoch100AlignedBuy) {
      if (!state.v25_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V25 Initial BUY Armed (Stoch 100: ${sK100.toFixed(1)} > 50)`, lvl: currentPrice };
        state.nextPhase = `V25 Initial BUY Armed — Awaiting Stoch (30,2,5) %K (${sK3025.toFixed(1)}) cross > 50 (within 3 candles of Stoch 100 cross)`;
      } else {
        state.nextPhase = touched50Buy
          ? `V25 Awaiting BUY Re-Entry — Stoch (30,25,15) touched <= 50 (%K: ${sK302515?.toFixed(1)}). Awaiting %K cross above %D (${sD302515?.toFixed(1)})`
          : `V25 Awaiting BUY Re-Entry — Await Stoch (30,25,15) %K (${sK302515?.toFixed(1)}) pullback to touch/cross <= 50`;
      }
    } else if (stoch100AlignedSell) {
      if (!state.v25_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V25 Initial SELL Armed (Stoch 100: ${sK100.toFixed(1)} < 50)`, lvl: currentPrice };
        state.nextPhase = `V25 Initial SELL Armed — Awaiting Stoch (30,2,5) %K (${sK3025.toFixed(1)}) cross < 50 (within 3 candles of Stoch 100 cross)`;
      } else {
        state.nextPhase = touched50Sell
          ? `V25 Awaiting SELL Re-Entry — Stoch (30,25,15) touched >= 50 (%K: ${sK302515?.toFixed(1)}). Awaiting %K cross below %D (${sD302515?.toFixed(1)})`
          : `V25 Awaiting SELL Re-Entry — Await Stoch (30,25,15) %K (${sK302515?.toFixed(1)}) pullback to touch/cross >= 50`;
      }
    }

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
  // 5. VOLATILITY 50 (R_50) M5 STOCH (200,1,1) MAIN TREND + M5 STOCH (15,2,5) EXECUTION ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    // Condition 1: M5 Stoch (200,1,1) Level 50 Gate
    const stoch200CrossUp50 = prevK !== null && prevK <= 50.0 && sK > 50.0;
    const stoch200CrossDown50 = prevK !== null && prevK >= 50.0 && sK < 50.0;
    const stoch200AlignedBuy = sK !== null && sK >= 50.0;
    const stoch200AlignedSell = sK !== null && sK <= 50.0;

    // Dealignment checks: if Condition 1 breaks its threshold, immediately disarm and reset initial trade flag
    if (!stoch200AlignedBuy) { state.v50_stochArmedBuy = false; state.v50_initialBuyDone = false; }
    if (!stoch200AlignedSell) { state.v50_stochArmedSell = false; state.v50_initialSellDone = false; }

    // Verify Condition 1 was ALREADY armed prior to (or remaining aligned across) this candle before Stoch (15,2,5) crosses 50
    const cond1AlreadyArmedBuy = stoch200AlignedBuy && (Boolean(state.v50_stochArmedBuy) || (prevK !== null && prevK >= 50.0)) && !stoch200CrossUp50;
    const cond1AlreadyArmedSell = stoch200AlignedSell && (Boolean(state.v50_stochArmedSell) || (prevK !== null && prevK <= 50.0)) && !stoch200CrossDown50;

    // Arm Condition 1 for current & subsequent candles while aligned
    if (stoch200AlignedBuy) state.v50_stochArmedBuy = true;
    if (stoch200AlignedSell) state.v50_stochArmedSell = true;

    const noActiveTrades = !trades.some(t => !t.result && !t.pending);

    // Universal EMA 100 Filter: BUY only if Price > EMA 100; SELL only if Price < EMA 100
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    // 1. Initial Entry Rule: Stoch (15,2,5) freshly crosses Level 50.0 after Condition 1 is already armed & Price conforms to EMA 100
    const stoch15FreshCross50Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0;
    const stoch15FreshCross50Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0;
    const isV50InitialBuy = cond1AlreadyArmedBuy && emaBaselineBuy && !state.v50_initialBuyDone && stoch15FreshCross50Buy && noActiveTrades;
    const isV50InitialSell = cond1AlreadyArmedSell && emaBaselineSell && !state.v50_initialSellDone && stoch15FreshCross50Sell && noActiveTrades;

    // 2. Re-Entry Rule: Stoch (15,2,5) freshly crosses Level 25.0 (BUY with Price > EMA 100) or Level 75.0 (SELL with Price < EMA 100)
    // while Condition 1 (Stoch 200) is aligned and no active trade is running
    const stoch15FreshCross25Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 25.0 && sK1525 > 25.0;
    const stoch15FreshCross75Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 75.0 && sK1525 < 75.0;
    const isV50ReentryBuy = stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross25Buy && noActiveTrades;
    const isV50ReentrySell = stoch200AlignedSell && emaBaselineSell && stoch15FreshCross75Sell && noActiveTrades;

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    if (stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross25Buy) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: "V50_REENTRY_STOCH15_25 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (stoch200AlignedSell && emaBaselineSell && stoch15FreshCross75Sell) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: "V50_REENTRY_STOCH15_75 (SELL)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    }

    // Populate Dashboard Arming State for V50 (Distinguish Initial Arming vs Re-Entry Waiting)
    if (stoch200AlignedBuy) {
      if (!state.v50_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V50 Initial BUY Armed (Await Stoch15 > 50${emaBaselineBuy ? "" : " & Price > EMA100"})`, lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V50 Initial BUY Armed — Await Stoch (15,2,5) %K > 50 (EMA100 Filter: ${emaBaselineBuy ? "PASS" : "BLOCK"})`;
      } else {
        state.isReentryMode = true;
        const inPullback = sK1525 !== null && sK1525 <= 25.0;
        if (inPullback && emaBaselineBuy) {
          state.armed = { dir: "BUY", lbl: `V50 BUY Pullback Armed (%K: ${sK1525.toFixed(1)} <= 25)`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V50 BUY Re-Entry Armed — In Pullback Zone (%K: ${sK1525.toFixed(1)}). Await Cross > 25`;
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V50 Awaiting BUY Re-Entry — Await Stoch (15,2,5) %K cross > 25 (Current %K: ${sK1525 !== null ? sK1525.toFixed(1) : "N/A"})`;
        }
      }
    } else if (stoch200AlignedSell) {
      if (!state.v50_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V50 Initial SELL Armed (Await Stoch15 < 50${emaBaselineSell ? "" : " & Price < EMA100"})`, lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `V50 Initial SELL Armed — Await Stoch (15,2,5) %K < 50 (EMA100 Filter: ${emaBaselineSell ? "PASS" : "BLOCK"})`;
      } else {
        state.isReentryMode = true;
        const inRally = sK1525 !== null && sK1525 >= 75.0;
        if (inRally && emaBaselineSell) {
          state.armed = { dir: "SELL", lbl: `V50 SELL Pullback Armed (%K: ${sK1525.toFixed(1)} >= 75)`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V50 SELL Re-Entry Armed — In Overbought Zone (%K: ${sK1525.toFixed(1)}). Await Cross < 75`;
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = `V50 Awaiting SELL Re-Entry — Await Stoch (15,2,5) %K cross < 75 (Current %K: ${sK1525 !== null ? sK1525.toFixed(1) : "N/A"})`;
        }
      }
    } else {
      state.armed = null; state.armedEpoch = null; state.armedTime = null;
      state.nextPhase = "Monitoring V50 Confluence";
    }

    if (isV50InitialBuy || isV50ReentryBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = isV50InitialBuy ? "V50_INITIAL_STOCH200_STOCH15_50 (BUY)" : "V50_REENTRY_STOCH15_25 (BUY)";
      if (isV50InitialBuy) state.v50_initialBuyDone = true;
    } else if (isV50InitialSell || isV50ReentrySell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = isV50InitialSell ? "V50_INITIAL_STOCH200_STOCH15_50 (SELL)" : "V50_REENTRY_STOCH15_75 (SELL)";
      if (isV50InitialSell) state.v50_initialSellDone = true;
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

  // Calculate Fibonacci Target TP Level from Daily Grid (if not already calculated by strategy)
  if (!calculatedFibTp && indicatorsSatisfied && signalDirection && keyLevels && keyLevels.length > 0) {
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
  state.v25_cciCrossEpochBuy = null;
  state.v25_cciCrossEpochSell = null;
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
    const requiredRawPnl = EXECUTION_MODE === "ctrader" ? TARGET_MIN_PROFIT : (TARGET_MIN_PROFIT + COMMISSION_USD);
    const dollarTpPrice = EXECUTION_MODE === "ctrader"
      ? (direction === "BUY" ? entry + (requiredRawPnl / CTRADER_LOT_SIZE) : entry - (requiredRawPnl / CTRADER_LOT_SIZE))
      : (direction === "BUY" ? entry * (1 + requiredRawPnl / (STAKE_USD * MULTIPLIER)) : entry * (1 - requiredRawPnl / (STAKE_USD * MULTIPLIER)));
    const pointsTpPrice = direction === "BUY" ? entry + calibratedMinPts : entry - calibratedMinPts;

    const minRequiredTp = direction === "BUY" ? Math.max(pointsTpPrice, dollarTpPrice) : Math.min(pointsTpPrice, dollarTpPrice);

    const isDynamicRunner = STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15" || SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || SYMBOL === "1HZ100V" || STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V";
    if (isDynamicRunner) {
      fibTpPrice = null;
      entryType = entryType + " (Dynamic Runner - Tiered Ratchet & Profit Exit)";
    } else {
      if (!fibTpPrice || (direction === "BUY" && minRequiredTp > fibTpPrice)) {
        fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
      } else if (direction === "SELL" && minRequiredTp < fibTpPrice) {
        fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
      }
    }

    const tpPrice = fibTpPrice;

    // Initial Stop Loss Anchor: Previous M15 / M5 Institutional Fractal Capped at $2.50 SL
    let initialM15Fractal = findRecentFractalM15(m15Candles, direction);
    let initialM5Fractal = direction === "BUY"
      ? findRecentFractalBelow(candles, si, entry)
      : findRecentFractalAbove(candles, si, entry);
    const hardStopPrice = deriveHardStopPrice(entry, direction, CTRADER_LOT_SIZE); // -$5.00 broker hard stop
    
    // Calculate maximum initial Stop Loss price capped by configured Software SL (-$3.50 for V25, -$2.50 standard)
    const reqPnlSoft = EXECUTION_MODE === "ctrader" ? SOFTWARE_SL_USD : (SOFTWARE_SL_USD + COMMISSION_USD);
    const slCapPrice = EXECUTION_MODE === "ctrader"
      ? (direction === "BUY" ? entry + (reqPnlSoft / CTRADER_LOT_SIZE) : entry - (reqPnlSoft / CTRADER_LOT_SIZE))
      : (direction === "BUY" ? entry * (1 + reqPnlSoft / (STAKE_USD * MULTIPLIER)) : entry * (1 - reqPnlSoft / (STAKE_USD * MULTIPLIER)));

    let sl;
    if (PROFILE.slType === "HARD_POINTS") {
      sl = hardStopPrice;
    } else if (PROFILE.slType === "M5_FRACTAL") {
      // Hardened Fractal SL Buffer: Do not anchor SL tighter than minimum buffer distance
      // For R_25: minimum 6.00 points ($3.00), preventing tight sub-5-minute wick stopouts
      const minFractalDist = (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100") ? 6.00 : 0;
      const fracDistBuy = initialM5Fractal ? (entry - initialM5Fractal) : 0;
      const fracDistSell = initialM5Fractal ? (initialM5Fractal - entry) : 0;

      if (direction === "BUY") {
        sl = (initialM5Fractal && initialM5Fractal > slCapPrice && initialM5Fractal < entry && fracDistBuy >= minFractalDist) ? initialM5Fractal : slCapPrice;
      } else {
        sl = (initialM5Fractal && initialM5Fractal < slCapPrice && initialM5Fractal > entry && fracDistSell >= minFractalDist) ? initialM5Fractal : slCapPrice;
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
    if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") {
      confluenceLines += `• M5 Stoch 200 (45/55): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">55 [BULLISH TREND]" : "<45 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Tiered Ratchet to $20 & Stoch 25 Midline 50 Profit Exit >= $0.50)\n` +
                         `• Early Invalidation: *3 Adverse M5 Closes / Stoch 200 Invalidation / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (30,2,5 Simple): *${(sK3025 !== null ? sK3025.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [TRIGGER ARMED]" : "<50 [TRIGGER ARMED]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Fast Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Pullback Exit" : "<80 Pullback Exit"})\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Adverse M5 Closes / Stoch 200 Invalidation / Closed-M5 Stoch (15,2,5) Lvl 50 Cross*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      confluenceLines += `• M5 Price vs EMA 100/200: *Price (${entry.toFixed(2)}) ${direction === "BUY" ? ">" : "<"} EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) | EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})*\n` +
                         `• Setup Mode: *${setupLabel}*\n` +
                         `• M5 Stoch (15,2,5 Simple): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")} (prev: ${(prevK !== null ? prevK.toFixed(1) : "N/A")})* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* [FRESH LEVEL CROSS TRIGGERED]\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(2) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Stop)\n` +
                         `• Early Exit Engine: *Loss Protection (%K/%D Cross) / Closed-M5 Stoch 50 Cross / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" || SYMBOL === "R_25") {
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})
` +
                         `• M5 Stoch (30,2,5 Simple): *${(sK3025 !== null ? sK3025.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [TRIGGER ARMED]" : "<50 [TRIGGER ARMED]"})
` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})
` +
                         `• M5 Re-Entry Stoch (30,25,15 Simple): *%K ${(sK302515 !== null ? sK302515.toFixed(1) : "N/A")}* | *%D ${(sD302515 !== null ? sD302515.toFixed(1) : "N/A")}*
` +
                         `• Trigger Type: *${setupLabel}*
` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min ${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)
` +
                         `• Early Invalidation: *3 Consecutive Adverse M5 Closes / Stoch 100 Invalidation Exit / Entry-Hour H1 Adverse Close*
`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (30,2,5 Simple): *${(sK3025 !== null ? sK3025.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [TRIGGER ARMED]" : "<50 [TRIGGER ARMED]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Aux Stoch (15,2,5 Simple): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Consecutive Adverse M5 Closes / Stoch 200 / Closed-M5 Stoch 50 Profit Cross / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
      confluenceLines += `• M5 Stoch 200: *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH TREND]" : "<=50 [BEARISH TREND]"})\n` +
                         `• M5 MACD (25,75,1): *${(macdVal !== null ? macdVal.toFixed(4) : "N/A")}* (${direction === "BUY" ? ">=0 [BULLISH MOMENTUM]" : "<=0 [BEARISH MOMENTUM]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* | M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Consecutive Adverse M5 Closes / Stoch 200 / Stoch (15,2,5) Loss Exit / H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
      confluenceLines += `• M5 Stoch 200 (48/52): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">48 [BULLISH TREND]" : "<52 [BEARISH TREND]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• Early Exits: *Stoch (25,2,5) 65/35 Profit Exit / Opposite M5 Fractal / Entry-Hour H1 Adverse Close*\n` +
                         `• Take Profit: *Dynamic Runner (Tiered Ratchet & $20 Super-Runner Ceiling)*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 CCI 100: *${(cVal !== null ? cVal.toFixed(1) : "N/A")}* | M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel || "STANDARD"}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break / Stoch 200 / Closed-M5 Stoch (15,2,5) Lvl 50 Cross / H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Stoch (15,2,5) Trigger: *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel || "STANDARD"})\n` +
                         `• Take Profit: *Dynamic Runner (Tiered Ratchet & $20 Super-Runner Ceiling)*\n` +
                         `• Early Exit Engine: *Previous M5 Fractal Break / Stoch 200 / Stoch (25,2,5) Midline 50 Profit Exit (>= $0.50) / Entry-Hour H1 Adverse Close*\n`;
    } else {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA 100" : "Price < EMA 100"})\n` +
                         `• M5 Stoch (15,2,5) Trigger: *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel || "STANDARD"})\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break / Stoch 200 / Closed-M5 Stoch (15,2,5) Lvl 50 Cross / H1 Adverse Close*\n`;
    }
    confluenceLines += `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)}*`;

    const message = 
      `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Strategy Profile: *${STRATEGY_PROFILE}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (${initialM5Fractal ? "M5 Fractal Anchor" : (initialM15Fractal ? "M15 Fractal Anchor" : "Hard Stop Barrier")})\n` +
      `🎯 Take Profit: *${(isDynamicRunner || !tpPrice) ? "Dynamic Runner (Tiered Ratchet & Profit Exit | Max $20 Ceiling)" : `${tpPrice.toFixed(4)} (Min ${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)` }*\n\n` +
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
        state.openTrade = {
          ...pendingTradeRecord,
          entryPrice: pendingTradeRecord.entry,
          stopLoss: pendingTradeRecord.sl,
          tpPrice: pendingTradeRecord.tpPrice,
          unrealizedPnl: 0,
          livePnl: 0,
          profit: 0
        };
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.confirm = null;
        state.nextPhase = null;
        saveState();
        await sendTelegram(message);
      }
    } catch (execErr) {
      console.error(`[${REPO_LABEL}] Live execution initial attempt failed: ${execErr.message}. Queueing for 2.5-min reconnect...`);
      state.queuedPendingOrder = {
        tradeRecordId: pendingTradeRecord.id,
        direction,
        orderContext: { slPrice: sl, fibTpPrice: tpPrice, tpPrice },
        signalEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 150,
        message,
        firstFailureMessage: execErr.message,
        retryAttempts: 1,
        lastAttemptEpoch: Math.floor(Date.now() / 1000)
      };
      saveState();
      await sendTelegram(
        `⚠️ *${REPO_LABEL} — Live Execution Paused (Gateway Transient Error)*\n\n` +
        `Reason: \`${escapeMarkdown(execErr.message)}\`\n` +
        `🔄 *Auto-Reconnect Engine Active*: Retrying order execution continuously over the next 2.5 minutes as connection restores.`
      );
    }
  }

  // ── AUTOMATED TRADE BLOCKER & OPERATIONAL HEALTH DETECTOR ──
  let blockerReason = "";
  let nextTrigger = "";
  let healthStatus = "FUNCTIONING";

  if (openTrades.length > 0) {
    healthStatus = "IN_TRADE";
    const activeTrade = openTrades[0];
    const uPnl = calcUnrealizedPnL(activeTrade, currentPrice);
    state.openTrade = {
      ...activeTrade,
      entryPrice: activeTrade.entry,
      stopLoss: activeTrade.sl,
      tpPrice: activeTrade.tpPrice || activeTrade.fibTpPrice,
      unrealizedPnl: uPnl,
      livePnl: uPnl,
      profit: uPnl,
      peakPnl: activeTrade.maxUnrealizedPnL || 0,
      lockedProfit: activeTrade.lockedPnlFloor || 0,
      trailingActive: !!activeTrade.trendRidingActive
    };
    blockerReason = `Active Position Open: #${activeTrade.contractId || activeTrade.id} (${activeTrade.direction} @ ${Number(activeTrade.entry).toFixed(2)}, PnL: ${uPnl >= 0 ? "+" : ""}${uPnl.toFixed(2)})`;
    nextTrigger = `Managing Position: Trailing Ratchet active (TP Target: ${TARGET_MIN_PROFIT.toFixed(2)} Net, SL: ${SOFTWARE_SL_USD.toFixed(2)})`;
  } else if (state.dailyTargetReached) {
    state.openTrade = null;
    healthStatus = "FUNCTIONING";
    blockerReason = `Daily Net Target (+${DAILY_PROFIT_TARGET_USD.toFixed(2)}) Secured Today (${(state.dailyNetPnl || 0).toFixed(2)})`;
    nextTrigger = "Idling until 00:00 UTC daily rollover";
  } else if (state.dailyMaxLossReached) {
    state.openTrade = null;
    healthStatus = "FUNCTIONING";
    blockerReason = `Daily Loss Limit (-$4.00) Reached (${(state.dailyNetPnl || 0).toFixed(2)})`;
    nextTrigger = "Capital protection active. Idling until 00:00 UTC daily rollover";
  } else {
    state.openTrade = null;
    if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      const priceAboveBoth = currentEma100 !== null && currentEma200 !== null && currentPrice > currentEma100 && currentPrice > currentEma200;
      const priceBelowBoth = currentEma100 !== null && currentEma200 !== null && currentPrice < currentEma100 && currentPrice < currentEma200;
      if (priceAboveBoth) {
        blockerReason = `Price (${currentPrice.toFixed(2)}) > EMA 100/200. Bullish Trend Active. SELL trades strictly forbidden by EMA 100 filter`;
        nextTrigger = `Awaiting Fresh Stoch (15,2,5) %K (${(sK !== null ? sK.toFixed(1) : "N/A")}) cross > 50 for Initial BUY (invalid if already > 50), or EMA 100 pullback touch`;
      } else if (priceBelowBoth) {
        blockerReason = `Price (${currentPrice.toFixed(2)}) < EMA 100/200. Bearish Trend Active. BUY trades strictly forbidden by EMA 100 filter`;
        nextTrigger = `Awaiting Fresh Stoch (15,2,5) %K (${(sK !== null ? sK.toFixed(1) : "N/A")}) cross < 50 for Initial SELL (invalid if already < 50), or EMA 100 pullback touch`;
      } else if (state.v75_emaTouched_BUY) {
        blockerReason = "EMA 100 Pullback Touched (BUY Armed)";
        nextTrigger = `Awaiting Stoch (15,2,5) %K (${(sK !== null ? sK.toFixed(1) : "N/A")}) cross > 20 with candle close > EMA 100 (${currentEma100.toFixed(2)})`;
      } else if (state.v75_emaTouched_SELL) {
        blockerReason = "EMA 100 Pullback Touched (SELL Armed)";
        nextTrigger = `Awaiting Stoch (15,2,5) %K (${(sK !== null ? sK.toFixed(1) : "N/A")}) cross < 80 with candle close < EMA 100 (${currentEma100.toFixed(2)})`;
      } else {
        blockerReason = `Consolidation between EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) and EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})`;
        nextTrigger = "Awaiting breakout above both EMAs or pullback touch to EMA 100";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" || SYMBOL === "R_25") {
      const stoch100Buy = sK100 !== null && sK100 >= 50.0;
      const stoch100Sell = sK100 !== null && sK100 <= 50.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;

      if (stoch100Buy) {
        if (!state.v25_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 100: ${sK100.toFixed(1)} > 50, Price vs EMA100: ${emaBuy ? "ABOVE" : "BELOW"})`;
          nextTrigger = `Awaiting Stoch (30,2,5) %K (${sK3025 !== null ? sK3025.toFixed(1) : "N/A"}) cross > 50 (within 3 candles of Stoch 100 cross) for Initial BUY`;
        } else {
          const touched50 = Boolean(state.v25_stoch302515_touched_50_BUY || (sK302515 !== null && sK302515 <= 50.0));
          blockerReason = `BUY Trend Active (Stoch 100: ${sK100.toFixed(1)} > 50). Initial BUY already taken.`;
          nextTrigger = touched50
            ? `Stoch (30,25,15) touched <= 50 (%K: ${sK302515?.toFixed(1)}). Awaiting fresh %K cross above %D (${sD302515?.toFixed(1)}) for BUY Re-Entry`
            : `Awaiting Stoch (30,25,15 Simple) %K (${sK302515 !== null ? sK302515.toFixed(1) : "N/A"}) pullback to touch/cross <= 50 for BUY Re-Entry`;
        }
      } else if (stoch100Sell) {
        if (!state.v25_initialSellDone) {
          blockerReason = `Macro Trend Bearish (Stoch 100: ${sK100.toFixed(1)} < 50, Price vs EMA100: ${emaSell ? "BELOW" : "ABOVE"})`;
          nextTrigger = `Awaiting Stoch (30,2,5) %K (${sK3025 !== null ? sK3025.toFixed(1) : "N/A"}) cross < 50 (within 3 candles of Stoch 100 cross) for Initial SELL`;
        } else {
          const touched50 = Boolean(state.v25_stoch302515_touched_50_SELL || (sK302515 !== null && sK302515 >= 50.0));
          blockerReason = `SELL Trend Active (Stoch 100: ${sK100.toFixed(1)} < 50). Initial SELL already taken.`;
          nextTrigger = touched50
            ? `Stoch (30,25,15) touched >= 50 (%K: ${sK302515?.toFixed(1)}). Awaiting fresh %K cross below %D (${sD302515?.toFixed(1)}) for SELL Re-Entry`
            : `Awaiting Stoch (30,25,15 Simple) %K (${sK302515 !== null ? sK302515.toFixed(1) : "N/A"}) pullback to touch/cross >= 50 for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting Stoch 100 trend definition";
        nextTrigger = "Awaiting Stoch 100 cross 50.0";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
      const stoch100Buy = sK100 !== null && sK100 >= 50.0;
      const stoch100Sell = sK100 !== null && sK100 <= 50.0;
      const stoch30Buy = sK3025 !== null && sK3025 >= 50.0;
      const stoch30Sell = sK3025 !== null && sK3025 <= 50.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;

      if (stoch100Buy) {
        if (!state.v75_1s_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 100: ${sK100.toFixed(1)} > 50, Price vs EMA100: ${emaBuy ? "ABOVE" : "BELOW"})`;
          nextTrigger = `Awaiting Stoch (30,2,5) %K (${sK3025 !== null ? sK3025.toFixed(1) : "N/A"}) cross > 50 (within 3 candles of Stoch 100 cross) for Initial BUY`;
        } else {
          blockerReason = `BUY Trend Active (Stoch 100: ${sK100.toFixed(1)} > 50). Initial BUY already taken.`;
          nextTrigger = `Awaiting Aux Stoch (15,2,5 Simple) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) cross > 20 for BUY Re-Entry`;
        }
      } else if (stoch100Sell) {
        if (!state.v75_1s_initialSellDone) {
          blockerReason = `Macro Trend Bearish (Stoch 100: ${sK100.toFixed(1)} < 50, Price vs EMA100: ${emaSell ? "BELOW" : "ABOVE"})`;
          nextTrigger = `Awaiting Stoch (30,2,5) %K (${sK3025 !== null ? sK3025.toFixed(1) : "N/A"}) cross < 50 (within 3 candles of Stoch 100 cross) for Initial SELL`;
        } else {
          blockerReason = `SELL Trend Active (Stoch 100: ${sK100.toFixed(1)} < 50). Initial SELL already taken.`;
          nextTrigger = `Awaiting Aux Stoch (15,2,5 Simple) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) cross < 80 for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting Stoch 100 trend definition";
        nextTrigger = "Awaiting Stoch 100 cross 50.0";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || SYMBOL === "R_50") {
      const botPrefix = SYMBOL === "R_25" ? "V25" : SYMBOL === "R_50" ? "V50" : "V100";
      const pfx = botPrefix.toLowerCase();
      const trend = state[pfx + "_trendDir"] || (sK200 >= 50 ? "BUY" : "SELL");
      const isInitialDone = !!state[pfx + "_initialEntryDone"];
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;
      if (trend === "BUY") {
        if (!emaBuy) {
          blockerReason = `BUY Trend Active (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"}), but Price (${currentPrice.toFixed(2)}) is BELOW EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). BUY trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross above EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `BUY Trend & EMA 100 Aligned (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"} > 48, Price > EMA 100)`;
          nextTrigger = isInitialDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 ? sK1525.toFixed(1) : "N/A"}) oversold pullback cross > 20 for BUY Re-Entry` : `Awaiting Stoch (15,2,5) Level 50 cross for Initial BUY`;
        }
      } else {
        if (!emaSell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"}), but Price (${currentPrice.toFixed(2)}) is ABOVE EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). SELL trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross below EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `SELL Trend & EMA 100 Aligned (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"} < 52, Price < EMA 100)`;
          nextTrigger = isInitialDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 ? sK1525.toFixed(1) : "N/A"}) overbought rally cross < 80 for SELL Re-Entry` : `Awaiting Stoch (15,2,5) Level 50 cross for Initial SELL`;
        }
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100") {
      const stochBuy = sK !== null && sK >= 50.0;
      const cciBuy = cVal !== null && cVal >= 0.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;
      const buyWindowActive = !state.v25_initialBuyDone && !!state.v25_cciCrossEpochBuy && ((m5BoundaryEpoch - state.v25_cciCrossEpochBuy) <= 1200) && cciBuy;
      const sellWindowActive = !state.v25_initialSellDone && !!state.v25_cciCrossEpochSell && ((m5BoundaryEpoch - state.v25_cciCrossEpochSell) <= 1200) && !cciBuy;

      if (buyWindowActive) {
        const remMin = Math.max(1, Math.ceil((1200 - (m5BoundaryEpoch - state.v25_cciCrossEpochBuy)) / 60));
        blockerReason = `CCI 100 Crossed > 0 (${remMin}m Execution Window Active). Awaiting Stoch 200 Cross > 50 (Current: ${sK !== null ? sK.toFixed(1) : "N/A"})`;
        nextTrigger = `Awaiting fresh Stoch (200,1,1) %K cross > 50 (${remMin}m left in 20m window)`;
      } else if (sellWindowActive) {
        const remMin = Math.max(1, Math.ceil((1200 - (m5BoundaryEpoch - state.v25_cciCrossEpochSell)) / 60));
        blockerReason = `CCI 100 Crossed < 0 (${remMin}m Execution Window Active). Awaiting Stoch 200 Cross < 50 (Current: ${sK !== null ? sK.toFixed(1) : "N/A"})`;
        nextTrigger = `Awaiting fresh Stoch (200,1,1) %K cross < 50 (${remMin}m left in 20m window)`;
      } else if (stochBuy && cciBuy) {
        if (!emaBuy) {
          blockerReason = `BUY Trend & CCI Aligned, but Price (${currentPrice.toFixed(2)}) is BELOW EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). BUY trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross above EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `BUY Trend, CCI & EMA 100 Aligned (Stoch 200: ${sK.toFixed(1)} >= 50, CCI 100: ${cVal.toFixed(1)} >= 0, Price > EMA 100)`;
          nextTrigger = state.v25_initialBuyDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) cross > 25 for BUY Re-Entry` : `Awaiting fresh CCI 100 cross > 0 for Initial BUY`;
        }
      } else if (stochBuy) {
        blockerReason = `BUY Trend Active (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} >= 50.0). CCI currently ${(cVal !== null ? cVal.toFixed(1) : "N/A")}`;
        nextTrigger = "Awaiting fresh CCI 100 cross above 0";
      } else if (!stochBuy && !cciBuy) {
        if (!emaSell) {
          blockerReason = `SELL Trend & CCI Aligned, but Price (${currentPrice.toFixed(2)}) is ABOVE EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). SELL trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross below EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `SELL Trend, CCI & EMA 100 Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50, CCI 100: ${(cVal !== null ? cVal.toFixed(1) : "N/A")} <= 0, Price < EMA 100)`;
          nextTrigger = state.v25_initialSellDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) cross < 75 for SELL Re-Entry` : `Awaiting fresh CCI 100 cross < 0 for Initial SELL`;
        }
      } else {
        blockerReason = `SELL Trend Active (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50.0). CCI currently ${(cVal !== null ? cVal.toFixed(1) : "N/A")}`;
        nextTrigger = "Awaiting fresh CCI 100 cross below 0";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150") {
      const stochBuy = sK !== null && sK >= 50.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;
      if (stochBuy) {
        if (!emaBuy) {
          blockerReason = `BUY Trend Active (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} >= 50.0), but Price (${currentPrice.toFixed(2)}) is BELOW EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). BUY trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross above EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `BUY Trend & EMA 100 Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} >= 50.0, Price > EMA 100)`;
          nextTrigger = state.v50_initialBuyDone
            ? `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) pullback & cross > 25 for BUY Re-Entry`
            : "Awaiting fresh Stoch (15,2,5) %K cross above 50.0 for Initial BUY";
        }
      } else {
        if (!emaSell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50.0), but Price (${currentPrice.toFixed(2)}) is ABOVE EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). SELL trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross below EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `SELL Trend & EMA 100 Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50.0, Price < EMA 100)`;
          nextTrigger = state.v50_initialSellDone
            ? `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) pullback & cross < 75 for SELL Re-Entry`
            : "Awaiting fresh Stoch (15,2,5) %K cross below 50.0 for Initial SELL";
        }
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") {
      const stoch200Buy = sK200 !== null && sK200 >= 45.0 && state.v25_1s_trendDir === "BUY";
      const stoch200Sell = sK200 !== null && sK200 <= 55.0 && state.v25_1s_trendDir === "SELL";
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;

      if (state.v25_1s_initialDone) {
        if (stoch200Buy) {
          blockerReason = `BUY Trend Active (Stoch 200: ${sK200?.toFixed(1)}, Price ${emaBuy ? ">" : "<"} EMA 100). Re-Entry Mode.`;
          nextTrigger = `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) pullback cross > 25 & Price > EMA 100`;
        } else if (stoch200Sell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${sK200?.toFixed(1)}, Price ${emaSell ? "<" : ">"} EMA 100). Re-Entry Mode.`;
          nextTrigger = `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) rally cross < 75 & Price < EMA 100`;
        } else {
          blockerReason = `Awaiting Trend Direction (Stoch 200: ${sK200?.toFixed(1)} between 45 and 55)`;
          nextTrigger = "Awaiting Stoch 200 cross > 55 or < 45";
        }
      } else {
        blockerReason = `Initial Confluence Mode (Stoch 200: ${sK200?.toFixed(1)}, Stoch 15: ${sK1525?.toFixed(1)}, Price vs EMA 100: ${emaBuy ? "ABOVE" : "BELOW"})`;
        nextTrigger = "Awaiting any-order Stoch 200 (45/55) + Stoch 15 (75/25) + EMA 100 alignment";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
      const stochBuy = sK200 !== null && sK200 >= 50.0;
      const macdBuy = macdVal !== null && macdVal >= 0.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      if (stochBuy && macdBuy && emaBuy) {
        blockerReason = `Macro Trend Bullish (Stoch200: ${sK200.toFixed(1)}, MACD: +${macdVal.toFixed(2)}, Price > EMA100)`;
        nextTrigger = `Awaiting Fast Stoch (5,3,3) %K (${sK533 !== null ? sK533.toFixed(1) : "N/A"}) pullback & cross > 20`;
      } else if (!stochBuy && !macdBuy && !emaBuy) {
        blockerReason = `Macro Trend Bearish (Stoch200: ${sK200.toFixed(1)}, MACD: ${macdVal.toFixed(2)}, Price < EMA100)`;
        nextTrigger = `Awaiting Fast Stoch (5,3,3) %K (${sK533 !== null ? sK533.toFixed(1) : "N/A"}) overbought rally & cross < 80`;
      } else {
        healthStatus = "FUNCTIONING";
        blockerReason = `Confluence De-aligned (Stoch200: ${sK200 ? sK200.toFixed(1) : "N/A"}, MACD: ${macdVal ? macdVal.toFixed(2) : "N/A"}, Price vs EMA100: ${emaBuy ? "ABOVE" : "BELOW"})`;
        nextTrigger = "Awaiting macro confluence alignment";
      }
    }
  }

  // Real operational blockers override normal scanning status
  if (state.dailyLossLockout) {
    healthStatus = "ATTENTION_REQUIRED";
    blockerReason = `Daily Max Loss Reached ($${(state.dailyNetPnl || 0).toFixed(2)}). Trading locked until 00:00 UTC rollover.`;
  } else if (state.lastError && (Date.now() - new Date(state.lastErrorTime || 0).getTime() < 30 * 60 * 1000)) {
    healthStatus = "ATTENTION_REQUIRED";
    blockerReason = `Recent Error: ${state.lastError}`;
  }

  state.healthStatus = healthStatus;
  state.blockerReason = blockerReason;
  state.nextTrigger = nextTrigger;
  state.lastScanTime = new Date(m5BoundaryEpoch * 1000).toISOString();
  state.lastSuccessfulScan = new Date().toISOString();
  state.lastProcessedEpoch = m5BoundaryEpoch; saveState();
  } catch (slowErr) {
    console.log(`[${REPO_LABEL}] ❌ runSlowPathScan Exception: ${slowErr.message}\n${slowErr.stack}`);
    state.lastError = slowErr.message;
    state.lastErrorTime = new Date().toISOString();
    state.lastErrorStack = slowErr.stack ? slowErr.stack.split("\n").slice(0, 3).join(" | ") : null;
    saveState();
  }
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

  let previousHasOpenTrade = false;
  while (true) {
    let hasOpenTrade = false;
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      const currentM5Boundary = nowEpoch - (nowEpoch % 300);

      hasOpenTrade = await manageOpenTradesFastPath();

      // 🔄 Auto-Reconnect Engine: If an order was paused due to gateway 500/timeout, process retries
      if (state.queuedPendingOrder && !hasOpenTrade) {
        await processQueuedPendingOrder(state.currentPrice);
      }

      // ⚡ Immediate Re-Entry Watchdog: When an active trade closes, immediately check for re-entry opportunities
      if (previousHasOpenTrade && !hasOpenTrade && !state.dailyTargetReached) {
        let curTrades = loadTrades();
        const lastTrade = curTrades.length > 0 ? curTrades[curTrades.length - 1] : null;
        const lastWasLoss = lastTrade && (lastTrade.result === "LOSS" || (typeof lastTrade.serverPnl === "number" && lastTrade.serverPnl < 0));
        if (lastWasLoss) {
          console.log(`[${REPO_LABEL}] Previous trade closed in LOSS (${lastTrade.serverPnl || -1}). Clearing activeReentryOpportunity to avoid adverse re-entry.`);
          state.activeReentryOpportunity = null;
          saveState();
        } else if (state.activeReentryOpportunity) {
          console.log(`[${REPO_LABEL}] ⚡ Trade exited in profit! Firing latched re-entry opportunity immediately...`);
          try {
            await checkAndExecuteImmediateReentry(state.currentPrice);
          } catch (e) {
            console.error(`[${REPO_LABEL}] Immediate re-entry attempt failed:`, e.message);
          }
        } else {
          console.log(`[${REPO_LABEL}] Trade exited! Standing by for the next confirmed closed M5 candle boundary to scan.`);
        }
      }
      previousHasOpenTrade = hasOpenTrade;

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
        state.lastSuccessfulScan = new Date().toISOString();
        if (state.lastError) {
          state.lastError = null;
          state.lastErrorTime = null;
        }
        try { saveState(); } catch (_) {}
      }
    } catch (err) {
      console.error(`[${REPO_LABEL}] Engine Loop Error:`, err.message);
      state.lastError = err.message;
      state.lastErrorTime = new Date().toISOString();
      state.lastErrorStack = err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : null;
      state.errorCount = (state.errorCount || 0) + 1;
      try { saveState(); } catch (_) {}
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
