export type Gender = "male" | "female" | "unspecified";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Goal = "weight_loss" | "muscle_building" | "recomposition" | "strength" | "general_fitness";
export type Location = "home" | "gym";
export type Equipment =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "kettlebell"
  | "resistance_band"
  | "pullup_bar"
  | "bench"
  | "cable_machine"
  | "machines"
  | "mat";

export type DietPreference = "halal" | "vegetarian" | "vegan" | "no_beef" | "no_seafood" | "dairy_free" | "low_spice";

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  experience: Experience;
  goal: Goal;
  location: Location;
  equipment: Equipment[];
  daysPerWeek: number; // 2–6
  sessionMinutes: number; // 20–90
  diet: DietPreference[];
  allergies: string; // free text, used by the AI coach and as a food filter keyword list
}

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Weight Loss",
  muscle_building: "Muscle Building",
  recomposition: "Body Recomposition",
  strength: "Strength Training",
  general_fitness: "General Fitness",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: "Bodyweight",
  dumbbells: "Dumbbells",
  barbell: "Barbell & plates",
  kettlebell: "Kettlebell",
  resistance_band: "Resistance bands",
  pullup_bar: "Pull-up bar",
  bench: "Bench",
  cable_machine: "Cable machine",
  machines: "Gym machines",
  mat: "Exercise mat",
};

export const DIET_LABELS: Record<DietPreference, string> = {
  halal: "Halal only",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  no_beef: "No beef",
  no_seafood: "No seafood",
  dairy_free: "Dairy-free",
  low_spice: "Low spice",
};
