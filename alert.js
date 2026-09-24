import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

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
        console.log(`[AUTO-RELOAD] Exiting process cleanly now. PM2 will immediately respawn with updated code.`);
        process.exit(0);
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
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_MIDLINE_FRACTAL",
    gateType: "STOCH_50_MIDLINE",
    stochParams: { k: 18, d: 12, slowing: 25 },
    minTakeProfitPoints: 760.0,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 180.0,
    modesAllowed: ["CONT", "REV"],
    slType: "M15_FRACTAL",
    notes: "V75 Heavyweight; M15 Fib + M5 Stoch 50 Midline Cross + Previous M15 Fractal SL + $4.00 TP & Trailing."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V75_1S_MIDLINE_FRACTAL",
    gateType: "STOCH_50_MIDLINE",
    stochParams: { k: 18, d: 12, slowing: 25 },
    minTakeProfitPoints: 5.08,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 18.0,
    modesAllowed: ["CONT", "REV"],
    slType: "M15_FRACTAL",
    notes: "1s tick speed; 100x multiplier; M15 Fib + M5 Stoch 50 Midline Cross + Previous M15 Fractal SL + $4.00 TP & Trailing."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 40,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_MIDLINE_ENV",
    gateType: "STOCH_50_ENV200",
    stochParams: { k: 18, d: 12, slowing: 25 },
    envParams: { period: 200, devPct: 0.05 }, // Mandatory Envelope 200 breakout trend filter
    minTakeProfitPoints: 10.70,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 3.00,
    modesAllowed: ["CONT"],
    slType: "M15_FRACTAL",
    notes: "40x multiplier; M15 Fib + M5 Stoch 50 Midline Cross + Envelope 200 breakout filter + Previous M15 Fractal SL + $4.00 TP & Trailing."
  },
  "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 40,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_V100_1S_EMA_STOCH533",
    gateType: "EMA100_STOCH533",
    stochParams: { k: 5, d: 3, slowing: 3 }, // Fast M5 Stoch (5,3,3)
    emaPeriod: 100, // M5 EMA 100
    minTakeProfitPoints: 17.60,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 5.50,
    modesAllowed: ["CONT", "REV"],
    slType: "M15_FRACTAL",
    notes: "Two-stage state machine: Stage 1: M15 Fib + M5 EMA 100 direction arming lock; Stage 2: Fast Stoch (5,3,3) 20/80 cross trigger + Previous M15 Fractal SL + $4.00 TP."
  },
  "R_25": {
    symbol: "R_25",
    symbolName: "Volatility 25 Index",
    repoLabel: "Tea (V25 Demo)",
    server: "S1",
    multiplier: 400,
    stakeUsd: 5.0,
    commissionUsd: 0.32,
    strategyProfile: "PROFILE_V25_ASYNC_3WAY",
    gateType: "ASYNC_3WAY_LATCH",
    stochParams: { k: 18, d: 12, slowing: 25 },
    cciPeriod: 100,
    minTakeProfitPoints: 15.0,
    minTakeProfitUsd: 8.00,
    trailActivationUsd: 5.00,
    maxHardStopPoints: 3.50,
    modesAllowed: ["REV"],
    slType: "HARD_POINTS",
    notes: "400x multiplier ($1.38 pts/$1); Out-of-order independent 3-condition latching (M15 Fib + M5 CCI 100 + M5 Stoch 18,12,25) + $8-$10 TP."
  },
  "R_50": {
    symbol: "R_50",
    symbolName: "Volatility 50 Index",
    repoLabel: "OmniSight (V50)",
    server: "S2",
    multiplier: 80,
    stakeUsd: 5.0,
    commissionUsd: 0.16,
    strategyProfile: "PROFILE_V50_STOCH_BOUNDARIES",
    gateType: "STOCH_BOUNDARIES_20_80",
    stochParams: { k: 18, d: 12, slowing: 25 },
    excludeFib50: true, // 50% Fib level explicitly excluded
    minTakeProfitPoints: 0.93,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 0.20,
    modesAllowed: ["CONT", "REV"],
    slType: "M15_FRACTAL",
    notes: "80x multiplier; M15 Fib (excluding 50%) + M5 Stoch (18,12,25) 20/80 boundary cross + Previous M15 Fractal SL + $4.00 TP & Trailing."
  },
  "R_10": {
    symbol: "R_10",
    symbolName: "Volatility 10 Index",
    repoLabel: "Test Bot (V10 Live)",
    server: "S2",
    multiplier: 400,
    stakeUsd: 5.0,
    commissionUsd: 0.80,
    strategyProfile: "PROFILE_V10_MIDLINE_FRACTAL",
    gateType: "STOCH_50_MIDLINE",
    stochParams: { k: 18, d: 12, slowing: 25 },
    minTakeProfitPoints: 9.60,
    minTakeProfitUsd: 4.00,
    trailActivationUsd: 4.00,
    maxHardStopPoints: 8.00,
    modesAllowed: ["CONT", "REV"],
    slType: "M15_FRACTAL",
    notes: "400x multiplier ($2.40 pts/$1); M15 Fib + M5 Stoch 50 Midline Cross + Previous M15 Fractal SL + $4.00 TP & Trailing."
  }
};

// ==================== ACTIVE INSTANCE SELECTOR ====================
// Select via environment variable SYMBOL (e.g. SYMBOL=R_75) or fallback to default
const ACTIVE_SYMBOL = process.env.SYMBOL || "R_75";
const PROFILE = INSTRUMENT_PROFILES[ACTIVE_SYMBOL] || INSTRUMENT_PROFILES["R_75"];

