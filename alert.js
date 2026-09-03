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
const RISK_REWARD = 1.5;
const TARGET_TP1_USD = 2.50;
const SOFTWARE_TP_USD = 3.60;
const SOFTWARE_SL_USD = -3.60;
const SERVER_TP_USD = 10.00;
const BREAKEVEN_ACTIVATE_USD = 2.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const MARKET_DATA_APP_ID = "1089";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

const TG_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const MODE = process.env.MODE || "cronjob";
const TRIGGER_SOURCE = process.env.TRIGGER_SOURCE || "manual";

const M5 = 5 * 60;
const M15 = 15 * 60;
const M30 = 30 * 60;
const H1 = 60 * 60;
const D1 = 24 * 60 * 60;

const PHASE_A_WINDOW_SECONDS = 2.5 * 60 * 60;
// Phase B Gate 2 window: 47 minutes from TDI signal cross
const PHASE_B_GATE2_WINDOW = 2820;

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
      : (finalResult === "WIN" ? "+$3.60" : "-$3.60");

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
  const tpValue = typeof SERVER_TP_USD !== "undefined" ? SERVER_TP_USD : 10.00;
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
      wsPublic.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5, count: 120, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 2, ticks_history: SYMBOL, granularity: H1, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1, count: 5, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
    });
    wsPublic.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.m5 = msg.candles;
      if (msg.req_id === 2) results.h1 = msg.candles;
      if (msg.req_id === 4) results.m15 = msg.candles;
      if (msg.req_id === 5) results.d1 = msg.candles;
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
      wsPublic.send(JSON.stringify({ req_id: 1, ticks_history: SYMBOL, granularity: M5, count: 120, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 2, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 3, ticks_history: SYMBOL, count: 1, end: "latest", style: "ticks" }));
      wsPublic.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
    });
    wsPublic.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.candles = msg.candles;
      if (msg.req_id === 2) results.m15Candles = msg.candles;
      if (msg.req_id === 3) results.price = msg.history?.prices?.[msg.history.prices.length - 1];
      if (msg.req_id === 6) results.m30Candles = msg.candles;
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

// BGA TDI (Traders Dynamic Index):
//   RSI(14) — the raw RSI line
//   Signal  — 7-period SMA of RSI (smoothed signal line)
//   Bands   — Bollinger Bands(34, 1.619) on RSI (volatility envelope)
// Rules:
//   RSI > Signal + RSI > Bands.middle → Bullish (above midline)
//   RSI < Signal + RSI < Bands.middle → Bearish (below midline)
//   RSI ≤ Bands.lower → Oversold extreme (Phase B Gate 1 BUY)
//   RSI ≥ Bands.upper → Overbought extreme (Phase B Gate 1 SELL)
//   RSI crosses above Signal → BUY momentum (Phase B Gate 2)
//   RSI crosses below Signal → SELL momentum (Phase B Gate 2)
function calculateTDI(candles, rsiPeriod = 14, signalPeriod = 7, bbPeriod = 34, bbDev = 1.619) {
  const closes = candles.map(c => parseFloat(c.close));
  const rsi = calculateRSI(closes, rsiPeriod);
  // For the signal line SMA, fill null RSI values with 50 (neutral) so SMA calculates
  const rsiForSignal = rsi.map(v => v !== null ? v : 50);
  const rawSignal = sma(rsiForSignal, signalPeriod);
  // Only expose signal where RSI itself is valid
  const signal = rawSignal.map((v, i) => rsi[i] === null ? null : v);
  const bands = calculateBollingerBands(rsi, bbPeriod, bbDev);
  return { rsi, signal, upper: bands.upper, middle: bands.middle, lower: bands.lower };
}

// CCI (Commodity Channel Index) — BGA uses this as the precision M5 entry trigger.
// BUY entry: CCI crosses UP through -100 (previous < -100, current > -100)
// SELL entry: CCI crosses DOWN through +100 (previous > +100, current < +100)
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

// ── Candlestick Pattern Detection (BGA Chapter 7) ──
// Patterns are only valid at key reversal zones (OTE zone / Phase B TDI extreme).
// Engulfing: second candle body completely covers first candle body, opposite colors.
// RRT (Rail Road Track): two same-size candles of opposite color (within 20% size match).

function isBullishEngulfing(prev, curr) {
  const prevO = parseFloat(prev.open), prevC = parseFloat(prev.close);
  const currO = parseFloat(curr.open), currC = parseFloat(curr.close);
  const prevBearish = prevC < prevO;
  const currBullish = currC > currO;
  if (!prevBearish || !currBullish) return false;
  const prevBody = prevO - prevC;
  const currBody = currC - currO;
  // Current open at or below previous close, current close at or above previous open
  return currO <= prevC && currC >= prevO && currBody >= prevBody * 0.8;
}

function isBearishEngulfing(prev, curr) {
  const prevO = parseFloat(prev.open), prevC = parseFloat(prev.close);
  const currO = parseFloat(curr.open), currC = parseFloat(curr.close);
  const prevBullish = prevC > prevO;
  const currBearish = currC < currO;
  if (!prevBullish || !currBearish) return false;
  const prevBody = prevC - prevO;
  const currBody = currO - currC;
  // Current open at or above previous close, current close at or below previous open
  return currO >= prevC && currC <= prevO && currBody >= prevBody * 0.8;
}

function isBullishRRT(prev, curr) {
  const prevO = parseFloat(prev.open), prevC = parseFloat(prev.close);
  const currO = parseFloat(curr.open), currC = parseFloat(curr.close);
  const prevBearish = prevC < prevO;
  const currBullish = currC > currO;
  if (!prevBearish || !currBullish) return false;
  const prevBody = prevO - prevC;
  const currBody = currC - currO;
  if (prevBody === 0) return false;
  const ratio = currBody / prevBody;
  return ratio >= 0.75 && ratio <= 1.25;
}

function isBearishRRT(prev, curr) {
  const prevO = parseFloat(prev.open), prevC = parseFloat(prev.close);
  const currO = parseFloat(curr.open), currC = parseFloat(curr.close);
  const prevBullish = prevC > prevO;
  const currBearish = currC < currO;
  if (!prevBullish || !currBearish) return false;
  const prevBody = prevC - prevO;
  const currBody = currO - currC;
  if (prevBody === 0) return false;
  const ratio = currBody / prevBody;
  return ratio >= 0.75 && ratio <= 1.25;
}

// Returns true if a valid BUY candlestick pattern exists at candle index i
function hasBuyPattern(candles, i) {
  if (i < 1) return false;
  const prev = candles[i - 1];
  const curr = candles[i];
  return isBullishEngulfing(prev, curr) || isBullishRRT(prev, curr);
}

