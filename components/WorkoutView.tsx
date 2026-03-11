// WorkoutView.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Play, Check, X, Info, Save, RefreshCw, Loader2, Trash2, Clock, ChevronRight, FileDown
} from 'lucide-react';
import { WeeklyPlan, Exercise, WorkoutSession, UserProfile, DayPlan } from '../types';
import { fetchExerciseData, swapExercise, calcSessionTime, recalculatePlanAfterModification } from '../services/aiService';

interface Props {
  currentPlan: WeeklyPlan | null;
  profile: UserProfile | null;
  completedSessions: Record<string, boolean>;
  onWorkoutComplete: (session: WorkoutSession) => void;
  onUpdatePlan: (plan: WeeklyPlan) => void;
}

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

interface PlayerState {
  queue: Exercise[];
  originalQueue: Exercise[];
  currentIndex: number;
  skippedIds: Set<string>;
  isFinished: boolean;
  sessionIndex: number;
  dayIndex: number;
}

export const WorkoutView: React.FC<Props> = ({
  currentPlan, profile, completedSessions, onWorkoutComplete, onUpdatePlan
}) => {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [showDetail, setShowDetail] = useState<Exercise | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const timePerSession = profile?.availability?.timePerSession || profile?.availability?.maxSessionTime || 60;

  // ─── Dados do dia ──────────────────────────────────────────────────────
  const dayData = useMemo<DayPlan | null>(() => {
    return currentPlan?.weeklyPlan?.[selectedDayIndex] || null;
  }, [currentPlan, selectedDayIndex]);

  const sessions = useMemo<Exercise[][]>(() => {
    if (!dayData) return [];
    if (dayData.sessions && dayData.sessions.length > 0) {
      return dayData.sessions.filter(s => s && s.length > 0);
    }
    if (dayData.workout && dayData.workout.length > 0) {
      return [dayData.workout];
    }
    return [];
  }, [dayData]);

  // ─── Timer de execução ─────────────────────────────────────────────────
  useEffect(() => {
    if (!playerState || playerState.isFinished) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [playerState?.isFinished]);

  // ─── Timer de descanso ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isResting) return;
    setRestTimer(40);
    const interval = setInterval(() => {
      setRestTimer(t => {
        if (t <= 1) { setIsResting(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  // ─── Após descanso: avançar fila ──────────────────────────────────────
  const advanceQueue = useCallback(() => {
    if (!playerState) return;
    const nextIndex = playerState.currentIndex + 1;
    if (nextIndex >= playerState.queue.length) {
      setPlayerState(prev => prev ? { ...prev, isFinished: true } : null);
    } else {
      setPlayerState(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
    }
  }, [playerState]);

  useEffect(() => {
    if (!isResting && playerState && !playerState.isFinished) {
      advanceQueue();
    }
  }, [isResting]);

  // ─── Iniciar player ────────────────────────────────────────────────────
  const startPlayer = (sessionIdx: number = 0) => {
    const session = sessions[sessionIdx] || [];
    const valid = session.filter(ex => ex && ex.name);
    if (valid.length === 0) return;
    setPlayerState({
      queue: [...valid],
      originalQueue: [...valid],
      currentIndex: 0,
      skippedIds: new Set(),
      isFinished: false,
      sessionIndex: sessionIdx,
      dayIndex: selectedDayIndex
    });
    setTimer(0);
    setIsResting(false);
  };

  // ─── Concluir exercício → descanso ─────────────────────────────────────
  const completeCurrentExercise = () => {
    if (!playerState) return;
    setIsResting(true);
  };

  // ─── Pular: vai para o final da fila ──────────────────────────────────
  const skipExercise = () => {
    if (!playerState) return;
    const current = playerState.queue[playerState.currentIndex];
    if (!current) return;
    const newQueue = [...playerState.queue];
    newQueue.splice(playerState.currentIndex, 1);
    newQueue.push(current);
    setPlayerState({
      ...playerState,
      queue: newQueue,
      skippedIds: new Set([...playerState.skippedIds, current.id]),
      currentIndex: playerState.currentIndex % newQueue.length
    });
  };

  // ─── Finalizar sessão ──────────────────────────────────────────────────
  const finishSession = () => {
    if (!playerState) return;
    const completedCount = playerState.currentIndex;
    const caloriesBurned = completedCount * 55;
    const session: WorkoutSession = {
      date: new Date().toISOString(),
      duration: timer,
      completedExercises: completedCount,
      totalFatLostGrams: Math.round(caloriesBurned / 7.7),
      caloriesBurned,
      dayIndex: playerState.dayIndex,
      sessionIndex: playerState.sessionIndex
    };
    onWorkoutComplete(session);
    setPlayerState(null);
    setTimer(0);
    setIsResting(false);
  };

  // ─── Detalhes do exercício ────────────────────────────────────────────
  const loadExerciseDetail = async (ex: Exercise) => {
    setLoadingDetail(true);
    setShowDetail(ex);
    const data = await fetchExerciseData(ex.name);
    setShowDetail(prev => prev ? { ...prev, ...data } : null);
    setLoadingDetail(false);
  };

  // ─── Trocar exercício ─────────────────────────────────────────────────
  const handleSwapExercise = async (dayIdx: number, exId: string) => {
    if (!currentPlan || !profile) return;
    setLoadingSwap(exId);
    const exercise = currentPlan.weeklyPlan[dayIdx].workout.find(e => e.id === exId);
    if (!exercise) { setLoadingSwap(null); return; }
    const newEx = await swapExercise(exercise, profile);
    const newPlan = JSON.parse(JSON.stringify(currentPlan)) as WeeklyPlan;
    const idx = newPlan.weeklyPlan[dayIdx].workout.findIndex(e => e.id === exId);
    if (idx !== -1) newPlan.weeklyPlan[dayIdx].workout[idx] = newEx;
    const updated = await recalculatePlanAfterModification(newPlan, profile);
    onUpdatePlan(updated);
    setLoadingSwap(null);
  };

  // ─── Remover exercício ────────────────────────────────────────────────
  const removeExercise = async (dayIdx: number, exId: string) => {
    if (!currentPlan || !profile) return;
    const newPlan = JSON.parse(JSON.stringify(currentPlan)) as WeeklyPlan;
    newPlan.weeklyPlan[dayIdx].workout = newPlan.weeklyPlan[dayIdx].workout.filter(e => e.id !== exId);
    const updated = await recalculatePlanAfterModification(newPlan, profile);
    onUpdatePlan(updated);
  };

  // TÓPICO 8: Exportar PDF do plano de treino
  const exportPDF = () => {
    if (!currentPlan) return;
    const lines: string[] = [];
    lines.push('PLANO DE TREINO SEMANAL — PULSY AI');
    lines.push('='.repeat(50));
    if (profile) {
      lines.push(`Atleta: ${profile.name}  |  Nível: ${profile.fitnessLevel}  |  Sessão máx: ${profile.availability?.timePerSession || 60} min`);
    }
    lines.push('');
    const DAYS_LABEL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    currentPlan.weeklyPlan.forEach((day, i) => {
      lines.push(`DIA: ${DAYS_LABEL[i] || day.day}`);
      lines.push('-'.repeat(40));
      const daySessions = day.sessions && day.sessions.length > 0 ? day.sessions : (day.workout?.length > 0 ? [day.workout] : []);
      if (daySessions.length === 0) {
        lines.push('  Descanso');
      } else {
        daySessions.forEach((session, sIdx) => {
          if (daySessions.length > 1) lines.push(`  -- Sessão ${sIdx + 1} --`);
          session.forEach((ex, eIdx) => {
            lines.push(`  ${eIdx + 1}. ${ex.name}`);
            lines.push(`     ${ex.sets}x séries  |  ${ex.reps} reps  |  Descanso: ${ex.rest}`);
            if (ex.muscleGroup) lines.push(`     Músculo: ${ex.muscleGroup}`);
          });
          lines.push(`  Tempo estimado: ~${Math.round(calcSessionTime(session))} min`);
        });
      }
      lines.push('');
    });
    lines.push('Gerado por Pulsy AI — Inteligência Fitness');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano-treino-pulsy.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const savePlan = () => {
    if (!currentPlan) return;
    setIsSaving(true);
    onUpdatePlan({ ...currentPlan });
    setTimeout(() => setIsSaving(false), 1500);
  };

  const sessionTimeStr = (exList: Exercise[]) => `~${Math.round(calcSessionTime(exList))} min`;

  const isSessionDone = (dayIdx: number, sessionIdx: number) =>
    !!completedSessions[`${dayIdx}-${sessionIdx}`];

  const timeWarning = (exList: Exercise[]) => calcSessionTime(exList) > timePerSession + 5;

  return (
    <div className="space-y-8 overflow-y-auto pb-20">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-400">Treinamento</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} title="Exportar PDF"
            className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-all"
          >
            <FileDown size={18} className="text-blue-400" />
          </button>
          <button onClick={savePlan}
            className="bg-emerald-400 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-400/20 text-sm">
            {isSaving ? <Check size={16} /> : <Save size={16} />}
            {isSaving ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Info de tempo */}
      {profile && (
        <div className="flex items-center gap-3 bg-emerald-400/5 border border-emerald-400/20 rounded-2xl px-5 py-3">
          <Clock size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-400 font-bold">
            Sessão máx: <strong>{timePerSession} min</strong> · 
            Sessões/dia: <strong>{profile.availability?.frequencyPerDay || 1}</strong> · 
            Mín. exercícios: <strong>{profile.availability?.minExercisesPerSession || profile.availability?.minExercisesPerDay || 4}</strong>
          </span>
        </div>
      )}

      {/* Toggle */}
      <div className="flex gap-3">
        {(['daily', 'weekly'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-5 py-2.5 rounded-full font-black uppercase text-xs transition-all ${
              view === v ? 'bg-emerald-400 text-black' : 'bg-neutral-900/40 text-gray-400'
            }`}>
            {v === 'daily' ? 'Diário' : 'Semanal'}
          </button>
        ))}
      </div>

      {/* Seletor de dia */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {DAYS.map((day, idx) => {
          const hasSessions = (currentPlan?.weeklyPlan?.[idx]?.workout?.length || 0) > 0;
          const done = isSessionDone(idx, 0);
          return (
            <button key={day} onClick={() => setSelectedDayIndex(idx)}
              className={`relative px-5 py-2.5 rounded-full font-black uppercase text-xs whitespace-nowrap flex-shrink-0 transition-all ${
                selectedDayIndex === idx ? 'bg-emerald-400 text-black'
                  : hasSessions ? 'bg-neutral-900/60 text-white border border-white/10'
                  : 'bg-neutral-900/30 text-gray-600'
              }`}>
              {day}
              {done && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Check size={10} className="text-black" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visualização diária */}
      {view === 'daily' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="bg-neutral-900/40 p-10 rounded-3xl border border-white/5 text-center">
              <p className="text-gray-500 font-bold text-lg">Dia de descanso 🧘</p>
              <p className="text-gray-600 text-sm mt-2">Aproveite para recuperar e se hidratar!</p>
            </div>
          ) : (
            sessions.map((session, sIdx) => (
              <div key={sIdx} className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 space-y-5">
                {sessions.length > 1 && (
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase text-sm text-emerald-400 tracking-widest">
                      Sessão {sIdx + 1}
                    </h3>
                    {isSessionDone(selectedDayIndex, sIdx) && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                        <Check size={14} /> Concluída
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {session.map((ex, idx) => (
                    <div key={`s${sIdx}-e${idx}-${ex.id}`} className="bg-black/30 p-5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                      <div className="w-9 h-9 bg-emerald-400/10 rounded-full flex items-center justify-center text-emerald-400 font-black text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base leading-tight truncate">{ex.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {ex.sets}× {ex.reps} · descanso {ex.rest}
                        </p>
                        {ex.muscleGroup && (
                          <span className="text-[10px] text-emerald-400/60 font-bold uppercase">{ex.muscleGroup}</span>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => loadExerciseDetail(ex)}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all" title="Detalhes">
                          <Info size={15} />
                        </button>
                        <button onClick={() => handleSwapExercise(selectedDayIndex, ex.id)}
                          className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl hover:bg-yellow-500/20 transition-all" title="Trocar"
                          disabled={loadingSwap === ex.id}>
                          {loadingSwap === ex.id ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                        </button>
                        <button onClick={() => removeExercise(selectedDayIndex, ex.id)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all" title="Remover">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tempo estimado */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                  <Clock size={12} />
                  Tempo estimado: {sessionTimeStr(session)}
                  {timeWarning(session) && (
                    <span className="text-yellow-400 ml-2">⚠ Excede o limite do perfil (+5 min tolerância)</span>
                  )}
                </div>

                {/* Botão iniciar */}
                {!isSessionDone(selectedDayIndex, sIdx) ? (
                  <button onClick={() => startPlayer(sIdx)}
                    className="w-full py-4 bg-emerald-400 text-black rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition-all active:scale-95">
                    <Play size={18} /> Iniciar Sessão {sessions.length > 1 ? sIdx + 1 : ''}
                  </button>
                ) : (
                  <div className="w-full py-4 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Check size={18} /> Sessão Concluída
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Visualização semanal */}
      {view === 'weekly' && (
        <div className="space-y-4">
          {currentPlan?.weeklyPlan?.map((day, idx) => (
            <div key={idx}
              onClick={() => { setSelectedDayIndex(idx); setView('daily'); }}
              className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 cursor-pointer hover:border-emerald-400/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-black uppercase tracking-wide group-hover:text-emerald-400 transition-colors">{day.day}</h3>
                <div className="flex items-center gap-2">
                  {day.workout?.length > 0 ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                      {day.workout.length} exerc. · {sessionTimeStr(day.workout)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-600 bg-white/5 px-3 py-1 rounded-full">Descanso</span>
                  )}
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              {day.workout?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {day.workout.slice(0, 4).map((ex, eIdx) => (
                    <span key={`w${idx}-e${eIdx}-${ex.id}`} className="text-[10px] font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full uppercase">
                      {ex.name}
                    </span>
                  ))}
                  {day.workout.length > 4 && (
                    <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-3 py-1 rounded-full">
                      +{day.workout.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── PLAYER ──────────────────────────────────────────────────────── */}
      {playerState && (
        <div className="fixed inset-0 bg-black/97 z-50 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col p-6 gap-6 max-w-lg mx-auto w-full">
            {/* Timer */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-5xl font-black tabular-nums">
                {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-bold uppercase">Exercício</p>
                <p className="text-lg font-black text-emerald-400">
                  {playerState.isFinished ? '✓' : `${playerState.currentIndex + 1}/${playerState.queue.length}`}
                </p>
              </div>
            </div>

            {/* Descanso */}
            {isResting && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-yellow-400/5 border border-yellow-400/20 rounded-3xl p-8">
                <p className="text-2xl font-black text-yellow-400 uppercase tracking-widest">⏱ Descanso</p>
                <div className="text-7xl font-black tabular-nums text-yellow-400">{restTimer}s</div>
                <button onClick={() => setIsResting(false)}
                  className="px-8 py-4 bg-emerald-400 text-black rounded-full font-black uppercase tracking-widest hover:bg-emerald-300 transition-all">
                  Pular Descanso
                </button>
              </div>
            )}

            {/* Exercício atual */}
            {!isResting && !playerState.isFinished && (
              <div className="flex-1 space-y-6">
                <div className="bg-neutral-900/60 p-8 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-3xl font-black uppercase leading-tight">
                    {playerState.queue[playerState.currentIndex]?.name}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: 'Séries',   val: playerState.queue[playerState.currentIndex]?.sets || 3 },
                      { label: 'Reps',     val: playerState.queue[playerState.currentIndex]?.reps || '10-12' },
                      { label: 'Descanso', val: playerState.queue[playerState.currentIndex]?.rest || '40s' }
                    ].map(item => (
                      <div key={item.label} className="bg-black/40 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-600 uppercase mb-1">{item.label}</p>
                        <p className="text-2xl font-black text-emerald-400">{item.val}</p>
                      </div>
                    ))}
                  </div>
                  {playerState.queue[playerState.currentIndex]?.instructions && (
                    <p className="text-sm text-gray-400 leading-relaxed italic">
                      {playerState.queue[playerState.currentIndex]?.instructions}
                    </p>
                  )}
                </div>

                {playerState.skippedIds.size > 0 && (
                  <div className="bg-yellow-400/5 border border-yellow-400/20 p-4 rounded-2xl">
                    <p className="text-xs font-black text-yellow-400 uppercase mb-2">
                      Exercícios para retomar: {playerState.skippedIds.size}
                    </p>
                    {playerState.queue.filter(ex => playerState.skippedIds.has(ex.id)).map(ex => (
                      <p key={ex.id} className="text-xs text-gray-500">{ex.name}</p>
                    ))}
                  </div>
                )}

                <button onClick={completeCurrentExercise}
                  className="w-full py-5 bg-emerald-400 text-black rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition-all active:scale-95 text-sm">
                  <Check size={18} /> Concluir Exercício
                </button>
                <button onClick={skipExercise}
                  className="w-full py-4 bg-yellow-400/10 text-yellow-400 rounded-full font-black uppercase tracking-widest hover:bg-yellow-400/20 transition-all text-sm">
                  Pular → Volta no Final
                </button>
              </div>
            )}

            {/* Sessão concluída */}
            {playerState.isFinished && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 bg-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <Check size={40} className="text-black" />
                </div>
                <p className="text-3xl font-black text-emerald-400 uppercase tracking-tight">Sessão Completa!</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-neutral-900/60 p-5 rounded-2xl text-center">
                    <p className="text-[10px] text-gray-600 font-black uppercase">Duração</p>
                    <p className="text-2xl font-black">{Math.floor(timer / 60)}min {timer % 60}s</p>
                  </div>
                  <div className="bg-neutral-900/60 p-5 rounded-2xl text-center">
                    <p className="text-[10px] text-gray-600 font-black uppercase">Exercícios</p>
                    <p className="text-2xl font-black">{playerState.currentIndex}</p>
                  </div>
                </div>
                <button onClick={finishSession}
                  className="w-full py-5 bg-emerald-400 text-black rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition-all active:scale-95">
                  Registrar & Fechar
                </button>
              </div>
            )}

            {!playerState.isFinished && (
              <button onClick={finishSession}
                className="w-full py-4 bg-red-400/10 text-red-400 rounded-full font-black uppercase tracking-widest hover:bg-red-400/20 transition-all text-sm">
                Finalizar Sessão Agora
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL DETALHES ──────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-6 overflow-y-auto">
          <button onClick={() => setShowDetail(null)} className="self-end p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all mb-4">
            <X size={22} />
          </button>
          <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-tight mb-2">{showDetail.name}</h2>
          {showDetail.muscleGroup && (
            <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-4">{showDetail.muscleGroup}</p>
          )}
          {loadingDetail ? (
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 size={18} className="animate-spin" /> Carregando detalhes...
            </div>
          ) : (
            <div className="space-y-5">
              {showDetail.description && (
                <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Descrição</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{showDetail.description}</p>
                </div>
              )}
              {showDetail.instructions && (
                <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Execução</p>
                  <div className="space-y-2">
                    {showDetail.instructions.split('\n').map((line, i) => (
                      <p key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-emerald-400 flex-shrink-0">•</span> {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Kcal Est.</p>
                  <p className="text-2xl font-black text-orange-400">{showDetail.kcalEstimate || '—'}</p>
                </div>
                <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Dificuldade</p>
                  <p className="text-2xl font-black text-blue-400">{showDetail.difficulty || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
