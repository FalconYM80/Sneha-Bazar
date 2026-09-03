import { useState, useEffect } from "react";
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

// ── Add Purchase Modal ────────────────────────────────────────────────────────

function AddPurchaseModal({ 
  onClose, 
  onAdd, 
  productNames 
}: { 
  onClose: () => void; 
  onAdd: (p: Purchase) => void;
  productNames: string[];
}) {
  const [f, setF] = useState({
    itemName: "",
    purchaseAmount: "",
    mrp: "",
    purchaseDate: getLocalDate(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const valid = f.itemName.trim() && f.purchaseAmount && f.mrp;

  const filteredSuggestions = productNames
    .filter(name => name.toLowerCase().includes(f.itemName.toLowerCase()))
    .slice(0, 5);

  const handleSubmit = async () => {
    if (!valid) return;
    
    setSaving(true);
    setError("");
    
    try {
      const response = await api.post("/purchases", {
        itemName: f.itemName.trim(),
        purchaseAmount: Number(f.purchaseAmount),
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
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[520px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Add Purchase</h3>
            <p className="text-xs text-gray-400 mt-0.5">Record a new purchase</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <span className="text-blue-600 mt-0.5 flex-shrink-0"><IconInfo size={14} /></span>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            This record is maintained independently and does not affect inventory.
          </p>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 relative">
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
                {filteredSuggestions.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      set("itemName")(name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <FormField label="Purchase Amount (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.purchaseAmount} onChange={set("purchaseAmount")} />
          </FormField>
          
          <FormField label="MRP (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.mrp} onChange={set("mrp")} />
          </FormField>
          
          <div className="col-span-2">
            <FormField label="Purchase Date">
              <TextInput type="date" value={f.purchaseDate} onChange={set("purchaseDate")} />
            </FormField>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={!valid || saving} className="flex-1">
            {saving ? "Saving..." : "Save Purchase"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Edit Purchase Modal ───────────────────────────────────────────────────────

function EditPurchaseModal({ 
  onClose, 
  onUpdate, 
  purchase,
  productNames 
}: { 
  onClose: () => void; 
  onUpdate: (p: Purchase) => void;
  purchase: Purchase;
  productNames: string[];
}) {
  const [f, setF] = useState({
    itemName: purchase.itemName,
    purchaseAmount: purchase.purchaseAmount.toString(),
    mrp: purchase.mrp.toString(),
    purchaseDate: purchase.purchaseDate.split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const valid = f.itemName.trim() && f.purchaseAmount && f.mrp;

  const filteredSuggestions = productNames
    .filter(name => name.toLowerCase().includes(f.itemName.toLowerCase()))
    .slice(0, 5);

  const handleSubmit = async () => {
    if (!valid) return;
    
    setSaving(true);
    setError("");
    
    try {
      const response = await api.put(`/purchases/${purchase._id}`, {
        ...(f.itemName !== purchase.itemName && { itemName: f.itemName.trim() }),
        ...(f.purchaseAmount !== purchase.purchaseAmount.toString() && { purchaseAmount: Number(f.purchaseAmount) }),
        ...(f.mrp !== purchase.mrp.toString() && { mrp: Number(f.mrp) }),
        ...(f.purchaseDate !== purchase.purchaseDate.split('T')[0] && { purchaseDate: f.purchaseDate }),
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
      <ModalCard className="w-[520px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Edit Purchase</h3>
            <p className="text-xs text-gray-400 mt-0.5">Update purchase details</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 relative">
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
                {filteredSuggestions.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      set("itemName")(name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <FormField label="Purchase Amount (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.purchaseAmount} onChange={set("purchaseAmount")} />
          </FormField>
          
          <FormField label="MRP (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.mrp} onChange={set("mrp")} />
          </FormField>
          
          <div className="col-span-2">
            <FormField label="Purchase Date">
              <TextInput type="date" value={f.purchaseDate} onChange={set("purchaseDate")} />
            </FormField>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={!valid || saving} className="flex-1">
            {saving ? "Saving..." : "Update Purchase"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [productNames, setProductNames] = useState<string[]>([]);
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

  const fetchProductNames = async () => {
    try {
      const response = await api.get("/products");
      const productsData = Array.isArray(response) ? response : response.data || [];
      const names = productsData.map((p: Product) => p.name);
      setProductNames(names);
    } catch (err) {
      console.error("Failed to load product names for autocomplete:", err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchProductNames();
  }, []);

  const filtered = purchases.filter(
    (p) => p.itemName.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate summary cards
  const totalPurchases = purchases.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPurchases = purchases.filter((p) => {
    const date = new Date(p.purchaseDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.purchaseAmount, 0);

  const handleDelete = async (purchase: Purchase) => {
    if (!window.confirm(`Are you sure you want to delete this purchase record for "${purchase.itemName}"?`)) {
      return;
    }

    try {
      await api.delete(`/purchases/${purchase._id}`);
      await fetchPurchases();
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
              onAdd={(p) => setPurchases((prev) => [p, ...prev])}
              productNames={productNames}
            />
          )}
          {editing && (
            <EditPurchaseModal
              onClose={() => setEditing(null)}
              onUpdate={(updated) => {
                setPurchases((prev) => prev.map((p) => p._id === updated._id ? updated : p));
              }}
              purchase={editing}
              productNames={productNames}
            />
          )}

          <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Purchases</h2>
                <p className="text-sm text-gray-500 mt-1">Track purchase records</p>
              </div>
              <Btn variant="primary" onClick={() => setAdding(true)}>
                <IconPlus size={15} /> Add Purchase
              </Btn>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Purchases", value: totalPurchases, sub: "all time", mono: true },
                { label: "This Month", value: thisMonthPurchases, sub: "current month", mono: true },
                { label: "Total Purchase Amount", value: INR(totalPurchaseAmount), sub: "all purchases", mono: true },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white rounded-2xl px-5 py-4 card-shadow border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono-data mt-1.5">{value}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-4 flex gap-3 items-center">
              <div className="w-72">
                <SearchInput placeholder="Search by item name…" value={search} onChange={setSearch} />
              </div>
              <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white">
                <IconCalendar size={14} />
                Date Filter
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Date", "Item Name", "Purchase Amount", "MRP", "Actions"].map((h) => (
                        <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">No purchases found.</td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-500 font-medium">{formatDate(p.purchaseDate)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-800">{p.itemName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono-data text-sm font-bold text-gray-900">{INR(p.purchaseAmount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono-data text-sm font-semibold text-gray-700">{INR(p.mrp)}</span>
                          </td>
                          <td className="px-6 py-4">
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
              <div className="px-6 py-3.5 border-t border-gray-50">
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