const SYMBOL = PROFILE.symbol;
const SYMBOL_NAME = PROFILE.symbolName;
const REPO_LABEL = PROFILE.repoLabel;
const MULTIPLIER = PROFILE.multiplier;
const COMMISSION_USD = PROFILE.commissionUsd;
const STAKE_USD = PROFILE.stakeUsd || 5.0;
const STOCH_SEPARATION_MIN = 0; // Pure directional crossover (zero separation barrier)
const MIN_TP_POINTS_FLOOR = PROFILE.minTakeProfitPoints;
const MAX_HARD_SL_POINTS = PROFILE.maxHardStopPoints;
const MODES_ALLOWED = PROFILE.modesAllowed;
const GATE_TYPE = PROFILE.gateType;
const STRATEGY_PROFILE = PROFILE.strategyProfile;

const TRADING_SYMBOL = SYMBOL;

const SOFTWARE_SL_USD = -3.60;
const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const DAILY_PROFIT_TARGET_USD = 10.00;
const MARKET_DATA_APP_ID = "1089";
const TARGET_MIN_PROFIT = PROFILE.minTakeProfitUsd || 4.00;

// Continuous Dollar Trailing Stop Settings
const TRAIL_ACTIVATION_USD = PROFILE.trailActivationUsd || 4.00; // Activated once profit reaches +$4.00 net
const TRAIL_BUFFER_USD = 1.00;     // Trail $1.00 behind peak unrealized profit
const TRAIL_INITIAL_FLOOR_USD = 0.20; // Initial guaranteed lock at activation (+$0.20 covers commissions)

const STOCH_MIDLINE_FALLBACK_SYMBOLS = ["R_50", "R_10"];

const GATEWAY_URL = process.env.GATEWAY_URL || process.env.PROXY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || process.env.PROXY_SECRET;

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
async function gatewayFetch(endpoint, method = "GET", body = null) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", "x-gateway-secret": GATEWAY_SECRET },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`Gateway HTTP error ${res.status}`);
  return await res.json();
}

async function getOpenPortfolio() {
  const res = await gatewayFetch("/portfolio");
  if (!res.ok || !res.authorized) throw new Error("Gateway is currently disconnected");
  return res.portfolio || [];
}

async function executeTrade(direction) {
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
  const data = await gatewayFetch("/sell", "POST", { sell: contractId, price: 0 });
  if (data.error && data.error.code !== "ContractNotFound") throw new Error(data.error.message);
  return data;
}

async function getContractProfitFromHistory(contractId, approxOpenEpoch) {
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

// ==================== MARKET DATA FETCHERS ====================
async function fetchAllData() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
    const results = {};
    let timer = null;
    let isSettled = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          if (typeof ws.terminate === "function") ws.terminate();
          else ws.close();
        }
      } catch (e) {}
    };

    timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(new Error("fetchAllData timeout (15s exceeded)"));
      }
    }, 15000);

    ws.on("open", () => {
      try {
        ws.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 220, end: "latest", style: "candles" }));
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
}

async function fetchCurrentSpotPrice() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
    let timer = null;
    let isSettled = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          if (typeof ws.terminate === "function") ws.terminate();
          else ws.close();
        }
      } catch (e) {}
    };

    timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(new Error("fetchCurrentSpotPrice timeout (4s exceeded)"));
      }
    }, 4000); // 4-second strict network timeout safeguard to prevent hung sockets

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

export function calculateStoch(candles, kPeriod = 18, dPeriod = 12, slowing = 25) {
  const fastK = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const sl = candles.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...sl.map(c => parseFloat(c.high)));
    const ll = Math.min(...sl.map(c => parseFloat(c.low)));
    const c = parseFloat(candles[i].close);
    fastK[i] = hh === ll ? 100 : ((c - ll) / (hh - ll)) * 100;
  }
  const slowK = sma(fastK.map(v => (v !== null ? v : 50)), slowing).map((v, i) => (fastK[i] === null ? null : v));
  const slowD = sma(slowK.map(v => (v !== null ? v : 50)), dPeriod).map((v, i) => (slowK[i] === null ? null : v));
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

function deriveHardStopPrice(entry, direction) {
  const targetLoss = -5.00;
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  const dollarSlPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);

  return dollarSlPrice;
}

