# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 9.1 -- October 2026 Authoritative Trading Rules & Parameter Specification (Removal of Stoch %K/%D Opposite Cross Early Exit; Fleet-Wide Adoption of Closed-M5 Stoch (15,2,5) Level 40/60 Invalidation Exit in Loss; VIX 100 Hard Broker TP $10.00, Move SL to +$0.50 at $5.00 Profit)

---

## 1. FLEET ROSTER & STRATEGY MATRIX

All active trading bots operate with a standard **$5.00 Stake**, engineered for a **$100.00 Live Account Balance** to target **$7.00 Net Daily Profit per bot** ($49.00/day total fleet quota; $10.00 target for VIX 100). Risk is strictly governed by a **-$2.00 Software Stop Loss** (-$4.00 on `R_100`; -$5.00 Hard Broker SL limit).

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Gate | Base TP ($3.50 Net) | Daily Strike TP | Calibrated Soft SL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | M5 EMA 100/200 2-Step Initial (50/50 Fresh Cross) & EMA 100 Touch Retracement (20/80) | 350.0 pts | 700.0 pts | -$2.00 |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.05 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (30,2,5) Level 50 Cross (±3 candles) + EMA 100 Filter + Stoch (15,2,5) 25/75 Re-Entry | 70.0 pts | 140.0 pts | -$2.00 |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Cross & 25/75 Re-Entry + Stoch (30,20,15) Opposite Cross Exit | 10.00 pts | 10.00 pts | -$4.00 (moves to +$0.50 @ $5.00) |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (30,2,5) Level 50 Cross (±3 candles) + EMA 100 Filter + Stoch (30,25,15) Re-Entry | 7.00 pts | 14.00 pts | -$2.00 |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | $5.00 | M5 Stoch 200 (45/55) + Stoch (15,2,5) (75/25) + EMA 100 Filter (Skip & Await Re-Entry) + Pullback Re-Entry (25/75) | 525.0 pts | 1050.0 pts | -$2.00 |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Initial & 25/75 Re-Entry + Dynamic Runner | 0.88 pt | 1.75 pt | -$2.00 |
| **Test Bot** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | $5.00 | M5 Stoch 200 + MACD (25,75,1) + EMA 100 Any-Order + Stoch (5,3,3) Re-Entry (20/80) | 7.00 pts | 14.00 pts | -$2.00 |

---

## 2. STRATEGY PROFILE RULES & INDICATOR MATRIX

* **Entry Execution Mandate:** Fibonacci Grid Touch/Crossover is **NOT REQUIRED FOR ENTRY** on any instrument in the fleet. Entries are governed strictly by calibrated M5 EMA, Stochastic, CCI, and MACD indicators as detailed in Section 1 and `HANDBOOK.md` Section 9.
* **Take Profit Target Mandate:** The Daily Fibonacci Grid (0%, 50%, 79%, 100%, -50%, 161.8%) serves as the technical **Take Profit Target Grid** for active trades, enforced with a minimum **$4.00 Net Take Profit Target Floor** ($7.00 Extended Target Alignment) and managed by the Two-Tier Dynamic Trailing Stop Ratchet + Closed-M5 Stoch (15, 2, 5) Midline Profit Exit when in profit.

---

## 3. UNIFIED CENTRALIZED TRADE MANAGEMENT & CAPITAL PROTECTION ENGINE

* **Software Stop Loss (-$2.00 on `R_75`, `1HZ75V`, `1HZ25V`, `R_25`, `R_50`, `R_10` / -$4.00 on `R_100`):** Strict 2.0% - 4.0% account capital risk limit on $100 balance. Executed in 2-second fast-path watchdog.
* **Hard Broker Stop Loss (-$5.00):** Native broker-level multiplier safety floor.
* **The Incubation Zone ($0.00 to $2.19):** Full breathing room. Zero premature trailing stops. Trades navigate normal M5 wicks freely.
* **Tier 1 Breakeven Capital Shield (Peak $\ge +\$2.20$):** Floor locked at **+$1.00 net** ($1.20 breathing buffer). Guarantees all commissions are covered in pure profit.
* **Tier 2 Half-Target Quota Lock (Peak $\ge +\$3.50$):** Floor locked at **+$2.20 net** ($1.30 breathing buffer). Guarantees at least 31% of daily quota. Two such trades hit the full $7.00 daily goal.
* **Tier 3 Pre-Target Runner (Peak $\ge +\$5.00$):** Floor locked at **+$3.80 net** ($1.20 buffer).
* **Tier 4 Daily Target Strike Ceiling (Instant Cash-Out):**
  The second floating profit completes the daily quota or reaches +$7.00 standalone, the bot cashes out immediately.
* **Daily Target Lock (+$7.00):** Transitions bot into `IDLE_DAILY_TARGET_REACHED` until 00:00 UTC rollover.
* **Continuous Trading Execution Mandate:** The artificial -$4.00 daily loss halt has been completely abolished. Trading bots evaluate market structure continuously across all sessions without premature daily freezes.
* **Tier 4 Super Runner Ratchet (Peak $\ge \$12.00$):** Locks in at least **80% of peak profit** (capping maximum giveback to `$2.50`):
  $\text{lockedPnlFloor} = \max(+\$7.50, \text{maxUnrealizedPnL} \times 0.80, \text{maxUnrealizedPnL} - \$2.50)$
