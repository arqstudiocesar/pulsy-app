// NutritionView.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  Flame, Activity, TrendingUp, Droplets, Plus, Trash2, Save, Check, Loader2, FileDown
} from 'lucide-react';
import { WeeklyPlan, UserProfile, Meal, MealOption, DayPlan } from '../types';
import { calculateNutrition, calcMaxKcalRecommended } from '../services/aiService';

interface Props {
  profile: UserProfile | null;
  currentPlan: WeeklyPlan | null;
  onUpdatePlan: (plan: WeeklyPlan) => void;
}

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const NutritionView: React.FC<Props> = ({ profile, currentPlan, onUpdatePlan }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  // ─── Dia atual ─────────────────────────────────────────────────────────
  const dayData = useMemo<DayPlan | null>(() => {
    return currentPlan?.weeklyPlan?.[selectedDayIndex] || null;
  }, [currentPlan, selectedDayIndex]);

  // ─── Refeições ordenadas cronologicamente ──────────────────────────────
  // Ordena pelo horário (campo time) para garantir ordem correta na exibição
  const sortedNutrition = useMemo(() => {
    if (!dayData?.nutrition) return [];
    return [...dayData.nutrition].sort((a, b) => {
      // Converte "HH:MM" para minutos para comparar
      const toMin = (t: string) => {
        const [h, m] = (t || '00:00').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      return toMin(a.time) - toMin(b.time);
    });
  }, [dayData]);

  // ─── Totais do dia ─────────────────────────────────────────────────────
  const totals = useMemo(() => {
    if (!dayData?.nutrition) return { kcal: 0, pro: 0, carb: 0, fat: 0 };
    return dayData.nutrition.reduce((acc, meal) => {
      const opt = meal.options?.[meal.selectedOptionIndex ?? 0] ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
      return {
        kcal: acc.kcal + (opt.calories || 0),
        pro:  acc.pro  + (opt.protein  || 0),
        carb: acc.carb + (opt.carbs    || 0),
        fat:  acc.fat  + (opt.fats     || 0)
      };
    }, { kcal: 0, pro: 0, carb: 0, fat: 0 });
  }, [dayData]);

  // ─── Totais semanais ───────────────────────────────────────────────────
  const weeklyTotals = useMemo(() => {
    if (!currentPlan?.weeklyPlan) return DAYS.map(() => ({ kcal: 0, pro: 0, carb: 0, fat: 0 }));
    return currentPlan.weeklyPlan.map(day =>
      (day.nutrition || []).reduce((acc, meal) => {
        const opt = meal.options?.[meal.selectedOptionIndex ?? 0] ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
        return {
          kcal: acc.kcal + (opt.calories || 0),
          pro:  acc.pro  + (opt.protein  || 0),
          carb: acc.carb + (opt.carbs    || 0),
          fat:  acc.fat  + (opt.fats     || 0)
        };
      }, { kcal: 0, pro: 0, carb: 0, fat: 0 })
    );
  }, [currentPlan]);

  // TÓPICO 6: Kcal máxima recomendada
  const maxKcal = calcMaxKcalRecommended(profile, currentPlan);

  // TÓPICO 8: Exportar PDF do plano alimentar
  const exportPDF = () => {
    if (!currentPlan) return;
    const lines: string[] = [];
    lines.push('PLANO ALIMENTAR SEMANAL — PULSY AI');
    lines.push('='.repeat(50));
    lines.push('');
    const DAYS_LABEL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    currentPlan.weeklyPlan.forEach((day, i) => {
      lines.push(`DIA: ${DAYS_LABEL[i] || day.day}`);
      lines.push('-'.repeat(40));
      if (!day.nutrition || day.nutrition.length === 0) {
        lines.push('  Sem refeições configuradas.');
      } else {
        day.nutrition.forEach(meal => {
          const opt = meal.options?.[meal.selectedOptionIndex ?? 0];
          lines.push(`  [${meal.time}] ${meal.mealName}`);
          if (opt) {
            lines.push(`    Alimento: ${opt.food}`);
            lines.push(`    Porção:   ${opt.portion}`);
            lines.push(`    Calorias: ${opt.calories} kcal  |  Prot: ${opt.protein}g  |  Carb: ${opt.carbs}g  |  Gord: ${opt.fats}g`);
          }
        });
      }
      lines.push('');
    });
    lines.push(`Kcal Máxima Recomendada: ${maxKcal} kcal/dia`);
    lines.push('');
    lines.push('Gerado por Pulsy AI — Inteligência Fitness');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano-alimentar-pulsy.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clonePlan = (): WeeklyPlan => JSON.parse(JSON.stringify(currentPlan));

  const saveChanges = () => {
    if (!currentPlan) return;
    onUpdatePlan(clonePlan());
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  // ─── Atualizar nome do alimento → recalcular ───────────────────────────
  const handleFoodNameBlur = async (mealIdx: number, optIdx: number, newName: string, portion: string) => {
    if (!currentPlan || !newName.trim()) return;
    const key = `${mealIdx}-${optIdx}`;
    setLoadingItems(prev => new Set(prev).add(key));
    const nutrition = await calculateNutrition(newName, portion);
    const newPlan = clonePlan();
    const opt = newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].options[optIdx];
    newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].options[optIdx] = { ...opt, food: newName, ...nutrition };
    onUpdatePlan(newPlan);
    setLoadingItems(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  // ─── Atualizar porção → recalcular ────────────────────────────────────
  const handlePortionBlur = async (mealIdx: number, optIdx: number, newPortion: string, food: string) => {
    if (!currentPlan || !newPortion.trim()) return;
    const key = `portion-${mealIdx}-${optIdx}`;
    setLoadingItems(prev => new Set(prev).add(key));
    const nutrition = await calculateNutrition(food, newPortion);
    const newPlan = clonePlan();
    const opt = newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].options[optIdx];
    newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].options[optIdx] = { ...opt, portion: newPortion, ...nutrition };
    onUpdatePlan(newPlan);
    setLoadingItems(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  // ─── Selecionar opção ──────────────────────────────────────────────────
  const selectOption = (mealIdx: number, optIdx: number) => {
    if (!currentPlan) return;
    const newPlan = clonePlan();
    newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].selectedOptionIndex = optIdx;
    onUpdatePlan(newPlan);
  };

  // ─── Adicionar refeição ────────────────────────────────────────────────
  const addMeal = () => {
    if (!currentPlan) return;
    const newPlan = clonePlan();
    newPlan.weeklyPlan[selectedDayIndex].nutrition.push({
      id: `meal-${Date.now()}`,
      mealName: 'Nova Refeição',
      time: '12:00',
      selectedOptionIndex: 0,
      options: [
        { id: `opt-a-${Date.now()}`, food: 'Opção 1', portion: '1 porção', calories: 0, protein: 0, carbs: 0, fats: 0, source: 'Manual' },
        { id: `opt-b-${Date.now()}`, food: 'Opção 2', portion: '1 porção', calories: 0, protein: 0, carbs: 0, fats: 0, source: 'Manual' },
        { id: `opt-c-${Date.now()}`, food: 'Opção 3', portion: '1 porção', calories: 0, protein: 0, carbs: 0, fats: 0, source: 'Manual' },
      ]
    });
    onUpdatePlan(newPlan);
  };

  // ─── Remover refeição ──────────────────────────────────────────────────
  const removeMeal = (mealIdx: number) => {
    if (!currentPlan) return;
    const newPlan = clonePlan();
    newPlan.weeklyPlan[selectedDayIndex].nutrition.splice(mealIdx, 1);
    onUpdatePlan(newPlan);
  };

  // ─── Adicionar opção (garante mínimo 3) ───────────────────────────────
  const addOption = (mealIdx: number) => {
    if (!currentPlan) return;
    const newPlan = clonePlan();
    newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx].options.push({
      id: `opt-${Date.now()}`,
      food: 'Nova opção',
      portion: '1 porção',
      calories: 0, protein: 0, carbs: 0, fats: 0, source: 'Manual'
    });
    onUpdatePlan(newPlan);
  };

  // ─── Remover opção ────────────────────────────────────────────────────
  const removeOption = (mealIdx: number, optIdx: number) => {
    if (!currentPlan) return;
    const newPlan = clonePlan();
    const meal = newPlan.weeklyPlan[selectedDayIndex].nutrition[mealIdx];
    if (meal.options.length <= 1) return; // mantém mínimo de 1
    meal.options.splice(optIdx, 1);
    if ((meal.selectedOptionIndex || 0) >= meal.options.length) {
      meal.selectedOptionIndex = Math.max(0, meal.options.length - 1);
    }
    onUpdatePlan(newPlan);
  };

  return (
    <div className="space-y-8 overflow-y-auto pb-20">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-400">Bio-Nutrição</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} title="Exportar PDF"
            className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-all"
          >
            <FileDown size={18} className="text-blue-400" />
          </button>
          <button onClick={saveChanges}
            className="bg-emerald-400 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-400/20 text-sm">
            {saveFeedback ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> Salvar Plano</>}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
        <p className="text-xs text-blue-400 font-bold">
          ℹ️ Cada refeição tem pelo menos 3 opções geradas pela IA. Selecione a preferida — os macros do Painel atualizam automaticamente.
        </p>
      </div>

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
        {DAYS.map((day, idx) => (
          <button key={day} onClick={() => setSelectedDayIndex(idx)}
            className={`px-5 py-2.5 rounded-full font-black uppercase text-xs whitespace-nowrap flex-shrink-0 transition-all ${
              selectedDayIndex === idx ? 'bg-emerald-400 text-black' : 'bg-neutral-900/40 text-gray-400'
            }`}>
            {day}
          </button>
        ))}
      </div>

      {/* ─── VISÃO DIÁRIA ─────────────────────────────────────────────────── */}
      {view === 'daily' && (
        <div className="space-y-6">
          {/* Macros do dia */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MacroMini label="Kcal"        val={Math.round(totals.kcal)}       icon={<Flame      className="w-5 h-5 text-orange-400" />} color="text-orange-400" />
            <MacroMini label="Proteína"    val={`${Math.round(totals.pro)}g`}  icon={<Activity   className="w-5 h-5 text-blue-400"   />} color="text-blue-400" />
            <MacroMini label="Carboidratos" val={`${Math.round(totals.carb)}g`} icon={<TrendingUp className="w-5 h-5 text-yellow-400" />} color="text-yellow-400" />
            <MacroMini label="Gorduras"    val={`${Math.round(totals.fat)}g`}  icon={<Droplets   className="w-5 h-5 text-red-400"    />} color="text-red-400" />
          </div>
          {/* TÓPICO 6: Kcal máxima recomendada */}
          {maxKcal > 0 && (
            <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border ${
              totals.kcal > maxKcal
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-emerald-400/5 border-emerald-400/20'
            }`}>
              <div className="flex items-center gap-2">
                <Flame size={16} className={totals.kcal > maxKcal ? 'text-red-400' : 'text-emerald-400'} />
                <span className="text-xs font-bold text-gray-400">Kcal hoje: <strong className="text-white">{Math.round(totals.kcal)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Kcal Máx. Recomendada:</span>
                <span className={`text-sm font-black ${totals.kcal > maxKcal ? 'text-red-400' : 'text-emerald-400'}`}>{maxKcal} kcal</span>
                {totals.kcal > maxKcal && <span className="text-[10px] text-red-400 font-black">⚠ Acima do limite</span>}
              </div>
            </div>
          )}

          {(dayData?.nutrition?.length ?? 0) === 0 ? (
            <div className="bg-neutral-900/40 p-10 rounded-3xl border border-white/5 text-center">
              <p className="text-gray-500 font-bold">Nenhuma refeição configurada para este dia.</p>
            </div>
          ) : (
            // Exibe refeições em ordem cronológica (por horário)
            sortedNutrition.map((meal) => {
              // Busca o índice original para manter mutações corretas
              const mIdx = dayData!.nutrition.findIndex(m => m.id === meal.id);
              return (
                <MealCard
                  key={`d${selectedDayIndex}-${mIdx}-${meal.id}`}
                  meal={meal}
                  mealIdx={mIdx}
                  loadingItems={loadingItems}
                  onSelectOption={selectOption}
                  onRemoveMeal={removeMeal}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                  onFoodNameBlur={handleFoodNameBlur}
                  onPortionBlur={handlePortionBlur}
                />
              );
            })
          )}

          <button onClick={addMeal}
            className="w-full py-4 border border-dashed border-white/10 rounded-3xl text-gray-500 font-black uppercase text-xs tracking-widest hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Adicionar Refeição
          </button>
        </div>
      )}

      {/* ─── VISÃO SEMANAL ────────────────────────────────────────────────── */}
      {view === 'weekly' && (
        <div className="space-y-4">
          {DAYS.map((day, idx) => {
            const t = weeklyTotals[idx];
            const dayMeals = currentPlan?.weeklyPlan?.[idx]?.nutrition || [];
            return (
              <div key={day}
                className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 cursor-pointer hover:border-emerald-400/30 transition-all"
                onClick={() => { setSelectedDayIndex(idx); setView('daily'); }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black uppercase tracking-wide">{day}</h3>
                  <span className="text-xs text-emerald-400 font-bold">{dayMeals.length} refeições</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <MacroMini label="Kcal" val={Math.round(t.kcal)} icon={<Flame      className="w-4 h-4 text-orange-400" />} color="text-orange-400" compact />
                  <MacroMini label="Prot" val={`${Math.round(t.pro)}g`} icon={<Activity   className="w-4 h-4 text-blue-400"   />} color="text-blue-400"   compact />
                  <MacroMini label="Carb" val={`${Math.round(t.carb)}g`} icon={<TrendingUp className="w-4 h-4 text-yellow-400" />} color="text-yellow-400" compact />
                  <MacroMini label="Gord" val={`${Math.round(t.fat)}g`} icon={<Droplets   className="w-4 h-4 text-red-400"    />} color="text-red-400"    compact />
                </div>
                {dayMeals.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {dayMeals.map(m => {
                      const selected = m.options?.[m.selectedOptionIndex ?? 0];
                      return selected ? (
                        <div key={`wk${idx}-${m.id}`} className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-bold">{m.mealName}</span>
                          <span>{selected.food} — {selected.portion}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {saveFeedback && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-emerald-400 text-black px-8 py-4 rounded-full font-black uppercase shadow-2xl z-50 flex items-center gap-2">
          <Check size={20} /> Plano Nutricional Salvo!
        </div>
      )}
    </div>
  );
};

// ─── MealCard ────────────────────────────────────────────────────────────────
interface MealCardProps {
  meal: Meal; mealIdx: number; loadingItems: Set<string>;
  onSelectOption: (m: number, o: number) => void;
  onRemoveMeal: (m: number) => void;
  onAddOption: (m: number) => void;
  onRemoveOption: (m: number, o: number) => void;
  onFoodNameBlur: (m: number, o: number, name: string, portion: string) => void;
  onPortionBlur: (m: number, o: number, portion: string, food: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({
  meal, mealIdx, loadingItems,
  onSelectOption, onRemoveMeal, onAddOption, onRemoveOption,
  onFoodNameBlur, onPortionBlur
}) => {
  const foodRefs    = useRef<Record<string, HTMLInputElement | null>>({});
  const portionRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-gray-600 bg-black/40 px-3 py-1.5 rounded-lg">{meal.time}</span>
          <h3 className="font-black italic text-xl text-white uppercase tracking-tight">{meal.mealName}</h3>
          <span className="text-[10px] text-gray-600 font-bold">
            {meal.options?.length || 0} opções
          </span>
        </div>
        <button onClick={() => onRemoveMeal(mealIdx)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Opções */}
      <div className="space-y-3">
        {meal.options?.map((opt, oIdx) => {
          const isSelected = meal.selectedOptionIndex === oIdx;
          const keyFood    = `${mealIdx}-${oIdx}`;
          const keyPortion = `portion-${mealIdx}-${oIdx}`;
          const isLoadingFood    = loadingItems.has(keyFood);
          const isLoadingPortion = loadingItems.has(keyPortion);

          return (
            <div key={`m${mealIdx}-o${oIdx}-${opt.id}`}
              className={`relative p-4 rounded-2xl border transition-all ${
                isSelected ? 'bg-emerald-400/5 border-emerald-400/30' : 'bg-black/30 border-white/5 hover:border-white/15'
              }`}>
              <div className="flex items-start gap-3">
                {/* Botão de seleção */}
                <button onClick={() => onSelectOption(mealIdx, oIdx)}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-gray-600 hover:border-emerald-400'
                  }`}>
                  {isSelected && <Check size={10} className="text-black" />}
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Nome */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={el => { foodRefs.current[keyFood] = el; }}
                      className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm focus:text-emerald-400 placeholder:text-gray-600 min-w-0"
                      defaultValue={opt.food}
                      placeholder="Nome do alimento..."
                      onBlur={e => {
                        const portion = portionRefs.current[keyPortion]?.value || opt.portion;
                        onFoodNameBlur(mealIdx, oIdx, e.target.value, portion);
                      }}
                    />
                    {isLoadingFood && <Loader2 size={14} className="animate-spin text-emerald-400 flex-shrink-0" />}
                  </div>

                  {/* Porção */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={el => { portionRefs.current[keyPortion] = el; }}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-medium outline-none focus:border-emerald-400/50 focus:text-white transition-all w-40"
                      defaultValue={opt.portion}
                      placeholder="ex: 100g, 1 xícara..."
                      onBlur={e => {
                        const food = foodRefs.current[keyFood]?.value || opt.food;
                        onPortionBlur(mealIdx, oIdx, e.target.value, food);
                      }}
                    />
                    {isLoadingPortion && <Loader2 size={14} className="animate-spin text-emerald-400" />}
                  </div>

                  {/* Macros */}
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                    <span className="text-orange-400 flex items-center gap-1"><Flame size={9} /> {opt.calories} kcal</span>
                    <span className="text-blue-400   flex items-center gap-1"><Activity   size={9} /> {opt.protein}g prot</span>
                    <span className="text-yellow-400 flex items-center gap-1"><TrendingUp size={9} /> {opt.carbs}g carb</span>
                    <span className="text-red-400    flex items-center gap-1"><Droplets   size={9} /> {opt.fats}g gord</span>
                  </div>
                </div>

                {/* Remover opção */}
                <button onClick={() => onRemoveOption(mealIdx, oIdx)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adicionar opção */}
      <button onClick={() => onAddOption(mealIdx)}
        className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
        <Plus size={13} /> Adicionar Opção
      </button>
    </div>
  );
};

// ─── MacroMini ────────────────────────────────────────────────────────────────
const MacroMini = ({ label, val, icon, color, compact = false }: {
  label: string; val: string | number; icon: React.ReactNode; color: string; compact?: boolean;
}) => (
  <div className={`bg-neutral-900/40 rounded-2xl border border-white/5 flex items-center gap-3 ${compact ? 'p-3' : 'p-4'}`}>
    <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-black/40 rounded-xl flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-gray-600 uppercase truncate">{label}</p>
      <p className={`font-black italic leading-none ${compact ? 'text-lg' : 'text-2xl'} ${color}`}>{val}</p>
    </div>
  </div>
);
