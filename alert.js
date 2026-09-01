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
  const s = Math.floor(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60);
  if (h > 0) return `${h}h ${m%60}m`;
  if (m > 0) return `${m}m ${s%60}s`;
  return `${s}s`;
}

async function runSummary(label) {
  const trades = fs.existsSync("trades.json") ? JSON.parse(fs.readFileSync("trades.json")) : [];
  const closed = trades.filter(t => t.result);
  const wins = closed.filter(t => t.result === "WIN").length;
  const losses = closed.filter(t => t.result === "LOSS").length;
  const openTrades = trades.filter(t => !t.result && !t.pending);
  let msg = `📊 *${label} Summary — ${REPO_LABEL}*\n\nTotal closed: ${closed.length}\n✅ Wins: ${wins} | ❌ Losses: ${losses}\nWin rate: ${closed.length ? ((wins/closed.length)*100).toFixed(1) : 0}%\nOpen positions: ${openTrades.length}`;
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

// ==================== GATEWAY CLIENT CALLS (0ms LOCAL IPC) ====================
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
      profit: poc.profit,
      bid_price: poc.bid_price,
      current_spot: poc.current_spot,
      entry_spot: poc.entry_spot || poc.barrier || poc.entry_tick,
      is_sold: poc.is_sold,
      is_expired: poc.is_expired,
      status: poc.status
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

// ==================== MARKET DATA FETCHERS (PUBLIC UNLIMITED API) ====================
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

// ==================== TECHNICAL ANALYSIS & INDICATORS ====================
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
    if (i === period - 1) { prev = data.slice(0, period).reduce((a,b)=>a+b,0)/period; result.push(prev); continue; }
    prev = data[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);
  const macdLine = closes.map((_, i) => {
    if (fastEma[i] === null || slowEma[i] === null) return null;
    return fastEma[i] - slowEma[i];
  });
  const validMacd = macdLine.map(v => v !== null ? v : 0);
  const signalEma = ema(validMacd, signalPeriod);
  const signalLine = signalEma.map((v, i) => macdLine[i] === null ? null : v);
  const histogram = macdLine.map((v, i) => (v !== null && signalLine[i] !== null) ? v - signalLine[i] : null);
  return { macd: macdLine, signal: signalLine, histogram };
}

function calculateRSI(data, period = 14) {
  const result = new Array(data.length).fill(null);
  if (data.length <= period) return result;
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i-1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - (100 / (1 + rs));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i-1];
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

function calculateStochastic(candles, kPeriod = 5, dPeriod = 3, slowing = 3) {
  const closes = candles.map(c => parseFloat(c.close));
  const highs = candles.map(c => parseFloat(c.high));
  const lows = candles.map(c => parseFloat(c.low));
  const rawK = candles.map((_, i) => {
    if (i < kPeriod - 1) return null;
    const hSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lSlice = lows.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...hSlice);
    const ll = Math.min(...lSlice);
    if (hh === ll) return 50;
    return ((closes[i] - ll) / (hh - ll)) * 100;
  });
  const validRawK = rawK.map(x => x !== null ? x : 50);
  const smoothedK = sma(validRawK, slowing);
  const kLine = smoothedK.map((val, idx) => rawK[idx] === null ? null : val);
  const validK = kLine.map(x => x !== null ? x : 50);
  const smoothedD = sma(validK, dPeriod);
  const dLine = smoothedD.map((val, idx) => kLine[idx] === null ? null : val);
  return { k: kLine, d: dLine };
}

