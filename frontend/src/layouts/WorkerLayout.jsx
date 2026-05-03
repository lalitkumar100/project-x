import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Shell } from "lucide-react";
import { MainPanel } from "@/components/panels/main-panel";
import { TCGLoginProvider } from "@/context/TCGLoginContext";
import TCGLoginDialog from "@/components/TCGLoginDialog";

// Breadcrumb configuration for worker routes
const BREADCRUMB_CONFIG = {
  "/worker": {
    items: [{ label: "Worker Portal", href: "/worker" }],
    currentPage: "Dashboard"
  },
  "/worker/sales": {
    items: [
      { label: "Worker Portal", href: "/worker" },
      { label: "Reports", href: "/worker" }
    ],
    currentPage: "Sales Report"
  },
  "/worker/todo": {
    items: [
      { label: "Worker Portal", href: "/worker" },
      { label: "Todo", href: "/worker/todo" }
    ],
    currentPage: "Tasks"
  },
  "/worker/stock": {
    items: [
      { label: "Worker Portal", href: "/worker" },
      { label: "Stock", href: "/worker/stock" }
    ],
    currentPage: "Stock View"
  },
  "/worker/billing": {
    items: [
      { label: "Worker Portal", href: "/worker" },
      { label: "Billing", href: "/worker/billing" }
    ],
    currentPage: "New Sale"
  }
};

export default function WorkerLayout() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication check
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole"); // Check if worker
    
    if (!token) {
      navigate("/login", { replace: true });
    }
    
    // Optional: Check if user has worker role
    // if (userRole !== "worker") {
    //   navigate("/dashboard", { replace: true });
    // }
  }, [navigate]);

  // Get breadcrumb config for current route
  const breadcrumbConfig = BREADCRUMB_CONFIG[location.pathname] || {
    items: [{ label: "Worker Portal", href: "/worker" }],
    currentPage: "Page"
  };

  return (
    <TCGLoginProvider>
      <SidebarProvider>
        {/* Use WorkerSidebar component if you have different sidebar for workers */}

        <SidebarInset className="bg-white-100 transition-colors duration-500">
          <Toaster position="top-right" richColors />

          {/* Header - Renders once, stays mounted */}
          <header className="flex h-16 shrink-0 items-center gap-2 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b px-4">
            <PageBreadcrumb
              items={breadcrumbConfig.items}
              currentPage={breadcrumbConfig.currentPage}
            />
          </header>

          {/* Main Content - Child routes render here via <Outlet /> */}
          <div className="flex flex-1 flex-col gap-6 p-0 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>

          {/* Floating Shell Button */}
          <button
            className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95 z-50 flex items-center justify-center"
            onClick={() => setIsPanelOpen(true)}
            aria-label="Open main panel"
          >
            <Shell className="h-6 w-6" />
          </button>

          {/* Main Panel */}
          <MainPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        </SidebarInset>

        {/* TCG Login Dialog — available to all worker pages */}
        <TCGLoginDialog />
      </SidebarProvider>
    </TCGLoginProvider>
  );
}