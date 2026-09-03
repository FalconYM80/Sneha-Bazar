import { IconMenu, IconBell, IconSearch } from "./ui";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggle: () => void;
}

export default function Header({ title, subtitle, onToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-5 flex-shrink-0">
      <button
        onClick={onToggle}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <IconMenu size={17} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-bold text-gray-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 leading-none">{subtitle}</p>}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 w-56">
        <span className="text-gray-400 flex-shrink-0"><IconSearch size={13} /></span>
        <input
          placeholder="Search anything..."
          className="bg-transparent text-xs text-gray-600 outline-none placeholder-gray-400 w-full"
          style={{ fontFamily: "inherit" }}
        />
      </div>

      <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <IconBell size={17} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>

      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-green-700 transition-colors">
        <span className="text-white text-xs font-bold">A</span>
      </div>
    </header>
  );
}
