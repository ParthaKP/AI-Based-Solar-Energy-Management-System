import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, Eye, Zap } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockWeather } from '../../lib/mock';

export default function WeatherPage() {
  const weather = useMemo(() => generateMockWeather(), []);

  const forecastData = weather.forecast.map(f => ({
    time: new Date(f.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: f.temperature,
    cloud_cover: f.cloud_cover,
    solar_intensity: f.solar_intensity,
    condition: f.condition,
  }));

  const conditionIcon = (c: string) => {
    if (c === 'clear') return <Sun className="w-5 h-5 text-amber-400" />;
    if (c === 'partly_cloudy') return <Cloud className="w-5 h-5 text-slate-300" />;
    return <CloudRain className="w-5 h-5 text-sky-400" />;
  };

  const solarImpact = weather.cloud_cover_percent < 30 ? 'Excellent' : weather.cloud_cover_percent < 60 ? 'Good' : weather.cloud_cover_percent < 80 ? 'Reduced' : 'Poor';
  const impactColor = solarImpact === 'Excellent' ? 'text-emerald-400' : solarImpact === 'Good' ? 'text-amber-400' : solarImpact === 'Reduced' ? 'text-orange-400' : 'text-rose-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Weather Analytics</h1>
        <p className="text-sm text-slate-400">Weather-aware energy optimization and solar intensity tracking</p>
      </div>

      {/* Current Weather */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-sky-500/5 via-white/[0.02] to-amber-500/5 border border-white/5 rounded-xl p-6"
      >
        <div className="flex items-center gap-6">
          <div className="text-center">
            {conditionIcon(weather.weather_condition)}
            <p className="text-4xl font-bold text-white mt-2">{weather.temperature_c.toFixed(0)}C</p>
            <p className="text-sm text-slate-400 capitalize mt-1">{weather.weather_condition.replace('_', ' ')}</p>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Droplets className="w-5 h-5 text-sky-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{weather.humidity_percent.toFixed(0)}%</p>
              <p className="text-xs text-slate-500">Humidity</p>
            </div>
            <div className="text-center">
              <Wind className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{weather.wind_speed_kmh.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Wind km/h</p>
            </div>
            <div className="text-center">
              <Eye className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{weather.uv_index.toFixed(1)}</p>
              <p className="text-xs text-slate-500">UV Index</p>
            </div>
            <div className="text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{weather.solar_intensity.toFixed(0)}</p>
              <p className="text-xs text-slate-500">Solar W/m2</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Solar Impact" value={solarImpact} subtitle="Generation potential" icon={<Sun className="w-5 h-5" />} color={solarImpact === 'Excellent' ? 'emerald' : 'amber'} />
        <MetricCard title="Cloud Cover" value={`${weather.cloud_cover_percent.toFixed(0)}%`} subtitle="Sky obstruction" icon={<Cloud className="w-5 h-5" />} color="sky" />
        <MetricCard title="Solar Intensity" value={`${weather.solar_intensity.toFixed(0)} W/m2`} subtitle="Irradiance level" icon={<Zap className="w-5 h-5" />} color="amber" />
        <MetricCard title="UV Index" value={weather.uv_index.toFixed(1)} subtitle="Ultraviolet level" icon={<Thermometer className="w-5 h-5" />} color="orange" />
      </div>

      {/* Impact Banner */}
      <div className={`p-4 rounded-xl border ${solarImpact === 'Excellent' ? 'bg-emerald-500/5 border-emerald-500/10' : solarImpact === 'Good' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
        <p className={`text-sm font-medium ${impactColor}`}>
          Solar generation outlook: {solarImpact}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {solarImpact === 'Excellent'
            ? 'Clear skies expected. Maximize appliance usage during peak hours.'
            : solarImpact === 'Good'
            ? 'Partial cloud cover. Good generation with minor fluctuations expected.'
            : solarImpact === 'Reduced'
            ? 'Significant cloud cover. Reduce non-essential appliance usage.'
            : 'Heavy overcast. Rely on grid power for essential appliances only.'}
        </p>
      </div>

      {/* Forecast Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Temperature Forecast</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="temperature" stroke="#f97316" fill="url(#tempGrad)" strokeWidth={2} name="Temperature (C)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Solar Intensity Forecast</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="solarIntGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="solar_intensity" stroke="#f59e0b" fill="url(#solarIntGrad)" strokeWidth={2} name="Solar Intensity (W/m2)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cloud Cover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-4">Cloud Cover Forecast</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="cloud_cover" fill="#64748b" radius={[3, 3, 0, 0]} name="Cloud Cover %" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
