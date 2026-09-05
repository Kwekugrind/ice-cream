import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config"; // <--- ADD THIS LINE

// ==================== REPOSITORY CONFIGURATION ====================
// UNCOMMENT THE CONFIGURATION MATCHING YOUR REPOSITORY:

// --- Server 2 Bots ---
// const SYMBOL = "R_10"; const SYMBOL_NAME = "Volatility 10 Index"; const REPO_LABEL = "Test Bot (V10 Live)"; const MULTIPLIER = 400; const COMMISSION_USD = 0.16;
// const SYMBOL = "R_50"; const SYMBOL_NAME = "Volatility 50 Index"; const REPO_LABEL = "OmniSight (V50)"; const MULTIPLIER = 80; const COMMISSION_USD = 0.16;
const SYMBOL = "1HZ100V"; const SYMBOL_NAME = "Volatility 100 (1s) Index"; const REPO_LABEL = "Ice Cream Machine"; const MULTIPLIER = 40; const COMMISSION_USD = 0.15;

// --- Server 1 Bots ---
// const SYMBOL = "R_75"; const SYMBOL_NAME = "Volatility 75 Index"; const REPO_LABEL = "Lery's Alerts (V75 Demo)"; const MULTIPLIER = 50; const COMMISSION_USD = 0.15;
// const SYMBOL = "1HZ75V"; const SYMBOL_NAME = "Volatility 75 (1s) Index"; const REPO_LABEL = "Coffee (V75-1s Demo)"; const MULTIPLIER = 50; const COMMISSION_USD = 0.15;
// const SYMBOL = "R_100"; const SYMBOL_NAME = "Volatility 100 Index"; const REPO_LABEL = "Milk (V100 Demo)"; const MULTIPLIER = 40; const COMMISSION_USD = 0.15;
// const SYMBOL = "R_25"; const SYMBOL_NAME = "Volatility 25 Index"; const REPO_LABEL = "Tea (V25 Demo)"; const MULTIPLIER = 160; const COMMISSION_USD = 0.15;

const TRADING_SYMBOL = SYMBOL;
const STAKE_USD = 5;
const SOFTWARE_SL_USD = -3.60;
const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const MARKET_DATA_APP_ID = "1089";

// Fade A: Gate 2 window — how long after RSI crosses signal line does CCI have to fire
const FADE_A_GATE2_WINDOW = 900; // 15 minutes (3 M5 candles)

// Tolerance for "price touching fib79" — candle high/low within 0.5% of the level
const FIB79_TOUCH_TOLERANCE = 0.005;

// Phase A: how many closed M15 candles back to look for a fresh M15 TDI middle-band cross.
// 3 = cross must have occurred within the last 45 minutes.
const PHASE_A_M15_CROSS_LOOKBACK = 3;

const GATEWAY_URL = process.env.GATEWAY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

const TG_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const MODE = process.env.MODE || "cronjob";
const TRIGGER_SOURCE = process.env.TRIGGER_SOURCE || "manual";

const M5  = 5  * 60;
const M15 = 15 * 60;
const M30 = 30 * 60;
const H1  = 60 * 60;
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
    try { json = await res.json(); } catch (e) { json = { ok: false, error: `invalid_json_response: ${e.message}` }; }
    json.__http_status = res.status;
    return json;
  };
  try {
    const data = await send(msg, "Markdown");
    if (!data.ok) {
      const plain = msg.replace(/[*_`\[\]]/g, "");
      const retry = await send(plain, "");
      if (!retry.ok) return { ok: false, error: "telegram_send_failed", detail: retry };
      return { ok: true, via: "plain_text", detail: retry };
    }
    return { ok: true, via: "markdown", detail: data };
  } catch (e) { return { ok: false, error: e.message }; }
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

async function runSummary(label) {
  const trades = fs.existsSync("trades.json") ? JSON.parse(fs.readFileSync("trades.json")) : [];
  const closed = trades.filter(t => t.result);
  const wins = closed.filter(t => t.result === "WIN").length;
  const losses = closed.filter(t => t.result === "LOSS").length;
  const openTrades = trades.filter(t => !t.result && !t.pending);
  let msg = `📊 *${label} Summary — ${REPO_LABEL}*\n\nTotal closed: ${closed.length}\n✅ Wins: ${wins} | ❌ Losses: ${losses}\nWin rate: ${closed.length ? ((wins / closed.length) * 100).toFixed(1) : 0}%\nOpen positions: ${openTrades.length}`;
  if (openTrades.length) msg += "\n\n*Open trades:*\n" + openTrades.map(t => `• ${t.direction} (${t.entryType}) @ ${t.entry} (${t.openTime})`).join("\n");
  await sendTelegram(msg);
}

async function checkTelegramCommands() {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    const offset = (state.lastTgUpdateId || 0) + 1;
    const url = `https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=10&timeout=0`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    for (const update of data.result) {
      state.lastTgUpdateId = update.update_id;
      const text = update.message?.text?.trim()?.toLowerCase();
      if (!text) continue;

      if (text === "/status") {
        const trades = fs.existsSync("trades.json") ? JSON.parse(fs.readFileSync("trades.json")) : [];
        const open = trades.filter(t => !t.result && !t.pending);
        const reply = open.length
          ? `📍 *${REPO_LABEL} Active Trades:*\n` + open.map(t => `• ${t.direction} @ ${Number(t.entry).toFixed(4)} (SL: ${t.sl ? Number(t.sl).toFixed(4) : "N/A"})`).join("\n")
          : `⚪ *${REPO_LABEL}*: No open trades.`;
        await sendTelegram(reply);
      }

      if (text === "/close win" || text === "/closewin") {
        await executeManualClose("WIN", "telegram command (/closewin)");
      }

      if (text === "/close loss" || text === "/closeloss") {
        await executeManualClose("LOSS", "telegram command (/closeloss)");
      }
    }
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
  } catch (e) { dbg("Telegram command check error:", e.message); }
}

async function executeManualClose(result, reason) {
  let trades = [];
  try { trades = JSON.parse(fs.readFileSync("trades.json")); } catch {}
  const open = trades.filter(t => !t.result && !t.pending);
  if (!open.length) {
    await sendTelegram(`⚠️ *${REPO_LABEL}*\n\nNo active open trade found to close.`);
    return;
  }

  for (const trade of open) {
    let serverPnl = null;
    let resultSource = "manual_command";
    if (trade.contractId) {
      try {
        const closeRes = await closeContract(trade.contractId);
        if (closeRes && typeof closeRes.sell?.profit === "number") {
          serverPnl = closeRes.sell.profit;
          resultSource = "server_close_confirmed";
        }
      } catch (e) {
        console.error("Manual close broker error:", e.message);
      }
    }

    const finalResult = (typeof serverPnl === "number") ? (serverPnl >= 0 ? "WIN" : "LOSS") : result;
    trade.result = finalResult;
    trade.resultSource = resultSource;
    trade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
    if (typeof serverPnl === "number") trade.serverPnl = serverPnl;
    fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));

    const icon = finalResult === "WIN" ? "✅" : "❌";
    const pnlStr = (typeof serverPnl === "number")
      ? (serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`)
      : (finalResult === "WIN" ? "+$?.??" : "-$3.60");

    await sendTelegram(`${icon} *${REPO_LABEL} — Trade Closed Manually*\n\nDirection: ${trade.direction}\n📍 Entry: ${Number(trade.entry).toFixed(4)}\n💵 P&L: *${pnlStr}*\nReason: ${reason}\nClosed: ${trade.closeTime}`);
  }
}

// ==================== GATEWAY CLIENT CALLS ====================
async function gatewayFetch(endpoint, method = "GET", body = null) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", "x-gateway-secret": GATEWAY_SECRET },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gateway HTTP error ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function getOpenPortfolio() {
  const res = await gatewayFetch("/portfolio");
  if (!res.ok || !res.authorized) throw new Error("Gateway is currently disconnected or not authorized with Deriv");
  if (!res.lastUpdate || (Date.now() - res.lastUpdate > 60000)) {
    const ageSeconds = Math.round((Date.now() - (res.lastUpdate || 0)) / 1000);
    throw new Error(`Gateway portfolio cache is stale (${ageSeconds}s old)`);
  }
  return res.portfolio || [];
}

