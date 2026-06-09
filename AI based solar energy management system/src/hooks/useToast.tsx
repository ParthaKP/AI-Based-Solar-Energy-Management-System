import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Info, CheckCircle, X } from 'lucide-react';

type ToastSeverity = 'info' | 'warning' | 'critical' | 'success';

interface Toast {
  id: string;
  severity: ToastSeverity;
  title: string;
  message: string;
  timestamp: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (severity: ToastSeverity, title: string, message: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((severity: ToastSeverity, title: string, message: string) => {
    const id = `toast-${++idCounter}`;
    const toast: Toast = { id, severity, title, message, timestamp: Date.now() };
    setToasts(prev => [toast, ...prev].slice(0, 8));

    // Auto-dismiss: 6s for info/success, 10s for warning, never for critical
    if (severity !== 'critical') {
      const ms = severity === 'warning' ? 10000 : 6000;
      timers.current.set(id, setTimeout(() => removeToast(id), ms));
    }
  }, [removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
    timers.current.forEach(t => clearTimeout(t));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

const severityConfig: Record<ToastSeverity, { icon: React.ElementType; borderColor: string; bgColor: string; iconColor: string; accentBg: string }> = {
  critical: { icon: XCircle, borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/[0.07]', iconColor: 'text-rose-400', accentBg: 'bg-rose-500' },
  warning: { icon: AlertTriangle, borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/[0.07]', iconColor: 'text-amber-400', accentBg: 'bg-amber-500' },
  info: { icon: Info, borderColor: 'border-sky-500/30', bgColor: 'bg-sky-500/[0.07]', iconColor: 'text-sky-400', accentBg: 'bg-sky-500' },
  success: { icon: CheckCircle, borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/[0.07]', iconColor: 'text-emerald-400', accentBg: 'bg-emerald-500' },
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const cfg = severityConfig[toast.severity];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto relative overflow-hidden rounded-xl ${cfg.bgColor} backdrop-blur-xl border ${cfg.borderColor} shadow-2xl shadow-black/30`}
            >
              {/* Accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accentBg}`} />

              <div className="flex items-start gap-3 p-4 pl-5">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">{toast.message}</p>
                </div>
                <button
                  onClick={() => onRemove(toast.id)}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Auto-dismiss progress bar for non-critical */}
              {toast.severity !== 'critical' && (
                <motion.div
                  className={`h-0.5 ${cfg.accentBg} opacity-40`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: toast.severity === 'warning' ? 10 : 6, ease: 'linear' }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {toasts.length > 3 && (
        <button
          onClick={() => toasts.forEach(t => onRemove(t.id))}
          className="pointer-events-auto text-xs text-slate-500 hover:text-slate-300 transition-colors text-center py-1"
        >
          Dismiss all
        </button>
      )}
    </div>,
    document.body
  );
}
