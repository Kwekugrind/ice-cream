import WebSocket from "ws";
import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

// ==================== REPOSITORY CONFIGURATION ====================
// UNCOMMENT ONLY THE ONE BOT YOU ARE DEPLOYING IN THIS FOLDER:

// --- Server 2 Bots ---
// const SYMBOL = "R_10"; const SYMBOL_NAME = "Volatility 10 Index"; const REPO_LABEL = "Test Bot (V10 Live)"; const MULTIPLIER = 400; const COMMISSION_USD = 0.16;
// const SYMBOL = "R_50"; const SYMBOL_NAME = "Volatility 50 Index"; const REPO_LABEL = "OmniSight (V50)"; const MULTIPLIER = 80; const COMMISSION_USD = 0.16;
const SYMBOL = "1HZ100V"; const SYMBOL_NAME = "Volatility 100 (1s) Index"; const REPO_LABEL = "Ice Cream Machine"; const MULTIPLIER = 40; const COMMISSION_USD = 0.15;

// --- Server 1 Bots ---
// const SYMBOL = "R_75"; const SYMBOL_NAME = "Volatility 75 Index"; const REPO_LABEL = "Lery's Alerts (V75 Demo)"; const MULTIPLIER = 50; const COMMISSION_USD = 0.15;
// const SYMBOL = "1HZ75V"; const SYMBOL_NAME = "Volatility 75 (1s) Index"; const REPO_LABEL = "Coffee (V75-1s Demo)"; const MULTIPLIER = 50; const COMMISSION_USD = 0.15;
// const SYMBOL = "R_100"; const SYMBOL_NAME = "Volatility 100 Index"; const REPO_LABEL = "Milk (V100 Demo)"; const MULTIPLIER = 40; const COMMISSION_USD = 0.15;
// const SYMBOL = "R_25"; const SYMBOL_NAME = "Volatility 25 Index"; const REPO_LABEL = "Tea (V25 Demo)"; const MULTIPLIER = 160; const COMMISSION_USD = 0.15;
// ==================================================================

const TRADING_SYMBOL = SYMBOL;
const STAKE_USD = 5;
const SOFTWARE_SL_USD = -3.60;
const SERVER_TP_USD = 10.00;
const CATASTROPHIC_PNL_FLOOR = -5.50;
const MARKET_DATA_APP_ID = "1089";
const TARGET_MIN_PROFIT = 5.00;

const FIB_TOLERANCE = 0.005; 
const STOCH_MIDLINE_FALLBACK_SYMBOLS = ["R_50", "R_10"];

const GATEWAY_URL = process.env.GATEWAY_URL || "http://127.0.0.1:3000";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;

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
    parameters: { contract_type: expectedContractType, underlying_symbol: TRADING_SYMBOL, currency: "USD", amount: STAKE_USD, basis: "stake", multiplier: MULTIPLIER, limit_order: { stop_loss: slDollars, take_profit: SERVER_TP_USD } }
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
  const data = await gatewayFetch("/profit_table", "POST", { profit_table: 1, description: 1, limit: 25, sort: "DESC", date_from: approxOpenEpoch ? approxOpenEpoch - 300 : undefined });
  const match = (data.profit_table?.transactions || []).find(tx => String(tx.contract_id) === String(contractId));
  if (!match) return null;
  return { profit: typeof match.profit === "number" ? match.profit : (parseFloat(match.sell_price) - parseFloat(match.buy_price)), sellTime: match.sell_time };
}

// ==================== MARKET DATA FETCHERS (SLOW PATH) ====================
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
  return { k: slowK, d: slowD };
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
    return { bullish, fibM50: h + 0.5*rng, fib0: h, fib50: h - 0.5*rng, fib79: h - 0.79*rng, fib100: l, fib1618: h - 1.618*rng, dailyBiasPrice };
  } else {
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
  armed: null, confirm: null, dailyBiasPrice: null,
  nextPhase: null, h1TdiDir: null, fibBullish: null, fib0: null, fib50: null, fib618: null, fib79: null, fib100: null, cciAligned: false, stochAligned: false, envAligned: false
};
try {
  const s = JSON.parse(fs.readFileSync("state.json"));
  state = { ...state, ...s };
} catch {}

