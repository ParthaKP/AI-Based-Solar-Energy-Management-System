import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Sun, Moon, Bell, Wifi } from 'lucide-react';

export default function Header() {
  const { dark, toggle } = useTheme();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">LIVE</span>
        </div>
        <span className="text-sm text-slate-400">
          {profile?.household_name || 'My Home'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-slate-400 hover:text-white transition">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          onClick={toggle}
          className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
