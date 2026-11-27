import React, { useState, useRef, useEffect } from 'react';
import {
  WifiOff,
  RefreshCw,
  Search,
  Plus,
  Bell,
  UserCheck,
  CreditCard,
  GraduationCap,
  ShoppingBag,
  Clock,
  ChevronDown,
  PackagePlus,
  Sun,
  Moon,
  LogOut,
  Settings,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LiveClock } from '../common/LiveClock';
import { CAB_APPUIS_LOGO } from '../../assets/logo';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { TimePeriod } from '../../types';

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

  const pendingCount = (syncQueue || []).length;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-4 py-2 backdrop-blur md:px-5 transition-colors duration-200">
      {/* Zone 1: Brand & Period Selector */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2 focus:outline-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <img
            src={CAB_APPUIS_LOGO}
            alt="Logo Cabinet MANI"
            className="h-8 w-8 shrink-0 rounded-xl object-contain border border-indigo-200 dark:border-slate-700 bg-white p-0.5 shadow-sm"
          />
          <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            Cabinet MANI
          </span>
        </button>

        {/* Period Selector: Segmented buttons on md+, compact select on smaller screens */}
        <div className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2.5 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTimePeriod('today')}
              className={`rounded-lg px-2 py-1 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                timePeriod === 'today'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod('week')}
              className={`rounded-lg px-2 py-1 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                timePeriod === 'week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod('month')}
              className={`rounded-lg px-2 py-1 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                timePeriod === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ce mois
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod('term')}
              className={`rounded-lg px-2 py-1 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                timePeriod === 'term'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Trimestre
            </button>
          </div>
        </div>

        {/* Compact Period Selector for < md */}
        <select
          aria-label="Sélectionner la période"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="md:hidden h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="today">Aujourd&apos;hui</option>
          <option value="week">Semaine</option>
          <option value="month">Ce mois</option>
          <option value="term">Trimestre</option>
        </select>

        {/* Compact Live Clock */}
        <LiveClock />
      </div>

      {/* Zone 2 & 3: Search, Network Sync & All Action Buttons (always visible) */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {/* Global Search trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors w-36 sm:w-44 lg:w-48 whitespace-nowrap shrink-0 cursor-pointer"
          title="Rechercher élève, reçu, dossier (Touche /)"
        >
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-left">Rechercher...</span>
          <kbd className="hidden sm:inline-block ml-auto rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            /
          </kbd>
        </button>

        {/* Offline / Syncing Status Indicator (when applicable) */}
        {networkStatus === 'offline' && (
          <button
            type="button"
            onClick={toggleNetworkSimulation}
            title="Mode hors-ligne actif. Cliquez pour rétablir la connexion"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">Hors-ligne</span>
            {pendingCount > 0 && (
              <span className="rounded bg-amber-400/20 px-1 text-[11px] font-mono text-amber-800 dark:text-amber-200">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {networkStatus === 'online' && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsSyncDrawerOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="Sync en attente"
          >
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="rounded bg-amber-500/30 px-1.5 py-0.5 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-200">
              {pendingCount}
            </span>
          </button>
        )}

        {isSyncing && (
          <div className="flex h-9 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-2.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap shrink-0">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500 shrink-0" />
            <span>Sync...</span>
          </div>
        )}

        {/* PWA In-App Install Trigger */}
        <PWAInstallButton />

        {/* Dynamic Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
          title={theme === 'dark' ? 'Passer en Mode Clair (Lumière)' : 'Passer en Mode Sombre (Nuit)'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-medium text-amber-400">Clair</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="font-medium text-indigo-600">Sombre</span>
            </>
          )}
        </button>

        {/* Quick Sync Button if pending */}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={triggerSync}
            disabled={isSyncing || networkStatus === 'offline'}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Pousser immédiatement les écritures locales"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingCount})</span>
          </button>
        )}

        {/* Primary Action: + Nouvelle Opération Dropdown */}
        <div className="relative shrink-0" ref={opsDropdownRef}>
          <button
            type="button"
            onClick={() => setIsOperationsDropdownOpen(!isOperationsDropdownOpen)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Nouvelle Opération</span>
            <ChevronDown className="h-3 w-3 opacity-80 shrink-0" />
          </button>

          {isOperationsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs shadow-xl ring-1 ring-black/10 dark:ring-black/50 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Opérations Rapides
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOperationsDropdownOpen(false);
                  setIsNewStudentModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <span>Inscription d&apos;un Élève</span>
              </button>

              <button
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
          type="button"
          onClick={() => setIsSyncDrawerOpen(true)}
          aria-label="Notifications et file d'attente de synchronisation"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
        <div className="relative shrink-0" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            aria-label="Menu du profil utilisateur"
            className="flex h-9 items-center gap-1.5 px-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.fullName || 'Utilisateur'}
              className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0"
            />
            <div className="hidden 2xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[110px] truncate">
                {currentUser?.fullName || 'Admin'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[110px] truncate">
                {currentUser?.role || 'Admin Principal'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{currentUser?.fullName || 'Admin'}</span>
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {currentUser?.role || 'Admin Principal'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {currentUser?.email || 'admin@cabappuis.ne'}
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setCurrentTab('settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Paramètres &amp; Mot de Passe</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
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
