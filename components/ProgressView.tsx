// ProgressView.tsx
import React, { useMemo } from 'react';
import { WorkoutSession, UserProfile, WeeklyPlan } from '../types';
import { TrendingUp, Activity, Flame, Clock, Calendar, Zap, Target, Check, AlertTriangle, BarChart2 } from 'lucide-react';
import { analyzeProgression } from '../services/aiService';

interface Props {
  history: WorkoutSession[];
  profile?: UserProfile | null;
  currentPlan?: WeeklyPlan | null;
}

export const ProgressView: React.FC<Props> = ({ history, profile, currentPlan }) => {

  // ─── Totais ────────────────────────────────────────────────────────────
  const totals = useMemo(() => history.reduce((acc, s) => ({
    sessions: acc.sessions + 1,
    duration: acc.duration + s.duration,
    lostFat:  acc.lostFat  + (s.totalFatLostGrams || 0) / 1000,
    calories: acc.calories + (s.caloriesBurned || Math.round(s.duration / 60 * 5))
  }), { sessions: 0, duration: 0, lostFat: 0, calories: 0 }), [history]);

  // ─── Dados por semana (últimas 4) ──────────────────────────────────────
  const weeklyData = useMemo(() => {
    const weeks: { label: string; count: number; minutes: number; kcal: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      const end   = Date.now() - w * 7 * 24 * 60 * 60 * 1000;
      const sessions = history.filter(s => {
        const t = new Date(s.date).getTime();
        return t >= start && t < end;
      });
      weeks.push({
        label: w === 0 ? 'Esta semana' : `${w}s atrás`,
        count: sessions.length,
        minutes: Math.round(sessions.reduce((sum, s) => sum + s.duration / 60, 0)),
        kcal: sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0)
      });
    }
    return weeks;
  }, [history]);

  const maxCount = Math.max(...weeklyData.map(w => w.count), 1);

  // ─── Progresso rumo à meta ─────────────────────────────────────────────
  const goalProgress = useMemo(() => {
    if (!profile?.targetWeight || !profile?.weight) return null;
    const start  = profile.weight;
    const target = profile.targetWeight;
    const deficit = totals.lostFat * 0.85;
    const current = target < start ? start - deficit : start + (deficit * 0.5);
    const total = Math.abs(target - start);
    if (total === 0) return null;
    const done  = Math.min(Math.abs(current - start), total);
    const pct   = Math.round((done / total) * 100);
    return {
      pct: Math.min(pct, 100),
      start,
      current: parseFloat(current.toFixed(1)),
      target,
      remaining: Math.max(0, Math.abs(target - current)).toFixed(1),
      goalType: profile?.structuredGoals?.[0]?.type || 'Meta',
      goalDesc: profile?.structuredGoals?.[0]?.description || ''
    };
  }, [profile, totals.lostFat]);

  // ─── Planejado vs realizado (dias da semana atual) ─────────────────────
  const plannedDays = useMemo(() => {
    if (!currentPlan) return 0;
    return currentPlan.weeklyPlan.filter(d => d.workout?.length > 0).length;
  }, [currentPlan]);

  const adherenceThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return history.filter(s => new Date(s.date).getTime() > oneWeekAgo).length;
  }, [history]);

  const progression = useMemo(() => analyzeProgression(history), [history]);

  return (
    <div className="space-y-8 overflow-y-auto pb-20">
      <div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-400">Evolução</h2>
        <p className="text-gray-500 text-sm mt-1">
          {profile?.name ? `Progresso de ${profile.name}` : 'Histórico de atividades'}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Sessões"     val={totals.sessions}
          icon={<Activity className="text-blue-400"   />} color="text-blue-400" />
        <MetricCard label="Tempo Total" val={`${Math.floor(totals.duration / 3600)}h ${Math.floor((totals.duration % 3600) / 60)}m`}
          icon={<Clock    className="text-green-400"  />} color="text-green-400" />
        <MetricCard label="Gordura Est." val={`-${totals.lostFat.toFixed(2)}kg`}
          icon={<Flame    className="text-red-400"    />} color="text-red-400" />
        <MetricCard label="Kcal Gastas" val={`~${totals.calories}`}
          icon={<Zap      className="text-orange-400" />} color="text-orange-400" />
      </div>

      {/* ─── GRÁFICO DE PROGRESSO (seção obrigatória) ─────────────────────── */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" /> Gráfico de Progresso
        </h3>

        {/* Barras por semana */}
        <div>
          <p className="text-[10px] text-gray-600 font-black uppercase mb-4">Sessões por Semana</p>
          <div className="flex items-end gap-4 h-28">
            {weeklyData.map((week, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-black text-emerald-400">{week.count}</span>
                <div className="w-full bg-black/40 rounded-t-xl relative overflow-hidden" style={{ height: '72px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-emerald-400/70 rounded-t-xl transition-all duration-1000"
                    style={{ height: `${(week.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-gray-600 uppercase text-center leading-tight">{week.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes das semanas */}
        <div className="grid grid-cols-4 gap-3 border-t border-white/5 pt-4">
          {weeklyData.map((week, idx) => (
            <div key={idx} className="text-center">
              <p className="text-[9px] font-black text-gray-600 uppercase mb-1">{week.label}</p>
              <p className="text-sm font-black text-white">{week.count} treinos</p>
              <p className="text-[9px] text-gray-600">{week.minutes} min</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progresso rumo à meta */}
      {goalProgress && (
        <div className="bg-emerald-400/5 border border-emerald-400/20 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black uppercase tracking-tight text-emerald-400 flex items-center gap-2">
              <Target size={18} /> Meta: {goalProgress.goalType}
            </h3>
            <span className="text-xs font-black text-emerald-400 bg-emerald-400/20 px-3 py-1 rounded-full">
              {goalProgress.pct}% alcançado
            </span>
          </div>
          {goalProgress.goalDesc && (
            <p className="text-xs text-gray-400 italic">{goalProgress.goalDesc}</p>
          )}
          {/* Barra de progresso */}
          <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-blue-400 h-4 rounded-full transition-all duration-1000 relative"
              style={{ width: `${goalProgress.pct}%` }}
            >
              {goalProgress.pct > 10 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">
                  {goalProgress.pct}%
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[9px] text-gray-600 font-black uppercase">Início</p>
              <p className="text-lg font-black">{goalProgress.start}kg</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 font-black uppercase">Atual Est.</p>
              <p className="text-lg font-black text-emerald-400">{goalProgress.current}kg</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 font-black uppercase">Meta</p>
              <p className="text-lg font-black text-blue-400">{goalProgress.target}kg</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Falta aproximadamente <strong className="text-white">{goalProgress.remaining}kg</strong> para atingir a meta
          </p>
        </div>
      )}

      {/* Planejado vs Realizado */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-emerald-400" /> Planejado vs Realizado (Esta Semana)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-500">Realizados</span>
              <span className="text-emerald-400">{adherenceThisWeek} / {plannedDays}</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${plannedDays > 0 ? Math.min((adherenceThisWeek / plannedDays) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl flex items-center justify-center">
            {adherenceThisWeek >= plannedDays && plannedDays > 0
              ? <Check size={24} className="text-emerald-400" />
              : <span className="text-lg font-black text-emerald-400">{plannedDays > 0 ? Math.round((adherenceThisWeek / plannedDays) * 100) : 0}%</span>
            }
          </div>
        </div>
      </div>

      {/* Histórico de sessões */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-lg font-black text-emerald-400 uppercase tracking-tight flex items-center gap-2">
          <TrendingUp size={18} /> Histórico de Sessões
        </h3>
        {history.length > 0 ? (
          <div className="space-y-3">
            {[...history].reverse().map((s, idx) => {
              const date = new Date(s.date);
              const durationMin = Math.floor(s.duration / 60);
              const durationSec = s.duration % 60;
              return (
                <div key={idx} className="bg-black/30 p-5 rounded-2xl flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-400/10 rounded-xl flex flex-col items-center justify-center text-emerald-400 flex-shrink-0">
                    <span className="text-lg font-black leading-none">{date.getDate()}</span>
                    <span className="text-[9px] font-black uppercase">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm capitalize">{date.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                    <p className="text-gray-500 text-xs">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center flex-shrink-0">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase">Duração</p>
                      <p className="text-sm font-black">{durationMin}m {durationSec}s</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase">Exerc.</p>
                      <p className="text-sm font-black text-emerald-400">{s.completedExercises}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase">Gordura</p>
                      <p className="text-sm font-black text-red-400">-{((s.totalFatLostGrams || 0) / 1000).toFixed(2)}kg</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 font-bold text-lg">Nenhuma sessão concluída ainda</p>
            <p className="text-gray-600 text-sm mt-2">Complete seu primeiro treino para ver o progresso aqui.</p>
          </div>
        )}
      </div>

      {/* Progressão automática */}
      {history.length >= 3 && (
        <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <BarChart2 size={16} className="text-purple-400" /> Análise de Progressão
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-600 uppercase">Dias Consecutivos</p>
              <p className="text-2xl font-black text-emerald-400">{progression.consecutiveDays}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-600 uppercase">Duração Média</p>
              <p className="text-2xl font-black text-blue-400">{Math.round(progression.avgSessionDuration)}min</p>
            </div>
          </div>
          {/* Volume por semana */}
          <div>
            <p className="text-[10px] font-black text-gray-600 uppercase mb-2">Volume Semanal (sessões)</p>
            <div className="flex gap-2 items-end h-16">
              {progression.weeklyVolume.map((v, i) => {
                const maxV = Math.max(...progression.weeklyVolume, 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-emerald-400 font-black">{v > 0 ? v : ''}</span>
                    <div
                      className={`w-full rounded-t transition-all ${i === 3 ? 'bg-emerald-400' : 'bg-emerald-400/30'}`}
                      style={{ height: `${(v / maxV) * 40}px`, minHeight: v > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] text-gray-600">{i === 3 ? 'Atual' : `${3-i}s`}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {progression.suggestDeload && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-yellow-300">Deload Recomendado</p>
                <p className="text-xs text-yellow-400/70 mt-1">3 semanas seguidas de alto volume. Reduza intensidade 30-40% na próxima semana para otimizar recuperação.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, val, icon, color }: { label: string; val: string | number; icon: React.ReactNode; color: string }) => (
  <div className="bg-neutral-900/40 p-5 rounded-3xl border border-white/5 flex items-start gap-3">
    <div className="w-11 h-11 bg-black/40 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-600 uppercase">{label}</p>
      <p className={`text-xl font-black italic leading-tight ${color}`}>{val}</p>
    </div>
  </div>
);
