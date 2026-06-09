import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sun, Cloud, CloudRain, CheckCircle, XCircle, Gauge, Lightbulb, Fan, Tv, Laptop, Refrigerator, Droplets, Wifi, Smartphone, Monitor, Coffee, AirVent, WashingMachine } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockSensorData } from '../../lib/mock';
import { calculateLoadRecommendations } from '../../lib/engine';
import { useSensorData } from '../../hooks/useSensorData';
import { useToast } from '../../hooks/useToast';

const iconMap: Record<string, React.ReactNode> = {
  Fan: <Fan className="w-4 h-4" />,
  Lightbulb: <Lightbulb className="w-4 h-4" />,
  Refrigerator: <Refrigerator className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Tv: <Tv className="w-4 h-4" />,
  WashingMachine: <WashingMachine className="w-4 h-4" />,
  Droplets: <Droplets className="w-4 h-4" />,
  AirVent: <AirVent className="w-4 h-4" />,
  Microwave: <Coffee className="w-4 h-4" />,
  Iron: <Zap className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Wifi: <Wifi className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
};

type Strategy = 'eco' | 'balanced' | 'comfort';
type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast' | 'rainy';

const weatherConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  clear: { icon: <Sun className="w-5 h-5" />, color: 'text-amber-400', label: 'Sunny' },
  partly_cloudy: { icon: <Cloud className="w-5 h-5" />, color: 'text-slate-300', label: 'Partly Cloudy' },
  cloudy: { icon: <Cloud className="w-5 h-5" />, color: 'text-slate-400', label: 'Cloudy' },
  overcast: { icon: <Cloud className="w-5 h-5" />, color: 'text-slate-500', label: 'Overcast' },
  rainy: { icon: <CloudRain className="w-5 h-5" />, color: 'text-sky-400', label: 'Rainy' },
};

const strategyConfig: Record<Strategy, { label: string; desc: string; color: string }> = {
  eco: { label: 'Eco Mode', desc: 'Maximize solar usage, minimize grid dependency', color: 'text-emerald-400' },
  balanced: { label: 'Balanced', desc: 'Optimal balance between comfort and efficiency', color: 'text-sky-400' },
  comfort: { label: 'Comfort', desc: 'Prioritize appliance availability', color: 'text-amber-400' },
};

