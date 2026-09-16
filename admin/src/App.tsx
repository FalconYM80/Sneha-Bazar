import { useState, useEffect } from "react";
import type { Page } from "./types";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Purchases from "./pages/Purchases";
import { FormField, TextInput, Btn } from "./components/ui";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "./settings";

const META: Record<Page, { title: string; subtitle: string }> = {
  dashboard:  { title: "Dashboard",   subtitle: "Overview of your store today" },
  inventory:  { title: "Inventory",   subtitle: "Manage products and stock levels" },
  orders:     { title: "Orders",      subtitle: "Manage customer pickup orders" },
  purchases:  { title: "Purchases",   subtitle: "Track purchases and supplier expenses" },
  settings:   { title: "Settings",    subtitle: "Configure your store" },
};

function SettingsPage() {
  const [f, setF] = useState(() => {
    const s = loadSettings();
    return {
      storeName: s.storeName || "",
      phone: s.phone || "",
      email: s.email || "",
      lowStockThreshold: String(s.lowStockThreshold || ""),
      currency: s.currency || "",
    };
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Clear success banner after 3 seconds
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const set = (k: keyof typeof f) => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    setError("");

    const threshold = Number(f.lowStockThreshold);
    if (!f.storeName.trim()) {
      setError("Store name is required.");
      return;
    }
    if (!f.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!Number.isFinite(threshold) || threshold <= 0 || !Number.isInteger(threshold)) {
      setError("Low stock threshold must be a positive whole number.");
      return;
    }

    saveSettings({
      storeName: f.storeName.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      lowStockThreshold: threshold,
      currency: f.currency.trim() || DEFAULT_SETTINGS.currency,
    });

    setSaved(true);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      <div className="max-w-2xl mx-auto px-4 py-5 sm:px-6 sm:py-7 space-y-4 sm:space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your store configuration</p>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl">
            ✓ Settings saved successfully.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Store Information */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Store Information</h3>
          <div className="space-y-3.5 sm:space-y-4">
            <FormField label="Store Name">
              <TextInput value={f.storeName} onChange={set("storeName")} placeholder="e.g. Sneha Bazar" />
            </FormField>
            <FormField label="Phone Number">
              <TextInput value={f.phone} onChange={set("phone")} placeholder="e.g. +91 98765 43210" />
            </FormField>
            <FormField label="Email">
              <TextInput value={f.email} onChange={set("email")} placeholder="e.g. admin@snehabazar.in" />
            </FormField>
          </div>
          <div className="mt-5">
            <Btn variant="primary" onClick={handleSave} className="w-full sm:w-auto">Save Changes</Btn>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Inventory Settings</h3>
          <div className="space-y-3.5 sm:space-y-4">
            <FormField label="Low Stock Threshold (units)">
              <TextInput
                type="number"
                value={f.lowStockThreshold}
                onChange={set("lowStockThreshold")}
                placeholder="e.g. 8"
              />
            </FormField>
            <FormField label="Default Currency">
              <TextInput value={f.currency} onChange={set("currency")} placeholder="e.g. INR (₹)" />
            </FormField>
          </div>
          <div className="mt-5">
            <Btn variant="primary" onClick={handleSave} className="w-full sm:w-auto">Save Changes</Btn>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSidebarOpen((open) => !open);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#f4f6f4" }}>
      <Sidebar 
        activePage={page} 
        onNavigate={setPage} 
        collapsed={collapsed} 
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={META[page].title}
          subtitle={META[page].subtitle}
          onToggle={handleToggle}
        />
        {page === "dashboard"  && <Dashboard onNavigate={setPage} />}
        {page === "inventory"  && <Inventory />}
        {page === "orders"     && <Orders />}
        {page === "purchases"  && <Purchases />}
        {page === "settings"   && <SettingsPage />}
      </div>
    </div>
  );
}
