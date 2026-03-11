// services/aiService.ts — Pulsy AI v7
//
// CORRECOES v6:
//   TOPICO 1: Duracao por sessao aplicada individualmente (nao dividida entre sessoes)
//   TOPICO 1: Multiplas sessoes do mesmo dia tem exercicios DIFERENTES (diversidade muscular)
//   TOPICO 2: Modalidades de preferencia passadas para o prompt da IA
//   TOPICO 5: Prioridade de refeicoes: Cafe > Almoco > Janta > Lanche Tarde > Lanche Manha > Ceia
//   TOPICO 6: Funcao calcMaxKcalRecommended exportada
//
// ESTRATEGIA:
//   Cada chamada gera UMA coisa pequena:
//     Workout de 1 sessao  -> ~500-700 tokens de saida  (4-8 exercicios)
//     Nutricao de 1 dia    -> ~600-800 tokens de saida
//   Multiplas sessoes do mesmo dia = multiplas chamadas separadas
//
// MODELOS ATIVOS na Groq (2025/2026):
//   llama-3.1-8b-instant  -> principal
//   llama3-8b-8192        -> fallback 1
//   llama-3.3-70b-versatile -> fallback 2

import { UserProfile, WeeklyPlan, DayPlan, Exercise, Meal } from '../types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'llama-3.3-70b-versatile',
];

// --- API Key ------------------------------------------------------------------
function getKey(): string {
  try {
    // Prioridade 1: Variável de ambiente do Vite (Vercel injeta isso)
    if (import.meta.env.VITE_GROQ_API_KEY) {
      return import.meta.env.VITE_GROQ_API_KEY;
    }

    // Prioridade 2: Variável global (opcional, raramente usada)
    if (typeof window !== 'undefined') {
      const w = (window as any).GROQ_API_KEY;
      if (w) return w;
    }

    // Prioridade 3: localStorage (fallback para chave pessoal do usuário)
    const ls = localStorage.getItem('GROQ_API_KEY');
    if (ls) return ls;
  } catch { /* ignore */ }

  return '';  // Sem chave → modal aparece
}

// --- Cache --------------------------------------------------------------------
function hashProfile(p: UserProfile): string {
  const s = JSON.stringify({
    n: p.name, a: p.age, s: p.sex, w: p.weight, h: p.height,
    tw: p.targetWeight, bf: p.bodyFatPercentage,
    fl: p.fitnessLevel, al: p.activityLevel,
    av: p.availability, nu: p.nutrition,
    g: p.structuredGoals?.map(g => `${g.type}${g.numericValue}${g.duration}`).join(',')
  });
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `${h}`;
}
const CP = 'pulsy_plan_';
function getCached(uid: string, hash: string): WeeklyPlan | null {
  try {
    const r = localStorage.getItem(CP + uid);
    if (!r) return null;
    const { h, p } = JSON.parse(r);
    return h === hash ? (p as WeeklyPlan) : null;
  } catch { return null; }
}
function setCached(uid: string, hash: string, plan: WeeklyPlan) {
  try { localStorage.setItem(CP + uid, JSON.stringify({ h: hash, p: plan })); } catch { /* ignore */ }
}
export function clearPlanCache(uid: string) {
  try { localStorage.removeItem(CP + uid); } catch { /* ignore */ }
}

// --- Utilitarios --------------------------------------------------------------
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function parseRestSec(rest: string): number {
  const m = rest.match(/(\d+)/); return m ? parseInt(m[1]) : 40;
}
export function calcSessionTime(exercises: Exercise[]): number {
  if (!exercises?.length) return 0;
  let t = 0;
  for (const ex of exercises) {
    const sets = ex.sets || 3;
    const rs = parseRestSec(ex.rest || '40s');
    t += sets * (40 / 60) + (sets - 1) * (rs / 60);
  }
  return t + (exercises.length - 1) * (45 / 60);
}
export function calcMaxExercises(minutes: number, min = 4): number {
  return Math.max(Math.floor(minutes / 7), min);
}

