import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Plus,
  Bell,
  UserCheck,
  CreditCard,
  GraduationCap,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ChevronDown,
  PackagePlus,
  Sun,
  Moon,
  LogOut,
  Settings,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LiveClock } from '../common/LiveClock';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

export const TopBar: React.FC = () => {
  const {
    networkStatus,
    toggleNetworkSimulation,
    syncQueue,
    isSyncing,
    triggerSync,
    timePeriod,
    setTimePeriod,
    setIsNewStudentModalOpen,
    setIsNewPaymentModalOpen,
    setIsNewSupplySaleModalOpen,
    setIsNewProductModalOpen,
    setIsNewExamModalOpen,
    setIsSyncDrawerOpen,
    setIsSearchOpen,
    theme,
    toggleTheme,
    currentUser,
    logout,
    setCurrentTab,
  } = useApp();

  const [isOperationsDropdownOpen, setIsOperationsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const opsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (opsDropdownRef.current && !opsDropdownRef.current.contains(e.target as Node)) {
        setIsOperationsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingCount = syncQueue.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-4 backdrop-blur md:px-6 transition-colors duration-200">
      {/* Zone 1: Brand title & logo only */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2.5 focus:outline-none cursor-pointer"
        >
          <img
            src={CAB_APPUIS_LOGO}
            alt="Logo Cabinet MANI"
            className="h-9 w-9 shrink-0 rounded-xl object-contain border border-indigo-200 dark:border-slate-700 bg-white p-0.5 shadow-sm"
          />
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
              Cabinet MANI
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Niamey 2000
            </span>
          </div>
        </button>

        {/* Dynamic Period Selector */}
        <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Période :</span>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700/80 p-0.5 text-xs">
            <button
              onClick={() => setTimePeriod('today')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                timePeriod === 'today'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setTimePeriod('week')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                timePeriod === 'week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cette semaine
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                timePeriod === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ce mois
            </button>
            <button
              onClick={() => setTimePeriod('term')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                timePeriod === 'term'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Trimestre
            </button>
          </div>
        </div>

        {/* Live Clock Component */}
        <LiveClock />
      </div>

      {/* Zone 2: Global Search & Network State Indicator */}
      <div className="flex items-center gap-3">
        {/* Global Search trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors w-36 sm:w-60 cursor-pointer"
          title="Rechercher élève, reçu, dossier (Touche /)"
        >
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-left">Élève, reçu, dossier...</span>
          <kbd className="hidden sm:inline-block ml-auto rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            /
          </kbd>
        </button>

        {/* Network & Offline-First Status Pill with simulator trigger */}
        <div className="flex items-center">
          {networkStatus === 'online' && pendingCount === 0 && (
            <button
              onClick={toggleNetworkSimulation}
              title="Cliquez pour basculer en mode hors-ligne (simulateur)"
              className="group flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">En ligne</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 group-hover:text-emerald-500">· Sync OK</span>
            </button>
          )}

          {networkStatus === 'offline' && (
            <button
              onClick={toggleNetworkSimulation}
              title="Mode hors-ligne actif. Cliquez pour rétablir la connexion"
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
            >
              <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">Hors-ligne</span>
              {pendingCount > 0 && (
                <span className="rounded bg-amber-400/20 px-1 text-[11px] font-mono text-amber-800 dark:text-amber-200">
                  {pendingCount} en attente
                </span>
              )}
            </button>
          )}

          {networkStatus === 'online' && pendingCount > 0 && (
            <button
              onClick={() => setIsSyncDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Sync en attente</span>
              <span className="rounded bg-amber-500/30 px-1.5 py-0.2 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-200">
                {pendingCount}
              </span>
            </button>
          )}

          {isSyncing && (
            <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span>Synchronisation...</span>
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Actions, Theme Switcher & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* DYNAMIC THEME TOGGLE BUTTON (MANDATORY FIX) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all cursor-pointer"
          title={theme === 'dark' ? 'Passer en Mode Clair (Lumière)' : 'Passer en Mode Sombre (Nuit)'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline font-medium text-amber-400">Mode Clair</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline font-medium text-indigo-600">Mode Sombre</span>
            </>
          )}
        </button>

        {/* Quick Sync Button if pending */}
        {pendingCount > 0 && (
          <button
            onClick={triggerSync}
            disabled={isSyncing || networkStatus === 'offline'}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors"
            title="Pousser immédiatement les écritures locales"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingCount})</span>
          </button>
        )}

        {/* Primary Action: + Nouvelle Opération Dropdown */}
        <div className="relative" ref={opsDropdownRef}>
          <button
            onClick={() => setIsOperationsDropdownOpen(!isOperationsDropdownOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Nouvelle Opération</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {isOperationsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs shadow-xl ring-1 ring-black/10 dark:ring-black/50 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Opérations Rapides
              </div>
              <button
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewStudentModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <span>Inscription d'un Élève</span>
              </button>

              <button
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewPaymentModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <span>Encaisser un Paiement</span>
              </button>

              <button
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewSupplySaleModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </div>
                <span>Vente Fournitures Caisse</span>
              </button>

              <button
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewProductModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  <PackagePlus className="h-3.5 w-3.5" />
                </div>
                <span>Nouveau Produit Stock</span>
              </button>

              <button
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewExamModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <span>Candidature Concours</span>
              </button>
            </div>
          )}
        </div>

        {/* Sync Drawer trigger / Notification Bell */}
        <button
          onClick={() => setIsSyncDrawerOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          title="File des écritures locales et notifications"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900">
              {pendingCount}
            </span>
          )}
        </button>

        {/* User profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.fullName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/40"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{currentUser.fullName}</span>
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {currentUser.role}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {currentUser.email}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setCurrentTab('settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Paramètres & Mot de Passe</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
