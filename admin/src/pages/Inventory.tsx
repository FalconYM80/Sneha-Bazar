import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { UIProduct, StockStatus } from "../types";
import {
  StockStatusBadge, ModalBackdrop, ModalCard, FormField, TextInput,
  Btn, SearchInput, IconPlus, IconMinus, IconX, IconTrash, IconEdit,
} from "../components/ui";

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

const FILTERS: Array<"All Status" | StockStatus> = ["All Status", "In Stock", "Low Stock", "Out of Stock"];

interface BackendCategory {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

interface BackendProduct {
  _id: string;
  itemCode?: string;
  name: string;
  company?: string;
  category: BackendCategory;
  sellingPrice: number;
  mrp?: number;
  stockQuantity: number;
  unit?: string;
  image?: string;
  isAvailable: boolean;
  isActive: boolean;
}

const getStockStatus = (stock: number): StockStatus => {
  if (stock === 0) return "Out of Stock";
  if (stock <= 8) return "Low Stock";
  return "In Stock";
};

const mapProduct = (product: BackendProduct): UIProduct => ({
  id: product._id,
  name: product.name,
  category: product.category?.name || "Uncategorized",
  categoryId: product.category?._id || "",
  price: product.sellingPrice,
  unit: product.unit || "unit",
  stock: product.stockQuantity,
  stockUnit: product.unit || "units",
  status: getStockStatus(product.stockQuantity),
  emoji: "📦",
});



// ── Update Stock Modal ────────────────────────────────────────────────────────

function UpdateStockModal({
  product,
  onClose,
  onSave,
}: {
  product: UIProduct;
  onClose: () => void;
  onSave: (id: string, newStock: number) => Promise<void>;
}) {
  const [delta, setDelta] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const newStock = Math.max(0, product.stock + delta);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(product.id, newStock);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[360px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Update Stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-3xl">{product.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            </div>
          </div>

          {/* Current stock */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900 font-mono-data">{product.stock} <span className="text-base text-gray-400 font-normal">{product.stockUnit}</span></p>
          </div>

          {/* Adjustment */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2.5">Quantity Adjustment</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDelta((d) => d - 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all active:scale-95"
              >
                <IconMinus size={16} />
              </button>
              <div className="flex-1 text-center py-2 bg-gray-50 rounded-xl border border-gray-100">
                <span className={`text-2xl font-bold font-mono-data ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              </div>
              <button
                onClick={() => setDelta((d) => d + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-all active:scale-95"
              >
                <IconPlus size={16} />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-green-700">New Stock Preview</p>
            <p className="text-base font-bold text-green-800 font-mono-data">{newStock} {product.stockUnit}</p>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} className="flex-1" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Add Product Modal ─────────────────────────────────────────────────────────

function AddProductModal({ 
  onClose, 
  categories, 
  onSuccess 
}: { 
  onClose: () => void; 
  categories: BackendCategory[];
  onSuccess: () => void;
}) {
  const [f, setF] = useState({ name: "", category: "", price: "", stock: "", unit: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!f.name.trim() || !f.category || f.price === "" || f.stock === "") {
      setError("Please fill in all required fields");
      return;
    }

    if (Number(f.price) < 0 || Number(f.stock) < 0) {
      setError("Price and stock cannot be negative");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/products", {
        name: f.name,
        category: f.category,
        sellingPrice: parseFloat(f.price),
        stockQuantity: parseInt(f.stock),
        unit: f.unit || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[480px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Add New Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Product Name *">
              <TextInput placeholder="e.g. Tata Salt 1kg" value={f.name} onChange={set("name")} />
            </FormField>
          </div>
          <FormField label="Category *">
            <select
              value={f.category}
              onChange={(e) => set("category")(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Price (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.price} onChange={set("price")} />
          </FormField>
          <FormField label="Initial Stock *">
            <TextInput placeholder="0" type="number" value={f.stock} onChange={set("stock")} />
          </FormField>
          <FormField label="Stock Unit">
            <TextInput placeholder="kg, packs, bottles…" value={f.unit} onChange={set("unit")} />
          </FormField>
        </div>
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}
        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} className="flex-1" disabled={saving}>
            {saving ? "Adding..." : "Add Product"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Edit Product Modal ────────────────────────────────────────────────────────

function EditProductModal({ 
  onClose, 
  product, 
  categories, 
  onSuccess 
}: { 
  onClose: () => void; 
  product: UIProduct;
  categories: BackendCategory[];
  onSuccess: () => void;
}) {
  const [f, setF] = useState({ 
    name: product.name, 
    category: product.categoryId, 
    price: product.price.toString(), 
    stock: product.stock.toString(), 
    unit: product.unit 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  // Sync form when product changes
  useEffect(() => {
    setF({
      name: product.name,
      category: product.categoryId,
      price: product.price.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
    });
  }, [product]);

  const handleSubmit = async () => {
    if (!f.name.trim() || !f.category || f.price === "" || f.stock === "") {
      setError("Please fill in all required fields");
      return;
    }

    if (Number(f.price) < 0 || Number(f.stock) < 0) {
      setError("Price and stock cannot be negative");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.put(`/products/${product.id}`, {
        name: f.name,
        category: f.category,
        sellingPrice: parseFloat(f.price),
        stockQuantity: parseInt(f.stock),
        unit: f.unit || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[480px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Edit Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Product Name *">
              <TextInput placeholder="e.g. Tata Salt 1kg" value={f.name} onChange={set("name")} />
            </FormField>
          </div>
          <FormField label="Category *">
            <select
              value={f.category}
              onChange={(e) => set("category")(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Price (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.price} onChange={set("price")} />
          </FormField>
          <FormField label="Stock *">
            <TextInput placeholder="0" type="number" value={f.stock} onChange={set("stock")} />
          </FormField>
          <FormField label="Stock Unit">
            <TextInput placeholder="kg, packs, bottles…" value={f.unit} onChange={set("unit")} />
          </FormField>
        </div>
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}
        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} className="flex-1" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [filter, setFilter] = useState<"All Status" | StockStatus>("All Status");
  const [updating, setUpdating] = useState<UIProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UIProduct | null>(null);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);
      
      // Handle API response structure - check if it's wrapped in ApiResponse or direct
      const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.data || [];
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || [];
      
      const mappedProducts = productsData.map(mapProduct);
      setProducts(mappedProducts);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleSaveStock = async (id: string, newStock: number) => {
    await api.put(`/products/${id}`, { stockQuantity: newStock });
    await fetchInventoryData();
  };

  const handleDelete = async (product: UIProduct) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/products/${product.id}`);
      await fetchInventoryData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const visible = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "All" || p.categoryId === cat;
    const mf = filter === "All Status" || p.status === filter;
    return ms && mc && mf;
  });

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-500">Loading inventory...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={fetchInventoryData} className="text-sm font-semibold text-green-700 hover:text-green-800">
              Retry
            </button>
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          {updating && <UpdateStockModal product={updating} onClose={() => setUpdating(null)} onSave={handleSaveStock} />}
          {adding && <AddProductModal onClose={() => setAdding(false)} categories={categories} onSuccess={fetchInventoryData} />}
          {editing && <EditProductModal onClose={() => setEditing(null)} product={editing} categories={categories} onSuccess={fetchInventoryData} />}

          <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your products and stock levels</p>
          </div>
          <Btn variant="primary" onClick={() => setAdding(true)}>
            <IconPlus size={15} /> Add Product
          </Btn>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Products", value: products.length, color: "text-gray-900" },
            { label: "Low Stock", value: products.filter((p) => p.status === "Low Stock").length, color: "text-amber-600" },
            { label: "Out of Stock", value: products.filter((p) => p.status === "Out of Stock").length, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl px-5 py-4 card-shadow border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold font-mono-data mt-1.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="w-64">
              <SearchInput placeholder="Search products…" value={search} onChange={setSearch} />
            </div>

            {/* Category pills */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setCat("All")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  cat === "All" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCat(c._id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    cat === c._id ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-sm font-medium border border-gray-200 rounded-xl px-3 py-2 text-gray-600 outline-none bg-white cursor-pointer focus:border-green-400"
                style={{ fontFamily: "inherit" }}
              >
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">No products match your filters.</td>
                  </tr>
                ) : (
                  visible.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                            {p.emoji}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono-data">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono-data text-sm font-semibold text-gray-800">{INR(p.price)}</span>
                        <span className="text-xs text-gray-400">/{p.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.status === "Out of Stock" ? "bg-red-400" : p.status === "Low Stock" ? "bg-amber-400" : "bg-green-500"}`}
                              style={{ width: p.status === "Out of Stock" ? "4%" : p.status === "Low Stock" ? "20%" : "75%" }}
                            />
                          </div>
                          <span className={`font-mono-data text-sm font-semibold ${
                            p.status === "Out of Stock" ? "text-red-600" : p.status === "Low Stock" ? "text-amber-700" : "text-gray-800"
                          }`}>
                            {p.stock} <span className="font-normal text-xs text-gray-400">{p.stockUnit}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StockStatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setUpdating(p)}
                            className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Update Stock
                          </button>
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
          <div className="px-6 py-3.5 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="text-gray-700 font-semibold">{visible.length}</span> of {products.length} products
            </p>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    n === 1 ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
