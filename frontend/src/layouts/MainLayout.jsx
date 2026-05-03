import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { MainPanel } from "@/components/panels/main-panel";
import { Shell } from "lucide-react";
import { TCGLoginProvider } from "@/context/TCGLoginContext";
import TCGLoginDialog from "@/components/TCGLoginDialog";
// Breadcrumb configuration for each route
const BREADCRUMB_CONFIG = {
  "/dashboard": {
    items: [{ label: "PharmaDesk", href: "/dashboard" }],
    currentPage: "Dashboard"
  },
  "/addstock": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Inventory",  href: "/stock" }
    ],
    currentPage: "Add Stock"
  },
  "/stock": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Inventory",  href: "/stock" }
    ],
    currentPage: "Stock Management"
  },
  "/billing": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Billing",    href: "/billing" }
    ],
    currentPage: "New Sale"
  },
  "/report": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "Reports"
  },
  "/report/wholesaler": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "Wholesaler Report"
  },
  "/report/wholesaler/add": {
    items: [
      { label: "PharmaDesk",  href: "/dashboard" },
      { label: "Reports",     href: "/report" },
      { label: "Wholesalers", href: "/report/wholesaler" }
    ],
    currentPage: "Add Wholesaler"
  },
  "/report/transaction": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "TCG Transactions"
  },
  "/report/request": {
    items: [
      { label: "PharmaDesk", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "TCG Requests"
  },
  "/profile": {
    items: [{ label: "PharmaDesk", href: "/dashboard" }],
    currentPage: "My Profile"
  }
};

export default function MainLayout() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication check
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Get breadcrumb config for current route
  const getBreadcrumbConfig = () => {
    // Check for dynamic routes (e.g., /stock/update/:Id)
    if (location.pathname.startsWith("/stock/update/")) {
      return {
        items: [
          { label: "PharmaDesk", href: "/dashboard" },
          { label: "Inventory", href: "/stock" },
           { label: "update", href: "/stock/update" }
        ],
        currentPage: "Update Medicine"
      };
    }

    // Return config for static routes
    return BREADCRUMB_CONFIG[location.pathname] || {
      items: [{ label: "PharmaDesk", href: "/dashboard" }],
      currentPage: "Page"
    };
  };

  const breadcrumbConfig = getBreadcrumbConfig();

  return (
    <TCGLoginProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-white-100 transition-colors duration-500">
          <Toaster position="top-right" richColors />

          {/* Header - Renders once, stays mounted */}
          <header className="flex h-16 shrink-0 items-center gap-2 bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b px-4">
            <PageBreadcrumb
              items={breadcrumbConfig.items}
              currentPage={breadcrumbConfig.currentPage}
            />
          </header>

          {/* Main Content - Child routes render here via <Outlet /> */}
          <div className="flex flex-1 flex-col gap-6 p-2 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>

          {/* Floating Shell Button */}
          <button
            className="fixed bottom-8 right-8 p-2 bg-black text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95 z-50 flex items-center justify-center"
            onClick={() => setIsPanelOpen(true)}
            aria-label="Open main panel"
          >
            <Shell className="h-9 w-9 rounded-full text-blue-600" />
          </button>

          {/* Main Panel */}
          <MainPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        </SidebarInset>

        {/* TCG Login Dialog — mounted once, controlled by TCGLoginContext */}
        <TCGLoginDialog />
      </SidebarProvider>
    </TCGLoginProvider>
  );
}