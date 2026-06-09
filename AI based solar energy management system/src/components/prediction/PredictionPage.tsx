import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, TrendingUp, BarChart3, Target, Clock, Calendar } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockSensorData } from '../../lib/mock';
import { predictSolarPower } from '../../lib/engine';
import { useSensorData } from '../../hooks/useSensorData';
import { useToast } from '../../hooks/useToast';

export default function PredictionPage() {
  const [viewMode, setViewMode] = useState<'hourly' | 'weekly'>('hourly');
  const { addToast } = useToast();
  const prevConfidence = useRef<number | null>(null);

  const { current: liveReading } = useSensorData(1, 10000);
  const mockData = useMemo(() => generateMockSensorData(1), []);
  const latest = liveReading || mockData[0] || { temperature: 28, humidity: 50, light_intensity: 600 };

  const prediction = useMemo(() =>
    predictSolarPower(latest.temperature, latest.humidity, latest.light_intensity, 25),
    [latest.temperature, latest.humidity, latest.light_intensity]
  );

  // Toast when confidence drops significantly or when prediction first loads from real data
  useEffect(() => {
    if (prevConfidence.current !== null) {
      const delta = prediction.confidence - prevConfidence.current;
      if (delta <= -10) {
        addToast('warning', 'Prediction Confidence Dropped', `Model confidence decreased by ${Math.abs(delta).toFixed(1)}% to ${prediction.confidence}%. Sensor input quality may be degraded.`);
      } else if (delta >= 10) {
        addToast('success', 'Prediction Confidence Improved', `Model confidence increased to ${prediction.confidence}%. Better sensor input quality detected.`);
      }
    }
    prevConfidence.current = prediction.confidence;
  }, [prediction.confidence, addToast]);

  const hourlyData = prediction.hourlyForecast.map(d => ({
    hour: `${d.hour}:00`,
    power: d.power,
    energy: Math.round(d.power * 0.25 * 100) / 100,
  }));

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const factor = 0.7 + Math.random() * 0.3;
    const peakPower = prediction.predictedPower * factor;
    return {
      day: dayNames[i],
      power: Math.round(peakPower * 100) / 100,
      energy: Math.round(peakPower * 5 * 100) / 100,
    };
  });

  const totalDailyEnergy = Math.round(hourlyData.reduce((s, d) => s + d.energy, 0) * 100) / 100;
  const estimatedBill = Math.round(totalDailyEnergy * 0.12 * 100) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
          <p className="text-sm text-slate-400">{liveReading ? 'Real-time sensor data powered solar forecasting' : 'Random Forest Regression powered solar forecasting (demo)'}</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode('hourly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'hourly' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Clock className="w-3 h-3" /> Hourly
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'weekly' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-3 h-3" /> Weekly
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Predicted Peak Power" value={`${prediction.predictedPower.toFixed(1)} W`} subtitle="Maximum output" icon={<TrendingUp className="w-5 h-5" />} color="amber" />
        <MetricCard title="Daily Energy Forecast" value={`${totalDailyEnergy} kWh`} subtitle="Total generation" icon={<BarChart3 className="w-5 h-5" />} color="emerald" />
        <MetricCard title="AI Confidence" value={`${prediction.confidence}%`} subtitle="Model accuracy" icon={<Target className="w-5 h-5" />} color="sky" />
        <MetricCard title="Est. Bill Savings" value={`$${estimatedBill}`} subtitle="Daily savings" icon={<Brain className="w-5 h-5" />} color="teal" />
      </div>

      {/* Prediction Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-4">
          {viewMode === 'hourly' ? 'Hourly Power Forecast (24h)' : 'Weekly Energy Forecast'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          {viewMode === 'hourly' ? (
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="power" stroke="#f59e0b" fill="url(#predGrad)" strokeWidth={2} name="Power (W)" />
            </AreaChart>
          ) : (
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="energy" fill="#10b981" radius={[4, 4, 0, 0]} name="Energy (kWh)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </motion.div>

      {/* Model Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-3">Model Parameters</h3>
          <div className="space-y-2">
            {[
              { label: 'Algorithm', value: 'Random Forest Regression' },
              { label: 'Model Version', value: 'rf_v1' },
              { label: 'Estimators', value: '100 trees' },
              { label: 'Max Depth', value: '10' },
              { label: 'Features', value: '5 (temp, humidity, light, voltage, current)' },
              { label: 'Training Samples', value: '10,000+' },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-slate-500">{p.label}</span>
                <span className="text-xs text-slate-300">{p.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-3">Input Features</h3>
          <div className="space-y-3">
            {[
              { label: 'Temperature', value: latest.temperature, max: 70, unit: 'C', color: 'bg-rose-500' },
              { label: 'Humidity', value: latest.humidity, max: 100, unit: '%', color: 'bg-sky-500' },
              { label: 'Light Intensity', value: latest.light_intensity, max: 1000, unit: 'lux', color: 'bg-amber-500' },
            ].map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{f.label}</span>
                  <span className="text-xs text-slate-300">{typeof f.value === 'number' ? Math.round(f.value) : f.value} {f.unit}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (typeof f.value === 'number' ? f.value : 0) / f.max * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <p className="text-xs text-emerald-400 font-medium">AI Confidence: {prediction.confidence}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Based on feature quality and model certainty</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

