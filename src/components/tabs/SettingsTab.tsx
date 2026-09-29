import React, { useState, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Cloud,
  Server,
  Zap,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentRole, Agent } from '../../types';
import { compressImage, getSafeAvatarUrl } from '../../utils/imageOptimizer';
import { testFirebaseConnection } from '../../firebase';

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
    agents,
    setCurrentAgentId,
    addAgent,
    deleteAgent,
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
    isSyncing,
  } = useApp();

  // Password modification state
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

  // Profile edit state
  const [profileName, setProfileName] = useState(currentUser.fullName);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '+227 96 00 11 22');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // User Creation Modal / Form State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<AgentRole>('Agent de Caisse');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+227 ');
  const [newCampus, setNewCampus] = useState(campus);
  const [newAvatar, setNewAvatar] = useState(AVATAR_PRESETS[0]);
  const [avatarPreview, setAvatarPreview] = useState<string>(AVATAR_PRESETS[0]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase connection test in settings
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
          message: 'Mot de passe administrateur actualisé avec succès dans Firestore !',
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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: profileName,
        email: profileEmail,
        phone: profilePhone,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
        role: newRole,
        password: newPasswordVal.trim() || '1234',
        email: newEmail.trim() || `${cleanUser}@cabappuis.ne`,
        phone: newPhone.trim(),
        campus: newCampus,
        avatar: newAvatar,
      });

      setIsAddUserModalOpen(false);
      // Reset fields
      setNewFullName('');
      setNewUsername('');
      setNewPasswordVal('');
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

  return (
    <div className="space-y-6 pb-12">
      {/* Active User Hero Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={getSafeAvatarUrl(currentUser.avatar, currentUser.fullName)}
                alt={currentUser.fullName}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Identifiant actif : <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{currentUser.username}</span> · {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Nouvel Utilisateur</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: User Management & Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Equipe & Gestion Complète des Utilisateurs avec Photos */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Gestion des Utilisateurs & Traçabilité par Photo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {agents.length} agent(s) synchronisé(s) dans Google Firebase Cloud Firestore.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Ajouter un agent</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Agent & Photo</th>
                    <th className="py-2.5 px-3">Rôle Attribué</th>
                    <th className="py-2.5 px-3">Campus / Site</th>
                    <th className="py-2.5 px-3 text-center">Actions Signées</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Session Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {agents.map((agent) => {
                    const agentOps = operations.filter((op) => op.agentId === agent.id);
                    const isSelected = currentUser.id === agent.id;

                    return (
                      <tr
                        key={agent.id}
                        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-750/50 ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getSafeAvatarUrl(agent.avatar, agent.fullName)}
                              alt={agent.fullName}
                              className="h-9 w-9 rounded-xl object-cover ring-2 ring-indigo-500/30 shadow-sm"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {agent.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                @{agent.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                              agent.role === 'Administrateur Principal'
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                                : agent.role === 'Agent de Caisse'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            <BadgeCheck className="h-3 w-3" />
                            {agent.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {agent.campus}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg text-[11px]">
                            {agentOps.length} opération(s)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <Check className="h-3.5 w-3.5" />
                              Connecté (Vous)
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setCurrentAgentId(agent.id);
                                  showToast(`Session basculée sur : ${agent.fullName} (${agent.role})`, 'info');
                                }}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                Agir en tant que
                              </button>
                              {agents.length > 1 && agent.role !== 'Administrateur Principal' && (
                                <button
                                  onClick={() => deleteAgent(agent.id)}
                                  title="Supprimer cet utilisateur"
                                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Formulaire de Modification du Mot de Passe Administrateur */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sécurité & Mot de Passe d'Administration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actualisez les identifiants d'accès maître. Prise d'effet immédiate.
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

              <div className="pt-3 flex justify-end">
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
                      <span>Valider le nouveau mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Theme & Local Site Settings */}
        <div className="space-y-6">
          {/* Cloud Status Card */}
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
            </div>

            <div className="space-y-2">
              <button
                onClick={handleTestCloud}
                disabled={isTestingCloud}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>{isTestingCloud ? 'Ping Firestore...' : 'Tester la latence Cloud'}</span>
              </button>

              <button
                onClick={() => forceSeedCloudDatabase()}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Enregistrement Firestore...' : 'Peupler / Écrire dans Firestore'}</span>
              </button>
            </div>
            {cloudPingResult && (
              <p className="mt-2 text-center text-[11px] font-mono text-slate-600 dark:text-slate-300">
                {cloudPingResult}
              </p>
            )}
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

          {/* Legal Identity Card */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-6 shadow-sm text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
              Identité & Documents Officiels
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
              Mentions obligatoires figurant sur tous les reçus, quittances et registres.
            </p>

            <div className="space-y-2 font-sans bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="font-bold text-slate-900 dark:text-white">
                Cabinet d'Appuis Scolaire MANI
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                📍 Quartier Niamey 2000, Niamey (Niger)
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">NIF :</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">153633/P</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">RCCM :</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">NE-NIM-A10-05126</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300">
                📞 <span className="font-mono font-bold">+227 91 58 44 59 / 96 16 51 81</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER CREATION MODAL WITH AVATAR UPLOAD */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-750">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Créer un Nouvel Utilisateur / Agent
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enregistrement sécurisé Cloud Firestore avec photo compressée.
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

            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Photo de Profil & Avatar de Traçabilité
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Aperçu avatar"
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Importer une photo</span>
                      </button>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ou choisir un preset :</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {AVATAR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarPreview(p);
                            setNewAvatar(p);
                          }}
                          className={`h-8 w-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            avatarPreview === p
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={p} alt="Preset avatar" className="h-full w-full object-cover" />
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
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rôle / Attribution <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AgentRole)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Administrateur Principal">Administrateur Principal</option>
                    <option value="Agent de Caisse">Agent de Caisse</option>
                    <option value="Responsable Inscriptions">Responsable Inscriptions</option>
                    <option value="Responsable Pédagogique">Responsable Pédagogique</option>
                    <option value="Secrétaire d'Accueil">Secrétaire d'Accueil</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  {isCreatingUser ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  <span>{isCreatingUser ? 'Enregistrement Firestore...' : "Enregistrer l'Utilisateur"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
