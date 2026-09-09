interface SplashScreenProps {
  onNavigate: (screen: string) => void
}

export const SplashScreen = ({ onNavigate }: SplashScreenProps) => (
  <div
    className="flex-1 flex flex-col items-center justify-center gap-8 cursor-pointer relative overflow-hidden"
    style={{ background: 'linear-gradient(160deg, #4F46E5 0%, #4338CA 100%)' }}
    onClick={() => onNavigate('login')}
  >
    {/* Background decoration */}
    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-5" />
    <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-white opacity-5" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-400 opacity-10 blur-3xl" />

    {/* Logo */}
    <div className="relative">
      <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="20" fill="#EEF2FF" />
          <path d="M32 12c-5 0-9.5 2.5-12 6.5A14 14 0 0046 32c0-3.5-1.3-6.7-3.4-9.2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 30h24M24 24l-4 12h24l-4-12" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="44" r="3" fill="#4F46E5" />
          <circle cx="38" cy="44" r="3" fill="#4F46E5" />
          <path d="M29 16c0-4 4-6 7-4.5" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white text-sm font-bold">✦</span>
      </div>
    </div>

    <div className="text-center">
      <h1 className="text-[40px] font-extrabold text-white tracking-tight leading-none">Sneha Bazar</h1>
      <p className="text-indigo-200 text-base mt-2 font-medium">Your Daily Marketplace</p>
      <p className="text-indigo-300/60 text-xs mt-1">Order online, pick up fresh</p>
    </div>

    {/* Loading dots */}
    <div className="absolute bottom-12 flex gap-2">
      <div className="w-8 h-1.5 bg-white rounded-full" />
      <div className="w-2 h-1.5 bg-indigo-400 rounded-full" />
      <div className="w-2 h-1.5 bg-indigo-400 rounded-full" />
    </div>
  </div>
)
