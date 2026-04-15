// App.tsx — Pulsy AI · multi-usuário + API key + progresso de geração
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dashboard }      from './components/Dashboard';
import { WorkoutView }    from './components/WorkoutView';
import { NutritionView }  from './components/NutritionView';
import { ProfileSetup }   from './components/ProfileSetup';
import { ProfileView }    from './components/ProfileView';
import { ReferencesView } from './components/ReferencesView';
import { ProgressView }   from './components/ProgressView';
import { LibraryView }    from './components/LibraryView';
import { NAVIGATION_ITEMS, DEFAULT_PLAN } from './constants';
import { AppState, UserProfile, WeeklyPlan, WorkoutSession } from './types';
import { generatePlan, saveGroqKey, hasGroqKey, clearPlanCache, getKey } from './services/aiService';
import {
  Bell, Search, Loader2, RefreshCw, Users, Plus, X, KeyRound, Check
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface UserEntry {
  id: string;
  name: string;
  avatarLetter: string;
}

// ─── Storage helpers ────────────────────────────────────────────────────────────
const USERS_KEY  = 'pulsy_users';
const ACTIVE_KEY = 'pulsy_active_user';

function stateKey(id: string) { return `pulsy_state_${id}`; }
function loadUsers(): UserEntry[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(u: UserEntry[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function loadActiveId(): string | null { return localStorage.getItem(ACTIVE_KEY); }
function saveActiveId(id: string) { localStorage.setItem(ACTIVE_KEY, id); }
function loadUserState(userId: string): AppState {
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (raw) {
      const p = JSON.parse(raw);
      if (!p.completedSessions) p.completedSessions = {};
      if (!p.history) p.history = [];
      return p;
    }
  } catch { /* ignore */ }
  return { profile: null, currentPlan: DEFAULT_PLAN as WeeklyPlan, history: [], onboardingComplete: false, completedSessions: {} };
}
function saveUserState(userId: string, state: AppState) {
  localStorage.setItem(stateKey(userId), JSON.stringify(state));
}

// ─── App ────────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [users,    setUsers]    = useState<UserEntry[]>(() => loadUsers());
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = loadActiveId();
    const list  = loadUsers();
    if (saved && list.find(u => u.id === saved)) return saved;
    if (list.length > 0) return list[0].id;
    return '';
  });

  const [state, setState] = useState<AppState>(() =>
    activeId ? loadUserState(activeId) : {
      profile: null, currentPlan: DEFAULT_PLAN as WeeklyPlan,
      history: [], onboardingComplete: false, completedSessions: {}
    }
  );

  const [activeTab,     setActiveTab]     = useState('dashboard');
  const [isSyncing,     setIsSyncing]     = useState(false);
  const [syncError,     setSyncError]     = useState<string | null>(null);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [syncMsg,       setSyncMsg]       = useState('Gerando plano…');

  // Menu usuários
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [newUserName,  setNewUserName]  = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Modal API key
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput,  setApiKeyInput]  = useState('');
  const [apiKeySaved,  setApiKeySaved]  = useState(false);
  const [hasKey,       setHasKey]       = useState(() => hasGroqKey());

  // Persistência automática
  useEffect(() => {
    if (activeId) saveUserState(activeId, state);
  }, [state, activeId]);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ─── Trocar usuário ────────────────────────────────────────────────────────
  const switchUser = useCallback((userId: string) => {
    if (activeId) saveUserState(activeId, state);
    const ns = loadUserState(userId);
    setActiveId(userId);
    saveActiveId(userId);
    setState(ns);
    setPlanGenerated(!!ns.currentPlan && ns.onboardingComplete);
    setSyncError(null);
    setActiveTab('dashboard');
    setShowUserMenu(false);
  }, [activeId, state]);

  const createUser = () => {
    const name = newUserName.trim();
    if (!name) return;
    const id     = `user-${Date.now()}`;
    const letter = name[0].toUpperCase();
    const updated = [...users, { id, name, avatarLetter: letter }];
    setUsers(updated);
    saveUsers(updated);
    setNewUserName('');
    switchUser(id);
  };

  const removeUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    localStorage.removeItem(stateKey(userId));
    clearPlanCache(userId);
    if (userId === activeId) {
      if (updated.length > 0) switchUser(updated[0].id);
      else {
        setActiveId('');
        setState({ profile: null, currentPlan: DEFAULT_PLAN as WeeklyPlan, history: [], onboardingComplete: false, completedSessions: {} });
        setPlanGenerated(false);
      }
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handlePlanUpdate = useCallback((plan: WeeklyPlan) => {
    setState(prev => ({ ...prev, currentPlan: { ...plan } }));
  }, []);

  const handleWorkoutComplete = useCallback((session: WorkoutSession) => {
    setState(prev => {
      const key = `${session.dayIndex ?? ''}-${session.sessionIndex ?? 0}`;
      return { ...prev, history: [...prev.history, session], completedSessions: { ...(prev.completedSessions || {}), [key]: true } };
    });
  }, []);

  const handleProfileUpdate = useCallback((profile: UserProfile) => {
    setUsers(prev => {
      const updated = prev.map(u =>
        u.id === activeId ? { ...u, name: profile.name, avatarLetter: profile.name[0]?.toUpperCase() || 'U' } : u
      );
      if (!updated.find(u => u.id === activeId) && activeId)
        updated.push({ id: activeId, name: profile.name, avatarLetter: profile.name[0]?.toUpperCase() || 'U' });
      saveUsers(updated);
      return updated;
    });
    setState(prev => ({ ...prev, profile, onboardingComplete: true }));
    setPlanGenerated(false);
  }, [activeId]);

  // ─── Gerar plano ──────────────────────────────────────────────────────────
  const syncPlanWithAI = useCallback(async (profile: UserProfile, force = false) => {
    if (isSyncing) return;
    // Verificação opcional: se NÃO tiver chave em env nem localStorage, mostra modal como fallback
  const currentKey = getKey();  // chama a função que você já atualizou
  if (!currentKey) {
    setSyncError('Nenhuma chave GROQ encontrada. Configure clicando em ⚙ no cabeçalho ou adicione no Vercel.');
    setShowApiModal(true);
    return;
  }

    setIsSyncing(true);
    setSyncError(null);

    // Mensagens de progresso (troca a cada ~5s simulando o progresso real)
    const msgs = [
      'Analisando seu perfil e objetivos…',
      'Gerando treino de Segunda + nutrição…',
      'Gerando treino de Terça + nutrição…',
      'Gerando treino de Quarta + nutrição…',
      'Gerando treino de Quinta + nutrição…',
      'Gerando treino de Sexta + nutrição…',
      'Gerando Sábado e Domingo + nutrição…',
      'Finalizando e salvando seu plano…',
    ];
    let mi = 0;
    setSyncMsg(msgs[0]);
    const ticker = setInterval(() => {
      mi = Math.min(mi + 1, msgs.length - 1);
      setSyncMsg(msgs[mi]);
    }, 5000);

    try {
      const plan = await generatePlan(profile, activeId || 'default', force);
      handlePlanUpdate(plan);
      setPlanGenerated(true);
    } catch (err: any) {
      console.error('[Pulsy] Erro ao gerar plano:', err);
      setSyncError(err.message || 'Falha na geração do plano.');
      handlePlanUpdate(DEFAULT_PLAN as WeeklyPlan);
    } finally {
      clearInterval(ticker);
      setIsSyncing(false);
    }
  }, [isSyncing, handlePlanUpdate, activeId]);

  useEffect(() => {
    if (state.profile && !planGenerated && !isSyncing) {
      syncPlanWithAI(state.profile);
    }
  }, [state.profile, planGenerated, isSyncing, syncPlanWithAI]);

  // ─── Salvar API key ────────────────────────────────────────────────────────
  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    saveGroqKey(apiKeyInput.trim());
    setHasKey(true);
    setApiKeySaved(true);
    setTimeout(() => {
      setApiKeySaved(false);
      setShowApiModal(false);
      if (state.profile && !planGenerated) syncPlanWithAI(state.profile);
    }, 1200);
  };

  const activeUser   = users.find(u => u.id === activeId);
  const avatarLetter = activeUser?.avatarLetter || state.profile?.name?.[0]?.toUpperCase() || 'P';

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="flex flex-col h-screen overflow-hidden">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 p-3 md:p-4 border-b border-white/5 flex items-center gap-2 md:gap-4 bg-neutral-950/95 backdrop-blur-3xl z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-emerald-400 flex-shrink-0">Pulsy</h1>

          {/* Barra de busca — esconde no mobile para não comprimir botões */}
          <div className="hidden md:flex flex-1 relative">
            <input
              className="w-full bg-neutral-900/40 border border-white/5 rounded-full px-6 py-3 text-sm italic placeholder:text-gray-600 focus:border-emerald-400/30 outline-none shadow-inner"
              placeholder="Pesquisar biomarcadores..."
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          </div>

          {/* Espaço flexível no mobile para empurrar botões à direita */}
          <div className="flex-1 md:hidden" />

          {/* Regenerar plano */}
          {state.onboardingComplete && (
            <button
              onClick={() => state.profile && syncPlanWithAI(state.profile, true)}
              disabled={isSyncing}
              title="Regenerar plano"
              className="p-2 md:p-3 bg-emerald-400/10 rounded-full border border-emerald-400/20 hover:bg-emerald-400/20 transition-all disabled:opacity-40 flex-shrink-0"
            >
              <RefreshCw size={16} className={`text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* API Key */}
          <button
            onClick={() => setShowApiModal(true)}
            title="Configurar GROQ API Key"
            className={`p-2 md:p-3 rounded-full border transition-all flex-shrink-0 ${
              hasKey
                ? 'bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20'
                : 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30 animate-pulse'
            }`}
          >
            <KeyRound size={16} className={hasKey ? 'text-emerald-400' : 'text-red-400'} />
          </button>

          {/* Sino — esconde no mobile */}
          <button className="hidden md:flex p-3 bg-neutral-900/40 rounded-full border border-white/5 hover:border-emerald-400/30 transition-all flex-shrink-0">
            <Bell size={18} className="text-gray-400" />
          </button>

          {/* Avatar / usuários */}
          <div className="relative flex-shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center font-black text-black text-sm shadow-lg hover:scale-105 transition-all"
              title="Gerenciar usuários"
            >
              {avatarLetter}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-14 w-72 bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Usuários Cadastrados
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {users.map(u => (
                    <div key={u.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all ${u.id === activeId ? 'bg-emerald-400/10' : ''}`}>
                      <div onClick={() => switchUser(u.id)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${u.id === activeId ? 'bg-emerald-400 text-black' : 'bg-neutral-700 text-white'}`}>
                          {u.avatarLetter}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate">{u.name}</p>
                          {u.id === activeId && <p className="text-[10px] text-emerald-400 font-bold">Ativo</p>}
                        </div>
                      </div>
                      {u.id !== activeId && (
                        <button onClick={() => removeUser(u.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-all flex-shrink-0" title="Remover">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-gray-600 text-xs text-center py-4">Nenhum usuário ainda</p>}
                </div>
                <div className="p-4 border-t border-white/5 space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Novo Usuário</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 placeholder:text-gray-600"
                      placeholder="Nome do usuário..."
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createUser()}
                    />
                    <button onClick={createUser} disabled={!newUserName.trim()} className="p-2 bg-emerald-400 text-black rounded-xl font-black disabled:opacity-40 hover:bg-emerald-300 transition-all">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ─── Modal API Key ────────────────────────────────────────────────── */}
        {showApiModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center">
                  <KeyRound size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black italic uppercase">GROQ API Key</h2>
                  <p className="text-gray-500 text-xs">Necessária para gerar planos com IA</p>
                </div>
                <button onClick={() => setShowApiModal(false)} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Chave gratuita em{' '}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline">
                    console.groq.com/keys
                  </a>
                </p>
                <input
                  type="password"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 placeholder:text-gray-600"
                  placeholder="gsk_..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
                />
                {hasKey && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Check size={14} /> Chave configurada. Insira uma nova para substituir.
                  </div>
                )}
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="w-full py-3 bg-emerald-400 text-black font-black rounded-2xl disabled:opacity-40 hover:bg-emerald-300 transition-all"
                >
                  {apiKeySaved ? '✓ Salvo!' : 'Salvar Chave'}
                </button>
                <p className="text-[11px] text-gray-600 text-center">
                  A chave fica salva localmente no seu navegador
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Onboarding ou App ───────────────────────────────────────────── */}
        {(!state.onboardingComplete || !state.profile) ? (
          <div className="flex-1 overflow-y-auto">
            <ProfileSetup onComplete={handleProfileUpdate} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

            {/* Sidebar — desktop only */}
            <nav className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 flex-shrink-0 space-y-4 bg-neutral-950/95 backdrop-blur-3xl overflow-y-auto">
              {NAVIGATION_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    activeTab === item.id
                      ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] font-black'
                      : 'hover:bg-neutral-900/40 text-gray-400 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-black uppercase text-sm tracking-widest">{item.label}</span>
                </button>
              ))}
              <div className="mt-auto pt-8">
                <div className="bg-emerald-400/10 p-6 rounded-3xl text-emerald-400 font-black italic uppercase text-xs leading-tight">
                  Pulsy Intelligence
                  <p className="text-[9px] opacity-70 mt-2 normal-case not-italic font-medium">
                    Planos baseados em protocolos ACSM*
                  </p>
                </div>
              </div>
            </nav>

            {/* Conteúdo principal — scroll independente, padding bottom para não ficar atrás da nav mobile */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 pb-28 md:pb-6">

              {users.length > 1 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-2 mb-4 flex items-center gap-2">
                  <Users size={14} className="text-blue-400" />
                  <span className="text-xs text-blue-400 font-bold">
                    Usuário ativo: <strong>{activeUser?.name || state.profile.name}</strong>
                  </span>
                  <button onClick={() => setShowUserMenu(true)} className="ml-auto text-[10px] font-black text-blue-400 hover:text-white uppercase">
                    Trocar →
                  </button>
                </div>
              )}

              {/* Banner de geração com progresso */}
              {isSyncing && (
                <div className="bg-emerald-400/10 border border-emerald-400/20 p-5 rounded-2xl mb-4">
                  <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm mb-3">
                    <Loader2 size={18} className="animate-spin flex-shrink-0" />
                    <span>{syncMsg}</span>
                  </div>
                  {/* Barra de progresso animada */}
                  <div className="w-full bg-emerald-400/10 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">
                    Treino e nutrição gerados separadamente para garantir JSON completo. Aguarde ~60s…
                  </p>
                </div>
              )}

              {syncError && (
                <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl mb-4 text-red-300 text-sm font-medium flex items-center gap-3">
                  <span className="text-red-400 text-lg">⚠</span>
                  <span className="flex-1">{syncError}</span>
                  <button
                    onClick={() => state.profile && syncPlanWithAI(state.profile, true)}
                    className="bg-red-500/20 hover:bg-red-500/40 px-4 py-2 rounded-lg font-black uppercase text-xs flex-shrink-0"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {activeTab === 'dashboard'  && <Dashboard    currentPlan={state.currentPlan} profile={state.profile} history={state.history} />}
              {activeTab === 'workout'    && <WorkoutView  currentPlan={state.currentPlan} profile={state.profile} completedSessions={state.completedSessions||{}} onWorkoutComplete={handleWorkoutComplete} onUpdatePlan={handlePlanUpdate} />}
              {activeTab === 'nutrition'  && <NutritionView profile={state.profile} currentPlan={state.currentPlan} onUpdatePlan={handlePlanUpdate} />}
              {activeTab === 'library'    && <LibraryView />}
              {activeTab === 'references' && <ReferencesView currentPlan={state.currentPlan} />}
              {activeTab === 'progress'   && <ProgressView  history={state.history} profile={state.profile} currentPlan={state.currentPlan} />}
              {activeTab === 'profile'    && state.profile && <ProfileView profile={state.profile} onUpdate={handleProfileUpdate} />}

              </div>{/* fim padding div */}
            </div>{/* fim scroll div */}
          </div>{/* fim flex row */}
        )}

        {/* Nav mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around p-5 bg-neutral-950/95 backdrop-blur-3xl border-t border-white/5 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50">
          {NAVIGATION_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-2 transition-all duration-500 relative ${
                activeTab === item.id ? 'text-emerald-400 scale-110 -translate-y-2' : 'text-gray-700'
              }`}
            >
              <div className={`transition-all duration-500 ${activeTab === item.id ? 'bg-emerald-400/10 p-3 rounded-2xl' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {activeTab === item.id && <div className="absolute -top-3 w-1 h-1 bg-emerald-400 rounded-full" />}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
