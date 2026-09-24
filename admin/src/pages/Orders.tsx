import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import type { UIOrder } from "../types";
import { mapOrder, mapUIOrderStatus } from "../types";
import {
  OrderStatusBadge, ModalBackdrop, ModalCard, Avatar, Btn,
  SearchInput, IconX, IconCheck, IconChevronRight, IconCalendar,
} from "../components/ui";

type UIOrderStatus = UIOrder["status"];

const INR = (n: number) => "₹" + (n || 0).toLocaleString("en-IN");

const STATUS_FLOW: UIOrderStatus[] = ["Pending", "Preparing", "Ready for Pickup", "Picked Up"];

const NEXT_LABEL: Partial<Record<UIOrderStatus, string>> = {
  "Pending":   "Start Preparing",
  "Preparing": "Mark Ready for Pickup",
  "Ready for Pickup": "Mark as Picked Up",
};

const STATUS_BTN_STYLE: Partial<Record<UIOrderStatus, string>> = {
  "Pending":   "bg-blue-600 hover:bg-blue-700 text-white",
  "Preparing": "bg-green-600 hover:bg-green-700 text-white",
  "Ready for Pickup": "bg-gray-800 hover:bg-gray-900 text-white",
};

const getTodayDateStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};

const getDaysAgoDateStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onAdvance,
}: {
  order: UIOrder;
  onClose: () => void;
  onAdvance: (id: string) => Promise<void>;
}) {
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");
  
  const total = order.items.reduce((a, i) => a + (i.price * i.qty), 0);
  const totalQty = order.items.reduce((a, i) => a + i.qty, 0);
  const idx = STATUS_FLOW.indexOf(order.status);
  const nextLabel = NEXT_LABEL[order.status];
  const btnStyle = STATUS_BTN_STYLE[order.status];

  const handleAdvance = async () => {
    setAdvancing(true);
    setError("");
    try {
      await onAdvance(order.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[540px] max-w-[calc(100vw-32px)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
              <span className="font-mono-data text-base font-bold text-gray-900">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500">
              Date <strong className="text-gray-700">{order.orderDate}</strong>
              {" · "}Time <strong className="text-gray-700">{order.orderTime}</strong>
              {" · "}Pickup <strong className="text-gray-700">{order.pickupTime}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors mt-0.5">
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

            {/* Customer Details */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer Details</p>
              <div className="flex items-center gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <Avatar name={order.customer} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{order.customer}</p>
                  <p className="text-xs text-gray-500 font-mono-data mt-0.5 truncate">Phone: {order.phone}</p>
                </div>
              </div>
            </div>

            {/* Ordered Items */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Ordered Items ({order.items.length})</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono-data text-xs font-bold text-green-700">{item.qty}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono-data text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">{INR(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3.5 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-medium">Total Products</span>
                <span className="font-semibold text-gray-700">{order.items.length} items · {totalQty} units</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                <span className="font-mono-data text-base font-bold text-gray-900">{INR(total)}</span>
              </div>
            </div>

            {/* Progress tracker */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Progress</p>
              <div className="flex items-start">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= idx;
                  const active = i === idx;
                  return (
                    <div key={s} className="flex items-start flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            done ? "bg-green-600 shadow-sm" : "bg-gray-100"
                          } ${active ? "ring-2 ring-green-300 ring-offset-1" : ""}`}
                        >
                          {done ? (
                            <IconCheck size={12} />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span
                          className="text-center leading-tight truncate w-full"
                          style={{
                            fontSize: 9,
                            fontWeight: active ? 700 : 500,
                            color: done ? "#16a34a" : "#9ca3af",
                          }}
                        >
                          {s}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-3.5 sm:mt-4 mx-0.5 ${i < idx ? "bg-green-400" : "bg-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {error && (
          <div className="px-4 sm:px-6 py-2 border-t border-gray-100">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={advancing}>Close</Btn>
          {nextLabel && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${btnStyle}`}
            >
              {advancing ? "Updating..." : nextLabel}
              {!advancing && <IconChevronRight size={14} />}
            </button>
          )}
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: Array<"All" | UIOrderStatus> = ["All", "Pending", "Preparing", "Ready for Pickup", "Picked Up"];

export default function Orders() {
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [tab, setTab] = useState<"All" | UIOrderStatus>("All");
  const [search, setSearch] = useState("");
  const [quickDate, setQuickDate] = useState<"all" | "today" | "7days" | "30days">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const [selected, setSelected] = useState<UIOrder | null>(null);

  // Fetch Server-Side Search & Filtered Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (tab !== "All") {
        const backendStatus = mapUIOrderStatus(tab);
        params.append("status", backendStatus);
      }

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (fromDate) {
        params.append("fromDate", fromDate);
      }
      if (toDate) {
        params.append("toDate", toDate);
      }

      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await api.get(`/orders?${params.toString()}`);

      const ordersData = Array.isArray(response) ? response : response.data || [];
      const mappedOrders = ordersData.map(mapOrder);
      setOrders(mappedOrders);

      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        setPagination({
          page: 1,
          limit: mappedOrders.length,
          total: mappedOrders.length,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [tab, search, fromDate, toDate, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleQuickDateSelect = (type: "all" | "today" | "7days" | "30days") => {
    setQuickDate(type);
    setPage(1);
    if (type === "all") {
      setFromDate("");
      setToDate("");
    } else if (type === "today") {
      const today = getTodayDateStr();
      setFromDate(today);
      setToDate(today);
    } else if (type === "7days") {
      setFromDate(getDaysAgoDateStr(7));
      setToDate(getTodayDateStr());
    } else if (type === "30days") {
      setFromDate(getDaysAgoDateStr(30));
      setToDate(getTodayDateStr());
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setTab("All");
    setQuickDate("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const advance = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    if (!nextStatus) return;

    const backendStatus = mapUIOrderStatus(nextStatus as UIOrderStatus);

    try {
      await api.put(`/orders/${id}/status`, { status: backendStatus });
      await fetchOrders();
    } catch (err) {
      throw err;
    }
  };

  const selectedLive = selected ? orders.find((o) => o.id === selected.id) ?? selected : null;
  const isFiltered = search.trim() !== "" || fromDate !== "" || toDate !== "" || tab !== "All";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {selectedLive && (
        <OrderDetailModal
          order={selectedLive}
          onClose={() => setSelected(null)}
          onAdvance={advance}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-4 sm:space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Historical order search & customer pickup management
          </p>
        </div>

        {/* Status Tabs Bar */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-2 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex gap-1.5 overflow-x-auto flex-nowrap">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === t ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 font-medium px-2 hidden md:block whitespace-nowrap">
            Total Results: <span className="font-bold text-gray-900">{pagination.total}</span>
          </div>
        </div>

        {/* Historical Search & Date Filtering Toolbar */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-4 space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Server-Side Multi-Field Search Input */}
            <div className="flex-1">
              <SearchInput
                placeholder="Search customer, phone, order SB-#, product..."
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>

            {/* Quick Date Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { label: "All Time", value: "all" },
                { label: "Today", value: "today" },
                { label: "Last 7 Days", value: "7days" },
                { label: "Last 30 Days", value: "30days" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => handleQuickDateSelect(btn.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                    quickDate === btn.value
                      ? "bg-green-50 text-green-700 border-green-300 font-bold"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Picker Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-medium flex-shrink-0">
              <IconCalendar size={14} className="text-gray-400" />
              <span>Date Range:</span>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-[11px] uppercase font-semibold">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setQuickDate("all");
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-[11px] uppercase font-semibold">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setQuickDate("all");
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                />
              </div>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <IconX size={13} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
          
          {loading && (
            <div className="p-12 text-center text-sm text-gray-500 font-medium">
              Searching & loading orders...
            </div>
          )}

          {error && !loading && (
            <div className="p-12 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button onClick={fetchOrders} className="text-xs font-semibold text-green-700 hover:text-green-800">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Mobile Card List (< md) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-gray-400">No matching orders found.</div>
                ) : (
                  orders.map((o) => {
                    const total = o.items.reduce((a, i) => a + (i.price * i.qty), 0);
                    const totalQty = o.items.reduce((a, i) => a + i.qty, 0);
                    const nextLabel = NEXT_LABEL[o.status];
                    const btnStyle = STATUS_BTN_STYLE[o.status];

                    return (
                      <div
                        key={o.id}
                        className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setSelected(o)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-data text-sm font-bold text-gray-900">{o.orderNumber}</span>
                          <OrderStatusBadge status={o.status} />
                        </div>

                        <div className="flex items-center gap-3">
                          <Avatar name={o.customer} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{o.customer}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {o.orderDate} · {o.orderTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 block mb-0.5">Items</span>
                            <span className="font-semibold text-gray-700">{o.items.length} ({totalQty} units)</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Pickup</span>
                            <span className="font-semibold text-gray-700">{o.pickupTime}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 block mb-0.5">Total</span>
                            <span className="font-mono-data font-bold text-sm text-gray-900">{INR(total)}</span>
                          </div>
                        </div>

                        {nextLabel && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await advance(o.id);
                              } catch (err) {
                                console.error("Failed to advance order:", err);
                              }
                            }}
                            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors text-center ${btnStyle}`}
                          >
                            {nextLabel}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (>= md: exact column structure as required) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Order", "Customer", "Items", "Qty", "Amount", "Order Date", "Order Time", "Pickup", "Status", "Action"].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-16 text-center text-sm text-gray-400">No matching orders found.</td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const total = o.items.reduce((a, i) => a + (i.price * i.qty), 0);
                        const totalQty = o.items.reduce((a, i) => a + i.qty, 0);
                        const nextLabel = NEXT_LABEL[o.status];
                        const btnStyle = STATUS_BTN_STYLE[o.status];
                        return (
                          <tr
                            key={o.id}
                            className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                            onClick={() => setSelected(o)}
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-mono-data text-xs font-bold text-gray-900">{o.orderNumber}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar name={o.customer} />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{o.customer}</p>
                                  <p className="text-[11px] text-gray-400 font-mono-data truncate">{o.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-xs text-gray-600 font-medium">{o.items.length}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-mono-data text-xs font-semibold text-gray-800">{totalQty}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-mono-data text-sm font-bold text-gray-900">{INR(total)}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-xs font-semibold text-gray-800">{o.orderDate}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-xs text-gray-500 font-medium">{o.orderTime}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-xs font-semibold text-gray-700">{o.pickupTime}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <OrderStatusBadge status={o.status} />
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {nextLabel ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      await advance(o.id);
                                    } catch (err) {
                                      console.error("Failed to advance order:", err);
                                    }
                                  }}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${btnStyle}`}
                                >
                                  {nextLabel}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination Bar */}
              <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                <p className="text-xs text-gray-500 font-medium">
                  Showing <span className="text-gray-900 font-semibold">{pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{" "}
                  <span className="text-gray-900 font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="text-gray-900 font-semibold">{pagination.total}</span> orders
                </p>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Btn
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1 || loading}
                      className="px-3 py-1.5 text-xs font-semibold"
                    >
                      Previous
                    </Btn>
                    <span className="text-xs text-gray-600 font-medium font-mono-data px-2">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Btn
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className="px-3 py-1.5 text-xs font-semibold"
                    >
                      Next
                    </Btn>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
