
// ==================== UNIVERSAL M5 BILL WILLIAMS FRACTAL DETECTION ====================
// Scans backwards from si - 2 to find the most recent completed 5-bar Bill Williams fractal pivot

// ==================== FRACTAL DETECTION BY SPECIFIC TYPE ====================
// Scans backwards from si - 2 to find the most recent completed 5-bar Bill Williams fractal pivot of targetType ('UP' or 'DOWN')
export function getMostRecentM5FractalByType(candles, currentIndex, targetType) {
  if (!candles || currentIndex < 4) return null;
  for (let k = currentIndex - 2; k >= 2; k--) {
    const high = parseFloat(candles[k].high);
    const low = parseFloat(candles[k].low);
    const isUp = high > parseFloat(candles[k - 1].high) &&
                 high > parseFloat(candles[k - 2].high) &&
                 high > parseFloat(candles[k + 1].high) &&
                 high > parseFloat(candles[k + 2].high);
    const isDown = low < parseFloat(candles[k - 1].low) &&
                   low < parseFloat(candles[k - 2].low) &&
                   low < parseFloat(candles[k + 1].low) &&
                   low < parseFloat(candles[k + 2].low);

    if (targetType === 'UP' && isUp) {
      return {
        type: 'UP',
        pivotIndex: k,
        pivotEpoch: candles[k].epoch,
        epoch: candles[k].epoch,
        price: high,
        high,
        low,
        close: parseFloat(candles[k].close),
        open: parseFloat(candles[k].open)
      };
    }
    if (targetType === 'DOWN' && isDown) {
      return {
        type: 'DOWN',
        pivotIndex: k,
        pivotEpoch: candles[k].epoch,
        epoch: candles[k].epoch,
        price: low,
        high,
        low,
        close: parseFloat(candles[k].close),
        open: parseFloat(candles[k].open)
      };
    }
  }
  return null;
}

