import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sun, Zap, Thermometer, Droplets, Lightbulb, Activity, Battery, Wifi, WifiOff, AlertCircle, RefreshCw, Database } from 'lucide-react';
import GaugeCard from '../common/GaugeCard';
import MetricCard from '../common/MetricCard';
import { useSensorData, postSensorReading } from '../../hooks/useSensorData';
import { useToast } from '../../hooks/useToast';
import { generateMockSensorData, generateMockAlerts } from '../../lib/mock';
import { detectFaults } from '../../lib/engine';
import type { SensorData, Alert } from '../../lib/types';

export default function DashboardPage() {
  const { current: liveReading, history: sensorHistory, loading: sensorLoading, error: sensorError, refetch } = useSensorData(48, 5000);
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [simulatedReading, setSimulatedReading] = useState<SensorData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const prevFaultCount = useRef(0);
  const prevDataStatus = useRef<boolean | null>(null);

  useEffect(() => {
    if (sensorError || (sensorLoading === false && !liveReading)) {
      setFallbackMode(true);
      if (!simulatedReading) {
        const mockData = generateMockSensorData(1);
        setSimulatedReading(mockData[0]);
      }
      // Toast when first entering demo mode
      if (prevDataStatus.current !== false) {
        addToast('warning', 'Demo Mode Active', 'No sensor data from device. Showing simulated readings. Connect your hardware to the ingest endpoint for live data.');
      }
      prevDataStatus.current = false;
    } else if (liveReading) {
      setFallbackMode(false);
      setSimulatedReading(liveReading);
      // Toast when real data first arrives
      if (prevDataStatus.current === false) {
        addToast('success', 'Live Data Connected', `Receiving real sensor data. Power: ${liveReading.power.toFixed(1)}W, Voltage: ${liveReading.voltage.toFixed(1)}V`);
      }
      prevDataStatus.current = true;
    }
  }, [sensorError, sensorLoading, liveReading]);

  useEffect(() => {
    if (!fallbackMode || !simulatedReading) return;
    const interval = setInterval(() => {
      setSimulatedReading(prev => {
        if (!prev) return prev;
        const hour = new Date().getHours();
        const solarFactor = Math.max(0, Math.sin(((hour + 6) / 12) * Math.PI));
        const cloudFactor = 0.7 + Math.random() * 0.3;
        const voltage = 18 + solarFactor * 6 * cloudFactor + (Math.random() - 0.5) * 2;
        const current = solarFactor * 5.5 * cloudFactor + (Math.random() - 0.5) * 0.5;
        const newReading = {
          ...prev,
          voltage: Math.round(Math.max(0, voltage) * 100) / 100,
          current: Math.round(Math.max(0, current) * 100) / 100,
          power: Math.round(Math.max(0, voltage * current) * 100) / 100,
          temperature: Math.round((prev.temperature + (Math.random() - 0.5) * 2) * 10) / 10,
          humidity: Math.round(Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 5)) * 10) / 10,
          light_intensity: Math.round(Math.max(0, solarFactor * 1000 * cloudFactor + (Math.random() - 0.5) * 100) * 10) / 10,
          panel_efficiency: Math.round(Math.max(0, 15 + solarFactor * 8 * cloudFactor + (Math.random() - 0.5) * 2) * 10) / 10,
          recorded_at: new Date().toISOString(),
        };
        postSensorReading(newReading).catch(() => {});
        return newReading;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [fallbackMode, simulatedReading]);

  // Run fault detection on sensor data and fire toast popups for new faults
  useEffect(() => {
    const reading = simulatedReading || liveReading;
    if (!reading) return;

    const faultResult = detectFaults({
      voltage: reading.voltage,
      current: reading.current,
      power: reading.power,
      temperature: reading.temperature,
      panelEfficiency: reading.panel_efficiency,
    });

    if (faultResult.faults.length > 0) {
      const realAlerts: Alert[] = faultResult.faults.map((f, i) => ({
        id: `live-${i}`,
        user_id: reading.user_id,
        alert_type: f.type as Alert['alert_type'],
        severity: f.severity as Alert['severity'],
        title: f.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        message: f.message,
        is_read: false,
        sensor_value: reading.voltage,
        threshold_value: 16,
        created_at: new Date().toISOString(),
      }));
      setAlerts(realAlerts);

      // Fire toasts only for newly detected faults
      if (faultResult.faults.length > prevFaultCount.current) {
        const newFaults = faultResult.faults.slice(prevFaultCount.current);
        for (const fault of newFaults) {
          addToast(
            fault.severity as 'info' | 'warning' | 'critical',
            `Fault: ${fault.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
            fault.message
          );
        }
      }
      prevFaultCount.current = faultResult.faults.length;
    } else {
      setAlerts(generateMockAlerts());
      prevFaultCount.current = 0;
    }
  }, [simulatedReading, liveReading, addToast]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const reading = simulatedReading || liveReading;
      if (reading) {
        await postSensorReading(reading);
        setLastSync(new Date().toLocaleTimeString());
        addToast('success', 'Data Synced', `Sensor reading pushed to database. Power: ${reading.power.toFixed(1)}W`);
        refetch();
      }
    } catch {
      addToast('critical', 'Sync Failed', 'Could not push sensor data to the database. Check your connection.');
    } finally {
      setSyncing(false);
    }
  }, [simulatedReading, liveReading, refetch, addToast]);

  const displayReading = simulatedReading || liveReading;
  if (!displayReading) return null;

  const chartData = (sensorHistory.length > 0 ? sensorHistory : generateMockSensorData(48)).map(d => ({
    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    power: d.power,
    voltage: d.voltage,
    current: d.current,
    light_intensity: d.light_intensity,
    temperature: d.temperature,
    humidity: d.humidity,
  }));

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const deviceOnline = displayReading.is_online ?? true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">
            {fallbackMode
              ? 'Simulated data -- post to edge function for live processing'
              : 'Real-time solar monitoring from IoT sensors via Google Sheet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {fallbackMode && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              {syncing ? 'Syncing...' : 'Push to DB'}
            </button>
          )}
          {fallbackMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3 h-3" />
              Demo Mode
            </div>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            deviceOnline && !fallbackMode
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {deviceOnline && !fallbackMode ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {deviceOnline && !fallbackMode ? 'Device Online' : fallbackMode ? 'No Device' : 'Device Offline'}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-start gap-3">
        <Database className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">
            {fallbackMode
              ? 'No sensor data in database. Point your Arduino/ESP8266 to POST sensor data to the ingest endpoint. Simulated data is being pushed every 5s for demo.'
              : `Showing ${sensorHistory.length} readings from Supabase. Data is synced from Google Sheet via edge function.`}
          </p>
          {lastSync && <p className="text-xs text-slate-500 mt-1">Last sync: {lastSync}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Solar Power" value={`${displayReading.power.toFixed(1)} W`} subtitle="Live generation" icon={<Zap className="w-5 h-5" />} color="amber" trend={{ value: 12, positive: true }} />
        <MetricCard title="Voltage" value={`${displayReading.voltage.toFixed(1)} V`} subtitle="Panel output" icon={<Activity className="w-5 h-5" />} color={displayReading.voltage < 16 ? 'rose' : 'emerald'} />
        <MetricCard title="Current" value={`${displayReading.current.toFixed(2)} A`} subtitle="Current flow" icon={<Battery className="w-5 h-5" />} color="sky" />
        <MetricCard title="Light Intensity" value={`${Math.round(displayReading.light_intensity)} lux`} subtitle="Solar irradiance" icon={<Lightbulb className="w-5 h-5" />} color={displayReading.light_intensity < 200 ? 'amber' : 'yellow'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GaugeCard title="Power Output" value={displayReading.power} unit="Watts" max={300} color="amber" icon={<Zap className="w-4 h-4" />} />
        <GaugeCard title="Temperature" value={displayReading.temperature} unit="Celsius" max={70} color="rose" icon={<Thermometer className="w-4 h-4" />} decimals={0} />
        <GaugeCard title="Light Intensity" value={displayReading.light_intensity} unit="Lux" max={1000} color="amber" icon={<Lightbulb className="w-4 h-4" />} decimals={0} />
        <GaugeCard title="Panel Efficiency" value={displayReading.panel_efficiency} unit="Percent" max={25} color="emerald" icon={<Sun className="w-4 h-4" />} decimals={1} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Power Generation ({chartData.length} readings)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="power" stroke="#f59e0b" fill="url(#powerGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Light Intensity (Lux)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 1000]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} formatter={(value: number) => [`${Math.round(value)} lux`, 'Light Intensity']} />
              <Area type="monotone" dataKey="light_intensity" stroke="#fbbf24" fill="url(#lightGrad)" strokeWidth={2} name="Light Intensity" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Voltage & Current</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="voltage" stroke="#10b981" fill="url(#vGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="current" stroke="#0ea5e9" fill="url(#cGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Temperature & Humidity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="temperature" stroke="#f43f5e" fill="url(#tempGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="humidity" stroke="#0ea5e9" fill="url(#humGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Recent Alerts</h3>
          <span className="text-xs px-2 py-1 bg-rose-500/10 text-rose-400 rounded-full">{unreadAlerts.length} unread</span>
        </div>
        <div className="space-y-3">
          {alerts.slice(0, 4).map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${alert.severity === 'critical' ? 'bg-rose-500/5 border border-rose-500/10' : alert.severity === 'warning' ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-sky-500/5 border border-sky-500/10'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-rose-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{alert.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
              </div>
              <span className="text-xs text-slate-600 flex-shrink-0">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="text-center text-xs text-slate-600">
        Last reading: {new Date(displayReading.recorded_at).toLocaleString()}
        {fallbackMode && ' (simulated -- posting to edge function every 5s)'}
      </div>
    </div>
  );
}
