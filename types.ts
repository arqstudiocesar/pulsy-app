// types.ts — Pulsy AI · versão unificada

export enum FitnessLevel {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermediário',
  ADVANCED = 'Avançado'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentário',
  LIGHTLY_ACTIVE = 'Levemente Ativo',
  MODERATELY_ACTIVE = 'Moderadamente Ativo',
  ACTIVE = 'Ativo',
  VERY_ACTIVE = 'Muito Ativo'
}

export enum TrainingHistory {
  NEVER = 'Nunca treinou',
  PAST = 'Já treinou no passado',
  CURRENT = 'Treina atualmente'
}

export interface UserMeasurements {
  waist: number;
  hips: number;
  chest: number;
  arms: number;
  thighs: number;
  calves: number;
}

export interface Goal {
  duration: string;
  type: string;
  description: string;
  numericValue: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  name: string;
  avatarSeed?: string;
  age: number;
  sex?: 'Masculino' | 'Feminino' | 'Outro';
  weight: number;
  height: number;
  targetWeight?: number;
  idealWeight?: number;
  bodyFatPercentage?: number;
  leanMass?: number;
  imc?: number;
  measurements: UserMeasurements;
  ergonomics?: {
    current: string;
    desired: string;
  };
  trainingStatus: {
    history: TrainingHistory;
    familiarity?: string[];
  };
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;
  structuredGoals: Goal[];
  restrictions?: {
    physical: string[];
    articular: string[];
    postural: string[];
    clinical: string[];
    alimentary: string[];
  };
  availability: {
    daysPerWeek: number;
    selectedDays: number[];        // dias JS: 0=Dom, 1=Seg … 6=Sáb
    frequencyPerDay: number;       // sessões no mesmo dia
    timePerSession: number;        // duração máxima (min) por sessão
    minExercisesPerSession: number;// mínimo de exercícios por sessão
    locations: string[];
    modalities?: string[];
    // compatibilidade com campo legado
    maxSessionTime?: number;
    minExercisesPerDay?: number;
  };
  nutrition: {
    objective: string;
    preferences?: string[];
    allergies: string[];
    mealsPerDay: number;
    budget: string;
    foodAccess?: string;
    dietaryRoutine?: string;
    notes?: string;
  };
}

export interface Exercise {
  id: string;
  name: string;
  reps: string;
  sets: number;
  rest: string;
  description?: string;
  instructions?: string;
  muscleGroup?: string;
  category?: string;
  source?: string;
  mediaUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  kcalEstimate?: number;
  difficulty?: string;
  massGainFactor?: number;
  gramsLostFactor?: number;
  isCompleted?: boolean;
  estimatedMinutes?: number; // tempo estimado de execução
}

export interface WorkoutSession {
  id?: string;
  date: string;
  dayName?: string;
  dayIndex?: number;
  sessionIndex?: number;
  duration: number;              // segundos
  completedExercises: number;
  caloriesBurned?: number;
  totalFatLostGrams?: number;
  totalMassGainPoints?: number;
  totalKcal?: number;
  durationMinutes?: number;
}

export interface MealOption {
  id: string;
  food: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source?: string;
}

export interface Meal {
  id: string;
  mealName: string;
  time: string;
  options: MealOption[];
  selectedOptionIndex?: number;
}

export interface DayPlan {
  day: string;
  workout: Exercise[];
  sessions?: Exercise[][];       // múltiplas sessões por dia
  nutrition: Meal[];
}

// alias para compatibilidade
export type DailyPlan = DayPlan;

export interface WeeklyPlan {
  weeklyPlan: DayPlan[];
  summary: string;
  motivation: string;
  references: string[];
}

export interface AppState {
  profile: UserProfile | null;
  currentPlan: WeeklyPlan | null;
  history: WorkoutSession[];
  onboardingComplete: boolean;
  completedSessions: Record<string, boolean>;
}
