export type NetworkStatus = 'online' | 'offline' | 'syncing';

export type TimePeriod = 'today' | 'week' | 'month' | 'term' | 'year';

export type TabKey = 'dashboard' | 'inscriptions' | 'paiements' | 'concours' | 'encadreurs' | 'boutique' | 'settings';

export type ThemeMode = 'dark' | 'light';

export type SyncState = 'synced' | 'pending';

export type AgentRole =
  | 'Administrateur Principal'
  | 'Responsable Pédagogique'
  | 'Agent de Caisse'
  | 'Responsable Inscriptions'
  | 'Secrétaire d\'Accueil';

export interface Agent {
  id: string;
  username: string;
  fullName: string;
  gender?: 'Masculin (M)' | 'Féminin (F)';
  role: AgentRole;
  email: string;
  phone?: string;
  campus: string;
  avatar?: string;
  password?: string;
  active: boolean;
  createdAt?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'inscription' | 'paiement' | 'vente' | 'concours';
  description: string;
  timestamp: string;
  payload: any;
  status: 'pending' | 'syncing' | 'failed';
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
}

export type TutoringStatus = 'Actif' | 'Arrêté (À la demande)' | 'Arrêté (Défaut de paiement)';

export interface StudentTutorAssignment {
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  tutorPhone?: string;
  subjects: string[]; // specific subjects taught by this tutor to this student
  assignedAt?: string;
}

export interface Student {
  id: string;
  matricule: string;
  fullName: string;
  gender?: 'Masculin (M)' | 'Féminin (F)';
  avatar?: string;
  level: string; // e.g. "CM2 (CFEPD)", "CE2", "3ème (BEPC)", "Terminale D"
  stream: 'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours' | string;
  subjects: string[];
  guardianName: string;
  guardianPhone: string;
  sessionsPerWeek: number; // Nombre de séances d'encadrement par semaine (ex: 2, 3, 5 séances/semaine)
  monthlyFee: number; // in FCFA
  paidAmount: number;
  paymentStatus: 'A jour' | 'En retard' | 'Partiel';
  tutoringStatus: TutoringStatus;
  stopDate?: string;
  stopReason?: string;
  enrollmentDate: string;
  syncStatus: SyncState;
  notes?: string;
  tutorId?: string; // Reference tutor for primary school (1 tutor max rule)
  tutorIds?: string[]; // Multiple tutors for college/lycée
  tutorAssignments?: StudentTutorAssignment[]; // Rich subject-based tutor assignments
  // Relational link to staff
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface TutoringSession {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  studentId: string;
  studentName: string;
  studentLevel?: string;
  subject: string;
  dayOfWeek?: string; // e.g. "Lundi", "Mercredi", "Samedi"
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "10:00"
  durationHours: number; // e.g. 1.5 (1h 30mn)
  date: string;
  status: 'Planifiée' | 'Effectuée' | 'Annulée';
}

export interface Tutor {
  id: string;
  matricule: string;
  fullName: string;
  gender?: 'Masculin (M)' | 'Féminin (F)';
  phone: string;
  email: string;
  avatar?: string;
  subjects: string[];
  levels: string[]; // e.g. ["Primaire", "Collège", "Lycée", "Supérieur"]
  assignedStudentIds: string[];
  assignedStudentSubjects?: Record<string, string[]>; // studentId -> list of subjects taught to this student
  sessions: TutoringSession[];
  totalHours: number;
  syncStatus: SyncState;
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // e.g. "REC-2026-0842"
  studentId?: string; // Foreign key linking to Student
  studentName: string;
  category: 'Scolarité Mensuelle' | 'Inscription' | 'Frais Concours' | 'Fournitures';
  amount: number; // in FCFA
  paymentMethod:
    | 'Espèces'
    | 'Airtel Money'
    | 'Moov Flooz'
    | 'Al Izza / Nita Transfert'
    | 'Wave / Mobile Money'
    | 'Virement Bancaire'
    | string;
  paymentDate: string;
  cashierName: string;
  status: 'Validé' | 'En attente' | 'Annulé';
  syncStatus: SyncState;
  notes?: string;
  // Relational link to staff
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface ExamApplication {
  id: string;
  dossierNumber: string; // e.g. "CNR-2026-019"
  candidateName: string;
  gender?: 'Masculin (M)' | 'Féminin (F)';
  studentId?: string; // Optional foreign key if the candidate is already an enrolled student
  examType:
    | 'ENA / ENAM'
    | 'Police Nationale'
    | 'Gendarmerie Nationale'
    | 'Garde Nationale (GNN)'
    | 'Douanes & Trésor'
    | 'Santé Publique (ENSP)'
    | 'Fonction Publique'
    | string;
  examBatch: string;
  requiredPieces: string[];
  submittedPieces: string[];
  status: 'Validé' | 'En instruction' | 'Pièces manquantes' | 'Admis';
  contactPhone: string;
  submissionDate: string;
  syncStatus: SyncState;
  // Relational link to staff
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Manuels & Annales' | 'Cahiers & Stylos' | 'Tenues & Blasons' | 'Outils & Géométrie' | string;
  unitPrice: number;
  stockQuantity: number;
  minThreshold: number;
  syncStatus: SyncState;
  description?: string;
  supplier?: string;
}

export interface SupplySale {
  id: string;
  saleNumber: string;
  customerName: string;
  studentId?: string; // Foreign key if student
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  paymentMethod: 'Espèces' | 'Wave / Mobile Money' | 'Orange Money' | 'Airtel Money' | 'Moov Flooz';
  saleDate: string;
  syncStatus: SyncState;
  // Relational link to staff
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface OperationItem {
  id: string;
  type: 'inscription' | 'paiement' | 'vente' | 'concours';
  title: string;
  subtitle: string;
  referenceId: string;
  studentId?: string; // Optional relation to student
  amount?: number;
  timestamp: string;
  syncStatus: SyncState;
  metaBadge?: string;
  // Relational link to staff
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  agentAvatar?: string;
}

export interface PriorityAlert {
  id: string;
  pillar: 'paiement' | 'concours' | 'stock' | 'inscription';
  title: string;
  description: string;
  count: number;
  urgency: 'critique' | 'attention' | 'info';
  actionLabel: string;
  actionKey: string;
}
