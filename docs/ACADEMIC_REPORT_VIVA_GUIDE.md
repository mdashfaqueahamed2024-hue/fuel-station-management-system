# PetroFlow Enterprise — Academic Project Report & Viva Voce Defense Guide

**Degree Program:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Project Title:** Fuel Station Management System — A Full-Stack Web Application for Intelligent Fuel Inventory, Pump Operations, Sales Monitoring, and Business Analytics  
**Academic Year:** 2026–2027  

---

## 1. Executive Summary & Problem Formulation

Traditional retail petroleum stations frequently rely on fragmented paper logbooks, manual sounding-rod dip measurements recorded in notebooks, and disjointed electronic point-of-sale registers. This manual paradigm creates operational bottlenecks:
1. **Inventory Shrinkage & Undetected Leakage:** Volume loss due to temperature contraction, vapor loss, or pipeline theft goes unnoticed without automated reconciliations.
2. **Meter Counter Slippages:** Mechanical dispenser totalizers often drift from computerized POS records without scheduled discrepancy audits.
3. **Shift Handover Deficits:** Cash discrepancies during attendant shift transitions cannot be accurately attributed without atomic cash-tracking logic.
4. **Decanting Shortfalls:** Bulk tankers discharging fuel into underground reservoirs may deliver less volume than invoiced, leading to unverified losses.

**PetroFlow** solves these industry challenges by implementing an integrated, enterprise-grade full-stack platform. It enforces database-level ACID transactions, algorithmic anomaly detection, multi-station isolation, and immutable audit logging.

---

## 2. Technology Stack & Architectural Justification

| Layer | Chosen Technology | Engineering Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js (JavaScript ES6+) with Vite | Component-driven architecture, ultra-fast Hot Module Replacement (HMR), optimized production tree-shaking. |
| **Styling & Design System** | Tailwind CSS with custom enterprise palette | Utility-first CSS, dark navy sidebar (`#0f172a`), Inter font, WCAG-compliant contrast ratios. |
| **Data Visualization** | Recharts (D3-powered declarative React charts) | High-performance SVG rendering for multi-axis revenue trends and fuel grade volume distribution donuts. |
| **Form Validation** | React Hook Form & Zod | Client-side schema-based type coercion and instantaneous field-level error feedback. |
| **Backend Runtime** | Node.js (v24 LTS) with Express.js (ES Modules) | Asynchronous, non-blocking I/O event loop ideal for concurrent dispenser polling and point-of-sale processing. |
| **ORM & Database Engine** | Prisma ORM with PostgreSQL (SQLite dev mode) | Type-safe parameterized queries, declarative schema migrations, automated connection pooling, zero SQL injection. |
| **Authentication & Security**| Argon2/bcrypt + JWT (HTTP-Only Cookies) + Helmet | Salted password hashing, CSRF-resistant cookie handling, rate limiting (`express-rate-limit`), security headers. |
| **Automated Testing** | Vitest & Supertest | Sub-second test execution, integration test suite covering auth, inventory limits, and mathematical models. |
| **API Documentation** | Swagger UI & OpenAPI 3.0 Specification | Interactive browser-based API explorer located at `/api/docs`. |

---

## 3. Mathematical Models & Business Logic Specifications

### Model 1: Authoritative Stock Reconciliation Formula
The core scientific equation governing retail petroleum inventory accounting is implemented in `reconciliationService.js`:

$$\text{Expected Closing Stock} = \text{Opening Stock} + \text{Confirmed Deliveries} - \text{Recorded Sales} + \text{Net Adjustments}$$

Where:
- $\text{Opening Stock}$: Physical sounding rod dip reading from the prior reconciliation cycle.
- $\text{Confirmed Deliveries}$: Bulk deliveries verified and decanted into the target underground reservoir.
- $\text{Recorded Sales}$: Aggregated volume dispensed through connected pumps.
- $\text{Net Adjustments} = \sum \text{Positive Adjustments} - \sum \text{Negative Adjustments}$ (Accounting for temperature shrinkage, evaporation, or spillage).

$$\text{Variance Liters} = \text{Physical Measured Stock} - \text{Expected Closing Stock}$$
$$\text{Variance \%} = \left( \frac{\text{Variance Liters}}{\text{Expected Closing Stock}} \right) \times 100$$

*Discrepancy Threshold:* If $|\text{Variance \%}| > 0.5\%$, the system flags the reconciliation status as `DISCREPANCY` and creates a high-severity operational alert.

---