// --- Chamada Groq -------------------------------------------------------------
async function callGroq(
  userMsg: string,
  sysMsg: string,
  maxOut: number,
  mIdx = 0,
  attempt = 0
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('Chave Groq nao configurada. Clique em no cabecalho.');

  const model = MODELS[Math.min(mIdx, MODELS.length - 1)];
  console.log(`[Pulsy AI] ${model} maxOut=${maxOut} attempt=${attempt + 1}`);

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: maxOut, temperature: 0.2,
        messages: [
          { role: 'system', content: sysMsg },
          { role: 'user',   content: userMsg }
        ]
      })
    });
  } catch {
    if (attempt < 2) { await sleep(3000); return callGroq(userMsg, sysMsg, maxOut, mIdx, attempt + 1); }
    throw new Error('Sem conexao. Verifique sua internet.');
  }

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    console.warn(`[Pulsy AI] HTTP ${res.status} ${model}: ${body.substring(0, 250)}`);

    if (res.status === 400 && body.includes('decommissioned')) {
      const next = mIdx + 1;
      if (next < MODELS.length) { await sleep(500); return callGroq(userMsg, sysMsg, maxOut, next, 0); }
      throw new Error('Modelos Groq indisponiveis. Tente novamente mais tarde.');
    }
    if (res.status === 429) {
      const match = body.match(/try again in ([\d.]+)s/i);
      const waitSec = match ? Math.ceil(parseFloat(match[1])) + 1 : 8;
      const next = mIdx + 1;
      if (next < MODELS.length) {
        console.warn(`[Pulsy AI] Rate limit -> ${MODELS[next]} apos ${waitSec}s`);
        await sleep(waitSec * 1000);
        return callGroq(userMsg, sysMsg, maxOut, next, 0);
      }
      console.warn(`[Pulsy AI] Todos em rate limit. Aguardando ${waitSec}s...`);
      await sleep(waitSec * 1000);
      if (attempt < 5) return callGroq(userMsg, sysMsg, maxOut, 0, attempt + 1);
      throw new Error(`Rate limit. Aguarde alguns segundos e tente novamente.`);
    }
    if (res.status === 401) throw new Error('Chave de API invalida. Verifique sua GROQ_API_KEY.');
    if (res.status === 503 && attempt < 2) { await sleep(5000); return callGroq(userMsg, sysMsg, maxOut, mIdx, attempt + 1); }
    throw new Error(`Erro Groq HTTP ${res.status}. Tente novamente.`);
  }

  let data: any;
  try { data = await res.json(); } catch { throw new Error('Resposta invalida da API.'); }

  const content = data?.choices?.[0]?.message?.content || '';
  if (!content) {
    if (attempt < 2) { await sleep(2000); return callGroq(userMsg, sysMsg, maxOut, mIdx, attempt + 1); }
    throw new Error('IA retornou resposta vazia. Tente novamente.');
  }
  return content;
}

// --- Sanitizacao de JSON (CORRECAO: Bad control character) --------------------
// Problema: a IA retorna quebras de linha REAIS dentro de strings JSON.
// Exemplo errado:  "instructions":"passo 1
//                  passo 2"
// Correto:         "instructions":"passo 1\npasso 2"
// Esta funcao sanitiza a resposta ANTES de chamar JSON.parse.
function sanitizeJSONString(raw: string): string {
  // Remove markdown code fences
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Extrai apenas o bloco JSON (objeto ou array)
  const fb = s.indexOf('{'); const fl = s.indexOf('[');
  let start = -1;
  if (fb !== -1 && (fl === -1 || fb < fl)) start = fb;
  else if (fl !== -1) start = fl;
  if (start > 0) s = s.substring(start);
  const lb = s.lastIndexOf('}'); const ll = s.lastIndexOf(']');
  const end = Math.max(lb, ll);
  if (end > 0 && end < s.length - 1) s = s.substring(0, end + 1);

  // Remove trailing commas antes de } ou ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // CORRECAO PRINCIPAL: substitui quebras de linha REAIS dentro de strings JSON
  // por \n escapado. Processa char a char para ser preciso.
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      // Substitui caracteres de controle invalidos dentro de strings
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
      // Remove outros caracteres de controle (0x00-0x1F exceto os ja tratados)
      const code = ch.charCodeAt(0);
      if (code < 0x20) { continue; }
    }
    result += ch;
  }
  return result;
}

// --- Parser JSON robusto com sanitizacao ------------------------------------
function parseJSON<T>(raw: string, ctx: string): T {
  const s = sanitizeJSONString(raw);
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    console.error(`[Pulsy AI] JSON error (${ctx}):`, e);
    console.error(`[Pulsy AI] Raw original (600):`, raw.substring(0, 600));
    console.error(`[Pulsy AI] Sanitizado (600):`, s.substring(0, 600));
    throw new Error(`JSON invalido (${ctx}).`);
  }
}

