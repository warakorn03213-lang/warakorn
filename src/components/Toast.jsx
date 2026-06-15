import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-800 dark:text-rose-300',
    iconColor: 'text-rose-500 dark:text-rose-400',
    progress: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-800 dark:text-amber-300',
    iconColor: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/60',
    text: 'text-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-500 dark:text-blue-400',
    progress: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;
  const duration = toast.duration || 3500;

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`relative w-80 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-lg shadow-slate-900/5 dark:shadow-black/20 overflow-hidden transition-all duration-300 ease-out ${config.bg} ${config.border} ${
        isExiting
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-[slideInRight_0.35s_cubic-bezier(0.34,1.56,0.64,1)]'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={18} className={`${config.iconColor} shrink-0 mt-0.5`} />
        <p className={`text-sm font-semibold leading-relaxed flex-1 ${config.text}`}>
          {toast.message}
        </p>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className={`p-0.5 rounded-full transition-colors cursor-pointer shrink-0 ${config.text} opacity-50 hover:opacity-100`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-black/5 dark:bg-white/5">
        <div
          className={`h-full ${config.progress} opacity-60`}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
