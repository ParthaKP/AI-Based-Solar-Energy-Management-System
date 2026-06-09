import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Sun, LayoutDashboard, Brain, AlertTriangle, Zap, DollarSign,
  Cloud, Leaf, BarChart3, LogOut, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predictions', icon: Brain, label: 'AI Predictions' },
  { to: '/faults', icon: AlertTriangle, label: 'Fault Detection' },
  { to: '/load', icon: Zap, label: 'Load Management' },
  { to: '/billing', icon: DollarSign, label: 'Smart Billing' },
  { to: '/weather', icon: Cloud, label: 'Weather' },
  { to: '/sustainability', icon: Leaf, label: 'Sustainability' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-slate-900/80 backdrop-blur-xl border-r border-white/5 z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sun className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-sm tracking-tight">AI Solar</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto text-slate-500 hover:text-slate-300 transition"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Admin</span>}
          </NavLink>
        )}
      </nav>

      <div className="px-2 py-4 border-t border-white/5">
        {!collapsed && profile && (
          <div className="px-3 mb-3">
            <p className="text-sm text-white font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
