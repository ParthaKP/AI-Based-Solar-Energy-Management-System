import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingDown, Zap, Sun, Grid2x2 as Grid, PiggyBank } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockBilling } from '../../lib/mock';
import { useSensorStats } from '../../hooks/useSensorData';
import { estimateBill } from '../../lib/engine';

export default function BillingPage() {
  const { data: realSensorData } = useSensorStats(30);
  const billingData = useMemo(() => generateMockBilling(), []);

  // Calculate real billing data from sensor readings if available
  const realBillingMetrics = useMemo(() => {
    if (realSensorData.length === 0) return null;
    const totalPowerW = realSensorData.reduce((s, d) => s + (d.power || 0), 0);
    const totalSolarKwh = totalPowerW / (1000 * 12);
    const consumedKwh = totalSolarKwh * 2.5;
    return estimateBill(consumedKwh, totalSolarKwh);
  }, [realSensorData]);

  const today = billingData[billingData.length - 1];
  const monthlyTotal = realBillingMetrics ? realBillingMetrics.monthlyCost : billingData.slice(-30).reduce((s, d) => s + d.daily_cost, 0);
  const monthlySavings = realBillingMetrics ? realBillingMetrics.solarSavings : billingData.slice(-30).reduce((s, d) => s + d.solar_savings, 0);
  const avgSolarContribution = realBillingMetrics ? realBillingMetrics.solarContribution : Math.round(billingData.slice(-30).reduce((s, d) => s + d.solar_contribution_percent, 0) / 30);

  const chartData = billingData.slice(-14).map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    cost: d.daily_cost,
    savings: d.solar_savings,
    consumed: d.energy_consumed_kwh,
    generated: d.energy_generated_kwh,
  }));

  const pieData = [
    { name: 'Solar', value: avgSolarContribution, color: '#f59e0b' },
    { name: 'Grid', value: 100 - avgSolarContribution, color: '#64748b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart Billing</h1>
        <p className="text-sm text-slate-400">Electricity bill estimation and solar savings tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Today's Cost" value={`$${today?.daily_cost.toFixed(2) || '0.00'}`} subtitle="Grid electricity" icon={<DollarSign className="w-5 h-5" />} color="amber" />
        <MetricCard title="Monthly Cost" value={`$${monthlyTotal.toFixed(2)}`} subtitle="Estimated total" icon={<DollarSign className="w-5 h-5" />} color="rose" />
        <MetricCard title="Solar Savings" value={`$${monthlySavings.toFixed(2)}`} subtitle="This month" icon={<PiggyBank className="w-5 h-5" />} color="emerald" trend={{ value: 15, positive: true }} />
        <MetricCard title="Solar Contribution" value={`${avgSolarContribution}%`} subtitle="Energy from solar" icon={<Sun className="w-5 h-5" />} color="amber" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Cost & Savings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Daily Cost vs Solar Savings (14 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="cost" fill="#f97316" radius={[3, 3, 0, 0]} name="Cost ($)" />
              <Bar dataKey="savings" fill="#10b981" radius={[3, 3, 0, 0]} name="Savings ($)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Energy Source Pie */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Energy Source Split</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> Solar</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-500" /> Grid</span>
          </div>
        </motion.div>
      </div>

      {/* Energy Consumption Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-4">Energy Consumed vs Generated (14 days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="consumedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="generatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Area type="monotone" dataKey="consumed" stroke="#f97316" fill="url(#consumedGrad)" strokeWidth={2} name="Consumed (kWh)" />
            <Area type="monotone" dataKey="generated" stroke="#f59e0b" fill="url(#generatedGrad)" strokeWidth={2} name="Generated (kWh)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Tariff Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-3">Tariff Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Standard Rate', value: '$0.12/kWh', icon: <Zap className="w-4 h-4" /> },
            { label: 'Peak Rate', value: '$0.18/kWh', icon: <TrendingDown className="w-4 h-4" /> },
            { label: 'Off-Peak Rate', value: '$0.08/kWh', icon: <Grid className="w-4 h-4" /> },
            { label: 'Export Rate', value: '$0.10/kWh', icon: <Sun className="w-4 h-4" /> },
          ].map(t => (
            <div key={t.label} className="bg-white/[0.02] rounded-lg p-3 flex items-center gap-2">
              <span className="text-emerald-400">{t.icon}</span>
              <div>
                <p className="text-xs text-slate-500">{t.label}</p>
                <p className="text-sm text-white font-medium">{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
