export const CURRENT_USER_ID = 1;

export const LBS_PER_KG = 2.20462;

export const UPPER_BODY_OVERLOAD_PCT = 0.025;
export const LOWER_BODY_OVERLOAD_PCT = 0.05;
export const DELOAD_WEIGHT_FACTOR = 0.6;
export const DELOAD_SETS_FACTOR = 0.6;

export const LOWER_BODY_REGIONS = new Set([
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Adductors",
  "Abductors",
]);

export const AI_SYSTEM_PROMPT = `You are a knowledgeable, encouraging personal trainer embedded in a workout app.
You have context about the user's current exercise, their logged sets/reps/weight/RPE,
and any notes they've added. Answer questions about form, muscle activation,
programming, recovery, and nutrition. Be concise — the user is in the gym.
Never recommend ignoring pain. If something sounds like an injury, tell them to stop and see a professional.`;
