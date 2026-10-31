# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 9.1 -- October 2026 Authoritative Trading Rules & Parameter Specification (Removal of Stoch %K/%D Opposite Cross Early Exit; Fleet-Wide Adoption of Closed-M5 Stoch (15,2,5) Level 40/60 Invalidation Exit in Loss; VIX 100 Hard Broker TP $10.00, Move SL to +$0.50 at $5.00 Profit)

---

## 1. FLEET ROSTER & STRATEGY MATRIX

All active trading bots operate with a standard **$5.00 Stake**, engineered for a **$100.00 Live Account Balance** to target **$7.00 Net Daily Profit per bot** ($49.00/day total fleet quota; $10.00 target for VIX 100). Risk is strictly governed by a **-$2.00 Software Stop Loss** (-$4.00 on `R_100`; -$5.00 Hard Broker SL limit).

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Gate | Base TP ($3.50 Net) | Daily Strike TP | Calibrated Soft SL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (15,1,1) Fresh Level 50 Cross Initial & Level 30/70 Re-Entry (incl. High/Low Wick Touch, No EMA Filter) + Standard TP $3.50 + Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit | 350.0 pts ($3.50 TP) | 700.0 pts | -$2.00 |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.05 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (15,1,1) Fresh Level 50 Cross Initial & Level 30/70 Re-Entry (incl. High/Low Wick Touch, No EMA Filter) + Standard TP $3.50 + Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit | 70.0 pts ($3.50 TP) | 140.0 pts | -$2.00 |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | M5 Stoch 100 Trend + Stoch (15,1,1) Fresh Level 50 Cross Initial & Level 30/70 Re-Entry (incl. High/Low Wick Touch, No EMA Filter) + Hard TP $10.00 + Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit | 10.00 pts ($10.00 TP) | 10.00 pts | -$4.00 |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (25,1,1) Level 50 Initial (+/-3 candles) & Level 10/90 Re-Entry + Hard TP $5.00 + Level 50 Touch Move SL to +$0.30 & Level 50 Reversal Immediate Exit | 10.00 pts ($5.00 TP) | 10.00 pts | -$3.50 |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (15,1,1) Fresh Level 50 Cross Initial & Level 20/80 Re-Entry (incl. High/Low Wick Touch, No EMA Filter) + M5 MACD (5,35,1) Re-Entry Filter (BUY blocked if MACD < 0, SELL blocked if MACD > 0) + Hard TP $10.00 + Level 80/20 Touch Move SL to +$0.30 & Level 50 Immediate Exit | 2000.0 pts ($10.00 TP) | 2000.0 pts | -$4.00 |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | M5 MACD (5,35,1) Level 0 Trend + Stoch (25,1,1) Level 50 Initial (+/-2 candles) & Level 10/90 Re-Entry + Hard TP $3.00 + Level 50 Touch Move SL to +$0.30 & Level 50 Reversal Immediate Exit | 0.75 pt ($3.00 TP) | 1.25 pt | -$2.50 |
| **Test Bot** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | $5.00 | M5 Stoch (50,1,1 Simple) Level 50 Trend + Stoch (25,1,1 Simple) Level 50 Initial (+/-2 candles) & Level 50 Re-Entry + Software TP $3.50 (Broker Hard TP $5.00) + Software SL -$3.50 (Broker Hard SL -$5.00) + Rule 1 Entry Candle High/Low Close Invalidation + Rule 2 Stoch 25 Extreme 80/20 Touch & Level 50 Reversal Exit + Position Flip | 7.00 pts ($3.50 Soft TP) | 10.00 pts ($5.00 Hard TP) | -$3.50 |

---

## 2. STRATEGY PROFILE RULES & INDICATOR MATRIX

* **Entry Execution Mandate:** Fibonacci Grid Touch/Crossover is **NOT REQUIRED FOR ENTRY** on any instrument in the fleet. Entries are governed strictly by calibrated M5 EMA, Stochastic, CCI, and MACD indicators as detailed in Section 1 and `HANDBOOK.md` Section 9.
* **Take Profit Target Mandate:** The Daily Fibonacci Grid (0%, 50%, 79%, 100%, -50%, 161.8%) serves as the technical **Take Profit Target Grid** for active trades, enforced with a minimum **$4.00 Net Take Profit Target Floor** ($7.00 Extended Target Alignment) and managed by the Two-Tier Dynamic Trailing Stop Ratchet + Closed-M5 Stoch (15, 2, 5) Midline Profit Exit when in profit.

---

## 3. UNIFIED CENTRALIZED TRADE MANAGEMENT & CAPITAL PROTECTION ENGINE

* **Universal Sequential 2-Step Trade Management Rule (Fleet Bots `R_100`, `1HZ25V`, `R_75`, `1HZ75V`, `R_50`, `R_10`):**
  1. **Rule 1 (Stoch (15,1,1) Level 80 / Level 20 Touch $\rightarrow$ +\$0.30 Software SL):** After a trade is opened, `Stoch (15,1,1)` must first move in the trade's direction and touch **Level 80 for BUY trades** (`>= 79.5`) or **Level 20 for SELL trades** (`<= 20.5`). At that point, the Software SL is moved to **+\$0.30** (`stoch15_touched_extreme = true`) and Rule 2 is unlocked.
  2. **Rule 2 (Immediate Exit on Level 50 Touch/Cross — Strictly Dependent on Rule 1):** **ONLY AFTER** Rule 1 has occurred (`stoch15_touched_extreme === true`), if `Stoch (15,1,1)` subsequently reverses from Level 80/20 and comes back to touch or cross **Level 50** (`<= 50.0` for BUY / `>= 50.0` for SELL), the bot **closes the trade immediately**.