async function executeTrade(direction) {
  const expectedContractType = direction === "BUY" ? "MULTUP" : "MULTDOWN";
  const slDollars = parseFloat(STAKE_USD.toFixed(2));
  const tpValue = SERVER_TP_USD;
  const payload = {
    buy: "1", price: STAKE_USD,
    parameters: { contract_type: expectedContractType, underlying_symbol: TRADING_SYMBOL, currency: "USD", amount: STAKE_USD, basis: "stake", multiplier: MULTIPLIER, limit_order: { stop_loss: slDollars, take_profit: tpValue } }
  };
  const data = await gatewayFetch("/buy", "POST", payload);
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.buy?.contract_id;
}

async function closeContract(contractId) {
  const payload = { sell: contractId, price: 0 };
  const data = await gatewayFetch("/sell", "POST", payload);
  if (data.error) {
    if (data.error.code === "ContractNotFound" || String(data.error.message).includes("not found")) return { error: { code: "ContractNotFound", message: data.error.message } };
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data;
}

async function getServerContractStatus(contractId) {
  const payload = { proposal_open_contract: 1, contract_id: contractId };
  const data = await gatewayFetch("/proposal_open_contract", "POST", payload);
  if (data.error?.code === "ContractNotFound") return { error: "ContractNotFound" };
  const poc = data.proposal_open_contract;
  if (poc) {
    return {
      profit: poc.profit, bid_price: poc.bid_price, current_spot: poc.current_spot,
      entry_spot: poc.entry_spot || poc.barrier || poc.entry_tick,
      is_sold: poc.is_sold, is_expired: poc.is_expired, status: poc.status
    };
  }
  return null;
}

async function getContractProfitFromHistory(contractId, approxOpenEpoch) {
  const payload = { profit_table: 1, description: 1, limit: 25, sort: "DESC", date_from: approxOpenEpoch ? approxOpenEpoch - 300 : undefined };
  const data = await gatewayFetch("/profit_table", "POST", payload);
  const transactions = data.profit_table?.transactions || [];
  const match = transactions.find(tx => String(tx.contract_id) === String(contractId));
  if (!match) return null;
  const profit = typeof match.profit === "number" ? match.profit : (parseFloat(match.sell_price) - parseFloat(match.buy_price));
  return { profit, sellTime: match.sell_time };
}

// ==================== MARKET DATA FETCHERS ====================
async function fetchAllData() {
  return new Promise((resolve, reject) => {
    const wsPublic = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
    const results = {};
    wsPublic.on("open", () => {
      wsPublic.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 120, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 2, ticks_history: SYMBOL, granularity: H1,  count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
    });
    wsPublic.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.m5  = msg.candles;
      if (msg.req_id === 2) results.h1  = msg.candles;
      if (msg.req_id === 4) results.m15 = msg.candles;
      if (msg.req_id === 5) results.d1  = msg.candles;
      if (msg.req_id === 6) results.m30 = msg.candles;
      if (results.m5 && results.h1 && results.d1 && results.m15 && results.m30) { wsPublic.close(); resolve(results); }
    });
    wsPublic.on("error", err => { wsPublic.close(); reject(err); });
    setTimeout(() => { wsPublic.close(); reject(new Error("fetchAllData timeout")); }, 15000);
  });
}

async function fetchOpenTradeData() {
  return new Promise((resolve, reject) => {
    const wsPublic = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
    const results = {};
    wsPublic.on("open", () => {
      wsPublic.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5,  count: 120, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 2, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 3, ticks_history: SYMBOL, count: 1,          end: "latest", style: "ticks" }));
      wsPublic.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
    });
    wsPublic.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.candles    = msg.candles;
      if (msg.req_id === 2) results.m15Candles = msg.candles;
      if (msg.req_id === 3) results.price       = msg.history?.prices?.[msg.history.prices.length - 1];
      if (msg.req_id === 6) results.m30Candles  = msg.candles;
      if (results.candles && results.m15Candles && results.price !== undefined && results.m30Candles) { wsPublic.close(); resolve(results); }
    });
    wsPublic.on("error", err => { wsPublic.close(); reject(err); });
    setTimeout(() => { wsPublic.close(); reject(new Error("fetchOpenTradeData timeout")); }, 15000);
  });
}

async function getCurrentPrice(sym = SYMBOL) {
  const data = await fetchOpenTradeData();
  return data.price;
}

// ==================== TECHNICAL ANALYSIS ====================

function sma(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    return data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

function ema(data, period) {
  const k = 2 / (period + 1);
  const result = [];
  let prev = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (i === period - 1) { prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period; result.push(prev); continue; }
    prev = data[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function calculateRSI(data, period = 14) {
  const result = new Array(data.length).fill(null);
  if (data.length <= period) return result;
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - (100 / (1 + rs));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff >= 0 ? 0 : -diff;
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - (100 / (1 + rs));
  }
  return result;
}

function calculateBollingerBands(data, period = 34, deviation = 1.619) {
  const middle = sma(data, period);
  const upper = [];
  const lower = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || middle[i] == null || data[i] == null) {
      upper.push(null); lower.push(null); continue;
    }
    const slice = data.slice(i - period + 1, i + 1);
    if (slice.some(val => val == null)) { upper.push(null); lower.push(null); continue; }
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdev = Math.sqrt(variance);
    upper.push(mean + (stdev * deviation));
    lower.push(mean - (stdev * deviation));
  }
  return { upper, middle, lower };
}

