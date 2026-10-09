import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info('[PWA] Nouvelle version prête. Mise à jour automatique en cours...');
      },
      onOfflineReady() {
        console.info('[PWA] Le back-office Cabinet MANI est prêt pour le fonctionnement hors-ligne.');
      },
      onRegisterError(error: unknown) {
        console.warn('[PWA] Enregistrement Service Worker échoué :', error);
      },
    });
    return updateSW;
  }
  return undefined;
}
