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

// ==================== INSTRUMENT PROFILES (CALIBRATED EMPIRICAL MATRIX) ====================
// Pure empirical optimization based on multi-day flight recorder ledger data across 77 CSVs.
// Enforces calibrated Stochastic separation, dynamic Take Profit floors, and noise-wick resilient hard stops.
const INSTRUMENT_PROFILES = {
  "R_75": {
    symbol: "R_75",
    symbolName: "Volatility 75 Index",
    repoLabel: "Lery's Alerts (V75 Demo)",
    server: "S1",
    multiplier: 50,
    commissionUsd: 0.15,
    stochSeparation: 3.5,
    gateType: "OPTION_B",
    cciContinuationThreshold: 50.0,
    minTakeProfitPoints: 350.0,
    maxHardStopPoints: 180.0, // Calibrated from 150.0 to 180.0 (covers 90th % M5 noise bar at safe $1.14 risk)
    modesAllowed: ["CONT", "REV"],
    notes: "Heavyweight index; Option B Stoch-Only (Sep >= 3.5); 350 pt TP yields +$1.84 net."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    commissionUsd: 0.15,
    stochSeparation: 2.0,
    gateType: "OPTION_C2",
    cciContinuationThreshold: 50.0,
    minTakeProfitPoints: 16.0,
    maxHardStopPoints: 18.0, // Calibrated from 6.0 to 18.0 (clears 75th % 16.56 pt noise at safe $1.72 risk)
    modesAllowed: ["CONT", "REV"],
    notes: "1-second tick speed; 100x multiplier ($1.27 pts/$1); Option C2; 18.0 pt SL accommodates 1s noise wicks."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 100,
    commissionUsd: 0.15,
    stochSeparation: 1.5,
    gateType: "OPTION_C2",
    cciContinuationThreshold: 40.0,
    minTakeProfitPoints: 3.50,
    maxHardStopPoints: 3.00, // Calibrated from 2.50 to 3.00 (clears 75th % 1.96 pt noise at $2.57 risk)
    modesAllowed: ["CONT"],
    notes: "100x multiplier ($1.07 pts/$1); Option C2; eliminates reversal bleed; 3.5 pt TP."
  },
  "R_25": {
    symbol: "R_25",
    symbolName: "Volatility 25 Index",
    repoLabel: "Tea (V25 Demo)",
    server: "S1",
    multiplier: 400,
    commissionUsd: 0.32,
    stochSeparation: 2.5,
    gateType: "OPTION_B",
    cciContinuationThreshold: 50.0,
    minTakeProfitPoints: 15.0,
    maxHardStopPoints: 3.5, // Retained: empirically proven optimal 2.12x avg M5 bar ($2.72 risk)
    modesAllowed: ["REV"],
    notes: "400x multiplier ($1.38 pts/$1); Option B Stoch-Only Reversals hit +$8.00 to +$10.00 net."
  },
  "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 40,
    commissionUsd: 0.15,
    stochSeparation: 2.0,
    gateType: "OPTION_C2",
    cciContinuationThreshold: 50.0,
    minTakeProfitPoints: 4.50,
    maxHardStopPoints: 5.50, // Calibrated from 1.65 to 5.50 (clears 75th % 3.00 pt noise at safe $1.36 risk)
    modesAllowed: ["CONT", "REV"],
    notes: "High velocity 1s ticks; Option C2; 5.50 pt SL gives 2.60x avg M5 bar room; prevents premature wick-outs."
  },
  "R_50": {
    symbol: "R_50",
    symbolName: "Volatility 50 Index",
    repoLabel: "OmniSight (V50)",
    server: "S2",
    multiplier: 150,
    commissionUsd: 0.16,
    stochSeparation: 1.0,
    gateType: "DUAL_HYBRID",
    cciContinuationThreshold: 40.0,
    minTakeProfitPoints: 0.30,
    maxHardStopPoints: 0.20, // Calibrated from 0.18 to 0.20 (clears 75th % 0.17 pt bar at $1.80 risk)
    modesAllowed: ["CONT", "REV"],
    notes: "150x multiplier ($0.124 pts/$1); Dual-Hybrid Engine; CONT: Stoch Only (TP 0.80 pt); REV: Zero-CCI + Stoch (TP 0.30 pt)."
  },
  "R_10": {
    symbol: "R_10",
    symbolName: "Volatility 10 Index",
    repoLabel: "Test Bot (V10 Live)",
    server: "S2",
    multiplier: 400,
    commissionUsd: 0.80,
    stochSeparation: 1.5,
    gateType: "OPTION_C2",
    cciContinuationThreshold: 50.0,
    minTakeProfitPoints: 24.0,
    maxHardStopPoints: 8.0, // Retained: fleet champion (+ $13.57 net, 2.08 PF, protected by Fakeout engine)
    modesAllowed: ["CONT", "REV"],
    notes: "400x multiplier ($2.40 pts/$1); Option C2; 24.0 pt TP delivers up to +$10.00 daily cap."
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
const STOCH_SEPARATION_MIN = PROFILE.stochSeparation;
const MIN_TP_POINTS_FLOOR = PROFILE.minTakeProfitPoints;
const MAX_HARD_SL_POINTS = PROFILE.maxHardStopPoints;
const MODES_ALLOWED = PROFILE.modesAllowed;
const GATE_TYPE = PROFILE.gateType || "BASELINE";

const TRADING_SYMBOL = SYMBOL;
const STAKE_USD = 5;
const SOFTWARE_SL_USD = -3.60;
const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const DAILY_PROFIT_TARGET_USD = 10.00;
const MARKET_DATA_APP_ID = "1089";
const TARGET_MIN_PROFIT = 5.00;

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

// ==================== DAILY LEDGER ====================
function writeToLedger(epoch, closePrice, cci, stochK, stochD, envUp, envLo, phase) {
  const dateStr = new Date(epoch * 1000).toISOString().split('T')[0];
  const file = `ledger_${SYMBOL}_${dateStr}.csv`;
  const timeStr = new Date(epoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const line = `${timeStr},${closePrice.toFixed(4)},${cci.toFixed(2)},${stochK.toFixed(2)},${stochD.toFixed(2)},${envUp.toFixed(4)},${envLo.toFixed(4)},${phase || "IDLE"}\n`;
  
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "Time,Close,CCI,Stoch_K,Stoch_D,Env_Up,Env_Lo,Phase\n");
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
    ws.on("open", () => {
      ws.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 120, end: "latest", style: "candles" }));
      ws.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      ws.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
      ws.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }));
    });
    ws.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.m5  = msg.candles;
      if (msg.req_id === 4) results.m15 = msg.candles;
      if (msg.req_id === 6) results.m30 = msg.candles;
      if (msg.req_id === 5) results.d1  = msg.candles;
      if (results.m5 && results.m15 && results.m30 && results.d1) { ws.close(); resolve(results); }
    });
    ws.on("error", err => { ws.close(); reject(err); });
    setTimeout(() => { ws.close(); reject(new Error("fetchAllData timeout")); }, 15000);
  });
}

