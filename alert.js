// Fleet Master Sync Verified: 2026-10-16T08:04:15.425Z
const fetch = globalThis.fetch;
import fs from "fs";
import path from "path";
import crypto from "crypto";
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
    strategyProfile: "PROFILE_V75_1S_STOCH100_STOCH15",
    gateType: "STOCH100_STOCH15",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 1, slowing: 1, method: "Simple" },
    minTakeProfitPoints: 350.0,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 250.0,
    slType: "HARD_POINTS",
    notes: "Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Initial Trigger M5 Stoch (15,1,1 Simple) %K fresh cross Level 50 (bypassed if already beyond 50 before Stoch 100 cross, opening Re-Entry); Re-Entry: Stoch 100 aligned + M5 Stoch (15,1,1) touches/pulls back to 30 (BUY) / 70 (SELL) (even slightest High/Low wick touch) and crosses > 30 (BUY) / < 70 (SELL) (NO EMA 100 filter); Trade Management: Standard TP $3.50 (2 wins = $7.00 Daily Target); Rule 1: Stoch (15,1,1) touch of Level 80 (BUY) / Level 20 (SELL) arms Rule 2 (post-entry); Rule 2: Immediate exit when Stoch (15,1,1) reverses across Level 50."
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
    strategyProfile: "PROFILE_V75_1S_STOCH100_STOCH15",
    gateType: "STOCH100_STOCH15",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 1, slowing: 1, method: "Simple" },
    minTakeProfitPoints: 70.0,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 2.00,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 80.0,
    slType: "HARD_POINTS",
    notes: "Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Initial Trigger M5 Stoch (15,1,1 Simple) %K fresh cross Level 50 (bypassed if already beyond 50 before Stoch 100 cross, opening Re-Entry); Re-Entry: Stoch 100 aligned + M5 Stoch (15,1,1) touches/pulls back to 30 (BUY) / 70 (SELL) (even slightest High/Low wick touch) and crosses > 30 (BUY) / < 70 (SELL) (NO EMA 100 filter); Trade Management: Standard TP $3.50 (2 wins = $7.00 Daily Target); Stoch (15,1,1) touch of Level 80 (BUY) / Level 20 (SELL) moves Software SL to +$0.30; immediate exit when Stoch (15,1,1) crosses Level 50."
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
    strategyProfile: "PROFILE_V75_1S_STOCH100_STOCH15",
    gateType: "STOCH100_STOCH15",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 1, slowing: 1, method: "Simple", level: 50 },
    minTakeProfitPoints: 10.00,
    minTakeProfitUsd: 10.00,
    softwareSlUsd: 4.00,
    trailActivationUsd: 5.00,
    maxHardStopPoints: 4.00,
    slType: "HARD_POINTS",
    notes: "1.00 lot cTrader minimum; Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Initial Trigger M5 Stoch (15,1,1 Simple) %K fresh cross Level 50 (bypassed if already beyond 50 before Stoch 100 cross, opening Re-Entry); Re-Entry: Stoch 100 aligned + M5 Stoch (15,1,1) touches/pulls back to 30 (BUY) / 70 (SELL) (even slightest High/Low wick touch) and crosses > 30 (BUY) / < 70 (SELL) (NO EMA 100 filter); Trade Management: Hard Broker TP $10.00; Stoch (15,1,1) touch of Level 80 (BUY) / Level 20 (SELL) moves Software SL to +$0.30; immediate exit when Stoch (15,1,1) crosses Level 50."
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
    softwareSlUsd: 4.00,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 5.50,
    slType: "M15_FRACTAL",
    notes: "Macro Trend Stoch 200 Level 50 Gate & MACD Confirmation + M5 EMA 100 Baseline + M5 Fast Stoch (5,3,3) 20/80 Re-Entry Trigger + Trade Management: Stoch (15,1,1) touch of Level 80 (BUY) / Level 20 (SELL) moves Software SL to +$0.30; immediate exit when Stoch (15,1,1) crosses Level 50."
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
    strategyProfile: "PROFILE_V75_1S_STOCH100_STOCH15",
    gateType: "STOCH100_STOCH15",
    stoch100Params: { k: 100, d: 1, slowing: 1 },
    stoch15Params: { k: 15, d: 1, slowing: 1, method: "Simple", level: 50 },
    macdParams: { fast: 5, slow: 35, signal: 1 },
    minTakeProfitPoints: 2000.0,
    minTakeProfitUsd: 10.00,
    softwareSlUsd: null,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 1000.0,
    slType: "ENTRY_CANDLE_EXTREME",
    notes: "0.005 lots cTrader engine; Condition 1: Macro Trend Closed M5 Stoch (100,1,1) %K cross Level 50; Condition 2: Initial Trigger M5 Stoch (15,1,1 Simple) %K fresh cross Level 50; Re-Entry: Stoch 100 aligned + M5 Stoch (15,1,1) pulls back to 20 (BUY) / 80 (SELL) and crosses > 20 (BUY) / < 80 (SELL) + M5 MACD (5,35,1) Filter (BUY blocked if MACD < 0, SELL blocked if MACD > 0); Trade Management: Hard Broker TP $10.00 (Hard Broker SL -$5.00); Software SL is closed M5 candle past Entry Candle Low (BUY) / High (SELL); Stoch (15,1,1) touch of Level 80 (BUY) / Level 20 (SELL) moves Software SL to +$0.30; immediate exit when Stoch (15,1,1) crosses Level 50."
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
    strategyProfile: "PROFILE_V25_STOCH100_STOCH25",
    gateType: "STOCH100_STOCH25",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch25Params: { k: 25, d: 1, slowing: 1, method: "Simple", level: 50 },
    minTakeProfitPoints: 10.00,
    minTakeProfitUsd: 5.00,
    softwareSlUsd: 3.50,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 10.00,
    slType: "HARD_POINTS",
    notes: "0.50 lots cTrader engine; Condition 1: Macro Trend Closed M5 Stoch (100,1,1) cross Level 50; Condition 2: Initial Trigger M5 Stoch (25,1,1 Simple) cross Level 50 within +/- 3 candles tolerance (simultaneous, up to 3 before or after); Re-Entry: Closed M5 Stoch (100,1,1) aligned & no active trade open + M5 Stoch (25,1,1) pulls back and freshly crosses Level 10 (BUY) / Level 90 (SELL); Trade Management: Hard Broker TP $5.00; Software SL -$3.50 (Hard Broker SL -$5.00); Sequential Stoch (25,1,1): Rule 1 touches Level 50 moves Software SL to +$0.30 -> Rule 2 immediate exit on Level 50 reversal (strictly dependent on Rule 1); Opposite Signal Position Flip."
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
    strategyProfile: "PROFILE_V50_MACD_STOCH25",
    gateType: "MACD_STOCH25",
    macdParams: { fast: 5, slow: 35, signal: 1 },
    stoch25Params: { k: 25, d: 1, slowing: 1, method: "Simple", level: 50 },
    minTakeProfitPoints: 0.75,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: 2.50,
    trailActivationUsd: 2.20,
    trailBufferUsd: 1.20,
    maxHardStopPoints: 1.25,
    slType: "HARD_POINTS",
    notes: "4.00 lots cTrader engine; Condition 1: Macro Trend Closed M5 MACD (5,35,1) cross Level 0; Condition 2: Initial Trigger M5 Stoch (25,1,1 Simple) cross Level 50 within +/- 2 candles tolerance (simultaneous, up to 2 before or after); Re-Entry: Closed M5 MACD (5,35,1) aligned & no active trade open + M5 Stoch (25,1,1) pulls back and freshly crosses Level 10 (BUY) / Level 90 (SELL); Trade Management: Hard Broker TP $3.00; Software SL -$2.50 (Hard Broker SL -$5.00); Sequential Stoch (25,1,1): Rule 1 touches Level 50 moves Software SL to +$0.30 -> Rule 2 immediate exit on Level 50 reversal (strictly dependent on Rule 1); Opposite Signal Position Flip."
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
    strategyProfile: "PROFILE_V10_STOCH50_STOCH25",
    gateType: "STOCH50_STOCH25",
    stoch50Params: { k: 50, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch25Params: { k: 25, d: 1, slowing: 1, method: "Simple", level: 50 },
    minTakeProfitPoints: 7.00,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: 3.50,
    trailActivationUsd: 2.20,
    maxHardStopPoints: 10.00,
    slType: "HARD_POINTS",
    notes: "0.50 lots cTrader engine; Condition 1: Macro Trend Closed M5 Stoch (50,1,1 Simple) cross Level 50; Condition 2: Initial Trigger M5 Stoch (25,1,1 Simple) cross Level 50 within +/- 2 candles tolerance (simultaneous, up to 2 before or after); Re-Entry: Closed M5 Stoch (50,1,1) aligned & no active trade open + M5 Stoch (25,1,1) pulls back and freshly crosses Level 50; Trade Management: Hard Broker TP $5.00; Software TP $3.50; Software SL -$3.50 (Hard Broker SL -$5.00); Rule 1: Software SL if M5 candle closes against entry candle High/Low; Rule 2: Stoch (25,1,1) touches Level 80 (BUY) / Level 20 (SELL) and reverses across Level 50; Opposite Signal Position Flip."
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
  "R_25": -3.50,     // Tea Machine (V25, 400x) — Calibrated Software SL -$3.50
  "1HZ75V": -2.00,   // Coffee (V75-1s, 0.05 lots) — Max 2% loss risk ($2.00)
  "R_75": -2.00,     // Lery's Alerts (V75, 50x) — Max 2% loss risk ($2.00)
  "R_100": -4.00,    // Milk Machine (V100, 1.00 lot) — Software SL -$4.00
  "1HZ100V": -4.00,  // Ice Cream Legacy (V100-1s, 40x) ($2.50 SL)
  "1HZ25V": null,   // Ice Cream Machine (V25-1s) (Dynamic Entry Candle High/Low Software SL, $5.00 Broker Hard SL)
  "R_50": -2.50,     // OmniSight (V50, 4.00 lots) — Calibrated Software SL -$2.50
  "R_10": -3.50      // Test Bot (V10, 400x) — Calibrated Software SL -$3.50 ($5.00 Broker Hard SL)
};

const DEFAULT_SOFTWARE_SL_USD = -2.00;
// Daily Max Loss Freeze Removed per Trader Directive (Zero Artificial Session Halts)
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
function getFriendlyStrategyName() {
  if (SYMBOL === "R_25") return "M5 Stoch (100,1,1) Trend + Stoch (25,1,1) Confluence (+/-3c Initial & 10/90 Re-Entry)";
  if (SYMBOL === "R_50") return "M5 MACD (5,35,1) Trend + Stoch (25,1,1) Confluence (+/-2c Initial & 10/90 Re-Entry)";
  if (SYMBOL === "1HZ25V") return "M5 Stoch (100,1,1) Trend + Stoch (15,1,1) Confluence (20/80 Re-Entry + MACD 5,35,1 Filter)";
  if (SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_100") return "M5 Stoch (100,1,1) Trend + Stoch (15,1,1) Confluence (30/70 Re-Entry)";
  if (SYMBOL === "R_10")   return "M5 Stoch (50,1,1) Trend + Stoch (25,1,1) Confluence (+/-2c Initial & 50 Re-Entry)";
  return "M5 Multi-Indicator Confluence";
}

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

// ── TELEGRAM DEDUPLICATION & SINGLE-FIRE ENGINE ──
const sentTelegramHashes = new Map();
const reportedExitContracts = new Set();

function isExitAlreadyReported(cid) {
  if (!cid) return false;
  const sCid = String(cid);
  if (reportedExitContracts.has(sCid)) return true;
  if (state.reportedExits && state.reportedExits[sCid]) {
    reportedExitContracts.add(sCid);
    return true;
  }
  return false;
}

function markExitReported(cid) {
  if (!cid) return;
  const sCid = String(cid);
  reportedExitContracts.add(sCid);
  state.reportedExits = state.reportedExits || {};
  state.reportedExits[sCid] = Date.now();
  const cutoff = Date.now() - 86400000;
  for (const k of Object.keys(state.reportedExits)) {
    if (state.reportedExits[k] < cutoff) delete state.reportedExits[k];
  }
  saveState();
}

async function sendTelegram(msg, options = {}) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: "missing_credentials" };
  if (!msg || typeof msg !== "string") return { ok: false };

  // Exit Deduplication Guard: Never fire duplicate exit messages for the same contract
  let exitCid = options.contractId;
  if (!exitCid && (msg.includes("Contract:") || msg.includes("contract:"))) {
    const m = msg.match(/[Cc]ontract:\s*`?([0-9a-zA-Z_-]+)`?/);
    if (m && m[1]) exitCid = m[1];
  }
  if (exitCid && (msg.includes("EXIT") || msg.includes("Exit") || msg.includes("Trade WIN") || msg.includes("Trade LOSS") || msg.includes("Structure Break") || msg.includes("Invalidation") || msg.includes("Liquidated") || msg.includes("liquidated"))) {
    if (isExitAlreadyReported(exitCid)) {
      console.log(`[TELEGRAM DEDUP] Auto-suppressed duplicate exit message for contract ${exitCid}`);
      return { ok: true, suppressed: true };
    }
    markExitReported(exitCid);
  }

  // 60-second general content deduplication
  let msgHash = "";
  try {
    if (crypto && typeof crypto.createHash === "function") {
      msgHash = crypto.createHash("md5").update(msg.trim()).digest("hex");
    }
  } catch {}
  if (!msgHash) {
    let h = 5381;
    const s = msg.trim();
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h |= 0;
    }
    msgHash = String(h);
  }
  const now = Date.now();
  const lastSent = sentTelegramHashes.get(msgHash);
  if (lastSent && (now - lastSent < 60000)) {
    console.log(`[TELEGRAM DEDUP] Suppressed duplicate message (${now - lastSent}ms ago)`);
    return { ok: true, suppressed: true };
  }
  sentTelegramHashes.set(msgHash, now);

  if (sentTelegramHashes.size > 200) {
    for (const [h, t] of sentTelegramHashes.entries()) {
      if (now - t > 120000) sentTelegramHashes.delete(h);
    }
  }

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
      const isHardTpSymbol = (SYMBOL === "R_100" || SYMBOL === "1HZ25V" || SYMBOL === "R_25" || SYMBOL === "R_50" || SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_10");
      const isDynamicRunner = isHardTpSymbol ? false : true;
      const hardTpUsd = (SYMBOL === "R_100" || SYMBOL === "1HZ25V") ? 10.00 : ((SYMBOL === "R_25" || SYMBOL === "R_10") ? 5.00 : (SYMBOL === "R_50" ? 3.00 : ((SYMBOL === "1HZ75V" || SYMBOL === "R_75") ? 3.50 : null)));
      const brokerSlDollars = (SYMBOL === "R_10" || SYMBOL === "R_25" || SYMBOL === "1HZ25V" || SYMBOL === "R_50") ? 5.00 : (Math.abs(SOFTWARE_SL_USD) || 4.00);
      const brokerSlPrice = orderContext.brokerSlPrice || orderContext.slPrice || null;
      const payload = {
        symbol: SYMBOL_NAME || SYMBOL,
        side: direction,
        lots: CTRADER_LOT_SIZE,
        slPrice: brokerSlPrice,
        tpPrice: isHardTpSymbol ? (orderContext.tpPrice || orderContext.fibTpPrice || null) : (isDynamicRunner ? null : (orderContext.tpPrice || orderContext.fibTpPrice || null)),
        slUsd: brokerSlDollars,
        tpUsd: hardTpUsd !== null ? hardTpUsd : (isDynamicRunner ? null : (TARGET_MIN_PROFIT || 4.00)),
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
      limit_order: { stop_loss: slDollars, take_profit: SYMBOL === "R_100" ? 10.00 : SERVER_TP_USD } 
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
        const wsOpts = typeof window === "undefined" ? {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://deriv.com"
          }
        } : undefined;
        const ws = new WS(endpointUrl, wsOpts);
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
        const wsOpts = typeof window === "undefined" ? {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://deriv.com"
          }
        } : undefined;
        const ws = new WS(endpointUrl, wsOpts);
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

export function calculateBollingerBands(candles, period = 20, stdDevMult = 2) {
  const closes = candles.map(c => parseFloat(c.close));
  const middle = sma(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    upper[i] = mean + (stdDevMult * stdDev);
    lower[i] = mean - (stdDevMult * stdDev);
  }
  return { middle, upper, lower };
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

export function calculateADX(candles, period = 14) {
  const len = candles.length;
  const adxOut = new Array(len).fill(null);
  const plusDIOut = new Array(len).fill(null);
  const minusDIOut = new Array(len).fill(null);

  if (len < period * 2) {
    return { adx: adxOut, plusDI: plusDIOut, minusDI: minusDIOut };
  }

  const tr = new Array(len).fill(0);
  const plusDM = new Array(len).fill(0);
  const minusDM = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const high = parseFloat(candles[i].high);
    const low = parseFloat(candles[i].low);
    const prevClose = parseFloat(candles[i - 1].close);
    const prevHigh = parseFloat(candles[i - 1].high);
    const prevLow = parseFloat(candles[i - 1].low);

    tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
  }

  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 1; i <= period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  const dx = new Array(len).fill(0);

  let plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  let minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
  let diSum = plusDI + minusDI;
  dx[period] = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
  plusDIOut[period] = plusDI;
  minusDIOut[period] = minusDI;

  for (let i = period + 1; i < len; i++) {
    smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];

    plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
    diSum = plusDI + minusDI;
    dx[i] = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;

    plusDIOut[i] = plusDI;
    minusDIOut[i] = minusDI;
  }

  let adxSum = 0;
  for (let i = period; i < 2 * period; i++) {
    adxSum += dx[i];
  }
  let currentADX = adxSum / period;
  adxOut[2 * period - 1] = currentADX;

  for (let i = 2 * period; i < len; i++) {
    currentADX = ((currentADX * (period - 1)) + dx[i]) / period;
    adxOut[i] = currentADX;
  }

  return { adx: adxOut, plusDI: plusDIOut, minusDI: minusDIOut };
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

// evaluateH1AdverseClose purged per trader mandate

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

/**
 * 🛡️ Evaluates the 2-Opposing-Fractals Structural Reversal Exit on confirmed closed M5 candles.
 * For BUY trade: Looks for the first two Swing High (Top) fractals formed at/after entry.
 *   If F2 <= F1 (Lower High or Double Top) -> Sellers are taking over -> Trigger Exit.
 * For SELL trade: Looks for the first two Swing Low (Bottom) fractals formed at/after entry.
 *   If F2 >= F1 (Higher Low or Double Bottom) -> Buyers are taking over -> Trigger Exit.
 */