export function getMostRecentM5Fractal(candles, currentIndex) {
  for (let k = currentIndex - 2; k >= 2; k--) {
    const high = parseFloat(candles[k].high);
    const low = parseFloat(candles[k].low);
    const isUp = high > parseFloat(candles[k - 1].high) &&
                 high > parseFloat(candles[k - 2].high) &&
                 high > parseFloat(candles[k + 1].high) &&
                 high > parseFloat(candles[k + 2].high);
    const isDown = low < parseFloat(candles[k - 1].low) &&
                   low < parseFloat(candles[k - 2].low) &&
                   low < parseFloat(candles[k + 1].low) &&
                   low < parseFloat(candles[k + 2].low);

    if (isUp && !isDown) {
      return { type: 'UP', pivotIndex: k, pivotEpoch: candles[k].epoch, price: high };
    }
    if (isDown && !isUp) {
      return { type: 'DOWN', pivotIndex: k, pivotEpoch: candles[k].epoch, price: low };
    }
    if (isUp && isDown) {
      const cOpen = parseFloat(candles[k].open);
      const cClose = parseFloat(candles[k].close);
      return { type: cClose >= cOpen ? 'DOWN' : 'UP', pivotIndex: k, pivotEpoch: candles[k].epoch, price: cClose >= cOpen ? low : high };
    }
  }
  return null;
}

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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",         // Initial Entry: Stoch 100 Level 50 cross + M5 close beyond Fractal High/Low
    initialBreakoutType: "HIGH_LOW",          // Initial Entry: M5 close > High of UP fractal (BUY) / < Low of DOWN fractal (SELL)
    initialTriggerExec: "CLOSE",              // Initial Entry: M5 candle CLOSE
    entryBreakoutType: "HIGH_LOW",            // Re-Entry: M5 close > High of UP fractal (BUY) / < Low of DOWN fractal (SELL)
    slReferenceType: "FRACTAL_BODY_ANCHOR",   // BUY: Open if Bullish candle / Close if Bearish candle; SELL: Close if Bullish candle / Open if Bearish candle
    slExecutionType: "CLOSE",                 // Software SL executed strictly on confirmed M5 candle CLOSE
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 10.00,                     // Fallback TP ($10.00 / 1,000 pts @ 0.01 lots)
    dailyTargetLockEnabled: false,
    minTakeProfitPoints: 500.0,
    minTakeProfitUsd: 5.00,
    softwareSlUsd: null,
    trailActivationUsd: 5.00,
    trailBufferUsd: 2.00,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High / < Low Fractal; Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
  },
  "1HZ75V": {
    symbol: "1HZ75V",
    symbolName: "Volatility 75 (1s) Index",
    repoLabel: "Coffee (V75-1s Demo)",
    server: "S1",
    multiplier: 100,
    lotSize: 0.15,
    stakeUsd: 5.0,
    commissionUsd: 0.15,
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 23.33,
    minTakeProfitUsd: 3.50,
    softwareSlUsd: null,
    trailActivationUsd: 4.50,
    trailBufferUsd: 2.00,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 3.00,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 5.00,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 3.00,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 2.20,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 600.0,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 5.00,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: false,
    minTakeProfitPoints: 6.00,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 4.50,
    trailBufferUsd: 1.50,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 0.75,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 4.50,
    trailBufferUsd: 1.50,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
    strategyProfile: "PROFILE_UNIVERSAL_STOCH100_STOCH8",
    gateType: "STOCH100_STOCH8",
    stoch100Params: { k: 100, d: 1, slowing: 1, method: "Simple", level: 50 },
    stoch8Params: { k: 8, d: 1, slowing: 1, method: "Simple", levels: [10, 50, 90] },
    initialGateMode: "STOCH100_ONLY",
    initialBreakoutType: "HIGH_LOW",
    initialTriggerExec: "CLOSE",
    entryBreakoutType: "HIGH_LOW",
    slReferenceType: "FRACTAL_BODY_ANCHOR",
    slExecutionType: "CLOSE",
    profitManagementMode: "SUPERTREND_DIRECTION_FLIP", // Supertrend (21, 1, 0) direction flip exit when in profit
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,                   // Trades managed by Supertrend (21, 1, 0) direction flip
    takeProfitUsd: 7.00,
    dailyTargetLockEnabled: true,
    minTakeProfitPoints: 6.00,
    minTakeProfitUsd: 3.00,
    softwareSlUsd: null,
    trailActivationUsd: 4.50,
    maxHardStopPoints: null,
    slType: "FRACTAL_BODY_ANCHOR_CLOSE",
    notes: "Unified Fleet Rule: Initial on Stoch 100 Level 50 cross + M5 close > High Fractal (BUY) / < Low Fractal (SELL); Re-Entry after Initial Trade on Stoch 8 <= 10 / >= 90 + M5 close > High / < Low Fractal; Software SL on Fractal Candle Open/Close on M5 CLOSE; Broker Hard SL placed behind Software SL; Profit Management: Supertrend (Periods: 21, Multiplier: 1, Shift: 0) direction flip exit when trade is in profit."
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
  "1HZ75V": 0.15,
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
  "R_25": -2.50,     // Tea Machine (V25, 400x) — Calibrated Software SL -$2.50
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
const TARGET_MIN_PROFIT = PROFILE.takeProfitUsd || PROFILE.minTakeProfitUsd || 3.50;
const INITIAL_GATE_MODE = PROFILE.initialGateMode || "STOCH100_ONLY";
const INITIAL_BREAKOUT_TYPE = PROFILE.initialBreakoutType || PROFILE.entryBreakoutType || "HIGH_LOW";
const INITIAL_TRIGGER_EXEC = PROFILE.initialTriggerExec || "CLOSE";
const ENTRY_BREAKOUT_TYPE = PROFILE.entryBreakoutType || "HIGH_LOW";
const SL_REFERENCE_TYPE = PROFILE.slReferenceType || "FRACTAL_BODY_ANCHOR";
const SL_EXECUTION_TYPE = PROFILE.slExecutionType || "CLOSE";
const STOCH8_EARLY_EXIT_ENABLED = false; // Superseded by Supertrend (21, 1, 0) direction flip exit
const DAILY_TARGET_LOCK_ENABLED = PROFILE.dailyTargetLockEnabled !== undefined ? Boolean(PROFILE.dailyTargetLockEnabled) : true;

export function getFractalBreakoutTarget(fractal, direction, breakoutTypeOverride = null) {
  if (!fractal) return null;
  const bType = breakoutTypeOverride || ENTRY_BREAKOUT_TYPE;
  if (bType === "HIGH_LOW") {
    return direction === "BUY" ? fractal.high : fractal.low;
  }
  if (bType === "BODY_EXTREME") {
    return direction === "BUY" ? Math.max(fractal.open, fractal.close) : Math.min(fractal.open, fractal.close);
  }
  if (bType === "OPEN") {
    return fractal.open;
  }
  return fractal.close;
}

export function getFractalBreakoutLabel(fractal, direction, breakoutTypeOverride = null, triggerExecOverride = "CLOSE") {
  const bType = breakoutTypeOverride || ENTRY_BREAKOUT_TYPE;
  const execType = triggerExecOverride || "CLOSE";
  const verb = execType === "TOUCH" ? "touch" : "close";
  if (!fractal) {
    return `${direction === "BUY" ? `${verb} > High Fractal` : `${verb} < Low Fractal`}`;
  }
  const target = getFractalBreakoutTarget(fractal, direction, bType);
  const op = direction === "BUY" ? (execType === "TOUCH" ? ">=" : ">") : (execType === "TOUCH" ? "<=" : "<");
  const refName = bType === "HIGH_LOW"
    ? (direction === "BUY" ? "Fractal High" : "Fractal Low")
    : (bType === "BODY_EXTREME"
        ? "Fractal Body Extreme"
        : (bType === "OPEN" ? "Fractal Open" : "Fractal Close"));
  return `${verb} ${op} ${target.toFixed(2)} (${refName})`;
}

// =========================================================================
// UNIFIED FRACTAL CANDLE OPEN/CLOSE STOP LOSS RULE (ALL 7 BOTS)
// 1. For BUY trades:
//    - If the M5 fractal candle considered for the trade is BULLISH (close >= open), use OPEN price of that fractal candle as SL.
//    - If the M5 fractal candle considered for the trade is BEARISH (close < open), use CLOSE price of that fractal candle as SL.
// 2. For SELL trades:
//    - If the M5 fractal candle considered for the trade is BULLISH (close >= open), use CLOSE price of that fractal candle as SL.
//    - If the M5 fractal candle considered for the trade is BEARISH (close < open), use OPEN price of that fractal candle as SL.
// Precedence: Takes strict precedence over Hard SL.
// =========================================================================
export function deriveCalibratedStopLossPrice(entryPrice, direction, entryCandle, fractal) {
  const isBuy = direction === "BUY";
  const cLow = entryCandle ? parseFloat(entryCandle.low) : entryPrice;
  const cHigh = entryCandle ? parseFloat(entryCandle.high) : entryPrice;
  let candidateSl = null;

  if (fractal && typeof fractal.open === "number" && typeof fractal.close === "number") {
    const isFractalBullish = fractal.close >= fractal.open;
    if (isBuy) {
      // Scenario 1: BUY Trade
      // 1A (Bullish Fractal Candle): SL = Open price (bottom of body)
      // 1B (Bearish Fractal Candle): SL = Close price (bottom of body)
      candidateSl = isFractalBullish ? fractal.open : fractal.close;
    } else {
      // Scenario 2: SELL Trade
      // 2A (Bullish Fractal Candle): SL = Close price (top of body)
      // 2B (Bearish Fractal Candle): SL = Open price (top of body)
      candidateSl = isFractalBullish ? fractal.close : fractal.open;
    }
  } else {
    candidateSl = isBuy ? cLow : cHigh;
  }

  // Final strict broker physics guard: BUY SL must be < entryPrice, SELL SL must be > entryPrice
  const minPts = 0.25 / CTRADER_LOT_SIZE;
  if (isBuy && (candidateSl === null || isNaN(candidateSl) || candidateSl >= entryPrice)) {
    candidateSl = Math.min(cLow < entryPrice ? cLow : entryPrice - minPts, entryPrice - minPts);
  } else if (!isBuy && (candidateSl === null || isNaN(candidateSl) || candidateSl <= entryPrice)) {
    candidateSl = Math.max(cHigh > entryPrice ? cHigh : entryPrice + minPts, entryPrice + minPts);
  }
  return parseFloat(candidateSl.toFixed(4));
}

// Legacy trailing constants removed; profit management governed strictly by Supertrend (21, 1, 0) direction flip

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
  const initDesc = INITIAL_GATE_MODE === "STOCH100_ONLY"
    ? `Stoch 100 Cross + Fractal ${INITIAL_BREAKOUT_TYPE} (${INITIAL_TRIGGER_EXEC})`
    : (INITIAL_GATE_MODE === "STOCH8_POST_2C"
        ? `Stoch 100 + Stoch 8 (0..+2c) + Fractal ${INITIAL_BREAKOUT_TYPE} (CLOSE)`
        : `Stoch 100 + Stoch 8 (±2c) + Fractal ${INITIAL_BREAKOUT_TYPE} (CLOSE)`);
  return `Initial: ${initDesc} | Re-Entry: Stoch 8 (10/90) + Fractal ${ENTRY_BREAKOUT_TYPE} (CLOSE) | SL: ${SL_REFERENCE_TYPE} (${SL_EXECUTION_TYPE}) | Profit: Supertrend (21, 1, 0) Direction Flip`;
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
      // Software SL is evaluated strictly on M5 candle CLOSE in software.
      // Broker SL order sent to cTrader is purely catastrophic Hard SL placed behind Software SL.
      // Take Profit is placed at Dynamic Fractal Range TP on cTrader ticket, and also monitored in fast-path and trailing with Supertrend.
      const brokerSlPrice = orderContext.brokerSlPrice || orderContext.brokerHardSlPrice || null;
      const targetTpPrice = orderContext.tpPrice || orderContext.fibTpPrice || null;
      const payload = {
        symbol: SYMBOL_NAME || SYMBOL,
        side: direction,
        lots: CTRADER_LOT_SIZE,
        slPrice: brokerSlPrice,
        tpPrice: targetTpPrice,
        slUsd: brokerSlPrice ? null : 10.00,
        tpUsd: null,
        comment: `${REPO_LABEL} cTrader`
      };
      console.log(`[CTRADER ORDER] Sending ${direction} order: ${CTRADER_LOT_SIZE} lots on ${SYMBOL_NAME || SYMBOL} (Broker Hard SL: ${payload.slPrice || payload.slUsd}, Fractal Range TP: ${payload.tpPrice || 'None'})`);
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
      limit_order: { stop_loss: slDollars } // Dynamic Supertrend Profit Exit: no broker TP cap 
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
      const fromMs = approxOpenEpoch ? (approxOpenEpoch * 1000 - 120000) : (Date.now() - 24 * 60 * 60 * 1000);
      const res = await gatewayFetch(`/ctrader/deals?positionId=${encodeURIComponent(contractId)}&from=${fromMs}&to=${Date.now()}`);
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

// =========================================================================
// 🎯 SUPERTREND (Periods: 21, Multiplier: 1.0, Shift: 0) PROFIT MANAGEMENT
// cTrader / TradingView Standard Wilder's ATR Supertrend Formulation
// =========================================================================
export function calculateSupertrend(candles, period = 21, multiplier = 1.0) {
  if (!candles || candles.length < period) return [];
  const len = candles.length;

  const tr = new Array(len);
  tr[0] = parseFloat(candles[0].high) - parseFloat(candles[0].low);
  for (let i = 1; i < len; i++) {
    const high = parseFloat(candles[i].high);
    const low = parseFloat(candles[i].low);
    const prevClose = parseFloat(candles[i - 1].close);
    const hl = high - low;
    const hcp = Math.abs(high - prevClose);
    const lcp = Math.abs(low - prevClose);
    tr[i] = Math.max(hl, hcp, lcp);
  }

  const atr = new Array(len).fill(0);
  let sumTr = 0;
  for (let i = 0; i < period; i++) sumTr += tr[i];
  atr[period - 1] = sumTr / period;
  for (let i = period; i < len; i++) {
    atr[i] = ((period - 1) * atr[i - 1] + tr[i]) / period;
  }

  const basicUpper = new Array(len).fill(0);
  const basicLower = new Array(len).fill(0);
  const finalUpper = new Array(len).fill(0);
  const finalLower = new Array(len).fill(0);
  const trend = new Array(len).fill(1); // 1 = UP/Bullish (green), -1 = DOWN/Bearish (red)
  const supertrend = new Array(len).fill(0);

  for (let i = period - 1; i < len; i++) {
    const high = parseFloat(candles[i].high);
    const low = parseFloat(candles[i].low);
    const close = parseFloat(candles[i].close);
    const hl2 = (high + low) / 2.0;
    basicUpper[i] = hl2 + (multiplier * atr[i]);
    basicLower[i] = hl2 - (multiplier * atr[i]);

    if (i === period - 1) {
      finalUpper[i] = basicUpper[i];
      finalLower[i] = basicLower[i];
      trend[i] = close >= basicLower[i] ? 1 : -1;
      supertrend[i] = trend[i] === 1 ? finalLower[i] : finalUpper[i];
      continue;
    }

    const prevClose = parseFloat(candles[i - 1].close);

    // Final Upper Band: ratchets downward or resets on bullish close
    if (basicUpper[i] < finalUpper[i - 1] || prevClose > finalUpper[i - 1]) {
      finalUpper[i] = basicUpper[i];
    } else {
      finalUpper[i] = finalUpper[i - 1];
    }

    // Final Lower Band: ratchets upward or resets on bearish close
    if (basicLower[i] > finalLower[i - 1] || prevClose < finalLower[i - 1]) {
      finalLower[i] = basicLower[i];
    } else {
      finalLower[i] = finalLower[i - 1];
    }

    // Trend Direction Flip
    const prevTrend = trend[i - 1];
    if (prevTrend === 1 && close < finalLower[i - 1]) {
      trend[i] = -1; // Bearish flip
    } else if (prevTrend === -1 && close > finalUpper[i - 1]) {
      trend[i] = 1;  // Bullish flip
    } else {
      trend[i] = prevTrend;
    }

    supertrend[i] = trend[i] === 1 ? finalLower[i] : finalUpper[i];
  }

  return candles.map((c, idx) => ({
    epoch: c.epoch,
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    atr: atr[idx] ? parseFloat(atr[idx].toFixed(4)) : null,
    supertrend: supertrend[idx] ? parseFloat(supertrend[idx].toFixed(4)) : null,
    trend: trend[idx], // 1 = UP/Bullish (green), -1 = DOWN/Bearish (red)
    upperBand: finalUpper[idx] ? parseFloat(finalUpper[idx].toFixed(4)) : null,
    lowerBand: finalLower[idx] ? parseFloat(finalLower[idx].toFixed(4)) : null
  }));
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

function deriveHardStopPrice(entry, direction, lots = CTRADER_LOT_SIZE, softwareSlPrice = null) {
  const activeLots = (lots && lots > 0) ? lots : CTRADER_LOT_SIZE;
  const defaultHardLossUsd = 5.00;
  let hardLossUsd = defaultHardLossUsd;
  if (softwareSlPrice !== null && !isNaN(softwareSlPrice) && softwareSlPrice > 0) {
    const softDistUsd = Math.abs(entry - softwareSlPrice) * activeLots;
    // Software SL takes strict precedence: broker hard stop placed safely behind software SL
    hardLossUsd = Math.max(defaultHardLossUsd, softDistUsd + 2.00);
  }
  if (EXECUTION_MODE === "ctrader") {
    const priceMove = hardLossUsd / activeLots;
    return direction === "BUY" ? (entry - priceMove) : (entry + priceMove);
  }
  const requiredRawPnl = -hardLossUsd + COMMISSION_USD;
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
  "armedTouchSetup",
  "initialSellArmed",
  "initialBuyArmed",
  "stoch8_pulled_back_90",
  "stoch8_pulled_back_10",
  "stoch8_crossed_50_in_trend_SELL",
  "stoch8_crossed_50_in_trend_BUY",
  "lastUsedFractalEpochSell",
  "lastUsedFractalEpochBuy",
  "initialSellDone",
  "initialBuyDone",
  "stoch8CrossEpochSell",
  "stoch8CrossEpochBuy",
  "stoch100CrossEpochSell",
  "stoch100CrossEpochBuy",
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
  "v10_stoch50CrossEpochBuy", "v10_stoch50CrossEpochSell", "v10_stoch25CrossEpochBuy", "v10_stoch25CrossEpochSell",
  "v10_stoch25_pulled_back", "v10_stoch50", "v10_stoch25", "stoch50Val", "stoch2511Val", "stoch2511MaxVal", "stoch2511MinVal",
  "v25_1s_trendDir", "v25_1s_initialDone", "v25_1s_stoch200CrossEpoch",
  "v25_1s_stoch15ArmedBuy", "v25_1s_stoch15ArmedSell", "v25_1s_trend",
  "v25_1s_ema100", "v25_1s_stoch200", "v25_1s_stoch15", "v25_1s_emaAligned",
  "v25_stoch100CrossEpochBuy", "v25_stoch100CrossEpochSell",
  "v25_stoch30CrossEpochBuy", "v25_stoch30CrossEpochSell",
  "v25_stoch302515_touched_50_BUY", "v25_stoch302515_touched_50_SELL",
  "stoch100Val", "stoch8Val", "stoch8MaxVal", "stoch8MinVal", "v75_1s_stoch8_pulled_back_10", "v75_1s_stoch8_pulled_back_90", "stoch1511Val", "stoch1511MaxVal", "stoch1511MinVal", "v75_1s_stoch15_pulled_back_30", "v75_1s_stoch15_pulled_back_70", "stoch3025Val", "stoch3025Signal", "stoch302515Val", "stoch302515Signal",
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
            direction: dir, entry: entryPrice, sl: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), brokerSlPrice: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), rr: null, entryType: "RECOVERED_LIVE_FAST", brokerSlAmount: STAKE_USD,
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

    // Fast-path trade monitoring: Monitors Dynamic Fractal Range Take Profit, catastrophic broker hard stop, and daily profit target ceiling.
    // Supertrend (21, 1, 0) trailing profit exit is evaluated on confirmed M5 close in runSlowPathScan.

    // Intra-trade daily target ceiling disabled: Trades run unhindered to full Fractal Range TP or Supertrend flip exit
    const dailyTargetCeilingHit = false;

    // 🎯 Dynamic Fractal Range Take Profit Check (Fast-Path Hit):
    const activeTpTarget = openTrade.tpPrice || openTrade.fibTpPrice || null;
    const tpHit = activeTpTarget ? (isBuy ? currentPrice >= activeTpTarget : currentPrice <= activeTpTarget) : false;

    // 🛡️ Unified Fractal Candle Open/Close Software Stop Loss vs Catastrophic Broker Hard SL:
    // Software SL (openTrade.sl) is evaluated and executed strictly on confirmed M5 candle CLOSE in runSlowPathScan.
    // Fast-path pulse checks catastrophic broker hard stop (openTrade.brokerSlPrice) as a safeguard.
    const brokerHardSl = (typeof openTrade.brokerSlPrice === "number" && openTrade.brokerSlPrice > 0)
      ? openTrade.brokerSlPrice
      : deriveHardStopPrice(openTrade.entry, openTrade.direction, openTrade.lots, openTrade.sl);
    const hardStopBreached = isBuy ? currentPrice <= brokerHardSl : currentPrice >= brokerHardSl;

    let reason = null;
    if (tpHit) {
      reason = `Fractal Range Take Profit Hit at ${currentPrice.toFixed(4)} (TP: ${Number(activeTpTarget).toFixed(4)}, PnL: +$${pnl.toFixed(2)})`;
    } else if (hardStopBreached) {
      reason = `Emergency Broker Hard SL breached at ${currentPrice.toFixed(4)} (Hard SL: ${brokerHardSl.toFixed(4)}, PnL: -$${Math.abs(pnl).toFixed(2)})`;
    }
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
      if (DAILY_TARGET_LOCK_ENABLED && state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
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
          direction: dir, entry: entryPrice, sl: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), brokerSlPrice: live.stopLoss || deriveHardStopPrice(entryPrice, dir, actualLots), rr: null, entryType: "RECOVERED_LIVE", brokerSlAmount: STAKE_USD,
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
              else if (rec.profit >= 4.5 && (SYMBOL === "R_10" || SYMBOL === "R_25")) t.exitReason = "$5.00 Hard Broker TP";
              else if (rec.profit >= 3.2) t.exitReason = "+$3.50 Software Take Profit";
              else if (rec.profit >= 5.5 && SYMBOL === "1HZ75V") t.exitReason = "+$6.00 Take Profit Target";
              else if (rec.profit >= 1.4 && SYMBOL === "1HZ75V" && t.lockedPnlFloor && t.lockedPnlFloor >= 1.50) t.exitReason = "+$1.50 Software SL Floor Lock (Stoch 8 Level 50)";
              else if (rec.profit >= 2.4 && (SYMBOL === "R_50" || SYMBOL === "R_75")) t.exitReason = "+$2.50 Hard Broker TP";
              else if (rec.profit >= 1.8) t.exitReason = "+$2.00 Software Take Profit";
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
          if (DAILY_TARGET_LOCK_ENABLED && state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
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
  // Stoch (15,1,1 Simple) — Strictly Confirmed on Closed M5 Candles (Matching Indicator Line 1:1)
  const stoch1511 = calculateStoch(candles, 15, 1, 1, "Simple");
  const sK1511 = stoch1511.k[si], sD1511 = stoch1511.d[si], prevK1511 = stoch1511.k[si - 1], prevD1511 = stoch1511.d[si - 1];
  const sMaxK1511 = sK1511, sMinK1511 = sK1511;
  const prevMaxK1511 = prevK1511, prevMinK1511 = prevK1511;
  state.stoch1511Val = sK1511;
  state.stoch1511MaxVal = sK1511;
  state.stoch1511MinVal = sK1511;

  // Stoch (25,1,1 Simple) — Strictly Confirmed on Closed M5 Candles (Matching Indicator Line 1:1)
  const stoch2511 = calculateStoch(candles, 25, 1, 1, "Simple");
  const sK2511 = stoch2511.k[si], sD2511 = stoch2511.d[si], prevK2511 = stoch2511.k[si - 1], prevD2511 = stoch2511.d[si - 1];
  const sMaxK2511 = sK2511, sMinK2511 = sK2511;
  const prevMaxK2511 = prevK2511, prevMinK2511 = prevK2511;
  if (SYMBOL === "R_25" || SYMBOL === "R_10") {
    state.stoch2511Val = sK2511;
    state.stoch2511MaxVal = sK2511;
    state.stoch2511MinVal = sK2511;
    state.stoch1511Val = sK2511;
  }

  // Stoch (8,1,1 Simple) for R_50 OmniSight Trigger & Re-Entry & Trade Management
  const stoch8 = calculateStoch(candles, 8, 1, 1, "Simple");
  const sK8 = stoch8.k[si], sD8 = stoch8.d[si], prevK8 = stoch8.k[si - 1], prevD8 = stoch8.d[si - 1];
  const sMaxK8 = sK8, sMinK8 = sK8;
  const prevMaxK8 = prevK8, prevMinK8 = prevK8;
  state.stoch8Val = sK8;
  state.stoch8MaxVal = sK8;
  state.stoch8MinVal = sK8;
  state.stoch1511Val = sK8;

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

  if (GATE_TYPE === "STOCH100_STOCH8" || STRATEGY_PROFILE === "PROFILE_UNIVERSAL_STOCH100_STOCH8") {
    if (sK100 === null || prevK100 === null || sK8 === null || prevK8 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (SYMBOL === "R_25" || STRATEGY_PROFILE === "PROFILE_V25_STOCH100_STOCH25") {
    if (sK100 === null || prevK100 === null || sK2511 === null || prevK2511 === null) {
      state.lastProcessedEpoch = m5BoundaryEpoch;
      saveState();
      return;
    }
  } else if (SYMBOL === "R_50" || SYMBOL === "R_75" || SYMBOL === "1HZ75V" || STRATEGY_PROFILE === "PROFILE_V50_STOCH100_STOCH8" || STRATEGY_PROFILE === "PROFILE_V75_STOCH100_STOCH8" || STRATEGY_PROFILE === "PROFILE_V75_1S_STOCH100_STOCH8" || STRATEGY_PROFILE === "PROFILE_V50_MACD_STOCH25") {
    if (sK100 === null || prevK100 === null || sK8 === null || prevK8 === null) {
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

  // Supertrend (Periods: 21, Multiplier: 1.0, Shift: 0) on M5 Candles for Profit Management
  const supertrendData = calculateSupertrend(candles, 21, 1.0);
  const curSt = supertrendData.length > si ? supertrendData[si] : null;
  const prevSt = supertrendData.length > si - 1 ? supertrendData[si - 1] : null;
  if (curSt) {
    state.supertrendVal = curSt.supertrend;
    state.supertrendTrend = curSt.trend; // 1 = UP/Bullish (green), -1 = DOWN/Bearish (red)
    state.supertrendUpper = curSt.upperBand;
    state.supertrendLower = curSt.lowerBand;
    state.supertrendAtr = curSt.atr;
  }

  // 5. Manage Structure & Early Exits on Active Trades (Universal Fleet Invalidation & Rule 1/2 Engine)
  let openTrades = trades.filter(t => !t.result && !t.pending);
  for (const t of openTrades) {
    if (closingContracts.has(t.contractId)) continue;

    const isBuy = t.direction === "BUY";
    const currentPnl = calcUnrealizedPnL(t, currentPrice);
    const cOpen = parseFloat(candles[si].open);
    const cClose = parseFloat(candles[si].close);
    const cLow = parseFloat(candles[si].low);
    const cHigh = parseFloat(candles[si].high);

    // If trade opened intrabar during this M5 candle, finalize its full entry candle High/Low & SL at candle close
    if (t.openedIntrabar && t.entryM5Bucket === candles[si].epoch) {
      t.entryCandleLow = cLow;
      t.entryCandleHigh = cHigh;
      if (SL_REFERENCE_TYPE === "ENTRY_CANDLE") {
        t.sl = deriveCalibratedStopLossPrice(t.entry, t.direction, candles[si], null);
      }
      t.openedIntrabar = false;
      saveTrades(trades);
    }

    const isPostEntry = (!t.entryEpoch && !t.entryM5Bucket) || (t.entryEpoch && candles[si].epoch > t.entryEpoch) || (t.entryM5Bucket && candles[si].epoch > t.entryM5Bucket);

    // =========================================================================
    // 🛡️ CALIBRATED PER-PROFILE STOP LOSS INVALIDATION (MAIN SL):
    // - When SL_EXECUTION_TYPE === "CLOSE": Liquidate if confirmed closed M5 candle closes beyond t.sl
    // - When SL_EXECUTION_TYPE === "TOUCH": Also check if M5 candle Low/High or Close breached t.sl
    // =========================================================================
    if (isPostEntry) {
      const activeSl = (typeof t.sl === "number" && t.sl > 0)
        ? t.sl
        : (isBuy ? t.entryCandleLow : t.entryCandleHigh);

      let invalidationExit = false;
      let invalidationDetail = "";

      if (activeSl !== undefined && activeSl !== null) {
        if (SL_EXECUTION_TYPE === "TOUCH") {
          if (isBuy && (cLow <= activeSl || cClose <= activeSl)) {
            invalidationExit = true;
            invalidationDetail = `${SL_REFERENCE_TYPE} Stop Loss (TOUCH): M5 candle breached SL (${ parseFloat(activeSl).toFixed(4) }, Low=${cLow.toFixed(4)})`;
          } else if (!isBuy && (cHigh >= activeSl || cClose >= activeSl)) {
            invalidationExit = true;
            invalidationDetail = `${SL_REFERENCE_TYPE} Stop Loss (TOUCH): M5 candle breached SL (${ parseFloat(activeSl).toFixed(4) }, High=${cHigh.toFixed(4)})`;
          }
        } else {
          if (isBuy && cClose <= activeSl) {
            invalidationExit = true;
            invalidationDetail = `Fractal Candle Open/Close Software SL (M5 Close): M5 candle closed at ${cClose.toFixed(4)} below SL (${parseFloat(activeSl).toFixed(4)})`;
          } else if (!isBuy && cClose >= activeSl) {
            invalidationExit = true;
            invalidationDetail = `Fractal Candle Open/Close Software SL (M5 Close): M5 candle closed at ${cClose.toFixed(4)} above SL (${parseFloat(activeSl).toFixed(4)})`;
          }
        }
      }

      if (invalidationExit) {
        closingContracts.add(t.contractId);
        console.log(`[INVALIDATION SL ${SYMBOL}] Active ${t.direction} #${t.contractId}: ${invalidationDetail}. Current PnL: ${currentPnl >= 0 ? "+$" : "-$"}${Math.abs(currentPnl).toFixed(2)}. Liquidating immediately.`);
        t.exitReason = invalidationDetail;
        try {
          const closeRes = await closeContract(t.contractId);
          if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
            console.error(`[INVALIDATION SL ERROR ${SYMBOL}] Broker close failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
            closingContracts.delete(t.contractId);
            continue;
          }
          const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
          t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(currentPnl.toFixed(2)));
          t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
          t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
          t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
          state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
          if (DAILY_TARGET_LOCK_ENABLED && state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
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
            icon + " *[INVALIDATION SL EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
            "• Direction: *" + (t.direction === "BUY" ? "🟢 BUY" : "🔴 SELL") + "*\n" +
            "• Exit Reason: *" + invalidationDetail + "*\n" +
            "• Net P&L: *" + pnlStr + "*\n" +
            "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
            "• Contract: `" + t.contractId + "`"
          );
        } catch (e) {
          console.error(`[INVALIDATION SL EXCEPTION ${SYMBOL}] Exception closing ${t.contractId}:`, e.message);
          closingContracts.delete(t.contractId);
          continue;
        }
        closingContracts.delete(t.contractId);
        continue;
      }
    }

    // =========================================================================
    // 🎯 NEAR-TARGET M5 CANDLE-CLOSE PROFIT EXIT (>= 85% TARGET COMPLETION / EXHAUSTION)
    // User Rule: When trade is in profit and reaches >= 85% of the Fractal Take Profit:
    // 1. Direct Near-Target Close: If closed M5 candle closes >= 85% of target: Take profit immediately.
    // 2. Near-Target Rejection / Exhaustion: If M5 candle wicked into >= 85% of target,
    //    but closed showing rejection (opposite candle color: red for BUY, green for SELL):
    //    Liquidate immediately on candle close to lock in maximum peak profit.
    // =========================================================================
    let nearTargetExit = false;
    let nearTargetDetail = "";

    if (isPostEntry && currentPnl > 0) {
      const entryPrice = parseFloat(t.entryPrice || t.entry);
      let targetTp = parseFloat(t.tpPrice || t.fibTpPrice || t.takeProfit);
      if ((!targetTp || isNaN(targetTp)) && t.fractalDistance) {
        targetTp = isBuy ? (entryPrice + t.fractalDistance) : (entryPrice - t.fractalDistance);
      }
      if (entryPrice && targetTp && Math.abs(targetTp - entryPrice) > 0) {
        const targetDist = Math.abs(targetTp - entryPrice);
        const nearTargetLine = isBuy ? (entryPrice + 0.85 * targetDist) : (entryPrice - 0.85 * targetDist);

        if (isBuy) {
          if (cClose >= nearTargetLine) {
            nearTargetExit = true;
            nearTargetDetail = `Near-Target M5 Candle Close: M5 candle closed at ${cClose.toFixed(4)} (>= 85% of target ${targetTp.toFixed(4)}) while in profit (+$${currentPnl.toFixed(2)})`;
          } else if (cHigh >= nearTargetLine && cClose < cOpen) {
            nearTargetExit = true;
            nearTargetDetail = `Near-Target Exhaustion Wick Exit: M5 candle peaked at ${cHigh.toFixed(4)} (>= 85% of target ${targetTp.toFixed(4)}) and closed RED at ${cClose.toFixed(4)} while in profit (+$${currentPnl.toFixed(2)})`;
          }
        } else {
          if (cClose <= nearTargetLine) {
            nearTargetExit = true;
            nearTargetDetail = `Near-Target M5 Candle Close: M5 candle closed at ${cClose.toFixed(4)} (<= 85% of target ${targetTp.toFixed(4)}) while in profit (+$${currentPnl.toFixed(2)})`;
          } else if (cLow <= nearTargetLine && cClose > cOpen) {
            nearTargetExit = true;
            nearTargetDetail = `Near-Target Exhaustion Wick Exit: M5 candle wicked to ${cLow.toFixed(4)} (<= 85% of target ${targetTp.toFixed(4)}) and closed GREEN at ${cClose.toFixed(4)} while in profit (+$${currentPnl.toFixed(2)})`;
          }
        }
      }
    }

    if (nearTargetExit) {
      closingContracts.add(t.contractId);
      console.log(`[NEAR-TARGET PROFIT EXIT ${SYMBOL}] Active ${t.direction} #${t.contractId}: ${nearTargetDetail}. Current PnL: +$${currentPnl.toFixed(2)}. Liquidating immediately to lock in maximum profit.`);
      t.exitReason = nearTargetDetail;
      try {
        const closeRes = await closeContract(t.contractId);
        if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
          console.error(`[NEAR-TARGET PROFIT EXIT ERROR ${SYMBOL}] Broker close failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
          closingContracts.delete(t.contractId);
          continue;
        }
        const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
        t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(currentPnl.toFixed(2)));
        t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
        t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
        t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
        state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
        if (DAILY_TARGET_LOCK_ENABLED && state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
          state.dailyTargetReached = true;
          state.dailyTargetDate = todayStr;
        }
        state.openTrade = null;
        onTradeClosedCleanup(candles[si].epoch);
        saveTrades(trades);
        saveState();

        const icon = t.result === "WIN" ? "🎯" : "🔴";
        const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
        await sendTelegram(
          icon + " *[NEAR-TARGET PROFIT EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
          "• Direction: *" + (t.direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL") + "*\n" +
          "• Exit Trigger: *" + nearTargetDetail + "*\n" +
          "• Net P&L: *" + pnlStr + "*\n" +
          "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
          "• Contract: `" + t.contractId + "`"
        );
      } catch (e) {
        console.error("[NEAR-TARGET PROFIT EXIT] Exception closing " + t.contractId + ":", e.message);
        closingContracts.delete(t.contractId);
        continue;
      }
      closingContracts.delete(t.contractId);
      continue;
    }

    // =========================================================================
    // 🎯 SUPERTREND (Periods: 21, Multiplier: 1.0, Shift: 0) PROFIT MANAGEMENT EXIT
    // User Rule: When trades are in profit (currentPnl > 0), close the trade
    // immediately when Supertrend changes direction against the trade!
    // - For BUY: Flipped to Bearish (trend === -1)
    // - For SELL: Flipped to Bullish (trend === 1)
    // =========================================================================
    let supertrendExit = false;
    let supertrendExitDetail = "";

    if (isPostEntry && currentPnl > 0 && curSt) {
      if (isBuy && curSt.trend === -1) {
        supertrendExit = true;
        supertrendExitDetail = `Supertrend (21, 1) Direction Flip to BEARISH: M5 candle closed at ${cClose.toFixed(4)} (below Lower Band ${curSt.lowerBand ? curSt.lowerBand.toFixed(4) : "N/A"}) while in profit (+$${currentPnl.toFixed(2)})`;
      } else if (!isBuy && curSt.trend === 1) {
        supertrendExit = true;
        supertrendExitDetail = `Supertrend (21, 1) Direction Flip to BULLISH: M5 candle closed at ${cClose.toFixed(4)} (above Upper Band ${curSt.upperBand ? curSt.upperBand.toFixed(4) : "N/A"}) while in profit (+$${currentPnl.toFixed(2)})`;
      }
    }

    if (supertrendExit) {
      closingContracts.add(t.contractId);
      console.log(`[SUPERTREND PROFIT EXIT ${SYMBOL}] Active ${t.direction} #${t.contractId}: ${supertrendExitDetail}. Current PnL: +$${currentPnl.toFixed(2)}. Liquidating immediately to lock in profit.`);
      t.exitReason = supertrendExitDetail;
      try {
        const closeRes = await closeContract(t.contractId);
        if (closeRes && closeRes.error && closeRes.error.code !== "ContractNotFound") {
          console.error(`[SUPERTREND PROFIT EXIT ERROR ${SYMBOL}] Broker close failed for ${t.contractId}: ${closeRes.error.message || JSON.stringify(closeRes.error)}`);
          closingContracts.delete(t.contractId);
          continue;
        }
        const settled = await getContractProfitFromHistory(t.contractId, t.entryEpoch);
        t.serverPnl = (closeRes && closeRes.sell?.profit) ?? (settled !== null ? settled.profit : parseFloat(currentPnl.toFixed(2)));
        t.resultSource = (closeRes && closeRes.sell?.profit !== undefined) ? "server_close_confirmed" : (settled !== null ? "deriv_settled_official" : "estimated_fallback");
        t.result = t.serverPnl >= 0 ? "WIN" : "LOSS";
        t.closeTime = new Date().toISOString().replace("T", " ").substring(0, 19);
        state.dailyNetPnl = (state.dailyNetPnl || 0) + t.serverPnl;
        if (DAILY_TARGET_LOCK_ENABLED && state.dailyNetPnl >= DAILY_PROFIT_TARGET_USD) {
          state.dailyTargetReached = true;
          state.dailyTargetDate = todayStr;
        }
        state.openTrade = null;
        onTradeClosedCleanup(candles[si].epoch);
        saveTrades(trades);
        saveState();

        const icon = t.result === "WIN" ? "🟢" : "🔴";
        const pnlStr = t.serverPnl >= 0 ? "+" + t.serverPnl.toFixed(2) : "-" + Math.abs(t.serverPnl).toFixed(2);
        await sendTelegram(
          icon + " *[SUPERTREND PROFIT EXIT] " + SYMBOL_NAME + " — " + REPO_LABEL + "*\n\n" +
          "• Direction: *" + (t.direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL") + "*\n" +
          "• Exit Trigger: *" + supertrendExitDetail + "*\n" +
          "• Supertrend (21, 1): *" + (curSt.supertrend ? curSt.supertrend.toFixed(4) : "N/A") + " (" + (curSt.trend === 1 ? "BULLISH [UP]" : "BEARISH [DOWN]") + ")*\n" +
          "• Net P&L: *" + pnlStr + "*\n" +
          "• Daily Net Total: *" + state.dailyNetPnl.toFixed(2) + "*\n" +
          "• Contract: `" + t.contractId + "`"
        );
      } catch (e) {
        console.error("[SUPERTREND PROFIT EXIT] Exception closing " + t.contractId + ":", e.message);
        closingContracts.delete(t.contractId);
        continue;
      }
      closingContracts.delete(t.contractId);
      continue;
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

  // =========================================================================
  // UNIFIED 5-GATE FRACTAL BREAKOUT ENGINE (ALL 7 INSTRUMENTS)
  // 1. Initial Entry:
  //    - Condition 1: Closed M5 Stoch (100, 1, 1 Simple) freshly crosses Level 50.
  //    - 1A (SELL): Look for most recent LOW M5 fractal. Trigger when M5 candle closes below fractal.low.
  //      If Stoch 100 pulls back and closes > 50 before trigger, setup invalidates and flips to BUY.
  //    - 1B (BUY): Look for most recent HIGH M5 fractal. Trigger when M5 candle closes above fractal.high.
  //      If Stoch 100 pulls back and closes < 50 before trigger, setup invalidates and flips to SELL.
  //    - Re-Entry mode activates strictly ONLY after the Initial Trade has been executed in the current Stoch 100 wave.
  // 2. Re-Entry:
  //    - 2A (SELL): Stoch 100 < 50 & Initial Trade already taken. M5 Stoch (8,1,1) must first close >= 90 or touch 90.
  //      Look for most recent LOW M5 fractal. Trigger when M5 candle closes below fractal.low.
  //      Expires if Stoch 8 crosses < 50 in trend direction and then crosses back > 50 before fractal break.
  //    - 2B (BUY): Stoch 100 > 50 & Initial Trade already taken. M5 Stoch (8,1,1) must first close <= 10 or touch 10.
  //      Look for most recent HIGH M5 fractal. Trigger when M5 candle closes above fractal.high.
  //      Expires if Stoch 8 crosses > 50 in trend direction and then crosses back < 50 before fractal break.
  // =========================================================================

  const cOpen = parseFloat(candles[si].open);
  const cClose = parseFloat(candles[si].close);
  const cHigh = parseFloat(candles[si].high);
  const cLow = parseFloat(candles[si].low);
  const prevClose = si > 0 ? parseFloat(candles[si - 1].close) : cOpen;

  // Compute intrabar High/Low touch for M5 Stoch (8, 1, 1 Simple) on closed candle `si`
  const sl8 = candles.slice(Math.max(0, si - 7), si + 1);
  const hh8 = Math.max(...sl8.map(c => parseFloat(c.high)));
  const ll8 = Math.min(...sl8.map(c => parseFloat(c.low)));
  const highK8 = hh8 === ll8 ? 100 : ((cHigh - ll8) / (hh8 - ll8)) * 100;
  const lowK8 = hh8 === ll8 ? 0 : ((cLow - ll8) / (hh8 - ll8)) * 100;
  const stoch8TouchedOrClosed10 = (sK8 !== null && sK8 <= 10.0) || lowK8 <= 10.0;
  const stoch8TouchedOrClosed90 = (sK8 !== null && sK8 >= 90.0) || highK8 >= 90.0;

  // Active trades by direction (enabling Position Flipping on opposite signal)
  const hasActiveBuy = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "BUY");
  const hasActiveSell = trades.some(t => !t.result && !t.closeTime && (t.contractId || !t.pending) && t.direction === "SELL");

  // Get most recent High (UP) and Low (DOWN) M5 fractals
  const recentHighFractal = getMostRecentM5FractalByType(candles, si, 'UP');
  const recentLowFractal = getMostRecentM5FractalByType(candles, si, 'DOWN');
  let triggeredFractalForSl = null;

  // Gate 1: Macro Trend Gate — Closed M5 Stoch (100, 1, 1 Simple)
  const stoch100AlignedBuy = sK100 !== null && sK100 > 50.0;
  const stoch100AlignedSell = sK100 !== null && sK100 < 50.0;
  const stoch100CrossUp50 = prevK100 !== null && sK100 !== null && prevK100 <= 50.0 && sK100 > 50.0;
  const stoch100CrossDown50 = prevK100 !== null && sK100 !== null && prevK100 >= 50.0 && sK100 < 50.0;

  // Track Stoch 100 cross epoch and handle direction flips / invalidation
  if (stoch100CrossUp50) {
    state.stoch100CrossEpochBuy = m5BoundaryEpoch;
    state.initialBuyArmed = true;
    state.initialBuyDone = false;
    state.stoch8_pulled_back_10 = false;
    state.stoch8_crossed_50_in_trend_BUY = false;
    state.initialSellArmed = false;
    state.initialSellDone = false;
    state.stoch8_pulled_back_90 = false;
    state.stoch8_crossed_50_in_trend_SELL = false;
    state.stoch100CrossEpochSell = null;
    state.armedTouchSetup = null;
    console.log(`[${REPO_LABEL}] 🎯 Macro Trend Transition: Stoch (100,1,1) crossed UP > 50.0. SELL setups invalidated; Initial BUY Armed (watching for M5 close > High Fractal).`);
  }
  if (stoch100CrossDown50) {
    state.stoch100CrossEpochSell = m5BoundaryEpoch;
    state.initialSellArmed = true;
    state.initialSellDone = false;
    state.stoch8_pulled_back_90 = false;
    state.stoch8_crossed_50_in_trend_SELL = false;
    state.initialBuyArmed = false;
    state.initialBuyDone = false;
    state.stoch8_pulled_back_10 = false;
    state.stoch8_crossed_50_in_trend_BUY = false;
    state.stoch100CrossEpochBuy = null;
    state.armedTouchSetup = null;
    console.log(`[${REPO_LABEL}] 🎯 Macro Trend Transition: Stoch (100,1,1) crossed DOWN < 50.0. BUY setups invalidated; Initial SELL Armed (watching for M5 close < Low Fractal).`);
  }

  // If Macro Trend not aligned, invalidate armed setups
  if (!stoch100AlignedBuy) {
    state.stoch100CrossEpochBuy = null;
    state.initialBuyArmed = false;
    state.initialBuyDone = false;
    state.stoch8_pulled_back_10 = false;
    state.stoch8_crossed_50_in_trend_BUY = false;
    state.armedTouchSetup = null;
  }
  if (!stoch100AlignedSell) {
    state.stoch100CrossEpochSell = null;
    state.initialSellArmed = false;
    state.initialSellDone = false;
    state.stoch8_pulled_back_90 = false;
    state.stoch8_crossed_50_in_trend_SELL = false;
    state.armedTouchSetup = null;
  }

  // Verify whether Initial Trade has actually been taken in the current Stoch 100 wave
  if (stoch100AlignedBuy) {
    const waveStartBuy = findStochasticCrossCandleEpoch(candles, stoch100, "BUY", "MIDLINE") || state.stoch100CrossEpochBuy || m5BoundaryEpoch;
    state.stoch100CrossEpochBuy = waveStartBuy;
    const tradeTakenInBuyWave = trades.some(t =>
      t.direction === "BUY" &&
      ((t.entryEpoch && t.entryEpoch >= waveStartBuy) || (t.entryM5Bucket && t.entryM5Bucket >= waveStartBuy))
    );
    if (tradeTakenInBuyWave) {
      state.initialBuyDone = true;
      state.initialBuyArmed = false;
    } else {
      state.initialBuyDone = false;
      state.initialBuyArmed = true;
    }
  }
  if (stoch100AlignedSell) {
    const waveStartSell = findStochasticCrossCandleEpoch(candles, stoch100, "SELL", "MIDLINE") || state.stoch100CrossEpochSell || m5BoundaryEpoch;
    state.stoch100CrossEpochSell = waveStartSell;
    const tradeTakenInSellWave = trades.some(t =>
      t.direction === "SELL" &&
      ((t.entryEpoch && t.entryEpoch >= waveStartSell) || (t.entryM5Bucket && t.entryM5Bucket >= waveStartSell))
    );
    if (tradeTakenInSellWave) {
      state.initialSellDone = true;
      state.initialSellArmed = false;
    } else {
      state.initialSellDone = false;
      state.initialSellArmed = true;
    }
  }

  // --- 1B. INITIAL BUY SETUP MONITORING (M5 CLOSE > HIGH FRACTAL HIGH) ---
  if (!indicatorsSatisfied && state.initialBuyArmed && stoch100AlignedBuy && recentHighFractal) {
    const targetBreakout = recentHighFractal.high;
    if (targetBreakout !== null && cClose > targetBreakout && !hasActiveBuy) {
      indicatorsSatisfied = true;
      signalDirection = "BUY";
      setupLabel = `${SYMBOL}_INITIAL_FRACTAL_HIGH_BREAK (BUY)`;
      triggeredFractalForSl = recentHighFractal;
      state.initialBuyArmed = false;
      state.initialBuyDone = true;
      state.stoch8_pulled_back_10 = false;
      state.stoch8_crossed_50_in_trend_BUY = false;
      state.lastUsedFractalEpochBuy = recentHighFractal.epoch;
      console.log(`[${REPO_LABEL}] 🚀 Initial BUY Triggered: M5 close (${cClose.toFixed(4)}) > High Fractal High (${targetBreakout.toFixed(4)}).`);
    }
  }

  // --- 1A. INITIAL SELL SETUP MONITORING (M5 CLOSE < LOW FRACTAL LOW) ---
  if (!indicatorsSatisfied && state.initialSellArmed && stoch100AlignedSell && recentLowFractal) {
    const targetBreakout = recentLowFractal.low;
    if (targetBreakout !== null && cClose < targetBreakout && !hasActiveSell) {
      indicatorsSatisfied = true;
      signalDirection = "SELL";
      setupLabel = `${SYMBOL}_INITIAL_FRACTAL_LOW_BREAK (SELL)`;
      triggeredFractalForSl = recentLowFractal;
      state.initialSellArmed = false;
      state.initialSellDone = true;
      state.stoch8_pulled_back_90 = false;
      state.stoch8_crossed_50_in_trend_SELL = false;
      state.lastUsedFractalEpochSell = recentLowFractal.epoch;
      console.log(`[${REPO_LABEL}] 🚀 Initial SELL Triggered: M5 close (${cClose.toFixed(4)}) < Low Fractal Low (${targetBreakout.toFixed(4)}).`);
    }
  }

  // --- 2. RE-ENTRY MODE (STRICTLY AFTER INITIAL TRADE HAS BEEN TAKEN IN CURRENT WAVE) ---
  const isPostLastEntry = !state.lastTriggeredEpoch || candles[si].epoch > state.lastTriggeredEpoch;

  if (!indicatorsSatisfied && isPostLastEntry) {
    // 2B. BUY Re-Entry (Stoch 100 > 50 & Initial Trade already taken)
    if (stoch100AlignedBuy && Boolean(state.initialBuyDone) && !state.initialBuyArmed) {
      if (stoch8TouchedOrClosed10) {
        state.stoch8_pulled_back_10 = true;
        state.stoch8_crossed_50_in_trend_BUY = (sK8 !== null && sK8 > 50.0);
      } else if (state.stoch8_pulled_back_10) {
        if (state.stoch8_crossed_50_in_trend_BUY && sK8 !== null && sK8 < 50.0) {
          state.stoch8_pulled_back_10 = false;
          state.stoch8_crossed_50_in_trend_BUY = false;
          console.log(`[${REPO_LABEL}] ⏳ BUY Re-Entry Setup expired: Stoch (8,1,1) crossed back below Level 50 (${sK8.toFixed(1)} < 50). Watching for next <= 10 pullback.`);
        } else if (sK8 !== null && sK8 > 50.0) {
          state.stoch8_crossed_50_in_trend_BUY = true;
        }
      }

      if (state.stoch8_pulled_back_10 && recentHighFractal && !hasActiveBuy) {
        const targetBreakout = recentHighFractal.high;
        const isFreshFractalOrBreak = recentHighFractal.epoch !== state.lastUsedFractalEpochBuy || prevClose <= targetBreakout;
        if (targetBreakout !== null && cClose > targetBreakout && isFreshFractalOrBreak) {
          indicatorsSatisfied = true;
          signalDirection = "BUY";
          setupLabel = `${SYMBOL}_REENTRY_FRACTAL_HIGH_BREAK (BUY)`;
          triggeredFractalForSl = recentHighFractal;
          state.stoch8_pulled_back_10 = false;
          state.stoch8_crossed_50_in_trend_BUY = false;
          state.lastUsedFractalEpochBuy = recentHighFractal.epoch;
          console.log(`[${REPO_LABEL}] 🚀 Re-Entry BUY Triggered: M5 close (${cClose.toFixed(4)}) > High Fractal High (${targetBreakout.toFixed(4)}). Pullback <= 10 confirmed.`);
        }
      }
    }

    // 2A. SELL Re-Entry (Stoch 100 < 50 & Initial Trade already taken)
    if (stoch100AlignedSell && Boolean(state.initialSellDone) && !state.initialSellArmed) {
      if (stoch8TouchedOrClosed90) {
        state.stoch8_pulled_back_90 = true;
        state.stoch8_crossed_50_in_trend_SELL = (sK8 !== null && sK8 < 50.0);
      } else if (state.stoch8_pulled_back_90) {
        if (state.stoch8_crossed_50_in_trend_SELL && sK8 !== null && sK8 > 50.0) {
          state.stoch8_pulled_back_90 = false;
          state.stoch8_crossed_50_in_trend_SELL = false;
          console.log(`[${REPO_LABEL}] ⏳ SELL Re-Entry Setup expired: Stoch (8,1,1) crossed back above Level 50 (${sK8.toFixed(1)} > 50). Watching for next >= 90 pullback.`);
        } else if (sK8 !== null && sK8 < 50.0) {
          state.stoch8_crossed_50_in_trend_SELL = true;
        }
      }

      if (state.stoch8_pulled_back_90 && recentLowFractal && !hasActiveSell) {
        const targetBreakout = recentLowFractal.low;
        const isFreshFractalOrBreak = recentLowFractal.epoch !== state.lastUsedFractalEpochSell || prevClose >= targetBreakout;
        if (targetBreakout !== null && cClose < targetBreakout && isFreshFractalOrBreak) {
          indicatorsSatisfied = true;
          signalDirection = "SELL";
          setupLabel = `${SYMBOL}_REENTRY_FRACTAL_LOW_BREAK (SELL)`;
          triggeredFractalForSl = recentLowFractal;
          state.stoch8_pulled_back_90 = false;
          state.stoch8_crossed_50_in_trend_SELL = false;
          state.lastUsedFractalEpochSell = recentLowFractal.epoch;
          console.log(`[${REPO_LABEL}] 🚀 Re-Entry SELL Triggered: M5 close (${cClose.toFixed(4)}) < Low Fractal Low (${targetBreakout.toFixed(4)}). Pullback >= 90 confirmed.`);
        }
      }
    }
  }

  state.armedTouchSetup = null;

  // Dynamic Telemetry & Next Trigger/Phase formatting for Dashboard
  state.isReentryMode = Boolean(state.initialBuyDone || state.initialSellDone);

  if (stoch100AlignedBuy) {
    const targetStr = getFractalBreakoutLabel(recentHighFractal, "BUY", "HIGH_LOW", "CLOSE");
    if (state.initialBuyArmed && !state.initialBuyDone) {
      state.armed = { dir: "BUY", lbl: `Initial BUY Armed (Await M5 ${targetStr})` };
      state.nextPhase = `Initial BUY Armed — Awaiting M5 candle ${targetStr} (Invalidates if Stoch 100 < 50)`;
      state.nextTrigger = `Awaiting M5 candle ${targetStr} (Invalidates if Stoch 100 < 50)`;
    } else {
      const inPullback = Boolean(state.stoch8_pulled_back_10);
      if (inPullback) {
        state.armed = { dir: "BUY", lbl: `BUY Re-Entry Armed (Stoch 8 <= 10 | Await M5 ${targetStr})` };
        state.nextPhase = `BUY Re-Entry Armed — Stoch 8 <= 10 Touched/Closed. Awaiting M5 candle ${targetStr} (Expires if Stoch 8 crosses back < 50)`;
        state.nextTrigger = `Awaiting M5 candle ${targetStr} (Expires if Stoch 8 crosses back < 50)`;
      } else {
        state.armed = null;
        state.nextPhase = `Awaiting BUY Pullback — Await Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) touch/close <= 10`;
        state.nextTrigger = `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) touch/close <= 10`;
      }
    }
  } else if (stoch100AlignedSell) {
    const targetStr = getFractalBreakoutLabel(recentLowFractal, "SELL", "HIGH_LOW", "CLOSE");
    if (state.initialSellArmed && !state.initialSellDone) {
      state.armed = { dir: "SELL", lbl: `Initial SELL Armed (Await M5 ${targetStr})` };
      state.nextPhase = `Initial SELL Armed — Awaiting M5 candle ${targetStr} (Invalidates if Stoch 100 > 50)`;
      state.nextTrigger = `Awaiting M5 candle ${targetStr} (Invalidates if Stoch 100 > 50)`;
    } else {
      const inPullback = Boolean(state.stoch8_pulled_back_90);
      if (inPullback) {
        state.armed = { dir: "SELL", lbl: `SELL Re-Entry Armed (Stoch 8 >= 90 | Await M5 ${targetStr})` };
        state.nextPhase = `SELL Re-Entry Armed — Stoch 8 >= 90 Touched/Closed. Awaiting M5 candle ${targetStr} (Expires if Stoch 8 crosses back > 50)`;
        state.nextTrigger = `Awaiting M5 candle ${targetStr} (Expires if Stoch 8 crosses back > 50)`;
      } else {
        state.armed = null;
        state.nextPhase = `Awaiting SELL Pullback — Await Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) touch/close >= 90`;
        state.nextTrigger = `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) touch/close >= 90`;
      }
    }
  } else {
    state.armed = null;
    state.nextPhase = "Monitoring Stoch (100,1,1) Level 50 Macro Trend Gate";
    state.nextTrigger = "Awaiting Stoch (100,1,1) Level 50 Macro Trend Alignment";
  }

  // Fallback Fibonacci TP Target Calculation
  if (!calculatedFibTp && indicatorsSatisfied && signalDirection && keyLevels && keyLevels.length > 0) {
    if (signalDirection === "BUY") {
      const higher = keyLevels.filter(k => k.lvl > currentPrice).map(k => k.lvl).sort((a,b) => a - b);
      calculatedFibTp = higher.length > 0 ? higher[0] : null;
    } else {
      const lower = keyLevels.filter(k => k.lvl < currentPrice).map(k => k.lvl).sort((a,b) => a - b);
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

    // Calibrated Per-Profile Stop Loss Anchor (Strictly Validated on SL Side of Entry)
    const activeFractal = triggeredFractalForSl || (direction === "BUY" ? recentHighFractal : recentLowFractal);
    const sl = deriveCalibratedStopLossPrice(entry, direction, candles[si], activeFractal);

    // 🎯 Dynamic Fractal Distance Take Profit (Structural Measured Move):
    // Measures the exact structural swing distance between the most recent confirmed M5 UP fractal and DOWN fractal:
    // Distance D = |recentHighFractal.high - recentLowFractal.low|
    // For BUY: TP = Entry + D
    // For SELL: TP = Entry - D
    const tpDigits = SYMBOL === "R_50" ? 4 : ((SYMBOL === "R_25" || SYMBOL === "R_10") ? 3 : 2);
    let fractalDistance = (recentHighFractal && recentLowFractal)
      ? Math.abs(Number(recentHighFractal.high) - Number(recentLowFractal.low))
      : 0;
    if (!fractalDistance || fractalDistance <= 0) {
      fractalDistance = Math.abs(entry - sl) * 2.0;
    }
    const tpPrice = direction === "BUY"
      ? parseFloat((entry + fractalDistance).toFixed(tpDigits))
      : parseFloat((entry - fractalDistance).toFixed(tpDigits));
    const fibTpPrice = tpPrice;
    const isDynamicRunner = false;

    let initialM5Fractal = direction === "BUY"
      ? findRecentFractalBelow(candles, si, entry)
      : findRecentFractalAbove(candles, si, entry);

    const timeFormatted = new Date(m5BoundaryEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
    const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

    // Build Clean Unified 5-Gate Fractal Breakout Verification Lines
    const isInitialSignal = entryType.includes("INITIAL");
    const isFracBull = activeFractal && activeFractal.close >= activeFractal.open;
    const slRuleDesc = direction === "BUY"
      ? (isFracBull ? "Bullish Fractal Candle Open (Bottom of Body)" : "Bearish Fractal Candle Close (Bottom of Body)")
      : (isFracBull ? "Bullish Fractal Candle Close (Top of Body)" : "Bearish Fractal Candle Open (Top of Body)");
    const tpTargetDesc = `Fractal Range TP @ ${tpPrice.toFixed(tpDigits)} (Swing Range: ${fractalDistance.toFixed(tpDigits)} pts / Supertrend trailing protection)`;
    const confluenceLines =
      `• Gate 1 (Macro Trend): *M5 Stoch (100,1,1) %K ${(sK100 !== null ? sK100.toFixed(1) : "N/A")}* (${direction === "BUY" ? ">50 [BULLISH]" : "<50 [BEARISH]"})\n` +
      `• Gate 2 (Momentum): *M5 Stoch (8,1,1) %K ${(sK8 !== null ? sK8.toFixed(1) : "N/A")}* (${isInitialSignal ? "Initial Entry (Stoch 100 Fresh Cross)" : `Re-Entry Pullback ${direction === "BUY" ? "<=10" : ">=90"}`})\n` +
      `• Gate 3 (Fractal Trigger): *${setupLabel}* (M5 Close ${direction === "BUY" ? "> High Fractal High" : "< Low Fractal Low"})\n` +
      `• Gate 4 (Profit Management): *${tpTargetDesc}*\n` +
      `• Gate 5 (Stop Loss): *${sl.toFixed(4)}* (${slRuleDesc} / Software SL on M5 Close)\n` +
      `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)} (${DAILY_TARGET_LOCK_ENABLED ? "Lock ON" : "Uncapped"})*`;

    const message = 
      `🚨 *[ENTRY SIGNAL] ${SYMBOL_NAME.toUpperCase()} — ${REPO_LABEL}* 🚨\n\n` +
      `• Direction: *${dirEmoji}*\n` +
      `• Strategy: *${getFriendlyStrategyName()}*\n` +
      `Setup: *${escapeMarkdown(entryType)}*\n` +
      `📍 Entry: *${entry.toFixed(4)}*\n` +
      `🛑 Stop Loss: *${sl.toFixed(4)}* (${slRuleDesc} / Software SL on M5 Close)\n` +
      `🎯 Take Profit: *${tpTargetDesc}*\n\n` +
      `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n\n` +
      `📐 *Technical Confluence Verification:*\n` +
      confluenceLines + `\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏰ Time (UTC): ${timeFormatted}\n\n` +
      `💡 To close manually: send \`/close win\` or \`/close loss\``;

    const brokerHardSlPrice = deriveHardStopPrice(entry, direction, CTRADER_LOT_SIZE, sl);

    const pendingTradeRecord = {
      id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, brokerSlPrice: brokerHardSlPrice, rr: null, fractalDistance, entryType, brokerSlAmount: STAKE_USD,
      lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
      entryEpoch: m5BoundaryEpoch, purchaseTimeEpoch: m5BoundaryEpoch, purchase_time: m5BoundaryEpoch,
      entryM5Bucket: candles[si].epoch,
      openedIntrabar: false,
      entryCandleHigh: (candles && candles[si]) ? parseFloat(candles[si].high) : entry,
      entryCandleLow: (candles && candles[si]) ? parseFloat(candles[si].low) : entry,
      slReferenceType: SL_REFERENCE_TYPE,
      slExecutionType: SL_EXECUTION_TYPE,
      profitManagementMode: "FRACTAL_RANGE_TP_AND_SUPERTREND_TRAILING",
      supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
      supertrendAtEntry: curSt ? curSt.trend : null,
      stoch8EarlyExit: false,
      fractalSl: initialM5Fractal,
      fractalEpoch: null,
      fractalTimeframe: "M5",
      m5Fractal: initialM5Fractal,
      m30FractalUpgraded: false, tpPrice, fibTpPrice: tpPrice,
      openTime: timeFormatted, closeTime: null, result: null
    };
    trades.push(pendingTradeRecord);
    saveTrades(trades);

    try {
      const contractId = await executeTrade(direction, { slPrice: sl, brokerSlPrice: brokerHardSlPrice, fibTpPrice: tpPrice, tpPrice });
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
    nextTrigger = `Managing Position: Fractal Range TP @ ${activeTrade.tpPrice ? Number(activeTrade.tpPrice).toFixed(2) : "Dynamic"} | Supertrend (21, 1, 0) Profit Trailing | SL: ${activeTrade.sl ? Number(activeTrade.sl).toFixed(2) : "N/A"} (${SL_REFERENCE_TYPE} / ${SL_EXECUTION_TYPE})`;
  } else if (state.dailyTargetReached) {
    state.openTrade = null;
    healthStatus = "FUNCTIONING";
    blockerReason = `Daily Net Target (+${DAILY_PROFIT_TARGET_USD.toFixed(2)}) Secured Today (${(state.dailyNetPnl || 0).toFixed(2)})`;
    nextTrigger = "Idling until 00:00 UTC daily rollover";
  } else {
    state.openTrade = null;
    const stoch100Buy = sK100 !== null && sK100 >= 50.0;
    const stoch100Sell = sK100 !== null && sK100 < 50.0;
    const isReentry = Boolean(state.isReentryMode || state.initialBuyDone || state.initialSellDone);

    if (state.nextTrigger) {
      nextTrigger = state.nextTrigger;
    }

    if (stoch100Buy) {
      if (!isReentry) {
        blockerReason = state.initialBuyArmed
          ? `Initial BUY Armed (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} > 50 | ${INITIAL_GATE_MODE})`
          : `Macro Trend Bullish (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} > 50)`;
        if (!nextTrigger) {
          nextTrigger = state.initialBuyArmed
            ? `Awaiting ${getFractalBreakoutLabel(recentHighFractal, "BUY", INITIAL_BREAKOUT_TYPE, INITIAL_TRIGGER_EXEC)}`
            : `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) cross > 50 for Initial BUY`;
        }
      } else {
        blockerReason = `BUY Re-Entry Mode Active (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} > 50)`;
        if (!nextTrigger) {
          nextTrigger = state.stoch8_pulled_back_10
            ? `BUY Re-Entry Armed: Awaiting M5 ${getFractalBreakoutLabel(recentHighFractal, "BUY", ENTRY_BREAKOUT_TYPE, "CLOSE")}`
            : `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) pullback <= 10 for BUY Re-Entry`;
        }
      }
    } else if (stoch100Sell) {
      if (!isReentry) {
        blockerReason = state.initialSellArmed
          ? `Initial SELL Armed (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} < 50 | ${INITIAL_GATE_MODE})`
          : `Macro Trend Bearish (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} < 50)`;
        if (!nextTrigger) {
          nextTrigger = state.initialSellArmed
            ? `Awaiting ${getFractalBreakoutLabel(recentLowFractal, "SELL", INITIAL_BREAKOUT_TYPE, INITIAL_TRIGGER_EXEC)}`
            : `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) cross < 50 for Initial SELL`;
        }
      } else {
        blockerReason = `SELL Re-Entry Mode Active (Stoch 100: ${sK100 ? sK100.toFixed(1) : "N/A"} < 50)`;
        if (!nextTrigger) {
          nextTrigger = state.stoch8_pulled_back_90
            ? `SELL Re-Entry Armed: Awaiting M5 ${getFractalBreakoutLabel(recentLowFractal, "SELL", ENTRY_BREAKOUT_TYPE, "CLOSE")}`
            : `Awaiting Stoch (8,1,1) %K (${sK8 !== null ? sK8.toFixed(1) : "N/A"}) pullback >= 90 for SELL Re-Entry`;
        }
      }
    } else {
      blockerReason = "Awaiting Stoch (100,1,1) macro trend definition";
      if (!nextTrigger) nextTrigger = "Awaiting Stoch (100,1,1) cross 50.0";
    }
  }

  // Real operational blockers override normal scanning status
  if (state.lastError && (Date.now() - new Date(state.lastErrorTime || 0).getTime() < 30 * 60 * 1000)) {
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

// ==================== INTRABAR INITIAL TOUCH TRIGGER (R_75 & R_25) ====================
async function checkIntrabarInitialTouchEntry(currentM5Boundary) {
  if (INITIAL_TRIGGER_EXEC !== "TOUCH" || !state.armedTouchSetup || state.dailyTargetReached || state.queuedPendingOrder) return false;
  const setup = state.armedTouchSetup;
  if (!setup || !setup.dir || !Number.isFinite(setup.targetPrice)) return false;

  // Only trigger on a candle strictly after the closed M5 candle that armed/updated the setup
  if (setup.armedAtEpoch && currentM5Boundary < setup.armedAtEpoch) return false;

  let currentPrice = state.currentPrice;
  try {
    const fresh = await fetchCurrentSpotPrice();
    if (fresh > 0) {
      currentPrice = fresh;
      state.symbol = SYMBOL;
      state.currentPrice = fresh;
      state.lastPriceUpdate = new Date().toISOString();
    }
  } catch (e) {
    dbg(`Intrabar touch spot fetch fallback: ${e.message}`);
  }
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return false;

  const prevClose = Number.isFinite(setup.prevClose) ? setup.prevClose : currentPrice;
  const touchedBuy = setup.dir === "BUY" && prevClose <= setup.targetPrice && currentPrice >= setup.targetPrice;
  const touchedSell = setup.dir === "SELL" && prevClose >= setup.targetPrice && currentPrice <= setup.targetPrice;
  if (!touchedBuy && !touchedSell) return false;

  const direction = setup.dir;
  const entry = currentPrice;
  const entryType = `INITIAL_FRACTAL_${INITIAL_BREAKOUT_TYPE}_TOUCH`;
  console.log(`[${REPO_LABEL}] ⚡ INTRABAR INITIAL TOUCH TRIGGERED: ${direction} @ ${entry.toFixed(4)} (Target ${INITIAL_BREAKOUT_TYPE}: ${setup.targetPrice.toFixed(4)})`);

  // Disarm initial wave state immediately so it cannot double-fire
  state.armedTouchSetup = null;
  state.initialBuyArmed = false;
  state.initialSellArmed = false;
  state.initialTradeDoneInWave = true;
  state.isReentryMode = true;
  state.lastTriggeredSetup = entryType;
  state.lastTriggeredEpoch = currentM5Boundary;

  const provisionalCandle = {
    low: Math.min(entry, prevClose, setup.targetPrice),
    high: Math.max(entry, prevClose, setup.targetPrice),
    open: prevClose,
    close: entry
  };
  const sl = deriveCalibratedStopLossPrice(entry, direction, provisionalCandle, setup.fractal);
  const brokerHardSlPrice = deriveHardStopPrice(entry, direction, CTRADER_LOT_SIZE, sl);

  // 🎯 Dynamic Fractal Distance Take Profit (Structural Measured Move):
  const tpDigits = SYMBOL === "R_50" ? 4 : ((SYMBOL === "R_25" || SYMBOL === "R_10") ? 3 : 2);
  let fractalDistance = Math.abs(entry - sl) * 2.0;
  const tpPrice = direction === "BUY"
    ? parseFloat((entry + fractalDistance).toFixed(tpDigits))
    : parseFloat((entry - fractalDistance).toFixed(tpDigits));
  const fibTpPrice = tpPrice;

  const nowEpoch = Math.floor(Date.now() / 1000);
  const timeFormatted = new Date(nowEpoch * 1000).toISOString().replace("T", " ").substring(0, 19);
  const dirEmoji = direction === "BUY" ? "🟢 ⬆️ BUY" : "🔴 ⬇️ SELL";

  const tpTargetDesc = `Fractal Range TP @ ${tpPrice.toFixed(tpDigits)} (Swing Range: ${fractalDistance.toFixed(tpDigits)} pts / Supertrend trailing protection)`;
  const confluenceLines =
    `• Gate 1 (Macro Trend): *M5 Stoch (100,1,1) ${direction === "BUY" ? ">50 [BULLISH]" : "<50 [BEARISH]"}*\n` +
    `• Gate 2 (Initial Mode): *${INITIAL_GATE_MODE}* (Intrabar Touch Armed)\n` +
    `• Gate 3 (Fractal Trigger): *${entryType}* (Target: ${setup.targetPrice.toFixed(4)})\n` +
    `• Gate 4 (Profit Management): *${tpTargetDesc}*\n` +
    `• Gate 5 (Stop Loss): *${sl.toFixed(4)}* (${SL_REFERENCE_TYPE} / ${SL_EXECUTION_TYPE} — finalized at M5 close)\n` +
    `• Daily Target Progress: *$${(state.dailyNetPnl || 0).toFixed(2)} / $${DAILY_PROFIT_TARGET_USD.toFixed(2)} (${DAILY_TARGET_LOCK_ENABLED ? "Lock ON" : "Uncapped"})*`;

  const message =
    `🚨 *[INTRABAR INITIAL TOUCH] ${SYMBOL_NAME.toUpperCase()} — ${REPO_LABEL}* 🚨\n\n` +
    `• Direction: *${dirEmoji}*\n` +
    `• Strategy: *${getFriendlyStrategyName()}*\n` +
    `Setup: *${escapeMarkdown(entryType)}*\n` +
    `📍 Entry: *${entry.toFixed(4)}* (Fractal Target: ${setup.targetPrice.toFixed(4)})\n` +
    `🛑 Calibrated SL: *${sl.toFixed(4)}* (${SL_REFERENCE_TYPE} / ${SL_EXECUTION_TYPE})\n` +
    `🎯 Take Profit: *${tpTargetDesc}*\n\n` +
    `💰 Stake: $${STAKE_USD} | Mode: ${EXECUTION_MODE === "ctrader" ? `cTrader CFD (${CTRADER_LOT_SIZE} lots)` : `Multiplier ${MULTIPLIER}x`}\n\n` +
    `📐 *Technical Confluence Verification:*\n` +
    confluenceLines + `\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ Time (UTC): ${timeFormatted}`;

  const trades = loadTrades();
  const pendingTradeRecord = {
    id: `${SYMBOL}-${Date.now()}`, contractId: null, pending: true, repo: REPO_LABEL, symbol: SYMBOL, direction, entry, sl, brokerSlPrice: brokerHardSlPrice, rr: null, fractalDistance, entryType, brokerSlAmount: STAKE_USD,
    lots: CTRADER_LOT_SIZE, executionMode: EXECUTION_MODE, is_ctrader: EXECUTION_MODE === "ctrader",
    entryEpoch: nowEpoch, purchaseTimeEpoch: nowEpoch, purchase_time: nowEpoch,
    entryM5Bucket: currentM5Boundary,
    openedIntrabar: true,
    entryCandleHigh: provisionalCandle.high,
    entryCandleLow: provisionalCandle.low,
    slReferenceType: SL_REFERENCE_TYPE,
    slExecutionType: SL_EXECUTION_TYPE,
    profitManagementMode: "FRACTAL_RANGE_TP_AND_SUPERTREND_TRAILING",
    supertrendParams: { periods: 21, multiplier: 1.0, shift: 0 },
    stoch8EarlyExit: false,
    fractalSl: setup.fractal ? setup.fractal.price : null,
    fractalEpoch: setup.fractal ? setup.fractal.epoch : null,
    fractalTimeframe: "M5",
    m5Fractal: setup.fractal ? setup.fractal.price : null,
    m30FractalUpgraded: false, tpPrice, fibTpPrice: tpPrice,
    openTime: timeFormatted, closeTime: null, result: null
  };
  trades.push(pendingTradeRecord);
  saveTrades(trades);

  try {
    const contractId = await executeTrade(direction, { slPrice: sl, brokerSlPrice: brokerHardSlPrice, fibTpPrice: tpPrice, tpPrice });
    if (!contractId) {
      trades.splice(trades.findIndex(t => t.id === pendingTradeRecord.id), 1);
      saveTrades(trades);
      saveState();
      await sendTelegram(`❌ *${REPO_LABEL}* — Intrabar touch triggered, but broker returned no contract ID. Aborted.`);
      return false;
    }
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
    return true;
  } catch (execErr) {
    console.error(`[${REPO_LABEL}] Intrabar touch live execution failed: ${execErr.message}. Queueing reconnect...`);
    state.queuedPendingOrder = {
      tradeRecordId: pendingTradeRecord.id,
      direction,
      orderContext: { slPrice: sl, fibTpPrice: tpPrice, tpPrice },
      signalEpoch: nowEpoch,
      expiresEpoch: nowEpoch + 150,
      message,
      firstFailureMessage: execErr.message,
      retryAttempts: 1,
      lastAttemptEpoch: nowEpoch
    };
    saveState();
    return false;
  }
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

      // ⚡ Intrabar Initial Touch Trigger: For R_75 & R_25 (INITIAL_TRIGGER_EXEC === "TOUCH")
      if (INITIAL_TRIGGER_EXEC === "TOUCH" && state.armedTouchSetup && !hasOpenTrade && !state.dailyTargetReached && !state.queuedPendingOrder) {
        const openedTouch = await checkIntrabarInitialTouchEntry(currentM5Boundary);
        if (openedTouch) {
          hasOpenTrade = true;
        }
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