// ---------------------------------------------------------------------------
// TOPICO 1 - CORRECAO: Gera workout para UMA SESSAO especifica
// Cada sessao recebe a duracao COMPLETA (nao dividida entre sessoes).
// sessionIdx e totalSessions permitem a IA gerar exercicios com grupos
// musculares DIFERENTES entre sessoes do mesmo dia.
// ---------------------------------------------------------------------------
async function genWorkoutSession(
  day: string,
  profile: UserProfile,
  sessionIdx: number,
  totalSessions: number
): Promise<Exercise[]> {
  const av  = profile.availability;
  // CORRECAO TOPICO 1: usa timePerSession COMPLETO para CADA sessao individualmente
  const tps = av.timePerSession || av.maxSessionTime || 60;
  const min = av.minExercisesPerSession || av.minExercisesPerDay || 4;
  const max = calcMaxExercises(tps, min);
  const gol = profile.structuredGoals?.[0];
  const obj = gol?.type || 'Condicionamento';
  const loc = av.locations?.join('/') || 'Academia';
  const nivel = profile.fitnessLevel || 'Iniciante';

  // TOPICO 2: inclui preferencias de modalidade no prompt
  const modPrefs = av.modalities?.length ? av.modalities.join(', ') : null;
  const prefText = modPrefs ? `Priorizar modalidades: ${modPrefs}.` : '';

  // TOPICO 1: instrucao de diversidade muscular entre sessoes
  let sessionContext = '';
  if (totalSessions > 1) {
    const sessionLabels: Record<number, string> = {
      0: 'primeira sessao do dia (foco em membros superiores ou empurrao/tracao)',
      1: 'segunda sessao do dia (foco em membros inferiores ou core/cardio)',
      2: 'terceira sessao do dia (foco em core, mobilidade ou cardio)'
    };
    sessionContext = `Esta eh a ${sessionLabels[sessionIdx] || `sessao ${sessionIdx + 1}`} de ${totalSessions} sessoes neste dia. OBRIGATORIO: use grupos musculares DIFERENTES das outras sessoes para garantir diversidade de estimulos.`;
  }

  const sys = `Personal trainer especializado. Responda APENAS com array JSON valido. Sem markdown. Sem texto fora do JSON.`;

  const prompt = `Treino para "${day}" - Sessao ${sessionIdx + 1}/${totalSessions}.
Perfil: ${profile.name}, ${profile.age}a, ${profile.weight}kg, nivel ${nivel}, objetivo ${obj}, local ${loc}.
${prefText}
Regras: entre ${min} e ${max} exercicios, duracao maxima ${tps} minutos POR SESSAO.
${sessionContext}

Responda APENAS com este formato (array direto, sem chave extra):
[{"id":"e1","name":"Agachamento Livre","sets":3,"reps":"10-12","rest":"60s","muscleGroup":"Quadriceps","category":"Forca","difficulty":"${nivel}","instructions":"Pes na largura dos ombros, desca ate 90 graus.","kcalEstimate":65,"source":"Pulsy AI"}]`;

  const raw = await callGroq(prompt, sys, 900);
  let arr: any[];
  try {
    let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const fi = s.indexOf('[');
    const li = s.lastIndexOf(']');
    if (fi !== -1 && li > fi) {
      s = s.substring(fi, li + 1);
      s = s.replace(/,(\s*[}\]])/g, '$1');
      arr = JSON.parse(s);
    } else {
      const obj2 = parseJSON<any>(raw, `workout-${day}-s${sessionIdx}`);
      arr = obj2.workout || obj2.exercises || obj2;
    }
  } catch {
    console.warn(`[Pulsy AI] workout ${day} sessao ${sessionIdx} parse falhou, usando vazio`);
    arr = [];
  }
  return (Array.isArray(arr) ? arr : []).map((ex: any, i: number) => ({
    ...ex,
    id: ex.id || `${day.substring(0, 3)}-s${sessionIdx}-e${i}-${Date.now()}`,
    sets: ex.sets || 3,
    reps: ex.reps || '10-12',
    rest: ex.rest || '60s',
  }));
}

