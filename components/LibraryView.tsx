// LibraryView.tsx — Pulsy AI
// Biblioteca completa: musculação, calistenia, cardio, yoga, dança, esportes
// Dança: ritmos de salão completos | Esportes: exercícios específicos por modalidade

import React, { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, Info, Search,
  Dumbbell, Flame, X, Play, Zap
} from 'lucide-react';

// ─── Categorias e subcategorias ───────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'musculacao', name: 'Musculação',
    areas: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Glúteos']
  },
  {
    id: 'calistenia', name: 'Calistenia',
    areas: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core']
  },
  {
    id: 'cardio', name: 'Cardio',
    areas: ['Geral', 'HIIT', 'Endurance', 'Baixo Impacto']
  },
  {
    id: 'yoga', name: 'Yoga & Mobilidade',
    areas: ['Mobilidade', 'Força', 'Respiração', 'Equilíbrio']
  },
  {
    id: 'danca', name: 'Dança',
    areas: ['Ritmos de Salão', 'Aeróbico', 'Urbano']
  },
  {
    id: 'esportes', name: 'Esportes & Artes Marciais',
    areas: ['Futebol', 'Vôlei', 'Basquete', 'Karatê', 'Judô', 'Taekwondo', 'Muay Thai', 'Kung Fu', 'Capoeira', 'CrossFit', 'Natação', 'Tênis']
  }
];

// ─── Banco de exercícios específicos por esporte ──────────────────────────────
const SPORT_EXERCISES: Record<string, Array<{
  name: string; sets: string; reps: string; rest: string;
  muscleGroup: string; kcal: number; difficulty: string;
  desc: string; inst: string;
}>> = {
  'Futebol': [
    { name: 'Agachamento Livre', sets: '4', reps: '10-12', rest: '60s', muscleGroup: 'Quadríceps/Glúteos', kcal: 65, difficulty: 'Intermediário', desc: 'Fortalecimento de quadríceps e glúteos essencial para potência de chute e sprint.', inst: '1. Pés na largura dos ombros.\n2. Desça até 90 graus de flexão nos joelhos.\n3. Mantenha costas retas e joelhos alinhados.\n4. Suba empurrando pelos calcanhares.' },
    { name: 'Agachamento com Salto', sets: '3', reps: '8-10', rest: '90s', muscleGroup: 'Quadríceps/Potência', kcal: 80, difficulty: 'Intermediário', desc: 'Treino de potência muscular para aceleração e salto.', inst: '1. Posição de agachamento.\n2. Desça controlado.\n3. Suba explosivo e salte.\n4. Aterrisse suavemente com joelhos semiflexionados.' },
    { name: 'Afundo (Lunge)', sets: '3', reps: '12 cada perna', rest: '60s', muscleGroup: 'Quadríceps/Posteriores', kcal: 55, difficulty: 'Iniciante', desc: 'Treino de força unilateral para equilíbrio e prevenção de lesões.', inst: '1. Em pé, dê um passo longo à frente.\n2. Desça o joelho traseiro quase no chão.\n3. Mantenha o tronco ereto.\n4. Empurre e volte à posição inicial.' },
    { name: 'Elevação de Quadril (Hip Thrust)', sets: '4', reps: '12-15', rest: '60s', muscleGroup: 'Glúteos/Posteriores', kcal: 50, difficulty: 'Iniciante', desc: 'Fortalecimento de glúteos e posterior de coxa para potência de chute.', inst: '1. Apoie os ombros num banco.\n2. Pés no chão, joelhos a 90°.\n3. Eleve o quadril até alinhamento.\n4. Contraia glúteos no topo e desça.' },
    { name: 'Escada de Agilidade', sets: '4', reps: '30s', rest: '45s', muscleGroup: 'Membros Inferiores/Coordenação', kcal: 70, difficulty: 'Intermediário', desc: 'Melhoria de velocidade e coordenação de passos para mudança de direção.', inst: '1. Posicione a escada no chão.\n2. Execute passos rápidos em cada quadrado.\n3. Mantenha postura elevada.\n4. Varie padrões: 1-2-1, lateral, cruzado.' },
    { name: 'Corrida em Zig-Zag (Cones)', sets: '5', reps: '20m', rest: '60s', muscleGroup: 'Membros Inferiores/Agilidade', kcal: 75, difficulty: 'Intermediário', desc: 'Treino de mudança de direção rápida e desaceleração.', inst: '1. Posicione cones em zigue-zague.\n2. Sprint máximo entre cones.\n3. Toque no cone com a mão mais próxima.\n4. Mantenha centro de gravidade baixo.' },
    { name: 'Prancha Ventral (Plank)', sets: '4', reps: '30-60s', rest: '45s', muscleGroup: 'Core', kcal: 30, difficulty: 'Iniciante', desc: 'Treino de estabilidade do core para manutenção de postura em jogo.', inst: '1. Antebraços no chão, cotovelos sob os ombros.\n2. Corpo em linha reta dos calcanhares à cabeça.\n3. Contraia abdômen e glúteos.\n4. Respire normalmente.' },
    { name: 'Mountain Climber', sets: '4', reps: '30s', rest: '30s', muscleGroup: 'Core/Cardio', kcal: 85, difficulty: 'Intermediário', desc: 'Treino aeróbico e de core simultâneo.', inst: '1. Posição de prancha alta.\n2. Leve um joelho ao peito.\n3. Alterne rápido como se estivesse correndo.\n4. Mantenha quadril nivelado.' },
    { name: 'Rotação de Tronco com Bola', sets: '3', reps: '15 cada lado', rest: '45s', muscleGroup: 'Core/Oblíquos', kcal: 40, difficulty: 'Iniciante', desc: 'Treino de potência rotacional para chutes e passes de longa distância.', inst: '1. Sentado, pés no chão.\n2. Segure a bola à frente.\n3. Gire o tronco para cada lado.\n4. Mantenha abdômen contraído.' },
    { name: 'Caminhada Lateral com Miniband', sets: '3', reps: '15 passos cada lado', rest: '45s', muscleGroup: 'Glúteo Médio', kcal: 35, difficulty: 'Iniciante', desc: 'Fortalecimento de glúteo médio para estabilidade lateral do joelho.', inst: '1. Elástico na altura dos joelhos.\n2. Posição semiflexionada.\n3. Passos laterais mantendo tensão no elástico.\n4. Retorne ao centro.' },
    { name: 'Exercício Monopodal com Miniband', sets: '3', reps: '12 cada perna', rest: '45s', muscleGroup: 'Glúteo/Equilíbrio', kcal: 40, difficulty: 'Intermediário', desc: 'Treino de estabilidade articular do tornozelo e joelho.', inst: '1. Em pé numa perna.\n2. Elástico na outra perna.\n3. Mova a perna livre nas direções frente/lado/trás.\n4. Mantenha equilíbrio no apoio.' },
    { name: 'Sprint 20m com Recuperação', sets: '8', reps: '1 sprint', rest: '90s', muscleGroup: 'Membros Inferiores/Cardio', kcal: 90, difficulty: 'Avançado', desc: 'Velocidade máxima e potência de aceleração como em situações de jogo.', inst: '1. Posição de partida baixa.\n2. Sprint máximo em 20 metros.\n3. Desacelere gradualmente.\n4. Recupere caminhando de volta.' },
  ],
  'Vôlei': [
    { name: 'Salto com Contra-Movimento (CMJ)', sets: '4', reps: '8', rest: '90s', muscleGroup: 'Quadríceps/Glúteos', kcal: 75, difficulty: 'Intermediário', desc: 'Desenvolvimento da impulsão vertical para bloqueio e ataque.', inst: '1. Em pé, braços ao lado.\n2. Agache rapidamente.\n3. Salte com braços auxiliando.\n4. Aterrisse com joelhos semiflexionados.' },
    { name: 'Manchete com Deslocamento', sets: '5', reps: '10 por lado', rest: '60s', muscleGroup: 'Membros Inferiores/Técnico', kcal: 55, difficulty: 'Intermediário', desc: 'Técnica de recepção com base baixa e deslocamento lateral rápido.', inst: '1. Base larga e baixa.\n2. Deslocamento lateral explosivo.\n3. Forme plataforma com os braços.\n4. Contato na parte interna dos antebraços.' },
    { name: 'Swing de Ataque (Shadow)', sets: '4', reps: '12', rest: '45s', muscleGroup: 'Ombros/Core', kcal: 45, difficulty: 'Iniciante', desc: 'Movimento técnico de ataque sem bola para memorização motora.', inst: '1. Posição de recuo de 3 passos.\n2. Salte com impulso dos braços.\n3. Execute o swing de ataque no auge do salto.\n4. Aterrisse controlado.' },
    { name: 'Agachamento Búlgaro', sets: '3', reps: '10 cada perna', rest: '75s', muscleGroup: 'Quadríceps/Glúteos', kcal: 60, difficulty: 'Intermediário', desc: 'Força unilateral para desequilíbrios e estabilidade de joelho.', inst: '1. Pé traseiro apoiado num banco.\n2. Desça o joelho traseiro ao chão.\n3. Tronco ereto.\n4. Empurre com a perna da frente.' },
    { name: 'Salto Lateral sobre Cone', sets: '4', reps: '10 cada lado', rest: '60s', muscleGroup: 'Agilidade Lateral', kcal: 65, difficulty: 'Intermediário', desc: 'Velocidade de deslocamento lateral para defesas de ponta a ponta.', inst: '1. Cone no centro.\n2. Salte lateralmente sobre o cone.\n3. Pouse suavemente.\n4. Salte de volta imediatamente.' },
    { name: 'Remada com Halteres', sets: '3', reps: '12', rest: '60s', muscleGroup: 'Costas/Ombros', kcal: 50, difficulty: 'Intermediário', desc: 'Fortalecimento posterior para equilíbrio muscular de ombro.', inst: '1. Incline tronco a 45°.\n2. Puxe halteres em direção ao quadril.\n3. Esmague as escápulas.\n4. Desça controlado.' },
    { name: 'Rosca Direta', sets: '3', reps: '12-15', rest: '45s', muscleGroup: 'Bíceps', kcal: 35, difficulty: 'Iniciante', desc: 'Fortalecimento de bíceps para saques e passes longos.', inst: '1. Em pé, cotovelos colados ao corpo.\n2. Flexione os antebraços.\n3. Evite balar o tronco.\n4. Desça controlado.' },
  ],
  'Karatê': [
    { name: 'Kata (Heian Shodan)', sets: '5', reps: '1 kata completo', rest: '60s', muscleGroup: 'Corpo Inteiro', kcal: 60, difficulty: 'Intermediário', desc: 'Sequência formal de técnicas para precisão, timing e Kime (contração muscular).', inst: '1. Posição de atenção (Yoi).\n2. Execute os movimentos sequenciais do kata.\n3. Foco em cada técnica com Kime.\n4. Kiai nos pontos marcados.' },
    { name: 'Kihon — Soco (Gyaku-Zuki)', sets: '5', reps: '20 cada braço', rest: '30s', muscleGroup: 'Ombros/Core/Quadril', kcal: 50, difficulty: 'Iniciante', desc: 'Técnica fundamental de soco reverso com rotação de quadril.', inst: '1. Base de combate (Zenkutsu-Dachi).\n2. Soco com rotação completa do punho.\n3. Recue o braço contrário ao quadril.\n4. Kime no impacto.' },
    { name: 'Chute Frontal (Mae-Geri)', sets: '4', reps: '15 cada perna', rest: '45s', muscleGroup: 'Flexores do Quadril/Core', kcal: 55, difficulty: 'Intermediário', desc: 'Chute frontal com recolhimento rápido para não expor a perna.', inst: '1. Base de combate.\n2. Eleve o joelho da perna de chute.\n3. Estenda o pé na direção do alvo.\n4. Recolha o joelho antes de apoiar o pé.' },
    { name: 'Kihon — Bloqueio Baixo (Gedan-Barai)', sets: '4', reps: '20 cada braço', rest: '30s', muscleGroup: 'Ombros/Forearm', kcal: 40, difficulty: 'Iniciante', desc: 'Bloqueio descendente para defesa de ataques baixos.', inst: '1. Braço partindo do ombro contrário.\n2. Movimento descendente com força.\n3. Punho final alinhado com a coxa.\n4. Ombros relaxados.' },
    { name: 'Kumite — Exercício de Distância (Ippon)', sets: '6', reps: '5 por parceiro', rest: '60s', muscleGroup: 'Corpo Inteiro/Reflexo', kcal: 70, difficulty: 'Avançado', desc: 'Combate controlado de 1 ponto para desenvolvimento de reflexo e timing.', inst: '1. Anunciar o ataque.\n2. Executar ataque controlado.\n3. Defensor bloqueia e contra-ataca.\n4. Ambos retornam à posição inicial.' },
    { name: 'Rolamento e Levantamento', sets: '4', reps: '10', rest: '45s', muscleGroup: 'Core/Agilidade', kcal: 45, difficulty: 'Intermediário', desc: 'Habilidade de queda e recuperação rápida do solo.', inst: '1. Agache baixo.\n2. Role para frente ou para trás.\n3. Use o antebraço para amortecer.\n4. Levante rapidamente em guarda.' },
    { name: 'Agachamento com Chute (Combo)', sets: '4', reps: '10 cada perna', rest: '60s', muscleGroup: 'Pernas/Explosão', kcal: 80, difficulty: 'Avançado', desc: 'Combinação de força e técnica para potência de chute.', inst: '1. Agache profundo.\n2. Suba explosivo.\n3. Execute chute circular no auge.\n4. Recolha e agache novamente.' },
  ],
  'Judô': [
    { name: 'Uchi-Komi (Entrada de Quedas)', sets: '5', reps: '20', rest: '60s', muscleGroup: 'Corpo Inteiro', kcal: 65, difficulty: 'Intermediário', desc: 'Repetição de entradas sem finalizar a queda para fixar o movimento.', inst: '1. Parceiro em posição de receber.\n2. Execute o Kuzushi (desequilíbrio).\n3. Entre com o Tsukuri (posicionamento).\n4. Pare antes do Kake (projeção).' },
    { name: 'Ukemi — Queda para Trás (Ushiro Ukemi)', sets: '4', reps: '15', rest: '30s', muscleGroup: 'Core/Reflexo', kcal: 40, difficulty: 'Iniciante', desc: 'Técnica de queda protegida para trás, essencial para segurança.', inst: '1. Agache lentamente.\n2. Role o queixo ao peito.\n3. Bata os braços no chão 45°.\n4. Não apoie com as mãos.' },
    { name: 'Randori (Combate Livre)', sets: '4', reps: '3 minutos', rest: '90s', muscleGroup: 'Corpo Inteiro/Cardio', kcal: 120, difficulty: 'Avançado', desc: 'Prática livre para aplicação técnica em situação real de resistência.', inst: '1. Pegada padrão (Kumi-kata).\n2. Busque o desequilíbrio do adversário.\n3. Aplique a técnica quando houver oportunidade.\n4. Tente finalizar com Ippon.' },
    { name: 'Isometria de Pegada (Gripping)', sets: '5', reps: '30s cada', rest: '30s', muscleGroup: 'Antebraços/Grip', kcal: 30, difficulty: 'Iniciante', desc: 'Desenvolvimento de força de preensão essencial para pegada no judogi.', inst: '1. Segure um objeto resistente (towel, gi, barra).\n2. Contraia maximamente.\n3. Mantenha por 30 segundos.\n4. Varie posições da mão.' },
    { name: 'Ne-Waza — Treino de Chão', sets: '4', reps: '3 minutos', rest: '90s', muscleGroup: 'Core/Força Relativa', kcal: 90, difficulty: 'Avançado', desc: 'Trabalho de posições de domínio, imobilizações e chaves no solo.', inst: '1. Busque posição dominante no chão.\n2. Aplique imobilização (Osae-Komi).\n3. Tente chaves de braço (Juji-Gatame).\n4. Mantenha controle corporal.' },
    { name: 'Puxada na Barra (Pull-Up)', sets: '4', reps: '8-12', rest: '75s', muscleGroup: 'Costas/Bíceps', kcal: 55, difficulty: 'Intermediário', desc: 'Força de tração fundamental para arremessos de quadril e ombro.', inst: '1. Pegada pronada levemente além dos ombros.\n2. Puxe até o queixo acima da barra.\n3. Desça completamente.\n4. Sem impulso.' },
  ],
  'Taekwondo': [
    { name: 'Chute Circular (Bandal-Chagui)', sets: '4', reps: '15 cada perna', rest: '45s', muscleGroup: 'Quadríceps/Flexores do Quadril', kcal: 60, difficulty: 'Intermediário', desc: 'Chute circular principal do Taekwondo, alvo na cabeça ou tronco.', inst: '1. Base de combate.\n2. Eleve o joelho lateralmente.\n3. Estenda a perna em arco.\n4. Impacto com o peito do pé.\n5. Recolha o joelho antes de pousar.' },
    { name: 'Chute Lateral (Yeop-Chagui)', sets: '4', reps: '12 cada perna', rest: '60s', muscleGroup: 'Glúteo/Abdutores', kcal: 55, difficulty: 'Intermediário', desc: 'Chute lateral com extensão total do quadril para força e penetração.', inst: '1. Gire o quadril para o lado do chute.\n2. Eleve o joelho lateral.\n3. Empurre o calcanhar na direção do alvo.\n4. Recolha e retorne.' },
    { name: 'Poomsae (Taegeuk Il Jang)', sets: '5', reps: '1 completo', rest: '60s', muscleGroup: 'Corpo Inteiro', kcal: 65, difficulty: 'Intermediário', desc: 'Sequência formal de movimentos para precisão técnica e condicionamento.', inst: '1. Posição inicial Moa-Sogi.\n2. Execute as 18 técnicas da sequência.\n3. Mantenha Kibun (foco mental).\n4. Kihap nos pontos marcados.' },
    { name: 'Spinning Back Kick', sets: '4', reps: '10 cada perna', rest: '60s', muscleGroup: 'Glúteo/Core/Equilíbrio', kcal: 70, difficulty: 'Avançado', desc: 'Chute giratório de costas para desestabilizar o oponente.', inst: '1. Base de combate.\n2. Gire 180° sobre o pé de apoio.\n3. Impulsione o calcanhar para trás.\n4. Mantenha o olhar no alvo durante a rotação.' },
    { name: 'Salto com Chute (Twimyo Dollyo-Chagui)', sets: '3', reps: '8 cada perna', rest: '90s', muscleGroup: 'Potência/Explosão', kcal: 85, difficulty: 'Avançado', desc: 'Chute circular em salto para marcar pontos no cabeção.', inst: '1. Passo de impulso.\n2. Salte com perna de apoio.\n3. Execute o chute circular no auge.\n4. Aterrisse na perna de chute.' },
    { name: 'Treino de Velocidade (Shadow Sparring)', sets: '5', reps: '2 minutos', rest: '60s', muscleGroup: 'Corpo Inteiro/Cardio', kcal: 100, difficulty: 'Avançado', desc: 'Combate imaginário para desenvolver velocidade e combinações.', inst: '1. Imagine um oponente à frente.\n2. Execute combinações de chutes e bloqueios.\n3. Mova-se pelo espaço.\n4. Máxima velocidade e foco.' },
  ],
  'Muay Thai': [
    { name: 'Low Kick na Perna', sets: '4', reps: '20 cada perna', rest: '45s', muscleGroup: 'Abdutores/Panturrilha', kcal: 65, difficulty: 'Intermediário', desc: 'Chute na coxa para enfraquecer a mobilidade do oponente.', inst: '1. Base de combate.\n2. Gire o quadril com força.\n3. Impacto com o canelo na coxa do oponente.\n4. Recolha rapidamente à guarda.' },
    { name: 'Combinação Jab + Direto + Chute', sets: '5', reps: '10 combos', rest: '60s', muscleGroup: 'Ombros/Core/Pernas', kcal: 90, difficulty: 'Intermediário', desc: 'Sequência básica de socos e chute para criar ofensivas completas.', inst: '1. Jab com o braço da frente.\n2. Direto com o braço de trás.\n3. Low kick ou middle kick na sequência.\n4. Retorne à guarda.' },
    { name: 'Joelhada Frontal (Teep ao Clinch)', sets: '4', reps: '15 cada perna', rest: '45s', muscleGroup: 'Flexores do Quadril/Core', kcal: 70, difficulty: 'Intermediário', desc: 'Joelhada frontal no corpo durante o clinch.', inst: '1. Segure o pescoço do adversário (clinch).\n2. Puxe para baixo.\n3. Eleve o joelho explosivamente.\n4. Impacto no corpo ou cabeça.' },
    { name: 'Cotovelada Horizontal', sets: '4', reps: '15 cada braço', rest: '45s', muscleGroup: 'Ombros/Tríceps', kcal: 50, difficulty: 'Intermediário', desc: 'Técnica de cotovelo horizontal para combate curto.', inst: '1. Eleve o cotovelo à altura dos ombros.\n2. Gire o tronco.\n3. Impacto com a ponta do cotovelo.\n4. Retorne à guarda.' },
    { name: 'Corda (Pular Corda)', sets: '5', reps: '3 minutos', rest: '60s', muscleGroup: 'Cardio/Coordenação/Panturrilha', kcal: 110, difficulty: 'Intermediário', desc: 'Condicionamento cardiovascular e coordenação fundamentais no treino.', inst: '1. Segure as alças na altura dos quadris.\n2. Pule com a ponta dos pés.\n3. Movimente apenas os pulsos.\n4. Mantenha ritmo constante.' },
    { name: 'Saco de Areia — Round', sets: '5', reps: '3 minutos', rest: '90s', muscleGroup: 'Corpo Inteiro/Cardio', kcal: 130, difficulty: 'Avançado', desc: 'Treino completo de todas as técnicas no saco pesado.', inst: '1. Posicionamento correto à frente do saco.\n2. Combine socos, chutes, joelhadas e cotoveladas.\n3. Varie nível alto/médio/baixo.\n4. Mantenha guarda nos momentos defensivos.' },
  ],
  'Kung Fu': [
    { name: 'Ma Bu (Base do Cavalo)', sets: '5', reps: '60s cada', rest: '30s', muscleGroup: 'Quadríceps/Adutores', kcal: 40, difficulty: 'Iniciante', desc: 'Postura fundamental para estabilidade e desenvolvimento de força isométrica.', inst: '1. Pés paralelos, 2× a largura dos ombros.\n2. Joelhos flexionados a 90°.\n3. Costas retas.\n4. Mantenha a posição com respiração abdominal.' },
    { name: 'Socos em Cadeia (Lian Huan Quan)', sets: '4', reps: '30 socos', rest: '45s', muscleGroup: 'Ombros/Core/Rotação', kcal: 55, difficulty: 'Iniciante', desc: 'Sequência fluida de socos com rotação de quadril.', inst: '1. Base levemente afastada.\n2. Alterne braços em socos diretos.\n3. Cada soco com rotação completa de punho.\n4. Mantenha ritmo e fluidez.' },
    { name: 'Taolu Básico (Xiao Hong Quan)', sets: '4', reps: '1 forma completa', rest: '90s', muscleGroup: 'Corpo Inteiro', kcal: 70, difficulty: 'Intermediário', desc: 'Forma básica com movimentos inspirados em animais para técnica e condicionamento.', inst: '1. Posição inicial de atenção.\n2. Execute os movimentos da sequência.\n3. Foco em precisão e fluidez.\n4. Grito (Fa Sheng) nos pontos marcados.' },
    { name: 'Chute Lateral com Equilíbrio', sets: '4', reps: '12 cada perna', rest: '60s', muscleGroup: 'Glúteo/Equilíbrio', kcal: 55, difficulty: 'Intermediário', desc: 'Chute lateral com aterrissagem controlada para treino de equilíbrio.', inst: '1. Em pé numa perna.\n2. Eleve o joelho lateralmente.\n3. Estenda o pé com força.\n4. Recolha e pouse controlado sem oscilação.' },
    { name: 'Chute em Salto (Fei Jiao)', sets: '3', reps: '8', rest: '90s', muscleGroup: 'Potência/Equilíbrio', kcal: 80, difficulty: 'Avançado', desc: 'Chute espetacular em salto para treino de explosão e equilíbrio.', inst: '1. Corrida de impulso curta.\n2. Salte com a perna de apoio.\n3. Execute o chute no auge do salto.\n4. Aterrisse suavemente na perna de chute.' },
    { name: 'Treino de Parceiro (Chi Sao)', sets: '5', reps: '2 minutos', rest: '60s', muscleGroup: 'Sensibilidade/Reflexo', kcal: 60, difficulty: 'Avançado', desc: 'Treino de braços pegajosos para sensibilidade e resposta ao toque.', inst: '1. Contato de antebraço com o parceiro.\n2. Mantenha rotação circular dos braços.\n3. Identifique aberturas.\n4. Não force, siga o movimento do parceiro.' },
  ],
  'Capoeira': [
    { name: 'Ginga', sets: '5', reps: '2 minutos', rest: '45s', muscleGroup: 'Membros Inferiores/Core/Cardio', kcal: 60, difficulty: 'Iniciante', desc: 'Movimento fundamental contínuo que é a base de toda a capoeira.', inst: '1. Base larga.\n2. Mova o corpo de um lado para o outro.\n3. Um pé vai para trás alternadamente.\n4. Braços acompanham a proteção do rosto.' },
    { name: 'Au (Roda de Mão Lateral)', sets: '4', reps: '10 cada lado', rest: '60s', muscleGroup: 'Ombros/Core/Coordenação', kcal: 55, difficulty: 'Intermediário', desc: 'Esquiva em forma de cartwheel lateral para fugir de golpes baixos.', inst: '1. Das mãos ao chão lateral.\n2. Pernas passam pela vertical.\n3. Retorne ao pé.\n4. Mantenha o olhar no oponente.' },
    { name: 'Meia Lua de Frente', sets: '4', reps: '15 cada perna', rest: '45s', muscleGroup: 'Flexores do Quadril/Abdutores', kcal: 50, difficulty: 'Iniciante', desc: 'Chute em meia lua à frente, ataque de nível médio/alto.', inst: '1. Base de ginga.\n2. Balance a perna em arco frontal.\n3. Impacto com o calcanhar ou peito do pé.\n4. Recolha para a ginga.' },
    { name: 'Cocorinha (Esquiva Baixa)', sets: '4', reps: '20', rest: '30s', muscleGroup: 'Quadríceps/Core', kcal: 35, difficulty: 'Iniciante', desc: 'Agachamento rápido de esquiva para golpes altos.', inst: '1. Da ginga, agache rapidamente.\n2. Uma mão toca o chão para apoio.\n3. Cabeça abaixo da linha do chute.\n4. Retorne à ginga.' },
    { name: 'Jogo de Capoeira (Angola)', sets: '4', reps: '3 minutos', rest: '90s', muscleGroup: 'Corpo Inteiro/Cardio', kcal: 100, difficulty: 'Avançado', desc: 'Jogo livre com parceiro ao som do berimbau para desenvolvimento completo.', inst: '1. Comece o jogo ao pé do berimbau.\n2. Aplique golpes, esquivas e acrobacias.\n3. Diálogo corporal com o parceiro.\n4. Respeite o toque do berimbau.' },
  ],
  'CrossFit': [
    { name: 'Burpee', sets: '4', reps: '15', rest: '60s', muscleGroup: 'Corpo Inteiro/Cardio', kcal: 95, difficulty: 'Intermediário', desc: 'Exercício completo que combina agachamento, prancha, flexão e salto.', inst: '1. Em pé, agache e apoie as mãos no chão.\n2. Salte os pés para trás (posição de prancha).\n3. Faça uma flexão.\n4. Salte os pés para as mãos.\n5. Salte com os braços acima da cabeça.' },
    { name: 'Kettlebell Swing', sets: '4', reps: '15-20', rest: '60s', muscleGroup: 'Glúteos/Posteriores/Core', kcal: 80, difficulty: 'Intermediário', desc: 'Movimento balístico com kettlebell para potência de quadril.', inst: '1. Kettlebell entre os pés.\n2. Agache ligeiramente e pegue com duas mãos.\n3. Impulso explosivo do quadril.\n4. Balance até a altura dos ombros.\n5. Controle o retorno.' },
    { name: 'Wall Ball', sets: '4', reps: '15', rest: '60s', muscleGroup: 'Corpo Inteiro', kcal: 85, difficulty: 'Intermediário', desc: 'Combinação de agachamento e arremesso de medicine ball.', inst: '1. Segure a medicine ball no peito.\n2. Agache profundo.\n3. Suba explosivo.\n4. Arremesse a bola acima do alvo.\n5. Pegue e desça imediatamente.' },
    { name: 'Box Jump', sets: '4', reps: '10', rest: '75s', muscleGroup: 'Quadríceps/Potência', kcal: 75, difficulty: 'Intermediário', desc: 'Salto sobre caixa para desenvolvimento de potência e pliometria.', inst: '1. Posicione-se à frente da caixa.\n2. Agache ligeiramente.\n3. Salte com força, brazos auxiliando.\n4. Pouse sobre a caixa com ambos os pés.\n5. Desça com controle.' },
    { name: 'Thruster (Agachamento + Press)', sets: '4', reps: '10', rest: '90s', muscleGroup: 'Corpo Inteiro', kcal: 90, difficulty: 'Avançado', desc: 'Combinação de agachamento frontal e desenvolvimento acima da cabeça.', inst: '1. Barra na frente dos ombros.\n2. Agache profundo.\n3. Suba explosivo.\n4. Leve a barra acima da cabeça sem parar.' },
    { name: 'Double Under (Corda Dupla)', sets: '5', reps: '30s', rest: '45s', muscleGroup: 'Cardio/Coordenação', kcal: 100, difficulty: 'Avançado', desc: 'Pular corda com duas passagens por salto para alto gasto calórico.', inst: '1. Salto ligeiramente mais alto que o normal.\n2. Gire os pulsos rapidamente.\n3. A corda passa duas vezes sob os pés.\n4. Mantenha ritmo constante.' },
  ],
  'Basquete': [
    { name: 'Salto Vertical (Vertical Jump)', sets: '5', reps: '8', rest: '75s', muscleGroup: 'Quadríceps/Glúteos', kcal: 70, difficulty: 'Intermediário', desc: 'Desenvolvimento da impulsão vertical para bloqueios e bandejas.', inst: '1. Em pé com os pés na largura dos ombros.\n2. Agache rapidamente.\n3. Salte com máxima força.\n4. Aterrisse suavemente.\n5. Repita sem pausa.' },
    { name: 'Dribble com Obstáculos', sets: '4', reps: '30s', rest: '45s', muscleGroup: 'Coordenação/Agilidade', kcal: 55, difficulty: 'Iniciante', desc: 'Controle de bola em movimento com mudança de direção.', inst: '1. Posicione cones em zigue-zague.\n2. Drible enquanto navega os cones.\n3. Alterne as mãos.\n4. Mantenha controle sem olhar para a bola.' },
    { name: 'Paso de Pelota (Passe de Peito)', sets: '4', reps: '20 por dupla', rest: '30s', muscleGroup: 'Ombros/Tríceps', kcal: 40, difficulty: 'Iniciante', desc: 'Técnica de passe fundamental para precisão e velocidade.', inst: '1. Segure a bola no peito com as duas mãos.\n2. Passe ao parceiro com extensão dos braços.\n3. Acompanhe com o corpo.\n4. Pegue e repita.' },
    { name: 'Defensive Slide', sets: '4', reps: '30s', rest: '45s', muscleGroup: 'Adutores/Glúteo Médio', kcal: 60, difficulty: 'Intermediário', desc: 'Deslocamento lateral defensivo para acompanhar o adversário.', inst: '1. Base baixa e larga.\n2. Deslize lateralmente sem cruzar os pés.\n3. Mantenha posição defensiva.\n4. Reaja rápido à mudança de direção.' },
  ],
  'Tênis': [
    { name: 'Forehand Shadow (Sombra)', sets: '4', reps: '30 golpes', rest: '45s', muscleGroup: 'Ombros/Rotação de Tronco', kcal: 50, difficulty: 'Iniciante', desc: 'Movimento técnico de direito sem bola para fixar biomecânica.', inst: '1. Posição de base.\n2. Pivô com o pé traseiro.\n3. Swing de direito completo.\n4. Acompanhe com a raquete até o fim.' },
    { name: 'Agachamento Lateral (Split Step)', sets: '4', reps: '20 cada lado', rest: '45s', muscleGroup: 'Quadríceps/Agilidade', kcal: 55, difficulty: 'Iniciante', desc: 'Movimento de antecipação para cobertura de quadra.', inst: '1. Posição central da quadra.\n2. Pequeno salto (split step).\n3. Deslocamento lateral explosivo.\n4. Recupere ao centro.' },
    { name: 'Rotação de Ombros com Elástico', sets: '4', reps: '15 cada braço', rest: '45s', muscleGroup: 'Manguito Rotador', kcal: 30, difficulty: 'Iniciante', desc: 'Prevenção de lesão de ombro para jogadores de tênis.', inst: '1. Elástico preso na altura do cotovelo.\n2. Rotação interna e externa.\n3. Cotovelo a 90°.\n4. Movimento controlado.' },
    { name: 'Corrida de 5 Pontas (Star Drill)', sets: '5', reps: '1 volta', rest: '60s', muscleGroup: 'Agilidade/Membros Inferiores', kcal: 75, difficulty: 'Avançado', desc: 'Treino de cobertura de quadra em 5 direções.', inst: '1. Ponto central com 5 cones ao redor.\n2. Sprint ao cone 1, retorne ao centro.\n3. Sprint ao cone 2, retorne ao centro.\n4. Complete os 5 cones o mais rápido possível.' },
  ],
  'Natação': [
    { name: 'Tração no Pullup (Simulação de Crawl)', sets: '4', reps: '12', rest: '60s', muscleGroup: 'Costas/Bíceps/Ombros', kcal: 55, difficulty: 'Intermediário', desc: 'Simulação da força de tração da braçada de crawl na academia.', inst: '1. Pegada supinada na barra.\n2. Puxe simulando o movimento de crawl.\n3. Incline o tronco ligeiramente para trás.\n4. Desça completamente.' },
    { name: 'Desenvolvimento de Ombros', sets: '3', reps: '15', rest: '60s', muscleGroup: 'Deltoides/Manguito', kcal: 45, difficulty: 'Iniciante', desc: 'Fortalecimento de ombros para potência na entrada da mão.', inst: '1. Halteres na altura dos ombros.\n2. Empurre para cima sem travar os cotovelos.\n3. Controle a descida.\n4. Mantenha core contraído.' },
    { name: 'Prancha com Movimento de Braço', sets: '4', reps: '12 cada braço', rest: '45s', muscleGroup: 'Core/Ombros', kcal: 40, difficulty: 'Intermediário', desc: 'Simulação da posição horizontal na água para força de core.', inst: '1. Posição de prancha alta.\n2. Avance um braço à frente.\n3. Mantenha quadril nivelado.\n4. Alterne os braços.' },
    { name: 'Agachamento com Salto (Saída de Bloco)', sets: '4', reps: '8', rest: '75s', muscleGroup: 'Quadríceps/Explosão', kcal: 75, difficulty: 'Avançado', desc: 'Simulação da saída explosiva do bloco de largada.', inst: '1. Posição agachada baixa.\n2. Explosão máxima para frente e para cima.\n3. Braços jogados para frente.\n4. Aterrisse com amortecimento.' },
  ],
};