function findRecentFractal(candles, currentIndex, direction) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    if (direction === "BUY") {
      const low = parseFloat(candles[k].low);
      if (low < parseFloat(candles[k-1].low) && low < parseFloat(candles[k-2].low) &&
          low < parseFloat(candles[k+1].low) && low < parseFloat(candles[k+2].low)) return low;
    } else {
      const high = parseFloat(candles[k].high);
      if (high > parseFloat(candles[k-1].high) && high > parseFloat(candles[k-2].high) &&
          high > parseFloat(candles[k+1].high) && high > parseFloat(candles[k+2].high)) return high;
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

    if (fibMaxLimit && fibMaxLimit < tp1) {
      tp2 = Math.max(tp2, fibMaxLimit);
      tp3 = Math.max(tp3, fibMaxLimit);
    }
    if (tp2 >= tp1) tp2 = tp1 - halfStep;
    if (tp3 >= tp2) tp3 = tp2 - halfStep;

    return { tp1, tp2, tp3 };
  }
}

// ==================== MAIN SCANNER & TRADE LOGIC ====================
let state = {
  waitingFor: null, setupEpoch: null, lastProcessedEpoch: null, lastTgUpdateId: 0, h1TrendEpoch: null,
  phaseATriggeredEpoch: null, activeEntryType: null, phaseATaken: false, h1TrendCycleEpoch: null,
  phaseADeadlineEpoch: null, phaseAWindowExpired: false,
  phaseBStochCrossEpoch: null, phaseBStochDir: null
};
try {
  const s = JSON.parse(fs.readFileSync("state.json"));
  state = { ...state, ...s };
} catch {}

