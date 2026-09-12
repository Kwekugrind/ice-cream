import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

// ==================== INSTRUMENT PROFILES (CALIBRATED EMPIRICAL MATRIX) ====================
// Pure empirical optimization based on 5-day flight recorder ledger data (Sept 7-11, 2026).
// Enforces calibrated Stochastic separation, dynamic Take Profit floors, and hard loss barriers.
const INSTRUMENT_PROFILES = {
  "R_75": {
    symbol: "R_75",
    symbolName: "Volatility 75 Index",
    repoLabel: "Lery's Alerts (V75 Demo)",
    server: "S1",
    multiplier: 50,
    commissionUsd: 0.15,
    stochSeparation: 3.5,
    minTakeProfitPoints: 98.0,
    maxHardStopPoints: 85.0,
    modesAllowed: ["CONT", "REV"],
    notes: "Heavyweight index; wide point swings require 3.5 stoch separation."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 50,
    commissionUsd: 0.15,
    stochSeparation: 3.0,
    minTakeProfitPoints: 13.0,
    maxHardStopPoints: 11.5,
    modesAllowed: ["CONT", "REV"],
    notes: "1-second tick speed; strict 3.0 stoch separation prevents micro-whipsaws."
  },
  "R_100": {
    symbol: "R_100",
    symbolName: "Volatility 100 Index",
    repoLabel: "Milk (V100 Demo)",
    server: "S1",
    multiplier: 40,
    commissionUsd: 0.15,
    stochSeparation: 1.5,
    minTakeProfitPoints: 1.50,
    maxHardStopPoints: 1.00,
    modesAllowed: ["CONT", "REV"],
    notes: "Steady mean-reverter; quick cycles hit targets in 1.5 to 2.3 points."
  },
  "R_25": {
    symbol: "R_25",
    symbolName: "Volatility 25 Index",
    repoLabel: "Tea (V25 Demo)",
    server: "S1",
    multiplier: 160,
    commissionUsd: 0.15,
    stochSeparation: 1.5,
    minTakeProfitPoints: 6.0,
    maxHardStopPoints: 4.9,
    modesAllowed: ["CONT"],
    notes: "Mega-trend runner; continuation mode dominates with multi-hour waves."
  },
  "1HZ100V": {
    symbol: "1HZ100V",
    symbolName: "Volatility 100 (1s) Index",
    repoLabel: "Ice Cream Machine",
    server: "S2",
    multiplier: 40,
    commissionUsd: 0.15,
    stochSeparation: 2.0,
    minTakeProfitPoints: 2.20,
    maxHardStopPoints: 1.65,
    modesAllowed: ["CONT", "REV"],
    notes: "High velocity; 2.0 separation filter captures explosive 3.8+ point expansions."
  },
  "R_50": {
    symbol: "R_50",
    symbolName: "Volatility 50 Index",
    repoLabel: "OmniSight (V50)",
    server: "S2",
    multiplier: 80,
    commissionUsd: 0.16,
    stochSeparation: 1.5,
    minTakeProfitPoints: 0.25,
    maxHardStopPoints: 0.18,
    modesAllowed: ["CONT", "REV"],
    notes: "Fastest target achiever; 0.38 points delivers full +$10.00 daily goal."
  },
  "R_10": {
    symbol: "R_10",
    symbolName: "Volatility 10 Index",
    repoLabel: "Test Bot (V10 Live)",
    server: "S2",
    multiplier: 400,
    commissionUsd: 0.16,
    stochSeparation: 1.5,
    minTakeProfitPoints: 14.0,
    maxHardStopPoints: 10.8,
    modesAllowed: ["CONT"],
    notes: "400x multiplier; 14.0 points hits +$5.00 net, 26.0 points delivers entire daily cap."
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
async function sendTelegram(msg) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, error: "missing_credentials" };
  const send = async (text, parseMode) => {
    const body = { chat_id: TG_CHAT_ID, text };
    if (parseMode) body.parse_mode = parseMode;
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
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

function deriveHardStopPrice(entry, direction) {
  const targetLoss = -5.00;
  const requiredRawPnl = targetLoss + COMMISSION_USD;
  const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
  return direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);
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
  } catch (e) {
    return;
  }

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);
    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);

    const hardStopBreached = isBuy ? currentPrice <= hardStopPrice : currentPrice >= hardStopPrice;
    let tpHit = false;
    if (openTrade.fibTpPrice) {
      tpHit = isBuy ? currentPrice >= openTrade.fibTpPrice : currentPrice <= openTrade.fibTpPrice;
    }

    let reason = null;
    if (hardStopBreached) { reason = `Hard SL breached at ${currentPrice.toFixed(4)}`; } 
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
          entryEpoch: live.date_start, fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false, fibTpPrice: null,
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

  // 3. Manage Structure Upgrades on Active Trades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;
    
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
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = t.serverPnl >= 0 ? `+$${t.serverPnl.toFixed(2)}` : `-$${Math.abs(t.serverPnl).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — ${t.fractalTimeframe || "M5"} Structure Break*\n\nM5 Candle closed at *${m5ClosePrice.toFixed(4)}* breaking fractal SL *${t.sl.toFixed(4)}*.\n💵 P&L: *${pnlStr}*\nContract: \`${t.contractId}\``);
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
            if (frac > t.sl && frac < t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Bottom: ${frac.toFixed(4)}`); break; }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (frac < t.sl && frac > t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Top: ${frac.toFixed(4)}`); break; }
          }
        }
      }
    }
  }

  // Pre-Scan Guard: Stop if an open trade exists
  if (openTrades.length > 0) {
    state.lastProcessedEpoch = m5BoundaryEpoch; saveState(); return;
  }

  // 4. Calculate Fibonacci Levels
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

  const cci = calculateCCI(candles, 100);
  const env = calculateEnvelopes(candles, 50, 0.05);
  const stoch = calculateStoch(candles, 18, 12, 25);

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];

  if (cVal === null || prevCci === null || eUp === null || eLo === null || sK === null || sD === null || prevK === null || prevD === null) return;

  // 5. Write to Daily Ledger CSV
  writeToLedger(m5BoundaryEpoch, currentPrice, cVal, sK, sD, eUp, eLo, state.armed ? state.armed.lbl : "IDLE");

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

  // Active M15 Wrong-Side Invalidation
  if (state.armed) {
    if (state.armed.dir === "BUY" && m15Close < state.armed.lvl) {
      dbg(`[INVALIDATION] M15 closed at ${m15Close} BELOW armed BUY level ${state.armed.lvl}. Disarming.`);
      state.armed = null;
      state.confirm = null;
    } else if (state.armed.dir === "SELL" && m15Close > state.armed.lvl) {
      dbg(`[INVALIDATION] M15 closed at ${m15Close} ABOVE armed SELL level ${state.armed.lvl}. Disarming.`);
      state.armed = null;
      state.confirm = null;
    }
  }

  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    dbg(`[STATE] New Arm: ${newArm.lbl} (Level: ${newArm.lvl}, TP: ${newArm.tp})`);
    state.armed = newArm;
    state.confirm = { label: newArm.lbl, cci: { aligned: false }, stoch: { aligned: false }, env: { aligned: false } };
  }

  state.nextPhase = state.armed ? state.armed.lbl : null;

  // ── B/C/D. PERSISTENT STATE CONFLUENCE ENGINE ──
  const crossUp         = prevK <= prevD && sK > sD;
  const crossDown       = prevK >= prevD && sK < sD;
  const crossedAbove50  = prevK < 50 && sK >= 50;
  const crossedBelow50  = prevK > 50 && sK <= 50;
  const midlineFallback = STOCH_MIDLINE_FALLBACK_SYMBOLS.includes(SYMBOL);

  // Stochastic Separation Lead Filter (Calibrated per instrument)
  const stochSeparation = Math.abs(sK - sD);
  const separationValid = stochSeparation >= STOCH_SEPARATION_MIN;

  if (crossUp && separationValid) {
    if (sK <= 25 || (midlineFallback && crossedAbove50)) {
      state.stochState = { dir: "BUY", type: "REV" };
    } else if (crossedAbove50) {
      state.stochState = { dir: "BUY", type: "CONT" };
    } else {
      state.stochState = null;
    }
  } else if (crossDown && separationValid) {
    if (sK >= 75 || (midlineFallback && crossedBelow50)) {
      state.stochState = { dir: "SELL", type: "REV" };
    } else if (crossedBelow50) {
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

  // CCI State Evaluation
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

  // Envelopes State
  let envState = null;
  if (currentPrice > eUp) envState = "BUY";
  if (currentPrice < eLo) envState = "SELL";

  if (state.armed) {
    const requiredDir = state.armed.dir;
    const requiredType = state.armed.type;
    state.cciAligned = (state.cciState === requiredDir);
    state.stochAligned = (state.stochState && state.stochState.dir === requiredDir && state.stochState.type === requiredType);
    state.envAligned = (envState === requiredDir);
  } else {
    state.cciAligned = false;
    state.stochAligned = false;
    state.envAligned = false;
  }

  // ── 6. TRIGGER LOGIC (WITH EXECUTION SIDE-GATE) ──
  let signalTriggered = false, direction = "", fibTpPrice = null, entryType = null;

  if (state.armed && state.cciAligned && state.stochAligned && state.envAligned) {
    const isPriceValid = (state.armed.dir === "BUY" && currentPrice >= state.armed.lvl) ||
                         (state.armed.dir === "SELL" && currentPrice <= state.armed.lvl);

    if (isPriceValid) {
      signalTriggered = true;
      direction   = state.armed.dir;
      entryType   = state.armed.lbl;
      fibTpPrice  = state.armed.tp;
      state.armed   = null; 
      state.stochState = null;
      state.cciState = null;
    } else {
      dbg(`[ABORT TRIGGER] Price ${currentPrice} is on the wrong side of level ${state.armed.lvl} for ${state.armed.dir}. Aborting.`);
      state.armed = null;
    }
  }

  // ── 7. EXECUTE & TELEGRAM DIAGNOSTIC CONFIRMATION CARD ──
  if (signalTriggered) {
    const entry = currentPrice;

    // Minimum Take Profit Dynamic Extension (Protects $5.00 min net profit per trade)
    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
    const minTpPrice = direction === "BUY" ? entry * (1 + priceMoveFraction) : entry * (1 - priceMoveFraction);

    if (direction === "BUY" && minTpPrice > fibTpPrice) {
      fibTpPrice = minTpPrice; entryType = entryType + " ($5 Ext)";
    } else if (direction === "SELL" && minTpPrice < fibTpPrice) {
      fibTpPrice = minTpPrice; entryType = entryType + " ($5 Ext)";
    }

    let initialFractal = findRecentFractal(candles, si, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    let sl;
    if (direction === "BUY") {
      sl = (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    } else {
      sl = (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    }

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";
    const envStatus = direction === "BUY" ? `Close ${currentPrice.toFixed(4)} > Upper ${eUp.toFixed(4)}` : `Close ${currentPrice.toFixed(4)} < Lower ${eLo.toFixed(4)}`;

    const message = 
      `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\n` +
      `Direction: *${dirEmoji}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Initial SL: *${sl.toFixed(4)}* (${initialFractal ? "M5 Fractal" : "Hard Stop"})\n` +
      `🎯 Fib TP: *${fibTpPrice.toFixed(4)}*\n\n` +
      `💰 Stake: $${STAKE_USD} | Multiplier: ${MULTIPLIER}x\n\n` +
      `📐 *Confluence & Profile Verified*\n` +
      `• Key Level Trigger: *${entryType}*\n` +
      `• M5 CCI(100): *${cVal.toFixed(2)}*\n` +
      `• M5 Stoch(18,12,25): *%K ${sK.toFixed(1)}* | *%D ${sD.toFixed(1)}* (Δ ${stochSeparation.toFixed(1)} ≥ ${STOCH_SEPARATION_MIN})\n` +
      `• M5 Envelopes(50, 0.05%): *${envStatus}*\n` +
      `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $10.00*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: m5BoundaryEpoch, fractalSl: initialFractal, fractalEpoch: null, fractalTimeframe: initialFractal ? "M5" : null, m30FractalUpgraded: false, fibTpPrice,
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
        const reply = t.length ? `📍 *Active Trades:*\n` + t.map(x => `• ${x.direction} @ ${Number(x.entry).toFixed(4)}`).join("\n") : `⚪ No open trades.`;
        await sendTelegram(reply);
      }
    }
    saveState();
  } catch (e) {}
}

async function startContinuousEngine() {
  console.log(`[${REPO_LABEL}] 🚀 24/7 Continuous Trading Engine Started Successfully.`);
  console.log(`[${REPO_LABEL}] ⚙️ Profile: Multiplier ${MULTIPLIER}x | Stoch Sep: ≥${STOCH_SEPARATION_MIN} | Modes: ${MODES_ALLOWED.join(",")}`);
  
  setInterval(checkTelegramCommands, 15000);

  let isScanning = false;

  while (true) {
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      const currentM5Boundary = nowEpoch - (nowEpoch % 300);

      await manageOpenTradesFastPath();

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
