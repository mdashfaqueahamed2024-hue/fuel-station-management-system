# Deploying PetroFlow Enterprise to Vercel & Cloud Platforms

**Project:** Fuel Station Management System — PetroFlow Enterprise  
**B.Tech Capstone Project**

---

## 1. Quick Answer: Can this project be deployed on Vercel?

**Yes, absolutely!** 

However, because this is an enterprise-grade full-stack application comprising:
1. **Frontend:** React + Vite Single Page Application
2. **Backend:** Express.js REST API Engine with Prisma ORM
3. **Database:** PostgreSQL Relational Database

There is one critical architectural rule you must understand for cloud deployment:
> ⚠️ **The Database Rule:** On your local machine, the system used SQLite (`dev.db`) for zero-configuration convenience. **Vercel is a serverless platform with a temporary/read-only filesystem.** A local `.db` file will reset every time a function goes to sleep. Therefore, for any cloud deployment, you must connect Prisma to a free cloud-hosted PostgreSQL database (such as **Neon**, **Supabase**, or **Render Postgres**).

---

## 2. Recommended Deployment Architecture (Gold Standard)

The most robust, industry-standard approach for university projects is:

```mermaid
flowchart LR
    A[End User / Viva Examiner] -->|Accesses UI via HTTPS| B[Vercel Global Edge CDN]
    B -->|Hosts React 18 SPA| C[Frontend Build]
    C -->|REST API Calls with JWT| D[Render / Railway Node.js Service]
    D -->|Prisma Parameterized Queries| E[(Neon / Supabase PostgreSQL)]
```

- **Frontend on Vercel:** Free, instantaneous deployment from GitHub, automatic global CDN, free SSL certificate.
- **Backend on Render or Railway:** Free persistent Node.js runtime that handles Express, CORS, rate limiting, and database connection pooling.
- **Database on Neon or Supabase:** 100% free serverless PostgreSQL database created in 30 seconds.

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Create a Free Cloud PostgreSQL Database (2 minutes)
You can use **Neon** (recommended for simplicity) or **Supabase**:

1. Go to [https://neon.tech](https://neon.tech) and sign up for free with GitHub.
2. Click **Create Project**, name it `petroflow-db`, and select your nearest region.
3. Neon will immediately display your PostgreSQL Connection String, looking like:
   ```
   postgresql://alex:AbC123xYz@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this connection string.

---

### Step 2: Push Your Project to GitHub (2 minutes)
Initialize Git in your project directory and push to your GitHub repository:

```powershell
cd "C:\Users\user\.gemini\antigravity\scratch\fuel-station-management-system"

git init
git add .
git commit -m "Initial commit: PetroFlow Enterprise System"

# Create a repository on github.com, then link and push:
git remote add origin https://github.com/YOUR_USERNAME/fuel-station-management-system.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy the Backend on Render (3 minutes)
1. Go to [https://render.com](https://render.com) and log in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository `fuel-station-management-system`.
4. Fill in the following settings:
   - **Name:** `petroflow-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx prisma db push && node prisma/seed.js
     ```
   - **Start Command:**
     ```bash
     node src/server.js
     ```
5. Scroll down to **Environment Variables** and add:
   - `DATABASE_URL`: *(Paste the Neon PostgreSQL connection string from Step 1)*
   - `JWT_SECRET`: `super_secret_petroflow_jwt_key_2026`
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
6. Click **Deploy Web Service**.
7. Render will build the project, run the database migrations and seed script, and provide your public API URL (e.g., `https://petroflow-api.onrender.com`).

*(Verify: Open `https://petroflow-api.onrender.com/api/health` in your browser. You should see `"status": "ONLINE"`).*

---

### Step 4: Deploy the Frontend on Vercel (1-Click or Manual)

#### Option A: Direct 1-Click Import (Recommended)
1. Log in to [vercel.com](https://vercel.com) using your GitHub account (`mdashfaqueahamed2024-hue`).
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Find your repository **`fuel-station-management-system`** in the list and click **Import**.
4. The project is already pre-configured with root [`vercel.json`](../vercel.json) and automatic build detection. Simply click **Deploy**!
5. In approximately 30 seconds, Vercel will give you a live production URL:
   `https://fuel-station-management-system.vercel.app` (or your custom project name).

#### Option B: Manual Configuration
1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `fuel-station-management-system` repository.
4. In the Project Configuration window:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Choose `frontend` (or keep `./` since root `vercel.json` is configured).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**.

---

## 4. Single-Project Vercel Deployment (Monorepo Serverless Alternative)

If your college professor insists that **both** frontend and backend must live under a single `vercel.app` domain:

1. **SPA Routing Config:** The file [`frontend/vercel.json`](../frontend/vercel.json) has already been created to handle client-side routing so refreshing `/sales` or `/dashboard` does not cause 404s.
2. Set up **Vercel Serverless Function** in `/api`:
   - Point your root `api/index.js` to `backend/src/app.js`.
3. In Vercel Project Settings:
   - Set **Environment Variable** `DATABASE_URL` pointing to your Neon / Supabase cloud PostgreSQL.
   - Run `npx prisma db push && node backend/prisma/seed.js` locally against that PostgreSQL URL once to populate the initial tables.

---

## 5. Live Production Credentials for Viva Examiners

Once deployed, your live web application will be accessible to your examiners on any mobile, laptop, or projector with the seeded accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@petroflow.com` | `Admin@123` | Full access across all stations, audits, and configurations |
| **Station Manager** | `manager@petroflow.com` | `Manager@123` | Inventory, deliveries, pump control, shifts, and financial reports |
| **Fuel Attendant** | `attendant@petroflow.com` | `Attendant@123` | Point-of-sale dispenser, shift logging, mechanical totalizers |

---

## 6. Examiner Viva Defense Tip: Why decoupled deployment is superior

When examiners ask:  
> *"Why did you host the frontend on Vercel and the backend on Render / dedicated container rather than putting everything on one PHP server?"*

**Your Answer:**  
> *"In modern enterprise cloud architecture (Jamstack & microservices), decoupling the frontend from the backend provides several major benefits:  
> 1. **Global CDN Distribution:** Static assets and React components are distributed across Vercel's global edge network, resulting in sub-50ms Time-to-First-Byte (TTFB).  
> 2. **Independent Scalability:** Point-of-sale pump transactions and database connection pools can be scaled horizontally on the backend without re-deploying the frontend UI.  
> 3. **Fault Isolation:** A temporary database maintenance window on the backend does not take down the frontend user interface; instead, graceful offline/error states are presented."*