* **V25 Sequential 2-Step Trade Management Rule (`R_25` — Tea Machine):**
  1. **Rule 1 (Stoch (25,1,1) Level 50 Touch $\rightarrow$ +\$0.30 Software SL):** After a trade is opened, when in profit and `Stoch (25,1,1)` touches/reaches **Level 50** (`>= 50.0` for BUY / `<= 50.0` for SELL on confirmed closed M5 candle), move Software SL to **+\$0.30** (`stoch25_touched_midline = true`) and unlock Rule 2.
  2. **Rule 2 (Immediate Exit on Level 50 Reversal — Strictly Dependent on Rule 1):** **ONLY AFTER** Rule 1 has occurred (`stoch25_touched_midline === true`), if `Stoch (25,1,1)` subsequently reverses across **Level 50** (`< 50.0` for BUY / `> 50.0` for SELL), the bot **closes the trade immediately**.
* **Software Stop Loss (-$2.00 on `R_75`, `1HZ75V`, `R_10` / -$2.50 on `R_50` / -$3.50 on `R_25` / -$4.00 on `R_100`, `1HZ25V`):** Strict account capital risk limit. Executed in 2-second fast-path watchdog.
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
| **Stoch 200 / Stoch (15,2,5)** | `R_50` (OmniSight) | BUY: Stoch 200 < 50.0<br>SELL: Stoch 200 > 50.0 | BUY: Stoch 15 %K < %D<br>SELL: Stoch 15 %K > %D | Liquidate trade immediately. Arm opposite direction (`reversalArmed`). Flip `trendDir`. Execute reversal on same M5 candle once Stoch 15 confirms across Level 50 & Price aligns with EMA 100. |
| **Stoch 100 / Stoch (25,1,1)** | `R_25` (Tea Machine) | BUY: Stoch 100 < 50.0<br>SELL: Stoch 100 > 50.0 | Hard TP: $5.00<br>BUY: Touch Level 50 moves SL to +$0.30; exit < 50<br>SELL: Touch Level 50 moves SL to +$0.30; exit > 50 | Downside protected by Software SL (-$3.50) / Hard Broker SL (-$5.00). Hard TP $5.00. Rule 1: Once Level 50 touched in profit, Software SL locked at +$0.30. Rule 2: Immediate exit on Level 50 reversal. Opposite Signal Position Flip. |
| **MACD (5,35,1) / Stoch (25,1,1)** | `R_50` (OmniSight) | BUY: MACD (5,35,1) < 0.0<br>SELL: MACD (5,35,1) > 0.0 | Hard TP: $3.00<br>BUY: Touch Level 50 moves SL to +$0.30; exit < 50<br>SELL: Touch Level 50 moves SL to +$0.30; exit > 50 | Downside protected by Software SL (-$2.50) / Hard Broker SL (-$5.00). Hard TP $3.00. Rule 1: Once Level 50 touched in profit, Software SL locked at +$0.30. Rule 2: Immediate exit on Level 50 reversal. Opposite Signal Position Flip. |
| **Stoch 100 / Stoch (15,1,1)** | `R_100` (Milk Machine), `R_75` (Lery's Alerts) & `1HZ75V` (Coffee Machine) | BUY: Stoch 100 < 50.0<br>SELL: Stoch 100 > 50.0 | TP: $10.00 (`R_100`) / $3.50 (`R_75`, `1HZ75V`)<br>BUY: Touch 80 moves SL to +$0.30; exit < 50<br>SELL: Touch 20 moves SL to +$0.30; exit > 50 | Downside protected by Software SL (-$4.00 `R_100`, -$2.00 `R_75`/`1HZ75V`). Hard TP $10.00 on `R_100`, $3.50 on `R_75`/`1HZ75V`. Re-Entry uses 30 (BUY) / 70 (SELL). Rule 1: Once 80 (BUY) / 20 (SELL) touched, Software SL locked at +$0.30. Rule 2: Immediate exit when Stoch (15,1,1) crosses opposite 50. |
| **Stoch 100 / Stoch (15,1,1) + MACD Filter** | `1HZ25V` (Ice Cream Machine) | BUY: Stoch 100 < 50.0<br>SELL: Stoch 100 > 50.0 | TP: $10.00<br>BUY: Touch 80 moves SL to +$0.30; exit < 50<br>SELL: Touch 20 moves SL to +$0.30; exit > 50 | Downside protected by Software SL (-$4.00) / Hard Broker SL (-$5.00). Hard TP $10.00. Re-Entry uses 20 (BUY) / 80 (SELL) + M5 MACD (5,35,1) filter (BUY blocked if MACD < 0, SELL blocked if MACD > 0). Rule 1: Once 80 (BUY) / 20 (SELL) touched, Software SL locked at +$0.30. Rule 2: Immediate exit when Stoch (15,1,1) crosses opposite 50. |
| **Stoch (50,1,1) / Stoch (25,1,1)** | `R_10` (Test Bot) | BUY: Stoch 50 < 50.0<br>SELL: Stoch 50 > 50.0 | Soft TP: $3.50 (Broker Hard TP: $5.00)<br>Rule 1: Software SL if M5 candle closes against entry candle High/Low<br>Rule 2: Touch 80 (BUY) / 20 (SELL) and reverse across Level 50 -> Exit | Downside protected by Software SL (-$3.50) / Hard Broker SL (-$5.00). Software TP $3.50 / Hard Broker TP $5.00. Rule 1: Software SL if M5 candle closes against entry candle High/Low. Rule 2: Stoch (25,1,1) touches Level 80 (BUY) / Level 20 (SELL) and reverses across Level 50. Opposite Signal Position Flip. |
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