* **Hard Take Profit / Super Runner Cash-out Ceiling (+$20.00):** Instant market cash-out upon touching `+$20.00` floating profit.
* **Fleet-Wide Closed-M5 Stoch (15,2,5) Level 40/60 Loss Invalidation Exit:**
  The sensitive `"Stoch %K/%D Opposite Cross Early Exit"` has been completely abolished across all bots in the fleet. It is replaced by the calibrated Level 40/60 Invalidation rule, evaluated **STRICTLY when trade is in loss ($\text{currentPnl} < 0$) on confirmed closed M5 candle**:
  * **BUY trades in loss:** Exits immediately if Stoch (15,2,5) %K crosses below **60.0** (`prevK >= 60.0 && currK < 60.0`).
  * **SELL trades in loss:** Exits immediately if Stoch (15,2,5) %K crosses above **40.0** (`prevK <= 40.0 && currK > 40.0`).
  * **State Cleanup:** Triggers full broker contract liquidation, resets `state.openTrade = null`, and invokes `onTradeClosedCleanup(candles[si].epoch)`.
* **Runner Immunity & Oscillator Profit Exit Abolition:** 
  Trades in profit are immune to mid-trend oscillator exits. Oscillator boundary crosses are evaluated **STRICTLY as early loss invalidations when in adverse position ($\text{currentPnl} < 0$)**. Profitable positions are managed exclusively by the Tiered Dynamic Ratchet and macro trend invalidations (Stoch 200).

---

## 4. GOOGLE AI STUDIO DEPLOYMENT & REPOSITORY SYNC PROTOCOL

* **Direct AI Studio Push:** All code changes are committed from Google AI Studio and pushed using `scripts/sync-to-github.sh` and `scripts/auto-sync.sh`.
* **Zero Direct Server Edits:** Never edit code directly on live servers. Server daemons run `pull-trades.sh` every 5 minutes and overwrite direct server edits with origin main.

---

## 5. UNIVERSAL M5 EMA 100 DIRECTIONAL FILTER & CONTINUOUS RE-ENTRY ENGINE

* **Universal M5 EMA 100 Filter Across All 7 Bots:**
  * **BUY Orders (Initial & Re-Entry):** Strictly permitted **ONLY** when current M5 candle price is **ABOVE** M5 EMA 100 (`currentPrice > currentEma100`). If price is below or equal to EMA 100, BUY triggers are blocked.
  * **SELL Orders (Initial & Re-Entry):** Strictly permitted **ONLY** when current M5 candle price is **BELOW** M5 EMA 100 (`currentPrice < currentEma100`). If price is above or equal to EMA 100, SELL triggers are blocked.
  * **Live Engine Verification:** Both the continuous M5 slow-path scan and the immediate fast-path re-entry engine actively enforce this rule before placing any order.

* **Continuous Signal Search & Immediate Re-Entry Execution:**
  * While a trade is active, the engine continues evaluating every closed M5 candle to detect qualifying re-entry setups.
  * Qualifying setups are latched in `state.activeReentryOpportunity`.
  * The instant an active trade exits (via take profit, dynamic ratchet, or software SL), the fast-path watchdog executes `checkAndExecuteImmediateReentry()` immediately without waiting up to 5 minutes for the next candle boundary.

* **Fleet Monitor Re-Entry Mode Telemetry:**
  * When an initial trade has executed and closed, the bot transitions to **RE-ENTRY WATCH** status (`state.isReentryMode = true`).
  * If the market has not pulled back into the trigger zone, `state.armed` is explicitly `null` (not static "ARMED"), displaying `Awaiting Re-Entry Signal` (purple status).
  * When price enters the active pullback zone and aligns with EMA 100, `state.armed` engages with `type: "RE_ENTRY"`.

---

## 6. STRICT AI SYSTEM DISCIPLINE & CAPITAL PROTECTION MANDATE

> [!] **CRITICAL AI OPERATIONAL DIRECTIVE (LIVE CAPITAL SAFETY):**
> 1. **Zero Assumptions Policy:** The AI engineering engine must **NEVER make assumptions, extrapolate, or guess user intent** regarding trading rules, indicators, target engines, or strategy profiles. If any instruction is underspecified, ambiguous, or unclear, the AI MUST HALT execution and ask the trader for explicit clarification.
> 2. **Strict Instruction Adherence:** The AI must adhere 100% strictly to explicit user instructions. Do NOT add, remove, "optimize", or strip strategy components or target engines beyond what was explicitly requested.
> 3. **Real Capital Responsibility:** Acknowledging that live financial capital is at stake, all code modifications, indicator gates, and execution logic must undergo mandatory verification and strictly preserve system stability and capital safety.

---

## 7. FLEET-WIDE STOP & REVERSAL INVALIDATION ENGINE & IMMEDIATE REVERSAL PIVOT

