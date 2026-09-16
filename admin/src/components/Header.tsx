import { IconMenu, IconBell, IconSearch } from "./ui";
import Logo from "./Logo";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggle: () => void;
}

export default function Header({ title, subtitle, onToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 flex-shrink-0">
      <button
        onClick={onToggle}
        aria-label="Toggle Menu"
        className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0"
      >
        <IconMenu size={18} />
      </button>

      {/* Brand icon on small mobile screens */}
      <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
        <Logo className="w-7 h-7 rounded-md" />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-none truncate hidden xs:block sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 w-56">
        <span className="text-gray-400 flex-shrink-0"><IconSearch size={13} /></span>
        <input
          placeholder="Search anything..."
          className="bg-transparent text-xs text-gray-600 outline-none placeholder-gray-400 w-full"
          style={{ fontFamily: "inherit" }}
        />
      </div>

      <button 
        aria-label="Notifications"
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0"
      >
        <IconBell size={18} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>

      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-green-700 transition-colors">
        <span className="text-white text-xs font-bold">A</span>
      </div>
    </header>
  );
}
