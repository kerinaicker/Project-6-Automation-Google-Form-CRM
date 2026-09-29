import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  details?: string[];
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  details,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="confirm-modal-box"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150"
      >
        <div className="p-7">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isDestructive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-6">{title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{message}</p>

              {details && details.length > 0 && (
                <div className="mt-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 font-mono">
                  {details.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-7 py-4 flex items-center justify-end gap-2.5 border-t border-slate-200">
          <button
            id="modal-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
          >
            {cancelLabel}
          </button>
          <button
            id="modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Check className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