// Returns true if the M15 TDI RSI crossed the middle band in `direction` within the last
// `lookback` closed M15 candles. Prevents Phase A from firing when M15 RSI has been
// sitting on one side for hours — the cross must be genuinely recent.
function findM15FreshCross(rsiArr, middleArr, currentIdx, direction, lookback) {
  for (let i = currentIdx; i >= Math.max(1, currentIdx - lookback); i--) {
    const prev = rsiArr[i - 1];
    const curr = rsiArr[i];
    const prevMid = middleArr[i - 1];
    const currMid = middleArr[i];
    if (prev === null || curr === null || prevMid === null || currMid === null) continue;
    if (direction === "BUY"  && prev < prevMid && curr >= currMid) return true;
    if (direction === "SELL" && prev > prevMid && curr <= currMid) return true;
  }
  return false;
}

// TDI: RSI(14) smoothed by SMA(7) signal line, with Bollinger Bands(34, 1.619) as volatility envelope.
// RSI above middle band = bullish. RSI at/past outer band = extreme zone for Fade A Gate 1.
// RSI crosses signal line = momentum shift (Fade A Gate 2 entry trigger).
function calculateTDI(candles, rsiPeriod = 14, signalPeriod = 7, bbPeriod = 34, bbDev = 1.619) {
  const closes = candles.map(c => parseFloat(c.close));
  const rsi = calculateRSI(closes, rsiPeriod);
  const rsiForSignal = rsi.map(v => v !== null ? v : 50);
  const rawSignal = sma(rsiForSignal, signalPeriod);
  const signal = rawSignal.map((v, i) => rsi[i] === null ? null : v);
  const bands = calculateBollingerBands(rsi, bbPeriod, bbDev);
  return { rsi, signal, upper: bands.upper, middle: bands.middle, lower: bands.lower };
}

// CCI(14): precision M5 entry trigger.
// BUY: CCI crosses UP through -100 (prev < -100, curr > -100)
// SELL: CCI crosses DOWN through +100 (prev > +100, curr < +100)
function calculateCCI(candles, period = 14) {
  const result = new Array(candles.length).fill(null);
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const typicalPrices = slice.map(c => (parseFloat(c.high) + parseFloat(c.low) + parseFloat(c.close)) / 3);
    const meanTP = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDev = typicalPrices.reduce((a, b) => a + Math.abs(b - meanTP), 0) / period;
    if (meanDev === 0) { result[i] = 0; continue; }
    const currentTP = typicalPrices[typicalPrices.length - 1];
    result[i] = (currentTP - meanTP) / (0.015 * meanDev);
  }
  return result;
}