export default function LoadPage() {
  const [strategy, setStrategy] = useState<Strategy>('balanced');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('clear');
  const { addToast } = useToast();

  const { current: liveReading } = useSensorData(1, 10000);
  const mockData = useMemo(() => generateMockSensorData(1), []);
  const latest = liveReading || mockData[0];

  const availableSolarWatts = latest.power;
  const recommendations = useMemo(() =>
    calculateLoadRecommendations(availableSolarWatts, weatherCondition, latest.power, 0, strategy),
    [availableSolarWatts, weatherCondition, latest.power, strategy]
  );

  const handleStrategyChange = useCallback((newStrategy: Strategy) => {
    const prevStrategy = strategy;
    setStrategy(newStrategy);
    const config = strategyConfig[newStrategy];
    if (newStrategy !== prevStrategy) {
      addToast(
        newStrategy === 'eco' ? 'success' : newStrategy === 'comfort' ? 'warning' : 'info',
        `Strategy: ${config.label}`,
        config.desc
      );
    }
  }, [strategy, addToast]);

  const handleWeatherChange = useCallback((newWeather: WeatherCondition) => {
    const prevWeather = weatherCondition;
    setWeatherCondition(newWeather);
    if (newWeather !== prevWeather) {
      const isGood = newWeather === 'clear' || newWeather === 'partly_cloudy';
      const isLow = newWeather === 'overcast' || newWeather === 'rainy';
      addToast(
        isLow ? 'warning' : isGood ? 'success' : 'info',
        `Weather: ${weatherConfig[newWeather].label}`,
        isGood
          ? 'Good solar generation expected. Multiple appliances can run safely.'
          : isLow
          ? 'Low solar output. Heavy appliance usage should be avoided.'
          : 'Reduced solar output. Prioritize essential appliances.'
      );
    }
  }, [weatherCondition, addToast]);

  const wc = weatherConfig[weatherCondition];
  const prevAvoidedCount = useRef(0);

  // Toast when critical appliances get added to the avoided list
  useEffect(() => {
    const avoidedCount = recommendations.avoided.length;
    if (avoidedCount > prevAvoidedCount.current && avoidedCount > 5) {
      const criticalAvoided = recommendations.avoided.filter(a => a.category === 'essential');
      if (criticalAvoided.length > 0) {
        addToast(
          'critical',
          'Essential Appliances At Risk',
          `${criticalAvoided.length} essential appliance(s) cannot run on current solar output: ${criticalAvoided.map(a => a.name).join(', ')}`
        );
      } else {
        addToast(
          'warning',
          'Load Limitation Active',
          `${avoidedCount} appliances exceed available solar power. Consider switching to eco mode or using grid power.`
        );
      }
    }
    prevAvoidedCount.current = avoidedCount;
  }, [recommendations.avoided, addToast]);

  const getWeatherMessage = () => {
    if (weatherCondition === 'clear' || weatherCondition === 'partly_cloudy') {
      return `${wc.label} weather detected. Good solar generation expected. You can safely run multiple appliances.`;
    }
    if (weatherCondition === 'cloudy') {
      return `Cloudy weather detected. Reduced solar output. Prioritize essential appliances only.`;
    }
    return `Low solar generation expected. Avoid heavy appliance usage. Consider using grid power for essentials.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Load Management</h1>
          <p className="text-sm text-slate-400">{liveReading ? 'AI-powered recommendations from real sensor data' : 'AI-powered appliance recommendations based on solar availability (demo)'}</p>
        </div>
      </div>

      {/* Weather & Strategy Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Weather Condition</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(weatherConfig) as WeatherCondition[]).map(w => (
              <button
                key={w}
                onClick={() => handleWeatherChange(w)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition text-xs ${
                  weatherCondition === w
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                {weatherConfig[w].icon}
                <span className="font-medium">{weatherConfig[w].label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Load Strategy</h3>
          <div className="space-y-2">
            {(['eco', 'balanced', 'comfort'] as Strategy[]).map(s => (
              <button
                key={s}
                onClick={() => handleStrategyChange(s)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                  strategy === s
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="text-left">
                  <p className={`text-sm font-medium ${strategy === s ? 'text-emerald-400' : 'text-slate-300'}`}>{strategyConfig[s].label}</p>
                  <p className="text-xs text-slate-500">{strategyConfig[s].desc}</p>
                </div>
                {strategy === s && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Available Solar" value={`${Math.round(availableSolarWatts)} W`} subtitle="Current generation" icon={<Sun className="w-5 h-5" />} color="amber" />
        <MetricCard title="Effective Power" value={`${Math.round(availableSolarWatts * (weatherCondition === 'cloudy' ? 0.5 : weatherCondition === 'overcast' ? 0.2 : 0.85))} W`} subtitle="After weather adjustment" icon={<Zap className="w-5 h-5" />} color="emerald" />
        <MetricCard title="Optimization Score" value={`${recommendations.optimizationScore}%`} subtitle="Load efficiency" icon={<Gauge className="w-5 h-5" />} color="sky" />
        <MetricCard title="Recommended" value={`${recommendations.recommended.length}`} subtitle="Appliances" icon={<CheckCircle className="w-5 h-5" />} color="teal" />
      </div>

      {/* Weather Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${
          weatherCondition === 'clear' || weatherCondition === 'partly_cloudy'
            ? 'bg-emerald-500/5 border-emerald-500/10'
            : weatherCondition === 'cloudy'
            ? 'bg-amber-500/5 border-amber-500/10'
            : 'bg-rose-500/5 border-rose-500/10'
        }`}
      >
        <div className="flex items-start gap-3">
          {wc.icon}
          <p className="text-sm text-slate-300">{getWeatherMessage()}</p>
        </div>
      </motion.div>

      {/* Recommended Appliances */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-emerald-400 mb-4">Recommended Appliances</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <AnimatePresence>
            {recommendations.recommended.map((app, i) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  {iconMap[APPLIANCE_ICONS[app.name]] || <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{app.name}</p>
                  <p className="text-xs text-slate-500">{app.power_watts}W - {app.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{app.max_runtime_hours}h</p>
                  <p className="text-xs text-slate-600">max runtime</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Avoided Appliances */}
      {recommendations.avoided.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-rose-400 mb-4">Avoid / Postpone</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {recommendations.avoided.map(app => (
              <div key={app.name} className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{app.name}</p>
                  <p className="text-xs text-slate-500">{app.power_watts}W - exceeds available solar</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const APPLIANCE_ICONS: Record<string, string> = {
  'Ceiling Fan': 'Fan',
  'LED Bulb (10W)': 'Lightbulb',
  'LED Bulb (20W)': 'Lightbulb',
  'Refrigerator': 'Refrigerator',
  'Laptop': 'Laptop',
  'TV (LED 32")': 'Tv',
  'TV (LED 55")': 'Tv',
  'Washing Machine': 'WashingMachine',
  'Water Pump': 'Droplets',
  'Air Conditioner (1 ton)': 'AirVent',
  'Microwave Oven': 'Coffee',
  'Iron': 'Iron',
  'Phone Charger': 'Smartphone',
  'WiFi Router': 'Wifi',
  'Desktop Computer': 'Monitor',
  'Electric Kettle': 'Coffee',
};
