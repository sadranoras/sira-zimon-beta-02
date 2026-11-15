import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 no-print">
      {toasts.map((t) => {
        const tone =
          t.type === 'success'
            ? 'bg-slate-900 dark:bg-emerald-950 text-white border-emerald-500 dark:border-emerald-700'
            : t.type === 'error'
              ? 'bg-rose-900 text-white border-rose-500 dark:border-rose-700'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';
        return (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-sm ${tone}`}
          >
            <span className="leading-relaxed">{t.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="بستن پیام"
              className="p-1 opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
