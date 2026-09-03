import type { Page } from "../types";
import { IconGrid, IconBox, IconShoppingBag, IconFileText, IconSettings, IconLogOut } from "./ui";

interface SidebarProps {
  activePage: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
}

const NAV: { id: Page; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "dashboard",  label: "Dashboard",  Icon: IconGrid },
  { id: "inventory",  label: "Inventory",  Icon: IconBox },
  { id: "orders",     label: "Orders",     Icon: IconShoppingBag },
  { id: "purchases",  label: "Purchases",  Icon: IconFileText },
  { id: "settings",   label: "Settings",   Icon: IconSettings },
];

export default function Sidebar({ activePage, onNavigate, collapsed }: SidebarProps) {
  const w = collapsed ? 64 : 228;

  return (
    <aside
      className="flex flex-col h-full bg-white border-r border-gray-100 flex-shrink-0 transition-all duration-300 overflow-hidden"
      style={{ width: w }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 h-16 border-b border-gray-100 flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-5"}`}>
        <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C8 3 5 6 5 9c0 4 4 8 7 11 3-3 7-7 7-11 0-3-3-6-7-6z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" />
            <path d="M9 11l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-none truncate">Sneha Bazar</p>
            <p className="text-[10px] text-green-600 font-semibold mt-0.5 tracking-wide uppercase">Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1 pt-1">Main Menu</p>
        )}
        {NAV.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`sidebar-nav-item w-full flex items-center gap-3 rounded-xl text-sm transition-all
                ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}
                ${active
                  ? "active bg-green-50 text-green-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium"
                }`}
            >
              <span className={`flex-shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}>
                <Icon size={17} />
              </span>
              {!collapsed && <span className="flex-1 text-left leading-none">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Profile + logout */}
      <div className={`border-t border-gray-100 p-3 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center" title="Admin">
            <span className="text-white text-xs font-bold">A</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-none">Admin</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">admin@snehabazar.in</p>
            </div>
            <button className="text-gray-300 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100">
              <IconLogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
