import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import type { Product } from "../types";
import {
  FormField, TextInput, Btn, SearchInput, ModalBackdrop, ModalCard,
  IconBarcode, IconArrowLeft, IconTrash, IconX,
} from "../components/ui";

const INR = (n: number) => "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

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

interface PurchaseEntryWorkspaceProps {
  onBack: () => void;
  onSaved: () => void;
}

export default function PurchaseEntryWorkspace({ onBack, onSaved }: PurchaseEntryWorkspaceProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [distributor, setDistributor] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getLocalDate());

  const [barcodeInput, setBarcodeInput] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
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

    // Fetch all products for manual addition / assignment
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products?admin=true&limit=200");
        const prods = Array.isArray(res) ? res : (res as any).data || [];
        setAllProducts(prods);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    fetchProducts();
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

      onSaved();
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
    .slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-5">
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-green-700 transition-colors mb-1.5"
            >
              <IconArrowLeft size={14} /> Back to Purchases
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <IconBarcode size={22} className="text-green-700" /> NEW PURCHASE INVOICE WORKSPACE
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Full-screen dedicated distributor invoice receiving and continuous barcode scanning workspace
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Btn variant="outline" onClick={onBack} disabled={saving}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleSaveInvoice}
              disabled={!isValid || saving}
              className="min-w-[140px]"
            >
              {saving ? "Saving Invoice..." : "Save Purchase"}
            </Btn>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Invoice Details Section */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 card-shadow space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Distributor Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Invoice Number *">
              <TextInput
                placeholder="e.g. INV-4141"
                value={invoiceNumber}
                onChange={setInvoiceNumber}
              />
            </FormField>
            <FormField label="Distributor / Supplier *">
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

        {/* Barcode Scanning Area */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 card-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                SCAN PRODUCTS
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                USB scanner ready. Scan barcodes continuously to add items and build invoice.
              </p>
            </div>

            {/* Manual Product Search */}
            <div className="relative w-full sm:w-80">
              <SearchInput
                placeholder="+ Search & Add Product Manually..."
                value={manualSearch}
                onChange={(v) => {
                  setManualSearch(v);
                  setShowManualDropdown(true);
                }}
              />
              {showManualDropdown && manualSearch && filteredManualProducts.length > 0 && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {filteredManualProducts.map((prod) => (
                    <button
                      key={prod._id}
                      type="button"
                      onClick={() => handleSelectManualProduct(prod)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-green-50 transition-colors flex items-center justify-between"
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

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="[ Scan / Enter Barcode................................ ]"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeLookup();
                  }
                }}
                className="w-full px-4 py-3 border-2 border-green-500/60 rounded-xl text-base font-mono-data text-gray-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 bg-white shadow-sm"
              />
              <span className="absolute right-3 top-3.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 pointer-events-none">
                Scanner Ready
              </span>
            </div>
            <Btn
              variant="outline"
              onClick={() => handleBarcodeLookup()}
              disabled={lookingUp || !barcodeInput.trim()}
              className="px-6 font-semibold"
            >
              {lookingUp ? "Lookup..." : "Lookup"}
            </Btn>
          </div>

          {unknownBarcode && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-amber-900">
                <span className="font-semibold">Product not found for scanned barcode:</span>{" "}
                <span className="font-mono-data font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{unknownBarcode}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="text-xs font-bold text-green-800 hover:text-green-900 bg-white border border-green-300 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
              >
                + Assign Barcode to Existing Product
              </button>
            </div>
          )}
        </div>

        {/* Purchase Items Table Workspace */}
        <div className="bg-white rounded-2xl border border-gray-200/80 card-shadow overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Purchase Items Table
            </h3>
            <span className="text-xs font-bold text-gray-500 font-mono-data">
              {invoiceItems.length} {invoiceItems.length === 1 ? "Product Row" : "Product Rows"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-12 text-center">#</th>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5 w-40">Barcode</th>
                  <th className="px-4 py-3.5 w-32 text-center">Quantity</th>
                  <th className="px-4 py-3.5 w-36 text-right">Purchase Price (₹)</th>
                  <th className="px-4 py-3.5 w-36 text-right">Selling Price (₹)</th>
                  <th className="px-4 py-3.5 w-36 text-right">MRP (₹)</th>
                  <th className="px-4 py-3.5 w-36 text-right">Amount (₹)</th>
                  <th className="px-4 py-3.5 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {invoiceItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                      <p className="text-sm font-semibold text-gray-500 mb-1">Invoice is currently empty</p>
                      <p className="text-xs">Scan product barcodes above to continuously add items to this purchase invoice.</p>
                    </td>
                  </tr>
                ) : (
                  invoiceItems.map((item, index) => {
                    const rowAmount = item.quantity * item.purchaseAmount;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-center font-mono-data font-bold text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden text-sm">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>📦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                              {item.unit && <p className="text-[10px] text-gray-400">Unit: {item.unit}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono-data text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 block truncate text-center font-semibold">
                            {item.barcode || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono-data font-bold text-gray-900 text-center outline-none focus:border-green-500 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchaseAmount}
                            onChange={(e) => updateItemRow(item.id, "purchaseAmount", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono-data text-gray-900 text-right outline-none focus:border-green-500 bg-white font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sellingPrice}
                            onChange={(e) => updateItemRow(item.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono-data text-gray-800 text-right outline-none focus:border-green-500 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.mrp}
                            onChange={(e) => updateItemRow(item.id, "mrp", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono-data text-gray-700 text-right outline-none focus:border-green-500 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono-data font-bold text-gray-900 text-sm">
                          {INR(rowAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove product"
                          >
                            <IconTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Invoice Summary Bar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-10">
          <div className="flex items-center gap-8 text-xs text-gray-600 font-medium">
            <div>
              Items: <span className="font-mono-data font-bold text-gray-900 text-base ml-1">{totalItems}</span>
            </div>
            <div>
              Total Quantity: <span className="font-mono-data font-bold text-gray-900 text-base ml-1">{totalQuantity}</span>
            </div>
            <div>
              Estimated Invoice Total: <span className="font-mono-data font-bold text-green-700 text-lg ml-1">{INR(totalInvoiceAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Btn variant="outline" onClick={onBack} disabled={saving} className="flex-1 sm:flex-initial">
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleSaveInvoice}
              disabled={!isValid || saving}
              className="flex-1 sm:flex-initial min-w-[160px]"
            >
              {saving ? "Saving Invoice..." : "Save Purchase"}
            </Btn>
          </div>
        </div>

      </div>

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
    </div>
  );
}
