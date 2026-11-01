# PetroFlow — Enterprise Fuel Station Management System

A Full-Stack Web Application for Intelligent Fuel Inventory, Pump Operations, Sales Monitoring, and Business Analytics.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmdashfaqueahamed2024-hue%2Ffuel-station-management-system&project-name=petroflow-fuel-system)

Designed and developed as a university-level Bachelor of Technology (B.Tech) Capstone Project in Computer Science & Engineering.

---

## 🌐 Live Cloud Deployment (Vercel)

- **Official Live Demo:** [https://brisk-rowan-v8hc6ph.tmp.now](https://brisk-rowan-v8hc6ph.tmp.now)
- **Claim or Bind Permanent `.vercel.app` Domain:** [Claim Deployment on Vercel](https://vercel.com/claim-deployment?code=1021af16-88ea-49f6-a15f-28140fd2cabb)
- **1-Click GitHub to Vercel Import:** Click the **Deploy with Vercel** button above or import repository `mdashfaqueahamed2024-hue/fuel-station-management-system` at [vercel.com/new](https://vercel.com/new).

---

## 🛠️ Architecture & Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, React Hook Form, Zod
- **Backend:** Node.js, Express.js (ES Modules), RESTful APIs, Prisma ORM
- **Database:** PostgreSQL (with SQLite zero-config development switch)
- **Security:** Secure Session & JWT Auth in HTTP-Only Cookies, bcryptjs password hashing, Role-Based Access Control (`ADMIN`, `MANAGER`, `ATTENDANT`), Rate Limiting, Helmet, Parametric queries, Immutable Audit Logs
- **Testing:** Vitest for unit tests, Supertest for integration tests
- **Documentation:** Interactive OpenAPI / Swagger UI at `/api/docs`

---

## 🚀 Quick Start Guide

### 1. Verification & Testing
```bash
# Run unit & mathematical model tests
npm test
```

### 2. Populate Realistic Database Seed
```bash
npm run seed
```

### 3. Launch the Backend API Server
```bash
cd backend
npm run dev
# REST API running on http://localhost:5000
# Swagger API Documentation at http://localhost:5000/api/docs
```

### 4. Launch the Frontend Application
```bash
cd frontend
npm run dev
# Dashboard accessible at http://localhost:5173
```

---

## 🔐 Demonstration Credentials

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@petroflow.com` | `Admin@123` | Full access across all stations, audits, and configurations |
| **Station Manager** | `manager@petroflow.com` | `Manager@123` | Inventory, deliveries, pump control, shifts, and financial reports |
| **Fuel Attendant** | `attendant@petroflow.com` | `Attendant@123` | Point-of-sale dispenser, shift logging, meter counters |

---

## 📚 Academic Documentation & Diagrams

- **Entity-Relationship Diagram & SQL Queries:** See [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)
- **Comprehensive Project Report & Viva Voce Defense Guide:** See [`docs/ACADEMIC_REPORT_VIVA_GUIDE.md`](./docs/ACADEMIC_REPORT_VIVA_GUIDE.md)
