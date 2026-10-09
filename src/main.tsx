import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupPWA } from './pwaRegister';

// Initialize Service Worker for PWA offline caching & auto-updates
setupPWA();

createRoot(document.getElementById('root')!).render(<App />);