// Previous Day Fibonacci: drawn from yesterday's D1 high/low.
// Bullish yesterday (close > open): fib drawn from low to high.
// Bearish yesterday (close <= open): fib drawn from high to low.
// In both cases, 0% is the origin and 79% is near the extreme end.
// dailyBiasPrice = today's D1 open (the fixed horizontal Daily Bias line).
function computeDailyFibLevels(d1Candles) {
  if (!d1Candles || d1Candles.length < 2) return null;
  const yesterday = d1Candles[d1Candles.length - 2];
  const today     = d1Candles[d1Candles.length - 1];

  const prevHigh  = parseFloat(yesterday.high);
  const prevLow   = parseFloat(yesterday.low);
  const prevOpen  = parseFloat(yesterday.open);
  const prevClose = parseFloat(yesterday.close);
  const range     = prevHigh - prevLow;
  if (range <= 0) return null;

  const bullish = prevClose > prevOpen;
  const dailyBiasPrice = parseFloat(today.open);

  let fib0, fib50, fib618, fib79, fib100;
  if (bullish) {
    fib0   = prevLow;
    fib50  = prevLow + 0.50  * range;
    fib618 = prevLow + 0.618 * range;
    fib79  = prevLow + 0.79  * range;
    fib100 = prevHigh;
  } else {
    fib0   = prevHigh;
    fib50  = prevHigh - 0.50  * range;
    fib618 = prevHigh - 0.618 * range;
    fib79  = prevHigh - 0.79  * range;
    fib100 = prevLow;
  }

  return { bullish, fib0, fib50, fib618, fib79, fib100, dailyBiasPrice, prevHigh, prevLow };
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

// Derive which phase to look for based on the most recently closed trade.
// WIN on PHASE_A → look for PHASE_B next.
// WIN on FADE_A  → look for FADE_B next.
// Any LOSS, or PHASE_B/FADE_B WIN → idle (look for PHASE_A or FADE_A).
function deriveNextPhase(trades) {
  const closedTrades = trades.filter(t => t.result)
    .sort((a, b) => new Date(b.closeTime || 0) - new Date(a.closeTime || 0));
  const lastClosed = closedTrades[0];
  if (!lastClosed) return null;
  if (lastClosed.result === "WIN") {
    if (lastClosed.entryType === "PHASE_A") return "PHASE_B";
    if (lastClosed.entryType === "FADE_A")  return "FADE_B";
  }
  return null;
}

// ==================== STATE ====================
// nextPhase: null = idle (look for PHASE_A or FADE_A)
//            "PHASE_B" = after PHASE_A WIN, wait for Phase B CCI entry
//            "FADE_B"  = after FADE_A WIN, wait for Fade B SMA8+CCI entry
// fadeAGate1Met: true when M15 TDI RSI touched outer band while price was at/near fib79
// fadeAGate1Dir: "BUY" or "SELL" (direction of the Fade A trade when Gate 1 fired)
// fadeAWasAboveSig: tracks RSI position relative to signal line for cross detection (Gate 2)
// fadeAGate2CrossEpoch: epoch when Gate 2 RSI-signal cross was detected (for FADE_A_GATE2_WINDOW)
// fib0..fib100, dailyBiasPrice: previous-day Fibonacci levels (updated each scan, displayed on dashboard)
let state = {
  lastProcessedEpoch: null,
  lastTgUpdateId: 0,
  nextPhase: null,
  fadeAGate1Met: false,
  fadeAGate1Dir: null,
  fadeAWasAboveSig: null,
  fadeAGate2CrossEpoch: null,
  fibBullish: null,
  fib0: null,
  fib50: null,
  fib618: null,
  fib79: null,
  fib100: null,
  dailyBiasPrice: null
};
try {
  const s = JSON.parse(fs.readFileSync("state.json"));
  state = { ...state, ...s };
} catch {}

// ==================== MAIN SCANNER ====================
async function runScanMode() {
  console.log(`[${REPO_LABEL}] Scan started — ${new Date().toISOString()}`);
  let trades = [];
  try { trades = JSON.parse(fs.readFileSync("trades.json")); } catch {}

  // ── STEP 0: Gateway portfolio read ──
  let allLiveContracts = [];
  try {
    const allPortfolio = await getOpenPortfolio();
    allLiveContracts = allPortfolio.filter(c => getContractSymbol(c) === TRADING_SYMBOL);
    dbg(`Live broker contracts for ${TRADING_SYMBOL}: ${allLiveContracts.length}`);
  } catch (pErr) {
    console.warn(`[${REPO_LABEL}] Warning: Failed to read gateway portfolio: ${pErr.message}. Aborting scan.`);
    return;
  }

  // Duplicate detection
  if (allLiveContracts.length > 2) {
    const dupDetails = allLiveContracts.map(c => `• Contract ID: \`${c.contract_id}\` (${c.contract_type}) @ ${c.buy_price || "N/A"}`).join("\n");
    await sendTelegram(`🚨 *DUPLICATE CONTRACTS DETECTED — ${REPO_LABEL}*\n\nFound *${allLiveContracts.length}* live open contracts on Deriv simultaneously:\n${dupDetails}\n\n⚠️ Bot will manage all contracts independently.`);
  }

  // Reconcile broker state with trades.json
  for (const liveContract of allLiveContracts) {
    const liveStartTime = liveContract.date_start ? liveContract.date_start * 1000 : null;
    const expectedType = liveContract.contract_type === "MULTUP" ? "BUY" : "SELL";
    let matchedTrade = trades.find(t =>
      String(t.contractId) === String(liveContract.contract_id) ||
      (t.pending && t.direction === expectedType && liveStartTime &&
       Math.abs(new Date(t.openTime).getTime() - liveStartTime) <= 60000));

    if (matchedTrade) {
      if (matchedTrade.pending) {
        matchedTrade.contractId = liveContract.contract_id;
        matchedTrade.pending = false;
        matchedTrade.brokerSlAmount = STAKE_USD;
      }
    } else {
      const dir = expectedType;
      let entryPrice = 0;
      try {
        const poc = await getServerContractStatus(liveContract.contract_id);
        if (poc && (poc.entry_spot || poc.barrier)) entryPrice = parseFloat(poc.entry_spot || poc.barrier);
      } catch {}
      if (!entryPrice || entryPrice <= 10) entryPrice = await getCurrentPrice(TRADING_SYMBOL);

      const calculatedSl = deriveHardStopPrice(entryPrice, dir);
      const adoptedRecord = {
        id: `${SYMBOL}-${new Date().toISOString()}`, contractId: liveContract.contract_id,
        pending: false, repo: REPO_LABEL, symbol: SYMBOL, direction: dir, entry: entryPrice,
        sl: calculatedSl, rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
        entryEpoch: liveStartTime ? Math.floor(liveStartTime / 1000) : Math.floor(Date.now() / 1000),
        fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false,
        fibTpPrice: null,
        openTime: liveStartTime ? new Date(liveStartTime).toISOString().replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
        closeTime: null, result: null
      };
      trades.push(adoptedRecord);
      await sendTelegram(`⚠️ *${REPO_LABEL}* — Adopted unmanaged live contract \`${liveContract.contract_id}\` into tracking (Entry: ${entryPrice.toFixed(4)}, SL: ${calculatedSl.toFixed(4)}).`);
    }
  }

  // Detect closed contracts
  const liveContractIdSet = new Set(allLiveContracts.map(c => String(c.contract_id)));
  for (let i = trades.length - 1; i >= 0; i--) {
    const t = trades[i];
    if (!t.result) {
      if (t.pending) {
        trades.splice(i, 1);
      } else if (t.contractId && !liveContractIdSet.has(String(t.contractId))) {
        let recovered = null;
        try {
          const openEpoch = t.openTime ? Math.floor(new Date(t.openTime).getTime() / 1000) : undefined;
          recovered = await getContractProfitFromHistory(t.contractId, openEpoch);
        } catch {}
        if (recovered && typeof recovered.profit === "number") {
          t.result = recovered.profit >= 0 ? "WIN" : "LOSS"; t.resultSource = "server_history_verified";
          t.closeTime = t.closeTime || (recovered.sellTime ? new Date(recovered.sellTime * 1000).toISOString().replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19));
          t.serverPnl = recovered.profit;
          const icon = t.result === "WIN" ? "✅" : "❌";
          const pnlStr = recovered.profit >= 0 ? `+$${recovered.profit.toFixed(2)}` : `-$${Math.abs(recovered.profit).toFixed(2)}`;
          await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${t.result} (Broker Native Exit)*\n\nDirection: ${t.direction}\nSymbol: ${SYMBOL_NAME}\n\n📍 Entry: ${Number(t.entry).toFixed(4)}\n💵 P&L: *${pnlStr}*\nClosed: ${t.closeTime}`);
        } else {
          t.orphanRetryCount = (t.orphanRetryCount || 0) + 1;
          if (t.orphanRetryCount >= 3) {
            t.result = t.result || "LOSS"; t.resultSource = "estimated_fallback";
            t.closeTime = t.closeTime || new Date().toISOString().replace("T", " ").substring(0, 19);
            await sendTelegram(`❌ *${REPO_LABEL} — Trade ${t.result} (Assumed)*\n\nDirection: ${t.direction}\nSymbol: ${SYMBOL_NAME}\n\n💵 P&L: -$3.60 (Estimated)\nReason: Contract unrecoverable after 3 sync attempts.\nContract: \`${t.contractId}\``);
          }
        }
      }
    }
  }
  fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));

  // ── STEP 0.5: Telegram commands ──
  await checkTelegramCommands();

  // ── Open Position Management ──
  const openTradesList = trades.filter(t => !t.result && !t.pending);
  if (openTradesList.length > 0) {
    let tradeData;
    try { tradeData = await fetchOpenTradeData(); } catch (err) {
      console.warn(`[${REPO_LABEL}] Failed to fetch open trade data: ${err.message}. Skipping.`); return;
    }

    const currentPrice = tradeData.price;
    const currentM5   = tradeData.candles[tradeData.candles.length - 1];
    const candleHigh  = parseFloat(currentM5.high);
    const candleLow   = parseFloat(currentM5.low);

    for (const openTrade of openTradesList) {
      const isBuy = openTrade.direction === "BUY";
      let pnl = calcUnrealizedPnL(openTrade, currentPrice);

      const closeWith = async (result, exitReason) => {
        let serverPnl = pnl;
        let resultSource = "estimated_fallback";
        if (openTrade.contractId) {
          try {
            const closeRes = await closeContract(openTrade.contractId);
            if (closeRes && !closeRes.error) {
              serverPnl = closeRes.sell?.profit ?? pnl;
              resultSource = "server_close_confirmed";
            }
          } catch (e) {
            console.error("Close exception:", e.message);
            await sendTelegram(`⚠️ *${REPO_LABEL}* — Close Error: ${e.message}. Retrying next scan.`);
            return;
          }
        }
        const finalResult = (typeof serverPnl === "number") ? (serverPnl >= 0 ? "WIN" : "LOSS") : result;
        openTrade.result = finalResult;
        openTrade.resultSource = resultSource;
        openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
        openTrade.serverPnl = typeof serverPnl === "number" ? serverPnl : null;
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        const icon = finalResult === "WIN" ? "✅" : "❌";
        const contractType = openTrade.direction === "BUY" ? "MULTUP" : "MULTDOWN";
        const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
        const slDollars = parseFloat((openTrade.brokerSlAmount || STAKE_USD).toFixed(2));
        const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
        const fibTpLabel = openTrade.fibTpPrice ? openTrade.fibTpPrice.toFixed(4) : "N/A";
        await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${finalResult}*\n\nDirection: ${openTrade.direction} (${contractType})\nSymbol: ${SYMBOL_NAME}\n\n📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n🏁 Exit: ${currentPrice.toFixed(4)}\n🛑 SL: ${openTrade.sl ? openTrade.sl.toFixed(4) : "N/A"} ($${slDollars} hard)\n🎯 Fib TP: ${fibTpLabel} (${openTrade.entryType})\n\n💵 P&L: *${pnlStr}* (Net of comm.)\nReason: ${exitReason}\nDuration: ${formatDuration(durationMs)}\n\nOpened: ${openTrade.openTime}\nClosed: ${openTrade.closeTime}\n` + (openTrade.contractId ? `Contract: \`${openTrade.contractId}\`` : ""));
      };

      // 1. M15 Fractal SL Tracking (one-time upgrade from hard stop to M15 structure)
      if (!openTrade.m30FractalUpgraded && tradeData.m15Candles && tradeData.m15Candles.length >= 5) {
        const c = tradeData.m15Candles;
        const tradeEntryEpoch = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);
        const currentIndex = c.length - 2;

        for (let k = 2; k <= currentIndex - 2; k++) {
          if (c[k + 2].epoch + M15 > tradeEntryEpoch) {
            if (openTrade.direction === "BUY") {
              const isBottom = parseFloat(c[k].low) === Math.min(
                parseFloat(c[k - 2].low), parseFloat(c[k - 1].low),
                parseFloat(c[k].low), parseFloat(c[k + 1].low), parseFloat(c[k + 2].low)
              );
              const fractalVal = parseFloat(c[k].low);
              if (isBottom && fractalVal > openTrade.sl && fractalVal < openTrade.entry) {
                openTrade.m30FractalUpgraded = true;
                openTrade.fractalSl = fractalVal;
                openTrade.sl = fractalVal;
                openTrade.fractalEpoch = c[k].epoch;
                openTrade.fractalTimeframe = "M15";
                fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
                await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Structure\n\nTrade: ${openTrade.direction}\nNew M15 Bottom Fractal SL: ${openTrade.sl.toFixed(4)}`);
                break;
              }
            } else if (openTrade.direction === "SELL") {
              const isTop = parseFloat(c[k].high) === Math.max(
                parseFloat(c[k - 2].high), parseFloat(c[k - 1].high),
                parseFloat(c[k].high), parseFloat(c[k + 1].high), parseFloat(c[k + 2].high)
              );
              const fractalVal = parseFloat(c[k].high);
              if (isTop && fractalVal < openTrade.sl && fractalVal > openTrade.entry) {
                openTrade.m30FractalUpgraded = true;
                openTrade.fractalSl = fractalVal;
                openTrade.sl = fractalVal;
                openTrade.fractalEpoch = c[k].epoch;
                openTrade.fractalTimeframe = "M15";
                fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
                await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Structure\n\nTrade: ${openTrade.direction}\nNew M15 Top Fractal SL: ${openTrade.sl.toFixed(4)}`);
                break;
              }
            }
          }
        }
      }

      // 2. M30 Market Structure Early Exit
      if (tradeData.m30Candles && tradeData.m30Candles.length >= 4) {
        const m30 = tradeData.m30Candles;
        const latestClosedM30 = m30[m30.length - 2];
        const tradeEntryEpoch = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);
        let structOpenPrice = null;
        for (let k = m30.length - 3; k >= 0; k--) {
          const c = m30[k];
          if (c.epoch + M30 <= tradeEntryEpoch) break;
          const cOpen = parseFloat(c.open), cClose = parseFloat(c.close);
          if (openTrade.direction === "BUY" && cClose > cOpen) { structOpenPrice = cOpen; break; }
          else if (openTrade.direction === "SELL" && cClose < cOpen) { structOpenPrice = cOpen; break; }
        }
        if (structOpenPrice !== null) {
          const latestClose = parseFloat(latestClosedM30.close);
          const structureBroken = (openTrade.direction === "BUY" && latestClose < structOpenPrice) ||
                                  (openTrade.direction === "SELL" && latestClose > structOpenPrice);
          if (structureBroken) {
            const result = pnl >= 0 ? "WIN" : "LOSS";
            await closeWith(result, `M30 Market Structure Broken — Latest M30 closed at ${latestClose.toFixed(4)}, breaking structural level ${structOpenPrice.toFixed(4)}.`);
            continue;
          }
        }
      }

      // 3. Hard SL & Fractal SL
      const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);
      const hardSlBreached = openTrade.direction === "BUY"
        ? (currentPrice <= hardStopPrice || candleLow <= hardStopPrice)
        : (currentPrice >= hardStopPrice || candleHigh >= hardStopPrice);

      let fractalBreached = false;
      if (openTrade.fractalSl && openTrade.fractalTimeframe) {
        let closedCandlePrice = null;
        if (openTrade.fractalTimeframe === "M15" && tradeData.m15Candles && tradeData.m15Candles.length >= 2)
          closedCandlePrice = parseFloat(tradeData.m15Candles[tradeData.m15Candles.length - 2].close);
        if (openTrade.fractalTimeframe === "M30" && tradeData.m30Candles && tradeData.m30Candles.length >= 2)
          closedCandlePrice = parseFloat(tradeData.m30Candles[tradeData.m30Candles.length - 2].close);
        if (closedCandlePrice !== null) {
          if (openTrade.direction === "BUY" && closedCandlePrice < openTrade.fractalSl) fractalBreached = true;
          if (openTrade.direction === "SELL" && closedCandlePrice > openTrade.fractalSl) fractalBreached = true;
        }
      }

      if (hardSlBreached || fractalBreached) {
        const reason = fractalBreached
          ? `${openTrade.fractalTimeframe} Fractal SL hit (${openTrade.direction === "BUY" ? "below" : "above"} ${openTrade.fractalSl.toFixed(4)})`
          : `Hard SL hit — price breached ${hardStopPrice.toFixed(4)}`;
        await closeWith("LOSS", reason); continue;
      }

      // 4. Catastrophic floor — absolute last-resort P&L backstop
      if (pnl <= CATASTROPHIC_PNL_FLOOR) {
        await closeWith("LOSS", `Catastrophic floor hit — PnL $${pnl.toFixed(2)} (Floor: $${CATASTROPHIC_PNL_FLOOR.toFixed(2)})`); continue;
      }

      // 5. Software Stop Loss (-$3.60)
      if (pnl <= SOFTWARE_SL_USD) {
        await closeWith("LOSS", `Software SL hit — PnL $${pnl.toFixed(2)} (Limit: $${SOFTWARE_SL_USD.toFixed(2)})`); continue;
      }

      // 6. Fibonacci TP Close — closes when price reaches the stored fib level for this phase
      if (openTrade.fibTpPrice) {
        const tpHit = isBuy
          ? (currentPrice >= openTrade.fibTpPrice || candleHigh >= openTrade.fibTpPrice)
          : (currentPrice <= openTrade.fibTpPrice || candleLow <= openTrade.fibTpPrice);
        if (tpHit) {
          await closeWith("WIN", `Fib TP reached — ${openTrade.entryType} target at ${openTrade.fibTpPrice.toFixed(4)}`);
          continue;
        }
      }
    }
  }

  // ── Pre-Scan Guard ──
  let allowScan = false;
  const unresolvedTrades = trades.filter(t => !t.result);

  if (allLiveContracts.length === 0 && unresolvedTrades.length === 0) {
    allowScan = true;
  }

  if (!allowScan) {
    console.log(`[${REPO_LABEL}] Position currently active or unresolved — skipping signal scan.`);
    return;
  }

  // ── Fetch Signal Data ──
  let scanData;
  try { scanData = await fetchAllData(); } catch (fetchErr) {
    console.warn(`[${REPO_LABEL}] Failed to fetch market candles: ${fetchErr.message}. Skipping scan.`); return;
  }
  const candles   = scanData.m5;
  const h1Candles = scanData.h1;
  const d1Candles = scanData.d1;
  const m15Candles = scanData.m15;

  if (!candles || candles.length < 60)     return;
  if (!h1Candles || h1Candles.length < 50) return;
  if (!m15Candles || m15Candles.length < 100) return;
  if (!d1Candles || d1Candles.length < 2)  return;

  const si = candles.length - 2;  // Last closed M5 candle index
  const currentCandleEpoch = candles[si].epoch;
  const closes = candles.map(c => parseFloat(c.close));

  if (state.lastProcessedEpoch === currentCandleEpoch) {
    console.log("Already processed this candle — skipping."); return;
  }
  const isoTime = new Date(currentCandleEpoch * 1000).toISOString();

  // ── Compute Previous Day Fibonacci ──
  const fib = computeDailyFibLevels(d1Candles);
  if (!fib) {
    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); return;
  }

  // Save fib levels to state for dashboard display
  state.fibBullish     = fib.bullish;
  state.fib0           = parseFloat(fib.fib0.toFixed(4));
  state.fib50          = parseFloat(fib.fib50.toFixed(4));
  state.fib618         = parseFloat(fib.fib618.toFixed(4));
  state.fib79          = parseFloat(fib.fib79.toFixed(4));
  state.fib100         = parseFloat(fib.fib100.toFixed(4));
  state.dailyBiasPrice = parseFloat(fib.dailyBiasPrice.toFixed(4));

  // ── H1 TDI — Main Trend Direction ──
  const h1Tdi    = calculateTDI(h1Candles);
  const h1i      = h1Candles.length - 2;  // Last closed H1 candle
  const h1TdiRsi    = h1Tdi.rsi[h1i];
  const h1TdiMiddle = h1Tdi.middle[h1i];
  const h1TdiReady  = h1TdiRsi !== null && h1TdiMiddle !== null;
  const h1TdiDir    = h1TdiReady
    ? (h1TdiRsi > h1TdiMiddle ? "BUY" : h1TdiRsi < h1TdiMiddle ? "SELL" : null)
    : null;

  // ── H1 SMA(8) ──
  const h1Closes  = h1Candles.map(c => parseFloat(c.close));
  const h1Sma8Arr = sma(h1Closes, 8);
  const h1Sma8Val = h1Sma8Arr[h1i];
  const h1LastClose = h1Closes[h1i];
  const h1Sma8Dir = h1Sma8Val !== null
    ? (h1LastClose > h1Sma8Val ? "BUY" : h1LastClose < h1Sma8Val ? "SELL" : null)
    : null;

  // ── M15 TDI ──
  const m15Tdi    = calculateTDI(m15Candles);
  const m15i      = m15Candles.length - 2;  // Last closed M15 candle
  const m15TdiRsi    = m15Tdi.rsi[m15i];
  const m15TdiSignal = m15Tdi.signal[m15i];
  const m15TdiMiddle = m15Tdi.middle[m15i];
  const m15TdiUpper  = m15Tdi.upper[m15i];
  const m15TdiLower  = m15Tdi.lower[m15i];
  const m15TdiReady  = m15TdiRsi !== null && m15TdiSignal !== null && m15TdiMiddle !== null;
  const m15TdiDir    = m15TdiReady
    ? (m15TdiRsi > m15TdiMiddle ? "BUY" : m15TdiRsi < m15TdiMiddle ? "SELL" : null)
    : null;

  // ── M5 CCI(14) ──
  const m5Cci = calculateCCI(candles);
  const m5CciBuyCross  = m5Cci[si - 1] !== null && m5Cci[si] !== null && m5Cci[si - 1] < -100 && m5Cci[si] > -100;
  const m5CciSellCross = m5Cci[si - 1] !== null && m5Cci[si] !== null && m5Cci[si - 1] > 100  && m5Cci[si] < 100;

  // ── Derive Next Phase From Trades ──
  const nextPhase = deriveNextPhase(trades);
  state.nextPhase = nextPhase;

  // Reset Fade A gates when cycle completes (PHASE_B or FADE_B just won → idle)
  if (nextPhase === null && (state.fadeAGate1Met || state.fadeAGate2CrossEpoch)) {
    const lastClosed = trades.filter(t => t.result).sort((a, b) => new Date(b.closeTime || 0) - new Date(a.closeTime || 0))[0];
    if (lastClosed?.entryType === "PHASE_B" || lastClosed?.entryType === "FADE_B") {
      state.fadeAGate1Met = false;
      state.fadeAGate1Dir = null;
      state.fadeAWasAboveSig = null;
      state.fadeAGate2CrossEpoch = null;
    }
  }

  // ==================== SIGNAL EVALUATION ====================

  const currentPrice = closes[si];
  const currentCandleHigh = parseFloat(candles[si].high);
  const currentCandleLow  = parseFloat(candles[si].low);

  let signalTriggered = false, direction = "", fibTpPrice = null, entryType = null;

  // ─────────────────────────────────────────
  // PHASE B: After PHASE_A WIN — M5 CCI only
  // Entry direction follows H1 TDI trend
  // TP: Fibonacci 61.8%
  // ─────────────────────────────────────────
  if (nextPhase === "PHASE_B") {
    if (h1TdiDir === "BUY" && m5CciBuyCross) {
      const tp = fib.fib618;
      if (tp > currentPrice) {  // TP must be above entry for BUY
        signalTriggered = true; direction = "BUY"; entryType = "PHASE_B"; fibTpPrice = tp;
      }
    } else if (h1TdiDir === "SELL" && m5CciSellCross) {
      const tp = fib.fib618;
      if (tp < currentPrice) {  // TP must be below entry for SELL
        signalTriggered = true; direction = "SELL"; entryType = "PHASE_B"; fibTpPrice = tp;
      }
    }
  }

  // ─────────────────────────────────────────
  // FADE B: After FADE_A WIN — H1 SMA(8) + M5 CCI
  // TP: Fibonacci 0%
  // ─────────────────────────────────────────
  else if (nextPhase === "FADE_B") {
    if (h1Sma8Dir === "BUY" && m5CciBuyCross) {
      const tp = fib.fib0;
      if (tp > currentPrice) {
        signalTriggered = true; direction = "BUY"; entryType = "FADE_B"; fibTpPrice = tp;
      }
    } else if (h1Sma8Dir === "SELL" && m5CciSellCross) {
      const tp = fib.fib0;
      if (tp < currentPrice) {
        signalTriggered = true; direction = "SELL"; entryType = "FADE_B"; fibTpPrice = tp;
      }
    }
  }

  // ─────────────────────────────────────────
  // IDLE: Look for PHASE_A or FADE_A
  // ─────────────────────────────────────────
  else {
    // PHASE A: H1 TDI + H1 SMA(8) + M15 TDI fresh cross all agree — TP at Fibonacci 50%
    // M15 TDI must show a FRESH cross of the middle band (not just sitting above/below for hours).
    const m15FreshBuyCross  = m15TdiReady && findM15FreshCross(m15Tdi.rsi, m15Tdi.middle, m15i, "BUY",  PHASE_A_M15_CROSS_LOOKBACK);
    const m15FreshSellCross = m15TdiReady && findM15FreshCross(m15Tdi.rsi, m15Tdi.middle, m15i, "SELL", PHASE_A_M15_CROSS_LOOKBACK);

    if (!signalTriggered && h1TdiDir && h1Sma8Dir) {
      if (h1TdiDir === "BUY" && h1Sma8Dir === "BUY" && m15FreshBuyCross) {
        const tp = fib.fib50;
        if (tp > currentPrice) {
          signalTriggered = true; direction = "BUY"; entryType = "PHASE_A"; fibTpPrice = tp;
          dbg(`[PHASE_A BUY] H1 TDI RSI ${h1TdiRsi?.toFixed(2)} > mid ${h1TdiMiddle?.toFixed(2)}, H1 SMA8 ${h1Sma8Val?.toFixed(4)}, M15 fresh BUY cross confirmed`);
        }
      } else if (h1TdiDir === "SELL" && h1Sma8Dir === "SELL" && m15FreshSellCross) {
        const tp = fib.fib50;
        if (tp < currentPrice) {
          signalTriggered = true; direction = "SELL"; entryType = "PHASE_A"; fibTpPrice = tp;
          dbg(`[PHASE_A SELL] H1 TDI RSI ${h1TdiRsi?.toFixed(2)} < mid ${h1TdiMiddle?.toFixed(2)}, H1 SMA8 ${h1Sma8Val?.toFixed(4)}, M15 fresh SELL cross confirmed`);
        }
      }
    }

    // FADE A: Counter-trend at Fib 79% level
    // Gate 1 (sticky): price touches 79% level AND M15 TDI RSI at outer band
    // Gate 2: M15 TDI RSI crosses signal line inward (15-min window)
    // Trigger: Gate 1 + Gate 2 active + M5 CCI cross — TP at Daily Bias line
    if (!signalTriggered && h1TdiDir && m15TdiReady && m15TdiUpper !== null && m15TdiLower !== null) {
      const fadeDir = h1TdiDir === "BUY" ? "SELL" : "BUY";

      // Check if price is touching the 79% fib level
      const priceTouched79 = fadeDir === "SELL"
        ? (currentCandleHigh >= fib.fib79 || Math.abs(currentPrice - fib.fib79) / fib.fib79 <= FIB79_TOUCH_TOLERANCE)
        : (currentCandleLow  <= fib.fib79 || Math.abs(currentPrice - fib.fib79) / fib.fib79 <= FIB79_TOUCH_TOLERANCE);

      // Invalidate gates if H1 TDI direction changed since Gate 1 was set
      if (state.fadeAGate1Met && state.fadeAGate1Dir !== fadeDir) {
        state.fadeAGate1Met = false;
        state.fadeAGate1Dir = null;
        state.fadeAWasAboveSig = null;
        state.fadeAGate2CrossEpoch = null;
        dbg("[FADE A] Gates invalidated — H1 TDI direction changed");
      }

      // Gate 1: price at 79% + M15 TDI RSI at outer band
      if (!state.fadeAGate1Met && priceTouched79) {
        if (fadeDir === "SELL" && m15TdiRsi >= m15TdiUpper) {
          state.fadeAGate1Met = true;
          state.fadeAGate1Dir = "SELL";
          state.fadeAWasAboveSig = true;  // RSI above upper band → definitely above signal
          state.fadeAGate2CrossEpoch = null;
          dbg(`[FADE A Gate 1 SELL] RSI ${m15TdiRsi.toFixed(2)} >= upper ${m15TdiUpper.toFixed(2)} at fib79 ${fib.fib79.toFixed(4)}`);
        } else if (fadeDir === "BUY" && m15TdiRsi <= m15TdiLower) {
          state.fadeAGate1Met = true;
          state.fadeAGate1Dir = "BUY";
          state.fadeAWasAboveSig = false;  // RSI below lower band → definitely below signal
          state.fadeAGate2CrossEpoch = null;
          dbg(`[FADE A Gate 1 BUY] RSI ${m15TdiRsi.toFixed(2)} <= lower ${m15TdiLower.toFixed(2)} at fib79 ${fib.fib79.toFixed(4)}`);
        }
      }

      // Gate 2: after Gate 1, detect RSI crossing the signal line
      if (state.fadeAGate1Met && state.fadeAGate1Dir === fadeDir) {
        const nowAboveSig = m15TdiRsi > m15TdiSignal;

        // Detect fresh signal cross
        if (fadeDir === "BUY" && nowAboveSig && state.fadeAWasAboveSig === false && !state.fadeAGate2CrossEpoch) {
          state.fadeAGate2CrossEpoch = currentCandleEpoch;
          dbg(`[FADE A Gate 2 BUY] RSI crossed above signal at ${currentCandleEpoch}`);
        } else if (fadeDir === "SELL" && !nowAboveSig && state.fadeAWasAboveSig === true && !state.fadeAGate2CrossEpoch) {
          state.fadeAGate2CrossEpoch = currentCandleEpoch;
          dbg(`[FADE A Gate 2 SELL] RSI crossed below signal at ${currentCandleEpoch}`);
        }

        // Expire Gate 2 if window elapsed
        if (state.fadeAGate2CrossEpoch && (currentCandleEpoch - state.fadeAGate2CrossEpoch > FADE_A_GATE2_WINDOW)) {
          state.fadeAGate2CrossEpoch = null;
          dbg("[FADE A Gate 2] Window expired — resetting");
        }

        // Entry: Gate 2 active + M5 CCI cross
        if (state.fadeAGate2CrossEpoch) {
          const tp = fib.dailyBiasPrice;
          if (fadeDir === "BUY" && m5CciBuyCross && tp > currentPrice) {
            signalTriggered = true; direction = "BUY"; entryType = "FADE_A"; fibTpPrice = tp;
            state.fadeAGate1Met = false; state.fadeAGate1Dir = null;
            state.fadeAWasAboveSig = null; state.fadeAGate2CrossEpoch = null;
            dbg(`[FADE A BUY FIRED] Entry ${currentPrice.toFixed(4)}, TP (Daily Bias) ${tp.toFixed(4)}`);
          } else if (fadeDir === "SELL" && m5CciSellCross && tp < currentPrice) {
            signalTriggered = true; direction = "SELL"; entryType = "FADE_A"; fibTpPrice = tp;
            state.fadeAGate1Met = false; state.fadeAGate1Dir = null;
            state.fadeAWasAboveSig = null; state.fadeAGate2CrossEpoch = null;
            dbg(`[FADE A SELL FIRED] Entry ${currentPrice.toFixed(4)}, TP (Daily Bias) ${tp.toFixed(4)}`);
          }
        }

        // Update signal position tracker for next scan
        if (!signalTriggered) state.fadeAWasAboveSig = nowAboveSig;
      }
    }
  }

  // ── Trade Execution ──
  if (signalTriggered) {
    try {
      const preCheckContracts = (await getOpenPortfolio()).filter(c => getContractSymbol(c) === TRADING_SYMBOL);
      if (preCheckContracts.length > 0) {
        state.lastProcessedEpoch = currentCandleEpoch;
        fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
        return;
      }
    } catch (preErr) {
      state.lastProcessedEpoch = currentCandleEpoch;
      fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
      return;
    }

    const entry = currentPrice;
    let initialFractal = findRecentFractal(m15Candles, m15i, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    let sl;
    if (direction === "BUY") {
      sl = (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    } else {
      sl = (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    }

    const fractalTimeframe = initialFractal ? "M15" : null;
    const timeFormatted = new Date(currentCandleEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);

    // Telegram entry message
    const h1TdiLabel = h1TdiReady
      ? `RSI ${h1TdiRsi.toFixed(1)} | Mid ${h1TdiMiddle.toFixed(1)} → *${h1TdiDir}*`
      : "N/A";
    const h1Sma8Label = h1Sma8Val
      ? `SMA8 ${h1Sma8Val.toFixed(4)} | Close ${h1LastClose.toFixed(4)} → *${h1Sma8Dir}*`
      : "N/A";
    const m15CrossLabel = entryType === "PHASE_A"
      ? (direction === "BUY" ? " ✅ Fresh cross ↑" : " ✅ Fresh cross ↓")
      : "";
    const m15TdiLabel = m15TdiReady
      ? `RSI ${m15TdiRsi.toFixed(1)} | Signal ${m15TdiSignal.toFixed(1)} | Mid ${m15TdiMiddle.toFixed(1)} → *${m15TdiDir}*${m15CrossLabel}`
      : "N/A";
    const cciLabel = m5Cci[si] !== null ? m5Cci[si].toFixed(1) : "N/A";
    const fibLabel = `0%: ${fib.fib0.toFixed(4)} | 50%: ${fib.fib50.toFixed(4)} | 61.8%: ${fib.fib618.toFixed(4)} | 79%: ${fib.fib79.toFixed(4)} | Bias: ${fib.dailyBiasPrice.toFixed(4)}`;

    const setupDescriptions = {
      PHASE_A: "H1 TDI + H1 SMA(8) + M15 TDI (all aligned)",
      PHASE_B: "Phase B Re-entry — M5 CCI cross (after Phase A WIN)",
      FADE_A:  "Fade A Counter-trade — Fib 79% + M15 TDI Gate + M5 CCI",
      FADE_B:  "Fade B Re-entry — H1 SMA(8) + M5 CCI (after Fade A WIN)"
    };
    const setupLabel = escapeMarkdown(setupDescriptions[entryType] || entryType);

    const message = `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\nDirection: *${direction}*\nRepo: ${REPO_LABEL}\nSetup: ${setupLabel}\n\n📍 Entry: ${entry.toFixed(4)}\n🛑 Initial SL: ${sl.toFixed(4)} (${initialFractal ? "M15 Fractal" : "Hard Stop"})\n🎯 Fib TP: *${fibTpPrice.toFixed(4)}* (${entryType})\n\n💰 Stake: $${STAKE_USD} | Server TP backstop: $${SERVER_TP_USD}\n\n📐 *Confluence*\n• H1 TDI: ${h1TdiLabel}\n• H1 SMA(8): ${h1Sma8Label}\n• M15 TDI: ${m15TdiLabel}\n• M5 CCI(14): ${cciLabel}\n• Fib Levels: ${fibLabel}\n━━━━━━━━━━━━━━━━━━━━\n⏰ Time (UTC): ${timeFormatted}\n\n💡 To close manually: send \`/close win\` or \`/close loss\` in this chat`;

    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2));

    const pendingTradeRecord = {
      id: `${SYMBOL}-${isoTime.replace(/[: ]/g, "-")}`, contractId: null, pending: true,
      repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl,
      rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: currentCandleEpoch, fractalSl: initialFractal, fractalEpoch: null,
      fractalTimeframe, m30FractalUpgraded: false, fibTpPrice,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));

    try {
      const contractId = await executeTrade(direction);
      if (!contractId) {
        const idx = trades.findIndex(t => t.id === pendingTradeRecord.id);
        if (idx !== -1) trades.splice(idx, 1);
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        await sendTelegram(`❌ *${REPO_LABEL}* — Signal triggered for ${direction} (${entryType}), but broker returned no contract ID. Trade aborted.`);
        return;
      }
      pendingTradeRecord.contractId = contractId;
      pendingTradeRecord.pending = false;
      fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
      await sendTelegram(message);
    } catch (execErr) {
      const idx = trades.findIndex(t => t.id === pendingTradeRecord.id);
      if (idx !== -1) trades.splice(idx, 1);
      fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
      await sendTelegram(`❌ *${REPO_LABEL}* — Live execution failed: ${execErr.message}`);
      return;
    }
  }

  state.lastProcessedEpoch = currentCandleEpoch;
  fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
  console.log(`[${REPO_LABEL}] Scan complete.`);
}

// ==================== EXECUTION HOOK ====================
(async () => {
  if (MODE === "daily")                                 { await runSummary("Daily");  return; }
  if (MODE === "weekly")                                { await runSummary("Weekly"); return; }
  if (MODE === "monthly")                               { await runSummary("Monthly"); return; }
  if (MODE === "close_win"  || MODE === "closewin")     { await executeManualClose("WIN",  "manual trigger"); return; }
  if (MODE === "close_loss" || MODE === "closeloss")    { await executeManualClose("LOSS", "manual trigger"); return; }
  if (TRIGGER_SOURCE !== "cronjob") return;
  await runScanMode();
})();
