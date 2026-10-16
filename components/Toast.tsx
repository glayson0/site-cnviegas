'use client';

import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useLibrary();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-zinc-300 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />,
        };

        const borderStyles = {
          success: 'border-red-600 bg-black text-white',
          error: 'border-red-600 bg-red-950 text-white',
          info: 'border-zinc-700 bg-black text-white',
          warning: 'border-red-600 bg-black text-white',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${
              borderStyles[toast.type || 'success']
            }`}
          >
            {icons[toast.type || 'success']}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-snug">{toast.title}</h4>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
