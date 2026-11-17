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
          success: <CheckCircle2 className="h-5 w-5 text-[#F59E0B] shrink-0" />,
          info: <Info className="h-5 w-5 text-[#EA580C] shrink-0" />,
          warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
          error: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
        };

        const borderMap = {
          success: 'border-[#F59E0B]/45',
          info: 'border-[#EA580C]/50',
          warning: 'border-amber-500/45',
          error: 'border-rose-500/45',
        };

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${borderMap[toast.type]} bg-[#1D1511]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-150`}
          >
            <div className="mt-0.5">{iconMap[toast.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#FAF5F0] leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-[#D6C7BA] leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md p-1 text-[#A89789] hover:bg-[#33251D] hover:text-white transition-colors"
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
