import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WEEKLY_SALES, ORDERS, PRODUCTS } from "../data";
import { OrderStatusBadge, Avatar, IconTrendingUp, IconShoppingBag, IconBox, IconAlertTriangle } from "../components/ui";
import type { OrderStatus } from "../types";

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

const lowStock = PRODUCTS.filter((p) => p.status === "Low Stock" || p.status === "Out of Stock").slice(0, 5);
const recent = ORDERS.slice(0, 5);

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

const SUMMARY = [
  {
    label: "Today's Sales",
    value: INR(12450),
    sub: "+8.2% from yesterday",
    subColor: "text-green-600",
    icon: IconTrendingUp,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    label: "Today's Orders",
    value: "24",
    sub: "5 need attention",
    subColor: "text-amber-600",
    icon: IconShoppingBag,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Total Products",
    value: "186",
    sub: "Across 12 categories",
    subColor: "text-gray-400",
    icon: IconBox,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    label: "Low Stock Items",
    value: "8",
    sub: "Needs restocking",
    subColor: "text-red-500",
    icon: IconAlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
];

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
  const weeklyTotal = WEEKLY_SALES.reduce((a, d) => a + d.revenue, 0);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-6">

        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Good Morning, Admin 👋</h2>
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
                <p className="text-xs text-gray-400 mt-0.5">Revenue performance this week</p>
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
                <p className="text-2xl font-bold text-gray-900 font-mono-data">{INR(weeklyTotal)}</p>
                <p className="text-xs text-green-600 font-semibold mt-0.5">↑ 12.4% from last week</p>
              </div>
              <div className="h-10 w-px bg-gray-100" />
              <div>
                <p className="text-lg font-bold text-gray-700 font-mono-data">{WEEKLY_SALES.reduce((a, d) => a + d.orders, 0)}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Total orders</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={WEEKLY_SALES} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
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
                {lowStock.length} items
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className={`text-xs mt-0.5 font-mono-data font-medium ${p.status === "Out of Stock" ? "text-red-500" : "text-amber-600"}`}>
                      {p.stock} {p.stockUnit}
                    </p>
                  </div>
                  <button className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    Restock
                  </button>
                </div>
              ))}
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
            <button className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors">
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
                {recent.map((o) => {
                  const total = o.items.reduce((a, i) => a + i.price, 0);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono-data text-xs font-semibold text-gray-700">{o.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={o.customer} />
                          <span className="text-sm font-medium text-gray-800">{o.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{o.items.length} items</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono-data text-sm font-semibold text-gray-800">{INR(total)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600">{o.pickupTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={o.status as OrderStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
