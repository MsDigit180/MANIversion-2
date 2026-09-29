/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/auth/LoginView';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { KPIHighlights } from './components/dashboard/KPIHighlights';
import { OperationsFeed } from './components/dashboard/OperationsFeed';
import { PriorityAlerts } from './components/dashboard/PriorityAlerts';
import { InscriptionsTab } from './components/tabs/InscriptionsTab';
import { PaiementsTab } from './components/tabs/PaiementsTab';
import { ConcoursTab } from './components/tabs/ConcoursTab';
import { BoutiqueTab } from './components/tabs/BoutiqueTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { NewEnrollmentModal } from './components/modals/NewEnrollmentModal';
import { NewPaymentModal } from './components/modals/NewPaymentModal';
import { NewSupplySaleModal } from './components/modals/NewSupplySaleModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { RestockModal } from './components/modals/RestockModal';
import { NewExamDossierModal } from './components/modals/NewExamDossierModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { StopTutoringModal } from './components/modals/StopTutoringModal';
import { SyncDrawerModal } from './components/modals/SyncDrawerModal';
import { GlobalSearchPalette } from './components/modals/GlobalSearchPalette';
import { Toast } from './components/common/Toast';
import {
  Users,
  CreditCard,
  GraduationCap,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Settings,
} from 'lucide-react';
import { TabKey } from './types';

const DashboardContent: React.FC = () => {
  const { currentTab, setCurrentTab, campus, timePeriod, isAuthenticated, theme } = useApp();
  const [embeddedTab, setEmbeddedTab] = useState<'inscriptions' | 'paiements' | 'concours' | 'boutique'>('inscriptions');

  // If not authenticated, render Login view
  if (!isAuthenticated) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <LoginView />
        <Toast />
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'today':
        return 'Aujourd\'hui';
      case 'week':
        return 'Cette Semaine';
      case 'month': {
        const now = new Date();
        const mName = now.toLocaleString('fr-FR', { month: 'long' });
        const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1);
        return `Mois de ${capitalized} ${now.getFullYear()}`;
      }
      case 'term':
        return '2ème Trimestre';
      default:
        return 'Année 2025-2026';
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Retractable Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TopBar with 3-Zone Contract & Theme Switcher */}
        <TopBar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Contextual Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Cab-Appuis</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{campus}</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {currentTab === 'dashboard' && 'Centre de Contrôle Administratif'}
                    {currentTab === 'inscriptions' && 'Inscriptions & Registre Scolaire'}
                    {currentTab === 'paiements' && 'Journal de Caisse & Règlements'}
                    {currentTab === 'concours' && 'Pôle Concours Fonction Publique'}
                    {currentTab === 'boutique' && 'Fournitures & Magasin Central'}
                    {currentTab === 'settings' && 'Paramètres, Sécurité & Profil'}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  {currentTab === 'dashboard' && 'Tableau de Bord Back-Office'}
                  {currentTab === 'inscriptions' && 'Gestion des Élèves & Suivi Pédagogique'}
                  {currentTab === 'paiements' && 'Gestion de la Caisse, Reçus & Relances'}
                  {currentTab === 'concours' && 'Inscriptions & Dossiers Concours Directs'}
                  {currentTab === 'boutique' && 'Vente & Inventaire des Fournitures'}
                  {currentTab === 'settings' && 'Paramètres Généraux & Gestion des Identifiants'}
                </h1>
              </div>

              {/* Status indicator tag */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 shadow-sm">
                  {getPeriodLabel()}
                </span>
                <span className="hidden md:inline text-slate-300 dark:text-slate-600">·</span>
                <span className="hidden md:inline text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Mode Offline-First actif
                </span>
              </div>
            </div>

            {/* TAB: DASHBOARD VIEW */}
            {currentTab === 'dashboard' && (
              <>
                {/* 1. KPI Highlights */}
                <KPIHighlights />

                {/* 2. Main Content Grid (Operations Feed + Priority Alerts) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Operations Feed with explicit agent names */}
                  <div className="lg:col-span-2">
                    <OperationsFeed />
                  </div>

                  {/* Right 1 Col: Priority Alerts */}
                  <div className="lg:col-span-1">
                    <PriorityAlerts />
                  </div>
                </div>

                {/* 3. Modular Tabbed Section for Quick Access & Operations */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Vue d'Ensemble Modulaire par Pôles
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Aperçu interactif des 4 piliers métier de Cab-Appuis.
                      </p>
                    </div>

                    {/* Segmented Tab Controller */}
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700/80 p-1 text-xs border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setEmbeddedTab('inscriptions')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                          embeddedTab === 'inscriptions'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Scolarité</span>
                      </button>

                      <button
                        onClick={() => setEmbeddedTab('paiements')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                          embeddedTab === 'paiements'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Caisse & Reçus</span>
                      </button>

                      <button
                        onClick={() => setEmbeddedTab('concours')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                          embeddedTab === 'concours'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>Concours</span>
                      </button>

                      <button
                        onClick={() => setEmbeddedTab('boutique')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                          embeddedTab === 'boutique'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>Boutique</span>
                      </button>
                    </div>
                  </div>

                  {/* Embedded Tab Display */}
                  <div className="mt-4">
                    {embeddedTab === 'inscriptions' && <InscriptionsTab />}
                    {embeddedTab === 'paiements' && <PaiementsTab />}
                    {embeddedTab === 'concours' && <ConcoursTab />}
                    {embeddedTab === 'boutique' && <BoutiqueTab />}
                  </div>
                </div>
              </>
            )}

            {/* DIRECT FULL TABS */}
            {currentTab === 'inscriptions' && <InscriptionsTab />}
            {currentTab === 'paiements' && <PaiementsTab />}
            {currentTab === 'concours' && <ConcoursTab />}
            {currentTab === 'boutique' && <BoutiqueTab />}
            {currentTab === 'settings' && <SettingsTab />}
          </div>
        </main>
      </div>

      {/* Global Interactive Modals & Drawers */}
      <NewEnrollmentModal />
      <NewPaymentModal />
      <NewSupplySaleModal />
      <NewProductModal />
      <RestockModal />
      <NewExamDossierModal />
      <ReceiptModal />
      <StopTutoringModal />
      <SyncDrawerModal />
      <GlobalSearchPalette />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
