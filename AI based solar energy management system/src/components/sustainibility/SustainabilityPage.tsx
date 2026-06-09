import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Leaf, TreePine, Wind, Recycle, Globe, Award } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockSustainability } from '../../lib/mock';
import { useSensorStats } from '../../hooks/useSensorData';
import { calculateSustainability } from '../../lib/engine';

export default function SustainabilityPage() {
  const { data: realSensorData } = useSensorStats(30);
  const sustainabilityData = useMemo(() => generateMockSustainability(), []);

  const latest = sustainabilityData[sustainabilityData.length - 1];

  // Calculate real sustainability from sensor data if available
  const realSustainability = useMemo(() => {
    if (realSensorData.length === 0) return null;
    const totalSolarKwh = realSensorData.reduce((s, d) => s + (d.power || 0), 0) / (1000 * 12);
    const consumedKwh = totalSolarKwh * 2.5;
    return calculateSustainability(totalSolarKwh, consumedKwh);
  }, [realSensorData]);

  const totalCO2 = realSustainability ? realSustainability.co2Reduction : sustainabilityData.reduce((s, d) => s + d.co2_reduction_kg, 0);
  const totalCarbonSavings = realSustainability ? realSustainability.carbonSavings : sustainabilityData.reduce((s, d) => s + d.carbon_savings_kg, 0);
  const totalTrees = realSustainability ? realSustainability.treesEquivalent : sustainabilityData.reduce((s, d) => s + d.trees_equivalent, 0);
  const avgScore = realSustainability ? realSustainability.efficiencyScore : Math.round(sustainabilityData.reduce((s, d) => s + d.sustainability_score, 0) / sustainabilityData.length);

  const chartData = sustainabilityData.slice(-14).map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    co2: d.co2_reduction_kg,
    score: d.sustainability_score,
    renewable: d.renewable_percentage,
    efficiency: d.energy_efficiency_score,
  }));

  const sdgMappings = [
    { id: 7, label: 'Affordable & Clean Energy', icon: <Wind className="w-4 h-4" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { id: 11, label: 'Sustainable Cities', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 12, label: 'Responsible Consumption', icon: <Recycle className="w-4 h-4" />, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    { id: 13, label: 'Climate Action', icon: <Leaf className="w-4 h-4" />, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sustainability Dashboard</h1>
        <p className="text-sm text-slate-400">Track your environmental impact and green energy contribution</p>
      </div>

      {/* Sustainability Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-white/[0.02] border border-emerald-500/10 rounded-xl p-6 text-center"
      >
        <Award className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-5xl font-bold text-emerald-400">{avgScore}</p>
        <p className="text-sm text-slate-400 mt-1">Sustainability Score</p>
        <p className="text-xs text-slate-600 mt-2">Based on renewable contribution, efficiency, and CO2 reduction</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="CO2 Reduction" value={`${totalCO2.toFixed(1)} kg`} subtitle="Total offset" icon={<Wind className="w-5 h-5" />} color="emerald" />
        <MetricCard title="Carbon Savings" value={`${totalCarbonSavings.toFixed(1)} kg`} subtitle="Carbon offset" icon={<Leaf className="w-5 h-5" />} color="teal" />
        <MetricCard title="Trees Equivalent" value={totalTrees.toFixed(2)} subtitle="CO2 absorption" icon={<TreePine className="w-5 h-5" />} color="amber" />
        <MetricCard title="Renewable %" value={`${realSustainability ? realSustainability.renewablePercentage : (latest?.renewable_percentage || 0)}%`} subtitle="Energy from solar" icon={<Globe className="w-5 h-5" />} color="sky" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">CO2 Reduction (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="co2" stroke="#10b981" fill="url(#co2Grad)" strokeWidth={2} name="CO2 (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Sustainability Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="score" stroke="#14b8a6" fill="url(#scoreGrad)" strokeWidth={2} name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Renewable & Efficiency */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-4">Renewable Contribution & Efficiency</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="renewable" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Renewable %" />
            <Bar dataKey="efficiency" fill="#10b981" radius={[3, 3, 0, 0]} name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* SDG Mapping */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >

      </motion.div>
    </div>
  );
}
