import { motion } from 'framer-motion';

interface GaugeCardProps {
  title: string;
  value: number;
  unit: string;
  max: number;
  color?: string;
  icon: React.ReactNode;
  decimals?: number;
}

export default function GaugeCard({ title, value, unit, max, color = 'emerald', icon, decimals = 1 }: GaugeCardProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, { stroke: string; bg: string; text: string }> = {
    emerald: { stroke: '#10b981', bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-400' },
    amber: { stroke: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: 'text-amber-400' },
    sky: { stroke: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', text: 'text-sky-400' },
    rose: { stroke: '#f43f5e', bg: 'rgba(244,63,94,0.1)', text: 'text-rose-400' },
    orange: { stroke: '#f97316', bg: 'rgba(249,115,22,0.1)', text: 'text-orange-400' },
    teal: { stroke: '#14b8a6', bg: 'rgba(20,184,166,0.1)', text: 'text-teal-400' },
  };
  const c = colorMap[color] || colorMap.emerald;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
          <span className={c.text}>{icon}</span>
        </div>
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="45" cy="45" r={radius} fill="none"
            stroke={c.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            transform="rotate(-90 45 45)"
          />
          <text x="45" y="45" textAnchor="middle" dominantBaseline="central" className="fill-white text-lg font-bold" fontSize="14">
            {value.toFixed(decimals)}
          </text>
        </svg>
        <div>
          <p className={`text-2xl font-bold ${c.text}`}>{value.toFixed(decimals)}</p>
          <p className="text-xs text-slate-500">{unit}</p>
          <p className="text-xs text-slate-600 mt-1">{percentage.toFixed(0)}% of max</p>
        </div>
      </div>
    </motion.div>
  );
}
