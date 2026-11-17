import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="h-5 w-5 text-[#00E5FF] shrink-0" />,
          info: <Info className="h-5 w-5 text-[#2563EB] shrink-0" />,
          warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
          error: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
        };

        const borderMap = {
          success: 'border-[#00E5FF]/40',
          info: 'border-[#2563EB]/50',
          warning: 'border-amber-500/40',
          error: 'border-rose-500/40',
        };

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${borderMap[toast.type]} bg-[#131B2E]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-150`}
          >
            <div className="mt-0.5">{iconMap[toast.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#F8FAFC] leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
