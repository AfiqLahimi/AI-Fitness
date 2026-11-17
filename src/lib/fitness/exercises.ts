import type { Equipment, Experience } from "./types";

export type Muscle =
  | "chest" | "triceps" | "shoulders" | "back" | "lats" | "biceps" | "forearms"
  | "core" | "obliques" | "quads" | "hamstrings" | "glutes" | "calves" | "full_body" | "cardio" | "mobility";

/** Movement pattern drives the animated motion guide when no licensed video is attached. */
export type MotionPattern =
  | "curl" | "hammer_curl" | "overhead_press" | "lateral_raise" | "front_raise" | "squat" | "lunge"
  | "pushup" | "plank" | "row" | "hinge" | "glute_bridge" | "crunch" | "jumping_jack" | "mountain_climber"
  | "tricep_extension" | "dip" | "pullup" | "calf_raise" | "bench_press" | "high_knees" | "burpee"
  | "arm_circles" | "stretch_hamstring" | "stretch_quad" | "march" | "side_plank" | "leg_raise";

export interface Exercise {
  slug: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: Equipment[]; // ANY of these (bodyweight means none needed)
  difficulty: Experience;
  pattern: MotionPattern;
  defaultMode: "reps" | "time";
  met: number;
  /** For unilateral moves the UI reminds the user to do both sides. */
  unilateral?: boolean;
  instructions: string[];
  posture: string[];
  mistakes: string[];
  category: "strength" | "cardio" | "core" | "warmup" | "cooldown";
}

const E = (e: Exercise) => e;

