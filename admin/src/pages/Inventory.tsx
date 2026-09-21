import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { UIProduct, StockStatus } from "../types";
import {
  StockStatusBadge, ModalBackdrop, ModalCard, FormField, TextInput,
  Btn, SearchInput, IconPlus, IconMinus, IconX, IconTrash, IconEdit,
} from "../components/ui";
import { getStockStatus, loadSettings } from "../settings";

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
  barcode?: string;
  name: string;
  company?: string;
  category: BackendCategory;
  sellingPrice: number;
  mrp?: number;
  stockQuantity: number;
  unit?: string;
  image?: string;
  imagePublicId?: string;
  isAvailable: boolean;
  isActive: boolean;
}

const mapProduct = (product: BackendProduct, threshold: number): UIProduct => ({
  id: product._id,
  name: product.name,
  category: product.category?.name || "Uncategorized",
  categoryId: product.category?._id || "",
  price: product.sellingPrice,
  mrp: product.mrp,
  unit: product.unit || "pack",
  stock: product.stockQuantity,
  stockUnit: product.unit || "packs",
  status: getStockStatus(product.stockQuantity, threshold),
  emoji: "📦",
  itemCode: product.itemCode,
  barcode: product.barcode,
  company: product.company,
  image: product.image,
  imagePublicId: product.imagePublicId,
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
      <ModalCard className="w-[360px] max-w-[calc(100vw-32px)]">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Update Stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span>{product.emoji}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{product.category}</p>
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
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setDelta((d) => d - 1)}
                className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0"
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
                className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-all active:scale-95 flex-shrink-0"
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
          <div className="px-5 sm:px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div className="px-5 sm:px-6 pb-5 flex gap-3">
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
  const [f, setF] = useState({ 
    name: "", 
    category: "", 
    sellingPrice: "", 
    mrp: "", 
    stockQuantity: "", 
    unit: "pack", 
    itemCode: "", 
    barcode: "",
    company: "" 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const STOCK_UNITS = ["pack", "pcs", "kg", "g", "litre", "ml", "packet", "box", "bottle", "dozen"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError("Only image files (jpeg, jpg, png, gif, webp) are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async () => {
    if (!f.name.trim() || !f.category || f.sellingPrice === "" || f.stockQuantity === "" || !f.unit) {
      setError("Please fill in all required fields");
      return;
    }

    const sellingPriceNum = parseFloat(f.sellingPrice);
    const mrpNum = f.mrp ? parseFloat(f.mrp) : undefined;

    if (sellingPriceNum < 0 || Number(f.stockQuantity) < 0) {
      setError("Price and stock cannot be negative");
      return;
    }

    if (sellingPriceNum === 0) {
      setError("Selling price must be greater than 0");
      return;
    }

    if (mrpNum !== undefined && mrpNum < 0) {
      setError("MRP cannot be negative");
      return;
    }

    if (mrpNum !== undefined && sellingPriceNum > mrpNum) {
      setError("Selling price cannot be greater than MRP");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", f.name);
      formData.append("category", f.category);
      formData.append("sellingPrice", f.sellingPrice);
      formData.append("stockQuantity", f.stockQuantity);
      formData.append("unit", f.unit);
      
      if (f.mrp) formData.append("mrp", f.mrp);
      if (f.itemCode) formData.append("itemCode", f.itemCode.trim());
      if (f.barcode) formData.append("barcode", f.barcode.trim());
      if (f.company) formData.append("company", f.company);
      if (imageFile) formData.append("image", imageFile);

      await api.postFormData("/products", formData);
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
      <ModalCard className="w-[520px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-bold text-gray-900">Add New Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div className="sm:col-span-2">
            <FormField label="Product Name *">
              <TextInput placeholder="e.g. Tata Salt 1kg" value={f.name} onChange={set("name")} />
            </FormField>
          </div>
          <FormField label="Category *">
            <select
              value={f.category}
              onChange={(e) => set("category")(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
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
          <FormField label="Selling Price (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.sellingPrice} onChange={set("sellingPrice")} />
          </FormField>
          <FormField label="MRP (₹)">
            <TextInput placeholder="0.00" type="number" value={f.mrp} onChange={set("mrp")} />
          </FormField>
          <FormField label="Initial Stock *">
            <TextInput placeholder="0" type="number" value={f.stockQuantity} onChange={set("stockQuantity")} />
          </FormField>
          <FormField label="Stock Unit *">
            <select
              value={f.unit}
              onChange={(e) => set("unit")(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select unit</option>
              {STOCK_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Barcode">
            <TextInput placeholder="e.g. 8901234567890" value={f.barcode} onChange={set("barcode")} />
          </FormField>
          <FormField label="Item Code / SKU">
            <TextInput placeholder="e.g. TATA-001" value={f.itemCode} onChange={set("itemCode")} />
          </FormField>
          <FormField label="Brand / Company">
            <TextInput placeholder="e.g. Tata" value={f.company} onChange={set("company")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Product Image">
              <div className="space-y-3">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="cursor-pointer block"
                    >
                      <p className="text-xs text-gray-500 mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 5MB)</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                )}
              </div>
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
    sellingPrice: product.price.toString(), 
    mrp: product.mrp ? product.mrp.toString() : "", 
    stockQuantity: product.stock.toString(), 
    unit: product.unit, 
    itemCode: product.itemCode || "", 
    barcode: product.barcode || "",
    company: product.company || "" 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product.image || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const STOCK_UNITS = ["pack", "pcs", "kg", "g", "litre", "ml", "packet", "box", "bottle", "dozen"];

  useEffect(() => {
    setF({
      name: product.name,
      category: product.categoryId,
      sellingPrice: product.price.toString(),
      mrp: product.mrp ? product.mrp.toString() : "",
      stockQuantity: product.stock.toString(),
      unit: product.unit || "pack",
      itemCode: product.itemCode || "",
      barcode: product.barcode || "",
      company: product.company || "",
    });
    setImagePreview(product.image || "");
    setImageFile(null);
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError("Only image files (jpeg, jpg, png, gif, webp) are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async () => {
    if (!f.name.trim() || !f.category || f.sellingPrice === "" || f.stockQuantity === "" || !f.unit) {
      setError("Please fill in all required fields");
      return;
    }

    const sellingPriceNum = parseFloat(f.sellingPrice);
    const mrpNum = f.mrp ? parseFloat(f.mrp) : undefined;

    if (sellingPriceNum < 0 || Number(f.stockQuantity) < 0) {
      setError("Price and stock cannot be negative");
      return;
    }

    if (sellingPriceNum === 0) {
      setError("Selling price must be greater than 0");
      return;
    }

    if (mrpNum !== undefined && mrpNum < 0) {
      setError("MRP cannot be negative");
      return;
    }

    if (mrpNum !== undefined && sellingPriceNum > mrpNum) {
      setError("Selling price cannot be greater than MRP");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", f.name);
      formData.append("category", f.category);
      formData.append("sellingPrice", f.sellingPrice);
      formData.append("stockQuantity", f.stockQuantity);
      formData.append("unit", f.unit);
      
      if (f.mrp) formData.append("mrp", f.mrp);
      if (f.itemCode !== undefined) formData.append("itemCode", f.itemCode.trim());
      if (f.barcode !== undefined) formData.append("barcode", f.barcode.trim());
      if (f.company !== undefined) formData.append("company", f.company.trim());
      if (imageFile) formData.append("image", imageFile);

      await api.putFormData(`/products/${product.id}`, formData);
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
      <ModalCard className="w-[520px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-bold text-gray-900">Edit Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div className="sm:col-span-2">
            <FormField label="Product Name *">
              <TextInput placeholder="e.g. Tata Salt 1kg" value={f.name} onChange={set("name")} />
            </FormField>
          </div>
          <FormField label="Category *">
            <select
              value={f.category}
              onChange={(e) => set("category")(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
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
          <FormField label="Selling Price (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.sellingPrice} onChange={set("sellingPrice")} />
          </FormField>
          <FormField label="MRP (₹)">
            <TextInput placeholder="0.00" type="number" value={f.mrp} onChange={set("mrp")} />
          </FormField>
          <FormField label="Stock *">
            <TextInput placeholder="0" type="number" value={f.stockQuantity} onChange={set("stockQuantity")} />
          </FormField>
          <FormField label="Stock Unit *">
            <select
              value={f.unit}
              onChange={(e) => set("unit")(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 bg-white cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select unit</option>
              {STOCK_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Barcode">
            <TextInput placeholder="e.g. 8901234567890" value={f.barcode} onChange={set("barcode")} />
          </FormField>
          <FormField label="Item Code / SKU">
            <TextInput placeholder="e.g. TATA-001" value={f.itemCode} onChange={set("itemCode")} />
          </FormField>
          <FormField label="Brand / Company">
            <TextInput placeholder="e.g. Tata" value={f.company} onChange={set("company")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Product Image">
              <div className="space-y-3">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      id="edit-product-image-upload"
                    />
                    <label
                      htmlFor="edit-product-image-upload"
                      className="cursor-pointer block"
                    >
                      <p className="text-xs text-gray-500 mb-1">Click to upload new image</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 5MB)</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                )}
              </div>
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [filter, setFilter] = useState<"All Status" | StockStatus>("All Status");
  const [updating, setUpdating] = useState<UIProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UIProduct | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchInventoryData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('admin', 'true');
      
      if (search) params.append('search', search);
      if (cat !== "All") params.append('category', cat);
      if (filter !== "All Status") params.append('stockStatus', filter);
      
      const { lowStockThreshold } = loadSettings();
      params.append('lowStockThreshold', lowStockThreshold.toString());

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get("/categories")
      ]);
      
      const response = productsResponse as any;
      const productsData = Array.isArray(response) ? response : response.data || [];
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any).data || [];

      const mappedProducts = productsData.map((p: BackendProduct) => mapProduct(p, lowStockThreshold));
      setProducts(mappedProducts);
      setCategories(categoriesData);

      if (!Array.isArray(response) && response.pagination) {
        setPagination(response.pagination);
      } else {
        setPagination({
          total: productsData.length,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchInventoryData();
  }, [page, limit, search, cat, filter]);

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

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleCategoryChange = (value: string) => {
    setCat(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {updating && <UpdateStockModal product={updating} onClose={() => setUpdating(null)} onSave={handleSaveStock} />}
      {adding && <AddProductModal onClose={() => setAdding(false)} categories={categories} onSuccess={fetchInventoryData} />}
      {editing && <EditProductModal onClose={() => setEditing(null)} product={editing} categories={categories} onSuccess={fetchInventoryData} />}

      <div className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage your products and stock levels</p>
          </div>
          <Btn variant="primary" onClick={() => setAdding(true)} className="self-start sm:self-auto">
            <IconPlus size={15} /> Add Product
          </Btn>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Products", value: pagination.total, color: "text-gray-900" },
            { label: "Low Stock", value: products.filter((p) => p.status === "Low Stock").length, color: "text-amber-600" },
            { label: "Out of Stock", value: products.filter((p) => p.status === "Out of Stock").length, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 card-shadow border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold font-mono-data mt-1 sm:mt-1.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
            <div className="w-full sm:w-64">
              <SearchInput placeholder="Search products…" value={searchInput} onChange={handleSearchChange} />
            </div>

            {/* Category pills (horizontal scroll on small screens) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap flex-nowrap w-full sm:w-auto -mx-1 px-1">
              <button
                onClick={() => handleCategoryChange("All")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  cat === "All" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleCategoryChange(c._id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                    cat === c._id ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-auto sm:ml-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-xl px-3 py-2 text-gray-600 outline-none bg-white cursor-pointer focus:border-green-400"
                style={{ fontFamily: "inherit" }}
              >
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Product List Container */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden">
          
          {/* Mobile Card List (Visible on < md) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">Loading products...</div>
            ) : error ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button onClick={fetchInventoryData} className="text-sm font-semibold text-green-700 hover:text-green-800">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">No products match your filters.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{p.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{p.name}</p>
                        <StockStatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                        {p.itemCode && (
                          <span className="text-[11px] text-gray-400 font-mono-data truncate">
                            {p.itemCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-sm bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block leading-none mb-1">Price</span>
                      <span className="font-mono-data font-bold text-gray-900">{INR(p.price)}</span>
                      <span className="text-xs text-gray-400">/{p.unit}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">{INR(p.mrp)}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block leading-none mb-1">Stock Level</span>
                      <span className={`font-mono-data font-semibold text-sm ${
                        p.status === "Out of Stock" ? "text-red-600" : p.status === "Low Stock" ? "text-amber-700" : "text-gray-800"
                      }`}>
                        {p.stock} {p.stockUnit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setUpdating(p)}
                      className="flex-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 py-2.5 px-3 rounded-xl transition-colors text-center border border-green-200"
                    >
                      Update Stock
                    </button>
                    <button
                      onClick={() => setEditing(p)}
                      aria-label="Edit product"
                      className="w-10 h-10 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 flex items-center justify-center transition-colors"
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      aria-label="Delete product"
                      className="w-10 h-10 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 flex items-center justify-center transition-colors"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (Visible on >= md: exactly preserved) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Product", "Barcode", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-sm text-red-600 mb-3">{error}</p>
                      <button onClick={fetchInventoryData} className="text-sm font-semibold text-green-700 hover:text-green-800">
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">No products match your filters.</td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{p.emoji}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono-data">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono-data text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                          {p.barcode || "—"}
                        </span>
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

          {/* Pagination bar */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <p className="text-xs text-gray-400 font-medium text-center sm:text-left">
              Showing <span className="text-gray-700 font-semibold">{Math.min((page - 1) * limit + 1, pagination.total)}</span>–<span className="text-gray-700 font-semibold">{Math.min(page * limit, pagination.total)}</span> of <span className="text-gray-700 font-semibold">{pagination.total.toLocaleString()}</span> products
            </p>
            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 outline-none bg-white cursor-pointer focus:border-green-400"
                style={{ fontFamily: "inherit" }}
              >
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                    page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  ←
                </button>
                <button
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold bg-green-600 text-white flex items-center justify-center"
                >
                  {page}
                </button>
                {pagination.totalPages > 1 && page < pagination.totalPages && (
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    {page + 1}
                  </button>
                )}
                {pagination.totalPages > 2 && page < pagination.totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(page + 2)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    {page + 2}
                  </button>
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasMore}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                    !pagination.hasMore ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
