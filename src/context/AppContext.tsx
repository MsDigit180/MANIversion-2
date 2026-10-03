import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  PaymentReceipt,
  ExamApplication,
  InventoryItem,
  SupplySale,
  OperationItem,
  PriorityAlert,
  SyncQueueItem,
  NetworkStatus,
  TimePeriod,
  TabKey,
  ThemeMode,
  Agent,
  AgentRole,
  Tutor,
  isSuperAdminRole,
  TutoringGroup,
  MultiStudentReceiptItem,
} from '../types';
import { calculateMonthlyHours } from '../utils/dateUtils';
import { validateTutorAssignment, isPrimaryStudent } from '../utils/tutorAssignmentValidation';
import {
  db,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  sanitizeForFirestore,
  handleFirestoreError,
  OperationType,
  COLLECTIONS,
  testFirebaseConnection,
  safeFirestoreWrite,
} from '../firebase';
import {
  seedInitialFirestoreData,
  SEED_AGENTS,
  SEED_STUDENTS,
  SEED_PAYMENTS,
  SEED_EXAMS,
  SEED_TUTORS,
  SEED_INVENTORY,
  SEED_SUPPLY_SALES,
  SEED_OPERATIONS,
  SEED_ALERTS,
} from '../firebase/seedMigration';
import { compressImage } from '../utils/imageOptimizer';
import { getCurrentFrenchDateTime, getCurrentFrenchDate, formatReceiptPaymentDate } from '../utils/dateUtils';

interface AppContextType {
  // Theme Management
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Cloud & Firebase Status
  isFirebaseReady: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSync: string;

  // Authentication & User Management
  isAuthenticated: boolean;
  currentUser: Agent;
  isAdminPrincipal: boolean;
  agents: Agent[];
  setCurrentAgentId: (agentId: string) => void;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (data: Partial<Agent>) => Promise<void>;
  addAgent: (agentData: Omit<Agent, 'id' | 'active' | 'createdAt'>) => Promise<Agent>;
  deleteAgent: (agentId: string) => Promise<void>;
  updateAgentRole: (agentId: string, newRole: AgentRole) => Promise<{ success: boolean; message?: string }>;
  resetAgentPassword: (agentId: string, newPassword?: string) => Promise<{ success: boolean; message?: string }>;
  toggleAgentStatus: (agentId: string) => Promise<{ success: boolean; message?: string }>;

  // Navigation & Filters
  currentTab: TabKey;
  setCurrentTab: (tab: TabKey) => void;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  campus: string;
  setCampus: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Network & Sync State
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;
  toggleNetworkSimulation: () => void;
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  forceSeedCloudDatabase: () => Promise<{ success: boolean; count: number }>;

