<p align="center">
  <img src="frontend/public/tradecore.svg" width="160" alt="TradeCore Logo" />
</p>

<h1 align="center">TradeCore</h1>

<p align="center">
  <strong>An AI-Powered, Standalone B2B Pharmacy Management & Immutable Transaction Ledger System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Desktop%20%7C%20Web-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge" alt="Database" />
  <img src="https://img.shields.io/badge/Framework-React%20%7C%20Electron-teal?style=for-the-badge" alt="Framework" />
  <img src="https://img.shields.io/badge/Security-AES%20%7C%20JWT-red?style=for-the-badge" alt="Security" />
</p>

---

## 📌 Executive Summary

**TradeCore** (formerly MediCude) is a state-of-the-art enterprise-grade desktop appliance and web platform designed to modernize pharmacy operations, automate inventory demand forecasting through Machine Learning, and secure business-to-business transactions. 

By unifying a custom **Vite + React** frontend, a high-throughput **dual-microservice Express backend**, and an **embedded, portable PostgreSQL database** into a secure, offline-capable **Electron desktop host**, TradeCore provides an all-in-one standalone B2B network hub that works entirely out-of-the-box.

---

## ⚡ Core Features

### 1. 🖥️ Standalone Desktop Wrapper (Electron Host)
* **Zero-Dependency Portable Database**: Launches an isolated, portable instance of PostgreSQL from local directories without requiring any system-wide installation.
* **Service Orchestration**: Auto-spawns the central authentication server and the transactional backend synchronously as lightweight child processes when the app starts.
* **Graceful Lifecycle Management**: Cleanly intercepts application quit events to flush active transactions, stop child servers, and perform a graceful fast shutdown of the database.

### 2. 🧠 AI-Driven Demand Forecasting
* **Random Forest ML Engine**: Dynamically processes historical sales data from CSV datasets to calculate monthly demand patterns.
* **Intelligent Stock Recommendations**: Automatically factors in reorder levels and stock status to recommend precise purchase quantities.
* **Interactive Visualizations**: Renders stunning interactive bar and line charts powered by **Recharts** to visualize forecast trends.

### 3. ⛓️ Blockchain-Style B2B Billing & Ledger
* **End-to-End Cryptographic Signatures**: Users are provisioned public-private keypairs derived from secure PBKDF2 seed functions to verify transaction authenticity.
* **Immutable Blockchain Auditing**: Every accepted wholesale transaction automatically constructs an immutable audit log linking back to the previous block hash, protecting critical B2B billing records from tampering.
* **Seamless Invoicing Bridging**: Bridges purchase requests directly into active sale receipts with real-time local stock validation.

### 4. 🔗 Connected TCG Integration
* **Dynamic Connection Manager**: Employs context-driven providers to seamlessly negotiate secure JWT connections with external TradeChainGuardian services.
* **Live Synchronization**: Securely updates incoming and outgoing requests and invoice verification states in real-time.

---

## 🗂️ Project Workspace Layout

```
project-x/
│
├── main.js                 # Electron main host process (orchestrates PG and Node backends)
├── package.json            # Root configuration for electron-builder standalone packaging
│
├── frontend/               # React + TailwindCSS User Interface (Vite)
│   ├── src/
│   │   ├── components/     # AppLayout, Sidebar, PageBreadcrumbs, and UI elements
│   │   ├── pages/          # Stocks, Predictions, wholesale Billing, and Profile
│   │   └── context/        # TCG Login and State providers
│
├── back-end/               # Local Retail Backend (Express + pg client)
│   ├── controllers/        # Items, Sales, and TCG transaction handlers
│   ├── services/           # Predictive ML algorithms and CSV ingest services
    └── routes/             # API routes
```

---

## 🛠️ Technology Stack

* **Frontend UI:** Vite, React, TailwindCSS, Lucide Icons, Recharts, Shadcn components
* **Desktop Wrapper:** Electron, Electron-Builder (configured for NSIS Windows packaging)
* **API Microservices:** Node.js, Express.js
* **Database Engine:** PostgreSQL (portable instance bundled in runtime workspace)
* **Cryptographic Algorithms:** Node.js Crypto (AES-256-GCM, PBKDF2, Timing-safe hex verification)

---

## 🚀 Setting Up Locally

### Prerequisites
- Node.js (v18 or higher)
- git

### Development Mode (Distributed Services)
To run the components individually during active development:

1. **Start the Database**:
   Ensure you have a PostgreSQL server running locally, and configured in your respective `.env` files.



3. **Run Back-End**:
   ```bash
   cd ../back-end
   npm install
   npm run dev
   ```

4. **Run Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📦 Building the Standalone Desktop Application

To compile the entire system into a standalone one-click Windows installer:

1. **Setup Portable PostgreSQL Binaries**:
   - Create a `pgsql` directory in the root of the project.
   - Extract portable Windows PostgreSQL binaries so the files reside under `project-x/pgsql/bin/`.
   - Run `initdb` to initialize the database:
     ```powershell
     .\pgsql\bin\initdb.exe -D .\pgsql\data -U postgres --auth=trust
     ```

2. **Build Frontend Static Assets**:
   ```powershell
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Package the Executable**:
   ```powershell
   # Install root dependencies
   npm install
   
   # Build the Windows setup installer
   npm run build
   ```
   The installer executable `TradeCore Setup 1.0.0.exe` will be generated inside the [dist_installer/](file:///c:/Users/hp/OneDrive/Desktop/project-x/dist_installer) directory.

---

## 🔐 Security & Safety Philosophy

- **Decentralized Data Ownership**: All records, logs, and databases are stored in isolated workspace folders. No administrative system-level access is required.
- **Client-Side Key Generation**: Private seed phrases are compiled solely locally at runtime. Sensitive security elements are never exposed in clear-text.
