import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

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
const TARGET_MIN_PROFIT = 5.00; // FIX: was previously referenced but never declared (caused a crash on every signal)

const FIB_TOLERANCE = 0.005; // 0.5% tolerance for Reversal zone touches

// Symbols where Stochastic rarely retraces all the way to 20/80 — allow a fresh 50-midline
// cross as a fallback confirmation (per spec caveat), so we don't miss entries on these instruments.
const STOCH_MIDLINE_FALLBACK_SYMBOLS = ["R_50", "R_10"];

const GATEWAY_URL = process.env.GATEWAY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

const TG_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const MODE = process.env.MODE || "cronjob";
const TRIGGER_SOURCE = process.env.TRIGGER_SOURCE || "manual";

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
      wsPublic.send(JSON.stringify({ req_id: 4, ticks_history: SYMBOL, granularity: M15, count: 250, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 6, ticks_history: SYMBOL, granularity: M30, count: 120, end: "latest", style: "candles" }));
      wsPublic.send(JSON.stringify({ req_id: 5, ticks_history: SYMBOL, granularity: D1,  count: 5,   end: "latest", style: "candles" }));
    });
    wsPublic.on("message", d => {
      const msg = JSON.parse(d);
      if (msg.req_id === 1) results.m5  = msg.candles;
      if (msg.req_id === 4) results.m15 = msg.candles;
      if (msg.req_id === 6) results.m30 = msg.candles;
      if (msg.req_id === 5) results.d1  = msg.candles;
      if (results.m5 && results.m15 && results.m30 && results.d1) { wsPublic.close(); resolve(results); }
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

async function getCurrentPrice() {
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

function calculateStoch(candles, kPeriod = 18, dPeriod = 12, slowing = 25) {
  const fastK = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const sl = candles.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...sl.map(c => parseFloat(c.high)));
    const ll = Math.min(...sl.map(c => parseFloat(c.low)));
    const c = parseFloat(candles[i].close);
    fastK[i] = hh === ll ? 100 : ((c - ll) / (hh - ll)) * 100;
  }
  const slowK = sma(fastK.map(v => v !== null ? v : 50), slowing).map((v, i) => fastK[i] === null ? null : v);
  const slowD = sma(slowK.map(v => v !== null ? v : 50), dPeriod).map((v, i) => slowK[i] === null ? null : v);
  return { k: slowK, d: slowD }; // K = Green, D = Red
}

function calculateEnvelopes(candles, period = 50, devPct = 0.05) {
  const closes = candles.map(c => parseFloat(c.close));
  const mid = sma(closes, period);
  const up = mid.map(m => m !== null ? m * (1 + devPct / 100) : null);
  const lo = mid.map(m => m !== null ? m * (1 - devPct / 100) : null);
  return { upper: up, lower: lo };
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

  const h = parseFloat(yesterday.high);
  const l = parseFloat(yesterday.low);
  const o = parseFloat(yesterday.open);
  const c = parseFloat(yesterday.close);
  const rng = h - l;
  if (rng <= 0) return null;

  const bullish = c > o;
  const dailyBiasPrice = parseFloat(today.open);

  if (bullish) {
    // 0% at Top, 100% at Bottom
    return { bullish, fibM50: h + 0.5*rng, fib0: h, fib50: h - 0.5*rng, fib79: h - 0.79*rng, fib100: l, fib1618: h - 1.618*rng, dailyBiasPrice };
  } else {
    // 0% at Bottom, 100% at Top
    return { bullish, fibM50: l - 0.5*rng, fib0: l, fib50: l + 0.5*rng, fib79: l + 0.79*rng, fib100: h, fib1618: l + 1.618*rng, dailyBiasPrice };
  }
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

// ==================== STATE ====================
let state = {
  lastProcessedEpoch: null,
  lastTgUpdateId: 0,
  armed: null,
  confirm: null, // { label, cci:{aligned}, stoch:{aligned}, env:{aligned} } — persists across candles
  dailyBiasPrice: null,
  // These placeholders ensure the Dashboard UI doesn't crash when rendering
  nextPhase: null,
  h1TdiDir: null,
  fibBullish: null,
  fib0: null,
  fib50: null,
  fib618: null,
  fib79: null,
  fib100: null,
  cciAligned: false,
  stochAligned: false,
  envAligned: false
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

      // 4. Catastrophic floor
      if (pnl <= CATASTROPHIC_PNL_FLOOR) {
        await closeWith("LOSS", `Catastrophic floor hit — PnL $${pnl.toFixed(2)} (Floor: $${CATASTROPHIC_PNL_FLOOR.toFixed(2)})`); continue;
      }

      // 5. Software Stop Loss (-$3.60)
      if (pnl <= SOFTWARE_SL_USD) {
        await closeWith("LOSS", `Software SL hit — PnL $${pnl.toFixed(2)} (Limit: $${SOFTWARE_SL_USD.toFixed(2)})`); continue;
      }

      // 6. Fibonacci TP Close
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
  const m15Candles = scanData.m15;
  const m30Candles = scanData.m30;
  const d1Candles = scanData.d1;

  if (!candles || candles.length < 120)     return;
  if (!m15Candles || m15Candles.length < 50) return;
  if (!m30Candles || m30Candles.length < 50) return;
  if (!d1Candles || d1Candles.length < 2)  return;

  const si = candles.length - 2;  // Last closed M5 candle index
  const currentCandleEpoch = candles[si].epoch;

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

  // MIDNIGHT ROLLOVER FIX: Reset Arm/Confirmation State if the new day started
  const newBiasPrice = parseFloat(fib.dailyBiasPrice.toFixed(4));
  if (state.dailyBiasPrice !== null && state.dailyBiasPrice !== newBiasPrice) {
    dbg("[FIB] Midnight rollover detected. Resetting Arm/Confirmation State for the new day.");
    state.armed = null;
    state.confirm = null;
  }
  state.dailyBiasPrice = newBiasPrice;

  // Sync state for Dashboard UI Compatibility
  state.fibBullish     = fib.bullish;
  state.fib0           = parseFloat(fib.fib0.toFixed(4));
  state.fib50          = parseFloat(fib.fib50.toFixed(4));
  state.fib618         = parseFloat(fib.fib1618?.toFixed(4) || 0); // Repurposed for Dashboard UI
  state.fib79          = parseFloat(fib.fib79.toFixed(4));
  state.fib100         = parseFloat(fib.fib100.toFixed(4));
  state.h1TdiDir       = fib.bullish ? "BULL" : "BEAR";

  // ── RAW INDICATOR VALUES ──
  const currentPrice = parseFloat(candles[si].close);
  const maxH         = Math.max(...candles.slice(-12).map(x => parseFloat(x.high)));
  const minL         = Math.min(...candles.slice(-12).map(x => parseFloat(x.low)));
  const m15Close     = parseFloat(m15Candles[m15Candles.length - 2].close);
  const m30Close     = parseFloat(m30Candles[m30Candles.length - 2].close);

  const cci   = calculateCCI(candles, 100);
  const env   = calculateEnvelopes(candles, 50, 0.05);
  const stoch = calculateStoch(candles, 18, 12, 25);
  const m30St = calculateStoch(m30Candles, 18, 12, 25); // informational only — shown in alerts, not part of the 4 documented indicators

  const cVal    = cci[si];
  const prevCci = cci[si - 1];
  const eUp     = env.upper[si];
  const eLo     = env.lower[si];
  const sK      = stoch.k[si];
  const sD      = stoch.d[si];
  const prevK   = stoch.k[si - 1];
  const prevD   = stoch.d[si - 1];

  const m30K = m30St.k[m30Candles.length - 2];
  const m30D = m30St.d[m30Candles.length - 2];

  if (cVal === null || prevCci === null || eUp === null || eLo === null ||
      sK === null || sD === null || prevK === null || prevD === null || m30K === null) {
    state.lastProcessedEpoch = currentCandleEpoch;
    fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); return;
  }

  // ── A. FIB ARMING STATE MACHINE ──
  // Determines WHICH setup is active (direction/type/target) based on where price touched
  // and whether the M15 (reversal) or M30 (continuation) candle confirmed a close beyond the level.
  let newArm = null;

  if (fib.bullish) {
    if (maxH >= fib.fib0) {
      if (m30Close > fib.fib0) newArm = { type: "CONT", dir: "BUY", tp: fib.fibM50, lvl: fib.fib0, lbl: "CONT_BUY (0%)" };
      else if (m15Close < fib.fib0) newArm = { type: "REV", dir: "SELL", tp: fib.fib50, lbl: "REV_SELL (0% Fake)" };
    }
    if (minL <= fib.fib79 + FIB_TOLERANCE && m15Close > fib.fib79) newArm = { type: "REV", dir: "BUY", tp: fib.fib0, lbl: "REV_BUY (79%)" };
    if (minL <= fib.fib100 + FIB_TOLERANCE) {
      if (m30Close < fib.fib100) newArm = { type: "CONT", dir: "SELL", tp: fib.fib1618, lvl: fib.fib100, lbl: "CONT_SELL (100%)" };
      else if (m15Close > fib.fib100) newArm = { type: "REV", dir: "BUY", tp: fib.fib50, lbl: "REV_BUY (100% Fake)" };
    }
  } else {
    if (minL <= fib.fib0) {
      if (m30Close < fib.fib0) newArm = { type: "CONT", dir: "SELL", tp: fib.fibM50, lvl: fib.fib0, lbl: "CONT_SELL (0%)" };
      else if (m15Close > fib.fib0) newArm = { type: "REV", dir: "BUY", tp: fib.fib50, lbl: "REV_BUY (0% Fake)" };
    }
    if (maxH >= fib.fib79 - FIB_TOLERANCE && m15Close < fib.fib79) newArm = { type: "REV", dir: "SELL", tp: fib.fib0, lbl: "REV_SELL (79%)" };
    if (maxH >= fib.fib100 - FIB_TOLERANCE) {
      if (m30Close > fib.fib100) newArm = { type: "CONT", dir: "BUY", tp: fib.fib1618, lvl: fib.fib100, lbl: "CONT_BUY (100%)" };
      else if (m15Close < fib.fib100) newArm = { type: "REV", dir: "SELL", tp: fib.fib50, lbl: "REV_SELL (100% Fake)" };
    }
  }

  // Only re-arm (and reset confirmation flags) when a genuinely NEW setup appears.
  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    dbg(`[STATE] New Arm: ${newArm.lbl} — resetting CCI/Stoch/Envelope confirmation flags`);
    state.armed = newArm;
    state.confirm = { label: newArm.lbl, cci: { aligned: false }, stoch: { aligned: false }, env: { aligned: false } };
  }

  state.nextPhase = state.armed ? state.armed.lbl : null;

  // ── B/C/D. INDEPENDENT INDICATOR CONFIRMATION ──
  // Each indicator keeps its own persistent "aligned" flag. Once true it STAYS true (even across
  // many candles / regardless of order) until that SAME indicator's condition invalidates — at
  // which point ONLY that indicator resets and waits for a fresh alignment again.
  if (state.armed && state.confirm) {
    const { type, dir } = state.armed;

    // --- Indicator 2: CCI(100) on Typical Price ---
    // Case A (CONT / momentum breakout beyond fib 0 or 100): needs a FRESH cross through +/-70.5.
    // Case B (REV / price inside fib 0-100): needs CCI to have been beyond +/-70.5 and then a FRESH cross back through it.
    if (dir === "BUY") {
      const freshAlign = type === "CONT"
        ? (prevCci <= 70.5 && cVal > 70.5)     // fresh breakout cross up
        : (prevCci <= -70.5 && cVal > -70.5);  // fresh release from oversold
      if (freshAlign) state.confirm.cci.aligned = true;
      else if (state.confirm.cci.aligned) {
        if (type === "CONT" && cVal <= 70.5) state.confirm.cci.aligned = false;
        if (type === "REV"  && cVal <= -70.5) state.confirm.cci.aligned = false;
      }
    } else { // SELL
      const freshAlign = type === "CONT"
        ? (prevCci >= -70.5 && cVal < -70.5)
        : (prevCci >= 70.5 && cVal < 70.5);
      if (freshAlign) state.confirm.cci.aligned = true;
      else if (state.confirm.cci.aligned) {
        if (type === "CONT" && cVal >= -70.5) state.confirm.cci.aligned = false;
        if (type === "REV"  && cVal >= 70.5) state.confirm.cci.aligned = false;
      }
    }

    // --- Indicator 3: Stochastic (18,12,25 SMA on M5) ---
    const crossUp         = prevK <= prevD && sK > sD;
    const crossDown       = prevK >= prevD && sK < sD;
    const crossedAbove50  = prevK < 50 && sK >= 50;
    const crossedBelow50  = prevK > 50 && sK <= 50;
    const midlineFallback = STOCH_MIDLINE_FALLBACK_SYMBOLS.includes(SYMBOL);

    if (dir === "BUY") {
      let freshAlign;
      if (type === "REV") {
        // Primary: fresh cross up while still oversold (<=20).
        // Fallback (Vix 10/50 caveat): fresh cross up that coincides with a 50-midline cross.
        freshAlign = (crossUp && sK <= 20) || (midlineFallback && crossUp && crossedAbove50);
      } else {
        // CONT: embedded/continuation momentum — fresh cross up while pinned above midline.
        freshAlign = crossUp && sK >= 50;
      }
      if (freshAlign) state.confirm.stoch.aligned = true;
      else if (state.confirm.stoch.aligned && crossDown) state.confirm.stoch.aligned = false; // invalidated by an opposite cross
    } else { // SELL
      let freshAlign;
      if (type === "REV") {
        freshAlign = (crossDown && sK >= 80) || (midlineFallback && crossDown && crossedBelow50);
      } else {
        freshAlign = crossDown && sK <= 50;
      }
      if (freshAlign) state.confirm.stoch.aligned = true;
      else if (state.confirm.stoch.aligned && crossUp) state.confirm.stoch.aligned = false;
    }

    // --- Indicator 4: Envelopes (50 SMA, 0.05% dev, Close) ---
    if (dir === "BUY") {
      if (currentPrice > eUp) state.confirm.env.aligned = true;
      else if (state.confirm.env.aligned && currentPrice <= eUp) state.confirm.env.aligned = false;
    } else {
      if (currentPrice < eLo) state.confirm.env.aligned = true;
      else if (state.confirm.env.aligned && currentPrice >= eLo) state.confirm.env.aligned = false;
    }
  }

  // Dashboard visibility
  state.cciAligned   = state.confirm ? state.confirm.cci.aligned   : false;
  state.stochAligned = state.confirm ? state.confirm.stoch.aligned : false;
  state.envAligned   = state.confirm ? state.confirm.env.aligned   : false;

  // ── TRIGGER LOGIC ──
  // Fires only once Fib is armed AND all three indicators are independently aligned —
  // they do NOT need to have aligned on the same candle.
  let signalTriggered = false, direction = "", fibTpPrice = null, entryType = null;

  if (state.armed && state.confirm &&
      state.confirm.cci.aligned && state.confirm.stoch.aligned && state.confirm.env.aligned) {
    signalTriggered = true;
    direction   = state.armed.dir;
    entryType   = state.armed.lbl;
    fibTpPrice  = state.armed.tp;
    state.armed   = null; // clear the trap
    state.confirm = null;
  }

  // ── EXECUTE & DYNAMIC TP OVERRIDE ──
  if (signalTriggered) {
    const entry = currentPrice;

    const requiredRawPnl = TARGET_MIN_PROFIT + COMMISSION_USD;
    const priceMoveFraction = requiredRawPnl / (STAKE_USD * MULTIPLIER);
    const minTpPrice = direction === "BUY" 
      ? entry * (1 + priceMoveFraction) 
      : entry * (1 - priceMoveFraction);

    if (direction === "BUY" && minTpPrice > fibTpPrice) {
      fibTpPrice = minTpPrice;
      entryType = entryType + " ($5 Ext)";
      dbg(`[TP OVERRIDE] Extended BUY TP to ${fibTpPrice.toFixed(4)} for $5 target.`);
    } else if (direction === "SELL" && minTpPrice < fibTpPrice) {
      fibTpPrice = minTpPrice;
      entryType = entryType + " ($5 Ext)";
      dbg(`[TP OVERRIDE] Extended SELL TP to ${fibTpPrice.toFixed(4)} for $5 target.`);
    }

    let initialFractal = findRecentFractal(candles, si, direction);
    const hardStopPrice = deriveHardStopPrice(entry, direction);

    let sl;
    if (direction === "BUY") {
      sl = (initialFractal && initialFractal > hardStopPrice && initialFractal < entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    } else {
      sl = (initialFractal && initialFractal < hardStopPrice && initialFractal > entry) ? initialFractal : (initialFractal = null, hardStopPrice);
    }

    const fractalTimeframe = initialFractal ? "M5" : null;
    const timeFormatted = new Date(currentCandleEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);

    const m30Str = `M30 Stoch (info): %K ${m30K.toFixed(1)} | %D ${m30D.toFixed(1)}`;
    const m5Str  = `M5 Stoch: %K ${sK.toFixed(1)} | %D ${sD.toFixed(1)}`;
    const cciStr = `M5 CCI(100): ${cVal.toFixed(1)}`;
    const envStr = `M5 Env: Close ${currentPrice.toFixed(4)} | Upper ${eUp.toFixed(4)} | Lower ${eLo.toFixed(4)}`;
    
    let fibLabel = "";
    if (fib.bullish) fibLabel = `0%: ${fib.fib0.toFixed(4)} | 50%: ${fib.fib50.toFixed(4)} | 79%: ${fib.fib79.toFixed(4)} | 100%: ${fib.fib100.toFixed(4)} | Bullish`;
    else fibLabel = `0%: ${fib.fib0.toFixed(4)} | 50%: ${fib.fib50.toFixed(4)} | 79%: ${fib.fib79.toFixed(4)} | 100%: ${fib.fib100.toFixed(4)} | Bearish`;

    const setupLabel = escapeMarkdown(entryType);

    const message = `🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\nDirection: *${direction}*\nRepo: ${REPO_LABEL}\nSetup: ${setupLabel}\n\n📍 Entry: ${entry.toFixed(4)}\n🛑 Initial SL: ${sl.toFixed(4)} (${initialFractal ? "M5 Fractal" : "Hard Stop"})\n🎯 Fib TP: *${fibTpPrice.toFixed(4)}*\n\n💰 Stake: $${STAKE_USD} | Server TP backstop: $${SERVER_TP_USD}\n\n📐 *Confluence*\n• ${m30Str}\n• ${m5Str}\n• ${cciStr}\n• ${envStr}\n• Fib Levels: ${fibLabel}\n━━━━━━━━━━━━━━━━━━━━\n⏰ Time (UTC): ${timeFormatted}\n\n💡 To close manually: send \`/close win\` or \`/close loss\` in this chat`;

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
