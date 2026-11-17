/**
 * Anatomical muscle groups used for highlighting. Each group lists the exact mesh
 * names from the Z-Anatomy / BodyParts3D model (public/models/anatomy.glb), so the
 * highlighted shapes are the real muscles — not a generic body diagram.
 * Meshes come in left/right pairs suffixed ".l" / ".r"; names here omit the suffix.
 */
export type MuscleId =
  | "biceps_brachii" | "brachialis" | "brachioradialis" | "triceps_brachii" | "forearm_flexors" | "forearm_extensors"
  | "deltoid_anterior" | "deltoid_lateral" | "deltoid_posterior" | "pectoralis_major" | "pectoralis_major_clavicular"
  | "serratus_anterior" | "latissimus_dorsi" | "teres_major" | "trapezius_upper" | "trapezius_middle" | "trapezius_lower"
  | "rhomboids" | "rotator_cuff" | "supraspinatus" | "erector_spinae" | "rectus_abdominis" | "external_oblique"
  | "internal_oblique" | "transversus_abdominis" | "quadratus_lumborum" | "gluteus_maximus" | "gluteus_medius"
  | "quadriceps" | "rectus_femoris" | "hamstrings" | "adductors" | "iliopsoas" | "gastrocnemius" | "soleus" | "tibialis_anterior";

export interface MuscleInfo {
  id: MuscleId;
  name: string; // common name shown to users
  anatomical: string; // official anatomical name(s)
  meshes: string[];
  side: "front" | "back"; // which view shows it best
  what: string; // what it does, in plain language
}

const M = (id: MuscleId, name: string, anatomical: string, side: "front" | "back", what: string, meshes: string[]): MuscleInfo => ({ id, name, anatomical, side, what, meshes });

