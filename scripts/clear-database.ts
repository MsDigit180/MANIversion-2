import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('Connexion à Firebase pour le projet :', firebaseConfig.projectId);
console.log('Database ID :', firebaseConfig.firestoreDatabaseId || '(default)');

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const COLLECTIONS_TO_CLEAR = [
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
  'test',
];

async function clearAllCollections() {
  console.log('Démarrage de la purge complète de Firestore...');
  let totalDeleted = 0;

  for (const colName of COLLECTIONS_TO_CLEAR) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Collection "${colName}" : ${snapshot.size} documents trouvés.`);

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
        totalDeleted++;
      }

      if (snapshot.size > 0) {
        console.log(`  -> Tous les documents de "${colName}" ont été supprimés.`);
      }
    } catch (err: any) {
      console.error(`Erreur lors du vidage de "${colName}" :`, err?.message || err);
    }
  }

  console.log(`\nPurge terminée avec succès : ${totalDeleted} documents supprimés au total.`);
  process.exit(0);
}

clearAllCollections().catch((err) => {
  console.error('Erreur fatale lors de la purge :', err);
  process.exit(1);
});
