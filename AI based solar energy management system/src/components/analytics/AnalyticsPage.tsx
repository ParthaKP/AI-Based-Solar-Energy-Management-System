import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, Download, Calendar, TrendingUp, FileText } from 'lucide-react';
import { generateMockSensorData, generateMockBilling, generateMockSustainability } from '../../lib/mock';
import { useSensorStats } from '../../hooks/useSensorData';

type TimeRange = '7d' | '14d' | '30d';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');

  const daysMap: Record<TimeRange, number> = { '7d': 7, '14d': 14, '30d': 30 };
  const days = daysMap[timeRange];
  const { data: realSensorData } = useSensorStats(days);

  const mockSensorData = useMemo(() => generateMockSensorData(30), []);
  const billingData = useMemo(() => generateMockBilling(), []);
  const sustainabilityData = useMemo(() => generateMockSustainability(), []);

  const sensorData = realSensorData.length > 0 ? realSensorData : mockSensorData;

  const powerData = sensorData.slice(-days).map(d => ({
    time: new Date(d.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    power: d.power,
    voltage: d.voltage,
    temperature: d.temperature,
    efficiency: d.panel_efficiency,
  }));

  const billingChart = billingData.slice(-days).map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    cost: d.daily_cost,
    savings: d.solar_savings,
    consumed: d.energy_consumed_kwh,
    generated: d.energy_generated_kwh,
  }));

  const sustainabilityChart = sustainabilityData.slice(-days).map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    co2: d.co2_reduction_kg,
    score: d.sustainability_score,
    renewable: d.renewable_percentage,
  }));

  const handleExportCSV = (data: Record<string, unknown>[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Analytics</h1>
          <p className="text-sm text-slate-400">Comprehensive reports and trend analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(['7d', '14d', '30d'] as TimeRange[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${timeRange === t ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500">Avg Power</span>
          </div>
          <p className="text-xl font-bold text-white">
            {(powerData.reduce((s, d) => s + d.power, 0) / (powerData.length || 1)).toFixed(1)} W
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500">Total Energy</span>
          </div>
          <p className="text-xl font-bold text-white">
            {(billingChart.reduce((s, d) => s + (d.generated as number), 0)).toFixed(1)} kWh
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-slate-500">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${billingChart.reduce((s, d) => s + (d.cost as number), 0).toFixed(2)}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-500">Avg Score</span>
          </div>
          <p className="text-xl font-bold text-white">
            {(sustainabilityChart.reduce((s, d) => s + (d.score as number), 0) / (sustainabilityChart.length || 1)).toFixed(0)}
          </p>
        </motion.div>
      </div>

      {/* Power Generation History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Power Generation History</h3>
          <button
            onClick={() => handleExportCSV(powerData, 'power_history')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={powerData}>
            <defs>
              <linearGradient id="histPowerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Area type="monotone" dataKey="power" stroke="#f59e0b" fill="url(#histPowerGrad)" strokeWidth={2} name="Power (W)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Billing History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Billing & Savings History</h3>
          <button
            onClick={() => handleExportCSV(billingChart, 'billing_history')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={billingChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="consumed" fill="#f97316" radius={[3, 3, 0, 0]} name="Consumed (kWh)" />
            <Bar dataKey="generated" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Generated (kWh)" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sustainability History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Sustainability Metrics History</h3>
          <button
            onClick={() => handleExportCSV(sustainabilityChart, 'sustainability_history')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={sustainabilityChart}>
            <defs>
              <linearGradient id="co2HistGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Area type="monotone" dataKey="co2" stroke="#10b981" fill="url(#co2HistGrad)" strokeWidth={2} name="CO2 (kg)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Yearly Trend Placeholder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Yearly Trend Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Q1 Generation', value: '1,240 kWh', change: '+8%' },
            { label: 'Q2 Generation', value: '1,580 kWh', change: '+12%' },
            { label: 'Q3 Generation', value: '1,720 kWh', change: '+5%' },
            { label: 'Q4 Generation', value: '980 kWh', change: '-15%' },
          ].map(q => (
            <div key={q.label} className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-xs text-slate-500">{q.label}</p>
              <p className="text-sm text-white font-medium">{q.value}</p>
              <p className={`text-xs mt-0.5 ${q.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{q.change}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
