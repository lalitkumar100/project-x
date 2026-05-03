import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import MainLayout from "./layouts/MainLayout";

// Pages
import LoginPage             from "./pages/LoginPage";
import LandingPage           from "./landingPage";
import NotFoundAnimated      from "./pages/not_found";
import AccessDenial          from "./AcessDenial";
import ProfilePage           from "./pages/profile/ProfilePage";

import DashboardPage         from "./pages/dashboard/DashboardPage";
import AddStock              from "./pages/add-stocks/AddStockPage";
import Stock                 from "./pages/stock/StockPage";
import UpdateStock           from "./pages/stock/update/UpdateMedicinePage";
import Billing               from "./pages/billing/BillingPage";

import Report                from "./pages/report/ReportPage";
import WholesalerReportPage  from "./pages/report/wholesaler/WholesalerReportPage";
import WholesalerDetails     from "./pages/report/wholesaler/WholesalerDetails";
import AddWholesalerPage     from "./pages/report/wholesaler/AddWholesalerPage";
import TransactionReportPage from "./pages/report/transaction/TransactionReportPage";
import RequestReportPage     from "./pages/report/request/RequestReportPage";

import TCGLoginPage          from "./pages/tcg/TCGLoginPage";
import TCGLoginRoute         from "./pages/tcg/TCGLoginRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public / standalone ──────────────────────── */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/tcg/login" element={<TCGLoginPage />} />
        <Route path="/forbidden" element={<AccessDenial />} />
        <Route path="/profile"   element={<ProfilePage />} />

        {/* ── Main app (sidebar layout) ────────────────── */}
        <Route path="/" element={<MainLayout />}>
          <Route path="dashboard"                  element={<DashboardPage />} />
          <Route path="addstock"                   element={<AddStock />} />
          <Route path="stock"                      element={<Stock />} />
          <Route path="stock/update/:Id"           element={<UpdateStock />} />
          <Route path="billing"                    element={<Billing />} />

          <Route path="report"                     element={<Report />} />
          <Route path="report/wholesaler"          element={<WholesalerReportPage />} />
          <Route path="report/wholesaler/add"      element={<AddWholesalerPage />} />
          <Route path="report/wholesaler/:id"      element={<WholesalerDetails />} />
          <Route path="report/transaction"         element={<TransactionReportPage />} />
          <Route path="report/request"             element={<RequestReportPage />} />

          <Route path="tcg/login"                  element={<TCGLoginRoute />} />
        </Route>

        {/* ── Catch-all ────────────────────────────────── */}
        <Route path="*" element={<NotFoundAnimated />} />
      </Routes>
    </BrowserRouter>
  );
}
