import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration loading
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.warn('Impossible de lire firebase-applet-config.json', e);
  }
}

const fbApp = getApps().length > 0 ? getApp() : initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
});

const firestoreDatabaseId =
  process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  firebaseConfig.firestoreDatabaseId ||
  '(default)';

const db = getFirestore(fbApp, firestoreDatabaseId);

const ALLOWED_COLLECTIONS = new Set([
  'agents',
  'students',
  'payments',
  'exams',
  'tutors',
  'inventory',
  'supplySales',
  'operations',
  'alerts',
  'settings',
]);

function sanitizeForFirestore(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.filter((item) => item !== undefined).map(sanitizeForFirestore);
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  return data;
}

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    policy: 'NO_MOCK_STRICT_FIREBASE_ONLY',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// REST API BACK-END : STRICT DATA CONTRACT
// ==========================================

// GET /api/data/:collection
app.get('/api/data/:collection', async (req, res) => {
  const collectionName = req.params.collection;
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return res.status(404).json({
      status: 'error',
      message: `Collection "${collectionName}" non reconnue.`,
    });
  }

  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const results: any[] = [];
    snap.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });

    // RÈGLE 2 : ÉTAT INITIAL VIDE -> Conserve cet état vide ([]).
    return res.json({
      status: 'success',
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Erreur lors de la lecture Firestore.',
    });
  }
});

// GET /api/data/:collection/:id
app.get('/api/data/:collection/:id', async (req, res) => {
  const { collection: collectionName, id } = req.params;
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return res.status(404).json({
      status: 'error',
      message: `Collection "${collectionName}" non reconnue.`,
    });
  }

  try {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({
        status: 'error',
        message: `Document avec l'identifiant "${id}" introuvable.`,
      });
    }

    return res.json({
      status: 'success',
      data: { id: snap.id, ...snap.data() },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Erreur lors de la récupération Firestore.',
    });
  }
});

// POST /api/data/:collection (CREATE / MUTATION EXCLUSIVE)
app.post('/api/data/:collection', async (req, res) => {
  const collectionName = req.params.collection;
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return res.status(404).json({
      status: 'error',
      message: `Collection "${collectionName}" non reconnue.`,
    });
  }

  const payload = req.body;

  // Validation stricte du payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length === 0) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : aucune donnée fournie pour l'insertion.",
    });
  }

  // Validation structurelle minimale par collection
  if (collectionName === 'students' && !payload.fullName?.trim()) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : 'fullName' est obligatoire pour un élève.",
    });
  }
  if (collectionName === 'payments' && (payload.amount === undefined || payload.amount === null || typeof payload.amount !== 'number')) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : 'amount' (nombre positif) est obligatoire pour un paiement.",
    });
  }
  if (collectionName === 'exams' && (!payload.candidateName?.trim() || !payload.competitionName?.trim())) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : 'candidateName' et 'competitionName' sont obligatoires.",
    });
  }
  if (collectionName === 'tutors' && !payload.fullName?.trim()) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : 'fullName' est obligatoire pour un encadreur.",
    });
  }
  if (collectionName === 'inventory' && !payload.name?.trim()) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : 'name' est obligatoire pour un article d'inventaire.",
    });
  }

  try {
    const docId = payload.id || `${collectionName.slice(0, 3)}-${Date.now()}`;
    const sanitizedData = sanitizeForFirestore({
      ...payload,
      id: docId,
      createdAt: payload.createdAt || new Date().toISOString(),
    });

    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, sanitizedData, { merge: true });

    return res.status(201).json({
      status: 'success',
      message: `Document inséré avec succès dans la collection "${collectionName}".`,
      data: sanitizedData,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Erreur lors de la création Firestore.',
    });
  }
});

// PUT & PATCH /api/data/:collection/:id (UPDATE / MUTATION)
const handleUpdate = async (req: express.Request, res: express.Response) => {
  const { collection: collectionName, id } = req.params;
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return res.status(404).json({
      status: 'error',
      message: `Collection "${collectionName}" non reconnue.`,
    });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length === 0) {
    return res.status(400).json({
      status: 'error',
      message: "Payload invalide : aucune donnée fournie pour l'insertion.",
    });
  }

  try {
    const docRef = doc(db, collectionName, id);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      return res.status(404).json({
        status: 'error',
        message: `Document avec l'identifiant "${id}" introuvable.`,
      });
    }

    const sanitizedData = sanitizeForFirestore({
      ...payload,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, sanitizedData, { merge: true });

    return res.json({
      status: 'success',
      message: `Document "${id}" mis à jour avec succès dans "${collectionName}".`,
      data: { id, ...existing.data(), ...sanitizedData },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Erreur lors de la mise à jour Firestore.',
    });
  }
};

app.put('/api/data/:collection/:id', handleUpdate);
app.patch('/api/data/:collection/:id', handleUpdate);

// DELETE /api/data/:collection/:id (DELETE / MUTATION EXCLUSIVE)
app.delete('/api/data/:collection/:id', async (req, res) => {
  const { collection: collectionName, id } = req.params;
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return res.status(404).json({
      status: 'error',
      message: `Collection "${collectionName}" non reconnue.`,
    });
  }

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    return res.json({
      status: 'success',
      message: `Document "${id}" supprimé avec succès de "${collectionName}".`,
      id,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Erreur lors de la suppression Firestore.',
    });
  }
});

// ==========================================
// STATIC ASSETS & VITE SPA INTEGRATION
// ==========================================

async function startServer() {
  if (!isProduction) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode (Render.com monolith): Serve compiled static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // SPA Fallback: All uncaught GET requests return index.html
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Back-Office Cab-Appuis Backend running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
    console.log(`📡 URL: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
