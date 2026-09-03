import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { UIOrder } from "../types";
import { mapOrder, mapUIOrderStatus } from "../types";
import {
  OrderStatusBadge, ModalBackdrop, ModalCard, Avatar, Btn,
  SearchInput, IconX, IconCheck, IconChevronRight,
} from "../components/ui";

type UIOrderStatus = UIOrder["status"];

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

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
  
  const total = order.items.reduce((a, i) => a + i.price, 0);
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
      <ModalCard className="w-[520px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono-data text-base font-bold text-gray-900">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400">
              Ordered at <strong className="text-gray-600">{order.orderTime}</strong>
              {" · "}Pickup at <strong className="text-gray-600">{order.pickupTime}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors mt-0.5">
            <IconX size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* Customer */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <Avatar name={order.customer} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{order.customer}</p>
                  <p className="text-xs text-gray-400 font-mono-data mt-0.5">{order.phone}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Ordered Items ({order.items.length})</p>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono-data text-xs font-bold text-green-700">{item.qty}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-mono-data text-sm font-semibold text-gray-900">{INR(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-medium">Total Products</span>
                <span className="font-semibold text-gray-700">{order.items.length} items · {totalQty} units</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between">
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
                    <div key={s} className="flex items-start flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            done ? "bg-green-600 shadow-sm" : "bg-gray-100"
                          } ${active ? "ring-2 ring-green-300 ring-offset-1" : ""}`}
                        >
                          {done ? (
                            <IconCheck size={13} />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span
                          className="text-center leading-tight"
                          style={{
                            fontSize: 10,
                            fontWeight: active ? 700 : 500,
                            color: done ? "#16a34a" : "#9ca3af",
                            maxWidth: 72,
                          }}
                        >
                          {s}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-4 mx-1 ${i < idx ? "bg-green-400" : "bg-gray-100"}`} />
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
          <div className="px-6 py-2 border-t border-gray-100">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
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

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS: Array<"All" | UIOrderStatus> = ["All", "Pending", "Preparing", "Ready for Pickup", "Picked Up"];

export default function Orders() {
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"All" | UIOrderStatus>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UIOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/orders");
      const ordersData = Array.isArray(response) ? response : response.data || [];
      const mappedOrders = ordersData.map(mapOrder);
      setOrders(mappedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visible = orders.filter((o) => {
    const mt = tab === "All" || o.status === tab;
    const ms = o.customer.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return mt && ms;
  });

  const counts: Record<string, number> = {};
  TABS.forEach((t) => { counts[t] = t === "All" ? orders.length : orders.filter((o) => o.status === t).length; });

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

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={fetchOrders} className="text-sm font-semibold text-green-700 hover:text-green-800">
              Retry
            </button>
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          {selectedLive && (
            <OrderDetailModal
              order={selectedLive}
              onClose={() => setSelected(null)}
              onAdvance={advance}
            />
          )}

          <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage customer pickup orders</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Pending", value: counts["Pending"], color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Preparing", value: counts["Preparing"], color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Ready for Pickup", value: counts["Ready for Pickup"], color: "text-green-700", bg: "bg-green-50", border: "border-green-100" },
            { label: "Picked Up Today", value: counts["Picked Up"], color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl px-5 py-4`}>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
              <p className={`text-3xl font-bold font-mono-data mt-1.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-1.5 flex items-center gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {t}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  tab === t ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[t]}
              </span>
            </button>
          ))}
          <div className="ml-auto pr-1">
            <SearchInput placeholder="Search by customer or order ID…" value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Order", "Customer", "Items", "Qty", "Amount", "Order Time", "Pickup", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-sm text-gray-400">No orders found.</td>
                  </tr>
                ) : (
                  visible.map((o) => {
                    const total = o.items.reduce((a, i) => a + i.price, 0);
                    const totalQty = o.items.reduce((a, i) => a + i.qty, 0);
                    const nextLabel = NEXT_LABEL[o.status];
                    const btnStyle = STATUS_BTN_STYLE[o.status];
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setSelected(o)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono-data text-xs font-semibold text-gray-700">{o.orderNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={o.customer} />
                            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{o.customer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{o.items.length}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono-data text-xs font-semibold text-gray-600">{totalQty}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono-data text-sm font-bold text-gray-900">{INR(total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{o.orderTime}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-gray-700">{o.pickupTime}</span>
                        </td>
                        <td className="px-6 py-4">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {nextLabel ? (
                            <button
                              onClick={async () => {
                                try {
                                  await advance(o.id);
                                } catch (err) {
                                  // Error handling is done in the advance function
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
          <div className="px-6 py-3.5 border-t border-gray-50">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="text-gray-700 font-semibold">{visible.length}</span> of {orders.length} orders
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
