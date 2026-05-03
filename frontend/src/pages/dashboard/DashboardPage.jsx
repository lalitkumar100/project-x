import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/SectionHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Warehouse, TrendingUp, Users, AlertCircle } from "lucide-react";
import axios from "axios";
import loaderGif from "@/components/logoloader.gif";
export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashBoardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDashboardData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
        
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
        }
      } finally {
        setTimeout(() => setIsLoading(false), 2000) // simulate loading delay for better UX
       
      }
    };

    fetchDashBoardData();
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1  bg-cyan-50 items-center justify-center">
  <div className="text-center bg-cyan-50 ">
    <img
      src={loaderGif}
      alt="Loading"
      className="h-36 w-36 mx-auto"
    />
     <p className="mt-3 text-sm font-semibold tracking-wide text-teal-600 animate-pulse">
      Loading dashboard, please wait…
    </p>
  </div>
</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Error Loading Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content - NO layout code, just page content!
  return (
    <>
      {/* Welcome Section */}
      <SectionHeader
        title="Dashboard Overview"
        description="Monitor key metrics and recent activities in your pharmacy."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Stock Items"
          value={dashboardData?.totalStock ?? 0}
          subtitle="+20.1% from last month"
          icon={Package}
          color="cyan"
        />

        <StatCard
          title="Unpaid Bill"
          value={dashboardData?.unpaidBills ?? 0}
          subtitle="Requires attention"
          icon={Warehouse}
          color="orange"
        />

        <StatCard
          title="Monthly Revenue"
          value={`$${dashboardData?.sales ?? 0}`}
          subtitle={`${dashboardData?.profit ?? 0} net profit`}
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="Active Staff"
          value={dashboardData?.activeStaff ?? 0}
          subtitle="Currently on duty"
          icon={Users}
          color="blue"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Updates</CardTitle>
            <CardDescription>Latest inventory changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.recentStockUpdates?.length > 0 ? (
              dashboardData.recentStockUpdates.map((data, index) => (
                <div
                  key={data.id || index}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{data.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Updated on{" "}
                      {new Date(data.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-sm font-semibold ${
                      data.stock_quantity > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {data.stock_quantity > 0
                      ? `+${data.stock_quantity}`
                      : data.stock_quantity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent stock updates
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickActionLink
              to="/addstock"
              title="Add New Stock Item"
              description="Quickly add inventory"
              color="cyan"
            />
            
            <QuickActionLink
              to="/report"
              title="Generate Report"
              description="Create sales or inventory report"
              color="teal"
            />
            
            <QuickActionLink
              to="/staff"
              title="Manage Staff"
              description="View and edit staff information"
              color="blue"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Reusable StatCard Component
function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    cyan: "text-cyan-600",
    orange: "text-orange-600",
    green: "text-green-600",
    blue: "text-blue-600",
  };

  return (
    <Card className="transition-transform duration-300 ease-in-out hover:scale-105">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// Reusable QuickActionLink Component
function QuickActionLink({ to, title, description, color }) {
  const colorClasses = {
    cyan: "border-cyan-200 hover:bg-cyan-50 text-cyan-700",
    teal: "border-teal-200 hover:bg-teal-50 text-teal-700",
    blue: "border-blue-200 hover:bg-blue-50 text-blue-700",
  };

  return (
    <Link
      to={to}
      className={`block w-full text-left p-3 rounded-lg border transition-colors ${colorClasses[color]}`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </Link>
  );
}