### 7.1 Authoritative Specification Across All Applicable Bots

On confirmed closed M5 candle following entry (post-entry candle), if the Macro Trend Stochastic crosses opposite Level 50 AND the trigger Stochastic %K crosses %D in the opposite direction, the open trade **MUST CLOSE IMMEDIATELY** to truncate losses before hitting the full software stop loss.

| Bot Profile / Asset | Symbols | Macro Invalidation Condition | Oscillator Invalidation Condition | Immediate Reversal Action |
|---|---|---|---|---|
| **Stoch 200 / Stoch (15,2,5)** | `R_50` (OmniSight), `R_100` (Milk Machine) | BUY: Stoch 200 < 50.0<br>SELL: Stoch 200 > 50.0 | BUY: Stoch 15 %K < %D<br>SELL: Stoch 15 %K > %D | Liquidate trade immediately. Arm opposite direction (`reversalArmed`). Flip `trendDir`. Execute reversal on same M5 candle once Stoch 15 confirms across Level 50 & Price aligns with EMA 100. |
| **Stoch 200 / Stoch (15,2,5)** | `1HZ25V` (Ice Cream) | BUY: Stoch 200 < 50.0<br>SELL: Stoch 200 > 50.0 | BUY: Stoch 15 %K < %D<br>SELL: Stoch 15 %K > %D | Liquidate trade immediately. Clear `initialDone`, set `reversalArmed`. Execute reversal entry once Stoch 15 enters breakout zone (<= 25 SELL / >= 75 BUY) & Price aligns with EMA 100. |
| **Stoch 100 / Stoch (30,2,5)** | `1HZ75V` (Coffee), `R_25` (Tea Machine) | BUY: Stoch 100 < 50.0<br>SELL: Stoch 100 > 50.0 | BUY: Stoch 30 %K < %D<br>SELL: Stoch 30 %K > %D | Liquidate trade immediately. Reset `initialBuyDone` / `initialSellDone` to `false`. Flip `trendDir`. Execute reversal entry immediately once Stoch 30 crosses Level 50 & aligns with EMA 100. |
| **Stoch 200 / MACD / Stoch (5,3,3)** | `R_10` (Test Bot) | BUY: Stoch 200 < 50.0 OR MACD < 0.0<br>SELL: Stoch 200 > 50.0 OR MACD > 0.0 | BUY: Stoch 5,3,3 %K < %D<br>SELL: Stoch 5,3,3 %K > %D | Liquidate trade immediately. Reset initial entry flags. Arm opposite direction for immediate confluence reversal. |
| **EMA 100/200 / Stoch (15,2,5)** | `R_75` (Lery's Alerts) | BUY: Price closes < EMA 100<br>SELL: Price closes > EMA 100 | BUY: Stoch 15 %K < %D<br>SELL: Stoch 15 %K > %D | Liquidate trade immediately. Reset initial flags, arm opposite direction for fresh confluence entry. |

### 7.2 Same-Cycle Reversal Execution Protocol

1. **State Reset & Direction Flip:**
   * Upon invalidation liquidation, the bot executes `state.openTrade = null` and `onTradeClosedCleanup()`.
   * Directional lock flags (`initialEntryDone`, `initialBuyDone`, `initialSellDone`) are immediately cleared (`false`).
   * Main trend direction flips to the opposite side (`trendDir = isBuy ? "SELL" : "BUY"`).
   * Directional reversal arm flag engages (`reversalArmed = isBuy ? "SELL" : "BUY"`).
2. **Same-Candle Memory Refresh:**
   * Immediately following active trade exit evaluation, `runSlowPathScan` reloads `trades = loadTrades()` and recalculates `openTrades`.
   * Active entry gates evaluate `noActiveTrades = true` on the **exact same scan cycle**, allowing the bot to enter the reversal trade on the exact closed candle that confirmed the reversal without waiting 5 minutes.
3. **2-Opposing-Fractals Structural Reversal Exit (Double Top/Lower High on BUY, Double Bottom/Higher Low on SELL):**
   * **Scope:** `1HZ75V` (Coffee Machine), `R_25` (Tea Machine), `R_100` (Milk Machine), and `R_50` (OmniSight).
   * **Execution Watchdog:** Evaluated on every confirmed closed M5 candle strictly when in floating loss (`currentPnl < 0`) and not an active runner (`!isRunner`).
   * **BUY Trade Early Exit:** When the first two Swing High (Top) fractals formed at/after trade entry satisfy `F2 <= F1` (Lower High or Double Top within 0.05% tolerance). Confirms buyers failed to make a higher high and sellers have established resistance.
   * **SELL Trade Early Exit:** When the first two Swing Low (Bottom) fractals formed at/after trade entry satisfy `F2 >= F1` (Higher Low or Double Bottom within 0.05% tolerance). Confirms sellers failed to make a lower low and buyers have established support.
   * **Action:** Close position immediately at market to truncate adverse risk before hitting full software stop loss. Directional blocking flags are cleared to allow an immediate reversal pivot if opposite entry conditions align.
