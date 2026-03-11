// Dashboard.tsx
import React, { useMemo } from 'react';
import { WeeklyPlan, UserProfile, WorkoutSession } from '../types';
import { Scale, Activity, TrendingUp, Flame, Target, Zap, Calendar, Clock, AlertTriangle, BarChart2, Shield } from 'lucide-react';
import { calcSessionTime, analyzeProgression, checkMuscleOverload } from '../services/aiService';

interface Props {
  currentPlan: WeeklyPlan | null;
  profile: UserProfile | null;
  history: WorkoutSession[];
}

export const Dashboard: React.FC<Props> = ({ currentPlan, profile, history }) => {

  // ─── Métricas do histórico ─────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalSessions = history.length;
    const totalDuration = history.reduce((sum, s) => sum + s.duration, 0);
    const totalFatLost  = history.reduce((sum, s) => sum + (s.totalFatLostGrams || 0), 0) / 1000;
    const totalCalories = history.reduce((sum, s) => sum + (s.caloriesBurned || Math.round(s.duration / 60 * 5)), 0);
    return { totalSessions, totalDuration, totalFatLost, totalCalories };
  }, [history]);

  // ─── Adesão semanal ────────────────────────────────────────────────────
  const weeklyAdherence = useMemo(() => {
    if (!currentPlan) return 0;
    const plannedDays = currentPlan.weeklyPlan.filter(d => d.workout?.length > 0).length;
    if (plannedDays === 0) return 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = history.filter(s => new Date(s.date).getTime() > oneWeekAgo);
    return Math.min(100, Math.round((recent.length / plannedDays) * 100));
  }, [history, currentPlan]);

  // ─── IMC ───────────────────────────────────────────────────────────────
  const imcInfo = useMemo(() => {
    const imc = profile?.imc;
    if (!imc) return { label: 'N/A', color: 'text-gray-400' };
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-400' };
    if (imc < 25)   return { label: 'Peso normal',    color: 'text-emerald-400' };
    if (imc < 30)   return { label: 'Sobrepeso',      color: 'text-yellow-400' };
    return { label: 'Obesidade', color: 'text-red-400' };
  }, [profile?.imc]);

  // ─── Nutrição do dia ───────────────────────────────────────────────────
  const todayNutrition = useMemo(() => {
    if (!currentPlan) return { kcal: 0, pro: 0, carb: 0, fat: 0 };
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const day = currentPlan.weeklyPlan[todayIdx];
    if (!day?.nutrition) return { kcal: 0, pro: 0, carb: 0, fat: 0 };
    return day.nutrition.reduce((acc, meal) => {
      const opt = meal.options?.[meal.selectedOptionIndex ?? 0] ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
      return {
        kcal: acc.kcal + (opt.calories || 0),
        pro:  acc.pro  + (opt.protein  || 0),
        carb: acc.carb + (opt.carbs    || 0),
        fat:  acc.fat  + (opt.fats     || 0)
      };
    }, { kcal: 0, pro: 0, carb: 0, fat: 0 });
  }, [currentPlan]);

  // ─── Treino de hoje ────────────────────────────────────────────────────
  const todayWorkout = useMemo(() => {
    if (!currentPlan) return null;
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return currentPlan.weeklyPlan[todayIdx] || null;
  }, [currentPlan]);

  // ─── TMB & TDEE ───────────────────────────────────────────────────────
  const { tmb, tdee } = useMemo(() => {
    if (!profile) return { tmb: 0, tdee: 0 };
    const { weight, height, age, sex } = profile;
    if (!weight || !height || !age) return { tmb: 0, tdee: 0 };
    const base = 10 * weight + 6.25 * height - 5 * age;
    const tmb  = Math.round(sex === 'Feminino' ? base - 161 : base + 5);
    const multipliers: Record<string, number> = {
      'Sedentário': 1.2, 'Levemente Ativo': 1.375,
      'Moderadamente Ativo': 1.55, 'Ativo': 1.725, 'Muito Ativo': 1.9
    };
    const tdee = Math.round(tmb * (multipliers[profile.activityLevel as string] || 1.2));
    return { tmb, tdee };
  }, [profile]);

  // ─── Progresso rumo à meta ─────────────────────────────────────────────
  const goalProgress = useMemo(() => {
    if (!profile || !profile.targetWeight || !profile.weight) return null;
    const start  = profile.weight;
    const target = profile.targetWeight;
    const current = start - (metrics.totalFatLost * 0.85); // estimativa
    const total = Math.abs(target - start);
    if (total === 0) return null;
    const done  = Math.min(Math.abs(current - start), total);
    const pct   = Math.round((done / total) * 100);
    const remaining = Math.abs(target - current).toFixed(1);
    return { pct: Math.min(pct, 100), remaining, target };
  }, [profile, metrics.totalFatLost]);

  // ─── Dados para gráfico semanal (últimas 4 semanas) ───────────────────
  const weeklyChart = useMemo(() => {
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      const end   = Date.now() - w * 7 * 24 * 60 * 60 * 1000;
      const sessions = history.filter(s => {
        const t = new Date(s.date).getTime();
        return t >= start && t < end;
      });
      weeks.push({
        label: w === 0 ? 'Atual' : `${w}s atrás`,
        count: sessions.length,
        kcal: sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0)
      });
    }
    return weeks;
  }, [history]);

  const maxWeekCount = Math.max(...weeklyChart.map(w => w.count), 1);

  // ─── Progressão e alertas ──────────────────────────────────────────────
  const progression = useMemo(() => analyzeProgression(history), [history]);

  const muscleWarnings = useMemo(() =>
    currentPlan ? checkMuscleOverload(currentPlan) : [],
  [currentPlan]);

  // ─── Estimativa de carga semanal ───────────────────────────────────────
  const weeklyLoadEstimate = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = history.filter(s => new Date(s.date).getTime() > oneWeekAgo);
    const totalSets = thisWeek.reduce((sum, s) => sum + (s.completedExercises * 3), 0);
    const totalKcal = thisWeek.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);
    const totalMin  = thisWeek.reduce((sum, s) => sum + s.duration / 60, 0);
    return { totalSets, totalKcal, totalMin: Math.round(totalMin), sessions: thisWeek.length };
  }, [history]);

  return (
    <div className="space-y-8 overflow-y-auto pb-20">
      {/* Saudação */}
      <div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-400">Painel Pulsy</h2>
        <p className="text-gray-500 text-sm mt-1">
          {profile?.name ? `Olá, ${profile.name}! ` : ''}
          {currentPlan?.motivation || 'Seu protocolo de alta performance está ativo.'}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Kcal Hoje"  val={`${Math.round(todayNutrition.kcal)}`} icon={<Flame  className="text-orange-400" />} sub="Plano nutricional" />
        <MetricCard label="Peso Atual" val={`${profile?.weight || '—'}kg`}        icon={<Scale  className="text-blue-400"   />} sub={`Meta: ${profile?.targetWeight || '—'}kg`} />
        <MetricCard label="Sessões"    val={metrics.totalSessions}                 icon={<Activity className="text-purple-400" />} sub="Total concluídas" />
        <MetricCard label="Gordura"    val={`-${metrics.totalFatLost.toFixed(1)}kg`} icon={<Flame className="text-red-400" />} sub="Estimativa total" />
      </div>

      {/* Treino de hoje */}
      {todayWorkout && (
        <div className={`p-6 rounded-3xl border ${
          todayWorkout.workout?.length > 0
            ? 'bg-emerald-400/5 border-emerald-400/20'
            : 'bg-neutral-900/40 border-white/5'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Zap size={20} className="text-emerald-400" />
            <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400">
              Treino de Hoje — {todayWorkout.day}
            </h3>
          </div>
          {todayWorkout.workout?.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {todayWorkout.workout.slice(0, 5).map(ex => (
                  <span key={ex.id} className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                    {ex.name}
                  </span>
                ))}
                {todayWorkout.workout.length > 5 && (
                  <span className="text-xs font-bold text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                    +{todayWorkout.workout.length - 5}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                <span className="flex items-center gap-1"><Activity size={12} /> {todayWorkout.workout.length} exercícios</span>
                <span className="flex items-center gap-1"><Clock size={12} /> ~{Math.round(calcSessionTime(todayWorkout.workout))} min</span>
                {profile?.availability?.timePerSession && (
                  <span className="flex items-center gap-1 text-emerald-400/70">
                    <Target size={12} /> limite: {profile.availability.timePerSession} min
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 font-medium">Dia de descanso. Recupere-se bem! 🧘</p>
          )}
        </div>
      )}

      {/* Gráfico de progresso — SEÇÃO OBRIGATÓRIA */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-6 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" /> Progresso — Últimas 4 Semanas
        </h3>
        <div className="flex items-end gap-4 h-32 mb-4">
          {weeklyChart.map((week, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-black text-emerald-400">{week.count}</span>
              <div className="w-full bg-black/40 rounded-t-xl relative overflow-hidden" style={{ height: '80px' }}>
                <div
                  className="absolute bottom-0 w-full bg-emerald-400/70 rounded-t-xl transition-all duration-1000"
                  style={{ height: `${(week.count / maxWeekCount) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-black text-gray-600 uppercase text-center leading-tight">{week.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-gray-600 font-bold border-t border-white/5 pt-3">
          <span>Total sessões: <strong className="text-white">{metrics.totalSessions}</strong></span>
          <span>Kcal gastas: <strong className="text-orange-400">~{metrics.totalCalories}</strong></span>
          <span>Gordura: <strong className="text-red-400">-{metrics.totalFatLost.toFixed(1)}kg</strong></span>
        </div>
      </div>

      {/* Meta de progresso */}
      {goalProgress !== null && (
        <div className="bg-emerald-400/10 border border-emerald-400/20 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black uppercase tracking-tight text-emerald-400 flex items-center gap-2">
              <Target size={18} /> Progresso Rumo à Meta
            </h3>
            <span className="text-xs font-black text-emerald-400 bg-emerald-400/20 px-3 py-1 rounded-full">
              {goalProgress.pct}% alcançado
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            {profile?.structuredGoals?.[0]?.description || `Meta: ${goalProgress.target}kg`}
          </p>
          <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${goalProgress.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-600 font-bold">Início</span>
            <span className="text-[10px] text-gray-500 font-bold">Falta ~{goalProgress.remaining}kg</span>
            <span className="text-[10px] text-emerald-400 font-bold">Meta: {goalProgress.target}kg</span>
          </div>
        </div>
      )}

      {/* Adesão semanal */}
      <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Calendar size={16} className="text-emerald-400" /> Adesão Semanal
          </h3>
          <span className="text-xs font-black text-emerald-400 bg-emerald-400/20 px-3 py-1 rounded-full">
            {weeklyAdherence}%
          </span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2">
          <div className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${weeklyAdherence}%` }} />
        </div>
        <p className="text-xs text-gray-600 mt-2">{weeklyAdherence}% dos treinos planejados concluídos esta semana</p>
      </div>

      {/* Análise biométrica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
            <Scale size={16} className="text-emerald-400" /> Análise Biométrica
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">IMC</p>
              <p className="text-2xl font-black">{profile?.imc?.toFixed(1) || '—'}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${imcInfo.color}`}>{imcInfo.label}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">% Gordura</p>
              <p className="text-2xl font-black">{profile?.bodyFatPercentage ? `${profile.bodyFatPercentage}%` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">Peso Ideal</p>
              <p className="text-2xl font-black">{profile?.targetWeight ? `${profile.targetWeight}kg` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">Cintura</p>
              <p className="text-2xl font-black">{profile?.measurements?.waist ? `${profile.measurements.waist}cm` : '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
            <Flame size={16} className="text-orange-400" /> Metabolismo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">TMB</p>
              <p className="text-2xl font-black">{tmb > 0 ? tmb : '—'}</p>
              <p className="text-[10px] text-gray-600">kcal/dia basal</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">TDEE</p>
              <p className="text-2xl font-black">{tdee > 0 ? tdee : '—'}</p>
              <p className="text-[10px] text-gray-600">kcal/dia total</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">Meta Kcal</p>
              <p className="text-2xl font-black text-emerald-400">{Math.round(todayNutrition.kcal)}</p>
              <p className="text-[10px] text-gray-600">plano de hoje</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-black uppercase">Déficit/Superávit</p>
              <p className={`text-2xl font-black ${tdee - todayNutrition.kcal > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tdee > 0 && todayNutrition.kcal > 0 ? `${Math.round(tdee - todayNutrition.kcal)} kcal` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Macros do dia */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4">Macros Planejados — Hoje</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Proteína',     val: `${Math.round(todayNutrition.pro)}g`,  color: 'text-blue-400',   pct: tdee > 0 ? Math.round((todayNutrition.pro * 4 / todayNutrition.kcal) * 100) : 0 },
            { label: 'Carboidratos', val: `${Math.round(todayNutrition.carb)}g`, color: 'text-yellow-400', pct: tdee > 0 ? Math.round((todayNutrition.carb * 4 / todayNutrition.kcal) * 100) : 0 },
            { label: 'Gorduras',     val: `${Math.round(todayNutrition.fat)}g`,  color: 'text-red-400',    pct: tdee > 0 ? Math.round((todayNutrition.fat * 9 / todayNutrition.kcal) * 100) : 0 },
            { label: 'Calorias',     val: `${Math.round(todayNutrition.kcal)}`,  color: 'text-orange-400', pct: tdee > 0 ? Math.round((todayNutrition.kcal / tdee) * 100) : 0 },
          ].map(item => (
            <div key={item.label} className="text-center space-y-1">
              <p className={`text-xl font-black ${item.color}`}>{item.val}</p>
              <p className="text-[9px] font-black text-gray-600 uppercase">{item.label}</p>
              {item.pct > 0 && <p className="text-[9px] text-gray-700">{item.pct}%</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Métricas Avançadas — Carga Semanal */}
      <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-purple-400" /> Carga Semanal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-purple-400">{weeklyLoadEstimate.sessions}</p>
            <p className="text-[9px] font-black text-gray-600 uppercase">Sessões</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{weeklyLoadEstimate.totalMin}min</p>
            <p className="text-[9px] font-black text-gray-600 uppercase">Tempo Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-orange-400">{weeklyLoadEstimate.totalKcal}</p>
            <p className="text-[9px] font-black text-gray-600 uppercase">Kcal Gastos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">{weeklyLoadEstimate.totalSets}</p>
            <p className="text-[9px] font-black text-gray-600 uppercase">Séries Est.</p>
          </div>
        </div>
        {/* Barra de condicionamento — 4 semanas */}
        {history.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-black text-gray-600 uppercase">Evolução de Condicionamento (4 semanas)</p>
            <div className="flex gap-2 items-end h-8">
              {progression.weeklyVolume.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-purple-400/40 transition-all"
                    style={{ height: `${(v / Math.max(...progression.weeklyVolume, 1)) * 28}px` }}
                  />
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-600">Dias consecutivos ativos: <span className="text-emerald-400 font-black">{progression.consecutiveDays}</span></p>
          </div>
        )}
      </div>

      {/* Alertas de Prevenção de Lesões */}
      {(progression.suggestDeload || muscleWarnings.length > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl space-y-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400 flex items-center gap-2">
            <Shield size={16} /> Prevenção de Lesões
          </h3>
          {progression.suggestDeload && (
            <div className="flex items-start gap-3 bg-yellow-500/10 p-4 rounded-2xl">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-yellow-300">Semana de Deload Recomendada</p>
                <p className="text-xs text-yellow-400/70 mt-1">3+ semanas de alto volume detectadas. Considere reduzir intensidade para recuperação e prevenção de lesões.</p>
              </div>
            </div>
          )}
          {muscleWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 bg-yellow-500/10 p-3 rounded-xl">
              <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, val, icon, sub }: { label: string; val: string | number; icon: React.ReactNode; sub: string }) => (
  <div className="bg-neutral-900/40 p-5 rounded-3xl border border-white/5 flex items-start gap-3">
    <div className="w-11 h-11 bg-black/40 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-gray-600 uppercase truncate">{label}</p>
      <p className="text-2xl font-black italic leading-tight">{val}</p>
      <p className="text-[9px] text-gray-600 truncate">{sub}</p>
    </div>
  </div>
);