// --- genMeals ----------------------------------------------------------------
async function genMeals(
  day: string,
  profile: UserProfile,
  mealSlots: Array<{ name: string; time: string }>,
  idx: number
): Promise<Meal[]> {
  const alg = profile.nutrition?.allergies?.join(', ') || 'nenhuma';
  const obj = profile.structuredGoals?.[0]?.type || profile.nutrition?.objective || 'Condicionamento';
  const nivel = profile.fitnessLevel || 'Iniciante';

  const mealList = mealSlots.map(m => `"${m.name}" as ${m.time}`).join(', ');

  const sys = `Nutricionista esportivo. Responda APENAS com array JSON valido. Sem markdown. Sem texto fora do JSON.`;

  const prompt = `Plano alimentar para ${day}, perfil: ${profile.name}, ${profile.weight}kg, ${nivel}, objetivo ${obj}.
Refeicoes: ${mealList}. Sem: ${alg}.
REGRA OBRIGATORIA: EXATAMENTE 3 opcoes por refeicao.

Formato (array direto):
[{"id":"m${idx}","mealName":"${mealSlots[0].name}","time":"${mealSlots[0].time}","selectedOptionIndex":0,"options":[{"id":"m${idx}o1","food":"Ovo mexido com pao integral","portion":"2 ovos + 2 fatias","calories":320,"protein":22,"carbs":30,"fats":12,"source":"Pulsy AI"},{"id":"m${idx}o2","food":"Iogurte grego com granola","portion":"200g + 30g","calories":290,"protein":18,"carbs":35,"fats":8,"source":"Pulsy AI"},{"id":"m${idx}o3","food":"Vitamina de banana com whey","portion":"300ml","calories":310,"protein":25,"carbs":40,"fats":5,"source":"Pulsy AI"}]}]`;

  const raw = await callGroq(prompt, sys, 1200);
  let arr: any[];
  try {
    let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const fi = s.indexOf('[');
    const li = s.lastIndexOf(']');
    if (fi !== -1 && li > fi) {
      s = s.substring(fi, li + 1);
      s = s.replace(/,(\s*[}\]])/g, '$1');
      arr = JSON.parse(s);
    } else {
      const obj2 = parseJSON<any>(raw, `meals-${day}`);
      arr = obj2.nutrition || obj2.meals || obj2;
    }
  } catch {
    console.warn(`[Pulsy AI] meals ${day} parse falhou, usando padrao`);
    arr = [];
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    return mealSlots.map((slot, si) => ({
      id: `${day}-m${idx + si}`,
      mealName: slot.name,
      time: slot.time,
      selectedOptionIndex: 0,
      options: [
        { id: `${day}-m${idx + si}-o1`, food: 'Frango grelhado com arroz', portion: '150g + 4 colheres', calories: 380, protein: 35, carbs: 42, fats: 8, source: 'Pulsy AI' },
        { id: `${day}-m${idx + si}-o2`, food: 'Atum com batata doce', portion: '120g + 200g', calories: 350, protein: 30, carbs: 45, fats: 6, source: 'Pulsy AI' },
        { id: `${day}-m${idx + si}-o3`, food: 'Ovos mexidos com aveia', portion: '3 ovos + 50g', calories: 320, protein: 25, carbs: 30, fats: 12, source: 'Pulsy AI' },
      ]
    }));
  }

  return arr.map((m: any, si: number) => ({
    ...m,
    id: m.id || `${day}-m${idx + si}`,
    mealName: m.mealName || mealSlots[si]?.name || `Refeicao ${idx + si + 1}`,
    time: m.time || mealSlots[si]?.time || '12:00',
    selectedOptionIndex: m.selectedOptionIndex ?? 0,
    options: ((m.options || []) as any[]).map((o: any, oi: number) => ({
      ...o,
      id: o.id || `${day}-m${idx + si}-o${oi + 1}`,
      calories: o.calories || 250,
      protein:  o.protein  || 15,
      carbs:    o.carbs    || 25,
      fats:     o.fats     || 8,
    }))
  }));
}

