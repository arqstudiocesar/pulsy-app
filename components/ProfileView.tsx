// ProfileView.tsx
import React, { useState } from 'react';
import { UserProfile, TrainingHistory, ActivityLevel, FitnessLevel } from '../types';
import { Save, Check, Activity, MapPin, Coffee, Trash2, Plus, Target, User, Ruler, Dumbbell } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
}

const DURATIONS  = ['30 dias', '60 dias', '90 dias', '120 dias', '180 dias', '1 ano', 'Contínuo'];
const GOAL_TYPES = ['Emagrecimento', 'Ganho de massa', 'Condicionamento', 'Saúde', 'Mobilidade', 'Desempenho'];

const WEEK_DAYS = [
  { short: 'Seg', jsDay: 1 },
  { short: 'Ter', jsDay: 2 },
  { short: 'Qua', jsDay: 3 },
  { short: 'Qui', jsDay: 4 },
  { short: 'Sex', jsDay: 5 },
  { short: 'Sáb', jsDay: 6 },
  { short: 'Dom', jsDay: 0 },
];

const MUSCLE_GROUPS = [
  'TODOS',
  'Peitoral', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Antebraço', 'Quadríceps', 'Isquiotibiais', 'Glúteos',
  'Panturrilha', 'Abdômen', 'Core', 'Cardio', 'Funcional'
];