function saveState() { fs.writeFileSync("state.json", JSON.stringify(state, null, 2)); }
function loadTrades() { try { return JSON.parse(fs.readFileSync("trades.json")); } catch { return []; } }
function saveTrades(t) { fs.writeFileSync("trades.json", JSON.stringify(t, null, 2)); }

// ==================== CORE DUAL-SPEED ARCHITECTURE ====================

const closingContracts = new Set();
let isProcessingSlowPath = false;

// ── FAST PATH: Instant SL/TP Checks (~1 Second) ──
async function handleFastPathRisk(currentPrice) {
  let trades = loadTrades();
  let openTrades = trades.filter(t => !t.result && !t.pending);
  if (openTrades.length === 0) return;

  for (const openTrade of openTrades) {
    if (!openTrade.contractId || closingContracts.has(openTrade.contractId)) continue;
    
    const isBuy = openTrade.direction === "BUY";
    const pnl = calcUnrealizedPnL(openTrade, currentPrice);
    const hardStopPrice = deriveHardStopPrice(openTrade.entry, openTrade.direction);
    const activeSl = openTrade.sl || hardStopPrice;

    const slBreached = isBuy ? currentPrice <= activeSl : currentPrice >= activeSl;
    let tpHit = false;
    if (openTrade.fibTpPrice) {
      tpHit = isBuy ? currentPrice >= openTrade.fibTpPrice : currentPrice <= openTrade.fibTpPrice;
    }

    let reason = null, expectedResult = "LOSS";
    if (slBreached) { reason = `SL breached in real-time at ${currentPrice.toFixed(4)}`; } 
    else if (pnl <= CATASTROPHIC_PNL_FLOOR) { reason = `Catastrophic floor hit — PnL $${pnl.toFixed(2)}`; } 
    else if (pnl <= SOFTWARE_SL_USD) { reason = `Software SL hit — PnL $${pnl.toFixed(2)}`; } 
    else if (tpHit) { reason = `Fib TP reached at ${currentPrice.toFixed(4)}`; expectedResult = "WIN"; }

    if (reason) {
      closingContracts.add(openTrade.contractId);
      console.log(`[FAST PATH] Triggering close for ${openTrade.contractId}: ${reason}`);
      let serverPnl = pnl, resultSource = "estimated_fallback";
      
      try {
        const closeRes = await closeContract(openTrade.contractId);
        if (closeRes && !closeRes.error) {
          serverPnl = closeRes.sell?.profit ?? pnl;
          resultSource = "server_close_confirmed";
        }
      } catch (e) {
        console.error("Fast Path close exception:", e.message);
        closingContracts.delete(openTrade.contractId);
        continue;
      }

      const finalResult = serverPnl >= 0 ? "WIN" : "LOSS";
      openTrade.result = finalResult;
      openTrade.resultSource = resultSource;
      openTrade.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
      openTrade.serverPnl = serverPnl;
      
      saveTrades(trades);
      closingContracts.delete(openTrade.contractId);
      
      const icon = finalResult === "WIN" ? "✅" : "❌";
      const pnlStr = serverPnl >= 0 ? `+$${serverPnl.toFixed(2)}` : `-$${Math.abs(serverPnl).toFixed(2)}`;
      const durationMs = new Date(openTrade.closeTime) - new Date(openTrade.openTime);
      await sendTelegram(`${icon} *${REPO_LABEL} — Trade ${finalResult}*\n\nDirection: ${openTrade.direction}\n📍 Entry: ${Number(openTrade.entry).toFixed(4)}\n🏁 Exit: ${currentPrice.toFixed(4)}\n\n💵 P&L: *${pnlStr}* (Net of comm.)\nReason: ${reason}\nDuration: ${formatDuration(durationMs)}\nContract: \`${openTrade.contractId}\``);
    }
  }
}

