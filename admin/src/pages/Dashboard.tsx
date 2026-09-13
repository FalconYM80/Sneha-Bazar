import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../services/api";
import type { Order, Product, Category, Page } from "../types";
import { mapOrderStatus } from "../types";
import { OrderStatusBadge, Avatar, IconTrendingUp, IconShoppingBag, IconBox, IconAlertTriangle, IconShield } from "../components/ui";
import { loadSettings } from "../settings";

// ── Helpers ───────────────────────────────────────────────────────────────────

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

/** Returns true if the ISO date string falls on today (local time) */
function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Returns true if the ISO date string falls on yesterday (local time) */
function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  return (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
  );
}

/** Format a Date to a short day label: Mon, Tue, … */
function toDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/** Format a Date to a short month-day label: Sep 1, Sep 2, … */
function toMonthDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format pickup time from ISO string */
function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl font-mono-data">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold">{INR(payload[0].value)}</p>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChartItem {
  day: string;
  revenue: number;
  orders: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  stockUnit: string;
  status: "Low Stock" | "Out of Stock";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");

  // Read threshold from settings on mount — re-read when Dashboard remounts after Settings change
  const [lowStockThreshold] = useState(() => loadSettings().lowStockThreshold);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productPagination, setProductPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockTotal, setLowStockTotal] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, productsRes, categoriesRes, lowStockRes] = await Promise.all([
        api.get("/orders"),
        api.get("/products?page=1&limit=50&admin=true"),
        api.get("/categories"),
        api.get(`/products/low-stock?lowStockThreshold=${lowStockThreshold}&limit=5`),
      ]);

      const ordersResponse = ordersRes as any;
      const ordersData: Order[] = Array.isArray(ordersResponse)
        ? ordersResponse
        : ordersResponse.data ?? [];
      const productsResponse = productsRes as any;
      const productsData: Product[] = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse.data ?? [];
      const categoriesResponse = categoriesRes as any;
      const categoriesData: Category[] = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : categoriesResponse.data ?? [];
      const lowStockResponse = lowStockRes as any;
      const lowStockData: Product[] = Array.isArray(lowStockResponse)
        ? lowStockResponse
        : lowStockResponse.data ?? [];
      const lowStockCount = lowStockResponse.total ?? lowStockData.length;

      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setLowStockProducts(lowStockData);
      setLowStockTotal(lowStockCount);

      // Extract pagination metadata if available
      if (!Array.isArray(productsResponse) && productsResponse.pagination) {
        setProductPagination(productsResponse.pagination);
      } else {
        // Fallback if pagination metadata not present
        setProductPagination({
          total: productsData.length,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── KPI: Today's Sales ───────────────────────────────────────────────────────
  const todaysSales = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled" && isToday(o.createdAt))
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const yesterdaysSales = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled" && isYesterday(o.createdAt))
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const salesComparisonText = useMemo(() => {
    if (yesterdaysSales === 0) return "No comparison data yet";
    const diff = todaysSales - yesterdaysSales;
    const pct = ((diff / yesterdaysSales) * 100).toFixed(1);
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${pct}% from yesterday`;
  }, [todaysSales, yesterdaysSales]);

  const salesComparisonColor = useMemo(() => {
    if (yesterdaysSales === 0) return "text-gray-400";
    return todaysSales >= yesterdaysSales ? "text-green-600" : "text-red-500";
  }, [todaysSales, yesterdaysSales]);

  // ── KPI: Today's Orders ──────────────────────────────────────────────────────
  const todaysOrders = useMemo(() => {
    return orders.filter((o) => isToday(o.createdAt));
  }, [orders]);

  const todaysOrderCount = todaysOrders.length;

  const needsAttentionCount = useMemo(() => {
    return todaysOrders.filter(
      (o) => o.status === "pending" || o.status === "confirmed"
    ).length;
  }, [todaysOrders]);

  // ── KPI: Total Products & Categories ────────────────────────────────────────
  const totalProducts = productPagination.total || products.length;
  const totalCategories = categories.length;

  // ── KPI: Low Stock Count ─────────────────────────────────────────────────────
  const lowStockCount = lowStockTotal;

  // ── KPI SUMMARY array ────────────────────────────────────────────────────────
  const SUMMARY = useMemo(() => [
    {
      label: "Today's Sales",
      value: INR(todaysSales),
      sub: salesComparisonText,
      subColor: salesComparisonColor,
      icon: IconTrendingUp,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Today's Orders",
      value: String(todaysOrderCount),
      sub: needsAttentionCount > 0 ? `${needsAttentionCount} need attention` : "All orders on track",
      subColor: needsAttentionCount > 0 ? "text-amber-600" : "text-gray-400",
      icon: IconShoppingBag,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Products",
      value: String(totalProducts),
      sub: `Across ${totalCategories} ${totalCategories === 1 ? "category" : "categories"}`,
      subColor: "text-gray-400",
      icon: IconBox,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Low Stock Items",
      value: String(lowStockCount),
      sub: lowStockCount > 0 ? "Needs restocking" : "Stock levels OK",
      subColor: lowStockCount > 0 ? "text-red-500" : "text-gray-400",
      icon: IconAlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ], [todaysSales, salesComparisonText, salesComparisonColor, todaysOrderCount, needsAttentionCount, totalProducts, totalCategories, lowStockTotal]);

  // ── Chart data: Week ─────────────────────────────────────────────────────────
  const weekChartData = useMemo((): ChartItem[] => {
    const days: ChartItem[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = toDayLabel(d);
      const dayRevenue = orders
        .filter((o) => {
          if (o.status === "cancelled") return false;
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const dayOrders = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return (
          od.getFullYear() === d.getFullYear() &&
          od.getMonth() === d.getMonth() &&
          od.getDate() === d.getDate()
        );
      }).length;
      days.push({ day: dayLabel, revenue: dayRevenue, orders: dayOrders });
    }
    return days;
  }, [orders]);

  // ── Chart data: Month (last 30 days) ─────────────────────────────────────────
  const monthChartData = useMemo((): ChartItem[] => {
    const days: ChartItem[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = toMonthDayLabel(d);
      const dayRevenue = orders
        .filter((o) => {
          if (o.status === "cancelled") return false;
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const dayOrders = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return (
          od.getFullYear() === d.getFullYear() &&
          od.getMonth() === d.getMonth() &&
          od.getDate() === d.getDate()
        );
      }).length;
      days.push({ day: dayLabel, revenue: dayRevenue, orders: dayOrders });
    }
    return days;
  }, [orders]);

  const chartData = chartPeriod === "week" ? weekChartData : monthChartData;

  const chartTotalRevenue = useMemo(
    () => chartData.reduce((a, d) => a + d.revenue, 0),
    [chartData]
  );
  const chartTotalOrders = useMemo(
    () => chartData.reduce((a, d) => a + d.orders, 0),
    [chartData]
  );

  // ── Previous period comparison for chart ─────────────────────────────────────
  const prevPeriodRevenue = useMemo((): number | null => {
    const days = chartPeriod === "week" ? 7 : 30;
    const today = new Date();
    let total = 0;
    let hasOrders = false;
    for (let i = days * 2 - 1; i >= days; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayRevenue = orders
        .filter((o) => {
          if (o.status === "cancelled") return false;
          const od = new Date(o.createdAt);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
      if (dayRevenue > 0) hasOrders = true;
      total += dayRevenue;
    }
    return hasOrders ? total : null;
  }, [orders, chartPeriod]);

  const chartComparisonText = useMemo(() => {
    if (prevPeriodRevenue === null || prevPeriodRevenue === 0) return null;
    const diff = chartTotalRevenue - prevPeriodRevenue;
    const pct = ((diff / prevPeriodRevenue) * 100).toFixed(1);
    const sign = diff >= 0 ? "↑" : "↓";
    const label = chartPeriod === "week" ? "last week" : "last period";
    return `${sign} ${Math.abs(Number(pct))}% from ${label}`;
  }, [chartTotalRevenue, prevPeriodRevenue, chartPeriod]);

  const chartComparisonColor = useMemo(() => {
    if (prevPeriodRevenue === null || prevPeriodRevenue === 0) return "text-gray-400";
    return chartTotalRevenue >= prevPeriodRevenue ? "text-green-600" : "text-red-500";
  }, [chartTotalRevenue, prevPeriodRevenue]);

  // ── Low Stock Alert ──────────────────────────────────────────────────────────
  const lowStockItems = useMemo((): LowStockItem[] => {
    return lowStockProducts
      .map((p) => ({
        id: p._id,
        name: p.name,
        stock: p.stockQuantity,
        stockUnit: p.unit || "units",
        status: p.stockQuantity === 0 ? "Out of Stock" : "Low Stock",
      }));
  }, [lowStockProducts]);

  // ── Recent Orders ─────────────────────────────────────────────────────────────
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        customer: o.customerName,
        itemCount: o.totalItemCount,
        amount: o.totalAmount,
        pickupTime: formatTime(o.estimatedPickupTime),
        uiStatus: mapOrderStatus(o.status),
      }));
  }, [orders]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#f4f6f4" }}>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#f4f6f4" }}>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-6">

        {/* Greeting */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <IconShield size={18} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your store today.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {SUMMARY.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={17} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 font-mono-data leading-none">{s.value}</p>
              <p className={`text-xs mt-2 font-medium ${s.subColor}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart + Low Stock */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

          {/* Area Chart */}
          <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chartPeriod === "week" ? "Revenue performance this week" : "Revenue performance this month"}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {(["week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${
                      chartPeriod === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-5">
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono-data">{INR(chartTotalRevenue)}</p>
                {chartComparisonText ? (
                  <p className={`text-xs font-semibold mt-0.5 ${chartComparisonColor}`}>{chartComparisonText}</p>
                ) : (
                  <p className="text-xs text-gray-400 font-medium mt-0.5">No prior period data</p>
                )}
              </div>
              <div className="h-10 w-px bg-gray-100" />
              <div>
                <p className="text-lg font-bold text-gray-700 font-mono-data">{chartTotalOrders}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Total orders</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: "#16a34a", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl card-shadow border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Low Stock Alert</h3>
                <p className="text-xs text-gray-400 mt-0.5">Items needing restock</p>
              </div>
              <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
                {lowStockItems.length} items
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {lowStockItems.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-sm text-gray-400">All stock levels are OK 🎉</p>
                </div>
              ) : (
                lowStockItems.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className={`text-xs mt-0.5 font-mono-data font-medium ${p.status === "Out of Stock" ? "text-red-500" : "text-amber-600"}`}>
                        {p.stock} {p.stockUnit}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate("inventory")}
                      className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
              <p className="text-xs text-gray-400 mt-0.5">Today&apos;s order activity</p>
            </div>
            <button
              onClick={() => onNavigate("orders")}
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              View all orders →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/40">
                  {["Order ID", "Customer", "Items", "Amount", "Pickup", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                      No orders yet today.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono-data text-xs font-semibold text-gray-700">{o.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={o.customer} />
                          <span className="text-sm font-medium text-gray-800">{o.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{o.itemCount} items</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono-data text-sm font-semibold text-gray-800">{INR(o.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600">{o.pickupTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={o.uiStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
