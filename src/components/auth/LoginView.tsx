import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  AlertCircle,
  Sun,
  Moon,
  Database,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

export const LoginView: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();

  // STRICTLY EMPTY INITIAL VALUES - NEVER PRE-FILLED
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Veuillez renseigner votre identifiant de connexion.');
      return;
    }
    if (!password) {
      setErrorMessage('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);

    // Authentication verification (admin/1234 or configured users verified in background)
    setTimeout(() => {
      const res = login(cleanUsername, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Identifiant ou mot de passe incorrect.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header bar with Theme toggle */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src={CAB_APPUIS_LOGO}
            alt="Logo Cabinet d'Appuis Scolaire MANI"
            className="h-11 w-11 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5 shadow-md shadow-indigo-500/10"
          />
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              Cabinet d'Appuis Scolaire MANI
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Quartier Niamey 2000, Niamey (Niger) · NIF: 153633/P · RCCM: NE-NIM-A10-05126
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Portail Sécurisé</span>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline text-amber-300 font-medium">Clair</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-600" />
                <span className="hidden sm:inline text-indigo-600 font-medium">Sombre</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl dark:shadow-2xl dark:shadow-black/60 backdrop-blur">
            {/* Title & Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/10 p-2 mb-3 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="Emblème Officiel Cabinet MANI"
                  className="w-16 h-16 rounded-xl object-contain bg-white shadow-sm border border-slate-200 dark:border-slate-700"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Portail d'Accès Cab-Appuis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Espace sécurisé · Cabinet d'Appuis Scolaire MANI (Niamey 2000)
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form - Strictly Empty by Default */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom d'utilisateur <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Identifiant"
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mot de passe <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm py-3 px-4 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* System status pill footer */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 text-center">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              <span>Cloud Firestore Synced</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Site Niamey 2000 (Siège)</span>
            </span>
            <span>·</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              📞 +227 91 58 44 59 / 96 16 51 81
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
        © 2026 Cabinet d'Appuis Scolaire MANI · Quartier Niamey 2000, Niamey (Niger) · NIF: 153633/P · RCCM: NE-NIM-A10-05126
      </footer>
    </div>
  );
};