// ─── TÓPICO 4: Banco de dança com gasto calórico por hora para cálculo proporcional ─────
const DANCE_DURATIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const DANCE_RHYTHMS = [
  { name: 'Forró', duration: '60 min/aula', kcal: '300–450 kcal/hora', kcalPerHour: 375, intensity: 'Moderada a Alta', desc: 'Dança típica nordestina com movimentos sincronizados a dois. Base no trio pé-tanque: sanfona, zabumba e triângulo. Passos básicos incluem o xote, baião e arrasta-pé. Exige boa coordenação e sincronização com o parceiro.' },
  { name: 'Salsa', duration: '60 min/aula', kcal: '400–600 kcal/hora', kcalPerHour: 500, intensity: 'Alta', desc: 'Dança cubana/latina de ritmo rápido. Passos em 3 tempos (1-2-3, 5-6-7). Trabalha fortemente rotação de quadril, deslocamento lateral e giros. Melhora coordenação, cardio e expressão corporal.' },
  { name: 'Bolero', duration: '60 min/aula', kcal: '200–300 kcal/hora', kcalPerHour: 250, intensity: 'Baixa a Moderada', desc: 'Dança lenta e romântica de origem cubana. Passos suaves e deslizantes em compasso 3/4. Enfatiza conexão e comunicação entre os parceiros. Ideal para iniciantes na dança de salão.' },
  { name: 'Bachata', duration: '60 min/aula', kcal: '300–450 kcal/hora', kcalPerHour: 375, intensity: 'Moderada', desc: 'Dança originária da República Dominicana. Ritmo em 4 tempos com batida lateral marcada. Muito sensual, com movimentos de quadril pronunciados. Popular nas academias de dança contemporâneas.' },
  { name: 'Axé', duration: '60 min/aula', kcal: '450–650 kcal/hora', kcalPerHour: 550, intensity: 'Alta', desc: 'Ritmo baiano com coreografias animadas e solo. Não requer parceiro. Passos como o Vou de Táxi, Pombo Correio e Galinho. Alta exigência cardio e coordenação de membros independentes.' },
  { name: 'Rock (Swing)', duration: '60 min/aula', kcal: '350–500 kcal/hora', kcalPerHour: 425, intensity: 'Moderada a Alta', desc: 'Dança animada originada no rock and roll dos anos 50. Passos básicos com giros e acrobacias entre parceiros. Trabalha potência dos membros inferiores e timing musical.' },
  { name: 'Zouk', duration: '60 min/aula', kcal: '250–400 kcal/hora', kcalPerHour: 325, intensity: 'Moderada', desc: 'Dança brasileira de casal com movimentos ondulares sensuais. Famoso pelo movimento de cabeça da mulher. Fluidez e conexão são essenciais. Exige controle corporal avançado.' },
  { name: 'Samba de Gafieira', duration: '60 min/aula', kcal: '400–600 kcal/hora', kcalPerHour: 500, intensity: 'Alta', desc: 'Versão carioca do samba para salão de festas. Sincopado e improvisado. Passos incluem o samba no pé, gira, e balanço. Excelente para condicionamento cardiorrespiratório e agilidade de pés.' },
  { name: 'Merengue', duration: '60 min/aula', kcal: '300–450 kcal/hora', kcalPerHour: 375, intensity: 'Moderada', desc: 'Dança originária da República Dominicana, de ritmo marchado. Muito acessível para iniciantes. Passos básicos em marcha lateral. Ótimo para desenvolver senso rítmico e coordenação.' },
  { name: 'Tango', duration: '60 min/aula', kcal: '250–400 kcal/hora', kcalPerHour: 325, intensity: 'Moderada', desc: 'Dança dramática de origem argentina com forte conexão entre pares. Famoso pelas pausas dramáticas e caminhadas precisas. Exige postura ereta e comunicação sutil entre os dançarinos.' },
  { name: 'Kizomba', duration: '60 min/aula', kcal: '200–350 kcal/hora', kcalPerHour: 275, intensity: 'Baixa a Moderada', desc: 'Dança afro-caribenha de origem angolana. Movimentos suaves, ondulares e sensuais. Forte influência do semba e cabo love. Muito popular nas academias europeias e brasileiras.' },
];