async function fetchCurrentSpotPrice() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
    ws.on("open", () => {
      ws.send(JSON.stringify({ req_id: 3, ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" }));
    });
    ws.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 3 && msg.history && msg.history.prices && msg.history.prices.length > 0) {
        ws.close();
        resolve(parseFloat(msg.history.prices[msg.history.prices.length - 1]));
      }
    });
    ws.on("error", err => { ws.close(); reject(err); });
    setTimeout(() => { ws.close(); reject(new Error("fetchCurrentSpotPrice timeout")); }, 10000);
  });
}

// ==================== TECHNICAL ANALYSIS ====================
function sma(data, period) {
  return data.map((_, i) => (i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period));
}

function calculateStoch(candles, kPeriod = 18, dPeriod = 12, slowing = 25) {
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

function calculateEnvelopes(candles, period = 50, devPct = 0.05) {
  const closes = candles.map(c => parseFloat(c.close));
  const mid = sma(closes, period);
  return {
    upper: mid.map(m => (m !== null ? m * (1 + devPct / 100) : null)),
    lower: mid.map(m => (m !== null ? m * (1 - devPct / 100) : null))
  };
}

function calculateCCI(candles, n = 100) {
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

function computeDailyFibLevels(d1Candles) {
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

// 4-Hour Pre-Midnight Lookback for Stochastic (Gated strictly to 00:00 - 04:00 UTC)
function checkPreMidnightStochCross(candles, stoch, dir, type, midlineFallback) {
  const now = new Date();
  if (now.getUTCHours() >= 4) return false;

  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).getTime() / 1000;
  const fourHoursBeforeMidnight = todayMidnight - (4 * 3600);

  let startIdx = -1, endIdx = -1;
  for (let i = 0; i < candles.length; i++) {
    const ep = candles[i].epoch;
    if (ep >= fourHoursBeforeMidnight && startIdx === -1) startIdx = i;
    if (ep < todayMidnight) endIdx = i;
  }

  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return false;

  let validCrossIdx = -1;
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const k = stoch.k[i], d = stoch.d[i], pk = stoch.k[i - 1], pd = stoch.d[i - 1];
    if (k === null || d === null || pk === null || pd === null) continue;

    const crossUp = pk <= pd && k > d;
    const crossDown = pk >= pd && k < d;
    const crossedAbove50 = pk < 50 && k >= 50;
    const crossedBelow50 = pk > 50 && k <= 50;

    if (dir === "BUY") {
      let isMatch = type === "REV" ? ((crossUp && k <= 25) || (midlineFallback && crossUp && crossedAbove50)) : crossedAbove50;
      if (isMatch) validCrossIdx = i;
    } else {
      let isMatch = type === "REV" ? ((crossDown && k >= 75) || (midlineFallback && crossDown && crossedBelow50)) : crossedBelow50;
      if (isMatch) validCrossIdx = i;
    }
  }

  if (validCrossIdx === -1) return false;

  for (let i = validCrossIdx + 1; i < candles.length - 1; i++) {
    const k = stoch.k[i], d = stoch.d[i], pk = stoch.k[i - 1], pd = stoch.d[i - 1];
    if (k === null || d === null || pk === null || pd === null) continue;
    if (dir === "BUY" && (pk >= pd && k < d)) return false; 
    if (dir === "SELL" && (pk <= pd && k > d)) return false; 
  }

  return true;
}

function deriveHardStopPrice(entry, direction, setupType = null) {
  let hardStopPts = MAX_HARD_SL_POINTS;
  if (SYMBOL === "R_50" && setupType) {
    hardStopPts = setupType === "REV" ? 0.15 : 0.20;
  }
  const pointsSlPrice = direction === "BUY" ? entry - hardStopPts : entry + hardStopPts;

  const targetLoss = -5.00;
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  const dollarSlPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);

  return direction === "BUY" ? Math.max(pointsSlPrice, dollarSlPrice) : Math.min(pointsSlPrice, dollarSlPrice);
}