function calcUnrealizedPnL(trade, currentPrice) {
  const rawPnl = trade.direction === "BUY"
    ? (currentPrice - trade.entry) / trade.entry * STAKE_USD * MULTIPLIER
    : (trade.entry - currentPrice) / trade.entry * STAKE_USD * MULTIPLIER;
  return rawPnl - COMMISSION_USD;
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
  nextPhase: null, h1TdiDir: null, fibBullish: null, fib0: null, fib50: null, fib618: null, fib79: null, fib100: null,
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
  // V25 Out-of-Order 3-way latches
  latchFib_BUY: false,
  latchFib_SELL: false,
  latchCci_BUY: false,
  latchCci_SELL: false,
  latchStoch_BUY: false,
  latchStoch_SELL: false
};
try { state = { ...state, ...JSON.parse(fs.readFileSync("state.json")) }; } catch {}
function saveState() { fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); }
function loadTrades() { try { return JSON.parse(fs.readFileSync("trades.json")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync("trades.json", JSON.stringify(t, null, 2)); }

// ==================== FAST PATH: RISK MANAGEMENT (ADAPTIVE: 3S IN-TRADE / 10S IDLE) ====================
const closingContracts = new Set();

async function manageOpenTradesFastPath() {
  let trades = loadTrades();
  let openTrades = trades.filter(t => !t.result && !t.pending);
  if (openTrades.length === 0) return false;

  let currentPrice;
  try {
    currentPrice = await fetchCurrentSpotPrice();
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
    // 🛡️ CONTINUOUS DOLLAR TRAILING STOP (Ratchet Behind Peak Unrealized Profit)
    // Activated once profit reaches minimum threshold (+$4.00 net across fleet)
    // =========================================================================
    if (pnl >= TRAIL_ACTIVATION_USD) {
      if (!openTrade.maxUnrealizedPnl || pnl > openTrade.maxUnrealizedPnl) {
        openTrade.maxUnrealizedPnl = parseFloat(pnl.toFixed(2));
      }
      const rawFloor = openTrade.maxUnrealizedPnl - TRAIL_BUFFER_USD;
      const targetFloor = parseFloat(Math.max(TRAIL_INITIAL_FLOOR_USD, rawFloor).toFixed(2));

      if (!openTrade.lockedPnlFloor || targetFloor > openTrade.lockedPnlFloor) {
        openTrade.lockedPnlFloor = targetFloor;
        saveTrades(trades);
        console.log(`[TRAIL-STOP] ${openTrade.contractId} Peak PnL +$${openTrade.maxUnrealizedPnl.toFixed(2)} -> Trailing floor ratcheted to +$${openTrade.lockedPnlFloor.toFixed(2)}.`);
      }
    }
    // =========================================================================

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction, openTrade.entryType?.includes("REV") ? "REV" : "CONT");

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    let tpHit = false;
    if (openTrade.fibTpPrice) {
      tpHit = isBuy ? currentPrice >= openTrade.fibTpPrice : currentPrice <= openTrade.fibTpPrice;
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

    let reason = null;
    if (rescueBreakevenHit) {
      reason = `Rescue Retracement Target hit — Old position closed at +$${pnl.toFixed(2)} (>= +$0.20 profit) while rescue contract ${activeRescueTrade.contractId} runs to TP`;
    }
    else if (openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) { 
      reason = `Profit-Lock hit — Secured +$${openTrade.lockedPnlFloor.toFixed(2)}`; 
    }
    else if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit — PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit — PnL $${pnl.toFixed(2)}`; } 
    else if (tpHit) { reason = `Fib TP reached at ${currentPrice.toFixed(4)}`; }

    if (reason) {
      closingContracts.add(openTrade.contractId);
      console.log(`[RISK] Closing ${openTrade.contractId}: ${reason}`);
      let serverPnl = pnl, resultSource = "estimated_fallback";
      
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
        console.log(`[DAILY TARGET] +$10.00 Daily Goal Achieved ($${state.dailyNetPnl.toFixed(2)}). Switching to IDLE_DAILY_TARGET_REACHED.`);
        await sendTelegram(`🎯 *${REPO_LABEL} — DAILY TARGET ACHIEVED!* 🎯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      }

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
// 🚑 LOSS RECOVERY / RESCUE ENTRY ENGINE (FOR STOCH 50 MIDLINE INSTRUMENTS)
// =========================================================================
async function checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch) {
  const isMidlineProfile = 
    STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
    STRATEGY_PROFILE === "PROFILE_V75_1S_MIDLINE_FRACTAL" || 
    STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL" || 
    STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV";
  
  if (!isMidlineProfile) return;

  let trades = loadTrades();
  const openTrades = trades.filter(t => !t.result && !t.pending);
  const parentTrade = openTrades.find(t => !t.isRescue);

  if (!parentTrade || !parentTrade.contractId) {
    state.rescueEnvTouched = false;
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
    state.rescueEnvTouched = false;
    state.rescueStochArmed = false;
    return;
  }

  // 1. Condition 1: Price must retrace to touch Envelope 50 (deviation 0.05%)
  const env50 = calculateEnvelopes(candles, 50, 0.05);
  const si = candles.length - 2;
  const env50Up = env50.upper[si];
  const env50Lo = env50.lower[si];
  const lastCandle = candles[si];

  let touchedEnv50 = false;
  if (parentTrade.direction === "BUY") {
    touchedEnv50 = parseFloat(lastCandle.low) <= env50Lo || currentPrice <= env50Lo;
  } else if (parentTrade.direction === "SELL") {
    touchedEnv50 = parseFloat(lastCandle.high) >= env50Up || currentPrice >= env50Up;
  }

  if (touchedEnv50) {
    state.rescueEnvTouched = true;
    console.log(`[RESCUE ENGINE] ${SYMBOL} Parent trade #${parentTrade.contractId} (${parentTrade.direction}) touched Envelope 50 (Up: ${env50Up.toFixed(4)}, Lo: ${env50Lo.toFixed(4)}). Latched.`);
  }

  // If Envelope 50 has not been touched during this loss retracement, rescue cannot be triggered
  if (!state.rescueEnvTouched && !touchedEnv50) {
    return;
  }

  // 2. Condition 2: Fast Stoch (5,3,3) must retrace to 20/80 level and cross
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

  console.log(`[RESCUE ENGINE] 🚨 All conditions satisfied for ${SYMBOL} Loss Recovery / Rescue Entry!`);
  console.log(`  • Parent Trade: #${parentTrade.contractId} (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)}, PnL: $${parentPnl.toFixed(2)})`);
  console.log(`  • Envelope 50 Touch: CONFIRMED`);
  console.log(`  • Fast Stoch (5,3,3) Cross: CONFIRMED (%K: ${sK533.toFixed(1)}, prev: ${prevK533.toFixed(1)})`);

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
    entryType: "RESCUE_ENTRY_ENV50_STOCH533",
    brokerSlAmount: STAKE_USD,
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
    parentId: parentTrade.id,
    parentContractId: parentTrade.contractId
  };

  trades.push(pendingRescueRecord);
  saveTrades(trades);

  const rescueMessage = 
    `🚑 *${SYMBOL_NAME.toUpperCase()} — LOSS RECOVERY / RESCUE ENTRY* 🚑\n\n` +
    `Direction: *${dirEmoji}*\n` +
    `Setup: *Loss Recovery (Env 50 Touch + Stoch 5,3,3 Cross)*\n` +
    `📍 Rescue Entry: *${entry.toFixed(4)}*\n` +
    `🛑 Stop Loss: *${Number(sl).toFixed(4)}* (Inherited from Parent Trade)\n` +
    `🎯 Take Profit: *${fibTpPrice ? Number(fibTpPrice).toFixed(4) : "Parent TP Target"}*\n` +
    `💰 Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
    `🔗 *Parent Trade Reference:*\n` +
    `• Parent Contract: \`${parentTrade.contractId}\` (${parentTrade.direction} @ ${Number(parentTrade.entry).toFixed(4)})\n` +
    `• Floating Loss at Rescue: *$${parentPnl.toFixed(2)}*\n` +
    `• Envelope 50 Touch: *Confirmed*\n` +
    `• Fast Stoch (5,3,3): *%K ${sK533.toFixed(1)}* (${direction === "BUY" ? "> 20 Cross" : "< 80 Cross"})\n` +
    `• Strategy: *When price retraces to ${Number(parentTrade.entry).toFixed(4)}, parent trade will close at >= +$0.20 while this rescue position runs to TP.*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ Time (UTC): ${timeFormatted}`;

  try {
    const contractId = await executeTrade(direction);
    if (!contractId) {
      trades.splice(trades.findIndex(t => t.id === pendingRescueRecord.id), 1);
      saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Rescue entry triggered, but broker returned no contract ID. Aborted.`);
      return;
    }
    pendingRescueRecord.contractId = contractId;
    pendingRescueRecord.pending = false;
    saveTrades(trades);

    state.rescueEnvTouched = false;
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

  // Daily UTC Rollover Reset for Target Cap
  const todayStr = new Date(m5BoundaryEpoch * 1000).toISOString().split("T")[0];
  if (state.dailyTargetDate && state.dailyTargetDate !== todayStr) {
    console.log(`[DAILY ROLLOVER] New UTC Day detected (${todayStr}). Resetting daily target lock.`);
    state.dailyTargetDate = todayStr;
    state.dailyTargetReached = false;
    state.dailyNetPnl = 0;
    saveState();
  }

  // If daily target reached, protect profits and remain idle
  if (state.dailyTargetReached) {
    state.lastProcessedEpoch = m5BoundaryEpoch;
    saveState();
    return;
  }
  
  // 1. Gateway Portfolio Sync
  try {
    const allPortfolio = await getOpenPortfolio();
    const liveContracts = allPortfolio.filter(c => getContractSymbol(c) === TRADING_SYMBOL);
    
    for (const live of liveContracts) {
      if (!trades.find(t => String(t.contractId) === String(live.contract_id))) {
        const entryPrice = live.buy_price ? parseFloat(live.buy_price) : await fetchCurrentSpotPrice(); 
        const dir = live.contract_type === "MULTUP" ? "BUY" : "SELL";
        trades.push({
          id: `${SYMBOL}-${Date.now()}`, contractId: live.contract_id, pending: false, repo: REPO_LABEL, symbol: SYMBOL,
          direction: dir, entry: entryPrice, sl: deriveHardStopPrice(entryPrice, dir), rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
          entryEpoch: live.date_start, fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false, fibTpPrice: null, keyLevel: null,
          openTime: new Date(live.date_start * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
        });
        await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted unmanaged live contract \`${live.contract_id}\` (${dir}).`);
      }
    }
    
    const liveIdSet = new Set(liveContracts.map(c => String(c.contract_id)));
    for (const t of trades.filter(t => !t.result && t.contractId)) {
      if (!liveIdSet.has(String(t.contractId)) && !closingContracts.has(t.contractId)) {
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
          // Fallback: Contract is confirmed closed on Deriv (absent from live portfolio). Reconcile to unblock execution gate.
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

  // 3. Calculate Fibonacci Levels & Key M15 Candle Close
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

  // 4. Manage Structure on Active Trades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    // Fractal SL Market Structure Break (Evaluated strictly on Candle Close)
    const m5ClosePrice = currentPrice;
    if (t.sl) {
      const isBuy = t.direction === "BUY";
      const structureBroken = isBuy ? m5ClosePrice < t.sl : m5ClosePrice > t.sl;
      if (structureBroken) {
        closingContracts.add(t.contractId);
        console.log(`[STRUCTURE] M5 candle closed at ${m5ClosePrice.toFixed(4)} breaking ${t.fractalTimeframe || "M15"} fractal SL ${t.sl.toFixed(4)}. Exiting.`);
        try {
          await closeContract(t.contractId);
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          const pnl = calcUnrealizedPnL(t, m5ClosePrice);
          t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          t.resultSource = settled !== null ? "deriv_settled_official" : "estimated_fallback";
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+${t.serverPnl.toFixed(2)}` : `-${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — ${t.fractalTimeframe || "M15"} Structure Break*\n\nM5 Candle closed at *${m5ClosePrice.toFixed(4)}* breaking fractal SL *${t.sl.toFixed(4)}*.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[STRUCTURE] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
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
            if (isBottom && frac > t.sl && frac < t.entry) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded BUY SL to M15 Bottom Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (isTop && frac < t.sl && frac > t.entry) { 
              t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); 
              console.log(`[TRAIL SL] Upgraded SELL SL to M15 Top Fractal: ${frac.toFixed(4)}`); 
              break; 
            }
          }
        }
      }
    }
  }

  // 5. Calculate Technical Indicators Based on Active Instrument Architecture
  const cci = calculateCCI(candles, 100);
  const stochParams = PROFILE.stochParams || { k: 18, d: 12, slowing: 25 };
  const stoch = calculateStoch(candles, stochParams.k, stochParams.d, stochParams.slowing);
  const envParams = PROFILE.envParams || { period: 50, devPct: 0.05 };
  const env = calculateEnvelopes(candles, envParams.period, envParams.devPct);

  // EMA 100 for V100 (1s) Two-Stage State Arming
  const ema100 = calculateEMA(candles, 100);
  const currentEma100 = ema100[si];

  // Secondary Fast Stoch (5,3,3) for V100 (1s)
  const stoch533 = calculateStoch(candles, 5, 3, 3);

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];
  const sK533 = stoch533.k[si], prevK533 = stoch533.k[si - 1];

  if (sK === null || sD === null || prevK === null || prevD === null) return;

  // ── LIVE INDICATOR TELEMETRY UPDATES FOR DASHBOARD SYNCHRONIZATION ──
  state.strategyProfile = STRATEGY_PROFILE;
  state.stochVal = sK;
  state.stochSignal = sD;
  state.cciVal = cVal;
  state.envUpper = eUp;
  state.envLower = eLo;
  state.ema100Val = currentEma100;
  state.stoch533Val = sK533;

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

  // Fast Stoch (5,3,3) status & persistent cross epoch
  const stoch533BuyCross = prevK533 <= 20.0 && sK533 > 20.0;
  const stoch533SellCross = (prevK533 >= 80.0 && sK533 < 80.0) || (prevK533 >= 50.0 && sK533 < 50.0);
  state.stoch533BuyCross = stoch533BuyCross;
  state.stoch533SellCross = stoch533SellCross;

  if (stoch533BuyCross) {
    state.stoch533CrossEpoch = m5BoundaryEpoch;
    state.stoch533CrossDir = "BUY";
  } else if (stoch533SellCross) {
    state.stoch533CrossEpoch = m5BoundaryEpoch;
    state.stoch533CrossDir = "SELL";
  } else if (sK533 > 20.0 && sK533 < 80.0) {
    if (!state.stoch533CrossEpoch) {
      state.stoch533CrossEpoch = findStochasticCrossCandleEpoch(candles, stoch533, sK533 >= 50 ? "BUY" : "SELL", "MIDLINE") || m5BoundaryEpoch;
      state.stoch533CrossDir = sK533 >= 50 ? "BUY" : "SELL";
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

  // Evaluate Loss Recovery / Rescue Entry if parent trade is active and floating in loss
  await checkAndExecuteRescueEntry(candles, currentPrice, m5BoundaryEpoch);

  // ── A. RULE 1: UNIVERSAL KEY LEVEL TOUCH & CLOSE-SIDE ARMING ──
  function isLevelTouched(level, candle) {
    if (!level) return false;
    const h = parseFloat(candle.high);
    const l = parseFloat(candle.low);
    const buf = (h - l) * 0.05;
    return (l <= level + buf && h >= level - buf);
  }

  function checkCrossover(level, prevC, currC, currO) {
    if (!level) return false;
    const crossedUp = (prevC <= level || currO <= level) && currC > level;
    const crossedDn = (prevC >= level || currO >= level) && currC < level;
    return crossedUp || crossedDn;
  }

  let newArm = null;

  // Build Key Levels Array (Explicitly exclude 50% for Volatility 50)
  const keyLevels = [
    { lvl: fib.fib0,    name: "0%" },
    ...(PROFILE.excludeFib50 ? [] : [{ lvl: fib.fib50, name: "50%" }]),
    { lvl: fib.fib79,   name: "79%" },
    { lvl: fib.fib100,  name: "100%" },
    { lvl: fib.fibM50,  name: "-50%" },
    { lvl: fib.fib1618, name: "161.8%" }
  ];

  if (isLevelTouched(fib.fib0, currM15)) state.last50Origin = "fib0";
  if (isLevelTouched(fib.fib100, currM15)) state.last50Origin = "fib100";

  function resolveFibSetup(level, price) {
    if (!level) return null;
    const closedAbove = price >= level;
    const dir = closedAbove ? "BUY" : "SELL";

    // Sort distinct valid price levels in ascending order to find natural adjacent target
    const sortedLevels = Array.from(new Set(keyLevels.map(k => k.lvl).filter(Boolean))).sort((a, b) => a - b);
    const currIdx = sortedLevels.findIndex(l => Math.abs(l - level) < 1e-6);

    let tp = null;
    if (currIdx !== -1) {
      if (dir === "BUY") {
        tp = currIdx < sortedLevels.length - 1 ? sortedLevels[currIdx + 1] : null;
      } else {
        tp = currIdx > 0 ? sortedLevels[currIdx - 1] : null;
      }
    }

    const matchedKey = keyLevels.find(k => Math.abs(k.lvl - level) < 1e-6);
    const lvlName = matchedKey ? matchedKey.name : level.toFixed(2);
    const targetKey = tp ? keyLevels.find(k => Math.abs(k.lvl - tp) < 1e-6) : null;
    const tpName = targetKey ? targetKey.name : (tp ? tp.toFixed(2) : "OPEN");

    const s = {
      type: "REV",
      dir,
      tp,
      lvl: level,
      lbl: `${dir} (${lvlName} to ${tpName})`
    };

    if (s && !MODES_ALLOWED.includes(s.type)) return null;
    return s;
  }

  for (const item of keyLevels) {
    if (!item.lvl) continue;
    const crossed = checkCrossover(item.lvl, prevM15Close, m15Close, m15Open);
    const touched = isLevelTouched(item.lvl, currM15);

    if (crossed || touched) {
      newArm = resolveFibSetup(item.lvl, m15Close);

      // 30-Minute Execution Latch: Prevent re-arming duplicate setup
      if (newArm && state.lastTriggeredSetup === newArm.lbl && (m5BoundaryEpoch - (state.lastTriggeredEpoch || 0)) < 1800) {
        dbg(`[COOLDOWN LATCH] Setup ${newArm.lbl} executed within 30 mins. Suppressing duplicate re-arm.`);
        newArm = null;
      }

      if (newArm) break;
    }
  }

  // Active M15 Dynamic Invalidation & Direction Transition
  if (state.armed) {
    const isBuyFlipped = state.armed.dir === "BUY" && m15Close < state.armed.lvl;
    const isSellFlipped = state.armed.dir === "SELL" && m15Close > state.armed.lvl;

    if (isBuyFlipped || isSellFlipped) {
      const flippedSetup = resolveFibSetup(state.armed.lvl, m15Close);
      if (flippedSetup) {
        dbg(`[DIRECTION FLIP] Price crossed level ${state.armed.lvl}. Arming opposite direction: ${flippedSetup.lbl}`);
        state.armed = flippedSetup;
        state.armedEpoch = m5BoundaryEpoch;
        state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
        state.confirm = { label: flippedSetup.lbl, dir: flippedSetup.dir, gate: GATE_TYPE };
      } else {
        dbg(`[INVALIDATION] Price crossed level ${state.armed.lvl}. Disarming.`);
        state.armed = null;
        state.armedEpoch = null;
        state.armedTime = null;
      }
    } else if (state.armed.dir === "BUY" && state.armed.tp && m15Close >= state.armed.tp) {
      dbg(`[EXPIRED] M15 reached armed BUY target ${state.armed.tp}. Disarming.`);
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    } else if (state.armed.dir === "SELL" && state.armed.tp && m15Close <= state.armed.tp) {
      dbg(`[EXPIRED] M15 reached armed SELL target ${state.armed.tp}. Disarming.`);
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
    }
  }

  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    dbg(`[STATE] New Arm: ${newArm.lbl} (Level: ${newArm.lvl}, TP: ${newArm.tp})`);
    state.armed = newArm;
    state.armedEpoch = m5BoundaryEpoch;
    state.armedTime = new Date(m5BoundaryEpoch * 1000).toISOString().substring(11, 16) + " UTC";
    state.confirm = { label: newArm.lbl, dir: newArm.dir, gate: GATE_TYPE };
  } else if (!state.armed) {
    state.armedEpoch = null;
    state.armedTime = null;
  }

  state.nextPhase = state.armed ? state.armed.lbl : null;

  // ── B. QUANTITATIVE STRATEGY DISPATCHER & CONFLUENCE ENGINE ──
  let indicatorsSatisfied = false;
  let signalDirection = "";
  let setupLabel = state.armed ? state.armed.lbl : "";

  // 1. UNIFIED V75 / V75 (1s) / V10 MIDLINE FRACTAL ENGINE
  if (STRATEGY_PROFILE === "PROFILE_V75_MIDLINE_FRACTAL" || 
      STRATEGY_PROFILE === "PROFILE_V75_1S_MIDLINE_FRACTAL" || 
      STRATEGY_PROFILE === "PROFILE_V10_MIDLINE_FRACTAL") {
    
    // Strict Stoch (18,12,25) Level 50 Midline Cross (Current cross OR 8-Hour Lookback)
    const stoch50CrossUp = (prevK <= 50.0 && sK > 50.0) || checkStochastic8HrLookback(candles, stoch, "BUY", "MIDLINE");
    const stoch50CrossDown = (prevK >= 50.0 && sK < 50.0) || checkStochastic8HrLookback(candles, stoch, "SELL", "MIDLINE");

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
  // 2. VOLATILITY 100 (R_100) MIDLINE & ENVELOPE 200 ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV") {
    const stoch50CrossUp = (prevK <= 50.0 && sK > 50.0) || checkStochastic8HrLookback(candles, stoch, "BUY", "MIDLINE");
    const stoch50CrossDown = (prevK >= 50.0 && sK < 50.0) || checkStochastic8HrLookback(candles, stoch, "SELL", "MIDLINE");
    const env200Upper = eUp; // Computed with period 200
    const env200Lower = eLo;

    const envBuyActive = currentPrice > env200Upper;
    const envSellActive = currentPrice < env200Lower;

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch50CrossUp && envBuyActive) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch50CrossDown && envSellActive) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }
  // 3. VOLATILITY 100 (1s) TWO-STAGE STATE ARMING & FAST STOCH (5,3,3) ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
    // Stage 1: State Arming (M15 Key Level + M5 EMA 100 Direction)
    const emaBuyArmed = currentPrice > currentEma100;
    const emaSellArmed = currentPrice < currentEma100;

    const buyStateArmed = Boolean(state.armed && state.armed.dir === "BUY" && emaBuyArmed);
    const sellStateArmed = Boolean(state.armed && state.armed.dir === "SELL" && emaSellArmed);

    state.v100_1s_armed = buyStateArmed || sellStateArmed;
    state.v100_1s_armDir = buyStateArmed ? "BUY" : (sellStateArmed ? "SELL" : null);

    // Stage 2: Execution Trigger (Fast M5 Stoch 5,3,3)
    const stoch533BuyCross = prevK533 <= 20.0 && sK533 > 20.0;
    const stoch533SellCross = (prevK533 >= 80.0 && sK533 < 80.0) || (prevK533 >= 50.0 && sK533 < 50.0);

    if (buyStateArmed && stoch533BuyCross) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
    } else if (sellStateArmed && stoch533SellCross) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
    }
  }
  // 4. VOLATILITY 25 OUT-OF-ORDER 3-WAY INDEPENDENT LATCHING ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V25_ASYNC_3WAY") {
    // Condition 1: M15 Key Level Interaction
    if (state.armed) {
      if (state.armed.dir === "BUY") state.latchFib_BUY = true;
      if (state.armed.dir === "SELL") state.latchFib_SELL = true;
    }

    // Condition 2: M5 CCI 100 Crossing (-100 / +100)
    if (cVal !== null && prevCci !== null) {
      if (prevCci <= -100.0 && cVal > -100.0) state.latchCci_BUY = true;
      if (prevCci >= 100.0 && cVal < 100.0) state.latchCci_SELL = true;
      // Selective Reset: if CCI re-crosses back into adverse territory
      if (cVal < -100.0) state.latchCci_BUY = false;
      if (cVal > 100.0) state.latchCci_SELL = false;
    }

    // Condition 3: M5 Stochastic (18,12,25) Crossing
    const stochBuyCross = (prevK <= 20.0 && sK > 20.0) || (prevK <= prevD && sK > sD && sK <= 20.0);
    const stochSellCross = (prevK >= 80.0 && sK < 80.0) || (prevK >= prevD && sK < sD && sK >= 80.0);
    if (stochBuyCross) state.latchStoch_BUY = true;
    if (stochSellCross) state.latchStoch_SELL = true;
    // Selective Reset: if Stoch crosses adversely
    if (sK > 80.0) state.latchStoch_BUY = false;
    if (sK < 20.0) state.latchStoch_SELL = false;

    // Confluence: All 3 latches aligned
    if (state.latchFib_BUY && state.latchCci_BUY && state.latchStoch_BUY) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = "V25_ASYNC_3WAY (REV_BUY)";
    } else if (state.latchFib_SELL && state.latchCci_SELL && state.latchStoch_SELL) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = "V25_ASYNC_3WAY (REV_SELL)";
    }
  }
  // 5. VOLATILITY 50 STOCHASTIC BOUNDARIES (20 / 80) ENGINE
  else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
    // BUY: Stoch crosses > 20; SELL: Stoch crosses < 80 (Current cross OR 8-Hour Lookback)
    const stoch20CrossUp = (prevK <= 20.0 && sK > 20.0) || checkStochastic8HrLookback(candles, stoch, "BUY", "BOUNDARIES_20_80");
    const stoch80CrossDown = (prevK >= 80.0 && sK < 80.0) || checkStochastic8HrLookback(candles, stoch, "SELL", "BOUNDARIES_20_80");

    if (state.armed) {
      if (state.armed.dir === "BUY" && stoch20CrossUp) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && stoch80CrossDown) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
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

    if (state.armed && envAligned) {
      if (state.armed.dir === "BUY" && (crossUp || crossedAbove50)) {
        indicatorsSatisfied = true;
        signalDirection = "BUY";
      } else if (state.armed.dir === "SELL" && (crossDown || crossedBelow50)) {
        indicatorsSatisfied = true;
        signalDirection = "SELL";
      }
    }
  }

  // ── C. TRIGGER EXECUTION GATE & CONTRACT CREATION ──
  let signalTriggered = false;
  let direction = signalDirection;
  let fibTpPrice = state.armed?.tp || null;
  let entryType = setupLabel || state.armed?.lbl || "STRATEGY_EXECUTION";
  let entryKeyLevel = state.armed?.lvl || null;

  if (indicatorsSatisfied && direction) {
    const isPriceValid = (direction === "BUY" && (entryKeyLevel === null || currentPrice >= entryKeyLevel)) ||
                         (direction === "SELL" && (entryKeyLevel === null || currentPrice <= entryKeyLevel));

    if (isPriceValid) {
      signalTriggered = true;
      state.lastTriggeredSetup = entryType;
      state.lastTriggeredEpoch = m5BoundaryEpoch;
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.confirm = null;
      state.nextPhase = null;
      state.v100_1s_armed = false;
      state.v100_1s_armDir = null;
      state.latchFib_BUY = false;
      state.latchFib_SELL = false;
      state.latchCci_BUY = false;
      state.latchCci_SELL = false;
      state.latchStoch_BUY = false;
      state.latchStoch_SELL = false;
    } else {
      dbg(`[PENDING PRICE CONFIRMATION] Price ${currentPrice} is waiting to cross level ${entryKeyLevel} for ${direction}. Maintaining armed state.`);
    }
  }

  if (signalTriggered) {
    // Just-In-Time Execution Gate: Block if another position is active
    trades = loadTrades();
    const activeTrade = trades.find(t => !t.result && !t.pending);
    if (activeTrade) {
      console.log(`[EXECUTION GATED] Signal ${entryType} confirmed, but contract ${activeTrade.contractId} (${activeTrade.direction}) is active. Resetting armed state.`);
      state.armed = null;
      state.armedEpoch = null;
      state.armedTime = null;
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
    const entry = currentPrice;

    // Calibrated Minimum Take Profit Engine ($4.00 TP Floor Across Fleet)
    let calibratedMinPts = MIN_TP_POINTS_FLOOR;
    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
    const dollarTpPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);
    const pointsTpPrice = direction === "BUY" ? entry + calibratedMinPts : entry - calibratedMinPts;

    const minRequiredTp = direction === "BUY" ? Math.max(pointsTpPrice, dollarTpPrice) : Math.min(pointsTpPrice, dollarTpPrice);

    if (!fibTpPrice || (direction === "BUY" && minRequiredTp > fibTpPrice)) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    } else if (direction === "SELL" && minRequiredTp < fibTpPrice) {
      fibTpPrice = minRequiredTp; entryType = entryType + " ($4.00 TP Floor)";
    }

    // Initial Stop Loss Anchor: Previous M15 Institutional Fractal
    let initialM15Fractal = findRecentFractalM15(m15Candles, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    let sl;
    if (PROFILE.slType === "HARD_POINTS") {
      sl = hardStopPrice;
    } else {
      if (direction === "BUY") {
        sl = (initialM15Fractal && initialM15Fractal > hardStopPrice && initialM15Fractal < entry) ? initialM15Fractal : hardStopPrice;
      } else {
        sl = (initialM15Fractal && initialM15Fractal < hardStopPrice && initialM15Fractal > entry) ? initialM15Fractal : hardStopPrice;
      }
    }

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

    // Build Dynamic Confluence Verification Lines Matching Exact Instrument Strategy Profile
    let confluenceLines = `• Gate Engine: *${GATE_TYPE}*\n`;
    if (STRATEGY_PROFILE === "PROFILE_V100_1S_EMA_STOCH533") {
      confluenceLines += `• M5 EMA 100: *${currentEma100 ? currentEma100.toFixed(4) : "N/A"}* (${direction === "BUY" ? "Price > EMA" : "Price < EMA"} [ALIGNED])\n` +
                         `• Fast Stoch (5,3,3): *%K ${(sK533 !== null ? sK533.toFixed(1) : "N/A")}* | *%D ${(sD533 !== null ? sD533.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Cross" : "<80/50 Cross"} [TRIGGERED])\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V100_MIDLINE_ENV") {
      confluenceLines += `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 Midline Cross" : "<50 Midline Cross"} [ALIGNED])\n` +
                         `• Envelope 200 (0.05%): *${direction === "BUY" ? "Price > Upper (" + eUp.toFixed(4) + ")" : "Price < Lower (" + eLo.toFixed(4) + ")"}* [BREAKOUT]\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V25_ASYNC_3WAY") {
      confluenceLines += `• M5 CCI (100): *${cVal !== null ? cVal.toFixed(1) : "N/A"}* (${direction === "BUY" ? ">-100 Latch" : "<+100 Latch"} [ACTIVE])\n` +
                         `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Boundary Latch" : "<80 Boundary Latch"} [ACTIVE])\n` +
                         `• 3-Way Async State: *[FIB + CCI + STOCH LATCHED]*\n`;
    } else if (STRATEGY_PROFILE === "PROFILE_V50_STOCH_BOUNDARIES") {
      confluenceLines += `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">20 Oversold Boundary Cross" : "<80 Overbought Boundary Cross"} [TRIGGERED])\n` +
                         `• M15 Key Fib Level: *${entryKeyLevel ? entryKeyLevel.toFixed(4) : "N/A"}* (Excludes 50% Rebound)\n`;
    } else {
      confluenceLines += `• M5 Stoch (18,12,25): *%K ${(sK !== null ? sK.toFixed(1) : "N/A")}* | *%D ${(sD !== null ? sD.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 Midline Cross" : "<50 Midline Cross"} [ALIGNED])\n` +
                         `• M15 Key Fib Level: *${entryKeyLevel ? entryKeyLevel.toFixed(4) : "N/A"}* (50% Rebound / Discount / Premium)\n`;
    }
    confluenceLines += `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $10.00*`;

    const message = 
      `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Strategy Profile: *${STRATEGY_PROFILE}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (${initialM15Fractal ? "M15 Fractal Anchor" : "Hard Stop Barrier"})\n` +
      `🎯 Take Profit: *${fibTpPrice.toFixed(4)}* (Min $${TARGET_MIN_PROFIT.toFixed(2)} Net + Trailing Active)\n\n` +
      `💰 Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
      `📐 *Technical Confluence Verification:*\n` +
      confluenceLines + `\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: m5BoundaryEpoch, fractalSl: initialM15Fractal, fractalEpoch: null, fractalTimeframe: initialM15Fractal ? "M15" : null, m30FractalUpgraded: false, fibTpPrice,
      keyLevel: entryKeyLevel,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    saveTrades(trades);

    try {
      const contractId = await executeTrade(direction);
      if (!contractId) {
        trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
        await sendTelegram(`❌ *${REPO_LABEL}* — Signal triggered, but broker returned no contract ID. Aborted.`);
        return;
      }
      pendingTradeRecord.contractId = contractId;
      pendingTradeRecord.pending = false;
      saveTrades(trades);
      await sendTelegram(message);
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
  console.log(`[${REPO_LABEL}] ⚙️ Profile: ${STRATEGY_PROFILE} | Multiplier: ${MULTIPLIER}x | Modes: ${MODES_ALLOWED.join(",")}`);
  
  setInterval(checkTelegramCommands, 15000);

  let isScanning = false;

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
          state.symbol = SYMBOL;
          state.currentPrice = freshPrice;
          state.lastPriceUpdate = new Date().toISOString();
          saveState();
        } catch (e) {
          // Log only if price has never been fetched yet
          if (!state.currentPrice) {
            console.warn(`[${REPO_LABEL}] Periodic spot fetch warning: ${e.message}`);
          }
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

    // Adaptive Risk Pulse: 3 seconds when managing an active live trade, 10 seconds when idle
    await sleep(hasOpenTrade ? 3000 : 10000);
  }
}

// ==================== EXECUTION HOOK ====================
(async () => {
  await startContinuousEngine();
})();