async function runScanMode() {
  console.log(`[${REPO_LABEL}] Scan started — ${new Date().toISOString()}`);
  let trades = [];
  try { trades = JSON.parse(fs.readFileSync("trades.json")); } catch {}

  // ── STEP 0: 0ms RAM PORTFOLIO READ VIA LOCAL GATEWAY (WITH STALENESS GUARD) ──
  let allLiveContracts = [];
  try {
    const allPortfolio = await getOpenPortfolio();
    allLiveContracts = allPortfolio.filter(c => getContractSymbol(c) === TRADING_SYMBOL);
    dbg(`Live broker contracts for ${TRADING_SYMBOL}: ${allLiveContracts.length}`);
  } catch (pErr) {
    console.warn(`[${REPO_LABEL}] Warning: Failed to read gateway portfolio: ${pErr.message}. Aborting scan.`);
    return;
  }

  // Duplicate check
  if (allLiveContracts.length > 2) {
    const dupDetails = allLiveContracts.map(c => `• Contract ID: \`${c.contract_id}\` (${c.contract_type}) @ ${c.buy_price || "N/A"}`).join("\n");
    await sendTelegram(`🚨 *DUPLICATE CONTRACTS DETECTED — ${REPO_LABEL}*\n\nFound *${allLiveContracts.length}* live open contracts on Deriv simultaneously:\n${dupDetails}\n\n⚠️ Bot will manage all contracts independently.`);
  }

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

  const liveContractIdSet = new Set(allLiveContracts.map(c => String(c.contract_id)));
  for (let i = trades.length - 1; i >= 0; i--) {
    const t = trades[i];
    if (!t.result) {
      if (t.pending) {
        trades.splice(i, 1);
      } else if (t.contractId && !liveContractIdSet.has(String(t.contractId)) && allLiveContracts.length === 0) {
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
          const durationMs = new Date(t.closeTime) - new Date(t.openTime);
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

  // ── STEP 0.5: PROCESS INCOMING TELEGRAM COMMANDS ──
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
        openTrade.closeTime = new Date().toISOString().replace("T"," ").substring(0,19);
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

      // 1. M30 Fractal SL Tracking (Upgrades SL when new Fractal forms)
      if (!openTrade.m30FractalUpgraded && tradeData.m30Candles && tradeData.m30Candles.length >= 5) {
        const c = tradeData.m30Candles;
        const tradeEntryEpoch = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);
        const currentIndex = c.length - 2;

        for (let k = 2; k <= currentIndex - 2; k++) {
          if (c[k].epoch > tradeEntryEpoch) {
            if (openTrade.direction === "BUY") {
              const isBottom = parseFloat(c[k].low) === Math.min(
                parseFloat(c[k-2].low), parseFloat(c[k-1].low),
                parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low)
              );
              const fractalVal = parseFloat(c[k].low);
              if (isBottom) {
                openTrade.m30FractalUpgraded = true;
                if (fractalVal > openTrade.sl && fractalVal < openTrade.entry) {
                  openTrade.fractalSl = fractalVal;
                  openTrade.sl = fractalVal;
                  openTrade.fractalEpoch = c[k].epoch;
                  openTrade.fractalTimeframe = "M30";
                  fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
                  await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M30 Structure\n\nTrade: ${openTrade.direction}\nNew M30 Bottom Fractal SL: ${openTrade.sl.toFixed(4)}`);
                }
                break;
              }
            } else if (openTrade.direction === "SELL") {
              const isTop = parseFloat(c[k].high) === Math.max(
                parseFloat(c[k-2].high), parseFloat(c[k-1].high),
                parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high)
              );
              const fractalVal = parseFloat(c[k].high);
              if (isTop) {
                openTrade.m30FractalUpgraded = true;
                if (fractalVal < openTrade.sl && fractalVal > openTrade.entry) {
                  openTrade.fractalSl = fractalVal;
                  openTrade.sl = fractalVal;
                  openTrade.fractalEpoch = c[k].epoch;
                  openTrade.fractalTimeframe = "M30";
                  fs.writeFileSync("trades.json", JSON.stringify(trades, null, 2));
                  await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M30 Structure\n\nTrade: ${openTrade.direction}\nNew M30 Top Fractal SL: ${openTrade.sl.toFixed(4)}`);
                }
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

      // 3. M30 Market Structure Early Exit (Loss Prevention & Runner Exit)
      // Only references M30 candles that CLOSED after the trade was opened.
      // This prevents pre-trade structural levels from triggering a premature exit.
      if (tradeData.m30Candles && tradeData.m30Candles.length >= 4) {
        const m30 = tradeData.m30Candles;
        const latestClosedM30 = m30[m30.length - 2];
        const tradeEntryEpoch = openTrade.entryEpoch || Math.floor(new Date(openTrade.openTime).getTime() / 1000);

        let structOpenPrice = null;
        for (let k = m30.length - 3; k >= 0; k--) {
          const c = m30[k];
          // c.epoch is the candle open time; c.epoch + M30 is when it closed.
          // Stop looking once we reach candles that closed before the trade opened.
          if (c.epoch + M30 <= tradeEntryEpoch) break;

          const cOpen = parseFloat(c.open);
          const cClose = parseFloat(c.close);

          if (openTrade.direction === "BUY" && cClose > cOpen) {
            structOpenPrice = cOpen;
            break;
          } else if (openTrade.direction === "SELL" && cClose < cOpen) {
            structOpenPrice = cOpen;
            break;
          }
        }

        if (structOpenPrice !== null) {
          const latestClose = parseFloat(latestClosedM30.close);
          let structureBroken = false;

          if (openTrade.direction === "BUY" && latestClose < structOpenPrice) {
            structureBroken = true;
          } else if (openTrade.direction === "SELL" && latestClose > structOpenPrice) {
            structureBroken = true;
          }

          if (structureBroken) {
            const result = pnl >= 0 ? "WIN" : "LOSS";
            const exitType = openTrade.runnerUnlocked ? "Runner Exit" : "Early Exit";
            await closeWith(result, `M30 Market Structure Broken (${exitType}) — Latest M30 closed at ${latestClose.toFixed(4)}, breaking structural level ${structOpenPrice.toFixed(4)}.`);
            continue;
          }
        }
      }

      // 4. Priority Exit Checks (Software SL, Hard SL, & Fractal SL)
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

      // 6. State Milestones: Breakeven, TP1, and Runner
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
        await sendTelegram(`🚀 *${REPO_LABEL} — Profit Runner Unlocked!*\n\nTrade exceeded +$${SOFTWARE_TP_USD.toFixed(2)} (PnL: +$${pnl.toFixed(2)}). Hard TP removed.\n\nM30 Market Structure & Wide Disaster Trail ($2.50) are now active.`);
      }

      // 7. Tiered Floor & Trailing Enforcement (Static Staircase & Wide Disaster Guard)
      if (openTrade.runnerUnlocked) {
        // Wide Disaster Trail ($2.50 from Peak)
        const WIDE_TRAILING_DISTANCE = 2.50;
        let disasterLockLevel = openTrade.peakProfit - WIDE_TRAILING_DISTANCE;
        disasterLockLevel = Math.max(disasterLockLevel, 1.25); // Never drop below TP1 static floor

        if (pnl <= disasterLockLevel) {
          await closeWith("WIN", `Wide Disaster Trail exit — locked +$${pnl.toFixed(2)} (peak $${openTrade.peakProfit.toFixed(2)}, trailed by $${WIDE_TRAILING_DISTANCE.toFixed(2)})`);
          continue;
        }
      } else if (openTrade.tp1Reached) {
        // TP1 Static Floor (+$1.25)
        if (pnl <= 1.25) {
          await closeWith("WIN", `TP1 Static Floor exit — locked +$1.25`);
          continue;
        }
      } else if (openTrade.breakevenSet) {
        // Breakeven Floor (+$0.70)
        if (pnl <= 0.70) {
          await closeWith("WIN", `Commission-Covered Breakeven exit — locked +$0.70`);
          continue;
        }
      }
    }
  }

  // ── STRICT PRE-SCAN GUARD: Allow 1 Phase C if Phase B is open against M15 TDI ──
  let allowScan = false;
  let phaseCTarget = null;
  const unresolvedTrades = trades.filter(t => !t.result);

  if (allLiveContracts.length === 0 && unresolvedTrades.length === 0) {
    allowScan = true;
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

  // ── Signal Scan ──
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

  const i = candles.length - 2;
  const currentCandleEpoch = candles[i].epoch;
  const closes = candles.map(c => parseFloat(c.close));

  if (state.lastProcessedEpoch === currentCandleEpoch) {
    console.log("Already processed this candle — skipping."); return;
  }
  const isoTime = new Date(currentCandleEpoch * 1000).toISOString();

  // 1. Evaluate Current H1 Trend Direction and Fresh Crossovers
  let h1FreshBuy = false; let h1FreshSell = false; let h1TrendDir = null;
  let ema50_1h = null;
  let h1Closes = null;

  if (h1Candles && h1Candles.length >= 250) {
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

  // ── TREND STATE MANAGEMENT ──
  // A. Fresh Trend Detected
  if (h1NewCycleEpoch && state.h1TrendCycleEpoch !== h1NewCycleEpoch) {
    state.h1TrendCycleEpoch = h1NewCycleEpoch;
    state.waitingFor = h1FreshBuy ? "BUY" : "SELL";
    state.phaseATaken = false;
    state.phaseAWindowExpired = false;
    state.phaseADeadlineEpoch = h1NewCycleEpoch + PHASE_A_WINDOW_SECONDS;
    state.phaseBStochCrossEpoch = null;
    state.phaseBStochDir = null;
  }

  // B. Trend Invalidation Guard (Current trend contradicts waiting state)
  if (h1TrendDir && state.waitingFor && h1TrendDir !== state.waitingFor) {
    state.waitingFor = null; state.phaseATaken = false; state.h1TrendCycleEpoch = null;
    state.phaseADeadlineEpoch = null; state.phaseAWindowExpired = false;
    state.phaseBStochCrossEpoch = null; state.phaseBStochDir = null;
  }

  // C. Cold Boot Reverse Lookup (No current state, but active trend exists)
  if (!state.waitingFor && h1TrendDir && ema50_1h && h1Closes) {
    let historicalCrossEpoch = currentCandleEpoch; // Fallback
    for (let j = h1Candles.length - 2; j >= 1; j--) {
      const prevC = h1Closes[j-1];
      const currC = h1Closes[j];
      const prevEma = ema50_1h[j-1];
      const currEma = ema50_1h[j];

      if (prevEma == null || currEma == null) break;

      if (h1TrendDir === "BUY" && prevC <= prevEma && currC > currEma) {
        historicalCrossEpoch = h1Candles[j].epoch; break;
      } else if (h1TrendDir === "SELL" && prevC >= prevEma && currC < currEma) {
        historicalCrossEpoch = h1Candles[j].epoch; break;
      }
    }

    state.waitingFor = h1TrendDir;
    state.h1TrendCycleEpoch = historicalCrossEpoch;
    state.phaseATaken = false;
    state.phaseADeadlineEpoch = historicalCrossEpoch + PHASE_A_WINDOW_SECONDS;

    const nowEpoch = Math.floor(Date.now() / 1000);
    if (nowEpoch > state.phaseADeadlineEpoch) {
      state.phaseAWindowExpired = true;
      dbg(`[Cold Boot] Adopted historical ${h1TrendDir} trend from epoch ${historicalCrossEpoch}. Phase A EXPIRED -> Moved to Phase B.`);
    } else {
      state.phaseAWindowExpired = false;
      dbg(`[Cold Boot] Adopted historical ${h1TrendDir} trend from epoch ${historicalCrossEpoch}. Phase A ACTIVE.`);
    }
  }

  // D. Normal Expiration Check (Evaluated every scan)
  if (state.waitingFor && !state.phaseATaken && !state.phaseAWindowExpired && state.phaseADeadlineEpoch) {
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (nowEpoch > state.phaseADeadlineEpoch) {
      state.phaseAWindowExpired = true;
    }
  }

  if (!state.waitingFor && !phaseCTarget) {
    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); return;
  }

  const si = candles.length - 2;
  const stoch = calculateStochastic(candles, 5, 3, 3);

  // MACD M5 (12,16,9) with Main & Signal Lines
  const macd_m5 = calculateMACD(closes, 12, 16, 9);

  let signalTriggered = false, direction = "", entry, sl, risk, tp1, tp2, tp3;
  let entryType = null;
  let m15AgainstAtEntry = false;

  // Guard against unformed MACD arrays before accessing indexes
  if (si >= 1 && stoch.k[si] != null && stoch.k[si-1] != null && macd_m5.macd[si] != null && macd_m5.macd[si-1] != null && macd_m5.signal[si] != null) {

    const m5MacdBuyOk = macd_m5.macd[si] > macd_m5.signal[si];
    const m5MacdSellOk = macd_m5.macd[si] < macd_m5.signal[si];

    const m15Closes = m15Candles.map(c => parseFloat(c.close));
    const m15Rsi = calculateRSI(m15Closes, 14);
    const m15Tdi = calculateBollingerBands(m15Rsi, 34, 1.619);
    const m15i = m15Candles.length - 2;

    const macd_m15_12_26_9 = calculateMACD(m15Closes, 12, 26, 9);
    const liveM15Macd_12_26_9 = macd_m15_12_26_9.macd[m15Closes.length - 1];

    const macd_m15_12_16_9 = calculateMACD(m15Closes, 12, 16, 9);
    const liveM15Macd_12_16_9 = macd_m15_12_16_9.macd[m15Closes.length - 1];

    if (phaseCTarget) {
      // ==== PHASE C EVALUATION ENGINE (Strictly %K only) ====
      const currentPnl = calcUnrealizedPnL(phaseCTarget, closes[i]);
      if (currentPnl < 0) {
        if (phaseCTarget.direction === "BUY") {
          const stochCrossBuyPhaseC = stoch.k[si-1] <= 20 && stoch.k[si] > 20;
          const macdValid = liveM15Macd_12_16_9 !== null && liveM15Macd_12_16_9 >= 0;
          if (stochCrossBuyPhaseC && macdValid && m5MacdBuyOk) {
            signalTriggered = true; direction = "BUY"; entry = closes[i]; entryType = "PHASE_C";
          }
        } else if (phaseCTarget.direction === "SELL") {
          const stochCrossSellPhaseC = stoch.k[si-1] >= 80 && stoch.k[si] < 80;
          const macdValid = liveM15Macd_12_16_9 !== null && liveM15Macd_12_16_9 <= 0;
          if (stochCrossSellPhaseC && macdValid && m5MacdSellOk) {
            signalTriggered = true; direction = "SELL"; entry = closes[i]; entryType = "PHASE_C";
          }
        }
      }
    } else {
      // ==== NORMAL PHASE A / B EVALUATION ====
      if (!state.phaseATaken && !state.phaseAWindowExpired) {
        // 🛡️ Phase A with Strict %K-Only Crossover & M15 MACD Confluence
        const stochCrossBuyPhaseA = stoch.k[si-1] <= 20 && stoch.k[si] > 20;
        const stochCrossSellPhaseA = stoch.k[si-1] >= 80 && stoch.k[si] < 80;

        const m15MacdBuyOk = liveM15Macd_12_26_9 !== null && liveM15Macd_12_26_9 >= 0;
        const m15MacdSellOk = liveM15Macd_12_26_9 !== null && liveM15Macd_12_26_9 <= 0;

        if (state.waitingFor === "BUY" && stochCrossBuyPhaseA && m15MacdBuyOk && m5MacdBuyOk) {
          signalTriggered = true; direction = "BUY"; entry = closes[i]; entryType = "PHASE_A"; state.phaseATaken = true;
        } else if (state.waitingFor === "SELL" && stochCrossSellPhaseA && m15MacdSellOk && m5MacdSellOk) {
          signalTriggered = true; direction = "SELL"; entry = closes[i]; entryType = "PHASE_A"; state.phaseATaken = true;
        }
      }

      // --- PHASE B (Stoch %K only + MACD 12,16,9) ---
      if (!signalTriggered && (state.phaseATaken || state.phaseAWindowExpired)) {
        const stochCrossBuyB = stoch.k[si-1] <= 20 && stoch.k[si] > 20;
        const stochCrossSellB = stoch.k[si-1] >= 80 && stoch.k[si] < 80;
        const macdBuyB = macd_m5.macd[si] > 0;
        const macdSellB = macd_m5.macd[si] < 0;
        const m15MacdValidBuyB = liveM15Macd_12_26_9 !== null && liveM15Macd_12_26_9 >= 0;
        const m15MacdValidSellB = liveM15Macd_12_26_9 !== null && liveM15Macd_12_26_9 <= 0;

        if (state.waitingFor === "BUY") {
          if (stochCrossBuyB) {
            state.phaseBStochCrossEpoch = currentCandleEpoch;
            state.phaseBStochDir = "BUY";
          }
          if (state.phaseBStochCrossEpoch && (currentCandleEpoch - state.phaseBStochCrossEpoch > 2820)) {
            state.phaseBStochCrossEpoch = null;
            state.phaseBStochDir = null;
          }
          if (state.phaseBStochDir === "BUY" && macdBuyB && m15MacdValidBuyB && m5MacdBuyOk) {
            signalTriggered = true; direction = "BUY"; entry = closes[i]; entryType = state.phaseATaken ? "PHASE_B" : "PHASE_B_NO_PRIOR_A";
            state.phaseBStochCrossEpoch = null; state.phaseBStochDir = null;
          }
        } else if (state.waitingFor === "SELL") {
          if (stochCrossSellB) {
            state.phaseBStochCrossEpoch = currentCandleEpoch;
            state.phaseBStochDir = "SELL";
          }
          if (state.phaseBStochCrossEpoch && (currentCandleEpoch - state.phaseBStochCrossEpoch > 2820)) {
            state.phaseBStochCrossEpoch = null;
            state.phaseBStochDir = null;
          }
          if (state.phaseBStochDir === "SELL" && macdSellB && m15MacdValidSellB && m5MacdSellOk) {
            signalTriggered = true; direction = "SELL"; entry = closes[i]; entryType = state.phaseATaken ? "PHASE_B" : "PHASE_B_NO_PRIOR_A";
            state.phaseBStochCrossEpoch = null; state.phaseBStochDir = null;
          }
        }
      }

      if (signalTriggered && (entryType === "PHASE_B" || entryType === "PHASE_B_NO_PRIOR_A") && m15Rsi[m15i] != null && m15Tdi.middle[m15i] != null) {
        if (direction === "BUY") m15AgainstAtEntry = m15Rsi[m15i] < m15Tdi.middle[m15i];
        else m15AgainstAtEntry = m15Rsi[m15i] > m15Tdi.middle[m15i];
      }
    }
  }

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
    const slDollars = parseFloat(STAKE_USD.toFixed(2));
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    if (direction === "BUY") {
      if (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) sl = initialFractal;
      else { sl = hardStopPrice; initialFractal = null; }
    } else {
      if (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) sl = initialFractal;
      else { sl = hardStopPrice; initialFractal = null; }
    }

    let fractalTimeframe = initialFractal ? "M15" : null;
    risk = Math.abs(entry - sl);
    const slDistance = risk;
    const bgaTps = calculateBgaTakeProfits(entry, direction, slDistance, d1Candles);
    tp1 = bgaTps.tp1; tp2 = bgaTps.tp2; tp3 = bgaTps.tp3;
    const timeFormatted = new Date(currentCandleEpoch * 1000).toISOString().replace("T"," ").substring(0,19);
    const bgaTag = getBGAInfo(entry);

    let setupLabel = escapeMarkdown(entryType === "PHASE_C" ? "PHASE C (M15 Rescue Add-On)"
      : (entryType === "PHASE_B_NO_PRIOR_A" ? "PHASE B (Phase A window expired unfilled — fallback re-entry)" : `${entryType} (H1 EMA 50, ${PHASE_A_WINDOW_SECONDS/3600}h Phase A window)`));

    let message = `🚨 *${SYMBOL_NAME.toUpperCase()} CONFIRMED SIGNAL* 🚨\n\nDirection: ${direction}\nRepo: ${REPO_LABEL}\nTimeframe: M5\n\n📍 Entry: ${Number(entry).toFixed(4)}\n🛑 Initial SL: ${Number(sl).toFixed(4)} (${initialFractal ? "M15 Fractal" : "Hard Stop"})\n🎯 TP1: ${Number(tp1).toFixed(4)} (BGA Whole)\n🎯 TP2 (Ultimate TP): ${Number(tp2).toFixed(4)} (BGA)\n🎯 TP3: ${Number(tp3).toFixed(4)} (reference)\n\n💰 Stake: $${STAKE_USD}\n⚡ Setup: ${setupLabel}\n️ Confluence: ${bgaTag}\n━━━━━━━━━━━━━━━━━━━━\n⏰ Time (UTC): ${timeFormatted}\n\n💡 To close manually: send \`/close win\` or \`/close loss\` in this chat`;
    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2));

    const pendingTradeRecord = {
      id: `${SYMBOL}-${isoTime.replace(/[: ]/g, "-")}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, tp1, tp2, tp3, h1OpenAtEntry: null, tp1Reached: false, breakevenSet: false, peakProfit: null, rr: RISK_REWARD, entryType, m15AgainstAtEntry, brokerSlAmount: STAKE_USD,
      entryEpoch: currentCandleEpoch, fractalSl: initialFractal, fractalEpoch: null, fractalTimeframe, m30FractalUpgraded: false, openTime: timeFormatted, closeTime: null, result: null, runnerUnlocked: false
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
      pendingTradeRecord.contractId = contractId; pendingTradeRecord.pending = false;
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
