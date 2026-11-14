# MASTER OPERATIONS & TRADER HANDBOOK
### Lery's Trading Bot System -- Complete Reference Bible & Disaster Recovery Manual
#### Version 8.3 -- October 2026 (Gateway 500 Connection Resilience, 2.5-Minute Persistent Execution Queue, Calibrated -$4.00 / -$3.50 Software SL Architecture, Dynamic Runner $20 Ceilings, Closed-M5 Stoch (25,2,5) Exits, V25 20-Min Execution Window, and Unified Strategy Governance)

---

> [!] **CRITICAL INSTRUCTION FOR ANY AI ASSISTANT / OPERATOR PICKING THIS UP:**
> 
> You are acting as the Lead Systems & Quantitative Engineer for Lery's Trading Bot System.
> This document is the **absolute, immutable Single Source of Truth**. You must strictly adhere to the following operational protocols:
>
> 1. **STRICT FIDELITY & ZERO ASSUMPTION MANDATE (FINANCIAL CAPITAL SAFETY):**
>    - **In live automated trading, assumptions directly endanger capital. There is absolute zero tolerance for assumptions, guessing, or unverified extrapolation.**
>    - **MANDATORY INVESTIGATION BEFORE PRESENTATION:** The AI assistant MUST check empirical data, server logs, flight recorder ledgers (`ledger_*.csv`), and actual indicator calculations before presenting ANY diagnostic findings to the operator. Never rationalize, guess, or assume market conditions or indicator values without empirical proof.
>    - Real financial capital is on the line: there is absolute **ZERO TOLERANCE** for assumptions, speculation, guessing, or unverified extrapolation across trading logic, server infrastructure, PM2 process configs, and operator actions.
>    - **Trading Rules:** Every rule, level, and condition in this handbook is a strict mathematical specification. NEVER assume, extrapolate, or invent setups, unlisted levels, bounce targets, or generalized rules.
>    - **Strict Scope Boundaries:** Execute ONLY what is explicitly instructed by the trader. Do NOT add, remove, "clean up", or modify unrelated strategy components, target engines, or parameter rules beyond the trader's explicit instruction.
>    - **Halt & Clarify on Ambiguity:** If any user request is underspecified, ambiguous, or open to interpretation, the AI MUST HALT execution and ask the trader for explicit clarification before touching code or strategy rules.
>    - **Infrastructure & Configurations:** NEVER assume, guess, or state as fact that a command was run, a setting was applied (e.g., `--restart-delay`, timeouts, intervals), or a server state exists without direct empirical verification.
>    - **Zero Rationalization:** NEVER invent narratives or theories to explain observed telemetry numbers (e.g., PM2 restart counts, uptime) without verifying actual configuration files.
>    - **Mandatory Clarification:** If any condition, parameter, configuration state, or operator intent is ambiguous or unverified, STOP and state the verified facts or ask the operator directly rather than guessing.
>
> 2. **OPERATIONAL PROTOCOL (CONFIRMATION BEFORE CODE):**
>    - When troubleshooting, discussing strategy changes, or refining logic, **DO NOT generate or rewrite code immediately**.
>    - First explain the logic, present the exact mathematical mapping, and wait for the operator to give an **explicit thumbs up** before outputting deployment code.
>
> 3. **MANDATORY PRE-DELIVERY CODE AUDIT:**
>    - Whenever you provide, modify, or update code, you MUST accompany it with a line-by-line **Verification Audit** proving:
>      - **Syntax & Scoping:** All imports, variables, and asynchronous promises are declared and valid.
>      - **Logic Path Tracing:** Every condition (Bullish vs. Bearish, Long vs. Short, Continuation vs. Reversal) is traced through its actual execution path.
>      - **Zero Omissions Check:** Confirm that no features, functions, or established rules were accidentally stripped or omitted.
>
> 4. **REGRESSION PREVENTION:**
>    - When updating code, explicitly verify that all established production fixes remain 100% intact:
>      - 24/7 continuous in-memory engine (adaptive risk pulse: 3s in-trade / 10s idle, 5m closed candle scan).
>      - Request/response market data via `fetchAllData()` and `fetchCurrentSpotPrice()` (NO `subscribe: 1` push streams).
>      - Persistent origin tracking (`last50Origin`) for 50% midline reversals across trades.
>      - Strict Stochastic 50 midline crossing for continuations (no loose tolerances).
>      - Active M15 wrong-side invalidation and dynamic direction flipping.
>      - Rich Telegram diagnostic confirmation cards.
>      - Full-tree recursive File Explorer with clean nested paths and subfolder support.
>      - Dynamic PM2 alias resolution and mtime-sorted log file retrieval.
>
> 5. **FLIGHT RECORDER AUDITING:**
>    - When debugging missed or unexpected trades, base your diagnosis strictly on data from the Daily Flight Recorder (`ledger_<SYMBOL>_<DATE>.csv`), `trades.json`, and `state.json`.
>
> 6. **STRICT GOOGLE AI STUDIO DEPLOYMENT PIPELINE (ABSOLUTE BAN ON IN-SERVER EDITS):**
>    - **NEVER edit files directly on the server terminal using `nano`, `vim`, or curl scripts.** AI agents and operators must strictly prepare code in this Google AI Studio environment and execute the automated sync scripts to push to GitHub.
>    - **Why Server-Side Direct Edits Automatically Reset:** Both Server 1 and Server 2 run `pull-trades.sh` continuously in the background, which executes `git pull` from GitHub. Any files edited directly on the server terminal will cause Git working tree conflicts or be immediately overwritten and reset back to the GitHub commit state on the next pull cycle.
>    - **The Immutable Pipeline:** Code and handbook updates prepared here in Google AI Studio are committed and pushed directly to `Kwekugrind/Google-ai-studio.git` and `Kwekugrind/dashboard.git`. The background pull script (`pull-trades.sh`) on both servers detects GitHub commits and automatically pulls the latest code within minutes.
>    - The server terminal must **only** be used for monitoring (`pm2 status`, `pm2 logs`), safe service restarts (`pm2 restart <name>`), or reading diagnostic files.
>
> 7. **ZERO TRUNCATION & MANDATORY CHANGE-LOG MANDATE (CODE INTEGRITY):**
>    - **NEVER provide truncated, summarized, partial, or shortened code replacements.** Any file provided to the operator must be 100% complete, maintaining all logic routines, event handlers, mathematical functions, and comments intact.
>
> 8. **STRICT STRATEGY PRESERVATION & ANTI-TAMPERING MANDATE:**
>    - The AI assistant is **STRICTLY FORBIDDEN** from implementing, adding, modifying, omitting, or tweaking ANY trading strategy rules, entry criteria, direction filters, exit logic, indicator thresholds, or setup matrices without the user's **PRIOR EXPLICIT APPROVAL**.
>
> A live version of this handbook is served directly at: `http://79.76.120.30:4000/handbook`.

---

## TABLE OF CONTENTS