// ---------------------------------------------------------------------------
// GERACAO PRINCIPAL
// TOPICO 1: Cada sessao tem duracao COMPLETA e exercicios DIFERENTES
// TOPICO 5: Refeicoes seguem ordem de prioridade correta
// ---------------------------------------------------------------------------
export async function generatePlan(
  profile: UserProfile,
  userId = 'default',
  forceRegenerate = false
): Promise<WeeklyPlan> {

  const hash = hashProfile(profile);
  if (!forceRegenerate) {
    const cached = getCached(userId, hash);
    if (cached) { console.log('[Pulsy AI] Plano do cache.'); return cached; }
  }

  const av  = profile.availability;
  const sel = av.selectedDays || [1, 3, 5];
  const fpd = av.frequencyPerDay || 1;
  const mPD = profile.nutrition?.mealsPerDay || 4;

  // TOPICO 5: Prioridade correta das refeicoes
  // Ordem: 1-Cafe, 2-Almoco, 3-Janta, 4-Lanche Tarde, 5-Lanche Manha, 6-Ceia
  const MEALS_PRIORITY = [
    { name: 'Cafe da Manha',    time: '07:00' },
    { name: 'Almoco',           time: '12:30' },
    { name: 'Jantar',           time: '19:30' },
    { name: 'Lanche da Tarde',  time: '16:00' },
    { name: 'Lanche da Manha',  time: '10:00' },
    { name: 'Ceia',             time: '21:30' },
  ];
  const mealSlots = MEALS_PRIORITY.slice(0, Math.min(mPD, MEALS_PRIORITY.length));

  const ORDER = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];
  const ORDER_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const DAY_JS: Record<string, number> = {
    'Segunda': 1, 'Terça': 2, 'Quarta': 3,
    'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0
  };

  const days: DayPlan[] = [];

  for (let i = 0; i < ORDER_PT.length; i++) {
    const dayName    = ORDER_PT[i];
    const isTraining = sel.includes(DAY_JS[dayName]);

    console.log(`[Pulsy AI] Gerando ${dayName} (treino=${isTraining}, sessoes=${isTraining ? fpd : 0})...`);

    if (i > 0) await sleep(3000);

    // TOPICO 1: Gera cada sessao separadamente com duracao COMPLETA
    let sessions: Exercise[][] = [];
    let workout: Exercise[] = [];

    if (isTraining) {
      for (let sIdx = 0; sIdx < fpd; sIdx++) {
        if (sIdx > 0) await sleep(2500);
        for (let t = 0; t < 3; t++) {
          try {
            // CORRECAO: cada sessao recebe timePerSession COMPLETO (nao dividido)
            const sessionExercises = await genWorkoutSession(dayName, profile, sIdx, fpd);
            if (sessionExercises.length > 0) {
              sessions.push(sessionExercises);
              workout.push(...sessionExercises);
              break;
            }
          } catch (e: any) {
            console.warn(`[Pulsy AI] workout ${dayName} sessao ${sIdx} tentativa ${t + 1}:`, e.message);
            if (t < 2) await sleep(6000);
          }
        }
        if (sessions.length <= sIdx) sessions.push([]);
      }
    }

    await sleep(2500);

    // Nutricao
    let nutrition: Meal[] = [];
    for (let g = 0; g < mealSlots.length; g += 2) {
      const chunk  = mealSlots.slice(g, g + 2);
      if (g > 0) await sleep(2500);
      for (let t = 0; t < 3; t++) {
        try {
          const meals = await genMeals(dayName, profile, chunk, g);
          nutrition.push(...meals);
          break;
        } catch (e: any) {
          console.warn(`[Pulsy AI] meals ${dayName}[${g}] tentativa ${t + 1}:`, e.message);
          if (t < 2) await sleep(6000);
        }
      }
    }

    if (nutrition.length === 0) {
      nutrition = mealSlots.map((slot, si) => ({
        id: `${dayName}-m${si}`,
        mealName: slot.name,
        time: slot.time,
        selectedOptionIndex: 0,
        options: [
          { id: `${dayName}-m${si}-o1`, food: 'Frango grelhado com arroz', portion: '150g + 4 col.', calories: 380, protein: 35, carbs: 42, fats: 8, source: 'Pulsy AI' },
          { id: `${dayName}-m${si}-o2`, food: 'Atum com batata doce', portion: '120g + 200g', calories: 350, protein: 30, carbs: 45, fats: 6, source: 'Pulsy AI' },
          { id: `${dayName}-m${si}-o3`, food: 'Ovos mexidos com aveia', portion: '3 ovos + 50g', calories: 320, protein: 25, carbs: 30, fats: 12, source: 'Pulsy AI' },
        ]
      }));
    }

    days.push({ day: dayName, workout, sessions, nutrition });
    console.log(`[Pulsy AI] ${dayName}: ${sessions.length} sessoes (${workout.length} exerc. total) | ${nutrition.length} refeicoes`);
  }

  const plan: WeeklyPlan = {
    weeklyPlan: days,
    summary: `Plano personalizado para ${profile.name} — Pulsy AI.`,
    motivation: 'Consistencia eh o caminho para os resultados!',
    references: ['ACSM Guidelines 2023', 'WHO Physical Activity Guidelines 2022']
  };

  setCached(userId, hash, plan);
  return plan;
}

// --- Calcular macros ---------------------------------------------------------
export async function calculateNutrition(
  food: string, portion: string
): Promise<{ calories: number; protein: number; carbs: number; fats: number }> {
  const sys    = `Nutricionista. Responda SOMENTE com JSON valido, sem markdown.`;
  const prompt = `Macros de "${food}" porcao "${portion}". Apenas: {"calories":0,"protein":0,"carbs":0,"fats":0}`;
  try { return parseJSON(await callGroq(prompt, sys, 100), 'nut'); }
  catch { return { calories: 150, protein: 10, carbs: 20, fats: 5 }; }
}

