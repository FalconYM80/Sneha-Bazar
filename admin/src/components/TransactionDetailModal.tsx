import type { ProductTransaction } from "../types";
import {
  ModalBackdrop, ModalCard, Btn,
  IconX, IconArrowDownRight, IconArrowUpRight, IconFileText, IconCalendar, IconBarcode,
} from "./ui";

const INR = (n: number | undefined) =>
  n !== undefined && n !== null ? "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "—";

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + ", " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return dateString;
  }
};

interface TransactionDetailModalProps {
  transaction: ProductTransaction;
  productFallback?: {
    name?: string;
    itemCode?: string;
    barcode?: string;
  };
  onClose: () => void;
  onNavigateReference?: (tx: ProductTransaction) => void;
}

export default function TransactionDetailModal({ transaction: tx, productFallback, onClose, onNavigateReference }: TransactionDetailModalProps) {
  const isPurchase = tx.type === "PURCHASE";
  const absQty = Math.abs(tx.quantity);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[580px] max-w-[calc(100vw-32px)] max-h-[90vh] flex flex-col my-auto border border-gray-200 shadow-2xl overflow-hidden bg-white z-50">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isPurchase
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              <IconFileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                TRANSACTION DETAILS
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPurchase ? "Supplier Purchase Invoice Detail" : "Customer Order Stock-out Record"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-gray-50/50">

          {/* Type & Direction Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isPurchase
              ? "bg-green-50/80 border-green-200/80 text-green-900"
              : "bg-blue-50/80 border-blue-200/80 text-blue-900"
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border ${
                isPurchase
                  ? "bg-green-600 text-white border-green-700"
                  : "bg-blue-600 text-white border-blue-700"
              }`}>
                {isPurchase ? <IconArrowDownRight size={14} /> : <IconArrowUpRight size={14} />}
                {isPurchase ? "Stock In" : "Stock Out"}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {isPurchase ? "Supplier Purchase" : "Customer Order"}
              </span>
            </div>
            {onNavigateReference && tx.reference && tx.reference !== "—" ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateReference(tx);
                }}
                className="font-mono-data text-xs font-bold px-2.5 py-1 bg-white hover:bg-gray-100 hover:border-gray-400 rounded border border-gray-200 text-gray-800 transition-all cursor-pointer shadow-sm"
                title={`Navigate to ${isPurchase ? "Purchase Invoice" : "Order"} ${tx.reference}`}
              >
                {tx.reference}
              </button>
            ) : (
              <span className="font-mono-data text-xs font-bold px-2.5 py-1 bg-white/80 rounded border border-gray-200 text-gray-800">
                {tx.reference}
              </span>
            )}
          </div>

          {/* Product Overview Card */}
          <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Product Information</span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {tx.itemName || tx.productName || productFallback?.name || "Product"}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                  {tx.productId && (
                    <span className="font-mono-data text-[11px] text-gray-400">ID: {tx.productId}</span>
                  )}
                  {(tx.productItemCode || productFallback?.itemCode) && (
                    <span className="font-mono-data text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                      SKU: {tx.productItemCode || productFallback?.itemCode}
                    </span>
                  )}
                  {tx.barcode ? (
                    <span className="font-mono-data text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                      <IconBarcode size={12} className="text-gray-400" />
                      {tx.barcode}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">Barcode: Not stored</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-sm space-y-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-2">
              Transaction Breakdown
            </span>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              
              {/* Type */}
              <div>
                <span className="text-gray-400 font-medium block">Transaction Type</span>
                <span className="font-semibold text-gray-800">
                  {isPurchase ? "Supplier Purchase" : "Customer Order"}
                </span>
              </div>

              {/* Direction */}
              <div>
                <span className="text-gray-400 font-medium block">Direction</span>
                <span className={`font-semibold ${isPurchase ? "text-green-700" : "text-blue-700"}`}>
                  {isPurchase ? "Stock In (+)" : "Stock Out (-)"}
                </span>
              </div>

              {/* Date & Time */}
              <div className="col-span-2 sm:col-span-1">
                <span className="text-gray-400 font-medium block">{isPurchase ? "Purchase Date & Time" : "Order Date & Time"}</span>
                <span className="font-medium text-gray-800 flex items-center gap-1 mt-0.5">
                  <IconCalendar size={13} className="text-gray-400" />
                  {formatDateTime(tx.date)}
                </span>
              </div>

              {/* Reference Number */}
              <div>
                <span className="text-gray-400 font-medium block">{isPurchase ? "Invoice Number" : "Order Number"}</span>
                <span className="font-mono-data font-bold text-gray-800">{tx.reference}</span>
              </div>

              {/* Party / Customer / Supplier */}
              <div className="col-span-2 sm:col-span-1">
                <span className="text-gray-400 font-medium block">{isPurchase ? "Supplier / Distributor" : "Customer Name"}</span>
                <span className="font-semibold text-gray-800">{tx.supplier || tx.customerName || tx.party}</span>
              </div>

              {/* Customer Phone (if Order) */}
              {!isPurchase && (
                <div>
                  <span className="text-gray-400 font-medium block">Customer Phone</span>
                  <span className="font-mono-data font-semibold text-gray-800">
                    {tx.customerPhone || "Not available"}
                  </span>
                </div>
              )}

              {/* Status (if Order) */}
              {!isPurchase && tx.status && (
                <div>
                  <span className="text-gray-400 font-medium block">Order Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
                    {tx.status}
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div>
                <span className="text-gray-400 font-medium block">Quantity</span>
                <span className={`font-mono-data text-sm font-bold ${isPurchase ? "text-green-700" : "text-blue-700"}`}>
                  {isPurchase ? `+${absQty}` : `-${absQty}`}
                </span>
              </div>

              {/* Unit Price */}
              <div>
                <span className="text-gray-400 font-medium block">{isPurchase ? "Purchase Price / Unit" : "Selling Price / Unit"}</span>
                <span className="font-mono-data font-semibold text-gray-800">{INR(tx.unitPrice)}</span>
              </div>

              {/* Total Amount */}
              <div>
                <span className="text-gray-400 font-medium block">Total Amount</span>
                <span className="font-mono-data text-sm font-bold text-gray-900">{INR(tx.totalAmount)}</span>
              </div>

              {/* Purchase Specific MRP & Selling Price */}
              {isPurchase && (
                <>
                  <div>
                    <span className="text-gray-400 font-medium block">MRP</span>
                    <span className="font-mono-data font-semibold text-gray-700">{INR(tx.mrp)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Selling Price</span>
                    <span className="font-mono-data font-semibold text-green-700">{INR(tx.sellingPrice)}</span>
                  </div>
                </>
              )}

              {/* Running Stock Position at transaction time */}
              {tx.runningBalance !== undefined && (
                <div className="col-span-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Running Stock Balance</span>
                  <span className="font-mono-data font-bold text-gray-900 text-xs bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                    {tx.runningBalance}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-white flex items-center justify-end sticky bottom-0 z-20">
          <Btn variant="outline" onClick={onClose} className="px-5 text-xs">
            Close
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}
