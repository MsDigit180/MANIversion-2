import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  GraduationCap,
  Package,
  ChevronLeft,
  ChevronRight,
  Building2,
  Database,
  Wifi,
  WifiOff,
  CloudCheck,
  RefreshCw,
  Settings,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabKey } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isSidebarCollapsed,
    toggleSidebar,
    campus,
    setCampus,
    networkStatus,
    toggleNetworkSimulation,
    syncQueue,
    isSyncing,
    triggerSync,
    payments,
  } = useApp();

  // Navigation items mapping
  const navItems: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { key: 'dashboard', label: 'Vue d\'Ensemble', icon: LayoutDashboard },
    { key: 'inscriptions', label: 'Inscriptions & Scolarité', icon: Users },
    { key: 'paiements', label: 'Paiements & Caisse', icon: CreditCard },
    { key: 'concours', label: 'Concours Professionnels', icon: GraduationCap },
    { key: 'boutique', label: 'Boutique & Stocks', icon: Package },
    { key: 'settings', label: 'Paramètres & Sécurité', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-md shadow-indigo-600/20">
              MANI
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Cabinet MANI
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Appuis Scolaires & Concours
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-black text-xs text-white shadow-md shadow-indigo-600/20">
            MANI
          </div>
        )}

        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Campus Selector */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Site d'Appui Actif
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200">
            <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-full cursor-pointer font-medium"
            >
              <option value="Site Niamey 2000 (Siège Principal)" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                Site Niamey 2000 (Siège Principal)
              </option>
              <option value="Site Niamey Plateau" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                Site Niamey Plateau
              </option>
              <option value="Site Niamey Yantala" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                Site Niamey Yantala
              </option>
              <option value="Site Niamey Koira Kano" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                Site Niamey Koira Kano
              </option>
              <option value="Site Niamey Talladjé" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                Site Niamey Talladjé
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Administratif
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setCurrentTab(item.key)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                }`}
              />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Offline-First Persistence / Architecture Card */}
      {!isSidebarCollapsed ? (
        <div className="m-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              <span>Offline-First Engine</span>
            </div>
            {networkStatus === 'online' ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="En ligne" />
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-amber-500" title="Hors-ligne" />
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2.5">
            Écritures stockées en cache local (IndexedDB) pour résister aux coupures réseau.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">File locale :</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {syncQueue.length} {syncQueue.length <= 1 ? 'action' : 'actions'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center">
          <button
            onClick={toggleNetworkSimulation}
            title={networkStatus === 'online' ? 'En ligne' : 'Hors-ligne'}
            className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {networkStatus === 'online' ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-500" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