// --- Banco local de exercicios (fallback offline) ----------------------------
// Evita chamadas de API para exercicios comuns e garante robustez offline.
// A IA continua sendo usada para exercicios nao listados aqui.
const LOCAL_EXERCISE_DB: Record<string, { description: string; instructions: string; kcalEstimate: number; difficulty: string }> = {
  // Peito
  'Supino Reto': { description: 'Exercicio fundamental de peitoral com barra ou halteres no banco reto.', instructions: '1. Deite no banco com os pés firmes no chão.\n2. Pegue a barra na largura dos ombros.\n3. Desça controlado até o peito.\n4. Empurre explosivo até extensão dos cotovelos.', kcalEstimate: 60, difficulty: 'Intermediário' },
  'Supino Inclinado': { description: 'Supino em banco inclinado para ênfase no peitoral superior.', instructions: '1. Banco inclinado a 30-45°.\n2. Desça a barra até a parte superior do peito.\n3. Cotovelos levemente abertos.\n4. Empurre controlado.', kcalEstimate: 58, difficulty: 'Intermediário' },
  'Supino Declinado': { description: 'Supino em banco declinado para ênfase no peitoral inferior.', instructions: '1. Banco declinado, pés presos.\n2. Barra desce à parte inferior do peito.\n3. Cotovelos a 45° do tronco.\n4. Empurre até extensão.', kcalEstimate: 58, difficulty: 'Intermediário' },
  'Flexão de Braços': { description: 'Exercicio básico de peitoral e tríceps usando o peso do corpo.', instructions: '1. Mãos levemente além dos ombros.\n2. Corpo em linha reta.\n3. Desça até o peito quase tocar.\n4. Empurre explosivo.', kcalEstimate: 40, difficulty: 'Iniciante' },
  'Cross-over': { description: 'Exercicio de cabo que trabalha peitoral em amplitude completa.', instructions: '1. Posicione-se entre as polias altas.\n2. Puxe os cabos para baixo e para frente cruzando as mãos.\n3. Contraia o peitoral no final.\n4. Retorne controlado.', kcalEstimate: 45, difficulty: 'Intermediário' },
  // Costas
  'Puxada Frontal': { description: 'Puxada no pulley frontal que trabalha dorsais e bíceps.', instructions: '1. Sente no aparelho com joelhos presos.\n2. Pegada pronada além dos ombros.\n3. Puxe a barra até o peito com cotoveladas para baixo.\n4. Retorne controlado.', kcalEstimate: 55, difficulty: 'Iniciante' },
  'Remada Curvada': { description: 'Remada com barra inclinado para frente, principal exercicio de espessura de costas.', instructions: '1. Incline o tronco a 45° com joelhos levemente dobrados.\n2. Puxe a barra ao abdômen.\n3. Cotoveladas para baixo e para trás.\n4. Desça controlado.', kcalEstimate: 65, difficulty: 'Intermediário' },
  'Barra Fixa': { description: 'Pull-up no peso corporal, exercicio fundamental de costas.', instructions: '1. Pegada pronada além dos ombros.\n2. Puxe o queixo acima da barra.\n3. Sem impulso ou balanço.\n4. Desça completamente.', kcalEstimate: 55, difficulty: 'Intermediário' },
  'Remada Unilateral': { description: 'Remada com um halter por vez, excelente para assimetrias e amplitude.', instructions: '1. Apoie o joelho e mão no banco.\n2. Puxe o halter ao quadril.\n3. Cotovelo sobe acima das costas.\n4. Desça controlado.', kcalEstimate: 50, difficulty: 'Iniciante' },
  // Pernas
  'Agachamento Livre': { description: 'Rei dos exercícios de membros inferiores, trabalha quadríceps, glúteos e isquiotibiais.', instructions: '1. Barra no trapézio, pés na largura dos ombros.\n2. Desça até coxas paralelas ao chão.\n3. Joelhos alinhados com os pés.\n4. Suba empurrando pelos calcanhares.', kcalEstimate: 75, difficulty: 'Intermediário' },
  'Leg Press': { description: 'Agachamento na máquina, menor estresse na coluna.', instructions: '1. Pés na plataforma na largura dos ombros.\n2. Desça o joelho a 90°.\n3. Não bloqueie completamente os joelhos no topo.\n4. Empurre pelos calcanhares.', kcalEstimate: 65, difficulty: 'Iniciante' },
  'Cadeira Extensora': { description: 'Isolamento de quadríceps na máquina extensora.', instructions: '1. Ajuste o assento para a perna ficar a 90°.\n2. Estenda completamente as pernas.\n3. Mantenha 1 segundo no topo.\n4. Desça controlado em 3 segundos.', kcalEstimate: 45, difficulty: 'Iniciante' },
  'Mesa Flexora': { description: 'Isolamento de isquiotibiais na máquina flexora deitado.', instructions: '1. Deite de bruços na máquina.\n2. Ajuste o cilindro acima dos calcanhares.\n3. Flexione as pernas ao máximo.\n4. Desça controlado.', kcalEstimate: 40, difficulty: 'Iniciante' },
  'Stiff': { description: 'Exercicio de isquiotibiais e glúteos com barra, variação do levantamento terra.', instructions: '1. Barra na frente, pernas quase estendidas.\n2. Incline o tronco para frente.\n3. Sinta o alongamento dos isquiotibiais.\n4. Suba contraindo os glúteos.', kcalEstimate: 60, difficulty: 'Intermediário' },
  // Ombros
  'Desenvolvimento com Barra': { description: 'Press de ombros com barra, exercicio principal para deltoides.', instructions: '1. Barra ao nível dos ombros.\n2. Pressione diretamente acima da cabeça.\n3. Sem hiperestender a lombar.\n4. Desça controlado até a fronte.', kcalEstimate: 55, difficulty: 'Intermediário' },
  'Elevação Lateral': { description: 'Isola o deltoide lateral criando largura de ombros.', instructions: '1. Em pé, halteres nas laterais.\n2. Eleve os braços até o paralelo.\n3. Cotovelos levemente dobrados.\n4. Desça controlado em 3s.', kcalEstimate: 35, difficulty: 'Iniciante' },
  'Elevação Frontal': { description: 'Isola o deltoide anterior elevando os braços à frente.', instructions: '1. Em pé, halteres à frente das coxas.\n2. Eleve um braço por vez até o paralelo.\n3. Polegar levemente para cima.\n4. Desça controlado.', kcalEstimate: 30, difficulty: 'Iniciante' },
  // Braços
  'Rosca Direta': { description: 'Flexão de cotovelo com barra, exercicio principal de bíceps.', instructions: '1. Em pé, barra com pegada supinada.\n2. Cotovelos colados ao corpo.\n3. Flexione até a contração total.\n4. Desça lentamente em 3 segundos.', kcalEstimate: 35, difficulty: 'Iniciante' },
  'Tríceps Pulley': { description: 'Extensão de cotovelo no cabo, isolamento de tríceps.', instructions: '1. Pegue o cabo com pegada pronada.\n2. Cotovelos fixos ao lado do corpo.\n3. Empurre para baixo até extensão total.\n4. Retorne controlado.', kcalEstimate: 35, difficulty: 'Iniciante' },
  'Rosca Martelo': { description: 'Rosca com pegada neutra que trabalha braquial e bíceps.', instructions: '1. Halteres com pegada neutra (polegar para cima).\n2. Cotovelos fixos ao lado do corpo.\n3. Flexione até o paralelo do ombro.\n4. Desça controlado.', kcalEstimate: 35, difficulty: 'Iniciante' },
  // Core
  'Abdominal Tradicional': { description: 'Exercicio básico de abdômen, trabalha reto abdominal.', instructions: '1. Deitado, joelhos dobrados.\n2. Mãos atrás da cabeça ou cruzadas no peito.\n3. Eleve as escápulas do chão contraindo o abdômen.\n4. Desça controlado sem encostar a cabeça.', kcalEstimate: 25, difficulty: 'Iniciante' },
  'Prancha': { description: 'Isometria de core que trabalha toda a musculatura estabilizadora.', instructions: '1. Antebraços no chão, cotovelos sob os ombros.\n2. Corpo em linha reta.\n3. Contraia abdômen, glúteos e quadríceps.\n4. Respire normalmente.', kcalEstimate: 25, difficulty: 'Iniciante' },
  'Leg Raise': { description: 'Elevação de pernas deitado para abdômen inferior.', instructions: '1. Deitado, mãos sob o glúteo.\n2. Pernas juntas e levemente dobradas.\n3. Eleve até 90°.\n4. Desça sem tocar o chão.', kcalEstimate: 30, difficulty: 'Intermediário' },
};