export const MUSCLES: Record<MuscleId, MuscleInfo> = Object.fromEntries(
  [
    M("biceps_brachii", "Biceps", "Biceps brachii (long & short heads)", "front", "Bends the elbow and turns the palm up. The main muscle in curls.", ["Long head of biceps brachii", "Short head of biceps brachii"]),
    M("brachialis", "Brachialis", "Brachialis", "front", "Lies under the biceps and is the strongest pure elbow bender — it adds thickness to the upper arm.", ["Brachialis muscle"]),
    M("brachioradialis", "Brachioradialis", "Brachioradialis", "front", "Forearm muscle that helps bend the elbow, especially with a neutral (thumbs-up) grip.", ["Brachioradialis muscle"]),
    M("triceps_brachii", "Triceps", "Triceps brachii (long, lateral & medial heads)", "back", "Straightens the elbow. Makes up about two-thirds of the upper arm.", ["Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii", "Anconeus muscle"]),
    M("forearm_flexors", "Forearm flexors", "Flexor carpi radialis, flexor carpi ulnaris, flexor digitorum superficialis & profundus, palmaris longus", "front", "Bend the wrist and fingers — they power your grip.", ["Flexor carpi radialis", "Palmaris longus muscle", "Humeral head of flexor carpi ulnaris", "Ulnar head of flexor carpi ulnaris", "Humero-ulnar head of flexor digitorum superficialis", "Radial head of flexor digitorum superficialis", "Flexor digitorum profundus"]),
    M("forearm_extensors", "Forearm extensors", "Extensor carpi radialis longus & brevis, extensor digitorum, extensor carpi ulnaris", "back", "Straighten the wrist and fingers and keep the wrist stable.", ["Extensor carpi radialis longus", "Extensor carpi radialis brevis", "Extensor digitorum", "Humeral head of extensor carpi ulnaris", "Ulnar head of extensor carpi ulnaris", "Extensor digiti minimi"]),
    M("deltoid_anterior", "Front shoulder", "Deltoid — clavicular (anterior) part", "front", "Raises the arm forward and helps in pressing movements.", ["Clavicular part of deltoid muscle"]),
    M("deltoid_lateral", "Side shoulder", "Deltoid — acromial (lateral) part", "front", "Raises the arm out to the side. Gives the shoulders their width.", ["Acromial part of deltoid muscle"]),
    M("deltoid_posterior", "Rear shoulder", "Deltoid — spinal (posterior) part", "back", "Pulls the arm backwards. Important for posture and shoulder balance.", ["Scapular spinal part of deltoid muscle"]),
    M("pectoralis_major", "Chest", "Pectoralis major (clavicular, sternocostal & abdominal parts)", "front", "Brings the arms across and in front of the body — the main pushing muscle.", ["Clavicular head of pectoralis major muscle", "Sternocostal head of pectoralis major muscle", "(Abdominal part of pectoralis major muscle)"]),
    M("pectoralis_major_clavicular", "Upper chest", "Pectoralis major — clavicular head", "front", "The upper part of the chest, working most when you press upwards.", ["Clavicular head of pectoralis major muscle"]),
    M("serratus_anterior", "Serratus anterior", "Serratus anterior", "front", "Holds the shoulder blade against the ribcage and helps you reach and push.", ["Serratus anterior muscle"]),
    M("latissimus_dorsi", "Lats", "Latissimus dorsi", "back", "The widest back muscle. Pulls the arms down and back.", ["Latissimus dorsi muscle"]),
    M("teres_major", "Teres major", "Teres major", "back", "Small muscle that helps the lats pull the arm down and back.", ["Teres major muscle"]),
    M("trapezius_upper", "Upper traps", "Trapezius — descending part", "back", "Lifts and supports the shoulder blades (shrugging).", ["Descending part of trapezius muscle"]),
    M("trapezius_middle", "Middle traps", "Trapezius — transverse part", "back", "Squeezes the shoulder blades together.", ["Transverse part of trapezius muscle"]),
    M("trapezius_lower", "Lower traps", "Trapezius — ascending part", "back", "Pulls the shoulder blades down — key for healthy shoulders overhead.", ["Ascending part of trapezius muscle"]),
    M("rhomboids", "Rhomboids", "Rhomboid major & minor", "back", "Pull the shoulder blades together and support upright posture.", ["Rhomboid major muscle", "Rhomboid minor muscle"]),
    M("rotator_cuff", "Rotator cuff", "Infraspinatus & teres minor", "back", "Rotate and stabilise the shoulder joint.", ["Infraspinatus muscle", "Teres minor muscle"]),
    M("supraspinatus", "Supraspinatus", "Supraspinatus", "back", "Starts the arm lifting out to the side and keeps the shoulder joint centred.", ["Supraspinatus muscle"]),
    M("erector_spinae", "Lower back", "Erector spinae (iliocostalis, longissimus, spinalis) & multifidus", "back", "Keeps the spine straight and strong, especially when bending and lifting.", ["Iliocostalis lumborum muscle", "Iliocostalis thoracis muscle", "Longissimus thoracis muscle", "Spinalis thoracis muscle", "Multifidus lumborum muscle", "Multifidus thoracis muscle"]),
    M("rectus_abdominis", "Abs", "Rectus abdominis", "front", "The 'six-pack' muscle. Curls the trunk forward and braces the core.", ["Rectus abdominis muscle", "Pyramidalis muscle"]),
    M("external_oblique", "Obliques", "External abdominal oblique", "front", "Twists and side-bends the trunk, and stops unwanted rotation.", ["External abdominal oblique muscle"]),
    M("internal_oblique", "Internal obliques", "Internal abdominal oblique", "front", "Works with the external obliques to rotate and stabilise the trunk.", ["Internal abdominal oblique muscle"]),
    M("transversus_abdominis", "Deep core", "Transversus abdominis", "front", "A natural 'weight belt' that tightens around your middle to protect the spine.", ["Transversus abdominis muscle"]),
    M("quadratus_lumborum", "Quadratus lumborum", "Quadratus lumborum", "back", "Deep lower-back muscle that side-bends and stabilises the spine and pelvis.", ["Quadratus lumborum muscle"]),
    M("gluteus_maximus", "Glutes", "Gluteus maximus", "back", "The largest muscle in the body. Extends the hip — standing up, climbing, jumping.", ["Gluteus maximus muscle"]),
    M("gluteus_medius", "Side glutes", "Gluteus medius & minimus", "back", "Keep the pelvis level and the knees tracking straight.", ["Gluteus medius muscle", "Gluteus minimus muscle"]),
    M("quadriceps", "Quads", "Quadriceps femoris (rectus femoris, vastus lateralis, medialis & intermedius)", "front", "Front of the thigh. Straightens the knee — key for squats, lunges and stairs.", ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"]),
    M("rectus_femoris", "Rectus femoris", "Rectus femoris", "front", "The quad muscle that also lifts the thigh at the hip.", ["Rectus femoris muscle"]),
    M("hamstrings", "Hamstrings", "Biceps femoris, semitendinosus, semimembranosus", "back", "Back of the thigh. Bend the knee and extend the hip.", ["Long head of biceps femoris", "Short head of biceps femoris", "Semitendinosus muscle", "Semimembranosus muscle"]),
    M("adductors", "Inner thighs", "Adductor magnus, longus & brevis, gracilis, pectineus", "front", "Pull the legs together and stabilise the hips in squats and lunges.", ["Adductor magnus", "Adductor longus", "Adductor brevis", "Gracilis muscle", "Pectineus muscle"]),
    M("iliopsoas", "Hip flexors", "Iliopsoas (iliacus & psoas major)", "front", "Lift the knee towards the chest. Deep muscles of the hip.", ["Iliacus muscle", "Psoas major"]),
    M("gastrocnemius", "Calves", "Gastrocnemius (medial & lateral heads)", "back", "The visible calf muscle. Pushes you up onto your toes.", ["Medial head of gastrocnemius", "Lateral head of gastrocnemius"]),
    M("soleus", "Soleus", "Soleus", "back", "Deep calf muscle that works hardest with bent knees and for endurance.", ["Soleus muscle"]),
    M("tibialis_anterior", "Shins", "Tibialis anterior", "front", "Lifts the front of the foot and controls landing.", ["Tibialis anterior muscle"]),
  ].map((m) => [m.id, m]),
) as Record<MuscleId, MuscleInfo>;

export interface ExerciseTargets {
  primary: MuscleId[];
  secondary: MuscleId[];
  /** Stretches highlight the muscles being lengthened rather than worked. */
  stretch?: boolean;
}

export const EXERCISE_TARGETS: Record<string, ExerciseTargets> = {
  "dumbbell-bicep-curl": { primary: ["biceps_brachii"], secondary: ["brachialis", "brachioradialis"] },
  "band-bicep-curl": { primary: ["biceps_brachii"], secondary: ["brachialis", "brachioradialis"] },
  "hammer-curl": { primary: ["brachioradialis", "brachialis"], secondary: ["biceps_brachii"] },
  "overhead-tricep-extension": { primary: ["triceps_brachii"], secondary: ["rectus_abdominis"] },
  "bench-dip": { primary: ["triceps_brachii"], secondary: ["pectoralis_major", "deltoid_anterior"] },
  "push-up": { primary: ["pectoralis_major", "triceps_brachii"], secondary: ["deltoid_anterior", "serratus_anterior", "rectus_abdominis"] },
  "incline-push-up": { primary: ["pectoralis_major", "triceps_brachii"], secondary: ["deltoid_anterior", "serratus_anterior"] },
  "dumbbell-bench-press": { primary: ["pectoralis_major"], secondary: ["triceps_brachii", "deltoid_anterior"] },
  "barbell-bench-press": { primary: ["pectoralis_major"], secondary: ["triceps_brachii", "deltoid_anterior"] },
  "dumbbell-row": { primary: ["latissimus_dorsi", "rhomboids", "trapezius_middle"], secondary: ["biceps_brachii", "brachialis", "deltoid_posterior", "teres_major"] },
  "band-row": { primary: ["rhomboids", "trapezius_middle", "latissimus_dorsi"], secondary: ["biceps_brachii", "deltoid_posterior"] },
  "barbell-row": { primary: ["latissimus_dorsi", "rhomboids", "trapezius_middle"], secondary: ["biceps_brachii", "deltoid_posterior", "erector_spinae", "hamstrings"] },
  "pull-up": { primary: ["latissimus_dorsi", "teres_major"], secondary: ["biceps_brachii", "brachialis", "rhomboids", "trapezius_lower", "forearm_flexors"] },
  "lat-pulldown": { primary: ["latissimus_dorsi", "teres_major"], secondary: ["biceps_brachii", "brachialis", "rhomboids", "trapezius_lower"] },
  "dumbbell-shoulder-press": { primary: ["deltoid_anterior", "deltoid_lateral"], secondary: ["triceps_brachii", "trapezius_upper", "serratus_anterior"] },
  "pike-push-up": { primary: ["deltoid_anterior"], secondary: ["triceps_brachii", "pectoralis_major_clavicular", "serratus_anterior"] },
  "lateral-raise": { primary: ["deltoid_lateral"], secondary: ["supraspinatus", "trapezius_upper", "deltoid_anterior"] },
  "front-raise": { primary: ["deltoid_anterior"], secondary: ["pectoralis_major_clavicular", "deltoid_lateral"] },
  "bodyweight-squat": { primary: ["quadriceps", "gluteus_maximus"], secondary: ["adductors", "hamstrings", "soleus"] },
  "goblet-squat": { primary: ["quadriceps", "gluteus_maximus"], secondary: ["adductors", "rectus_abdominis", "erector_spinae"] },
  "barbell-back-squat": { primary: ["quadriceps", "gluteus_maximus"], secondary: ["adductors", "erector_spinae", "hamstrings"] },
  "leg-press": { primary: ["quadriceps", "gluteus_maximus"], secondary: ["adductors", "hamstrings"] },
  "reverse-lunge": { primary: ["quadriceps", "gluteus_maximus"], secondary: ["gluteus_medius", "adductors", "hamstrings"] },
  "romanian-deadlift": { primary: ["hamstrings", "gluteus_maximus"], secondary: ["erector_spinae", "adductors", "forearm_flexors"] },
  "glute-bridge": { primary: ["gluteus_maximus"], secondary: ["hamstrings", "gluteus_medius"] },
  "calf-raise": { primary: ["gastrocnemius"], secondary: ["soleus"] },
  "plank": { primary: ["rectus_abdominis", "transversus_abdominis"], secondary: ["external_oblique", "deltoid_anterior", "gluteus_maximus"] },
  "side-plank": { primary: ["external_oblique", "internal_oblique"], secondary: ["quadratus_lumborum", "gluteus_medius", "transversus_abdominis"] },
  "crunch": { primary: ["rectus_abdominis"], secondary: ["external_oblique"] },
  "lying-leg-raise": { primary: ["rectus_abdominis", "iliopsoas"], secondary: ["rectus_femoris", "external_oblique"] },
  "mountain-climber": { primary: ["rectus_abdominis", "iliopsoas"], secondary: ["deltoid_anterior", "quadriceps", "external_oblique"] },
  "jumping-jacks": { primary: ["gastrocnemius", "gluteus_medius", "deltoid_lateral"], secondary: ["adductors", "soleus", "quadriceps"] },
  "high-knees": { primary: ["iliopsoas", "quadriceps"], secondary: ["gastrocnemius", "rectus_abdominis"] },
  "burpee": { primary: ["quadriceps", "gluteus_maximus", "pectoralis_major"], secondary: ["triceps_brachii", "deltoid_anterior", "rectus_abdominis", "gastrocnemius"] },
  "kettlebell-swing": { primary: ["gluteus_maximus", "hamstrings"], secondary: ["erector_spinae", "rectus_abdominis", "deltoid_anterior", "forearm_flexors"] },
  "arm-circles": { primary: ["deltoid_anterior", "deltoid_lateral", "deltoid_posterior"], secondary: ["supraspinatus", "trapezius_upper"] },
  "march-in-place": { primary: ["iliopsoas", "quadriceps"], secondary: ["gastrocnemius"] },
  "bodyweight-good-morning": { primary: ["hamstrings", "gluteus_maximus"], secondary: ["erector_spinae"] },
  "hamstring-stretch": { primary: ["hamstrings"], secondary: ["gastrocnemius"], stretch: true },
  "quad-stretch": { primary: ["quadriceps"], secondary: ["iliopsoas"], stretch: true },
};

export function targetsFor(slug: string): ExerciseTargets {
  return EXERCISE_TARGETS[slug] ?? { primary: [], secondary: [] };
}

/** Mesh base name → highlight level (2 = primary, 1 = secondary). Primary always wins. */
export function highlightMap(t: ExerciseTargets): Map<string, 1 | 2> {
  const map = new Map<string, 1 | 2>();
  for (const id of t.secondary) for (const m of MUSCLES[id].meshes) map.set(m, 1);
  for (const id of t.primary) for (const m of MUSCLES[id].meshes) map.set(m, 2);
  return map;
}

/** Which side of the body to show first. */
export function preferredView(t: ExerciseTargets): "front" | "back" {
  const score = t.primary.reduce((s, id) => s + (MUSCLES[id].side === "front" ? 1 : -1), 0);
  return score >= 0 ? "front" : "back";
}