// ─── Exercícios por categoria/área geral ─────────────────────────────────────
function getExercisesForArea(catId: string, area: string) {
  const pool: Record<string, Record<string, Array<{name:string; sets:string; reps:string; rest:string; muscleGroup:string; kcal:number; difficulty:string; desc:string; inst:string}>>> = {
    musculacao: {
      Peito: [
        {name:'Supino Reto com Barra', sets:'4', reps:'8-12', rest:'90s', muscleGroup:'Peitoral Maior', kcal:65, difficulty:'Intermediário', desc:'Exercício fundamental para peitoral completo. Trabalha peitoral, deltóide anterior e tríceps.', inst:'1. Deite no banco.\n2. Pegada levemente além dos ombros.\n3. Desça a barra até o peito.\n4. Empurre explosivo até extensão completa.'},
        {name:'Supino Inclinado com Halteres', sets:'3', reps:'10-12', rest:'75s', muscleGroup:'Peitoral Superior', kcal:55, difficulty:'Intermediário', desc:'Ênfase no feixe superior do peitoral.', inst:'1. Banco inclinado a 30-45°.\n2. Halteres na altura do peito.\n3. Empurre para cima convergindo ao centro.\n4. Desça controlado até amplitude total.'},
        {name:'Crucifixo Plano', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Peitoral Médio', kcal:45, difficulty:'Iniciante', desc:'Isolamento do peitoral com amplitude máxima.', inst:'1. Banco plano, halteres estendidos acima.\n2. Braços levemente fletidos.\n3. Abra até o alinhamento dos ombros.\n4. Feche contraindo o peito no topo.'},
        {name:'Supino Declinado com Barra', sets:'3', reps:'10-12', rest:'75s', muscleGroup:'Peitoral Inferior', kcal:60, difficulty:'Intermediário', desc:'Ênfase no feixe inferior e esterno do peitoral.', inst:'1. Banco declinado a 30°.\n2. Pegada pronada na barra.\n3. Desça até o esterno.\n4. Empurre explosivo.'},
        {name:'Flexão de Braços (Push-Up)', sets:'4', reps:'15-25', rest:'60s', muscleGroup:'Peitoral/Ombros/Tríceps', kcal:40, difficulty:'Iniciante', desc:'Exercício funcional para peitoral e ombros sem equipamento.', inst:'1. Mãos na largura dos ombros.\n2. Corpo em linha reta da cabeça aos pés.\n3. Desça até o peito quase tocar o chão.\n4. Empurre para cima explosivo.'},
        {name:'Cross-over no Cabo', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Peitoral Interno', kcal:50, difficulty:'Intermediário', desc:'Isolamento do peitoral com contração máxima no centro.', inst:'1. Cabos na altura dos ombros.\n2. Passos à frente com o tronco levemente inclinado.\n3. Traga os cabos à frente cruzando.\n4. Contraia o peitoral no cruzamento.'},
        {name:'Pullover com Halter', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Peitoral/Dorsais', kcal:45, difficulty:'Intermediário', desc:'Exercício que trabalha peitoral e dorsais simultaneamente.', inst:'1. Deitado perpendicular ao banco.\n2. Segure o halter com ambas as mãos acima do peito.\n3. Desça o halter para trás da cabeça com cotovelos levemente fletidos.\n4. Retorne à posição inicial.'},
        {name:'Fly na Máquina (Peck Deck)', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Peitoral Médio', kcal:42, difficulty:'Iniciante', desc:'Isolamento do peitoral em máquina, ideal para iniciantes.', inst:'1. Ajuste o assento com cotovelos na altura dos ombros.\n2. Coloque os antebraços nos apoios.\n3. Feche os braços contraindo o peitoral.\n4. Abra controlado sem soltar o peso.'},
        {name:'Supino com Halteres (Banco Plano)', sets:'4', reps:'10-12', rest:'75s', muscleGroup:'Peitoral Maior', kcal:60, difficulty:'Intermediário', desc:'Versão com halteres do supino plano, maior amplitude.', inst:'1. Deitado, halteres à altura do peito.\n2. Cotovelos ligeiramente abaixo dos ombros.\n3. Empurre os halteres convergindo ao centro.\n4. Desça com amplitude maior que a barra.'},
        {name:'Mergulho entre Bancos (Bench Dip)', sets:'4', reps:'12-20', rest:'60s', muscleGroup:'Peitoral Inferior/Tríceps', kcal:50, difficulty:'Iniciante', desc:'Exercício de peso corporal para peitoral inferior e tríceps.', inst:'1. Mãos no banco atrás de você, pernas estendidas.\n2. Desça flexionando os cotovelos a 90°.\n3. Empurre para cima até extensão dos cotovelos.\n4. Mantenha as costas próximas ao banco.'},
      ],
      Costas: [
        {name:'Barra Fixa (Pull-Up)', sets:'4', reps:'6-10', rest:'90s', muscleGroup:'Dorsais/Bíceps', kcal:60, difficulty:'Intermediário', desc:'Rei dos exercícios para dorsais. Trabalha latíssimo, bíceps e romboides.', inst:'1. Pegada pronada levemente além dos ombros.\n2. Puxe o queixo acima da barra.\n3. Sem impulso do corpo.\n4. Desça completamente com controle.'},
        {name:'Remada Curvada com Barra', sets:'4', reps:'8-12', rest:'90s', muscleGroup:'Dorsais/Romboides', kcal:65, difficulty:'Intermediário', desc:'Espessura de costas e romboides. Fundamental para costas largas.', inst:'1. Incline tronco a 45°.\n2. Pegada pronada.\n3. Puxe a barra ao umbigo.\n4. Esmague as escápulas no topo.'},
        {name:'Remada Unilateral com Halter', sets:'3', reps:'10-12 cada', rest:'60s', muscleGroup:'Dorsais/Bíceps', kcal:50, difficulty:'Iniciante', desc:'Remada com amplitude máxima e isolamento unilateral.', inst:'1. Apoie joelho e mão no banco.\n2. Puxe o halter ao quadril.\n3. Cotovelo riscando as costelas.\n4. Desça totalmente até extensão.'},
        {name:'Pulldown na Polia', sets:'4', reps:'10-12', rest:'75s', muscleGroup:'Latíssimo/Bíceps', kcal:55, difficulty:'Iniciante', desc:'Alternativa ao pull-up, ideal para iniciantes.', inst:'1. Sente-se com coxas fixadas.\n2. Puxe a barra até o peito.\n3. Incline levemente o tronco para trás.\n4. Desça controlado com braços quase estendidos.'},
        {name:'Remada Máquina (Seated Row)', sets:'4', reps:'10-12', rest:'75s', muscleGroup:'Romboides/Trapézio Médio', kcal:50, difficulty:'Iniciante', desc:'Remada em máquina para espessura de costas.', inst:'1. Sente-se com pés no apoio.\n2. Puxe as alças ao abdômen.\n3. Esmague as escápulas.\n4. Desça controlado.'},
        {name:'Remada Alta (Upright Row)', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Trapézio/Deltóide Lateral', kcal:45, difficulty:'Intermediário', desc:'Trabalha trapézio e deltóide lateral. Atenção à postura.', inst:'1. Barra ou halteres à frente do corpo.\n2. Puxe verticalmente até a altura do queixo.\n3. Cotovelos acima dos punhos.\n4. Desça controlado.'},
        {name:'Face Pull no Cabo', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Deltóide Posterior/Manguito', kcal:35, difficulty:'Iniciante', desc:'Essencial para saúde do ombro e equilíbrio muscular.', inst:'1. Corda na polia alta.\n2. Puxe em direção à testa.\n3. Separe as mãos na chegada.\n4. Cotovelos alinhados aos ombros.'},
        {name:'Hiperextensão Lombar', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Lombar/Glúteos', kcal:35, difficulty:'Iniciante', desc:'Fortalecimento da cadeia posterior e lombar.', inst:'1. Posicione-se na bancada de hiperextensão.\n2. Braços cruzados no peito ou atrás da cabeça.\n3. Desça controlado.\n4. Suba até o alinhamento do tronco.'},
        {name:'Remada Cavalinho (T-Bar Row)', sets:'4', reps:'8-12', rest:'90s', muscleGroup:'Dorsais/Romboides', kcal:65, difficulty:'Intermediário', desc:'Exercício clássico de espessura de costas.', inst:'1. Fique por cima da barra fixada no chão.\n2. Agarre com mãos próximas.\n3. Incline o tronco.\n4. Puxe ao peito contraindo as costas.'},
        {name:'Puxada Frontal Abertura', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Latíssimo/Romboides', kcal:48, difficulty:'Iniciante', desc:'Puxada aberta para largura de costas.', inst:'1. Pegada mais larga que os ombros.\n2. Puxe a barra até a parte alta do peito.\n3. Cotovelos apontando para baixo.\n4. Desça com amplitude total.'},
      ],
      Pernas: [
        {name:'Agachamento Livre', sets:'4', reps:'8-12', rest:'120s', muscleGroup:'Quadríceps/Glúteos', kcal:80, difficulty:'Intermediário', desc:'Exercício principal para membros inferiores. Trabalha quadríceps, glúteos e posteriores.', inst:'1. Pés na largura dos ombros.\n2. Desça até 90° ou abaixo.\n3. Costas retas, joelhos alinhados.\n4. Suba empurrando pelos calcanhares.'},
        {name:'Leg Press 45°', sets:'4', reps:'10-15', rest:'90s', muscleGroup:'Quadríceps', kcal:70, difficulty:'Iniciante', desc:'Desenvolvimento seguro de quadríceps em máquina.', inst:'1. Pés na plataforma na largura dos ombros.\n2. Destrave e desça até 90°.\n3. Empurre sem travar os joelhos no topo.\n4. Controle a descida.'},
        {name:'Cadeira Extensora', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Quadríceps', kcal:45, difficulty:'Iniciante', desc:'Isolamento de quadríceps em máquina.', inst:'1. Ajuste o apoio atrás dos tornozelos.\n2. Estenda completamente as pernas.\n3. Contraia no topo.\n4. Desça controlado.'},
        {name:'Mesa Flexora', sets:'4', reps:'10-12', rest:'60s', muscleGroup:'Posteriores de Coxa', kcal:50, difficulty:'Iniciante', desc:'Isolamento dos músculos posteriores da coxa.', inst:'1. Deite de bruços na máquina.\n2. Apoio no calcanhar.\n3. Flexione até 90° ou mais.\n4. Desça controlado.'},
        {name:'Agachamento Búlgaro', sets:'3', reps:'10 cada', rest:'90s', muscleGroup:'Quadríceps/Glúteos', kcal:70, difficulty:'Intermediário', desc:'Agachamento unilateral para força e equilíbrio.', inst:'1. Pé traseiro apoiado no banco.\n2. Desça o joelho traseiro próximo ao chão.\n3. Tronco ereto.\n4. Empurre com a perna da frente.'},
        {name:'Stiff com Barra', sets:'4', reps:'8-10', rest:'90s', muscleGroup:'Posteriores/Glúteos/Lombar', kcal:75, difficulty:'Intermediário', desc:'Exercício poderoso para cadeia posterior.', inst:'1. Barra na frente, pernas semiflexionadas.\n2. Incline o tronco mantendo coluna reta.\n3. Desça até sentir o alongamento.\n4. Suba contraindo glúteos e posteriores.'},
        {name:'Afundo (Lunge)', sets:'3', reps:'12 cada', rest:'60s', muscleGroup:'Quadríceps/Glúteos', kcal:60, difficulty:'Iniciante', desc:'Exercício funcional unilateral para pernas.', inst:'1. Em pé, dê um passo à frente.\n2. Desça o joelho traseiro próximo ao chão.\n3. Ambos os joelhos a 90°.\n4. Volte à posição inicial.'},
        {name:'Panturrilha em Pé (Calf Raise)', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Gastrocnêmio/Sóleo', kcal:30, difficulty:'Iniciante', desc:'Isolamento de panturrilha em pé.', inst:'1. Pé na borda de um step ou apoio.\n2. Calcanhares para baixo no início.\n3. Suba nas pontas dos pés.\n4. Desça controlado.'},
        {name:'Agachamento Sumô', sets:'4', reps:'10-12', rest:'90s', muscleGroup:'Adutores/Glúteos', kcal:72, difficulty:'Iniciante', desc:'Variação de agachamento com ênfase em adutores e glúteos.', inst:'1. Pés mais largos que os ombros, pontas para fora.\n2. Desça até 90° ou abaixo.\n3. Joelhos apontando na direção dos pés.\n4. Suba pelos calcanhares.'},
        {name:'Leg Curl em Pé (Posterior Polia)', sets:'3', reps:'12-15 cada', rest:'45s', muscleGroup:'Posteriores de Coxa', kcal:40, difficulty:'Iniciante', desc:'Isolamento unilateral dos posteriores de coxa.', inst:'1. De pé, uma perna no apoio da polia baixa.\n2. Segure num apoio para equilíbrio.\n3. Flexione o joelho puxando o calcanhar ao glúteo.\n4. Desça controlado.'},
      ],
      Ombros: [
        {name:'Desenvolvimento Arnold', sets:'4', reps:'10-12', rest:'75s', muscleGroup:'Deltoides Completo', kcal:55, difficulty:'Intermediário', desc:'Trabalha todos os feixes do deltoide com rotação.', inst:'1. Halteres na frente dos ombros, palmas para dentro.\n2. Gire as palmas enquanto empurra para cima.\n3. Palmas para fora no topo.\n4. Inverta o movimento na descida.'},
        {name:'Elevação Lateral com Halter', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Deltoide Lateral', kcal:40, difficulty:'Iniciante', desc:'Ênfase no deltoide lateral para ombros largos.', inst:'1. Em pé, halteres ao lado do corpo.\n2. Eleve lateralmente até a linha dos ombros.\n3. Ligeira rotação do punho (dedinho para cima).\n4. Desça controlado.'},
        {name:'Desenvolvimento com Barra', sets:'4', reps:'8-12', rest:'90s', muscleGroup:'Deltóide Anterior/Médio', kcal:60, difficulty:'Intermediário', desc:'Desenvolvimento militar com barra, movimentação pesada.', inst:'1. Barra à frente na altura dos ombros.\n2. Empurre para cima até extensão.\n3. Não trave o cotovelo no topo.\n4. Desça controlado até o início.'},
        {name:'Elevação Frontal com Halteres', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Deltóide Anterior', kcal:38, difficulty:'Iniciante', desc:'Isolamento do feixe anterior do deltóide.', inst:'1. Em pé, halteres à frente das coxas.\n2. Eleve um braço por vez até a altura dos ombros.\n3. Mantenha cotovelo levemente fletido.\n4. Desça controlado.'},
        {name:'Crucifixo Inverso', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Deltóide Posterior', kcal:35, difficulty:'Iniciante', desc:'Trabalha deltóide posterior, essencial para postura.', inst:'1. Incline o tronco para frente a 90°.\n2. Halteres pendurados.\n3. Eleve lateralmente até a linha dos ombros.\n4. Contraia o deltóide posterior.'},
        {name:'Encolhimento de Ombros (Shrug)', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Trapézio Superior', kcal:40, difficulty:'Iniciante', desc:'Desenvolvimento do trapézio superior.', inst:'1. Em pé ou sentado com halteres.\n2. Encolha os ombros em direção às orelhas.\n3. Segure 1 segundo no topo.\n4. Desça lentamente.'},
        {name:'Press na Máquina (Shoulder Press)', sets:'3', reps:'10-12', rest:'75s', muscleGroup:'Deltóide Completo', kcal:52, difficulty:'Iniciante', desc:'Desenvolvimento de ombros em máquina, ideal para iniciantes.', inst:'1. Ajuste o assento com as alças na altura dos ombros.\n2. Empurre para cima.\n3. Não trave os cotovelos.\n4. Desça controlado.'},
        {name:'Rotação Externa com Elástico', sets:'3', reps:'15-20', rest:'45s', muscleGroup:'Manguito Rotador', kcal:20, difficulty:'Iniciante', desc:'Prevenção de lesões de ombro, fortalece manguito rotador.', inst:'1. Cotovelo fixo a 90° ao lado do corpo.\n2. Elástico preso à frente.\n3. Gire o antebraço para fora.\n4. Retorne controlado.'},
        {name:'Elevação Lateral no Cabo', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Deltoide Lateral', kcal:38, difficulty:'Iniciante', desc:'Elevação lateral no cabo com tensão constante.', inst:'1. Polia baixa ao lado do corpo.\n2. Segure com a mão oposta ao cabo.\n3. Eleve lateralmente até a linha dos ombros.\n4. Desça controlado.'},
        {name:'Face Pull com Corda', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Deltóide Posterior/Trapézio', kcal:32, difficulty:'Iniciante', desc:'Excelente para postura e saúde do ombro.', inst:'1. Corda na polia alta.\n2. Puxe em direção à testa separando as mãos.\n3. Cotovelos alinhados aos ombros.\n4. Contraia escápulas.'},
      ],
      Braços: [
        {name:'Rosca Direta com Barra', sets:'4', reps:'10-12', rest:'60s', muscleGroup:'Bíceps', kcal:40, difficulty:'Iniciante', desc:'Exercício principal de bíceps. Ação de supinação máxima.', inst:'1. Cotovelos colados ao tronco.\n2. Flexione sem balanço do tronco.\n3. Contraia no topo, supinando o punho.\n4. Desça controlado até extensão.'},
        {name:'Tríceps Testa (Skull Crusher)', sets:'4', reps:'10-12', rest:'60s', muscleGroup:'Tríceps', kcal:45, difficulty:'Intermediário', desc:'Isolamento de tríceps com amplitude máxima.', inst:'1. Deitado no banco, barra acima do rosto.\n2. Flexione apenas os cotovelos.\n3. Desça a barra até a testa.\n4. Estenda os cotovelos explosivo.'},
        {name:'Rosca Alternada com Halteres', sets:'4', reps:'10-12 cada', rest:'60s', muscleGroup:'Bíceps', kcal:38, difficulty:'Iniciante', desc:'Rosca alternada para desenvolvimento unilateral do bíceps.', inst:'1. Em pé, halteres ao lado.\n2. Flexione um braço por vez.\n3. Gire o punho para fora na subida.\n4. Troque os braços alternando.'},
        {name:'Rosca Martelo', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Bíceps/Braquial', kcal:38, difficulty:'Iniciante', desc:'Rosca com pegada neutra, trabalha braquial e braquiorradial.', inst:'1. Halteres com pegada neutra (polegar para cima).\n2. Flexione sem rotar o punho.\n3. Contraia no topo.\n4. Desça controlado.'},
        {name:'Tríceps Pulley (Corda)', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Tríceps', kcal:40, difficulty:'Iniciante', desc:'Isolamento de tríceps na polia com corda.', inst:'1. Polia alta, corda na frente do rosto.\n2. Cotovelos fixos ao lado do corpo.\n3. Estenda para baixo separando a corda.\n4. Retorne controlado.'},
        {name:'Tríceps Francês com Halter', sets:'3', reps:'12-15', rest:'60s', muscleGroup:'Tríceps', kcal:42, difficulty:'Intermediário', desc:'Exercício excelente para cabeça longa do tríceps.', inst:'1. Sentado, halter acima da cabeça com as duas mãos.\n2. Flexione os cotovelos atrás da cabeça.\n3. Desça até 90° ou mais.\n4. Estenda contraindo o tríceps.'},
        {name:'Rosca Concentrada', sets:'3', reps:'12-15 cada', rest:'45s', muscleGroup:'Bíceps', kcal:35, difficulty:'Iniciante', desc:'Isolamento máximo do bíceps com cotovelo apoiado.', inst:'1. Sentado, cotovelo apoiado na coxa interna.\n2. Flexione o antebraço.\n3. Contraia fortemente no topo.\n4. Desça completamente.'},
        {name:'Dip em Paralelas (Tríceps)', sets:'4', reps:'8-15', rest:'75s', muscleGroup:'Tríceps/Peitoral', kcal:55, difficulty:'Intermediário', desc:'Mergulho nas paralelas com foco em tríceps (tronco ereto).', inst:'1. Suspenda nas paralelas, tronco ereto.\n2. Desça flexionando os cotovelos.\n3. Cotovelos para trás (não para os lados).\n4. Empurre até extensão.'},
        {name:'Rosca 21 com Barra', sets:'3', reps:'21 (7+7+7)', rest:'75s', muscleGroup:'Bíceps Completo', kcal:50, difficulty:'Intermediário', desc:'Técnica avançada: 7 meias reps baixas, 7 meias reps altas, 7 completas.', inst:'1. 7 reps na metade inferior (0-90°).\n2. 7 reps na metade superior (90-180°).\n3. 7 reps completas.\n4. Sem descanso entre os blocos.'},
        {name:'Kick Back de Tríceps', sets:'3', reps:'15 cada', rest:'45s', muscleGroup:'Tríceps', kcal:30, difficulty:'Iniciante', desc:'Extensão de tríceps em kick back unilateral.', inst:'1. Apoio de um joelho e mão no banco.\n2. Cotovelo a 90°, paralelo ao tronco.\n3. Estenda o braço para trás contraindo o tríceps.\n4. Volte a 90° controlado.'},
      ],
      Core: [
        {name:'Prancha com Variações', sets:'4', reps:'45s', rest:'30s', muscleGroup:'Core Completo', kcal:30, difficulty:'Iniciante', desc:'Estabilidade de core com variações lateral e dinâmica.', inst:'1. Antebraços no chão.\n2. Corpo reto da cabeça aos pés.\n3. Contraia abdômen e glúteos.\n4. Varie: lateral, com elevação de perna, dinâmica.'},
        {name:'Abdominal Supra com Apoio', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Reto Abdominal', kcal:25, difficulty:'Iniciante', desc:'Exercício fundamental de abdômen.', inst:'1. Deitado, joelhos dobrados.\n2. Mãos atrás da cabeça.\n3. Suba levantando as escápulas.\n4. Desça controlado sem pousar completamente.'},
        {name:'Abdominal Oblíquo (Bicicleta)', sets:'4', reps:'20-30 cada lado', rest:'45s', muscleGroup:'Oblíquos', kcal:30, difficulty:'Iniciante', desc:'Trabalha oblíquos e reto abdominal simultaneamente.', inst:'1. Deitado, mãos atrás da cabeça.\n2. Suba girando o cotovelo ao joelho oposto.\n3. Alterne os lados em movimento de bicicleta.\n4. Mantenha lombar no chão.'},
        {name:'Elevação de Pernas (Leg Raise)', sets:'4', reps:'12-15', rest:'45s', muscleGroup:'Abdômen Inferior', kcal:35, difficulty:'Intermediário', desc:'Ênfase na parte inferior do reto abdominal.', inst:'1. Deitado, mãos sob os glúteos.\n2. Pernas estendidas e levemente acima do chão.\n3. Eleve as pernas até 90°.\n4. Desça controlado sem pousar.'},
        {name:'Russian Twist', sets:'4', reps:'20 cada lado', rest:'45s', muscleGroup:'Oblíquos/Core', kcal:40, difficulty:'Intermediário', desc:'Rotação de tronco para oblíquos.', inst:'1. Sentado com tronco a 45°, pés no ar.\n2. Segure um halter ou medicine ball.\n3. Gire o tronco de lado a lado.\n4. Toque o peso no chão em cada lado.'},
        {name:'Dead Bug', sets:'3', reps:'10 cada lado', rest:'30s', muscleGroup:'Core Profundo', kcal:22, difficulty:'Iniciante', desc:'Exercício de controle motor e estabilidade lombar.', inst:'1. Deitado de costas, braços acima da cabeça, pernas a 90°.\n2. Abaixe braço direito e perna esquerda ao mesmo tempo.\n3. Mantenha a lombar no chão.\n4. Volte e troque os lados.'},
        {name:'Ab Wheel (Roda Abdominal)', sets:'4', reps:'8-12', rest:'60s', muscleGroup:'Core Completo/Dorsais', kcal:45, difficulty:'Avançado', desc:'Exercício avançado de core com roda abdominal.', inst:'1. Ajoelhado, segure a roda na frente.\n2. Role para frente mantendo o core contraído.\n3. Desça o máximo possível sem pousar o tronco.\n4. Volte puxando com abdômen e costas.'},
        {name:'Prancha Lateral', sets:'4', reps:'30-45s cada lado', rest:'30s', muscleGroup:'Oblíquos/Core Lateral', kcal:28, difficulty:'Iniciante', desc:'Estabilidade lateral do core.', inst:'1. Apoio no antebraço lateral.\n2. Pés empilhados ou separados.\n3. Quadril elevado do chão.\n4. Mantenha o corpo em linha reta.'},
        {name:'Crunch com Cabo (Polia Alta)', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Reto Abdominal', kcal:35, difficulty:'Intermediário', desc:'Abdominal com resistência progressiva no cabo.', inst:'1. Ajoelhado de costas para a polia alta.\n2. Segure a corda atrás da cabeça.\n3. Flexione o tronco para baixo contraindo o abdômen.\n4. Volte controlado.'},
        {name:'Hollow Hold', sets:'4', reps:'30-45s', rest:'30s', muscleGroup:'Core Completo', kcal:25, difficulty:'Intermediário', desc:'Posição isométrica de core muito eficaz.', inst:'1. Deitado de costas.\n2. Eleve ombros e pernas levemente acima do chão.\n3. Braços estendidos acima da cabeça.\n4. Mantenha a lombar no chão.'},
      ],
      Glúteos: [
        {name:'Hip Thrust com Barra', sets:'4', reps:'10-15', rest:'75s', muscleGroup:'Glúteo Máximo', kcal:55, difficulty:'Intermediário', desc:'Melhor exercício para glúteo máximo comprovado por EMG.', inst:'1. Ombros no banco, barra no quadril com proteção.\n2. Eleve o quadril até alinhamento corpo-tronco.\n3. Contraia fortemente os glúteos no topo.\n4. Desça controlado.'},
        {name:'Glúteo 4 Apoios (Donkey Kick)', sets:'4', reps:'15 cada', rest:'45s', muscleGroup:'Glúteo Máximo', kcal:35, difficulty:'Iniciante', desc:'Isolamento de glúteo em posição quadrúpede.', inst:'1. De 4 apoios, joelhos sob quadril.\n2. Eleve um joelho para trás e para cima.\n3. Calcanhar paralelo ao teto.\n4. Contraia forte e desça controlado.'},
        {name:'Agachamento Sumô com Halter', sets:'4', reps:'12-15', rest:'75s', muscleGroup:'Glúteos/Adutores', kcal:65, difficulty:'Iniciante', desc:'Ênfase em glúteos e adutores com base larga.', inst:'1. Pés mais que os ombros, pontas para fora.\n2. Halter pendurado entre as pernas.\n3. Desça até coxas paralelas.\n4. Suba contraindo glúteos.'},
        {name:'Afundo Reverso com Joelho Alto', sets:'3', reps:'12 cada', rest:'60s', muscleGroup:'Glúteos/Quadríceps', kcal:60, difficulty:'Iniciante', desc:'Afundo reverso com elevação de joelho para ativar glúteo.', inst:'1. Em pé, dê um passo para trás.\n2. Desça o joelho traseiro próximo ao chão.\n3. Suba trazendo o joelho traseiro à frente em elevação.\n4. Alterne as pernas.'},
        {name:'Cadeira Abdutora', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Glúteo Médio/Mínimo', kcal:30, difficulty:'Iniciante', desc:'Isolamento do glúteo médio na máquina abdutora.', inst:'1. Sente-se com coxas nos apoios.\n2. Afaste as pernas contra a resistência.\n3. Contraia glúteo médio no topo.\n4. Retorne controlado.'},
        {name:'Elevação de Quadril Unilateral', sets:'4', reps:'12-15 cada', rest:'60s', muscleGroup:'Glúteo Máximo/Médio', kcal:40, difficulty:'Intermediário', desc:'Hip thrust unilateral para maior ativação e correção de desequilíbrios.', inst:'1. Ombros no banco, uma perna estendida.\n2. Eleve o quadril com a perna de apoio.\n3. Mantenha a outra perna estendida paralela.\n4. Contraia o glúteo de apoio no topo.'},
        {name:'Stepmill (Escada Rolante)', sets:'1', reps:'20-30 min', rest:'—', muscleGroup:'Glúteos/Quadríceps/Cardio', kcal:250, difficulty:'Intermediário', desc:'Cardio de alto impacto para glúteos e membros inferiores.', inst:'1. Suba os degraus com postura ereta.\n2. Apoie o pé inteiro no degrau.\n3. Empurre o calcanhar para ativar o glúteo.\n4. Mantenha ritmo constante.'},
        {name:'Monster Walk com Miniband', sets:'4', reps:'20 passos cada', rest:'45s', muscleGroup:'Glúteo Médio/Mínimo', kcal:35, difficulty:'Iniciante', desc:'Caminhada lateral com elástico para ativar glúteo médio.', inst:'1. Elástico nos tornozelos ou joelhos.\n2. Posição semiflexionada.\n3. Passos laterais mantendo tensão.\n4. Não deixe os pés se juntarem.'},
        {name:'Coice no Cabo (Glúteo Polia)', sets:'4', reps:'15 cada', rest:'45s', muscleGroup:'Glúteo Máximo', kcal:38, difficulty:'Iniciante', desc:'Extensão de quadril no cabo para ativar glúteo máximo.', inst:'1. Polia baixa no tornozelo.\n2. Segure num apoio.\n3. Estenda o quadril para trás.\n4. Contraia no topo e retorne.'},
        {name:'Stiff Unilateral com Halter', sets:'3', reps:'10-12 cada', rest:'75s', muscleGroup:'Posteriores/Glúteos', kcal:55, difficulty:'Intermediário', desc:'Romanian deadlift unilateral para cadeia posterior.', inst:'1. Em pé numa perna, halter na mão oposta.\n2. Incline o tronco para frente com controle.\n3. Perna livre vai para trás como contrapeso.\n4. Volte contraindo glúteo da perna de apoio.'},
      ],
    },
    calistenia: {
      Peito: [
        {name:'Flexão de Braços (Push-Up)', sets:'4', reps:'10-20', rest:'60s', muscleGroup:'Peitoral/Ombros/Tríceps', kcal:40, difficulty:'Iniciante', desc:'Base do treinamento de empurrão, trabalha peitoral, ombros e tríceps simultaneamente.', inst:'1. Mãos levemente além dos ombros.\n2. Corpo em linha reta dos calcanhares à cabeça.\n3. Desça até o peito quase tocar o chão.\n4. Empurre explosivo até extensão dos cotovelos.'},
        {name:'Flexão Diamante', sets:'4', reps:'8-12', rest:'75s', muscleGroup:'Tríceps/Peitoral Interno', kcal:42, difficulty:'Intermediário', desc:'Ênfase em tríceps e peitoral interno com mãos aproximadas em formato de diamante.', inst:'1. Mãos em forma de diamante sob o esterno.\n2. Cotovelos paralelos ao corpo.\n3. Desça controlado até o peito quase tocar as mãos.\n4. Empurre até extensão completa.'},
        {name:'Paralelas (Dip)', sets:'4', reps:'8-15', rest:'90s', muscleGroup:'Peitoral/Tríceps', kcal:55, difficulty:'Intermediário', desc:'Exercício completo de peitoral e tríceps em suspensão nas barras paralelas.', inst:'1. Suspenda nas paralelas com braços estendidos.\n2. Incline levemente o tronco à frente.\n3. Desça até cotovelos a 90°.\n4. Empurre até extensão total evitando hiperestender os cotovelos.'},
        {name:'Flexão Arqueiro', sets:'3', reps:'6-10 cada', rest:'90s', muscleGroup:'Peitoral/Ombros', kcal:50, difficulty:'Avançado', desc:'Flexão unilateral progressiva que prepara para a flexão de um braço.', inst:'1. Posição de flexão ampla.\n2. Dobre um cotovelo descendo para um lado.\n3. O outro braço permanece estendido como apoio.\n4. Empurre de volta ao centro e alterne.'},
        {name:'Flexão Declinada (Pés Elevados)', sets:'4', reps:'10-15', rest:'75s', muscleGroup:'Peitoral Superior', kcal:45, difficulty:'Intermediário', desc:'Pés elevados numa superfície para ênfase no peitoral superior e ombros.', inst:'1. Mãos no chão, pés elevados num banco ou degrau.\n2. Corpo em linha reta inclinada.\n3. Desça o peito em direção ao chão.\n4. Empurre de volta mantendo o corpo rígido.'},
        {name:'Flexão Explosiva (Clap Push-Up)', sets:'3', reps:'6-10', rest:'90s', muscleGroup:'Peitoral/Potência', kcal:55, difficulty:'Avançado', desc:'Flexão com fase concêntrica explosiva que desenvolve potência e velocidade.', inst:'1. Posição de flexão padrão.\n2. Desça controlado.\n3. Empurre explosivamente saindo do chão.\n4. Bata palmas no ar e repousa suavemente com cotovelos semiflexionados.'},
        {name:'Flexão Pseudo Planche', sets:'3', reps:'8-12', rest:'90s', muscleGroup:'Peitoral/Ombros Anteriores', kcal:50, difficulty:'Avançado', desc:'Mãos posicionadas atrás do quadril, trabalha ombros anteriores e peitoral intensamente.', inst:'1. Mãos no chão apontando para os pés, ao nível do quadril.\n2. Incline o corpo para frente transferindo peso para os braços.\n3. Desça o peito em direção às mãos.\n4. Empurre mantendo o tronco projetado.'},
        {name:'Flexão Inclinada (Mãos Elevadas)', sets:'4', reps:'12-20', rest:'60s', muscleGroup:'Peitoral Inferior', kcal:35, difficulty:'Iniciante', desc:'Versão facilitada com mãos elevadas, ênfase em peitoral inferior, ideal para iniciantes.', inst:'1. Mãos apoiadas num banco ou parede elevada.\n2. Corpo em linha reta.\n3. Desça o peito à superfície.\n4. Empurre de volta. Quanto mais elevado, mais fácil.'},
        {name:'Flexão com Rotação (Spiderman)', sets:'3', reps:'10 cada', rest:'75s', muscleGroup:'Peitoral/Core/Oblíquos', kcal:48, difficulty:'Intermediário', desc:'Flexão com joelho trazido ao cotovelo, combinando peitoral e mobilidade de quadril.', inst:'1. Posição de flexão padrão.\n2. Ao descer, traga o joelho direito ao cotovelo direito.\n3. Empurre de volta estendendo a perna.\n4. Alterne o lado a cada repetição.'},
        {name:'Handstand Push-Up (Parede)', sets:'3', reps:'5-8', rest:'120s', muscleGroup:'Ombros/Peitoral Superior', kcal:60, difficulty:'Avançado', desc:'Flexão invertida apoiado na parede, máxima ativação de ombros e peitoral superior.', inst:'1. Suba para handstand apoiado na parede.\n2. Mãos a 15-30cm da parede.\n3. Desça a cabeça entre as mãos.\n4. Empurre de volta à extensão completa dos braços.'},
      ],
      Costas: [
        {name:'Barra Fixa Pronada (Pull-Up)', sets:'4', reps:'5-10', rest:'90s', muscleGroup:'Dorsais/Bíceps', kcal:55, difficulty:'Intermediário', desc:'Principal exercício de tração para dorsais e bíceps com pegada pronada.', inst:'1. Pegada pronada levemente além dos ombros.\n2. Puxe o queixo acima da barra.\n3. Sem impulso ou balanço.\n4. Desça completamente até extensão dos braços.'},
        {name:'Barra Fixa Supinada (Chin-Up)', sets:'4', reps:'6-12', rest:'90s', muscleGroup:'Dorsais/Bíceps', kcal:55, difficulty:'Intermediário', desc:'Barra com pegada supinada, maior ativação de bíceps e dorsais inferiores.', inst:'1. Pegada supinada na largura dos ombros.\n2. Puxe o peito em direção à barra.\n3. Mantenha o core contraído.\n4. Desça controlado até extensão total.'},
        {name:'Inverted Row (Remada Invertida)', sets:'4', reps:'10-15', rest:'60s', muscleGroup:'Dorsais/Romboides/Bíceps', kcal:45, difficulty:'Iniciante', desc:'Remada com o corpo inclinado embaixo de uma barra, excelente para iniciantes.', inst:'1. Barra a 1m do chão, deitado embaixo.\n2. Pegue a barra com braços estendidos.\n3. Puxe o peito até a barra mantendo o corpo reto.\n4. Desça controlado até extensão total.'},
        {name:'Barra Aberta (Wide-Grip Pull-Up)', sets:'3', reps:'5-8', rest:'90s', muscleGroup:'Dorsais Laterais', kcal:58, difficulty:'Avançado', desc:'Pegada bem aberta que isola os dorsais laterais e cria largura de costas.', inst:'1. Pegada pronada bem além dos ombros.\n2. Cotoveladas para baixo e para o lado.\n3. Puxe o peito à barra.\n4. Controle a descida.'},
        {name:'Barra Australiana (Low Bar Row)', sets:'4', reps:'10-15', rest:'60s', muscleGroup:'Dorsais Médios/Romboides', kcal:45, difficulty:'Iniciante', desc:'Remada invertida com barra baixa, ótima regressão para quem não faz pull-up.', inst:'1. Barra a 60-80cm do chão.\n2. Corpo inclinado sob a barra.\n3. Puxe o peito até a barra mantendo quadril elevado.\n4. Desça lentamente.'},
        {name:'Muscle-Up (Progressão)', sets:'3', reps:'3-6', rest:'120s', muscleGroup:'Dorsais/Tríceps/Ombros', kcal:70, difficulty:'Avançado', desc:'Combinação de pull-up e dip que exige força e técnica avançadas.', inst:'1. Agarre a barra com pegada pronada.\n2. Pull-up explosivo com inclinação leve.\n3. Na transição, gire os pulsos para frente.\n4. Empurre para cima como um dip para finalizar acima da barra.'},
        {name:'Tuck Front Lever', sets:'4', reps:'15-30s', rest:'90s', muscleGroup:'Dorsais/Core', kcal:35, difficulty:'Avançado', desc:'Isometria com o corpo horizontal em versão encolhida, força de dorsais e core.', inst:'1. Pendure na barra.\n2. Traga os joelhos ao peito.\n3. Incline o corpo atrás mantendo tronco paralelo ao chão.\n4. Mantenha usando força das costas e core.'},
        {name:'Remada em Anel (Ring Row)', sets:'4', reps:'10-15', rest:'60s', muscleGroup:'Dorsais/Romboides', kcal:45, difficulty:'Intermediário', desc:'Remada em anéis ou TRX com ótima variação de ângulo e dificuldade.', inst:'1. Segure os anéis inclinado para trás.\n2. Corpo reto em diagonal.\n3. Puxe o peito aos anéis.\n4. Quanto mais horizontal, mais difícil.'},
        {name:'Archer Pull-Up', sets:'3', reps:'4-8 cada', rest:'90s', muscleGroup:'Dorsais Unilateral', kcal:65, difficulty:'Avançado', desc:'Pull-up unilateral progressivo para desenvolvimento de força assimétrica.', inst:'1. Pegada bem aberta na barra.\n2. Puxe para um lado dobrando apenas um cotovelo.\n3. O outro braço fica estendido.\n4. Desça e alterne o lado.'},
        {name:'Isometria de Barra (Dead Hang)', sets:'4', reps:'30-60s', rest:'60s', muscleGroup:'Antebraços/Descompressão', kcal:25, difficulty:'Iniciante', desc:'Suspenso na barra sem se mover, descomprime a coluna e fortalece o grip.', inst:'1. Suspenda na barra com braços estendidos.\n2. Relaxe completamente os ombros.\n3. Respire normalmente.\n4. Mantenha o tempo sem impulso.'},
      ],
      Pernas: [
        {name:'Pistol Squat (Progressão)', sets:'4', reps:'6-10 cada', rest:'90s', muscleGroup:'Quadríceps/Glúteos', kcal:65, difficulty:'Avançado', desc:'Agachamento unilateral completo, máxima força e equilíbrio de membros inferiores.', inst:'1. Em pé numa perna.\n2. Estenda a outra à frente.\n3. Desça controlado até a coxa paralela ao chão.\n4. Suba empurrando pela perna de apoio.'},
        {name:'Agachamento com Salto (Squat Jump)', sets:'4', reps:'10', rest:'75s', muscleGroup:'Quadríceps/Potência', kcal:75, difficulty:'Intermediário', desc:'Agachamento explosivo que desenvolve potência e força rápida de membros inferiores.', inst:'1. Agache controlado até 90°.\n2. Salte máximo com os braços auxiliando.\n3. Aterrisse suave com joelhos semiflexionados.\n4. Imediatamente inicie o próximo.'},
        {name:'Shrimp Squat', sets:'3', reps:'5-8 cada', rest:'90s', muscleGroup:'Quadríceps/Glúteos', kcal:60, difficulty:'Avançado', desc:'Agachamento unilateral com o pé traseiro dobrado, alta demanda de força e mobilidade.', inst:'1. Em pé, dobre o joelho traseiro segurando o pé atrás.\n2. Desça o joelho traseiro ao chão.\n3. O joelho frontal deve rastrear sobre o pé.\n4. Suba empurrando pelo calcanhar da frente.'},
        {name:'Agachamento Livre (Air Squat)', sets:'4', reps:'15-25', rest:'60s', muscleGroup:'Quadríceps/Glúteos/Isquiotibiais', kcal:50, difficulty:'Iniciante', desc:'Agachamento sem carga, fundamental para mobilidade de quadril, joelho e tornozelo.', inst:'1. Pés na largura dos ombros, levemente abertos.\n2. Braços à frente como contrapeso.\n3. Desça até as coxas paralelas ou abaixo do paralelo.\n4. Suba empurrando pelos calcanhares.'},
        {name:'Agachamento Sumô (Wide Squat)', sets:'4', reps:'15-20', rest:'60s', muscleGroup:'Adutores/Glúteos', kcal:55, difficulty:'Iniciante', desc:'Base larga com pés voltados para fora, maior ativação de adutores e glúteos.', inst:'1. Pés bem afastados, pontas viradas para fora 45°.\n2. Mãos entrelaçadas à frente.\n3. Desça mantendo joelhos alinhados com os pés.\n4. Suba contraindo os glúteos.'},
        {name:'Afundo (Lunge)', sets:'4', reps:'12 cada', rest:'60s', muscleGroup:'Quadríceps/Glúteos', kcal:55, difficulty:'Iniciante', desc:'Passo à frente com descida do joelho traseiro, trabalha equilíbrio e unilateralidade.', inst:'1. Em pé, dê um passo longo à frente.\n2. Desça o joelho traseiro ao chão.\n3. Joelho frontal deve ficar acima do tornozelo.\n4. Empurre de volta à posição inicial.'},
        {name:'Afundo Reverso (Reverse Lunge)', sets:'4', reps:'12 cada', rest:'60s', muscleGroup:'Glúteos/Quadríceps', kcal:55, difficulty:'Intermediário', desc:'Passo para trás, maior ativação de glúteos e menor stress nos joelhos.', inst:'1. Em pé, dê um passo longo para trás.\n2. Desça o joelho traseiro ao chão.\n3. Tronco ereto, quadril nivelado.\n4. Retorne à posição inicial.'},
        {name:'Elevação de Panturrilha (Calf Raise)', sets:'4', reps:'20-30', rest:'45s', muscleGroup:'Gastrocnêmio/Sóleo', kcal:25, difficulty:'Iniciante', desc:'Eleva os calcanhares para fortalecer gastrocnêmio e sóleo em exercício isolado.', inst:'1. Em pé, pés paralelos.\n2. Eleve os calcanhares ao máximo na ponta dos pés.\n3. Mantenha 1 segundo no topo.\n4. Desça controlado.'},
        {name:'Nordic Hamstring Curl', sets:'3', reps:'5-8', rest:'120s', muscleGroup:'Isquiotibiais', kcal:45, difficulty:'Avançado', desc:'Exercício excêntrico poderoso para isquiotibiais, previne lesões musculares.', inst:'1. Ajoelhe com os pés fixos (parceiro ou banco).\n2. Mãos à frente.\n3. Caia para frente de forma controlada o mais lentamente possível.\n4. Empurre o chão no final e retorne.'},
        {name:'Glute Bridge (Elevação de Quadril)', sets:'4', reps:'20', rest:'45s', muscleGroup:'Glúteos/Isquiotibiais', kcal:35, difficulty:'Iniciante', desc:'Deitado com joelhos dobrados, eleva o quadril para ativar glúteos e isquiotibiais.', inst:'1. Deitado de costas, joelhos dobrados, pés no chão.\n2. Contraia o glúteo e eleve o quadril.\n3. Mantenha 2 segundos no topo.\n4. Desça controlado sem encostar o quadril no chão.'},
      ],
      Ombros: [
        {name:'Pike Push-Up', sets:'4', reps:'8-12', rest:'60s', muscleGroup:'Deltoides/Tríceps', kcal:45, difficulty:'Intermediário', desc:'Flexão em V invertido, progressão direta para handstand push-up.', inst:'1. Mãos e pés no chão.\n2. Quadril alto formando V invertido.\n3. Desça a cabeça entre as mãos.\n4. Empurre de volta mantendo o V.'},
        {name:'Handstand Hold (Parede)', sets:'3', reps:'20-40s', rest:'60s', muscleGroup:'Deltoides/Core', kcal:30, difficulty:'Avançado', desc:'Isometria invertida apoiado na parede para construir base de handstand.', inst:'1. Coloque as mãos a 15cm da parede.\n2. Suba com o apoio da parede.\n3. Corpo reto com abdômen contraído.\n4. Mantenha o tempo focando no equilíbrio.'},
        {name:'Pike Push-Up com Pés Elevados', sets:'3', reps:'6-10', rest:'75s', muscleGroup:'Deltoides/Peitoral Superior', kcal:50, difficulty:'Avançado', desc:'Versão intensificada do pike push-up com maior ângulo de inclinação.', inst:'1. Pés elevados num banco.\n2. Mãos no chão formando V ainda mais fechado.\n3. Desça a cabeça entre as mãos.\n4. Empurre explosivo.'},
        {name:'Wall Walk (Caminhada na Parede)', sets:'3', reps:'5-8', rest:'90s', muscleGroup:'Deltoides/Core/Estabilidade', kcal:55, difficulty:'Avançado', desc:'Progressão de handstand partindo da posição de plank e caminhando pelas mãos.', inst:'1. Posição de plank com pés na parede.\n2. Caminhe com as mãos para trás em direção à parede.\n3. Chegue próximo ao handstand.\n4. Caminhe de volta ao plank.'},
        {name:'Aterrisagem de Headstand', sets:'3', reps:'8-12', rest:'60s', muscleGroup:'Deltoides/Trapézio', kcal:40, difficulty:'Intermediário', desc:'Sobe e desce do headstand de forma controlada, fortalece ombros e trapézio.', inst:'1. Apoie cabeça e antebraços no chão em triângulo.\n2. Eleve os joelhos.\n3. Suba as pernas controlado.\n4. Desça em reverse de forma lenta.'},
        {name:'Shoulder Tap Push-Up', sets:'3', reps:'10-16', rest:'75s', muscleGroup:'Deltoides/Core/Estabilidade', kcal:50, difficulty:'Intermediário', desc:'Flexão seguida de toque no ombro oposto, trabalha estabilidade de ombros e core.', inst:'1. Posição de flexão no topo.\n2. Faça uma flexão.\n3. No topo, toque o ombro esquerdo com a mão direita.\n4. Alterne a cada repetição mantendo o quadril estável.'},
        {name:'Elbow Lever (Apoio no Cotovelo)', sets:'3', reps:'10-20s', rest:'60s', muscleGroup:'Core/Deltoides Posteriores', kcal:25, difficulty:'Avançado', desc:'Isometria em apoio no cotovelo, posição horizontal do corpo usando o braço como fulcro.', inst:'1. Apoie um cotovelo no abdômen lateral.\n2. Leve o corpo horizontal apoiando nessa alavanca.\n3. O outro braço apoia no chão inicialmente.\n4. Progrida retirando o apoio extra.'},
        {name:'Flexão Decline com Elevação de Quadril', sets:'4', reps:'10-15', rest:'75s', muscleGroup:'Deltoides Anteriores/Peitoral', kcal:45, difficulty:'Intermediário', desc:'Combina flexão declinada com elevação adicional de quadril para ombros.', inst:'1. Posição de flexão com pés elevados.\n2. Realize a flexão.\n3. No topo empurre elevando ainda mais o quadril.\n4. Retorne à posição inicial.'},
        {name:'Superman Push-Up', sets:'3', reps:'5-8', rest:'90s', muscleGroup:'Deltoides/Peitoral/Tríceps', kcal:60, difficulty:'Avançado', desc:'Flexão com extensão total dos braços para frente após impulsão, demanda explosão máxima.', inst:'1. Flexão com impulso máximo.\n2. Ao sair do chão estenda os braços à frente.\n3. Corpo horizontal no ar por um instante.\n4. Aterrisse com cotovelos semiflexionados.'},
        {name:'Band Pull-Apart (Elástico)', sets:'4', reps:'15-20', rest:'45s', muscleGroup:'Deltoides Posteriores/Romboides', kcal:20, difficulty:'Iniciante', desc:'Abre um elástico à altura dos ombros para trabalhar posterior de ombro e romboides.', inst:'1. Segure o elástico com braços estendidos à frente.\n2. Afaste os braços lateralmente.\n3. Traga as escápulas juntas.\n4. Retorne controlado.'},
      ],
      Braços: [
        {name:'Isometria de Barra (Dead Hang)', sets:'4', reps:'30-60s', rest:'60s', muscleGroup:'Antebraços/Grip', kcal:25, difficulty:'Iniciante', desc:'Suspensão estática na barra, fortalece antebraços e descomprime a coluna.', inst:'1. Suspenda na barra com braços estendidos.\n2. Relaxe os ombros.\n3. Mantenha o tempo determinado.\n4. Desça controlado.'},
        {name:'Chin-Up (Foco em Bíceps)', sets:'4', reps:'8-12', rest:'90s', muscleGroup:'Bíceps/Dorsais', kcal:55, difficulty:'Intermediário', desc:'Barra supinada com ênfase em bíceps, pegada estreita maximiza o recrutamento.', inst:'1. Pegada supinada na largura dos ombros.\n2. Inicie contraindo os bíceps.\n3. Puxe o queixo acima da barra.\n4. Desça lentamente contando 3 segundos.'},
        {name:'Flexão Diamante (Tríceps)', sets:'4', reps:'10-15', rest:'75s', muscleGroup:'Tríceps/Peitoral', kcal:42, difficulty:'Intermediário', desc:'Mãos em diamante sobrecarregam o tríceps durante a fase de extensão.', inst:'1. Mãos em diamante sob o peito.\n2. Cotovelos paralelos ao tronco.\n3. Desça mantendo cotovelos próximos.\n4. Empurre até extensão total.'},
        {name:'Dip em Paralelas (Tríceps)', sets:'4', reps:'10-15', rest:'90s', muscleGroup:'Tríceps/Peitoral', kcal:55, difficulty:'Intermediário', desc:'Tronco vertical nas paralelas para maior ênfase em tríceps.', inst:'1. Suspenda nas paralelas, tronco vertical.\n2. Desça até cotovelos a 90°.\n3. Não incline o tronco à frente.\n4. Empurre até extensão total.'},
        {name:'Close-Grip Push-Up', sets:'4', reps:'12-18', rest:'60s', muscleGroup:'Tríceps', kcal:40, difficulty:'Iniciante', desc:'Flexão com mãos próximas isolando os tríceps com menos participação de peitoral.', inst:'1. Mãos sob os ombros ou um pouco mais próximas.\n2. Cotovelos roçam o tronco durante a descida.\n3. Desça controlado.\n4. Empurre até extensão.'},
        {name:'Australian Pull-Up (Supinada)', sets:'4', reps:'12-18', rest:'60s', muscleGroup:'Bíceps', kcal:40, difficulty:'Iniciante', desc:'Remada invertida com pegada supinada que isola bíceps, bom para iniciantes.', inst:'1. Barra baixa, deitado embaixo.\n2. Pegada supinada na largura dos ombros.\n3. Puxe o peito à barra.\n4. Desça completamente.'},
        {name:'Chin-Up Excêntrico', sets:'3', reps:'5-8', rest:'90s', muscleGroup:'Bíceps/Dorsais', kcal:45, difficulty:'Intermediário', desc:'Sobe rápido, desce em 5-8 segundos para maximizar o ganho excêntrico de bíceps.', inst:'1. Pule ou suba rápido à posição de chin-up no topo.\n2. Desça lentamente contando 5 a 8 segundos.\n3. Toque o chão e repita.\n4. Foco total na contração excêntrica.'},
        {name:'Wrist Roll (Antebraço)', sets:'3', reps:'2-3 min', rest:'45s', muscleGroup:'Antebraços/Grip', kcal:20, difficulty:'Iniciante', desc:'Enrola e desenrola um peso com um cabo preso a um bastão para fortalecimento de antebraços.', inst:'1. Segure o bastão à frente.\n2. Role o pulso alternadamente enrolando o cabo.\n3. Desenrole controlado.\n4. Use peso progressivo.'},
        {name:'Flexão com Aplauso Lateral', sets:'3', reps:'8-10', rest:'90s', muscleGroup:'Peitoral/Tríceps/Potência', kcal:55, difficulty:'Avançado', desc:'Flexão explosiva com aplauso lateral no ar que trabalha potência de tríceps.', inst:'1. Posição de flexão.\n2. Desça controlado.\n3. Empurre explosivo saindo do chão.\n4. Bata palmas lateralmente no ar e repousa suavemente.'},
        {name:'Hollow Body Hold', sets:'4', reps:'20-40s', rest:'60s', muscleGroup:'Core/Antebraços', kcal:25, difficulty:'Intermediário', desc:'Posição de banana invertida com braços estendidos, fortalece antebraços e core.', inst:'1. Deitado, braços acima da cabeça estendidos.\n2. Eleve ombros e pernas do chão.\n3. Pressione a lombar no chão.\n4. Mantenha a posição contraindo tudo.'},
      ],
      Core: [
        {name:'L-Sit (Isometria)', sets:'4', reps:'15-30s', rest:'60s', muscleGroup:'Core/Quadríceps', kcal:30, difficulty:'Avançado', desc:'Corpo em L suspenso com pernas paralelas ao chão, alta demanda de core e compressão.', inst:'1. Apoios no chão ou barras paralelas baixas.\n2. Eleve o corpo pelos braços.\n3. Estenda as pernas paralelas ao chão.\n4. Mantenha o tempo sem deixar as pernas caírem.'},
        {name:'Dragon Flag (Progressão)', sets:'3', reps:'5-8', rest:'90s', muscleGroup:'Core Completo', kcal:40, difficulty:'Avançado', desc:'Corpo em prancha na vertical descendo de cima para baixo, exercício máximo de core.', inst:'1. Deitado, segure atrás da cabeça num banco ou poste.\n2. Eleve o corpo em linha reta apoiando nos ombros.\n3. Desça controlado sem tocar o chão.\n4. Use os cotovelos como alavanca para subir.'},
        {name:'Prancha Frontal (Plank)', sets:'4', reps:'30-60s', rest:'45s', muscleGroup:'Core/Glúteos', kcal:25, difficulty:'Iniciante', desc:'Isometria fundamental que trabalha todo o núcleo e ensina a ativar o core.', inst:'1. Antebraços no chão, cotovelos sob os ombros.\n2. Corpo em linha reta.\n3. Contraia abdômen, glúteos e quadríceps.\n4. Respire normalmente sem deixar o quadril cair.'},
        {name:'Prancha Lateral', sets:'3', reps:'30-45s cada', rest:'45s', muscleGroup:'Oblíquos/Core', kcal:20, difficulty:'Iniciante', desc:'Isometria lateral que trabalha intensamente os oblíquos e estabilidade lateral.', inst:'1. Apoio no antebraço e no pé lateral.\n2. Eleve o quadril em linha reta.\n3. Mantenha o corpo rígido sem torcer.\n4. Troque o lado.'},
        {name:'Hollow Body Hold', sets:'4', reps:'20-40s', rest:'60s', muscleGroup:'Core Anterior', kcal:25, difficulty:'Intermediário', desc:'Posição de banana invertida que é a base de movimentos ginásticos avançados.', inst:'1. Deitado, braços acima da cabeça.\n2. Eleve ombros e pernas do chão.\n3. Pressione a lombar fortemente no chão.\n4. Mantenha a posição respirando.'},
        {name:'Ab Wheel (Roda Abdominal)', sets:'3', reps:'8-12', rest:'90s', muscleGroup:'Core Completo/Dorsais', kcal:50, difficulty:'Avançado', desc:'Rola a roda para frente a partir dos joelhos, máxima ativação de reto abdominal.', inst:'1. Ajoelhado, segure a roda.\n2. Role para frente estendendo o corpo.\n3. Desça sem tocar o chão.\n4. Retraia o abdômen para voltar.'},
        {name:'Leg Raise Suspenso', sets:'4', reps:'10-15', rest:'75s', muscleGroup:'Iliopsoas/Abdômen Inferior', kcal:35, difficulty:'Intermediário', desc:'Suspenso na barra, eleva as pernas até o paralelo para trabalhar o abdômen inferior.', inst:'1. Suspenda na barra em dead hang.\n2. Mantenha as pernas juntas.\n3. Eleve as pernas até o paralelo ou acima.\n4. Desça controlado sem usar impulso.'},
        {name:'Tuck Planche Hold', sets:'3', reps:'10-20s', rest:'90s', muscleGroup:'Core/Ombros/Antebraços', kcal:30, difficulty:'Avançado', desc:'Isometria avançada com o corpo horizontal apoiado apenas nas mãos com joelhos encolhidos.', inst:'1. Apoios nas mãos.\n2. Incline o tronco para frente.\n3. Eleve os joelhos encolhidos do chão.\n4. Mantenha o corpo paralelo ao chão.'},
        {name:'Russian Twist', sets:'4', reps:'20', rest:'45s', muscleGroup:'Oblíquos', kcal:30, difficulty:'Iniciante', desc:'Sentado com tronco inclinado, gira de lado a lado ativando os oblíquos.', inst:'1. Sentado, joelhos dobrados, pés no chão.\n2. Incline o tronco 45°.\n3. Gire para a direita tocando o chão.\n4. Gire para a esquerda alternando.'},
        {name:'V-Up (Canivete)', sets:'4', reps:'12-15', rest:'60s', muscleGroup:'Abdômen Completo', kcal:35, difficulty:'Intermediário', desc:'Eleva braços e pernas simultaneamente em V, contrai o abdômen ao máximo.', inst:'1. Deitado, braços acima da cabeça.\n2. Eleve braços e pernas simultaneamente.\n3. Toque os pés com as mãos no ponto mais alto.\n4. Desça controlado.'},
      ],
    },
    cardio: {
      Geral: [
        {name:'Corrida Contínua', sets:'1', reps:'20-40 min', rest:'—', muscleGroup:'Cardio/Membros Inferiores', kcal:300, difficulty:'Iniciante', desc:'Cardio base para condicionamento aeróbico geral e resistência cardiovascular.', inst:'1. Aquecimento 5 min caminhando.\n2. Corra em ritmo confortável sem ficar sem fôlego.\n3. Mantenha frequência cardíaca entre 60-75% da máxima.\n4. Desaquecimento 5 min caminhando.'},
        {name:'Ciclismo (Bike/Ergométrica)', sets:'1', reps:'30-45 min', rest:'—', muscleGroup:'Cardio/Quadríceps', kcal:280, difficulty:'Iniciante', desc:'Cardio de baixo impacto articular, excelente para joelhos sensíveis.', inst:'1. Ajuste o banco (joelho levemente dobrado na extensão máxima).\n2. Pedale com cadência constante (70-90 RPM).\n3. Varie a resistência a cada 10 min.\n4. Mantenha postura ereta sem sobrecarregar o dorso.'},
        {name:'Jumping Jacks', sets:'4', reps:'45s', rest:'15s', muscleGroup:'Cardio/Corpo Inteiro', kcal:60, difficulty:'Iniciante', desc:'Salto com abertura simultânea de pernas e braços, cardio de baixo custo e fácil execução.', inst:'1. Em pé, pés juntos, braços ao lado.\n2. Salte abrindo as pernas além dos ombros.\n3. Ao mesmo tempo leve os braços acima da cabeça.\n4. Salte de volta à posição inicial.'},
        {name:'Corrida Estacionária (High Knees)', sets:'4', reps:'30s', rest:'30s', muscleGroup:'Cardio/Flexores do Quadril', kcal:70, difficulty:'Intermediário', desc:'Corrida no lugar com joelhos elevados, máxima intensidade cardiovascular sem sair do lugar.', inst:'1. Corra no lugar elevando os joelhos ao nível do quadril.\n2. Braços em movimento como na corrida.\n3. Aterrisse na ponta dos pés.\n4. Mantenha o ritmo o mais rápido possível.'},
        {name:'Skater Jumps', sets:'4', reps:'30s', rest:'30s', muscleGroup:'Cardio/Glúteos/Abdutores', kcal:80, difficulty:'Intermediário', desc:'Saltos laterais imitando o patinador, trabalha cardio e fortalece abdutores e glúteos.', inst:'1. Salte lateralmente para um lado pousando numa perna.\n2. Balance o braço oposto para frente como um patinador.\n3. Salte de volta para o outro lado.\n4. Mantenha joelhos semiflexionados ao pousar.'},
        {name:'Butt Kicks', sets:'4', reps:'30s', rest:'20s', muscleGroup:'Cardio/Isquiotibiais', kcal:55, difficulty:'Iniciante', desc:'Corrida no lugar tocando os calcanhares nos glúteos, ativa isquiotibiais e eleva a FC.', inst:'1. Corra no lugar.\n2. Dobre os joelhos para trás tentando tocar os calcanhares nos glúteos.\n3. Mantenha o tronco ligeiramente inclinado.\n4. Aterrisse na ponta dos pés.'},
        {name:'Jump Rope (Pular Corda)', sets:'5', reps:'2-3 min', rest:'60s', muscleGroup:'Cardio/Panturrilha/Coordenação', kcal:200, difficulty:'Intermediário', desc:'Pular corda combina cardio, coordenação e fortalecimento de panturrilhas.', inst:'1. Segure as alças na altura dos quadris.\n2. Pule com a ponta dos pés.\n3. Movimente apenas os pulsos (não os braços inteiros).\n4. Mantenha ritmo constante respirando pelo nariz.'},
        {name:'Box Step Cardio', sets:'1', reps:'20-30 min', rest:'—', muscleGroup:'Cardio/Pernas', kcal:220, difficulty:'Iniciante', desc:'Sobe e desce de um step ou degrau em ritmo constante, ótimo cardio de baixo impacto.', inst:'1. Em frente a um step ou degrau.\n2. Suba com o pé direito primeiro.\n3. Suba o pé esquerdo.\n4. Desça direito depois esquerdo. Alterne o pé líder a cada 2 min.'},
        {name:'Mountain Climbers', sets:'4', reps:'30s', rest:'30s', muscleGroup:'Cardio/Core/Ombros', kcal:75, difficulty:'Intermediário', desc:'Posição de prancha com pernas alternando rapidamente como se estivesse escalando.', inst:'1. Posição de prancha alta.\n2. Traga o joelho direito ao peito.\n3. Estenda de volta e traga o esquerdo.\n4. Alterne rapidamente mantendo os quadris baixos.'},
        {name:'Burpee Completo', sets:'4', reps:'10-15', rest:'60s', muscleGroup:'Corpo Inteiro/Cardio', kcal:100, difficulty:'Intermediário', desc:'Sequência completa de agachamento, prancha, flexão e salto, o exercício mais completo.', inst:'1. Agache e coloque as mãos no chão.\n2. Jogue os pés para trás em plank.\n3. Faça uma flexão.\n4. Traga os pés de volta e salte com os braços acima da cabeça.'},
      ],
      HIIT: [
        {name:'Tabata (20s on / 10s off)', sets:'8', reps:'20s', rest:'10s', muscleGroup:'Corpo Inteiro/Cardio', kcal:120, difficulty:'Avançado', desc:'Protocolo HIIT científico de alta intensidade criado pelo Dr. Tabata, 4 minutos totais.', inst:'1. 20 segundos de esforço absolutamente máximo.\n2. 10 segundos de descanso total.\n3. Repita 8 vezes (total 4 minutos).\n4. Escolha exercícios compostos como burpee, squat jump ou mountain climbers.'},
        {name:'Sprint Intervalado', sets:'8', reps:'30s sprint / 90s caminhar', rest:'entre rounds', muscleGroup:'Membros Inferiores/Cardio', kcal:200, difficulty:'Avançado', desc:'Sprint máximo alternado com caminhada de recuperação, queima calórica elevada.', inst:'1. Corra em velocidade absolutamente máxima por 30s.\n2. Caminhe por 90s para recuperação.\n3. Repita o ciclo 8 vezes.\n4. Monitore a recuperação da frequência cardíaca.'},
        {name:'HIIT — Burpee + Sprint', sets:'6', reps:'30s trabalho / 30s descanso', rest:'60s entre blocos', muscleGroup:'Corpo Inteiro/Cardio', kcal:150, difficulty:'Avançado', desc:'Alternância de burpees e sprint estacionário em intervalos iguais de trabalho e descanso.', inst:'1. 30s de burpees no máximo de repetições.\n2. 30s de descanso total.\n3. 30s de sprint estacionário (high knees max).\n4. 30s de descanso. Repita o bloco 6 vezes.'},
        {name:'AMRAP (As Many Rounds As Possible)', sets:'1', reps:'10 min', rest:'sem pausa', muscleGroup:'Corpo Inteiro/Cardio', kcal:180, difficulty:'Avançado', desc:'Completa o máximo de rounds possível num tempo fixo, intensidade autogerida.', inst:'1. Defina um circuito (ex: 5 burpees + 10 squat jumps + 15 mountain climbers).\n2. Execute sem pausa.\n3. Registre os rounds completos.\n4. Tente bater o recorde na próxima sessão.'},
        {name:'EMOM (Every Minute on the Minute)', sets:'10', reps:'varia', rest:'resto do minuto', muscleGroup:'Cardio/Força', kcal:130, difficulty:'Intermediário', desc:'No início de cada minuto executa um número fixo de reps, o descanso é o tempo restante.', inst:'1. Defina um exercício e número de reps (ex: 10 burpees).\n2. No sinal do minuto execute as reps.\n3. Descanse o tempo restante do minuto.\n4. Repita por 10 minutos.'},
        {name:'Battle Rope HIIT', sets:'5', reps:'30s on / 30s off', rest:'60s entre blocos', muscleGroup:'Cardio/Ombros/Core', kcal:140, difficulty:'Intermediário', desc:'Corda de batalha em ondas alternadas ou simultâneas, alta intensidade cardiovascular.', inst:'1. Segure uma ponta da corda em cada mão.\n2. Mova os braços alternadamente criando ondas.\n3. Joelhos levemente dobrados, core ativo.\n4. 30s máximo + 30s repouso.'},
        {name:'Circuito HIIT 5 Exercícios', sets:'3', reps:'40s cada / 20s descanso', rest:'2 min entre rounds', muscleGroup:'Corpo Inteiro', kcal:250, difficulty:'Avançado', desc:'Circuito de 5 exercícios consecutivos com descanso mínimo, eleva o EPOC.', inst:'1. Jumping Jacks (40s) → 20s descanso.\n2. Mountain Climbers (40s) → 20s descanso.\n3. Squat Jump (40s) → 20s descanso.\n4. Burpee (40s) → 20s descanso. Skater Jumps (40s) → 2 min descanso.'},
        {name:'Box Jump HIIT', sets:'5', reps:'10', rest:'45s', muscleGroup:'Potência/Cardio', kcal:120, difficulty:'Avançado', desc:'Salto sobre um box com aterrissagem suave, combina potência e cardio intervalado.', inst:'1. Em frente ao box, pés na largura dos ombros.\n2. Agache rápido e salte explosivamente.\n3. Aterrisse com ambos os pés no box, joelhos dobrados.\n4. Desça controlado e repita imediatamente.'},
        {name:'Shadow Boxing', sets:'5', reps:'2 min', rest:'60s', muscleGroup:'Cardio/Ombros/Core', kcal:120, difficulty:'Iniciante', desc:'Socos e esquivas no ar imitando um boxeador, excelente cardio e coordenação.', inst:'1. Guarda de boxe levantada.\n2. Combine jabs, diretos e ganchos no ar.\n3. Mova-se pelo espaço esquivando.\n4. Máxima velocidade com boa forma.'},
        {name:'Agility Ladder Run', sets:'5', reps:'4-6 passagens', rest:'45s', muscleGroup:'Cardio/Agilidade/Coordenação', kcal:90, difficulty:'Intermediário', desc:'Corre em padrões variados pela escada de agilidade, desenvolve rapididade de pés.', inst:'1. Posicione a escada no chão.\n2. Execute padrões: dois pés em cada quadrado, saídas laterais, etc.\n3. Máxima velocidade nos pés.\n4. Mantenha o tronco ereto com passos pequenos e rápidos.'},
      ],
      Endurance: [
        {name:'Corrida Longa (Long Run)', sets:'1', reps:'60-90 min', rest:'—', muscleGroup:'Cardio/Resistência Total', kcal:600, difficulty:'Intermediário', desc:'Treino fundamental de resistência aeróbica para corredores e atletas.', inst:'1. Pace 60-70% da frequência cardíaca máxima.\n2. Mantenha ritmo conversacional (consegue falar).\n3. Hidrate-se a cada 20-30 min.\n4. Desaquecimento 10 min obrigatório.'},
        {name:'Fartlek (Velocidade Variável)', sets:'1', reps:'40-60 min', rest:'—', muscleGroup:'Cardio/Resistência', kcal:450, difficulty:'Intermediário', desc:'Corrida com variações de ritmo espontâneas ou programadas, combina aeróbico e anaeróbico.', inst:'1. Corra no ritmo base por 5 min.\n2. Acelere por 1-2 min para ritmo mais forte.\n3. Volte ao ritmo base por 3-5 min.\n4. Repita as variações ao longo do treino.'},
        {name:'Corrida Progressiva (Tempo Run)', sets:'1', reps:'30-45 min', rest:'—', muscleGroup:'Cardio/Limiar Anaeróbico', kcal:380, difficulty:'Intermediário', desc:'Inicia em ritmo fácil e aumenta gradualmente até o limiar anaeróbico ao final.', inst:'1. Primeiros 10 min em ritmo fácil.\n2. Minutos 10-20 em ritmo moderado.\n3. Últimos 10-15 min no ritmo limiar (difícil mas sustentável).\n4. 5 min de desaquecimento.'},
        {name:'Ciclismo Endurance', sets:'1', reps:'60-90 min', rest:'—', muscleGroup:'Cardio/Quadríceps/Resistência', kcal:550, difficulty:'Intermediário', desc:'Pedalada longa em intensidade moderada, desenvolve resistência cardiovascular e muscular.', inst:'1. Mantenha cadência de 75-90 RPM.\n2. Resistência que mantenha FC em 65-75% máxima.\n3. Hidrate a cada 20 min.\n4. Varie ligeiramente a resistência a cada 20 min.'},
        {name:'Natação Contínua', sets:'1', reps:'45-60 min', rest:'—', muscleGroup:'Cardio/Corpo Inteiro', kcal:400, difficulty:'Intermediário', desc:'Nado contínuo em qualquer estilo, cardio de baixíssimo impacto e alta eficiência.', inst:'1. Aquecimento 200m em ritmo fácil.\n2. Nado principal em ritmo constante.\n3. Respire de forma rítmica e regular.\n4. Resfriamento 100m em costas ou crol lento.'},
        {name:'Caminhada em Inclinação (Treadmill)', sets:'1', reps:'45-60 min', rest:'—', muscleGroup:'Cardio/Glúteos/Panturrilha', kcal:350, difficulty:'Iniciante', desc:'Caminhada em inclinação elevada (10-15%) sem correr, muito eficiente para cardio e glúteos.', inst:'1. Configure inclinação de 10-15% na esteira.\n2. Velocidade de caminhada (4-6 km/h).\n3. Não segure nos corrimãos.\n4. Mantenha postura ereta e braços em movimento.'},
        {name:'Remo (Ergômetro)', sets:'1', reps:'30-45 min', rest:'—', muscleGroup:'Cardio/Costas/Pernas', kcal:380, difficulty:'Intermediário', desc:'Remo em ergômetro combina cardio com força de costas e pernas, baixo impacto.', inst:'1. Ajuste o pé e segure o cabo.\n2. Empurre com as pernas primeiro.\n3. Incline o tronco para trás.\n4. Puxe o cabo ao abdômen. Reverta o movimento controlado.'},
        {name:'Corrida de Trilha (Trail Run)', sets:'1', reps:'45-75 min', rest:'—', muscleGroup:'Cardio/Propriocepção', kcal:500, difficulty:'Intermediário', desc:'Corrida em terrenos irregulares que desenvolve propriocepção, força e resistência simultâneas.', inst:'1. Passos mais curtos que na corrida de rua.\n2. Olhe à frente prevendo o terreno.\n3. Use os braços para equilíbrio.\n4. Suba caminhando se necessário, corra as descidas.'},
        {name:'Elíptico Contínuo', sets:'1', reps:'40-60 min', rest:'—', muscleGroup:'Cardio/Corpo Inteiro', kcal:320, difficulty:'Iniciante', desc:'Cardio de impacto zero que trabalha membros superiores e inferiores simultaneamente.', inst:'1. Suba no elíptico com postura ereta.\n2. Use os braços de forma oposta às pernas.\n3. Mantenha cadência constante de 60-70 RPM.\n4. Varie a resistência a cada 10 min.'},
        {name:'Duathlon (Corrida + Bike)', sets:'1', reps:'60 min total', rest:'2 min de transição', muscleGroup:'Cardio/Resistência Total', kcal:520, difficulty:'Avançado', desc:'Combina 20 min de corrida + 20 min de bike + 20 min de corrida, treino de resistência combinado.', inst:'1. 20 min de corrida em ritmo moderado.\n2. Transição para a bike em 2 min.\n3. 20 min de bike em ritmo moderado.\n4. Última corrida de 20 min — aguente o ritmo.'},
      ],
      'Baixo Impacto': [
        {name:'Caminhada Rápida (Power Walk)', sets:'1', reps:'30-60 min', rest:'—', muscleGroup:'Cardio/Membros Inferiores', kcal:200, difficulty:'Iniciante', desc:'Caminhada em ritmo acelerado, cardio ideal para iniciantes, idosos e recuperação.', inst:'1. Passada larga e ativa.\n2. Balanceie os braços de forma oposta às pernas.\n3. Mantenha postura ereta com abdômen ativo.\n4. Pace ligeiramente acelerado sem correr.'},
        {name:'Natação (Aquagym)', sets:'1', reps:'40-60 min', rest:'—', muscleGroup:'Cardio/Corpo Inteiro', kcal:280, difficulty:'Iniciante', desc:'Exercícios na água que eliminam o impacto nas articulações mantendo alta queima calórica.', inst:'1. Aquecimento 5 min de caminhada na água.\n2. Alterne exercícios: polichinelo, corrida, elevação de joelhos.\n3. Use a resistência da água como sobrecarga natural.\n4. Desaquecimento 5 min.'},
        {name:'Yoga Flow (Vinyasa)', sets:'1', reps:'30-45 min', rest:'—', muscleGroup:'Mobilidade/Cardio Leve', kcal:150, difficulty:'Iniciante', desc:'Sequência de posturas de yoga em movimento contínuo, suave ao corpo e restaurador.', inst:'1. Inicie com respiração consciente por 2 min.\n2. Saudação ao sol como aquecimento.\n3. Flua entre posturas com a respiração.\n4. Finalize com savasana de 5 min.'},
        {name:'Tai Chi (Forma Básica)', sets:'1', reps:'30 min', rest:'—', muscleGroup:'Equilíbrio/Mobilidade/Cardio Leve', kcal:120, difficulty:'Iniciante', desc:'Arte marcial suave chinesa que melhora equilíbrio, mobilidade e concentração.', inst:'1. Posição relaxada com joelhos levemente dobrados.\n2. Mova os braços de forma lenta e fluída.\n3. Transfira o peso de um pé para o outro.\n4. Mantenha a respiração profunda e rítmica.'},
        {name:'Caminhada na Água (Pool Walk)', sets:'1', reps:'30-45 min', rest:'—', muscleGroup:'Membros Inferiores/Cardio', kcal:220, difficulty:'Iniciante', desc:'Caminhada em piscina com água na altura do quadril, resistência da água sem impacto.', inst:'1. Entre na piscina com água na cintura.\n2. Caminhe com passos largos e deliberados.\n3. Mova os braços para trás e para frente.\n4. Varie entre caminhar para frente, trás e lateral.'},
        {name:'Bicicleta Reclinada', sets:'1', reps:'40-60 min', rest:'—', muscleGroup:'Quadríceps/Cardio', kcal:250, difficulty:'Iniciante', desc:'Bike em posição reclinada, ideal para dores na coluna e lombar.', inst:'1. Ajuste o banco para joelhos levemente dobrados na extensão.\n2. Apoie a lombar no encosto.\n3. Pedale com cadência de 60-80 RPM.\n4. Mantenha os braços relaxados.'},
        {name:'Hidroginástica', sets:'1', reps:'45 min', rest:'—', muscleGroup:'Cardio/Força/Baixo Impacto', kcal:300, difficulty:'Iniciante', desc:'Aula de exercícios em piscina aquecida, combina cardio e resistência sem impacto.', inst:'1. Siga as instruções do professor ou vídeo guiado.\n2. Use equipamentos de resistência na água se disponível.\n3. Mantenha movimentos amplos para aproveitar a resistência da água.\n4. Hidrate-se mesmo na água.'},
        {name:'Pilates Mat', sets:'1', reps:'40-50 min', rest:'—', muscleGroup:'Core/Mobilidade/Postura', kcal:180, difficulty:'Iniciante', desc:'Série de exercícios no colchonete focados em core, postura e mobilidade.', inst:'1. Use colchonete firme.\n2. Foco na respiração: inspire pelo nariz, expire pela boca.\n3. Contraia o core (powerhouse) em todos os movimentos.\n4. Movimentos lentos e precisos, nunca compensar.'},
        {name:'Caminhada Nórdica (Nordic Walking)', sets:'1', reps:'40-60 min', rest:'—', muscleGroup:'Cardio/Membros Superiores', kcal:280, difficulty:'Iniciante', desc:'Caminhada com bastões que adiciona membros superiores ao cardio, queima 20% mais que caminhar.', inst:'1. Use os bastões específicos de nordic walking.\n2. Plante o bastão na diagonal com cada passo.\n3. Empurre o bastão para trás a cada passada.\n4. Braços e pernas em oposição natural.'},
        {name:'Alongamento Dinâmico (10 min)', sets:'2', reps:'10 cada', rest:'15s', muscleGroup:'Mobilidade/Recuperação', kcal:40, difficulty:'Iniciante', desc:'Série de movimentos dinâmicos para aquecer ou recuperar, sem balanços bruscos.', inst:'1. Círculos de quadril (10 cada direção).\n2. Elevação de joelhos ao peito alternada (10 cada).\n3. Chutes frontais (10 cada).\n4. Giro de tronco de pé (10 cada lado).'},
      ],
    },
    yoga: {
      Mobilidade: [
        {name:'Saudação ao Sol (Surya Namaskar)', sets:'4', reps:'1 sequência', rest:'30s', muscleGroup:'Corpo Inteiro', kcal:35, difficulty:'Iniciante', desc:'Sequência clássica de 12 posturas que aquece o corpo e melhora a mobilidade geral.', inst:'1. Posição de montanha (Tadasana), pés juntos.\n2. Eleve os braços e arqueie levemente para trás.\n3. Incline para frente (Uttanasana).\n4. Siga a sequência completa de 12 posições com a respiração.'},
        {name:'Pombo (Eka Pada Rajakapotasana)', sets:'3', reps:'60s cada lado', rest:'30s', muscleGroup:'Flexores do Quadril/Glúteos/Piriforme', kcal:20, difficulty:'Intermediário', desc:'Abertura profunda de quadril e flexores, muito eficaz para quem fica muito sentado.', inst:'1. De 4 apoios, leve o joelho direito à mão direita.\n2. Estenda a perna traseira completamente.\n3. Quadril nivelado em direção ao chão.\n4. Desça o tronco sobre a perna frontal e respire.'},
        {name:'Cachorro Olhando para Baixo (Adho Mukha)', sets:'4', reps:'30-60s', rest:'15s', muscleGroup:'Isquiotibiais/Panturrilha/Ombros', kcal:20, difficulty:'Iniciante', desc:'Postura em V invertido, alonga posterior das pernas e descomprime a coluna.', inst:'1. Mãos e pés no chão.\n2. Eleve os quadris formando um V invertido.\n3. Calcanhares pressionam o chão.\n4. Cabeça entre os braços, olhe para os joelhos.'},
        {name:'Postura da Criança (Balasana)', sets:'4', reps:'60s', rest:'15s', muscleGroup:'Lombar/Quadril/Tornozelos', kcal:10, difficulty:'Iniciante', desc:'Postura de repouso e descompressão lombar, restauradora e calmante.', inst:'1. Ajoelhe com joelhos afastados.\n2. Sente sobre os calcanhares.\n3. Estenda os braços à frente ou ao lado do corpo.\n4. Fronte no colchonete, respire profundamente.'},
        {name:'Gato-Vaca (Marjaryasana-Bitilasana)', sets:'3', reps:'10 ciclos', rest:'15s', muscleGroup:'Coluna/Core', kcal:12, difficulty:'Iniciante', desc:'Ondulação da coluna entre extensão e flexão, mobilidade espinhal fundamental.', inst:'1. De 4 apoios, pulsos sob os ombros.\n2. Inspire e arqueie as costas (vaca).\n3. Expire e arredonde as costas (gato).\n4. Siga o ritmo da respiração.'},
        {name:'Torção Espinhal (Ardha Matsyendrasana)', sets:'3', reps:'60s cada lado', rest:'20s', muscleGroup:'Coluna/Oblíquos', kcal:15, difficulty:'Iniciante', desc:'Torção sentada da coluna, melhora a mobilidade rotacional e massageia os órgãos.', inst:'1. Sentado com pernas estendidas.\n2. Dobre o joelho direito, pé ao lado da coxa esquerda.\n3. Gire o tronco para a direita apoiando o braço no joelho.\n4. Olhe por cima do ombro, mantenha a coluna ereta.'},
        {name:'Abertura de Quadril (Borboleta)', sets:'3', reps:'90s', rest:'20s', muscleGroup:'Adutores/Quadril', kcal:15, difficulty:'Iniciante', desc:'Solas dos pés juntas com joelhos abrindo para os lados, abertura de adutores e quadril.', inst:'1. Sentado, junte as solas dos pés.\n2. Traga os calcanhares próximos ao corpo.\n3. Segure os pés com as mãos.\n4. Pressione suavemente os joelhos ao chão com os cotovelos.'},
        {name:'Dobra para Frente Sentado (Paschimottanasana)', sets:'3', reps:'60s', rest:'20s', muscleGroup:'Isquiotibiais/Lombar', kcal:12, difficulty:'Iniciante', desc:'Dobra completa à frente com pernas estendidas, intenso alongamento posterior.', inst:'1. Sentado, pernas estendidas e juntas.\n2. Inspire e eleve os braços.\n3. Expire e dobre para frente alcançando os pés.\n4. Mantenha a coluna longa, não force.'},
        {name:'Lagarto (Utthan Pristhasana)', sets:'3', reps:'60s cada lado', rest:'30s', muscleGroup:'Flexores do Quadril/Quadríceps', kcal:18, difficulty:'Intermediário', desc:'Afundo profundo que abre intensamente os flexores do quadril e quadríceps.', inst:'1. Passo longo à frente, joelho frontal a 90°.\n2. Joelho traseiro no chão.\n3. Mãos dentro do pé frontal.\n4. Mantenha o quadril baixo e respire na postura.'},
        {name:'Fio da Agulha (Thread the Needle)', sets:'3', reps:'45s cada lado', rest:'20s', muscleGroup:'Ombros/Torácica', kcal:12, difficulty:'Iniciante', desc:'Torção do ombro deitado que alivia tensão nos ombros e na região torácica.', inst:'1. De 4 apoios.\n2. Deslize o braço direito sob o tronco para a esquerda.\n3. O ombro e a orelha pousam no chão.\n4. Mantenha o quadril elevado.'},
      ],
      Força: [
        {name:'Guerreiro I (Virabhadrasana I)', sets:'3', reps:'60s cada lado', rest:'30s', muscleGroup:'Quadríceps/Glúteos/Ombros', kcal:25, difficulty:'Iniciante', desc:'Postura de força e estabilidade que fortalece membros inferiores e abre o peito.', inst:'1. Passo longo à frente.\n2. Joelho frontal a 90°, perna traseira estendida.\n3. Braços acima da cabeça com palmas unidas.\n4. Olhe para cima e respire profundamente.'},
        {name:'Guerreiro II (Virabhadrasana II)', sets:'3', reps:'60s cada lado', rest:'30s', muscleGroup:'Quadríceps/Adutores/Ombros', kcal:25, difficulty:'Iniciante', desc:'Postura lateral de força com braços abertos, melhora resistência muscular de pernas.', inst:'1. Passo longo lateral.\n2. Joelho frontal a 90° alinhado sobre o pé.\n3. Braços paralelos ao chão.\n4. Olhe sobre a mão da frente.'},
        {name:'Triângulo (Trikonasana)', sets:'3', reps:'60s cada lado', rest:'20s', muscleGroup:'Adutores/Oblíquos/Costas', kcal:20, difficulty:'Iniciante', desc:'Postura de extensão lateral que alonga os adutores e fortalece o core.', inst:'1. Pés afastados, pé direito a 90°.\n2. Estenda o braço direito em direção ao pé direito.\n3. Desça a mão para a canela, tornozelo ou chão.\n4. Braço esquerdo apontando para cima.'},
        {name:'Guerreiro III (Virabhadrasana III)', sets:'3', reps:'30s cada', rest:'30s', muscleGroup:'Glúteos/Core/Equilíbrio', kcal:30, difficulty:'Intermediário', desc:'Equilíbrio em uma perna com corpo paralelo ao chão, força e equilíbrio simultâneos.', inst:'1. Em pé, transfira o peso para o pé direito.\n2. Incline o tronco para frente.\n3. Eleve a perna esquerda paralela ao chão.\n4. Braços estendidos à frente ou ao lado do corpo.'},
        {name:'Barco (Navasana)', sets:'4', reps:'30s', rest:'30s', muscleGroup:'Core/Flexores do Quadril', kcal:25, difficulty:'Intermediário', desc:'Sentado em equilíbrio sobre o cóccix com pernas e tronco elevados em V, forte ativação de core.', inst:'1. Sentado, joelhos dobrados, pés no chão.\n2. Incline o tronco para trás.\n3. Eleve as pernas estendidas.\n4. Braços paralelos ao chão, coluna ereta.'},
        {name:'Prancha de Yoga (Kumbhakasana)', sets:'4', reps:'30-45s', rest:'30s', muscleGroup:'Core/Ombros/Quadríceps', kcal:22, difficulty:'Iniciante', desc:'Postura isométrica de prancha alta do yoga, base para muitas transições.', inst:'1. Mãos sob os ombros, dedos abertos.\n2. Corpo em linha reta.\n3. Contraia abdômen, glúteos e coxas.\n4. Olhe levemente à frente.'},
        {name:'Cadeira (Utkatasana)', sets:'3', reps:'45s', rest:'30s', muscleGroup:'Quadríceps/Glúteos', kcal:28, difficulty:'Iniciante', desc:'Agachamento em isometria com braços acima da cabeça, fortalece membros inferiores.', inst:'1. Pés juntos ou na largura dos ombros.\n2. Dobre os joelhos como se fosse sentar.\n3. Braços acima da cabeça.\n4. Mantenha o peso nos calcanhares.'},
        {name:'Chaturanga (Prancha Baixa)', sets:'3', reps:'10-15', rest:'45s', muscleGroup:'Tríceps/Peitoral/Core', kcal:35, difficulty:'Intermediário', desc:'Da prancha alta desce para prancha baixa em 90° nos cotovelos, base do vinyasa.', inst:'1. Da prancha alta.\n2. Cotovelos junto ao corpo.\n3. Desça até cotovelos a 90°.\n4. Mantenha o corpo em linha reta sem tocar o chão.'},
        {name:'Cobra (Bhujangasana)', sets:'4', reps:'30s', rest:'20s', muscleGroup:'Lombar/Ombros/Abdômen', kcal:15, difficulty:'Iniciante', desc:'Extensão de coluna deitado que fortalece a lombar e abre o peito.', inst:'1. Deitado de bruços, mãos sob os ombros.\n2. Pressione as mãos e eleve o peito.\n3. Cotovelos levemente dobrados.\n4. Quadril no chão, olhe levemente para cima.'},
        {name:'Ponte (Setu Bandha Sarvangasana)', sets:'4', reps:'30-45s', rest:'30s', muscleGroup:'Glúteos/Isquiotibiais/Lombar', kcal:20, difficulty:'Iniciante', desc:'Elevação de quadril deitado que fortalece glúteos, isquiotibiais e ativa a lombar.', inst:'1. Deitado de costas, joelhos dobrados.\n2. Pés no chão na largura dos quadris.\n3. Eleve o quadril contraindo os glúteos.\n4. Mãos no chão ao lado do corpo.'},
      ],
      Respiração: [
        {name:'Pranayama — Respiração 4-7-8', sets:'4', reps:'4 ciclos', rest:'30s', muscleGroup:'Sistema Nervoso/Diafragma', kcal:5, difficulty:'Iniciante', desc:'Técnica de respiração para redução de estresse e ativação do sistema parassimpático.', inst:'1. Inspire silenciosamente pelo nariz por 4 segundos.\n2. Segure a respiração por 7 segundos.\n3. Expire completamente pela boca por 8 segundos.\n4. Repita 4 ciclos.'},
        {name:'Respiração Diafragmática', sets:'5', reps:'5 min', rest:'—', muscleGroup:'Diafragma/Sistema Nervoso', kcal:5, difficulty:'Iniciante', desc:'Respiração abdominal profunda que ativa o diafragma e acalma o sistema nervoso.', inst:'1. Deitado ou sentado confortavelmente.\n2. Uma mão no peito, uma no abdômen.\n3. Inspire pelo nariz inflando o abdômen (não o peito).\n4. Expire devagar pelo nariz esvaziando o abdômen.'},
        {name:'Kapalabhati (Respiração do Crânio)', sets:'3', reps:'30 expirações', rest:'30s', muscleGroup:'Abdômen/Diafragma', kcal:10, difficulty:'Intermediário', desc:'Expirações rápidas e fortes pelo nariz seguidas de inspirações passivas, limpa as vias aéreas.', inst:'1. Sentado em postura de meditação.\n2. Expire fortemente pelo nariz contraindo o abdômen.\n3. A inspiração é passiva e automática.\n4. Comece com 1 por segundo e acelere.'},
        {name:'Nadi Shodhana (Respiração Alternada)', sets:'5', reps:'10 ciclos', rest:'30s', muscleGroup:'Sistema Nervoso/Equilíbrio', kcal:5, difficulty:'Iniciante', desc:'Respiração alternada pelas narinas que equilibra os hemisférios cerebrais.', inst:'1. Polegar direito fecha a narina direita.\n2. Inspire pela narina esquerda.\n3. Feche a esquerda com o anelar, abra a direita.\n4. Expire pela direita. Repita ao contrário.'},
        {name:'Ujjayi (Respiração Oceânica)', sets:'4', reps:'5 min', rest:'—', muscleGroup:'Sistema Nervoso/Concentração', kcal:5, difficulty:'Intermediário', desc:'Respiração com constrição leve da garganta criando som oceânico, usada durante a prática de yoga.', inst:'1. Inspire pelo nariz.\n2. Expire pelo nariz com a garganta levemente contraída.\n3. O som deve ser como ondas do mar.\n4. Mantenha o ritmo durante toda a prática.'},
        {name:'Bhramari (Respiração do Zumbido)', sets:'5', reps:'5 ciclos', rest:'30s', muscleGroup:'Sistema Nervoso/Vagal', kcal:5, difficulty:'Iniciante', desc:'Humming durante a expiração que ativa o nervo vago e reduz a ansiedade rapidamente.', inst:'1. Tampe os ouvidos com os polegares.\n2. Dedos sobre os olhos fechados.\n3. Inspire profundamente.\n4. Expire zumbindo como uma abelha.'},
        {name:'Box Breathing (Respiração Quadrada)', sets:'5', reps:'4 ciclos', rest:'30s', muscleGroup:'Sistema Nervoso/Foco', kcal:5, difficulty:'Iniciante', desc:'Inspire 4s, segure 4s, expire 4s, segure 4s — técnica usada por atletas e militares.', inst:'1. Inspire pelo nariz por 4 segundos.\n2. Segure a respiração por 4 segundos.\n3. Expire pelo nariz por 4 segundos.\n4. Segure vazio por 4 segundos. Repita.'},
        {name:'Respiração de Fogo (Agni Pranayama)', sets:'3', reps:'30s', rest:'30s', muscleGroup:'Core/Diafragma', kcal:15, difficulty:'Intermediário', desc:'Variação rápida de Kapalabhati que gera calor interno e energiza o corpo.', inst:'1. Sentado em postura ereta.\n2. Comece com respiração normal.\n3. Acelere para uma expiração forte a cada meio segundo.\n4. Mantenha os ombros relaxados e o rosto relaxado.'},
        {name:'Respiração Wim Hof (Simplificada)', sets:'3', reps:'30 respirações', rest:'2 min', muscleGroup:'Sistema Nervoso/Imune', kcal:10, difficulty:'Intermediário', desc:'Hiperventilação controlada seguida de retenção, aumenta energia e foco.', inst:'1. Deitado confortavelmente.\n2. 30 respirações profundas e rápidas (inspire fundo, expire solto).\n3. Após a 30ª, expire completamente e segure sem ar.\n4. Inspire profundamente e segure por 15s. Repita.'},
        {name:'Sheetali (Respiração Refrescante)', sets:'4', reps:'8 ciclos', rest:'20s', muscleGroup:'Sistema Nervoso/Regulação Térmica', kcal:5, difficulty:'Iniciante', desc:'Inspire pela boca com língua enrolada criando frescor, excelente no calor.', inst:'1. Enrole a língua como um tubo (ou abra levemente a boca).\n2. Inspire lentamente pelo tubo da língua.\n3. Feche a boca.\n4. Expire lentamente pelo nariz.'},
      ],
      Equilíbrio: [
        {name:'Árvore (Vrksasana)', sets:'3', reps:'60s cada perna', rest:'30s', muscleGroup:'Core/Tornozelo/Equilíbrio', kcal:15, difficulty:'Iniciante', desc:'Postura unipodal clássica que desenvolve equilíbrio, foco e força de tornozelo.', inst:'1. Em pé, transfira o peso para a perna esquerda.\n2. Apoie o pé direito na coxa esquerda.\n3. Junte as palmas à frente ou acima.\n4. Fixe o olhar em um ponto (drishti).'},
        {name:'Guerreiro III (Equilíbrio)', sets:'3', reps:'30-45s cada', rest:'30s', muscleGroup:'Glúteos/Core/Equilíbrio', kcal:28, difficulty:'Intermediário', desc:'Uma perna só com corpo paralelo ao chão, desafio máximo de equilíbrio e força.', inst:'1. Em pé, transfira o peso para uma perna.\n2. Incline o tronco para frente.\n3. Eleve a perna de trás paralela ao chão.\n4. Braços estendidos à frente ou na cintura.'},
        {name:'Meia-Lua (Ardha Chandrasana)', sets:'3', reps:'30s cada', rest:'30s', muscleGroup:'Adutores/Core/Equilíbrio', kcal:22, difficulty:'Intermediário', desc:'Equilíbrio lateral em uma perna com abertura de quadril, desafia o centro de gravidade.', inst:'1. Do triângulo, dobre o joelho da frente.\n2. Coloque uma mão no chão à frente.\n3. Eleve a perna de trás paralela ao chão.\n4. Gire o tronco abrindo o quadril para o lado.'},
        {name:'Águia (Garudasana)', sets:'3', reps:'30-45s cada', rest:'30s', muscleGroup:'Panturrilha/Ombros/Equilíbrio', kcal:18, difficulty:'Intermediário', desc:'Membros entrelaçados em espiral que trabalha equilíbrio e mobilidade de ombros e quadril.', inst:'1. Dobre levemente o joelho esquerdo.\n2. Enrole a perna direita sobre a esquerda.\n3. Enrole os braços à frente, cotovelo sobre cotovelo.\n4. Pressione os antebraços juntos e respire.'},
        {name:'Dançarino (Natarajasana)', sets:'3', reps:'30s cada', rest:'30s', muscleGroup:'Quadríceps/Ombros/Equilíbrio', kcal:25, difficulty:'Avançado', desc:'Equilíbrio em uma perna com extensão do quadril e abertura do peito, postura elegante.', inst:'1. Em pé, dobre o joelho direito para trás.\n2. Segure o pé direito com a mão direita.\n3. Inclina o tronco levemente para frente.\n4. Braço esquerdo estendido à frente.'},
        {name:'Corvo (Bakasana)', sets:'3', reps:'10-20s', rest:'60s', muscleGroup:'Core/Braços/Equilíbrio', kcal:30, difficulty:'Avançado', desc:'Equilíbrio nas mãos com joelhos apoiados nos tríceps, desafio de força e equilíbrio.', inst:'1. Agache com mãos no chão.\n2. Coloque os joelhos nos tríceps.\n3. Incline-se para frente transferindo o peso para as mãos.\n4. Eleve os pés do chão e mantenha.'},
        {name:'Equilíbrio na Ponta do Pé (Padangusthasana)', sets:'3', reps:'30s cada', rest:'20s', muscleGroup:'Panturrilha/Tornozelo/Equilíbrio', kcal:12, difficulty:'Iniciante', desc:'Eleva-se na ponta dos pés na postura de árvore ou de pé, fortalece panturrilha e tornozelo.', inst:'1. Postura de árvore ou simplesmente em pé.\n2. Eleve os calcanhares na ponta dos pés.\n3. Mantenha os braços na cintura ou acima.\n4. Olhe para um ponto fixo.'},
        {name:'Cadeira Lateral (Parivrtta Utkatasana)', sets:'3', reps:'30s cada', rest:'30s', muscleGroup:'Quadríceps/Oblíquos/Equilíbrio', kcal:25, difficulty:'Intermediário', desc:'Cadeira com torção, combina força de pernas e mobilidade rotacional.', inst:'1. Postura da cadeira, pés juntos.\n2. Gire o tronco para a direita.\n3. Cotovelo esquerdo fora do joelho direito.\n4. Palmas unidas ou braços abertos.'},
        {name:'Braço Estendido (Utthita Hasta Padangusthasana)', sets:'3', reps:'30s cada', rest:'30s', muscleGroup:'Isquiotibiais/Equilíbrio', kcal:20, difficulty:'Intermediário', desc:'Equilíbrio em uma perna com a outra estendida à frente ou ao lado, força de core e flexibilidade.', inst:'1. Em pé, eleve o joelho direito.\n2. Segure o dedão do pé direito com dois dedos.\n3. Estenda a perna gradualmente.\n4. Mantenha a coluna ereta.'},
        {name:'Prancha Lateral Estrela', sets:'3', reps:'20-30s cada', rest:'30s', muscleGroup:'Oblíquos/Abdutores/Equilíbrio', kcal:22, difficulty:'Avançado', desc:'Da prancha lateral eleva o braço e a perna, máxima demanda de equilíbrio lateral.', inst:'1. Posição de prancha lateral no antebraço.\n2. Eleve o quadril.\n3. Eleve a perna de cima apontando para o teto.\n4. Braço de cima apontando para cima também.'},
      ],
    },
  };
  return pool[catId]?.[area] || [];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const LibraryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  // TÓPICO 4: duração selecionada para cada ritmo de dança
  const [danceDuration, setDanceDuration] = useState<number>(30);

  const exercises = useMemo(() => {
    if (!openCat || !openArea) return [];
    if (openCat === 'esportes') return SPORT_EXERCISES[openArea] || [];
    if (openCat === 'danca' && openArea === 'Ritmos de Salão') return [];
    return getExercisesForArea(openCat, openArea);
  }, [openCat, openArea]);

  const danceRhythms = useMemo(() => {
    if (openCat === 'danca' && openArea === 'Ritmos de Salão') return DANCE_RHYTHMS;
    return [];
  }, [openCat, openArea]);

  const filteredExercises = useMemo(() => {
    if (!search) return exercises;
    return exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.muscleGroup.toLowerCase().includes(search.toLowerCase()));
  }, [exercises, search]);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
          Biblioteca de <span className="text-emerald-400">Movimentos</span>
        </h2>
        <p className="text-gray-500 font-medium">Exercícios técnicos por modalidade e esporte.</p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar exercício ou grupo muscular..."
          className="w-full bg-neutral-900/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
        />
      </div>

      {/* Categorias */}
      <div className="space-y-4">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-neutral-900/40 border border-white/5 rounded-[32px] overflow-hidden">
            <button
              onClick={() => { setOpenCat(openCat === cat.id ? null : cat.id); setOpenArea(null); }}
              className="w-full p-6 flex justify-between items-center group hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${openCat === cat.id ? 'bg-emerald-400 text-black' : 'bg-white/5 text-gray-500'}`}>
                  <Dumbbell size={22} />
                </div>
                <span className={`text-xl font-black italic uppercase tracking-tighter ${openCat === cat.id ? 'text-emerald-400' : 'text-white'}`}>
                  {cat.name}
                </span>
              </div>
              <div className={`p-2 rounded-full border border-white/5 transition-transform duration-300 ${openCat === cat.id ? 'rotate-180 text-emerald-400' : 'text-gray-600'}`}>
                <ChevronDown size={18} />
              </div>
            </button>

            {openCat === cat.id && (
              <div className="px-6 pb-6 space-y-2">
                {cat.areas.map(area => (
                  <div key={area}>
                    <button
                      onClick={() => setOpenArea(openArea === area ? null : area)}
                      className={`w-full flex justify-between items-center py-4 px-5 rounded-2xl transition-all ${openArea === area ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <span className="font-black text-xs uppercase tracking-[0.25em]">{area}</span>
                      <ChevronRight className={`transition-transform duration-300 ${openArea === area ? 'rotate-90 text-emerald-400' : ''}`} size={16} />
                    </button>

                    {/* Lista de exercícios por área */}
                    {openArea === area && cat.id !== 'danca' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pb-4">
                        {(search ? filteredExercises : exercises).map((ex, i) => (
                          <button
                            key={i}
                            onClick={() => setSelected({ ...ex, catId: cat.id, area })}
                            className="bg-black/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-400/40 hover:bg-emerald-400/5 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-neutral-800 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-600 border border-white/5 flex-shrink-0">
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-black text-sm text-white group-hover:text-emerald-400 transition-colors uppercase italic leading-tight">{ex.name}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                  {ex.difficulty} · {ex.kcal} kcal · {ex.muscleGroup}
                                </p>
                              </div>
                            </div>
                            <Info size={15} className="text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                          </button>
                        ))}
                        {exercises.length === 0 && (
                          <p className="text-gray-600 text-sm col-span-2 text-center py-4">Nenhum exercício disponível para esta área.</p>
                        )}
                      </div>
                    )}

                    {/* Ritmos de Dança */}
                    {openArea === area && cat.id === 'danca' && area === 'Ritmos de Salão' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pb-4">
                        {DANCE_RHYTHMS.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => setSelected({ ...r, isDance: true })}
                            className="bg-black/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-400/40 hover:bg-emerald-400/5 transition-all text-left"
                          >
                            <div>
                              <p className="font-black text-sm text-white group-hover:text-emerald-400 transition-colors uppercase italic">{r.name}</p>
                              <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                                {r.intensity} · {r.kcal}
                              </p>
                            </div>
                            <Info size={15} className="text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Outras áreas de dança */}
                    {openArea === area && cat.id === 'danca' && area !== 'Ritmos de Salão' && (
                      <div className="p-4 bg-black/20 rounded-2xl mt-2">
                        <p className="text-gray-500 text-sm">Aulas de {area} disponíveis em estúdios parceiros. Verifique a agenda.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de detalhes */}
      {selected && (
        <div className="fixed inset-0 z-[130] bg-black/98 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div
            className="bg-neutral-900 border border-white/10 rounded-[40px] w-full max-w-xl p-10 relative overflow-y-auto max-h-[90vh] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 p-3 bg-black/20 rounded-full text-gray-500 hover:text-white transition-all">
              <X size={24} />
            </button>

            {selected.isDance ? (
              /* ── TÓPICO 4: Modal de ritmo de dança com seleção de duração ── */
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ritmo de Salão</span>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter mt-1">{selected.name}</h3>
                </div>
                {/* Seleção de duração — TÓPICO 4 */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duração da Prática</p>
                  <div className="flex flex-wrap gap-2">
                    {DANCE_DURATIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => setDanceDuration(d)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${
                          danceDuration === d
                            ? 'bg-emerald-400 text-black'
                            : 'bg-black/40 border border-white/10 text-gray-400 hover:border-emerald-400/30'
                        }`}
                      >{d} min</button>
                    ))}
                  </div>
                </div>
                {/* Gasto calórico calculado proporcionalmente */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Duração</p>
                    <p className="text-xl font-black text-emerald-400">{danceDuration} min</p>
                  </div>
                  <div className="col-span-2 bg-emerald-400/10 border border-emerald-400/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Gasto Calórico Estimado</p>
                    <p className="text-2xl font-black text-orange-400">
                      ~{Math.round((selected.kcalPerHour || 375) * (danceDuration / 60))} kcal
                    </p>
                    <p className="text-[9px] text-gray-500 mt-1">{selected.kcal}</p>
                  </div>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Intensidade</p>
                  <p className="text-lg font-black text-blue-400">{selected.intensity}</p>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Descrição</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.desc}</p>
                </div>
              </div>
            ) : (
              /* ── Modal de exercício ── */
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{selected.area} · {selected.difficulty}</span>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter mt-1">{selected.name}</h3>
                  <p className="text-xs text-gray-600 font-bold uppercase mt-1">{selected.muscleGroup}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/40 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Séries</p>
                    <p className="text-xl font-black text-emerald-400">{selected.sets}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Reps</p>
                    <p className="text-xl font-black text-emerald-400">{selected.reps}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Descanso</p>
                    <p className="text-xl font-black text-emerald-400">{selected.rest}</p>
                  </div>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Flame size={12} className="text-orange-400" /> Descrição</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.desc}</p>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Zap size={12} className="text-emerald-400" /> Execução</p>
                  <div className="space-y-2">
                    {selected.inst.split('\n').map((line: string, i: number) => (
                      <p key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-emerald-400 flex-shrink-0">•</span> {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Gasto Calórico Estimado</p>
                  <p className="text-2xl font-black text-orange-400">~{selected.kcal} kcal</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