function evaluate2OpposingFractalsReversal(t, candles, si) {
  if (!t || !t.direction || !candles || candles.length < 5 || si < 4) {
    return { triggered: false };
  }
  const isBuy = t.direction === "BUY";
  const entryEpoch = t.entryEpoch || 0;
  
  // Find all confirmed opposing fractals formed after entry in chronological order
  const fractals = [];
  
  // Pivot k ranges from earliest post-entry candle up to si - 2 (since k+2 <= si is confirmed)
  for (let k = 2; k <= si - 2; k++) {
    const confirmEpoch = candles[k + 2].epoch;
    const pivotEpoch = candles[k].epoch;
    
    // Only fractals whose pivot or confirmation is at/after trade entry
    if (confirmEpoch < entryEpoch || pivotEpoch < (entryEpoch - 300)) continue;
    
    if (isBuy) {
      // Swing High (Top Fractal)
      const h = parseFloat(candles[k].high);
      const isTop = h > parseFloat(candles[k - 1].high) &&
                    h > parseFloat(candles[k - 2].high) &&
                    h > parseFloat(candles[k + 1].high) &&
                    h > parseFloat(candles[k + 2].high);
      if (isTop) {
        fractals.push({ price: h, pivotEpoch, confirmEpoch });
      }
    } else {
      // Swing Low (Bottom Fractal)
      const l = parseFloat(candles[k].low);
      const isBottom = l < parseFloat(candles[k - 1].low) &&
                       l < parseFloat(candles[k - 2].low) &&
                       l < parseFloat(candles[k + 1].low) &&
                       l < parseFloat(candles[k + 2].low);
      if (isBottom) {
        fractals.push({ price: l, pivotEpoch, confirmEpoch });
      }
    }
  }
  
  // Must have at least two opposing fractals formed after entry
  if (fractals.length < 2) {
    return { triggered: false };
  }
  
  // Evaluate the first two opposing fractals (F1 and F2)
  const f1 = fractals[0];
  const f2 = fractals[1];
  
  // Double top/bottom tolerance threshold (0.05% of price)
  const dtTolerance = f1.price * 0.0005;
  
  if (isBuy) {
    // For BUY: F1 is first high, F2 is second high.
    // Lower High: F2 < F1 (outside DT tolerance)
    // Double Top: |F2 - F1| <= dtTolerance or F2 <= F1
    if (f2.price <= f1.price || Math.abs(f2.price - f1.price) <= dtTolerance) {
      const isDoubleTop = Math.abs(f2.price - f1.price) <= dtTolerance;
      return {
        triggered: true,
        pattern: isDoubleTop ? "Double Top Fractal" : "Lower High Fractal",
        f1Price: f1.price,
        f2Price: f2.price,
        f1Epoch: f1.pivotEpoch,
        f2Epoch: f2.pivotEpoch
      };
    }
  } else {
    // For SELL: F1 is first low, F2 is second low.
    // Higher Low: F2 > F1 (outside DB tolerance)
    // Double Bottom: |F2 - F1| <= dtTolerance or F2 >= F1
    if (f2.price >= f1.price || Math.abs(f2.price - f1.price) <= dtTolerance) {
      const isDoubleBottom = Math.abs(f2.price - f1.price) <= dtTolerance;
      return {
        triggered: true,
        pattern: isDoubleBottom ? "Double Bottom Fractal" : "Higher Low Fractal",
        f1Price: f1.price,
        f2Price: f2.price,
        f1Epoch: f1.pivotEpoch,
        f2Epoch: f2.pivotEpoch
      };
    }
  }
  
  return { triggered: false };
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
  "fibBullish", "v75_initialBuyArmed", "v75_initialSellArmed",
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
  "v50_trendDir", "v50_initialEntryDone", "v50_armedEpoch", "v50_adx", "adxVal",
  "bb20MidVal", "bb20BuyArmed", "bb20SellArmed", "bb20Aligned",
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
  "stoch100Val", "stoch1511Val", "stoch1511MaxVal", "stoch1511MinVal", "v75_1s_stoch15_pulled_back_30", "v75_1s_stoch15_pulled_back_70", "stoch3025Val", "stoch3025Signal", "stoch302515Val", "stoch302515Signal",
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
  state.v75_1s_stoch15_pulled_back_30 = false;
  state.v75_1s_stoch15_pulled_back_70 = false;
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
state.dailyMaxLossReached = false;
state.dailyMaxLossDate = null;

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

let latestM5Candles = null;

function updateAndComputeLiveStoch1511(currentPrice, nowEpoch) {
  if (!latestM5Candles || latestM5Candles.length < 16 || !currentPrice || isNaN(currentPrice)) {
    return { liveK: null, maxK: null, minK: null };
  }
  const currentBucket = Math.floor(nowEpoch / 300) * 300;
  let lastCandle = latestM5Candles[latestM5Candles.length - 1];
  if (lastCandle.epoch < currentBucket) {
    latestM5Candles.push({
      epoch: currentBucket,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice
    });
    if (latestM5Candles.length > 250) latestM5Candles.shift();
    lastCandle = latestM5Candles[latestM5Candles.length - 1];
  } else {
    lastCandle.close = currentPrice;
    lastCandle.high = Math.max(parseFloat(lastCandle.high) || currentPrice, currentPrice);
    lastCandle.low = Math.min(parseFloat(lastCandle.low) || currentPrice, currentPrice);
  }
  const idx = latestM5Candles.length - 1;
  const sl15 = latestM5Candles.slice(idx - 14, idx + 1);
  const hh15 = Math.max(...sl15.map(c => parseFloat(c.high)));
  const ll15 = Math.min(...sl15.map(c => parseFloat(c.low)));
  const cH = parseFloat(lastCandle.high);
  const cL = parseFloat(lastCandle.low);
  const liveK = hh15 === ll15 ? 50 : ((currentPrice - ll15) / (hh15 - ll15)) * 100;
  const highK15 = hh15 === ll15 ? 100 : ((cH - ll15) / (hh15 - ll15)) * 100;
  const lowK15 = hh15 === ll15 ? 0 : ((cL - ll15) / (hh15 - ll15)) * 100;
  return {
    liveK,
    maxK: Math.max(liveK, highK15),
    minK: Math.min(liveK, lowK15)
  };
}

function updateAndComputeLiveStoch2511(currentPrice, nowEpoch) {
  if (!latestM5Candles || latestM5Candles.length < 26 || !currentPrice || isNaN(currentPrice)) {
    return { liveK: null, maxK: null, minK: null };
  }
  const currentBucket = Math.floor(nowEpoch / 300) * 300;
  let lastCandle = latestM5Candles[latestM5Candles.length - 1];
  if (lastCandle.epoch < currentBucket) {
    latestM5Candles.push({
      epoch: currentBucket,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice
    });
    if (latestM5Candles.length > 250) latestM5Candles.shift();
    lastCandle = latestM5Candles[latestM5Candles.length - 1];
  } else {
    lastCandle.close = currentPrice;
    lastCandle.high = Math.max(parseFloat(lastCandle.high) || currentPrice, currentPrice);
    lastCandle.low = Math.min(parseFloat(lastCandle.low) || currentPrice, currentPrice);
  }
  const idx = latestM5Candles.length - 1;
  const sl25 = latestM5Candles.slice(idx - 24, idx + 1);
  const hh25 = Math.max(...sl25.map(c => parseFloat(c.high)));
  const ll25 = Math.min(...sl25.map(c => parseFloat(c.low)));
  const cH = parseFloat(lastCandle.high);
  const cL = parseFloat(lastCandle.low);
  const liveK = hh25 === ll25 ? 50 : ((currentPrice - ll25) / (hh25 - ll25)) * 100;
  const highK25 = hh25 === ll25 ? 100 : ((cH - ll25) / (hh25 - ll25)) * 100;
  const lowK25 = hh25 === ll25 ? 0 : ((cL - ll25) / (hh25 - ll25)) * 100;
  return {
    liveK,
    maxK: Math.max(liveK, highK25),
    minK: Math.min(liveK, lowK25)
  };
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
        // Internal self-healing logged to console only (no confusing Telegram spam)
        console.log(`[SELF-HEALING RECOVERY] Contract ${t.contractId} (${t.direction}) restored in V8 RAM monitoring.`);
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

  // Ensure M5 candles are cached in memory for live intrabar Stoch (15,1,1) evaluation
  if (!latestM5Candles || latestM5Candles.length < 16) {
    try {
      const { m5 } = await fetchAllData();
      if (m5 && m5.length >= 20) {
        latestM5Candles = m5.map(c => ({ ...c }));
      }
    } catch (_) {}
  }

  const liveStoch15 = updateAndComputeLiveStoch1511(currentPrice, nowEpoch);
  if (liveStoch15.liveK !== null) {
    state.stoch1511Val = liveStoch15.liveK;
  }
  let liveStoch25 = { liveK: null, maxK: null, minK: null };
  if (SYMBOL === "R_25" || SYMBOL === "R_50" || SYMBOL === "R_10") {
    liveStoch25 = updateAndComputeLiveStoch2511(currentPrice, nowEpoch);
    if (liveStoch25.liveK !== null) {
      state.stoch2511Val = liveStoch25.liveK;
      state.stoch1511Val = liveStoch25.liveK;
    }
  }

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);
    openTrade.unrealizedPnl = pnl;

    // =========================================================================
    // 🎯 TARGET CAPITAL PROTECTION & INSTANT PROFIT CEILING
    // =========================================================================
    openTrade.maxUnrealizedPnL = Math.max(openTrade.maxUnrealizedPnL || 0, pnl);
    const peak = openTrade.maxUnrealizedPnL;

    let stoch15Level50ExitReason = null;
    let stoch25Level50ExitReason = null;
    const isPostEntryM5Bucket = !openTrade.entryEpoch || Math.floor(nowEpoch / 300) > Math.floor(openTrade.entryEpoch / 300);

    if (SYMBOL === "R_25" || SYMBOL === "R_50") {
      // =========================================================================
      // 🍵 TEA MACHINE (R_25) & 🧭 OMNISIGHT (R_50) SEQUENTIAL STOCH (25,1,1) TRADE MANAGEMENT:
      // STRICTLY SEQUENTIAL (RULE 2 DEPENDS ON RULE 1):
      // Step 1 (Rule 1): After trade is opened, when in profit and Stoch (25,1,1)
      //    touches Level 50 (>= 50.0 for BUY, <= 50.0 for SELL), move Software SL
      //    to +$0.30 and set openTrade.stoch25_touched_midline = true.
      // Step 2 (Rule 2 — Dependent on Rule 1): ONLY AFTER Rule 1 has occurred
      //    (openTrade.stoch25_touched_midline === true), if Stoch (25,1,1) reverses and
      //    crosses back below 50.0 for BUY or above 50.0 for SELL, close immediately.
      // =========================================================================
      if (liveStoch25.liveK !== null && isPostEntryM5Bucket) {
        if (!openTrade.stoch25_touched_midline) {
          if (isBuy && liveStoch25.liveK >= 50.0 && pnl > 0) {
            openTrade.stoch25_touched_midline = true;
            openTrade.stoch25_touched_midline_epoch = nowEpoch;
            if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 0.30) {
              openTrade.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 25] Rule 1 Armed: BUY #${openTrade.contractId} Stoch (25,1,1) touched Level 50 (%K: ${liveStoch25.liveK.toFixed(1)}) in profit (+$${pnl.toFixed(2)}) -> Software SL moved to +$0.30 & Rule 2 (Level 50 Exit) Unlocked!`);
          } else if (!isBuy && liveStoch25.liveK <= 50.0 && pnl > 0) {
            openTrade.stoch25_touched_midline = true;
            openTrade.stoch25_touched_midline_epoch = nowEpoch;
            if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 0.30) {
              openTrade.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 25] Rule 1 Armed: SELL #${openTrade.contractId} Stoch (25,1,1) touched Level 50 (%K: ${liveStoch25.liveK.toFixed(1)}) in profit (+$${pnl.toFixed(2)}) -> Software SL moved to +$0.30 & Rule 2 (Level 50 Exit) Unlocked!`);
          }
        } else if (openTrade.stoch25_touched_midline === true) {
          if (isBuy && liveStoch25.liveK < 50.0) {
            stoch25Level50ExitReason = `Rule 2 Triggered: Stoch (25,1,1) reversed below Level 50 (${liveStoch25.liveK.toFixed(1)}) after Rule 1 Level 50 Touch — Immediate Exit (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)})`;
          } else if (!isBuy && liveStoch25.liveK > 50.0) {
            stoch25Level50ExitReason = `Rule 2 Triggered: Stoch (25,1,1) reversed above Level 50 (${liveStoch25.liveK.toFixed(1)}) after Rule 1 Level 50 Touch — Immediate Exit (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)})`;
          }
        }
      }
    } else if (SYMBOL === "R_10") {
      // =========================================================================
      // 🎯 VIX 10 (R_10) FAST-PATH STOCH (25,1,1) RULE 2 TRACKING:
      // Track Stoch (25,1,1) touch of Level 80 (BUY) or Level 20 (SELL)
      // =========================================================================
      if (liveStoch25.liveK !== null && isPostEntryM5Bucket) {
        if (!openTrade.stoch25_touched_extreme) {
          if (isBuy && liveStoch25.liveK >= 79.5) {
            openTrade.stoch25_touched_extreme = true;
            openTrade.stoch25_touched_extreme_epoch = nowEpoch;
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 25] Rule 2 Armed: BUY #${openTrade.contractId} Stoch (25,1,1) touched Level 80 (%K: ${liveStoch25.liveK.toFixed(1)}) -> Awaiting Level 50 reversal close!`);
          } else if (!isBuy && liveStoch25.liveK <= 20.5) {
            openTrade.stoch25_touched_extreme = true;
            openTrade.stoch25_touched_extreme_epoch = nowEpoch;
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 25] Rule 2 Armed: SELL #${openTrade.contractId} Stoch (25,1,1) touched Level 20 (%K: ${liveStoch25.liveK.toFixed(1)}) -> Awaiting Level 50 reversal close!`);
          }
        }
      }
    } else {
      // =========================================================================
      // ☕ UNIVERSAL FLEET LIVE & CLOSED-CANDLE STOCH (15,1,1) TRADE MANAGEMENT:
      // STRICTLY SEQUENTIAL (RULE 2 DEPENDS ON RULE 1):
      // Step 1 (Rule 1): After trade is opened, Stoch (15,1,1) must first move in the trade's
      //    direction and touch Level 80 for BUY (>= 79.5) or Level 20 for SELL (<= 20.5).
      //    At that point, Software SL moves to +$0.30 (stoch15_touched_extreme = true).
      // Step 2 (Rule 2 — Dependent on Rule 1): ONLY AFTER Rule 1 has occurred
      //    (openTrade.stoch15_touched_extreme === true), if Stoch (15,1,1) reverses and
      //    comes back to touch or cross Level 50 (<= 50.0 BUY / >= 50.0 SELL), close immediately.
      // =========================================================================
      if (liveStoch15.liveK !== null && isPostEntryM5Bucket) {
        if (!openTrade.stoch15_touched_extreme) {
          if (isBuy && liveStoch15.liveK >= 79.5) {
            openTrade.stoch15_touched_extreme = true;
            openTrade.stoch15_touched_extreme_epoch = nowEpoch;
            if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 0.30) {
              openTrade.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 15] Rule 1 Armed: BUY #${openTrade.contractId} Stoch (15,1,1) touched Level 80 (%K: ${liveStoch15.liveK.toFixed(1)}) -> Software SL moved to +$0.30 & Rule 2 (Level 50 Exit) Unlocked!`);
          } else if (!isBuy && liveStoch15.liveK <= 20.5) {
            openTrade.stoch15_touched_extreme = true;
            openTrade.stoch15_touched_extreme_epoch = nowEpoch;
            if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 0.30) {
              openTrade.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log(`[FAST-PATH STOCH 15] Rule 1 Armed: SELL #${openTrade.contractId} Stoch (15,1,1) touched Level 20 (%K: ${liveStoch15.liveK.toFixed(1)}) -> Software SL moved to +$0.30 & Rule 2 (Level 50 Exit) Unlocked!`);
          }
        } else if (openTrade.stoch15_touched_extreme === true) {
          if (isBuy && liveStoch15.liveK <= 50.0) {
            stoch15Level50ExitReason = `Rule 2 Triggered: Stoch (15,1,1) reversed to touch/cross Level 50 (${liveStoch15.liveK.toFixed(1)}) after Rule 1 Level 80 Touch — Immediate Exit (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)})`;
          } else if (!isBuy && liveStoch15.liveK >= 50.0) {
            stoch15Level50ExitReason = `Rule 2 Triggered: Stoch (15,1,1) reversed to touch/cross Level 50 (${liveStoch15.liveK.toFixed(1)}) after Rule 1 Level 20 Touch — Immediate Exit (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)})`;
          }
        }
      }
    }

    // Daily Target Strike Ceiling (Instant Cash-Out when daily target is reached)
    let dailyTargetCeilingHit = false;
    let superRunnerCeilingHit = false;
    const remainingToDailyTarget = Math.max(0, DAILY_PROFIT_TARGET_USD - (state.dailyNetPnl || 0));
    if (SYMBOL === "R_100" || SYMBOL === "1HZ25V") {
      if (pnl >= 10.00) dailyTargetCeilingHit = true;
    } else if (SYMBOL === "R_25") {
      if (pnl >= 5.00) dailyTargetCeilingHit = true;
    } else if (SYMBOL === "R_50") {
      if (pnl >= 3.00) dailyTargetCeilingHit = true;
    } else if (SYMBOL === "R_10") {
      if (pnl >= 3.50) dailyTargetCeilingHit = true;
    } else {
      if (pnl >= DAILY_PROFIT_TARGET_USD || (remainingToDailyTarget > 0 && pnl >= remainingToDailyTarget)) {
        dailyTargetCeilingHit = true;
      }
    }

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction, openTrade.lots);
    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    const isDynamicRunner = (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || STRATEGY_PROFILE === "PROFILE_V100" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || SYMBOL === "1HZ100V" || STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") && SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_100" && SYMBOL !== "1HZ25V" && SYMBOL !== "R_25" && SYMBOL !== "R_50" && SYMBOL !== "R_10";
    const activeTpTarget = isDynamicRunner ? null : (openTrade.tpPrice || openTrade.fibTpPrice || null);
    let tpHit = false;
    if (activeTpTarget) {
      tpHit = isBuy ? currentPrice >= activeTpTarget : currentPrice <= activeTpTarget;
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

    let reason = null;
    if ((SYMBOL === "R_100" || SYMBOL === "1HZ25V") && (tpHit || pnl >= 10.00 || dailyTargetCeilingHit)) {
      reason = "Hard Broker Take Profit ($10.00) reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ") — Secured $10.00 Target!";
    }
    else if (SYMBOL === "R_25" && (tpHit || pnl >= 5.00 || dailyTargetCeilingHit)) {
      reason = "Hard Broker Take Profit ($5.00) reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ") — Secured $5.00 Target!";
    }
    else if (SYMBOL === "R_50" && (tpHit || pnl >= 3.00 || dailyTargetCeilingHit)) {
      reason = "Hard Broker Take Profit ($3.00) reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ") — Secured $3.00 Target!";
    }
    else if (SYMBOL === "R_10" && (tpHit || pnl >= 3.50 || dailyTargetCeilingHit)) {
      reason = "Software Take Profit ($3.50) reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ") — Secured $3.50 Target!";
    }
    else if ((SYMBOL === "1HZ75V" || SYMBOL === "R_75") && (tpHit || pnl >= 3.50 || dailyTargetCeilingHit)) {
      reason = "Standard Take Profit ($3.50) reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ") — Secured $3.50 Target!";
    }
    else if (dailyTargetCeilingHit) {
      reason = "Daily Target TP Hit (+ $" + pnl.toFixed(2) + ") — Secured 100% of Daily $" + DAILY_PROFIT_TARGET_USD.toFixed(2) + " Target!";
    }
    else if (superRunnerCeilingHit) {
      reason = "Super Runner TP Ceiling reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ")";
    }
    else if (tpHit) { 
      reason = "Take Profit Target reached at " + currentPrice.toFixed(4) + " (+ $" + pnl.toFixed(2) + ")"; 
    }
    else if (stoch25Level50ExitReason) {
      reason = stoch25Level50ExitReason;
    }
    else if (stoch15Level50ExitReason) {
      reason = stoch15Level50ExitReason;
    }
    else if ((SYMBOL === "R_25" || SYMBOL === "R_50") && openTrade.stoch25_touched_midline === true && openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) {
      reason = "Rule 1 Software SL (+$" + openTrade.lockedPnlFloor.toFixed(2) + " Floor) reached after Stoch (25,1,1) Level 50 Touch — Secured +$" + openTrade.lockedPnlFloor.toFixed(2);
    }
    else if (SYMBOL !== "R_75" && SYMBOL !== "1HZ75V" && openTrade.stoch15_touched_extreme === true && openTrade.lockedPnlFloor && (openTrade.maxUnrealizedPnL || 0) >= 0.65 && pnl <= openTrade.lockedPnlFloor) { 
      reason = "Rule 1 Software SL (+$" + openTrade.lockedPnlFloor.toFixed(2) + " Floor) reached after Stoch (15,1,1) Level 80/20 Touch — Secured +$" + openTrade.lockedPnlFloor.toFixed(2) + " (Peak: +$" + (openTrade.maxUnrealizedPnL || 0).toFixed(2) + ")"; 
    }
    else if (fakeoutExitTriggered) {
      reason = "Opposite M15 Fractal Fakeout Exit — Closed at " + currentPrice.toFixed(4) + " ($" + pnl.toFixed(2) + ") to avoid full -$2.50 SL";
    }
    else if (hardStopBreached) { reason = "Hard SL breached at " + currentPrice.toFixed(4); } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = "Catastrophic floor hit — PnL $" + pnl.toFixed(2); } 
    else if (SYMBOL !== "1HZ25V" && pnl <= SOFTWARE_SL_USD) { reason = "Software SL hit — PnL $" + pnl.toFixed(2); }
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
      openTrade.exitReason = reason;
      openTrade.reason = reason;
      state.openTrade = null;
      onTradeClosedCleanup(Math.floor(Date.now() / 1000));
      
      // Update cumulative daily net PnL
      state.dailyNetPnl = (state.dailyNetPnl || 0) + serverPnl;
      const effectiveDailyTarget = (SYMBOL === "1HZ75V" || SYMBOL === "R_75") ? 6.90 : DAILY_PROFIT_TARGET_USD;
      if (state.dailyNetPnl >= effectiveDailyTarget) {
        state.dailyTargetReached = true;
        state.dailyTargetDate = new Date().toISOString().split("T")[0];
        console.log(`[DAILY TARGET] +$${DAILY_PROFIT_TARGET_USD.toFixed(2)} Daily Goal Achieved ($${state.dailyNetPnl.toFixed(2)}). Switching to IDLE_DAILY_TARGET_REACHED.`);
        await sendTelegram(`🎯 *${REPO_LABEL} — DAILY TARGET ACHIEVED!* 🎯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      }

      state.openTrade = null;
      if (state.dailyTargetReached) {
        state.healthStatus = "FUNCTIONING";
        state.blockerReason = `Daily Net Target (+${DAILY_PROFIT_TARGET_USD.toFixed(2)}) Secured Today (${(state.dailyNetPnl || 0).toFixed(2)})`;
        state.nextTrigger = "Idling until 00:00 UTC daily rollover";
        state.nextPhase = state.nextTrigger;
      } else {
        state.blockerReason = null;
        state.nextTrigger = "Standing by for confirmed closed M5 candle to scan";
        state.nextPhase = state.nextTrigger;
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
      
      saveTrades(trades);
      saveState();
      closingContracts.delete(openTrade.contractId);
      
      const icon = finalResult === "WIN" ? "✅" : "❌";
      const pnlStr = serverPnl >= 0 ? `+${serverPnl.toFixed(2)}` : `-${Math.abs(serverPnl).toFixed(2)}`;
      const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
      const exitTitle = finalResult === "WIN" ? "EXIT - WIN" : "EXIT - LOSS";
      await sendTelegram(
        `${icon} *[${exitTitle}] ${SYMBOL_NAME} — ${REPO_LABEL}*\n\n` +
        `• Direction: *${openTrade.direction === "BUY" ? "🟢 BUY" : "🔴 SELL"}*\n` +
        `• Entry: *${Number(openTrade.entry).toFixed(4)}* ➔ Exit: *${currentPrice.toFixed(4)}*\n` +
        `• P&L: *${pnlStr}* (Net of comm.)\n` +
        `• Reason: *${reason}*\n` +
        `• Duration: ${formatDuration(durationMs)}\n` +
        `• Daily Net Total: *${state.dailyNetPnl.toFixed(2)}*\n` +
        `• Contract: \`${openTrade.contractId}\``,
        { contractId: openTrade.contractId }
      );

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

// Loss Recovery / Rescue Entry Engine purged per trader mandate


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

  // Strict Universal EMA 100 Directional Filter Verification (Excluded on Stoch 100 + Stoch 15,1,1 fleet per Trader Mandate)
  const e100 = opp.currentEma100 || (state.ema100Val || null);
  if (e100 !== null && SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_100" && SYMBOL !== "1HZ25V" && SYMBOL !== "R_25" && STRATEGY_PROFILE !== "PROFILE_V75_1S_STOCH100_STOCH15") {
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
  if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15" && SYMBOL !== "R_75") {
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
  if (SYMBOL === "1HZ25V") {
    sl = direction === "BUY"
      ? ((cM5 && cM5.length > 0) ? parseFloat(cM5[cM5.length - 1].low) : price)
      : ((cM5 && cM5.length > 0) ? parseFloat(cM5[cM5.length - 1].high) : price);
  } else if (SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_100" || SYMBOL === "R_25" || SYMBOL === "R_50" || SYMBOL === "R_10") {
    sl = slCapPrice;
  } else if (PROFILE.slType === "HARD_POINTS") {
    sl = hardStopPrice;
  } else if (PROFILE.slType === "M5_FRACTAL") {
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

  let tpPrice = (SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_100" || SYMBOL === "1HZ25V" || SYMBOL === "R_25" || SYMBOL === "R_10") ? parseFloat(minRequiredTp.toFixed(2)) : (opp.calculatedFibTp || minRequiredTp);
  if (SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_100" && SYMBOL !== "1HZ25V" && SYMBOL !== "R_25" && SYMBOL !== "R_10") {
    if (direction === "BUY" && tpPrice < minRequiredTp) tpPrice = minRequiredTp;
    if (direction === "SELL" && tpPrice > minRequiredTp) tpPrice = minRequiredTp;
  }

  const timeFormatted = new Date(nowEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);

  const pendingTradeRecord = {
    id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry: price, sl, rr: null, entryType: setupLabel, brokerSlAmount: STAKE_USD,
    lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
    entryEpoch: nowEpoch, purchaseTimeEpoch: nowEpoch, purchase_time: nowEpoch,
    entryCandleHigh: (cM5 && cM5.length > 0) ? parseFloat(cM5[cM5.length - 1].high) : price,
    entryCandleLow: (cM5 && cM5.length > 0) ? parseFloat(cM5[cM5.length - 1].low) : price,
    stoch25_touched_extreme: false,
    stoch25_touched_extreme_epoch: null,
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
    const contractId = await executeTrade(direction, { slPrice: sl, brokerSlPrice: pendingTradeRecord.brokerSlPrice, fibTpPrice: tpPrice, tpPrice });
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
          if (!t.exitReason) {
            if (t.result === "WIN") {
              if (rec.profit >= 9.0) t.exitReason = "$10.00 Hard Broker TP";
              else if (rec.profit >= 7.5 && SYMBOL === "R_25") t.exitReason = "$8.00 Hard Broker TP";
              else if (rec.profit >= 6.5) t.exitReason = "+$7.00 Daily Strike TP";
              else if (rec.profit >= 3.2) t.exitReason = "+$3.50 Standard Take Profit";
              else if (rec.profit <= 0.45 && t.lockedPnlFloor && t.lockedPnlFloor >= 0.30) t.exitReason = "+$0.30 Software SL Lock (Stoch 15 Lvl 80/20 Touch)";
              else t.exitReason = "Stoch (15,1,1) Level 50 Profit Exit";
            } else {
              if (rec.profit <= -4.8) t.exitReason = "-$5.00 Hard Broker SL";
              else if (rec.profit <= -3.5) t.exitReason = "-$4.00 Software Stop Loss";
              else t.exitReason = "-$2.00 Software Stop Loss";
            }
            t.reason = t.exitReason;
          }
          state.openTrade = null;
          onTradeClosedCleanup(rec.sellTime || Math.floor(Date.now() / 1000));
          const diff = hadResult ? (rec.profit - oldPnl) : rec.profit;
          state.dailyNetPnl = Number(((state.dailyNetPnl || 0) + diff).toFixed(2));
          saveState();
          saveTrades(trades);
          if (state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
            state.dailyTargetReached = true;
            state.dailyTargetDate = todayStr;
          }
          if (!hadResult && !isExitAlreadyReported(t.contractId)) {
            const pnlLabel = rec.profit >= 0 ? `+${rec.profit.toFixed(2)}` : `-${Math.abs(rec.profit).toFixed(2)}`;
            await sendTelegram(
              `${t.result === "WIN" ? "✅" : "❌"} *[EXIT - BROKER CONFIRMED] ${SYMBOL_NAME} — ${REPO_LABEL}*\n\n` +
              `• Direction: *${t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL"}*\n` +
              `• Final P&L: *${pnlLabel}* (Net of comm.)\n` +
              `• Daily Net Total: *${state.dailyNetPnl.toFixed(2)}*\n` +
              `• Contract: \`${t.contractId}\``,
              { contractId: t.contractId }
            );
          }
        } else {
          // Fallback: Contract is confirmed closed on broker (absent from entire broker portfolio). Reconcile to unblock execution gate.
          t.result = "CLOSED_EXTERNAL";
          t.serverPnl = 0;
          t.resultSource = "server_portfolio_reconciled";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.openTrade = null;
          onTradeClosedCleanup(Math.floor(Date.now() / 1000));
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
  latestM5Candles = candles.map(c => ({ ...c }));
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

  // Technical Baselines: True EMA 100, EMA 200 & Bollinger Bands 20
  const ema100Series = calculateEMA(candles, 100);
  const ema200Series = calculateEMA(candles, 200);
  const currentTrueEma100 = ema100Series[si];
  const currentTrueEma200 = ema200Series[si];

  const bb20 = calculateBollingerBands(candles, 20, 2);
  const bb20Mid = bb20.middle;
  const currentBb20Mid = bb20Mid[si];
  const prevBb20Mid = bb20Mid[si - 1];

  // Instrument-Specific Baseline Assignment:
  // V25 1s (1HZ25V) explicitly uses Bollinger Bands 20 Middle Band (SMA 20)
  // All other fleet bots (R_100 Milk, R_75 Lery, 1HZ75V Coffee, R_25 Tea, R_50 Omni, R_10 Test) strictly use true M5 EMA 100
  const isBb20Instrument = SYMBOL === "1HZ25V" || STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15";
  const ema100 = isBb20Instrument ? bb20Mid : ema100Series;
  const currentEma100 = isBb20Instrument ? currentBb20Mid : currentTrueEma100;
  const ema200 = ema200Series;
  const currentEma200 = currentTrueEma200;

  // Indicators for V100 1s & V75 1s Architecture
  const adxResult = calculateADX(candles, 14);
  const adxVal = adxResult.adx[si], prevAdxVal = adxResult.adx[si - 1];
  const plusDIVal = adxResult.plusDI[si], minusDIVal = adxResult.minusDI[si];
  const stoch200 = calculateStoch(candles, 200, 1, 1);
  const macd2575 = calculateMACD(candles, 25, 75, 1);
  const stoch1558 = calculateStoch(candles, 15, 5, 8);
  const stoch100 = calculateStoch(candles, 100, 1, 1);
  // Stoch (15,1,1 Simple) for 1HZ75V Coffee Machine + Intrabar High/Low Wick Touch Extremes
  const stoch1511 = calculateStoch(candles, 15, 1, 1, "Simple");
  const sK1511 = stoch1511.k[si], sD1511 = stoch1511.d[si], prevK1511 = stoch1511.k[si - 1], prevD1511 = stoch1511.d[si - 1];
  function getStoch15WickExtremes(idx) {
    if (!candles || idx < 14 || idx >= candles.length) return { maxK: null, minK: null };
    const sl15 = candles.slice(idx - 14, idx + 1);
    const sl14 = candles.slice(idx - 14, idx);
    const hh15 = Math.max(...sl15.map(c => parseFloat(c.high)));
    const ll15 = Math.min(...sl15.map(c => parseFloat(c.low)));
    const hh14 = Math.max(...sl14.map(c => parseFloat(c.high)));
    const ll14 = Math.min(...sl14.map(c => parseFloat(c.low)));
    const cH = parseFloat(candles[idx].high);
    const cL = parseFloat(candles[idx].low);
    const cC = parseFloat(candles[idx].close);
    const closeK = hh15 === ll15 ? 100 : ((cC - ll15) / (hh15 - ll15)) * 100;
    const highK15 = hh15 === ll15 ? 100 : ((cH - ll15) / (hh15 - ll15)) * 100;
    const hhPrior = Math.max(hh14, cH);
    const highK14 = hhPrior === ll14 ? 100 : ((cH - ll14) / (hhPrior - ll14)) * 100;
    const lowK15 = hh15 === ll15 ? 0 : ((cL - ll15) / (hh15 - ll15)) * 100;
    const llPrior = Math.min(ll14, cL);
    const lowK14 = hh14 === llPrior ? 0 : ((cL - llPrior) / (hh14 - llPrior)) * 100;
    return {
      maxK: Math.max(closeK, highK15, highK14),
      minK: Math.min(closeK, lowK15, lowK14)
    };
  }
  const currWick15 = getStoch15WickExtremes(si);
  const prevWick15 = getStoch15WickExtremes(si - 1);
  const sMaxK1511 = currWick15.maxK, sMinK1511 = currWick15.minK;
  const prevMaxK1511 = prevWick15.maxK, prevMinK1511 = prevWick15.minK;
  state.stoch1511Val = sK1511;
  state.stoch1511MaxVal = sMaxK1511;
  state.stoch1511MinVal = sMinK1511;

  // Stoch (25,1,1 Simple) for R_25 Tea Machine + Intrabar High/Low Wick Touch Extremes
  const stoch2511 = calculateStoch(candles, 25, 1, 1, "Simple");
  const sK2511 = stoch2511.k[si], sD2511 = stoch2511.d[si], prevK2511 = stoch2511.k[si - 1], prevD2511 = stoch2511.d[si - 1];
  function getStoch25WickExtremes(idx) {
    if (!candles || idx < 24 || idx >= candles.length) return { maxK: null, minK: null };
    const sl25 = candles.slice(idx - 24, idx + 1);
    const hh25 = Math.max(...sl25.map(c => parseFloat(c.high)));
    const ll25 = Math.min(...sl25.map(c => parseFloat(c.low)));
    const cH = parseFloat(candles[idx].high);
    const cL = parseFloat(candles[idx].low);
    const cC = parseFloat(candles[idx].close);
    const closeK = hh25 === ll25 ? 50 : ((cC - ll25) / (hh25 - ll25)) * 100;
    const highK25 = hh25 === ll25 ? 100 : ((cH - ll25) / (hh25 - ll25)) * 100;
    const lowK25 = hh25 === ll25 ? 0 : ((cL - ll25) / (hh25 - ll25)) * 100;
    return {
      maxK: Math.max(closeK, highK25),
      minK: Math.min(closeK, lowK25)
    };
  }
  const currWick25 = getStoch25WickExtremes(si);
  const prevWick25 = getStoch25WickExtremes(si - 1);
  const sMaxK2511 = currWick25.maxK, sMinK2511 = currWick25.minK;
  const prevMaxK2511 = prevWick25.maxK, prevMinK2511 = prevWick25.minK;
  if (SYMBOL === "R_25" || SYMBOL === "R_10") {
    state.stoch2511Val = sK2511;
    state.stoch2511MaxVal = sMaxK2511;
    state.stoch2511MinVal = sMinK2511;
    state.stoch1511Val = sK2511;
  }

  // Stoch (50, 1, 1 Simple) for R_10 Test Bot Macro Trend Gate
  const stoch50 = calculateStoch(candles, 50, 1, 1, "Simple");
  const sK50 = stoch50.k[si], sD50 = stoch50.d[si], prevK50 = stoch50.k[si - 1], prevD50 = stoch50.d[si - 1];
  if (SYMBOL === "R_10") {
    state.stoch50Val = sK50;
  }

  // MACD (5, 35, 1) for R_50 OmniSight Macro Trend & 1HZ25V Ice Cream Re-Entry Filter
  const macd5351 = calculateMACD(candles, 5, 35, 1);
  const sMacd5351 = macd5351.macd[si], prevMacd5351 = macd5351.macd[si - 1];
  if (SYMBOL === "R_50" || SYMBOL === "1HZ25V") {
    state.macd5351Val = sMacd5351;
    state.macdVal = sMacd5351;
  }
  const sK100 = stoch100.k[si], prevK100 = stoch100.k[si - 1];
  const stoch3025 = calculateStoch(candles, 30, 2, 5, "Simple");
  const sK3025 = stoch3025.k[si], sD3025 = stoch3025.d[si], prevK3025 = stoch3025.k[si - 1], prevD3025 = stoch3025.d[si - 1];

  // Stoch (30,25,15 Simple) for V25 Tea Re-Entry Engine
  const stoch302515 = calculateStoch(candles, 30, 25, 15, "Simple");
  const sK302515 = stoch302515.k[si], sD302515 = stoch302515.d[si], prevK302515 = stoch302515.k[si - 1], prevD302515 = stoch302515.d[si - 1];

  // Stoch (30,20,15 Simple) for V100 Milk Opposite %K/%D Profit Exit Engine
  const stoch302015 = calculateStoch(candles, 30, 20, 15, "Simple");
  const sK302015 = stoch302015.k[si], sD302015 = stoch302015.d[si], prevK302015 = stoch302015.k[si - 1], prevD302015 = stoch302015.d[si - 1];

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

  if (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH25") {
    if (sK100 === null || prevK100 === null || sK2511 === null || prevK2511 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V50_MACD_STOCH25") {
    if (sMacd5351 === null || prevMacd5351 === null || sK2511 === null || prevK2511 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (SYMBOL === "R_10" || STRATEGY_PROFILE === "PROFILE_V10_STOCH50_STOCH25") {
    if (sK50 === null || prevK50 === null || sK2511 === null || prevK2511 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" && SYMBOL !== "R_25") {
    console.log(`[${REPO_LABEL}] V25 Null Check: sK100=${sK100}, prevK100=${prevK100}, sK3025=${sK3025}, prevK3025=${prevK3025}, sK302515=${sK302515}, prevK302515=${prevK302515}, sD302515=${sD302515}, prevD302515=${prevD302515}, currentEma100=${currentEma100}`);
    if (sK100 === null || prevK100 === null || sK3025 === null || prevK3025 === null || sK302515 === null || prevK302515 === null || sD302515 === null || prevD302515 === null || currentEma100 === null) {
      console.log(`[${REPO_LABEL}] ⚠️ V25 Null check TRIPPED! Returning early.`);
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH15" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_100" || SYMBOL === "1HZ25V") {
    if (sK100 === null || prevK100 === null || sK1511 === null || prevK1511 === null) {
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
  } else if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" && SYMBOL !== "1HZ25V") {
    if (sK200 === null || prevK200 === null || sK1525 === null || prevK1525 === null || currentEma100 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" && SYMBOL !== "R_50" && SYMBOL !== "R_100") {
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
  } else if ((STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") && SYMBOL !== "R_50") {
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
  let openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    // =========================================================================
    // 🏆 UNIVERSAL FLEET-WIDE TRADE MANAGEMENT RULE (ALL BOTS):
    // STRICTLY SEQUENTIAL (RULE 2 DEPENDS ON RULE 1):
    // 1. Step 1 (Rule 1): After the trade is opened, when Stoch (15,1,1) touches Level 80 for BUY trades
    //    or Level 20 for SELL trades (including intrabar High/Low wick touch), move Software SL to +$0.30
    //    and set t.stoch15_touched_extreme = true.
    // 2. Step 2 (Rule 2 — Dependent on Rule 1): ONLY AFTER Rule 1 has occurred
    //    (t.stoch15_touched_extreme === true), when Stoch (15,1,1) reverses to touch or cross
    //    Level 50 (<= 50.0 for BUY / >= 50.0 for SELL), close the trade immediately.
    // =========================================================================
    const isBuy = t.direction === "BUY";
    const currentPnl = calcUnrealizedPnL(t, currentPrice);
    const isRunner = Boolean(t.runnerActive || t.isRunner || t.trendRidingActive || t.stoch15_touched_extreme || t.stoch25_touched_midline);

    if (SYMBOL === "R_25" || SYMBOL === "R_50") {
      // =========================================================================
      // 🍵 TEA MACHINE (R_25) & 🧭 OMNISIGHT (R_50) SEQUENTIAL STOCH (25,1,1) TRADE MANAGEMENT:
      // STRICTLY SEQUENTIAL (RULE 2 DEPENDS ON RULE 1):
      // Step 1 (Rule 1): After trade is opened, when in profit and Stoch (25,1,1)
      //    touches Level 50 (>= 50.0 for BUY, <= 50.0 for SELL), move Software SL
      //    to +$0.30 and set t.stoch25_touched_midline = true.
      // Step 2 (Rule 2 — Dependent on Rule 1): ONLY AFTER Rule 1 has occurred
      //    (t.stoch25_touched_midline === true), if Stoch (25,1,1) reverses and
      //    crosses back below 50.0 for BUY or above 50.0 for SELL, close immediately.
      // =========================================================================
      if (!t.entryEpoch || candles[si].epoch > t.entryEpoch) {
        let stoch25Exit = false;
        let exitDetail = "";
        const cOpen = parseFloat(candles[si].open);
        const cClose = parseFloat(candles[si].close);

        if (!t.stoch25_touched_midline) {
          const buyTouched50 = (sK2511 !== null && sK2511 >= 50.0) || (sMaxK2511 !== null && sMaxK2511 >= 50.0);
          const sellTouched50 = (sK2511 !== null && sK2511 <= 50.0) || (sMinK2511 !== null && sMinK2511 <= 50.0);
          if (isBuy && buyTouched50 && currentPnl > 0) {
            t.stoch25_touched_midline = true;
            t.stoch25_touched_midline_epoch = candles[si].epoch;
            if (!t.lockedPnlFloor || t.lockedPnlFloor < 0.30) {
              t.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log("[TRADE MANAGEMENT R_25] Rule 1 Armed: BUY #" + t.contractId + " Stoch (25,1,1) reached Level 50 (%K: " + (sK2511 !== null ? sK2511.toFixed(1) : "N/A") + ") in profit (+$" + currentPnl.toFixed(2) + ") -> Software SL moved to +$0.30 & Rule 2 Unlocked!");
            if (sMaxK2511 !== null && sMaxK2511 >= 50.0 && sK2511 !== null && sK2511 < 50.0 && cClose < cOpen) {
              stoch25Exit = true;
              exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed to close below Level 50 (" + sK2511.toFixed(1) + ") after touching Level 50 (" + sMaxK2511.toFixed(1) + ")";
            }
          } else if (!isBuy && sellTouched50 && currentPnl > 0) {
            t.stoch25_touched_midline = true;
            t.stoch25_touched_midline_epoch = candles[si].epoch;
            if (!t.lockedPnlFloor || t.lockedPnlFloor < 0.30) {
              t.lockedPnlFloor = 0.30;
            }
            saveTrades(trades);
            console.log("[TRADE MANAGEMENT R_25] Rule 1 Armed: SELL #" + t.contractId + " Stoch (25,1,1) reached Level 50 (%K: " + (sK2511 !== null ? sK2511.toFixed(1) : "N/A") + ") in profit (+$" + currentPnl.toFixed(2) + ") -> Software SL moved to +$0.30 & Rule 2 Unlocked!");
            if (sMinK2511 !== null && sMinK2511 <= 50.0 && sK2511 !== null && sK2511 > 50.0 && cClose > cOpen) {
              stoch25Exit = true;
              exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed to close above Level 50 (" + sK2511.toFixed(1) + ") after touching Level 50 (" + sMinK2511.toFixed(1) + ")";
            }
          }
        } else if (t.stoch25_touched_midline === true) {
          if (isBuy && sK2511 !== null && sK2511 < 50.0) {
            stoch25Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed below Level 50 (" + sK2511.toFixed(1) + ") after Rule 1 Level 50 Touch";
          } else if (!isBuy && sK2511 !== null && sK2511 > 50.0) {
            stoch25Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed above Level 50 (" + sK2511.toFixed(1) + ") after Rule 1 Level 50 Touch";
          }
        }

        if (stoch25Exit) {
          closingContracts.add(t.contractId);
          console.log("[PROFIT EXIT R_25] Active " + t.direction + " #" + t.contractId + ": " + exitDetail + ". Current PnL: +$" + currentPnl.toFixed(2) + ". Closing immediately.");
          t.exitReason = "Stoch (25,1,1) Level 50 Reversal Exit";
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error("[PROFIT EXIT ERROR] Broker close failed for " + t.contractId + ": " + (closeRes.error.message || JSON.stringify(closeRes.error)));
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
            state.openTrade = null;
            onTradeClosedCleanup(candles[si].epoch);
            saveTrades(trades);
            saveState();

            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
            await sendTelegram(
              icon + " *[PROFIT EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
              "• Direction: *" + (t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL") + "*\n" +
              "• Exit Trigger: *" + exitDetail + "*\n" +
              "• Stoch (25,1,1): *%K " + (sK2511 ? sK2511.toFixed(1) : "N/A") + "*\n" +
              "• Net P&L: *" + pnlStr + "*\n" +
              "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
              "• Contract: `" + t.contractId + "`"
            );
          } catch (e) {
            console.error("[PROFIT EXIT] Exception closing " + t.contractId + ":", e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    } else if (SYMBOL === "R_10") {
      // =========================================================================
      // 🎯 VIX 10 (R_10 TEST BOT) CLOSED M5 TRADE MANAGEMENT RULES:
      // Rule 1: Software SL if M5 candle closes against entry candle High/Low
      //   - BUY: closed M5 candle close < entryCandleLow
      //   - SELL: closed M5 candle close > entryCandleHigh
      // Rule 2: Sequential Stoch (25,1,1) Profit Protection:
      //   - BUY: Stoch (25,1,1) touched Level 80 (>= 79.5), then closes below Level 50 (< 50.0)
      //   - SELL: Stoch (25,1,1) touched Level 20 (<= 20.5), then closes above Level 50 (> 50.0)
      // =========================================================================
      if (!t.entryEpoch || candles[si].epoch > t.entryEpoch) {
        let v10Exit = false;
        let exitDetail = "";
        const cClose = parseFloat(candles[si].close);

        // Check Rule 2 Extreme Touch first
        const buyTouched80 = (sK2511 !== null && sK2511 >= 79.5) || (sMaxK2511 !== null && sMaxK2511 >= 79.5);
        const sellTouched20 = (sK2511 !== null && sK2511 <= 20.5) || (sMinK2511 !== null && sMinK2511 <= 20.5);

        if (!t.stoch25_touched_extreme) {
          if (isBuy && buyTouched80) {
            t.stoch25_touched_extreme = true;
            t.stoch25_touched_extreme_epoch = candles[si].epoch;
            saveTrades(trades);
            console.log("[TRADE MANAGEMENT R_10] Rule 2 Armed: BUY #" + t.contractId + " Stoch (25,1,1) touched Level 80 (%K: " + (sK2511 !== null ? sK2511.toFixed(1) : "N/A") + ") -> Awaiting Level 50 reversal close!");
          } else if (!isBuy && sellTouched20) {
            t.stoch25_touched_extreme = true;
            t.stoch25_touched_extreme_epoch = candles[si].epoch;
            saveTrades(trades);
            console.log("[TRADE MANAGEMENT R_10] Rule 2 Armed: SELL #" + t.contractId + " Stoch (25,1,1) touched Level 20 (%K: " + (sK2511 !== null ? sK2511.toFixed(1) : "N/A") + ") -> Awaiting Level 50 reversal close!");
          }
        }

        // Rule 1: Entry Candle High/Low Invalidation Close
        if (isBuy && t.entryCandleLow !== undefined && t.entryCandleLow !== null && cClose < t.entryCandleLow) {
          v10Exit = true;
          exitDetail = "Rule 1 SL Triggered: M5 candle closed (" + cClose.toFixed(2) + ") below Entry Candle Low (" + parseFloat(t.entryCandleLow).toFixed(2) + ")";
        } else if (!isBuy && t.entryCandleHigh !== undefined && t.entryCandleHigh !== null && cClose > t.entryCandleHigh) {
          v10Exit = true;
          exitDetail = "Rule 1 SL Triggered: M5 candle closed (" + cClose.toFixed(2) + ") above Entry Candle High (" + parseFloat(t.entryCandleHigh).toFixed(2) + ")";
        }

        // Rule 2: Reversal across Level 50 after touching extreme (80 for BUY, 20 for SELL)
        if (!v10Exit && t.stoch25_touched_extreme) {
          if (isBuy && sK2511 !== null && sK2511 < 50.0) {
            v10Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed to close below Level 50 (" + sK2511.toFixed(1) + ") after touching Level 80";
          } else if (!isBuy && sK2511 !== null && sK2511 > 50.0) {
            v10Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (25,1,1) reversed to close above Level 50 (" + sK2511.toFixed(1) + ") after touching Level 20";
          }
        }

        if (v10Exit) {
          closingContracts.add(t.contractId);
          console.log("[MANAGEMENT EXIT R_10] Active " + t.direction + " #" + t.contractId + ": " + exitDetail + ". Current PnL: " + (currentPnl >= 0 ? "+$" : "-$") + Math.abs(currentPnl).toFixed(2) + ". Closing immediately.");
          t.exitReason = exitDetail;
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error("[EXIT ERROR R_10] Broker close failed for " + t.contractId + ": " + (closeRes.error.message || JSON.stringify(closeRes.error)));
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
            state.openTrade = null;
            onTradeClosedCleanup(candles[si].epoch);
            saveTrades(trades);
            saveState();

            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
            await sendTelegram(
              icon + " *[EXIT TRIGGERED] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
              "• Direction: *" + (t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL") + "*\n" +
              "• Exit Reason: *" + exitDetail + "*\n" +
              "• Stoch (25,1,1): *%K " + (sK2511 ? sK2511.toFixed(1) : "N/A") + "*\n" +
              "• Net P&L: *" + pnlStr + "*\n" +
              "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
              "• Contract: `" + t.contractId + "`"
            );
          } catch (e) {
            console.error("[EXIT R_10] Exception closing " + t.contractId + ":", e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }
    } else if (!t.entryEpoch || candles[si].epoch > t.entryEpoch) {
      let stoch15Exit = false;
      let exitDetail = "";
      const cOpen = parseFloat(candles[si].open);
      const cClose = parseFloat(candles[si].close);

      // =========================================================================
      // 🎯 VIX 25 (1s) (1HZ25V) ENTRY CANDLE HIGH/LOW CLOSE INVALIDATION SL:
      // - BUY: if closed M5 candle closes below entry candle Low, exit trade.
      // - SELL: if closed M5 candle closes above entry candle High, exit trade.
      // =========================================================================
      if (SYMBOL === "1HZ25V") {
        let v251sExit = false;
        let v251sExitDetail = "";
        if (isBuy && t.entryCandleLow !== undefined && t.entryCandleLow !== null && cClose < t.entryCandleLow) {
          v251sExit = true;
          v251sExitDetail = "Entry Candle SL Triggered: M5 candle closed (" + cClose.toFixed(2) + ") below Entry Candle Low (" + parseFloat(t.entryCandleLow).toFixed(2) + ")";
        } else if (!isBuy && t.entryCandleHigh !== undefined && t.entryCandleHigh !== null && cClose > t.entryCandleHigh) {
          v251sExit = true;
          v251sExitDetail = "Entry Candle SL Triggered: M5 candle closed (" + cClose.toFixed(2) + ") above Entry Candle High (" + parseFloat(t.entryCandleHigh).toFixed(2) + ")";
        }

        if (v251sExit) {
          closingContracts.add(t.contractId);
          console.log("[ENTRY CANDLE SL 1HZ25V] Active " + t.direction + " #" + t.contractId + ": " + v251sExitDetail + ". Current PnL: " + (currentPnl >= 0 ? "+$" : "-$") + Math.abs(currentPnl).toFixed(2) + ". Closing immediately.");
          t.exitReason = v251sExitDetail;
          try {
            const closeRes = await closeContract(t.contractId);
            if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
              console.error("[SL EXIT ERROR 1HZ25V] Broker close failed for " + t.contractId + ": " + (closeRes.error.message || JSON.stringify(closeRes.error)));
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
            state.openTrade = null;
            onTradeClosedCleanup(candles[si].epoch);
            saveTrades(trades);
            saveState();

            const icon = t.result === "WIN" ? "✅" : "❌";
            const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
            await sendTelegram(
              icon + " *[STOP LOSS EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
              "• Direction: *" + (t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL") + "*\n" +
              "• Exit Reason: *" + v251sExitDetail + "*\n" +
              "• Net P&L: *" + pnlStr + "*\n" +
              "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
              "• Contract: `" + t.contractId + "`"
            );
          } catch (e) {
            console.error("[SL EXIT 1HZ25V] Exception closing " + t.contractId + ":", e.message);
            closingContracts.delete(t.contractId);
            continue;
          }
          closingContracts.delete(t.contractId);
          continue;
        }
      }

      if (!t.stoch15_touched_extreme) {
        // Step 1 (Rule 1): Move Software SL to +$0.30 when Stoch (15,1,1) touches Level 80 (BUY) / Level 20 (SELL)
        const buyTouched80 = (sK1511 !== null && sK1511 >= 79.5) || (sMaxK1511 !== null && sMaxK1511 >= 79.5);
        const sellTouched20 = (sK1511 !== null && sK1511 <= 20.5) || (sMinK1511 !== null && sMinK1511 <= 20.5);
        if (isBuy && buyTouched80) {
          t.stoch15_touched_extreme = true;
          t.stoch15_touched_extreme_epoch = candles[si].epoch;
          if (!t.lockedPnlFloor || t.lockedPnlFloor < 0.30) {
            t.lockedPnlFloor = 0.30;
          }
          saveTrades(trades);
          console.log("[TRADE MANAGEMENT] Rule 1 Armed: BUY #" + t.contractId + " Stoch (15,1,1) touched Level 80 (%K: " + (sK1511 !== null ? sK1511.toFixed(1) : "N/A") + ", High %K: " + (sMaxK1511 !== null ? sMaxK1511.toFixed(1) : "N/A") + ") -> Software SL moved to +$0.30 & Rule 2 Unlocked!");
          // Only if this same candle spiked to 80 on its high wick and then reversed to close <= 50.0 on a bearish candle
          if (sMaxK1511 !== null && sMaxK1511 >= 79.5 && sK1511 !== null && sK1511 <= 50.0 && cClose < cOpen) {
            stoch15Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (15,1,1) reversed to close at/below Level 50 (" + sK1511.toFixed(1) + ") after touching Level 80 (" + sMaxK1511.toFixed(1) + ")";
          }
        } else if (!isBuy && sellTouched20) {
          t.stoch15_touched_extreme = true;
          t.stoch15_touched_extreme_epoch = candles[si].epoch;
          if (!t.lockedPnlFloor || t.lockedPnlFloor < 0.30) {
            t.lockedPnlFloor = 0.30;
          }
          saveTrades(trades);
          console.log("[TRADE MANAGEMENT] Rule 1 Armed: SELL #" + t.contractId + " Stoch (15,1,1) touched Level 20 (%K: " + (sK1511 !== null ? sK1511.toFixed(1) : "N/A") + ", Low %K: " + (sMinK1511 !== null ? sMinK1511.toFixed(1) : "N/A") + ") -> Software SL moved to +$0.30 & Rule 2 Unlocked!");
          // Only if this same candle dipped to 20 on its low wick and then reversed to close >= 50.0 on a bullish candle
          if (sMinK1511 !== null && sMinK1511 <= 20.5 && sK1511 !== null && sK1511 >= 50.0 && cClose > cOpen) {
            stoch15Exit = true;
            exitDetail = "Rule 2 Triggered: Stoch (15,1,1) reversed to close at/above Level 50 (" + sK1511.toFixed(1) + ") after touching Level 20 (" + sMinK1511.toFixed(1) + ")";
          }
        }
      } else if (t.stoch15_touched_extreme === true) {
        // Step 2 (Rule 2 — Strictly Dependent on Rule 1): Immediate Exit when Stoch (15,1,1) reverses to touch or cross Level 50
        if (isBuy && ((sK1511 !== null && sK1511 <= 50.0) || (sMinK1511 !== null && sMinK1511 <= 50.0))) {
          stoch15Exit = true;
          const trigVal = (sK1511 !== null && sK1511 <= 50.0) ? sK1511.toFixed(1) : sMinK1511.toFixed(1);
          exitDetail = "Rule 2 Triggered: Stoch (15,1,1) reversed to touch/cross Level 50 (" + trigVal + ") after Rule 1 Level 80 Touch";
        } else if (!isBuy && ((sK1511 !== null && sK1511 >= 50.0) || (sMaxK1511 !== null && sMaxK1511 >= 50.0))) {
          stoch15Exit = true;
          const trigVal = (sK1511 !== null && sK1511 >= 50.0) ? sK1511.toFixed(1) : sMaxK1511.toFixed(1);
          exitDetail = "Rule 2 Triggered: Stoch (15,1,1) reversed to touch/cross Level 50 (" + trigVal + ") after Rule 1 Level 20 Touch";
        }
      }

      if (stoch15Exit) {
        closingContracts.add(t.contractId);
        console.log("[PROFIT EXIT] Active " + t.direction + " #" + t.contractId + ": " + exitDetail + ". Current PnL: +$" + currentPnl.toFixed(2) + ". Closing immediately.");
        t.exitReason = "Stoch (15,1,1) Level 50 Profit Exit";
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error("[PROFIT EXIT ERROR] Broker close failed for " + t.contractId + ": " + (closeRes.error.message || JSON.stringify(closeRes.error)));
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          saveTrades(trades);
          saveState();

          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
          await sendTelegram(
            icon + " *[PROFIT EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
            "• Direction: *" + (t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL") + "*\n" +
            "• Exit Trigger: *" + exitDetail + "*\n" +
            "• Stoch (15,1,1): *%K " + (sK1511 ? sK1511.toFixed(1) : "N/A") + "*\n" +
            "• Net P&L: *" + pnlStr + "*\n" +
            "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
            "• Contract: `" + t.contractId + "`"
          );
        } catch (e) {
          console.error("[PROFIT EXIT] Exception closing " + t.contractId + ":", e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Fractal SL Market Structure Break (Evaluated strictly on M15 Candle Close, excluded on V75, V75-1s, V100, V25 & V25-1s)
    const isM15CloseBoundary = m5BoundaryEpoch % 900 === 0;
    if (t.sl && isM15CloseBoundary && SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_100" && SYMBOL !== "R_25" && SYMBOL !== "1HZ25V") {
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          state.v75_initialBuyDone = false;
          state.v75_initialSellDone = false;
          state.v75_initialBuyArmed = !isBuy;
          state.v75_initialSellArmed = isBuy;
          state.v75_reversalArmed = isBuy ? "SELL" : "BUY";
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

    // Active Trade Exits for PROFILE_V100_STOCH200_STOCH15 (Standardized: V50 OmniSight Legacy)
    if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" && SYMBOL !== "R_50" && SYMBOL !== "R_100") {
      const isBuy = t.direction === "BUY";
      const m5Close = parseFloat(candles[si].close);
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = currentPnl < 0;

      // Early Exit 2: 2 Opposing M5 Fractals Structural Reversal Exit (Double Top/Lower High on BUY, Double Bottom/Higher Low on SELL)
      const frac2Eval = evaluate2OpposingFractalsReversal(t, candles, si);
      const opposing2FractalReversal = inLoss && frac2Eval.triggered;

      // Early Exit 2b: Opposite M5 Fractal Cross (Strictly when in loss)
      const fracAnchor = t.m5Fractal || (isBuy ? findRecentFractalBelow(candles, si, t.entry) : findRecentFractalAbove(candles, si, t.entry));
      const m5FractalCrossed = isPostEntryCandle && (isBuy
        ? (fracAnchor !== null && m5Close < fracAnchor)
        : (fracAnchor !== null && m5Close > fracAnchor));

      const stoch200Opposite = isBuy ? (sK200 !== null && sK200 < 50.0) : (sK200 !== null && sK200 > 50.0);
      const stoch15Opposite = isBuy ? (sK1525 !== null && sK1525 < 60.0) : (sK1525 !== null && sK1525 > 40.0);
      const stochReversalInvalidation = isPostEntryCandle && stoch200Opposite && stoch15Opposite;

      let earlyExitTriggered = false;
      let earlyExitType = "";
      let earlyExitDesc = "";

      if (stochReversalInvalidation) {
        earlyExitTriggered = true;
        earlyExitType = "Stop & Reversal Invalidation Exit";
        earlyExitDesc = "Stoch 200 crossed " + (isBuy ? "< 50.0" : "> 50.0") + " (" + (sK200 ? sK200.toFixed(2) : "N/A") + ") & Stoch (15,2,5) %K reached " + (isBuy ? "< 60.0" : "> 40.0") + " (" + (sK1525 ? sK1525.toFixed(2) : "N/A") + ")";
      } else if (inLoss && opposing2FractalReversal) {
        earlyExitTriggered = true;
        earlyExitType = "Opposing M5 2-Fractal (" + frac2Eval.pattern + ") Invalidation";
        earlyExitDesc = "Opposing M5 2-Fractal " + frac2Eval.pattern + " formed (F1: " + (frac2Eval.f1Price ? frac2Eval.f1Price.toFixed(4) : "N/A") + " -> F2: " + (frac2Eval.f2Price ? frac2Eval.f2Price.toFixed(4) : "N/A") + ") while in loss (" + currentPnl.toFixed(2) + ")";
      } else if (inLoss && m5FractalCrossed) {
        earlyExitTriggered = true;
        earlyExitType = "Opposite M5 Fractal Cross Exit";
        earlyExitDesc = "M5 candle closed at " + m5Close.toFixed(4) + " crossing opposite M5 fractal (" + (fracAnchor !== null ? fracAnchor.toFixed(4) : "N/A") + ") while in loss (" + currentPnl.toFixed(2) + ")";
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          const botPrefix = SYMBOL === "R_50" ? "V50" : "V100";
          const pfx = botPrefix.toLowerCase();
          state[pfx + "_initialEntryDone"] = false;
          state[pfx + "_trendDir"] = isBuy ? "SELL" : "BUY";
          state[pfx + "_stoch200CrossEpoch"] = m5BoundaryEpoch;
          state[pfx + "_stoch200Armed"] = true;
          state[pfx + "_reversalArmed"] = isBuy ? "SELL" : "BUY";
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(
            `${icon} *${REPO_LABEL} — ${earlyExitType}*\n\n` +
            `Active *${t.direction}* closed at *${m5Close.toFixed(4)}*.\n` +
            `• ${earlyExitDesc}\n` +
            `💵 Final P&L: *${pnlStr}*\n` +
            `Contract: \`${t.contractId}\`\n` +
            `Bot is flat and armed for immediate reversal trade if opposite conditions confirm.`
          );
        } catch (e) {
          console.error(`[EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Active Trade Exits for PROFILE_V25_1S_STOCH200_STOCH15 (Legacy)
    if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" && SYMBOL !== "1HZ25V") {
      const isBuy = t.direction === "BUY";
      const m5Close = parseFloat(candles[si].close);
      const isPostEntryCandle = !t.entryEpoch || candles[si].epoch > t.entryEpoch;

      const stoch200Opposite = isBuy ? (sK200 !== null && sK200 < 50.0) : (sK200 !== null && sK200 > 50.0);
      const stoch15Opposite = isBuy ? (sK1525 !== null && sK1525 < 60.0) : (sK1525 !== null && sK1525 > 40.0);
      const stochReversalInvalidation = isPostEntryCandle && stoch200Opposite && stoch15Opposite;

      if (stochReversalInvalidation) {
        closingContracts.add(t.contractId);
        const exitType = "Stop & Reversal Invalidation Exit";
        const exitDesc = "Stoch 200 crossed " + (isBuy ? "< 50.0" : "> 50.0") + " (" + (sK200 ? sK200.toFixed(2) : "N/A") + ") & Stoch (15,2,5) reached " + (isBuy ? "< 60.0" : "> 40.0") + " (" + (sK1525 ? sK1525.toFixed(2) : "N/A") + ")";
        console.log(`[${exitType.toUpperCase()}] Active ${t.direction} trade on 1HZ25V: ${exitDesc}. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[STOP & REVERSAL ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          state.v25_1s_initialDone = false;
          state.v25_1s_stoch15ArmedBuy = false;
          state.v25_1s_stoch15ArmedSell = false;
          state.v25_1s_trendDir = isBuy ? "SELL" : "BUY";
          state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
          state.v25_1s_reversalArmed = isBuy ? "SELL" : "BUY";
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(
            `${icon} *${REPO_LABEL} — ${exitType}*\n\n` +
            `Active *${t.direction}* liquidated immediately on confirmed closed M5 candle.\n` +
            `• ${exitDesc}\n` +
            `💵 P&L: *${pnlStr}*\n` +
            `Contract: \`${t.contractId}\`\n` +
            `Bot is flat and armed for immediate reversal trade.`
          );
        } catch (e) {
          console.error(`[STOP & REVERSAL EXIT] Failed to close contract ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }

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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          state.v25_1s_initialDone = false;
          state.v25_1s_stoch15ArmedBuy = false;
          state.v25_1s_stoch15ArmedSell = false;
          state.v25_1s_trendDir = isBuy ? "SELL" : "BUY";
          state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
          state.v25_1s_reversalArmed = isBuy ? "SELL" : "BUY";
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
            state.openTrade = null;
            onTradeClosedCleanup(candles[si].epoch);
            state.v25_1s_initialDone = false;
            state.v25_1s_stoch15ArmedBuy = false;
            state.v25_1s_stoch15ArmedSell = false;
            state.v25_1s_trendDir = isBuy ? "SELL" : "BUY";
            state.v25_1s_stoch200CrossEpoch = m5BoundaryEpoch;
            state.v25_1s_reversalArmed = isBuy ? "SELL" : "BUY";
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

      // Entry-Hour H1 Adverse Close Exit purged per trader mandate
    }

    // Active Trade Exits for PROFILE_V100_1S_TREND_MACD_STOCH & PROFILE_V10_TREND_MACD_STOCH533
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          if (STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
            state.v10_initialBuyDone = false;
            state.v10_initialSellDone = false;
            state.v10_stochArmedBuy = !isBuy;
            state.v10_stochArmedSell = isBuy;
            state.v10_reversalArmed = isBuy ? "SELL" : "BUY";
          }
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

      // Closed-M5 Stoch (15,2,5) Level 40/60 Invalidation Exit purged per trader mandate
    }

    // Active Trade Exits for PROFILE_V75_EMA_STOCH15 (V75 4-Condition Structural Retracement Model)
    if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15" && SYMBOL !== "R_75") {
      const isBuy = t.direction === "BUY";
      const pnl = calcUnrealizedPnL(t, currentPrice);
      const inLoss = pnl < 0;
      const m5Close = parseFloat(candles[si].close);

      // 40/60 and H1 Adverse Close exits purged per trader mandate
    }

    // =========================================================================
    // 🛡️ STOP & REVERSAL / INVALIDATION ENGINE (STOCH 100 / STOCH 30 FLEET)
    // Applies to: 1HZ75V (Coffee) & R_25 (Tea) under PROFILE_V75_1S_STOCH100_STOCH30 / PROFILE_V25_STOCH100_STOCH30
    // If market immediately reverses on a closed M5 candle:
    // 1) Stoch (100, 1, 1) crosses opposite side (< 50 for BUY / > 50 for SELL)
    // 2) Stoch (30, 2, 5) %K crosses %D (%K < %D for BUY / %K > %D for SELL)
    // Position liquidates immediately on confirmed closed candle to cut losses.
    // If Stoch (30, 2, 5) %K crosses Level 50 and fulfills opposite trade criteria,
    // the bot is flat and will execute the opposite trade immediately.
    // =========================================================================
    if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" && SYMBOL !== "R_25" && SYMBOL !== "1HZ75V") {
      const isBuy = t.direction === "BUY";
      const isPostEntryCandle = Boolean(!t.entryEpoch || m5BoundaryEpoch > t.entryEpoch);
      const currentPnl = calcUnrealizedPnL(t, currentPrice);
      const isRunner = Boolean(t.trendRidingActive || currentPnl >= 3.50 || (t.maxUnrealizedPnL && t.maxUnrealizedPnL >= 4.00));

      // Invalidation 1: Immediate drop/reversal where Stoch 100 crosses opposite (< 50 BUY / > 50 SELL)
      const stoch100Opposite = isBuy ? (sK100 !== null && sK100 < 50.0) : (sK100 !== null && sK100 > 50.0);
      const stoch30Opposite = isBuy ? (sK3025 !== null && sK3025 < 50.0) : (sK3025 !== null && sK3025 > 50.0);
      const stochReversalInvalidation = !isRunner && isPostEntryCandle && stoch100Opposite && stoch30Opposite;

      // Invalidation 2: 2 Opposing M5 Fractals Structural Reversal Exit (Double Top/Lower High on BUY, Double Bottom/Higher Low on SELL)
      const frac2Eval = evaluate2OpposingFractalsReversal(t, candles, si);
      const opposing2FractalReversal = !isRunner && currentPnl < 0 && frac2Eval.triggered;

      // Invalidation 3: 3 Consecutive M5 Candles Closed Against Position (strictly in loss)
      let adverseCandleCount = 0;
      for (let ci = si; ci >= 0; ci--) {
        const cEpoch = candles[ci].epoch;
        if (t.entryEpoch && cEpoch < t.entryEpoch) break;
        const cOpen = parseFloat(candles[ci].open);
        const cClose = parseFloat(candles[ci].close);
        const isAdverse = isBuy ? (cClose < cOpen) : (cClose > cOpen);
        if (isAdverse) adverseCandleCount++;
        else break;
      }
      const threeAdverseCandles = !isRunner && currentPnl < 0 && adverseCandleCount >= 3;

      if (stochReversalInvalidation || opposing2FractalReversal || threeAdverseCandles) {
        closingContracts.add(t.contractId);
        const exitLabel = stochReversalInvalidation
          ? "Stoch 100 Adverse Reversal Invalidation"
          : (opposing2FractalReversal
              ? ("Opposing M5 2-Fractal (" + frac2Eval.pattern + ") Invalidation")
              : "3 Adverse M5 Candles Invalidation");
        console.log(`[EARLY EXIT] ${exitLabel} triggered for ${t.direction} position on ${SYMBOL} (${t.contractId}). Stoch 100: ${sK100?.toFixed(1)}, Stoch 30 %K: ${sK3025?.toFixed(1)}, %D: ${sD3025?.toFixed(1)}, PnL: ${currentPnl.toFixed(2)}. Liquidating immediately.`);

        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[EARLY EXIT ERROR] Broker sell failed for ${t.contractId}:`, closeRes.error.message || JSON.stringify(closeRes.error));
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(currentPnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          if (SYMBOL === "1HZ75V") {
            state.v75_1s_initialBuyDone = false;
            state.v75_1s_initialSellDone = false;
            state.v75_1s_trendDir = isBuy ? "SELL" : "BUY";
            state.v75_1s_stoch100CrossEpoch = m5BoundaryEpoch;
            state.v75_1s_reversalArmed = isBuy ? "SELL" : "BUY";
          } else if (SYMBOL === "R_25") {
            state.v25_initialBuyDone = false;
            state.v25_initialSellDone = false;
            state.v25_trendDir = isBuy ? "SELL" : "BUY";
            state.v25_stoch100CrossEpoch = m5BoundaryEpoch;
            state.v25_stoch302515_touched_50_BUY = false;
            state.v25_stoch302515_touched_50_SELL = false;
            state.v25_reversalArmed = isBuy ? "SELL" : "BUY";
          }
          saveTrades(trades);
          saveState();

          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(
            `${icon} *${REPO_LABEL} — ${exitLabel}*\n\n` +
            `Active *${t.direction}* position liquidated immediately on confirmed closed M5 candle.\n` +
            `• Stoch 100: *${sK100?.toFixed(1)}* (${isBuy ? "< 50.0" : "> 50.0"})\n` +
            `• Stoch (30,2,5): *%K ${sK3025?.toFixed(1)} vs %D ${sD3025?.toFixed(1)}*\n` +
            `💵 P&L: *${pnlStr}*\n` +
            `Contract: \`${t.contractId}\` closed to protect capital.`
          );
        } catch (e) {
          console.error(`[EARLY EXIT] Failed to close contract ${t.contractId}:`, e.message);
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

      // Invalidation 1.5 (V50 legacy only): ADX drops below 20.0 while in loss -> Sideways Chop Invalidation
      if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_ADX20" && SYMBOL === "R_50" && !isRunner && pnl < 0 && isPostEntryCandle && adxVal !== null && adxVal < 20.0) {
        closingContracts.add(t.contractId);
        console.log(`[ADX CHOP EXIT] Active ${t.direction} in loss (${pnl.toFixed(2)}): ADX dropped below 20.0 (${adxVal.toFixed(1)}). Market collapsed to sideways chop. Liquidating immediately.`);
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[ADX CHOP EXIT ERROR] Broker sell failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(pnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — ADX < 20 Sideways Chop Invalidation*\n\nM5 ADX dropped below 20.0 (${adxVal.toFixed(1)}). Market in sideways chop.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[ADX CHOP EXIT] Failed to close contract ${t.contractId}:`, e.message);
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
            state.openTrade = null;
            onTradeClosedCleanup(candles[si].epoch);
            if (STRATEGY_PROFILE === "PROFILE_V10_TREND_MACD_STOCH533") {
              state.v10_initialBuyDone = false;
              state.v10_initialSellDone = false;
              state.v10_stochArmedBuy = !isBuy;
              state.v10_stochArmedSell = isBuy;
              state.v10_reversalArmed = isBuy ? "SELL" : "BUY";
            }
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

      // Invalidation 3 (40/60) purged per trader mandate

      // Invalidation 4 (H1) purged per trader mandate
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

      let earlyExitTriggered = false;
      let exitReason = "";
      let exitDetail = "";

      if (inLoss && fractalBroken) {
        earlyExitTriggered = true;
        exitReason = "Previous M5 Fractal Early Exit";
        exitDetail = "M5 candle closed at " + m5Close.toFixed(2) + " breaking previous M5 Fractal (" + m5FractalSl.toFixed(2) + ") while in loss (" + currentPnl.toFixed(2) + ")";
      } else if (inLoss && stoch200Adverse) {
        earlyExitTriggered = true;
        exitReason = "Stoch (200,1,1) Adverse Invalidation Exit";
        exitDetail = "M5 Stoch (200,1,1) crossed adverse to position (%K: " + sK.toFixed(1) + (isBuy ? " < 50.0" : " > 50.0") + ") while in loss (" + currentPnl.toFixed(2) + ")";
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
          state.openTrade = null;
          onTradeClosedCleanup(candles[si].epoch);
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

    // Upgrade M15 Fractal SL if new favorable M15 structure forms (Excluded on Stoch 100 + Stoch 15,1,1 fleet)
    if (m15Candles.length >= 5 && SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_100" && SYMBOL !== "R_25" && SYMBOL !== "1HZ25V") {
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

  // ── REFRESH TRADES AFTER EXITS TO ENABLE SAME-CANDLE REVERSAL TRADES ──
  trades = loadTrades();
  openTrades = trades.filter(t => !t.result && !t.pending && !closingContracts.has(t.contractId));

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
  state.adxVal = adxVal;
  state.v50_adx = adxVal;

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

  
  // Protect profits: If daily target or daily max loss limit reached, do NOT evaluate new trade entries!
  if (state.dailyTargetReached) {
    console.log(`[${REPO_LABEL}] 🎯 Daily target (+$7.00) already secured today. Idling until 00:00 UTC rollover.`);
    state.lastProcessedEpoch = m5BoundaryEpoch;
    state.openTrade = null;
    state.healthStatus = "FUNCTIONING";
    state.blockerReason = `Daily Net Target (+${DAILY_PROFIT_TARGET_USD.toFixed(2)}) Secured Today (${(state.dailyNetPnl || 0).toFixed(2)})`;
    state.nextTrigger = "Idling until 00:00 UTC daily rollover";
    state.nextPhase = state.nextTrigger;
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
        state.armed = { dir: "BUY", lbl: "V75 Price > BB 20 Mid & 200 (Initial BUY Armed)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `BUY Trend (Price > BB 20 Mid & 200) [Initial BUY Armed: Await Fresh %K > 50 (Invalid if already > 50)]`;
      } else if (state.v75_initialSellArmed && isBelowBothEma) {
        state.armed = { dir: "SELL", lbl: "V75 Price < BB 20 Mid & 200 (Initial SELL Armed)", lvl: currentPrice };
        if (!state.armedEpoch) { state.armedEpoch = m5BoundaryEpoch; state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC"; }
        state.nextPhase = `SELL Trend (Price < BB 20 Mid & 200) [Initial SELL Armed: Await Fresh %K < 50 (Invalid if already < 50)]`;
      } else {
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
        state.nextPhase = isAboveBothEma ? "BUY Trend (Price > BB 20 Mid & 200)" : isBelowBothEma ? "SELL Trend (Price < BB 20 Mid & 200)" : "Monitoring V75 Price vs EMAs";
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
  // 1.5 VOLATILITY 75 (R_75) 2-STEP INITIAL & RETRACEMENT MODEL (Legacy)
  else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15" && SYMBOL !== "R_75") {
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

    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;

    // Setup 1: Initial Entries (Price > BB 20 Mid & 200 + Fresh %K > 50 for BUY / Price < BB 20 Mid & 200 + Fresh %K < 50 for SELL)
    // NOTE: Initial entries do NOT require EMA 100 vs EMA 200 alignment!
    // INVALIDATION RULE: If M5 Stoch (15,2,5 Simple) %K is already beyond Level 50.0, the setup is invalid and will not trigger.
    if (isAboveBothEma && state.v75_initialBuyArmed && !state.v75_initialBuyDone && stochFreshCrossUp50 && !hasActiveBuy) {
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
    } else if (isBelowBothEma && state.v75_initialSellArmed && !state.v75_initialSellDone && stochFreshCrossDown50 && !hasActiveSell) {
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
    else if (state.v75_initialBuyDone && currentEma100 !== null && currentEma200 !== null && currentEma100 > currentEma200 && state.v75_emaTouched_BUY && isAboveEma100 && stochFreshCrossUp20 && !hasActiveBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V75_RETRACE_EMA100_STOCH20 (BUY)";
      state.v75_emaTouched_BUY = false;
      state.ema100BuyArmed = false;
    } else if (state.v75_initialSellDone && currentEma100 !== null && currentEma200 !== null && currentEma100 < currentEma200 && state.v75_emaTouched_SELL && isBelowEma100 && stochFreshCrossDown80 && !hasActiveSell) {
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
  // 2b. VOLATILITY 50 INDEX (OmniSight R_50 Legacy ADX) — ADX >= 20 + STOCH 200 (LEVEL 50) + EMA 100 + STOCH 15
  else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_ADX20" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150") {
    const botPrefix = "V50";
    const pfx = "v50";

    // Migrate initial flags
    if (state.v50_initialEntryDone === undefined) {
      state.v50_initialEntryDone = Boolean(state.v50_initialBuyDone || state.v50_initialSellDone);
    }

    // 1. ADX (14) Trend Strength Gate (Threshold 20.0)
    // When ADX < 20: Sideways Chop Filter Active. All arming and trade entries blocked.
    // When ADX >= 20: Trend Strength Confirmed.
    const adxStrong = adxVal !== null && adxVal >= 20.0;
    const adxFreshCrossUp20 = prevAdxVal !== null && adxVal !== null && prevAdxVal < 20.0 && adxVal >= 20.0;

    // 2. M5 Stoch (200,1,1) Directional Gate (Level 50)
    // BUY: sK200 >= 50.0; SELL: sK200 <= 50.0
    const stoch200BuyAligned = sK200 !== null && sK200 >= 50.0;
    const stoch200SellAligned = sK200 !== null && sK200 <= 50.0;
    const stoch200CrossUp50 = prevK200 !== null && sK200 !== null && prevK200 <= 50.0 && sK200 > 50.0;
    const stoch200CrossDown50 = prevK200 !== null && sK200 !== null && prevK200 >= 50.0 && sK200 < 50.0;

    // Fresh Arming Events (Any order or simultaneous cross):
    const freshArmBuy = adxStrong && stoch200BuyAligned && (
      (adxFreshCrossUp20 && stoch200BuyAligned) ||
      (stoch200CrossUp50 && adxStrong) ||
      (state.v50_trendDir !== "BUY" && prevAdxVal !== null && (prevAdxVal < 20.0 || (prevK200 !== null && prevK200 < 50.0)))
    );

    const freshArmSell = adxStrong && stoch200SellAligned && (
      (adxFreshCrossUp20 && stoch200SellAligned) ||
      (stoch200CrossDown50 && adxStrong) ||
      (state.v50_trendDir !== "SELL" && prevAdxVal !== null && (prevAdxVal < 20.0 || (prevK200 !== null && prevK200 > 50.0)))
    );

    if (freshArmBuy) {
      if (state.v50_trendDir !== "BUY") {
        state.v50_initialEntryDone = false; // Fresh trend wave: initial entry unlocked!
        dbg("[V50 TREND] ADX (" + (adxVal ? adxVal.toFixed(1) : "N/A") + " >= 20) + Stoch 200 (" + (sK200 ? sK200.toFixed(1) : "N/A") + " >= 50). BUY TREND ARMED.");
      }
      state.v50_trendDir = "BUY";
      state.v50_armedEpoch = m5BoundaryEpoch;
    } else if (freshArmSell) {
      if (state.v50_trendDir !== "SELL") {
        state.v50_initialEntryDone = false; // Fresh trend wave: initial entry unlocked!
        dbg("[V50 TREND] ADX (" + (adxVal ? adxVal.toFixed(1) : "N/A") + " >= 20) + Stoch 200 (" + (sK200 ? sK200.toFixed(1) : "N/A") + " <= 50). SELL TREND ARMED.");
      }
      state.v50_trendDir = "SELL";
      state.v50_armedEpoch = m5BoundaryEpoch;
    }

    // Disarming & Sideways Chop Filter:
    // If ADX drops below 20 -> Disarm trend! Market is in sideways chop.
    if (!adxStrong) {
      if (state.v50_trendDir !== null) {
        dbg("[V50 CHOP FILTER] ADX dropped to " + (adxVal ? adxVal.toFixed(1) : "N/A") + " (< 20.0). Market is in SIDEWAYS CHOP. Disarming trend.");
      }
      state.v50_trendDir = null;
      state.v50_armedEpoch = null;
    }
    // If Stoch 200 dealigns:
    if (state.v50_trendDir === "BUY" && sK200 !== null && sK200 < 48.0) {
      dbg("[V50 DEALIGN] Stoch 200 dropped to " + sK200.toFixed(1) + " (< 48.0). Disarming BUY.");
      state.v50_trendDir = null;
      state.v50_armedEpoch = null;
    } else if (state.v50_trendDir === "SELL" && sK200 !== null && sK200 > 52.0) {
      dbg("[V50 DEALIGN] Stoch 200 rose to " + sK200.toFixed(1) + " (> 52.0). Disarming SELL.");
      state.v50_trendDir = null;
      state.v50_armedEpoch = null;
    }

    // Condition 2: Baseline Filter M5 EMA 100
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    // Condition 3: M5 Stoch (15,2,5) Initial Lvl 50 & Re-Entry 25/75
    const stoch15CrossUp50 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0;
    const stoch15CrossDown50 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0;

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    const isInitialBuy = noActiveTrades && !state.v50_initialEntryDone && state.v50_trendDir === "BUY" && emaBaselineBuy && stoch15CrossUp50;
    const isInitialSell = noActiveTrades && !state.v50_initialEntryDone && state.v50_trendDir === "SELL" && emaBaselineSell && stoch15CrossDown50;

    const stoch15FreshCross25Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 25.0 && sK1525 > 25.0;
    const stoch15FreshCross75Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 75.0 && sK1525 < 75.0;

    const isReentryBuy = noActiveTrades && Boolean(state.v50_initialEntryDone) && state.v50_trendDir === "BUY" && emaBaselineBuy && stoch15FreshCross25Buy;
    const isReentrySell = noActiveTrades && Boolean(state.v50_initialEntryDone) && state.v50_trendDir === "SELL" && emaBaselineSell && stoch15FreshCross75Sell;

    if (isInitialBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V50_INITIAL_ADX20_STOCH200_STOCH15 (BUY)";
      state.v50_initialEntryDone = true;
    } else if (isInitialSell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V50_INITIAL_ADX20_STOCH200_STOCH15 (SELL)";
      state.v50_initialEntryDone = true;
    } else if (isReentryBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V50_REENTRY_STOCH15_25 (BUY)";
    } else if (isReentrySell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V50_REENTRY_STOCH15_75 (SELL)";
    }

    // Telemetry updates for dashboard
    state.adxVal = adxVal;
    state.v50_adx = adxVal;
    if (state.v50_trendDir === "BUY") {
      if (!state.v50_initialEntryDone) {
        state.armed = { dir: "BUY", lbl: "V50 Trend Armed (ADX: " + (adxVal ? adxVal.toFixed(1) : "N/A") + " >= 20, Stoch200: " + (sK200 ? sK200.toFixed(1) : "N/A") + " > 50)", lvl: currentPrice };
        state.nextPhase = "V50 Initial BUY Armed — Awaiting Stoch (15,2,5) %K cross > 50 (EMA 100: " + (emaBaselineBuy ? "PASS" : "BLOCK") + ")";
      } else {
        state.isReentryMode = true;
        state.nextPhase = "V50 Awaiting BUY Re-Entry — Await Stoch (15,2,5) %K cross > 25 (EMA 100: " + (emaBaselineBuy ? "PASS" : "BLOCK") + ")";
      }
    } else if (state.v50_trendDir === "SELL") {
      if (!state.v50_initialEntryDone) {
        state.armed = { dir: "SELL", lbl: "V50 Trend Armed (ADX: " + (adxVal ? adxVal.toFixed(1) : "N/A") + " >= 20, Stoch200: " + (sK200 ? sK200.toFixed(1) : "N/A") + " < 50)", lvl: currentPrice };
        state.nextPhase = "V50 Initial SELL Armed — Awaiting Stoch (15,2,5) %K cross < 50 (EMA 100: " + (emaBaselineSell ? "PASS" : "BLOCK") + ")";
      } else {
        state.isReentryMode = true;
        state.nextPhase = "V50 Awaiting SELL Re-Entry — Await Stoch (15,2,5) %K cross < 75 (EMA 100: " + (emaBaselineSell ? "PASS" : "BLOCK") + ")";
      }
    } else {
      state.armed = null;
      if (!adxStrong) {
        state.nextPhase = "V50 CHOP FILTER ACTIVE: ADX (" + (adxVal !== null ? adxVal.toFixed(1) : "--") + " < 20.0) — Market Sideways / Waiting for Trend Strength";
      } else {
        state.nextPhase = "V50 Awaiting Trend Alignment (ADX: " + (adxVal ? adxVal.toFixed(1) : "N/A") + ", Stoch 200: " + (sK200 ? sK200.toFixed(1) : "N/A") + ")";
      }
    }
  }

  // 2. STANDARDIZED M5 STOCH 200 (48/52) & M5 STOCH (15,2,5) ENGINE (V50 Legacy)
  else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" && SYMBOL !== "R_50" && SYMBOL !== "R_100") {
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

    const noActiveTrades = !trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending));

    // 1. Initial Entry Trigger:
    // Unbounded: Initial entry stays open as long as Stochastic 200 remains armed without dealignment.
    // "Once one of them crosses, it waits for the next indicator to cross unless there is a dealignment."
    const stoch200AlignedBuy = state[trendDirKey] === "BUY" && sK200 !== null && sK200 >= 48.0;
    const stoch200AlignedSell = state[trendDirKey] === "SELL" && sK200 !== null && sK200 <= 52.0;

    // Universal EMA 100 Filter: BUY only if Price > BB 20 Mid; SELL only if Price < BB 20 Mid
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    const isInitialBuy = 
      !hasActiveBuy &&
      !state[initialEntryDoneKey] &&
      stoch200AlignedBuy &&
      emaBaselineBuy &&
      (
        stoch15CrossUp50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 UP
        (state[pfx + "_reversalArmed"] === "BUY" && sK1525 !== null && sK1525 >= 50.0) || // Stop & Reversal continuation
        (stoch200FreshBuyArm && state[stoch15CrossDirKey] === "BUY" && sK1525 !== null && sK1525 >= 50.0) // Stoch 15 crossed 50 UP first; Stoch 200 freshly arms BUY
      );

    const isInitialSell = 
      !hasActiveSell &&
      !state[initialEntryDoneKey] &&
      stoch200AlignedSell &&
      emaBaselineSell &&
      (
        stoch15CrossDown50 || // Stoch 200 armed first; Stoch 15 freshly crosses Level 50 DOWN
        (state[pfx + "_reversalArmed"] === "SELL" && sK1525 !== null && sK1525 <= 50.0) || // Stop & Reversal continuation
        (stoch200FreshSellArm && state[stoch15CrossDirKey] === "SELL" && sK1525 !== null && sK1525 <= 50.0) // Stoch 15 crossed 50 DOWN first; Stoch 200 freshly arms SELL
      );

    // 2. Re-Entry Rule:
    // Strictly require initialEntryDone === true!
    // If Stoch 200 is already armed and aligned for Buy or Sell and there is NO existing open trade,
    // enter immediately when Stoch (15,2,5) freshly crosses level 25 for Buy (with Price > BB 20 Mid) or level 75 for Sell (with Price < BB 20 Mid).
    const stoch15FreshCross25Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 25.0 && sK1525 > 25.0;
    const stoch15FreshCross75Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 75.0 && sK1525 < 75.0;

    const isReentryBuy = !hasActiveBuy && state[initialEntryDoneKey] && stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross25Buy;
    const isReentrySell = !hasActiveSell && state[initialEntryDoneKey] && stoch200AlignedSell && emaBaselineSell && stoch15FreshCross75Sell;

    // Latch Re-Entry Opportunity while trade is running (for immediate entry upon trade close)
    if (state[initialEntryDoneKey] && stoch200AlignedBuy && emaBaselineBuy && stoch15FreshCross25Buy) {
      state.activeReentryOpportunity = {
        direction: "BUY",
        setupLabel: botPrefix + "_REENTRY_STOCH15_25 (BUY)",
        detectedEpoch: m5BoundaryEpoch,
        expiresEpoch: m5BoundaryEpoch + 300,
        currentEma100
      };
    } else if (state[initialEntryDoneKey] && stoch200AlignedSell && emaBaselineSell && stoch15FreshCross75Sell) {
      state.activeReentryOpportunity = {
        direction: "SELL",
        setupLabel: botPrefix + "_REENTRY_STOCH15_75 (SELL)",
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
          state.nextPhase = botPrefix + " BUY Re-Entry Armed — In Pullback Zone (%K: " + sK1525.toFixed(1) + "). Awaiting Cross > 25";
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = botPrefix + " Awaiting BUY Re-Entry — Awaiting Stoch (15,2,5) Pullback <= 25 (Current %K: " + (sK1525 !== null ? sK1525.toFixed(1) : "N/A") + ")";
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
          state.nextPhase = botPrefix + " SELL Re-Entry Armed — In Overbought Zone (%K: " + sK1525.toFixed(1) + "). Awaiting Cross < 75";
        } else {
          state.armed = null;
          state.armedEpoch = null;
          state.armedTime = null;
          state.nextPhase = botPrefix + " Awaiting SELL Re-Entry — Awaiting Stoch (15,2,5) Rally >= 75 (Current %K: " + (sK1525 !== null ? sK1525.toFixed(1) : "N/A") + ")";
        }
      }
    } else {
      state.armed = null; state.armedEpoch = null; state.armedTime = null;
      state.nextPhase = "Monitoring " + botPrefix + " Confluence";
    }

    if (isInitialBuy || isReentryBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = isInitialBuy ? botPrefix + "_INITIAL_STOCH200_STOCH15 (BUY)" : botPrefix + "_REENTRY_STOCH15_25 (BUY)";
      state[initialEntryDoneKey] = true;
      state[pfx + "_reversalArmed"] = null;
    } else if (isInitialSell || isReentrySell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = isInitialSell ? botPrefix + "_INITIAL_STOCH200_STOCH15 (SELL)" : botPrefix + "_REENTRY_STOCH15_75 (SELL)";
      state[initialEntryDoneKey] = true;
      state[pfx + "_reversalArmed"] = null;
    }
  }
  // =========================================================================
  // 3. VOLATILITY 25 (1s) QUANTITATIVE HYSTERESIS & MOMENTUM CONFLUENCE STRATEGY (Legacy)
  // Profile: PROFILE_V25_1S_STOCH200_STOCH15
  // =========================================================================
  else if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" && SYMBOL !== "1HZ25V") {
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
    const freshConfluenceBuy = (stoch200CrossUp55 && (sK1525 !== null && sK1525 > 75.0)) || (stoch15CrossUp75 && stoch200InBuyTrend) || (state.v25_1s_reversalArmed === "BUY" && stoch200InBuyTrend && sK1525 !== null && sK1525 >= 75.0);
    const freshConfluenceSell = (stoch200CrossDown45 && (sK1525 !== null && sK1525 < 25.0)) || (stoch15CrossDown25 && stoch200InSellTrend) || (state.v25_1s_reversalArmed === "SELL" && stoch200InSellTrend && sK1525 !== null && sK1525 <= 25.0);

    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;

    // Initial Entry Evaluation
    if (!state.v25_1s_initialDone) {
      if (freshConfluenceBuy) {
        if (emaBaselineBuy) {
          if (!hasActiveBuy) {
            indicatorsSatisfied = true;
            signalDirection = "BUY";
            setupLabel = (stoch200CrossUp55 && stoch15CrossUp75) ? "V25_1S_INITIAL_SIMULTANEOUS (BUY)" : "V25_1S_INITIAL_CONFLUENCE (BUY)";
          }
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedBuy = false;
          state.v25_1s_reversalArmed = null;
        } else {
          // "If EMA is not aligned, skip the trade and wait for a re entry signal"
          console.log(`[${REPO_LABEL}] Initial BUY confluence met (Stoch 200: ${sK200?.toFixed(1)}, Stoch 15: ${sK1525?.toFixed(1)}), but M5 Price (${currentPrice.toFixed(2)}) is NOT above EMA 100 (${currentEma100?.toFixed(2)}). SKIPPING initial trade and waiting for re-entry signal.`);
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedBuy = false;
        }
      } else if (freshConfluenceSell) {
        if (emaBaselineSell) {
          if (!hasActiveSell) {
            indicatorsSatisfied = true;
            signalDirection = "SELL";
            setupLabel = (stoch200CrossDown45 && stoch15CrossDown25) ? "V25_1S_INITIAL_SIMULTANEOUS (SELL)" : "V25_1S_INITIAL_CONFLUENCE (SELL)";
          }
          state.v25_1s_initialDone = true;
          state.v25_1s_stoch15ArmedSell = false;
          state.v25_1s_reversalArmed = null;
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
    // 3. EMA 100 filter: M5 Price > BB 20 Mid for BUY / M5 Price < BB 20 Mid for SELL
    const stoch15FreshCrossUp25 = prevK1525 !== null && sK1525 !== null && prevK1525 <= 25.0 && sK1525 > 25.0;
    const stoch15FreshCrossDown75 = prevK1525 !== null && sK1525 !== null && prevK1525 >= 75.0 && sK1525 < 75.0;

    const reentryBuyTrigger = state.v25_1s_initialDone && stoch200InBuyTrend && stoch15FreshCrossUp25 && emaBaselineBuy;
    const reentrySellTrigger = state.v25_1s_initialDone && stoch200InSellTrend && stoch15FreshCrossDown75 && emaBaselineSell;

    if (!indicatorsSatisfied) {
      if (reentryBuyTrigger && !hasActiveBuy) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = "V25_1S_REENTRY_STOCH15 (BUY)";
      } else if (reentrySellTrigger && !hasActiveSell) {
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
      : `Initial Confluence (Stoch 200 45/55 + Stoch 15 25/75 + BB 20 Mid)`;
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
  // =========================================================================
  // 3.45 VOLATILITY 25 (R_25 TEA MACHINE)
  // STOCH 100 (100,1,1) TREND + STOCH (25,1,1) INITIAL (+/-3 CANDLES) & 10/90 RE-ENTRY
  // =========================================================================
  else if (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH25") {
    const prefix = "V25";

    // Macro Trend Definition: Stoch (100, 1, 1) Level 50 Gate
    const stoch100AlignedBuy = sK100 !== null && sK100 >= 50.0;
    const stoch100AlignedSell = sK100 !== null && sK100 <= 50.0;
    const stoch100CrossUp50 = prevK100 !== null && sK100 !== null && prevK100 <= 50.0 && sK100 > 50.0;
    const stoch100CrossDown50 = prevK100 !== null && sK100 !== null && prevK100 >= 50.0 && sK100 < 50.0;

    // Trigger & Re-entry Indicator: Stoch (25, 1, 1 Simple)
    const stoch25CrossUp50 = prevK2511 !== null && sK2511 !== null && prevK2511 <= 50.0 && sK2511 > 50.0;
    const stoch25CrossDown50 = prevK2511 !== null && sK2511 !== null && prevK2511 >= 50.0 && sK2511 < 50.0;

    // Track cross epoch of Stoch 100
    if (stoch100CrossUp50) {
      state.v25_stoch100CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch100CrossDown50) {
      state.v25_stoch100CrossEpochSell = m5BoundaryEpoch;
    }

    // Track cross epoch of Stoch 25
    if (stoch25CrossUp50) {
      state.v25_stoch25CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch25CrossDown50) {
      state.v25_stoch25CrossEpochSell = m5BoundaryEpoch;
    }

    // Reset flags upon macro trend dealignment (DO NOT wipe stoch25 cross epochs here; they allow Stoch to cross 3 candles BEFORE Stoch 100)
    if (!stoch100AlignedBuy) {
      state.v25_stoch100CrossEpochBuy = null;
      state.v25_initialBuyDone = false;
      state.v25_stoch25_pulled_back_10 = false;
    }
    if (!stoch100AlignedSell) {
      state.v25_stoch100CrossEpochSell = null;
      state.v25_initialSellDone = false;
      state.v25_stoch25_pulled_back_90 = false;
    }
    // Expire Stoch 25 cross epochs only after 3 candles (900s) or on opposite cross
    if (state.v25_stoch25CrossEpochBuy && ((m5BoundaryEpoch - state.v25_stoch25CrossEpochBuy) > 900 || stoch25CrossDown50)) {
      state.v25_stoch25CrossEpochBuy = null;
    }
    if (state.v25_stoch25CrossEpochSell && ((m5BoundaryEpoch - state.v25_stoch25CrossEpochSell) > 900 || stoch25CrossUp50)) {
      state.v25_stoch25CrossEpochSell = null;
    }

    // If tolerance window (+/- 3 candles = 900 seconds) has elapsed since Stoch 100 crossed 50 without Stoch 25 matching,
    // bypass initial entry and mark initial done to open Re-Entry mode.
    if (stoch100AlignedBuy && state.v25_stoch100CrossEpochBuy && !state.v25_initialBuyDone) {
      if ((m5BoundaryEpoch - state.v25_stoch100CrossEpochBuy) > 900) {
        state.v25_initialBuyDone = true;
        console.log(`[${REPO_LABEL}] Stoch 100 cross BUY window (+/- 3 candles) expired. Bypassing initial BUY, opening for RE-ENTRY.`);
      }
    }
    if (stoch100AlignedSell && state.v25_stoch100CrossEpochSell && !state.v25_initialSellDone) {
      if ((m5BoundaryEpoch - state.v25_stoch100CrossEpochSell) > 900) {
        state.v25_initialSellDone = true;
        console.log(`[${REPO_LABEL}] Stoch 100 cross SELL window (+/- 3 candles) expired. Bypassing initial SELL, opening for RE-ENTRY.`);
      }
    }

    // Startup recovery if state flags are not initialized
    if (stoch100AlignedBuy && state.v25_initialBuyDone === undefined) {
      state.v25_initialBuyDone = true;
    }
    if (stoch100AlignedSell && state.v25_initialSellDone === undefined) {
      state.v25_initialSellDone = true;
    }

    // Check active trades (differentiate direction to enable Opposite Signal Position Flip)
    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;
    const hasSameDirectionActiveTrade = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === (stoch100AlignedBuy ? "BUY" : "SELL"));

    // Tolerance window: Stoch (25, 1, 1) can cross level 50 up to 3 candles before, at the same time, or up to 3 candles after Stoch (100, 1, 1)
    const buyToleranceSatisfied = state.v25_stoch100CrossEpochBuy && state.v25_stoch25CrossEpochBuy &&
      Math.abs(state.v25_stoch100CrossEpochBuy - state.v25_stoch25CrossEpochBuy) <= 900;
    const sellToleranceSatisfied = state.v25_stoch100CrossEpochSell && state.v25_stoch25CrossEpochSell &&
      Math.abs(state.v25_stoch100CrossEpochSell - state.v25_stoch25CrossEpochSell) <= 900;

    const isInitialBuyTrigger = stoch100AlignedBuy && sK2511 !== null && sK2511 > 50.0 &&
      !state.v25_initialBuyDone && buyToleranceSatisfied && (stoch100CrossUp50 || stoch25CrossUp50) &&
      !hasActiveBuy;

    const isInitialSellTrigger = stoch100AlignedSell && sK2511 !== null && sK2511 < 50.0 &&
      !state.v25_initialSellDone && sellToleranceSatisfied && (stoch100CrossDown50 || stoch25CrossDown50) &&
      !hasActiveSell;

    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_INITIAL_STOCH100_STOCH25 (BUY)`;
      state.v25_initialBuyDone = true;
      state.v25_stoch25_pulled_back_10 = false;
    } else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_INITIAL_STOCH100_STOCH25 (SELL)`;
      state.v25_initialSellDone = true;
      state.v25_stoch25_pulled_back_90 = false;
    }

    // Re-Entry: Stoch 100 aligned & no active trade open + M5 Stoch 25 pulls back and freshly crosses 10 (BUY) / 90 (SELL)
    const lastClosedOrTriggeredEpoch = Math.max(state.lastTriggeredEpoch || 0, state.lastClosedTradeEpoch || 0);
    const isPostTradeCurr = !lastClosedOrTriggeredEpoch || candles[si].epoch > lastClosedOrTriggeredEpoch;

    // Evaluate Re-Entry (allow evaluation if no same-direction trade open, enabling Opposite Signal Position Flip)
    if (!indicatorsSatisfied && isPostTradeCurr) {
      if (stoch100AlignedBuy && Boolean(state.v25_initialBuyDone) && !hasActiveBuy) {
        if ((sK2511 !== null && sK2511 <= 10.5) || (sMinK2511 !== null && sMinK2511 <= 10.5) || (prevK2511 !== null && prevK2511 <= 10.5)) {
          state.v25_stoch25_pulled_back_10 = true;
        } else if (sK2511 !== null && sK2511 >= 50.0) {
          state.v25_stoch25_pulled_back_10 = false;
        }
      }
      if (stoch100AlignedSell && Boolean(state.v25_initialSellDone) && !hasActiveSell) {
        if ((sK2511 !== null && sK2511 >= 89.5) || (sMaxK2511 !== null && sMaxK2511 >= 89.5) || (prevK2511 !== null && prevK2511 >= 89.5)) {
          state.v25_stoch25_pulled_back_90 = true;
        } else if (sK2511 !== null && sK2511 <= 50.0) {
          state.v25_stoch25_pulled_back_90 = false;
        }
      }

      const stoch25CrossUp10 = sK2511 !== null && prevK2511 !== null && (
        (prevK2511 <= 10.0 && sK2511 > 10.0) ||
        (Boolean(state.v25_stoch25_pulled_back_10) && prevK2511 <= 12.0 && sK2511 > 10.0 && sK2511 > prevK2511)
      );

      const stoch25CrossDown90 = sK2511 !== null && prevK2511 !== null && (
        (prevK2511 >= 90.0 && sK2511 < 90.0) ||
        (Boolean(state.v25_stoch25_pulled_back_90) && prevK2511 >= 88.0 && sK2511 < 90.0 && sK2511 < prevK2511)
      );

      const isReentryBuyTrigger = stoch100AlignedBuy && Boolean(state.v25_initialBuyDone) && stoch25CrossUp10;
      const isReentrySellTrigger = stoch100AlignedSell && Boolean(state.v25_initialSellDone) && stoch25CrossDown90;

      if (isReentryBuyTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = `${prefix}_REENTRY_STOCH25_10 (BUY)`;
        state.v25_stoch25_pulled_back_10 = false;
      } else if (isReentrySellTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = `${prefix}_REENTRY_STOCH25_90 (SELL)`;
        state.v25_stoch25_pulled_back_90 = false;
      }
    }

    const isV25Reentry = Boolean(state.v25_initialBuyDone || state.v25_initialSellDone);
    state.isReentryMode = isV25Reentry;

    if (stoch100AlignedBuy) {
      if (!state.v25_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V25 Initial BUY Armed (Stoch 100: ${sK100.toFixed(1)} > 50)`, lvl: currentPrice };
        state.nextPhase = `V25 Initial BUY Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 3 candles`;
      } else {
        const inPullback = Boolean(state.v25_stoch25_pulled_back_10) || (sK2511 !== null && sK2511 <= 10.5) || (sMinK2511 !== null && sMinK2511 <= 10.5);
        if (inPullback) {
          state.armed = { dir: "BUY", lbl: `V25 BUY Pullback Armed (Stoch 25 Touched <= 10, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V25 BUY Re-Entry Armed — Pullback <= 10 Touched (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross > 10`;
        } else {
          state.armed = null;
          state.nextPhase = `V25 Awaiting BUY Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to <= 10 then fresh cross > 10`;
        }
      }
    } else if (stoch100AlignedSell) {
      if (!state.v25_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V25 Initial SELL Armed (Stoch 100: ${sK100.toFixed(1)} < 50)`, lvl: currentPrice };
        state.nextPhase = `V25 Initial SELL Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 3 candles`;
      } else {
        const inPullback = Boolean(state.v25_stoch25_pulled_back_90) || (sK2511 !== null && sK2511 >= 89.5) || (sMaxK2511 !== null && sMaxK2511 >= 89.5);
        if (inPullback) {
          state.armed = { dir: "SELL", lbl: `V25 SELL Pullback Armed (Stoch 25 Touched >= 90, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V25 SELL Re-Entry Armed — Pullback >= 90 Touched (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross < 90`;
        } else {
          state.armed = null;
          state.nextPhase = `V25 Awaiting SELL Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to >= 90 then fresh cross < 90`;
        }
      }
    } else {
      state.armed = null;
      state.nextPhase = "Monitoring Stoch (100,1,1) Level 50 Macro Trend Gate";
    }
  }
  // =========================================================================
  // 3.46 VOLATILITY 50 (R_50 OMNISIGHT)
  // MACD (5,35,1) TREND + STOCH (25,1,1) INITIAL (+/-2 CANDLES) & 10/90 RE-ENTRY
  // =========================================================================
  else if (SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V50_MACD_STOCH25") {
    const prefix = "V50";

    // Macro Trend Definition: MACD (5, 35, 1) Level 0 Gate
    const macd5351AlignedBuy = sMacd5351 !== null && sMacd5351 > 0.0;
    const macd5351AlignedSell = sMacd5351 !== null && sMacd5351 < 0.0;
    const macd5351CrossUpZero = prevMacd5351 !== null && sMacd5351 !== null && prevMacd5351 <= 0.0 && sMacd5351 > 0.0;
    const macd5351CrossDownZero = prevMacd5351 !== null && sMacd5351 !== null && prevMacd5351 >= 0.0 && sMacd5351 < 0.0;

    // Trigger & Re-entry Indicator: Stoch (25, 1, 1 Simple)
    const stoch25CrossUp50 = prevK2511 !== null && sK2511 !== null && prevK2511 <= 50.0 && sK2511 > 50.0;
    const stoch25CrossDown50 = prevK2511 !== null && sK2511 !== null && prevK2511 >= 50.0 && sK2511 < 50.0;

    // Track cross epoch of MACD (5, 35, 1)
    if (macd5351CrossUpZero) {
      state.v50_macdCrossEpochBuy = m5BoundaryEpoch;
    }
    if (macd5351CrossDownZero) {
      state.v50_macdCrossEpochSell = m5BoundaryEpoch;
    }

    // Track cross epoch of Stoch 25
    if (stoch25CrossUp50) {
      state.v50_stoch25CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch25CrossDown50) {
      state.v50_stoch25CrossEpochSell = m5BoundaryEpoch;
    }

    // Reset flags upon macro trend dealignment (DO NOT wipe stoch25 cross epochs here; they allow Stoch to cross 2 candles BEFORE MACD)
    if (!macd5351AlignedBuy) {
      state.v50_macdCrossEpochBuy = null;
      state.v50_initialBuyDone = false;
      state.v50_stoch25_pulled_back_10 = false;
    }
    if (!macd5351AlignedSell) {
      state.v50_macdCrossEpochSell = null;
      state.v50_initialSellDone = false;
      state.v50_stoch25_pulled_back_90 = false;
    }
    // Expire Stoch 25 cross epochs only after 2 candles (600s) or on opposite cross
    if (state.v50_stoch25CrossEpochBuy && ((m5BoundaryEpoch - state.v50_stoch25CrossEpochBuy) > 600 || stoch25CrossDown50)) {
      state.v50_stoch25CrossEpochBuy = null;
    }
    if (state.v50_stoch25CrossEpochSell && ((m5BoundaryEpoch - state.v50_stoch25CrossEpochSell) > 600 || stoch25CrossUp50)) {
      state.v50_stoch25CrossEpochSell = null;
    }

    // If tolerance window (+/- 2 candles = 600 seconds) has elapsed since MACD crossed 0 without Stoch 25 matching,
    // bypass initial entry and mark initial done to open Re-Entry mode.
    if (macd5351AlignedBuy && state.v50_macdCrossEpochBuy && !state.v50_initialBuyDone) {
      if ((m5BoundaryEpoch - state.v50_macdCrossEpochBuy) > 600) {
        state.v50_initialBuyDone = true;
        console.log(`[${REPO_LABEL}] MACD (5,35,1) cross BUY window (+/- 2 candles) expired. Bypassing initial BUY, opening for RE-ENTRY.`);
      }
    }
    if (macd5351AlignedSell && state.v50_macdCrossEpochSell && !state.v50_initialSellDone) {
      if ((m5BoundaryEpoch - state.v50_macdCrossEpochSell) > 600) {
        state.v50_initialSellDone = true;
        console.log(`[${REPO_LABEL}] MACD (5,35,1) cross SELL window (+/- 2 candles) expired. Bypassing initial SELL, opening for RE-ENTRY.`);
      }
    }

    // Startup recovery if state flags are not initialized
    if (macd5351AlignedBuy && state.v50_initialBuyDone === undefined) {
      state.v50_initialBuyDone = true;
    }
    if (macd5351AlignedSell && state.v50_initialSellDone === undefined) {
      state.v50_initialSellDone = true;
    }

    // Check active trades (differentiate direction to enable Opposite Signal Position Flip)
    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;
    const hasSameDirectionActiveTrade = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === (macd5351AlignedBuy ? "BUY" : "SELL"));

    // Tolerance window: Stoch (25, 1, 1) can cross level 50 up to 2 candles before, at the same time, or up to 2 candles after MACD (5, 35, 1) crosses 0
    const buyToleranceSatisfied = state.v50_macdCrossEpochBuy && state.v50_stoch25CrossEpochBuy &&
      Math.abs(state.v50_macdCrossEpochBuy - state.v50_stoch25CrossEpochBuy) <= 600;
    const sellToleranceSatisfied = state.v50_macdCrossEpochSell && state.v50_stoch25CrossEpochSell &&
      Math.abs(state.v50_macdCrossEpochSell - state.v50_stoch25CrossEpochSell) <= 600;

    const isInitialBuyTrigger = macd5351AlignedBuy && sK2511 !== null && sK2511 > 50.0 &&
      !state.v50_initialBuyDone && buyToleranceSatisfied && (macd5351CrossUpZero || stoch25CrossUp50) &&
      !hasActiveBuy;

    const isInitialSellTrigger = macd5351AlignedSell && sK2511 !== null && sK2511 < 50.0 &&
      !state.v50_initialSellDone && sellToleranceSatisfied && (macd5351CrossDownZero || stoch25CrossDown50) &&
      !hasActiveSell;

    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_INITIAL_MACD_STOCH25 (BUY)`;
      state.v50_initialBuyDone = true;
      state.v50_stoch25_pulled_back_10 = false;
    } else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_INITIAL_MACD_STOCH25 (SELL)`;
      state.v50_initialSellDone = true;
      state.v50_stoch25_pulled_back_90 = false;
    }

    // Re-Entry: MACD (5, 35, 1) aligned & no active trade open + M5 Stoch 25 pulls back and freshly crosses 10 (BUY) / 90 (SELL)
    const lastClosedOrTriggeredEpoch = Math.max(state.lastTriggeredEpoch || 0, state.lastClosedTradeEpoch || 0);
    const isPostTradeCurr = !lastClosedOrTriggeredEpoch || candles[si].epoch > lastClosedOrTriggeredEpoch;

    // Evaluate Re-Entry (allow evaluation if no same-direction trade open, enabling Opposite Signal Position Flip)
    if (!indicatorsSatisfied && isPostTradeCurr) {
      if (macd5351AlignedBuy && Boolean(state.v50_initialBuyDone) && !hasActiveBuy) {
        if ((sK2511 !== null && sK2511 <= 10.5) || (sMinK2511 !== null && sMinK2511 <= 10.5) || (prevK2511 !== null && prevK2511 <= 10.5)) {
          state.v50_stoch25_pulled_back_10 = true;
        } else if (sK2511 !== null && sK2511 >= 50.0) {
          state.v50_stoch25_pulled_back_10 = false;
        }
      }
      if (macd5351AlignedSell && Boolean(state.v50_initialSellDone) && !hasActiveSell) {
        if ((sK2511 !== null && sK2511 >= 89.5) || (sMaxK2511 !== null && sMaxK2511 >= 89.5) || (prevK2511 !== null && prevK2511 >= 89.5)) {
          state.v50_stoch25_pulled_back_90 = true;
        } else if (sK2511 !== null && sK2511 <= 50.0) {
          state.v50_stoch25_pulled_back_90 = false;
        }
      }

      const stoch25CrossUp10 = sK2511 !== null && prevK2511 !== null && (
        (prevK2511 <= 10.0 && sK2511 > 10.0) ||
        (Boolean(state.v50_stoch25_pulled_back_10) && prevK2511 <= 12.0 && sK2511 > 10.0 && sK2511 > prevK2511)
      );

      const stoch25CrossDown90 = sK2511 !== null && prevK2511 !== null && (
        (prevK2511 >= 90.0 && sK2511 < 90.0) ||
        (Boolean(state.v50_stoch25_pulled_back_90) && prevK2511 >= 88.0 && sK2511 < 90.0 && sK2511 < prevK2511)
      );

      const isReentryBuyTrigger = macd5351AlignedBuy && Boolean(state.v50_initialBuyDone) && stoch25CrossUp10;
      const isReentrySellTrigger = macd5351AlignedSell && Boolean(state.v50_initialSellDone) && stoch25CrossDown90;

      if (isReentryBuyTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = `${prefix}_REENTRY_STOCH25_10 (BUY)`;
        state.v50_stoch25_pulled_back_10 = false;
      } else if (isReentrySellTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = `${prefix}_REENTRY_STOCH25_90 (SELL)`;
        state.v50_stoch25_pulled_back_90 = false;
      }
    }

    const isV50Reentry = Boolean(state.v50_initialBuyDone || state.v50_initialSellDone);
    state.isReentryMode = isV50Reentry;

    if (macd5351AlignedBuy) {
      if (!state.v50_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V50 Initial BUY Armed (MACD 5,35,1: ${sMacd5351.toFixed(3)} > 0)`, lvl: currentPrice };
        state.nextPhase = `V50 Initial BUY Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 2 candles`;
      } else {
        const inPullback = Boolean(state.v50_stoch25_pulled_back_10) || (sK2511 !== null && sK2511 <= 10.5) || (sMinK2511 !== null && sMinK2511 <= 10.5);
        if (inPullback) {
          state.armed = { dir: "BUY", lbl: `V50 BUY Pullback Armed (Stoch 25 Touched <= 10, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V50 BUY Re-Entry Armed — Pullback <= 10 Touched (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross > 10`;
        } else {
          state.armed = null;
          state.nextPhase = `V50 Awaiting BUY Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to <= 10 then fresh cross > 10`;
        }
      }
    } else if (macd5351AlignedSell) {
      if (!state.v50_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V50 Initial SELL Armed (MACD 5,35,1: ${sMacd5351.toFixed(3)} < 0)`, lvl: currentPrice };
        state.nextPhase = `V50 Initial SELL Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 2 candles`;
      } else {
        const inPullback = Boolean(state.v50_stoch25_pulled_back_90) || (sK2511 !== null && sK2511 >= 89.5) || (sMaxK2511 !== null && sMaxK2511 >= 89.5);
        if (inPullback) {
          state.armed = { dir: "SELL", lbl: `V50 SELL Pullback Armed (Stoch 25 Touched >= 90, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V50 SELL Re-Entry Armed — Pullback >= 90 Touched (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross < 90`;
        } else {
          state.armed = null;
          state.nextPhase = `V50 Awaiting SELL Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to >= 90 then fresh cross < 90`;
        }
      }
    } else {
      state.armed = null;
      state.nextPhase = "Monitoring MACD (5,35,1) Level 0 Macro Trend Gate";
    }
  }
// 3.5 VOLATILITY 100 (R_100), VOLATILITY 75 (R_75), VOLATILITY 75 (1s) (1HZ75V) & VOLATILITY 25 (1s) (1HZ25V) — STOCH 100 TREND + STOCH (15,1,1) INITIAL (50) & RE-ENTRY (30/70)
  else if (SYMBOL === "R_100" || SYMBOL === "R_75" || SYMBOL === "1HZ75V" || SYMBOL === "1HZ25V" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH15" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
    const prefix = SYMBOL === "R_100" ? "V100" : (SYMBOL === "1HZ25V" ? "V25_1S" : (SYMBOL === "R_75" ? "V75" : "V75_1S"));

    // Macro Trend Definition: Stoch (100, 1, 1) Level 50
    const isV25_1s = SYMBOL === "1HZ25V";
    const buyPullbackLevel = isV25_1s ? 20.0 : 30.0;
    const sellPullbackLevel = isV25_1s ? 80.0 : 70.0;
    const buyPullbackThreshold = isV25_1s ? 20.5 : 30.5;
    const sellPullbackThreshold = isV25_1s ? 79.5 : 69.5;

    const stoch100AlignedBuy = sK100 !== null && sK100 >= 50.0;
    const stoch100AlignedSell = sK100 !== null && sK100 <= 50.0;
    const stoch100CrossUp50 = prevK100 !== null && sK100 !== null && prevK100 <= 50.0 && sK100 > 50.0;
    const stoch100CrossDown50 = prevK100 !== null && sK100 !== null && prevK100 >= 50.0 && sK100 < 50.0;

    // Trigger & Re-entry Indicator: Stoch (15, 1, 1)
    const stoch15CrossUp50 = prevK1511 !== null && sK1511 !== null && prevK1511 <= 50.0 && sK1511 > 50.0;
    const stoch15CrossDown50 = prevK1511 !== null && sK1511 !== null && prevK1511 >= 50.0 && sK1511 < 50.0;

    // Track cross epoch of Stoch 100
    if (stoch100CrossUp50) {
      state.v75_1s_stoch100CrossEpochBuy = m5BoundaryEpoch;
      // Trader Mandate: Don't enter initial trade if Stoch 15 was already above 50 before Stoch 100 crossed.
      // In that case, bypass initial entry and set the bot open for Re-Entry.
      if (prevK1511 !== null && prevK1511 > 50.0) {
        state.v75_1s_initialBuyDone = true;
        console.log(`[${REPO_LABEL}] Stoch 15 was ALREADY above 50 (${prevK1511.toFixed(1)}) before Stoch 100 cross. Bypassing initial BUY, opening for RE-ENTRY.`);
      } else {
        state.v75_1s_initialBuyDone = false;
      }
    }
    if (stoch100CrossDown50) {
      state.v75_1s_stoch100CrossEpochSell = m5BoundaryEpoch;
      // Trader Mandate: Don't enter initial trade if Stoch 15 was already below 50 before Stoch 100 crossed.
      // In that case, bypass initial entry and set the bot open for Re-Entry.
      if (prevK1511 !== null && prevK1511 < 50.0) {
        state.v75_1s_initialSellDone = true;
        console.log(`[${REPO_LABEL}] Stoch 15 was ALREADY below 50 (${prevK1511.toFixed(1)}) before Stoch 100 cross. Bypassing initial SELL, opening for RE-ENTRY.`);
      } else {
        state.v75_1s_initialSellDone = false;
      }
    }

    // Startup recovery if state flags are not initialized
    if (stoch100AlignedBuy && state.v75_1s_initialBuyDone === undefined) {
      if (sK1511 !== null && sK1511 > 50.0) state.v75_1s_initialBuyDone = true;
      else state.v75_1s_initialBuyDone = false;
    }
    if (stoch100AlignedSell && state.v75_1s_initialSellDone === undefined) {
      if (sK1511 !== null && sK1511 < 50.0) state.v75_1s_initialSellDone = true;
      else state.v75_1s_initialSellDone = false;
    }

    // Reset initial & pullback flags upon macro trend dealignment
    if (!stoch100AlignedBuy) {
      state.v75_1s_stoch100CrossEpochBuy = null;
      state.v75_1s_initialBuyDone = false;
      state.v75_1s_stoch15_pulled_back_30 = false;
      state.v75_1s_stoch15_pulled_back_20 = false;
    }
    if (!stoch100AlignedSell) {
      state.v75_1s_stoch100CrossEpochSell = null;
      state.v75_1s_initialSellDone = false;
      state.v75_1s_stoch15_pulled_back_70 = false;
      state.v75_1s_stoch15_pulled_back_80 = false;
    }

    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;

    // A. Initial Entry Triggers (Strictly Stoch 100 + Stoch 15,1,1 fresh 50 cross, NO EMA filter)
    const isInitialBuyTrigger = stoch100AlignedBuy && !state.v75_1s_initialBuyDone && stoch15CrossUp50 && !hasActiveBuy;
    const isInitialSellTrigger = stoch100AlignedSell && !state.v75_1s_initialSellDone && stoch15CrossDown50 && !hasActiveSell;

    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_INITIAL_STOCH100_STOCH15 (BUY)`;
      state.v75_1s_initialBuyDone = true;
      state.v75_1s_stoch15_pulled_back_30 = false;
      state.v75_1s_stoch15_pulled_back_20 = false;
    } else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_INITIAL_STOCH100_STOCH15 (SELL)`;
      state.v75_1s_initialSellDone = true;
      state.v75_1s_stoch15_pulled_back_70 = false;
      state.v75_1s_stoch15_pulled_back_80 = false;
    }

    // B. Re-Entry Triggers (Stoch 100 aligned + Stoch 15,1,1 touches <= 20/30 / >= 80/70 including High/Low wick touch, then crosses back; V25-1s filtered by MACD (5,35,1))
    const lastClosedOrTriggeredEpoch = Math.max(state.lastTriggeredEpoch || 0, state.lastClosedTradeEpoch || 0);
    const isPostTradePrev = !lastClosedOrTriggeredEpoch || candles[si - 1].epoch >= lastClosedOrTriggeredEpoch;
    const isPostTradeCurr = !lastClosedOrTriggeredEpoch || candles[si].epoch > lastClosedOrTriggeredEpoch;
    const isBullishCurr = parseFloat(candles[si].close) > parseFloat(candles[si].open);
    const isBearishCurr = parseFloat(candles[si].close) < parseFloat(candles[si].open);

    if (!indicatorsSatisfied && isPostTradeCurr) {
      const buyTouchedPrev = isPostTradePrev && ((prevK1511 !== null && prevK1511 <= buyPullbackThreshold) || (prevMinK1511 !== null && prevMinK1511 <= buyPullbackThreshold));
      const buyClosedCurr = sK1511 !== null && sK1511 <= buyPullbackThreshold;
      const sellTouchedPrev = isPostTradePrev && ((prevK1511 !== null && prevK1511 >= sellPullbackThreshold) || (prevMaxK1511 !== null && prevMaxK1511 >= sellPullbackThreshold));
      const sellClosedCurr = sK1511 !== null && sK1511 >= sellPullbackThreshold;

      const pullbackArmedFlagBuy = isV25_1s ? "v75_1s_stoch15_pulled_back_20" : "v75_1s_stoch15_pulled_back_30";
      const pullbackArmedFlagSell = isV25_1s ? "v75_1s_stoch15_pulled_back_80" : "v75_1s_stoch15_pulled_back_70";

      if (stoch100AlignedBuy && Boolean(state.v75_1s_initialBuyDone)) {
        if (buyTouchedPrev || buyClosedCurr) {
          state[pullbackArmedFlagBuy] = true;
        } else if (sK1511 !== null && sK1511 >= (isV25_1s ? 50.0 : 65.0)) {
          state[pullbackArmedFlagBuy] = false;
        }
      }
      if (stoch100AlignedSell && Boolean(state.v75_1s_initialSellDone)) {
        if (sellTouchedPrev || sellClosedCurr) {
          state[pullbackArmedFlagSell] = true;
        } else if (sK1511 !== null && sK1511 <= (isV25_1s ? 50.0 : 35.0)) {
          state[pullbackArmedFlagSell] = false;
        }
      }

      const stoch15CrossUpBuy =
        sK1511 !== null && prevK1511 !== null && sK1511 > buyPullbackLevel && sK1511 > prevK1511 && (
          Boolean(state[pullbackArmedFlagBuy]) ||
          buyTouchedPrev ||
          (sMinK1511 !== null && sMinK1511 <= buyPullbackThreshold && prevK1511 <= (isV25_1s ? 35.0 : 45.0) && isBullishCurr)
        );

      const stoch15CrossDownSell =
        sK1511 !== null && prevK1511 !== null && sK1511 < sellPullbackLevel && sK1511 < prevK1511 && (
          Boolean(state[pullbackArmedFlagSell]) ||
          sellTouchedPrev ||
          (sMaxK1511 !== null && sMaxK1511 >= sellPullbackThreshold && prevK1511 >= (isV25_1s ? 65.0 : 55.0) && isBearishCurr)
        );

      // MACD (5, 35, 1) Filter for Re-Entry trades on V25 (1s) (BUY blocked if MACD <= 0, SELL blocked if MACD >= 0)
      const macdFilterBuyPassed = !isV25_1s || (sMacd5351 !== null && sMacd5351 > 0.0);
      const macdFilterSellPassed = !isV25_1s || (sMacd5351 !== null && sMacd5351 < 0.0);

      const isReentryBuyTrigger = stoch100AlignedBuy && Boolean(state.v75_1s_initialBuyDone) && stoch15CrossUpBuy;
      const isReentrySellTrigger = stoch100AlignedSell && Boolean(state.v75_1s_initialSellDone) && stoch15CrossDownSell;

      if (isReentryBuyTrigger) {
        if (macdFilterBuyPassed) {
          indicatorsSatisfied = true;
          signalDirection = "BUY";
          setupLabel = isV25_1s ? `${prefix}_REENTRY_STOCH15_20 (BUY)` : `${prefix}_REENTRY_STOCH15_30 (BUY)`;
          state[pullbackArmedFlagBuy] = false;
          state.blockerReason = null;
        } else {
          state.blockerReason = `V25 (1s) BUY Re-Entry blocked: MACD (5,35,1) is ${sMacd5351 !== null ? sMacd5351.toFixed(3) : 'null'} <= 0`;
          console.log(`[${REPO_LABEL}] ⚠️ BUY Re-Entry triggered but BLOCKED by MACD (5,35,1) filter (${sMacd5351 !== null ? sMacd5351.toFixed(3) : 'N/A'} <= 0). Trade prevented.`);
        }
      } else if (isReentrySellTrigger) {
        if (macdFilterSellPassed) {
          indicatorsSatisfied = true;
          signalDirection = "SELL";
          setupLabel = isV25_1s ? `${prefix}_REENTRY_STOCH15_80 (SELL)` : `${prefix}_REENTRY_STOCH15_70 (SELL)`;
          state[pullbackArmedFlagSell] = false;
          state.blockerReason = null;
        } else {
          state.blockerReason = `V25 (1s) SELL Re-Entry blocked: MACD (5,35,1) is ${sMacd5351 !== null ? sMacd5351.toFixed(3) : 'null'} >= 0`;
          console.log(`[${REPO_LABEL}] ⚠️ SELL Re-Entry triggered but BLOCKED by MACD (5,35,1) filter (${sMacd5351 !== null ? sMacd5351.toFixed(3) : 'N/A'} >= 0). Trade prevented.`);
        }
      }
    }

    // Telemetry updates for dashboard
    const isV75Reentry = Boolean(state.v75_1s_initialBuyDone || state.v75_1s_initialSellDone);
    state.isReentryMode = isV75Reentry;
    const v75Tag = SYMBOL === "R_100" ? "V100" : (SYMBOL === "1HZ25V" ? "V25-1s" : (SYMBOL === "R_75" ? "V75" : "V75-1s"));

    if (stoch100AlignedBuy) {
      if (!state.v75_1s_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `${v75Tag} Initial BUY Armed (Stoch 100: ${sK100.toFixed(1)} > 50)`, lvl: currentPrice };
        state.nextPhase = `${v75Tag} Initial BUY Armed — Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) fresh cross > 50`;
      } else {
        const inPullback = isV25_1s
          ? (Boolean(state.v75_1s_stoch15_pulled_back_20) || (sK1511 !== null && sK1511 <= 20.5) || (sMinK1511 !== null && sMinK1511 <= 20.5))
          : (Boolean(state.v75_1s_stoch15_pulled_back_30) || (sK1511 !== null && sK1511 <= 30.5) || (sMinK1511 !== null && sMinK1511 <= 30.5));
        const macdStatus = isV25_1s ? ` [MACD: ${sMacd5351 !== null ? sMacd5351.toFixed(2) : 'N/A'}${sMacd5351 !== null && sMacd5351 > 0 ? ' > 0 ✓' : ' <= 0 ✗'}]` : '';
        if (inPullback) {
          state.armed = { dir: "BUY", lbl: `${v75Tag} BUY Pullback Armed (Stoch 15 Touched <= ${buyPullbackLevel}, %K: ${sK1511 !== null ? sK1511.toFixed(1) : "N/A"})${macdStatus}`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `${v75Tag} BUY Re-Entry Armed — Pullback <= ${buyPullbackLevel} Touched (%K: ${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}). Await Close > ${buyPullbackLevel}${isV25_1s ? ' & MACD > 0' : ''}`;
        } else {
          state.armed = null;
          state.nextPhase = `${v75Tag} Awaiting BUY Re-Entry — Await Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) High/Low or Close touch <= ${buyPullbackLevel} then cross > ${buyPullbackLevel}${isV25_1s ? ' (MACD > 0 required)' : ''}`;
        }
      }
    } else if (stoch100AlignedSell) {
      if (!state.v75_1s_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `${v75Tag} Initial SELL Armed (Stoch 100: ${sK100.toFixed(1)} < 50)`, lvl: currentPrice };
        state.nextPhase = `${v75Tag} Initial SELL Armed — Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) fresh cross < 50`;
      } else {
        const inPullback = isV25_1s
          ? (Boolean(state.v75_1s_stoch15_pulled_back_80) || (sK1511 !== null && sK1511 >= 79.5) || (sMaxK1511 !== null && sMaxK1511 >= 79.5))
          : (Boolean(state.v75_1s_stoch15_pulled_back_70) || (sK1511 !== null && sK1511 >= 69.5) || (sMaxK1511 !== null && sMaxK1511 >= 69.5));
        const macdStatus = isV25_1s ? ` [MACD: ${sMacd5351 !== null ? sMacd5351.toFixed(2) : 'N/A'}${sMacd5351 !== null && sMacd5351 < 0 ? ' < 0 ✓' : ' >= 0 ✗'}]` : '';
        if (inPullback) {
          state.armed = { dir: "SELL", lbl: `${v75Tag} SELL Pullback Armed (Stoch 15 Touched >= ${sellPullbackLevel}, %K: ${sK1511 !== null ? sK1511.toFixed(1) : "N/A"})${macdStatus}`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `${v75Tag} SELL Re-Entry Armed — Pullback >= ${sellPullbackLevel} Touched (%K: ${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}). Await Close < ${sellPullbackLevel}${isV25_1s ? ' & MACD < 0' : ''}`;
        } else {
          state.armed = null;
          state.nextPhase = `${v75Tag} Awaiting SELL Re-Entry — Await Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) High/Low or Close touch >= ${sellPullbackLevel} then cross < ${sellPullbackLevel}${isV25_1s ? ' (MACD < 0 required)' : ''}`;
        }
      }
    } else {
      state.armed = null;
      state.nextPhase = "Monitoring Stoch (100,1,1) Level 50 Macro Trend Gate";
    }
  }
    // 3.6 VOLATILITY 10 (R_10 TEST BOT) — STOCH (50,1,1) MACRO TREND + STOCH (25,1,1) TRIGGER & RE-ENTRY
  else if (SYMBOL === "R_10" || STRATEGY_PROFILE === "PROFILE_V10_STOCH50_STOCH25") {
    const prefix = "V10";

    // Macro Trend Definition: Stoch (50, 1, 1 Simple) Level 50 Gate
    const stoch50AlignedBuy = sK50 !== null && sK50 > 50.0;
    const stoch50AlignedSell = sK50 !== null && sK50 < 50.0;
    const stoch50CrossUp50 = prevK50 !== null && sK50 !== null && prevK50 <= 50.0 && sK50 > 50.0;
    const stoch50CrossDown50 = prevK50 !== null && sK50 !== null && prevK50 >= 50.0 && sK50 < 50.0;

    // Trigger & Re-entry Indicator: Stoch (25, 1, 1 Simple)
    const stoch25CrossUp50 = prevK2511 !== null && sK2511 !== null && prevK2511 <= 50.0 && sK2511 > 50.0;
    const stoch25CrossDown50 = prevK2511 !== null && sK2511 !== null && prevK2511 >= 50.0 && sK2511 < 50.0;

    // Track cross epoch of Stoch (50, 1, 1)
    if (stoch50CrossUp50) {
      state.v10_stoch50CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch50CrossDown50) {
      state.v10_stoch50CrossEpochSell = m5BoundaryEpoch;
    }

    // Track cross epoch of Stoch (25, 1, 1)
    if (stoch25CrossUp50) {
      state.v10_stoch25CrossEpochBuy = m5BoundaryEpoch;
    }
    if (stoch25CrossDown50) {
      state.v10_stoch25CrossEpochSell = m5BoundaryEpoch;
    }

    // Reset flags upon macro trend dealignment (DO NOT wipe stoch25 cross epochs here; they allow Stoch to cross 2 candles BEFORE Stoch 50)
    if (!stoch50AlignedBuy) {
      state.v10_stoch50CrossEpochBuy = null;
      state.v10_initialBuyDone = false;
      state.v10_stoch25_pulled_back = false;
    }
    if (!stoch50AlignedSell) {
      state.v10_stoch50CrossEpochSell = null;
      state.v10_initialSellDone = false;
      state.v10_stoch25_pulled_back = false;
    }
    // Expire Stoch 25 cross epochs only after 2 candles (600s) or on opposite cross
    if (state.v10_stoch25CrossEpochBuy && ((m5BoundaryEpoch - state.v10_stoch25CrossEpochBuy) > 600 || stoch25CrossDown50)) {
      state.v10_stoch25CrossEpochBuy = null;
    }
    if (state.v10_stoch25CrossEpochSell && ((m5BoundaryEpoch - state.v10_stoch25CrossEpochSell) > 600 || stoch25CrossUp50)) {
      state.v10_stoch25CrossEpochSell = null;
    }

    // If tolerance window (+/- 2 candles = 600 seconds) has elapsed since Stoch 50 crossed without Stoch 25 matching,
    // bypass initial entry and mark initial done to open Re-Entry mode.
    if (stoch50AlignedBuy && state.v10_stoch50CrossEpochBuy && !state.v10_initialBuyDone) {
      if ((m5BoundaryEpoch - state.v10_stoch50CrossEpochBuy) > 600) {
        state.v10_initialBuyDone = true;
        console.log(`[${REPO_LABEL}] Stoch (50,1,1) cross BUY window (+/- 2 candles) expired. Bypassing initial BUY, opening for RE-ENTRY.`);
      }
    }
    if (stoch50AlignedSell && state.v10_stoch50CrossEpochSell && !state.v10_initialSellDone) {
      if ((m5BoundaryEpoch - state.v10_stoch50CrossEpochSell) > 600) {
        state.v10_initialSellDone = true;
        console.log(`[${REPO_LABEL}] Stoch (50,1,1) cross SELL window (+/- 2 candles) expired. Bypassing initial SELL, opening for RE-ENTRY.`);
      }
    }

    // Startup recovery if state flags are not initialized
    if (stoch50AlignedBuy && state.v10_initialBuyDone === undefined) {
      state.v10_initialBuyDone = true;
    }
    if (stoch50AlignedSell && state.v10_initialSellDone === undefined) {
      state.v10_initialSellDone = true;
    }

    // Check active trades (differentiate direction to enable Opposite Signal Position Flip)
    const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
    const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");
    const noActiveTrades = !hasActiveBuy && !hasActiveSell;
    const hasSameDirectionActiveTrade = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === (stoch50AlignedBuy ? "BUY" : "SELL"));

    // Tolerance window: Stoch (25, 1, 1) can cross level 50 up to 2 candles before, at the same time, or up to 2 candles after Stoch (50, 1, 1) crosses 50
    const buyToleranceSatisfied = state.v10_stoch50CrossEpochBuy && state.v10_stoch25CrossEpochBuy &&
      Math.abs(state.v10_stoch50CrossEpochBuy - state.v10_stoch25CrossEpochBuy) <= 600;
    const sellToleranceSatisfied = state.v10_stoch50CrossEpochSell && state.v10_stoch25CrossEpochSell &&
      Math.abs(state.v10_stoch50CrossEpochSell - state.v10_stoch25CrossEpochSell) <= 600;

    const isInitialBuyTrigger = stoch50AlignedBuy && sK2511 !== null && sK2511 > 50.0 &&
      !state.v10_initialBuyDone && buyToleranceSatisfied && (stoch50CrossUp50 || stoch25CrossUp50) &&
      !hasActiveBuy;

    const isInitialSellTrigger = stoch50AlignedSell && sK2511 !== null && sK2511 < 50.0 &&
      !state.v10_initialSellDone && sellToleranceSatisfied && (stoch50CrossDown50 || stoch25CrossDown50) &&
      !hasActiveSell;

    if (isInitialBuyTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_INITIAL_STOCH50_STOCH25 (BUY)`;
      state.v10_initialBuyDone = true;
      state.v10_stoch25_pulled_back = false;
    } else if (isInitialSellTrigger) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${prefix}_INITIAL_STOCH50_STOCH25 (SELL)`;
      state.v10_initialSellDone = true;
      state.v10_stoch25_pulled_back = false;
    }

    // Re-Entry: Stoch (50, 1, 1) aligned & no active trade open + M5 Stoch 25 pulls back and freshly crosses Level 50
    const lastClosedOrTriggeredEpoch = Math.max(state.lastTriggeredEpoch || 0, state.lastClosedTradeEpoch || 0);
    const isPostTradeCurr = !lastClosedOrTriggeredEpoch || candles[si].epoch > lastClosedOrTriggeredEpoch;

    // Evaluate Re-Entry (allow evaluation if no same-direction trade open, enabling Opposite Signal Position Flip)
    if (!indicatorsSatisfied && isPostTradeCurr) {
      if (stoch50AlignedBuy && Boolean(state.v10_initialBuyDone) && !hasActiveBuy) {
        if ((sK2511 !== null && sK2511 <= 50.0) || (sMinK2511 !== null && sMinK2511 <= 50.0) || (prevK2511 !== null && prevK2511 <= 50.0)) {
          state.v10_stoch25_pulled_back = true;
        }
      }
      if (stoch50AlignedSell && Boolean(state.v10_initialSellDone) && !hasActiveSell) {
        if ((sK2511 !== null && sK2511 >= 50.0) || (sMaxK2511 !== null && sMaxK2511 >= 50.0) || (prevK2511 !== null && prevK2511 >= 50.0)) {
          state.v10_stoch25_pulled_back = true;
        }
      }

      const stoch25CrossUp50Reentry = sK2511 !== null && prevK2511 !== null && prevK2511 <= 50.0 && sK2511 > 50.0 && Boolean(state.v10_stoch25_pulled_back);
      const stoch25CrossDown50Reentry = sK2511 !== null && prevK2511 !== null && prevK2511 >= 50.0 && sK2511 < 50.0 && Boolean(state.v10_stoch25_pulled_back);

      const isReentryBuyTrigger = stoch50AlignedBuy && Boolean(state.v10_initialBuyDone) && stoch25CrossUp50Reentry;
      const isReentrySellTrigger = stoch50AlignedSell && Boolean(state.v10_initialSellDone) && stoch25CrossDown50Reentry;

      if (isReentryBuyTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
        setupLabel = `${prefix}_REENTRY_STOCH25_50 (BUY)`;
        state.v10_stoch25_pulled_back = false;
      } else if (isReentrySellTrigger) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
        setupLabel = `${prefix}_REENTRY_STOCH25_50 (SELL)`;
        state.v10_stoch25_pulled_back = false;
      }
    }

    const isV10Reentry = Boolean(state.v10_initialBuyDone || state.v10_initialSellDone);
    state.isReentryMode = isV10Reentry;

    if (stoch50AlignedBuy) {
      if (!state.v10_initialBuyDone) {
        state.armed = { dir: "BUY", lbl: `V10 Initial BUY Armed (Stoch 50: ${sK50.toFixed(1)} > 50)`, lvl: currentPrice };
        state.nextPhase = `V10 Initial BUY Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 2 candles`;
      } else {
        const inPullback = Boolean(state.v10_stoch25_pulled_back) || (sK2511 !== null && sK2511 <= 50.0) || (sMinK2511 !== null && sMinK2511 <= 50.0);
        if (inPullback) {
          state.armed = { dir: "BUY", lbl: `V10 BUY Pullback Armed (Stoch 25 in Pullback <= 50, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V10 BUY Re-Entry Armed — Pullback <= 50 Active (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross > 50`;
        } else {
          state.armed = null;
          state.nextPhase = `V10 Awaiting BUY Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to <= 50 then fresh cross > 50`;
        }
      }
    } else if (stoch50AlignedSell) {
      if (!state.v10_initialSellDone) {
        state.armed = { dir: "SELL", lbl: `V10 Initial SELL Armed (Stoch 50: ${sK50.toFixed(1)} < 50)`, lvl: currentPrice };
        state.nextPhase = `V10 Initial SELL Armed — Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 2 candles`;
      } else {
        const inPullback = Boolean(state.v10_stoch25_pulled_back) || (sK2511 !== null && sK2511 >= 50.0) || (sMaxK2511 !== null && sMaxK2511 >= 50.0);
        if (inPullback) {
          state.armed = { dir: "SELL", lbl: `V10 SELL Pullback Armed (Stoch 25 in Pullback >= 50, %K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"})`, type: "RE_ENTRY", lvl: currentPrice };
          state.nextPhase = `V10 SELL Re-Entry Armed — Pullback >= 50 Active (%K: ${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}). Await Cross < 50`;
        } else {
          state.armed = null;
          state.nextPhase = `V10 Awaiting SELL Re-Entry — Await Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback to >= 50 then fresh cross < 50`;
        }
      }
    } else {
      state.armed = null;
      state.nextPhase = "Monitoring Stoch (50,1,1) Level 50 Macro Trend Gate";
    }

    state.v10_stoch50 = sK50 !== null ? parseFloat(sK50.toFixed(1)) : null;
    state.v10_stoch25 = sK2511 !== null ? parseFloat(sK2511.toFixed(1)) : null;
    state.stoch50Val = sK50 !== null ? parseFloat(sK50.toFixed(1)) : null;
    state.stoch2511Val = sK2511 !== null ? parseFloat(sK2511.toFixed(1)) : null;
  }
  else if ((STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" || STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR" || STRATEGY_PROFILE === "PROFILE_V25_EMA_STOCH15") && SYMBOL !== "R_25") {
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

    // ── USER MANDATE: FREE RE-ENTRY DEADLOCK ──
    // If the bot could not take the initial entry, but initial entry trigger Stoch (30, 2, 5 Simple) crosses 50,
    // or if Stoch 100 has been aligned and Stoch 30 is already beyond 50, unlock re-entries immediately so the bot is able to take re-entries.
    if (stoch30CrossUp50 && !state.v25_initialBuyDone) {
      console.log(`[${REPO_LABEL}] Stoch (30,2,5) crossed 50 UP. Unlocking BUY re-entry.`);
      state.v25_initialBuyDone = true;
    }
    if (stoch30CrossDown50 && !state.v25_initialSellDone) {
      console.log(`[${REPO_LABEL}] Stoch (30,2,5) crossed 50 DOWN. Unlocking SELL re-entry.`);
      state.v25_initialSellDone = true;
    }
    if (stoch100AlignedBuy && stoch30AlignedBuy && !buyWithin3Candles && !state.v25_initialBuyDone) {
      console.log(`[${REPO_LABEL}] Macro BUY trend active, timing window elapsed. Unlocking BUY re-entry.`);
      state.v25_initialBuyDone = true;
    }
    if (stoch100AlignedSell && stoch30AlignedSell && !sellWithin3Candles && !state.v25_initialSellDone) {
      console.log(`[${REPO_LABEL}] Macro SELL trend active, timing window elapsed. Unlocking SELL re-entry.`);
      state.v25_initialSellDone = true;
    }

    // Re-Entry BUY Trigger: While Stoch 100 aligned > 50, Price > BB 20 Mid, initialBuyDone, %K touched/crossed <= 50, fresh %K cross %D up
    if (!indicatorsSatisfied && stoch100AlignedBuy && emaBaselineBuy && Boolean(state.v25_initialBuyDone) && touched50Buy && kCrossUpD && noActiveTrades) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${prefix}_REENTRY_STOCH302515_TOUCH50_CROSS_D (BUY)`;
      state.v25_stoch302515_touched_50_BUY = false;
    }
    // Re-Entry SELL Trigger: While Stoch 100 aligned < 50, Price < BB 20 Mid, initialSellDone, %K touched/crossed >= 50, fresh %K cross %D down
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

    // Universal EMA 100 Filter: BUY only if Price > BB 20 Mid; SELL only if Price < BB 20 Mid
    const emaBaselineBuy = currentEma100 !== null && currentPrice > currentEma100;
    const emaBaselineSell = currentEma100 !== null && currentPrice < currentEma100;

    // 1. Initial Entry Rule: Stoch (15,2,5) freshly crosses Level 50.0 after Condition 1 is already armed & Price conforms to EMA 100
    const stoch15FreshCross50Buy = prevK1525 !== null && sK1525 !== null && prevK1525 <= 50.0 && sK1525 > 50.0;
    const stoch15FreshCross50Sell = prevK1525 !== null && sK1525 !== null && prevK1525 >= 50.0 && sK1525 < 50.0;
    const isV50InitialBuy = cond1AlreadyArmedBuy && emaBaselineBuy && !state.v50_initialBuyDone && stoch15FreshCross50Buy && noActiveTrades;
    const isV50InitialSell = cond1AlreadyArmedSell && emaBaselineSell && !state.v50_initialSellDone && stoch15FreshCross50Sell && noActiveTrades;

    // 2. Re-Entry Rule: Stoch (15,2,5) freshly crosses Level 25.0 (BUY with Price > BB 20 Mid) or Level 75.0 (SELL with Price < BB 20 Mid)
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
          activeTrade.exitReason = `Opposite Signal Position Flip (${direction})`;
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

    const isDynamicRunner = (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || SYMBOL === "R_100" || STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES" || SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533" || SYMBOL === "1HZ100V" || STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" || SYMBOL === "1HZ25V") && SYMBOL !== "R_100" && SYMBOL !== "1HZ25V" && SYMBOL !== "R_25" && SYMBOL !== "R_50" && SYMBOL !== "1HZ75V" && SYMBOL !== "R_75" && SYMBOL !== "R_10";
    if (SYMBOL === "R_100" || SYMBOL === "1HZ25V") {
      const tpPoints10 = 10.00 / CTRADER_LOT_SIZE; // 10.00 pts on R_100 (1.00 lot) / 2000.00 pts on 1HZ25V (0.005 lots) = $10.00 Hard TP
      fibTpPrice = direction === "BUY" ? parseFloat((entry + tpPoints10).toFixed(2)) : parseFloat((entry - tpPoints10).toFixed(2));
    } else if (SYMBOL === "R_25" || SYMBOL === "R_10") {
      const tpPoints5 = 5.00 / CTRADER_LOT_SIZE; // 10.00 pts on R_25 / R_10 (0.50 lots) = $5.00 Hard Broker TP
      fibTpPrice = direction === "BUY" ? parseFloat((entry + tpPoints5).toFixed(2)) : parseFloat((entry - tpPoints5).toFixed(2));
    } else if (SYMBOL === "R_50") {
      const tpPoints3 = 3.00 / CTRADER_LOT_SIZE; // 0.75 pts on R_50 (4.00 lots) = $3.00 Hard Broker TP
      fibTpPrice = direction === "BUY" ? parseFloat((entry + tpPoints3).toFixed(4)) : parseFloat((entry - tpPoints3).toFixed(4));
    } else if (SYMBOL === "1HZ75V" || SYMBOL === "R_75") {
      const v75TpPoints = 3.50 / CTRADER_LOT_SIZE; // 70.00 pts on 1HZ75V (0.05 lots) / 350.00 pts on R_75 (0.01 lots) = $3.50 Standard TP
      fibTpPrice = direction === "BUY" ? parseFloat((entry + v75TpPoints).toFixed(2)) : parseFloat((entry - v75TpPoints).toFixed(2));
    } else if (isDynamicRunner) {
      fibTpPrice = null;
      // Clean entryType maintained
    } else {
      if (!fibTpPrice || (direction === "BUY" && minRequiredTp > fibTpPrice)) {
        fibTpPrice = minRequiredTp; // Clean entryType maintained
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
    if (SYMBOL === "1HZ75V" || SYMBOL === "R_75" || SYMBOL === "R_100" || SYMBOL === "R_25" || SYMBOL === "R_50" || SYMBOL === "1HZ25V") {
      sl = slCapPrice;
    } else if (PROFILE.slType === "HARD_POINTS") {
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
    if (STRATEGY_PROFILE === "PROFILE_V25_1S_STOCH200_STOCH15" && SYMBOL !== "1HZ25V") {
      confluenceLines += `• M5 Stoch 200 (45/55): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">55 [BULLISH TREND]" : "<45 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit)\n` +
                         `• Early Invalidation: *3 Adverse M5 Closes / Stoch 200 Invalidation / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH" || STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (30,2,5 Simple): *${(sK3025 !== null ? sK3025.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [TRIGGER ARMED]" : "<50 [TRIGGER ARMED]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 Fast Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Pullback Exit" : "<80 Pullback Exit"})\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Invalidation: *3 Adverse M5 Closes / Stoch 200 Invalidation / Closed-M5 Stoch (15,2,5) Lvl 50 Cross*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V75_EMA_STOCH15") {
      confluenceLines += `• M5 Price vs BB 20 Mid/200: *Price (${entry.toFixed(2)}) ${direction === "BUY" ? ">" : "<"} EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}) | EMA 200 (${currentEma200 ? currentEma200.toFixed(2) : "N/A"})*\n` +
                         `• Setup Mode: *${setupLabel}*\n` +
                         `• M5 Stoch (15,2,5 Simple): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")} (prev: ${(prevK !== null ? prevK.toFixed(1) : "N/A")})* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* [FRESH LEVEL CROSS TRIGGERED]\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(2) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Stop)\n` +
                         `• Early Exit Engine: *Loss Protection (%K/%D Cross) / Closed-M5 Stoch 50 Cross / Entry-Hour H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" && SYMBOL !== "R_25") {
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})
` +
                         `• M5 Stoch (30,2,5 Simple): *${(sK3025 !== null ? sK3025.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [TRIGGER ARMED]" : "<50 [TRIGGER ARMED]"})
` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})
` +
                         `• M5 Re-Entry Stoch (30,25,15 Simple): *%K ${(sK302515 !== null ? sK302515.toFixed(1) : "N/A")}* | *%D ${(sD302515 !== null ? sD302515.toFixed(1) : "N/A")}*
` +
                         `• Trigger Type: *${setupLabel}*
` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min ${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)
` +
                         `• Early Invalidation: *3 Consecutive Adverse M5 Closes / Stoch 100 Invalidation Exit / Entry-Hour H1 Adverse Close*
`;
    } else if (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH25") {
      const tpDesc = `${tpPrice ? tpPrice.toFixed(2) : "Hard $5.00 TP"} ($5.00 Hard Broker TP)`;
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (25,1,1): *%K ${(sK2511 !== null ? sK2511.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpDesc}*\n• Trade Management: *Hard TP $5.00 | Software SL -$3.50 | Sequential Stoch (25,1,1) Rule 1 (Lvl 50 -> +$0.30 SL) & Rule 2 (Lvl 50 Reversal Exit)*\n`;
    } else if (SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V50_MACD_STOCH25") {
      const tpDesc = `${tpPrice ? tpPrice.toFixed(2) : "Hard $3.00 TP"} ($3.00 Hard Broker TP)`;
      confluenceLines += `• M5 MACD (5,35,1): *${(sMacd5351 !== null && sMacd5351 !== undefined ? sMacd5351.toFixed(4) : "N/A")}* (${direction === "BUY" ? ">0 [BULLISH TREND]" : "<0 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (25,1,1): *%K ${(sK2511 !== null ? sK2511.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpDesc}*\n• Trade Management: *Hard TP $3.00 | Software SL -$2.50 | Sequential Stoch (25,1,1) Rule 1 (Lvl 50 -> +$0.30 SL) & Rule 2 (Lvl 50 Reversal Exit)*\n`;
    } else if (SYMBOL === "R_100" || SYMBOL === "1HZ25V" || SYMBOL === "R_75" || SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH15" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
      const tpDesc = (SYMBOL === "R_100" || SYMBOL === "1HZ25V")
        ? `${tpPrice ? tpPrice.toFixed(2) : "Hard $10.00 TP"} ($10.00 Hard Broker TP)`
        : `${tpPrice ? tpPrice.toFixed(2) : "Standard $3.50 TP"} ($3.50 Standard TP — 2 Wins = $7.00 Daily Target)`;
      confluenceLines += `• M5 Stoch 100: *${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (15,1,1): *%K ${(sK1511 !== null ? sK1511.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Take Profit Target: *${tpDesc}*\n• Trade Management: *Stoch (15,1,1) Level 80 (BUY) / Level 20 (SELL) Touch moves Software SL to +$0.30; Level 50 Cross Immediate Exit*\n`;
    } else if (SYMBOL === "R_10" || STRATEGY_PROFILE === "PROFILE_V10_STOCH50_STOCH25") {
      confluenceLines += `• M5 Stoch (50,1,1): *${(sK50 !== null ? sK50.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH TREND]" : "<50 [BEARISH TREND]"})\n` +
                         `• M5 Stoch (25,1,1): *%K ${(sK2511 !== null ? sK2511.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel}*\n` +
                         `• Profit Target: *Software TP $3.50 (Broker Hard TP $5.00)*\n` +
                         `• Protection: *Software SL -$3.50 (Broker Hard SL -$5.00) / Rule 1 Entry Candle High-Low Close / Rule 2 Stoch 25 Extreme Touch & Midline Exit*\n`;
    } else if (SYMBOL === "R_100") {
      confluenceLines += `• M5 Stoch 200 (48/52): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">48 [BULLISH TREND]" : "<52 [BEARISH TREND]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• Profit Exit Engine: *Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit / Hard Broker TP $10.00*\n` +
                         `• Protection: *Software SL -$4.00 / Opposite M5 Fractal / H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV" && SYMBOL === "R_100")) {
      confluenceLines += `• M5 Stoch 200 (48/52): *${(sK200 !== null ? sK200.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">48 [BULLISH TREND]" : "<52 [BEARISH TREND]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel})\n` +
                         `• Early Exits: *Opposite M5 Fractal Exit / Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit*\n` +
                         `• Take Profit: *Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH200_CCI100" || STRATEGY_PROFILE === "PROFILE_V25_STOCH45_VALIDATOR") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 CCI 100: *${(cVal !== null ? cVal.toFixed(1) : "N/A")}* | M5 Stoch (15,2,5): *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}*\n` +
                         `• Trigger Type: *${setupLabel || "STANDARD"}*\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break / Stoch 200 / Closed-M5 Stoch (15,2,5) Lvl 50 Cross / H1 Adverse Close*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH200_CCI150" || STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 Stoch (15,2,5) Trigger: *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel || "STANDARD"})\n` +
                         `• Take Profit: *Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit*\n` +
                         `• Early Exit Engine: *Previous M5 Fractal Break / Stoch 200 / Stoch (15,1,1) Level 50 Profit Exit*\n`;
    } else {
      confluenceLines += `• M5 Stoch (200,1,1) Trend: *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">=50 [BULLISH ARMED]" : "<=50 [BEARISH ARMED]"})\n` +
                         `• M5 BB 20 Mid: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > BB 20 Mid" : "Price < BB 20 Mid"})\n` +
                         `• M5 Stoch (15,2,5) Trigger: *%K ${(sK1525 !== null ? sK1525.toFixed(1) : "N/A")}* | *%D ${(sD1525 !== null ? sD1525.toFixed(1) : "N/A")}* (${setupLabel || "STANDARD"})\n` +
                         `• Take Profit Target: *${tpPrice ? tpPrice.toFixed(4) : "Dynamic Runner"}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n` +
                         `• Early Exit Engine: *Previous M5 Fractal (${initialM5Fractal ? initialM5Fractal.toFixed(2) : "N/A"}) Break / Stoch 200 / Closed-M5 Stoch (15,2,5) Lvl 50 Cross / H1 Adverse Close*\n`;
    }
    confluenceLines += `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)}*`;

    const message = 
      `🚨 *[ENTRY SIGNAL] ${SYMBOL_NAME.toUpperCase()} — ${REPO_LABEL}* 🚨\n\n` +
      `• Direction: *${dirEmoji}*\n` +
      `• Strategy: *${getFriendlyStrategyName()}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (Software SL $${Math.abs(SOFTWARE_SL_USD).toFixed(2)} Cap)\n` +
      `🎯 Take Profit: *${(isDynamicRunner || !tpPrice) ? "Stoch (15,1,1) Level 80/20 Touch -> +$0.30 SL & Level 50 Immediate Exit" : `${tpPrice.toFixed(4)} (Min ${TARGET_MIN_PROFIT.toFixed(2)} Net + Stoch 15 Lvl 80/20 -> +$0.30 SL & Lvl 50 Exit)` }*\n\n` +
      `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n\n` +
      `📐 *Technical Confluence Verification:*\n` +
      confluenceLines + `\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const brokerHardSlPrice = (SYMBOL === "R_10" || SYMBOL === "R_25" || SYMBOL === "1HZ25V" || SYMBOL === "R_50")
      ? (direction === "BUY" ? entry - (5.00 / CTRADER_LOT_SIZE) : entry + (5.00 / CTRADER_LOT_SIZE))
      : sl;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, brokerSlPrice: brokerHardSlPrice, rr: null, entryType, brokerSlAmount: STAKE_USD,
      lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
      entryEpoch: m5BoundaryEpoch, purchaseTimeEpoch: m5BoundaryEpoch, purchase_time: m5BoundaryEpoch,
      entryCandleHigh: (candles && candles[si]) ? parseFloat(candles[si].high) : entry,
      entryCandleLow: (candles && candles[si]) ? parseFloat(candles[si].low) : entry,
      stoch25_touched_extreme: false,
      stoch25_touched_extreme_epoch: null,
      stoch15_touched_extreme: false, stoch15_touched_extreme_epoch: null, lockedPnlFloor: null,
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
    if (SYMBOL === "R_100" || SYMBOL === "1HZ25V") {
      nextTrigger = `Managing Position: Hard TP +$10.00 | Entry Candle High/Low Close SL | Stoch (15,1,1) Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit (Hard SL: -$5.00)`;
    } else if (SYMBOL === "R_25") {
      nextTrigger = `Managing Position: Hard TP +$5.00 | Sequential Stoch (25,1,1) Rule 1 (Lvl 50 -> +$0.30 SL) & Rule 2 (Lvl 50 Reversal Exit) | Software SL: ${SOFTWARE_SL_USD.toFixed(2)}`;
    } else if (SYMBOL === "R_50") {
      nextTrigger = `Managing Position: Hard TP +$3.00 | Sequential Stoch (25,1,1) Rule 1 (Lvl 50 -> +$0.30 SL) & Rule 2 (Lvl 50 Reversal Exit) | Software SL: ${SOFTWARE_SL_USD.toFixed(2)}`;
    } else if (SYMBOL === "1HZ75V" || SYMBOL === "R_75") {
      nextTrigger = `Managing Position: Standard TP +$3.50 | Stoch (15,1,1) Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit (SL: ${SOFTWARE_SL_USD.toFixed(2)})`;
    } else {
      nextTrigger = `Managing Position: Stoch (15,1,1) Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit (TP Target: ${TARGET_MIN_PROFIT.toFixed(2)} Net, SL: ${SOFTWARE_SL_USD.toFixed(2)})`;
    }
  } else if (state.dailyTargetReached) {
    state.openTrade = null;
    healthStatus = "FUNCTIONING";
    blockerReason = `Daily Net Target (+${DAILY_PROFIT_TARGET_USD.toFixed(2)}) Secured Today (${(state.dailyNetPnl || 0).toFixed(2)})`;
    nextTrigger = "Idling until 00:00 UTC daily rollover";

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
    } else if (STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH30" && SYMBOL !== "R_25") {
      const stoch100Buy = sK100 !== null && sK100 >= 50.0;
      const stoch100Sell = sK100 !== null && sK100 <= 50.0;
      const emaBuy = currentEma100 !== null && currentPrice > currentEma100;
      const emaSell = currentEma100 !== null && currentPrice < currentEma100;

      if (stoch100Buy) {
        if (!state.v25_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 100: ${sK100.toFixed(1)} > 50, Price vs EMA 100: ${emaBuy ? "ABOVE" : "BELOW"})`;
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
          blockerReason = `Macro Trend Bearish (Stoch 100: ${sK100.toFixed(1)} < 50, Price vs EMA 100: ${emaSell ? "BELOW" : "ABOVE"})`;
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
    } else if (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH25") {
      const stoch100Buy = sK100 !== null && sK100 >= 50.0;
      const stoch100Sell = sK100 !== null && sK100 <= 50.0;

      if (stoch100Buy) {
        if (!state.v25_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 100: ${sK100.toFixed(1)} > 50)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 3 candles for Initial BUY`;
        } else {
          blockerReason = `BUY Trend Active (Stoch 100: ${sK100.toFixed(1)} > 50). Initial BUY done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback <= 10 then fresh cross > 10 for BUY Re-Entry`;
        }
      } else if (stoch100Sell) {
        if (!state.v25_initialSellDone) {
          blockerReason = `Macro Trend Bearish (Stoch 100: ${sK100.toFixed(1)} < 50)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 3 candles for Initial SELL`;
        } else {
          blockerReason = `SELL Trend Active (Stoch 100: ${sK100.toFixed(1)} < 50). Initial SELL done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback >= 90 then fresh cross < 90 for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting Stoch 100 trend definition";
        nextTrigger = "Awaiting Stoch 100 cross 50.0";
      }
    } else if (SYMBOL === "R_50" || STRATEGY_PROFILE === "PROFILE_V50_MACD_STOCH25") {
      const macdBuy = sMacd5351 !== null && sMacd5351 > 0.0;
      const macdSell = sMacd5351 !== null && sMacd5351 < 0.0;

      if (macdBuy) {
        if (!state.v50_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (MACD 5,35,1: ${sMacd5351.toFixed(3)} > 0)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 2 candles for Initial BUY`;
        } else {
          blockerReason = `BUY Trend Active (MACD 5,35,1: ${sMacd5351.toFixed(3)} > 0). Initial BUY done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback <= 10 then fresh cross > 10 for BUY Re-Entry`;
        }
      } else if (macdSell) {
        if (!state.v50_initialSellDone) {
          blockerReason = `Macro Trend Bearish (MACD 5,35,1: ${sMacd5351.toFixed(3)} < 0)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 2 candles for Initial SELL`;
        } else {
          blockerReason = `SELL Trend Active (MACD 5,35,1: ${sMacd5351.toFixed(3)} < 0). Initial SELL done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback >= 90 then fresh cross < 90 for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting MACD (5,35,1) trend definition";
        nextTrigger = "Awaiting MACD (5,35,1) cross 0.0";
      }
    } else if (SYMBOL === "R_100" || SYMBOL === "1HZ25V" || SYMBOL === "R_75" || SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH15" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH30" || ((STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533" || STRATEGY_PROFILE === "PROFILE_V75_1S_EMA_STOCH15") && SYMBOL === "1HZ75V")) {
      const stoch100Buy = sK100 !== null && sK100 >= 50.0;
      const stoch100Sell = sK100 !== null && sK100 <= 50.0;
      const isV25_1s = SYMBOL === "1HZ25V";
      const buyLvl = isV25_1s ? 20 : 30;
      const sellLvl = isV25_1s ? 80 : 70;
      const macdNote = isV25_1s ? ` + MACD (5,35,1) ${stoch100Buy ? '> 0' : '< 0'}` : '';

      if (stoch100Buy) {
        if (!state.v75_1s_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 100: ${sK100.toFixed(1)} > 50)`;
          nextTrigger = `Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) fresh cross > 50 for Initial BUY`;
        } else {
          blockerReason = `BUY Trend Active (Stoch 100: ${sK100.toFixed(1)} > 50). Initial BUY done/bypassed.`;
          nextTrigger = `Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) High/Low or Close touch <= ${buyLvl} then cross > ${buyLvl}${macdNote} for BUY Re-Entry`;
        }
      } else if (stoch100Sell) {
        if (!state.v75_1s_initialSellDone) {
          blockerReason = `Macro Trend Bearish (Stoch 100: ${sK100.toFixed(1)} < 50)`;
          nextTrigger = `Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) fresh cross < 50 for Initial SELL`;
        } else {
          blockerReason = `SELL Trend Active (Stoch 100: ${sK100.toFixed(1)} < 50). Initial SELL done/bypassed.`;
          nextTrigger = `Awaiting Stoch (15,1,1) %K (${sK1511 !== null ? sK1511.toFixed(1) : "N/A"}) High/Low or Close touch >= ${sellLvl} then cross < ${sellLvl}${macdNote} for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting Stoch 100 trend definition";
        nextTrigger = "Awaiting Stoch 100 cross 50.0";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V100_STOCH200_STOCH15" || (SYMBOL === "R_100" && STRATEGY_PROFILE !== "PROFILE_V75_1S_STOCH100_STOCH15")) {
      const botPrefix = "V100";
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
          nextTrigger = isInitialDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 ? sK1525.toFixed(1) : "N/A"}) oversold pullback cross > 25 for BUY Re-Entry` : `Awaiting Stoch (15,2,5) Level 50 cross for Initial BUY`;
        }
      } else {
        if (!emaSell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"}), but Price (${currentPrice.toFixed(2)}) is ABOVE EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). SELL trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross below EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `SELL Trend & EMA 100 Aligned (Stoch 200: ${sK200 ? sK200.toFixed(1) : "N/A"} < 52, Price < EMA 100)`;
          nextTrigger = isInitialDone ? `Awaiting Stoch (15,2,5) %K (${sK1525 ? sK1525.toFixed(1) : "N/A"}) overbought rally cross < 75 for SELL Re-Entry` : `Awaiting Stoch (15,2,5) Level 50 cross for Initial SELL`;
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
          blockerReason = `BUY Trend, CCI & EMA 100 Aligned (Stoch 200: ${sK.toFixed(1)} >= 50, CCI 100: ${cVal.toFixed(1)} >= 0, Price > BB 20 Mid)`;
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
          blockerReason = `SELL Trend, CCI & EMA 100 Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50, CCI 100: ${(cVal !== null ? cVal.toFixed(1) : "N/A")} <= 0, Price < BB 20 Mid)`;
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
          blockerReason = `BUY Trend & BB 20 Mid Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} >= 50.0, Price > BB 20 Mid)`;
          nextTrigger = state.v50_initialBuyDone
            ? `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) pullback & cross > 25 for BUY Re-Entry`
            : "Awaiting fresh Stoch (15,2,5) %K cross above 50.0 for Initial BUY";
        }
      } else {
        if (!emaSell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50.0), but Price (${currentPrice.toFixed(2)}) is ABOVE EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"}). SELL trades blocked by EMA 100 filter`;
          nextTrigger = `Awaiting Price to cross below EMA 100 (${currentEma100 ? currentEma100.toFixed(2) : "N/A"})`;
        } else {
          blockerReason = `SELL Trend & BB 20 Mid Aligned (Stoch 200: ${(sK !== null ? sK.toFixed(1) : "N/A")} <= 50.0, Price < BB 20 Mid)`;
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
          nextTrigger = `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) pullback cross > 25 & Price > BB 20 Mid`;
        } else if (stoch200Sell) {
          blockerReason = `SELL Trend Active (Stoch 200: ${sK200?.toFixed(1)}, Price ${emaSell ? "<" : ">"} EMA 100). Re-Entry Mode.`;
          nextTrigger = `Awaiting Stoch (15,2,5) %K (${sK1525 !== null ? sK1525.toFixed(1) : "N/A"}) rally cross < 75 & Price < BB 20 Mid`;
        } else {
          blockerReason = `Awaiting Trend Direction (Stoch 200: ${sK200?.toFixed(1)} between 45 and 55)`;
          nextTrigger = "Awaiting Stoch 200 cross > 55 or < 45";
        }
      } else {
        blockerReason = `Initial Confluence Mode (Stoch 200: ${sK200?.toFixed(1)}, Stoch 15: ${sK1525?.toFixed(1)}, Price vs BB 20 Mid: ${emaBuy ? "ABOVE" : "BELOW"})`;
        nextTrigger = "Awaiting any-order Stoch 200 (45/55) + Stoch 15 (25/75) + BB 20 Mid alignment";
      }
    } else if (SYMBOL === "R_10" || STRATEGY_PROFILE === "PROFILE_V10_STOCH50_STOCH25") {
      const stoch50Buy = sK50 !== null && sK50 > 50.0;
      const stoch50Sell = sK50 !== null && sK50 < 50.0;

      if (stoch50Buy) {
        if (!state.v10_initialBuyDone) {
          blockerReason = `Macro Trend Bullish (Stoch 50: ${sK50.toFixed(1)} > 50)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross > 50 within +/- 2 candles for Initial BUY`;
        } else {
          blockerReason = `BUY Trend Active (Stoch 50: ${sK50.toFixed(1)} > 50). Initial BUY done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback <= 50 then fresh cross > 50 for BUY Re-Entry`;
        }
      } else if (stoch50Sell) {
        if (!state.v10_initialSellDone) {
          blockerReason = `Macro Trend Bearish (Stoch 50: ${sK50.toFixed(1)} < 50)`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) cross < 50 within +/- 2 candles for Initial SELL`;
        } else {
          blockerReason = `SELL Trend Active (Stoch 50: ${sK50.toFixed(1)} < 50). Initial SELL done/bypassed.`;
          nextTrigger = `Awaiting Stoch (25,1,1) %K (${sK2511 !== null ? sK2511.toFixed(1) : "N/A"}) pullback >= 50 then fresh cross < 50 for SELL Re-Entry`;
        }
      } else {
        blockerReason = "Awaiting Stoch (50,1,1) macro trend definition";
        nextTrigger = "Awaiting Stoch (50,1,1) cross 50.0";
      }
    } else if (STRATEGY_PROFILE === "PROFILE_V100_1S_TREND_MACD_STOCH") {
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
        blockerReason = `Confluence De-aligned (Stoch200: ${sK200 ? sK200.toFixed(1) : "N/A"}, MACD: ${macdVal ? macdVal.toFixed(2) : "N/A"}, Price vs BB 20 Mid: ${emaBuy ? "ABOVE" : "BELOW"})`;
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
  state.nextPhase = nextTrigger;
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
