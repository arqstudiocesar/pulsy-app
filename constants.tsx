// constants.tsx
import React from 'react';
import {
  Layout,
  Dumbbell,
  Apple,
  Library as LibraryIcon,
  BookOpen,
  TrendingUp,
  User
} from 'lucide-react';
import { TrainingHistory, ActivityLevel, FitnessLevel } from './types';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <Layout size={20} /> },
  { id: 'workout', label: 'Treino', icon: <Dumbbell size={20} /> },
  { id: 'nutrition', label: 'Nutrição', icon: <Apple size={20} /> },
  { id: 'library', label: 'Exercícios', icon: <LibraryIcon size={20} /> },
  { id: 'references', label: 'Fontes', icon: <BookOpen size={20} /> },
  { id: 'progress', label: 'Evolução', icon: <TrendingUp size={20} /> },
  { id: 'profile', label: 'Perfil', icon: <User size={20} /> },
];

export const INITIAL_PROFILE = {
  name: '',
  avatarSeed: 'PulsyWarrior',
  age: 25,
  sex: 'Masculino',
  weight: 70,
  height: 175,
  targetWeight: 65,
  idealWeight: 68,
  bodyFatPercentage: 15,
  leanMass: 60,
  imc: 0,
  activityLevel: ActivityLevel.SEDENTARY,
  fitnessLevel: FitnessLevel.BEGINNER,
  measurements: { waist: 0, hips: 0, chest: 0, arms: 0, thighs: 0, calves: 0 },
  ergonomics: { current: '', desired: '' },
  trainingStatus: {
    history: TrainingHistory.NEVER,
    familiarity: ['Musculação']
  },
  structuredGoals: [
    {
      duration: '90 dias',
      type: 'Condicionamento',
      description: '',
      numericValue: '',
      priority: 'medium' as const
    }
  ],
  restrictions: {
    physical: [],
    articular: [],
    postural: [],
    clinical: [],
    alimentary: []
  },
  availability: {
    daysPerWeek: 3,
    selectedDays: [1, 3, 5],         // Seg, Qua, Sex
    frequencyPerDay: 1,
    timePerSession: 60,               // minutos
    minExercisesPerSession: 4,
    locations: ['Academia'],
    modalities: ['Musculação'],
    // Campos legado (compatibilidade)
    maxSessionTime: 60,
    minExercisesPerDay: 4
  },
  nutrition: {
    objective: 'Condicionamento',
    preferences: ['Variado'],
    allergies: [],
    mealsPerDay: 4,
    budget: 'Médio ($$)',
    foodAccess: 'Fácil',
    dietaryRoutine: 'Regular',
    notes: ''
  }
};

const createMockOption = (name: string, idx: number) => ({
  id: `mock-${Math.random().toString(36).substr(2, 6)}`,
  food: name,
  portion: '1 porção',
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  source: 'Aguardando IA'
});

export const DEFAULT_PLAN = {
  weeklyPlan: Array(7).fill(null).map((_, i) => ({
    day: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][i],
    workout: [],
    sessions: [],
    nutrition: Array(4).fill(null).map((_, j) => ({
      id: `default-meal-${i}-${j}`,
      mealName: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar'][j],
      time: ['07:00', '12:00', '16:00', '20:00'][j],
      selectedOptionIndex: 0,
      options: [
        createMockOption('Aguardando geração da IA...', 0),
        createMockOption('Aguardando geração da IA...', 1),
        createMockOption('Aguardando geração da IA...', 2),
      ]
    }))
  })),
  summary: 'Aguardando geração personalizada pela Pulsy AI...',
  motivation: 'Sua biometria está sendo analisada. O plano será gerado em instantes.',
  references: []
};
