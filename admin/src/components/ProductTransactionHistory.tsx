import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import type { ProductTransaction, ProductTransactionResponse, Page } from "../types";
import {
  ModalBackdrop, ModalCard, SearchInput, Btn,
  IconX, IconArrowDownRight, IconArrowUpRight, IconHistory, IconCalendar, IconBarcode, IconEye,
} from "./ui";
import TransactionDetailModal from "./TransactionDetailModal";

const INR = (n: number) => "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
};

interface ProductTransactionHistoryProps {
  productId: string;
  onClose: () => void;
  onNavigate?: (page: Page, target?: { search?: string; id?: string }) => void;
}

export default function ProductTransactionHistory({ productId, onClose, onNavigate }: ProductTransactionHistoryProps) {
  const [data, setData] = useState<ProductTransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<ProductTransaction | null>(null);

  const handleReferenceClick = (tx: ProductTransaction) => {
    if (!onNavigate) return;
    const isPurchase = tx.type === "PURCHASE" || tx.sourceType === "PURCHASE";

    if (isPurchase) {
      const searchRef = tx.reference && tx.reference !== "Single Entry" && tx.reference !== "—" 
        ? tx.reference 
        : (tx.invoiceNumber || tx.party || "");
      const purchaseId = tx.purchaseId || tx.sourceId || tx._id;

      onClose();
      onNavigate("purchases", { search: searchRef, id: purchaseId });
    } else {
      const searchRef = tx.reference && tx.reference !== "—" 
        ? tx.reference 
        : (tx.orderNumber || tx.customerPhone || "");
      const orderId = tx.orderId || tx.sourceId || (tx._id.includes("_") ? tx._id.split("_")[0] : tx._id);

      onClose();
      onNavigate("orders", { search: searchRef, id: orderId });
    }
  };

  // Filter & Pagination States
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PURCHASE" | "ORDER">("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (typeFilter !== "ALL") {
        params.append("type", typeFilter);
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

      const res = await api.get<ProductTransactionResponse>(`/products/${productId}/transactions?${params.toString()}`);
      
      const payload = res.data ? res.data : (res as unknown as ProductTransactionResponse);
      setData(payload);

      if ((res as any).pagination) {
        setPagination((res as any).pagination);
      } else {
        setPagination({
          total: payload.transactions ? payload.transactions.length : 0,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }, [productId, typeFilter, search, fromDate, toDate, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearFilters = () => {
    setTypeFilter("ALL");
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const isFiltered = typeFilter !== "ALL" || search.trim() !== "" || fromDate !== "" || toDate !== "";

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[1100px] max-w-[calc(100vw-32px)] max-h-[92vh] flex flex-col my-auto border border-gray-200 shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center border border-green-200">
              <IconHistory size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                PRODUCT TRANSACTION HISTORY
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete stock movement ledger across purchases and customer orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-gray-50/50">

          {/* Product Info Banner */}
          {data?.product && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {data.product.image ? (
                    <img src={data.product.image} alt={data.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">{data.product.name}</h4>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-gray-500">
                    {data.product.barcode && (
                      <span className="font-mono-data text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <IconBarcode size={12} className="text-gray-400" />
                        {data.product.barcode}
                      </span>
                    )}
                    {data.product.itemCode && (
                      <span className="font-mono-data text-gray-500">SKU: {data.product.itemCode}</span>
                    )}
                    {data.product.company && (
                      <span className="text-gray-600 font-medium">Brand: {data.product.company}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-gray-50/80 px-4 py-3 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Current Stock</span>
                  <span className="font-mono-data text-lg font-bold text-gray-900">
                    {data.product.stockQuantity} <span className="text-xs font-normal text-gray-500">{data.product.unit || "packs"}</span>
                  </span>
                </div>
                <div className="border-l border-gray-200 pl-6">
                  <span className="text-gray-400 font-medium block">Selling Price</span>
                  <span className="font-mono-data text-base font-bold text-green-700">{INR(data.product.sellingPrice)}</span>
                </div>
                {data.product.mrp && data.product.mrp > 0 && (
                  <div className="border-l border-gray-200 pl-6 hidden sm:block">
                    <span className="text-gray-400 font-medium block">MRP</span>
                    <span className="font-mono-data text-base font-semibold text-gray-600">{INR(data.product.mrp)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Type Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => { setTypeFilter("ALL"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === "ALL"
                      ? "bg-white text-gray-900 shadow-sm font-bold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All Transactions
                </button>
                <button
                  type="button"
                  onClick={() => { setTypeFilter("PURCHASE"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    typeFilter === "PURCHASE"
                      ? "bg-green-600 text-white shadow-sm font-bold"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >
                  <IconArrowDownRight size={13} /> Supplier Purchases (IN)
                </button>
                <button
                  type="button"
                  onClick={() => { setTypeFilter("ORDER"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    typeFilter === "ORDER"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-gray-600 hover:text-blue-700"
                  }`}
                >
                  <IconArrowUpRight size={13} /> Customer Orders (OUT)
                </button>
              </div>

              {/* Search Bar */}
              <div className="w-full lg:w-72">
                <SearchInput
                  placeholder="Search invoice, order #, supplier, customer..."
                  value={searchInput}
                  onChange={setSearchInput}
                />
              </div>
            </div>

            {/* Date Range & Clear Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">From:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                  />
                </div>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline self-start sm:self-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Transaction Ledger</h4>
              <span className="text-xs font-semibold text-gray-400 font-mono-data">
                {pagination.total} {pagination.total === 1 ? "Record" : "Records"}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Loading product transaction history...
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <p className="text-xs text-red-600 mb-3">{error}</p>
                <Btn variant="outline" onClick={fetchHistory} className="text-xs">Retry</Btn>
              </div>
            ) : data?.transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">
                No transactions match your current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-28 text-center">Direction</th>
                      <th className="px-4 py-3.5">Date & Time</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Reference</th>
                      <th className="px-4 py-3.5">Party / Customer</th>
                      <th className="px-4 py-3.5 text-center">Quantity</th>
                      <th className="px-4 py-3.5 text-right">Unit Price</th>
                      <th className="px-4 py-3.5 text-right">Total Amount</th>
                      <th className="px-4 py-3.5 text-center">Running Stock</th>
                      <th className="px-4 py-3.5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {data?.transactions.map((tx: ProductTransaction) => {
                      const isPurchase = tx.type === "PURCHASE";
                      return (
                        <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                          
                          {/* Direction Indicator */}
                          <td className="px-4 py-3.5 text-center">
                            {isPurchase ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <IconArrowDownRight size={13} /> IN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <IconArrowUpRight size={13} /> OUT
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{formatDate(tx.date)}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <IconCalendar size={10} /> {formatTime(tx.date)}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`font-semibold ${isPurchase ? "text-green-800" : "text-blue-800"}`}>
                              {isPurchase ? "Purchase" : "Customer Order"}
                            </span>
                          </td>

                          {/* Reference Number */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {onNavigate && tx.reference && tx.reference !== "—" ? (
                              <button
                                type="button"
                                onClick={() => handleReferenceClick(tx)}
                                className="font-mono-data text-xs text-gray-800 bg-gray-100 hover:bg-gray-200 hover:text-green-700 hover:border-green-300 border border-gray-200 px-2 py-0.5 rounded font-bold transition-all cursor-pointer inline-flex items-center gap-1 group shadow-xs"
                                title={`Go to ${isPurchase ? "Purchase Invoice" : "Order"} ${tx.reference}`}
                              >
                                <span>{tx.reference}</span>
                              </button>
                            ) : (
                              <span className="font-mono-data text-xs text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-bold">
                                {tx.reference}
                              </span>
                            )}
                          </td>

                          {/* Party / Supplier / Customer */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-gray-800">{tx.party}</div>
                            {tx.customerPhone && (
                              <div className="text-[10px] text-gray-400 font-mono-data">{tx.customerPhone}</div>
                            )}
                          </td>

                          {/* Quantity Change */}
                          <td className="px-4 py-3.5 text-center font-mono-data font-bold text-sm">
                            {isPurchase ? (
                              <span className="text-green-600">+{tx.quantity}</span>
                            ) : (
                              <span className="text-blue-600">{tx.quantity}</span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="px-4 py-3.5 text-right font-mono-data text-gray-700 font-medium">
                            {INR(tx.unitPrice)}
                          </td>

                          {/* Total Amount */}
                          <td className="px-4 py-3.5 text-right font-mono-data font-bold text-gray-900">
                            {INR(tx.totalAmount)}
                          </td>

                          {/* Running Stock */}
                          <td className="px-4 py-3.5 text-center font-mono-data font-bold text-gray-900 bg-gray-50/50">
                            {tx.runningBalance !== undefined ? tx.runningBalance : "—"}
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                              title="View Details"
                            >
                              <IconEye size={13} className="text-gray-500" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-gray-400 font-medium">
                  Page <span className="font-bold text-gray-800">{pagination.page}</span> of <span className="font-bold text-gray-800">{pagination.totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none"
                  >
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-white disabled:opacity-40 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={!pagination.hasMore}
                      onClick={() => setPage(p => p + 1)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-white disabled:opacity-40 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-end sticky bottom-0 z-20">
          <Btn variant="outline" onClick={onClose} className="px-6">
            Close
          </Btn>
        </div>

        {/* Transaction Detail Modal Overlay */}
        {selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            productFallback={data?.product}
            onClose={() => setSelectedTransaction(null)}
            onNavigateReference={onNavigate ? handleReferenceClick : undefined}
          />
        )}
      </ModalCard>
    </ModalBackdrop>
  );
}
