// ProfileSetup.tsx
import React, { useState } from 'react';
import { INITIAL_PROFILE } from '../constants';
import { UserProfile, FitnessLevel, ActivityLevel } from '../types';
import { ChevronRight, ChevronLeft, Target, Activity, Ruler, Coffee, Zap, ChevronDown } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const WEEK_DAYS = [
  { short: 'Seg', full: 'Segunda', jsDay: 1 },
  { short: 'Ter', full: 'Terça',   jsDay: 2 },
  { short: 'Qua', full: 'Quarta',  jsDay: 3 },
  { short: 'Qui', full: 'Quinta',  jsDay: 4 },
  { short: 'Sex', full: 'Sexta',   jsDay: 5 },
  { short: 'Sáb', full: 'Sábado',  jsDay: 6 },
  { short: 'Dom', full: 'Domingo', jsDay: 0 },
];

const MUSCLE_GROUPS = [
  'TODOS',
  'Peitoral', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Antebraço', 'Quadríceps', 'Isquiotibiais', 'Glúteos',
  'Panturrilha', 'Abdômen', 'Core', 'Cardio', 'Funcional'
];

export const ProfileSetup: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE as UserProfile);
  const [muscleRoutine, setMuscleRoutine] = useState<Record<number, string[]>>({});

  const steps = [
    { title: 'Identidade Bio',   icon: <Zap     className="text-emerald-400" /> },
    { title: 'Antropometria',    icon: <Ruler   className="text-blue-400" /> },
    { title: 'Objetivos Pulsy',  icon: <Target  className="text-orange-400" /> },
    { title: 'Disponibilidade',  icon: <Activity className="text-purple-400" /> },
    { title: 'Nutrição',         icon: <Coffee  className="text-pink-400" /> },
  ];

  const toggleDay = (jsDay: number) => {
    const current = profile.availability?.selectedDays || [];
    const updated = current.includes(jsDay)
      ? current.filter(d => d !== jsDay)
      : [...current, jsDay];
    setProfile(prev => ({
      ...prev,
      availability: { ...prev.availability, selectedDays: updated, daysPerWeek: updated.length }
    }));
  };

  const toggleMuscleForDay = (jsDay: number, muscle: string) => {
    setMuscleRoutine(prev => {
      const current = prev[jsDay] || [];
      let updated: string[];
      if (muscle === 'TODOS') {
        // TODOS alterna: se já selecionado desmarca tudo, senão seleciona só TODOS
        updated = current.includes('TODOS') ? [] : ['TODOS'];
      } else {
        // Músculo específico: remove TODOS se estava selecionado
        const withoutTodos = current.filter(m => m !== 'TODOS');
        updated = withoutTodos.includes(muscle)
          ? withoutTodos.filter(m => m !== muscle)
          : [...withoutTodos, muscle];
      }
      return { ...prev, [jsDay]: updated };
    });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      const hM = profile.height / 100;
      const imc = hM > 0 ? profile.weight / (hM * hM) : 0;
      const finalProfile: UserProfile = {
        ...profile,
        imc,
        availability: {
          ...profile.availability,
          maxSessionTime: profile.availability.timePerSession,
          minExercisesPerDay: profile.availability.minExercisesPerSession,
          muscleRoutine
        }
      };
      onComplete(finalProfile);
    }
  };

  const canAdvance = () => {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 3) return (profile.availability?.selectedDays?.length ?? 0) > 0;
    return true;
  };

  return (
    // CORRECAO RESPONSIVIDADE MOBILE:
    // - Removido overflow-hidden que cortava conteúdo
    // - Container usa overflow-y-auto para rolar normalmente
    // - Botões ficam ABAIXO do conteúdo (fora do flex-1), nunca somem
    <div className="w-full bg-black">
      <div className="flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 pb-32">

        {/* Header */}
        <div className="mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center font-black text-black text-xl italic shadow-lg shadow-emerald-400/30">P</div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">Pulsy <span className="text-emerald-400">AI</span></h1>
            </div>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">
              {step + 1} / {steps.length}
            </span>
          </div>
          <div className="flex gap-2">
            {steps.map((s, idx) => (
              <div key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                  idx < step ? 'bg-emerald-400' : idx === step ? 'bg-emerald-400/70' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo — cresce, empurra botões para baixo */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center flex-shrink-0">
              {steps[step].icon}
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none mb-1">
                {steps[step].title}
              </h2>
              <p className="text-gray-500 text-sm">Preencha os dados para personalizar seu plano.</p>
            </div>
          </div>

          {/* ─── Etapa 0: Identidade ─── */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputGroup label="Qual seu nome?" placeholder="Ex: Alex" value={profile.name}
                onChange={v => setProfile({ ...profile, name: v })} />
              <InputGroup label="Sua idade" type="number" placeholder="25" value={profile.age.toString()}
                onChange={v => setProfile({ ...profile, age: parseInt(v) || 0 })} />
              <InputGroup label="Sexo" type="select" options={['Masculino', 'Feminino', 'Outro']}
                value={profile.sex || 'Masculino'}
                onChange={v => setProfile({ ...profile, sex: v as any })} />
              <InputGroup label="Nível de Atividade" type="select" options={Object.values(ActivityLevel)}
                value={profile.activityLevel as string}
                onChange={v => setProfile({ ...profile, activityLevel: v as ActivityLevel })} />
            </div>
          )}

          {/* ─── Etapa 1: Antropometria ─── */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputGroup label="Peso Atual (kg)" type="number" placeholder="70.5"
                value={profile.weight.toString()}
                onChange={v => setProfile({ ...profile, weight: parseFloat(v) || 0 })} />
              <InputGroup label="Altura (cm)" type="number" placeholder="175"
                value={profile.height.toString()}
                onChange={v => setProfile({ ...profile, height: parseInt(v) || 0 })} />
              <InputGroup label="Peso Desejado (kg)" type="number" placeholder="65.0"
                value={(profile.targetWeight || 0).toString()}
                onChange={v => setProfile({ ...profile, targetWeight: parseFloat(v) || 0 })} />
              <InputGroup label="Gordura Corporal (%)" type="number" placeholder="15"
                value={(profile.bodyFatPercentage || 0).toString()}
                onChange={v => setProfile({ ...profile, bodyFatPercentage: parseFloat(v) || 0 })} />
            </div>
          )}

          {/* ─── Etapa 2: Objetivos ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <InputGroup label="Nível de Experiência em Treino" type="select"
                options={Object.values(FitnessLevel)}
                value={profile.fitnessLevel as string}
                onChange={v => setProfile({ ...profile, fitnessLevel: v as FitnessLevel })} />
              <InputGroup label="Tipo de Objetivo" type="select"
                options={['Emagrecimento', 'Ganho de massa', 'Condicionamento', 'Saúde', 'Performance']}
                value={profile.structuredGoals[0]?.type || 'Condicionamento'}
                onChange={v => {
                  const newGoals = [...profile.structuredGoals];
                  if (newGoals[0]) newGoals[0] = { ...newGoals[0], type: v };
                  else newGoals.push({ duration: '90 dias', type: v, description: '', numericValue: '' });
                  setProfile({ ...profile, structuredGoals: newGoals });
                }} />
              <div className="p-5 bg-emerald-400/5 border border-emerald-400/20 rounded-3xl">
                <h4 className="font-black italic uppercase text-emerald-400 mb-3 tracking-tighter text-sm">Meta Numérica</h4>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-emerald-400 outline-none"
                  placeholder="Ex: Perder 5kg, correr 5km, ganhar 2kg de massa..."
                  value={profile.structuredGoals[0]?.numericValue || ''}
                  onChange={e => {
                    const newGoals = [...profile.structuredGoals];
                    if (newGoals[0]) newGoals[0] = { ...newGoals[0], numericValue: e.target.value };
                    setProfile({ ...profile, structuredGoals: newGoals });
                  }}
                />
              </div>
              <div className="p-5 bg-white/5 border border-white/5 rounded-3xl">
                <h4 className="font-black italic uppercase text-white mb-3 tracking-tighter text-sm">Descrição do Objetivo (opcional)</h4>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-emerald-400 outline-none min-h-[80px] italic resize-none"
                  placeholder="Ex: Quero emagrecer antes do verão, focando em perder gordura abdominal..."
                  value={profile.structuredGoals[0]?.description || ''}
                  onChange={e => {
                    const newGoals = [...profile.structuredGoals];
                    if (newGoals[0]) newGoals[0] = { ...newGoals[0], description: e.target.value };
                    else newGoals.push({ duration: '90 dias', type: 'Condicionamento', description: e.target.value, numericValue: '' });
                    setProfile({ ...profile, structuredGoals: newGoals });
                  }}
                />
              </div>
            </div>
          )}

          {/* ─── Etapa 3: Disponibilidade ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                  Dias disponíveis para treinar *
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(d => {
                    const selected = profile.availability?.selectedDays?.includes(d.jsDay);
                    return (
                      <button key={d.jsDay} type="button" onClick={() => toggleDay(d.jsDay)}
                        className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all ${
                          selected
                            ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'bg-neutral-900 border border-white/10 text-gray-400 hover:border-emerald-400/30'
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600">
                  {(profile.availability?.selectedDays?.length ?? 0)} dia(s) selecionado(s)
                </p>
              </div>

              {/* NOVA FUNCIONALIDADE: Rotina Muscular por Dia */}
              {(profile.availability?.selectedDays?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                    Grupos musculares por dia (opcional)
                  </label>
                  <p className="text-[10px] text-gray-600">
                    Selecione quais músculos treinar em cada dia. Se não selecionar, a IA decide automaticamente.
                  </p>
                  <div className="space-y-3">
                    {WEEK_DAYS.filter(d => profile.availability?.selectedDays?.includes(d.jsDay)).map(d => (
                      <div key={d.jsDay} className="bg-neutral-900/80 border border-white/5 rounded-2xl p-4">
                        <p className="text-xs font-black uppercase text-emerald-400 mb-3 tracking-widest">{d.full}</p>
                        <div className="flex flex-wrap gap-2">
                          {MUSCLE_GROUPS.map(muscle => {
                            const sel = (muscleRoutine[d.jsDay] || []).includes(muscle);
                            const isTodos = muscle === 'TODOS';
                            return (
                              <button key={muscle} type="button"
                                onClick={() => toggleMuscleForDay(d.jsDay, muscle)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                  sel
                                    ? isTodos ? 'bg-blue-400 text-black' : 'bg-emerald-400 text-black'
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
                          <p className="text-[10px] text-emerald-400/70 mt-2">
                            {(muscleRoutine[d.jsDay] || []).includes('TODOS')
                              ? '★ IA pode usar qualquer grupo muscular'
                              : `✓ ${(muscleRoutine[d.jsDay] || []).join(', ')}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Sessões por dia</label>
                  <p className="text-[10px] text-gray-600 mb-2">Quantas vezes você treina no mesmo dia</p>
                  <select
                    className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-sm font-black text-white appearance-none outline-none focus:border-emerald-400"
                    value={profile.availability?.frequencyPerDay || 1}
                    onChange={e => setProfile({ ...profile, availability: { ...profile.availability, frequencyPerDay: parseInt(e.target.value) } })}
                  >
                    <option value={1}>1 sessão/dia</option>
                    <option value={2}>2 sessões/dia</option>
                    <option value={3}>3 sessões/dia</option>
                  </select>
                </div>
                <InputGroup
                  label="Duração máxima por sessão (min)"
                  type="number" placeholder="60"
                  value={(profile.availability?.timePerSession || 60).toString()}
                  onChange={v => setProfile({ ...profile, availability: { ...profile.availability, timePerSession: parseInt(v) || 60, maxSessionTime: parseInt(v) || 60 } })}
                />
              </div>

              <InputGroup
                label="Mínimo de exercícios por sessão"
                type="number" placeholder="4"
                value={(profile.availability?.minExercisesPerSession || 4).toString()}
                onChange={v => setProfile({ ...profile, availability: { ...profile.availability, minExercisesPerSession: parseInt(v) || 4, minExercisesPerDay: parseInt(v) || 4 } })}
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Local de treino</label>
                <div className="flex flex-wrap gap-2">
                  {['Academia', 'Casa', 'Parque', 'Estúdio', 'Crossfit'].map(loc => {
                    const selected = profile.availability?.locations?.includes(loc);
                    return (
                      <button key={loc} type="button"
                        onClick={() => {
                          const current = profile.availability?.locations || [];
                          const updated = selected ? current.filter(l => l !== loc) : [...current, loc];
                          setProfile({ ...profile, availability: { ...profile.availability, locations: updated } });
                        }}
                        className={`px-3 py-2 rounded-xl font-black uppercase text-xs transition-all ${
                          selected ? 'bg-emerald-400 text-black' : 'bg-neutral-900 border border-white/10 text-gray-400'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(profile.availability?.selectedDays?.length ?? 0) > 0 && (
                <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-4">
                  <p className="text-xs text-emerald-400 font-bold">
                    ✓ {profile.availability.selectedDays.length} dias/semana ·{' '}
                    {profile.availability.frequencyPerDay}x/dia ·{' '}
                    {profile.availability.timePerSession} min/sessão ·{' '}
                    mín. {profile.availability.minExercisesPerSession} exercícios
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    A IA vai montar treinos respeitando esses limites obrigatoriamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Etapa 4: Nutrição ─── */}
          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputGroup label="Refeições por dia" type="number"
                value={(profile.nutrition?.mealsPerDay || 4).toString()}
                onChange={v => setProfile({ ...profile, nutrition: { ...profile.nutrition, mealsPerDay: parseInt(v) || 4 } })} />
              <InputGroup label="Objetivo Nutricional" type="select"
                options={['Emagrecimento', 'Ganho de massa', 'Manutenção', 'Performance']}
                value={profile.nutrition?.objective || 'Condicionamento'}
                onChange={v => setProfile({ ...profile, nutrition: { ...profile.nutrition, objective: v } })} />
              <InputGroup label="Orçamento" type="select"
                options={['Baixo ($)', 'Médio ($$)', 'Alto ($$$)']}
                value={profile.nutrition?.budget || 'Médio ($$)'}
                onChange={v => setProfile({ ...profile, nutrition: { ...profile.nutrition, budget: v } })} />
              <div className="col-span-full space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                  Alergias / Restrições alimentares
                </label>
                <input
                  className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-emerald-400"
                  placeholder="Digite e pressione Enter: ex: Lactose, Glúten..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        setProfile({ ...profile, nutrition: { ...profile.nutrition, allergies: [...(profile.nutrition?.allergies || []), val] } });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.nutrition?.allergies || []).map(a => (
                    <button key={a}
                      onClick={() => setProfile({ ...profile, nutrition: { ...profile.nutrition, allergies: profile.nutrition.allergies.filter(x => x !== a) } })}
                      className="bg-white/5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-gray-400 border border-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      {a} ×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTÕES: sempre visíveis — pb-32 garante espaço acima da nav bar do celular */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all"
            >
              <ChevronLeft size={18} /> Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
              canAdvance()
                ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-xl shadow-emerald-400/20 active:scale-95'
                : 'bg-neutral-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {step === steps.length - 1 ? 'Iniciar Experiência Pulsy' : 'Próxima Etapa'} <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── InputGroup ───────────────────────────────────────────────────────────────
const InputGroup = ({
  label, value, onChange, type = 'text', options, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; options?: string[]; placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{label}</label>
    {type === 'select' ? (
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-sm font-black text-white appearance-none outline-none focus:border-emerald-400 transition-all"
        >
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
      </div>
    ) : (
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-lg font-black italic text-white focus:border-emerald-400 outline-none transition-all"
      />
    )}
  </div>
);
