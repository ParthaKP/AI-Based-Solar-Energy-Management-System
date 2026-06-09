import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun, Brain, AlertTriangle, Zap, DollarSign, Cloud, Leaf,
  BarChart3, ArrowRight, Cpu, Wifi, Shield, ChevronRight
} from 'lucide-react';

const features = [
  { icon: Sun, title: 'Solar Monitoring', desc: 'Real-time solar panel tracking with live voltage, current, and power metrics from IoT sensors.' },
  { icon: Brain, title: 'AI Predictions', desc: 'Random Forest powered forecasting predicts future solar output and energy availability.' },
  { icon: AlertTriangle, title: 'Fault Detection', desc: 'Isolation Forest algorithm detects anomalies, voltage drops, and sensor failures instantly.' },
  { icon: Zap, title: 'Smart Load Management', desc: 'AI recommends which appliances to run, for how long, based on available solar energy.' },
  { icon: DollarSign, title: 'Smart Billing', desc: 'Automated electricity bill estimation with solar savings calculation and tariff tracking.' },
  { icon: Cloud, title: 'Weather Analytics', desc: 'Weather-aware optimization adjusts predictions and load recommendations in real-time.' },
  { icon: Leaf, title: 'Sustainability Tracking', desc: 'Track CO2 reduction, carbon savings, and environmental impact with SDG mapping.' },
  { icon: BarChart3, title: 'Historical Analytics', desc: 'Comprehensive reports with daily, weekly, monthly trends and CSV/PDF export.' },
];

const architectureSteps = [
  { icon: Sun, label: 'Solar Panel + Sensors' },
  { icon: Cpu, label: 'Arduino UNO' },
  { icon: Wifi, label: 'ESP8266 WiFi' },
  { icon: Brain, label: 'AI Engine' },
  { icon: Shield, label: 'Cloud Dashboard' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">AI Solar Monitor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition">Sign In</Link>
            <Link
              to="/signup"
              className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition shadow-lg shadow-emerald-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> AI-Powered Renewable Energy Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Smart Solar
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Monitoring & Prediction
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              An intelligent renewable energy management platform combining real-time IoT monitoring,
              AI-powered predictions, fault detection, and smart load management for optimal solar utilization.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 text-lg"
              >
                Start Monitoring <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {[
              { value: '95%', label: 'Prediction Accuracy' },
              { value: '24/7', label: 'Real-time Monitoring' },
              { value: '40%', label: 'Energy Savings' },
              { value: '<1s', label: 'Fault Detection' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 backdrop-blur border border-white/5 rounded-xl p-4">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Energy Intelligence</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to monitor, predict, and optimize your solar energy system in one platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">System Architecture</h2>
          <p className="text-slate-400 mb-12">From solar panels to your dashboard in milliseconds</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {architectureSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
                >
                  <step.icon className="w-6 h-6 text-amber-400" />
                  <span className="text-sm font-medium">{step.label}</span>
                </motion.div>
                {i < architectureSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Powered by
                <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Machine Learning
                </span>
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Random Forest Regression', desc: 'Predicts solar power output using temperature, humidity, light intensity, and historical patterns.' },
                  { title: 'Isolation Forest Detection', desc: 'Identifies anomalies in voltage, current, and efficiency to detect faults before they escalate.' },
                  { title: 'Hybrid Load Engine', desc: 'Combines AI predictions with rule-based optimization to recommend optimal appliance usage schedules.' },
                ].map(item => (
                  <div key={item.title} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                    <h3 className="font-semibold text-emerald-400 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Prediction Confidence</span>
                  <span className="text-sm font-bold text-emerald-400">94.2%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '94.2%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-amber-400">2.4 kW</p>
                    <p className="text-xs text-slate-500">Predicted Peak</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">18.2 kWh</p>
                    <p className="text-xs text-slate-500">Daily Forecast</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-teal-400">$2.18</p>
                    <p className="text-xs text-slate-500">Est. Savings</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-400">3</p>
                    <p className="text-xs text-slate-500">Active Alerts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Drive Sustainability Forward</h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto">
            Track your environmental impact with precise CO2 reduction metrics, carbon savings, and alignment with UN Sustainable Development Goals.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '7.6 kg', label: 'CO2 Reduced Daily', color: 'text-emerald-400' },
              { value: '0.34', label: 'Trees Equivalent', color: 'text-teal-400' },
              { value: '68%', label: 'Renewable Contribution', color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Optimize Your Solar Energy?</h2>
          <p className="text-slate-400 mb-8">Join the smart energy revolution. Monitor, predict, and manage your solar system with AI.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 text-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-slate-500">AI Smart Solar Monitoring System</span>
          </div>
          <p className="text-xs text-slate-600">Arduino UNO + ESP8266 + MQTT + AI</p>
        </div>
      </footer>
    </div>
  );
}
