import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  onConfirm,
  onClose,
  type = 'warning'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} className="text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />;
      default:
        return <HelpCircle size={24} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/35 border-rose-100 dark:border-rose-900/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/35 border-amber-100 dark:border-amber-900/30';
      default:
        return 'bg-blue-50 dark:bg-blue-950/35 border-blue-100 dark:border-blue-900/30';
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/45 backdrop-blur-[2px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 max-w-sm w-full relative z-10 p-6 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors active:scale-90 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Action Icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 mb-4 shrink-0 shadow-xs ${getIconBg()}`}>
            {getIcon()}
          </div>

          {/* Text Content */}
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2.5 w-full mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-sm ${getConfirmBtnClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
