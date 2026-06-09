import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Shield, Activity, Cpu, CheckCircle, XCircle } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { generateMockSensorData } from '../../lib/mock';
import { detectFaults } from '../../lib/engine';
import { useSensorData } from '../../hooks/useSensorData';
import { useToast } from '../../hooks/useToast';

export default function FaultPage() {
  const [scanActive, setScanActive] = useState(false);
  const { addToast } = useToast();

  const { current: liveReading, history: sensorHistory } = useSensorData(24, 10000);
  const mockData = useMemo(() => generateMockSensorData(24), []);
  const sensorData = sensorHistory.length > 0 ? sensorHistory : mockData;
  const latest = liveReading || sensorData[sensorData.length - 1];

  const faultResult = useMemo(() =>
    detectFaults({
      voltage: latest.voltage,
      current: latest.current,
      power: latest.power,
      temperature: latest.temperature,
      panelEfficiency: latest.panel_efficiency,
    }),
    [latest]
  );

  const anomalyData = sensorData.map(d => ({
    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    voltage: d.voltage,
    lower: 16,
    upper: 26,
    anomaly: d.voltage < 14 || d.voltage > 28 ? d.voltage : null,
  }));

  const systemHealth = faultResult.isAnomaly
    ? faultResult.faults.some(f => f.severity === 'critical') ? 'critical' : 'warning'
    : 'healthy';

  const healthConfig = {
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, label: 'System Healthy' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning Detected' },
    critical: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: XCircle, label: 'Critical Fault' },
  };
  const hc = healthConfig[systemHealth];

  const handleScan = () => {
    setScanActive(true);

    // Run scan and show toasts based on results
    addToast('info', 'Fault Scan Initiated', 'Running Isolation Forest anomaly detection on current sensor data...');

    setTimeout(() => {
      setScanActive(false);

      if (faultResult.faults.length === 0) {
        addToast('success', 'Scan Complete: No Faults', 'All sensor readings are within normal operating parameters.');
      } else {
        // Show a toast for each detected fault
        for (const fault of faultResult.faults) {
          addToast(
            fault.severity as 'info' | 'warning' | 'critical',
            `Fault Detected: ${fault.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
            fault.message
          );
        }
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fault Detection</h1>
          <p className="text-sm text-slate-400">{liveReading ? 'Real-time anomaly detection from IoT sensor data' : 'Isolation Forest anomaly detection (demo data)'}</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanActive}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition disabled:opacity-50"
        >
          <Cpu className={`w-4 h-4 ${scanActive ? 'animate-pulse' : ''}`} />
          {scanActive ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Health Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${hc.bg} border ${hc.border} rounded-xl p-6`}
      >
        <div className="flex items-center gap-4">
          <hc.icon className={`w-10 h-10 ${hc.color}`} />
          <div>
            <h2 className={`text-xl font-bold ${hc.color}`}>{hc.label}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {faultResult.faults.length} issue{faultResult.faults.length !== 1 ? 's' : ''} detected by Isolation Forest algorithm
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Voltage" value={`${latest.voltage.toFixed(1)} V`} subtitle="Normal: 18-24V" icon={<Activity className="w-5 h-5" />} color={latest.voltage < 16 ? 'rose' : 'emerald'} />
        <MetricCard title="Current" value={`${latest.current.toFixed(2)} A`} subtitle="Expected: 0.5-5.5A" icon={<Activity className="w-5 h-5" />} color={latest.current < 0.5 ? 'rose' : 'sky'} />
        <MetricCard title="Temperature" value={`${latest.temperature.toFixed(0)} C`} subtitle="Safe: < 55C" icon={<Activity className="w-5 h-5" />} color={latest.temperature > 55 ? 'rose' : 'orange'} />
        <MetricCard title="Efficiency" value={`${latest.panel_efficiency.toFixed(1)}%`} subtitle="Optimal: > 15%" icon={<Shield className="w-5 h-5" />} color={latest.panel_efficiency < 10 ? 'rose' : 'amber'} />
      </div>

      {/* Fault Log */}
      {faultResult.faults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Detected Faults</h3>
          <div className="space-y-3">
            {faultResult.faults.map((fault, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-lg ${
                fault.severity === 'critical' ? 'bg-rose-500/5 border border-rose-500/10' :
                fault.severity === 'warning' ? 'bg-amber-500/5 border border-amber-500/10' :
                'bg-sky-500/5 border border-sky-500/10'
              }`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  fault.severity === 'critical' ? 'bg-rose-500' :
                  fault.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium capitalize">{fault.type.replace(/_/g, ' ')}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      fault.severity === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                      fault.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-sky-500/10 text-sky-400'
                    }`}>{fault.severity}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{fault.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Anomaly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-4">Voltage Anomaly Detection (24h)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={anomalyData}>
            <defs>
              <linearGradient id="vAnomalyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 30]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
            <Area type="monotone" dataKey="voltage" stroke="#10b981" fill="url(#vAnomalyGrad)" strokeWidth={2} name="Voltage" />
            <Area type="monotone" dataKey="lower" stroke="#f59e0b" strokeDasharray="5 5" fill="none" strokeWidth={1} name="Lower Bound" />
            <Area type="monotone" dataKey="upper" stroke="#f59e0b" strokeDasharray="5 5" fill="none" strokeWidth={1} name="Upper Bound" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 rounded" /> Voltage</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 rounded" style={{ borderTop: '1px dashed #f59e0b' }} /> Normal Range</span>
        </div>
      </motion.div>

      {/* Algorithm Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-slate-300 mb-3">Isolation Forest Algorithm</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <p className="text-xs text-slate-500">Contamination Rate</p>
            <p className="text-sm text-white font-medium mt-1">0.1 (10%)</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <p className="text-xs text-slate-500">Number of Estimators</p>
            <p className="text-sm text-white font-medium mt-1">100 trees</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <p className="text-xs text-slate-500">Detection Features</p>
            <p className="text-sm text-white font-medium mt-1">5 (voltage, current, power, temp, efficiency)</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