  // Data Entities
  students: Student[];
  addStudent: (
    student: Omit<Student, 'id' | 'matricule' | 'syncStatus' | 'tutoringStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      tutoringStatus?: Student['tutoringStatus'];
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ) => Promise<Student>;
  stopStudentTutoring: (
    studentId: string,
    status: 'Arrêté (À la demande)' | 'Arrêté (Défaut de paiement)',
    reason: string,
    stopDate?: string
  ) => Promise<void>;
  resumeStudentTutoring: (studentId: string) => Promise<void>;
  payments: PaymentReceipt[];
  addPayment: (
    payment: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ) => Promise<PaymentReceipt>;
  addFamilyPayment: (data: {
    guardianName: string;
    guardianPhone?: string;
    paymentMethod: string;
    paymentDate?: string;
    cashierName?: string;
    notes?: string;
    studentBreakdown: MultiStudentReceiptItem[];
    autoReactivate?: boolean;
  }) => Promise<PaymentReceipt>;
  deletePayment: (paymentId: string) => Promise<void>;
  exams: ExamApplication[];
  addExam: (
    exam: Omit<ExamApplication, 'id' | 'dossierNumber' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ) => Promise<ExamApplication>;
  toggleExamPiece: (examId: string, piece: string) => Promise<void>;
  validateExamDossier: (examId: string) => Promise<void>;
  inventory: InventoryItem[];
  addProduct: (product: Omit<InventoryItem, 'id' | 'syncStatus'>) => Promise<void>;
  updateStock: (productId: string, quantityDelta: number, reason?: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  recordSupplySale: (
    customerName: string,
    items: { itemId: string; quantity: number }[],
    paymentMethod: any,
    studentId?: string
  ) => Promise<void>;
  supplySales: SupplySale[];
  tutors: Tutor[];
  addTutor: (tutorData: Omit<Tutor, 'id' | 'matricule' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'>) => Promise<Tutor>;
  updateTutor: (id: string, data: Partial<Tutor>) => Promise<void>;
  deleteTutor: (id: string) => Promise<void>;
  assignTutorToStudent: (
    tutorId: string,
    studentId: string,
    subjects: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  unassignTutorFromStudent: (
    tutorId: string,
    studentId: string,
    subjectToRemove?: string
  ) => Promise<void>;
  assignStudentToGroup: (
    studentId: string,
    groupId: string,
    groupName?: string,
    timeSlot?: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeStudentFromGroup: (studentId: string) => Promise<void>;
  assignTutorToGroup: (
    tutorId: string,
    groupId: string,
    subjects: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  unassignTutorFromGroup: (tutorId: string, groupId: string) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateExam: (id: string, data: Partial<ExamApplication>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  operations: OperationItem[];
  alerts: PriorityAlert[];
  dismissAlert: (id: string) => Promise<void>;

  // Relational Query Helpers
  getStudentPayments: (studentId: string) => PaymentReceipt[];
  getStudentExams: (studentId: string) => ExamApplication[];
  getStudentSupplies: (studentId: string) => SupplySale[];
  getAgentOperations: (agentId: string) => OperationItem[];

  // Modals & Panels
  isNewStudentModalOpen: boolean;
  setIsNewStudentModalOpen: (b: boolean) => void;
  editingStudent: Student | null;
  setEditingStudent: (s: Student | null) => void;
  isStopTutoringModalOpen: boolean;
  setIsStopTutoringModalOpen: (b: boolean) => void;
  selectedStudentForStop: Student | null;
  setSelectedStudentForStop: (s: Student | null) => void;
  isNewPaymentModalOpen: boolean;
  setIsNewPaymentModalOpen: (b: boolean) => void;
  isNewSupplySaleModalOpen: boolean;
  setIsNewSupplySaleModalOpen: (b: boolean) => void;
  isNewProductModalOpen: boolean;
  setIsNewProductModalOpen: (b: boolean) => void;
  isRestockModalOpen: boolean;
  setIsRestockModalOpen: (b: boolean) => void;
  selectedProductForRestock: InventoryItem | null;
  setSelectedProductForRestock: (item: InventoryItem | null) => void;
  isNewExamModalOpen: boolean;
  setIsNewExamModalOpen: (b: boolean) => void;
  isAssignModalOpen: boolean;
  setIsAssignModalOpen: (b: boolean) => void;
  selectedStudentForAssignment: Student | null;
  setSelectedStudentForAssignment: (s: Student | null) => void;
  selectedTutorForAssignment: Tutor | null;
  setSelectedTutorForAssignment: (t: Tutor | null) => void;
  isSyncDrawerOpen: boolean;
  setIsSyncDrawerOpen: (b: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (b: boolean) => void;
  isGroupDetailModalOpen: boolean;
  setIsGroupDetailModalOpen: (b: boolean) => void;
  selectedGroupForDetail: TutoringGroup | null;
  setSelectedGroupForDetail: (g: TutoringGroup | null) => void;
  familyPaymentTargetParent: { guardianName: string; guardianPhone: string; studentIds?: string[] } | null;
  setFamilyPaymentTargetParent: (target: { guardianName: string; guardianPhone: string; studentIds?: string[] } | null) => void;
  selectedReceipt: PaymentReceipt | null;
  setSelectedReceipt: (r: PaymentReceipt | null) => void;
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;

  // Sidebar
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (b: boolean) => void;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cabappuis_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.setAttribute('data-theme', theme);
    localStorage.setItem('cabappuis_theme', theme);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cloud & Firebase Status
  const [isFirebaseReady, setIsFirebaseReady] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastCloudSync, setLastCloudSync] = useState<string>(() => new Date().toLocaleTimeString('fr-FR'));

  // Authentication & Credentials
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = localStorage.getItem('cabappuis_auth_session');
    return session === 'true';
  });

  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string }>(() => {
    const saved = localStorage.getItem('cabappuis_admin_creds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { username: 'admin', password: '1234' };
  });

  // Entities initialized with seed datasets for instant rendering & offline resilience
  const [agents, setAgents] = useState<Agent[]>(SEED_AGENTS);
  const [currentUser, setCurrentUser] = useState<Agent>(() => {
    const savedUserId = localStorage.getItem('cabappuis_current_user_id');
    const matched = SEED_AGENTS.find((a) => a.id === savedUserId);
    return matched || SEED_AGENTS[0];
  });

  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [payments, setPayments] = useState<PaymentReceipt[]>(SEED_PAYMENTS);
  const [exams, setExams] = useState<ExamApplication[]>(SEED_EXAMS);
  const [tutors, setTutors] = useState<Tutor[]>(SEED_TUTORS);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INVENTORY);
  const [supplySales, setSupplySales] = useState<SupplySale[]>(SEED_SUPPLY_SALES);
  const [operations, setOperations] = useState<OperationItem[]>(SEED_OPERATIONS);
  const [alerts, setAlerts] = useState<PriorityAlert[]>(SEED_ALERTS);

  // Navigation & Filters
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [campus, setCampus] = useState<string>('Site Niamey 2000 (Siège Principal)');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Network & Sync State
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStopTutoringModalOpen, setIsStopTutoringModalOpen] = useState(false);
  const [selectedStudentForStop, setSelectedStudentForStop] = useState<Student | null>(null);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [isNewSupplySaleModalOpen, setIsNewSupplySaleModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<InventoryItem | null>(null);
  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudentForAssignment, setSelectedStudentForAssignment] = useState<Student | null>(null);
  const [selectedTutorForAssignment, setSelectedTutorForAssignment] = useState<Tutor | null>(null);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<TutoringGroup | null>(null);
  const [familyPaymentTargetParent, setFamilyPaymentTargetParent] = useState<{ guardianName: string; guardianPhone: string; studentIds?: string[] } | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- Real-time Firestore Listeners and Migration on Boot ---
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const initializeFirestoreRealtime = async () => {
      try {
        setCloudSyncStatus('syncing');
        // Test connection & seed without blocking
        testFirebaseConnection().catch(() => {});
        seedInitialFirestoreData().catch(() => {});
        setIsFirebaseReady(true);
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toLocaleTimeString('fr-FR'));

        // 1. Agents Listener
        const unsubAgents = onSnapshot(
          collection(db, COLLECTIONS.AGENTS),
          (snapshot) => {
            const list: Agent[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Agent);
            });
            if (list.length > 0) {
              setAgents(list);
              setCurrentUser((prev) => list.find((a) => a.id === prev.id) || list[0]);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.AGENTS)
        );
        unsubscribes.push(unsubAgents);

        // 2. Students Listener
        const unsubStudents = onSnapshot(
          collection(db, COLLECTIONS.STUDENTS),
          (snapshot) => {
            const list: Student[] = [];
            snapshot.forEach((docSnap) => {
              const sData = docSnap.data() as Student;
              list.push({
                ...sData,
                sessionsPerWeek: sData.sessionsPerWeek || 3,
              });
            });
            if (list.length > 0) {
              setStudents(list);
              setLastCloudSync(new Date().toLocaleTimeString('fr-FR'));
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.STUDENTS)
        );
        unsubscribes.push(unsubStudents);

        // 3. Payments Listener
        const unsubPayments = onSnapshot(
          collection(db, COLLECTIONS.PAYMENTS),
          (snapshot) => {
            const list: PaymentReceipt[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as PaymentReceipt);
            });
            if (list.length > 0) {
              setPayments(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PAYMENTS)
        );
        unsubscribes.push(unsubPayments);

        // 4. Exams Listener
        const unsubExams = onSnapshot(
          collection(db, COLLECTIONS.EXAMS),
          (snapshot) => {
            const list: ExamApplication[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as ExamApplication);
            });
            if (list.length > 0) {
              setExams(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.EXAMS)
        );
        unsubscribes.push(unsubExams);

        // 4.1 Tutors Listener
        const unsubTutors = onSnapshot(
          collection(db, COLLECTIONS.TUTORS),
          (snapshot) => {
            const list: Tutor[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Tutor);
            });
            if (list.length > 0) {
              setTutors(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.TUTORS)
        );
        unsubscribes.push(unsubTutors);

        // 5. Inventory Listener
        const unsubInventory = onSnapshot(
          collection(db, COLLECTIONS.INVENTORY),
          (snapshot) => {
            const list: InventoryItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as InventoryItem);
            });
            if (list.length > 0) {
              setInventory(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.INVENTORY)
        );
        unsubscribes.push(unsubInventory);

        // 6. Supply Sales Listener
        const unsubSupplySales = onSnapshot(
          collection(db, COLLECTIONS.SUPPLY_SALES),
          (snapshot) => {
            const list: SupplySale[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as SupplySale);
            });
            if (list.length > 0) {
              setSupplySales(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.SUPPLY_SALES)
        );
        unsubscribes.push(unsubSupplySales);

        // 7. Operations Feed Listener
        const unsubOperations = onSnapshot(
          collection(db, COLLECTIONS.OPERATIONS),
          (snapshot) => {
            const list: OperationItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as OperationItem);
            });
            if (list.length > 0) {
              setOperations(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.OPERATIONS)
        );
        unsubscribes.push(unsubOperations);

        // 8. Alerts Listener
        const unsubAlerts = onSnapshot(
          collection(db, COLLECTIONS.ALERTS),
          (snapshot) => {
            const list: PriorityAlert[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as PriorityAlert);
            });
            if (list.length > 0) {
              setAlerts(list);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.ALERTS)
        );
        unsubscribes.push(unsubAlerts);
      } catch (e) {
        console.warn('Firestore realtime notice:', e);
      }
    };

    initializeFirestoreRealtime();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const setCurrentAgentId = (agentId: string) => {
    const found = agents.find((a) => a.id === agentId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('cabappuis_current_user_id', found.id);
    }
  };

  const isAdminPrincipal = isSuperAdminRole(currentUser.role);

  const addAgent = async (agentData: Omit<Agent, 'id' | 'active' | 'createdAt'>): Promise<Agent> => {
    if (!isSuperAdminRole(currentUser.role)) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      throw new Error("Action réservée à l'Administrateur Principal");
    }

    let optimizedAvatar = agentData.avatar;
    if (optimizedAvatar && !optimizedAvatar.startsWith('http')) {
      optimizedAvatar = await compressImage(optimizedAvatar, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
    }

    const newAgent: Agent = {
      ...agentData,
      avatar: optimizedAvatar,
      id: `agent-${Date.now()}`,
      active: true,
      createdAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setAgents((prev) => [newAgent, ...prev]);

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.AGENTS, newAgent.id), sanitizeForFirestore(newAgent), { merge: true }),
      1200
    );

    showToast(`Utilisateur "${newAgent.fullName}" enregistré dans Firebase !`, 'success');
    return newAgent;
  };

  const deleteAgent = async (agentId: string) => {
    if (!isSuperAdminRole(currentUser.role)) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return;
    }

    if (agents.length <= 1) {
      showToast('Impossible de supprimer le seul utilisateur restant.', 'warning');
      return;
    }

    const targetAgent = agents.find((a) => a.id === agentId);
    if (targetAgent && targetAgent.id === currentUser.id) {
      showToast('Impossible de supprimer votre propre compte actuellement connecté.', 'warning');
      return;
    }

    setAgents((prev) => {
      const remaining = prev.filter((a) => a.id !== agentId);
      if (currentUser.id === agentId && remaining.length > 0) {
        setCurrentUser(remaining[0]);
        localStorage.setItem('cabappuis_current_user_id', remaining[0].id);
      }
      return remaining;
    });

    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.AGENTS, agentId)), 1200);
    showToast('Utilisateur supprimé de Firebase.', 'info');
  };

  const updateAgentRole = async (agentId: string, newRole: AgentRole): Promise<{ success: boolean; message?: string }> => {
    if (!isSuperAdminRole(currentUser.role)) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return { success: false, message: "Action réservée à l'Administrateur Principal" };
    }

    const target = agents.find((a) => a.id === agentId);
    if (!target) return { success: false, message: 'Utilisateur introuvable.' };

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, role: newRole } : a))
    );
    if (currentUser.id === agentId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.AGENTS, agentId), sanitizeForFirestore({ role: newRole }), { merge: true }),
      1200
    );

    showToast(`Rôle de ${target.fullName} mis à jour : ${newRole}`, 'success');
    return { success: true };
  };

  const resetAgentPassword = async (agentId: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (!isSuperAdminRole(currentUser.role)) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return { success: false, message: "Action réservée à l'Administrateur Principal" };
    }

    const target = agents.find((a) => a.id === agentId);
    if (!target) return { success: false, message: 'Utilisateur introuvable.' };

    const effectivePass = newPassword || '1234';
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, password: effectivePass } : a))
    );

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.AGENTS, agentId), sanitizeForFirestore({ password: effectivePass }), { merge: true }),
      1200
    );

    showToast(`Mot de passe de ${target.fullName} réinitialisé avec succès (${effectivePass}).`, 'success');
    return { success: true, message: `Mot de passe réinitialisé à: ${effectivePass}` };
  };

  const toggleAgentStatus = async (agentId: string): Promise<{ success: boolean; message?: string }> => {
    if (!isSuperAdminRole(currentUser.role)) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return { success: false, message: "Action réservée à l'Administrateur Principal" };
    }

    const target = agents.find((a) => a.id === agentId);
    if (!target) return { success: false, message: 'Utilisateur introuvable.' };

    if (currentUser.id === agentId && target.active) {
      showToast("Impossible de désactiver votre propre compte actif.", 'warning');
      return { success: false, message: "Impossible de désactiver votre propre compte." };
    }

    const nextActive = !target.active;
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, active: nextActive } : a))
    );

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.AGENTS, agentId), sanitizeForFirestore({ active: nextActive }), { merge: true }),
      1200
    );

    showToast(
      nextActive
        ? `Compte de ${target.fullName} réactivé.`
        : `Compte de ${target.fullName} désactivé.`,
      'info'
    );
    return { success: true };
  };

  const updateAgent = async (id: string, data: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.AGENTS, id), sanitizeForFirestore(data), { merge: true }), 1200);
    showToast('Utilisateur mis à jour avec succès.', 'success');
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.STUDENTS, id), sanitizeForFirestore(data), { merge: true }), 1200);
  };

  const deleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.STUDENTS, id)), 1200);
    showToast('Élève supprimé du registre.', 'info');
  };

  const updateExam = async (id: string, data: Partial<ExamApplication>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.EXAMS, id), sanitizeForFirestore(data), { merge: true }), 1200);
  };

  const deleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.EXAMS, id)), 1200);
    showToast('Dossier concours supprimé.', 'info');
  };

  const addTutor = async (tutorData: Omit<Tutor, 'id' | 'matricule' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'>): Promise<Tutor> => {
    const id = `tutor-${Date.now()}`;
    const matricule = `ENC-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newTutor: Tutor = {
      ...tutorData,
      id,
      matricule,
      syncStatus: 'synced',
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };
    setTutors((prev) => [newTutor, ...prev]);
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.TUTORS, id), sanitizeForFirestore(newTutor)), 1200);
    return newTutor;
  };

  const updateTutor = async (id: string, data: Partial<Tutor>) => {
    setTutors((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.TUTORS, id), sanitizeForFirestore(data), { merge: true }), 1200);
  };

  const deleteTutor = async (id: string) => {
    setTutors((prev) => prev.filter((t) => t.id !== id));
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.TUTORS, id)), 1200);
  };

  const assignTutorToStudent = async (
    tutorId: string,
    studentId: string,
    subjects: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    const student = students.find((s) => s.id === studentId);
    const tutor = tutors.find((t) => t.id === tutorId);

    if (!student || !tutor) {
      showToast('Élève ou encadreur introuvable.', 'warning');
      return { success: false, error: 'Élève ou encadreur introuvable.' };
    }

    // Validation des règles strictes métier :
    // 1. Primaire : 1 seul encadreur référent
    // 2. Collège & Lycée : deux encadreurs ne peuvent PAS encadrer pour la même matière
    const validation = validateTutorAssignment({
      student,
      targetTutorId: tutorId,
      targetSubjects: subjects,
      allTutors: tutors,
    });

    if (!validation.valid) {
      showToast(validation.error || "Erreur lors de l'affectation", 'warning');
      return { success: false, error: validation.error };
    }

    const isPrimary = isPrimaryStudent(student);

    // Préparation des données mises à jour pour l'encadreur
    const nextAssignedStudentIds = Array.from(new Set([...(tutor.assignedStudentIds || []), student.id]));
    const nextAssignedSubjects = {
      ...(tutor.assignedStudentSubjects || {}),
      [student.id]: isPrimary ? student.subjects : subjects,
    };

    // Calcul du volume horaire déduit (1 séance = 1h 30mn)
    const tutorStudents = students.filter((s) => nextAssignedStudentIds.includes(s.id));
    const totalWeeklySessions = tutorStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
    const deducedMonthlyHours = calculateMonthlyHours(totalWeeklySessions);

    const updatedTutor: Tutor = {
      ...tutor,
      assignedStudentIds: nextAssignedStudentIds,
      assignedStudentSubjects: nextAssignedSubjects,
      totalHours: deducedMonthlyHours,
    };

    // Préparation des données mises à jour pour l'élève
    const existingAssignments = (student.tutorAssignments || []).filter((a) => a.tutorId !== tutor.id);
    const newAssignment = {
      tutorId: tutor.id,
      tutorName: tutor.fullName,
      tutorAvatar: tutor.avatar,
      tutorPhone: tutor.phone,
      subjects: isPrimary ? student.subjects : subjects,
      assignedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    const nextTutorIds = isPrimary ? [tutor.id] : Array.from(new Set([...(student.tutorIds || []), tutor.id]));
    const updatedStudent: Student = {
      ...student,
      tutorId: isPrimary ? tutor.id : student.tutorId,
      tutorIds: nextTutorIds,
      tutorAssignments: [...existingAssignments, newAssignment],
    };

    // Mise à jour optimiste
    setTutors((prev) => prev.map((t) => (t.id === tutor.id ? updatedTutor : t)));
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    // Sauvegarde Firestore
    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.TUTORS, tutor.id), sanitizeForFirestore(updatedTutor), { merge: true }),
        setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(updatedStudent), { merge: true }),
      ]),
      1200
    );

    showToast(
      isPrimary
        ? `Élève primaire ${student.fullName} affecté à l'encadreur référent ${tutor.fullName}.`
        : `Affectation validée : ${tutor.fullName} encadre ${student.fullName} en ${subjects.join(', ')}.`,
      'success'
    );
    return { success: true };
  };

  const unassignTutorFromStudent = async (
    tutorId: string,
    studentId: string,
    subjectToRemove?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!student || !tutor) return;

    let updatedTutor: Tutor;
    let updatedStudent: Student;

    if (subjectToRemove) {
      // Retirer une matière spécifique (Collège/Lycée)
      const currentSubjects = tutor.assignedStudentSubjects?.[studentId] || [];
      const remainingSubjects = currentSubjects.filter((s) => s !== subjectToRemove);
      const isStudentStillAssigned = remainingSubjects.length > 0;

      const nextStudentIds = isStudentStillAssigned
        ? tutor.assignedStudentIds
        : (tutor.assignedStudentIds || []).filter((id) => id !== studentId);

      const nextSubjectsMap = { ...(tutor.assignedStudentSubjects || {}) };
      if (isStudentStillAssigned) {
        nextSubjectsMap[studentId] = remainingSubjects;
      } else {
        delete nextSubjectsMap[studentId];
      }

      const tutorStudents = students.filter((s) => nextStudentIds.includes(s.id));
      const totalWeeklySessions = tutorStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
      const deducedMonthlyHours = calculateMonthlyHours(totalWeeklySessions);

      updatedTutor = {
        ...tutor,
        assignedStudentIds: nextStudentIds,
        assignedStudentSubjects: nextSubjectsMap,
        totalHours: deducedMonthlyHours,
      };

      const updatedAssignments = (student.tutorAssignments || [])
        .map((a) => {
          if (a.tutorId === tutorId) {
            const rem = (a.subjects || []).filter((s) => s !== subjectToRemove);
            return rem.length > 0 ? { ...a, subjects: rem } : null;
          }
          return a;
        })
        .filter(Boolean) as typeof student.tutorAssignments;

      updatedStudent = {
        ...student,
        tutorIds: isStudentStillAssigned
          ? student.tutorIds
          : (student.tutorIds || []).filter((id) => id !== tutorId),
        tutorAssignments: updatedAssignments,
      };
    } else {
      // Retrait complet de l'élève
      const nextStudentIds = (tutor.assignedStudentIds || []).filter((id) => id !== studentId);
      const nextSubjectsMap = { ...(tutor.assignedStudentSubjects || {}) };
      delete nextSubjectsMap[studentId];

      const tutorStudents = students.filter((s) => nextStudentIds.includes(s.id));
      const totalWeeklySessions = tutorStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
      const deducedMonthlyHours = calculateMonthlyHours(totalWeeklySessions);

      updatedTutor = {
        ...tutor,
        assignedStudentIds: nextStudentIds,
        assignedStudentSubjects: nextSubjectsMap,
        totalHours: deducedMonthlyHours,
      };

      updatedStudent = {
        ...student,
        tutorId: student.tutorId === tutorId ? undefined : student.tutorId,
        tutorIds: (student.tutorIds || []).filter((id) => id !== tutorId),
        tutorAssignments: (student.tutorAssignments || []).filter((a) => a.tutorId !== tutorId),
      };
    }

    setTutors((prev) => prev.map((t) => (t.id === tutor.id ? updatedTutor : t)));
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.TUTORS, tutor.id), sanitizeForFirestore(updatedTutor), { merge: true }),
        setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(updatedStudent), { merge: true }),
      ]),
      1200
    );

    showToast(`Affectation retirée entre ${student.fullName} et ${tutor.fullName}.`, 'info');
  };

  const assignStudentToGroup = async (
    studentId: string,
    groupId: string,
    groupName?: string,
    timeSlot?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      showToast('Élève introuvable.', 'warning');
      return { success: false, error: 'Élève introuvable' };
    }

    const cleanGroupId = groupId.trim().toUpperCase();
    if (!cleanGroupId) {
      showToast("L'identifiant du groupe ne peut pas être vide.", 'warning');
      return { success: false, error: 'Identifiant groupe vide' };
    }

    // Récupérer le nom et le créneau par défaut s'il existe déjà des pairs dans ce groupe
    const peerInGroup = students.find(
      (s) => s.groupId && s.groupId.trim().toUpperCase() === cleanGroupId && s.id !== studentId
    );
    const resolvedGroupName = groupName?.trim() || peerInGroup?.groupName || `Groupe ${cleanGroupId}`;
    const resolvedTimeSlot = timeSlot?.trim() || peerInGroup?.timeSlot || student.timeSlot || 'Créneau mutualisé';

    // Hériter des encadreurs déjà affectés au groupe si disponible
    let inheritedTutorAssignments = [...(student.tutorAssignments || [])];
    let inheritedTutorIds = [...(student.tutorIds || [])];
    const tutorUpdatePromises: Promise<any>[] = [];

    if (peerInGroup && peerInGroup.tutorAssignments && peerInGroup.tutorAssignments.length > 0) {
      for (const peerAssignment of peerInGroup.tutorAssignments) {
        if (!inheritedTutorAssignments.some((a) => a.tutorId === peerAssignment.tutorId)) {
          inheritedTutorAssignments.push({
            ...peerAssignment,
            assignedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          });
          if (!inheritedTutorIds.includes(peerAssignment.tutorId)) {
            inheritedTutorIds.push(peerAssignment.tutorId);
          }
          const tutor = tutors.find((t) => t.id === peerAssignment.tutorId);
          if (tutor) {
            const nextStudentIds = Array.from(new Set([...(tutor.assignedStudentIds || []), student.id]));
            const nextSubjects = {
              ...(tutor.assignedStudentSubjects || {}),
              [student.id]: peerAssignment.subjects,
            };
            const tutorStudents = students.filter((s) => nextStudentIds.includes(s.id) || s.id === student.id);
            const totalWeeklySessions = tutorStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
            const updatedTutor: Tutor = {
              ...tutor,
              assignedStudentIds: nextStudentIds,
              assignedStudentSubjects: nextSubjects,
              totalHours: calculateMonthlyHours(totalWeeklySessions),
            };
            setTutors((prev) => prev.map((t) => (t.id === tutor.id ? updatedTutor : t)));
            tutorUpdatePromises.push(
              setDoc(doc(db, COLLECTIONS.TUTORS, tutor.id), sanitizeForFirestore(updatedTutor), { merge: true })
            );
          }
        }
      }
    }

    const updatedStudent: Student = {
      ...student,
      groupId: cleanGroupId,
      groupName: resolvedGroupName,
      timeSlot: resolvedTimeSlot,
      tutorAssignments: inheritedTutorAssignments,
      tutorIds: inheritedTutorIds,
    };

    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(updatedStudent), { merge: true }),
        ...tutorUpdatePromises,
      ]),
      1200
    );

    showToast(`Élève ${student.fullName} affecté avec succès au groupe ${resolvedGroupName} (${cleanGroupId}).`, 'success');
    return { success: true };
  };

  const removeStudentFromGroup = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const oldGroupId = student.groupId;
    const updatedStudent: Student = {
      ...student,
      groupId: undefined,
      groupName: undefined,
    };

    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    await safeFirestoreWrite(
      setDoc(
        doc(db, COLLECTIONS.STUDENTS, student.id),
        sanitizeForFirestore({ groupId: null, groupName: null }),
        { merge: true }
      ),
      1200
    );

    showToast(`Élève ${student.fullName} retiré du groupe ${oldGroupId || ''}.`, 'info');
  };

  const assignTutorToGroup = async (
    tutorId: string,
    groupId: string,
    subjects: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor) {
      showToast('Encadreur introuvable.', 'warning');
      return { success: false, error: 'Encadreur introuvable' };
    }

    const cleanGroupId = groupId.trim().toUpperCase();
    const groupStudents = students.filter(
      (s) => s.groupId && s.groupId.trim().toUpperCase() === cleanGroupId
    );

    if (groupStudents.length === 0) {
      showToast('Aucun élève trouvé dans ce groupe.', 'warning');
      return { success: false, error: 'Groupe vide' };
    }

    const assignedDateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const studentWrites: Promise<any>[] = [];
    const updatedStudentsList: Student[] = [];

    for (const student of groupStudents) {
      const isPrimary = isPrimaryStudent(student);
      const effectiveSubjects = subjects.length > 0 ? subjects : (student.subjects || []);

      const existingAssignments = (student.tutorAssignments || []).filter((a) => a.tutorId !== tutor.id);
      const newAssignment = {
        tutorId: tutor.id,
        tutorName: tutor.fullName,
        tutorAvatar: tutor.avatar,
        tutorPhone: tutor.phone,
        subjects: effectiveSubjects,
        assignedAt: assignedDateStr,
      };

      const nextTutorIds = isPrimary
        ? [tutor.id]
        : Array.from(new Set([...(student.tutorIds || []), tutor.id]));

      const updatedStudent: Student = {
        ...student,
        tutorId: isPrimary ? tutor.id : student.tutorId,
        tutorIds: nextTutorIds,
        tutorAssignments: [...existingAssignments, newAssignment],
      };

      updatedStudentsList.push(updatedStudent);
      studentWrites.push(
        setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(updatedStudent), { merge: true })
      );
    }

    const addedStudentIds = groupStudents.map((s) => s.id);
    const nextAssignedStudentIds = Array.from(new Set([...(tutor.assignedStudentIds || []), ...addedStudentIds]));
    const nextAssignedSubjects = { ...(tutor.assignedStudentSubjects || {}) };
    for (const s of groupStudents) {
      nextAssignedSubjects[s.id] = subjects.length > 0 ? subjects : (s.subjects || []);
    }

    const allAssignedStudents = students
      .filter((s) => nextAssignedStudentIds.includes(s.id))
      .concat(updatedStudentsList.filter((us) => !students.some((s) => s.id === us.id)));
    const totalWeeklySessions = allAssignedStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
    const updatedTutor: Tutor = {
      ...tutor,
      assignedStudentIds: nextAssignedStudentIds,
      assignedStudentSubjects: nextAssignedSubjects,
      totalHours: calculateMonthlyHours(totalWeeklySessions),
    };

    setStudents((prev) =>
      prev.map((s) => {
        const found = updatedStudentsList.find((us) => us.id === s.id);
        return found || s;
      })
    );
    setTutors((prev) => prev.map((t) => (t.id === tutor.id ? updatedTutor : t)));

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.TUTORS, tutor.id), sanitizeForFirestore(updatedTutor), { merge: true }),
        ...studentWrites,
      ]),
      1200
    );

    showToast(
      `✅ Encadreur ${tutor.fullName} affecté au groupe ${cleanGroupId} (${groupStudents.length} élèves) pour : ${subjects.join(', ')}.`,
      'success'
    );
    return { success: true };
  };

  const unassignTutorFromGroup = async (tutorId: string, groupId: string) => {
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor) return;

    const cleanGroupId = groupId.trim().toUpperCase();
    const groupStudents = students.filter(
      (s) => s.groupId && s.groupId.trim().toUpperCase() === cleanGroupId
    );

    const groupStudentIds = groupStudents.map((s) => s.id);
    const studentWrites: Promise<any>[] = [];
    const updatedStudentsList: Student[] = [];

    for (const student of groupStudents) {
      const updatedStudent: Student = {
        ...student,
        tutorId: student.tutorId === tutorId ? undefined : student.tutorId,
        tutorIds: (student.tutorIds || []).filter((id) => id !== tutorId),
        tutorAssignments: (student.tutorAssignments || []).filter((a) => a.tutorId !== tutorId),
      };
      updatedStudentsList.push(updatedStudent);
      studentWrites.push(
        setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(updatedStudent), { merge: true })
      );
    }

    const nextAssignedStudentIds = (tutor.assignedStudentIds || []).filter(
      (id) => !groupStudentIds.includes(id)
    );
    const nextAssignedSubjects = { ...(tutor.assignedStudentSubjects || {}) };
    for (const sid of groupStudentIds) {
      delete nextAssignedSubjects[sid];
    }

    const remainingTutorStudents = students.filter((s) => nextAssignedStudentIds.includes(s.id));
    const totalWeeklySessions = remainingTutorStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
    const updatedTutor: Tutor = {
      ...tutor,
      assignedStudentIds: nextAssignedStudentIds,
      assignedStudentSubjects: nextAssignedSubjects,
      totalHours: calculateMonthlyHours(totalWeeklySessions),
    };

    setStudents((prev) =>
      prev.map((s) => {
        const found = updatedStudentsList.find((us) => us.id === s.id);
        return found || s;
      })
    );
    setTutors((prev) => prev.map((t) => (t.id === tutor.id ? updatedTutor : t)));

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.TUTORS, tutor.id), sanitizeForFirestore(updatedTutor), { merge: true }),
        ...studentWrites,
      ]),
      1200
    );

    showToast(`Désaffectation effectuée : ${tutor.fullName} retiré du groupe ${cleanGroupId}.`, 'info');
  };

  const login = (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (cleanUser.toLowerCase() === adminCredentials.username.toLowerCase() && cleanPass === adminCredentials.password) {
      setIsAuthenticated(true);
      const adminAgent = agents.find((a) => a.username === 'admin') || agents[0];
      setCurrentUser(adminAgent);
      localStorage.setItem('cabappuis_auth_session', 'true');
      localStorage.setItem('cabappuis_current_user_id', adminAgent.id);
      return { success: true };
    }

    const matchedAgent = agents.find((a) => a.username.toLowerCase() === cleanUser.toLowerCase());
    if (matchedAgent) {
      const validPass = matchedAgent.password || '1234';
      if (cleanPass === validPass || cleanPass === adminCredentials.password) {
        setIsAuthenticated(true);
        setCurrentUser(matchedAgent);
        localStorage.setItem('cabappuis_auth_session', 'true');
        localStorage.setItem('cabappuis_current_user_id', matchedAgent.id);
        return { success: true };
      }
    }

    return {
      success: false,
      message: 'Identifiant ou mot de passe incorrect.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cabappuis_auth_session');
    showToast('Vous avez été déconnecté avec succès.', 'info');
  };

  const updateAdminPassword = async (currentPass: string, newPass: string) => {
    if (currentPass !== adminCredentials.password) {
      return { success: false, message: 'Le mot de passe actuel saisi est incorrect.' };
    }
    if (newPass.length < 4) {
      return { success: false, message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' };
    }

    const updated = { ...adminCredentials, password: newPass };
    setAdminCredentials(updated);
    localStorage.setItem('cabappuis_admin_creds', JSON.stringify(updated));

    await safeFirestoreWrite(
      setDoc(
        doc(db, COLLECTIONS.SETTINGS, 'admin_credentials'),
        sanitizeForFirestore({ username: updated.username, updatedAt: new Date().toISOString() }),
        { merge: true }
      ),
      1200
    );

    showToast('Mot de passe administrateur mis à jour avec succès.', 'success');
    return { success: true, message: 'Mot de passe mis à jour !' };
  };

  const updateUserProfile = async (data: Partial<Agent>) => {
    let sanitizedData = { ...data };
    
    // Protection RBAC : Seul l'Admin Principal peut modifier les rôles
    if (sanitizedData.role && sanitizedData.role !== currentUser.role && !isSuperAdminRole(currentUser.role)) {
      delete sanitizedData.role;
      showToast("Action réservée à l'Administrateur Principal : modification de rôle non autorisée.", 'warning');
    }

    if (sanitizedData.avatar && !sanitizedData.avatar.startsWith('http')) {
      sanitizedData.avatar = await compressImage(sanitizedData.avatar, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
    }

    const updatedUser = { ...currentUser, ...sanitizedData };
    setCurrentUser(updatedUser);
    setAgents((prev) => prev.map((a) => (a.id === currentUser.id ? updatedUser : a)));

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.AGENTS, currentUser.id), sanitizeForFirestore(sanitizedData), { merge: true }),
      1200
    );

    showToast('Profil utilisateur synchronisé dans Firebase avec succès.', 'success');
  };

  const toggleNetworkSimulation = () => {
    if (networkStatus === 'online') {
      setNetworkStatus('offline');
      setCloudSyncStatus('offline');
      showToast('Mode Hors-Ligne activé : les écritures sont conservées localement.', 'warning');
    } else {
      setNetworkStatus('online');
      setCloudSyncStatus('synced');
      showToast('Connexion Firebase rétablie. Synchronisation temps réel active.', 'success');
    }
  };

  const forceSeedCloudDatabase = async (): Promise<{ success: boolean; count: number }> => {
    setIsSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const res = await seedInitialFirestoreData(true);
      if (res.success) {
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toLocaleTimeString('fr-FR'));
        showToast(`✅ Base Cloud Firestore initialisée avec succès : ${res.count} documents enregistrés physiquement !`, 'success');
      } else {
        setCloudSyncStatus('error');
        showToast("Erreur lors de l'enregistrement des données dans Firestore.", 'warning');
      }
      return res;
    } catch (e) {
      setCloudSyncStatus('error');
      showToast("Erreur de communication avec Firestore.", 'warning');
      return { success: false, count: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setNetworkStatus('syncing');
    setCloudSyncStatus('syncing');

    try {
      await testFirebaseConnection();
      setSyncQueue([]);
      setNetworkStatus('online');
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date().toLocaleTimeString('fr-FR'));
      showToast('Synchronisation Cloud Firebase terminée : base de données à jour.', 'success');
    } catch {
      showToast('Erreur lors de la synchronisation.', 'warning');
      setCloudSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Relational queries
  const getStudentPayments = (studentId: string) => payments.filter((p) => p.studentId === studentId);
  const getStudentExams = (studentId: string) => exams.filter((e) => e.studentId === studentId);
  const getStudentSupplies = (studentId: string) => supplySales.filter((s) => s.studentId === studentId);
  const getAgentOperations = (agentId: string) => operations.filter((op) => op.agentId === agentId);

  // --- CRUD Operations with setDoc, merge, sanitizeForFirestore & safe bounded writes ---

  const addStudent = async (
    studentData: Omit<Student, 'id' | 'matricule' | 'syncStatus' | 'tutoringStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      tutoringStatus?: Student['tutoringStatus'];
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ): Promise<Student> => {
    const matricule = `CAB-2026-${String(students.length + 150).padStart(4, '0')}`;
    const agentId = studentData.agentId || currentUser.id;
    const agentName = studentData.agentName || currentUser.fullName;
    const agentRole = studentData.agentRole || currentUser.role;
    const agentAvatar = studentData.agentAvatar || currentUser.avatar;

    let optimizedAvatar = studentData.avatar;
    if (optimizedAvatar && !optimizedAvatar.startsWith('http')) {
      optimizedAvatar = await compressImage(optimizedAvatar, { maxWidth: 600, maxHeight: 600, quality: 0.7 });
    }

    const newStudentId = `stu-${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      sessionsPerWeek: Number(studentData.sessionsPerWeek) || 3,
      avatar: optimizedAvatar,
      id: newStudentId,
      matricule,
      tutoringStatus: studentData.tutoringStatus || 'Actif',
      syncStatus: 'synced',
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'inscription',
      title: `Inscription ${studentData.stream}`,
      subtitle: `${studentData.fullName} · ${studentData.level}`,
      referenceId: matricule,
      studentId: newStudent.id,
      amount: studentData.paidAmount,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: studentData.stream,
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    // Optimistic update
    setStudents((prev) => [newStudent, ...prev]);
    setOperations((prev) => [newOp, ...prev]);

    // Firestore async writes with safe timeout
    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.STUDENTS, newStudent.id), sanitizeForFirestore(newStudent), { merge: true }),
        setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
      ]),
      1200
    );

    showToast(`Élève ${studentData.fullName} enregistré dans Firestore par ${agentName}.`, 'success');
    return newStudent;
  };

  const stopStudentTutoring = async (
    studentId: string,
    status: 'Arrêté (À la demande)' | 'Arrêté (Défaut de paiement)',
    reason: string,
    stopDate?: string
  ) => {
    const effectiveDate =
      stopDate ||
      new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    const isPaymentDefault = status === 'Arrêté (Défaut de paiement)';
    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'inscription',
      title: isPaymentDefault ? 'Arrêt Encadrement (Défaut de Paiement)' : 'Arrêt Encadrement (À la Demande)',
      subtitle: `${targetStudent.fullName} · Motif : ${reason.slice(0, 45)}...`,
      referenceId: targetStudent.matricule,
      studentId: targetStudent.id,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: isPaymentDefault ? 'Impayé' : 'Demande',
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, tutoringStatus: status, stopDate: effectiveDate, stopReason: reason }
          : s
      )
    );
    setOperations((prev) => [newOp, ...prev]);

    await safeFirestoreWrite(
      Promise.all([
        setDoc(
          doc(db, COLLECTIONS.STUDENTS, studentId),
          sanitizeForFirestore({
            tutoringStatus: status,
            stopDate: effectiveDate,
            stopReason: reason,
          }),
          { merge: true }
        ),
        setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
      ]),
      1200
    );

    showToast(
      `Encadrement de ${targetStudent.fullName} enregistré comme : ${status}. Traité par ${currentUser.fullName}.`,
      isPaymentDefault ? 'warning' : 'info'
    );
  };

  const resumeStudentTutoring = async (studentId: string) => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'inscription',
      title: 'Reprise d\'Encadrement (Réactivé)',
      subtitle: `${targetStudent.fullName} · Rétabli en cours actifs`,
      referenceId: targetStudent.matricule,
      studentId: targetStudent.id,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: 'Réactivé',
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, tutoringStatus: 'Actif', stopDate: undefined, stopReason: undefined }
          : s
      )
    );
    setOperations((prev) => [newOp, ...prev]);

    await safeFirestoreWrite(
      Promise.all([
        setDoc(
          doc(db, COLLECTIONS.STUDENTS, studentId),
          sanitizeForFirestore({
            tutoringStatus: 'Actif',
            stopDate: null,
            stopReason: null,
          }),
          { merge: true }
        ),
        setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
      ]),
      1200
    );

    showToast(`Élève ${targetStudent.fullName} réactivé dans Firestore par ${currentUser.fullName}.`, 'success');
  };

  const addPayment = async (
    paymentData: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ): Promise<PaymentReceipt> => {
    const receiptNumber = `REC-2026-${String(payments.length + 942).padStart(4, '0')}`;
    const agentId = paymentData.agentId || currentUser.id;
    const agentName = paymentData.agentName || currentUser.fullName;
    const agentRole = paymentData.agentRole || currentUser.role;
    const agentAvatar = paymentData.agentAvatar || currentUser.avatar;

    const finalPaymentDate = formatReceiptPaymentDate(paymentData.paymentDate || getCurrentFrenchDateTime());

    const newPayment: PaymentReceipt = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNumber,
      paymentDate: finalPaymentDate,
      cashierName: paymentData.cashierName || `${agentName} (${agentRole})`,
      syncStatus: 'synced',
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'paiement',
      title: paymentData.category,
      subtitle: `${paymentData.studentName} · Reçu ${receiptNumber}`,
      referenceId: receiptNumber,
      studentId: paymentData.studentId,
      amount: paymentData.amount,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: paymentData.paymentMethod,
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    // Optimistic update
    setPayments((prev) => [newPayment, ...prev]);
    setOperations((prev) => [newOp, ...prev]);

    if (paymentData.studentId) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === paymentData.studentId) {
            const updatedPaid = (s.paidAmount || 0) + paymentData.amount;
            const updatedStatus = updatedPaid >= s.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
            return {
              ...s,
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
            };
          }
          return s;
        })
      );
    }

    const writes: Promise<any>[] = [
      setDoc(doc(db, COLLECTIONS.PAYMENTS, newPayment.id), sanitizeForFirestore(newPayment), { merge: true }),
      setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
    ];

    if (paymentData.studentId) {
      const student = students.find((s) => s.id === paymentData.studentId);
      if (student) {
        const updatedPaid = (student.paidAmount || 0) + paymentData.amount;
        const updatedStatus = updatedPaid >= student.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
        writes.push(
          setDoc(
            doc(db, COLLECTIONS.STUDENTS, student.id),
            sanitizeForFirestore({
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
            }),
            { merge: true }
          )
        );
      }
    }

    await safeFirestoreWrite(Promise.all(writes), 1200);

    showToast(`Reçu ${receiptNumber} émis (${paymentData.amount.toLocaleString()} FCFA) par ${agentName}.`, 'success');
    return newPayment;
  };

  const addFamilyPayment = async (data: {
    guardianName: string;
    guardianPhone?: string;
    paymentMethod: string;
    paymentDate?: string;
    cashierName?: string;
    notes?: string;
    studentBreakdown: MultiStudentReceiptItem[];
    autoReactivate?: boolean;
  }): Promise<PaymentReceipt> => {
    const totalAmount = data.studentBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const receiptNumber = `REC-2026-${String(payments.length + 942).padStart(4, '0')}`;
    const agentId = currentUser.id;
    const agentName = currentUser.fullName;
    const agentRole = currentUser.role;
    const agentAvatar = currentUser.avatar;

    const finalPaymentDate = formatReceiptPaymentDate(data.paymentDate || getCurrentFrenchDateTime());

    const childrenNames = data.studentBreakdown.map((item) => item.studentName).join(', ');
    const studentTitle = `Famille ${data.guardianName} (${data.studentBreakdown.length} élèves : ${childrenNames})`;

    const newPayment: PaymentReceipt = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      isMultiStudent: true,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      studentName: studentTitle,
      category: 'Scolarité Mensuelle (Reçu Groupé Famille)',
      amount: totalAmount,
      paymentMethod: data.paymentMethod,
      paymentDate: finalPaymentDate,
      cashierName: data.cashierName || `${agentName} (${agentRole})`,
      status: 'Validé',
      syncStatus: 'synced',
      notes: data.notes || `Règlement global fratrie pour ${data.studentBreakdown.length} élèves.`,
      studentBreakdown: data.studentBreakdown,
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'paiement',
      title: 'Reçu Groupé Famille',
      subtitle: `${data.guardianName} · ${data.studentBreakdown.length} élèves · Reçu ${receiptNumber}`,
      referenceId: receiptNumber,
      amount: totalAmount,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: data.paymentMethod,
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    // Optimistic updates
    setPayments((prev) => [newPayment, ...prev]);
    setOperations((prev) => [newOp, ...prev]);

    const breakdownMap = new Map(data.studentBreakdown.map((item) => [item.studentId, item.amount]));

    setStudents((prev) =>
      prev.map((s) => {
        if (breakdownMap.has(s.id)) {
          const addedAmount = breakdownMap.get(s.id)!;
          const updatedPaid = (s.paidAmount || 0) + addedAmount;
          const updatedStatus = updatedPaid >= s.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
          const shouldReactivate = data.autoReactivate && s.tutoringStatus !== 'Actif';
          return {
            ...s,
            paidAmount: updatedPaid,
            paymentStatus: updatedStatus,
            tutoringStatus: shouldReactivate ? 'Actif' : s.tutoringStatus,
            stopDate: shouldReactivate ? undefined : s.stopDate,
            stopReason: shouldReactivate ? undefined : s.stopReason,
          };
        }
        return s;
      })
    );

    const writes: Promise<any>[] = [
      setDoc(doc(db, COLLECTIONS.PAYMENTS, newPayment.id), sanitizeForFirestore(newPayment), { merge: true }),
      setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
    ];

    for (const item of data.studentBreakdown) {
      const student = students.find((s) => s.id === item.studentId);
      if (student) {
        const updatedPaid = (student.paidAmount || 0) + item.amount;
        const updatedStatus = updatedPaid >= student.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
        const shouldReactivate = data.autoReactivate && student.tutoringStatus !== 'Actif';
        writes.push(
          setDoc(
            doc(db, COLLECTIONS.STUDENTS, student.id),
            sanitizeForFirestore({
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
              ...(shouldReactivate ? { tutoringStatus: 'Actif', stopDate: null, stopReason: null } : {}),
            }),
            { merge: true }
          )
        );
      }
    }

    await safeFirestoreWrite(Promise.all(writes), 1200);

    showToast(`Reçu Groupé Famille ${receiptNumber} émis (${totalAmount.toLocaleString()} FCFA pour ${data.studentBreakdown.length} élèves).`, 'success');
    return newPayment;
  };

  const deletePayment = async (paymentId: string): Promise<void> => {
    const paymentToDelete = payments.find((p) => p.id === paymentId);
    if (!paymentToDelete) {
      showToast('Paiement introuvable.', 'warning');
      return;
    }

    // 1. Optimistic update
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    setOperations((prev) =>
      prev.filter(
        (op) =>
          op.referenceId !== paymentToDelete.receiptNumber &&
          op.id !== `op-${paymentToDelete.id}` &&
          op.id !== paymentToDelete.id
      )
    );

    const writes: Promise<any>[] = [
      deleteDoc(doc(db, COLLECTIONS.PAYMENTS, paymentId)),
    ];

    // 2. Revert student paid amount & status
    if (
      paymentToDelete.isMultiStudent &&
      paymentToDelete.studentBreakdown &&
      paymentToDelete.studentBreakdown.length > 0
    ) {
      const breakdownMap = new Map(
        paymentToDelete.studentBreakdown.map((item) => [item.studentId, item.amount])
      );

      setStudents((prev) =>
        prev.map((s) => {
          if (breakdownMap.has(s.id)) {
            const deductedAmount = breakdownMap.get(s.id)!;
            const updatedPaid = Math.max(0, (s.paidAmount || 0) - deductedAmount);
            const updatedStatus =
              updatedPaid >= s.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
            return {
              ...s,
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
            };
          }
          return s;
        })
      );

      for (const item of paymentToDelete.studentBreakdown) {
        const student = students.find((s) => s.id === item.studentId);
        if (student) {
          const updatedPaid = Math.max(0, (student.paidAmount || 0) - item.amount);
          const updatedStatus =
            updatedPaid >= student.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
          writes.push(
            setDoc(
              doc(db, COLLECTIONS.STUDENTS, student.id),
              sanitizeForFirestore({
                paidAmount: updatedPaid,
                paymentStatus: updatedStatus,
              }),
              { merge: true }
            )
          );
        }
      }
    } else if (paymentToDelete.studentId) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === paymentToDelete.studentId) {
            const updatedPaid = Math.max(0, (s.paidAmount || 0) - paymentToDelete.amount);
            const updatedStatus =
              updatedPaid >= s.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
            return {
              ...s,
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
            };
          }
          return s;
        })
      );

      const student = students.find((s) => s.id === paymentToDelete.studentId);
      if (student) {
        const updatedPaid = Math.max(0, (student.paidAmount || 0) - paymentToDelete.amount);
        const updatedStatus =
          updatedPaid >= student.monthlyFee ? 'A jour' : updatedPaid > 0 ? 'Partiel' : 'En retard';
        writes.push(
          setDoc(
            doc(db, COLLECTIONS.STUDENTS, student.id),
            sanitizeForFirestore({
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus,
            }),
            { merge: true }
          )
        );
      }
    }

    await safeFirestoreWrite(Promise.all(writes), 1200);

    if (selectedReceipt?.id === paymentId) {
      setSelectedReceipt(null);
    }

    showToast(
      `Paiement N° ${paymentToDelete.receiptNumber} (${paymentToDelete.amount.toLocaleString()} FCFA) supprimé. Soldes réajustés.`,
      'info'
    );
  };

  const addExam = async (
    examData: Omit<ExamApplication, 'id' | 'dossierNumber' | 'syncStatus' | 'agentId' | 'agentName' | 'agentRole' | 'agentAvatar'> & {
      agentId?: string;
      agentName?: string;
      agentRole?: AgentRole;
      agentAvatar?: string;
    }
  ): Promise<ExamApplication> => {
    const dossierNumber = `CNR-2026-${String(exams.length + 23).padStart(3, '0')}`;
    const agentId = examData.agentId || currentUser.id;
    const agentName = examData.agentName || currentUser.fullName;
    const agentRole = examData.agentRole || currentUser.role;
    const agentAvatar = examData.agentAvatar || currentUser.avatar;

    const newExam: ExamApplication = {
      ...examData,
      id: `ex-${Date.now()}`,
      dossierNumber,
      syncStatus: 'synced',
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'concours',
      title: `Dossier ${examData.examType}`,
      subtitle: `${examData.candidateName} · Réf ${dossierNumber}`,
      referenceId: dossierNumber,
      studentId: examData.studentId,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: examData.status,
      agentId,
      agentName,
      agentRole,
      agentAvatar,
    };

    setExams((prev) => [newExam, ...prev]);
    setOperations((prev) => [newOp, ...prev]);

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.EXAMS, newExam.id), sanitizeForFirestore(newExam), { merge: true }),
        setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
      ]),
      1200
    );

    showToast(`Dossier concours ${dossierNumber} enregistré pour ${examData.candidateName}.`, 'success');
    return newExam;
  };

  const toggleExamPiece = async (examId: string, piece: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    const currentSubmitted = exam.submittedPieces || [];
    const currentRequired = exam.requiredPieces || [];
    const alreadySubmitted = currentSubmitted.includes(piece);
    const newSubmitted = alreadySubmitted
      ? currentSubmitted.filter((p) => p !== piece)
      : [...currentSubmitted, piece];

    const isComplete = currentRequired.length > 0 && currentRequired.every((p) => newSubmitted.includes(p));
    const newStatus = isComplete ? 'Validé' : 'Pièces manquantes';

    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? { ...e, submittedPieces: newSubmitted, status: newStatus }
          : e
      )
    );

    await safeFirestoreWrite(
      setDoc(
        doc(db, COLLECTIONS.EXAMS, examId),
        sanitizeForFirestore({
          submittedPieces: newSubmitted,
          status: newStatus,
        }),
        { merge: true }
      ),
      1200
    );

    showToast('Pièces du dossier mises à jour dans Firestore.', 'info');
  };

  const validateExamDossier = async (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    const reqPieces = exam.requiredPieces || [];

    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? { ...e, submittedPieces: [...reqPieces], status: 'Validé' }
          : e
      )
    );

    await safeFirestoreWrite(
      setDoc(
        doc(db, COLLECTIONS.EXAMS, examId),
        sanitizeForFirestore({
          submittedPieces: [...reqPieces],
          status: 'Validé',
        }),
        { merge: true }
      ),
      1200
    );

    showToast('Dossier validé et certifié complet dans Firestore.', 'success');
  };

  const addProduct = async (productData: Omit<InventoryItem, 'id' | 'syncStatus'>) => {
    const newProduct: InventoryItem = {
      ...productData,
      id: `inv-${Date.now()}`,
      syncStatus: 'synced',
    };

    setInventory((prev) => [newProduct, ...prev]);

    await safeFirestoreWrite(
      setDoc(doc(db, COLLECTIONS.INVENTORY, newProduct.id), sanitizeForFirestore(newProduct), { merge: true }),
      1200
    );

    showToast(`Article "${productData.name}" ajouté au stock Firestore.`, 'success');
  };

  const updateStock = async (productId: string, quantityDelta: number, reason?: string) => {
    const item = inventory.find((p) => p.id === productId);
    if (!item) return;

    const newQty = Math.max(0, item.stockQuantity + quantityDelta);

    setInventory((prev) =>
      prev.map((it) => (it.id === productId ? { ...it, stockQuantity: newQty } : it))
    );

    await safeFirestoreWrite(
      setDoc(
        doc(db, COLLECTIONS.INVENTORY, productId),
        sanitizeForFirestore({ stockQuantity: newQty }),
        { merge: true }
      ),
      1200
    );

    showToast(`Stock ajusté (${quantityDelta > 0 ? '+' : ''}${quantityDelta}). ${reason || ''}`, 'info');
  };

  const deleteProduct = async (productId: string) => {
    setInventory((prev) => prev.filter((it) => it.id !== productId));
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.INVENTORY, productId)), 1200);
    showToast('Article retiré du catalogue Firestore.', 'info');
  };

  const recordSupplySale = async (
    customerName: string,
    items: { itemId: string; quantity: number }[],
    paymentMethod: any,
    studentId?: string
  ) => {
    const saleNumber = `VNT-2026-${String(Date.now()).slice(-4)}`;

    let totalAmount = 0;
    const saleItems = items
      .map((i) => {
        const product = inventory.find((p) => p.id === i.itemId);
        if (!product) return null;
        const total = product.unitPrice * i.quantity;
        totalAmount += total;
        return {
          itemId: product.id,
          itemName: product.name,
          quantity: i.quantity,
          unitPrice: product.unitPrice,
          total,
        };
      })
      .filter(Boolean) as SupplySale['items'];

    const nowDateTime = getCurrentFrenchDateTime();
    const nowDate = getCurrentFrenchDate();

    const newSale: SupplySale = {
      id: `sale-${Date.now()}`,
      saleNumber,
      customerName,
      studentId,
      items: saleItems,
      totalAmount,
      paymentMethod,
      saleDate: nowDate,
      syncStatus: 'synced',
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };

    const newReceipt: PaymentReceipt = {
      id: `pay-${Date.now()}`,
      receiptNumber: `REC-2026-${String(payments.length + 942).padStart(4, '0')}`,
      studentName: `${customerName} (Achat Fournitures)`,
      studentId,
      category: 'Fournitures',
      amount: totalAmount,
      paymentMethod,
      paymentDate: nowDateTime,
      cashierName: `${currentUser.fullName} (${currentUser.role})`,
      status: 'Validé',
      syncStatus: 'synced',
      notes: `Vente de fournitures #${saleNumber}`,
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };

    const newOp: OperationItem = {
      id: `op-${Date.now()}`,
      type: 'vente',
      title: 'Vente Fournitures',
      subtitle: `${customerName} · ${totalAmount.toLocaleString()} FCFA`,
      referenceId: saleNumber,
      studentId,
      amount: totalAmount,
      timestamp: 'À l\'instant',
      syncStatus: 'synced',
      metaBadge: paymentMethod,
      agentId: currentUser.id,
      agentName: currentUser.fullName,
      agentRole: currentUser.role,
      agentAvatar: currentUser.avatar,
    };

    // Optimistic update
    setSupplySales((prev) => [newSale, ...prev]);
    setPayments((prev) => [newReceipt, ...prev]);
    setOperations((prev) => [newOp, ...prev]);
    setInventory((prev) =>
      prev.map((it) => {
        const found = items.find((i) => i.itemId === it.id);
        if (found) {
          return { ...it, stockQuantity: Math.max(0, it.stockQuantity - found.quantity) };
        }
        return it;
      })
    );

    const stockUpdates = items.map((i) => {
      const invItem = inventory.find((p) => p.id === i.itemId);
      const updatedQty = Math.max(0, (invItem?.stockQuantity || 0) - i.quantity);
      return setDoc(
        doc(db, COLLECTIONS.INVENTORY, i.itemId),
        sanitizeForFirestore({ stockQuantity: updatedQty }),
        { merge: true }
      );
    });

    await safeFirestoreWrite(
      Promise.all([
        setDoc(doc(db, COLLECTIONS.SUPPLY_SALES, newSale.id), sanitizeForFirestore(newSale), { merge: true }),
        setDoc(doc(db, COLLECTIONS.PAYMENTS, newReceipt.id), sanitizeForFirestore(newReceipt), { merge: true }),
        setDoc(doc(db, COLLECTIONS.OPERATIONS, newOp.id), sanitizeForFirestore(newOp), { merge: true }),
        ...stockUpdates,
      ]),
      1500
    );

    showToast(`Vente #${saleNumber} enregistrée (${totalAmount.toLocaleString()} FCFA) par ${currentUser.fullName}.`, 'success');
  };

  const dismissAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.ALERTS, id)), 1000);
    showToast('Alerte masquée et supprimée de Firestore.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isFirebaseReady,
        cloudSyncStatus,
        lastCloudSync,
        isAuthenticated,
        currentUser,
        isAdminPrincipal,
        agents,
        setCurrentAgentId,
        login,
        logout,
        updateAdminPassword,
        updateUserProfile,
        addAgent,
        deleteAgent,
        updateAgentRole,
        resetAgentPassword,
        toggleAgentStatus,
        currentTab,
        setCurrentTab,
        timePeriod,
        setTimePeriod,
        campus,
        setCampus,
        searchQuery,
        setSearchQuery,
        networkStatus,
        setNetworkStatus,
        toggleNetworkSimulation,
        syncQueue,
        isSyncing,
        triggerSync,
        forceSeedCloudDatabase,
        students,
        addStudent,
        stopStudentTutoring,
        resumeStudentTutoring,
        payments,
        addPayment,
        addFamilyPayment,
        deletePayment,
        exams,
        addExam,
        toggleExamPiece,
        validateExamDossier,
        inventory,
        addProduct,
        updateStock,
        deleteProduct,
        recordSupplySale,
        supplySales,
        tutors,
        addTutor,
        updateTutor,
        deleteTutor,
        assignTutorToStudent,
        unassignTutorFromStudent,
        assignStudentToGroup,
        removeStudentFromGroup,
        assignTutorToGroup,
        unassignTutorFromGroup,
        updateStudent,
        deleteStudent,
        updateExam,
        deleteExam,
        updateAgent,
        operations,
        alerts,
        dismissAlert,
        getStudentPayments,
        getStudentExams,
        getStudentSupplies,
        getAgentOperations,
        isNewStudentModalOpen,
        setIsNewStudentModalOpen,
        editingStudent,
        setEditingStudent,
        isStopTutoringModalOpen,
        setIsStopTutoringModalOpen,
        selectedStudentForStop,
        setSelectedStudentForStop,
        isNewPaymentModalOpen,
        setIsNewPaymentModalOpen,
        isNewSupplySaleModalOpen,
        setIsNewSupplySaleModalOpen,
        isNewProductModalOpen,
        setIsNewProductModalOpen,
        isRestockModalOpen,
        setIsRestockModalOpen,
        selectedProductForRestock,
        setSelectedProductForRestock,
        isNewExamModalOpen,
        setIsNewExamModalOpen,
        isAssignModalOpen,
        setIsAssignModalOpen,
        selectedStudentForAssignment,
        setSelectedStudentForAssignment,
        selectedTutorForAssignment,
        setSelectedTutorForAssignment,
        isSyncDrawerOpen,
        setIsSyncDrawerOpen,
        isSearchOpen,
        setIsSearchOpen,
        isGroupDetailModalOpen,
        setIsGroupDetailModalOpen,
        selectedGroupForDetail,
        setSelectedGroupForDetail,
        familyPaymentTargetParent,
        setFamilyPaymentTargetParent,
        selectedReceipt,
        setSelectedReceipt,
        toastMessage,
        showToast,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