// ── SLOW PATH: Core Strategy Engine (Runs every 5 mins on closed candles) ──
async function runSlowPathScan(m5BoundaryEpoch) {
  console.log(`[${REPO_LABEL}] Slow Path triggered for closed M5 candle: ${new Date(m5BoundaryEpoch * 1000).toISOString()}`);
  let trades = loadTrades();
  
  // 1. Gateway Portfolio Sync 
  try {
    const allPortfolio = await getOpenPortfolio();
    const liveContracts = allPortfolio.filter(c => getContractSymbol(c) === TRADING_SYMBOL);
    
    for (const live of liveContracts) {
      if (!trades.find(t => String(t.contractId) === String(live.contract_id))) {
        const entryPrice = live.buy_price ? parseFloat(live.buy_price) : await (await fetchAllData()).m5.slice(-1)[0].close; 
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
          await sendTelegram(`${t.result === "WIN" ? "✅" : "❌"} *${REPO_LABEL} — Trade ${t.result} (Broker Native Exit)*\n\n💵 P&L: *${rec.profit >= 0 ? `+$${rec.profit.toFixed(2)}` : `-$${Math.abs(rec.profit).toFixed(2)}`}*`);
        }
      }
    }
    saveTrades(trades);
  } catch (e) { dbg("Portfolio sync skipped:", e.message); }

  // 2. Fetch Historical Data 
  let scanData;
  try { scanData = await fetchAllData(); } catch (e) { console.warn(`Fetch error: ${e.message}`); return; }
  const candles = scanData.m5, m15Candles = scanData.m15, m30Candles = scanData.m30, d1Candles = scanData.d1;

  if (!candles || candles.length < 120 || !m15Candles || !m30Candles || !d1Candles) return;
  const si = candles.length - 2; 
  const currentPrice = parseFloat(candles[si].close);

  // 3. Manage M15/M30 Structure Upgrades
  const openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;
    
    if (!t.m30FractalUpgraded && m15Candles.length >= 5) {
      for (let k = 2; k <= m15Candles.length - 4; k++) {
        if (m15Candles[k + 2].epoch + M15 > t.entryEpoch) {
          const c = m15Candles;
          if (t.direction === "BUY") {
            const isBottom = parseFloat(c[k].low) === Math.min(parseFloat(c[k-2].low), parseFloat(c[k-1].low), parseFloat(c[k].low), parseFloat(c[k+1].low), parseFloat(c[k+2].low));
            const frac = parseFloat(c[k].low);
            if (isBottom && frac > t.sl && frac < t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Bottom: ${frac.toFixed(4)}`); break; }
          } else if (t.direction === "SELL") {
            const isTop = parseFloat(c[k].high) === Math.max(parseFloat(c[k-2].high), parseFloat(c[k-1].high), parseFloat(c[k].high), parseFloat(c[k+1].high), parseFloat(c[k+2].high));
            const frac = parseFloat(c[k].high);
            if (isTop && frac < t.sl && frac > t.entry) { t.m30FractalUpgraded = true; t.sl = frac; t.fractalTimeframe = "M15"; saveTrades(trades); await sendTelegram(`🔎 *${REPO_LABEL}* — SL Upgraded to M15 Top: ${frac.toFixed(4)}`); break; }
          }
        }
      }
    }

    if (m30Candles.length >= 4) {
      let structOpenPrice = null;
      for (let k = m30Candles.length - 3; k >= 0; k--) {
        if (m30Candles[k].epoch + M30 <= t.entryEpoch) break;
        const o = parseFloat(m30Candles[k].open), c = parseFloat(m30Candles[k].close);
        if (t.direction === "BUY" && c > o) { structOpenPrice = o; break; }
        else if (t.direction === "SELL" && c < o) { structOpenPrice = o; break; }
      }
      if (structOpenPrice !== null) {
        const lastM30Close = parseFloat(m30Candles[m30Candles.length - 2].close);
        if ((t.direction === "BUY" && lastM30Close < structOpenPrice) || (t.direction === "SELL" && lastM30Close > structOpenPrice)) {
           await handleFastPathRisk(t.direction === "BUY" ? structOpenPrice - 0.0001 : structOpenPrice + 0.0001); 
        }
      }
    }
  }

  // Pre-Scan Guard
  if (openTrades.length > 0) {
    state.lastProcessedEpoch = m5BoundaryEpoch; saveState(); return;
  }

  // 4. Calculate Indicators (ORIGINAL LOGIC)
  const fib = computeDailyFibLevels(d1Candles);
  if (!fib) return;

  const newBiasPrice = parseFloat(fib.dailyBiasPrice.toFixed(4));
  if (state.dailyBiasPrice !== null && state.dailyBiasPrice !== newBiasPrice) {
    state.armed = null; state.confirm = null;
  }
  state.dailyBiasPrice = newBiasPrice;

  state.fibBullish = fib.bullish; state.fib0 = parseFloat(fib.fib0.toFixed(4)); state.fib50 = parseFloat(fib.fib50.toFixed(4));
  state.fib618 = parseFloat(fib.fib1618?.toFixed(4) || 0); state.fib79 = parseFloat(fib.fib79.toFixed(4)); state.fib100 = parseFloat(fib.fib100.toFixed(4));
  state.h1TdiDir = fib.bullish ? "BULL" : "BEAR";

  const maxH = Math.max(...candles.slice(-12).map(x => parseFloat(x.high)));
  const minL = Math.min(...candles.slice(-12).map(x => parseFloat(x.low)));
  const m15Close = parseFloat(m15Candles[m15Candles.length - 2].close);
  const m30Close = parseFloat(m30Candles[m30Candles.length - 2].close);

  const cci = calculateCCI(candles, 100);
  const env = calculateEnvelopes(candles, 50, 0.05);
  const stoch = calculateStoch(candles, 18, 12, 25);
  const m30St = calculateStoch(m30Candles, 18, 12, 25);

  const cVal = cci[si], prevCci = cci[si - 1];
  const eUp = env.upper[si], eLo = env.lower[si];
  const sK = stoch.k[si], sD = stoch.d[si], prevK = stoch.k[si - 1], prevD = stoch.d[si - 1];
  const m30K = m30St.k[m30Candles.length - 2], m30D = m30St.d[m30Candles.length - 2];

  if (cVal === null || prevCci === null || eUp === null || eLo === null || sK === null || sD === null || prevK === null || prevD === null || m30K === null) return;

  // 5. Daily Ledger Log
  writeToLedger(m5BoundaryEpoch, currentPrice, cVal, sK, sD, eUp, eLo, state.armed ? state.armed.lbl : "IDLE");

  // ── A. FIB ARMING STATE MACHINE ──
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

  if (newArm && (!state.armed || state.armed.lbl !== newArm.lbl)) {
    state.armed = newArm;
    state.confirm = { label: newArm.lbl, cci: { aligned: false }, stoch: { aligned: false }, env: { aligned: false } };
  }
  state.nextPhase = state.armed ? state.armed.lbl : null;

  // ── B/C/D. INDEPENDENT INDICATOR CONFIRMATION ──
  if (state.armed && state.confirm) {
    const { type, dir } = state.armed;

    if (dir === "BUY") {
      const freshAlign = type === "CONT" ? (prevCci <= 70.5 && cVal > 70.5) : (prevCci <= -70.5 && cVal > -70.5);
      if (freshAlign) state.confirm.cci.aligned = true;
      else if (state.confirm.cci.aligned) {
        if (type === "CONT" && cVal <= 70.5) state.confirm.cci.aligned = false;
        if (type === "REV"  && cVal <= -70.5) state.confirm.cci.aligned = false;
      }
    } else { 
      const freshAlign = type === "CONT" ? (prevCci >= -70.5 && cVal < -70.5) : (prevCci >= 70.5 && cVal < 70.5);
      if (freshAlign) state.confirm.cci.aligned = true;
      else if (state.confirm.cci.aligned) {
        if (type === "CONT" && cVal >= -70.5) state.confirm.cci.aligned = false;
        if (type === "REV"  && cVal >= 70.5) state.confirm.cci.aligned = false;
      }
    }

    const crossUp         = prevK <= prevD && sK > sD;
    const crossDown       = prevK >= prevD && sK < sD;
    const crossedAbove50  = prevK < 50 && sK >= 50;
    const crossedBelow50  = prevK > 50 && sK <= 50;
    const midlineFallback = STOCH_MIDLINE_FALLBACK_SYMBOLS.includes(SYMBOL);

    if (dir === "BUY") {
      let freshAlign;
      if (type === "REV") {
        freshAlign = (crossUp && sK <= 20) || (midlineFallback && crossUp && crossedAbove50);
      } else {
        freshAlign = crossUp && sK >= 50;
      }
      if (freshAlign) state.confirm.stoch.aligned = true;
      else if (state.confirm.stoch.aligned && crossDown) state.confirm.stoch.aligned = false;
    } else { 
      let freshAlign;
      if (type === "REV") {
        freshAlign = (crossDown && sK >= 80) || (midlineFallback && crossDown && crossedBelow50);
      } else {
        freshAlign = crossDown && sK <= 50;
      }
      if (freshAlign) state.confirm.stoch.aligned = true;
      else if (state.confirm.stoch.aligned && crossUp) state.confirm.stoch.aligned = false;
    }

    if (dir === "BUY") {
      if (currentPrice > eUp) state.confirm.env.aligned = true;
      else if (state.confirm.env.aligned && currentPrice <= eUp) state.confirm.env.aligned = false;
    } else {
      if (currentPrice < eLo) state.confirm.env.aligned = true;
      else if (state.confirm.env.aligned && currentPrice >= eLo) state.confirm.env.aligned = false;
    }
  }

  state.cciAligned   = state.confirm ? state.confirm.cci.aligned   : false;
  state.stochAligned = state.confirm ? state.confirm.stoch.aligned : false;
  state.envAligned   = state.confirm ? state.confirm.env.aligned   : false;

  // ── 6. TRIGGER LOGIC ──
  let signalTriggered = false, direction = "", fibTpPrice = null, entryType = null;

  if (state.armed && state.confirm &&
      state.confirm.cci.aligned && state.confirm.stoch.aligned && state.confirm.env.aligned) {
    signalTriggered = true;
    direction   = state.armed.dir;
    entryType   = state.armed.lbl;
    fibTpPrice  = state.armed.tp;
    state.armed   = null; 
    state.confirm = null;
  }

  // ── 7. EXECUTE & TP OVERRIDE ──
  if (signalTriggered) {
    const entry = currentPrice;

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

    const m30Str = `M30 Stoch (info): %K ${m30K.toFixed(1)} | %D ${m30D.toFixed(1)}`;
    const m5Str  = `M5 Stoch: %K ${sK.toFixed(1)} | %D ${sD.toFixed(1)}`;
    const cciStr = `M5 CCI(100): ${cVal.toFixed(1)}`;
    const envStr = `M5 Env: Close ${currentPrice.toFixed(4)} | Upper ${eUp.toFixed(4)} | Lower ${eLo.toFixed(4)}`;

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, rr: null, entryType, brokerSlAmount: STAKE_USD,
      entryEpoch: m5BoundaryEpoch, fractalSl: initialFractal, fractalEpoch: null, fractalTimeframe: initialFractal ? "M5" : null, m30FractalUpgraded: false, fibTpPrice,
      openTime: new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19), closeTime: null, result: null
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
      await sendTelegram(`🚨 *${SYMBOL_NAME.toUpperCase()} SIGNAL* 🚨\n\nDirection: *${direction}*\nSetup: ${escapeMarkdown(entryType)}\n📍 Entry: ${entry.toFixed(4)}\n🛑 SL: ${sl.toFixed(4)} (${initialFractal ? "M5 Fractal" : "Hard Stop"})\n🎯 Fib TP: *${fibTpPrice.toFixed(4)}*\n\n📐 *Confluence*\n• ${m30Str}\n• ${m5Str}\n• ${cciStr}\n• ${envStr}`);
    } catch (execErr) {
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1); saveTrades(trades);
      await sendTelegram(`❌ *${REPO_LABEL}* — Live execution failed: ${execErr.message}`);
    }
  }

  state.lastProcessedEpoch = m5BoundaryEpoch; saveState();
}

// ==================== LIVE STREAM WATCHER ====================
let liveWs = null;
let firstTickReceived = false;

function startLiveStream() {
  console.log(`[${REPO_LABEL}] Starting Live 24/7 Tick Stream via Deriv WebSocket...`);
  liveWs = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${MARKET_DATA_APP_ID}`);
  let pingInterval;

  liveWs.on("open", () => {
    // Patched to use ticks_history for Synthetic compatibility
    liveWs.send(JSON.stringify({ ticks_history: SYMBOL, end: "latest", count: 1, style: "ticks", subscribe: 1 }));
    pingInterval = setInterval(() => { if (liveWs.readyState === WebSocket.OPEN) liveWs.send(JSON.stringify({ ping: 1 })); }, 25000);
  });

  liveWs.on("message", async (d) => {
    const data = JSON.parse(d);
    if (data.error) { console.error("WS Error:", data.error.message); return; }
    
    if (data.tick) {
      if (!firstTickReceived) {
        console.log(`[${REPO_LABEL}] ✅ Live stream connected and receiving ticks successfully.`);
        firstTickReceived = true;
      }

      const tick = data.tick;
      
      // Fast Path: Check SL/TP instantly on every tick
      handleFastPathRisk(tick.quote).catch(console.error);

      // Slow Path: Check strategy only when M5 boundary crosses
      const currentM5Boundary = tick.epoch - (tick.epoch % 300);
      const lastProcessed = state.lastProcessedEpoch || 0;
      
      if (currentM5Boundary > lastProcessed && !isProcessingSlowPath) {
        isProcessingSlowPath = true;
        // Wait 2 seconds for Deriv backend to finalize historical candle
        setTimeout(async () => {
          try { await runSlowPathScan(currentM5Boundary); } 
          catch (e) { console.error("Slow path scan failed:", e); } 
          finally { isProcessingSlowPath = false; }
        }, 2000);
      }
    }
  });

  liveWs.on("close", () => {
    clearInterval(pingInterval);
    firstTickReceived = false;
    console.warn(`[${REPO_LABEL}] Live stream disconnected. Reconnecting in 5s...`);
    setTimeout(startLiveStream, 5000);
  });
  
  liveWs.on("error", (err) => {
    console.error("Live stream error:", err.message);
    liveWs.close(); 
  });
}

// ==================== EXECUTION HOOK ====================
(async () => {
  // Telegram background watcher (Polling every 15s instead of blocking main thread)
  setInterval(async () => {
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
  }, 15000);

  // Manual command fallbacks
  if (MODE === "daily")                                 { await runSummary("Daily");  return; }
  if (MODE === "weekly")                                { await runSummary("Weekly"); return; }
  
  // Start the 24/7 Engine
  startLiveStream();
})();
