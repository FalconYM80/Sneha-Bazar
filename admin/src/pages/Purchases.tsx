import { useState } from "react";
import { PURCHASES } from "../data";
import type { Purchase } from "../types";
import {
  ModalBackdrop, ModalCard, FormField, TextInput, Textarea,
  Btn, SearchInput, IconPlus, IconX, IconTrash, IconEdit, IconInfo, IconCalendar,
} from "../components/ui";

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

// ── Add Purchase Modal ────────────────────────────────────────────────────────

function AddPurchaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Purchase) => void }) {
  const [f, setF] = useState({
    product: "", qty: "", unit: "", cost: "", supplier: "", date: "2026-09-02", notes: "",
  });
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const valid = f.product.trim() && f.qty && f.cost;

  const handleSubmit = () => {
    if (!valid) return;
    onAdd({
      id: `PO-${String(Math.floor(1000 + Math.random() * 8999))}`,
      date: new Date(f.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      product: f.product,
      qty: Number(f.qty),
      unit: f.unit,
      supplier: f.supplier || "Unknown Supplier",
      cost: Number(f.cost),
      notes: f.notes,
    });
    onClose();
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="w-[520px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Add Purchase</h3>
            <p className="text-xs text-gray-400 mt-0.5">Record a new stock purchase from a supplier</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <IconX size={15} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <span className="text-green-600 mt-0.5 flex-shrink-0"><IconInfo size={14} /></span>
          <p className="text-xs text-green-700 font-medium leading-relaxed">
            Saving this purchase will automatically <strong>increase the product&apos;s inventory stock</strong> by the quantity entered.
          </p>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Product Name *">
              <TextInput placeholder="e.g. Aashirvaad Atta (10kg)" value={f.product} onChange={set("product")} />
            </FormField>
          </div>
          <FormField label="Quantity Purchased *">
            <TextInput placeholder="e.g. 20" type="number" value={f.qty} onChange={set("qty")} />
          </FormField>
          <FormField label="Unit">
            <TextInput placeholder="bags, kg, bottles…" value={f.unit} onChange={set("unit")} />
          </FormField>
          <FormField label="Purchase Cost (₹) *">
            <TextInput placeholder="0.00" type="number" value={f.cost} onChange={set("cost")} />
          </FormField>
          <FormField label="Supplier Name">
            <TextInput placeholder="e.g. Ravi Wholesale" value={f.supplier} onChange={set("supplier")} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Purchase Date">
              <TextInput type="date" value={f.date} onChange={set("date")} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Notes">
              <Textarea placeholder="Any additional notes about this purchase…" value={f.notes} onChange={set("notes")} rows={2} />
            </FormField>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <Btn variant="outline" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={!valid} className="flex-1">
            Save Purchase
          </Btn>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Purchases() {
  const [purchases, setPurchases] = useState(PURCHASES);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = purchases.filter(
    (p) =>
      p.product.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = purchases.reduce((a, p) => a + p.cost, 0);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      {adding && (
        <AddPurchaseModal
          onClose={() => setAdding(false)}
          onAdd={(p) => setPurchases((prev) => [p, ...prev])}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-7 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Purchases</h2>
            <p className="text-sm text-gray-500 mt-1">Track stock purchases and supplier expenses</p>
          </div>
          <Btn variant="primary" onClick={() => setAdding(true)}>
            <IconPlus size={15} /> Add Purchase
          </Btn>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Purchases", value: purchases.length, sub: "all time", mono: true },
            { label: "This Month", value: 7, sub: "Sep 2026", mono: true },
            { label: "Total Spend", value: INR(totalSpend), sub: "all purchases", mono: true },
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
            <SearchInput placeholder="Search product, supplier, ID…" value={search} onChange={setSearch} />
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
                  {["Purchase ID", "Date", "Product", "Qty", "Supplier", "Cost", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono-data text-xs font-semibold text-gray-700">{p.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-medium">{p.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">{p.product}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono-data text-sm font-semibold text-gray-800">{p.qty}</span>
                      <span className="text-xs text-gray-400 ml-1">{p.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-500">{p.supplier[0]}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{p.supplier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono-data text-sm font-bold text-gray-900">{INR(p.cost)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <IconEdit size={14} />
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