function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function findLocalExercise(name: string) {
  // Busca exata primeiro
  if (LOCAL_EXERCISE_DB[name]) return LOCAL_EXERCISE_DB[name];
  // Busca normalizada
  const normalized = normalizeExerciseName(name);
  for (const [key, val] of Object.entries(LOCAL_EXERCISE_DB)) {
    if (normalizeExerciseName(key) === normalized) return val;
  }
  // Busca parcial (nome contém a chave)
  for (const [key, val] of Object.entries(LOCAL_EXERCISE_DB)) {
    if (normalized.includes(normalizeExerciseName(key)) || normalizeExerciseName(key).includes(normalized)) return val;
  }
  return null;
}

// --- Dados de exercicio (com banco local + fallback IA) ----------------------
export async function fetchExerciseData(name: string): Promise<Partial<Exercise>> {
  // 1. Verifica banco local primeiro (mais rápido, sem API, sem erro de JSON)
  const local = findLocalExercise(name);
  if (local) {
    console.log(`[Pulsy AI] fetchExerciseData: banco local "${name}"`);
    return local;
  }

  // 2. Tenta a IA com instrucoes especificas para JSON valido
  const sys = `Fisiologista esportivo. Responda SOMENTE com JSON valido e sem markdown.
IMPORTANTE: Use \\n (barra invertida + n) para separar passos, NUNCA quebras de linha reais.
Exemplo correto: "instructions":"Passo 1\\nPasso 2\\nPasso 3"`;
  const prompt = `Exercicio "${name}". JSON: {"description":"descricao em 1 frase","instructions":"Passo 1\\nPasso 2\\nPasso 3\\nPasso 4","kcalEstimate":55,"difficulty":"Intermediario"}`;

  try {
    const raw = await callGroq(prompt, sys, 350);
    const data = parseJSON<Partial<Exercise>>(raw, 'exdata');
    // Garante que instructions seja string (pode vir como array da IA)
    if (Array.isArray((data as any).instructions)) {
      data.instructions = (data as any).instructions.join('\n');
    }
    return data;
  } catch (e) {
    console.warn(`[Pulsy AI] fetchExerciseData fallback para "${name}":`, e);
    // 3. Fallback seguro: retorna dados basicos sem quebrar a UI
    return {
      description: `${name}: exercicio de força e condicionamento.`,
      instructions: `1. Posicione-se corretamente no equipamento.\n2. Execute o movimento de forma controlada.\n3. Respire: inspire na descida, expire na subida.\n4. Mantenha a forma correta em todas as repetições.`,
      kcalEstimate: 50,
      difficulty: 'Intermediário'
    };
  }
}

