import { Logo } from '../components/Logo'

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
      <Logo className="w-28 h-28 object-contain drop-shadow-2xl rounded-2xl" />
    </div>

    <div className="text-center">
      <h1 className="text-[40px] font-extrabold text-white tracking-tight leading-none">Sneha Bazar</h1>
    </div>

    {/* Loading dots */}
    <div className="absolute bottom-12 flex gap-2">
      <div className="w-8 h-1.5 bg-white rounded-full" />
      <div className="w-2 h-1.5 bg-indigo-400 rounded-full" />
      <div className="w-2 h-1.5 bg-indigo-400 rounded-full" />
    </div>
  </div>
)