// Returns true if a valid SELL candlestick pattern exists at candle index i
function hasSellPattern(candles, i) {
  if (i < 1) return false;
  const prev = candles[i - 1];
  const curr = candles[i];
  return isBearishEngulfing(prev, curr) || isBearishRRT(prev, curr);
}

// ── H1 Fibonacci OTE Zone (BGA Chapter 9) ──
// BGA Optimal Trade Entry zone: 61.8% to 79% retracement of the most recent H1 swing.
// For BUY: price must have pulled back 61.8–79% from the swing high toward the swing low.
// For SELL: price must have pulled back 61.8–79% from the swing low toward the swing high.
// Uses 3-bar fractals (1 candle on each side) for H1 swing identification.

function findH1SwingPoints(h1Candles) {
  const swingHighs = [];
  const swingLows = [];
  // Exclude the last candle (still forming) — look up to length-2
  for (let k = 1; k < h1Candles.length - 1; k++) {
    const high = parseFloat(h1Candles[k].high);
    const prevHigh = parseFloat(h1Candles[k - 1].high);
    const nextHigh = parseFloat(h1Candles[k + 1].high);
    if (high > prevHigh && high > nextHigh) {
      swingHighs.push({ price: high, index: k, epoch: h1Candles[k].epoch });
    }
    const low = parseFloat(h1Candles[k].low);
    const prevLow = parseFloat(h1Candles[k - 1].low);
    const nextLow = parseFloat(h1Candles[k + 1].low);
    if (low < prevLow && low < nextLow) {
      swingLows.push({ price: low, index: k, epoch: h1Candles[k].epoch });
    }
  }
  return { swingHighs, swingLows };
}

function isInH1OTEZone(h1Candles, currentPrice, direction) {
  if (!h1Candles || h1Candles.length < 10) return false;
  const { swingHighs, swingLows } = findH1SwingPoints(h1Candles);
  if (swingHighs.length === 0 || swingLows.length === 0) return false;

  if (direction === "BUY") {
    // Find most recent swing HIGH, then the swing LOW that preceded it
    const recentHigh = swingHighs[swingHighs.length - 1];
    // Most recent swing low that occurred BEFORE the recent high
    const recentLow = swingLows.slice().reverse().find(sl => sl.index < recentHigh.index);
    if (!recentLow) return false;
    const range = recentHigh.price - recentLow.price;
    if (range <= 0) return false;
    // Retracement ratio: how far price has pulled back from high toward low
    const retracementRatio = (recentHigh.price - currentPrice) / range;
    const inZone = retracementRatio >= 0.618 && retracementRatio <= 0.79;
    dbg(`[OTE BUY] SwingLow=${recentLow.price.toFixed(4)}, SwingHigh=${recentHigh.price.toFixed(4)}, Price=${currentPrice.toFixed(4)}, Retrace=${(retracementRatio * 100).toFixed(1)}%, InZone=${inZone}`);
    return inZone;
  } else {
    // SELL: find most recent swing LOW, then the swing HIGH that preceded it
    const recentLow = swingLows[swingLows.length - 1];
    const recentHigh = swingHighs.slice().reverse().find(sh => sh.index < recentLow.index);
    if (!recentHigh) return false;
    const range = recentHigh.price - recentLow.price;
    if (range <= 0) return false;
    // Retracement ratio: how far price has pulled back from low toward high
    const retracementRatio = (currentPrice - recentLow.price) / range;
    const inZone = retracementRatio >= 0.618 && retracementRatio <= 0.79;
    dbg(`[OTE SELL] SwingHigh=${recentHigh.price.toFixed(4)}, SwingLow=${recentLow.price.toFixed(4)}, Price=${currentPrice.toFixed(4)}, Retrace=${(retracementRatio * 100).toFixed(1)}%, InZone=${inZone}`);
    return inZone;
  }
}

// Returns OTE retracement percentage string for Telegram message (diagnostic)
function getOTEInfo(h1Candles, currentPrice, direction) {
  if (!h1Candles || h1Candles.length < 10) return "N/A";
  const { swingHighs, swingLows } = findH1SwingPoints(h1Candles);
  if (swingHighs.length === 0 || swingLows.length === 0) return "N/A";
  try {
    if (direction === "BUY") {
      const recentHigh = swingHighs[swingHighs.length - 1];
      const recentLow = swingLows.slice().reverse().find(sl => sl.index < recentHigh.index);
      if (!recentLow) return "N/A";
      const range = recentHigh.price - recentLow.price;
      if (range <= 0) return "N/A";
      const ratio = (recentHigh.price - currentPrice) / range;
      return `${(ratio * 100).toFixed(1)}% retrace (${recentLow.price.toFixed(2)}→${recentHigh.price.toFixed(2)})`;
    } else {
      const recentLow = swingLows[swingLows.length - 1];
      const recentHigh = swingHighs.slice().reverse().find(sh => sh.index < recentLow.index);
      if (!recentHigh) return "N/A";
      const range = recentHigh.price - recentLow.price;
      if (range <= 0) return "N/A";
      const ratio = (currentPrice - recentLow.price) / range;
      return `${(ratio * 100).toFixed(1)}% retrace (${recentHigh.price.toFixed(2)}→${recentLow.price.toFixed(2)})`;
    }
  } catch { return "N/A"; }
}

// ── Daily Bias (BGA Chapter 17) ──
// Compares current price to the opening price of the current D1 candle.
// Price above today's open → BUY bias. Price below → SELL bias.
function getDailyBias(d1Candles, currentPrice) {
  if (!d1Candles || d1Candles.length < 1) return null;
  // Last D1 candle is the current forming day
  const today = d1Candles[d1Candles.length - 1];
  const dailyOpen = parseFloat(today.open);
  if (currentPrice > dailyOpen) return "BUY";
  if (currentPrice < dailyOpen) return "SELL";
  return null;
}

// ── Unchanged Support Functions ──

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

function getBGAInfo(price) {
  let step = 100;
  if (price > 20000) step = 250;
  else if (price > 10000) step = 100;
  else if (price > 5000) step = 50;
  else if (price > 2000) step = 25;
  else if (price > 1000) step = 10;
  else step = 5;
  const whole = Math.round(price / step) * step;
  const half = whole - (step / 2);
  const isWhole = Math.abs(price - whole) <= (step * 0.05);
  const isHalf = Math.abs(price - half) <= (step * 0.05);
  if (isWhole) return `BGA Whole Level (${whole})`;
  if (isHalf) return `BGA Half Level (${half})`;
  return `BGA Zone (Near ${whole})`;
}