### Model 2: Rule-Based Anomaly Detection Heuristics
Located in `anomalyService.js`, the engine executes five rule-based heuristics:
1. **Cash Reconciliation Variance Alert:** Triggered when $|\text{Actual Handover Cash} - \text{Expected POS Cash}| \ge ₹500$.
2. **Abnormal Stock Adjustment Alert:** Triggered when any manual adjustment exceeds $500\text{ Liters}$.
3. **Depleted / Low Stock Alarm:** Triggered when tank volume drops below safe low-stock thresholds.
4. **Bulk Consignment Discrepancy:** Triggered when $|\text{Received Tanker Dip} - \text{Invoiced Order}| \ge 100\text{ Liters}$.
5. **Prolonged Open Shift Alarm:** Triggered when an attendant shift remains unclosed after $14\text{ hours}$.

---

## 4. Role-Based Access Control (RBAC) Permission Matrix

| Module / Operation | Administrator (`ADMIN`) | Station Manager (`MANAGER`) | Fuel Attendant (`ATTENDANT`) |
| :--- | :---: | :---: | :---: |
| View Operational Dashboard | ✅ Full | ✅ Full | ✅ Personal Shift Only |
| Execute POS Sales Dispense | ✅ | ✅ | ✅ |
| Reverse Completed Sale | ✅ | ✅ | ❌ |
| Update Fuel Selling Price | ✅ | ✅ | ❌ |
| Authorize Stock Adjustment | ✅ | ✅ | ❌ |
| Log Bulk Fuel Delivery | ✅ | ✅ | ❌ |
| Confirm Delivery Decanting | ✅ | ✅ | ❌ |
| Open & Close Shifts | ✅ | ✅ | ✅ (Own Shift) |
| Review & Approve Expenses | ✅ Full | ✅ Review | ❌ |
| Perform Stock Reconciliation | ✅ | ✅ | ❌ |
| Inspect Immutable Audit Logs| ✅ | ❌ | ❌ |

---

## 5. Frequently Asked Viva Voce Questions & Model Answers

### Q1: How does your application ensure ACID compliance during a fuel sale?
**Answer:**  
In `salesService.js`, the entire sale workflow is wrapped within a Prisma database transaction (`prisma.$transaction(async (tx) => { ... })`).  
1. The target underground tank row is queried and locked.
2. The current stock is checked against requested liters; if stock is insufficient, an exception is thrown.
3. The tank stock is decremented.
4. The pump's lifetime counter is incremented.
5. The sale record is inserted.
6. An entry in `StockMovement` is written.
7. An audit record is logged.  
If any step fails (e.g. database timeout or power drop), the entire transaction rolls back automatically, preventing negative stock or orphan sales.

### Q2: Why is a bulk delivery kept in "PENDING" status rather than immediately crediting stock?
**Answer:**  
In physical fuel station logistics, fuel tankers must first undergo water-paste dip tests and hydrometer density checks at 15°C to detect transit contamination or shortfall. In PetroFlow, `createDelivery` saves the consignment as `PENDING`. Only when an authorized manager inspects the delivery and triggers `confirmDelivery` is the destination tank's volume actually credited and logged in the inventory ledger.

### Q3: How do you handle password security and protect against brute-force attacks?
**Answer:**  
- **Salting & Hashing:** User passwords are encrypted using `bcryptjs` with an adaptive cost factor of 10 rounds.
- **Rate Limiting:** The `/api/auth/login` endpoint is guarded by `express-rate-limit`, which limits authentication attempts to 30 per IP per 15-minute window.
- **HTTP-Only Cookies:** Tokens are stored in secure HTTP-only cookies to mitigate Cross-Site Scripting (XSS) credential theft.

### Q4: Why did you separate Revenue, Cost of Goods Sold, Gross Margin, and Net Profit?
**Answer:**  
In petroleum retailing, high turnover can mislead operators if revenue is confused with profit. Fuel excise taxes and wholesale crude costs mean gross margins are typically between 3% to 7%. PetroFlow calculates:
- $\text{Gross Margin} = \text{Revenue} - \text{Cost of Goods Sold (Unit Cost} \times \text{Volume)}$
- $\text{Net Operating Profit} = \text{Gross Margin} - \text{Approved Operating Expenses (Electricity, Calibration, Wages, Rent)}$

---

## 6. How to Run & Verify the Project

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Install Dependencies & Setup Database
```powershell
# Navigate to project root
cd "C:\Users\user\.gemini\antigravity\scratch\fuel-station-management-system"

# Run automated tests
npm test

# Seed realistic demonstration data
npm run seed
```

### Step 2: Start Backend Server
```powershell
cd backend
npm run dev
# Server boots at http://localhost:5000
# Interactive Swagger Documentation at http://localhost:5000/api/docs
```

### Step 3: Start Frontend Application
```powershell
cd frontend
npm run dev
# Web application live at http://localhost:5173
```

### Default Demonstration Credentials:
- **Administrator:** `admin@petroflow.com` / `Admin@123`
- **Station Manager:** `manager@petroflow.com` / `Manager@123`
- **Fuel Attendant:** `attendant@petroflow.com` / `Attendant@123`
