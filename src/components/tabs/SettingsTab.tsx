import React, { useState, useRef, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Users,
  Save,
  Check,
  RefreshCw,
  LogOut,
  BadgeCheck,
  UserPlus,
  Trash2,
  X,
  Cloud,
  Zap,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Lock,
  RotateCcw,
  UserCheck,
  Building2,
  Sparkles,
  Camera,
  Info,
  Power,
  Smartphone,
  Download,
  Wifi,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentRole, Agent, OFFICIAL_ROLES, DEFAULT_USER_ROLE, isSuperAdminRole, getRoleConfig } from '../../types';
import { compressImage, getSafeAvatarUrl } from '../../utils/imageOptimizer';
import { testFirebaseConnection } from '../../firebase';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const SettingsTab: React.FC = () => {
  const {
    currentUser,
    isAdminPrincipal,
    agents,
    setCurrentAgentId,
    addAgent,
    deleteAgent,
    updateAgentRole,
    resetAgentPassword,
    toggleAgentStatus,
    updateAdminPassword,
    updateUserProfile,
    theme,
    setTheme,
    campus,
    setCampus,
    logout,
    showToast,
    operations,
    students,
    payments,
    lastCloudSync,
    forceSeedCloudDatabase,
    triggerSync,
    isSyncing,
  } = useApp();

  // Active role config
  const currentRoleConfig = getRoleConfig(currentUser?.role || 'Admin Principal');
  const isSuperAdmin = isAdminPrincipal || isSuperAdminRole(currentUser?.role || 'Admin Principal');

  // Profile edit state
  const [profileName, setProfileName] = useState(currentUser?.fullName || 'Administrateur');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || 'admin@cabappuis.ne');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '+227 96 00 11 22');
  const [profileCampus, setProfileCampus] = useState(currentUser?.campus || campus);
  const [profileGender, setProfileGender] = useState<'Masculin (M)' | 'Féminin (F)'>(
    currentUser?.gender || 'Masculin (M)'
  );
  const [profileRole, setProfileRole] = useState<AgentRole>(currentUser?.role || 'Admin Principal');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || AVATAR_PRESETS[0]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile form when currentUser changes (e.g., session switch)
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName || 'Administrateur');
      setProfileEmail(currentUser.email || 'admin@cabappuis.ne');
      setProfilePhone(currentUser.phone || '+227 96 00 11 22');
      setProfileCampus(currentUser.campus || campus);
      setProfileGender(currentUser.gender || 'Masculin (M)');
      setProfileRole(currentUser.role || 'Admin Principal');
      setProfileAvatar(currentUser.avatar || AVATAR_PRESETS[0]);
    }
  }, [currentUser, campus]);

  // Personal Password modification state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // User Creation Modal / Form State (Restricted to Admin Principal)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newGender, setNewGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [newRole, setNewRole] = useState<AgentRole>('Agent Caisse');
  const [newPasswordVal, setNewPasswordVal] = useState('1234');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+227 ');
  const [newCampus, setNewCampus] = useState(campus);
  const [newAvatar, setNewAvatar] = useState(AVATAR_PRESETS[0]);
  const [avatarPreview, setAvatarPreview] = useState<string>(AVATAR_PRESETS[0]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Reset Modal for Super Admin
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetAgentForReset, setTargetAgentForReset] = useState<Agent | null>(null);
  const [adminResetNewPass, setAdminResetNewPass] = useState('1234');
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Delete User Confirmation Modal for Super Admin
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetAgentForDelete, setTargetAgentForDelete] = useState<Agent | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Firebase connection test
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudPingResult, setCloudPingResult] = useState<string | null>(null);

  const handleTestCloud = async () => {
    setIsTestingCloud(true);
    setCloudPingResult('Test de connectivité...');
    const t0 = performance.now();
    try {
      const ok = await testFirebaseConnection();
      const elapsed = Math.round(performance.now() - t0);
      setCloudPingResult(ok ? `✅ Firestore connecté (${elapsed} ms)` : '⚠️ Hors-ligne');
    } catch {
      setCloudPingResult('❌ Erreur Firestore');
    } finally {
      setIsTestingCloud(false);
    }
  };

  // Restrict access check handler with toast alert
  const handleRestrictedActionClick = (actionName = "Cette action") => {
    if (!isSuperAdmin) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return true; // blocked
    }
    return false; // allowed
  };

  // Personal Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'Veuillez renseigner le mot de passe actuel.',
      });
      return;
    }
    if (!newPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'Veuillez saisir le nouveau mot de passe.',
      });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordStatus({
        type: 'error',
        message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'La confirmation ne correspond pas au nouveau mot de passe.',
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await updateAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordStatus({
          type: 'success',
          message: 'Mot de passe utilisateur actualisé avec succès dans Firestore !',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({
          type: 'error',
          message: res.message,
        });
      }
    } catch {
      setPasswordStatus({
        type: 'error',
        message: 'Erreur lors de la mise à jour du mot de passe.',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Personal Profile Save (Role is strictly locked)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updateData: Partial<Agent> = {
        fullName: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        campus: profileCampus,
        gender: profileGender,
        avatar: profileAvatar,
      };

      await updateUserProfile(updateData);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la sauvegarde du profil.', 'warning');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
        setProfileAvatar(compressed);
      } catch (err) {
        console.error('Failed to compress avatar', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
        setAvatarPreview(compressed);
        setNewAvatar(compressed);
      } catch (err) {
        console.error('Failed to compress avatar', err);
      }
    }
  };

  // Create User (Restricted to Admin Principal, with automatic standard DEFAULT_USER_ROLE)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      setIsAddUserModalOpen(false);
      return;
    }

    if (!newFullName.trim()) {
      showToast("Veuillez saisir le nom complet de l'utilisateur.", 'warning');
      return;
    }
    if (!newUsername.trim()) {
      showToast("Veuillez saisir un nom d'utilisateur (identifiant).", 'warning');
      return;
    }

    const cleanUser = newUsername.trim().toLowerCase();
    const existing = agents.find((a) => a.username.toLowerCase() === cleanUser);
    if (existing) {
      showToast(`L'identifiant "${cleanUser}" est déjà utilisé par un autre agent.`, 'warning');
      return;
    }

    setIsCreatingUser(true);
    try {
      await addAgent({
        fullName: newFullName.trim(),
        username: cleanUser,
        gender: newGender,
        role: DEFAULT_USER_ROLE,
        password: newPasswordVal.trim() || '1234',
        email: newEmail.trim() || `${cleanUser}@cabappuis.ne`,
        phone: newPhone.trim(),
        campus: newCampus,
        avatar: newAvatar,
      });

      setIsAddUserModalOpen(false);
      // Reset form fields
      setNewFullName('');
      setNewUsername('');
      setNewGender('Masculin (M)');
      setNewRole(DEFAULT_USER_ROLE);
      setNewPasswordVal('1234');
      setNewEmail('');
      setNewPhone('+227 ');
      setNewAvatar(AVATAR_PRESETS[0]);
      setAvatarPreview(AVATAR_PRESETS[0]);
    } catch (err) {
      console.error('Error creating user in Firestore:', err);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handle Role Change for an agent (Restricted to Admin Principal)
  const handleAgentRoleChange = async (agent: Agent, newRoleSelected: AgentRole) => {
    if (!isSuperAdmin) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      return;
    }
    if (agent.role === newRoleSelected) return;

    await updateAgentRole(agent.id, newRoleSelected);
  };

  // Handle Admin Reset Password Submit
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !targetAgentForReset) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      setIsResetModalOpen(false);
      return;
    }

    if (!adminResetNewPass.trim() || adminResetNewPass.trim().length < 4) {
      showToast('Le mot de passe doit comporter au moins 4 caractères.', 'warning');
      return;
    }

    setIsResettingPass(true);
    try {
      await resetAgentPassword(targetAgentForReset.id, adminResetNewPass.trim());
      setIsResetModalOpen(false);
      setTargetAgentForReset(null);
      setAdminResetNewPass('1234');
    } finally {
      setIsResettingPass(false);
    }
  };

  // Handle Delete User Submit
  const handleConfirmDeleteUser = async () => {
    if (!isSuperAdmin || !targetAgentForDelete) {
      showToast("Action réservée à l'Administrateur Principal", 'warning');
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeletingUser(true);
    try {
      await deleteAgent(targetAgentForDelete.id);
      setIsDeleteModalOpen(false);
      setTargetAgentForDelete(null);
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Active User Hero Header with explicit Role & Identity */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={getSafeAvatarUrl(currentUser.avatar, currentUser.fullName)}
                alt={currentUser.fullName}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </h2>
                
                {/* Visual badge for current user role */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-xs ${currentRoleConfig.badgeBg} ${currentRoleConfig.badgeText} ${currentRoleConfig.badgeBorder}`}
                >
                  {isSuperAdmin ? (
                    <Crown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  <span>{currentUser.role}</span>
                </span>

                {currentUser.gender && (
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {currentUser.gender}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Identifiant actif : <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">@{currentUser.username}</span> · {currentUser.email} · {currentUser.campus}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* RBAC Protected Button: + Nouvel Utilisateur */}
            {isSuperAdmin ? (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Nouvel Utilisateur</span>
              </button>
            ) : (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => handleRestrictedActionClick("Ajout d'utilisateur")}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 font-semibold text-xs px-4 py-2.5 border border-slate-200 dark:border-slate-700 cursor-not-allowed transition-all"
                  title="Action réservée à l'Administrateur Principal"
                >
                  <Lock className="h-4 w-4 text-amber-500" />
                  <span>+ Nouvel Utilisateur</span>
                </button>
                <span className="hidden group-hover:block absolute right-0 top-full mt-1.5 z-30 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[11px] px-2.5 py-1 shadow-lg border border-slate-700">
                  🔒 Action réservée à l'Administrateur Principal
                </span>
              </div>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        {/* Informative Security Banner for non-Super Admin */}
        {!isSuperAdmin && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>Régime d'accès standard (RBAC) · Rôle : {currentUser.role}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200">
                  Accès Restreint
                </span>
              </div>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300/90 leading-relaxed">
                Les opérations de gouvernance système (ajout d'utilisateurs, modification des rôles d'attribution, réinitialisation de mots de passe, suppression ou désactivation de comptes) sont <strong className="font-semibold underline">strictement réservées à l'Administrateur Principal</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Session Switcher for Testing & Demonstration of Roles */}
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-slate-800 dark:via-indigo-950/20 dark:to-slate-850 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Simulateur de Rôles & Bascule Rapide de Session (RBAC)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Basculez instantanément entre les comptes pour tester et constater les permissions et restrictions en temps réel.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {agents.map((ag) => {
            const isSelected = ag.id === currentUser.id;
            const agRoleCfg = getRoleConfig(ag.role);

            return (
              <button
                key={ag.id}
                onClick={() => {
                  if (ag.id !== currentUser.id) {
                    setCurrentAgentId(ag.id);
                    showToast(`Session active basculée sur : ${ag.fullName} (${ag.role})`, 'info');
                  }
                }}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-white dark:bg-slate-750 shadow-sm ring-2 ring-indigo-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-750'
                }`}
              >
                <img
                  src={getSafeAvatarUrl(ag.avatar, ag.fullName)}
                  alt={ag.fullName}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ag.fullName}
                    </span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Connecté" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full truncate ${agRoleCfg.badgeBg} ${agRoleCfg.badgeText}`}
                    >
                      {ag.role}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: User Management Table & Profile Edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. GESTION DES UTILISATEURS & CONTRÔLE DES RÔLES (RBAC) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Gestion des Utilisateurs & Rôles</span>
                    {isSuperAdmin ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                        👑 Mode Contrôle Total
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        🔒 Lecture Seule
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {agents.length} compte(s) utilisateur(s) actif(s) synchronisé(s) dans Google Cloud Firestore.
                  </p>
                </div>
              </div>

              {/* Add User Button with RBAC Protection */}
              {isSuperAdmin ? (
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Ajouter un utilisateur</span>
                </button>
              ) : (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => handleRestrictedActionClick("Ajout d'utilisateur")}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/60 px-3.5 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    <span>+ Ajouter un utilisateur</span>
                  </button>
                  <span className="hidden group-hover:block absolute right-0 top-full mt-1 z-30 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[10px] px-2.5 py-1 shadow-md border border-slate-700">
                    Action réservée à l'Administrateur Principal
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Utilisateur & Photo</th>
                    <th className="py-2.5 px-3">Sexe</th>
                    <th className="py-2.5 px-3">Rôle & Attribution</th>
                    <th className="py-2.5 px-3">Campus / Site</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Actions RBAC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {agents.map((agent) => {
                    const isSelected = currentUser.id === agent.id;
                    const roleCfg = getRoleConfig(agent.role);

                    return (
                      <tr
                        key={agent.id}
                        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-750/50 ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium' : ''
                        }`}
                      >
                        {/* User & Photo */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getSafeAvatarUrl(agent.avatar, agent.fullName)}
                              alt={agent.fullName}
                              className="h-9 w-9 rounded-xl object-cover ring-2 ring-indigo-500/30 shadow-sm shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{agent.fullName}</span>
                                {isSelected && (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                @{agent.username} · {agent.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {agent.gender === 'Féminin (F)' ? 'F' : 'M'}
                          </span>
                        </td>

                        {/* Rôle & Attribution (Strictement verrouillé - pas de modification client) */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                            title={`Rôle attribué : ${agent.role}`}
                          >
                            {isSuperAdminRole(agent.role) ? (
                              <Crown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <Lock className="h-3 w-3 opacity-60 text-slate-500 dark:text-slate-400" />
                            )}
                            <span>{agent.role}</span>
                          </span>
                        </td>

                        {/* Campus */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                          {agent.campus}
                        </td>

                        {/* Status (Actif / Inactif) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => toggleAgentStatus(agent.id)}
                              disabled={isSelected}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                agent.active
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 cursor-pointer'
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 cursor-pointer'
                              } ${isSelected ? 'opacity-70 cursor-not-allowed' : ''}`}
                              title={isSelected ? 'Vous ne pouvez pas désactiver votre propre session' : 'Cliquer pour basculer le statut'}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{agent.active ? 'Actif' : 'Désactivé'}</span>
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                agent.active
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{agent.active ? 'Actif' : 'Désactivé'}</span>
                            </span>
                          )}
                        </td>

                        {/* RBAC Actions column */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password Button */}
                            {isSuperAdmin ? (
                              <button
                                onClick={() => {
                                  setTargetAgentForReset(agent);
                                  setAdminResetNewPass('1234');
                                  setIsResetModalOpen(true);
                                }}
                                title="Réinitialiser le mot de passe de cet utilisateur"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestrictedActionClick("Réinitialisation de mot de passe")}
                                title="Action réservée à l'Administrateur Principal"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete User Button */}
                            {isSuperAdmin ? (
                              <button
                                onClick={() => {
                                  if (isSelected) {
                                    showToast('Impossible de supprimer votre propre compte connecté.', 'warning');
                                    return;
                                  }
                                  if (agents.length <= 1) {
                                    showToast('Impossible de supprimer le dernier utilisateur restant.', 'warning');
                                    return;
                                  }
                                  setTargetAgentForDelete(agent);
                                  setIsDeleteModalOpen(true);
                                }}
                                disabled={isSelected}
                                title={isSelected ? 'Votre propre compte' : 'Supprimer cet utilisateur'}
                                className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ${
                                  isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestrictedActionClick("Suppression de compte")}
                                title="Action réservée à l'Administrateur Principal"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. ÉDITION DU PROFIL PERSONNEL AVAC CHAMP 'RÔLE' VERROUILLÉ SELON RBAC */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mon Profil & Informations Personnelles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mise à jour de votre identité et photo. La modification du rôle est soumise aux règles de sécurité RBAC.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
              {/* Photo & Avatar Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <div className="relative">
                  <img
                    src={getSafeAvatarUrl(profileAvatar, profileName)}
                    alt={profileName}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
                    title="Téléverser une nouvelle photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={profileFileInputRef}
                    onChange={handleProfileAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Photo de profil & Avatar de traçabilité
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cette photo signe toutes vos opérations (inscriptions, reçus de caisse, affectations).
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileAvatar(p)}
                        className={`h-7 w-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          profileAvatar === p
                            ? 'ring-2 ring-indigo-500 border-transparent scale-110'
                            : 'border-slate-300 dark:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom Complet <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Username (Read Only) */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom d'utilisateur (Identifiant)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-750 px-3.5 py-2.5 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse Email Professionnelle
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Numéro de Téléphone
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sexe / Genre
                  </label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value as 'Masculin (M)' | 'Féminin (F)')}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Masculin (M)">Masculin (M)</option>
                    <option value="Féminin (F)">Féminin (F)</option>
                  </select>
                </div>

                {/* RÔLE : STRICTEMENT VERROUILLÉ EN LECTURE SEULE (TOUS UTILISATEURS) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Rôle & Niveau d'Accès Système
                    </label>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      <Lock className="h-3 w-3 text-slate-400" />
                      Verrouillé (Lecture Seule)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750/80">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${currentRoleConfig.badgeBg} ${currentRoleConfig.badgeText} ${currentRoleConfig.badgeBorder} border`}>
                        {currentUser.role}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isSuperAdminRole(currentUser.role)
                          ? 'Super Administrateur Unique (Verrouillé)'
                          : 'Rôle Opérationnel Attribué (Non modifiable)'}
                      </span>
                    </div>
                    {isSuperAdminRole(currentUser.role) && (
                      <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Enregistrement Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Enregistrer les modifications du profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 3. Formulaire Personnel de Mot de Passe */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sécurité & Modification de Mon Mot de Passe
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actualisez votre propre mot de passe de session de manière sécurisée.
                </p>
              </div>
            </div>

            {passwordStatus && (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs animate-in fade-in ${
                  passwordStatus.type === 'success'
                    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mot de passe actuel <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisissez le mot de passe actuel"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nouveau mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 4 caractères"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez le mot de passe"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Enregistrement Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Valider mon nouveau mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Cloud Status, Theme & Role Info */}
        <div className="space-y-6">
          {/* Cloud Firestore Status Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google Cloud Firebase
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connecté
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Base de données Cloud Firestore Enterprise synchronisée en temps réel.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Dernier Sync :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{lastCloudSync}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Élèves enregistrés :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{students.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Reçus de caisse :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{payments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Utilisateurs RBAC :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{agents.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleTestCloud}
                disabled={isTestingCloud}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>{isTestingCloud ? 'Ping Firestore...' : 'Tester la latence Cloud'}</span>
              </button>

              <button
                onClick={() => triggerSync()}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisation Firestore...' : 'Actualiser les données Firestore'}</span>
              </button>
            </div>
            {cloudPingResult && (
              <p className="mt-2 text-center text-[11px] font-mono text-slate-600 dark:text-slate-300">
                {cloudPingResult}
              </p>
            )}
          </div>

          {/* Progressive Web App (PWA) & Offline Cache Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Application PWA & Hors-Ligne
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Installable
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Version installable hors du navigateur avec Service Worker Workbox et stratégie Network-First / Stale-While-Revalidate.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Mode d'affichage :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">Standalone (Fenêtre Dédiée)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Service Worker :</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Actif (Auto-Update)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Icônes conformes :</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">192px · 512px · Maskable</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Stratégie API :</span>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">Network First (5s timeout)</span>
              </div>
            </div>

            <div className="space-y-2">
              <PWAInstallButton variant="sidebar" className="w-full justify-center py-2.5" />
            </div>
          </div>

          {/* RBAC Roles Matrix / Guide Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span>Matrice des Rôles & Permissions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Architecture des droits d'accès au Back-Office Cab-Appuis.
            </p>

            <div className="space-y-3">
              {OFFICIAL_ROLES.map((role) => {
                const cfg = getRoleConfig(role);
                const isCurrent = currentUser.role === role;

                return (
                  <div
                    key={role}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30'
                        : 'border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-750/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {role}
                      </span>
                      {cfg.canCreateUser ? (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Opérateur
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      {cfg.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme Selector Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Thème & Affichage
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Bascule dynamique instantanée du thème global.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 hover:border-slate-300'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-2">
                  <Sun className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mode Clair</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Luminosité standard</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 hover:border-slate-300'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-indigo-400 mb-2">
                  <Moon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mode Sombre</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Contraste nocturne</span>
              </button>
            </div>
          </div>

          {/* Campus & Local Configuration Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Configuration du Site Actif
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sélectionnez le centre opérationnel de rattachement.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Site / Campus
                </label>
                <select
                  value={campus}
                  onChange={(e) => {
                    setCampus(e.target.value);
                    showToast(`Site actif : ${e.target.value}`, 'info');
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  <option value="Site Niamey 2000 (Siège Principal)">Site Niamey 2000 (Siège Principal)</option>
                  <option value="Site Niamey Plateau">Site Niamey Plateau</option>
                  <option value="Site Niamey Yantala">Site Niamey Yantala</option>
                  <option value="Site Niamey Koira Kano">Site Niamey Koira Kano</option>
                  <option value="Site Niamey Talladjé">Site Niamey Talladjé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Official Logo & Receipt Branding Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Identité & Logo Officiel</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                Actif sur tous les Reçus
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Ce logo officiel est imprimé en haute définition et apposé en filigrane et cachet sur toutes les quittances et reçus de caisse.
            </p>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Logo Officiel Cab-Appuis"
                className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {CAB_APPUIS_INFO.name}
                </div>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {CAB_APPUIS_INFO.acronym} · {CAB_APPUIS_INFO.motto}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  NIF : {CAB_APPUIS_INFO.nif} · RCCM : {CAB_APPUIS_INFO.rccm}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER CREATION MODAL (Strictly restricted to Admin Principal) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-750">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Créer un Nouvel Utilisateur</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      👑 Admin Principal Requis
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enregistrement sécurisé Cloud Firestore avec rôle et photo compressée.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isSuperAdmin ? (
              <div className="p-6 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-2">
                  <Lock className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Action réservée à l'Administrateur Principal
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Votre rôle actuel ({currentUser.role}) ne vous autorise pas à créer de nouveaux utilisateurs sur le système.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Avatar Selection */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Photo de Profil & Avatar de Traçabilité
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Aperçu"
                        className="h-16 w-16 rounded-xl object-cover ring-2 ring-indigo-500 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors"
                        title="Téléverser une photo personnalisée"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                        Sélectionnez un avatar prédéfini ou téléversez un fichier
                      </span>
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        {AVATAR_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatarPreview(p);
                              setNewAvatar(p);
                            }}
                            className={`h-7 w-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                              avatarPreview === p
                                ? 'ring-2 ring-indigo-500 border-transparent scale-110'
                                : 'border-slate-300 dark:border-slate-600 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={p} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nom Complet <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="ex: Amina Issaka"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nom d'utilisateur (Identifiant) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="ex: amina.inscriptions"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sexe (M/F) */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sexe / Genre <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as 'Masculin (M)' | 'Féminin (F)')}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Masculin (M)">Masculin (M)</option>
                      <option value="Féminin (F)">Féminin (F)</option>
                    </select>
                  </div>

                  {/* Rôle Utilisateur : Attribution Automatique Standard Verrouillée */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Rôle Système Attribué <span className="text-rose-500">*</span>
                      </label>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <Lock className="h-3 w-3 text-slate-400" />
                        Attribution Automatique
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          {DEFAULT_USER_ROLE}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          (Rôle standard sécurisé)
                        </span>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mot de passe initial
                    </label>
                    <input
                      type="password"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="Par défaut: 1234"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Site / Campus d'affectation
                    </label>
                    <select
                      value={newCampus}
                      onChange={(e) => setNewCampus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Campus Niamey Plateau (Central)">Campus Niamey Plateau (Central)</option>
                      <option value="Campus Niamey Yantala">Campus Niamey Yantala</option>
                      <option value="Campus Niamey Koira Kano">Campus Niamey Koira Kano</option>
                      <option value="Campus Niamey Talladjé">Campus Niamey Talladjé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Professionnel
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ex: amina@cabappuis.ne"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Téléphone Professionnel
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+227 90 00 00 00"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isCreatingUser}
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingUser ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isCreatingUser ? 'Enregistrement Firestore...' : "Enregistrer l'Utilisateur"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL (Super Admin) */}
      {isResetModalOpen && targetAgentForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Réinitialiser le Mot de Passe
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pour : <strong className="text-slate-800 dark:text-slate-200">{targetAgentForReset.fullName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <img
                  src={getSafeAvatarUrl(targetAgentForReset.avatar, targetAgentForReset.fullName)}
                  alt={targetAgentForReset.fullName}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-300"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {targetAgentForReset.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    @{targetAgentForReset.username} · Rôle : {targetAgentForReset.role}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nouveau Mot de Passe Temporaire
                </label>
                <input
                  type="text"
                  required
                  value={adminResetNewPass}
                  onChange={(e) => setAdminResetNewPass(e.target.value)}
                  placeholder="ex: 1234"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3.5 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  L'utilisateur pourra se connecter immédiatement avec ce nouveau mot de passe.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isResettingPass}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isResettingPass ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Appliquer la Réinitialisation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (Super Admin) */}
      {isDeleteModalOpen && targetAgentForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Supprimer cet utilisateur ?
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le compte de{' '}
              <strong className="text-slate-900 dark:text-white">{targetAgentForDelete.fullName}</strong> (@{targetAgentForDelete.username}) ? Cette action est irréversible dans Firestore.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingUser ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Confirmer la Suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