function calculateBgaTakeProfits(entry, direction, slDistance, d1Candles) {
  let step = 100;
  if (entry > 20000) step = 250;
  else if (entry > 10000) step = 100;
  else if (entry > 5000) step = 50;
  else if (entry > 2000) step = 25;
  else if (entry > 1000) step = 10;
  else step = 5;

  const halfStep = step / 2;
  const baseWhole = Math.round(entry / step) * step;

  const requiredRawPnlTp1 = TARGET_TP1_USD + COMMISSION_USD;
  const tp1PriceMove = (requiredRawPnlTp1 / (STAKE_USD * MULTIPLIER)) * entry;
  const idealTp1Price = direction === "BUY" ? entry + tp1PriceMove : entry - tp1PriceMove;

  const requiredRawPnlTp2 = SOFTWARE_TP_USD + COMMISSION_USD;
  const tp2PriceMove = (requiredRawPnlTp2 / (STAKE_USD * MULTIPLIER)) * entry;
  const idealTp2Price = direction === "BUY" ? entry + tp2PriceMove : entry - tp2PriceMove;

  let fibMaxLimit = null;
  if (d1Candles && d1Candles.length >= 2) {
    const prevDay = d1Candles[d1Candles.length - 2];
    const prevHigh = parseFloat(prevDay.high);
    const prevLow = parseFloat(prevDay.low);
    const prevRange = prevHigh - prevLow;
    if (prevRange > 0) fibMaxLimit = direction === "BUY" ? prevHigh + (prevRange * 1.618) : prevLow - (prevRange * 1.618);
  }

  const allLevels = [];
  for (let offset = -20 * step; offset <= 25 * step; offset += halfStep) allLevels.push(baseWhole + offset);

  if (direction === "BUY") {
    const validLevels = allLevels.filter(l => l > entry);
    validLevels.sort((a, b) => Math.abs(a - idealTp1Price) - Math.abs(b - idealTp1Price));
    let tp1 = validLevels[0] || (baseWhole + step);
    if (tp1 >= idealTp2Price) {
      const subCeilingLevels = validLevels.filter(l => l < idealTp2Price);
      tp1 = subCeilingLevels[0] || entry + (tp1PriceMove * 0.9);
    }
    let futureLevels = allLevels.filter(l => l > tp1).sort((a, b) => Math.abs(a - idealTp2Price) - Math.abs(b - idealTp2Price));
    let tp2 = futureLevels[0] || tp1 + halfStep;
    let tp3 = tp2 + halfStep;
    if (fibMaxLimit && fibMaxLimit > tp1) { tp2 = Math.min(tp2, fibMaxLimit); tp3 = Math.min(tp3, fibMaxLimit); }
    if (tp2 <= tp1) tp2 = tp1 + halfStep;
    if (tp3 <= tp2) tp3 = tp2 + halfStep;
    return { tp1, tp2, tp3 };
  } else {
    const validLevels = allLevels.filter(l => l < entry);
    validLevels.sort((a, b) => Math.abs(a - idealTp1Price) - Math.abs(b - idealTp1Price));
    let tp1 = validLevels[0] || (baseWhole - step);
    if (tp1 <= idealTp2Price) {
      const subCeilingLevels = validLevels.filter(l => l > idealTp2Price);
      tp1 = subCeilingLevels[0] || entry - (tp1PriceMove * 0.9);
    }
    let futureLevels = allLevels.filter(l => l < tp1).sort((a, b) => Math.abs(a - idealTp2Price) - Math.abs(b - idealTp2Price));
    let tp2 = futureLevels[0] || tp1 - halfStep;
    let tp3 = tp2 - halfStep;
    if (fibMaxLimit && fibMaxLimit < tp1) { tp2 = Math.max(tp2, fibMaxLimit); tp3 = Math.max(tp3, fibMaxLimit); }
    if (tp2 >= tp1) tp2 = tp1 - halfStep;
    if (tp3 >= tp2) tp3 = tp2 - halfStep;
    return { tp1, tp2, tp3 };
  }
}

