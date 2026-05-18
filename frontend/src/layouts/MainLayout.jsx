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
    items: [{ label: "TradeCore", href: "/dashboard" }],
    currentPage: "Dashboard"
  },
  "/addstock": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Inventory",  href: "/stock" }
    ],
    currentPage: "Add Stock"
  },
  "/stock": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Inventory",  href: "/stock" }
    ],
    currentPage: "Stock Management"
  },
  "/billing": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Billing",    href: "/billing" }
    ],
    currentPage: "New Sale"
  },
  "/report": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "Reports"
  },
  "/report/wholesaler": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "Wholesaler Report"
  },
  "/report/wholesaler/add": {
    items: [
      { label: "TradeCore",  href: "/dashboard" },
      { label: "Reports",     href: "/report" },
      { label: "Wholesalers", href: "/report/wholesaler" }
    ],
    currentPage: "Add Wholesaler"
  },
  "/report/transaction": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
      { label: "Reports",    href: "/report" }
    ],
    currentPage: "TCG Transactions"
  },
  "/report/request": {
    items: [
      { label: "TradeCore", href: "/dashboard" },
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
    // No auth token check redirect here to prevent routing loops
  }, [navigate]);

  // Get breadcrumb config for current route
  const getBreadcrumbConfig = () => {
    // Check for dynamic routes (e.g., /stock/update/:Id)
    if (location.pathname.startsWith("/stock/update/")) {
      return {
        items: [
          { label: "TradeCore", href: "/dashboard" },
          { label: "Inventory", href: "/stock" },
           { label: "update", href: "/stock/update" }
        ],
        currentPage: "Update Medicine"
      };
    }

    // Return config for static routes
    return BREADCRUMB_CONFIG[location.pathname] || {
      items: [{ label: "TradeCore", href: "/dashboard" }],
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
        

          {/* Main Panel */}
          <MainPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        </SidebarInset>

        {/* TCG Login Dialog — mounted once, controlled by TCGLoginContext */}
        <TCGLoginDialog />
      </SidebarProvider>
    </TCGLoginProvider>
  );
}