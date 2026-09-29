import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const getIcon = () => {
    switch (toastMessage.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-indigo-400 shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toastMessage.type) {
      case 'success':
        return 'border-emerald-500/30 bg-slate-900/95 text-emerald-200';
      case 'warning':
        return 'border-amber-500/30 bg-slate-900/95 text-amber-200';
      case 'info':
      default:
        return 'border-indigo-500/30 bg-slate-900/95 text-indigo-200';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-center gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur max-w-md ${getBorder()}`}
      >
        {getIcon()}
        <span className="text-xs font-medium text-slate-100">{toastMessage.text}</span>
      </div>
    </div>
  );
};