// ==================== STATE ====================
// Removed: phaseAStochCrossEpoch, phaseAStochDir (stochastic-based Phase A tracking)
// Removed: phaseBM15CondMet, phaseBM15CondDir (stochastic Gate 1)
// Removed: phaseBStochCrossEpoch, phaseBStochDir (stochastic Gate 2)
// Added:   phaseBTdiExtremeMet / phaseBTdiExtremeDir (TDI Gate 1 — RSI touches band)
// Added:   phaseBTdiCrossEpoch / phaseBTdiCrossDir (TDI Gate 2 — RSI crosses signal line)
// Added:   phaseBTdiWasAboveSignal (transition detector for TDI Gate 2)
let state = {
  waitingFor: null,
  lastProcessedEpoch: null,
  lastTgUpdateId: 0,
  h1TrendCycleEpoch: null,
  phaseATaken: false,
  phaseAWindowExpired: false,
  phaseADeadlineEpoch: null,
  phaseBTdiExtremeMet: false,
  phaseBTdiExtremeDir: null,
  phaseBTdiCrossEpoch: null,
  phaseBTdiCrossDir: null,
  phaseBTdiWasAboveSignal: null
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
    let matchedTrade = trades.find(t => String(t.contractId) === String(liveContract.contract_id) || (t.pending && t.direction === expectedType && liveStartTime && Math.abs(new Date(t.openTime).getTime() - liveStartTime) <= 60000));

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
        id: `${SYMBOL}-${new Date().toISOString()}`,
        contractId: liveContract.contract_id,
        pending: false, repo: REPO_LABEL, symbol: SYMBOL, direction: dir, entry: entryPrice, sl: calculatedSl,
        tp1: 0, tp2: 0, tp3: 0, h1OpenAtEntry: null, tp1Reached: false, breakevenSet: false, peakProfit: null, rr: RISK_REWARD, entryType: "RECOVERED_LIVE", m15AgainstAtEntry: false, brokerSlAmount: STAKE_USD,
        entryEpoch: liveStartTime ? Math.floor(liveStartTime / 1000) : Math.floor(Date.now() / 1000), fractalSl: null, fractalEpoch: null, fractalTimeframe: null, m30FractalUpgraded: false,
        openTime: liveStartTime ? new Date(liveStartTime).toISOString().replace("T", " ").substring(0, 19) : new Date().toISOString().replace("T", " ").substring(0, 19),
        closeTime: null, result: null, runnerUnlocked: false
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
            t.result = t.result || "LOSS"; t.resultSource = "estimated_fallback"; t.closeTime = t.closeTime || new Date().toISOString().replace("T", " ").substring(0, 19);
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
    try { tradeData = await fetchOpenTradeData(); } catch (err) { console.warn(`[${REPO_LABEL}] Failed to fetch open trade data: ${err.message}. Skipping.`); return; }

    const currentPrice = tradeData.price;
    const currentM5 = tradeData.candles[tradeData.candles.length - 1];
    const candleHigh = parseFloat(currentM5.high);
    const candleLow = parseFloat(currentM5.low);

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
        const tp1Status = openTrade.tp1Reached ? "✅ TP1 hit" : "❌ TP1 not reached";
        const runnerStatus = openTrade.runnerUnlocked ? "🚀 Runner Active" : "🔒 Standard";
        const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
        await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${finalResult}*\n\nDirection: ${openTrade.direction} (${contractType})\nSymbol: ${SYMBOL_NAME}\n\n📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n🏁 Exit: ${currentPrice.toFixed(4)}\n🛑 SL: ${openTrade.sl ? openTrade.sl.toFixed(4) : "N/A"} ($${slDollars} hard)\n🎯 TP1: ${openTrade.tp1 ? openTrade.tp1.toFixed(4) : "N/A"} (BGA) ${tp1Status}\n🏃 Mode: ${runnerStatus}\n\n💵 P&L: *${pnlStr}* (Net of comm.)\nReason: ${exitReason}\nDuration: ${formatDuration(durationMs)}\n\nOpened: ${openTrade.openTime}\nClosed: ${openTrade.closeTime}\n` + (openTrade.contractId ? `Contract: \`${openTrade.contractId}\`` : ""));
      };

      // 0. Phase C Recovery Liquidation Hook
      const hasPhaseC = openTradesList.some(t => t.entryType === "PHASE_C" && t.direction === openTrade.direction && !t.result);
      if (openTrade.entryType?.startsWith("PHASE_B") && hasPhaseC) {
        if (pnl >= 0.20) {
          await closeWith("WIN", `Phase C Recovery — Original Phase B liquidated safely at +$${pnl.toFixed(2)}`);
          continue;
        }
      }

      // 1. M15 Fractal SL Tracking
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

      // 2. Track Peak Profit
      const bestPriceInCandle = isBuy ? candleHigh : candleLow;
      const maxPnlInCandle = calcUnrealizedPnL(openTrade, bestPriceInCandle);
      const currentHighestPnl = Math.max(pnl, maxPnlInCandle);
      if (openTrade.peakProfit === null || currentHighestPnl > openTrade.peakProfit) {
        openTrade.peakProfit = currentHighestPnl;
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
      }

      // 3. M30 Market Structure Early Exit
      if (tradeData.m30Candles && tradeData.m30Candles.length >= 4) {
        const m30 = tradeData.m30Candles;
        const latestClosedM30 = m30[m30.length - 2];
        const tradeEntryEpoch = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);
        let structOpenPrice = null;
        for (let k = m30.length - 3; k >= 0; k--) {
          const c = m30[k];
          if (c.epoch + M30 <= tradeEntryEpoch) break;
          const cOpen = parseFloat(c.open);
          const cClose = parseFloat(c.close);
          if (openTrade.direction === "BUY" && cClose > cOpen) { structOpenPrice = cOpen; break; }
          else if (openTrade.direction === "SELL" && cClose < cOpen) { structOpenPrice = cOpen; break; }
        }
        if (structOpenPrice !== null) {
          const latestClose = parseFloat(latestClosedM30.close);
          const structureBroken = (openTrade.direction === "BUY" && latestClose < structOpenPrice) ||
                                  (openTrade.direction === "SELL" && latestClose > structOpenPrice);
          if (structureBroken) {
            const result = pnl >= 0 ? "WIN" : "LOSS";
            const exitType = openTrade.runnerUnlocked ? "Runner Exit" : "Early Exit";
            await closeWith(result, `M30 Market Structure Broken (${exitType}) — Latest M30 closed at ${latestClose.toFixed(4)}, breaking structural level ${structOpenPrice.toFixed(4)}.`);
            continue;
          }
        }
      }

      // 4. Priority Exit Checks (Hard SL & Fractal SL)
      const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);
      const hardSlBreached = openTrade.direction === "BUY"
        ? (currentPrice <= hardStopPrice || candleLow <= hardStopPrice)
        : (currentPrice >= hardStopPrice || candleHigh >= hardStopPrice);

      let fractalBreached = false;
      let closedCandlePrice = null;
      let evalTimeframe = openTrade.fractalTimeframe;

      if (openTrade.fractalSl && evalTimeframe) {
        if (evalTimeframe === "M30" && tradeData.m30Candles && tradeData.m30Candles.length >= 2) {
          closedCandlePrice = parseFloat(tradeData.m30Candles[tradeData.m30Candles.length - 2].close);
        } else if (evalTimeframe === "M15" && tradeData.m15Candles && tradeData.m15Candles.length >= 2) {
          closedCandlePrice = parseFloat(tradeData.m15Candles[tradeData.m15Candles.length - 2].close);
        }
        if (closedCandlePrice !== null) {
          if (openTrade.direction === "BUY" && closedCandlePrice < openTrade.fractalSl) fractalBreached = true;
          else if (openTrade.direction === "SELL" && closedCandlePrice > openTrade.fractalSl) fractalBreached = true;
        }
      }

      if (hardSlBreached || fractalBreached) {
        const reason = fractalBreached
          ? `${evalTimeframe} Fractal Early Exit Hit (${evalTimeframe} Closed ${openTrade.direction === "BUY" ? "below" : "above"} ${openTrade.fractalSl.toFixed(4)})`
          : `Hard SL hit — price breached SL ${hardStopPrice.toFixed(4)}`;
        await closeWith("LOSS", reason); continue;
      }

      // 5. Software Stop Loss (-$3.60)
      if (pnl <= SOFTWARE_SL_USD) {
        await closeWith("LOSS", `Software Stop Loss hit — PnL dropped to $${pnl.toFixed(2)} (Limit: $${SOFTWARE_SL_USD.toFixed(2)})`); continue;
      }

      // 6. State Milestones: Breakeven, TP1, Runner
      if (!openTrade.breakevenSet && pnl >= BREAKEVEN_ACTIVATE_USD) {
        openTrade.breakevenSet = true;
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        await sendTelegram(`⚖️ *${REPO_LABEL} — Breakeven Armed*\nProfit reached $${pnl.toFixed(2)}. Lifetime profit floor locked at +$0.70 net.`);
      }

      const priceHitTp1 = openTrade.tp1 > 0 && (isBuy ? (currentPrice >= openTrade.tp1 || candleHigh >= openTrade.tp1) : (currentPrice <= openTrade.tp1 || candleLow <= openTrade.tp1));
      if (!openTrade.tp1Reached && (priceHitTp1 || pnl >= TARGET_TP1_USD)) {
        openTrade.tp1Reached = true;
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        await sendTelegram(`🎯 *${REPO_LABEL} — TP1 Reached*\n\nProfit reached *$${pnl.toFixed(2)}* (Target: ~$${TARGET_TP1_USD.toFixed(2)})\nStatic floor is now locked at +$1.25.`);
      }

      if (pnl >= SOFTWARE_TP_USD && !openTrade.runnerUnlocked) {
        openTrade.runnerUnlocked = true;
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        await sendTelegram(`🚀 *${REPO_LABEL} — Profit Runner Unlocked!*\n\nTrade exceeded +$${SOFTWARE_TP_USD.toFixed(2)} (PnL: +$${pnl.toFixed(2)}). Hard TP removed.\n\nM15 Structure Trail & Wide Disaster Trail ($2.50) are now active.`);
      }

      // 7. Tiered Floor & Trailing Enforcement
      if (openTrade.runnerUnlocked) {
        const tradeEntryEpochRunner = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);
        let m30DirectionalCount = 0;
        if (tradeData.m30Candles) {
          for (const rc of tradeData.m30Candles.slice(0, -1)) {
            if (rc.epoch + M30 <= tradeEntryEpochRunner) continue;
            const rcOpen = parseFloat(rc.open);
            const rcClose = parseFloat(rc.close);
            if (isBuy && rcClose > rcOpen) m30DirectionalCount++;
            else if (!isBuy && rcClose < rcOpen) m30DirectionalCount++;
          }
        }

        if (m30DirectionalCount >= 3 && tradeData.m15Candles && tradeData.m15Candles.length >= 4) {
          const m15t = tradeData.m15Candles;
          const latestClosedM15 = m15t[m15t.length - 2];
          let m15StructOpen = null;
          for (let k = m15t.length - 3; k >= 0; k--) {
            const mc = m15t[k];
            if (mc.epoch + M15 <= tradeEntryEpochRunner) break;
            const mcOpen = parseFloat(mc.open);
            const mcClose = parseFloat(mc.close);
            if (isBuy && mcClose > mcOpen) { m15StructOpen = mcOpen; break; }
            else if (!isBuy && mcClose < mcOpen) { m15StructOpen = mcOpen; break; }
          }
          if (m15StructOpen !== null) {
            const latestM15Close = parseFloat(latestClosedM15.close);
            if ((isBuy && latestM15Close < m15StructOpen) || (!isBuy && latestM15Close > m15StructOpen)) {
              await closeWith("WIN", `M15 Structure Trail exit — Latest M15 closed at ${latestM15Close.toFixed(4)}, breaking M15 level ${m15StructOpen.toFixed(4)} (${m30DirectionalCount} M30 ${isBuy ? "bullish" : "bearish"} candles since entry).`);
              continue;
            }
          }
        }

        const WIDE_TRAILING_DISTANCE = 2.50;
        let disasterLockLevel = openTrade.peakProfit - WIDE_TRAILING_DISTANCE;
        disasterLockLevel = Math.max(disasterLockLevel, 1.25);
        if (pnl <= disasterLockLevel) {
          await closeWith("WIN", `Wide Disaster Trail exit — locked +$${pnl.toFixed(2)} (peak $${openTrade.peakProfit.toFixed(2)}, trailed by $${WIDE_TRAILING_DISTANCE.toFixed(2)})`);
          continue;
        }
      } else if (openTrade.tp1Reached) {
        if (pnl <= 1.25) { await closeWith("WIN", "TP1 Static Floor exit — locked +$1.25"); continue; }
      } else if (openTrade.breakevenSet) {
        if (pnl <= 0.70) { await closeWith("WIN", "Commission-Covered Breakeven exit — locked +$0.70"); continue; }
      }
    }
  }

  // ── Pre-Scan Guard ──
  let allowScan = false;
  let phaseCTarget = null;
  const unresolvedTrades = trades.filter(t => !t.result);

  if (allLiveContracts.length === 0 && unresolvedTrades.length === 0) {
    allowScan = true;
    // Reset Phase B TDI gates so next trade cycle requires fresh extreme touch + cross
    state.phaseBTdiExtremeMet = false;
    state.phaseBTdiExtremeDir = null;
    state.phaseBTdiCrossEpoch = null;
    state.phaseBTdiCrossDir = null;
    state.phaseBTdiWasAboveSignal = null;
  } else if (allLiveContracts.length === 1 && unresolvedTrades.length === 1) {
    const ot = unresolvedTrades[0];
    if ((ot.entryType === "PHASE_B" || ot.entryType === "PHASE_B_NO_PRIOR_A") && ot.m15AgainstAtEntry && !ot.pending) {
      allowScan = true;
      phaseCTarget = ot;
    }
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
  const candles = scanData.m5;
  const h1Candles = scanData.h1;
  const d1Candles = scanData.d1;
  const m15Candles = scanData.m15;
  const m30Candles = scanData.m30;

  if (!candles || candles.length < 60) return;
  if (!m15Candles || m15Candles.length < 100) return;
  if (!m30Candles || m30Candles.length < 50) return;
  if (!h1Candles || h1Candles.length < 50) return;

  const si = candles.length - 2;  // Last closed M5 candle index
  const currentCandleEpoch = candles[si].epoch;
  const closes = candles.map(c => parseFloat(c.close));

  if (state.lastProcessedEpoch === currentCandleEpoch) {
    console.log("Already processed this candle — skipping."); return;
  }
  const isoTime = new Date(currentCandleEpoch * 1000).toISOString();

  // ── H1 Trend Direction (EMA 50) ──
  let h1FreshBuy = false, h1FreshSell = false, h1TrendDir = null;
  let ema50_1h = null;
  let h1Closes = null;

  if (h1Candles && h1Candles.length >= 50) {
    h1Closes = h1Candles.map(c => parseFloat(c.close));
    const h1ci = h1Candles.length - 2;
    const h1PrevCi = h1ci - 1;
    ema50_1h = ema(h1Closes, 50);
    if (ema50_1h[h1ci] != null && ema50_1h[h1PrevCi] != null) {
      h1FreshBuy = (h1Closes[h1PrevCi] <= ema50_1h[h1PrevCi]) && (h1Closes[h1ci] > ema50_1h[h1ci]);
      h1FreshSell = (h1Closes[h1PrevCi] >= ema50_1h[h1PrevCi]) && (h1Closes[h1ci] < ema50_1h[h1ci]);
      if (h1Closes[h1ci] > ema50_1h[h1ci]) h1TrendDir = "BUY";
      else if (h1Closes[h1ci] < ema50_1h[h1ci]) h1TrendDir = "SELL";
    }
  }

  let h1NewCycleEpoch = null;
  if (h1FreshBuy || h1FreshSell) {
    h1NewCycleEpoch = h1Candles[h1Candles.length - 2].epoch;
  }

  // ── Trend State Management ──
  // A. Fresh trend cross detected
  if (h1NewCycleEpoch && state.h1TrendCycleEpoch !== h1NewCycleEpoch) {
    state.h1TrendCycleEpoch = h1NewCycleEpoch;
    state.waitingFor = h1FreshBuy ? "BUY" : "SELL";
    state.phaseATaken = false;
    state.phaseAWindowExpired = false;
    state.phaseADeadlineEpoch = h1NewCycleEpoch + PHASE_A_WINDOW_SECONDS;
    // Reset all Phase B TDI gates on fresh trend
    state.phaseBTdiExtremeMet = false;
    state.phaseBTdiExtremeDir = null;
    state.phaseBTdiCrossEpoch = null;
    state.phaseBTdiCrossDir = null;
    state.phaseBTdiWasAboveSignal = null;
  }

  // B. Trend invalidation guard
  if (h1TrendDir && state.waitingFor && h1TrendDir !== state.waitingFor) {
    state.waitingFor = null; state.phaseATaken = false; state.h1TrendCycleEpoch = null;
    state.phaseADeadlineEpoch = null; state.phaseAWindowExpired = false;
    state.phaseBTdiExtremeMet = false; state.phaseBTdiExtremeDir = null;
    state.phaseBTdiCrossEpoch = null; state.phaseBTdiCrossDir = null;
    state.phaseBTdiWasAboveSignal = null;
  }

  // C. Cold boot: no state, active trend exists — look back for historical cross
  if (!state.waitingFor && h1TrendDir && ema50_1h && h1Closes) {
    let historicalCrossEpoch = currentCandleEpoch;
    for (let j = h1Candles.length - 2; j >= 1; j--) {
      const prevC = h1Closes[j - 1];
      const currC = h1Closes[j];
      const prevEma = ema50_1h[j - 1];
      const currEma = ema50_1h[j];
      if (prevEma == null || currEma == null) break;
      if (h1TrendDir === "BUY" && prevC <= prevEma && currC > currEma) { historicalCrossEpoch = h1Candles[j].epoch; break; }
      else if (h1TrendDir === "SELL" && prevC >= prevEma && currC < currEma) { historicalCrossEpoch = h1Candles[j].epoch; break; }
    }
    state.waitingFor = h1TrendDir;
    state.h1TrendCycleEpoch = historicalCrossEpoch;
    state.phaseATaken = false;
    state.phaseADeadlineEpoch = historicalCrossEpoch + PHASE_A_WINDOW_SECONDS;
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (nowEpoch > state.phaseADeadlineEpoch) {
      state.phaseAWindowExpired = true;
      dbg(`[Cold Boot] Adopted ${h1TrendDir} trend from ${historicalCrossEpoch}. Phase A EXPIRED.`);
    } else {
      state.phaseAWindowExpired = false;
      dbg(`[Cold Boot] Adopted ${h1TrendDir} trend from ${historicalCrossEpoch}. Phase A ACTIVE.`);
    }
  }

  // D. Normal Phase A window expiry
  if (state.waitingFor && !state.phaseATaken && !state.phaseAWindowExpired && state.phaseADeadlineEpoch) {
    if (Math.floor(Date.now() / 1000) > state.phaseADeadlineEpoch) {
      state.phaseAWindowExpired = true;
    }
  }

  if (!state.waitingFor && !phaseCTarget) {
    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); return;
  }

  // ==================== BGA SIGNAL EVALUATION ====================

  const currentPrice = closes[si];

  // 1. Daily Bias (BGA Ch. 17) — suppress entries against D1 direction
  const dailyBias = getDailyBias(d1Candles, currentPrice);

  // 2. M15 TDI (BGA Ch. 18-20)
  const m15Tdi = calculateTDI(m15Candles);
  const m15i = m15Candles.length - 2;  // Last closed M15 candle index

  // 3. M5 CCI(14) — precision entry trigger (BGA Ch. 22)
  const m5Cci = calculateCCI(candles);
  // BUY: CCI crosses UP through -100
  const m5CciBuyCross = (m5Cci[si - 1] !== null && m5Cci[si] !== null &&
                         m5Cci[si - 1] < -100 && m5Cci[si] > -100);
  // SELL: CCI crosses DOWN through +100
  const m5CciSellCross = (m5Cci[si - 1] !== null && m5Cci[si] !== null &&
                          m5Cci[si - 1] > 100 && m5Cci[si] < 100);

  // 4. M5 Candlestick Pattern (BGA Ch. 7) — Engulfing or RRT at reversal zone
  const buyPattern = hasBuyPattern(candles, si);
  const sellPattern = hasSellPattern(candles, si);

  // Shorthand TDI values for clarity
  const tdiRsi = m15Tdi.rsi[m15i];
  const tdiSignal = m15Tdi.signal[m15i];
  const tdiMiddle = m15Tdi.middle[m15i];
  const tdiUpper = m15Tdi.upper[m15i];
  const tdiLower = m15Tdi.lower[m15i];
  const tdiValuesReady = tdiRsi !== null && tdiSignal !== null && tdiMiddle !== null;

  let signalTriggered = false, direction = "", entry, sl, tp1, tp2, tp3;
  let entryType = null;
  let m15AgainstAtEntry = false;

  if (phaseCTarget) {
    // ==================================================================
    // PHASE C — Recovery add-on when Phase B trade is losing
    // Requires: M15 TDI RSI above signal (BUY) or below signal (SELL)
    //           + M5 CCI cross ±100 + Engulfing or RRT pattern
    // ==================================================================
    const pnlC = calcUnrealizedPnL(phaseCTarget, currentPrice);
    if (pnlC < 0) {
      if (phaseCTarget.direction === "BUY") {
        const tdiOk = tdiValuesReady && tdiRsi > tdiSignal;
        if (m5CciBuyCross && tdiOk && buyPattern) {
          signalTriggered = true; direction = "BUY"; entry = currentPrice; entryType = "PHASE_C";
        }
      } else if (phaseCTarget.direction === "SELL") {
        const tdiOk = tdiValuesReady && tdiRsi < tdiSignal;
        if (m5CciSellCross && tdiOk && sellPattern) {
          signalTriggered = true; direction = "SELL"; entry = currentPrice; entryType = "PHASE_C";
        }
      }
    }
  } else {
    // ==================================================================
    // PHASE A — Fresh H1 EMA50 cross, within 2.5h window
    // Requires ALL of:
    //   1. H1 trend confirmed (set in state.waitingFor)
    //   2. Daily bias agrees (or neutral)
    //   3. Price in H1 Fibonacci OTE zone (61.8–79% retracement)
    //   4. M15 TDI RSI above signal AND above midline (BUY)
    //        or below signal AND below midline (SELL)
    //   5. M5 CCI crosses -100 upward (BUY) or +100 downward (SELL)
    //   6. M5 Bullish Engulfing or RRT (BUY) / Bearish Engulfing or RRT (SELL)
    // ==================================================================
    if (!state.phaseATaken && !state.phaseAWindowExpired) {
      if (state.waitingFor === "BUY") {
        const dailyOk = dailyBias !== "SELL";
        const oteOk = isInH1OTEZone(h1Candles, currentPrice, "BUY");
        const tdiOk = tdiValuesReady && tdiRsi > tdiSignal && tdiRsi > tdiMiddle;
        if (dailyOk && oteOk && tdiOk && m5CciBuyCross && buyPattern) {
          signalTriggered = true; direction = "BUY"; entry = currentPrice;
          entryType = "PHASE_A"; state.phaseATaken = true;
        }
      } else if (state.waitingFor === "SELL") {
        const dailyOk = dailyBias !== "BUY";
        const oteOk = isInH1OTEZone(h1Candles, currentPrice, "SELL");
        const tdiOk = tdiValuesReady && tdiRsi < tdiSignal && tdiRsi < tdiMiddle;
        if (dailyOk && oteOk && tdiOk && m5CciSellCross && sellPattern) {
          signalTriggered = true; direction = "SELL"; entry = currentPrice;
          entryType = "PHASE_A"; state.phaseATaken = true;
        }
      }
    }

    // ==================================================================
    // PHASE B — After Phase A taken or window expired
    // Gate 1 (sticky — stays valid once met):
    //   M15 TDI RSI touches or goes below lower band (BUY oversold)
    //   M15 TDI RSI touches or goes above upper band (SELL overbought)
    // Gate 2 (47-min window from first cross):
    //   M15 TDI RSI crosses back ABOVE signal line (BUY)
    //   M15 TDI RSI crosses back BELOW signal line (SELL)
    // Entry (requires Gate 1 + Gate 2 active):
    //   Daily bias agrees + M5 CCI cross ±100 + Candlestick pattern
    // ==================================================================
    if (!signalTriggered && (state.phaseATaken || state.phaseAWindowExpired)) {
      if (state.waitingFor === "BUY") {
        // Gate 1: TDI RSI touches or falls below lower volatility band (oversold extreme)
        if (!state.phaseBTdiExtremeMet && tdiValuesReady && tdiLower !== null && tdiRsi <= tdiLower) {
          state.phaseBTdiExtremeMet = true;
          state.phaseBTdiExtremeDir = "BUY";
          // Initialize transition tracker: RSI just touched extreme (below signal)
          state.phaseBTdiWasAboveSignal = false;
          dbg(`[Phase B Gate 1 BUY] TDI RSI ${tdiRsi.toFixed(2)} touched lower band ${tdiLower.toFixed(2)}`);
        }

        if (state.phaseBTdiExtremeDir === "BUY" && tdiValuesReady) {
          const nowAboveSignal = tdiRsi > tdiSignal;

          // Gate 2: Detect transition from below signal to above signal (fresh cross)
          if (nowAboveSignal && state.phaseBTdiWasAboveSignal === false) {
            state.phaseBTdiCrossEpoch = currentCandleEpoch;
            state.phaseBTdiCrossDir = "BUY";
            dbg(`[Phase B Gate 2 BUY] TDI RSI crossed above signal at epoch ${currentCandleEpoch}`);
          }
          // If RSI falls back below signal, expire Gate 2
          if (!nowAboveSignal && state.phaseBTdiCrossDir === "BUY") {
            state.phaseBTdiCrossEpoch = null;
            state.phaseBTdiCrossDir = null;
            dbg("[Phase B Gate 2 BUY] TDI RSI fell back below signal — Gate 2 expired");
          }
          state.phaseBTdiWasAboveSignal = nowAboveSignal;

          // Gate 2 window expiry (47 minutes)
          if (state.phaseBTdiCrossEpoch && (currentCandleEpoch - state.phaseBTdiCrossEpoch > PHASE_B_GATE2_WINDOW)) {
            state.phaseBTdiCrossEpoch = null;
            state.phaseBTdiCrossDir = null;
            dbg("[Phase B Gate 2 BUY] 47-min window expired");
          }

          // Entry: Gate 2 active + daily bias + M5 CCI cross + candlestick
          if (state.phaseBTdiCrossDir === "BUY") {
            const dailyOk = dailyBias !== "SELL";
            if (dailyOk && m5CciBuyCross && buyPattern) {
              signalTriggered = true; direction = "BUY"; entry = currentPrice;
              entryType = state.phaseATaken ? "PHASE_B" : "PHASE_B_NO_PRIOR_A";
              state.phaseBTdiCrossEpoch = null;
              state.phaseBTdiCrossDir = null;
            }
          }
        }
      } else if (state.waitingFor === "SELL") {
        // Gate 1: TDI RSI touches or rises above upper volatility band (overbought extreme)
        if (!state.phaseBTdiExtremeMet && tdiValuesReady && tdiUpper !== null && tdiRsi >= tdiUpper) {
          state.phaseBTdiExtremeMet = true;
          state.phaseBTdiExtremeDir = "SELL";
          // Initialize transition tracker: RSI just touched extreme (above signal)
          state.phaseBTdiWasAboveSignal = true;
          dbg(`[Phase B Gate 1 SELL] TDI RSI ${tdiRsi.toFixed(2)} touched upper band ${tdiUpper.toFixed(2)}`);
        }

        if (state.phaseBTdiExtremeDir === "SELL" && tdiValuesReady) {
          const nowBelowSignal = tdiRsi < tdiSignal;

          // Gate 2: Detect transition from above signal to below signal (fresh cross)
          if (nowBelowSignal && state.phaseBTdiWasAboveSignal === true) {
            state.phaseBTdiCrossEpoch = currentCandleEpoch;
            state.phaseBTdiCrossDir = "SELL";
            dbg(`[Phase B Gate 2 SELL] TDI RSI crossed below signal at epoch ${currentCandleEpoch}`);
          }
          // If RSI rises back above signal, expire Gate 2
          if (!nowBelowSignal && state.phaseBTdiCrossDir === "SELL") {
            state.phaseBTdiCrossEpoch = null;
            state.phaseBTdiCrossDir = null;
            dbg("[Phase B Gate 2 SELL] TDI RSI rose back above signal — Gate 2 expired");
          }
          state.phaseBTdiWasAboveSignal = !nowBelowSignal;

          // Gate 2 window expiry (47 minutes)
          if (state.phaseBTdiCrossEpoch && (currentCandleEpoch - state.phaseBTdiCrossEpoch > PHASE_B_GATE2_WINDOW)) {
            state.phaseBTdiCrossEpoch = null;
            state.phaseBTdiCrossDir = null;
            dbg("[Phase B Gate 2 SELL] 47-min window expired");
          }

          // Entry: Gate 2 active + daily bias + M5 CCI cross + candlestick
          if (state.phaseBTdiCrossDir === "SELL") {
            const dailyOk = dailyBias !== "BUY";
            if (dailyOk && m5CciSellCross && sellPattern) {
              signalTriggered = true; direction = "SELL"; entry = currentPrice;
              entryType = state.phaseATaken ? "PHASE_B" : "PHASE_B_NO_PRIOR_A";
              state.phaseBTdiCrossEpoch = null;
              state.phaseBTdiCrossDir = null;
            }
          }
        }
      }

      // m15AgainstAtEntry: Phase B RSI below midline (BUY) or above midline (SELL)
      // Flags when M15 TDI overall bias is against the trade — enables Phase C recovery
      if (signalTriggered && (entryType === "PHASE_B" || entryType === "PHASE_B_NO_PRIOR_A")) {
        if (tdiValuesReady) {
          m15AgainstAtEntry = direction === "BUY"
            ? tdiRsi < tdiMiddle
            : tdiRsi > tdiMiddle;
        }
      }
    }
  }

  // ── Trade Execution ──
  if (signalTriggered) {
    try {
      const preCheckContracts = (await getOpenPortfolio()).filter(c => getContractSymbol(c) === TRADING_SYMBOL);
      if (entryType === "PHASE_C") {
        if (preCheckContracts.length > 1) return;
      } else {
        if (preCheckContracts.length > 0) {
          state.lastProcessedEpoch = currentCandleEpoch;
          fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
          return;
        }
      }
    } catch (preErr) {
      state.lastProcessedEpoch = currentCandleEpoch;
      fs.writeFileSync("state.json", JSON.stringify(state, null, 2));
      return;
    }

    let initialFractal = findRecentFractal(m15Candles, m15Candles.length - 2, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    if (direction === "BUY") {
      if (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) sl = initialFractal;
      else { sl = hardStopPrice; initialFractal = null; }
    } else {
      if (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) sl = initialFractal;
      else { sl = hardStopPrice; initialFractal = null; }
    }

    let fractalTimeframe = initialFractal ? "M15" : null;
    const slDistance = Math.abs(entry - sl);
    const bgaTps = calculateBgaTakeProfits(entry, direction, slDistance, d1Candles);
    tp1 = bgaTps.tp1; tp2 = bgaTps.tp2; tp3 = bgaTps.tp3;

    const timeFormatted = new Date(currentCandleEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const bgaTag = getBGAInfo(entry);
    const oteInfo = getOTEInfo(h1Candles, entry, direction);
    const biasLabel = dailyBias || "Neutral";
    const patternLabel = direction === "BUY"
      ? (buyPattern ? (isBullishEngulfing(candles[si - 1], candles[si]) ? "Bullish Engulfing" : "Bullish RRT") : "None")
      : (sellPattern ? (isBearishEngulfing(candles[si - 1], candles[si]) ? "Bearish Engulfing" : "Bearish RRT") : "None");
    const tdiLabel = tdiValuesReady
      ? `RSI ${tdiRsi.toFixed(1)} | Signal ${tdiSignal.toFixed(1)} | Mid ${tdiMiddle.toFixed(1)}`
      : "N/A";
    const cciLabel = m5Cci[si] !== null ? m5Cci[si].toFixed(1) : "N/A";

    let setupLabel = escapeMarkdown(
      entryType === "PHASE_C" ? "PHASE C (M15 Recovery Add-On)" :
      entryType === "PHASE_B_NO_PRIOR_A" ? "PHASE B (No Prior A — OTE bypass)" :
      `${entryType} (H1 EMA50 + BGA OTE + TDI + CCI)`
    );

    let message = `🚨 *${SYMBOL_NAME.toUpperCase()} CONFIRMED SIGNAL* 🚨\n\nDirection: *${direction}*\nRepo: ${REPO_LABEL}\nTimeframe: M5 Entry\n\n📍 Entry: ${Number(entry).toFixed(4)}\n🛑 Initial SL: ${Number(sl).toFixed(4)} (${initialFractal ? "M15 Fractal" : "Hard Stop"})\n🎯 TP1: ${Number(tp1).toFixed(4)} (BGA Whole)\n🎯 TP2 (Ultimate): ${Number(tp2).toFixed(4)} (BGA)\n🎯 TP3: ${Number(tp3).toFixed(4)} (reference)\n\n💰 Stake: $${STAKE_USD}\n⚡ Setup: ${setupLabel}\n\n📐 *BGA Confluence*\n• Price Level: ${bgaTag}\n• OTE Zone: ${oteInfo}\n• Daily Bias: ${biasLabel}\n• M15 TDI: ${tdiLabel}\n• M5 CCI(14): ${cciLabel}\n• Pattern: ${patternLabel}\n━━━━━━━━━━━━━━━━━━━━\n⏰ Time (UTC): ${timeFormatted}\n\n💡 To close manually: send \`/close win\` or \`/close loss\` in this chat`;

    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2));

    const pendingTradeRecord = {
      id: `${SYMBOL}-${isoTime.replace(/[: ]/g, "-")}`, contractId: null, pending: true,
      repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, tp1, tp2, tp3,
      h1OpenAtEntry: null, tp1Reached: false, breakevenSet: false, peakProfit: null,
      rr: RISK_REWARD, entryType, m15AgainstAtEntry, brokerSlAmount: STAKE_USD,
      entryEpoch: currentCandleEpoch, fractalSl: initialFractal, fractalEpoch: null,
      fractalTimeframe, m30FractalUpgraded: false, openTime: timeFormatted,
      closeTime: null, result: null, runnerUnlocked: false
    };
    trades.push(pendingTradeRecord);
    fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));

    try {
      const contractId = await executeTrade(direction);
      if (!contractId) {
        const idx = trades.findIndex(t => t.id === pendingTradeRecord.id);
        if (idx !== -1) trades.splice(idx, 1);
        fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
        await sendTelegram(`❌ *${REPO_LABEL}* — Signal triggered for ${direction}, but broker returned no contract ID. Trade aborted.`);
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
  if (MODE === "daily") { await runSummary("Daily"); return; }
  if (MODE === "weekly") { await runSummary("Weekly"); return; }
  if (MODE === "monthly") { await runSummary("Monthly"); return; }
  if (MODE === "close_win" || MODE === "closewin") { await executeManualClose("WIN", "manual trigger"); return; }
  if (MODE === "close_loss" || MODE === "closeloss") { await executeManualClose("LOSS", "manual trigger"); return; }
  if (TRIGGER_SOURCE !== "cronjob") return;
  await runScanMode();
})();
