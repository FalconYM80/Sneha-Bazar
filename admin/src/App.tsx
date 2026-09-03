import { useState } from "react";
import type { Page } from "./types";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Purchases from "./pages/Purchases";
import { FormField, TextInput, Btn } from "./components/ui";

const META: Record<Page, { title: string; subtitle: string }> = {
  dashboard:  { title: "Dashboard",   subtitle: "Overview of your store today" },
  inventory:  { title: "Inventory",   subtitle: "Manage products and stock levels" },
  orders:     { title: "Orders",      subtitle: "Manage customer pickup orders" },
  purchases:  { title: "Purchases",   subtitle: "Track purchases and supplier expenses" },
  settings:   { title: "Settings",    subtitle: "Configure your store" },
};

function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f4" }}>
      <div className="max-w-2xl mx-auto px-6 py-7 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your store configuration</p>
        </div>
        {[
          {
            title: "Store Information",
            fields: [
              { label: "Store Name", value: "Sneha Bazar" },
              { label: "Phone Number", value: "+91 98765 43210" },
              { label: "Email", value: "admin@snehabazar.in" },
            ],
          },
          {
            title: "Inventory Settings",
            fields: [
              { label: "Low Stock Threshold (units)", value: "8" },
              { label: "Default Currency", value: "INR (₹)" },
            ],
          },
        ].map(({ title, fields }) => (
          <div key={title} className="bg-white rounded-2xl card-shadow border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-5">{title}</h3>
            <div className="space-y-4">
              {fields.map(({ label, value }) => (
                <FormField key={label} label={label}>
                  <TextInput value={value} />
                </FormField>
              ))}
            </div>
            <div className="mt-5">
              <Btn variant="primary">Save Changes</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#f4f6f4" }}>
      <Sidebar activePage={page} onNavigate={setPage} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={META[page].title}
          subtitle={META[page].subtitle}
          onToggle={() => setCollapsed((c) => !c)}
        />
        {page === "dashboard"  && <Dashboard />}
        {page === "inventory"  && <Inventory />}
        {page === "orders"     && <Orders />}
        {page === "purchases"  && <Purchases />}
        {page === "settings"   && <SettingsPage />}
      </div>
    </div>
  );
}
