
import React from 'react';
import { BookOpen, ShieldCheck, Library, Info, ExternalLink, Globe, FileText } from 'lucide-react';
import { WeeklyPlan } from '../types';

interface Props {
  currentPlan: WeeklyPlan | null;
}

export const ReferencesView: React.FC<Props> = ({ currentPlan }) => {
  if (!currentPlan) return null;

  // Extract all unique sources from workouts and meals for a detailed breakdown
  const detailedSources = new Set<string>();
  currentPlan.weeklyPlan.forEach(day => {
    day.workout.forEach(ex => detailedSources.add(ex.source));
    day.nutrition.forEach(meal => {
      meal.options.forEach(opt => detailedSources.add(opt.source));
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Fontes & Referências</h2>
        <p className="text-gray-400">Embasa científica e bibliográfica de todas as prescrições do sistema Nexus Fit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Status */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] flex items-start gap-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Dados Validados</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Cada caloria, macronutriente e exercício foi cruzado com bases de dados globais e diretrizes de saúde atualizadas.
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[40px] flex items-start gap-6">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Globe size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Padrão Internacional</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Utilizamos padrões USDA para nutrição e ACSM para fisiologia do exercício, garantindo precisão técnica.
            </p>
          </div>
        </div>
      </div>

      {/* Main References List */}
      <div className="bg-neutral-900/50 p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <Library className="text-emerald-500" size={24} />
          <h3 className="text-2xl font-black italic tracking-tighter uppercase">Bibliografia Principal</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {currentPlan.references.map((ref, idx) => (
            <div key={idx} className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-start gap-4 group hover:border-emerald-500/30 transition-all">
              <span className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-emerald-500 font-black text-xs">{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-200 font-medium leading-relaxed">{ref}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest flex items-center gap-1">
                    <FileText size={10} /> Documento Oficial
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed sources mapped in current plan */}
      <div className="bg-neutral-900/50 p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-emerald-500" size={24} />
          <h3 className="text-2xl font-black italic tracking-tighter uppercase">Fontes Específicas do Plano</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {Array.from(detailedSources).map((source, idx) => (
            <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{source}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12 text-center">
        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mb-4">Aviso de Responsabilidade Nexus Fit</p>
        <p className="text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
          "As informações fornecidas pela Nexus AI são baseadas em referências bibliográficas de domínio público e diretrizes científicas. 
          Sempre consulte um médico ou profissional de saúde antes de iniciar qualquer programa de exercícios ou dieta restritiva."
        </p>
      </div>
    </div>
  );
};
