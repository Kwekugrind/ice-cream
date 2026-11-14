# Ice Cream Machine (V100-1s Baseline / V25-1s Exp)
**Instrument:** `1HZ100V (Baseline) / 1HZ25V (Exp)`  
**Multiplier / Lot:** `40 (Baseline) / 0.005 lot (Exp)`  
**Deployment Host:** `Server 2 (79.76.120.30)`  
**PM2 Process Baseline:** `ice-cream-100-1s` (Account `2596044`)  
**PM2 Process Experimental:** `ice-exp-v25-1s` (Account `2450642`)  

---

## Architecture & Code Contents
This repository is a lean execution container running in the Lery Trading Bot Network:
- `alert.js`: Production Baseline continuation engine (Account `2596044`).
- `alert_experimental.js`: Production Experimental sweep-reclaim engine (Account `2450642`).
- `MASTER_AI_RULES.md`: Core developer and AI governance constraints.
- `.env.example`: Environment variable blueprint.

---

## Authoritative Documentation & System Bible
Under the **Option B Centralized Architecture**, the complete Master Operations Handbook, full strategy formulas, indicator parameters, and 15-minute disaster recovery runbooks reside strictly in the centralized documentation repository:

👉 **[https://github.com/Kwekugrind/trading-handbook](https://github.com/Kwekugrind/trading-handbook)**

Any AI assistant or developer working on this bot must consult the central handbook for operational and quantitative specifications.