export const ProfileView: React.FC<Props> = ({ profile, onUpdate }) => {
  const [local, setLocal] = useState<UserProfile>(() => {
    if (profile) return JSON.parse(JSON.stringify(profile));
    return {
      name: '', avatarSeed: 'default', age: 0, sex: 'Masculino',
      weight: 0, height: 0, activityLevel: ActivityLevel.SEDENTARY,
      fitnessLevel: FitnessLevel.BEGINNER,
      measurements: { waist: 0, hips: 0, chest: 0, arms: 0, thighs: 0, calves: 0 },
      trainingStatus: { history: TrainingHistory.NEVER },
      structuredGoals: [],
      availability: {
        daysPerWeek: 3, selectedDays: [], frequencyPerDay: 1,
        timePerSession: 60, minExercisesPerSession: 4,
        locations: [], maxSessionTime: 60, minExercisesPerDay: 4
      },
      nutrition: { objective: 'Condicionamento', allergies: [], mealsPerDay: 4, budget: 'Médio ($$)' }
    };
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleChange = (path: string, value: any) => {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UserProfile;
      const keys = path.split('.');
      let cur: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      if (path === 'weight' || path === 'height') {
        const h = (path === 'height' ? value : next.height) / 100;
        const w = path === 'weight' ? value : next.weight;
        if (h > 0) next.imc = w / (h * h);
      }
      return next;
    });
  };

  const toggleDay = (jsDay: number) => {
    const current = local.availability?.selectedDays || [];
    const updated = current.includes(jsDay) ? current.filter(d => d !== jsDay) : [...current, jsDay];
    handleChange('availability.selectedDays', updated);
    handleChange('availability.daysPerWeek', updated.length);
  };

  const toggleMuscleForDay = (jsDay: number, muscle: string) => {
    const currentRoutine = (local.availability?.muscleRoutine || {}) as Record<number, string[]>;
    const current = currentRoutine[jsDay] || [];

    let updated: string[];
    if (muscle === 'TODOS') {
      // Se TODOS já está selecionado, desmarca tudo; senão, seleciona apenas TODOS
      updated = current.includes('TODOS') ? [] : ['TODOS'];
    } else {
      // Se está selecionando músculo específico, remove TODOS automaticamente
      const withoutTodos = current.filter(m => m !== 'TODOS');
      updated = withoutTodos.includes(muscle)
        ? withoutTodos.filter(m => m !== muscle)
        : [...withoutTodos, muscle];
    }
    handleChange('availability.muscleRoutine', { ...currentRoutine, [jsDay]: updated });
  };

  const addGoal = () => handleChange('structuredGoals', [
    ...local.structuredGoals,
    { duration: DURATIONS[0], type: GOAL_TYPES[0], description: '', numericValue: '', priority: 'medium' }
  ]);

  const removeGoal = (idx: number) =>
    handleChange('structuredGoals', local.structuredGoals.filter((_, i) => i !== idx));

  const handleSave = () => {
    const hM = local.height / 100;
    const updated = {
      ...local,
      imc: hM > 0 ? local.weight / (hM * hM) : local.imc,
      availability: {
        ...local.availability,
        maxSessionTime: local.availability.timePerSession,
        minExercisesPerDay: local.availability.minExercisesPerSession
      }
    };
    onUpdate(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="space-y-8 overflow-y-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-400">Bio-Perfil Pulsy</h2>
        <button onClick={handleSave}
          className="bg-emerald-400 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-400/20 text-sm">
          <Save size={16} /> Salvar Alterações
        </button>
      </div>

      {/* Aviso sobre regeneração */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-xs text-blue-400 font-bold">
          ℹ️ Ao salvar, o Pulsy AI regenerará automaticamente seus planos de treino e nutrição com os novos dados.
        </p>
      </div>

      {/* ─── Identidade & Biometria ─────────────────────────────────────── */}
      <Section icon={<User size={22} className="text-emerald-400" />} title="Identidade & Biometria">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Nome" value={local.name || ''} onChange={v => handleChange('name', v)} />
          <Field label="Idade" type="number" value={(local.age || 0).toString()} onChange={v => handleChange('age', parseInt(v) || 0)} />
          <SelectField label="Sexo" value={local.sex || 'Masculino'} options={['Masculino', 'Feminino', 'Outro']} onChange={v => handleChange('sex', v)} />
          <Field label="Peso (kg)" type="number" value={(local.weight || 0).toString()} onChange={v => handleChange('weight', parseFloat(v) || 0)} />
          <Field label="Altura (cm)" type="number" value={(local.height || 0).toString()} onChange={v => handleChange('height', parseInt(v) || 0)} />
          <Field label="Peso Desejado (kg)" type="number" value={(local.targetWeight || 0).toString()} onChange={v => handleChange('targetWeight', parseFloat(v) || 0)} />
          <Field label="Gordura Corporal (%)" type="number" value={(local.bodyFatPercentage || 0).toString()} onChange={v => handleChange('bodyFatPercentage', parseFloat(v) || 0)} />
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">IMC</label>
            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-emerald-400">
              {local.imc?.toFixed(2) || 'Calculando...'}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Medidas Corporais ──────────────────────────────────────────── */}
      <Section icon={<Ruler size={22} className="text-emerald-400" />} title="Medidas Corporais (cm)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {(['waist', 'hips', 'chest', 'arms', 'thighs', 'calves'] as const).map(key => (
            <Field key={key}
              label={{ waist: 'Cintura', hips: 'Quadril', chest: 'Peito', arms: 'Braços', thighs: 'Coxas', calves: 'Panturrilha' }[key]}
              type="number"
              value={(local.measurements?.[key] || 0).toString()}
              onChange={v => handleChange(`measurements.${key}`, parseFloat(v) || 0)}
            />
          ))}
        </div>
      </Section>

      {/* ─── Condição & Treinamento ─────────────────────────────────────── */}
      <Section icon={<Activity size={22} className="text-emerald-400" />} title="Condição & Treinamento">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SelectField label="Nível Fitness" value={(local.fitnessLevel as string) || ''} options={['', ...Object.values(FitnessLevel)]} onChange={v => handleChange('fitnessLevel', v)} />
          <SelectField label="Nível de Atividade" value={(local.activityLevel as string) || ''} options={['', ...Object.values(ActivityLevel)]} onChange={v => handleChange('activityLevel', v)} />
          <SelectField label="Histórico de Treino" value={local.trainingStatus?.history as string || ''} options={['', ...Object.values(TrainingHistory)]} onChange={v => handleChange('trainingStatus.history', v)} />
        </div>
      </Section>

      {/* ─── Rotina & Disponibilidade ────────────────────────────────────── */}
      <Section icon={<MapPin size={22} className="text-emerald-400" />} title="Rotina, Disponibilidade & Músculos">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Dias de treino na semana</label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map(d => {
                const selected = local.availability?.selectedDays?.includes(d.jsDay);
                return (
                  <button key={d.jsDay} type="button" onClick={() => toggleDay(d.jsDay)}
                    className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all ${
                      selected ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                               : 'bg-black/40 border border-white/10 text-gray-400 hover:border-emerald-400/30'
                    }`}
                  >{d.short}</button>
                );
              })}
            </div>
            <p className="text-xs text-gray-600">{local.availability?.selectedDays?.length ?? 0} dia(s) selecionado(s)</p>
          </div>

          {/* NOVA FUNCIONALIDADE: Rotina Muscular por Dia */}
          {(local.availability?.selectedDays?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">
                Grupos musculares por dia (opcional)
              </label>
              <p className="text-[9px] text-gray-500">
                Selecione quais músculos treinar em cada dia. Se não selecionar, a IA decide automaticamente.
              </p>
              <div className="space-y-3">
                {WEEK_DAYS.filter(d => local.availability?.selectedDays?.includes(d.jsDay)).map(d => {
                  const muscleRoutine = (local.availability?.muscleRoutine || {}) as Record<number, string[]>;
                  return (
                    <div key={d.jsDay} className="bg-black/30 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-black uppercase text-emerald-400 mb-3 tracking-widest">{d.short}</p>
                      <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS.map(muscle => {
                          const sel = (muscleRoutine[d.jsDay] || []).includes(muscle);
                          const isTodos = muscle === 'TODOS';
                          return (
                            <button key={muscle} type="button"
                              onClick={() => toggleMuscleForDay(d.jsDay, muscle)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                sel
                                  ? isTodos
                                    ? 'bg-blue-400 text-black'
                                    : 'bg-emerald-400 text-black'
                                  : isTodos
                                    ? 'bg-black/40 border border-blue-400/30 text-blue-400 hover:bg-blue-400/10'
                                    : 'bg-black/40 border border-white/10 text-gray-500 hover:border-emerald-400/30 hover:text-gray-300'
                              }`}
                            >
                              {isTodos ? '★ TODOS' : muscle}
                            </button>
                          );
                        })}
                      </div>
                      {(muscleRoutine[d.jsDay] || []).length > 0 && (
                        <p className="text-[9px] text-emerald-400/70 mt-2">
                          {(muscleRoutine[d.jsDay] || []).includes('TODOS')
                            ? '★ IA pode usar qualquer grupo muscular'
                            : `✓ ${(muscleRoutine[d.jsDay] || []).join(', ')}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Sessões por dia</label>
              <p className="text-[9px] text-gray-600 mb-2">Quantas vezes você treina no mesmo dia</p>
              <select
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-emerald-400"
                value={local.availability?.frequencyPerDay || 1}
                onChange={e => handleChange('availability.frequencyPerDay', parseInt(e.target.value))}
              >
                <option value={1}>1× por dia</option>
                <option value={2}>2× por dia</option>
                <option value={3}>3× por dia</option>
              </select>
            </div>
            <Field label="Duração máxima/sessão (min)" type="number"
              value={(local.availability?.timePerSession || 60).toString()}
              onChange={v => {
                handleChange('availability.timePerSession', parseInt(v) || 60);
                handleChange('availability.maxSessionTime', parseInt(v) || 60);
              }} />
            <Field label="Mínimo de exercícios/sessão" type="number"
              value={(local.availability?.minExercisesPerSession || 4).toString()}
              onChange={v => {
                handleChange('availability.minExercisesPerSession', parseInt(v) || 4);
                handleChange('availability.minExercisesPerDay', parseInt(v) || 4);
              }} />
          </div>

          {/* Local de treino + Preferências — lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local de treino */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Local de treino</label>
              <div className="flex flex-wrap gap-2">
                {['Academia', 'Casa', 'Parque', 'Estúdio', 'Crossfit'].map(loc => {
                  const selected = local.availability?.locations?.includes(loc);
                  return (
                    <button key={loc} type="button"
                      onClick={() => {
                        const current = local.availability?.locations || [];
                        const updated = selected ? current.filter(l => l !== loc) : [...current, loc];
                        handleChange('availability.locations', updated);
                        // Limpa modalidades incompatíveis ao trocar local
                        handleChange('availability.modalities', []);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all ${
                        selected ? 'bg-emerald-400 text-black' : 'bg-black/40 border border-white/10 text-gray-400'
                      }`}
                    >{loc}</button>
                  );
                })}
              </div>
            </div>

            {/* Preferências de Modalidade — TÓPICO 2 */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Preferências</label>
              <p className="text-[9px] text-gray-600">Modalidades preferidas para o seu treino</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const locs = local.availability?.locations || [];
                  const hasGym = locs.includes('Academia') || locs.includes('Crossfit');
                  const hasHome = locs.includes('Casa') || locs.includes('Estúdio') || locs.includes('Parque');
                  // Se nenhum local, mostra todas
                  const gymMods = ['Musculação', 'Treino Funcional', 'Máquinas', 'Treino de Força', 'Hipertrofia'];
                  const homeMods = ['Calistenia', 'Cardio', 'Yoga', 'Dança', 'Artes Marciais', 'Treino Funcional'];
                  const allMods = ['Calistenia', 'Cardio', 'Yoga', 'Dança', 'Artes Marciais', 'Musculação', 'Treino Funcional', 'Máquinas', 'Treino de Força'];
                  let available: string[];
                  if (hasGym && !hasHome) available = gymMods;
                  else if (hasHome && !hasGym) available = homeMods;
                  else available = allMods;
                  return available.map(mod => {
                    const selected = local.availability?.modalities?.includes(mod);
                    return (
                      <button key={mod} type="button"
                        onClick={() => {
                          const current = local.availability?.modalities || [];
                          handleChange('availability.modalities', selected ? current.filter(m => m !== mod) : [...current, mod]);
                        }}
                        className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all ${
                          selected ? 'bg-blue-400 text-black' : 'bg-black/40 border border-white/10 text-gray-400 hover:border-blue-400/30'
                        }`}
                      >{mod}</button>
                    );
                  });
                })()}
              </div>
              {(local.availability?.modalities?.length ?? 0) > 0 && (
                <p className="text-[9px] text-blue-400 font-bold">
                  {local.availability!.modalities!.length} preferência(s) selecionada(s)
                </p>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Bio-Nutrição ───────────────────────────────────────────────── */}
      <Section icon={<Coffee size={22} className="text-emerald-400" />} title="Bio-Nutrição">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SelectField label="Objetivo nutricional" value={local.nutrition?.objective || 'Condicionamento'}
            options={['Emagrecimento', 'Ganho de massa', 'Manutenção', 'Performance']}
            onChange={v => handleChange('nutrition.objective', v)} />
          <Field label="Refeições por dia" type="number" value={(local.nutrition?.mealsPerDay || 4).toString()}
            onChange={v => handleChange('nutrition.mealsPerDay', parseInt(v) || 4)} />
          <SelectField label="Orçamento" value={local.nutrition?.budget || 'Médio ($$)'}
            options={['Baixo ($)', 'Médio ($$)', 'Alto ($$$)']}
            onChange={v => handleChange('nutrition.budget', v)} />
          <div className="col-span-full space-y-2">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Alergias / Restrições</label>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Digite e pressione Enter para adicionar..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    handleChange('nutrition.allergies', [...(local.nutrition?.allergies || []), val]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(local.nutrition?.allergies || []).map(a => (
                <button key={a}
                  onClick={() => handleChange('nutrition.allergies', local.nutrition.allergies.filter(x => x !== a))}
                  className="bg-white/5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-gray-400 border border-white/5 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >{a} ×</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Objetivos Estruturados ─────────────────────────────────────── */}
      <Section icon={<Target size={22} className="text-emerald-400" />} title="Objetivos Estruturados"
        action={
          <button onClick={addGoal} className="bg-emerald-400/10 text-emerald-400 px-5 py-2.5 rounded-full font-black uppercase text-xs flex items-center gap-2">
            <Plus size={14} /> Novo
          </button>
        }
      >
        <div className="space-y-5">
          {local.structuredGoals?.map((goal, idx) => (
            <div key={idx} className="bg-black/30 p-5 rounded-2xl space-y-4 relative group">
              <button onClick={() => removeGoal(idx)} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Duração" value={goal.duration || DURATIONS[0]} options={DURATIONS}
                  onChange={v => { const ng = [...local.structuredGoals]; ng[idx] = { ...ng[idx], duration: v }; handleChange('structuredGoals', ng); }} />
                <SelectField label="Tipo" value={goal.type || GOAL_TYPES[0]} options={GOAL_TYPES}
                  onChange={v => { const ng = [...local.structuredGoals]; ng[idx] = { ...ng[idx], type: v }; handleChange('structuredGoals', ng); }} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase">Descrição</label>
                <textarea
                  className="w-full bg-neutral-900 border border-white/5 rounded-xl p-3 text-xs italic text-gray-400 outline-none focus:border-emerald-400/30 min-h-[80px] resize-none"
                  value={goal.description || ''}
                  onChange={e => { const ng = [...local.structuredGoals]; ng[idx] = { ...ng[idx], description: e.target.value }; handleChange('structuredGoals', ng); }}
                  placeholder="Descreva o objetivo..."
                />
              </div>
              <Field label="Meta Numérica" value={goal.numericValue || ''}
                onChange={v => { const ng = [...local.structuredGoals]; ng[idx] = { ...ng[idx], numericValue: v }; handleChange('structuredGoals', ng); }}
                placeholder="Ex: 2kg / 5km" />
            </div>
          ))}
          {local.structuredGoals?.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">Nenhum objetivo definido ainda.</p>
          )}
        </div>
      </Section>

      {savedFeedback && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-emerald-400 text-black px-8 py-4 rounded-full font-black uppercase shadow-2xl z-50 flex items-center gap-2">
          <Check size={20} /> Perfil Pulsy Sincronizado!
        </div>
      )}
    </div>
  );
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────
const Section = ({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="bg-neutral-900/40 p-7 rounded-3xl border border-white/5 shadow-xl space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">{icon}<h3 className="text-lg font-black italic uppercase tracking-tight">{title}</h3></div>
      {action}
    </div>
    {children}
  </section>
);

const Field = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">{label}</label>
    <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white focus:border-emerald-400 outline-none transition-all" />
  </div>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white focus:border-emerald-400 outline-none transition-all appearance-none">
      {options.map(o => <option key={o} value={o}>{o || 'Selecione...'}</option>)}
    </select>
  </div>
);