// --- Substituir exercicio -----------------------------------------------------
export async function swapExercise(ex: Exercise, profile: UserProfile): Promise<Exercise> {
  const sys    = `Personal trainer. Responda SOMENTE com JSON valido, sem markdown.`;
  const prompt = `Substituto para "${ex.name}" (${ex.muscleGroup}). Nivel:${profile.fitnessLevel}. Local:${profile.availability?.locations?.[0] || 'Academia'}.
JSON: {"id":"${ex.id}","name":"...","sets":3,"reps":"10-12","rest":"40s","muscleGroup":"${ex.muscleGroup}","category":"${ex.category||'Forca'}","difficulty":"Intermediario","instructions":"...","kcalEstimate":55,"source":"Pulsy AI"}`;
  try { return parseJSON<Exercise>(await callGroq(prompt, sys, 280), 'swap'); }
  catch { return { ...ex, name: `${ex.name} (Variacao)` }; }
}

// --- Recalcular plano ---------------------------------------------------------
export async function recalculatePlanAfterModification(
  plan: WeeklyPlan, _profile: UserProfile
): Promise<WeeklyPlan> {
  return JSON.parse(JSON.stringify(plan));
}

// --- Analise de progressao ---------------------------------------------------
export function analyzeProgression(history: import('../types').WorkoutSession[]): {
  weeklyVolume: number[];
  consecutiveDays: number;
  suggestDeload: boolean;
  trend: 'up' | 'stable' | 'down';
} {
  if (!history?.length) return { weeklyVolume: [0,0,0,0], consecutiveDays: 0, suggestDeload: false, trend: 'stable' };
  const now = new Date();
  const weeks = [0,0,0,0];
  for (const s of history) {
    try {
      const diff = Math.floor((now.getTime() - new Date(s.date).getTime()) / 6048e5);
      if (diff >= 0 && diff < 4) weeks[3 - diff]++;
    } catch { /* ignore */ }
  }
  const days = [...new Set(history.map(s => { try { return new Date(s.date).toDateString(); } catch { return ''; } }))].filter(Boolean).sort().reverse();
  let consecutive = 0;
  for (let i = 0; i < days.length; i++) {
    const diff = Math.floor((now.getTime() - new Date(days[i]).getTime()) / 864e5);
    if (diff === i) consecutive++; else break;
  }
  return {
    weeklyVolume: weeks,
    consecutiveDays: consecutive,
    suggestDeload: consecutive >= 6,
    trend: weeks[3] > weeks[2] ? 'up' : weeks[3] < weeks[2] ? 'down' : 'stable'
  };
}

// --- Verificacao de sobrecarga muscular --------------------------------------
export function checkMuscleOverload(plan: WeeklyPlan): string[] {
  if (!plan?.weeklyPlan) return [];
  const count: Record<string, number> = {};
  for (const day of plan.weeklyPlan) {
    for (const ex of (day.workout || [])) {
      const g = (ex.muscleGroup || 'Geral').split('/')[0].trim();
      count[g] = (count[g] || 0) + 1;
    }
  }
  return Object.entries(count).filter(([,n]) => n >= 6).map(([m,n]) => `${m}: ${n}x — considere reduzir volume`);
}

// --- TOPICO 6: Calcular Kcal Maxima Recomendada ------------------------------
export function calcMaxKcalRecommended(profile: UserProfile | null, _plan: WeeklyPlan | null): number {
  if (!profile) return 2000;

  const w = profile.weight || 70;
  const h = profile.height || 175;
  const age = profile.age || 30;
  const sex = profile.sex || 'Masculino';

  // Harris-Benedict
  let tmb: number;
  if (sex === 'Feminino') {
    tmb = 655.1 + (9.563 * w) + (1.85 * h) - (4.676 * age);
  } else {
    tmb = 66.47 + (13.75 * w) + (5.003 * h) - (6.755 * age);
  }

  // Fator de atividade
  const activityFactors: Record<string, number> = {
    'Sedentario':             1.2,
    'Levemente Ativo':        1.375,
    'Moderadamente Ativo':    1.55,
    'Ativo':                  1.725,
    'Muito Ativo':            1.9,
  };
  const af = activityFactors[profile.activityLevel as string] || 1.375;

  let tdee = tmb * af;

  // Ajuste pelo objetivo
  const goal = profile.structuredGoals?.[0]?.type || profile.nutrition?.objective || '';
  if (goal.toLowerCase().includes('emagrecimento')) tdee *= 0.85;
  else if (goal.toLowerCase().includes('ganho') || goal.toLowerCase().includes('massa')) tdee *= 1.10;

  // Ajuste por restricoes
  const restrictions = (profile.restrictions?.alimentary || []).concat(profile.nutrition?.allergies || []);
  if (restrictions.length > 3) tdee *= 0.97;

  return Math.round(tdee);
}