export const EXERCISES: Exercise[] = [
  // ───────────── Arms
  E({
    slug: "dumbbell-bicep-curl", name: "Dumbbell Bicep Curl", primary: ["biceps"], secondary: ["forearms"],
    equipment: ["dumbbells"], difficulty: "beginner", pattern: "curl", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: [
      "Stand tall holding a dumbbell in each hand, palms facing forward, arms fully extended.",
      "Pin your elbows to your sides and brace your core.",
      "Exhale and curl the weights up toward your shoulders by bending only at the elbow.",
      "Squeeze your biceps at the top for a one-second pause.",
      "Inhale and lower slowly over 2–3 seconds until your arms are straight again.",
    ],
    posture: ["Elbows stay fixed beside your ribs", "Shoulders down and back, chest proud", "Wrists neutral — don't curl them in", "Knees soft, glutes engaged"],
    mistakes: ["Swinging the torso to lift the weight", "Letting elbows drift forward", "Dropping the weight quickly on the way down", "Going too heavy and cutting the range of motion"],
  }),
  E({
    slug: "hammer-curl", name: "Hammer Curl", primary: ["biceps", "forearms"], secondary: [],
    equipment: ["dumbbells"], difficulty: "beginner", pattern: "hammer_curl", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Hold dumbbells at your sides with palms facing each other.", "Keep elbows tucked and curl the weights up, thumbs leading.", "Pause just below shoulder height.", "Lower under control to full extension."],
    posture: ["Neutral grip throughout", "Upper arms stay vertical", "Tall spine, braced core"],
    mistakes: ["Rotating the wrist mid-rep", "Using momentum from the hips", "Shrugging the shoulders"],
  }),
  E({
    slug: "band-bicep-curl", name: "Resistance Band Curl", primary: ["biceps"], secondary: ["forearms"],
    equipment: ["resistance_band"], difficulty: "beginner", pattern: "curl", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Stand on the middle of the band, feet hip-width apart, holding the handles.", "Keep elbows by your sides and curl the handles toward your shoulders.", "Squeeze at the top, then resist the band on the way down."],
    posture: ["Even tension on both sides", "Elbows fixed", "Neutral wrists"],
    mistakes: ["Letting the band snap the hands down", "Leaning backwards", "Partial reps"],
  }),
  E({
    slug: "overhead-tricep-extension", name: "Overhead Tricep Extension", primary: ["triceps"], secondary: ["shoulders"],
    equipment: ["dumbbells", "resistance_band"], difficulty: "beginner", pattern: "tricep_extension", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Hold one dumbbell with both hands overhead, arms straight.", "Keeping upper arms close to your head, bend the elbows to lower the weight behind your head.", "Stop when you feel a stretch in the triceps.", "Extend the elbows to press the weight back to the top."],
    posture: ["Ribs down — avoid arching the lower back", "Elbows point forward, not out", "Head stays neutral"],
    mistakes: ["Flaring the elbows wide", "Arching the lower back", "Moving the upper arms"],
  }),
  E({
    slug: "bench-dip", name: "Bench Dip", primary: ["triceps"], secondary: ["chest", "shoulders"],
    equipment: ["bench", "bodyweight"], difficulty: "beginner", pattern: "dip", defaultMode: "reps", met: 4, category: "strength",
    instructions: ["Sit on the edge of a bench or sturdy chair with hands beside your hips.", "Slide your hips off the edge, legs bent and feet flat.", "Bend your elbows to lower your body until upper arms are about parallel to the floor.", "Press through your palms to straighten your arms."],
    posture: ["Keep your back close to the bench", "Elbows point backward", "Shoulders away from ears"],
    mistakes: ["Dropping too deep and straining the shoulders", "Flaring the elbows", "Pushing with the legs"],
  }),
  // ───────────── Chest
  E({
    slug: "push-up", name: "Push-Up", primary: ["chest", "triceps"], secondary: ["shoulders", "core"],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "pushup", defaultMode: "reps", met: 8, category: "strength",
    instructions: ["Start in a high plank, hands slightly wider than shoulders.", "Brace your core and squeeze your glutes so your body is one straight line.", "Lower your chest toward the floor with elbows at about 45°.", "Pause just above the floor, then push it away to return to the start."],
    posture: ["Straight line from head to heels", "Elbows ~45° from the torso", "Hands under shoulders", "Neck neutral, eyes slightly ahead"],
    mistakes: ["Hips sagging or piking up", "Elbows flared to 90°", "Half reps", "Head dropping first"],
  }),
  E({
    slug: "incline-push-up", name: "Incline Push-Up", primary: ["chest", "triceps"], secondary: ["shoulders"],
    equipment: ["bench", "bodyweight"], difficulty: "beginner", pattern: "pushup", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Place hands on a bench or sturdy table, slightly wider than shoulders.", "Walk your feet back until your body is straight.", "Lower your chest to the edge, then press back up."],
    posture: ["Body in one line", "Core braced", "Elbows at ~45°"],
    mistakes: ["Hips sagging", "Choosing a surface that slides", "Shrugging"],
  }),
  E({
    slug: "dumbbell-bench-press", name: "Dumbbell Bench Press", primary: ["chest"], secondary: ["triceps", "shoulders"],
    equipment: ["dumbbells"], difficulty: "intermediate", pattern: "bench_press", defaultMode: "reps", met: 5, category: "strength",
    instructions: ["Lie on a bench with a dumbbell in each hand over your chest.", "Plant your feet and pull your shoulder blades together.", "Lower the dumbbells to chest level with elbows at ~45°.", "Press up and slightly in until arms are straight."],
    posture: ["Shoulder blades retracted", "Feet flat, slight natural arch", "Wrists stacked over elbows"],
    mistakes: ["Bouncing the weights", "Flaring the elbows", "Lifting hips off the bench"],
  }),
  E({
    slug: "barbell-bench-press", name: "Barbell Bench Press", primary: ["chest"], secondary: ["triceps", "shoulders"],
    equipment: ["barbell"], difficulty: "intermediate", pattern: "bench_press", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Lie with eyes under the bar, grip slightly wider than shoulders.", "Unrack, set shoulder blades back and down.", "Lower the bar to mid-chest under control.", "Drive the bar up and slightly back over the shoulders."],
    posture: ["Feet planted, glutes on bench", "Forearms vertical at the bottom", "Use a spotter or safety arms"],
    mistakes: ["Bouncing off the chest", "Losing upper-back tightness", "Training heavy without safeties"],
  }),
  // ───────────── Back
  E({
    slug: "dumbbell-row", name: "One-Arm Dumbbell Row", primary: ["back", "lats"], secondary: ["biceps"], unilateral: true,
    equipment: ["dumbbells"], difficulty: "beginner", pattern: "row", defaultMode: "reps", met: 4.5, category: "strength",
    instructions: ["Hinge forward with a flat back, one hand on a bench or knee for support.", "Let the dumbbell hang straight down from the working shoulder.", "Pull the elbow back toward your hip, squeezing the shoulder blade.", "Lower slowly to a full stretch. Repeat on the other side."],
    posture: ["Flat back, neck neutral", "Pull with the elbow, not the hand", "Hips square to the floor"],
    mistakes: ["Rotating the torso to lift", "Shrugging toward the ear", "Rounding the lower back"],
  }),
  E({
    slug: "band-row", name: "Resistance Band Row", primary: ["back"], secondary: ["biceps"],
    equipment: ["resistance_band"], difficulty: "beginner", pattern: "row", defaultMode: "reps", met: 4, category: "strength",
    instructions: ["Anchor the band at chest height or loop it around your feet while seated.", "Pull the handles toward your lower ribs.", "Squeeze your shoulder blades together, then return slowly."],
    posture: ["Tall chest", "Elbows close to the body", "Shoulders down"],
    mistakes: ["Leaning back to cheat", "Letting the band yank you forward", "Shrugging"],
  }),
  E({
    slug: "pull-up", name: "Pull-Up", primary: ["lats", "back"], secondary: ["biceps", "core"],
    equipment: ["pullup_bar"], difficulty: "advanced", pattern: "pullup", defaultMode: "reps", met: 8, category: "strength",
    instructions: ["Hang from the bar with an overhand grip slightly wider than shoulders.", "Depress your shoulders and brace your core.", "Pull your chest toward the bar, driving elbows down.", "Lower to a full hang under control."],
    posture: ["Ribs down, slight hollow body", "Chin clears the bar", "Full range each rep"],
    mistakes: ["Kipping or swinging", "Half reps", "Craning the neck to reach the bar"],
  }),
  E({
    slug: "lat-pulldown", name: "Lat Pulldown", primary: ["lats"], secondary: ["biceps", "back"],
    equipment: ["cable_machine", "machines"], difficulty: "beginner", pattern: "pullup", defaultMode: "reps", met: 5, category: "strength",
    instructions: ["Sit with thighs under the pad and grip the bar wide.", "Lean back slightly and pull the bar to your upper chest.", "Squeeze your lats, then let the bar rise under control."],
    posture: ["Chest up", "Elbows drive down and back", "No momentum"],
    mistakes: ["Pulling behind the neck", "Leaning far back", "Letting the stack slam"],
  }),
  E({
    slug: "barbell-row", name: "Barbell Bent-Over Row", primary: ["back", "lats"], secondary: ["biceps", "hamstrings"],
    equipment: ["barbell"], difficulty: "intermediate", pattern: "row", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Hinge to about 45° holding the bar with an overhand grip.", "Brace and pull the bar to your lower ribs.", "Pause, then lower to straight arms."],
    posture: ["Neutral spine", "Knees softly bent", "Bar travels close to the legs"],
    mistakes: ["Standing up as you row", "Rounding the back", "Jerking the weight"],
  }),
  // ───────────── Shoulders
  E({
    slug: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", primary: ["shoulders"], secondary: ["triceps", "core"],
    equipment: ["dumbbells"], difficulty: "beginner", pattern: "overhead_press", defaultMode: "reps", met: 4.5, category: "strength",
    instructions: ["Hold dumbbells at shoulder height, palms forward.", "Brace your core and squeeze your glutes.", "Press the weights overhead until arms are straight.", "Lower back to shoulder height under control."],
    posture: ["Ribs stacked over hips", "Wrists over elbows", "Head moves slightly back as weights pass"],
    mistakes: ["Arching the lower back", "Pressing forward instead of up", "Partial lockout"],
  }),
  E({
    slug: "pike-push-up", name: "Pike Push-Up", primary: ["shoulders"], secondary: ["triceps"],
    equipment: ["bodyweight"], difficulty: "intermediate", pattern: "pushup", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Start in a downward-dog shape with hips high.", "Bend elbows to lower the top of your head toward the floor.", "Press back up to straight arms."],
    posture: ["Hips stay high", "Elbows track back", "Head moves forward of the hands"],
    mistakes: ["Dropping hips into a push-up", "Flaring elbows", "Rushing reps"],
  }),
  E({
    slug: "lateral-raise", name: "Lateral Raise", primary: ["shoulders"], secondary: [],
    equipment: ["dumbbells", "resistance_band", "cable_machine"], difficulty: "beginner", pattern: "lateral_raise", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Stand holding light dumbbells at your sides.", "With a slight bend in the elbows, raise arms out to the sides.", "Stop at shoulder height, then lower slowly."],
    posture: ["Lead with elbows", "Shoulders down", "Slight forward lean is fine"],
    mistakes: ["Shrugging the traps", "Swinging the weights", "Lifting above shoulder height with heavy load"],
  }),
  E({
    slug: "front-raise", name: "Front Raise", primary: ["shoulders"], secondary: [],
    equipment: ["dumbbells", "resistance_band"], difficulty: "beginner", pattern: "front_raise", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Hold the weights in front of your thighs.", "Raise straight arms forward to shoulder height.", "Lower under control."],
    posture: ["Tall torso", "Soft elbows", "Core braced"],
    mistakes: ["Leaning back", "Using momentum", "Going too heavy"],
  }),
  // ───────────── Legs
  E({
    slug: "bodyweight-squat", name: "Bodyweight Squat", primary: ["quads", "glutes"], secondary: ["hamstrings", "core"],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "squat", defaultMode: "reps", met: 5, category: "strength",
    instructions: ["Stand with feet shoulder-width apart, toes turned out slightly.", "Brace your core and push your hips back and down.", "Lower until thighs are at least parallel to the floor.", "Drive through your whole foot to stand back up."],
    posture: ["Knees track over toes", "Chest up, spine neutral", "Heels stay down", "Weight over mid-foot"],
    mistakes: ["Knees caving inward", "Heels lifting", "Rounding the lower back", "Not reaching depth"],
  }),
  E({
    slug: "goblet-squat", name: "Goblet Squat", primary: ["quads", "glutes"], secondary: ["core"],
    equipment: ["dumbbells", "kettlebell"], difficulty: "beginner", pattern: "squat", defaultMode: "reps", met: 5.5, category: "strength",
    instructions: ["Hold a dumbbell or kettlebell vertically at your chest.", "Sit down between your heels keeping your elbows inside your knees.", "Drive up through the mid-foot."],
    posture: ["Upright torso", "Weight close to the chest", "Knees out"],
    mistakes: ["Letting the weight pull you forward", "Knees caving", "Heels lifting"],
  }),
  E({
    slug: "barbell-back-squat", name: "Barbell Back Squat", primary: ["quads", "glutes"], secondary: ["hamstrings", "core"],
    equipment: ["barbell"], difficulty: "advanced", pattern: "squat", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Set the bar on your upper back, step out of the rack.", "Brace hard and squat to depth.", "Drive up keeping the chest up."],
    posture: ["Bar over mid-foot", "Neutral spine", "Use safety pins"],
    mistakes: ["Good-morning the bar up", "Knees caving", "Losing the brace"],
  }),
  E({
    slug: "reverse-lunge", name: "Reverse Lunge", primary: ["quads", "glutes"], secondary: ["hamstrings"], unilateral: true,
    equipment: ["bodyweight", "dumbbells"], difficulty: "beginner", pattern: "lunge", defaultMode: "reps", met: 5, category: "strength",
    instructions: ["Stand tall, then step one foot back.", "Lower until both knees are about 90°.", "Push through the front heel to return. Alternate legs."],
    posture: ["Torso upright", "Front knee over mid-foot", "Hips square"],
    mistakes: ["Front knee caving", "Steps that are too short", "Leaning forward"],
  }),
  E({
    slug: "romanian-deadlift", name: "Romanian Deadlift", primary: ["hamstrings", "glutes"], secondary: ["back"],
    equipment: ["dumbbells", "barbell", "kettlebell"], difficulty: "intermediate", pattern: "hinge", defaultMode: "reps", met: 6, category: "strength",
    instructions: ["Hold the weight in front of your thighs, knees slightly bent.", "Push your hips back, sliding the weight down your legs.", "Stop when you feel a strong hamstring stretch.", "Drive hips forward to stand tall."],
    posture: ["Flat back throughout", "Weight stays close to the legs", "Shins mostly vertical"],
    mistakes: ["Rounding the spine", "Turning it into a squat", "Hyper-extending at the top"],
  }),
  E({
    slug: "glute-bridge", name: "Glute Bridge", primary: ["glutes"], secondary: ["hamstrings", "core"],
    equipment: ["bodyweight", "mat"], difficulty: "beginner", pattern: "glute_bridge", defaultMode: "reps", met: 3.5, category: "strength",
    instructions: ["Lie on your back, knees bent, feet flat hip-width apart.", "Brace your core and drive through your heels to lift your hips.", "Squeeze your glutes hard at the top.", "Lower slowly."],
    posture: ["Ribs down", "Straight line from knees to shoulders at the top", "Knees stay hip-width"],
    mistakes: ["Arching the lower back", "Pushing through toes", "Rushing the squeeze"],
  }),
  E({
    slug: "calf-raise", name: "Standing Calf Raise", primary: ["calves"], secondary: [],
    equipment: ["bodyweight", "dumbbells"], difficulty: "beginner", pattern: "calf_raise", defaultMode: "reps", met: 3, category: "strength",
    instructions: ["Stand tall, feet hip-width.", "Rise onto the balls of your feet as high as possible.", "Pause, then lower your heels slowly."],
    posture: ["Knees straight but not locked", "Weight through the big toe", "Tall posture"],
    mistakes: ["Bouncing", "Rolling to the outside of the foot", "Partial range"],
  }),
  E({
    slug: "leg-press", name: "Leg Press", primary: ["quads", "glutes"], secondary: ["hamstrings"],
    equipment: ["machines"], difficulty: "beginner", pattern: "squat", defaultMode: "reps", met: 5, category: "strength",
    instructions: ["Sit with your back flat and feet shoulder-width on the platform.", "Release the safeties and lower until knees are ~90°.", "Press through your heels without locking the knees."],
    posture: ["Lower back stays on the pad", "Knees track over toes"],
    mistakes: ["Locking the knees", "Lowering so deep the hips curl", "Bouncing"],
  }),
  // ───────────── Core
  E({
    slug: "plank", name: "Forearm Plank", primary: ["core"], secondary: ["shoulders", "glutes"],
    equipment: ["bodyweight", "mat"], difficulty: "beginner", pattern: "plank", defaultMode: "time", met: 3.8, category: "core",
    instructions: ["Rest on your forearms, elbows under shoulders.", "Extend your legs back and lift your hips into a straight line.", "Brace as if bracing for a punch and breathe steadily."],
    posture: ["Head to heels in one line", "Glutes squeezed", "Push the floor away with forearms"],
    mistakes: ["Hips sagging", "Hips too high", "Holding your breath"],
  }),
  E({
    slug: "side-plank", name: "Side Plank", primary: ["obliques", "core"], secondary: ["shoulders"], unilateral: true,
    equipment: ["bodyweight", "mat"], difficulty: "intermediate", pattern: "side_plank", defaultMode: "time", met: 3.8, category: "core",
    instructions: ["Lie on your side, elbow under shoulder, legs stacked.", "Lift your hips so your body forms a straight line.", "Hold, then switch sides."],
    posture: ["Hips stacked", "Shoulder away from ear", "Neutral neck"],
    mistakes: ["Hips dropping", "Rolling forward", "Collapsing into the shoulder"],
  }),
  E({
    slug: "crunch", name: "Crunch", primary: ["core"], secondary: [],
    equipment: ["bodyweight", "mat"], difficulty: "beginner", pattern: "crunch", defaultMode: "reps", met: 3.8, category: "core",
    instructions: ["Lie on your back, knees bent, fingertips lightly behind your ears.", "Exhale and curl your shoulders off the floor.", "Lower slowly."],
    posture: ["Chin off the chest", "Lower back stays down", "Lead with the ribs"],
    mistakes: ["Pulling on the neck", "Using momentum", "Sitting all the way up"],
  }),
  E({
    slug: "lying-leg-raise", name: "Lying Leg Raise", primary: ["core"], secondary: [],
    equipment: ["bodyweight", "mat"], difficulty: "intermediate", pattern: "leg_raise", defaultMode: "reps", met: 3.8, category: "core",
    instructions: ["Lie flat, hands under your hips.", "Keep legs straight and lift them to vertical.", "Lower slowly without letting your back arch."],
    posture: ["Lower back pressed into the floor", "Legs together", "Controlled tempo"],
    mistakes: ["Arching the back", "Swinging legs", "Dropping legs fast"],
  }),
  E({
    slug: "mountain-climber", name: "Mountain Climbers", primary: ["core", "cardio"], secondary: ["shoulders", "quads"],
    equipment: ["bodyweight"], difficulty: "intermediate", pattern: "mountain_climber", defaultMode: "time", met: 8, category: "cardio",
    instructions: ["Start in a high plank.", "Drive one knee toward your chest, then switch quickly.", "Keep a steady rhythm."],
    posture: ["Shoulders over wrists", "Hips level", "Core tight"],
    mistakes: ["Bouncing the hips", "Hands drifting forward", "Holding breath"],
  }),
  // ───────────── Cardio / full body
  E({
    slug: "jumping-jacks", name: "Jumping Jacks", primary: ["cardio", "full_body"], secondary: ["calves", "shoulders"],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "jumping_jack", defaultMode: "time", met: 8, category: "cardio",
    instructions: ["Stand with feet together and arms at your sides.", "Jump feet out while raising arms overhead.", "Jump back to the start. Keep a steady pace."],
    posture: ["Land softly on the balls of your feet", "Knees soft", "Tall torso"],
    mistakes: ["Landing heavily on the heels", "Locking the knees", "Shrugging"],
  }),
  E({
    slug: "high-knees", name: "High Knees", primary: ["cardio"], secondary: ["quads", "core"],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "high_knees", defaultMode: "time", met: 8, category: "cardio",
    instructions: ["Run in place driving each knee to hip height.", "Pump your arms in rhythm.", "Stay light on your feet."],
    posture: ["Upright torso", "Land on the forefoot", "Core engaged"],
    mistakes: ["Leaning back", "Knees too low", "Heavy landings"],
  }),
  E({
    slug: "burpee", name: "Burpee", primary: ["full_body", "cardio"], secondary: ["chest", "quads"],
    equipment: ["bodyweight"], difficulty: "intermediate", pattern: "burpee", defaultMode: "reps", met: 10, category: "cardio",
    instructions: ["Squat down and place your hands on the floor.", "Jump or step your feet back into a plank.", "Jump or step feet back toward the hands.", "Stand and jump up with arms overhead."],
    posture: ["Plank stays straight", "Soft landings", "Brace through every phase"],
    mistakes: ["Sagging hips in the plank", "Landing stiff-legged", "Rounding the back when squatting"],
  }),
  E({
    slug: "kettlebell-swing", name: "Kettlebell Swing", primary: ["glutes", "hamstrings"], secondary: ["core", "cardio"],
    equipment: ["kettlebell"], difficulty: "intermediate", pattern: "hinge", defaultMode: "reps", met: 9.8, category: "cardio",
    instructions: ["Hike the kettlebell back between your legs with a flat back.", "Snap your hips forward to float the bell to chest height.", "Let it fall back and hinge again."],
    posture: ["Hinge, don't squat", "Arms are ropes — hips do the work", "Glutes squeeze at the top"],
    mistakes: ["Lifting with the arms", "Rounding the back", "Over-arching at the top"],
  }),
  // ───────────── Warm-up / cooldown
  E({
    slug: "arm-circles", name: "Arm Circles", primary: ["shoulders", "mobility"], secondary: [],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "arm_circles", defaultMode: "time", met: 2.5, category: "warmup",
    instructions: ["Stand tall with arms out to the sides.", "Make controlled circles, gradually larger.", "Reverse direction halfway."],
    posture: ["Shoulders relaxed", "Core lightly braced"], mistakes: ["Rushing", "Shrugging"],
  }),
  E({
    slug: "march-in-place", name: "March in Place", primary: ["cardio", "mobility"], secondary: [],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "march", defaultMode: "time", met: 3.5, category: "warmup",
    instructions: ["March on the spot, lifting knees comfortably.", "Swing your arms naturally.", "Gradually increase the pace."],
    posture: ["Tall posture", "Breathe steadily"], mistakes: ["Slouching", "Holding your breath"],
  }),
  E({
    slug: "bodyweight-good-morning", name: "Hip Hinge Warm-Up", primary: ["hamstrings", "mobility"], secondary: ["back"],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "hinge", defaultMode: "time", met: 2.5, category: "warmup",
    instructions: ["Hands on hips, soft knees.", "Push hips back with a flat back until you feel the hamstrings.", "Stand back up squeezing the glutes."],
    posture: ["Flat back", "Slow tempo"], mistakes: ["Rounding the spine", "Bending the knees too much"],
  }),
  E({
    slug: "hamstring-stretch", name: "Standing Hamstring Stretch", primary: ["hamstrings", "mobility"], secondary: [],
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "stretch_hamstring", defaultMode: "time", met: 2.3, category: "cooldown",
    instructions: ["Place one heel slightly forward, toes up.", "Hinge forward with a flat back until you feel a gentle stretch.", "Breathe slowly, then switch sides."],
    posture: ["Long spine", "Gentle tension only"], mistakes: ["Bouncing", "Rounding the back"],
  }),
  E({
    slug: "quad-stretch", name: "Standing Quad Stretch", primary: ["quads", "mobility"], secondary: [], unilateral: true,
    equipment: ["bodyweight"], difficulty: "beginner", pattern: "stretch_quad", defaultMode: "time", met: 2.3, category: "cooldown",
    instructions: ["Stand tall and hold a wall if needed.", "Bend one knee and hold the foot behind you.", "Keep knees together and push the hip forward gently. Switch sides."],
    posture: ["Knees side by side", "Upright torso"], mistakes: ["Arching the back", "Pulling the foot sideways"],
  }),
];

export const EXERCISE_BY_SLUG = new Map(EXERCISES.map((e) => [e.slug, e]));

export function getExercise(slug: string): Exercise | undefined {
  return EXERCISE_BY_SLUG.get(slug);
}

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "Chest", triceps: "Triceps", shoulders: "Shoulders", back: "Upper back", lats: "Lats", biceps: "Biceps",
  forearms: "Forearms", core: "Core", obliques: "Obliques", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes",
  calves: "Calves", full_body: "Full body", cardio: "Cardio", mobility: "Mobility",
};
