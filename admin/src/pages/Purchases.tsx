import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import type { Purchase, Product } from "../types";
import {
  ModalBackdrop, ModalCard, FormField, TextInput,
  Btn, SearchInput, IconPlus, IconX, IconTrash, IconEdit, IconInfo, IconCalendar,
} from "../components/ui";

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

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
            {saving ? "Saving..." : "Assign & Select"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Add Purchase Modal ────────────────────────────────────────────────────────

function AddPurchaseModal({ 
  onClose, 
  onAdd, 
  allProducts 
}: { 
  onClose: () => void; 
  onAdd: (p: Purchase) => void;
  allProducts: Product[];
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    itemName: "",
    supplier: "",
    quantityPurchased: "1",
    purchaseAmount: "",
    sellingPrice: "",
    mrp: "",
    purchaseDate: getLocalDate(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    // Focus barcode input on open
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setLookingUp(true);
    setError("");
    setUnknownBarcode(null);

    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      const matchedProduct: Product = res.data;

      setSelectedProduct(matchedProduct);
      setBarcodeInput(matchedProduct.barcode || code);
      setF((prev) => ({
        ...prev,
        itemName: matchedProduct.name,
        sellingPrice: matchedProduct.sellingPrice.toString(),
        mrp: matchedProduct.mrp ? matchedProduct.mrp.toString() : matchedProduct.sellingPrice.toString(),
      }));
    } catch {
      setSelectedProduct(null);
      setUnknownBarcode(code);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setBarcodeInput(prod.barcode || "");
    setUnknownBarcode(null);
    setF((prev) => ({
      ...prev,
      itemName: prod.name,
      sellingPrice: prod.sellingPrice.toString(),
      mrp: prod.mrp ? prod.mrp.toString() : prod.sellingPrice.toString(),
    }));
    setShowSuggestions(false);
  };

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
      const response = await api.post("/purchases", {
        product: selectedProduct ? selectedProduct._id : undefined,
        barcode: barcodeInput.trim() || undefined,
        itemName: f.itemName.trim(),
        supplier: f.supplier.trim(),
        quantityPurchased: qty,
        purchaseAmount: Number(f.purchaseAmount),
        sellingPrice: Number(f.sellingPrice),
        mrp: Number(f.mrp),
        purchaseDate: f.purchaseDate,
      });
      
      onAdd(response.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <ModalCard className="w-[540px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Add Purchase</h3>
              <p className="text-xs text-gray-400 mt-0.5">Scan barcode or enter purchase details</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <IconX size={15} />
            </button>
          </div>

          {/* Info banner */}
          <div className="mx-4 sm:mx-6 mt-4 sm:mt-5 flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <span className="text-green-600 mt-0.5 flex-shrink-0"><IconInfo size={14} /></span>
            <p className="text-xs text-green-700 font-medium leading-relaxed">
              Saving this purchase automatically increases product stock in inventory.
            </p>
          </div>

          <div className="px-4 sm:px-6 py-4 space-y-4">
            {/* Barcode Scanner Input Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Scan / Enter Barcode</span>
                <span className="text-[11px] text-gray-400 font-normal">Supports USB Scanner</span>
              </label>
              <div className="flex gap-2">
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
                  className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono-data text-gray-900 outline-none focus:border-green-500 bg-white"
                />
                <Btn
                  variant="outline"
                  onClick={() => handleBarcodeLookup()}
                  disabled={lookingUp || !barcodeInput.trim()}
                  className="px-4 text-xs font-semibold"
                >
                  {lookingUp ? "Searching..." : "Lookup"}
                </Btn>
              </div>

              {/* Matched Product Card */}
              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200 mt-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                    {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-green-800 truncate">{selectedProduct.name}</p>
                    <p className="text-[11px] text-gray-500">
                      Current Stock: <span className="font-semibold text-gray-800">{selectedProduct.stockQuantity}</span> | Selling Price: ₹{selectedProduct.sellingPrice}
                    </p>
                  </div>
                </div>
              )}

              {/* Unknown Barcode Alert State */}
              {unknownBarcode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mt-2">
                  <p className="text-xs font-semibold text-amber-800">
                    Product not found for barcode: <span className="font-mono-data font-bold">{unknownBarcode}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    className="text-xs font-bold text-green-700 hover:text-green-800 bg-white border border-green-200 px-3 py-1.5 rounded-lg transition-colors inline-block"
                  >
                    + Assign Barcode to Existing Product
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                
                {/* Autocomplete suggestions */}
                {showSuggestions && f.itemName && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((prod) => (
                      <button
                        key={prod._id}
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{prod.name}</span>
                        <span className="text-xs text-gray-400 font-mono-data ml-2">Stock: {prod.stockQuantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <FormField label="Supplier *">
                  <TextInput 
                    placeholder="e.g. ABC Distributors" 
                    value={f.supplier} 
                    onChange={set("supplier")} 
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
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
              </div>
              
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
          </div>

          {error && (
            <div className="px-5 sm:px-6 pb-2">
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            </div>
          )}

          <div className="px-5 sm:px-6 pb-5 flex gap-3 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
            <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit} disabled={!valid || saving} className="flex-1">
              {saving ? "Saving..." : "Save Purchase"}
            </Btn>
          </div>
        </ModalCard>
      </ModalBackdrop>

      {/* Assign Barcode Modal */}
      {showAssignModal && unknownBarcode && (
        <AssignBarcodeModal
          scannedBarcode={unknownBarcode}
          allProducts={allProducts}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(updatedProduct) => {
            handleSelectProduct(updatedProduct);
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
  onUpdate: (p: Purchase) => void;
  purchase: Purchase;
  allProducts: Product[];
}) {
  const initialProductId = typeof purchase.product === "object" && purchase.product ? purchase.product._id : (typeof purchase.product === "string" ? purchase.product : "");
  
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [f, setF] = useState({
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
      const response = await api.put(`/purchases/${purchase._id}`, {
        product: selectedProductId || undefined,
        barcode: f.barcode.trim() || undefined,
        itemName: f.itemName.trim(),
        supplier: f.supplier.trim(),
        quantityPurchased: qty,
        purchaseAmount: Number(f.purchaseAmount),
        sellingPrice: Number(f.sellingPrice),
        mrp: Number(f.mrp),
        purchaseDate: f.purchaseDate,
      });
      
      onUpdate(response.data);
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
            <h3 className="text-sm font-bold text-gray-900">Edit Purchase</h3>
            <p className="text-xs text-gray-400 mt-0.5">Update purchase details and inventory stock difference</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
            
            {/* Autocomplete suggestions */}
            {showSuggestions && f.itemName && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
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
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
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

          <FormField label="Supplier *">
            <TextInput 
              placeholder="e.g. ABC Distributors" 
              value={f.supplier} 
              onChange={set("supplier")} 
            />
          </FormField>

          <div className="sm:col-span-2">
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
          </div>
          
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/purchases");
      const purchasesData = Array.isArray(response) ? response : response.data || [];
      setPurchases(purchasesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products?admin=true&limit=100");
      const productsData = Array.isArray(response) ? response : response.data || [];
      setAllProducts(productsData);
    } catch (err) {
      console.error("Failed to load products for dropdown:", err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, []);

  const filtered = purchases.filter((p) => {
    const term = search.toLowerCase();
    const nameMatch = p.itemName.toLowerCase().includes(term);
    const supplierMatch = p.supplier ? p.supplier.toLowerCase().includes(term) : false;
    const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(term) : false;
    return nameMatch || supplierMatch || barcodeMatch;
  });

  const totalPurchases = purchases.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPurchases = purchases.filter((p) => {
    const date = new Date(p.purchaseDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.purchaseAmount, 0);

  const handleDelete = async (purchase: Purchase) => {
    if (!window.confirm(`Are you sure you want to delete this purchase record for "${purchase.itemName}"? This will reverse its stock contribution.`)) {
      return;
    }

    try {
      await api.delete(`/purchases/${purchase._id}`);
      await fetchPurchases();
      await fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete purchase");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-500">Loading purchases...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={fetchPurchases} className="text-sm font-semibold text-green-700 hover:text-green-800">
              Retry
            </button>
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          {adding && (
            <AddPurchaseModal
              onClose={() => setAdding(false)}
              onAdd={() => {
                fetchPurchases();
                fetchProducts();
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
              }}
              purchase={editing}
              allProducts={allProducts}
            />
          )}

          <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-4 sm:space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchases</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Track purchase records and auto-update inventory stock</p>
              </div>
              <Btn variant="primary" onClick={() => setAdding(true)} className="self-start sm:self-auto">
                <IconPlus size={15} /> Add Purchase
              </Btn>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Total Purchases", value: totalPurchases, sub: "all time" },
                { label: "This Month", value: thisMonthPurchases, sub: "current month" },
                { label: "Total Purchase Amount", value: INR(totalPurchaseAmount), sub: "all purchases" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 card-shadow border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 font-mono-data mt-1 sm:mt-1.5">{value}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="w-full sm:w-80">
                <SearchInput placeholder="Search by item name, supplier, or barcode..." value={search} onChange={setSearch} />
              </div>
              <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors bg-white">
                <IconCalendar size={14} />
                Date Filter
              </button>
            </div>

            {/* Purchases Container */}
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Date", "Item Name", "Barcode", "Supplier", "Qty", "Purchase Amount", "Selling Price", "MRP", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-sm text-gray-400">No purchases found.</td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs text-gray-500 font-medium">{formatDate(p.purchaseDate)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-800">{p.itemName}</p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono-data text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                              {p.barcode || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 font-medium">{p.supplier || "—"}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono-data text-sm font-semibold text-gray-800">{p.quantityPurchased ?? "—"}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono-data text-sm font-bold text-gray-900">{INR(p.purchaseAmount)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono-data text-sm font-semibold text-gray-800">
                              {p.sellingPrice !== undefined && p.sellingPrice !== null ? INR(p.sellingPrice) : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono-data text-sm font-semibold text-gray-700">{INR(p.mrp)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditing(p)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <IconEdit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(p)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-gray-400">No purchases found.</div>
                ) : (
                  filtered.map((p) => (
                    <div key={p._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{p.itemName}</p>
                          <span className="text-xs text-gray-400 font-medium mt-0.5 block">{formatDate(p.purchaseDate)}</span>
                          {p.barcode && (
                            <span className="text-[11px] font-mono-data text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                              {p.barcode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button 
                            onClick={() => setEditing(p)}
                            aria-label="Edit purchase"
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors border border-gray-200 bg-white"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p)}
                            aria-label="Delete purchase"
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors border border-gray-200 bg-white"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-1.5 w-full">
                        <span className="text-gray-400 flex-shrink-0">Supplier:</span>
                        <span className="text-gray-900 font-semibold truncate">{p.supplier || "—"}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                        <div className="min-w-0">
                          <span className="text-xs text-gray-400 font-medium block mb-0.5">Qty</span>
                          <span className="font-mono-data font-bold text-sm text-gray-900 block truncate">
                            {p.quantityPurchased ?? "—"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-400 font-medium block mb-0.5">Purchase Amount</span>
                          <span className="font-mono-data font-bold text-sm text-gray-900 block truncate">
                            {INR(p.purchaseAmount)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-400 font-medium block mb-0.5">Selling Price</span>
                          <span className="font-mono-data font-bold text-sm text-gray-900 block truncate">
                            {p.sellingPrice !== undefined && p.sellingPrice !== null ? INR(p.sellingPrice) : "—"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-400 font-medium block mb-0.5">MRP</span>
                          <span className="font-mono-data font-bold text-sm text-gray-900 block truncate">
                            {INR(p.mrp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 sm:px-6 py-3.5 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-medium">
                  Showing <span className="text-gray-700 font-semibold">{filtered.length}</span> of {purchases.length} records
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
