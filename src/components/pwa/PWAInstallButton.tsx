import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'sidebar' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, hide prompt
  if (isInstalled) {
    return null;
  }

  // Handle Chrome / Edge / Android install prompt
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS, we still can show a discreet prompt or suppress it
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={handleInstallClick}
          className={`group flex w-full items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer ${className}`}
          title="Installer l'application sur votre bureau ou mobile"
        >
          <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate">Installer l'Application</span>
        </button>
      ) : variant === 'banner' ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-purple-500/10 p-3.5 backdrop-blur-sm shadow-sm ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Application Installable (PWA)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Installez Cab-Appuis sur votre poste pour un lancement instantané et une utilisation hors-ligne.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Installer</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:shadow transition-all cursor-pointer ${className}`}
          title="Installer l'application sur cet appareil"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Installer l'App</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Smartphone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Installation sur iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pour ajouter le back-office Cabinet MANI à votre écran d'accueil iOS :
            </p>

            <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                  1
                </span>
                <span>
                  Appuyez sur l'icône de <strong className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1"><Share className="h-3 w-3 inline text-indigo-500" /> Partager</strong> dans la barre inférieure de Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                  2
                </span>
                <span>
                  Faites défiler vers le bas et touchez <strong className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1"><PlusSquare className="h-3 w-3 inline text-indigo-500" /> Sur l'écran d'accueil</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                  3
                </span>
                <span>
                  Touchez <strong className="font-semibold text-indigo-600 dark:text-indigo-400">Ajouter</strong> en haut à droite pour finaliser l'installation.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