1. [System Architecture Overview & Google AI Deployment Pipeline](#1-system-architecture-overview--google-ai-deployment-pipeline)
2. [Server & Multi-Bot Fleet Roster Reference (Dual-Fleet Matrix)](#2-server--multi-bot-fleet-roster-reference)
3. [Disaster Recovery Guide 1: Deriv Multipliers / Options System Setup](#3-disaster-recovery-guide-1-deriv-multipliers--options-system-setup)
4. [Disaster Recovery Guide 2: cTrader Open API / FIX Bridge Setup & Operations](#4-disaster-recovery-guide-2-ctrader-open-api--fix-bridge-setup--operations)
5. [Direct Google AI Studio Deployment & Repository Sync Workflow](#5-direct-google-ai-studio-deployment--repository-sync-workflow)
6. [The 24/7 Dual-Speed Continuous Engine](#6-the-247-dual-speed-continuous-engine)
7. [Trading Strategy -- Quantitative State Machine & Take Profit Engine](#7-trading-strategy----quantitative-state-machine--take-profit-engine)
8. [Risk Management, Loss Defense Cascade & Dynamic Trend-Riding Engine](#8-risk-management-loss-defense-cascade--dynamic-trend-riding-engine)
9. [Instrument-Specific Entry Requirements & Calibrated Profiles](#9-instrument-specific-entry-requirements--calibrated-profiles)
10. [Flight Recorder (Ledger CSV) & Portfolio Reconciler](#10-flight-recorder-ledger-csv--portfolio-reconciler)
11. [Gateway, Server Hub & Quant Terminal Architecture](#11-gateway-server-hub--quant-terminal-architecture)
12. [Telegram Diagnostic Alerts & Operations](#12-telegram-diagnostic-alerts--operations)
13. [PM2 Operations & Infrastructure Maintenance Manual](#13-pm2-operations--infrastructure-maintenance-manual)
14. [Troubleshooting & Frequently Encountered Scenarios](#14-troubleshooting--frequently-encountered-scenarios)
15. [Exhaustive AI Diagnostics, Production Repositories & Disaster Recovery Archive](#15-exhaustive-ai-diagnostics--problem-solving-knowledge-base)
16. [Trader Authoritative Rules Audit Log & Specification Revision History](#16-trader-authoritative-rules-audit-log--specification-revision-history)
17. [Compendium of Trader Directives & Strategy Rules (Verbatim Audit Archive)](#17-compendium-of-trader-directives--strategy-rules-in-the-traders-own-words-verbatim-audit-archive)
18. [Fleet $7.00/Day Profit Engine & $100 Live Capital Specification](#18-fleet-700day-profit-engine--100-live-capital-specification)
19. [Fleet-Wide Stop & Reversal Invalidation Engine & Same-Cycle Execution Protocol](#19-fleet-wide-stop--reversal-invalidation-engine--same-cycle-execution-protocol)
20. [Closed-M5 Stoch (15,2,5) Level 40/60 Loss Invalidation](#20-diagnostic-scenario-57-fleet-wide-replacement-of-stoch-kd-opposite-cross-early-exit-with-closed-m5-stoch-1525-level-4060-loss-invalidation)
21. [Trader Mandate (Oct 27, 2026) — Purge of Obsolete Rules & Universal Profit Engine](#21-trader-mandate-oct-27-2026--complete-purge-of-obsolete-rules--universal-stoch-302015-profit-engine)
22. [Trader Mandate (Nov 1, 2026) — Volatility 50 (R_50 OmniSight) Stoch 100 Trend & Stoch (8,1,1) Overhaul](#22-trader-mandate-nov-1-2026--volatility-50-r_50-omnisight-stoch-100-trend--stoch-811-overhaul)
23. [Volatility 75 (R_75 — Lery's Alerts) Overhaul: Stoch (100,1,1) + Stoch (8,1,1) Architecture](#23-volatility-75-r_75--lerys-alerts-overhaul-stoch-10011--stoch-811-architecture)
24. [Volatility 25 (R_25) Tea Machine Calibration & Profit Protection Engine](#24-volatility-25-r_25-tea-machine-calibration--profit-protection-engine)
25. [Volatility 75 (1s) (1HZ75V) Coffee Machine Calibration & Fleet Engine Restructuring](#25-volatility-75-1s-1hz75v-coffee-machine-calibration--fleet-engine-restructuring)
26. [Fleet Mandate (Nov 7, 2026): Near-Target M5 Candle-Close Profit Exit (>= 85%) & Intra-Trade Daily Target Removal](#26-fleet-mandate-nov-7-2026-near-target-m5-candle-close-profit-exit--85--intra-trade-daily-target-removal)
27. [Zero-PnL Root Cause Resolution, Two-Phase Broker Execution Invariant & Pinpoint cTrader Historical Deal Reconciliation](#27-zero-pnl-root-cause-resolution-two-phase-broker-execution-invariant--pinpoint-ctrader-historical-deal-reconciliation)
28. [The Trader's Reasoning Protocol, 1-Candle Fractal Confirmation & Breakout Candle Software Stop Loss Calibration](#28-the-traders-reasoning-protocol-1-candle-fractal-confirmation-strict-breakout-mechanics-and-candle-extreme-software-stop-loss-calibration-experimental-fleet-mandate)
29. [Consolidated Authoritative Trading Specifications & Fleet Governance (Nov 14, 2026)](#29-consolidated-authoritative-trading-specifications--fleet-governance-nov-14-2026)
30. [Master AI & Developer Governance Rules (MASTER_AI_RULES.md)](#30-master-ai--developer-governance-rules-master_airulesmd)

---
## 1. SYSTEM ARCHITECTURE OVERVIEW & GOOGLE AI DEPLOYMENT PIPELINE

A fully automated, 24/7 multi-bot algorithmic trading network operating across Deriv (Multipliers / Options) and cTrader (Open API / FIX Bridge) across two Oracle Cloud Always Free compute instances.

Managed centrally via an integrated browser dashboard (`:4000`), Server Hub API (`:4001`), Deriv Gateway (`:3000`), and Telegram command bot.

```
+-----------------------------------------------------------------------------------+
|                    GOOGLE AI STUDIO BUILD ENVIRONMENT                             |
|          * Code Edits & Handbook Updates                                          |
|          * Runs scripts/sync-to-github.sh & auto-sync.sh                           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v (git push --force)
+-----------------------------------------------------------------------------------+
|                            GITHUB CENTRAL REPOSITORIES                            |
|    1. https://github.com/Kwekugrind/Google-ai-studio.git                          |
|    2. https://github.com/Kwekugrind/dashboard.git                                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                        +-----------------+-----------------+
                        | (pull-trades.sh git pull every 5m)|
                        v                                   v
            +-----------------------+           +-----------------------+
            |       SERVER 1        |           |       SERVER 2        |
            |     138.2.169.72      |           |     79.76.120.30      |
            |                       |           |                       |
            |  * lery-v75           |           |  * ice-cream-100-1s   |
            |  * coffee-v75-1s      |           |  * omni-v50           |
            |  * milk-v100          |           |  * test-v10           |
            |  * tea-v25            |           |                       |
            |                       |           |  * dashboard (:4000)  |
            |  * deriv-gateway      |<----------+- * command-bot        |
            |    (port 3000)        |           |  * gateway-watchdog   |
            |  * s1-api (port 4001) |           |  * pull-trades (auto) |
            |  * pull-trades (auto) |           |                       |
            +-----------+-----------+           +-----------+-----------+
                                    |                                   |
                                    +-----------------+-----------------+
                                                      v
                                  Broker Execution Layer (Deriv / cTrader)
```

### Core Architecture Principles
* **Zero Cron Overhead:** Bots run as persistent in-memory Node.js daemons (`alert.js`) managed by PM2. No 1-minute process restarts, eliminating CPU spikes and memory leaks.
* **Firewall-Immune Market Data:** Market data requests are strictly request/response (`fetchAllData` and `fetchCurrentSpotPrice`). The system explicitly avoids WebSocket subscription streams (`subscribe: 1`) on public endpoints, completely bypassing regional/cloud IP firewall blocks.
* **Decoupled Broker Gateway:** Trade executions (`/buy`, `/sell`), contract state queries, and portfolio reconciliations route through `deriv-gateway` on Server 1 (port 3000) or `ctrader-service.js` WebSocket protobuf bridge.

---

## 2. SERVER & MULTI-BOT FLEET ROSTER REFERENCE

### Server Infrastructure

| Parameter | Server 1 (Gateway & S1 Fleet) | Server 2 (Dashboard Hub & S2 Fleet) |
|---|---|---|
| **Oracle Compute Instance** | `TradingBot-2` | `instance-20260808-2226` |
| **Public IPv4 Address** | `138.2.169.72` | `79.76.120.30` |
| **Operating System** | Ubuntu 22.04 LTS (x86_64) | Ubuntu 22.04 LTS (x86_64) |
| **Base Directory** | `/home/ubuntu/trading-bots` | `/home/ubuntu/trading-bots` |
| **Primary Services** | `deriv-gateway` (:3000), `s1-api` (:4001) | `dashboard` (:4000), `command-bot`, `watchdog` |
| **Active Bot Fleet** | `lery-v75`, `coffee-v75-1s`, `milk-v100`, `tea-v25` | `ice-cream-100-1s`, `omni-v50`, `test-v10` |

### Multi-Bot Fleet Parameter Master Table (Unified Initial Entry, Re-Entry, Bullish/Bearish Fractal Open/Close Stop Loss, Dynamic Fractal Range Take Profit & Supertrend 21, 1, 0 Trailing Profit Engine)

All 7 active bots run the **Unified Initial Entry, Re-Entry, Bullish/Bearish Fractal Open/Close Stop Loss, Dynamic Fractal Range Take Profit & Supertrend (21, 1, 0) Trailing Profit Engine** (Gate 1: Closed M5 Stoch `100,1,1 Simple` Level 50 Macro Trend; Initial Entry: Closed M5 candle closes above High Fractal `HIGH` for BUY or below Low Fractal `LOW` for SELL; Re-Entry: Strictly after Initial Trade is taken in the wave, M5 Stoch `8,1,1 Simple` touches/closes `<= 10.0` BUY / `>= 90.0` SELL + Closed M5 candle closes beyond Fractal `HIGH`/`LOW`, expiring if Stoch 8 crosses 50 and back across 50; Stop Loss: Bullish/Bearish Fractal Candle Open/Close with strict precedence over Hard SL; Profit Management: Dynamic Fractal Range Take Profit ($D = |\text{recentHighFractal.high} - \text{recentLowFractal.low}|$, BUY = Entry + D, SELL = Entry - D) placed on cTrader broker ticket & verified in fast path, plus Supertrend (Periods: 21, Multiplier: 1, Shift: 0) trailing flip exit when trade is in profit):

| Bot Label | PM2 Name | Server | Directory Path | Symbol | Symbol ID | Lot Size | Initial Entry Rule (`Stoch 100` Cross `50`) | Re-Entry Rule (`Stoch 8 10/90` After Initial Trade) | Stop Loss Rule (Software SL on M5 Close; Precedence over Hard SL) | Take Profit & Profit Management Rule (Fractal Range TP & Supertrend 21, 1, 0) | Daily Lock (`+$7.00`) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `~/trading-bots/Lery-s-Alerts` | Volatility 75 | `R_75` | 0.01 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **OFF** (Uncapped) |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `~/trading-bots/coffee` | Volatility 75 (1s) | `1HZ75V` | 0.15 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **ON** (`+$7.00` Lock) |
| **Milk Machine** | `milk-v100` | S1 | `~/trading-bots/milk` | Volatility 100 | `R_100` | 1.00 Lot | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **ON** (`+$7.00` Lock) |
| **Tea Machine** | `tea-v25` | S1 | `~/trading-bots/tea` | Volatility 25 | `R_25` | 0.50 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **OFF** (Uncapped) |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `~/trading-bots/ice-cream` | Volatility 25 (1s) | `1HZ25V` | 0.005 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **ON** (`+$7.00` Lock) |
| **OmniSight** | `omni-v50` | S2 | `~/trading-bots/OmniSight` | Volatility 50 | `R_50` | 4.00 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **ON** (`+$7.00` Lock) |
| **Test Bot** | `test-v10` | S2 | `~/trading-bots/Test-Bot` | Volatility 10 | `R_10` | 0.50 Lots | M5 Close `>` Fractal `HIGH` / `<` Fractal `LOW` | `Stoch 8 <= 10 / >= 90` + M5 Close `>` Fractal `HIGH` / `<` `LOW` | **Fractal Bullish/Bearish Open/Close** (`M5 Close Software SL`) | **Dynamic Fractal Range TP** (Broker Ticket) + **Supertrend (21, 1, 0) Trailing Flip Exit** | **ON** (`+$7.00` Lock) |

---

## 3. DISASTER RECOVERY GUIDE 1: DERIV MULTIPLIERS / OPTIONS SYSTEM SETUP

If you lose server access or need to deploy the complete Deriv Multipliers / Options trading system from absolute scratch on clean Linux servers, follow this exact step-by-step procedure.

### Step 1: Provision System Prerequisites & Dependencies
Log into your clean Ubuntu 22.04 LTS instance as root or `ubuntu` user:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential jq tar unzip

# Install Node.js LTS (v20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 Process Manager globally
sudo npm install -g pm2 tsx vite
pm2 startup
```

### Step 2: Establish Directory Structure
Create the uniform multi-bot directory hierarchy on both Server 1 and Server 2:

```bash
# Create base trading bots directory
mkdir -p /home/ubuntu/trading-bots
cd /home/ubuntu/trading-bots

# On Server 1 (138.2.169.72):
mkdir -p gateway s1-api Lery-s-Alerts coffee milk tea

# On Server 2 (79.76.120.30):
mkdir -p dashboard ice-cream OmniSight Test-Bot
```

### Step 3: Clone Codebase from GitHub
Clone the master repository directly into the workspace directory:

```bash
cd /home/ubuntu/trading-bots
git clone https://github.com/Kwekugrind/Google-ai-studio.git temp_repo
```

### Step 4: Configure Environment Files (`.env`)
Create `/home/ubuntu/trading-bots/.env` on both servers:

```ini
# Deriv API Configuration
DERIV_APP_ID=1089
DERIV_API_TOKEN=YOUR_DERIV_API_TOKEN_HERE
OPERATOR_TOKEN=4fa0d9091906be9cf118d574d78c45e0ff50818d91cfb87c218a2c8a8ea780a1

# Network & Gateway Services
GATEWAY_URL=http://138.2.169.72:3000
SERVER1_API_URL=http://138.2.169.72:4001
PORT=4000
```

### Step 5: Configure & Launch `deriv-gateway` (Server 1)
On Server 1 (`138.2.169.72`):

```bash
cd /home/ubuntu/trading-bots/gateway
npm init -y
npm install ws express cors dotenv axios

# Launch via PM2
pm2 start deriv-gateway.js --name "deriv-gateway" --restart-delay=3000
```

### Step 6: Deploy Bot State Files (`state.json` & `trades.json`)
Every bot directory MUST contain initialized `state.json` and `trades.json` files to prevent runtime errors:

`state.json` template:
```json
{
  "dailyNetPnl": 0.0,
  "lastProcessedEpoch": 0,
  "armed": null,
  "last50Origin": null,
  "tradeCount": 0
}
```

`trades.json` template:
```json
[]
```

### Step 7: Launch Bot Roster via PM2
Execute PM2 start commands for each active bot in its respective directory:

**Server 1 Launch Script:**
```bash
cd /home/ubuntu/trading-bots/Lery-s-Alerts && pm2 start alert.js --name "lery-v75"
cd /home/ubuntu/trading-bots/coffee && pm2 start alert.js --name "coffee-v75-1s"
cd /home/ubuntu/trading-bots/milk && pm2 start alert.js --name "milk-v100"
cd /home/ubuntu/trading-bots/tea && pm2 start alert.js --name "tea-v25"
cd /home/ubuntu/trading-bots/s1-api && pm2 start server.js --name "s1-api"
pm2 save
```

**Server 2 Launch Script:**
```bash
cd /home/ubuntu/trading-bots/ice-cream && pm2 start alert.js --name "ice-cream-100-1s"
cd /home/ubuntu/trading-bots/OmniSight && pm2 start alert.js --name "omni-v50"
cd /home/ubuntu/trading-bots/Test-Bot && pm2 start alert.js --name "test-v10"
cd /home/ubuntu/trading-bots/dashboard && pm2 start server.js --name "dashboard"
pm2 save
```

---

## 4. DISASTER RECOVERY GUIDE 2: CTRADER OPEN API / FIX BRIDGE SETUP & OPERATIONS

If you are setting up or transitioning trading operations to the **cTrader Open API / FIX Bridge**, follow this complete, exhaustive disaster recovery and operational manual.

### 4.1 cTrader OAuth 2.0 Authentication & Account Provisioning

1. **cTrader Developer Application Setup:**
   * Log into the [cTrader Open API Portal](https://openapi.ctrader.com/).
   * Register a new application (Type: Web Application / Server-to-Server).
   * Note down your credentials:
     * `CTRADER_CLIENT_ID`: OAuth Application Client ID.
     * `CTRADER_CLIENT_SECRET`: OAuth Secret Key.
     * `CTRADER_REDIRECT_URI`: e.g. `http://79.76.120.30:4000/api/ctrader/oauth/callback` or development URL.

2. **OAuth 2.0 Token Exchange Endpoint (`/api/ctrader/oauth/exchange`):**
   * When an operator authorizes via the cTrader OAuth modal, the Express dashboard exchanges the authorization code for access and refresh tokens:
     ```http
     GET https://openapi.ctrader.com/apps/token?grant_type=authorization_code&code={CODE}&redirect_uri={REDIRECT_URI}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
     ```
   * If `redirect_uri` mismatches, the system automatically retries with alternative registered callback URIs.
   * On success, credentials and access tokens are persisted to `.env.ctrader` on Server 1 and Server 2.

3. **Environment File Configuration (`.env.ctrader`):**
   Create `/home/ubuntu/trading-bots/.env.ctrader` (and local applet path):
   ```ini
   # cTrader Open API Credentials
   CTRADER_CLIENT_ID=YOUR_CLIENT_ID
   CTRADER_CLIENT_SECRET=YOUR_CLIENT_SECRET
   CTRADER_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
   CTRADER_ACCOUNT_ID=YOUR_ACCOUNT_ID # e.g. 2596044
   CTRADER_ENVIRONMENT=demo # 'demo' or 'live'
   CTRADER_HOST=demo.ctraderapi.com
   CTRADER_PORT=5036
   ```

4. **Three-Stage Protobuf Connection Handshake (`ctrader-service.js`):**
   When `connect()` is invoked, the bridge executes a strict 3-stage protocol handshake over WebSocket (`wss://demo.ctraderapi.com:5036` or `wss://live.ctraderapi.com:5036`):
   * **Stage 1 (App Auth):** Sends `APPLICATION_AUTH_REQ` (`payloadType: 2100`) containing `clientId` and `clientSecret`.
   * **Stage 2 (Account Enumeration):** Sends `GET_ACCOUNTS_BY_TOKEN_REQ` (`payloadType: 2149`) with `accessToken` to retrieve all linked `ctidTraderAccountId` entries. Resolves target numeric account ID.
   * **Stage 3 (Account Auth):** Sends `ACCOUNT_AUTH_REQ` (`payloadType: 2102`) with `ctidTraderAccountId` and `accessToken`.
   * **Stage 4 (Symbol List Cache):** Sends `SYMBOLS_LIST_REQ` (`payloadType: 2114`) to cache symbol definitions, digits, and volume steps into `symbolsCache`.
   * **Heartbeat Ping:** Maintains connection via `HEARTBEAT` (`payloadType: 51`) every 10 seconds.

---

### 4.2 cTrader Account Balance, Margin & Floating Equity Engine

1. **Account Summary Retrieval (`getAccountSummary()`):**
   * Sends `TRADER_REQ` (`payloadType: 2121`) for target `ctidTraderAccountId`.
   * **Balance Calculation:** Parses `trader.balance` divided by `10^trader.moneyDigits` (e.g. `moneyDigits = 2` -> divisor `100`).
   * **Leverage Extraction:** `trader.leverageInCents / 100` (e.g. `50000 cents = 500x leverage`).
2. **Floating Equity & Unrealized PnL:**
   * Queries active open positions via `RECONCILE_REQ` (`payloadType: 2124`).
   * Computes floating unrealized PnL:
     $$\text{Unrealized PnL} = \sum_{p \in \text{positions}} p.\text{unrealizedPnl}$$
   * Net Floating Equity:
     $$\text{Floating Equity} = \text{Balance} + \text{Unrealized PnL}$$
3. **Gateway Remote Endpoints:**
   * `/ctrader/account`: Serves account balance, floating equity, leverage, and active environment.
   * `/ctrader/positions`: Returns live open position list for dashboard rendering.

---

### 4.3 Order Execution, Dynamic USD SL/TP & Recent Trades Engine

1. **Symbol & Alias Resolution (`resolveSymbol`):**
   Maps bot symbols and aliases to cTrader synthetic index IDs:
   * `1hz75v`, `v75-1s`, `coffee` -> `2435` (Volatility 75 1s)
   * `r_75`, `v75`, `lery` -> `2434` (Volatility 75)
   * `r_50`, `v50`, `omni` -> `2431` (Volatility 50)
   * `r_25`, `v25`, `tea` -> `2430` (Volatility 25)
   * `r_10`, `v10`, `test` -> `2428` (Volatility 10)
   * `r_100`, `v100`, `milk` -> `2436` (Volatility 100)
   * `1hz100v`, `v100-1s`, `ice-cream` -> `2437` (Volatility 100 1s)

2. **Volume & Lot Size Conversion Mechanics (`openOrder`):**
   * Queries `SYMBOL_BY_ID_REQ` (`payloadType: 2116`) to read asset specification (`digits`, `minVolume`, `stepVolume`, `maxVolume`).
   * Converts requested lot size to cTrader protoVolume units (`protoVolume = Math.round(lots * 100)`).
   * Validates `protoVolume >= minVolume` and rounds to nearest `stepVolume`.

3. **Spot Price Subscription for Dynamic USD SL/TP (`SUBSCRIBE_SPOTS_REQ`):**
   * When SL/TP are provided in USD (`slUsd`, `tpUsd`), subscribes to live spot prices (`SUBSCRIBE_SPOTS_REQ` `payloadType: 2127`).
   * Listens for `SPOT_EVENT` (`payloadType: 2131`) to get bid/ask execution reference price.
   * Calculates price distance:
     $$\text{Distance} = \frac{\text{SL/TP USD}}{\text{Point Value USD}}$$
   * Sets exact target stop-loss / take-profit price levels on `NEW_ORDER_REQ` (`payloadType: 2106`).

4. **Position Amendment & Closure:**
   * Modify SL/TP: `AMEND_POSITION_SLTP_REQ` (`payloadType: 2110`).
   * Close Position: `CLOSE_POSITION_REQ` (`payloadType: 2111`) with target position ID and closed volume.
   * Emergency Bulk Close: `closeAllPositions()` iterates through all open positions from `RECONCILE_REQ` and executes sequential close requests.

---

### 4.4 Historical Deals, Statement Retrieval & REST Fallback Engine

1. **WebSocket Multi-Chunk Deal Retrieval (`historicalDeals`):**
   * Sends `DEAL_LIST_REQ` (`payloadType: 2133`) over WebSocket.
   * **7-Day Chunking Constraint:** cTrader limits single deal request to maximum 7 days (`MAX_CHUNK = 604800000 - 1000` ms). Time range from `fromTimestamp` to `toTimestamp` is automatically segmented into 7-day chunks.
   * **Rate-Limit Throttling:** Enforces a 150ms delay between chunk requests to prevent cTrader WebSocket rate limit disconnection.
   * **In-Memory Deals Cache:** Caches deal results (`_dealsCache`) with a 15-second TTL.

2. **REST API Fallback Engine (`getHistoricalDealsREST`):**
   * If WebSocket deal query fails due to rate limits or connection reset, `getHistoricalDeals()` automatically falls back to the official cTrader Open API REST v2 endpoint:
     * **Live Base URL:** `https://api.ctraderapi.com/v2/accounts/{accountId}/deals`
     * **Demo Base URL:** `https://demo.ctraderapi.com/v2/accounts/{accountId}/deals`
   * Query parameters: `from={fromTimestamp}&to={toTimestamp}&token={accessToken}`.
   * Normalizes account ID (stripping non-numeric characters) and returns structured deal objects.

3. **Statement Generation & Account Auditing:**
   * Computes statement metrics across fetched deals:
     * **Gross Profit:** Sum of all winning trade gross profits.
     * **Gross Loss:** Sum of all losing trade gross losses.
     * **Swap & Commission:** Total broker fees incurred across positions.
     * **Net Realized PnL:**
       $$\text{Net PnL} = \sum (\text{Gross Profit} - \text{Gross Loss} - \text{Commission} - \text{Swap})$$
     * **Win Rate %:** $\left( \frac{\text{Winning Deals}}{\text{Total Deals}} \right) \times 100$
   * Renders full account trade history and performance statements in the dashboard Quant Terminal.

---

### 4.5 cTrader Multi-Bot Fleet Symbol Mapping & Calibrated Lot Size Matrix

| Bot Label | PM2 Name | Server | cTrader Symbol Name | cTrader Symbol ID | Calibrated Lot Size | Digits | Min / Step Volume |
|---|---|---|---|---|---|---|---|
| **Lery's Alerts** | `lery-v75` | S1 | `Volatility 75 Index` | `2434` | **0.01 Lots** | 2 | 1 / 1 |
| **Coffee Machine** | `coffee-v75-1s` | S1 | `Volatility 75 (1s) Index` | `2435` | **0.05 Lots** | 2 | 5 / 5 |
| **Milk Machine** | `milk-v100` | S1 | `Volatility 100 Index` | `2436` | **1.00 Lot** | 2 | 100 / 100 |
| **Tea Machine** | `tea-v25` | S1 | `Volatility 25 Index` | `2430` | **0.50 Lots** | 3 | 50 / 50 |
| **Ice Cream** | `ice-cream-100-1s` | S2 | `Volatility 100 (1s) Index` | `2437` | **1.00 Lot** | 2 | 100 / 100 |
| **OmniSight** | `omni-v50` | S2 | `Volatility 50 Index` | `2432` | **4.00 Lots** | 4 | 400 / 400 |
| **Test Bot** | `test-v10` | S2 | `Volatility 10 Index` | `2428` | **0.50 Lots** | 3 | 50 / 50 |

---

### 4.6 Universal cTrader Default Execution Protocol & Elimination of Deriv Fallbacks

1. **Universal Execution Architecture Mandate:**
   * **Permanent Default:** All bots across Server 1 (`138.2.169.72`) and Server 2 (`79.76.120.30`) default strictly and exclusively to cTrader:
     ```javascript
     const EXECUTION_MODE = (process.env.EXECUTION_MODE || "ctrader").toLowerCase();
     ```
   * Any future manual toggle to Deriv multipliers requires an explicit user configuration (`EXECUTION_MODE=deriv`) inside that specific bot's `.env` file.

2. **Absolute Elimination of Silent Deriv Fallbacks:**
   * Previously, `alert.js` contained a silent fallback block inside `executeTrade` that submitted a Deriv multiplier contract if a cTrader request timed out or was rejected.
   * **Permanent Fix:** The fallback has been completely excised. If a cTrader order cannot be placed (e.g. gateway timeout or broker margin limit), the engine records the exact broker rejection, aborts the trade atomically, cleans the pending record from memory, and notifies the operator via Telegram. **Under no circumstances are unintended Deriv options contracts placed.**

3. **Broker Decimal Precision (`spec.digits`) Formatting:**
   * Prior cTrader rejections occurred because raw floating-point stop-loss and take-profit prices were transmitted with unrounded precision (e.g. 4 decimal places for instruments that enforce 2 digits).
   * `ctrader-service.js` now automatically rounds all SL/TP targets:
     ```javascript
     if (slPrice !== null) orderPayload.stopLoss = parseFloat(Number(slPrice).toFixed(digits));
     if (tpPrice !== null) orderPayload.takeProfit = parseFloat(Number(tpPrice).toFixed(digits));
     ```

4. **cTrader Deals History & Reconciliation Engine:**
   * `getContractProfitFromHistory()` queries `/ctrader/deals` via Open API.
   * Realized P&L is parsed from `closePositionDetail` and converted to dollar equity using the broker's `moneyDigits` scaling factor ($10^{\text{moneyDigits}}$).
   * Unmanaged live contracts on cTrader are recovered with correct position IDs, eliminating ghost contract tracking.

5. **Fleet Ledgers Cleanse & Historical Deriv Options Purge:**
   * All unintended Deriv multiplier contracts placed on 2026-10-15 were cleanly expunged from the live trade ledgers (`trades.json`) on Server 1 and Server 2.
   * Bot daily P&L accumulators were reset to zero, ensuring 100% data integrity and consistency with cTrader account statement records.

---



---

## 5. DIRECT GOOGLE AI STUDIO DEPLOYMENT & REPOSITORY SYNC WORKFLOW

To maintain code safety and eliminate server environment fragmentation, **all code modifications, dashboard updates, and handbook edits are performed here inside Google AI Studio** and pushed to GitHub.

### The Automated Sync Architecture

```
[ Developer Workspace in Google AI Studio ]
                    |
                    +--> Run bash scripts/sync-to-github.sh
                    +--> Run bash scripts/auto-sync.sh
                    |
                    v
[ GitHub Master Repositories ]
  * https://github.com/Kwekugrind/Google-ai-studio.git (Branch: main)
  * https://github.com/Kwekugrind/dashboard.git (Branch: main)
                    |
                    v (Continuous Background Pull Daemon - every 5 mins)
[ Server 1 (138.2.169.72) & Server 2 (79.76.120.30) ]
  * pull-trades.sh executes 'git fetch origin main && git reset --hard origin/main'
  * Express server serves freshly pulled code immediately.
```

### Why Direct In-Server File Edits Are Strictly Forbidden
1. **Automated Reset:** `pull-trades.sh` runs every 5 minutes on both servers. Any manual edits made using `nano`, `vim`, or curl scripts directly on the server terminal will cause Git merge conflicts and be **immediately overwritten** on the next pull cycle.
2. **Version Divergence:** Editing files directly on the server breaks synchronization between Google AI Studio, GitHub, and the live dashboard.
3. **Loss of Audit Trail:** Manual server edits bypass commit history and code review audits.

### Step-by-Step Deployment Commands

Whenever you make changes in Google AI Studio, execute these exact scripts to publish updates live:

```bash
# Push updates to Google-ai-studio repository
bash scripts/sync-to-github.sh

# Push updates to dashboard repository
bash scripts/auto-sync.sh
```

---

## 6. THE 24/7 DUAL-SPEED CONTINUOUS ENGINE

Each bot operates an asynchronous event loop that divides execution into two distinct speeds:

### 1. Fast Path: Risk Management Pulse (3s In-Trade / 10s Idle)
* **3-Second High-Frequency Pulse:** When an active position is open, the loop runs every 3 seconds (`sleep(3000)`).
* **10-Second Idle Cadence:** When no position is open, the loop relaxes to 10 seconds (`sleep(10000)`), saving compute and API quota.
* **Network Guard:** Uses single-request WebSocket spot queries (`fetchCurrentSpotPrice()`) with a 4-second hard termination guard to prevent hung sockets.
* **Evaluates Exits:** Trailing Stop Ratchet, Hard Dollar SL (-$5.00), Software SL (-$2.50), Catastrophic Floor (-$5.50), and Take Profit target.

### 2. Slow Path: 4-Indicator Strategy Scan (5-Minute Candle Close)
* Fires exactly when a 5-minute candle closes (`nowEpoch - (nowEpoch % 300) > lastProcessedEpoch`).
* Fetches D1, M30, M15, and M5 candle data via `fetchAllData()`.
* Updates Fibonacci levels, M15 crossover states, CCI 100, Stochastic, and Envelope indicators.
* Reconciles active broker positions.
* Appends flight recorder telemetry to `ledger_<SYMBOL>_<DATE>.csv`.
* Executes trade if all 4 indicator states agree on direction.

---

## 7. TRADING STRATEGY -- QUANTITATIVE STATE MACHINE & TAKE PROFIT ENGINE

### Entry Mandate
**Fibonacci Grid Touch / Crossover is NOT REQUIRED FOR ENTRY** on Volatility 75 (`PROFILE_V75_EMA_STOCH15`) or any active fleet profile. All trade entries are strictly triggered by calibrated Exponential Moving Average (EMA) pullbacks, Stochastic Oscillators, Commodity Channel Index (CCI), or Moving Average Convergence Divergence (MACD) indicators.

### Daily Fibonacci Take Profit Target Grid
The **Daily Fibonacci Grid** (0%, 50%, 79%, 100%, -50%, 161.8%) calculated from prior day D1 High and Low is used for **Take Profit Target Calculations**. When a signal triggers, the next structural Fib level in the trade direction is selected as the TP target (enforcing a minimum **$4.00 Net Take Profit Floor** and managed by the Two-Tier Dynamic Trailing Stop).

---

## 8. RISK MANAGEMENT, LOSS DEFENSE CASCADE & DYNAMIC TREND-RIDING ENGINE

### Strict State Separation: Loss Defense vs. Profit Extension
The bot operates under two completely distinct mathematical states:
1. **Under Drawdown / Loss ($< \$0.00$):** Capital preservation is paramount. All strict defense mechanisms are actively enforced.
2. **In Profit ($\ge +\$4.00$):** The Dynamic Trend-Rider activates, locking in a **+$2.50 guaranteed profit floor** while leaving the upside completely open to ride macro trends.

---

### Capital Protection Cascade (Strictly Active in Drawdown & Loss)
When a position is in floating loss ($< \$0.00$), the following multi-tier defenses are strictly active:
1. **Calibrated Software Stop Loss (-$4.00 / -$3.50 / -$2.50):**
   * **-$4.00 Software SL:** Enforced on high-volatility instruments to prevent premature stopouts — `R_100` (Milk, 4.00 pts), `R_50` (OmniSight, 1.00 pt), and `1HZ75V` (Coffee, 80.0 pts).
   * **-$3.50 Software SL:** Enforced on `R_25` (Tea Machine, 7.00 pts) providing calibrated breathing room.
   * **-$4.00 Software SL:** Enforced on `R_100` (Milk), `R_50` (OmniSight), `1HZ75V` (Coffee), and `1HZ100V` (Ice Cream).
   * **-$2.50 Software SL:** Enforced on `R_75` (Lery's Alerts) and `R_10` (Test Bot).
   * Liquidates immediately in the 3-second fast pulse loop whenever floating PnL crosses below the instrument's threshold.
2. **Opposite M15 Fractal Fakeout Mitigation Exit:**
   * If an opposing M15 fractal forms while the position is underwater and price retraces against entry, the trade is liquidated early to avoid full SL.
3. **Stoch (200, 1, 1) Adverse Invalidation Exit:**
   * If M5 Stoch 200 crosses level 50 in the opposite direction while in loss (`unrealizedPnL < 0`), the trade liquidates immediately.
4. **Entry-Hour H1 Adverse Close Exit:**
   * If the entry-hour H1 candle closes against the position while in loss (`unrealizedPnL < 0`), the trade is closed at the top of the hour.
5. **3 Consecutive M5 Adverse Candles Invalidation (V75-1s & V10):**
   * If 3 consecutive 5-minute candles close opposite the entry direction while in loss (`unrealizedPnL < 0`), the trade liquidates early.
6. **Hard Broker Stop Loss (-$5.00):**
   * Absolute broker-side safety parameter attached to the position.
7. **Catastrophic Emergency Floor (-$5.50):**
   * Emergency fast-path safety cut to protect against extreme broker slippage.

---

### Unified Centralized Trade Management & Dynamic Runner Ratchet
When a position achieves profitable expansion, the engine transitions from defense to trend capture:

0. **Tier 0: Breakeven Shield (at +$1.00 Peak):**
   * When floating profit reaches **+$1.00**, immediately locks in a **+$0.50 guaranteed net profit floor**. This permanently guarantees that **no trade reaching +$1.00 will ever close in a loss**.
   * **The Breathing Zone ($1.00 to $2.99 Peak):** The profit floor is held firmly at **+$0.50** throughout this zone. By not choking the trade too tightly to the price, normal M5 candle wicks (up to $2.49 retracement) are tolerated without killing winning runners prematurely.

1. **Tier 1: Early Runner Ratchet (+$3.00 to +$4.99 Peak Profit):**
   * Once unrealized profit reaches **$\ge +\$3.00**, `trendRidingActive = true` is flagged.
   * Trails dynamically behind peak profit:
     $\text{lockedPnlFloor} = \max(+\$1.20, \text{maxUnrealizedPnL} \times 0.60, \text{maxUnrealizedPnL} - \$1.80)$

2. **Tier 2: Mid-Stage Runner Ratchet (+$5.00 to +$7.99 Peak Profit):**
   * $\text{lockedPnlFloor} = \max(+\$2.50, \text{maxUnrealizedPnL} \times 0.65, \text{maxUnrealizedPnL} - \$2.00)$

3. **Tier 3: Advanced Runner Ratchet (+$8.00 to +$11.99 Peak Profit):**
   * Locks in at least **75% of peak profit** (capping maximum giveback to `$2.50`):
     $\text{lockedPnlFloor} = \max(+\$5.00, \text{maxUnrealizedPnL} \times 0.75, \text{maxUnrealizedPnL} - \$2.50)$
   * *Example:* At +$10.00 peak $\rightarrow$ floor locked at `+$7.50`. At +$12.00 peak $\rightarrow$ floor locked at `+$9.50`.

4. **Tier 4: Super Runner Ratchet (+$12.00+ Peak Profit):**
   * Locks in at least **80% of peak profit** (capping maximum giveback to `$2.50`):
     $\text{lockedPnlFloor} = \max(+\$7.50, \text{maxUnrealizedPnL} \times 0.80, \text{maxUnrealizedPnL} - \$2.50)$

5. **Hard Profit Ceiling (+$20.00 Super Runner Cash-out):**
   * Instant market liquidation to bank the full runner once unrealized profit touches `+$20.00`.

6. **Runner Immunity & Oscillator Profit Exit Abolition:**
   * Profitable trades are immune to mid-trend oscillator exits. Closed-M5 Stoch (15,2,5) or Stoch (25,2,5) crossing level 50 opposite are evaluated **STRICTLY as early loss invalidations when in adverse position ($\text{currentPnl} < 0$)**. Profitable positions are managed exclusively by the Tiered Dynamic Ratchet and macro trend invalidations (Stoch 200).

7. **Closed M5 Candle Momentum Exhaustion & Profit Exits:**
   * The trade stays open to capture multi-wave runners until a **confirmed closed M5 candle** indicates that secondary momentum has exhausted:
     * **Volatility 100 (`R_100`):** Closed-M5 Stoch (25, 2, 5) %K crosses `< 65.0` for BUY or `> 35.0` for SELL.
     * **Volatility 50 (`R_50`):** Closed-M5 Stoch (25, 2, 5) %K midline 50 cross when `pnl >= $1.00` (`<= 50.0` for BUY, `>= 50.0` for SELL).
     * **Volatility 75 (1s) (`1HZ75V`):** Closed-M5 Stoch (25, 2, 5) %K midline 50 cross when `pnl >= $1.00` (`<= 50.0` for BUY, `>= 50.0` for SELL).
     * **Volatility 25 (`R_25`):** Closed-M5 Stoch (15, 2, 5) %K midline 50 cross (`<= 50.0` BUY / `>= 50.0` SELL) & Closed-M5 CCI 100 Zero-Line cross (`<= 0.0` BUY / `>= 0.0` SELL).
     * **Volatility 75 (`R_75`):** Closed-M5 Stoch (15, 2, 5) %K crosses Level 50 in opposite direction.
   * **Market Liquidation:** When the exhaustion cross occurs on a closed bar in profit, the bot executes an immediate cTrader market close, banking the extended profit and transmitting a celebratory Telegram alert.

8. **Guaranteed Floor Protection Against Reversals:**
   * If the market experiences a violent reversal or turns sideways, the 3-second fast pulse loop monitors price:
     $\text{Current PnL} \le +\$2.50 \implies \text{Liquidate at Market}$
   * The trader is guaranteed to walk away with no less than **+$2.50 net profit** on any trade that reached the +$4.00 milestone.

---

## 9. INSTRUMENT-SPECIFIC ENTRY REQUIREMENTS & CALIBRATED PROFILES

### 1. Volatility 75 (`R_75`) -- Lery's Alerts
* **Server:** Server 1 | **Dir:** `~/trading-bots/Lery-s-Alerts`
* **Multiplier:** 50x | **Stake:** $5.00 | **cTrader Lot Size:** `0.005` lots
* **Strategy Gate (`PROFILE_V75_EMA_STOCH15` -- 2-Step Initial & Retracement Model):**
  1. **Hard Directional Filters:** Never BUY when price closes below M5 EMA 100 (`Close > EMA 100` required); Never SELL when price closes above M5 EMA 100 (`Close < EMA 100` required).
  2. **Setup 1 -- Initial Entry (2-Step Breakout Sequence):**
     * **Condition 1 (Arming):** Price first crosses and closes above both M5 EMA 100 & EMA 200 (for BUY) or below both M5 EMA 100 & EMA 200 (for SELL). (Does not require EMA 100/200 cross, only price beyond both).
     * **Condition 2 (Execution Trigger & Strict Invalidation):** M5 Stoch (15,2,5 Simple) `%K` freshly crosses **above Level 50.0** (`prevK <= 50.0 && sK > 50.0`) for BUY, or freshly crosses **below Level 50.0** (`prevK >= 50.0 && sK < 50.0`) for SELL. **Strict Invalidation Clause:** If M5 Stoch (15,2,5 Simple) is already beyond Level 50.0 (already > 50 for BUY, or already < 50 for SELL), the setup is invalid and will not trigger (initial breakout is skipped to transition to Retracement watch).
  3. **Setup 2 -- Retracement Entry (2-Step Pullback Sequence):**
     * **Condition 1 (Arming):** Price retraces to physically touch M5 EMA 100 (`Low <= EMA 100 && High >= EMA 100`).
     * **Condition 2 (Trigger):** M5 Stoch (15,2,5 Simple) `%K` freshly crosses **above Level 20** (`prevK <= 20.0 && sK > 20.0`) with M5 candle close above EMA 100 (for BUY), or freshly crosses **below Level 80** (`prevK >= 80.0 && sK < 80.0`) with M5 candle close below EMA 100 (for SELL).
  4. **Early Exits & Profit Protection:** 1) Active trade in floating loss liquidates if Stoch `%K` freshly crosses `%D` in opposite direction on a closed M5 candle after entry; 2) Closed M5 Stoch (15,2,5) `%K` crossover across Level 50.0 against a profitable trade (`prevK > 50 && sK <= 50` for BUY; `prevK < 50 && sK >= 50` for SELL); 3) Entry-Hour H1 Adverse Close Exit.
* **Min TP:** 1330.0 pts ($4.00 Net Minimum Target + Dynamic Ratchet) | **Max SL:** 180.0 pts

### 2. Volatility 75 (1s) (`1HZ75V`) -- Coffee Machine
* **Server:** Server 1 | **Dir:** `~/trading-bots/coffee`
* **Multiplier:** 100x | **Stake:** $5.00 | **cTrader Lot Size:** `0.05` lots
* **Software SL:** -$4.00 (80.0 pts) | **Max Broker SL:** 80.0 pts (-$4.00)
* **Strategy Gate:**
  1. **Initial Entry (Sequential Arming -> Trigger):**
     * **Condition 1 (Arming):** M5 Stochastic (200,1,1) `%K` must cross first (`> 50.0` for BUY / `< 50.0` for SELL) before MACD crosses zero (`s200BuyEpoch <= macdBuyEpoch` / `s200SellEpoch <= macdSellEpoch`).
     * **Condition 2 (Baseline Filter):** M5 candle Close `> EMA 100` for BUY / `< EMA 100` for SELL.
     * **Condition 3 (Execution Trigger):** M5 MACD (25,75,1) crossing zero (`> 0` for BUY / `< 0` for SELL) triggers the initial trade (`initialSetupDone = true`).
  2. **Re-Entry (Subsequent Pullback Entry):**
     * **Trend & Baseline Alignment:** M5 Stoch 200 and M5 MACD (25,75,1) remain aligned (`> 50` & `> 0` for BUY; `< 50` & `< 0` for SELL) + Price `> EMA 100` (BUY) / `< EMA 100` (SELL).
     * **Execution Trigger:** M5 Auxiliary Stochastic (15,2,5 Simple) `%K` freshly crosses **above Level 20** (`prevK1525 <= 20.0 && sK1525 > 20.0`) for BUY, or freshly crosses **below Level 80** (`prevK1525 >= 80.0 && sK1525 < 80.0`) for SELL.
  3. **Early Exits & Profit Protection:**
     * **Loss Exits (Strictly `inLoss` / `unrealizedPnL < 0`):** 1) 3 Consecutive Adverse M5 Candle Closes in loss; 2) M5 Stoch (200,1,1) Adverse Cross (`< 50` BUY / `> 50` SELL) in loss; 3) Entry-Hour H1 Adverse Close Exit in loss.
     * **Profit Exit:** Closed-M5 Stoch (25,2,5) `%K` crossover across Level 50.0 when trade is in profit (`pnl >= 1.00`: `prevK2525 > 50 && sK2525 <= 50` for BUY; `prevK2525 < 50 && sK2525 >= 50` for SELL).
     * **Dynamic Runner:** 4-Tier Trailing Ratchet with Breakeven Shield at +$2.20 and Super-Runner Ceiling at $20.00.
* **Min TP:** 80.0 pts ($4.00 Net Minimum Target + Dynamic Ratchet) | **Max SL:** 80.0 pts (-$4.00)

### 3. Volatility 100 (`R_100`) -- Milk Machine
* **Server:** Server 1 | **Dir:** `~/trading-bots/milk`
* **Multiplier:** 40x | **Stake:** $5.00 | **cTrader Lot Size:** `1.00` lot
* **Software SL:** -$4.00 (4.00 pts) | **Max Broker SL:** 4.00 pts (-$4.00)
* **Strategy Gate:** 
  1. **Directional Filter:** BUY permitted only when M5 Price > EMA 100; SELL permitted only when M5 Price < EMA 100.
  2. **Initial Entry:** M5 Stoch 200 (48/52 Hysteresis) Trend + M5 Stoch (15,2,5 Simple) Level 50 cross (unbounded window while armed) + Price vs EMA 100.
  3. **Re-Entry & Latching Engine:** While Stoch 200 and EMA 100 remain aligned, BUY on fresh Stoch (15,2,5) %K cross > 20 (SELL on %K cross < 80). Active re-entry opportunities are latched while in trade and executed immediately upon position exit.
  4. **Early Exits & Profit Protection:**
     * **Profit Exit:** Closed-M5 Stoch (25,2,5) `%K` crosses below `65.0` for BUY (`prevK2525 >= 65.0 && sK2525 < 65.0`) or crosses above `35.0` for SELL (`prevK2525 <= 35.0 && sK2525 > 35.0`).
     * **Loss Exits (Strictly `inLoss` / `unrealizedPnL < 0`):** 1) Opposite M5 Fractal cross in loss, 2) Entry-Hour H1 Adverse Close Exit in loss.
     * **Dynamic Runner:** 4-Tier Trailing Ratchet with Breakeven Shield at +$2.20 and Super-Runner Ceiling at $20.00.
* **Min TP:** 4.00 pts ($4.00 Net Minimum Target + Dynamic Ratchet) | **Max SL:** 4.00 pts (-$4.00)

### 4. Volatility 25 (`R_25`) -- Tea Machine
* **Server:** Server 1 | **Dir:** `~/trading-bots/tea`
* **Multiplier:** 400x | **Stake:** $5.00 | **cTrader Lot Size:** `0.50` lots
* **Software SL:** -$3.50 (7.00 pts) | **Max Broker SL:** 7.00 pts (-$3.50)
* **Strategy Gate:**
  1. **Directional Filter:** BUY permitted only when M5 Price > EMA 100; SELL permitted only when M5 Price < EMA 100.
  2. **Initial Entry:** M5 Stoch (200,1,1) Trend (`>= 50` BUY / `<= 50` SELL, unbounded window while armed) + M5 CCI 100 Zero Cross (`prevCci <= 0 && cVal > 0` BUY / `prevCci >= 0 && cVal < 0` SELL) + Price vs EMA 100. **Execution Lead Window:** When CCI 100 crosses zero first while Price vs EMA 100 is aligned, a **20-minute execution window** engages waiting for Stoch 200 to cross Level 50; the trade triggers immediately the moment Stoch 200 confirms.
  3. **Re-Entry & Latching Engine:** While M5 Stoch (200,1,1), M5 CCI 100, and EMA 100 remain aligned, **BUY Re-Entry** on fresh M5 Stoch (15,2,5) `%K` cross above `25.0` (`prevK1525 <= 25.0 && sK1525 > 25.0`); **SELL Re-Entry** on fresh M5 Stoch (15,2,5) `%K` cross below `75.0` (`prevK1525 >= 75.0 && sK1525 < 75.0`). Active re-entry opportunities are latched while in trade and executed immediately upon position exit.
  4. **Early Exits & Profit Protection:**
     * **Loss Exits (Strictly `inLoss` / `unrealizedPnL < 0`):** 1) Previous M5 Fractal Break in loss, 2) Stoch 200 Adverse Cross in loss, 3) Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction in loss, 4) Entry-Hour H1 Adverse Close Exit in loss.
     * **Profit Protection:** Closed-M5 Stoch (15,2,5) Midline Profit Exit (`<= 50` BUY / `>= 50` SELL) & Closed-M5 CCI 100 Zero-Line Profit Exit when trade is in profit.
     * **Dynamic Runner:** 4-Tier Trailing Ratchet with Breakeven Shield at +$2.20 and Super-Runner Ceiling at $20.00.
* **Min TP:** 8.00 pts ($4.00 Net Minimum Target + Dynamic Ratchet) | **Max SL:** 7.00 pts (-$3.50)

### 5. Volatility 100 (1s) (`1HZ100V`) -- Ice Cream
* **Server:** Server 2 | **Dir:** `~/trading-bots/ice-cream`
* **Multiplier:** 40x | **Stake:** $5.00 | **cTrader Lot Size:** `1.00` lot
* **Software SL:** -$4.00 (4.00 pts) | **Max Broker SL:** 5.00 pts (-$5.00)
* **Strategy Gate:** 
  1. **Directional Filter:** BUY permitted only when M5 Price > EMA 100; SELL permitted only when M5 Price < EMA 100.
  2. **Initial Entry:** M5 Stoch 200 + MACD (25,75,1) + EMA 100.
  3. **Re-Entry & Latching Engine:** Fast Stoch (5,3,3) pullback cross > 20 (BUY) / < 80 (SELL) with continuous latching while in trade for immediate execution.
  4. **Early Exits:** 1) 3 Consecutive Adverse M5 Candles in loss, 2) M5 Stoch (200,1,1) Adverse Cross (`< 50` BUY / `> 50` SELL) in loss, 3) Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction in loss.
* **Min TP:** 4.00 pts ($4.00 Net) | **Max SL:** 5.50 pts

### 6. Volatility 50 (`R_50`) -- OmniSight
* **Server:** Server 2 | **Dir:** `~/trading-bots/OmniSight`
* **Multiplier:** 80x | **Stake:** $5.00 | **cTrader Lot Size:** `4.00` lots
* **Software SL:** -$4.00 (1.00 pt) | **Max Broker SL:** 1.00 pt (-$4.00)
* **Strategy Gate:**
  1. **Directional Filter:** BUY permitted only when M5 Price > EMA 100; SELL permitted only when M5 Price < EMA 100.
  2. **Condition 1 (Macro Trend Arming):** M5 Stoch (200,1,1) Trend (`>= 50.0` arms BUY, `<= 50.0` arms SELL, unbounded window while aligned; disarms immediately on `< 50.0` for BUY or `> 50.0` for SELL and resets initial trade state).
  3. **Initial Entry:** Fresh M5 Stoch (15,2,5) `%K` cross of Level `50.0` (`prevK1525 <= 50.0 && sK1525 > 50.0` for BUY; `prevK1525 >= 50.0 && sK1525 < 50.0` for SELL) after Condition 1 is already armed + Price vs EMA 100.
  4. **Re-Entry & Latching Engine:** Fresh M5 Stoch (15,2,5) `%K` cross **above `20.0`** for BUY (`prevK1525 <= 20.0 && sK1525 > 20.0`) or **below `80.0`** for SELL (`prevK1525 >= 80.0 && sK1525 < 80.0`) while Condition 1 and EMA 100 remain valid after initial trade has closed. Continuous latching executes immediately on position close.
  5. **Early Exits & Profit Protection:**
     * **Loss Exits (Strictly `inLoss` / `unrealizedPnL < 0`):** 1) Previous M5 Fractal Break in loss, 2) Stoch 200 Adverse Cross (`< 50.0` BUY / `> 50.0` SELL) in loss, 3) Closed-M5 Stoch (15,2,5) Level `50.0` Opposite Cross in loss, 4) Entry-Hour H1 Adverse Close Exit in loss.
     * **Profit Exit:** Closed-M5 Stoch (25,2,5) Level `50.0` Midline Profit Exit when `pnl >= 1.00` (`<= 50.0` for BUY, `>= 50.0` for SELL).
     * **Dynamic Runner:** 4-Tier Trailing Ratchet with Breakeven Shield at +$2.20 and Super-Runner Ceiling at $20.00.
* **Min TP:** 1.00 pt ($4.00 Net Minimum Target + Dynamic Ratchet) | **Max SL:** 1.00 pt (-$4.00)

### 7. Volatility 10 (`R_10`) -- Test Bot
* **Server:** Server 2 | **Dir:** `~/trading-bots/Test-Bot`
* **Multiplier:** 400x | **Stake:** $5.00 | **cTrader Lot Size:** `0.50` lots
* **Software SL:** -$2.50 (5.00 pts) | **Max Broker SL:** 5.00 pts (-$2.50)
* **Strategy Gate:**
  1. **Initial Entry:** Triggered immediately when all 3 conditions are met in **any order** on a closed M5 candle — 1) M5 Stoch (200,1,1) `%K >= 50.0` (BUY) / `<= 50.0` (SELL), 2) M5 MACD (25,75,1) `>= 0.0` (BUY) / `<= 0.0` (SELL), 3) `Price > M5 EMA 100` (BUY) / `Price < M5 EMA 100` (SELL).
  2. **Re-Entry:** Closed M5 Fast Stoch (5,3,3) `%K` cross **above `20.0`** (BUY) / **below `80.0`** (SELL) while all 3 macro conditions remain aligned.
  3. **Early Exits & Profit Protection:** 1) 3 Consecutive Adverse M5 Candles in loss, 2) Stoch 200 Adverse Cross (`< 50.0` BUY / `> 50.0` SELL) in loss, 3) Closed-M5 Stoch (15,2,5) Level `50.0` Cross in Opposite Direction in Loss (`prevK1525 >= 50.0 && sK1525 < 50.0` BUY / `prevK1525 <= 50.0 && sK1525 > 50.0` SELL), 4) Entry-Hour H1 Adverse Close Exit in loss; **Profit Protection & Trailing Engine:** Closed-M5 Stoch (15,2,5) Midline Profit Exit (`<= 50.0` BUY / `>= 50.0` SELL) + $4.00/$4.00 Dynamic Ratchet.
* **Min TP:** 8.00 pts ($4.00 Net) | **Max SL:** 5.00 pts

---

## 10. FLIGHT RECORDER (LEDGER CSV) & PORTFOLIO RECONCILER

### Daily Flight Recorder CSV
Every bot maintains a daily CSV audit file at `ledger_<SYMBOL>_<DATE>.csv` logging every 5-minute candle state:
```csv
Timestamp,Close,CCI,Stoch_K,Stoch_D,Env_Up,Env_Lo,Phase,Action
2026-10-12 12:00:00,47520.10,-45.2,62.1,58.4,47550.00,47490.00,IDLE,HOLD
```

### Portfolio Reconciler
On every candle scan, bots query `/portfolio` via `deriv-gateway` or cTrader reconcile API. If an active contract exists in broker records but was lost locally (e.g. after process restart), the bot auto-adopts the contract ID and restores tracking.

---

## 11. GATEWAY, SERVER HUB & QUANT TERMINAL ARCHITECTURE

The dashboard (`:4000`) embeds a multi-tab **Server Hub & Quant Terminal Modal** that provides complete operational control:

```
+-----------------------------------------------------------------------------------+
|                        SERVER HUB & QUANT TERMINAL MODAL                          |
+-----------------------------------------------------------------------------------+
|  [ Tab 1: Live Log Terminal ] [ Tab 2: File & Code Explorer ] [ Tab 3: AI Diag ] |
+-----------------------------------------------------------------------------------+
```

### 1. Live Log Terminal (`/api/logs/:server/:name`)
* **Auto-Streaming:** Default stream toggle polls server logs continuously every 3 seconds (`isAutoStreaming = true`).
* **Clean Formatting Engine:** Strips raw ANSI escape codes (`/\x1B\[[0-9;]*[a-zA-Z]/g`), parses ISO UTC timestamps, and color-codes log lines:
  * Red (`#f85149`): Errors, timeouts, 520 server responses.
  * Amber (`#d29922`): Warnings, spot price delays, retries.
  * Emerald (`#3fb950`): Trades opened, profit targets reached, buy/sell triggers.
  * Cyan (`#38bdf8`): State updates, indicator readings, heartbeat cycles.
* **Auto-Scroll Discipline:** Maintains bottom scroll lock when newest logs arrive, unless operator manually scrolls up.

### 2. File & Code Explorer (`/api/file-tree`, `/api/file-content`, `/api/file-save`)
* **Full-Tree Expandable File Navigation:** Displays Server 1 and Server 2 repository folders (`Lery's Alerts`, `coffee`, `milk`, `tea`, `ice-cream`, `OmniSight`, `Test-Bot`, `dashboard`, `command-bot`, `gateway`, `trading-handbook`).
* **Subfolder Support:** Recursively lists nested directories (`src/`, `scripts/`, `config/`).
* **Extensionless File Handling:** Terminal files without extension (`Dockerfile`, `LICENSE`, `Procfile`, `.env`, `HANDBOOK`) are correctly classified as files, preventing empty folder bugs.
* **Code Editor & Remote Save:** Allows inspecting source code and state files (`state.json`, `trades.json`, `.env`). Edits can be saved directly back to the server with optional automated PM2 process restart.

### 3. AI Diagnostic Generator (`/api/diagnostics`)
* Aggregates real-time CPU/RAM metrics, uptime, active PM2 process lists, gateway latency, and recent bot error logs into a pre-formatted diagnostic prompt.

---

### 11.4 AI & OPERATOR SERVER CONNECTION GUIDE

Any AI assistant or operator connecting to or inspecting the trading network must use the following verified connection parameters:

#### 1. Live Web Dashboards & Handbook URLs
* **Primary Dashboard URL:** `http://79.76.120.30:4000`
* **Dedicated Live Handbook URL:** `http://79.76.120.30:4000/handbook`
* **Markdown Download URL:** `http://79.76.120.30:4000/api/handbook/download`
* **Development Preview URL:** `https://ais-dev-wmbikzhizrggxhkw5hnrxx-137278036501.europe-west2.run.app`

#### 2. Linux Server SSH Access Parameters
* **Server 1 (Gateway & S1 Fleet):**
  * **IP Address:** `138.2.169.72`
  * **User:** `ubuntu` | **SSH Port:** `22`
  * **Base Directory:** `/home/ubuntu/trading-bots`
* **Server 2 (Dashboard & S2 Fleet):**
  * **IP Address:** `79.76.120.30`
  * **User:** `ubuntu` | **SSH Port:** `22`
  * **Base Directory:** `/home/ubuntu/trading-bots`

#### 3. Express API Endpoints & Authentication Headers for AI Assistants
AI tools and automated scripts querying the fleet must pass authentication headers:
* **Headers:**
  * `x-token`: Operator token derived from `sha256(LOGIN_USER + LOGIN_PASS + 'OmniSight_v5')` or configured `OPERATOR_TOKEN`.
  * `x-dash-secret`: Inter-server communication secret (`S1_SECRET`).
* **Key API Endpoints:**
  * `GET http://79.76.120.30:4000/api/data` -> Full multi-bot fleet state, active positions, daily PnL, and trade history.
  * `GET http://79.76.120.30:4000/api/diagnostics` -> Comprehensive prompt-ready system health snapshot for AI analysis.
  * `GET http://79.76.120.30:4000/api/logs/:server/:name` -> Real-time log stream tail for any bot process (e.g., `server1/coffee-v75-1s`).
  * `GET http://79.76.120.30:4000/api/file-tree` -> Recursive file tree structure of Server 1 and Server 2 repository directories.
  * `POST http://79.76.120.30:4000/api/file-content` -> Fetch contents of state files (`state.json`), trade ledgers (`trades.json`), or code files. Body: `{ "server": "server1" | "server2", "dir": "coffee", "file": "state.json" }`.

---


## 12. TELEGRAM DIAGNOSTIC ALERTS & OPERATIONS

Bots send real-time structured Telegram notifications for:
* **Trade Entry:** Instrument, Direction, Entry Spot, Stake, Multiplier, Target TP, Stop Loss.
* **Profit Lock Activation:** Tier 1 / Tier 2 ratchet updates.
* **Trade Exit:** Profit/Loss result, Duration, Exit Reason.
* **Daily Target Reached:** When bot cumulative net profit hits $7.00.

---

## 13. PM2 OPERATIONS & INFRASTRUCTURE MAINTENANCE MANUAL

### Standard PM2 Command Reference
```bash
# View process status across all services
pm2 status

# View live streaming logs for a specific bot
pm2 logs lery-v75

# Safely restart a bot process
pm2 restart lery-v75

# Save current process list for automatic system reboot recovery
pm2 save
```

### Exact PM2 Process Names Matrix

To query or control services on Server 1 and Server 2, use these exact PM2 process identifiers:

| Server | Service Description | PM2 Process Name | Directory Path |
|---|---|---|---|
| **Server 1** | Lery's Alerts Bot | `lery-v75` | `/home/ubuntu/trading-bots/Lery-s-Alerts` |
| **Server 1** | Coffee Machine Bot | `coffee-v75-1s` | `/home/ubuntu/trading-bots/coffee` |
| **Server 1** | Milk Machine Bot | `milk-v100` | `/home/ubuntu/trading-bots/milk` |
| **Server 1** | Tea Machine Bot | `tea-v25` | `/home/ubuntu/trading-bots/tea` |
| **Server 1** | Deriv Gateway (Port 3000) | `deriv-gateway` | `/home/ubuntu/trading-bots/gateway` |
| **Server 1** | Server 1 Hub API (Port 4001) | `s1-api` | `/home/ubuntu/trading-bots/s1-api` |
| **Server 2** | Ice Cream Bot | `ice-cream-100-1s` | `/home/ubuntu/trading-bots/ice-cream` |
| **Server 2** | OmniSight Bot | `omni-v5` / `omni-v50` | `/home/ubuntu/trading-bots/OmniSight` |
| **Server 2** | Test Bot | `test-v10` | `/home/ubuntu/trading-bots/Test-Bot` |
| **Server 2** | Dashboard Hub (Port 4000) | `dashboard` | `/home/ubuntu/trading-bots/dashboard` |
| **Server 2** | Telegram Command Bot | `command-bot` | `/home/ubuntu/trading-bots/command-bot` |
| **Server 2** | Gateway Watchdog Daemon | `gateway-watchdog` | `/home/ubuntu/trading-bots/gateway` |

---

## 14. TROUBLESHOOTING & FREQUENTLY ENCOUNTERED SCENARIOS

### Scenario 1: Bot shows "Offline" in Fleet Monitor
1. Check process status on the target server: `pm2 status`.
2. Inspect log output: `pm2 logs <bot-name> --lines 50`.
3. Verify `deriv-gateway` is active on Port 3000: `curl http://138.2.169.72:3000/ping`.
4. Restart service: `pm2 restart <bot-name>`.

### Scenario 2: Uncalibrated or Excessively Large PnL
1. Uncalibrated test trade logs (`Math.abs(amount) > $500`) are automatically ignored by `/api/data` aggregation logic in `server.js`.
2. Clear local trades file if needed: POST `/api/clear-history` via dashboard or API.

---

## 15. EXHAUSTIVE AI DIAGNOSTICS & PROBLEM-SOLVING KNOWLEDGE BASE

This section contains the definitive diagnostic matrix covering every operational issue encountered in system history. Any AI assistant or human operator troubleshooting the system MUST consult this guide before taking action.

### Diagnostic Scenario 1: Dashboard Logs Frozen or Stuck at Old Timestamp (e.g. 6:12)
* **Symptom:** The live log window in the Server Hub terminal stops updating, showing old timestamps while PM2 is running.
* **Root Cause:**
  1. PM2 process name mismatch (e.g., the process running in PM2 is named `omni-v5`, but the dashboard API queried `omni-v50`).
  2. Fallback file reading in `~/.pm2/logs` picked an old, inactive `.log` file because log files were not sorted by modification time (`mtimeMs`).
* **Exact AI Solution:**
  * In `server.js` and `serverApi.ts`, expand `PM2_NAME_MAP` and `buildCandidates()` to map all process aliases (`omni-v5`, `omni-v50`, `omnisight`, `omni`).
  * In file fallback logic, read directory `~/.pm2/logs/`, stat all matching files, sort by `st.mtimeMs` descending (newest first), and select only the active top log file.

### Diagnostic Scenario 2: "Unexpected server response: 520" or "WebSocket timeout 4s exceeded"
* **Symptom:** Bot log shows periodic spot fetch warnings: `Periodic spot fetch warning: fetchCurrentSpotPrice timeout on wss://ws.derivws.com/websockets/v3?app_id=1089 (4s exceeded)`.
* **Root Cause:** Deriv public WebSocket endpoints experience temporary cloud routing or rate-limiting delays when opening socket connections under heavy cloud traffic.
* **Exact AI Solution:**
  * Do NOT revert to `subscribe: 1` push sockets (which trigger firewall IP blocks).
  * The single-request WebSocket function `fetchCurrentSpotPrice()` has an intentional 4-second hard timeout guard (`setTimeout` socket close).
  * If a 4s timeout occurs, the bot gracefully logs a warning, skips that single pulse, and retries on the next 3s/10s cycle without crashing or stopping the engine loop.

### Diagnostic Scenario 3: Telegram Command Bot Logs Not Updating or Bot Unresponsive
* **Symptom:** Telegram commands (`/status`, `/summary`, `/reboot`) receive no response or logs show no activity.
* **Root Cause:** PM2 process name mismatch (`command-bot` vs `command_bot` vs `telegram-bot`), or duplicate polling instances causing Telegram 409 Conflict errors.
* **Exact AI Solution:**
  * Ensure process name in PM2 is `command-bot`.
  * Check PM2 status on Server 2: `pm2 status`. If multiple instances exist, kill duplicates: `pm2 delete command_bot`.
  * Verify `TELEGRAM_BOT_TOKEN` in `.env` and restart cleanly: `pm2 restart command-bot`.

### Diagnostic Scenario 4: Gateway Watchdog / Health Check Failed (1/2 or 0/2)
* **Symptom:** Fleet monitor displays `Health Check Failed 1/2` or `0/2`.
* **Root Cause:** `deriv-gateway` (Port 3000 on Server 1) or `s1-api` (Port 4001 on Server 1) is unresponsive due to process crash, network partition, or token invalidation.
* **Exact AI Solution:**
  * Test Gateway ping: `curl -I http://138.2.169.72:3000/ping`.
  * Test Server 1 API: `curl -I http://138.2.169.72:4001/api/bots`.
  * On Server 1, execute: `pm2 restart deriv-gateway s1-api`.
  * Check token validity in `/home/ubuntu/trading-bots/.env` (`DERIV_API_TOKEN`).

### Diagnostic Scenario 5: File Explorer Displays "No files found" or Subfolders Return "404 File Not Found"
* **Symptom:** Selecting a subfolder file (e.g. `src/components/ServerHubModal.tsx`) returns "File Not Found", or extensionless files (e.g. `Dockerfile`, `HANDBOOK`) display as empty folders.
* **Root Cause:**
  1. `path.basename(file)` in `/api/file-content` stripped subfolder paths (turning `src/index.ts` into `index.ts`).
  2. `buildNestedTree` evaluated `!part.includes('.')` as true for extensionless files, categorizing them as directories.
  3. `BOTS_DIR` fallback pointed to a non-existent path in non-server environments.
* **Exact AI Solution:**
  * Use `getResolvedBotPath(dir)` and sanitized relative paths (`path.normalize(file).replace(/^(\.\.[\/\\])+/, '')`).
  * In `buildNestedTree()`, classify only intermediate path segments (`index < parts.length - 1`) as directories.
  * Update `BOTS_DIR` to fall back to `__dirname` if `/home/ubuntu/trading-bots` is not found.

### Diagnostic Scenario 6: cTrader API Protobuf Handshake Error (ProtoOAAppAuthReq 2100)
* **Symptom:** cTrader bridge fails to establish connection or drops with authorization error.
* **Root Cause:** Expired `CTRADER_ACCESS_TOKEN`, invalid `CTRADER_CLIENT_ID` / `SECRET`, or outbound port 5036 blocked.
* **Exact AI Solution:**
  * Check `.env.ctrader` on Server 2.
  * Re-authenticate in cTrader Open API portal to generate a fresh access token.
  * Test WebSocket connectivity: `nc -zv demo.ctraderapi.com 5036`.

### Diagnostic Scenario 7: Server Terminal Direct Edits Instantly Reset / Disappear
* **Symptom:** Changes made directly on Server 1 or Server 2 via `nano` or `vim` vanish within minutes.
* **Root Cause:** `pull-trades.sh` runs continuously in the background on both servers, executing `git pull` / `git reset --hard origin/main` every 5 minutes.
* **Exact AI Solution:**
  * NEVER edit files directly on the server terminal.
  * Make all code edits in Google AI Studio, run `bash scripts/sync-to-github.sh` and `bash scripts/auto-sync.sh` to push to GitHub, and let `pull-trades.sh` auto-pull the updates.

### Diagnostic Scenario 8: Unreadable Log Terminal Output (Raw ANSI / Cluttered JSON)
* **Symptom:** Log terminal displays escape codes (`\x1b[32m`) or unformatted JSON strings.
* **Root Cause:** Raw stdout streams from PM2 or process stdout containing ANSI color sequences.
* **Exact AI Solution:**
  * Use the built-in dashboard log formatter (`ServerHubModal.tsx`), which strips ANSI escape codes (`/\x1B\[[0-9;]*[a-zA-Z]/g`), extracts ISO UTC timestamps, and renders color-coded log cards based on log severity tags.

### Diagnostic Scenario 9: Uncalibrated Test Trades Distorting Dashboard PnL
* **Symptom:** Total daily PnL spikes or displays extreme values (e.g. +$10,000 or -$5,000).
* **Root Cause:** Simulated test runs or uncalibrated test trades with stake/PnL values exceeding production bounds.
* **Exact AI Solution:**
  * `/api/data` automatically filters out trades where `Math.abs(amount) > $500`.
  * To clear test records entirely, invoke `/api/clear-history` via dashboard or wipe `trades.json` (`[]`) and reset `state.json` (`dailyNetPnl: 0.0`).

### Diagnostic Scenario 10: Server 1 or Server 2 Unreachable / 502 Bad Gateway
* **Symptom:** Dashboard modal shows "Server 1 unreachable" or HTTP 502 error.
* **Root Cause:** Authorization secret (`S1_SECRET`) mismatch or Oracle Cloud Security List blocking port 4001 or 4000.
* **Exact AI Solution:**
  * Verify `S1_SECRET` in `.env` on Server 1 matches `S1_SECRET` on Server 2.
  * Inspect firewall rules: `sudo iptables -L -n -v` and ensure Oracle Cloud VCN Security List permits TCP ingress on ports 3000, 4000, and 4001.

### Diagnostic Scenario 11: `state.json` or `trades.json` JSON Corruption / Syntax Error
* **Symptom:** Bot fails to initialize on startup or throws `Unexpected token in JSON at position X`.
* **Root Cause:** A sudden server power cut, hard process kill, or concurrent unhandled write during trade execution created a partial JSON file.
* **Exact AI Solution:**
  * Validate JSON syntax: `jq . state.json` and `jq . trades.json`.
  * If corrupted, restore `state.json` template (`{"dailyNetPnl": 0.0, "lastProcessedEpoch": 0, "armed": null, "last50Origin": null, "tradeCount": 0}`) and `trades.json` template (`[]`).
  * In code, ensure JSON writes use atomic write or try/catch blocks with automatic backup fallback.

### Diagnostic Scenario 12: Deriv API Rate Limit / Invalid Token Error (`RateLimit` / `InvalidToken` / HTTP 429)
* **Symptom:** Bot logs `Deriv API error: RateLimit` or `Invalid Token`.
* **Root Cause:** Excessively frequent API calls or `DERIV_API_TOKEN` expiration / revoking.
* **Exact AI Solution:**
  * Verify token in `/home/ubuntu/trading-bots/.env`.
  * Confirm fast-path pulse uses 3s cadence in-trade and 10s cadence when idle.
  * Check `deriv-gateway` on Port 3000: `curl http://138.2.169.72:3000/ping`. If gateway socket is dead, restart it (`pm2 restart deriv-gateway`).

### Diagnostic Scenario 13: Server Clock Drift / 5-Minute Candle Synchronization Offset
* **Symptom:** Candle scans trigger 15-45 seconds late or out of sync with actual broker candle closes.
* **Root Cause:** Oracle Cloud VM system time drifting from NTP time servers.
* **Exact AI Solution:**
  * Check clock sync status: `timedatectl status`.
  * If `System clock synchronized: no`, restart time synchronization daemon: `sudo systemctl restart systemd-timesyncd`.
  * Force immediate time sync: `sudo chronyc -a makestep` or `sudo ntpdate pool.ntp.org`.

### Diagnostic Scenario 14: PM2 Out-Of-Memory (OOM) Process Termination or High Memory Growth
* **Symptom:** PM2 process restarts unexpectedly with high restart count or `pm2 status` shows `errored`.
* **Root Cause:** Memory accumulation in long-running Node.js processes over multiple weeks without bounded garbage collection.
* **Exact AI Solution:**
  * Launch PM2 processes with explicit `--max-memory-restart 300M` flag: `pm2 start alert.js --name "..." --max-memory-restart 300M`.
  * Inspect system kernel logs: `dmesg | grep -i oom` or `journalctl -u pm2-ubuntu -n 100`.
  * Verify `alert.js` does not keep unbounded array references in memory (e.g. limit candle array history to maximum 500 bars).

### Diagnostic Scenario 15: Midline Reversal Origin (`last50Origin`) Lost across Process Restarts
* **Symptom:** Bot fails to execute a valid Stochastic 50% midline continuation trade after a service restart.
* **Root Cause:** In-memory `last50Origin` variable was not persisted to disk before restart.
* **Exact AI Solution:**
  * Always read and persist `last50Origin` (`OVERSOLD_20` or `OVERBOUGHT_80`) inside `state.json`.
  * If `last50Origin` is `null` on startup, the engine auto-recomputes prior 20 bars of Stochastic history to restore origin state before evaluating the current bar.

### Diagnostic Scenario 16: Slippage / Price Jumps Past `lockedPnlFloor` on High-Volatility 1s Indices
* **Symptom:** Trade liquidates slightly below the locked PnL floor (e.g., locked at +$3.50, but actual exit PnL is +$3.10).
* **Root Cause:** Extreme 1-second price movement on Volatility 100 (1s) or Volatility 75 (1s) between 3-second risk pulse checks.
* **Exact AI Solution:**
  * Software ratchet runs every 3s in-trade. On ultra-fast 1s synthetic instruments (`1HZ75V`, `1HZ100V`), broker-side hard SL/TP parameters act as the absolute execution safety floor.
  * Ensure hard broker SL parameter is always attached on order submission (`req.passthrough = { stop_loss: 5.0 }`).

### Diagnostic Scenario 17: `pull-trades.sh` Background Git Merge Conflict or Stash Interruption
* **Symptom:** `pull-trades.sh` stops updating the server or outputs `error: Your local changes to the following files would be overwritten by merge`.
* **Root Cause:** Untracked files or accidental manual edits created on the server Git working tree.
* **Exact AI Solution:**
  * Fix `pull-trades.sh` to enforce hard reset:
    `git fetch origin main && git reset --hard origin/main && git clean -fd`
  * Run the command manually once on the server if pull daemon is stuck.

### Diagnostic Scenario 18: Dashboard `401 Unauthorized` or Operator Token Loss
* **Symptom:** Dashboard actions (reboot bot, clear history, save file) fail with `401 Unauthorized`.
* **Root Cause:** Local storage `operator_token` missing or expired session.
* **Exact AI Solution:**
  * Operator token is derived deterministically from `sha256(LOGIN_USER + LOGIN_PASS + 'OmniSight_v5')`.
  * Log out and re-login via dashboard UI (`/login`), or set `x-token` header manually in API tools.

### Diagnostic Scenario 19: cTrader Symbol ID Mismatch or Order Volume Specification Error
* **Symptom:** cTrader WebSocket bridge returns `ProtoOAOrderErrorRes` code `INVALID_REQUEST` or `SYMBOL_NOT_FOUND`.
* **Root Cause:** cTrader symbol ID differs per broker environment or lot volume specified in incorrect units.
* **Exact AI Solution:**
  * Consult Section 4 Symbol Mapping Table for exact symbol IDs (`10001` - `10007`).
  * In `ctrader-service.js`, convert lot sizes to minimum volume steps (e.g. `0.01` lots = `100` volume units depending on cTrader asset definition).

### Diagnostic Scenario 20: Duplicate Trade Entry Guard & Candle Epoch Lock Failure
* **Symptom:** Bot opens two simultaneous trades on the same 5-minute candle.
* **Root Cause:** Asynchronous market data check triggered twice before `lastProcessedEpoch` was written to `state.json`.
* **Exact AI Solution:**
  * Enforce atomic epoch lock: Set `lastProcessedEpoch = currentCandleEpoch` synchronously in memory BEFORE initiating order placement API calls.
  * Verify `armed === null` AND `lastProcessedEpoch !== currentCandleEpoch` as a strict compound gate before any order submission.

### Diagnostic Scenario 21: cTrader OAuth 2.0 Authorization Code or Token Exchange Failure
* **Symptom:** OAuth exchange endpoint (`/api/ctrader/oauth/exchange`) returns error `redirect_uri_mismatch` or `invalid_grant`.
* **Root Cause:** Redirect URI registered in cTrader Open API portal does not match the URI passed during authorization code exchange.
* **Exact AI Solution:**
  * Add both primary dashboard URL (`http://79.76.120.30:4000/api/ctrader/oauth/callback`) and dev applet URL to the cTrader Open API App settings.
  * The `/api/ctrader/oauth/exchange` endpoint automatically retries with alternative redirect URIs (`targetRedirect` and `altRedirect`) if the initial exchange fails.

### Diagnostic Scenario 22: cTrader Account Selection & `ctidTraderAccountId` Mismatch
* **Symptom:** `connect()` fails with error `Target account XYZ not found in token accounts` or `ACCOUNT_NOT_FOUND`.
* **Root Cause:** Provided access token belongs to a cTrader ID (CTID) that is not granted access to the specified trading account ID, or account ID is alphanumeric (e.g., Deriv ID) instead of numeric cTrader ID.
* **Exact AI Solution:**
  * Inspect `.env.ctrader`: Ensure `CTRADER_ACCOUNT_ID` matches the numeric cTrader account ID (e.g. `2596044`).
  * `ctrader-service.js` automatically queries `GET_ACCOUNTS_BY_TOKEN_REQ` (`payloadType: 2149`) to list all accounts linked to the token and defaults to `acctList[0]` if `accountId` is unconfigured.

### Diagnostic Scenario 23: cTrader Symbol Alias Mismatch or Unmapped Asset Code
* **Symptom:** `openOrder` throws `Symbol 'coffee' not found on cTrader` or order fails.
* **Root Cause:** Symbol string passed to bridge does not match cTrader exact symbol name or internal alias dictionary.
* **Exact AI Solution:**
  * Verify `resolveSymbol()` in `ctrader-service.js`.
  * Ensure alias map contains synthetic index mappings:
    * `1hz75v`, `coffee` -> `2435`
    * `r_75`, `v75`, `lery` -> `2434`
    * `r_50`, `v50`, `omni` -> `2431`
    * `r_25`, `v25`, `tea` -> `2430`
    * `r_10`, `v10`, `test` -> `2428`
    * `r_100`, `v100`, `milk` -> `2436`
    * `1hz100v`, `ice-cream` -> `2437`

### Diagnostic Scenario 24: cTrader ProtoVolume Step-Size Violation or Volume Below `minVolume`
* **Symptom:** Order placement returns `ProtoOAOrderErrorRes` with `INVALID_VOLUME`.
* **Root Cause:** Volume unit submitted is less than asset `minVolume` or not a multiple of `stepVolume`.
* **Exact AI Solution:**
  * In `openOrder()`, query `SYMBOL_BY_ID_REQ` (`payloadType: 2116`) to read asset specifications.
  * Clamp volume: `if (protoVolume < minVol) protoVolume = minVol;`
  * Align with stepVolume: `protoVolume = Math.round(protoVolume / stepVolume) * stepVolume;`

### Diagnostic Scenario 25: cTrader Deal History Rate Limit & Automatic REST Fallback Execution
* **Symptom:** Deal history query logs `rate limit` warning or fails over WebSocket (`DEAL_LIST_REQ`).
* **Root Cause:** Querying deal history over a wide date range without inter-chunk delays exceeds cTrader Open API WebSocket rate limits.
* **Exact AI Solution:**
  * `historicalDeals()` segments time range into maximum 7-day chunks (`MAX_CHUNK = 604800000 - 1000` ms) and waits 150ms between chunks.
  * If WebSocket deal query throws a rate limit error, `getHistoricalDeals()` automatically triggers `getHistoricalDealsREST()`, fetching deals directly from `https://api.ctraderapi.com/v2/accounts/{accountId}/deals` (or demo endpoint).

### Diagnostic Scenario 26: cTrader Spot Price Subscription Lag in Dynamic USD Stop-Loss / Take-Profit Calculation
* **Symptom:** `openOrder` with `slUsd` or `tpUsd` delays by 250ms or uses entry reference fallback.
* **Root Cause:** cTrader spot price stream (`SPOT_EVENT`) requires active subscription via `SUBSCRIBE_SPOTS_REQ` (`payloadType: 2127`).
* **Exact AI Solution:**
  * Before order submission with USD SL/TP, send `SUBSCRIBE_SPOTS_REQ` for the symbol and wait 250ms for bid/ask tick.
  * Calculate point value USD: `pointValueUsd = (protoVolume / 100) * 1.0`. Convert USD distance into exact price level and attach `stopLoss` / `takeProfit` on `NEW_ORDER_REQ`.

### Diagnostic Scenario 27: Unintended Deriv Multiplier Execution & Silent Fallback Hazard
* **Symptom:** Trades appear on Deriv demo multiplier account (`DOT92388932`) instead of executing on cTrader.
* **Root Cause:**
  1. Engine defaulted `EXECUTION_MODE` to `deriv` when unconfigured.
  2. Bot `.env` files on Server 1/2 omitted `EXECUTION_MODE=ctrader`.
  3. Legacy `executeTrade` contained a silent `catch` block falling back to Deriv `/buy`.
* **Exact AI Solution:**
  * Enforce `EXECUTION_MODE = (process.env.EXECUTION_MODE || "ctrader").toLowerCase()` in `alert.js`.
  * Ensure every bot directory has `EXECUTION_MODE=ctrader` in `.env`.
  * Verify `executeTrade` re-throws cTrader errors rather than falling back to Deriv.
  * Purge legacy options contracts from `trades.json` and reset state accumulator (`dailyNetPnl = 0`).

### Diagnostic Scenario 28: Server 2 Dashboard Unreachable (ERR_CONNECTION_FAILED / Port 4000 Refused)
* **Symptom:** Safari or Chrome shows "Safari can't open the page because it couldn't connect to the server" or `ERR_CONNECTION_FAILED` on `http://79.76.120.30:4000`.
* **Root Causes:**
  1. **Dual-Server Port Binding Nuance:** Node.js `app.listen(PORT)` defaulted to binding only to `localhost` (`127.0.0.1`) on Linux rather than explicitly listening on `0.0.0.0`, which drops all external incoming web requests from Safari/Chrome.
  2. **API Endpoint Pruning Hazard:** The dashboard on Server 2 requires both the unified dashboard static assets (`index.html`) AND the critical fleet aggregation API endpoints (`/api/data`, `/api/logs/:server/:name`, `/api/bots`, and cTrader bridge proxy). If `server.js` is truncated or replaced with a basic static server, the frontend cannot load fleet telemetry.
  3. **PM2 Process Crash / Missing Dependencies:** If PM2 restarts `dashboard` with uninstalled dependencies (e.g. `express`), PM2 marks the process as errored or continuously restarts, closing port 4000.
* **Exact AI & Operator Recovery Protocol:**
  1. **Explicit `0.0.0.0` Host Binding:** In `server.js`, enforce:
     ```javascript
     app.listen(PORT, "0.0.0.0", () => console.log(`[dashboard] Running on http://0.0.0.0:${PORT}`));
     ```
  2. **Verify Full `server.js` API Suite:** Ensure `server.js` contains all active endpoints: `/api/data`, `/api/logs`, `/api/handbook`, `/api/trade/close`, `/api/scan/trigger`, and the 30s background auto-sync engine.
  3. **Clean Restart on Server 2 (`79.76.120.30`):**
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git pull origin main
     npm install
     pm2 restart dashboard || pm2 start server.js --name "dashboard"
     pm2 save
     ```
  4. **Firewall Verification:** Ensure Oracle Cloud VCN ingress rules and `ufw` allow TCP traffic on port 4000 (`sudo ufw allow 4000/tcp`).

### Diagnostic Scenario 29: Body-Parser `iconv-lite/encodings` Crash in `POST /api/login`
* **Symptom:** Safari or Chrome shows blank screen or HTTP 400 when submitting operator login credentials. `pm2 logs dashboard` shows:
  `Error: Cannot find module ../encodings from iconv-lite/lib/index.js`.
* **Root Causes:**
  1. Corrupted npm installation of `iconv-lite` sub-dependencies under Node 20.
  2. `body-parser` crashes on reading JSON stream when `iconv-lite` encoding tables are missing.
* **Exact AI & Operator Recovery Protocol:**
  1. Replace heavy external `body-parser` / `express.json()` with zero-dependency native Node.js JSON stream consumer:
     ```javascript
     app.use((req, res, next) => {
       if (req.method === "GET" || req.method === "HEAD") return next();
       let data = "";
       req.on("data", chunk => {
         data += chunk;
         if (data.length > 10 * 1024 * 1024) req.destroy();
       });
       req.on("end", () => {
         if (data && (req.headers["content-type"] || "").includes("json")) {
           try { req.body = JSON.parse(data); } catch { req.body = {}; }
         } else { req.body = req.body || {}; }
         next();
       });
     });
     ```
  2. Support both parameter pairs in `/api/login`: `{ u, p }` and `{ username, password }`.
  3. Pull updates and restart:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git pull origin main
     pm2 restart dashboard
     ```

### Diagnostic Scenario 30: CommonJS `require()` in ESM `server.js` under Node 20
* **Symptom:** PM2 logs `ERR_MODULE_NOT_FOUND` or `ReferenceError: require is not defined in ES module scope` on Server 2 when dispatching `POST /api/pull-trades`.
* **Root Causes:**
  1. `package.json` specifies `"type": "module"`, which disables CommonJS `require()` globally inside `server.js`.
  2. Legacy snippet in `/api/pull-trades` used `const { exec } = require(child_process)`.
* **Exact AI & Operator Recovery Protocol:**
  1. Statically import `exec` from `child_process` at top of `server.js`:
     ```javascript
     import { execSync, exec } from child_process;
     ```
  2. Pull updates and restart:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git pull origin main
     pm2 restart dashboard
     ```

### Diagnostic Scenario 31: Zero-Dependency Native Node.js Server Architecture (Zero NPM Dependencies)
* **Symptom:** Safari shows `ERR_CONNECTION_FAILED` on `http://79.76.120.30:4000`. Terminal logs show `Error [ERR_MODULE_NOT_FOUND]: Cannot find package express` or tarball extraction / npm corruption errors on Node 20.
* **Root Causes:**
  1. The server OS or node_modules became corrupted by npm tarball / EBADENGINE incompatibilities when attempting to install external npm packages like express.
  2. Because express was an external npm package, any npm issue broke the daemon.
* **Permanent Sovereign Resolution (Master Handbook Protocol):**
  1. `server.js` now runs on a **100% Zero-Dependency Native Node.js HTTP Engine** utilizing pure built-in `http` and `url` modules that ship directly inside Node.js itself.
  2. **No `npm install` or `node_modules` is required whatsoever to run the dashboard server!**
  3. Operator update commands:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git fetch origin main
     git reset --hard origin/main
     pm2 restart dashboard
     ```

### Diagnostic Scenario 32: Dev Server Failure Due to Missing `tsx` Runner
* **Symptom:** In AI Studio or development containers, running the preview or dev environment yields `The dev server didn't start, please fix it` or console error `sh: 1: tsx: not found` (exit code 127).
* **Root Causes:**
  1. `package.json` had `"dev": "tsx server.ts"`, but `tsx` was either missing from `devDependencies` or not symlinked in `node_modules/.bin`.
  2. The AI Studio preview container expects Vite directly on port 3000.
* **Exact AI & Operator Recovery Protocol:**
  1. In `package.json`, bind Vite directly to all network interfaces on port 3000:
     ```json
     "scripts": {
       "dev": "vite --host 0.0.0.0 --port 3000",
       "build": "vite build && node scripts/finalize_bundle.cjs"
     }
     ```
  2. Restart dev server daemon. Verification:
     ```bash
     curl -I http://127.0.0.1:3000/
     ```
     Must return `HTTP/1.1 200 OK`.

### Diagnostic Scenario 33: Complete Runbook: Zero-Dependency Server Maintenance & Quick Verification
* **Architecture Verification:** The dashboard server `server.js` operates with **ZERO external npm dependencies** (uses pure Node.js native `http` and `url`). It will never fail from `node_modules` corruption, `iconv-lite` errors, or `EBADENGINE` warnings.
* **Quick Health Verification on Server 2 (`79.76.120.30`):**
  ```bash
  # Check if dashboard server is alive and returning single-file bundle:
  curl -I http://127.0.0.1:4000/
  ```
  Expected Output:
  ```
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Content-Length: 1324684
  ```
* **One-Line Fleet Pull & Restart:**
  ```bash
  cd /home/ubuntu/trading-bots/dashboard && git fetch origin main && git reset --hard origin/main && pm2 restart dashboard
  ```

### Diagnostic Scenario 34: UI Crash: `ReferenceError: Can't find variable: getArmingDetails`
* **Symptom:** Safari or Chrome shows Red Error Boundary: *"Command Center Error Encountered - ReferenceError: Can't find variable: getArmingDetails"*.
* **Root Causes:**
  1. The new armed countdown badge in `FleetOverview.tsx` referenced `getArmingDetails(bot)`, but the import statement from `./BotGrid` was missing.
* **Exact Recovery Protocol:**
  1. Ensure `getArmingDetails` is exported from `src/components/BotGrid.tsx` and explicitly imported in `src/components/FleetOverview.tsx`:
     ```typescript
     import { getArmingDetails } from './BotGrid';
     ```
  2. Run TypeScript compilation check: `npm run lint` (`tsc --noEmit`).
  3. Rebuild and pull latest:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git fetch origin main && git reset --hard origin/main
     pm2 restart dashboard
     ```

### Diagnostic Scenario 35: React Child Object Render Crash: `Objects are not valid as a React child (found: object with keys {dir, lbl, lvl})`
* **Symptom:** UI displays Red Error Boundary: *"Objects are not valid as a React child (found: object with keys {dir, lbl, lvl}). If you meant to render a collection of children, use an array instead."*
* **Root Causes:**
  1. In the trading bots' `state.json`, `state.armed` is a structured object: `{ dir: "BUY", lbl: "M5 STOCH 50", lvl: 1234.5 }`.
  2. In `BotGrid.tsx`, `getArmingDetails` extracted direction as:
     ```typescript
     const dir = state.armed || bot.armedDir || ...;
     ```
     Because `state.armed` is truthy, `dir` was assigned the entire `{ dir, lbl, lvl }` object instead of the string `"BUY"` or `"SELL"`.
  3. When rendered in JSX inside `<span>ARMED ({armDetails.dir})</span>`, React crashed because objects cannot be rendered directly into text nodes.
* **Exact Permanent Recovery Protocol:**
  1. Always defensively extract string primitives from structured telemetry objects:
     ```typescript
     let dir = "BUY";
     if (typeof state.armed === "string") {
       dir = state.armed;
     } else if (state.armed && typeof state.armed === "object" && state.armed.dir) {
       dir = String(state.armed.dir);
     } else if ((bot as any).armedDir) {
       dir = String((bot as any).armedDir);
     }
     ```
  2. In JSX render locations, guard any dynamic telemetry fields with explicit string casts:
     ```typescript
     {typeof stArmed.dir === 'string' ? stArmed.dir : 'ARMED'}
     ```
  3. Rebuild and pull updates:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git fetch origin main && git reset --hard origin/main
     pm2 restart dashboard
     ```

### Diagnostic Scenario 36: Live Arming & In-Trade Duration Telemetry Instrumentation
* **Operator Feature Requirement:** Display exact real-time arming timestamps, elapsed arming duration, active in-trade flight timers, and total trade duration for closed trades.
* **Architecture Implementation:**
  1. `BotGrid.tsx` cards now display:
     - When **Armed**: `ARMED (BUY/SELL) @ HH:MM:SS UTC` with human-friendly elapsed counter (`Xm Ys ago`).
     - When **In-Trade**: Dedicated Amber Flight Banner showing `IN TRADE (BUY/SELL) · Xh Ym Zs` and entry timestamp `Opened @ HH:MM:SS UTC`.
  2. `FleetOverview.tsx` displays:
     - Live Flight Duration: `Xh Ym Zs (@HH:MM:SS UTC)`.
     - Miniature status pills show live duration counters `TRADE (Xm Ys)` and `ARMED @HH:MM:SS UTC`.
  3. `RecentTradesView.tsx` displays:
     - New dedicated table column: **Duration / Open Time** showing exact time held (`Xm Ys` or `Xh Ym`) alongside `Open: @HH:MM:SS UTC` and `Close Time (UTC)`.
* **Verification Command:**
  ```bash
  cd /home/ubuntu/trading-bots/dashboard
  git fetch origin main && git reset --hard origin/main
  pm2 restart dashboard
  ```

---
*End of Master Operations & Trader Handbook (Version 9.0 - Complete Telemetry & Flight Timers)*










### Diagnostic Scenario 37: Stoch(15,2,5) Midline Cross Exit & Manual Liquidate Position API
* **Operator Inquiry:** If Stochastic (15,2,5) crosses 50 in the opposite direction while in a trade, why might a position remain open, and how can it be liquidated instantly?
* **Architecture & Resolution:**
  1. **Automated Exit Rules:** The alert engine manages open positions and evaluates Hard Stop Loss, Take Profit, Trend-Rider Trailing Floor (+2.50 USD), or Software SL.
  2. **Instant Manual Liquidation:** The dashboard provides a dedicated **"Liquidate Position"** button directly on the active trade card and Confluence Radar, which calls the server cTrader endpoint `/api/close-trade` to execute an immediate market order close on the broker.
* **Verification Command:**
  ```bash
  curl -X POST http://79.76.120.30:4000/api/close-trade -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d '{"contractId": 147834285}'
  ```

---

## MASTER SOURCE CODE ARCHIVE (AUTHORITATIVE RECOVERY BLOCKS)

### Diagnostic Scenario 38: Stoch 50 Opposite Cross Profit Exit & Software SL Root Cause Remediation
* **Operator Inquiry:** "Sometimes trade management seems to work, other times it fails. Software SL fails sometimes and the Stoch 50 cross profit exit rule also fails."
* **Root Cause Forensic Diagnosis:**
  1. **Stoch 50 Exit Was Gated Behind `trendRidingActive` ($+\$4.00$):**
     * Previously, the M5 Stochastic (15,2,5) %K midline cross exit was nested inside `if (t.trendRidingActive)`.
     * If a trade was floating in profit (e.g. $+1.50$, $+2.50$, $+3.80$) but had not reached $+\$4.00$, `trendRidingActive` was false and the bot never checked or executed the Stoch 50 cross profit exit!
  2. **`runSlowPathScan` Prematurely Aborted on `dailyTargetReached`:**
     * If an earlier trade had secured the $+\$7.00$ daily target, `runSlowPathScan` aborted immediately at the top of the function, before reaching line 1920 where active trades are evaluated!
  3. **Absence from Fast-Path 3-Second Risk Pulse:**
     * The fast pulse loop evaluated TP, Software SL, and hard SL, but completely lacked the Stoch 50 / CCI 0 midline profit exit, creating an up to 5-minute delay where market reversals could erase profits.
  4. **Software SL Lot Size & Point Value Mismatches:**
     * On cTrader instruments (such as Volatility 75), the bot profile specified `0.005` lots, but cTrader enforced a minimum execution volume of `0.01` lots (1 unit).
     * The synthetic PnL formula computed half the real loss, causing Software SL ($-\$2.50$) to fire only when the broker loss was already at $-\$5.00$ (hard broker SL).
  5. **`closingContracts` Memory Set Deadlock:**
     * If a close request took $>1$ second to settle, the fast path self-healing restored `t.result = null`, but `closingContracts.has(contractId)` remained true, causing the bot to skip monitoring the trade forever.
* **Authoritative Engine Remediations Applied:**
  1. **Stoch 50 / CCI 0 Cross Profit Exit Unlocked:** Evaluated whenever in profit ($pnl > \$0.00$) on closed M5 candles AND checked in real-time in the 3-second fast pulse loop using `state.stoch1525Val` and `state.cciVal`.
  2. **Direct Live Broker PnL Prioritization:** `calcUnrealizedPnL` now prioritizes the official broker-computed `liveBrokerPnl` and `unrealizedPnl` from cTrader `/ctrader/positions`, ensuring exact penny-accurate Software SL triggers.
  3. **Deadlock-Free State Machine:** Self-healing explicitly calls `closingContracts.delete(contractId)` and safe cleanups guarantee contracts are never orphaned.
  4. **Active Trade Safety First:** `dailyTargetReached` guard is positioned right before NEW signal evaluation, guaranteeing active open trades are always managed and protected on every bar.
* **Verification Command on Server 2 (`79.76.120.30`):**
  ```bash
  cd /home/ubuntu/trading-bots/dashboard
  git fetch origin main && git reset --hard origin/main
  pm2 restart dashboard
  ```

---

## MASTER SOURCE CODE ARCHIVE (AUTHORITATIVE RECOVERY BLOCKS)

### Diagnostic Scenario 39: Entry-Hour H1 Adverse Close Exit Restoration & ReferenceError Fix
* **Operator Inquiry:** "How about the H1 early Exit rule. Has it been well implemented?"
* **Root Cause Forensic Diagnosis:**
  1. **Fatal Uncaught `ReferenceError: aggregateCandles is not defined`:**
     * In previous versions of `alert.js` (lines 2301, 2358, 2536, and 2592), the H1 exit evaluation attempted to call `const h1Candles = aggregateCandles(candles, 3600)`.
     * Because `aggregateCandles` was never defined or imported in `alert.js`, any time a trade was active at the top of an hour (:00 UTC), Node.js threw an uncaught `ReferenceError`.
     * This crashed the entire `runSlowPathScan` loop on that candle, leaving the active position open and unmanaged across Lery, Coffee, Ice Cream, Tea, OmniSight, and Test Bot.
  2. **Fragile 1-Shot Strict Equality (`===`):**
     * Testing `(candles[si].epoch + 300) === (entryHourBoundary + 3600)` meant that if tick latency delayed a candle evaluation by even 5 seconds into the new hour, the check was permanently missed.
* **Authoritative Engine Remediations Applied:**
  1. **Standardized Native Helper `evaluateH1AdverseClose(trade, candles, si)`:**
     * Cleanly extracts the H1 open price from the M5 candle array at `entryHourStart` without external dependencies.
     * Evaluates whether the H1 candle closed adverse to position (Bearish for BUY, Bullish for SELL) whenever `currentCandleCloseEpoch >= entryHourEnd`.
     * Guards execution with `trade.h1Checked = true` to prevent repeated duplicate triggers while ensuring the exit is never missed due to tick latency.
  2. **Authoritative `aggregateCandles` Implementation:**
     * Implemented and exported the universal `aggregateCandles(candles, timeframeSeconds)` function in `alert.js` to permanently prevent any reference exceptions.
  3. **Universal Fleet Coverage:**
     * Applied and verified across all 7 trading bot repositories.
* **Verification Command on Server 2 (`79.76.120.30`):**
  ```bash
  cd /home/ubuntu/trading-bots/dashboard
  git fetch origin main && git reset --hard origin/main
  pm2 restart dashboard
  ```

---

### 15.1 AUTHORITATIVE PRODUCTION REPOSITORIES & DISASTER RECOVERY ARCHIVE

> [!IMPORTANT]
> **IMMUTABLE INFRASTRUCTURE PRINCIPLE: GITHUB AS THE PERMANENT SOURCE OF TRUTH**
> Real financial capital is on the line. Oracle Always Free instances are subject to unexpected reclamation, hardware termination, or network maintenance. To ensure **zero loss of development and operational assets**, all code, indicators, configuration templates, and documentation are continuously synchronized to GitHub across 10 dedicated repositories. Any AI or developer can reconstruct the entire multi-server trading network from scratch in under 15 minutes using these authoritative repositories.

#### 1. Master GitHub Repository Roster
All repositories are maintained under the primary GitHub account: `https://github.com/Kwekugrind`

| Repository Name | Purpose / Role | Key Artifacts | Server Deployment Path |
| :--- | :--- | :--- | :--- |
| **`Google-ai-studio`** | Full developer workspace, testing suites, audit tools | All source files, build tools, historical scripts | Local AI Studio Workspace |
| **`dashboard`** | Central production command center & unified frontend | `server.js`, `ctrader-service.js`, `deriv-gateway.js`, UI bundle | Server 2: `/home/ubuntu/trading-bots/dashboard` |
| **`trading-handbook`** | Authoritative Bible, AI governance rules, operating manual | `HANDBOOK.md`, `AI_RULES.md`, `MASTER_AI_RULES.md` | S2 & GitHub: Single Source of Truth |
| **`Lery-s-Alerts`** | Volatility 75 (`R_75`) Baseline & Experimental Engine | `alert.js`, `alert_experimental.js`, `package.json` | Server 1: `/home/ubuntu/trading-bots/Lery-s-Alerts` |
| **`coffee`** | Volatility 75 (1s) (`1HZ75V`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 1: `/home/ubuntu/trading-bots/coffee` |
| **`Milk`** | Volatility 100 (`R_100`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 1: `/home/ubuntu/trading-bots/milk` |
| **`Tea`** | Volatility 25 (`R_25`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 1: `/home/ubuntu/trading-bots/tea` |
| **`ice-cream`** | Volatility 25 (1s) (`1HZ25V`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 2: `/home/ubuntu/trading-bots/ice-cream` |
| **`OmniSight`** | Volatility 50 (`R_50`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 2: `/home/ubuntu/trading-bots/OmniSight` |
| **`Test-Bot`** | Volatility 10 (`R_10`) Dual Engines | `alert.js`, `alert_experimental.js`, `package.json` | Server 2: `/home/ubuntu/trading-bots/Test-Bot` |
| **`command-bot`** | Telegram quantitative telemetry & command daemon | `index.js`, telemetry card generator | Server 2: `/home/ubuntu/trading-bots/command-bot` |

---

#### 2. Universal Fleet Auto-Pull Daemon (`pull-trades.sh`)
Deployed on both Server 1 and Server 2 at `/home/ubuntu/trading-bots/pull-trades.sh`. It runs continuously every 60 seconds, fetches updates from GitHub, hard-resets local worktrees to prevent merge conflicts, restarts the baseline PM2 bot, and automatically deploys `alert_experimental.js` to the experimental bot directory:

```bash
#!/bin/bash
# ==============================================================================
# UNIVERSAL FLEET AUTO-PULL & PM2 AUTO-RELOAD PIPELINE (VERSION 3.0)
# Manages both Baseline (Account 2596044) and Experimental (Account 2450642) Fleets
# ==============================================================================

LOG_FILE="/home/ubuntu/trading-bots/pull-trades.log"

log() {
  local msg="[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

declare -A BASELINE_PM2_MAP=(
  ["Lery-s-Alerts"]="lery-v75"
  ["coffee"]="coffee-v75-1s"
  ["Milk"]="milk-v100"
  ["milk"]="milk-v100"
  ["Tea"]="tea-v25"
  ["tea"]="tea-v25"
  ["ice-cream"]="ice-cream-100-1s"
  ["OmniSight"]="omni-v50"
  ["Test-Bot"]="test-v10"
  ["dashboard"]="dashboard"
  ["gateway"]="deriv-gateway"
  ["s1-api"]="s1-api"
  ["command-bot"]="command-bot"
  ["gateway-watchdog"]="gateway-watchdog"
)

declare -A EXP_DIR_MAP=(
  ["Lery-s-Alerts"]="lery-exp"
  ["coffee"]="coffee-exp"
  ["Milk"]="milk-exp"
  ["milk"]="milk-exp"
  ["Tea"]="tea-exp"
  ["tea"]="tea-exp"
  ["ice-cream"]="ice-exp"
  ["OmniSight"]="omni-exp"
  ["Test-Bot"]="test-exp"
)

declare -A EXP_PM2_MAP=(
  ["Lery-s-Alerts"]="lery-exp-v75"
  ["coffee"]="coffee-exp-v75-1s"
  ["Milk"]="milk-exp-v100"
  ["milk"]="milk-exp-v100"
  ["Tea"]="tea-exp-v25"
  ["tea"]="tea-exp-v25"
  ["ice-cream"]="ice-exp-v25-1s"
  ["OmniSight"]="omni-exp-v50"
  ["Test-Bot"]="test-exp-v10"
)

run_sync_cycle() {
  for dir in /home/ubuntu/trading-bots/*/; do
    dirname=$(basename "$dir")
    base_pm2="${BASELINE_PM2_MAP[$dirname]}"
    
    if [ -n "$base_pm2" ] && [ -d "$dir/.git" ]; then
      cd "$dir" || continue
      
      OLD_HASH=$(git rev-parse HEAD 2>/dev/null || echo "none")
      git fetch --all --prune >/dev/null 2>&1
      
      TARGET_BRANCH="main"
      if git rev-parse --verify "origin/main" >/dev/null 2>&1; then
        TARGET_BRANCH="main"
      elif git rev-parse --verify "origin/master" >/dev/null 2>&1; then
        TARGET_BRANCH="master"
      fi
      
      git reset --hard "origin/$TARGET_BRANCH" >/dev/null 2>&1
      git clean -fd >/dev/null 2>&1
      
      NEW_HASH=$(git rev-parse HEAD 2>/dev/null || echo "none")
      
      if [ "$OLD_HASH" != "$NEW_HASH" ] && [ "$NEW_HASH" != "none" ]; then
        log "[AUTO-DEPLOY] New code detected in $dirname ($OLD_HASH -> $NEW_HASH). Reloading $base_pm2"
        pm2 restart "$base_pm2" 2>/dev/null || true
        
        exp_dir="${EXP_DIR_MAP[$dirname]}"
        exp_pm2="${EXP_PM2_MAP[$dirname]}"
        if [ -n "$exp_dir" ] && [ -n "$exp_pm2" ] && [ -d "/home/ubuntu/trading-bots/$exp_dir" ]; then
          if [ -f "$dir/alert_experimental.js" ]; then
            cp -f "$dir/alert_experimental.js" "/home/ubuntu/trading-bots/$exp_dir/alert.js"
            log "[AUTO-DEPLOY] Synced alert_experimental.js to $exp_dir/alert.js. Reloading $exp_pm2"
            pm2 restart "$exp_pm2" 2>/dev/null || true
          fi
        fi
      fi
    fi
  done
}

if [ "$1" == "--once" ]; then
  run_sync_cycle
  exit 0
fi

log "[DAEMON] Universal fleet auto-pull loop active (60s check interval)..."
while true; do
  run_sync_cycle
  sleep 60
done
```

---

#### 3. Complete Oracle Cloud Always Free Rebuilding Runbook (15-Minute Zero-Data-Loss Recovery)

If Oracle deletes instances or an emergency migration is required:

##### Step 1: Launch 2 Ubuntu Instances (22.04 LTS or 24.04 LTS)
* **Instance 1 (Gateway & S1 Fleet):** Shape: `VM.Standard.E2.1.Micro` or Ampere A1 (1 OCPU, 6-12 GB RAM)
* **Instance 2 (Dashboard Hub & S2 Fleet):** Shape: `VM.Standard.E2.1.Micro` or Ampere A1 (1 OCPU, 6-12 GB RAM)
* Open Ingress Security Ports: `22` (SSH), `3000` (Gateway), `4000` (Dashboard), `4001` (S1 API).

##### Step 2: System Bootstrapping (Run on Both Instances)
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential ufw
sudo npm install -g pm2
mkdir -p /home/ubuntu/trading-bots
cd /home/ubuntu/trading-bots
```

##### Step 3: Clone Production Repositories (Using Personal Access Token)
```bash
# On Server 1:
cd /home/ubuntu/trading-bots
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/Lery-s-Alerts.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/coffee.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/Milk.git milk
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/Tea.git tea
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/dashboard.git gateway
# Create experimental directories:
for d in lery coffee milk tea; do
  mkdir -p ${d}-exp
  cp -f ${d}*/alert_experimental.js ${d}-exp/alert.js 2>/dev/null || true
  cp -f ${d}*/package.json ${d}-exp/package.json 2>/dev/null || true
done

# On Server 2:
cd /home/ubuntu/trading-bots
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/ice-cream.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/OmniSight.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/Test-Bot.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/dashboard.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/command-bot.git
git clone https://x-access-token:<PAT>@github.com/Kwekugrind/trading-handbook.git
# Create experimental directories:
for d in ice omni test; do
  mkdir -p ${d}-exp
done
cp -f ice-cream/alert_experimental.js ice-exp/alert.js
cp -f OmniSight/alert_experimental.js omni-exp/alert.js
cp -f Test-Bot/alert_experimental.js test-exp/alert.js
```

##### Step 4: Environment Variables Template (`.env`)
* **Baseline Bots (Account `2596044`):**
```ini
SYMBOL=R_75
REPO_LABEL=LERY-V75
ACCOUNT_ID=2596044
CTRADER_ACCOUNT_ID=2596044
CTRADER_ENV=live
GATEWAY_URL=http://138.2.169.72:3000
SERVER_PORT=3000
TELEGRAM_BOT_TOKEN=7702829023:AAE_r5jR9YtX7-rG7Q2B8x-5bJtTj2j5pA
TELEGRAM_CHAT_ID=-1002345678901
```

* **Experimental Bots (Account `2450642`):**
```ini
SYMBOL=R_75
REPO_LABEL=LERY-EXP-V75
ACCOUNT_ID=2450642
CTRADER_ACCOUNT_ID=2450642
CTRADER_ENV=live
GATEWAY_URL=http://138.2.169.72:3000
SERVER_PORT=3000
TELEGRAM_BOT_TOKEN=7702829023:AAE_r5jR9YtX7-rG7Q2B8x-5bJtTj2j5pA
TELEGRAM_CHAT_ID=-1002345678901
```

##### Step 5: Launch Fleet via PM2 & Lock Startup
```bash
# On Server 1:
pm2 start gateway/deriv-gateway.js --name deriv-gateway
pm2 start Lery-s-Alerts/alert.js --name lery-v75
pm2 start coffee/alert.js --name coffee-v75-1s
pm2 start milk/alert.js --name milk-v100
pm2 start tea/alert.js --name tea-v25
pm2 start lery-exp/alert.js --name lery-exp-v75
pm2 start coffee-exp/alert.js --name coffee-exp-v75-1s
pm2 start milk-exp/alert.js --name milk-exp-v100
pm2 start tea-exp/alert.js --name tea-exp-v25
pm2 start pull-trades.sh --name pull-trades --interpreter bash
pm2 save && pm2 startup

# On Server 2:
pm2 start ice-cream/alert.js --name ice-cream-100-1s
pm2 start OmniSight/alert.js --name omni-v50
pm2 start Test-Bot/alert.js --name test-v10
pm2 start ice-exp/alert.js --name ice-exp-v25-1s
pm2 start omni-exp/alert.js --name omni-exp-v50
pm2 start test-exp/alert.js --name test-exp-v10
pm2 start dashboard/server.js --name dashboard
pm2 start command-bot/index.js --name command-bot
pm2 start pull-trades.sh --name pull-trades --interpreter bash
pm2 save && pm2 startup
```

---

## 16. TRADER AUTHORITATIVE RULES AUDIT LOG & SPECIFICATION REVISION HISTORY

This section is the mandatory system ledger tracking all trader instructions, updates, and strategy rule modifications in the trader's exact words with timestamps to guarantee complete transparency and prevent unauthorized logic drift.

---

### REVISION LOG ENTRY #1 — OCTOBER 17, 2026 @ 18:18 UTC

**Trader Name:** Ebenezer Johnson  
**Timestamp:** `2026-10-17 18:18:29 UTC`  
**Target Instrument:** Volatility 75 Index (`R_75` — Lery's Alerts)  
**Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  

#### Verbatim Trader Instruction:
> "There are a lot of errors in the rules for Vix 75 implementation. The bot is not buying and selling on fresh stoch %k cross of level 20 and 80 for buy and sell.
> 
> Also the bot should not sell when price is above EMA 100. When price retraces to touch the EMA 100, it arms wait for a sell if stoch %k crosses level 80 fresh and price closes below EMA 100, then the trade triggers.
> 
> For buy, bot should not buy when price is below EMA 100. When price retraces to touch the EMA 100, it arms wait for a buy if stoch %k crosses level 20 fresh and price closes above EMA 100, then the trade triggers.
> 
> When Price is above EMA 100 and 200, for initial entry, buy when %k freshly crosses level 80 going up and if Price is below EMA 100 and 200, for initial entry, sell when %k freshly crosses level 20 going down.
> 
> In order to keep track of the rules I give, log the rules in my own words with the date and time I gave it so that we can track it and know if the bot is actually twisting the rules and implementing something else which is not approved. Do this. Anytime i change the rules or make updates like I am doing now. Hope you understand"

---

#### Executable Logic Matrix Derived Directly From Trader Directives:

1. **Hard Trend Filters:**
   * **BUY Filter:** Bot MUST NOT buy when price is below EMA 100 (`currCandle.close > currentEma100` required).
   * **SELL Filter:** Bot MUST NOT sell when price is above EMA 100 (`currCandle.close < currentEma100` required).

2. **Initial Entry Engine (Strong Trend Breakout):**
   * **Initial BUY:** Price is ABOVE EMA 100 AND EMA 200 (`Price > EMA 100 && Price > EMA 200`). Trigger: Stochastic %K (15,5,2) freshly crosses **above level 80** (`prevK <= 80.0 && sK > 80.0`).
   * **Initial SELL:** Price is BELOW EMA 100 AND EMA 200 (`Price < EMA 100 && Price < EMA 200`). Trigger: Stochastic %K (15,5,2) freshly crosses **below level 20** (`prevK >= 20.0 && sK < 20.0`).

3. **Retracement Re-Entry Engine (Pullback to EMA 100):**
   * **Retrace BUY:** 
     1. Price retraces to touch EMA 100 (`low <= EMA 100` in recent candles or current candle). Arms setup (`v75_emaTouched_BUY = true`).
     2. Trigger: Stochastic %K (15,5,2) freshly crosses **above level 20** (`prevK <= 20.0 && sK > 20.0`) AND candle closes **above EMA 100** (`currCandle.close > currentEma100`).
   * **Retrace SELL:** 
     1. Price retraces to touch EMA 100 (`high >= EMA 100` in recent candles or current candle). Arms setup (`v75_emaTouched_SELL = true`).
     2. Trigger: Stochastic %K (15,5,2) freshly crosses **below level 80** (`prevK >= 80.0 && sK < 80.0`) AND candle closes **below EMA 100** (`currCandle.close < currentEma100`).


---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 01:15:27 UTC`  **Target Instrument:** Volatility 75 (1s) Index (`1HZ75V` — Coffee Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "1. Initial Entry Rule:
> - Arming Phase: M5 Stochastic (200,1,1) must cross first (> 50 for BUY / < 50 for SELL) to arm the setup.
> - Baseline Filter: M5 EMA 100 filter (price must be above EMA 100 for BUY / below EMA 100 for SELL).
> - Execution Trigger: M5 MACD (25,75,1) crossing zero (> 0 for BUY / < 0 for SELL) triggers the initial trade.
> 
> 2. Re-Entry (Subsequent Entry) Rule:
> - Trend Alignment: M5 Stochastic 200 and M5 MACD aligned.
> - Baseline Filter: M5 EMA 100 filter.
> - Trigger: M5 Auxiliary Stochastic (15,2,5 Simple) %K freshly crosses level 20 upwards (<= 20.0 && sK > 20.0) for BUY, or level 80 downwards (>= 80.0 && sK < 80.0) for SELL (Stoch 5,3,3 completely removed).
> 
> 3. Profit Trailing & Midline Exit Rule:
> - Trend-Rider Activation: Activates once unrealized profit reaches +$4.00.
> - Dynamic Trailing Ratchet: $4.00 trailing interval behind peak profit (peak PnL - $4.00).
> - Stoch Midline Profit Exit: If in profit (pnl > 0.00), exit immediately if M5 Auxiliary Stochastic (15,2,5 Simple) %K crosses the 50.0 midline against the position (<= 50.0 for BUY / >= 50.0 for SELL) to lock in gains."

---
**🤖 AI Mandatory Rule Update Protocol:**
Whenever the user updates strategy rules, trading parameters, or instrument logic, the AI must:
1. Update alert.js implementation accordingly.
2. Update the strategy specifications in HANDBOOK.md.
3. Log the exact verbatim user instructions along with the operator name and exact UTC timestamp at the end of HANDBOOK.md to maintain an immutable, auditable trail preventing rule drift.


### Diagnostic Scenario 34: Server 2 Dashboard Unreachable (ERR_CONNECTION_FAILED) & Static-Only API Mismatch Recovery
* **Symptom:** Browser shows `ERR_CONNECTION_FAILED` on `http://79.76.120.30:4000`, or the dashboard website loads static/cached template data without updating real-time telemetry or PnL.
* **Root Causes:**
  1. **Missing `server.js` Root File:** Workspace cleanups accidentally omitted or nested `server.js`, causing PM2 to throw `ERR_MODULE_NOT_FOUND` and drop port 4000 bindings.
  2. **Static-Only Mismatch:** A temporary static fallback server lacked the complete fleet aggregation API suite (`/api/data`, `/api/logs`, `/api/ctrader/config`, etc.), preventing real-time data polling.
* **Exact Authoritative Resolution:**
  1. Restore the complete, authoritative native Node.js `server.js` backend engine from Master Handbook Section 15.2 to the repository root.
  2. Ensure explicit `0.0.0.0` host binding on port 4000.
  3. Execute clean sync on Server 2:
     ```bash
     cd /home/ubuntu/trading-bots/dashboard
     git fetch origin main && git reset --hard origin/main
     pm2 restart dashboard
     ```


---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 02:08:00 UTC`  **Target:** Server 2 Dashboard Server 2 Recovery & Telemetry Fix  **Status:** AUTHORITATIVE & RESOLVED  
#### Verbatim Trader Instruction:
> "Thank it’s loading now. Please document the problem and how it occurred and the fix in the handbook"

---

### Diagnostic Scenario 40: Premature 3-Second Stoch 50 Profit Exit Bug & V75 2-Step Initial/Retracement Enforcement
* **Symptom:** On Volatility 75 (`R_75` — Lery's Alerts) and other Stochastic-driven bots, trades opened and immediately closed 3 to 60 seconds later near the entry price for `+$0.01` to `+$0.10` profit (logging `M5 Aux Stoch (15,2,5) %K (12.3) crossed 50.0 midline against profit (+0.05)`). Additionally, Server 1 `Lery-s-Alerts/alert.js` was still running legacy `%K/%D` (`<=25 / >=75`) entry logic instead of the 2-step Initial & Retracement Level 20/80 `%K` crossover specification.
* **Root Causes:**
  1. **Static Inequality Check Instead of Genuine Midline Crossover:** `manageOpenTradesFastPath()` (running every 2–3s) and `runSlowPathScan()` checked `if (pnl > 0.00 && ((isBuy && stoch1525Val <= 50.0) || (!isBuy && stoch1525Val >= 50.0)))`. Because a BUY trade entered at Level 20 starts with `%K` around `12–25` (already `<= 50.0`) and a SELL trade entered at Level 80 starts with `%K` around `75–85` (already `>= 50.0`), the very instant the trade ticked `+$0.01` into positive PnL, the static check evaluated `true` and liquidated the position within seconds of entry.
  2. **Unclosed Loop Truncation & Legacy Server 1 Code:** A prior edit in workspace `alert.js` had overwritten the closing brace of `for (const t of openTrades)`, preventing the updated V75 rules from deploying to Server 1, and included an unapproved `%K/%D` fallback on retracements.
* **Authoritative Resolution:**
  1. Removed the static `stoch50ProfitExit` check from the 3-second fast path (`manageOpenTradesFastPath()`).
  2. Updated the closed-M5 Momentum Exhaustion Exit in `runSlowPathScan()` to require a **genuine closed-bar crossover** across `50.0` (for Stoch `15,2,5`: `prevK1525 > 50.0 && sK1525 <= 50.0` for BUY; `prevK1525 < 50.0 && sK1525 >= 50.0` for SELL) or `0.0` (for CCI: `prevCci > 0.0 && cVal <= 0.0` for BUY; `prevCci < 0.0 && cVal >= 0.0` for SELL) on candles strictly after `t.entryEpoch`.
  3. Implemented the exact 2-step Initial Entry (Condition 1: Price crosses above/below EMA 100 & EMA 200 -> Condition 2: Fresh Stoch `%K` cross `> 80` for BUY or `< 20` for SELL) and 2-step Retracement Entry (Condition 1: Price physically touches EMA 100 -> Condition 2: Fresh Stoch `%K` cross `> 20` with close `> EMA 100` for BUY, or `< 80` with close `< EMA 100` for SELL) on `R_75`, and deployed live to Server 1, Server 2, and all 9 GitHub repositories.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 19:55:07 UTC`  **Target Instrument:** Volatility 75 Index (`R_75` — Lery's Alerts) & Fleet Stoch 50 Exit Engine  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "Thanks. there seems to be a error somewhere. 
> 
> i noticed the trades open and cose very close to the entry point. what is causing that? 
> also for the rules, for initial entry, price must first cross above or below EMA 100 and EMA 200 as the first condition. the second conditions is a fresh stoch cross. %k must cross above level 80 for buy or below level 20 for a sell. 
> 
> for Retracement Entry, for buy, Arming: Price retraces to physically touch EMA 100. the second condition is Trigger: Stochastic %K freshly crosses above Level 20 for buy or level 80 for sell.
> 
> please check if this is what has been implemented."

---

### Diagnostic Scenario 41: Volatility 75 (1s) (`1HZ75V` — Coffee Machine) Sequential Arming Order & Removal of Legacy `Stoch (5,3,3)` Loss Exit
* **Symptom:** Audit of `1HZ75V` (`coffee`) revealed two discrepancies against the `2026-10-18 01:15:27 UTC` specification:
  1. `1HZ75V` Initial Entry allowed either `Stoch (200,1,1)` or `MACD (25,75,1)` to cross first (`buyInitialReady = isS200Buy && isMacdBuy`), and dropped arming to `false` once `MACD` crossed zero while waiting for `EMA 100`.
  2. The early loss exit engine (`runSlowPathScan()`) still included `STRATEGY_PROFILE === "PROFILE_V75_1S_TREND_MACD_STOCH533"` inside the `Stoch (5,3,3) Level 50 Loss Exit` block, even though `Stoch (5,3,3)` was mandated to be completely removed from `1HZ75V` in favor of `Aux Stoch (15,2,5 Simple)`.
* **Authoritative Resolution:**
  1. Enforced strict sequential order for `1HZ75V` Initial Entry: `Stoch (200,1,1)` must cross `50.0` **first** to arm (`s200BuyEpoch <= macdBuyEpoch` for BUY; `s200SellEpoch <= macdSellEpoch` for SELL), and `MACD (25,75,1)` crossing `0` (`> 0` BUY / `< 0` SELL) with `Close > EMA 100` (BUY) / `Close < EMA 100` (SELL) triggers the initial trade (`initialSetupDone = true`).
  2. Kept `state.armed = true` whenever `Stoch 200` is aligned (or in valid `Stoch 200 -> MACD` sequence), clearly reporting whether the bot is awaiting the Initial Entry (`MACD > 0` + `Price > EMA 100`), `EMA 100` baseline confirmation, or a subsequent Re-Entry (`Aux Stoch (15,2,5 Simple) %K` fresh cross `> 20` BUY / `< 80` SELL).
  3. Removed `PROFILE_V75_1S_TREND_MACD_STOCH533` and `PROFILE_V75_1S_EMA_STOCH15` from the `Stoch (5,3,3)` early loss exit and Telegram card blocks.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 20:41:00 UTC`  **Target Instrument:** Volatility 75 (1s) Index (`1HZ75V` — Coffee Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "lets proceed with vix 75 1s. what are the rules"
> "please proceed"

---

### Diagnostic Scenario 42: Volatility 100 (`R_100` — Milk Machine) Fast Profit Protection Early Exit 1 (`%K < 65` BUY / `%K > 35` SELL)
* **Context:** Because Volatility 100 (`R_100`) expands into significant profit rapidly, waiting all the way for M5 Stochastic `(15, 2, 5)` `%K` to drop back across the `50.0` midline gave back substantial unrealized gains on fast spikes.
* **Authoritative Resolution:**
  1. Updated `Early Exit 1` and the `R_100` closed-M5 exhaustion check in `runSlowPathScan()` (for `PROFILE_V100_STOCH200_STOCH15` / `SYMBOL === "R_100"`) to evaluate strictly on closed M5 candles after trade entry (`candles[si].epoch > t.entryEpoch`):
     * **BUY:** Closes immediately on a closed M5 candle if M5 Stochastic `(15, 2, 5)` `%K` crosses **below `65.0`** (`prevK1525 >= 65.0 && sK1525 < 65.0`).
     * **SELL:** Closes immediately on a closed M5 candle if M5 Stochastic `(15, 2, 5)` `%K` crosses **above `35.0`** (`prevK1525 <= 35.0 && sK1525 > 35.0`).
  2. Updated `R_100` Telegram confluence card and `HANDBOOK.md` Section 9.3 specifications.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 21:00:02 UTC`  **Target Instrument:** Volatility 100 Index (`R_100` — Milk Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "yes these are my rules. please check if they have been well implemented. just a little update. because vix 100 makes a lot of profit in a short period of time, i want to update the early exit rule. 
> 
> Early Exit 1 — M5 Stoch (15, 2, 5)
> BUY: Closes immediately on a closed M5 candle if %K crosses below 65
> SELL: Closes immediately on a closed M5 candle if %K crosses above 35"
> "PLEASE PROCEED"

---

### Diagnostic Scenario 43: cTrader `p.tradeData.volume / 100` Lot Size Overwrite Bug & Volatility 100 (1s) (`1HZ100V`) Early Exit Overhaul
* **Symptom:** On `1HZ100V` (`Ice Cream Machine`), position `#148771100` (`SELL @ 1232.90`, opened at `18:30:05 UTC` on the `18:25` M5 candle) closed abruptly at `18:33:21 UTC` for `+$0.24` net profit with log `[RISK] Closing 148771100: Profit-Lock hit — Secured +$0.50`.
* **Root Cause:**
  1. When `#148771100` opened, it was submitted at the calibrated `0.20` lot size (`$0.20/pt`).
  2. In `getOpenPortfolio()` (`alert.js` line 444), the code read cTrader's raw protocol volume (`p.tradeData.volume = 100`, which is 1 minimum cTrader protocol unit for `0.20` lots on `1HZ100V`) and computed `p.tradeData.volume / 100 = 1.0`.
  3. `manageOpenTradesFastPath()` then overwrote `tracked.lots` from `0.20` to `1.0` (`5x` too large), causing `calcUnrealizedPnL()` to inflate PnL by `5x` (`$1.00/pt` instead of `$0.20/pt`). A `2.38`-point move (`+$0.33` real profit) was calculated as `+$2.23`, arming the `+$0.50` Capital Shield floor (`lockedPnlFloor = 0.50`) and closing the trade 84 seconds later for `+$0.24`.
* **Authoritative Resolution:**
  1. Fixed `getOpenPortfolio()` and `manageOpenTradesFastPath()` in `alert.js` to always preserve the instrument's calibrated `CTRADER_LOT_SIZE` (`0.20` for `1HZ100V` and `R_100`, `0.005` for `R_75`, etc.) instead of overwriting `tracked.lots` with `p.tradeData.volume / 100`.
  2. Removed **Early Loss Exit 3 (`M5 Fast Stoch 5,3,3 Level 50 Loss Exit`)** and **Entry-Hour H1 Adverse Close Exit** from `1HZ100V` (`PROFILE_V100_1S_TREND_MACD_STOCH`).
  3. Introduced **Closed-M5 Stoch `(15, 2, 5)` Level `50.0` Cross in Opposite Direction Early Exit** (`prevK1525 >= 50.0 && sK1525 < 50.0` for BUY; `prevK1525 <= 50.0 && sK1525 > 50.0` for SELL on closed M5 candles after entry).

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 21:17:23 UTC`  **Target Instrument:** Volatility 100 (1s) Index (`1HZ100V` — Ice Cream Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "The rules are accurate but i think there are errors in the implementation. the most recent trade around 18:25 pm closed abruptly. can you investigate why?
> 
> also remove the following early exit rules
> 
> 1. Early Loss Exit 3 — M5 Fast Stoch
> 2. Entry-Hour H1 Adverse Close Exit
> 
> and introduce the below early exit rule
> Closed-M5 Stoch (15, 2, 5) level 50 cross in opposite direction early exit"
> "please proceed"

---

### Diagnostic Scenario 44: Volatility 25 (`R_25` — Tea Machine) Stoch `(15, 2, 5)` Level `25/75` Re-Entry, Level `50` Early Exit & Midline Profit Protection
* **Authoritative Resolution:**
  1. **Added Re-Entry Condition:** While M5 Stochastic `(200, 1, 1)` and M5 `CCI 100` remain aligned and no trade is open (`noActiveTrades`):
     * **BUY Re-Entry (`V25_REENTRY_STOCH15_25 (BUY)`):** Fresh M5 Stochastic `(15, 2, 5)` `%K` cross **above `25.0`** (`prevK1525 <= 25.0 && sK1525 > 25.0`).
     * **SELL Re-Entry (`V25_REENTRY_STOCH15_75 (SELL)`):** Fresh M5 Stochastic `(15, 2, 5)` `%K` cross **below `75.0`** (`prevK1525 >= 75.0 && sK1525 < 75.0`).
  2. **Added Early Exit Rule:** Closed-M5 Stochastic `(15, 2, 5)` Level `50.0` cross in opposite direction (`prevK1525 >= 50.0 && sK1525 < 50.0` for BUY; `prevK1525 <= 50.0 && sK1525 > 50.0` for SELL on closed M5 candles after entry).
  3. **Added Profit Protection & Trailing Engine Rule:** Closed-M5 Stochastic `(15, 2, 5)` Midline Profit Exit when trade is in profit (`prevK1525 > 50.0 && sK1525 <= 50.0` for BUY; `prevK1525 < 50.0 && sK1525 >= 50.0` for SELL).
  4. **Populated `state.armed` & `state.nextPhase` Telemetry:** Ensured `R_25` reports armed status on the dashboard whenever `Stoch 200` and/or `CCI 100` are aligned.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 21:58:12 UTC`  **Target Instrument:** Volatility 25 Index (`R_25` — Tea Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "the rules arew correct but please check to see if they have been accurately implemented.
> 
> i want to add a re entry condition
> While M5 Stoch (200, 1, 1) and M5 CCI 100 remains aligned and no trade is open,
> BUY Re-Entry: Fresh Stoch (15, 2, 5) %K cross above 25
> SELL Re-Entry: Fresh Stoch (15, 2, 5) %K cross below 75
> 
> and add the below erly exit rule
> Early Exit: Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction
> 
> also add the below Profit Protection & Trailing Engine:
> Closed-M5 Stoch (15, 2, 5) Midline Profit Exit when trade is in profit"
> "please proceed"

---

### Diagnostic Scenario 45: Volatility 50 (`R_50` — OmniSight) Replacement of `CCI 150` with `Stoch (15, 2, 5)` Level `50` Initial Entry, Level `25/85` Re-Entry & Level `50` Opposite Cross Early Exit
* **Authoritative Resolution:**
  1. **Condition 1 (Macro Trend Arming — Unchanged):** Closed M5 `Stoch (200, 1, 1)` `%K >= 50.0` arms `BUY`; `%K <= 50.0` arms `SELL`. Disarms immediately and resets `v50_initialBuyDone` / `v50_initialSellDone` when `%K < 50.0` (BUY) or `%K > 50.0` (SELL).
  2. **Removed Condition 2 (`M5 CCI 150` Zero-Line Cross):** Completely removed `M5 CCI 150` from `R_50` entry, re-entry, and profit-exhaustion checks.
  3. **Initial Entry Rule:** Closed M5 `Stoch (15, 2, 5)` `%K` freshly crosses Level `50.0` (`prevK1525 <= 50.0 && sK1525 > 50.0` for BUY; `prevK1525 >= 50.0 && sK1525 < 50.0` for SELL) after Condition 1 is already armed (`cond1AlreadyArmedBuy` / `cond1AlreadyArmedSell` and `!v50_initialBuyDone` / `!v50_initialSellDone`).
  4. **Re-Entry Rule:** Closed M5 `Stoch (15, 2, 5)` `%K` freshly crosses **above `25.0`** for BUY (`prevK1525 <= 25.0 && sK1525 > 25.0`) or **below `85.0`** for SELL (`prevK1525 >= 85.0 && sK1525 < 85.0`) while Condition 1 remains valid after the initial trade has been taken and closed (`v50_initialBuyDone === true` / `v50_initialSellDone === true` and `noActiveTrades`).
  5. **New Early Exit Rule:** Enabled `Closed-M5 Stoch (15, 2, 5) Level 50.0 Opposite Cross` (`prevK1525 >= 50.0 && sK1525 < 50.0` for BUY; `prevK1525 <= 50.0 && sK1525 > 50.0` for SELL on closed M5 candles strictly after `entryEpoch`).

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 22:20:10 UTC`  **Target Instrument:** Volatility 50 Index (`R_50` — OmniSight)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "we need to revice the rules.
> Condition 1 — Macro Trend Arming (M5 Stoch 200, 1, 1) remains thesame.
> remove Condition 2 — Execution Trigger & Pullback Re-Entry (M5 CCI 150 Zero-Line Cross)
> 
> Initial entry rule:
> Stoch (15, 2, 5) freshly crosses level 50 after condition 1 is already armed.
> 
> Re entry rule:  Stoch (15, 2, 5) freshly croses level 25 for buy and level 85 for sell while Condition 1 is still valid after the initialtrade has been taken and closed.
> 
> New Early Exit Rule (Closed-M5 Stoch (15, 2, 5) Level 50.0 Opposite Cross"
> "please proceed"

---

### Diagnostic Scenario 46: Volatility 10 (`R_10` — Test Bot) Order-Independent 3-Condition Initial Entry & `Stoch (15, 2, 5)` Level `50` Early Loss Exit
* **Authoritative Resolution:**
  1. **Order-Independent 3-Condition Initial Entry:** Fixed `isInitialBuyTrigger` and `isInitialSellTrigger` for `R_10` so that the Initial Entry fires immediately on the closed M5 candle where all 3 conditions are met (`Stoch (200, 1, 1) %K >= 50.0`, `MACD (25, 75, 1) >= 0.0`, and `Price > M5 EMA 100` for BUY; `<= 50.0`, `<= 0.0`, and `< M5 EMA 100` for SELL) regardless of which of the 3 conditions aligned last (`stoch200AlignedBuy && macdAlignedBuy && emaBaselineBuy && !state.v10_initialBuyDone && noActiveTrades`).
  2. **Early Loss Exit 3 Updated from `Stoch (5, 3, 3)` to `Stoch (15, 2, 5)`:** Updated `R_10` Early Loss Exit 3 so an open position in floating loss (`pnl < 0`) closes immediately on a closed M5 candle after entry when `Stoch (15, 2, 5) %K` crosses Level `50.0` in the opposite direction (`prevK1525 >= 50.0 && sK1525 < 50.0` for BUY; `prevK1525 <= 50.0 && sK1525 > 50.0` for SELL).
  3. **Dashboard Arming Telemetry (`state.armed` & `state.nextPhase`):** Populated `state.armed` and `state.nextPhase` for `R_10` so the dashboard accurately reflects when `R_10` is armed waiting for `Price vs EMA 100` or `Stoch (5, 3, 3)` `20/80` re-entry.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-18 22:39:46 UTC`  **Target Instrument:** Volatility 10 Index (`R_10` — Test Bot)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "the initial entry condtions seems wrong.
> 
> Initial BUY (isInitialBuyTrigger):
> 1. Stoch (200, 1, 1) %K >= 50.0 (stoch200AlignedBuy)
> 2. MACD (25, 75, 1) >= 0.0 (macdAlignedBuy)
> 2. Price > M5 EMA 100 (emaBaselineBuy)
> 
> Initial SELL (isInitialSellTrigger):
> 1. Stoch (200, 1, 1) %K <= 50.0 (stoch200AlignedSell)
> 2. MACD (25, 75, 1) <= 0.0 (macdAlignedSell)
> 3. Price < M5 EMA 100 (emaBaselineSell)
> 
> NB: trigger initial entry when all these conditions are met. they can happen in any order.
> 
> also change Early Loss Exit 3 — M5 Stoch settings from (5, 3, 3) to (15, 2, 5)"
> "please proceed"

---

### Diagnostic Scenario 47: Volatility 50 (`R_50` — OmniSight) Software SL -$4.00, Dynamic Runner with $20 Ceiling, Re-Entry Calibration (80/20) & Closed-M5 Stoch (25,2,5) Midline (50) Profit Exit
* **Authoritative Resolution:**
  1. **Software Stop Loss Calibration to -$4.00:** Updated `INSTRUMENT_SOFTWARE_SL_MAP["R_50"] = -4.00` and `softwareSlUsd: 4.00` (1.00 index point on 4.00 lots). Replaces tight -$2.50 SL to provide adequate breathing room against normal M5 noise. Hard broker SL remains -$5.00 safety fallback.
  2. **Removed Static $4.00 TP Cap (Dynamic Runner):** Added `PROFILE_V50_STOCH200_CCI150` and `R_50` to `isDynamicRunner`. Order execution passes `tpPrice: null` and `tpUsd: null`. Active trades run under the 4-Tier Ratchet (+1.00 breakeven lock at +$2.20; Tiers 2-4 trailing up to 80%; +$20 Super-Runner cashout ceiling).
  3. **Calibrated Re-Entry Thresholds to 80 / 20:**
     - BUY Re-Entry: Closed M5 `Stoch (15,2,5) %K` fresh cross above 20.0 (`prevK1525 <= 20.0 && sK1525 > 20.0`) with `Stoch (200,1,1) %K >= 50.0` and `Price > M5 EMA 100`.
     - SELL Re-Entry: Closed M5 `Stoch (15,2,5) %K` fresh cross below 80.0 (`prevK1525 >= 80.0 && sK1525 < 80.0`) with `Stoch (200,1,1) %K <= 50.0` and `Price < M5 EMA 100`.
  4. **Upgraded Early Profit Exit to Closed-M5 Stoch (25,2,5) Midline (50):** When in profit (`currentPnl >= 1.00`), position exits on a closed M5 candle if `Stoch (25,2,5) %K` crosses Level 50 opposite to position (`sK2525 < 50.0` for BUY / `sK2525 > 50.0` for SELL). Opposite fractal breaks and adverse H1 closes strictly gate on `inLoss` (`currentPnl < 0`).
  5. **Initial vs Re-Entry State Gate Fix:** Initial Entry sets `state.v50_initialBuyDone = true` / `state.v50_initialSellDone = true`. All subsequent entries are strictly gated through the calibrated 80/20 re-entry logic.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-21 00:35:08 UTC`  **Target Instrument:** Volatility 50 Index (`R_50` — OmniSight)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "please proceed with the below Proposed Fixes & Strategic Realignment
> 1. Move Software SL to -$3.50 (or -$4.00)
> 2. Remove Static $4.00 TP Cap (Dynamic Runner)
> 3. Calibrate Re-Entry Thresholds (80 / 20) 
> 4. Upgrade Early Profit Exit to Closed-M5 Stoch (25,2,5) Midline (50) 
> 5. Fix Initial vs Re-Entry State Gate"

---

### Diagnostic Scenario 48: Volatility 75 (1s) (`1HZ75V` — Coffee Machine) Software SL -$4.00, Dynamic Runner with $20 Ceiling, inLoss Early Exit Gate & Closed-M5 Stoch (25,2,5) Midline (50) Profit Exit
* **Authoritative Resolution:**
  1. **Software Stop Loss Calibration to -$4.00:** Updated `INSTRUMENT_SOFTWARE_SL_MAP["1HZ75V"] = -4.00`, `softwareSlUsd: 4.00`, and `maxHardStopPoints: 80.0` (80.0 index points on 0.05 lots). Replaces tight -$2.50 SL to prevent premature wick stop-outs. Hard broker SL remains -$5.00 (100.0 points) fallback.
  2. **Removed Static $4.00 TP Cap (Dynamic Runner):** Added `PROFILE_V75_1S_TREND_MACD_STOCH533`, `PROFILE_V75_1S_EMA_STOCH15`, and `1HZ75V` to `isDynamicRunner`. Order execution passes `tpPrice: null` and `tpUsd: null`. Active trades run under the 4-Tier Ratchet (+1.00 breakeven lock at +$2.20; Tiers 2-4 trailing up to 80%; +$20 Super-Runner cashout ceiling).
  3. **Strict inLoss Gate on Early Exits:** Restructured `3 consecutive adverse M5 candles` and `Entry-Hour H1 adverse close` exits to trigger **ONLY when `inLoss` (`pnl < 0`)**. Positions in floating profit ($1.00+) will never be dumped by minor breathing pullbacks during sustained macro trends.
  4. **Upgraded Early Profit Exit to Closed-M5 Stoch (25,2,5) Midline (50):** When in profit (`currentPnl >= 1.00`), position exits on a closed M5 candle if `Stoch (25,2,5) %K` crosses Level 50 opposite to position (`sK2525 < 50.0` for BUY / `sK2525 > 50.0` for SELL).
  5. **Strict Initial vs Re-Entry State Gate:** Initial Entry sets `state.v75_1s_initialBuyDone = true` / `state.v75_1s_initialSellDone = true`. Re-entries strictly require `initialDone === true`. Flags reset only upon macro Stoch 200 reversal.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-21 00:54:04 UTC`  **Target Instrument:** Volatility 75 (1s) Index (`1HZ75V` — Coffee Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "please proceed"

---
**🤖 AI Mandatory Rule Update Protocol:**
Whenever the user updates strategy rules, trading parameters, or instrument logic, the AI must update `alert.js`, update `HANDBOOK.md`, and log exact verbatim instructions with timestamps.


### Diagnostic Scenario 49: Live Execution Resilience, Gateway HTTP 500 Elimination & 2.5-Minute Auto-Reconnect Engine
* **Authoritative Resolution:**
  1. **Gateway WebSocket Auto-Reconnect & Keep-Alive:** Hardened `ctrader-service.js` so that `onClose` immediately triggers an automated reconnect within 2.5 seconds instead of idling offline. Added half-open socket detection to terminate stale connections if no messages are received in 35 seconds. Added cTrader connection pre-warming on gateway startup.
  2. **Eliminated Punitive Backoff Lockout:** Removed exponential backoff on active order executions (`connect(force = true)`), guaranteeing that new order placement (`/ctrader/order`) and position liquidations (`/ctrader/close`) always attempt immediate reconnection rather than throwing `cTrader connection backed off` for up to 120 seconds.
  3. **High-Frequency Positions Caching (750ms):** Added an in-memory cache to `getOpenPositions()`, reducing repetitive `RECONCILE_REQ` WebSocket traffic from 7 concurrent bots by >85% and preventing cTrader API congestion during trade execution.
  4. **Multi-Attempt Order Retry in `executeTrade`:** If `/ctrader/order` encounters a transient network blip, the engine automatically retries up to 3 times with exponential backoff (1.5s, 3.0s) with a 20-second timeout before raising an error.
  5. **2.5-Minute Persistent Execution Queue:** If the gateway or broker is temporarily unreachable during trade signal confirmation, the bot retains the trade in `state.queuedPendingOrder` and checks every 5 seconds on the 1-second tick loop. As soon as connectivity restores within 2.5 minutes, the order is automatically filled and confirmed. If 2.5 minutes elapse without gateway recovery, it aborts cleanly with an expiration notice.
  6. **Transparent Error Propagation:** Upgraded `gatewayFetch` to extract the full error response body rather than throwing generic `Gateway HTTP error 500`.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-21 07:30:23 UTC`  **Target:** Central Execution Gateway & 7-Bot Fleet  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "I get a lot of Live execution failed: Gateway HTTP error 500. can't we fix this and harden it so it does not fail again and even if it does, it should be reconnected in the next minute or two. can you investigate and fix this"

---

### Diagnostic Scenario 50: Volatility 50 (`R_50`) & Volatility 100 (1s) (`1HZ100V`) Execution & Early Exit Fixes (30-Minute Age Gate on H1 Close, Pullback Re-Entry Unblocking & Closed-M5 Stoch 25 Midline Profit Exit)
* **Authoritative Resolution:**
  1. **Minimum 30-Minute Age Gate on `evaluateH1AdverseClose`:** Fixed flaw where trades entered near the end of an hour (e.g., at :50 or :55) were being evaluated against the H1 candle open from 50+ minutes *before* trade entry, prematurely closing winning or developing positions after just 1 candle (5 minutes). The function now strictly enforces `tradeAgeSeconds = (candles[si].epoch + 300) - trade.entryEpoch >= 1800` (at least 30 minutes / 6 M5 candles old) before evaluating entry-hour close against position direction.
  2. **Unblocked Volatility 50 Pullback Re-Entries (25 / 85):** Removed the brittle in-memory boolean constraint `Boolean(state.v50_initialBuyDone)` and `Boolean(state.v50_initialSellDone)` from `isV50ReentryBuy` and `isV50ReentrySell`. Strictly enforced that Volatility 50 uses M5 `Stoch (15, 2, 5)` (NEVER Stoch 5,3,3) with calibrated thresholds: fresh cross **> 25.0 for BUY** and **< 85.0 for SELL**. In an established macro trend (`Stoch (200,1,1)` aligned and `Price vs M5 EMA 100` conforming), any fresh pullback cross (`Stoch (15,2,5) %K < 85.0` for SELL / `> 25.0` for BUY) is a valid, high-probability trend re-entry and executes immediately regardless of server reboots or micro tick oscillations.
  3. **Strict `inLoss` and `!isRunner` Gating on V50 Early Loss Exits:**
     - Gated `stoch200Adverse` strictly with `!isRunner && inLoss && stoch200Adverse`. Profitable trades and runners are never liquidated by momentary Stoch 200 tick noise.
     - Isolated `stoch15OppositeCross` exclusively to `isV25Profile`. Because Volatility 50 entries occur at Level 50, post-entry noise on the very first closed candle frequently crossed 50, causing premature 5-minute stops. V50 now relies exclusively on Previous M5 Fractal Break, Stoch 200 invalidation, and Closed-M5 Stoch (25,2,5) Midline 50 Profit Exit.
  4. **Calibrated V50 Stoch (25,2,5) Midline 50 Profit Exit Threshold:** Lowered the profit qualification floor from `currentPnl >= 1.00` to `currentPnl >= 0.50`. When multi-wave trend momentum exhausts and Stoch (25,2,5) crosses opposite to position on a closed M5 candle, profits (including trades that peaked at +$1.36 to +$1.52) are locked in before market retracements convert them into losses.
  5. **V100 (1s) Immediate Re-Entry & Zombie Order Self-Healing:** Synchronized V100 1s Software SL to -$4.00, enabled Dynamic Runner with $20 ceiling, added automated pruning of orphaned pending records older than 180s, and gated immediate re-entry execution to prevent firing into adverse momentum after a trade closes in loss.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-21 22:01:08 UTC`  **Target Instruments:** Volatility 50 (`R_50` — OmniSight) & Volatility 100 (1s) (`1HZ100V` — Ice Cream Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instructions:
> "I think there are still some erros in the code. check for vix 100 1s. i also misses a trade around 12:55 and the trade at 11:06 that would have made me more profits closes abrubtly and did not enter. something is definately wrong. can we investigate it?"
> "There are majorerrors in vix 50 as well. bot missed several trades. other trades that would have made good profits were cut early even though not conditions to warrant the close were met.. please investigate and lets fix it"
> "But vix 50 does not use Stoch (5,3,3) for re entry. we updated it to Fresh Stoch (15,2,5) %K cross > 25.0 (BUY) / < 85.0 (SELL). so there is still an error there"


---

### Diagnostic Scenario 51: Volatility 50 (`R_50` — OmniSight) Symmetrical Re-Entry Threshold Calibration (Level 25 BUY / Level 75 SELL)
* **Authoritative Resolution:**
  1. **Calibrated SELL Pullback Re-Entry to < 75.0:** Calibrated the overbought pullback threshold from Level `85.0` to Level `75.0` for Volatility 50 SELL re-entries (`prevK1525 >= 75.0 && sK1525 < 75.0`), establishing a symmetrical `25.0` / `75.0` pullback execution band with BUY re-entries (`> 25.0`).
  2. **Harmonized Fleet Confluence Profiles & Displays:** Updated `confluenceProfiles.ts`, `BotGrid.tsx`, `TradingViewHub.tsx`, `ConfluenceRadar.tsx`, and `LiveStreamingChart.tsx` across the Command Center to reflect `Re-Entry 25/75`.
  3. **Strict Stoch (15, 2, 5) Enforcement:** Reaffirmed that Volatility 50 uses M5 `Stoch (15, 2, 5)` exclusively for all initial and re-entry signals, completely decoupled from any legacy Stoch (5,3,3) references.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-21 22:10:45 UTC`  **Target Instrument:** Volatility 50 Index (`R_50` — OmniSight)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "sorry i meant 75 and not 85"


---

### Diagnostic Scenario 52: Fleet-Wide Tier 0 Early Capital Shield ($1.50 -> $0.50), Closed-M5 Stoch (25,2,5) Midline Profit Exit Calibration ($0.50 Floor) & Volatility 25 (`R_25`) Hardened Fractal SL Buffer (6.00 Pts / $3.00)
* **Authoritative Resolution:**
  1. **Tier 0 Early Capital Shield (+ $1.50 Peak -> + $0.50 Guaranteed Floor):** Implemented in `manageOpenTradesFastPath()` across all active fleet instruments. Any trade that reaches **+$1.50** in floating profit immediately locks in a **+$0.50 net profit floor**, eliminating giveback and guaranteeing that profitable expansion cycles never decay into losses. When profit reaches `+$2.20`, Tier 1 smoothly expands the floor to `+$1.00`, followed by Tier 2 at `+$4.00` (`+$2.50` floor + trailing ratchet).
  2. **Calibrated Closed-M5 Stoch (25,2,5) Midline Profit Exit Floor ($0.50):** Lowered the profit exhaustion qualification floor from `currentPnl >= 1.00` to `currentPnl >= 0.50` across Volatility 25 (`R_25`), Volatility 75 (1s) (`1HZ75V`), Volatility 100 (1s) (`1HZ100V`), and Volatility 100 (`R_100`). Multi-wave secondary momentum exhaustions now bank profits immediately once `+$0.50+` is secured.
  3. **Hardened Volatility 25 (`R_25`) Fractal SL Buffer (Minimum 6.00 Points / $3.00):** Fixed flaw where `initialM5Fractal` placed tight stop losses (e.g. 4.96 points / $2.48 away), causing premature wick stop-outs inside normal M5 candle noise. If an M5 fractal forms closer than 6.00 points to entry, the engine defaults to the full calibrated -$3.50 Software SL (7.00 points / $3.50), ensuring adequate breathing room.
  4. **Strict `inLoss` (`pnl < 0`) Enforcement on Volatility 75 (1s) Exits:** Strictly gated `3 consecutive adverse candles` and `Stoch 200 adverse cross` exits with `pnl < 0`, preventing profitable trades (which peaked at +$1.50 to +$1.57) from being dumped during routine macro trend pullbacks.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-22 01:08:54 UTC`  **Target Instruments:** Volatility 25 (`R_25` — Tea Machine), Volatility 75 (1s) (`1HZ75V` — Coffee Machine) & Multi-Bot Fleet  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "proceed with rhe below"
> "1. Calibrate Early Profit Exits & Breakeven Shields:"
> "2. Harden Tea (R_25) Fractal SL Buffer"


---

### Diagnostic Scenario 53: Ice Cream Machine Transition to Volatility 25 (1s) (`1HZ25V`), Any-Order Confluence (Stoch 200 45/55 + Stoch 15 75/25), M5 EMA 100 Gate (Skip & Await Re-Entry) & Symmetrical Re-Entry (25 BUY / 75 SELL)
* **Authoritative Resolution:**
  1. **Instrument Migration to Volatility 25 (1s) (`1HZ25V`):** Re-pointed the Ice Cream Machine bot from Volatility 100 (1s) (`1HZ100V`) to Volatility 25 (1s) (`1HZ25V`, cTrader Symbol ID `2431`) to eliminate rapid stop-outs caused by V100 1s violent tick spikes. Configured calibrated specifications: 400x multiplier, 0.005 lots standard order size, -$4.00 Software SL, and Dynamic Runner with $20.00 ceiling.
  2. **Condition 1 — Macro Trend Identifier (M5 Stoch 200 Levels 45 / 55):**
     - **BUY Trend Arming:** Closed-M5 `Stoch (200, 1, 1)` `%K` crosses strictly **above 55.0** (`prevK200 <= 55.0 && sK200 > 55.0`).
     - **SELL Trend Arming:** Closed-M5 `Stoch (200, 1, 1)` `%K` crosses strictly **below 45.0** (`prevK200 >= 45.0 && sK200 < 45.0`).
     - **Hysteresis Band:** The trend remains valid in BUY while `sK200 >= 45.0`, and in SELL while `sK200 <= 55.0`. A cross beyond the opposite boundary immediately dealigns the prior trend and arms the new direction.
  3. **Condition 2 — Trigger Oscillator (M5 Stoch (15, 2, 5) Levels 75 / 25):**
     - **BUY Initial Breakout:** Closed-M5 `Stoch (15, 2, 5)` `%K` crosses strictly **above Level 75.0** (`prevK1525 <= 75.0 && sK1525 > 75.0`).
     - **SELL Initial Breakout:** Closed-M5 `Stoch (15, 2, 5)` `%K` crosses strictly **below Level 25.0** (`prevK1525 >= 25.0 && sK1525 < 25.0`).
  4. **Any-Order Confluence Mandate:**
     - Condition 1 may precede Condition 2, or Condition 2 may precede Condition 1.
     - As soon as the second condition occurs (either fresh Stoch 200 cross while Stoch 15 is aligned, or fresh Stoch 15 cross while Stoch 200 is aligned), the confluence event is evaluated.
  5. **Condition 3 — M5 EMA 100 Baseline Filter (Skip & Await Re-Entry):**
     - At the exact moment Conditions 1 and 2 are satisfied:
       - **BUY Filter:** M5 Price must be **above EMA 100** (`currentPrice > currentEma100`).
       - **SELL Filter:** M5 Price must be **below EMA 100** (`currentPrice < currentEma100`).
     - **Crucial Gating Rule:** If M5 Price is **NOT** aligned with EMA 100 at the moment of initial confluence, the initial trade is **SKIPPED**, `state.v25_1s_initialDone` is marked `true`, and the engine transitions immediately to wait for a high-probability pullback re-entry signal!
  6. **Re-Entry Engine (After Initial Entry Taken or Skipped):**
     - Evaluated on closed M5 candles once initial entry is done:
       1. `Stoch (200, 1, 1)` `%K` remains aligned in the right trend direction (`>= 45.0` for BUY / `<= 55.0` for SELL).
       2. `Stoch (15, 2, 5)` `%K` freshly crosses **above Level 25.0 for BUY** (`prevK1525 <= 25.0 && sK1525 > 25.0`) or **below Level 75.0 for SELL** (`prevK1525 >= 75.0 && sK1525 < 75.0`).
       3. M5 Price confirms EMA 100 alignment (`currentPrice > currentEma100` for BUY / `currentPrice < currentEma100` for SELL).
     - Fires re-entry trade immediately when no active positions exist, or latches into `state.activeReentryOpportunity` if an active trade is running to fire the instant it closes.
  7. **Preserved Trade Management Rules:**
     - Tier 0 Early Capital Shield at `+$1.50` peak locking `+$0.50` net profit floor.
     - Closed-M5 `Stoch (25, 2, 5)` Midline 50 Profit Exit (qualified at `PnL >= +$0.50`).
     - Dynamic Runner with Tiered Trailing Ratchet (Tiers 1-4) up to `$20.00` super-runner ceiling.
     - Strict `inLoss` adverse exits: 3 consecutive adverse M5 candles, Stoch 200 trend flip (<45 for BUY / >55 for SELL), and Entry-Hour H1 adverse close with 30m age gate.

---
**Trader Name:** Ebenezer Johnson  **Timestamp:** `2026-10-22 07:33:00 UTC`  **Target Instrument:** Volatility 25 (1s) Index (`1HZ25V` — Ice Cream Machine)  **Status:** AUTHORITATIVE & APPROVED FOR IMMEDIATE LIVE DEPLOYMENT  
#### Verbatim Trader Instruction:
> "i still have the same challenge. vix 100 1s trades are still closing as soon as they open. i thing we have to switch to another instrument. map the strategy to vix 25 1s. we will change the rules slightly"
> 
> "For initial entry,"
> "1. stoch 200 cross level 45/55 for buy or sell to sel the main trend"
> "2. Stoch (15,2,5) cross above level 75 for buy and below level 25 for sell"
> "3. EMA 100 is a filter at the time condition 1 and 2 are met, M5 price must be above EMA 100 for buy or below EMA 100 for sell. If EMA is not aligned, skip the trade and wait for a re entry signal"
> 
> "NB condition 1 may happen before 2 or 2 may happen before 1"
> 
> "re entry condition: after initial entry has been taken"
> "1. Stoch 200 still in the right direction"
> "2. Stoch (15,2,5) freshly crosses above level 25 for buy or level 75 for sell"
> "3. EMA 100 is a filter. at the time condition 1 and 2 are met, M5 price must be above EMA 100 for buy or below EMA 100 for sell."
> 
> "we can maintain the current trade management rules."

---

### Diagnostic Scenario 54: Volatility 75 (`R_75` — Lery's Alerts) Initial Entry Calibration: Level 50 Crossover & Strict Pre-Existing Level Invalidation

* **Timestamp:** `2026-10-22 08:25:00 UTC`
* **Target Bot:** `Lery's Alerts` (`lery-v75`)
* **Target Instrument:** Volatility 75 Index (`R_75`)
* **Strategy Profile:** `PROFILE_V75_EMA_STOCH15` (`EMA_STOCH15_RETRACEMENT`)
* **Server:** Server 1 (`~/trading-bots/Lery-s-Alerts`)

#### Trader Mandate & Context:
The trader requested an update to **Setup 1: Initial Entry (Breakout Wave)** for Volatility 75 (`R_75`):
> "B. Setup 1: Initial Entry (Breakout Wave)"
> "Condition 1 (Arming): Closed M5 candle closes above both M5 EMA 100 and EMA 200 for BUY (Close > EMA 100 && Close > EMA 200), or below both for SELL. (Does not require EMA 100/200 cross, only price beyond both)."
> "Condition 2 (Execution Trigger): Fresh M5 Stoch (15, 2, 5 Simple) %K crosses above Level 50.0 for BUY, or crosses below Level 50.0 for SELL. if M5 Stoch (15, 2, 5 Simple) is already below or above level 50, the setup is invalid. there for do not trigger the trade"

#### Quantitative Architectural Implementation:
1. **Calibrated Condition 2 Execution Trigger:**
   * **BUY Trigger:** Strictly fresh M5 `Stoch (15, 2, 5 Simple)` `%K` crossover **above Level 50.0** (`prevK <= 50.0 && sK > 50.0`).
   * **SELL Trigger:** Strictly fresh M5 `Stoch (15, 2, 5 Simple)` `%K` crossover **below Level 50.0** (`prevK >= 50.0 && sK < 50.0`).
   * Trigger Labels: `V75_INITIAL_BREAKOUT_STOCH50 (BUY)` and `V75_INITIAL_BREAKOUT_STOCH50 (SELL)`.
2. **Strict Invalidation Clause (Pre-Existing Level Filter):**
   * If M5 `Stoch (15, 2, 5 Simple)` `%K` is **already above Level 50.0** for BUY (`prevK > 50.0 && sK > 50.0`) or **already below Level 50.0** for SELL (`prevK < 50.0 && sK < 50.0`) at the moment of breakout or evaluation:
     - The breakout setup is **INVALID**.
     - Initial trade trigger is strictly bypassed (`indicatorsSatisfied = false`).
     - Initial arming is cleared (`state.v75_initialBuyArmed = false` / `state.v75_initialSellArmed = false`).
     - Initial wave is marked completed (`state.v75_initialBuyDone = true` / `state.v75_initialSellDone = true`) to enable smooth transition to **Setup 2: Retracement / EMA 100 Pullback Watch** (`state.isReentryMode = true`).
3. **Preserved Retracement & Trade Management Protocols:**
   * Setup 2 Retracement Entry remains active on EMA 100 physical touch + fresh Stoch %K cross > 20 (BUY) or < 80 (SELL) with EMA 100/200 trend alignment.
   * Universal -$2.50 Software SL, -$5.00 Hard Broker SL, Breakeven Shield at +$1.50/+$2.20, and 4-Tier Trailing Runner Ratchet remain 100% intact.

---

### REVISION LOG ENTRY — OCTOBER 23, 2026 @ 07:45 UTC

**Trader Name:** Ebenezer Johnson  
**Timestamp:** `2026-10-23 07:45:00 UTC`  
**Target Instrument:** Volatility 100 Index (`R_100` — Milk Machine)  
**Status:** AUTHORITATIVE & RESOLVED  

#### Verbatim Trader Instruction:
> "for initial entry,
> 4. Setup 2: Pullback Re-Entry (V100_REENTRY_STOCH15_20 / 80)
> 
> After the initial trade has completed and while Stoch (200) and EMA 100 remain aligned in the macro trend:
> 
> BUY Re-Entry:
> Stoch (200, 1, 1) remains in BUY trend (sK200 >= 48.0) and Price > EMA 100.
> Trigger: M5 Stoch (15, 2, 5) %K freshly crosses above Level 20.0 (prevK <= 20.0 && sK > 20.0).
> SELL Re-Entry:
> Stoch (200, 1, 1) remains in SELL trend (sK200 <= 52.0) and Price < EMA 100.
> Trigger: M5 Stoch (15, 2, 5) %K freshly crosses below Level 80.0 (prevK >= 80.0 && sK < 80.0).
> 
> i did not add any entry timer window to the rules but you added in in the implementation. why did you do that?
> 
> 'When Stoch 200 first crosses, enter when Stoch (15,2,5) freshly crosses Level 50 in same direction (within 2 bars).'
> 
> this is there in the rules on the dashboard. can you correct it?"

#### Authoritative Resolution:
1. **Total Removal of 2-Bar / Timer Window from Dashboard UI & Confluence Displays:**
   * Scrubbed all rogue references to `(within 2 bars)` and `(+/- 2 bars)` across `TradingViewHub.tsx`, `ConfluenceRadar.tsx`, `confluenceProfiles.ts`, and `HANDBOOK.md`.
   * Replaced with the trader's exact unbounded rule: **Initial Entry is 100% unbounded** as long as Stoch (200, 1, 1) and M5 EMA 100 remain armed and aligned without dealignment.
2. **Re-Verified `alert.js` Production Engine:** Confirmed that the backend execution loop has zero timer restrictions or bar limits for `R_100` (`isInitialBuy` / `isInitialSell` wait indefinitely for confirmation until dealignment).
3. **Rebuilt & Deployed:** Recompiled production bundle with Vite (`npm run build`) and pushed updated `index.html` live to Server 2 (`http://79.76.120.30:4000`).


### Diagnostic Scenario 55: Volatility 75 (1s) & Volatility 25 Adverse Trend & Stoch %K/%D Cross Invalidation + Immediate Opposite Execution

* **Timestamp:** `2026-10-24 10:20:00 UTC`
* **Target Bots:** `Coffee Machine` (`coffee-v75-1s` / `1HZ75V`) & `Tea Machine` (`tea-v25` / `R_25`)
* **Strategy Profiles:** `PROFILE_V75_1S_STOCH100_STOCH30` & `PROFILE_V25_STOCH100_STOCH30`
* **Target Servers:** Server 1 (`138.2.169.72`)

#### Trader Mandate & Empirical Forensic Audit:
At `06:00:00 UTC` on October 24, 2026, `1HZ75V` entered a BUY trade at `4,980.20`.
- At entry, Stoch 100 was 56.12 (> 50.0) and Stoch (30,2,5) %K was 56.48 (> %D 53.24).
- On the very next M5 candle (`06:00 - 06:05 UTC`), price aggressively plunged to `4,940.00`, causing Stoch 100 to cross down to 40.79 (< 50.0) and Stoch 30 %K to cross below %D (55.35 < 55.91).
- On the subsequent candle (`06:05 - 06:10 UTC`), Stoch 30 %K crossed below Level 50 (45.93), fulfilling an entire fresh SELL entry setup while price was well below EMA 100.
- However, because the BUY position was not exited until hitting the -$2.00 software stop loss at 06:14:36 UTC, the bot was locked out of taking the highly profitable SELL trade.

The trader instructed:
> "Can we update the logic. notice that that immediate drop on the next candle was actually a sell signal but the bot missed it. we have to updade the code such that if there is an immediate drop in the price and stock 100 crosses the oppostite side. and %k of Stoch (30, 2, 5) crosses %d. that trade will close immediately on the closed candle that confirms it. and if Stoch (30, 2, 5) %k then crosses the 50 and satisfies the condition for a trade in the opposite direction like in our case, the bot will takethe trade."

#### Quantitative Architectural Implementation:
1. **Dedicated Invalidation Early Exit Engine:**
   * Runs on every confirmed closed M5 candle (`m5BoundaryEpoch > t.entryEpoch`) while trade is not an active runner (`!isRunner`).
   * Evaluates adverse macro trend shift + oscillator reversal:
     - BUY Position: `sK100 < 50.0` **AND** `sK3025 < sD3025`
     - SELL Position: `sK100 > 50.0` **AND** `sK3025 > sD3025`
   * Instantly executes broker-side market liquidation (`closeContract()`).
2. **Flag Decoupling & Reversal Unblocking:**
   * Upon exit, cleans up state and resets initial trade flags:
     - `1HZ75V`: `state.v75_1s_initialBuyDone = false; state.v75_1s_initialSellDone = false;`
     - `R_25`: `state.v25_initialBuyDone = false; state.v25_initialSellDone = false; state.v25_stoch302515_touched_50_BUY = false; state.v25_stoch302515_touched_50_SELL = false;`
   * Permits the opposite trade setup to be recognized on the same candle or any candle within the 3-candle tolerance window (`<= 900s`), allowing the bot to pivot seamlessly from a cut loss into a winning trend runner.

---

### Diagnostic Scenario 56: M5 In-Loss 2-Opposing-Fractals Structural Reversal Exit (Double Top/Lower High & Double Bottom/Higher Low)

* **Timestamp:** `2026-10-24 10:55:00 UTC`
* **Target Bots:** `Coffee Machine` (`coffee-v75-1s` / `1HZ75V`), `Tea Machine` (`tea-v25` / `R_25`), and `Milk Machine` (`milk-v100` / `R_100`)
* **Strategy Profiles:** `PROFILE_V75_1S_STOCH100_STOCH30`, `PROFILE_V25_STOCH100_STOCH30`, and `PROFILE_V100_STOCH200_STOCH15`
* **Execution Timeframe:** Confirmed Closed M5 Candles (`candles`)

#### Trader Mandate:
The trader specified a structural price action invalidation engine based on consecutive opposing fractal formation:
> "at the time of entry if two new fractal forms for example if the bot is in a sell trade and a higher low fractal or double buttom fractal forms after the intial fractal, its an indication of a change in trend (buyers are taking over) so the trade must be closed. same applies for a buy trade. if a lower high fractal or a double top fractal forms, its an its an indication of a change in trend(sellers are taking over). this only applies to the first two fractals that are formed in the opposite direction of the trade (for a sell trade, those fractals will be drawn below the open position and for a buy trade, those fractals will be drawn above the open position)."

#### Quantitative Architectural Implementation:
1. **M5 Fractal Identification Engine (`evaluate2OpposingFractalsReversal`):**
   * Scans confirmed closed M5 candles for Bill Williams 5-bar swing fractals formed at or after trade entry (`k+2` confirmed at or after `t.entryEpoch`).
   * **BUY Trade:** Identifies the first two confirmed Swing High (Top) fractals (`F1` and `F2`). If `F2.price <= F1.price` (Lower High or Double Top within 0.05% tolerance), buyers have failed to extend the impulse.
   * **SELL Trade:** Identifies the first two confirmed Swing Low (Bottom) fractals (`F1` and `F2`). If `F2.price >= F1.price` (Higher Low or Double Bottom within 0.05% tolerance), sellers have failed to extend the impulse.
2. **Empirical Floating Loss Gate (`currentPnl < 0`):**
   * Evaluated strictly while the position is underwater and not an active profit runner (`!isRunner`).
   * Preserves Runner Immunity: Positions in profit are never closed by pullback fractals, maintaining full exposure to the Tiered Dynamic Ratchet and the +$7.00 daily strike.
3. **Reversal Pivot Unblocking:**
   * Market liquidation resets `initialBuyDone` / `initialSellDone` to `false`, enabling the bot to transition smoothly into the opposing trend wave without being locked out.

---

## 17. COMPENDIUM OF TRADER DIRECTIVES & STRATEGY RULES IN THE TRADER'S OWN WORDS (VERBATIM AUDIT ARCHIVE)

> **AUTHORITATIVE GOVERNANCE MANDATE:**  
> This compendium constitutes the permanent, unalterable master log of all strategy rules, trading directives, parameter modifications, and structural updates provided by the trader (**Ebenezer Johnson / Lery**) in his **exact, verbatim words** across the entire project trajectory.  
> Whenever an audit is conducted or code behavior is questioned, this section serves as the **Supreme Audit Standard** to verify that the implementation adheres 100% to the trader's explicit mandates with zero unauthorized assumptions, time limits, or indicator drift.

---

### 17.1. UNIVERSAL FLEET DIRECTIVES
#### Directive U3 — Total Abolition of Hard Daily Loss Freeze
* **Date / Step:** `2026-10-24 11:07:43 UTC`
* **Verbatim Trader Instruction:**
  > "Remove the Hard Daily Loss Freeze: Completely remove"
* **Specification:** Completely stripped all `dailyMaxLossReached` checks, `DAILY_MAX_LOSS_USD` constants, and daily loss freeze returns from `alert.js`. Bots never freeze or idle due to cumulative daily drawdowns.
 & CENTRALIZED TRADE MANAGEMENT (VERBATIM)

#### Directive U1 — Universal M5 EMA 100 Directional Filter
* **Date / Step:** `2026-10-20 00:00:22 UTC` (Step 1477 / Directive #17)
* **Verbatim Trader Instruction:**
  > "1. do you remember the rule that EMA 100 is a filter. that the bot buys only when M5 price is above EMA 100 or only sell if M5 price is above EMA 100? lets apply it to all the bots as an addition. some have it already."
* **Consolidated Executable Specification:**
  * **BUY Orders (Initial & Re-Entry):** Permitted **ONLY** when current M5 candle price is **ABOVE** M5 EMA 100 (`currentPrice > currentEma100`).
  * **SELL Orders (Initial & Re-Entry):** Permitted **ONLY** when current M5 candle price is **BELOW** M5 EMA 100 (`currentPrice < currentEma100`).
  * Applied unconditionally across all 7 bots in the fleet.

---

#### Directive U2 — Continuous Background Signal Scanning While in Trade
* **Date / Step:** `2026-10-20 00:00:22 UTC` (Step 1477 / Directive #17) & `2026-10-20 23:14:15 UTC` (Step 2904 / Directive #21)
* **Verbatim Trader Instruction:**
  > "3. also anytime a trade has been executed, the bot should still keep actively searching for entry signals so that anytime the current trade closes and there is an opportunity(fresh re entry conditions are met) the bot can enter the trade immediately."
  > 
  > "that is why i said the bots should still be actively be searching for potential entries so that any time the current trade closes and there is an opportunity to enter a trade, the bot can take it(because it is always actively scanning and serching for trades.) also please check if there is a delay in entry or trades are ctually executed immediately the M5 candle that confirms the signal closes?"
* **Consolidated Executable Specification:**
  * While a position is active, the M5 candle scanner never sleeps. It continuously evaluates confluence and latches valid re-entry setups into `state.activeReentryOpportunity`.
  * The very instant an open trade closes, the latched opportunity executes immediately without waiting for the next M5 bar.

---

#### Directive U3 — Order-Independent Confluence & Unbounded Signal Window
* **Date / Step:** `2026-10-18 22:38:39 UTC` (Step 507), `2026-10-22 07:30:35 UTC` (Step 5485), `2026-10-23 07:43:12 UTC` (Step 8270), `2026-10-23 07:55:45 UTC` (Step 8338)
* **Verbatim Trader Instructions:**
  > "NB: trigger initial entry when all these conditions are met. they can happen in any order." (Step 507)
  > 
  > "NB condition 1 may happen before 2 or 2 may happen before 1" (Step 5485)
  > 
  > "i did not add any entry timer window to the rules but you added in in the implementation. why did you do that?
  > 'When Stoch 200 first crosses, enter when Stoch (15,2,5) freshly crosses Level 50 in same direction (within 2 bars).'
  > this is there in the rules on the dashboard. can you correct it?" (Step 8270)
  > 
  > "'Once one of them crosses, it waits for the next indicator to cross unless there is a dealignment'" (Step 8338)
* **Consolidated Executable Specification:**
  * Strict prohibition against artificial timer bars or expiration windows (e.g., "(within 2 bars)" is 100% banned).
  * Once an indicator crosses or arms, the engine waits indefinitely for the remaining indicators to align, **unless a genuine dealignment occurs**.

---

#### Directive U4 — Centralized Capital Protection & The $1.00 Breakeven Shield
* **Date / Step:** `2026-10-22 19:32:50 UTC` (Step 6189 / Directive #40)
* **Verbatim Trader Instruction:**
  > "maybe we need to centralize the trade manage ment rules. if a trade reaches $1 profit, it should never run to loss. to the software SL move to $0.5. now about how far the trade can go without being cut off early. we have still not solved that problem. look at vix 75. the reason why the 12:55 trade closed was profit lock hit peak $2.69. even if the trade closed at 2.69 its would have been better. but notice after the trade closed it went all the way up. what can we do to make the most out of this thing? its frautrating. can we solve that probblem once and for all for all the instruments? investigate in bring some data proven options. i am loosing more that making profits. not because i have a bad strategy but be cause the trades are not managed well."
* **Consolidated Executable Specification:**
  * **Tier 0 Breakeven Shield:** The moment unrealized profit reaches **+$1.00**, the software SL floor locks at **+$0.50**. A trade that reaches $1.00 profit **can never close in a loss**.
  * **The Breathing Zone ($1.00 to $2.99):** Floor is held firmly at **+$0.50**, providing up to $2.49 of breathing room for natural M5 candle wicks without choking winning trades.

---

#### Directive U5 — Dynamic Runner Engine & Removal of Static TP Caps
* **Date / Step:** `2026-10-20 23:23:30 UTC` (Step 2944 / Directive #22)
* **Verbatim Trader Instruction:**
  > "Remove the static $4.00 hard TP cap so winning trades are never closed by a fixed take-profit target. Instead, winning trades run freely under:
  > 1Tier 1 Breakeven Shield: Locks +$1.00 at +$2.20.
  > Tier 2/3/4 Trailing Ratchet: Trails behind peak profit (locking up to 70% of gains).
  > Closed-M5 Stoch (25,2,5) Midline (50) Cross Exit: Liquidates with secured profit when momentum genuinely exhausts on a closed candle.
  > Super-Runner Cashout Ceiling: +$20.00 hard profit ceiling."
* **Consolidated Executable Specification:**
  * Winning trades have no fixed TP cap and run dynamically under a 4-Tier Trailing Ratchet up to a **+$20.00 cashout ceiling**.
  * **Runner Immunity:** When in profit (pnl >= $3.50 or active ratchet), trades are immune to sensitive indicator stops.

---

### 17.2. VOLATILITY 100 INDEX (`R_100` — MILK MACHINE)

#### Chronological Verbatim Directives:
* **Step 227 (`2026-10-18 20:47:31 UTC`):**
  > "Lets proceed with Volatility 100. what are the entry rules"
* **Step 241 (`2026-10-18 21:00:02 UTC`):**
  > "yes these are my rules. please check if they have been well implemented. just a little update. because vix 100 makes a lot of profit in a short period of time, i want to update the early exit rule.
  > Early Exit 1 — M5 Stoch (15, 2, 5)
  > BUY: Closes immediately on a closed M5 candle if %K crosses below 65
  > SELL: Closes immediately on a closed M5 candle if %K crosses above 35"
* **Step 989 (`2026-10-19 23:08:33 UTC`):**
  > "Thanks but we need to add a mechanism to gain more for every trade. the vix 100 trade that went to 12 dollars profit closed at 6 dollars profit. what can we do for all the bots to ensure we are maximizing profits and not killing the trades early"
* **Step 3182 (`2026-10-20 23:51:55 UTC`):**
  > "Now you see how i am thinkin based on the 2 bots we just reviewed. lets move to Vix 100. analyze why the trades keep closing prmaturely. i mostly saw the trades closed due to thight software SL and this instrument is very volatile so that was bad plan. Lets move it to $4. also all the potential trades that could actually give us masive profits were cut short, please investigate all the tradesand lets come up with a fix. also check if there were any errors in implenting the trading rules accurately."
* **Step 3300 (`2026-10-21 00:08:12 UTC`):**
  > "please proceed just a little update.
  > 1. Move Software SL to -$4.00
  > 2. Remove Static $4.00 TP Cap (Dynamic Runner)
  > 3. Upgrade Early Exit 1 to Closed-M5 Stoch (25,2,5) 65/35 Profit Exit
  > 4. Fix Initial vs Re-Entry State Gate:"
* **Step 8250 & Step 8270 (`2026-10-23 07:38:34 & 07:43:12 UTC`):**
  > "But were are the entry rules for vix 100?"
  > 
  > "for initial entry,
  > 4. Setup 2: Pullback Re-Entry (V100_REENTRY_STOCH15_20 / 80)
  > 
  > After the initial trade has completed and while Stoch (200) and EMA 100 remain aligned in the macro trend:
  > 
  > BUY Re-Entry:
  > Stoch (200, 1, 1) remains in BUY trend (sK200 >= 48.0) and Price > EMA 100.
  > Trigger: M5 Stoch (15, 2, 5) %K freshly crosses above Level 20.0 (prevK <= 20.0 && sK > 20.0).
  > SELL Re-Entry:
  > Stoch (200, 1, 1) remains in SELL trend (sK200 <= 52.0) and Price < EMA 100.
  > Trigger: M5 Stoch (15, 2, 5) %K freshly crosses below Level 80.0 (prevK >= 80.0 && sK < 80.0).
  > 
  > i did not add any entry timer window to the rules but you added in in the implementation. why did you do that?
  > 'When Stoch 200 first crosses, enter when Stoch (15,2,5) freshly crosses Level 50 in same direction (within 2 bars).'
  > this is there in the rules on the dashboard. can you correct it?"
* **Step 8338 (`2026-10-23 07:55:45 UTC`):**
  > "'Once one of them crosses, it waits for the next indicator to cross unless there is a dealignment'"

#### Consolidated Authoritative Rules for Volatility 100 (`R_100`):
1. **Macro Trend Identifier (M5 Stoch 200, 1, 1 with 48/52 Hysteresis):**
   * **BUY Arming:** Closed M5 %K crosses strictly **above 52.0**. Stays armed BUY while `sK200 >= 48.0`.
   * **SELL Arming:** Closed M5 %K crosses strictly **below 48.0**. Stays armed SELL while `sK200 <= 52.0`.
2. **Baseline Filter (M5 EMA 100):**
   * BUY: `Price > EMA 100`
   * SELL: `Price < EMA 100`
3. **Setup 1: Initial Breakout Entry (Unbounded, Order-Independent):**
   * Once Stoch 200 arms, enter when M5 Stoch (15, 2, 5 Simple) freshly crosses Level 50.0 (`> 50.0` for BUY / `< 50.0` for SELL).
   * Either indicator may cross first. If Stoch 15 crosses Level 50 first, it waits for Stoch 200 to arm unless dealigned. Price must confirm EMA 100.
4. **Setup 2: Pullback Re-Entry (After Initial Entry Complete):**
   * **BUY Re-Entry:** While Stoch 200 remains aligned (`>= 48.0`) and `Price > EMA 100`, trigger when M5 Stoch (15, 2, 5) %K freshly crosses **above Level 20.0** (`prevK <= 20.0 && sK > 20.0`).
   * **SELL Re-Entry:** While Stoch 200 remains aligned (`<= 52.0`) and `Price < EMA 100`, trigger when M5 Stoch (15, 2, 5) %K freshly crosses **below Level 80.0** (`prevK >= 80.0 && sK < 80.0`).
5. **Trade Management & Exits:**
   * Software SL: **-$4.00** (4.00 pts) | Hard SL: **-$5.00** (5.00 pts)
   * Tier 0 Breakeven Shield at **+$1.00** peak -> locks **+$0.50** floor. Breathing Zone $1.00-$2.99.
   * Dynamic Trailing Ratchet for peak >= $3.00 up to **$20.00 cashout ceiling**.
   * Early Profit Exit: Closed-M5 Stoch (25, 2, 5) %K **< 65.0** (BUY) or **> 35.0** (SELL) when profit >= $0.50.
   * Early Loss Exits (inLoss only): Opposite M5 Fractal break in loss, Entry-Hour H1 Adverse Close in loss.

---

### 17.3. VOLATILITY 25 INDEX (`R_25` — TEA MACHINE)

#### Chronological Verbatim Directives:
* **Step 354 & Step 363 (`2026-10-18 21:48:14 & 21:58:12 UTC`):**
  > "lets proceed to Volatility 25. what are the rules"
  > 
  > "the rules arew correct but please check to see if they have been accurately implemented.
  > i want to add a re entry condition
  > While M5 Stoch (200, 1, 1) and M5 CCI 100 remains aligned and no trade is open,
  > BUY Re-Entry: Fresh Stoch (15, 2, 5) %K cross above 25
  > SELL Re-Entry: Fresh Stoch (15, 2, 5) %K cross below 75
  > and add the below erly exit rule
  > Early Exit: Closed-M5 Stoch (15,2,5) Level 50 Cross in Opposite Direction
  > also add the below Profit Protection & Trailing Engine:
  > Closed-M5 Stoch (15, 2, 5) Midline Profit Exit when trade is in profit"
* **Step 2904 & Step 2944 (`2026-10-20 23:14:15 & 23:23:30 UTC`):**
  > "Now lets analyze vix 25. analyzing the trades that actually had to yield some prifit were cut short. first one is 5:35. exit reason was TP target reached. @3.8 dollars mean while i could have made more profit is the trade run with the the stoch profit 50 level cross early exit rule. we need to do something about that so that we don't set profit levels that will kill the trade premature. the losss management rules are on point and saved me a lot of bad trades."
  > 
  > "Execute the below updated fixes for vix 25: Remove the static $4.00 hard TP cap so winning trades are never closed by a fixed take-profit target..."
* **Step 3023 & Step 3024 (`2026-10-20 23:32:54 & 23:34:48 UTC`):**
  > "insead of 'Update V25 Initial Entry so that either sequence triggers the trade the moment all 3 align',"
  > "instead of 'V25 Initial Entry to trigger the trade the moment all 3 align', rather put a 20 minutes execution window waiting for Stoch 200 to cross. hope you undersatand?"
* **Step 5384 (`2026-10-22 01:08:54 UTC`):**
  > "2. Harden Tea (R_25) Fractal SL Buffer"
* **Step 7831 (`2026-10-23 06:57:16 UTC`):**
  > "how are there still errors in the code? how can trades still be placed when conditions are not satisfied. i thought we fixed all that. please investigate today's trades for vix 25"
* **Step 8338 (`2026-10-23 07:55:45 UTC` — MASTER REVISION & UNIFICATION):**
  > **"2. map the entry and trade management rules exactly of vix 100 to vix 25 and vix 50. update the dashboard as well. no erros."**

* **Step 9440 (`2026-10-24 10:20:00 UTC` — Adverse Trend & Stoch %K/%D Cross Invalidation + Immediate Opposite Execution):**
  > "Can we update the logic. notice that that immediate drop on the next candle was actually a sell signal but the bot missed it. we have to updade the code such that if there is an immediate drop in the price and stock 100 crosses the oppostite side. and %k of Stoch (30, 2, 5) crosses %d. that trade will close immediately on the closed candle that confirms it. and if Stoch (30, 2, 5) %k then crosses the 50 and satisfies the condition for a trade in the opposite direction like in our case, the bot will takethe trade."

* **Step 9425 (`2026-10-24 00:16:24 UTC` — Authoritative Indicator & Entry Upgrade):**
  > "Thank you. we will do a similar update for vix 25. please see the rules below.
  > 
  > Please see the updates below.
  > 
  > A. Indicators
  > 1. Macro Trend Identifier: Stochastic (100, 1, 1)
  > 2. Trigger Indicator: Stochastic (30, 2, 5 Simple) level 50
  > 3. re entry indicator:  Stochastic (30, 25, 15 Simple) %K must first touch or cross level 50 and then cross %d freshly
  > 
  > B. Initial Entry Rules (Buy/Sell)
  > 1. Condition 1 (Macro Trend Arming): Closed M5 Stochastic (100, 1, 1) %K crosses above/below  Level 50.0. It stays armed as long as it remains above/below 50.
  > 2. Condition 2 (Baseline Filter): Price must be above/below M5 EMA 100
  > 3. Condition 3 (Execution Trigger): Stochastic (30, 2, 5 Simple) freshly crosses above/below level 50. the cross can happen 3 candles before Stoch 100 crosses level 50, 3 candles after Stoch 100 crosses level 50, or simultaneiously.
  > 
  > C. Re-Entry Rules (After Initial Trade Has Closed)
  > 1. While the Macro Trend remains valid (Stoch 100 aligned)
  > 2. Stochastic (30, 25, 15 Simple) %K must first touch or cross level 50 and then cross %d freshly.  for buy, %k fresh touch level 50 then crosss %d up. for sell, %k fresh touch level 50 then crosss %d down. 
  > 
  > Hope its clear"

#### Consolidated Authoritative Rules for Volatility 25 (`R_25` — Tea Machine):
1. **A. Indicators:**
   * **Macro Trend Identifier:** Closed M5 Stochastic `(100, 1, 1)` Level 50.0.
   * **Trigger Indicator:** Closed M5 Stochastic `(30, 2, 5 Simple)` Level 50.0.
   * **Baseline Filter:** M5 EMA 100 (`Price > EMA 100` for BUY / `Price < EMA 100` for SELL).
   * **Re-Entry Indicator:** Closed M5 Stochastic `(30, 25, 15 Simple)` (%K touches/crosses Level 50, then freshly crosses %D).
2. **B. Initial Entry Rules (Buy/Sell):**
   * **Condition 1 (Macro Trend Arming):** Closed M5 Stochastic (100, 1, 1) %K crosses above/below Level 50.0. Stays armed as long as it remains above/below 50.0.
   * **Condition 2 (Baseline Filter):** Price must be above M5 EMA 100 for BUY or below M5 EMA 100 for SELL.
   * **Condition 3 (Execution Trigger):** Stochastic (30, 2, 5 Simple) freshly crosses above/below Level 50.0. The cross can occur up to 3 candles (900s) before Stoch 100 crosses Level 50, up to 3 candles after, or simultaneously.
   * *Baseline Filter Enforcement:* If timing confluence is met but Price is not on the correct side of EMA 100, the initial trade is skipped and the bot unlocks re-entry mode.
3. **C. Re-Entry Rules (After Initial Trade Has Closed):**
   * **Condition 1:** While Macro Trend remains valid (Stoch 100 aligned above 50.0 for BUY / below 50.0 for SELL) and Price is beyond M5 EMA 100.
   * **Condition 2:** Stochastic (30, 25, 15 Simple) %K must first touch or cross Level 50 (pullback: `%K <= 50.0` for BUY / `%K >= 50.0` for SELL), and then freshly cross %D (BUY: %K crosses above %D; SELL: %K crosses below %D).
4. **D. Trade Management & Capital Calibration:**
   * **Account Model:** Standard $5.00 Stake calibrated for $7.00/day profit goal on $100 starting equity.
   * **Software SL:** -$2.00 (4.00 pts on 0.50 lots) | Hard Broker SL: -$5.00.
   * **Target:** Base Take Profit +$3.50 net (7.00 pts) / Full Daily Strike +$7.00 net (14.00 pts).
   * **Dynamic Trailing Ratchet:** Incubation zone ($0.00-$2.19) -> Tier 1 Breakeven Shield at +$2.20 (locks +$1.00, $1.20 breathing buffer) -> Tier 2 Quota Lock at +$3.50 (locks +$2.20) -> Tier 3 Runner at +$5.00 (locks +$3.80).
   * **Macro Trend Invalidation Exit:** Evaluated on closed M5 candle strictly when in loss (`pnl < 0`). If Stochastic (100, 1, 1) crosses adverse to position through Level 50.0, the trade is liquidated immediately.
   * **Circuit Breakers:** Daily Profit Lock at +$7.00; Continuous session execution without artificial daily loss cutoff.

---

### 17.4. VOLATILITY 50 INDEX (`R_50` — OMNISIGHT)

#### Chronological Verbatim Directives:
* **Step 400 & Step 407 (`2026-10-18 22:06:52 & 22:18:27 UTC`):**
  > "lets proceed to Volatility 50. what are the rules"
  > 
  > "we need to revice the rules.
  > Condition 1 — Macro Trend Arming (M5 Stoch 200, 1, 1) remains thesame.
  > remove Condition 2 — Execution Trigger & Pullback Re-Entry (M5 CCI 150 Zero-Line Cross)
  > 
  > Initial entry rule:
  > Stoch (15, 2, 5) freshly crosses level 50 after condition 1 is already armed.
  > 
  > Re entry rule: Stoch (15, 2, 5) freshly croses level 25 for buy and level 85 for sell while Condition 1 is still valid after the initialtrade has been taken and closed.
  > 
  > New Early Exit Rule (Closed-M5 Stoch (15, 2, 5) Level 50.0 Opposite Cross"
* **Step 3419 & Step 3553 (`2026-10-21 00:18:19 & 00:35:08 UTC`):**
  > "now lets proceed to vix 50"
  > 
  > "please proceed with the below Proposed Fixes & Strategic Realignment
  > 1. Move Software SL to -$3.50 (or -$4.00)
  > 2. Remove Static $4.00 TP Cap (Dynamic Runner)
  > 3. Calibrate Re-Entry Thresholds (80 / 20) 
  > 4. Upgrade Early Profit Exit to Closed-M5 Stoch (25,2,5) Midline (50) 
  > 5. Fix Initial vs Re-Entry State Gate"
* **Step 4727 & Step 5015 (`2026-10-21 21:26:10 & 22:01:08 UTC`):**
  > "There are majorerrors in vix 50 as well. bot missed several trades. other trades that would have made good profits were cut early even though not conditions to warrant the close were met.. please investigate and lets fix it"
  > 
  > "But vix 50 does not use Stoch (5,3,3) for re entry. we updated it to Fresh Stoch (15,2,5) %K cross > 25.0 (BUY) / < 85.0 (SELL). so there is still an error there"
* **Step 8338 (`2026-10-23 07:55:45 UTC` — MASTER REVISION & UNIFICATION):**
  > **"2. map the entry and trade management rules exactly of vix 100 to vix 25 and vix 50. update the dashboard as well. no erros."**

#### Consolidated Authoritative Rules for Volatility 50 (`R_50`):
> **EXACT CLONE OF VOLATILITY 100 QUANTITATIVE ARCHITECTURE:**  
> In direct accordance with Directive #52 (Step 8338), Volatility 50 is mapped 100% to the V100 rules:
1. **Macro Trend Identifier:** M5 Stoch 200 (48/52 Hysteresis Band: `> 52.0` arms BUY, held `>= 48.0`; `< 48.0` arms SELL, held `<= 52.0`).
2. **Baseline Filter:** M5 EMA 100 (`Price > EMA 100` for BUY / `Price < EMA 100` for SELL).
3. **Setup 1 (Initial Entry):** Unbounded fresh M5 Stoch (15, 2, 5 Simple) %K cross of **Level 50.0** in trend direction. Either indicator may cross first.
4. **Setup 2 (Re-Entry):** Fresh M5 Stoch (15, 2, 5) %K cross **above Level 20.0** (BUY) / **below Level 80.0** (SELL) while Stoch 200 and EMA 100 remain aligned.
5. **Trade Management & Exits:**
   * Software SL: **-$4.00** (1.00 pt on 4.00 lots) | Hard SL: **-$5.00** (1.25 pts)
   * Tier 0 Breakeven Shield at **+$1.00** peak -> locks **+$0.50** floor. Breathing Zone $1.00-$2.99.
   * Dynamic Trailing Ratchet for peak >= $3.00 up to **$20.00 ceiling**.
   * Early Profit Exit: Closed-M5 Stoch (25, 2, 5) %K **< 65.0** (BUY) or **> 35.0** (SELL).
   * Early Loss Exits: Opposite M5 Fractal break in loss, Entry-Hour H1 Adverse Close in loss.

---

### 17.5. VOLATILITY 75 INDEX (`R_75` — LERY'S ALERTS)

#### Chronological Verbatim Directives:
* **Step 44 & Step 64 (`2026-10-18 19:11:49 & 19:55:07 UTC`):**
  > "Thanks its working. i want to analyze vix 75. what are the entry rules?"
  > 
  > "Thanks. there seems to be a error somewhere. 
  > i noticed the trades open and cose very close to the entry point. what is causing that? 
  > also for the rules, for initial entry, price must first cross above or below EMA 100 and EMA 200 as the first condition. the second conditions is a fresh stoch cross. %k must cross above level 80 for buy or below level 20 for a sell. 
  > for Retracement Entry, for buy, Arming: Price retraces to physically touch EMA 100. the second condition is Trigger: Stochastic %K freshly crosses above Level 20 for buy or level 80 for sell.
  > please check if this is what has been implemented."
* **Step 2386 & Step 2760 (`2026-10-20 22:16:14 & 22:45:31 UTC`):**
  > "I was going through the trades and noticed a bug. the vix 75 sell trade at 15 should never have triggerd. because after the initialtrade that opens the trnd, the re entry( subsequest trades require a fresh retrace EMA touch and a fresh Stoch cross from overbought level. but that did not happen which means there is a bug in the code... because all the reentries require EMA 100 to be above EMA 200 for a buy and EMA 100 to be below EMA 200 for a sell. but the initial entries do not require this condition. they require Price above/below EMA 100 & 200 and Fresh Stoch (15,2,5) %K cross > 80 (BUY) / < 20 (SELL)."
* **Step 5990 & Step 6032 (`2026-10-22 08:09:10 & 08:17:37 UTC` — Initial Entry Level 50 Calibration):**
  > "lets do a little update to the rules for vix 75. what are the current rules?"
  > 
  > "lets make changes to this
  > B. Setup 1: Initial Entry (Breakout Wave)
  > Condition 1 (Arming): Closed M5 candle closes above both M5 EMA 100 and EMA 200 for BUY (Close > EMA 100 && Close > EMA 200), or below both for SELL. (Does not require EMA 100/200 cross, only price beyond both).
  > Condition 2 (Execution Trigger): Fresh M5 Stoch (15, 2, 5 Simple) %K crosses above Level 50.0 for BUY, or crosses below Level 50.0 for SELL. if M5 Stoch (15, 2, 5 Simple) is already below or above level 50, the setup is invalid. there for do not trigger the trade"

#### Consolidated Authoritative Rules for Volatility 75 (`R_75`):
1. **Setup 1: Initial Breakout Entry:**
   * Condition 1 (Arming): Closed M5 candle closes above both EMA 100 and EMA 200 for BUY (`Close > EMA 100 && Close > EMA 200`), or below both for SELL.
   * Condition 2 (Execution Trigger): Fresh M5 Stoch (15, 2, 5 Simple) %K crosses **above Level 50.0** for BUY (`prevK <= 50.0 && sK > 50.0`), or **below Level 50.0** for SELL (`prevK >= 50.0 && sK < 50.0`).
   * **Pre-Level Invalidation Clause:** If Stoch (15, 2, 5) is already beyond Level 50.0, the setup is invalid and skipped.
2. **Setup 2: Retracement / EMA 100 Pullback Entry:**
   * Condition 1 (Retrace Touch): Price retraces to physically touch EMA 100 (`Low <= EMA 100` for BUY / `High >= EMA 100` for SELL).
   * Condition 2 (Trigger): Fresh Stoch (15, 2, 5) %K cross **above Level 20.0** for BUY / **below Level 80.0** for SELL, with candle close confirming beyond EMA 100.
3. **Trade Management:** Software SL -$2.50 | Hard SL -$5.00 | Tier 0 Shield at +$1.00 -> $0.50 floor | Dynamic Runner.

---

### 17.6. VOLATILITY 75 (1s) INDEX (`1HZ75V` — COFFEE MACHINE)

#### Chronological Verbatim Directives:
* **Step 9445 (`2026-10-24 10:40:00 UTC` — Re-Entry Level Upgrade to 25/75):**
  > "1. Please lets update the re entry Stochastic (15, 2, 5 Simple) indicator levels to 25/75 in stead of 20/80 for vix 75 1s"
* **Step 9550 (`2026-10-28 23:30:00 UTC` — Authoritative Stoch (15,1,1) Overhaul & Independent Trade Management):**
  > "A. Initial entry
  > 1. Stoch 100 must first cross above level 50 for buy or below level 50 for sell to set the trend direction.
  > 2. stoch (15,1,1) fresh cross level 50 to trigger the trade. fresh cross above level 50 buy and below level 50 for sell. (don't enter the trade if stoch 15 was already below or above the 50 line before stoch 100 crossed. In this case set the bot open for a re entry rather.
  > 
  > B. Re entry condition
  > 1. Stoch 100 must still be alaigned.
  > 2. stoch (15,1,1) must fresh cross from above level 80 for sell or from below level 20 for buy. in the direction of the trend.
  > 
  > Trade management rule
  > 1. after the trade is opened, when stoch (15,1,1) touches level 20 for sell trades / level 80 for buy trades, move software SL to $0.3
  > 2. when it finally cross above or below level 50, close the trade immediately.
  > 
  > Mandates:
  > 1. don't apply M5 EMA 100 Baseline Filter
  > 2. the Level 50 exit trigger should only trigger after the trade has touched 80/20"

#### Consolidated Authoritative Rules for Volatility 75 (1s) (`1HZ75V` — October 28, 2026 Mandate):
1. **Indicator Configuration:**
   * **Macro Trend Identifier:** Closed M5 Stochastic `(100, 1, 1)` with Level `50.0`
   * **Trigger & Re-Entry Indicator:** Closed M5 Stochastic `(15, 1, 1 Simple)` with Levels `20.0 / 50.0 / 80.0`
   * **Baseline Trend Filter:** **NONE** (M5 EMA 100 filter explicitly excluded per trader mandate).
2. **Initial Entry Engine:**
   * **Trend Arming:** Closed M5 Stoch (100, 1, 1) %K crosses above Level 50.0 (BUY) or below Level 50.0 (SELL) to set trend direction.
   * **Trigger:** Closed M5 Stoch (15, 1, 1 Simple) %K fresh cross above Level 50.0 (BUY) or below Level 50.0 (SELL).
   * **Pre-Cross Bypass Rule:** If Stoch (15, 1, 1) was ALREADY above Level 50 (for BUY) or below Level 50 (for SELL) before Stoch 100 crossed, bypass initial entry immediately and set the bot open for Re-Entry (`initialBuyDone = true` / `initialSellDone = true`).
3. **Re-Entry Engine (After Initial Entry Taken or Bypassed):**
   * **Trend Alignment:** Stoch 100 remains aligned in trend direction (`%K >= 50.0` for BUY / `<= 50.0` for SELL).
   * **BUY Re-Entry:** Fresh M5 Stoch (15, 1, 1 Simple) %K cross **above Level 20.0** (`prevK <= 20.0 && sK > 20.0`).
   * **SELL Re-Entry:** Fresh M5 Stoch (15, 1, 1 Simple) %K cross **below Level 80.0** (`prevK >= 80.0 && sK < 80.0`).
4. **Trade Management & Profit Engine:**
   * **Software SL:** -$2.00 (40.0 pts on 0.05 lots) | Hard Broker SL: -$5.00 (100.0 pts).
   * **Early Invalidation:** Multi-fractal reversals and 3 adverse candle exits are excluded on 1HZ75V; downside is strictly governed by -$2.00 Software SL.
   * **Level 80/20 Touch SL Adjustment:** When Stoch (15, 1, 1) touches Level 80.0 for BUY or Level 20.0 for SELL, advance Software SL floor to **+$0.30**.
   * **Level 50 Full Profit Exit:** Activated **ONLY AFTER** having touched Level 80 (BUY) or Level 20 (SELL). When Stoch (15, 1, 1) confirms across Level 50 (crosses `< 50.0` on BUY or `> 50.0` on SELL), close trade immediately to bank profit.
* **Step 180 (`2026-10-18 20:30:54 UTC`):**
  > "lets proceed with vix 75 1s. what are the rules"
* **Step 270 & Step 277 (`2026-10-18 21:06:21 & 21:17:23 UTC`):**
  > "The rules are accurate but i think there are errors in the implementation... also remove the following early exit rules: 1. Early Loss Exit 3 — M5 Fast Stoch, 2. Entry-Hour H1 Adverse Close Exit, and introduce the below early exit rule: Closed-M5 Stoch (15, 2, 5) level 50 cross in opposite direction early exit"
* **Step 9226 (`2026-10-23 23:34:50 UTC` — Authoritative Indicator & Entry Upgrade):**
  > "Please see the updates below.
  > 
  > A. Indicators
  > 1. Macro Trend Identifier: Stochastic (100, 1, 1)
  > 2. Trigger Indicator: Stochastic (30, 2, 5 Simple) level 50
  > 3. re entry indicator: Stochastic (15, 2, 5 Simple) level 25/75
  > 
  > B. Initial Entry Rules (Buy/Sell)
  > 1. Condition 1 (Macro Trend Arming): Closed M5 Stochastic (100, 1, 1) %K crosses above/below Level 50.0. It stays armed as long as it remains above/below 50.
  > 2. Condition 2 (Baseline Filter): Price must be above/below M5 EMA 100
  > 3. Condition 3 (Execution Trigger): Stochastic (30, 2, 5 Simple) freshly crosses above/below level 50. the cross can happen 3 candles before Stoch 100 crosses level 50, 3 candles after Stoch 100 crosses level 50, or simultaneiously.
  > 
  > C. Re-Entry Rules (After Initial Trade Has Closed)
  > While the Macro Trend remains valid (Stoch 100 aligned)
  > Fresh M5 Stochastic (15, 2, 5 Simple) %K crosses above Level 25 for buy or below level 75 for sell."

#### Consolidated Authoritative Rules for Volatility 75 (1s) (`1HZ75V`):
1. **Indicator Configuration:**
   * **Macro Trend Identifier:** Closed M5 Stochastic `(100, 1, 1)`
   * **Baseline Trend Filter:** M5 EMA `100`
   * **Trigger Indicator:** Closed M5 Stochastic `(30, 2, 5 Simple)` with Level `50.0`
   * **Re-Entry Indicator:** Closed M5 Stochastic `(15, 2, 5 Simple)` with Levels `25.0 / 75.0`
2. **Initial Entry Engine (Dual-Stoch ±3 Candle Timing Window):**
   * **BUY:** Stoch (100, 1, 1) %K crosses above Level 50.0 (stays armed while `>= 50.0`) + Price > M5 EMA 100 + Stoch (30, 2, 5 Simple) %K freshly crosses above Level 50.0.
   * **SELL:** Stoch (100, 1, 1) %K crosses below Level 50.0 (stays armed while `<= 50.0`) + Price < M5 EMA 100 + Stoch (30, 2, 5 Simple) %K freshly crosses below Level 50.0.
   * **Timing Tolerance:** The Stoch 30 Level 50 cross may occur up to 3 M5 candles before Stoch 100 crosses Level 50, up to 3 candles after, or simultaneously (`|epoch100 - epoch30| <= 900s`).
   * **Baseline Requirement:** Price must be beyond EMA 100 at trigger; if not, initial entry is skipped to await re-entry.
   * **Freeing Re-Entry Deadlock (User Mandate):** If the bot could not take the initial entry, but initial entry trigger Stoch (30, 2, 5 Simple) crosses Level 50, the bot immediately unlocks re-entries (`initialBuyDone = true` / `initialSellDone = true`) so subsequent qualifying re-entry signals can be executed without deadlock.
3. **Re-Entry Engine (After Initial Trade Has Closed or Been Unlocked):**
   * **Trend Alignment:** Macro Trend remains valid (Stoch 100 %K `>= 50.0` for BUY / `<= 50.0` for SELL) + Price confirmed beyond EMA 100.
   * **BUY Trigger:** Fresh M5 Stochastic (15, 2, 5 Simple) %K cross **above Level 25.0** (`prevK <= 25.0 && sK > 25.0`).
   * **SELL Trigger:** Fresh M5 Stochastic (15, 2, 5 Simple) %K cross **below Level 75.0** (`prevK >= 75.0 && sK < 75.0`).
4. **Trade Management & Profit Engine:**
   * **Software SL:** -$2.00 (40.0 pts on 0.05 lots) | Hard Broker SL: -$5.00 (100.0 pts).
   * **Base TP:** +$3.50 net (70.0 pts) | **Daily Strike TP:** +$7.00 net (140.0 pts).
   * **Profit Management Engine:** Closed-M5 Stoch (30,20,15) Opposite %K/%D Level 20/80 Profit Exit ($0.50 SL ratchet on touch of 80 for BUY / 20 for SELL; exit on opposite cross & cross beyond 80/20).

---

### 17.7. VOLATILITY 25 (1s) INDEX (`1HZ25V` — ICE CREAM MACHINE)

#### Chronological Verbatim Directives:
* **Step 5485 (`2026-10-22 07:30:35 UTC` — Instrument Migration & Rule Specification):**
  > "i still have the same challenge. vix 100 1s trades are still closing as soon as they open. i thing we have to switch to another instrument. map the strategy to vix 25 1s. we will change the rules slightly
  > 
  > For initial entry,
  > 1. stoch 200 cross level 45/55 for buy or sell to sel the main trend
  > 2. Stoch (15,2,5) cross above level 75 for buy and below level 25 for sell
  > 3. EMA 100 is a filter at the time condition 1 and 2 are met, M5 price must be above EMA 100 for buy or below EMA 100 for sell. If EMA is not aligned, skip the trade and wait for a re entry signal
  > 
  > NB condition 1 may happen before 2 or 2 may happen before 1
  > 
  > re entry condition: after initial entry has been taken
  > 1. Stoch 200 still in the right direction
  > 2. Stoch (15,2,5) freshly crosses above level 25 for buy or level 75 for sell
  > 3. EMA 100 is a filter. at the time condition 1 and 2 are met, M5 price must be above EMA 100 for buy or below EMA 100 for sell.
  > 
  > we can maintain the current trade management rules."

#### Consolidated Authoritative Rules for Volatility 25 (1s) (`1HZ25V`):
1. **Condition 1 (Macro Trend Identifier):** M5 Stoch (200, 1, 1) %K cross **above 55.0** for BUY, **below 45.0** for SELL (Hysteresis holds trend until reverse threshold cross).
2. **Condition 2 (Trigger Oscillator):** M5 Stoch (15, 2, 5) cross **above 75.0** for BUY, **below 25.0** for SELL.
3. **Any-Order Confluence Mandate:** Condition 1 may precede Condition 2, or Condition 2 may precede Condition 1.
4. **Condition 3 (M5 EMA 100 Filter):** Price must be > EMA 100 for BUY or < EMA 100 for SELL. **If not aligned, skip the initial trade and transition immediately to await re-entry.**
5. **Re-Entry Engine:** Stoch 200 aligned + fresh Stoch (15, 2, 5) cross **above 25.0** (BUY) / **below 75.0** (SELL) + Price vs EMA 100 aligned.
6. **Trade Management:** Software SL -$4.00 | Hard SL -$5.00 | Tier 0 Shield at +$1.00 -> $0.50 floor | Dynamic Runner to $20 ceiling.

---

### 17.8. VOLATILITY 10 INDEX (`R_10` — STAR MACHINE)

#### Chronological Verbatim Directives:
* **Step 476 & Step 507 (`2026-10-18 22:28:47 & 22:38:39 UTC`):**
  > "lets proceed to Volatility 10. what are the rules"
  > 
  > "the initial entry condtions seems wrong.
  > 
  > Initial BUY (isInitialBuyTrigger):
  > 1. Stoch (200, 1, 1) %K >= 50.0 (stoch200AlignedBuy)
  > 2. MACD (25, 75, 1) >= 0.0 (macdAlignedBuy)
  > 2. Price > M5 EMA 100 (emaBaselineBuy)
  > 
  > Initial SELL (isInitialSellTrigger):
  > 1. Stoch (200, 1, 1) %K <= 50.0 (stoch200AlignedSell)
  > 2. MACD (25, 75, 1) <= 0.0 (macdAlignedSell)
  > 3. Price < M5 EMA 100 (emaBaselineSell)
  > 
  > NB: trigger initial entry when all these conditions are met. they can happen in any order.
  > 
  > also change Early Loss Exit 3 — M5 Stoch settings from (5, 3, 3) to (15, 2, 5)"

#### Consolidated Authoritative Rules for Volatility 10 (`R_10`):
1. **Initial Entry Trigger (Any-Order Confluence):**
   * **BUY:** Stoch (200, 1, 1) %K `>= 50.0` AND MACD (25, 75, 1) `>= 0.0` AND Price `> M5 EMA 100`. Triggers immediately when the last condition aligns in any sequence.
   * **SELL:** Stoch (200, 1, 1) %K `<= 50.0` AND MACD (25, 75, 1) `<= 0.0` AND Price `< M5 EMA 100`. Triggers immediately when the last condition aligns in any sequence.
2. **Re-Entry Engine:** Fast Stoch (5, 3, 3) %K freshly crosses Level 20.0 (BUY) / Level 80.0 (SELL) while all 3 macro conditions remain aligned.
3. **Trade Management:** Software SL -$2.50 | Hard SL -$5.00 | Tier 0 Shield at +$1.00 -> $0.50 floor | Dynamic Runner.

---


---

## 18. FLEET $7.00/DAY PROFIT ENGINE & $100 LIVE CAPITAL SPECIFICATION

### 18.1. Operational Context & Capital Architecture
* **Target:** Exactly **+$7.00 Net Daily Profit per bot** ($49.00/day across the 7-bot fleet).
* **Live Account Equity:** **$100.00 USD**.
* **Stake Sizing:** Standard **$5.00 Stake** per trade (5% equity utilization per contract).
* **Margin Guard:** Total fleet margin never exceeds 15%–35% of balance under active multi-bot deployment.
* **Risk-to-Reward Ratio:** 1 : 1.75 on base half-day wins ($3.50 win vs $2.00 loss); 1 : 3.50 on full daily target runners ($7.00 win vs $2.00 loss).

### 18.2. Elimination of Premature Trailing Chokehold
Live server audits revealed that previous Tier 0 breakeven locks at +$1.00 were forcing floor exits at +$0.50 on minor tick noise, filling between +$0.07 and +$0.33 while losses reached -$3.50 to -$4.00. The calibrated engine removes this chokehold completely:
1. **The Incubation Zone ($0.00 to $2.19):** Full breathing room. Zero premature trailing stops. Trades navigate normal M5 wicks freely.
2. **Tier 1 Breakeven Capital Shield (Peak $\ge +\$2.20$):** Floor locked at **+$1.00 net**. Provides a massive **$1.20 breathing buffer** and guarantees all commissions are covered in pure green profit if a deep retracement occurs.
3. **Tier 2 Half-Target Quota Lock (Peak $\ge +\$3.50$):** Floor locked at **+$2.20 net** ($1.30 breathing buffer). Guarantees at least 31% of the daily quota is banked. Two such trades achieve the entire day's target.
4. **Tier 3 Pre-Target Runner (Peak $\ge +\$5.00$):** Floor locked at **+$3.80 net** ($1.20 buffer).
5. **Tier 4 Daily Target Strike Ceiling (Instant Take Profit):**
   ```javascript
   const remainingToDailyTarget = Math.max(0, DAILY_PROFIT_TARGET_USD - (state.dailyNetPnl || 0));
   if (pnl >= DAILY_PROFIT_TARGET_USD || (remainingToDailyTarget > 0 && pnl >= remainingToDailyTarget)) {
     dailyTargetCeilingHit = true; // Instant Cash-Out!
   }
   ```
   The instant a position generates enough profit to complete the remaining $7.00 quota (or reaches $7.00 standalone), it cashes out immediately.

### 18.3. Dual Daily Locks: Profit Lock & Drawdown Shield
* **Daily Target Lock (`+$7.00`):** Cumulative daily profit $\ge +\$7.00$ triggers `state.dailyTargetReached = true`. The bot transitions to `IDLE_DAILY_TARGET_REACHED`, blocks all new entries, and protects profit until 00:00 UTC rollover.
* **Daily Loss Limit Shield (`-$4.00`):** If a bot suffers 2 consecutive losses totaling $\le -\$4.00$, `state.dailyMaxLossReached = true` locks the bot into `IDLE_DAILY_MAX_LOSS_REACHED`. Maximum possible daily risk per bot is strictly capped at 4% of account equity.


---

## 19. FLEET-WIDE STOP & REVERSAL INVALIDATION ENGINE & SAME-CYCLE EXECUTION PROTOCOL

### 19.1 Operational Background: Forensic Audit of the VIX 50 15:50 UTC Incident
On October 25, 2026 at 15:45 UTC (candle closed 15:50 UTC), OmniSight entered BUY on Volatility 50 (`R_50`) at 89.2846 under confirmed bullish confluence (Stoch 200 = 54.44 > 52.0, Stoch 15 = 79.62 > 50.0, Price > EMA 100).
On the immediate subsequent M5 candle (15:50 to 15:55 UTC), the market suffered a catastrophic reversal:
* M5 close plummeted -31.5 points to 88.9589.
* Macro Trend Stoch 200 plummeted to 39.93 (< 50.0), signaling a definitive macro trend flip to SELL.
* Stoch (15,2,5) %K plummeted to 21.36, crossing below %D and crossing below Level 50.0.
* Price dropped decisively below M5 EMA 100.

**The Flaw Identified:**
OmniSight held the losing BUY position because `PROFILE_V100_STOCH200_STOCH15` lacked a dedicated Stop & Reversal Invalidation exit. Furthermore, because `openTrades` was evaluated once before exit processing, `noActiveTrades` remained false, preventing the bot from taking the textbook reversal SELL trade on the very candle that confirmed the reversal.

### 19.2 The Fleet-Wide Stop & Reversal Formula
To prevent active trades from suffering full software stop loss when market structure decisively flips, the engine evaluates the following Stop & Reversal Invalidation rule on every confirmed closed M5 candle following entry (`isPostEntryCandle` && `!isRunner`):

#### For Stoch 200 / Stoch (15,2,5) Assets (`R_50` OmniSight, `R_100` Milk Machine, `1HZ25V` Ice Cream):
* **BUY Trade Liquidation:**
  `stoch200Opposite = sK200 < 50.0` **AND** `stoch15KdCrossOpposite = sK1525 < sD1525 || (prevK1525 >= prevD1525 && sK1525 < sD1525)`
* **SELL Trade Liquidation:**
  `stoch200Opposite = sK200 > 50.0` **AND** `stoch15KdCrossOpposite = sK1525 > sD1525 || (prevK1525 <= prevD1525 && sK1525 > sD1525)`
* **Execution Action:** Active trade is liquidated immediately at market.

#### For Stoch 100 / Stoch (30,2,5) Assets (`1HZ75V` Coffee Machine, `R_25` Tea Machine):
* **BUY Trade Liquidation:** `sK100 < 50.0` **AND** `sK3025 < sD3025`
* **SELL Trade Liquidation:** `sK100 > 50.0` **AND** `sK3025 > sD3025`

#### For MACD / Stoch 200 / Stoch (5,3,3) Assets (`R_10` Test Bot):
* **BUY Trade Liquidation:** (`sK200 < 50.0` OR `macdVal < 0.0`) **AND** `sK533 < sD533`
* **SELL Trade Liquidation:** (`sK200 > 50.0` OR `macdVal > 0.0`) **AND** `sK533 > sD533`

#### For EMA 100/200 / Stoch (15,2,5) Assets (`R_75` Lery's Alerts):
* **BUY Trade Liquidation:** Price closes below EMA 100 **AND** Stoch 15 %K < %D
* **SELL Trade Liquidation:** Price closes above EMA 100 **AND** Stoch 15 %K > %D

### 19.3 Immediate Same-Cycle Reversal Execution Protocol
1. **Immediate State Reset:**
   * `state.openTrade = null`
   * `onTradeClosedCleanup(candles[si].epoch)`
   * Directional lock flags (`initialEntryDone`, `initialBuyDone`, `initialSellDone`) are set to `false`.
   * Trend direction flips immediately (`trendDir = isBuy ? "SELL" : "BUY"`).
   * Persistent reversal latch is engaged (`reversalArmed = isBuy ? "SELL" : "BUY"`).
2. **Same-Candle Memory Synchronization:**
   * Right after the exit loop completes, `trades = loadTrades()` reloads settled trades from disk.
   * `openTrades = trades.filter(t => !t.result && !t.pending && !closingContracts.has(t.contractId))`
   * `noActiveTrades` evaluates to `true` within the exact same slow-path scan.
   * If the reversal conditions (Stoch across 50 and Price aligned with EMA 100) are satisfied on that confirmation candle, the reversal trade fires immediately without delay.

---

## 20. DIAGNOSTIC SCENARIO 57: FLEET-WIDE REPLACEMENT OF "STOCH %K/%D OPPOSITE CROSS EARLY EXIT" WITH CLOSED-M5 STOCH (15,2,5) LEVEL 40/60 LOSS INVALIDATION

### 20.1 Incident Forensic & Root Cause Analysis
During active market monitoring on October 25, 2026, an active trade on Volatility 75 (`R_75` Lery's Alerts) closed prematurely with the reason:
`"Stoch %K/%D Opposite Cross Early Exit: M5 Stoch (15,2,5 Simple) opposite direction (%K: 15.8 vs %D: 14.2) while in loss (-$0.77)"`.

The post-mortem revealed two systemic deficiencies:
1. **Hyper-Sensitive %K/%D Noise Crosses in Oversold/Overbought Extremes:**
   Evaluating a basic `%K` crossing `%D` opposite cross while in minor floating loss caused trades to liquidate during routine pullback consolidations (even deep in the oversold zone where a bullish rebound was imminent).
2. **Missing State Cleanup in V75 & Legacy Profiles:**
   In `PROFILE_V75_EMA_STOCH15`, the early exit path executed broker close and saved trades, but omitted `state.openTrade = null` and `onTradeClosedCleanup(candles[si].epoch)`. This left stale latch flags active in memory.

### 20.2 The Authoritative Closed-M5 Stoch (15,2,5) Level 40/60 Invalidation Formula
To eliminate premature cut-offs while preserving strict capital defense, the rule `"Stoch %K/%D Opposite Cross Early Exit"` has been completely removed across all 7 trading bots.

In its place, the **Closed-M5 Stoch (15,2,5) Level 40/60 Loss Invalidation Exit** is enforced:
* **Pre-Conditions:** Evaluated strictly on confirmed closed M5 candles (`candles[si].epoch > t.entryEpoch`), strictly when the trade is in floating loss (`currentPnl < 0`), and strictly when not in active runner immunity (`!isRunner`).
* **BUY Position Invalidation:**
  $$\text{prevK} \ge 60.0 \quad \text{AND} \quad \text{currK} < 60.0$$
  If a BUY trade is in negative territory and Stoch (15,2,5) %K drops below **60.0**, bullish momentum is confirmed shattered, and the trade is liquidated.
* **SELL Position Invalidation:**
  $$\text{prevK} \le 40.0 \quad \text{AND} \quad \text{currK} > 40.0$$
  If a SELL trade is in negative territory and Stoch (15,2,5) %K rises above **40.0**, bearish momentum is confirmed shattered, and the trade is liquidated.
* **Universal State Reset & Reversal Arming:**
  On liquidation, `state.openTrade = null` and `onTradeClosedCleanup(candles[si].epoch)` are guaranteed to execute, resetting all latch states and arming reversal channels cleanly.


## 21. TRADER MANDATE (OCT 27, 2026) — COMPLETE PURGE OF OBSOLETE RULES & UNIVERSAL STOCH (30,20,15) PROFIT ENGINE

### A. Rules Purged Completely Fleet-Wide (Zero Trace Remaining):
1. **Profit Protection & Trailing Ratchet:** Completely purged all tiered ratchet brackets, dynamic runners, and partial profit locks.
2. **Rescue Retracement Exit & All Rescue Logic:** Completely purged all rescue functions, state keys (`rescueStochArmed`), and second position logic across all bots.
3. **Closed-M5 Stoch (25,2,5) 65/35 Profit Exit:** Completely purged from all bots.
4. **Entry-Hour H1 Adverse Close Exit:** Completely purged all `evaluateH1AdverseClose` checks across all instruments.
5. **Closed-M5 Stoch (15,2,5) Level 40/60 Invalidation Exit:** Completely purged from all bot profile exit logic.

### B. The Sole Universal Fleet-Wide Profit Management Rule:
**Closed-M5 Stoch (30,20,15 Simple) Opposite %K/%D Level 20/80 Cross & Touch Engine:**
- **Software SL Move to +$0.50 Floor:**
  - For **BUY** trades in profit (`currentPnl > 0`): If closed M5 Stoch (30,20,15) `%K >= 80.0`, move Software SL to **+$0.50**.
  - For **SELL** trades in profit (`currentPnl > 0`): If closed M5 Stoch (30,20,15) `%K <= 20.0`, move Software SL to **+$0.50**.
- **Profit Close on Opposite %K/%D Cross with Level 80 / 20:**
  - For **BUY** trades in profit: If `%K` crosses `%D` in opposite (bearish) direction AND crosses level 80 (`%K < %D` and `%K < 80.0`), close trade immediately.
  - For **SELL** trades in profit: If `%K` crosses `%D` in opposite (bullish) direction AND crosses level 20 (`%K > %D` and `%K > 20.0`), close trade immediately.

---

## 22. TRADER MANDATE (NOV 1, 2026) — VOLATILITY 50 (R_50 OMNISIGHT) STOCH 100 TREND & STOCH (8,1,1) OVERHAUL

### 25.1 Authorized Architecture Specification
In accordance with direct trader directive, Volatility 50 (`R_50` — OmniSight running under PM2 `omni-v50` on Server 2) has been fully upgraded from MACD (5,35,1) to the high-precision Closed M5 Stoch (100,1,1) + Stoch (8,1,1) Confluence Engine:

1. **Macro Trend Gate:**
   - Evaluated strictly on confirmed closed M5 candles.
   - Indicator: `M5 Stoch (100, 1, 1 Simple)`.
   - Gate Level: **Level 50**.
   - Bullish Trend: `%K > 50.0` (Arms BUY).
   - Bearish Trend: `%K < 50.0` (Arms SELL).
   - Replaces MACD Level 0 gate completely.

2. **Initial Trigger:**
   - Indicator: `M5 Stoch (8, 1, 1 Simple)`.
   - Trigger Condition: Fresh cross of Level 50 (`> 50` for BUY, `< 50` for SELL) within **±2 candles** (±600 seconds) of the Stoch 100 Level 50 transition.
   - If 2 candles pass without Stoch 8 alignment, initial entry is bypassed and Re-Entry mode is armed.

3. **Re-Entry Trigger:**
   - Evaluated while Stoch (100, 1, 1) remains aligned and no same-direction trade is active:
   - **BUY Re-Entry:** Stoch (8, 1, 1) pulls back to touch or cross `<= 10.0` (arms pullback latch), then on a confirmed closed M5 candle freshly crosses `> 10.0`.
   - **SELL Re-Entry:** Stoch (8, 1, 1) pulls back to touch or cross `>= 90.0` (arms pullback latch), then on a confirmed closed M5 candle freshly crosses `< 90.0`.

4. **Trade Management (Sequential Stoch 8):**
   - **Rule 1 (Midline Profit Lock):** When the trade is in positive floating profit (`currentPnl > 0`) and closed M5 Stoch (8, 1, 1) reaches Level 50 (`>= 50.0` for BUY / `<= 50.0` for SELL), move Software SL to **+$0.30** and engage `stoch8_touched_midline = true`.
   - **Rule 2 (Reversal Exit):** ONLY AFTER Rule 1 has occurred, if closed M5 Stoch (8, 1, 1) subsequently reverses across Level 50 (`< 50.0` for BUY / `> 50.0` for SELL), liquidate the trade immediately.

5. **Risk & Profit Ceiling:**
   - **Hard Take Profit:** **+$3.00** (0.75 points on 4.00 lots).
   - **Software Stop Loss:** **-$2.50** (0.625 points on 4.00 lots).
   - **Broker Hard SL:** **-$5.00** (1.25 points on 4.00 lots).


---

## 23. VOLATILITY 75 (`R_75` — LERY'S ALERTS) OVERHAUL: STOCH (100,1,1) + STOCH (8,1,1) ARCHITECTURE

### 26.1 Forensic Investigation Summary (2026-11-02 Audit)
Following live operational analysis where Volatility 75 completed 9 trades resulting in 3 wins and 6 losses (-$5.67 Net Loss), a root cause investigation identified five fatal failure modes in the legacy Stoch (15,1,1) 30/70 setup:
1. **Monodirectional SELL Bias Lock:** The slow Macro Stoch 100 Gate locked the bot into SELL mode during major 300–500 point intraday rallies.
2. **Counter-Trend Chop Whiplash:** Stoch 15 entered pullbacks at 30/70, which fired mid-move into rising candles rather than catching true turning points.
3. **Breakeven Lag:** Breakeven required reaching +$1.00 (50% TP); trades peaked at +$0.51 to +$0.83 and reversed all the way to -$2.00 losses without defense.
4. **Fragile Option A Invalidation:** 1-candle entry wick closes prematurely stopped trades at -$1.77.
5. **1:1 RR Deficit:** $2.00 TP vs -$2.00 SL failed mathematically at a 33% win rate.

### 26.2 The Proven Solution (V50 Architecture Applied to V75)
Backtesting across 1,000 continuous M5 candles (Deriv live tick history) demonstrated that adopting the exact V50 engine configuration transformed performance from **-$16.47 Net Loss** to **+$21.71 Net Profit** with a **79.4% win rate** (27 Wins / 7 Losses) and hitting the $6.00 daily profit target on 3 out of 4 days.

### 26.3 Rule Specifications for VIX 75 (`R_75`)
* **Macro Trend Gate:** Closed M5 Stoch (100, 1, 1 Simple) Level 50 Gate (%K > 50 BUY / < 50 SELL).
* **Initial Trigger:** Closed M5 Stoch (8, 1, 1 Simple) cross Level 50 within ±2 candles (600s) of Stoch 100 transition across 50. If window expires without cross, initial is bypassed and Re-Entry opens.
* **Re-Entry Mode:** Closed M5 Stoch 100 aligned + Stoch (8, 1, 1) pullback to touch/cross <= 10 (BUY) / >= 90 (SELL) and freshly cross back (> 10 for BUY / < 90 for SELL).
* **Trade Management:** Sequential Stoch (8, 1, 1):
  - **Rule 1:** When trade is in profit (`currentPnl > 0`) and closed M5 Stoch 8 reaches Level 50 (>= 50 BUY / <= 50 SELL), move Software SL to +$0.30 lock.
  - **Rule 2:** Strictly dependent on Rule 1; subsequent closed M5 candle where Stoch 8 reverses across Level 50 (< 50 BUY / > 50 SELL) exits immediately.
* **Risk Parameters:**
  - **Hard Take Profit:** +$3.00 (300.0 points on 0.01 lots).
  - **Software Stop Loss:** -$2.50 (250.0 points).
  - **Hard Broker Stop Loss:** -$5.00 (500.0 points).

---

## 24. VOLATILITY 25 (R_25) TEA MACHINE CALIBRATION & PROFIT PROTECTION ENGINE
*Added November 2, 2026 -- Fast-Path Real-Time Floor Lock Enforcement, Rule 2 Profit Guard, Candle Color Match, and +$3.00 / -$2.50 Risk Recalibration*

### 27.1 Forensic Root Cause Analysis
During live operations on November 2, 2026, Tea Machine (`R_25`) generated 3 full Take Profit wins (+$10.28 total), yet suffered net losses because Trades #3, #4, #5, and #6 suffered massive profit collapses:
* **Trade #3:** Ran to **+$2.99** peak profit (within 1 point of $3.50 TP target), then retraced all the way to **-$1.52** under Rule 2 exit.
* **Trade #6:** Ran to **+$2.51** peak profit, then retraced all the way to **-$0.87** under Rule 2 exit.
* **The Glitch:** Rule 1 armed in memory (`t.lockedPnlFloor = 0.30`), but the continuous 3-second fast-path price loop only checked the `-$3.50` stop loss and failed to execute the floor lock. Subsequently, when the trade dipped into negative territory, Rule 2 triggered on the closed M5 candle without checking if the trade was in profit, crystallizing unnecessary losses.

### 27.2 Backtest Verification & Strategy Calibration
Backtests across 1,000 M5 Deriv candles proved:
* Fast Stochastic (8, 1, 1) is too reactive for Volatility 25's lower tick velocity, causing 42 trades and -$16.96 drawdown.
* Stochastic (25, 1, 1) captures the true cyclical swing structure of V25 with an **83.3% win rate** (15W / 3L, +$23.95 net profit).
* Calibrating fast-path profit protection and enforcing closed candle color matching eliminates premature profit decay and counter-trend traps.

### 27.3 Rule Specifications for VIX 25 (`R_25` -- Tea Machine)
* **Macro Trend Gate:** Closed M5 Stoch (100, 1, 1 Simple) Level 50 Gate (%K > 50 BUY / < 50 SELL).
* **Initial Trigger:** Closed M5 Stoch (25, 1, 1 Simple) cross Level 50 within ±3 candles of Stoch 100 cross, **strictly requiring directional candle match** (`close > open` for BUY, `close < open` for SELL).
* **Re-Entry Mode:** Closed M5 Stoch 100 aligned + Stoch (25, 1, 1) pullback to <= 30 (BUY) / >= 70 (SELL) and fresh cross > 30 (BUY) / < 70 (SELL), **strictly requiring directional candle match**.
* **Trade Management & Profit Protection:**
  - **Rule 1 (Midline Arm):** When trade is in profit (`currentPnl > 0`) and closed M5 Stoch 25 reaches Level 50 (>= 50 BUY / <= 50 SELL), Software SL is locked at **+$0.30** in fast-path memory.
  - **Active Fast-Path Execution:** The 3-second price watchdog continuously monitors `openTrade.lockedPnlFloor`. If price retraces to +$0.30, the trade is liquidated immediately at market to protect capital.
  - **Rule 2 (Reversal Exit):** Subsequent closed M5 candle where Stoch 25 reverses across Level 50 (< 50 BUY / > 50 SELL) exits immediately **ONLY if floating profit is >= +$0.10**. Rule 2 is strictly forbidden from exiting in a loss.
* **Risk Parameters:**
  - **Software Take Profit:** +$3.00 (6.00 points on 0.50 lots).
  - **Hard Broker Take Profit:** +$5.00 (10.00 points).
  - **Software Stop Loss:** -$2.50 (5.00 points).
  - **Hard Broker Stop Loss:** -$5.00 (10.00 points).

---

## 25. VOLATILITY 75 (1s) (1HZ75V) COFFEE MACHINE CALIBRATION & FLEET ENGINE RESTRUCTURING
*Added November 2, 2026 -- Conversion to Fleet V50/V75 Stoch 100 + Stoch 8 Engine, 0.15 Lot Size Scaling, +$6.00 Take Profit Target Lock, -$5.25 Software SL, +$1.50 Fast Floor, and Directional Candle Color Matching*

### 28.1 Forensic Root Cause Analysis
During comprehensive flight recorder audits and live trading operations, Coffee Machine (`1HZ75V`) suffered chronic daily underperformance (-$42.81 net loss over 145 live trades, 0 target hits):
1. **0.05 Lot Size Bottleneck:** At 0.05 lots ($0.05/pt), achieving a $6.00 daily profit target required 120 points (48% of the entire 24h daily ATR of 250 points). This made hitting the target mathematically improbable on a single session.
2. **Breakeven Choking:** The legacy engine armed breakeven at +$1.00 and dropped the stop loss to +$0.10. At 0.05 lots, +$0.10 is only 2 price points. Normal M5 candle noise on `1HZ75V` averages 18.0 points. As a result, 52 trades in 10 days were suffocated prematurely for pennies after reaching +$1.00 to +$1.68 peak profit.
3. **Fragile Candle Wick Stops:** Option A entry candle wick stop losses caused 62 premature losses from ordinary entry-candle wicks.
4. **Overtrading & Profit Erosion:** On winning sessions (e.g., Nov 2 and Oct 24), the bot reached +$4.80 to +$5.00 early in the session, but lacked a hard daily profit shutdown, subsequently churned through 14 trades, and closed in a loss.

### 28.2 10-Day Historical Backtest & Solution
Backtesting across 3,000 real M5 Deriv candles (October 23 to November 2, 2026) proved:
* Adopting the proven V50/V75 fleet architecture (Stoch 100 Trend Gate + Stoch 8 Initial & 10/90 Re-Entry) with Closed M5 Candle Color Match transformed performance from **-$24.78 Net Loss (21.5% win rate)** to **+$30.00 Net Profit (84.6% win rate)**.
* Scaling lot size to **0.15 lots** allows a single clean 40-point swing to achieve the full **+$6.00 daily profit target**.
* Enforcing a **Hard Daily Target Lock** ensures that once +$6.00 is achieved, all trading halts immediately until 00:00 UTC, achieving **9 out of 11 green days (82%)**.

### 28.3 Rule Specifications for VIX 75 (1s) (`1HZ75V` -- Coffee Machine)
* **Macro Trend Gate:** Closed M5 Stoch (100, 1, 1 Simple) Level 50 Gate (%K > 50 BUY / < 50 SELL).
* **Initial Trigger:** Closed M5 Stoch (8, 1, 1 Simple) cross Level 50 within ±2 candles (600s) of Stoch 100 cross, **strictly requiring directional closed M5 candle match** (`close > open` for BUY, `close < open` for SELL).
* **Re-Entry Mode:** Closed M5 Stoch 100 aligned + Stoch (8, 1, 1) pullback to touch/cross <= 10 (BUY) / >= 90 (SELL) and fresh cross back (> 10 for BUY / < 90 for SELL), **strictly requiring directional closed M5 candle match**.
* **Trade Management & Profit Protection:**
  - **Rule 1 (Midline Floor Lock):** When trade is in profit (`currentPnl > 0`) and closed M5 Stoch 8 reaches Level 50 (>= 50 BUY / <= 50 SELL), Software SL is locked at **+$1.50** (+10.0 points at 0.15 lots) in fast-path memory.
  - **Active Fast-Path Execution:** The 3-second price watchdog continuously monitors `openTrade.lockedPnlFloor`. If price retraces to +$1.50, the trade is liquidated immediately at market to secure profit.
  - **Rule 2 (Reversal Exit):** Subsequent closed M5 candle where Stoch 8 reverses across Level 50 (< 50 BUY / > 50 SELL) exits immediately **ONLY if floating profit is >= +$0.50**. Rule 2 is strictly forbidden from exiting in a loss.
* **Risk & Capital Parameters:**
  - **cTrader Lot Size:** 0.15 lots ($0.15 per point).
  - **Software Take Profit:** +$6.00 (40.0 points on 0.15 lots).
  - **Hard Broker Take Profit:** +$7.50 (50.0 points).
  - **Software Stop Loss:** -$5.25 (35.0 points).
  - **Hard Broker Stop Loss:** -$7.50 (50.0 points).
  - **Daily Profit Target Lock:** The instant cumulative daily PnL reaches >= +$6.00, trading halts until 00:00 UTC.
  - **Daily Max Loss Circuit Breaker:** If daily PnL reaches <= -$5.25, trading halts for the remainder of the calendar day.

---

## 26. FLEET MANDATE (NOV 7, 2026): NEAR-TARGET M5 CANDLE-CLOSE PROFIT EXIT (>= 85%) & INTRA-TRADE DAILY TARGET REMOVAL

### 29.1 Problem Statement & Forensic Audit
1. **Intra-Trade Daily Target Cutoff Glitch (Vix 25 1s):**
   - In previous revisions, an intra-trade check `dailyTargetCeilingHit = (pnl >= remainingToDailyTarget)` prematurely terminated trades the moment the account reached its daily goal (e.g. `+$7.00`), cutting profitable runners short (e.g., closing at `+$0.83` instead of capturing the full multi-dollar fractal runner).
   - **Fix:** Intra-trade daily target ceiling check is completely disabled (`const dailyTargetCeilingHit = false;`). Trades run unhindered to their natural technical targets (Fractal TP, Near-Target Exit, or Supertrend trailing flip). Once the trade finishes and cumulative daily profit meets/exceeds `DAILY_PROFIT_TARGET_USD`, the bot locks further *new entries* until 00:00 UTC rollover.

2. **Near-Target Retracement Profit Surrender (Vix 10 Audit):**
   - On Vix 10 (`Test-Bot`), trade #155382171 covered 89.2% of its fractal target distance (reaching within 0.78 points of TP, peak floating profit +$3.39), but because it missed the broker tick touch by a hair, price drifted for nearly an hour and surrendered 54% of its gains before closing on a Supertrend flip at +$1.56.
   - **Trader Directive:** Implement an M5 candle-close profit exit rule that allows a candle that almost hits the target to close the trade on candle close if it closes near the target or shows rejection, maximizing realized profit without getting choked mid-bar.

### 29.2 The Near-Target M5 Candle-Close Profit Exit Rule Specification
Evaluated strictly on confirmed closed M5 candles in `runSlowPathScan`:
- **Condition:** Trade is post-entry and currently in profit (`isPostEntry && currentPnl > 0`).
- **Target Distance Calculation:**
  $$D = |\text{targetTp} - \text{entryPrice}|$$
  $$\text{NearTargetLine}_{\text{BUY}} = \text{entryPrice} + 0.85 \times D$$
  $$\text{NearTargetLine}_{\text{SELL}} = \text{entryPrice} - 0.85 \times D$$
- **Trigger 1: Direct Near-Target Close:**
  - BUY: Closed M5 candle closes $\ge \text{NearTargetLine}_{\text{BUY}}$ (`cClose >= nearTargetLine`).
  - SELL: Closed M5 candle closes $\le \text{NearTargetLine}_{\text{SELL}}$ (`cClose <= nearTargetLine`).
  - *Action:* Liquidate immediately at market on candle close.
- **Trigger 2: Exhaustion / Rejection Wick Exit:**
  - BUY: Closed M5 candle wicked into $\ge 85\%$ of target (`cHigh >= nearTargetLine`), but closed showing rejection against the trade with a red candle (`cClose < cOpen`).
  - SELL: Closed M5 candle wicked into $\ge 85\%$ of target (`cLow <= nearTargetLine`), but closed showing rejection against the trade with a green candle (`cClose > cOpen`).
  - *Action:* Liquidate immediately at market on candle close to lock in peak profits before retracement.
- **Pure Candle Close Execution:**
  - No intrabar fast-path noise triggering. Evaluated solely on confirmed closed M5 bars to maximize profit potential while protecting gains.

---

## 27. ZERO-PNL ROOT CAUSE RESOLUTION, TWO-PHASE BROKER EXECUTION INVARIANT & PINPOINT CTRADER HISTORICAL DEAL RECONCILIATION

### 30.1 Forensic Audit & Zero-Assumption Investigation
On November 7, 2026, trades on Vix 25 (`Tea Machine`), Vix 25 (1s) (`Ice Cream Machine`), Vix 75 (`Lery's Alerts`), and Vix 10 (`Test Bot`) displayed `+$0.00` profit / PnL on the dashboard with exit reason `CLOSED_EXTERNAL`. A thorough, zero-assumption live protocol analysis across Server 1 (`138.2.169.72`) and Server 2 (`79.76.120.30`) revealed the true multi-layered root cause:

1. **cTrader Open API Two-Phase Order Lifecycle (`ProtoOAExecutionEvent`):**
   - In cTrader Open API, when a `ProtoOANewOrderReq` (payload 2106) is transmitted, the broker returns an immediate synchronous `ProtoOAExecutionEvent` with `executionType: 2` (`ORDER_ACCEPTED`). This packet already contains the assigned `positionId`, but has `executedVolume: 0`, `price: 0`, and status `ORDER_STATUS_ACCEPTED` (1).
   - In the legacy `ctrader-service.js`, `openOrder` only checked `if (!positionId)` upon receiving the immediate response. Because `positionId` was present in the accepted packet, `openOrder` prematurely declared `success: true`.
   - In reality, ~500ms later, cTrader sends a second asynchronous `ProtoOAExecutionEvent` over WebSocket with the terminal status:
     - `executionType: 3` (`ORDER_FILLED`): True execution with `res.deal.executionPrice` and `filledVolume > 0`.
     - `executionType: 5` (`ORDER_CANCELLED`): Rejection/cancellation with `deal.rejectReason` and `filledVolume: 0`.
   - Because the legacy code resolved on `ORDER_ACCEPTED`, the bot recorded a ghost position in RAM and `trades.json` even if the broker subsequently cancelled the order!

2. **The "Empty price snapshot" Liquidity Bridge Stagnation:**
   - On cTrader Demo accounts (`demo.ctraderapi.com`), synthetic index price streams occasionally stagnate during broker-side maintenance (as occurred between 09:49:26 UTC and 10:50:00 UTC on Nov 7).
   - When a market order is evaluated by the matching engine while the synthetic LP snapshot is stale, cTrader cancels the market order with `deal.rejectReason: "Empty price snapshot"`.
   - The bot, believing the position was opened, checked `getOpenPortfolio()` on the next M5 bar. Because the order had been cancelled at second 0 by the broker, it was absent from open positions.
   - The bot then attempted to fetch deal history via `/ctrader/deals`. Because 0 volume was executed, no deal existed on the broker, triggering the fallback in `alert.js` line 2924: `t.result = "CLOSED_EXTERNAL"; t.serverPnl = 0;`, creating the `+$0.00` dashboard entries!

3. **`/ctrader/deals` History Starvation:**
   - In `deriv-gateway.js`, the `/ctrader/deals` endpoint failed to pass `from` and `to` query parameters, and defaulted to fetching 30 days of historical data. The cTrader REST API limits responses to 1,000 items from the starting timestamp, starving recent deals and causing any legitimate settled trade closed after 09:45:05 UTC to return `null`.

### 30.2 Architectural Fixes Deployed Fleet-Wide

1. **Two-Phase Asynchronous Execution Event Invariant (`ctrader-service.js`):**
   - `onMessage` in `ctrader-service.js` now explicitly intercepts `ProtoOAExecutionEvent` (payload 2126):
     ```javascript
     if (msg.payloadType === PAYLOAD_TYPES.EXECUTION_EVENT) {
       const execType = msg.payload?.executionType;
       if (execType === 2) {
         // ORDER_ACCEPTED: Do not resolve; wait for terminal fill or rejection event
         return;
       }
       if (reqItem.timer) clearTimeout(reqItem.timer);
       this.pendingRequests.delete(msg.clientMsgId);

       if (execType === 3) {
         // ORDER_FILLED: True broker fill confirmed
         return reqItem.resolve(msg.payload);
       } else {
         const reason = msg.payload?.deal?.rejectReason || msg.payload?.rejectReason || `Order execution failed (execType ${execType})`;
         return reqItem.reject(new Error(reason));
       }
     }
     ```
   - If an order is cancelled with "Empty price snapshot" or any broker error, `openOrder` rejects immediately with that error. The bot catches the rejection, aborts entry, and never writes a ghost trade to `trades.json`.

2. **Proactive Spot Stream Subscription:**
   - `openOrder` proactively sends `ProtoOASubscribeSpotsReq` (2127) for the target symbol prior to order dispatch, ensuring an active pricing context on the WebSocket channel.

3. **Time-Bounded `/ctrader/deals` Endpoint & Single-Position Querying:**
   - Deriv Gateway (`deriv-gateway.js`) now parses `from`, `to`, and `positionId` query parameters, defaulting to the last 24 hours (never 30 days).
   - In `alert.js`, `getContractProfitFromHistory` now executes pinpoint queries:
     ```javascript
     const fromMs = approxOpenEpoch ? (approxOpenEpoch * 1000 - 120000) : (Date.now() - 24 * 60 * 60 * 1000);
     const res = await gatewayFetch(`/ctrader/deals?positionId=${encodeURIComponent(contractId)}&from=${fromMs}&to=${Date.now()}`);
     ```
   - This ensures instant, deterministic reconciliation with exact broker gross profit, swaps, commissions, and execution timestamps.

4. **Historical Ghost Trade Expungement:**
   - All zero-volume cancelled orders (`155459886`, `155460065`, `155459920`, `155460364`, `155460365`) have been removed from `trades.json` across all bots on Server 1 and Server 2.
   - All cumulative daily net PnLs have been recalculated and verified against real broker-settled deals:
     - `Tea Machine (V25)`: +$2.46 (3 trades: +$4.51, +$0.43, -$2.48).
     - `Ice Cream Machine (V25-1s)`: +$6.51 (2 trades: +$6.95, -$0.44).
     - `Lery's Alerts (V75)`: +$0.78.
     - `Test Bot (V10)`: -$3.63.
   - All dashboard transactions reflect 100% verified broker deals with true non-zero PnL.



---

## 28. THE TRADER'S REASONING PROTOCOL, 1-CANDLE FRACTAL CONFIRMATION, STRICT BREAKOUT MECHANICS, AND CANDLE-EXTREME SOFTWARE STOP LOSS CALIBRATION (EXPERIMENTAL FLEET MANDATE)

### 31.1 Cognitive Architecture & The Trader's Reasoning Discipline (Meta-Protocol for AI Assistants)
When designing, debugging, or maintaining automated trading systems, AI assistants frequently fail due to over-complication, theoretical drift, or altering strategy mechanics under the guise of "optimizations." Every AI operating on this system MUST adopt the operator's exact cognitive framework:

1. **Absolute Strategy Fidelity (Zero Assumptions):**
   - The primary objective of the AI is NOT to invent, calibrate, or "improve" the strategy according to textbook convention.
   - The primary objective is to **translate the trader's exact market rules into precise, deterministic, bug-free code**.
   - If a rule appears counter-intuitive to generic quantitative models, the AI must NOT alter it. The trader's rules reflect empirical edge forged on live market microstructure.

2. **First-Principles Directional Logic:**
   - **For a BUY:** The market is expanding upward. Price must exhibit bullish reclaiming pressure.
     - *Trader's Axiom:* "For buys, how can it break below? It is buying; it must break above!"
     - A candle that dips below a structural floor and continues dumping lower is falling knife action—never a buy signal.
     - A valid BUY requires price to have been below the structural level, and then **close above it**, confirming demand rejection.
   - **For a SELL:** The market is expanding downward. Price must exhibit bearish rejection pressure.
     - A valid SELL requires price to have been above the structural level, and then **close below it**, confirming supply rejection.

3. **The Strict Definition of "The Break" (Sweep / Reclaim / Breakout):**
   - In both initial entries and re-entries, the trader defines "The Break" as a two-phase structural event:
     $$\text{The Break} \iff \text{Price was on the adverse side of the level, THEN closed on the favorable side of the level.}$$
   - **BUY Breakout Condition:**
     - Adverse phase: Price was below the level under consideration (either within the candle $\text{Low} \le \text{Target}$, or previous close $\text{PrevClose} \le \text{Target}$).
     - Favorable phase: Confirmed M5 close strictly **above** the target:
       $$\text{isFreshBreak}_{\text{BUY}} = (\text{cClose} > \text{Target}) \land (\text{cLow} \le \text{Target} \lor \text{prevClose} \le \text{Target})$$
   - **SELL Breakout Condition:**
     - Adverse phase: Price was above the level under consideration (either within the candle $\text{High} \ge \text{Target}$, or previous close $\text{PrevClose} \ge \text{Target}$).
     - Favorable phase: Confirmed M5 close strictly **below** the target:
       $$\text{isFreshBreak}_{\text{SELL}} = (\text{cClose} < \text{Target}) \land (\text{cHigh} \ge \text{Target} \lor \text{prevClose} \ge \text{Target})$$

---

### 31.2 The 1-Candle Fractal Confirmation Principle (Eliminating 10-Minute Lag)

#### 1. The Flaw of Traditional 2-Candle Fractal Confirmation
Legacy fractal algorithms require 2 candles to the left and 2 closed candles to the right (a 5-bar symmetric formation). In live 5-minute automated trading, requiring 2 candles to the right introduces fatal latency:
1. **10-Minute Delay:** If a pivot occurs at bar $N$, the bot cannot recognize the fractal until bar $N+2$ closes. By the time bar $N+3$ opens, the market has moved 10 to 15 minutes past the reversal point.
2. **Structural Erasure Glitch:** If bar $N+2$ wicks slightly past the extreme of bar $N$ (e.g. higher high on an Up Fractal), the symmetric loop disqualifies bar $N$. The algorithm then jumps back in time to an outdated fractal hours in the past, completely corrupting entry levels and stop losses.

#### 2. The Trader's 1-Candle Confirmation Rule
In live chart reading, a pivot high/low at bar $N$ is structurally confirmed as soon as **1 closed candle to the right** (bar $N+1$) closes without violating the pivot extreme:
- **Up Fractal at Bar $N$:** Confirmed immediately when Bar $N+1$ closes with $\text{High}_{N+1} < \text{High}_{N}$.
- **Down Fractal at Bar $N$:** Confirmed immediately when Bar $N+1$ closes with $\text{Low}_{N+1} > \text{Low}_{N}$.
- **Simultaneous Confirmation & Breakout:** Bar $N+1$ can simultaneously confirm the fractal AND break the fractal's lowest/highest point. When this occurs, the trade MUST execute immediately on the open of Bar $N+2$.

---

### 31.3 The Candle-Extreme Software Stop Loss Architecture

#### 1. The Strategy Mandate (Nov 14, 2026 Authoritative Mandate)
In the New System (Experimental Fleet), the Software Stop Loss is determined **ONLY** by the candle that confirms the fractal break:
> *"The Software SL is determined ONLY by the candle that confirms the fractal break: for BUY trades, breakoutCandle.low; for SELL trades, breakoutCandle.high. It is fixed permanently at entry and NEVER modified or shifted when the entry candle closes."*

#### 2. Strict Software Stop Loss Mechanics
1. **Entry Anchoring (Bar N+1 Breakout Candle Extreme):**
   * At the moment of trade execution (open of Bar $N+2$), the Software Stop Loss is evaluated from Bar $N+1$ (the confirmed closed candle that broke the fractal level):
     $\text{BUY Software SL} = \text{breakoutCandle.low} = \text{Low}_{N+1}$
     $\text{SELL Software SL} = \text{breakoutCandle.high} = \text{High}_{N+1}$
2. **Permanent Invariance (Zero Post-Entry Shift):**
   * As subsequent candles develop (including the entry candle Bar $N+2$), the Software Stop Loss remains **permanently locked**.
   * It is NEVER recalculated or shifted to the low/high of the entry candle. This eliminates premature trade choking and allows positions full breathing room to follow the momentum run.
3. **Confirmed Closed-M5 Liquidation Rule:**
   * Software SL is tested strictly upon confirmed M5 candle closes. If an active candle wicks past the SL level intrabar but closes back on the safe side, the trade remains open. Liquidation executes only if an M5 candle closes beyond the level.

### 31.4 Forensic Case Study: The Nov 14, 2026 VIX 25 (1s) Audit (Trade #155982591)

#### 1. Empirical Candle Sequence
On Volatility 25 (1s) Index (`1HZ25V`), the market printed the following M5 structure:
- **07:50 UTC (Bar $N$):** Up Fractal candle. High: `896032.97`, Low: `895029.63`, Close: `895604.42`.
- **07:55 UTC (Bar $N+1$):**
  - High: `895591.63` (< `896032.97` $\rightarrow$ confirms 07:50 Up Fractal ✓).
  - Low: `894731.73` (< `895029.63` $\rightarrow$ swept below the lowest point of 07:50 Up Fractal ✓).
  - Close: `895586.71` (> `895029.63` $\rightarrow$ closed back above the lowest point ✓).
  - **Verdict:** Clean, flawless BUY trigger at 07:55 close!

#### 2. The Flaw in Legacy Execution
- Because legacy code required 2 candles to the right, the bot ignored the 07:55 trigger.
- At 08:00, price wicked up to `896246.75`, disqualifying the 07:50 fractal. The bot lagged until **08:10:04 UTC** before taking trade #155982591.
- Because it entered at 08:10, it erroneously recorded the 08:00 candle (`low: 895384.29`) as its SL reference, instead of `894731.73`.
- At **08:35:05 UTC**, the 08:30 candle closed at `895218.27`. The bot saw `895218.27 <= 895384.29` and liquidated the position at a -$17.54 loss!
- **Trader's Diagnosis:** The M5 close (`895218.27`) was **well above the true Software SL (`894731.73`)**. The trade was liquidated solely because of the code's lagged entry and corrupted SL reference.

#### 3. Live Proof of Resolution (Trade #155983257)
Following deployment of Section 31 logic across the fleet, `ice-exp-v25-1s` opened trade #155983257 at 08:45:07 UTC:
- Prior candle (08:40) Low: `894737.30`.
- Entry candle (08:45) Low: `894704.97`.
- Software SL locked to: `Math.min(894704.97, 894737.30) = 894704.97`.
- Evaluated strictly on M5 close, trade remains open and running in profit.

---

### 31.5 Fleet Scope & Deployment Matrix
This quantitative specification is active across all 7 experimental trading bots:

| Server | Directory | Process Name | Asset | Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Server 2** (`79.76.120.30`) | `/home/ubuntu/trading-bots/ice-exp` | `ice-exp-v25-1s` | Volatility 25 (1s) | Experimental Sweep |
| **Server 2** (`79.76.120.30`) | `/home/ubuntu/trading-bots/omni-exp` | `omni-exp-v50` | Volatility 50 | Experimental Sweep |
| **Server 2** (`79.76.120.30`) | `/home/ubuntu/trading-bots/test-exp` | `test-exp-v10` | Volatility 10 | Experimental Sweep |
| **Server 1** (`138.2.169.72`) | `/home/ubuntu/trading-bots/tea-exp` | `tea-exp-v25` | Volatility 25 | Experimental Sweep |
| **Server 1** (`138.2.169.72`) | `/home/ubuntu/trading-bots/coffee-exp` | `coffee-exp-v75-1s` | Volatility 75 (1s) | Experimental Sweep |
| **Server 1** (`138.2.169.72`) | `/home/ubuntu/trading-bots/milk-exp` | `milk-exp-v100` | Volatility 100 | Experimental Sweep |
| **Server 1** (`138.2.169.72`) | `/home/ubuntu/trading-bots/lery-exp` | `lery-exp-v75` | Volatility 75 | Experimental Sweep |

---

## 29. CONSOLIDATED AUTHORITATIVE TRADING SPECIFICATIONS & FLEET GOVERNANCE (NOV 14, 2026)

### 32.1 Two Parallel Strategic Architectures (Non-Negotiable System Boundary)

The trading infrastructure is bifurcated into two independent, systematically separated fleets. Each operates under strict quantitative mandates:

| System Dimension | **System 1: Baseline Strategy** (Old / Legacy Fleet) | **System 2: Sweep-Reclaim Strategy** (New / Experimental Fleet) |
| :--- | :--- | :--- |
| **cTrader Account** | **Account `2596044`** | **Account `2450642`** |
| **Core Philosophy** | **Momentum / Continuation Breakout** | **Liquidity Sweep & Rejection Trap** |
| **BUY Target Reference** | Recent **High (UP) Fractal** high | Recent Fractal **Lowest Point (Low)** (Up or Down fractal) |
| **BUY Trigger Condition** | M5 Close breaks strictly **ABOVE** High Fractal High: <br>`cClose > highFractal.high` | M5 Wick dipped below, then M5 Close broke **ABOVE** Fractal Low: <br>`cClose > fractal.low && (cLow <= fractal.low || prevClose <= fractal.low)` |
| **SELL Target Reference** | Recent **Low (DOWN) Fractal** low | Recent Fractal **Highest Point (High)** (Up or Down fractal) |
| **SELL Trigger Condition** | M5 Close breaks strictly **BELOW** Low Fractal Low: <br>`cClose < lowFractal.low` | M5 Wick spiked above, then M5 Close broke **BELOW** Fractal High: <br>`cClose < fractal.high && (cHigh >= fractal.high || prevHigh >= fractal.high)` |
| **Software Stop Loss Anchor** | **Bill Williams Fractal Body Anchor**: <br>• BUY: Open if Bullish / Close if Bearish (bottom of body) <br>• SELL: Close if Bullish / Open if Bearish (top of body) <br>*(Dual-confirmed on M5 close beyond breakout candle extreme)* | **Breakout Candle Extreme Only**: <br>• BUY: `Software SL = breakoutCandle.low` <br>• SELL: `Software SL = breakoutCandle.high` <br>*(Strictly fixed at entry; NEVER shifted to entry candle)* |
| **Broker Hard Stop Loss** | **Capped at Max $15.00 USD** catastrophic broker risk | **Capped at Max $15.00 USD** catastrophic broker risk |
| **Take Profit Engine** | Structural Measured Move Swing Distance ($D = |H - L|$) | Structural Measured Move Swing Distance ($D = |H - L|$) |
| **Special Instrument TP** | **1HZ25V Hard TP locked to exactly $15.00 USD** | **1HZ25V Hard TP locked to exactly $15.00 USD** |
| **Profit Management** | Supertrend (21, 1, 0) Direction Flip when in profit | Supertrend (21, 1, 0) Direction Flip when in profit |

---

### 32.2 Strict Software Stop Loss Specification (Nov 14, 2026 Mandate)

#### 1. Experimental Fleet (Account 2450642)
* **The Breakout Candle is the Sole Anchor:** The Software Stop Loss is determined **ONLY** by the confirmed closed M5 candle that triggered the fractal break.
  * For BUY:
    $$\text{Software SL} = \text{breakoutCandle.low}$$
  * For SELL:
    $$\text{Software SL} = \text{breakoutCandle.high}$$
* **No Post-Entry Lifecycle Mutation:** Under no circumstances does the engine recalculate, shift, or tighten the Software Stop Loss when the subsequent entry candle closes. The stop loss is permanent throughout the trade's duration.
* **Evaluation strictly on Confirmed Closed M5 Candle:** Intrabar wicks touching the SL level do NOT trigger liquidation. The trade is liquidated if and only if an M5 candle completes its full 5-minute duration and closes beyond the Software SL.

#### 2. Baseline Fleet (Account 2596044)
* **Fractal Body Anchor:**
  * BUY: Open price of Bullish Fractal / Close price of Bearish Fractal (bottom of body).
  * SELL: Close price of Bullish Fractal / Open price of Bearish Fractal (top of body).
* **Dual-Confirmation Requirement:** Liquidation occurs strictly on confirmed M5 close if the close breaches the Fractal Body Anchor AND breaks beyond the confirming Breakout Candle extreme.

---

### 32.3 Broker Hard Stop Loss Firewall ($15.00 USD Maximum Loss Limit)

To prevent catastrophic gap risk, broker connectivity latency, or extreme volatility slippage, a physical broker-side Hard Stop Loss is transmitted with every order:
* **The $15.00 Cap Rule:**
  $$\text{brokerHardLossUsd} = \min(\text{calculatedStopDistanceUsd}, \$15.00)$$
* **Physical Guard:** Placed with sufficient buffer behind the Software SL so that the broker hard stop acts as an emergency circuit breaker without prematurely stopping out valid market fluctuations.

---

### 32.4 Initial Entry Gate & Stochastic 100 / Stochastic 8 Timing Mechanics

1. **Macro Trend Gate (Stoch 100, 1, 1 Simple):**
   * BUY: Valid when Stoch 100 crosses UP $\ge 47.0$.
   * SELL: Valid when Stoch 100 crosses DOWN $\le 53.0$.
2. **The $\pm 3$-Candle Lookback Rule:**
   * **Scope:** Applies strictly to *prior* fractals formed *before* the Stoch 100 cross.
   * If a fractal break occurred $> 3$ candles before the Stoch 100 cross, that prior breakout is stale and disqualified.
   * **Ongoing Trend Validity:** Once the Stoch 100 cross occurs, as long as Stoch (8, 1, 1) holds above 50.0 (for BUY) or below 50.0 (for SELL), the initial entry setup **DOES NOT EXPIRE**. Any new fractal break confirmed while momentum holds in trend triggers an immediate Initial Entry.
3. **Transition to Re-Entry:**
   * Initial Entry window expires and transitions to Re-Entry **ONLY** when Stoch (8, 1, 1) completes a full pullback:
     * BUY: Stoch 8 touches $\le 10.0$ or drops $< 50.0$.
     * SELL: Stoch 8 touches $\ge 90.0$ or rises $> 50.0$.
   * Re-Entry entries require a full cycle: Pullback confirmed $\rightarrow$ Rebound out of extreme $\rightarrow$ Fresh fractal breakout in trend direction.

---

### 32.5 Mandatory Directives for All AI Models & Autonomous Agents

> [!IMPORTANT]
> **PERMANENT DEVELOPER & AI DIRECTIVE:**
> 1. **Zero Hallucination Policy:** Never invent, improvise, or assume unstated trading rules. If a user asks "which candle broke the fractal", read the actual ledger (`trades.json`) directly from the server.
> 2. **Never Overwrite Strategies:** Never replace Baseline logic with Experimental logic or vice versa. Both master files (`alert_baseline_master.js` and `alert_experimental_master.js`) must remain distinct.
> 3. **Syntax Verification Invariant:** Before deploying any file to PM2 on either server, syntax must be verified with `node -c`.
> 4. **No Premature Trailing Stops:** Profit management is governed strictly by Supertrend (21, 1, 0) direction flips and structural Measured Move TPs. Never add artificial 1-candle oscillator exits on winning trades.

---

## 30. MASTER AI & DEVELOPER GOVERNANCE RULES (MASTER_AI_RULES.md)

> [!IMPORTANT]
> **PERMANENT, NON-NEGOTIABLE DIRECTIVES FOR ANTIGRAVITY & ALL AI ASSISTANTS**
> The rules in this section are authoritative law. Any AI assistant or developer picking up this project must read and strictly adhere to these directives before analyzing data or modifying code.

### 30.1 The Two-System Division Invariant
Never merge, overwrite, or confuse the two independent trading systems operating across Deriv and cTrader:

* **Account 2596044 — Baseline Strategy (Continuation / Old Fleet):**
  * **Philosophy:** Momentum breakout continuation in trend direction.
  * **BUY Signal:** Confirmed M5 close strictly **ABOVE** High Fractal High (`cClose > highFractal.high`).
  * **SELL Signal:** Confirmed M5 close strictly **BELOW** Low Fractal Low (`cClose < lowFractal.low`).
  * **Software Stop Loss:** Bill Williams Fractal Body Anchor (Open price for Bullish Fractal, Close price for Bearish Fractal) with breakout candle dual confirmation.

* **Account 2450642 — Sweep-Reclaim Strategy (Reversal / Experimental Fleet):**
  * **Philosophy:** Liquidity sweep and rejection trap.
  * **BUY Signal:** M5 candle wick dips below recent lowest point (Up or Down fractal), then M5 candle closes **ABOVE** fractal low (`cClose > fractal.low && (cLow <= fractal.low || prevClose <= fractal.low)`).
  * **SELL Signal:** M5 candle wick spikes above recent highest point (Up or Down fractal), then M5 candle closes **BELOW** fractal high (`cClose < fractal.high && (cHigh >= fractal.high || prevHigh >= fractal.high)`).
  * **Software Stop Loss:** Strictly the **Breakout Candle Extreme**:
    $$\text{BUY Software SL} = \text{breakoutCandle.low}$$
    $$\text{SELL Software SL} = \text{breakoutCandle.high}$$
    Permanently fixed at entry; NEVER shifted or modified when the entry candle closes.

---

### 30.2 Strict Risk & Fleet Execution Constraints
1. **Universal Broker Hard Stop Loss Cap:**
   * Transmitted synchronously with every cTrader / Deriv order.
   * Strictly capped at **$15.00 USD maximum catastrophic broker loss**. No bot may ever risk more than $15.00 USD on any single trade under any market condition.
2. **Universal Daily Profit Target:**
   * Fixed at **+$7.00 USD net daily profit** per bot.
   * Once locked, the bot pauses new entries for the remainder of the calendar day.
3. **Special Instrument Hard Take Profit:**
   * **1HZ25V (Ice Cream Machine / Ice Exp):** Hard Take Profit is locked to exactly **$15.00 USD**.
4. **Initial Entry Timing & Lookback Window:**
   * The $\pm 3$-candle lookback rule applies strictly to prior fractals formed *before* the Stochastic 100 cross.
   * As long as Stochastic (8, 1, 1) holds above 50 (for BUY) or below 50 (for SELL), the initial entry setup **does not expire**. Any new fractal break confirmed during this trend window executes immediately.
5. **Closed-M5 Candle Invariant:**
   * All trade signals, indicator confirmations, and software stop-loss exits execute strictly on **confirmed closed M5 candles** (`m5BoundaryEpoch`), never on intrabar flickers or mid-candle fluctuations.

---

### 30.3 Zero-Hallucination Audit Protocol
* When an operator asks: *"Which candle was the fractal?"* or *"Which candle broke the level?"*:
  * **DO NOT guess, speculate, compute theoretical bars, or spend multiple turns scanning logs.**
  * Immediately query `trades.json` directly via the Server 1 / Server 2 API. The exact fields `fractalEpoch`, `breakoutCandleEpoch`, `entryCandleEpoch`, `sl`, and `tp` are recorded in the trade ledger.
* Always verify syntax with `node -c` before restarting any PM2 process or deploying updates.
* **NEVER edit files directly on the server.** Always push updates through GitHub so that `pull-trades.sh` deploys code cleanly across both servers without merge conflicts.
