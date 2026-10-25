# OMNISIGHT FLEET TRADE RULES COMPENDIUM
### Version 8.8 -- October 2026 Authoritative Trading Rules & Parameter Specification

---

## 1. FLEET ROSTER & STRATEGY MATRIX

All active trading bots operate with a standard **$5.00 Stake**, engineered for a **$100.00 Live Account Balance** to target **$7.00 Net Daily Profit per bot** ($49.00/day total fleet quota). Risk is strictly governed by a **-$2.00 Software Stop Loss** (-$4.00 on `R_100`; -$5.00 Hard Broker SL limit).

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Stake | Strategy Gate | Base TP ($3.50 Net) | Daily Strike TP | Calibrated Soft SL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | $5.00 | M5 EMA 100/200 2-Step Initial (50/50 Fresh Cross) & EMA 100 Touch Retracement (20/80) | 350.0 pts | 700.0 pts | -$2.00 |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.05 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (30,2,5) Level 50 Cross (±3 candles) + EMA 100 Filter + Stoch (15,2,5) 25/75 Re-Entry | 70.0 pts | 140.0 pts | -$2.00 |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Cross & Stoch (25,2,5) 65/35 Exit | 4.00 pts | 7.00 pts | -$4.00 |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | $5.00 | M5 Stoch 100 Trend + Stoch (30,2,5) Level 50 Cross (±3 candles) + EMA 100 Filter + Stoch (30,25,15) Re-Entry | 7.00 pts | 14.00 pts | -$2.00 |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | $5.00 | M5 Stoch 200 (45/55) + Stoch (15,2,5) (75/25) + EMA 100 Filter (Skip & Await Re-Entry) + Pullback Re-Entry (25/75) | 525.0 pts | 1050.0 pts | -$2.00 |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | $5.00 | M5 Stoch 200 (48/52) Trend + M5 Stoch (15,2,5) 50 Initial & 20/80 Re-Entry + Dynamic Runner | 0.88 pt | 1.75 pt | -$2.00 |
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
* **Runner Immunity & Oscillator Profit Exit Abolition:** 
  Trades in profit are immune to mid-trend oscillator exits. Closed-M5 Stoch (15,2,5) or Stoch (25,2,5) crossing level 50 opposite are evaluated **STRICTLY as early loss invalidations when in adverse position ($\text{currentPnl} < 0$)**. Profitable positions are managed exclusively by the Tiered Dynamic Ratchet and macro trend invalidations (Stoch 200).

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

## 7. STOCH 100 & STOCH 30 EARLY INVALIDATION EXIT & REVERSAL PIVOT ENGINE
### Authoritative Specification for Coffee Machine (`1HZ75V`) and Tea Machine (`R_25`)

1. **Adverse Trend & Stoch %K/%D Cross Invalidation:**
   * Evaluated on every confirmed closed M5 candle following entry, provided the position is not an active runner (`!isRunner`).
   * **BUY Trade Early Exit:** Triggered when closed M5 `Stoch (100, 1, 1) %K < 50.0` **AND** closed M5 `Stoch (30, 2, 5 Simple) %K < %D`.
   * **SELL Trade Early Exit:** Triggered when closed M5 `Stoch (100, 1, 1) %K > 50.0` **AND** closed M5 `Stoch (30, 2, 5 Simple) %K > %D`.
   * **Execution Action:** Position is closed immediately at market to cut adverse risk and protect account equity.

2. **Immediate Opposite Direction Execution (Reversal Pivot):**
   * The moment an adverse invalidation liquidation occurs, directional block flags (`initialBuyDone` / `initialSellDone`) are instantly reset to `false`.
   * If on that confirmed closed candle or subsequent candles, `Stoch (30, 2, 5 Simple) %K` crosses Level 50.0 and aligns with EMA 100 in the opposite direction within the 3-candle tolerance window (`<= 900s` from the Stoch 100 cross), the bot takes the opposite trade immediately.
   * Eliminates the scenario where an open losing position blocks the execution of a valid opposing market impulse.

3. **2-Opposing-Fractals Structural Reversal Exit (Double Top/Lower High on BUY, Double Bottom/Higher Low on SELL):**
   * **Scope:** `1HZ75V` (Coffee Machine), `R_25` (Tea Machine), and `R_100` (Milk Machine).
   * **Execution Watchdog:** Evaluated on every confirmed closed M5 candle strictly when in floating loss (`currentPnl < 0`) and not an active runner (`!isRunner`).
   * **BUY Trade Early Exit:** When the first two Swing High (Top) fractals formed at/after trade entry satisfy `F2 <= F1` (Lower High or Double Top within 0.05% tolerance). Confirms buyers failed to make a higher high and sellers have established resistance.
   * **SELL Trade Early Exit:** When the first two Swing Low (Bottom) fractals formed at/after trade entry satisfy `F2 >= F1` (Higher Low or Double Bottom within 0.05% tolerance). Confirms sellers failed to make a lower low and buyers have established support.
   * **Action:** Close position immediately at market to truncate adverse risk before hitting full software stop loss. Directional blocking flags are cleared to allow an immediate reversal pivot if opposite entry conditions align.