// ==================== HIGHER-TIMEFRAME TREND SHIELD ====================
// Evaluates M15 and M30 Stochastic momentum to shield trades from micro-wick noise.
// When HTF momentum strongly aligns with position direction, structure-based M5 candle closes
// take precedence over instantaneous sub-bar spikes.
function checkHtfTrendShield(direction, m15Candles, m30Candles) {
  if (!m15Candles || m15Candles.length < 30 || !m30Candles || m30Candles.length < 30) return false;
  try {
    const stochM15 = calculateStoch(m15Candles);
    const stochM30 = calculateStoch(m30Candles);
    const i15 = m15Candles.length - 2;
    const i30 = m30Candles.length - 2;
    const k15 = stochM15.k[i15], d15 = stochM15.d[i15];
    const k30 = stochM30.k[i30], d30 = stochM30.d[i30];
    if (k15 === null || d15 === null || k30 === null || d30 === null) return false;

    if (direction === "BUY") {
      const m15Bullish = (k15 >= d15) || (k15 > 35 && stochM15.k[i15] >= stochM15.k[i15 - 1]);
      const m30Bullish = (k30 >= d30) || (k30 >= 40);
      return Boolean(m15Bullish && m30Bullish);
    } else if (direction === "SELL") {
      const m15Bearish = (k15 <= d15) || (k15 < 65 && stochM15.k[i15] <= stochM15.k[i15 - 1]);
      const m30Bearish = (k30 <= d30) || (k30 <= 60);
      return Boolean(m15Bearish && m30Bearish);
    }
  } catch (e) {
    return false;
  }
  return false;
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

function findAdverseFractalAfterEntry(candles, entryEpoch, direction) {
  // For BUY: look for Top (high/resistance) fractal formed after entryEpoch
  // For SELL: look for Bottom (low/support) fractal formed after entryEpoch
  for (let k = candles.length - 3; k >= 2; k--) {
    if (candles[k].epoch < entryEpoch) break;
    if (direction === "BUY") {
      const high = parseFloat(candles[k].high);
      if (high > parseFloat(candles[k - 1].high) && high > parseFloat(candles[k - 2].high) &&
          high > parseFloat(candles[k + 1].high) && high > parseFloat(candles[k + 2].high)) {
        return { price: high, epoch: candles[k].epoch };
      }
    } else {
      const low = parseFloat(candles[k].low);
      if (low < parseFloat(candles[k - 1].low) && low < parseFloat(candles[k - 2].low) &&
          low < parseFloat(candles[k + 1].low) && low < parseFloat(candles[k + 2].low)) {
        return { price: low, epoch: candles[k].epoch };
      }
    }
  }
  return null;
}

function getTradeKeyLevel(trade, fib) {
  if (trade && typeof trade.keyLevel === "number") return trade.keyLevel;
  if (!fib) return null;
  const et = (trade && trade.entryType) ? trade.entryType : "";
  if (et.includes("0 to -50") || et.includes("0 to 50")) return fib.fib0;
  if (et.includes("50 to 0") || et.includes("50 to 100")) return fib.fib50;
  if (et.includes("79 to 0") || et.includes("79 to 100")) return fib.fib79;
  if (et.includes("100 to 161.8") || et.includes("100 to 50")) return fib.fib100;
  if (et.includes("-50 to 0")) return fib.fibM50;
  if (et.includes("161.8 to 100")) return fib.fib1618;
  return null;
}

// ==================== STATE MANAGEMENT ====================
let state = {
  symbol: SYMBOL,
  currentPrice: null,
  lastPriceUpdate: null,
  lastProcessedEpoch: null, lastTgUpdateId: 0, armed: null, confirm: null, dailyBiasPrice: null,
  last50Origin: null,
  dailyNetPnl: 0,
  dailyTargetReached: false,
  dailyTargetDate: null,
  // Persistent directional state tracking
  stochState: null,
  stochSeparation: null,
  cciState: null,
  nextPhase: null, h1TdiDir: null, fibBullish: null, fib0: null, fib50: null, fib618: null, fib79: null, fib100: null,
  cciAligned: false, stochAligned: false, envAligned: false
};
try { state = { ...state, ...JSON.parse(fs.readFileSync("state.json")) }; } catch {}
function saveState() { fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); }
function loadTrades() { try { return JSON.parse(fs.readFileSync("trades.json")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync("trades.json", JSON.stringify(t, null, 2)); }

// ==================== FAST PATH: RISK MANAGEMENT (RUNS EVERY 10 SECONDS) ====================
const closingContracts = new Set();

async function manageOpenTradesFastPath() {
  let trades = loadTrades();
  let openTrades = trades.filter(t => !t.result && !t.pending);
  if (openTrades.length === 0) return;

  let currentPrice;
  try {
    currentPrice = await fetchCurrentSpotPrice();
    state.symbol = SYMBOL;
    state.currentPrice = currentPrice;
    state.lastPriceUpdate = new Date().toISOString();
    saveState();
  } catch (e) {
    return;
  }

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);

    // =========================================================================
    // ðŸ›¡ï¸ TIERED PROFIT-LOCK SCALE (Dynamic Dollar-Based Trailing Stop)
    // =========================================================================
    if (pnl >= 9.00) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 7.80) {
        openTrade.lockedPnlFloor = 7.80;
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$9.00. Locking in +$7.80.`);
      }
    } else if (pnl >= 7.50) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 6.00) {
        openTrade.lockedPnlFloor = 6.00;
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$7.50. Locking in +$6.00.`);
      }
    } else if (pnl >= 6.00) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 4.80) {
        openTrade.lockedPnlFloor = 4.80;
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$6.00. Locking in +$4.80.`);
      }
    } else if (pnl >= 4.50) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 3.50) {
        openTrade.lockedPnlFloor = 3.50;
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$4.50. Locking in +$3.50.`);
      }
    } else if (pnl >= 3.00) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 1.50) {
        openTrade.lockedPnlFloor = 1.50;
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$3.00. Locking in +$1.50.`);
      }
    } else if (pnl >= 1.50) {
      if (!openTrade.lockedPnlFloor || openTrade.lockedPnlFloor < 0.20) {
        openTrade.lockedPnlFloor = 0.20; // BE + Commission
        saveTrades(trades);
        console.log(`[PROFIT-LOCK] ${openTrade.contractId} reached +$1.50. Locking Break-Even (+$0.20).`);
      }
    }
    // =========================================================================

    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction, openTrade.entryType?.includes("REV") ? "REV" : "CONT");

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    let tpHit = false;
    if (openTrade.fibTpPrice) {
      tpHit = isBuy ? currentPrice >= openTrade.fibTpPrice : currentPrice <= openTrade.fibTpPrice;
    }

    let reason = null;
    if (openTrade.lockedPnlFloor && pnl <= openTrade.lockedPnlFloor) { 
      reason = `Profit-Lock hit â€” Secured +$${openTrade.lockedPnlFloor.toFixed(2)}`; 
    }
    else if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit â€” PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit â€” PnL $${pnl.toFixed(2)}`; } 
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
        await sendTelegram(`ðŸŽ¯ *${REPO_LABEL} â€” DAILY TARGET ACHIEVED!* ðŸŽ¯\n\nDaily Net Profit: *+$${state.dailyNetPnl.toFixed(2)}*\nBot is now locked in profit protection until 00:00 UTC rollover.`);
      }

      saveTrades(trades);
      saveState();
      closingContracts.delete(openTrade.contractId);
      
      const icon = finalResult === "WIN" ? "âœ…" : "âŒ";
      const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
      const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
      await sendTelegram(`${icon} *${REPO_LABEL} â€” Trade ${finalResult}*\n\nDirection: ${openTrade.direction}\nðŸ“ Entry: ${Number(openTrade.entry).toFixed(4)}\nðŸ Exit: ${currentPrice.toFixed(4)}\n\nðŸ’µ P&L: *${pnlStr}* (Net of comm.)\nReason: ${reason}\nDuration: ${formatDuration(durationMs)}\nDaily Net Total: $${state.dailyNetPnl.toFixed(2)}\nContract: \`${openTrade.contractId}\``);
    }
  }
}

