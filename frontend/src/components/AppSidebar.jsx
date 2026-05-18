import {
  DollarSign,
  Package,
  Warehouse,
  FileText,
  Home,
  LogOut,
  LogIn,
  ListOrdered,
  BrainCircuit,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "About", url: "/", icon: Home },
  { title: "Add Stock", url: "/addstock",   icon: Package },
  { title: "Stock",     url: "/stock",      icon: Warehouse },
  { title: "Report",   url: "/report",     icon: FileText },
  { title: "Prediction", url: "/prediction/datasets", icon: BrainCircuit },
  { title: "order",   url: "/requests/order",icon: ListOrdered },
  { title: "Setup",   url: "/setup", icon: Settings },
];

export function AppSidebar(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUrl, setCurrentURL] = useState("Dashboard");

  useEffect(() => {
    // first segment of the flat path, e.g. "/dashboard" → "dashboard"
    setCurrentURL(location.pathname.split("/")[1] ?? "");
  }, [location.pathname]);

  const handleLogout = () => {
    const tcgToken = localStorage.getItem("tcg_token");
    localStorage.removeItem("token");
    localStorage.removeItem("tcg_token");
    localStorage.removeItem("business_name");
    if (!tcgToken) {
      navigate("/tcg/login", { replace: true });
    } else {
      navigate("/tcg/login", { replace: true });
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center  bg-transparent">
           <img
               src="/assets/log1.png"
               alt="Open panel"
               className="h-8 w-8 "
             />
          </div>

          <span className="bg-green-600 bg-clip-text text-lg font-bold text-transparent">
            TradeCore
          </span>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={
                        location.pathname === item.url ||
                        location.pathname.startsWith(item.url + "/")
                          ? "flex items-center gap-2 bg-gray-300"
                          : "flex items-center gap-2"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="flex flex-col items-center gap-2 w-full">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="w-full">
            <div className="flex flex-col gap-2 w-full px-2">
              {/* TCG Server Login */}
              <SidebarMenuButton
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white w-full justify-center cursor-pointer"
              >
                <Link to="/tcg/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>TCG Login</span>
                </Link>
              </SidebarMenuButton>

              {/* Wrapper */}
              <div className="flex gap-2 w-full">
                {/* Logout (small) */}
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="border-2 flex-none w-10 justify-center cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </SidebarMenuButton>

                {/* Billing (large) */}
                <SidebarMenuButton
                  asChild
                  className="bg-purple-600 text-white hover:bg-purple-700 flex-1 justify-center"
                >
                  <Link to="/billing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </SidebarMenuButton>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-4 py-2 text-xs text-muted-foreground text-center">
          @2026 TradeCore
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}