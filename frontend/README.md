
<img width="177" height="177" alt="Screenshot 2026-01-04 200018" src="https://github.com/user-attachments/assets/78b6d5c2-c088-4395-82bf-7d275e067118" />

#  MediCude  — AI Pharmacy Management System
LiveDemo -:https://medi-cude-frotend.vercel.app/

**MediCude** is a modern, responsive web application designed to streamline pharmacy operations. It provides a clean dashboard for managing inventory, tracking finances (FinTrack), and utilizing AI for automated invoice parsing.

> **Backend Repository:** [Find the server-side code here ↗](https://github.com/lalitkumar100/mediCude-backend)

---

## 🚀 Key Features (UI/UX)

* **📊 Dynamic Dashboard** – Real-time visualization of stock levels, low-stock alerts, and expiring medicines.
* **🤖 AI Invoice Integration** – A seamless upload interface that handles PDF/Image processing via the AI backend.
* **💸 FinTrack Module** – Comprehensive financial dashboard for monitoring revenue, profits, and expense reports.
* **🔐 Secure Authentication** – Role-based login (Admin/Staff) with protected routing and JWT session management.
* **📱 Fully Responsive** – Optimized for desktops, tablets, and smartphones using Tailwind CSS.
* **⚡ Modern Stack** – Built with Vite for lightning-fast development and optimized production builds.

---

## 🛠️ Tech Stack

* **Framework:** React (Vite)
* **Styling:** Tailwind CSS + shadcn/ui components
* **State Management:** React Context API / Redux
* **Routing:** React Router DOM
* **API Client:** Axios
* **Icons:** Lucide React / FontAwesome

---

## 📂 Project Structure

```text
medicude-frontend/
├── public/              # Static assets (logos, icons)
├── src/
│   ├── components/      # Reusable UI (Navbar, Sidebar, Charts)
│   ├── pages/           # Main views (Dashboard, Inventory, Finance)
│   ├── hooks/           # Custom React hooks for API calls
│   ├── context/         # Auth and Global State management
│   ├── services/        # API service configurations (Axios)
│   └── App.jsx          # Root component & Routing
├── .env                 # API Base URL configuration
└── package.json

```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/lalitkumar100/mediCude
cd medicude-frontend

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Environment Configuration

Create a `.env` file in the root directory and point it to your backend:

```env
VITE_API_BASE_URL=http://localhost:5000/api

```

### 4. Run Development Server

```bash
npm run dev

```

The app will be live at `http://localhost:5173`.

---

## 🔁 Connection with Backend

This frontend communicates with the **[MediCude Backend](https://github.com/lalitkumar100/mediCude-backend)** to perform:

1. **POST /auth/login** - User authentication.
2. **GET /inventory** - Fetching medicine stock.
3. **POST /upload-invoice** - Sending images for AI processing.
4. **GET /finance/summary** - Fetching financial data.

---

## 🧪 Future UI Improvements

* [ ] Dark Mode support.
* [ ] Drag-and-drop pharmacy shelf management.
* [ ] Print-ready receipt generation for customers.
* [ ] PWA support for offline inventory checking.

---

## 👨‍💻 Author

**Lalitkumar Choudhary**
*Computer Science Engineering Student | Full Stack Developer*