// ==================== SLOW PATH (RUNS ON CLOSED M5 CANDLE) ====================
async function runSlowPathScan(m5BoundaryEpoch) {
  console.log(`[${REPO_LABEL}] Scanning closed M5 candle: ${new Date(m5BoundaryEpoch * 1000).toISOString()}`);
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
        await sendTelegram(`âš ï¸ *${REPO_LABEL}* â€” Adopted unmanaged live contract \`${live.contract_id}\` (${dir}).`);
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
          await sendTelegram(`${t.result === "WIN" ? "âœ…" : "âŒ"} *${REPO_LABEL} â€” Trade ${t.result} (Broker Native Exit)*\n\nðŸ’µ P&L: *${rec.profit >= 0 ? `+$${rec.profit.toFixed(2)}` : `-$${Math.abs(rec.profit).toFixed(2)}`}*`);
        }
      }
    }
    saveTrades(trades);
    saveState();
  } catch (e) { dbg("Portfolio sync skipped:", e.message); }

  // 2. Fetch Market Candles
  let scanData;
  try { scanData = await fetchAllData(); } catch (e) { console.warn(`Fetch error: ${e.message}`); return; }
  const { m5: candles, m15: m15Candles, m30: m30Candles, d1: d1Candles } = scanData;

  if (!candles || candles.length < 120 || !m15Candles || !m30Candles || !d1Candles) return;
  const si = candles.length - 2; 
  const currentPrice = parseFloat(candles[si].close);
  state.symbol = SYMBOL;
  state.currentPrice = currentPrice;
  state.lastPriceUpdate = new Date().toISOString();

  // 3. Calculate Fibonacci Levels & Key M15 Candle Close First
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

  // 4. Manage Structure & Fakeout Early-Exit Protection on Active Trades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    // =========================================================================
    // ðŸ›¡ï¸ FAKEOUT EARLY-EXIT PROTECTION ENGINE (2-OF-3 CONFLUENCE FAILURE)
    // =========================================================================
    const isBuy = t.direction === "BUY";
    const pnl = calcUnrealizedPnL(t, currentPrice);
    const htfShield = checkHtfTrendShield(t.direction, m15Candles, m30Candles);
    t.htfShield = htfShield;

    if (pnl < 0) {
      let fakeoutVotes = 0;
      const fakeoutReasons = [];

      // Condition 1: Fresh adverse fractal formed against position in loss
      const advFractal = findAdverseFractalAfterEntry(candles, t.entryEpoch, t.direction);
      if (advFractal) {
        fakeoutVotes++;
        fakeoutReasons.push(isBuy ? `Adverse Top Fractal formed at ${advFractal.price.toFixed(4)}` : `Adverse Bottom Fractal formed at ${advFractal.price.toFixed(4)}`);
      }

      // Condition 2: M15 closed in opposite direction against key Fib level
      let m15Broken = false;
      const keyLvl = getTradeKeyLevel(t, fib);
      if (keyLvl !== null) {
        m15Broken = isBuy ? (m15Close < keyLvl) : (m15Close > keyLvl);
        if (m15Broken) {
          fakeoutVotes++;
          fakeoutReasons.push(isBuy ? `M15 closed (${m15Close.toFixed(4)}) below entry Fib level (${keyLvl.toFixed(4)})` : `M15 closed (${m15Close.toFixed(4)}) above entry Fib level (${keyLvl.toFixed(4)})`);
        }
      }

      // Condition 3: Two consecutive closed M5 candles against trade direction
      if (candles.length >= 4) {
        const c1 = parseFloat(candles[si].close);
        const c2 = parseFloat(candles[si - 1].close);
        const twoAdverse = isBuy ? (c1 < t.entry && c2 < t.entry) : (c1 > t.entry && c2 > t.entry);
        if (twoAdverse) {
          fakeoutVotes++;
          fakeoutReasons.push(isBuy ? `2 consecutive M5 candles closed below entry (${t.entry.toFixed(4)})` : `2 consecutive M5 candles closed above entry (${t.entry.toFixed(4)})`);
        }
      }

      // Higher-Timeframe Trend Shield Protection:
      // If HTF trend momentum (M15 + M30 Stochastic) strongly aligns with the trade direction
      // and M15 has not closed beyond the key Fib level, do not allow micro-fractals and
      // shallow 5m consolidation noise to cut a winning macro trend trade.
      const shouldExitFakeout = fakeoutVotes >= 2 && (!htfShield || m15Broken);

      if (fakeoutVotes >= 2 && htfShield && !m15Broken) {
        console.log(`[HTF SHIELD] Active ${t.direction} contract ${t.contractId}: M15/M30 momentum aligned. Absorbing M5 pullback noise without breaking Fib key level. Shielding trade from premature exit.`);
      }

      // If exit condition is confirmed: Exit trade immediately as Fakeout
      if (shouldExitFakeout) {
        closingContracts.add(t.contractId);
        const reason = `Fakeout Early-Exit (${fakeoutVotes}/3 conditions: ${fakeoutReasons.join(" | ")})`;
        console.log(`[FAKEOUT EXIT] Active ${t.direction} contract ${t.contractId}: ${reason}`);

        try {
          await closeContract(t.contractId);
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          t.serverPnl = settled !== null ? settled.profit : parseFloat(pnl.toFixed(2));
          t.resultSource = settled !== null ? "deriv_settled_official" : "fakeout_early_exit";
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          t.exitReason = reason;

          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          saveTrades(trades);
          saveState();

          const icon = t.result === "WIN" ? "âœ…" : "âŒ";
          const pnlStr = t.serverPnl >= 0 ? `+$${t.serverPnl.toFixed(2)}` : `-$${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`ðŸ›¡ï¸ *${REPO_LABEL} â€” Fakeout Early-Exit Liquidated*\n\nDirection: *${t.direction}*\nðŸ“ Entry: *${Number(t.entry).toFixed(4)}*\nðŸ Exit Spot: *${currentPrice.toFixed(4)}*\nðŸ’µ P&L: *${pnlStr}* (Early loss mitigation)\n\nâš ï¸ *Adverse Structural Failure (${fakeoutVotes}/3):*\nâ€¢ ${fakeoutReasons.join("\nâ€¢ ")}\n\nPosition cleared immediately to protect capital & unblock reverse setups.\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[FAKEOUT EXIT] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // Fractal SL Market Structure Break (Evaluated strictly on M5 Candle Close)
    const m5ClosePrice = currentPrice;
    if (t.sl) {
      const isBuy = t.direction === "BUY";
      const structureBroken = isBuy ? m5ClosePrice < t.sl : m5ClosePrice > t.sl;
      if (structureBroken) {
        closingContracts.add(t.contractId);
        console.log(`[STRUCTURE] M5 candle closed at ${m5ClosePrice.toFixed(4)} breaking ${t.fractalTimeframe || "M5"} fractal SL ${t.sl.toFixed(4)}. Exiting.`);
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
          const icon = t.result === "WIN" ? "âœ…" : "âŒ";
          const pnlStr = t.serverPnl >= 0 ? `+$${t.serverPnl.toFixed(2)}` : `-$${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} â€” ${t.fractalTimeframe || "M5"} Structure Break*\n\nM5 Candle closed at *${m5ClosePrice.toFixed(4)}* breaking fractal SL *${t.sl.toFixed(4)}*.\nðŸ’µ P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
        } catch (e) {
          console.error(`[STRUCTURE] Failed to close contract ${t.contractId}:`, e.message);
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    if (!t.m30FractalUpgraded && m15Candles.length >= 5) {
      for (let k = 2; k <= m15Candles.length - 4; k++) {
        if (m15Candles[k + 2].epoch + M15 > t.entryEpoch) {
          const c = m15Candles;
          if (t.direction === "BUY") {
            const isBottom = parseFloat(c[k].low) === Math.min(parseFloat(c[k-2].low), parseFloat(c[k-1].low), parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low));
            const frac = parseFloat(c[k].low);
            if (frac > t.sl && frac < t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`ðŸ”Ž *${REPO_LABEL}* â€” SL Upgraded to M15 Bottom: ${frac.toFixed(4)}`); break; }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (frac < t.sl && frac > t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`ðŸ”Ž *${REPO_LABEL}* â€” SL Upgraded to M15 Top: ${frac.toFixed(4)}`); break; }
          }
        }
      }
    }
  }

  // 5. Calculate Indicators & Write to Daily Ledger CSV
  const cci = calculateCCI(candles, 100);
  const env = calculateEnvelopes(candles, 50, 0.05);
  const stoch = calculateStoch(candles, 18, 12, 25);

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];

  if (cVal === null || prevCci === null || eUp === null || eLo === null || sK === null || sD === null || prevK === null || prevD === null) return;

  writeToLedger(m5BoundaryEpoch, currentPrice, cVal, sK, sD, eUp, eLo, (state.armed && state.armed.lbl) ? state.armed.lbl : "IDLE");

  // â”€â”€ A. RULE 1: UNIVERSAL KEY LEVEL TOUCH & CLOSE-SIDE ARMING â”€â”€
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

  const keyLevels = [
    { lvl: fib.fib0,    name: "0%" },
    { lvl: fib.fib50,   name: "50%" },
    { lvl: fib.fib79,   name: "79%" },
    { lvl: fib.fib100,  name: "100%" },
    { lvl: fib.fibM50,  name: "-50%" },
    { lvl: fib.fib1618, name: "161.8%" }
  ];

  for (const item of keyLevels) {
    if (!item.lvl) continue;
    const touched = isLevelTouched(item.lvl, currM15);
    const crossed = checkCrossover(item.lvl, prevM15Close, m15Close, m15Open);

    if (touched || crossed) {
      const closedAbove = m15Close >= item.lvl;
      const closedBelow = m15Close <= item.lvl;

      if (fib.bullish) {
        if (item.lvl === fib.fib0) {
          if (closedAbove) newArm = { type: "CONT", dir: "BUY", tp: fib.fibM50, lvl: fib.fib0, lbl: "CONT_BUY (0 to -50)" };
          else if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib50, lvl: fib.fib0, lbl: "REV_SELL (0 to 50)" };
        } else if (item.lvl === fib.fib50) {
          if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib0, lvl: fib.fib50, lbl: "REV_BUY (50 to 0)" };
          else if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib100, lvl: fib.fib50, lbl: "REV_SELL (50 to 100)" };
        } else if (item.lvl === fib.fib79) {
          if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib0, lvl: fib.fib79, lbl: "REV_BUY (79 to 0)" };
          else if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib100, lvl: fib.fib79, lbl: "REV_SELL (79 to 100)" };
        } else if (item.lvl === fib.fib100) {
          if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib50, lvl: fib.fib100, lbl: "REV_BUY (100 to 50)" };
          else if (closedBelow) newArm = { type: "CONT", dir: "SELL", tp: fib.fib1618, lvl: fib.fib100, lbl: "CONT_SELL (100 to 161.8)" };
        } else if (item.lvl === fib.fibM50 && closedBelow) {
          newArm = { type: "REV", dir: "SELL", tp: fib.fib0, lvl: fib.fibM50, lbl: "REV_SELL (-50 to 0)" };
        } else if (item.lvl === fib.fib1618 && closedAbove) {
          newArm = { type: "REV", dir: "BUY", tp: fib.fib100, lvl: fib.fib1618, lbl: "REV_BUY (161.8 to 100)" };
        }
      } else {
        if (item.lvl === fib.fib0) {
          if (closedBelow) newArm = { type: "CONT", dir: "SELL", tp: fib.fibM50, lvl: fib.fib0, lbl: "CONT_SELL (0 to -50)" };
          else if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib50, lvl: fib.fib0, lbl: "REV_BUY (0 to 50)" };
        } else if (item.lvl === fib.fib50) {
          if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib0, lvl: fib.fib50, lbl: "REV_SELL (50 to 0)" };
          else if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib100, lvl: fib.fib50, lbl: "REV_BUY (50 to 100)" };
        } else if (item.lvl === fib.fib79) {
          if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib0, lvl: fib.fib79, lbl: "REV_SELL (79 to 0)" };
          else if (closedAbove) newArm = { type: "REV", dir: "BUY", tp: fib.fib100, lvl: fib.fib79, lbl: "REV_BUY (79 to 100)" };
        } else if (item.lvl === fib.fib100) {
          if (closedAbove) newArm = { type: "CONT", dir: "BUY", tp: fib.fib1618, lvl: fib.fib100, lbl: "CONT_BUY (100 to 161.8)" };
          else if (closedBelow) newArm = { type: "REV", dir: "SELL", tp: fib.fib50, lvl: fib.fib100, lbl: "REV_SELL (100 to 50)" };
        } else if (item.lvl === fib.fibM50 && closedAbove) {
          newArm = { type: "REV", dir: "BUY", tp: fib.fib0, lvl: fib.fibM50, lbl: "REV_BUY (-50 to 0)" };
        } else if (item.lvl === fib.fib1618 && closedBelow) {
          newArm = { type: "REV", dir: "SELL", tp: fib.fib100, lvl: fib.fib1618, lbl: "REV_SELL (161.8 to 100)" };
        }
      }

      // Check if setup mode is allowed by this instrument's profile
      if (newArm && !MODES_ALLOWED.includes(newArm.type)) {
        dbg(`[PROFILE FILTER] Setup ${newArm.lbl} ignored; instrument allows only: ${MODES_ALLOWED.join(",")}`);
        newArm = null;
      }

      if (newArm) break;
    }
  }

  // Active M15 Wrong-Side Invalidation & Target Expiration
  if (state.armed) {
    if (state.armed.dir === "BUY" && m15Close < state.armed.lvl) {
      dbg(`[INVALIDATION] M15 closed at ${m15Close} BELOW armed BUY level ${state.armed.lvl}. Disarming.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    } else if (state.armed.dir === "SELL" && m15Close > state.armed.lvl) {
      dbg(`[INVALIDATION] M15 closed at ${m15Close} ABOVE armed SELL level ${state.armed.lvl}. Disarming.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    } else if (state.armed.dir === "BUY" && state.armed.tp && m15Close >= state.armed.tp) {
      dbg(`[EXPIRED] M15 closed at ${m15Close} at/above armed BUY target ${state.armed.tp} without confluence trigger. Disarming.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    } else if (state.armed.dir === "SELL" && state.armed.tp && m15Close <= state.armed.tp) {
      dbg(`[EXPIRED] M15 closed at ${m15Close} at/below armed SELL target ${state.armed.tp} without confluence trigger. Disarming.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    }
  }

  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    dbg(`[STATE] New Arm: ${newArm.lbl} (Level: ${newArm.lvl}, TP: ${newArm.tp})`);
    state.armed = newArm;
    state.confirm = { label: newArm.lbl, cci: { aligned: false }, stoch: { aligned: false }, env: { aligned: false }, gate: GATE_TYPE };
  }

  state.nextPhase = state.armed ? state.armed.lbl : null;

  // â”€â”€ B/C/D. PERSISTENT STATE CONFLUENCE ENGINE (DUAL-GATE: REVERSAL & PINNED TREND) â”€â”€
  const crossUp         = prevK <= prevD && sK > sD;
  const crossDown       = prevK >= prevD && sK < sD;
  const crossedAbove50  = prevK < 50 && sK >= 50;
  const crossedBelow50  = prevK > 50 && sK <= 50;
  const midlineFallback = STOCH_MIDLINE_FALLBACK_SYMBOLS.includes(SYMBOL);

  // Stochastic Separation Lead Filter (Calibrated per instrument)
  const stochSeparation = Math.abs(sK - sD);
  const separationValid = stochSeparation >= STOCH_SEPARATION_MIN;

  // 1. Stochastic State Evaluation
  if (crossUp && separationValid) {
    if (sK <= 25 || (midlineFallback && crossedAbove50)) {
      state.stochState = { dir: "BUY", type: "REV" };
    } else if (crossedAbove50 || prevK <= 55) {
      // Continuation: Micro-pullback cross in trend
      state.stochState = { dir: "BUY", type: "CONT" };
    } else {
      state.stochState = null;
    }
  } else if (crossDown && separationValid) {
    if (sK >= 75 || (midlineFallback && crossedBelow50)) {
      state.stochState = { dir: "SELL", type: "REV" };
    } else if (crossedBelow50 || prevK >= 45) {
      // Continuation: Micro-pullback cross in trend
      state.stochState = { dir: "SELL", type: "CONT" };
    } else {
      state.stochState = null;
    }
  }

  if (!state.stochState && state.armed) {
    const preMidnightValid = checkPreMidnightStochCross(candles, stoch, state.armed.dir, state.armed.type, midlineFallback);
    if (preMidnightValid && separationValid) {
      state.stochState = { dir: state.armed.dir, type: state.armed.type };
    }
  }

  // 2. CCI State Evaluation (Reversal Bounds)
  if (prevCci <= -70.5 && cVal > -70.5) {
    state.cciState = "BUY";
  } else if (state.cciState === "BUY" && cVal <= -70.5) {
    state.cciState = null;
  }

  if (prevCci >= 70.5 && cVal < 70.5) {
    state.cciState = "SELL";
  } else if (state.cciState === "SELL" && cVal >= 70.5) {
    state.cciState = null;
  }

  // 3. Envelopes State Evaluation
  let envState = null;
  if (currentPrice > eUp) envState = "BUY";
  if (currentPrice < eLo) envState = "SELL";

  // 4. Confluence Alignment (Calibrated Instrument Gate Engine)
  const gate = GATE_TYPE;

  if (state.armed) {
    const requiredDir = state.armed.dir;
    const requiredType = state.armed.type;

    // Envelope Band Requirement (Closed candle outside Envelopes in setup direction)
    state.envAligned = (envState === requiredDir);

    // Stochastic Alignment with separation lead filter
    const stochDirAligned = Boolean(state.stochState && state.stochState.dir === requiredDir);
    const stochRevAligned = Boolean(stochDirAligned && state.stochState.type === "REV");
    state.stochAligned = requiredType === "REV" ? (stochRevAligned || stochDirAligned) : stochDirAligned;

    // Strict Zero-Line CCI Alignment (BUY > 0 / SELL < 0)
    const zeroLineCciAligned = (requiredDir === "BUY" && cVal > 0) ||
                               (requiredDir === "SELL" && cVal < 0);

    // Extreme Zone Recovery CCI Alignment
    const zoneRecoveryCciAligned = (state.cciState === requiredDir);

    // Pinned Momentum CCI Alignment (for CONT)
    const cciThreshold = PROFILE.cciContinuationThreshold || 50.0;
    const pinnedCciAligned = (requiredDir === "BUY" && cVal >= cciThreshold) ||
                             (requiredDir === "SELL" && cVal <= -cciThreshold);

    if (gate === "OPTION_B") {
      // Option B (R_75, R_25): Stochastic Only outside Envelopes. CCI is completely bypassed.
      state.cciAligned = true;
    } else if (gate === "OPTION_C2") {
      // Option C2 (1HZ75V, R_100, 1HZ100V, R_10): Either Strict Zero-Line CCI OR Stochastic
      state.cciAligned = zeroLineCciAligned || zoneRecoveryCciAligned || pinnedCciAligned;
    } else if (gate === "DUAL_HYBRID") {
      // Dual-Hybrid (R_50):
      // On CONT: Stochastic Only outside Envelope (CCI bypassed)
      // On REV: Strict Zero-Line CCI (BUY > 0 / SELL < 0) + Stochastic cross
      if (requiredType === "CONT") {
        state.cciAligned = true;
      } else {
        state.cciAligned = zeroLineCciAligned || zoneRecoveryCciAligned;
      }
    } else {
      // Baseline Dual Confluence
      if (requiredType === "REV") {
        state.cciAligned = zoneRecoveryCciAligned;
      } else {
        state.cciAligned = pinnedCciAligned || zoneRecoveryCciAligned;
      }
    }
  } else {
    state.cciAligned = false;
    state.stochAligned = false;
    state.envAligned = false;
  }

  // â”€â”€ 6. TRIGGER LOGIC (WITH EXECUTION SIDE-GATE) â”€â”€
  let signalTriggered = false, direction = "", fibTpPrice = null, entryType = null, entryKeyLevel = null;

  let indicatorsSatisfied = false;
  if (state.armed && state.envAligned) {
    if (gate === "OPTION_B") {
      // Stochastic Only required
      indicatorsSatisfied = Boolean(state.stochAligned);
    } else if (gate === "OPTION_C2") {
      // Either Strict Zero-Line CCI OR Stochastic crossover required
      indicatorsSatisfied = Boolean(state.cciAligned || state.stochAligned);
    } else if (gate === "DUAL_HYBRID") {
      // CONT: Stoch Only; REV: Both Zero-Line CCI and Stoch required
      if (state.armed.type === "CONT") {
        indicatorsSatisfied = Boolean(state.stochAligned);
      } else {
        indicatorsSatisfied = Boolean(state.cciAligned && state.stochAligned);
      }
    } else {
      indicatorsSatisfied = Boolean(state.cciAligned && state.stochAligned);
    }
  }

  if (indicatorsSatisfied) {
    const isPriceValid = (state.armed.dir === "BUY" && currentPrice >= state.armed.lvl) ||
                         (state.armed.dir === "SELL" && currentPrice <= state.armed.lvl);

    if (isPriceValid) {
      signalTriggered = true;
      direction   = state.armed.dir;
      entryType   = state.armed.lbl;
      fibTpPrice  = state.armed.tp;
      entryKeyLevel = state.armed.lvl;
      state.armed   = null; 
      state.confirm = null;
      state.nextPhase = null;
      state.stochState = null;
      state.cciState = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    } else {
      dbg(`[ABORT TRIGGER] Price ${currentPrice} is on the wrong side of level ${state.armed.lvl} for ${state.armed.dir}. Aborting.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
    }
  }

  // â”€â”€ 7. EXECUTE & TELEGRAM DIAGNOSTIC CONFIRMATION CARD â”€â”€
  if (signalTriggered) {
    // Just-In-Time Execution Gate: If another trade is still open, block new execution.
    // If the old trade closed moments before this check, trades has no open positions and new trade executes instantly.
    trades = loadTrades();
    const activeTrade = trades.find(t => !t.result && !t.pending);
    if (activeTrade) {
      console.log(`[EXECUTION GATED] Signal ${entryType} confirmed, but position ${activeTrade.contractId} (${activeTrade.direction}) is currently active. Blocking new contract. Resetting armed state.`);
      state.armed = null;
      state.confirm = null;
      state.nextPhase = null;
      state.stochState = null;
      state.cciState = null;
      state.cciAligned = false;
      state.stochAligned = false;
      state.envAligned = false;
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
    const entry = currentPrice;

    // Calibrated Minimum Take Profit Engine (Points Floor + $5.00 Dynamic Extension)
    let calibratedMinPts = MIN_TP_POINTS_FLOOR;
    if (SYMBOL === "R_50") {
      calibratedMinPts = (entryType && entryType.includes("CONT")) ? 0.80 : 0.30;
    }

    const pointsTpPrice = direction === "BUY" ? entry + calibratedMinPts : entry - calibratedMinPts;

    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
    const dollarTpPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);

    const minRequiredTp = direction === "BUY" ? Math.max(pointsTpPrice, dollarTpPrice) : Math.min(pointsTpPrice, dollarTpPrice);

    if (direction === "BUY" && minRequiredTp > fibTpPrice) {
      fibTpPrice = minRequiredTp; entryType = entryType + " (Calibrated TP Ext)";
    } else if (direction === "SELL" && minRequiredTp < fibTpPrice) {
      fibTpPrice = minRequiredTp; entryType = entryType + " (Calibrated TP Ext)";
    }

    let initialFractal = findRecentFractal(candles, si, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction, entryType && entryType.includes("REV") ? "REV" : "CONT");

    let sl;
    if (direction === "BUY") {
      sl = (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    } else {
      sl = (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    }

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "ðŸŸ¢ â¬†ï¸ BUY" : "ðŸ”´ â¬‡ï¸ SELL";
    const envStatus = direction === "BUY" ? `Close ${currentPrice.toFixed(4)} > Upper ${eUp.toFixed(4)}` : `Close ${currentPrice.toFixed(4)} < Lower ${eLo.toFixed(4)}`;

    const entryHtfShield = checkHtfTrendShield(direction, m15Candles, m30Candles);

    const message = 
      `ðŸš¨ *${SYMBOL_NAME.toUpperCase()} SIGNAL* ðŸš¨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `ðŸ“ Entry: *${entry.toFixed(4)}*\n` +
      `ðŸ›‘ Initial SL: *${sl.toFixed(4)}* (${initialFractal ? "M5 Fractal" : "Hard Stop"})\n` +
      `ðŸŽ¯ Fib TP: *${fibTpPrice.toFixed(4)}*\n\n` +
      `ðŸ’° Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
      `ðŸ“ *Confluence & Profile Verified*\n` +
      `â€¢ Key Level Trigger: *${entryType}*\n` +
      `â€¢ Gate Engine: *${gate}*\n` +
      `â€¢ HTF Trend Shield (M15/M30): *${entryHtfShield ? "ðŸ›¡ï¸ ACTIVE (Trend Aligned)" : "âšª NEUTRAL"}*\n` +
      `â€¢ M5 CCI(100): *${cVal.toFixed(2)}* (${state.cciAligned ? "Aligned" : "Bypassed / Off"})\n` +
      `â€¢ M5 Stoch(18,12,25): *%K ${sK.toFixed(1)}* | *%D ${sD.toFixed(1)}* (Î” ${stochSeparation.toFixed(1)} â‰¥ ${STOCH_SEPARATION_MIN})\n` +
      `â€¢ M5 Envelopes(50, 0.05%): *${envStatus}*\n` +
      `â€¢ Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $10.00*\n` +
      `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
      `â° Time (UTC): ${timeFormatted}\n\n` +
      `ðŸ’¡ To close manually: send \`/close win\` or \`/close loss\``;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: m5BoundaryEpoch, fractalSl: initialFractal, fractalEpoch: null, fractalTimeframe: initialFractal ? "M5" : null, m30FractalUpgraded: false, fibTpPrice,
      keyLevel: entryKeyLevel, htfShield: entryHtfShield,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    saveTrades(trades);

    try {
      const contractId = await executeTrade(direction);
      if (!contractId) {
        trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
        await sendTelegram(`âŒ *${REPO_LABEL}* â€” Signal triggered, but broker returned no contract ID. Aborted.`);
        return;
      }
      pendingTradeRecord.contractId = contractId;
      pendingTradeRecord.pending = false;
      saveTrades(trades);
      await sendTelegram(message);
    } catch (execErr) {
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
      await sendTelegram(`âŒ *${REPO_LABEL}* â€” Live execution failed: ${execErr.message}`);
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
        const reply = t.length ? `ðŸ“ *Active Trades:*\n` + t.map(x => `â€¢ ${x.direction} @ ${Number(x.entry).toFixed(4)}`).join("\n") : `âšª No open trades.`;
        await sendTelegram(reply);
      }
    }
    saveState();
  } catch (e) {}
}

async function startContinuousEngine() {
  console.log(`[${REPO_LABEL}] ðŸš€ 24/7 Continuous Trading Engine Started Successfully.`);
  console.log(`[${REPO_LABEL}] âš™ï¸ Profile: Multiplier ${MULTIPLIER}x | Stoch Sep: â‰¥${STOCH_SEPARATION_MIN} | Modes: ${MODES_ALLOWED.join(",")}`);
  
  setInterval(checkTelegramCommands, 15000);

  let isScanning = false;

  while (true) {
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      const currentM5Boundary = nowEpoch - (nowEpoch % 300);

      await manageOpenTradesFastPath();

      // Ensure spot price is refreshed periodically in state.json even if no open trades
      if (!state.currentPrice || !state.lastPriceUpdate || (Date.now() - new Date(state.lastPriceUpdate).getTime() > 30000)) {
        try {
          const freshPrice = await fetchCurrentSpotPrice();
          state.symbol = SYMBOL;
          state.currentPrice = freshPrice;
          state.lastPriceUpdate = new Date().toISOString();
          saveState();
        } catch (e) {}
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

    await sleep(10000);
  }
}

// ==================== EXECUTION HOOK ====================
(async () => {
  await startContinuousEngine();
})();
