import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import type { Purchase, Product, Category } from "../types";
import {
  ModalBackdrop, ModalCard, FormField, TextInput,
  Btn, SearchInput, IconPlus, IconX, IconTrash, IconEdit, IconCalendar, IconBarcode, IconChevronRight,
} from "../components/ui";

const INR = (n: number) => "₹" + (n || 0).toLocaleString("en-IN");

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
};

const getTodayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};

const getDaysAgoStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};

const getThisMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const offset = now.getTimezoneOffset();
  const startStr = new Date(start.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  const endStr = new Date(end.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  return { startStr, endStr };
};

const getLastMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const offset = now.getTimezoneOffset();
  const startStr = new Date(start.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  const endStr = new Date(end.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  return { startStr, endStr };
};

// Local unsaved row item interface for multi-product invoice entry
interface InvoiceItemRow {
  id: string;
  productId?: string;
  name: string;
  barcode: string;
  quantity: number;
  purchaseAmount: number;
  sellingPrice: number;
  mrp: number;
  unit?: string;
  image?: string;
}

// ── Assign Barcode Modal ──────────────────────────────────────────────────────

function AssignBarcodeModal({
  scannedBarcode,
  allProducts,
  onClose,
  onAssigned,
}: {
  scannedBarcode: string;
  allProducts: Product[];
  onClose: () => void;
  onAssigned: (product: Product) => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.itemCode && p.itemCode.toLowerCase().includes(search.toLowerCase())) ||
    (p.company && p.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAssign = async () => {
    if (!selectedProductId) {
      setError("Please select an existing product");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await api.put(`/products/${selectedProductId}`, {
        barcode: scannedBarcode.trim(),
      });
      const updatedProduct: Product = res.data;
      onAssigned(updatedProduct);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign barcode to product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[480px] max-w-[calc(100vw-32px)] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Assign Barcode to Product</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Barcode: <span className="font-mono-data text-green-700 font-bold">{scannedBarcode}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            Select an existing product below to attach this barcode to it. This will allow barcode scanning for future purchases.
          </div>

          <SearchInput
            placeholder="Search existing products by name, code, or brand..."
            value={search}
            onChange={setSearch}
          />

          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
            {filteredProducts.length === 0 ? (
              <p className="p-4 text-xs text-center text-gray-400">No products found</p>
            ) : (
              filteredProducts.map((prod) => (
                <label
                  key={prod._id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProductId === prod._id ? "bg-green-50/70" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="assignProduct"
                    value={prod._id}
                    checked={selectedProductId === prod._id}
                    onChange={() => setSelectedProductId(prod._id)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
                    <p className="text-xs text-gray-400">
                      Stock: {prod.stockQuantity} | Price: ₹{prod.sellingPrice} {prod.barcode ? `| Barcode: ${prod.barcode}` : ""}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleAssign} disabled={!selectedProductId || saving} className="flex-1">
            {saving ? "Saving..." : "Assign & Add to Invoice"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Redesigned Multi-Item Add Purchase Modal ─────────────────────────────────

function AddPurchaseModal({ 
  onClose, 
  onAdd, 
  allProducts 
}: { 
  onClose: () => void; 
  onAdd: () => void;
  allProducts: Product[];
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [distributor, setDistributor] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getLocalDate());

  const [barcodeInput, setBarcodeInput] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([]);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const [manualSearch, setManualSearch] = useState("");
  const [showManualDropdown, setShowManualDropdown] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const focusBarcodeInput = () => {
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 60);
  };

  useEffect(() => {
    focusBarcodeInput();
  }, []);

  const addProductToInvoice = (prod: Product, scannedBarcodeCode?: string) => {
    const code = prod.barcode || scannedBarcodeCode || "";

    setInvoiceItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => (item.productId && item.productId === prod._id) || (code && item.barcode === code)
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return updated;
      } else {
        const estimatedPurchasePrice = prod.sellingPrice ? Math.round(prod.sellingPrice * 0.8) : 0;
        const newRow: InvoiceItemRow = {
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 7),
          productId: prod._id,
          name: prod.name,
          barcode: code,
          quantity: 1,
          purchaseAmount: estimatedPurchasePrice,
          sellingPrice: prod.sellingPrice || 0,
          mrp: prod.mrp || prod.sellingPrice || 0,
          unit: prod.unit,
          image: prod.image,
        };
        return [...prev, newRow];
      }
    });

    setUnknownBarcode(null);
  };

  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setLookingUp(true);
    setError("");
    setUnknownBarcode(null);

    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      const matchedProduct: Product = res.data;

      addProductToInvoice(matchedProduct, code);
      setBarcodeInput("");
      focusBarcodeInput();
    } catch {
      setUnknownBarcode(code);
      setBarcodeInput("");
      focusBarcodeInput();
    } finally {
      setLookingUp(false);
    }
  };

  const handleSelectManualProduct = (prod: Product) => {
    addProductToInvoice(prod);
    setManualSearch("");
    setShowManualDropdown(false);
    focusBarcodeInput();
  };

  const updateItemRow = (id: string, field: keyof InvoiceItemRow, val: number) => {
    setInvoiceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveRow = (id: string) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
    focusBarcodeInput();
  };

  const totalItems = invoiceItems.length;
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalInvoiceAmount = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.purchaseAmount), 0);

  const isValid =
    invoiceNumber.trim() !== "" &&
    distributor.trim() !== "" &&
    purchaseDate !== "" &&
    invoiceItems.length > 0 &&
    invoiceItems.every(
      (item) =>
        item.quantity >= 1 &&
        !isNaN(item.purchaseAmount) && item.purchaseAmount >= 0 &&
        !isNaN(item.sellingPrice) && item.sellingPrice >= 0 &&
        !isNaN(item.mrp) && item.mrp >= 0
    );

  const handleSaveInvoice = async () => {
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required");
      return;
    }
    if (!distributor.trim()) {
      setError("Distributor is required");
      return;
    }
    if (!purchaseDate) {
      setError("Purchase date is required");
      return;
    }
    if (invoiceItems.length === 0) {
      setError("Please add at least one product to the invoice");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/purchases", {
        invoiceNumber: invoiceNumber.trim(),
        distributor: distributor.trim(),
        supplier: distributor.trim(),
        purchaseDate,
        items: invoiceItems.map((item) => ({
          product: item.productId,
          itemName: item.name,
          barcode: item.barcode || undefined,
          quantityPurchased: item.quantity,
          purchaseAmount: item.purchaseAmount,
          sellingPrice: item.sellingPrice,
          mrp: item.mrp,
        })),
      });

      onAdd();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save purchase invoice");
    } finally {
      setSaving(false);
    }
  };

  const filteredManualProducts = allProducts
    .filter((p) =>
      p.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(manualSearch.toLowerCase()))
    )
    .slice(0, 6);

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <ModalCard className="w-[1200px] max-w-[calc(100vw-32px)] max-h-[92vh] flex flex-col my-auto border border-gray-200 shadow-2xl overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <IconBarcode size={18} className="text-green-700" /> ADD PURCHASE
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter supplier invoice details and scan products
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-gray-50/50">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Invoice Number *">
                  <TextInput
                    placeholder="e.g. INV-4582"
                    value={invoiceNumber}
                    onChange={setInvoiceNumber}
                  />
                </FormField>
                <FormField label="Distributor *">
                  <TextInput
                    placeholder="e.g. ABC Distributors"
                    value={distributor}
                    onChange={setDistributor}
                  />
                </FormField>
                <FormField label="Purchase Date *">
                  <TextInput
                    type="date"
                    value={purchaseDate}
                    onChange={setPurchaseDate}
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>SCAN / ENTER BARCODE</span>
                  </label>
                  <p className="text-[11px] text-gray-400">Supports USB barcode scanner</p>
                </div>
                
                <div className="relative w-full sm:w-72">
                  <SearchInput
                    placeholder="+ Add Product Manually..."
                    value={manualSearch}
                    onChange={(v) => {
                      setManualSearch(v);
                      setShowManualDropdown(true);
                    }}
                  />
                  {showManualDropdown && manualSearch && filteredManualProducts.length > 0 && (
                    <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {filteredManualProducts.map((prod) => (
                        <button
                          key={prod._id}
                          type="button"
                          onClick={() => handleSelectManualProduct(prod)}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-green-50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{prod.name}</p>
                            {prod.barcode && <p className="text-[10px] font-mono-data text-gray-400">{prod.barcode}</p>}
                          </div>
                          <span className="text-[11px] font-medium text-gray-500">₹{prod.sellingPrice}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan barcode or press Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeLookup();
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono-data text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 bg-white shadow-inner"
                  />
                </div>
                <Btn
                  variant="outline"
                  onClick={() => handleBarcodeLookup()}
                  disabled={lookingUp || !barcodeInput.trim()}
                  className="px-5 text-xs font-semibold"
                >
                  {lookingUp ? "Searching..." : "Lookup"}
                </Btn>
              </div>

              {unknownBarcode && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-amber-900">
                    <span className="font-semibold">Product not found for barcode:</span>{" "}
                    <span className="font-mono-data font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">{unknownBarcode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    className="text-xs font-bold text-green-700 hover:text-green-800 bg-white border border-green-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
                  >
                    + Assign Barcode to Existing Product
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Purchase Items</h4>
                <span className="text-xs font-semibold text-gray-400 font-mono-data">
                  {invoiceItems.length} {invoiceItems.length === 1 ? "Row" : "Rows"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 w-36">Barcode</th>
                      <th className="px-4 py-3 w-28 text-center">Qty</th>
                      <th className="px-4 py-3 w-36">Purchase Price (₹)</th>
                      <th className="px-4 py-3 w-36">Selling Price (₹)</th>
                      <th className="px-4 py-3 w-36">MRP (₹)</th>
                      <th className="px-4 py-3 w-16 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-400">
                          No items added yet. Scan a barcode above or search manually to build the invoice.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono-data font-semibold">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden text-xs">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-400">📦</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                                {item.unit && <p className="text-[10px] text-gray-400">{item.unit}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono-data text-[11px] text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block truncate text-center">
                              {item.barcode || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItemRow(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono-data font-bold text-gray-900 text-center outline-none focus:border-green-500 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.purchaseAmount}
                              onChange={(e) => updateItemRow(item.id, "purchaseAmount", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono-data text-gray-900 text-right outline-none focus:border-green-500 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => updateItemRow(item.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono-data text-gray-900 text-right outline-none focus:border-green-500 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.mrp}
                              onChange={(e) => updateItemRow(item.id, "mrp", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono-data text-gray-900 text-right outline-none focus:border-green-500 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <IconTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
            <div className="flex items-center gap-6 text-xs text-gray-600 font-medium">
              <div>
                Items: <span className="font-mono-data font-bold text-gray-900 text-sm">{totalItems}</span>
              </div>
              <div>
                Total Quantity: <span className="font-mono-data font-bold text-gray-900 text-sm">{totalQuantity}</span>
              </div>
              <div>
                Estimated Invoice Total: <span className="font-mono-data font-bold text-green-700 text-sm">{INR(totalInvoiceAmount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Btn variant="outline" onClick={onClose} disabled={saving} className="flex-1 sm:flex-initial">
                Cancel
              </Btn>
              <Btn
                variant="primary"
                onClick={handleSaveInvoice}
                disabled={!isValid || saving}
                className="flex-1 sm:flex-initial min-w-[140px]"
              >
                {saving ? "Saving Purchase..." : "Save Purchase"}
              </Btn>
            </div>
          </div>
        </ModalCard>
      </ModalBackdrop>

      {showAssignModal && unknownBarcode && (
        <AssignBarcodeModal
          scannedBarcode={unknownBarcode}
          allProducts={allProducts}
          onClose={() => {
            setShowAssignModal(false);
            focusBarcodeInput();
          }}
          onAssigned={(updatedProduct) => {
            addProductToInvoice(updatedProduct, unknownBarcode);
            setShowAssignModal(false);
            focusBarcodeInput();
          }}
        />
      )}
    </>
  );
}

// ── Edit Purchase Modal ───────────────────────────────────────────────────────

function EditPurchaseModal({ 
  onClose, 
  onUpdate, 
  purchase,
  allProducts 
}: { 
  onClose: () => void; 
  onUpdate: () => void;
  purchase: Purchase;
  allProducts: Product[];
}) {
  const initialProductId = typeof purchase.product === "object" && purchase.product ? purchase.product._id : (typeof purchase.product === "string" ? purchase.product : "");
  
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [f, setF] = useState({
    invoiceNumber: purchase.invoiceNumber || "",
    barcode: purchase.barcode || "",
    itemName: purchase.itemName || "",
    supplier: purchase.supplier || "",
    quantityPurchased: purchase.quantityPurchased !== undefined && purchase.quantityPurchased !== null ? purchase.quantityPurchased.toString() : "",
    purchaseAmount: purchase.purchaseAmount !== undefined ? purchase.purchaseAmount.toString() : "",
    sellingPrice: purchase.sellingPrice !== undefined && purchase.sellingPrice !== null ? purchase.sellingPrice.toString() : "",
    mrp: purchase.mrp !== undefined ? purchase.mrp.toString() : "",
    purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.split('T')[0] : getLocalDate(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const qty = Number(f.quantityPurchased);
  const valid = 
    f.itemName.trim() !== "" && 
    f.supplier.trim() !== "" && 
    f.quantityPurchased !== "" && 
    Number.isInteger(qty) && 
    qty >= 1 && 
    f.purchaseAmount !== "" && 
    !isNaN(Number(f.purchaseAmount)) && 
    Number(f.purchaseAmount) >= 0 && 
    f.sellingPrice !== "" && 
    !isNaN(Number(f.sellingPrice)) && 
    Number(f.sellingPrice) >= 0 && 
    f.mrp !== "" && 
    !isNaN(Number(f.mrp)) && 
    Number(f.mrp) >= 0;

  const filteredSuggestions = allProducts
    .filter(p => p.name.toLowerCase().includes(f.itemName.toLowerCase()))
    .slice(0, 5);

  const handleSubmit = async () => {
    if (!valid) return;
    
    setSaving(true);
    setError("");
    
    try {
      await api.put(`/purchases/${purchase._id}`, {
        invoiceNumber: f.invoiceNumber.trim() || undefined,
        product: selectedProductId || undefined,
        barcode: f.barcode.trim() || undefined,
        itemName: f.itemName.trim(),
        supplier: f.supplier.trim(),
        distributor: f.supplier.trim(),
        quantityPurchased: qty,
        purchaseAmount: Number(f.purchaseAmount),
        sellingPrice: Number(f.sellingPrice),
        mrp: Number(f.mrp),
        purchaseDate: f.purchaseDate,
      });
      
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[520px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Edit Purchase Record</h3>
            <p className="text-xs text-gray-400 mt-0.5">Update purchase item details and stock difference</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <FormField label="Invoice Number">
            <TextInput placeholder="e.g. INV-4582" value={f.invoiceNumber} onChange={set("invoiceNumber")} />
          </FormField>

          <FormField label="Supplier / Distributor *">
            <TextInput 
              placeholder="e.g. ABC Distributors" 
              value={f.supplier} 
              onChange={set("supplier")} 
            />
          </FormField>

          <div className="sm:col-span-2 relative">
            <FormField label="Item Name *">
              <TextInput 
                placeholder="e.g. Aashirvaad Atta (10kg)" 
                value={f.itemName} 
                onChange={(v) => {
                  set("itemName")(v);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </FormField>
            
            {showSuggestions && f.itemName && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
                {filteredSuggestions.map((prod) => (
                  <button
                    key={prod._id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(prod._id);
                      setF(prev => ({
                        ...prev,
                        itemName: prod.name,
                        barcode: prod.barcode || prev.barcode,
                      }));
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium truncate">{prod.name}</span>
                    <span className="text-xs text-gray-400 font-mono-data ml-2">Stock: {prod.stockQuantity}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <FormField label="Barcode">
            <TextInput placeholder="e.g. 8901234567890" value={f.barcode} onChange={set("barcode")} />
          </FormField>

          <FormField label="Quantity Purchased *">
            <TextInput 
              placeholder="e.g. 50" 
              type="number" 
              min="1"
              step="1"
              value={f.quantityPurchased} 
              onChange={set("quantityPurchased")} 
            />
          </FormField>
          
          <FormField label="Purchase Amount (₹) *">
            <TextInput placeholder="0.00" type="number" min="0" value={f.purchaseAmount} onChange={set("purchaseAmount")} />
          </FormField>

          <FormField label="Selling Price (₹) *">
            <TextInput placeholder="0.00" type="number" min="0" value={f.sellingPrice} onChange={set("sellingPrice")} />
          </FormField>
          
          <FormField label="MRP (₹) *">
            <TextInput placeholder="0.00" type="number" min="0" value={f.mrp} onChange={set("mrp")} />
          </FormField>
          
          <FormField label="Purchase Date">
            <TextInput type="date" value={f.purchaseDate} onChange={set("purchaseDate")} />
          </FormField>
        </div>

        {error && (
          <div className="px-5 sm:px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div className="px-5 sm:px-6 pb-5 flex gap-3 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={!valid || saving} className="flex-1">
            {saving ? "Saving..." : "Update Purchase"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Main Purchases Page ────────────────────────────────────────────────────────

interface GroupedInvoice {
  key: string;
  invoiceNumber?: string;
  supplier?: string;
  purchaseDate: string;
  items: Purchase[];
  totalItemsCount: number;
  totalQuantity: number;
  totalAmount: number;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Server-Side Filter States
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quickDate, setQuickDate] = useState<"all" | "today" | "7days" | "30days" | "thisMonth" | "lastMonth" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);

  // Accordion view state
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  // Fetch filter options (distinct suppliers & categories)
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get("/purchases/filter-options");
      if (response.data) {
        setSupplierOptions(response.data.suppliers || []);
        setCategoryOptions(response.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load purchase filter options:", err);
    }
  };

  // Server-Side Fetch Purchases with all active filters
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (selectedSupplier) {
        params.append("supplier", selectedSupplier);
      }
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      if (fromDate) {
        params.append("fromDate", fromDate);
      }
      if (toDate) {
        params.append("toDate", toDate);
      }

      const response = await api.get(`/purchases?${params.toString()}`);
      const purchasesData = Array.isArray(response) ? response : response.data || [];
      setPurchases(purchasesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [search, selectedSupplier, selectedCategory, fromDate, toDate]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products?admin=true&limit=100");
      const productsData = Array.isArray(response) ? response : response.data || [];
      setAllProducts(productsData);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleQuickDateSelect = (type: "all" | "today" | "7days" | "30days" | "thisMonth" | "lastMonth" | "custom") => {
    setQuickDate(type);
    if (type === "all") {
      setFromDate("");
      setToDate("");
    } else if (type === "today") {
      const today = getTodayStr();
      setFromDate(today);
      setToDate(today);
    } else if (type === "7days") {
      setFromDate(getDaysAgoStr(7));
      setToDate(getTodayStr());
    } else if (type === "30days") {
      setFromDate(getDaysAgoStr(30));
      setToDate(getTodayStr());
    } else if (type === "thisMonth") {
      const range = getThisMonthRange();
      setFromDate(range.startStr);
      setToDate(range.endStr);
    } else if (type === "lastMonth") {
      const range = getLastMonthRange();
      setFromDate(range.startStr);
      setToDate(range.endStr);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedSupplier("");
    setSelectedCategory("");
    setQuickDate("all");
    setFromDate("");
    setToDate("");
  };

  // Group purchases by invoiceNumber + supplier + purchaseDate or fallback to unique ID
  const groupedInvoices: GroupedInvoice[] = (() => {
    const groups: Map<string, GroupedInvoice> = new Map();

    for (const p of purchases) {
      const groupKey = p.invoiceNumber
        ? `${p.invoiceNumber.trim()}__${(p.supplier || "").trim()}__${(p.purchaseDate || "").split("T")[0]}`
        : p._id;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          invoiceNumber: p.invoiceNumber,
          supplier: p.supplier,
          purchaseDate: p.purchaseDate,
          items: [],
          totalItemsCount: 0,
          totalQuantity: 0,
          totalAmount: 0,
        });
      }

      const group = groups.get(groupKey)!;
      group.items.push(p);
      group.totalItemsCount += 1;
      group.totalQuantity += p.quantityPurchased || 1;
      group.totalAmount += p.purchaseAmount * (p.quantityPurchased || 1);
    }

    return Array.from(groups.values());
  })();

  const toggleExpand = (groupKey: string) => {
    setExpandedInvoices((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const totalPurchases = purchases.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPurchases = purchases.filter((p) => {
    const date = new Date(p.purchaseDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + (p.purchaseAmount * (p.quantityPurchased || 1)), 0);

  const handleDelete = async (purchase: Purchase) => {
    if (!window.confirm(`Are you sure you want to delete purchase record for "${purchase.itemName}"? This will reverse its stock contribution.`)) {
      return;
    }

    try {
      await api.delete(`/purchases/${purchase._id}`);
      await fetchPurchases();
      await fetchProducts();
      await fetchFilterOptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete purchase");
    }
  };

  const isFiltered = search.trim() !== "" || selectedSupplier !== "" || selectedCategory !== "" || fromDate !== "" || toDate !== "" || quickDate !== "all";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {!loading && !error && (
        <>
          {adding && (
            <AddPurchaseModal
              onClose={() => setAdding(false)}
              onAdd={() => {
                fetchPurchases();
                fetchProducts();
                fetchFilterOptions();
              }}
              allProducts={allProducts}
            />
          )}
          {editing && (
            <EditPurchaseModal
              onClose={() => setEditing(null)}
              onUpdate={() => {
                fetchPurchases();
                fetchProducts();
                fetchFilterOptions();
              }}
              purchase={editing}
              allProducts={allProducts}
            />
          )}
        </>
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchases</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Multi-item invoice entry, server-side filtering & automated stock management
            </p>
          </div>
          <Btn variant="primary" onClick={() => setAdding(true)} className="self-start sm:self-auto shadow-sm">
            <IconPlus size={15} /> Add Purchase
          </Btn>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Purchases", value: totalPurchases, sub: "matching records" },
            { label: "This Month", value: thisMonthPurchases, sub: "current month purchases" },
            { label: "Total Purchase Amount", value: INR(totalPurchaseAmount), sub: "cumulative spend" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 card-shadow border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 font-mono-data mt-1 sm:mt-1.5">{value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Enhanced Multi-Filter Toolbar */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-4 space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Search Field */}
            <div className="flex-1">
              <SearchInput
                placeholder="Search invoice, item, supplier, or barcode..."
                value={search}
                onChange={setSearch}
              />
            </div>

            {/* Supplier Filter Dropdown */}
            <div className="w-full lg:w-56">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-green-500 font-medium cursor-pointer"
              >
                <option value="">All Suppliers / Distributors</option>
                {supplierOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Product / Category Filter Dropdown */}
            <div className="w-full lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-green-500 font-medium cursor-pointer"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Date Presets & Custom Range */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { label: "All Time", value: "all" },
                { label: "Today", value: "today" },
                { label: "Last 7 Days", value: "7days" },
                { label: "Last 30 Days", value: "30days" },
                { label: "This Month", value: "thisMonth" },
                { label: "Last Month", value: "lastMonth" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => handleQuickDateSelect(btn.value as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap border ${
                    quickDate === btn.value
                      ? "bg-green-50 text-green-700 border-green-300 font-bold"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setQuickDate("custom");
                  }}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setQuickDate("custom");
                  }}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-green-500 bg-white"
                />
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <IconX size={13} /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grouped Invoices Container */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-12 text-center text-sm text-gray-500 font-medium">
              Searching & loading purchases...
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-12 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button onClick={fetchPurchases} className="text-xs font-semibold text-green-700 hover:text-green-800">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {groupedInvoices.length === 0 ? (
                <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-12 text-center text-sm text-gray-400">
                  No purchase records found matching your filters.
                </div>
              ) : (
                groupedInvoices.map((group) => {
                  const isExpanded = expandedInvoices[group.key] ?? true;
                  return (
                    <div key={group.key} className="bg-white rounded-2xl card-shadow border border-gray-200/80 overflow-hidden transition-all">
                      
                      {/* Invoice Group Header Bar */}
                      <div
                        onClick={() => toggleExpand(group.key)}
                        className="px-5 py-4 bg-gray-50/80 hover:bg-gray-100/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-gray-400 hover:text-gray-600 transition-transform">
                            <span className={`block transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                              <IconChevronRight size={16} />
                            </span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              {group.invoiceNumber ? (
                                <span className="font-mono-data text-xs font-bold text-green-800 bg-green-100 border border-green-200 px-2.5 py-0.5 rounded-md">
                                  {group.invoiceNumber}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-gray-500 bg-gray-200/70 px-2.5 py-0.5 rounded-md">
                                  Single Entry
                                </span>
                              )}
                              <span className="text-sm font-bold text-gray-900">{group.supplier || "Supplier Not Specified"}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                              <span><IconCalendar size={12} className="inline mr-1" />{formatDate(group.purchaseDate)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs text-gray-600 font-medium pl-7 sm:pl-0">
                          <div>
                            Products: <span className="font-mono-data font-bold text-gray-900">{group.totalItemsCount}</span>
                          </div>
                          <div>
                            Total Qty: <span className="font-mono-data font-bold text-gray-900">{group.totalQuantity}</span>
                          </div>
                          <div>
                            Invoice Total: <span className="font-mono-data font-bold text-green-700 text-sm">{INR(group.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items Table */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-100">
                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 bg-white text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                  <th className="px-5 py-3 text-left">Item Name</th>
                                  <th className="px-5 py-3 text-left">Barcode</th>
                                  <th className="px-5 py-3 text-center">Qty</th>
                                  <th className="px-5 py-3 text-right">Purchase Price</th>
                                  <th className="px-5 py-3 text-right">Selling Price</th>
                                  <th className="px-5 py-3 text-right">MRP</th>
                                  <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 bg-white">
                                {group.items.map((p) => (
                                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-5 py-3.5">
                                      <p className="text-sm font-semibold text-gray-800">{p.itemName}</p>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                      <span className="font-mono-data text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                                        {p.barcode || "—"}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                      <span className="font-mono-data text-sm font-bold text-gray-900">
                                        {p.quantityPurchased ?? "—"}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                      <span className="font-mono-data text-sm font-bold text-gray-900">
                                        {INR(p.purchaseAmount)}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                      <span className="font-mono-data text-sm font-semibold text-gray-800">
                                        {p.sellingPrice !== undefined && p.sellingPrice !== null ? INR(p.sellingPrice) : "—"}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                      <span className="font-mono-data text-sm font-semibold text-gray-700">
                                        {INR(p.mrp)}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => setEditing(p)}
                                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                          title="Edit purchase record"
                                        >
                                          <IconEdit size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(p)}
                                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          title="Delete purchase record"
                                        >
                                          <IconTrash size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="block md:hidden divide-y divide-gray-100 bg-white">
                            {group.items.map((p) => (
                              <div key={p._id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 leading-tight">{p.itemName}</p>
                                    {p.barcode && (
                                      <span className="text-[11px] font-mono-data text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                                        {p.barcode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      onClick={() => setEditing(p)}
                                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center border border-gray-200 bg-white"
                                    >
                                      <IconEdit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p)}
                                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center border border-gray-200 bg-white"
                                    >
                                      <IconTrash size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-gray-50/70 p-2.5 rounded-xl text-xs border border-gray-100">
                                  <div>
                                    <span className="text-gray-400 font-medium block">Qty</span>
                                    <span className="font-mono-data font-bold text-gray-900">{p.quantityPurchased ?? "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 font-medium block">Purchase Amount</span>
                                    <span className="font-mono-data font-bold text-gray-900">{INR(p.purchaseAmount)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 font-medium block">Selling Price</span>
                                    <span className="font-mono-data font-semibold text-gray-800">
                                      {p.sellingPrice !== undefined && p.sellingPrice !== null ? INR(p.sellingPrice) : "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 font-medium block">MRP</span>
                                    <span className="font-mono-data font-semibold text-gray-700">{INR(p.mrp)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
