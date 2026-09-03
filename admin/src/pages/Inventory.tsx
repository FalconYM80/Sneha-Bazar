import { useState } from "react";
import { PRODUCTS } from "../data";
import type { Product, StockStatus } from "../types";
import {
  StockStatusBadge, ModalBackdrop, ModalCard, FormField, TextInput,
  Btn, SearchInput, IconPlus, IconMinus, IconX, IconTrash, IconEdit,
} from "../components/ui";

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

const CATS = ["All", "Staples", "Essentials", "Oils", "Pulses", "Dairy", "Spices", "Snacks", "Personal Care"];
const FILTERS: Array<"All Status" | StockStatus> = ["All Status", "In Stock", "Low Stock", "Out of Stock"];

// ── Update Stock Modal ────────────────────────────────────────────────────────

function UpdateStockModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (id: string, delta: number) => void;
}) {
  const [delta, setDelta] = useState(0);
  const newStock = Math.max(0, product.stock + delta);

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

        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn variant="primary" onClick={() => { onSave(product.id, delta); onClose(); }} className="flex-1">
            Save Changes
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Add Product Modal ─────────────────────────────────────────────────────────

function AddProductModal({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: "", category: "", price: "", stock: "", unit: "" });
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

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
            <TextInput placeholder="e.g. Essentials" value={f.category} onChange={set("category")} />
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
        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn variant="primary" onClick={onClose} className="flex-1">Add Product</Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [products, setProducts] = useState(PRODUCTS);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [filter, setFilter] = useState<"All Status" | StockStatus>("All Status");
  const [updating, setUpdating] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  const visible = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "All" || p.category === cat;
    const mf = filter === "All Status" || p.status === filter;
    return ms && mc && mf;
  });

  const handleSave = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const s = Math.max(0, p.stock + delta);
        const status: StockStatus = s === 0 ? "Out of Stock" : s <= 8 ? "Low Stock" : "In Stock";
        return { ...p, stock: s, status };
      })
    );
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {updating && <UpdateStockModal product={updating} onClose={() => setUpdating(null)} onSave={handleSave} />}
      {adding && <AddProductModal onClose={() => setAdding(false)} />}

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
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    cat === c ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {c}
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
                          <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <IconEdit size={14} />
                          </button>
                          <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
    </div>
  );
}
