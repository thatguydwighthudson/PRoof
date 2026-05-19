import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  smallint,
  date,
  time,
  numeric,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  preferredUnit: varchar("preferred_unit", { length: 3 })
    .notNull()
    .default("lbs"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const muscleGroups = pgTable("muscle_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  bodyRegion: varchar("body_region", { length: 50 }).notNull(),
});

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull().unique(),
    muscleGroupId: integer("muscle_group_id").references(() => muscleGroups.id),
    secondaryMuscles: text("secondary_muscles").array(),
    equipment: varchar("equipment", { length: 100 }),
    difficulty: varchar("difficulty", { length: 20 }),
    instructions: text("instructions"),
    youtubeQuery: varchar("youtube_query", { length: 200 }),
    isBodyweight: boolean("is_bodyweight").notNull().default(false),
    isCustom: boolean("is_custom").notNull().default(false),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_exercises_muscle").on(t.muscleGroupId)]
);

export const cardioExercises = pgTable("cardio_exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  equipment: varchar("equipment", { length: 100 }),
  instructions: text("instructions"),
  youtubeQuery: varchar("youtube_query", { length: 200 }),
  isCustom: boolean("is_custom").notNull().default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  splitType: varchar("split_type", { length: 50 }),
  isCustom: boolean("is_custom").notNull().default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workoutPlanExercises = pgTable(
  "workout_plan_exercises",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    sortOrder: integer("sort_order").notNull().default(0),
    defaultSets: integer("default_sets").notNull().default(3),
    defaultReps: varchar("default_reps", { length: 20 }).notNull().default("8-12"),
    defaultWeight: numeric("default_weight", { precision: 6, scale: 2 }),
    defaultRestSeconds: integer("default_rest_seconds").notNull().default(90),
    supersetGroupId: integer("superset_group_id"),
  },
  (t) => [index("idx_plan_exercises_plan").on(t.planId)]
);

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  daysPerWeek: smallint("days_per_week").notNull().default(6),
  deloadWeekInterval: smallint("deload_week_interval").notNull().default(4),
  isCustom: boolean("is_custom").notNull().default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const programDays = pgTable(
  "program_days",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    dayNumber: smallint("day_number").notNull(),
    planId: integer("plan_id").references(() => workoutPlans.id),
    restDay: boolean("rest_day").notNull().default(false),
    label: varchar("label", { length: 100 }),
  },
  (t) => [
    unique().on(t.programId, t.dayNumber),
    index("idx_program_days_program").on(t.programId),
  ]
);

export const userPrograms = pgTable(
  "user_programs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    programId: integer("program_id")
      .notNull()
      .references(() => programs.id),
    startedAt: date("started_at").notNull().defaultNow(),
    currentWeek: integer("current_week").notNull().default(1),
    nextDayNumber: smallint("next_day_number").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.programId, t.startedAt),
    index("idx_user_programs_user").on(t.userId),
  ]
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: integer("plan_id").references(() => workoutPlans.id),
    sessionDate: date("session_date").notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMins: integer("duration_mins"),
    sessionNotes: text("session_notes"),
    overallFeel: smallint("overall_feel"),
    isDeload: boolean("is_deload").notNull().default(false),
    clonedFromId: integer("cloned_from_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_session_date").on(t.sessionDate),
    index("idx_session_user").on(t.userId),
  ]
);

export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    sortOrder: integer("sort_order").notNull().default(0),
    supersetGroupId: integer("superset_group_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_session_exercises").on(t.sessionId)]
);

export const sessionSets = pgTable(
  "session_sets",
  {
    id: serial("id").primaryKey(),
    sessionExerciseId: integer("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    isWarmup: boolean("is_warmup").notNull().default(false),
    isCompleted: boolean("is_completed").notNull().default(false),
    rpe: smallint("rpe"),
    notes: text("notes"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_session_sets").on(t.sessionExerciseId)]
);

export const sessionCardio = pgTable(
  "session_cardio",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    cardioExerciseId: integer("cardio_exercise_id").references(
      () => cardioExercises.id
    ),
    customName: varchar("custom_name", { length: 150 }),
    durationMins: integer("duration_mins"),
    distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
    intensity: varchar("intensity", { length: 20 }),
    caloriesBurned: integer("calories_burned"),
    notes: text("notes"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_session_cardio").on(t.sessionId)]
);

export const personalRecords = pgTable(
  "personal_records",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    bestWeightKg: numeric("best_weight_kg", { precision: 6, scale: 2 }),
    bestWeightReps: integer("best_weight_reps"),
    bestReps: integer("best_reps"),
    bestVolumeKg: numeric("best_volume_kg", { precision: 8, scale: 2 }),
    bestWeightSessionId: integer("best_weight_session_id").references(
      () => workoutSessions.id
    ),
    bestRepsSessionId: integer("best_reps_session_id").references(
      () => workoutSessions.id
    ),
    bestVolumeSessionId: integer("best_volume_session_id").references(
      () => workoutSessions.id
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.exerciseId),
    index("idx_personal_records_user").on(t.userId),
    index("idx_personal_records_exercise").on(t.exerciseId),
  ]
);

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedDate: date("logged_date").notNull().defaultNow(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    bodyFatPct: numeric("body_fat_pct", { precision: 4, scale: 1 }),
    chestCm: numeric("chest_cm", { precision: 5, scale: 1 }),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
    hipsCm: numeric("hips_cm", { precision: 5, scale: 1 }),
    bicepCm: numeric("bicep_cm", { precision: 5, scale: 1 }),
    thighCm: numeric("thigh_cm", { precision: 5, scale: 1 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_body_metrics_user").on(t.userId, t.loggedDate)]
);

export const progressiveOverloadSuggestions = pgTable(
  "progressive_overload_suggestions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    lastWeightKg: numeric("last_weight_kg", { precision: 6, scale: 2 }).notNull(),
    suggestedWeightKg: numeric("suggested_weight_kg", {
      precision: 6,
      scale: 2,
    }).notNull(),
    basedOnSessionId: integer("based_on_session_id")
      .notNull()
      .references(() => workoutSessions.id),
    isApplied: boolean("is_applied").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.exerciseId, t.basedOnSessionId),
    index("idx_overload_pending").on(t.userId, t.exerciseId),
  ]
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workoutReminders = pgTable("workout_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  remindTime: time("remind_time").notNull().default("07:00"),
  daysOfWeek: smallint("days_of_week").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const exerciseAlternatives = pgTable(
  "exercise_alternatives",
  {
    id: serial("id").primaryKey(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    alternativeId: integer("alternative_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    similarityScore: smallint("similarity_score").notNull().default(3),
    notes: text("notes"),
  },
  (t) => [
    unique().on(t.exerciseId, t.alternativeId),
    index("idx_exercise_alternatives").on(t.exerciseId),
  ]
);

export const planExerciseVariations = pgTable(
  "plan_exercise_variations",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    baseExerciseId: integer("base_exercise_id")
      .notNull()
      .references(() => exercises.id),
    variantExerciseId: integer("variant_exercise_id")
      .notNull()
      .references(() => exercises.id),
    weekNumber: smallint("week_number").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    defaultSets: integer("default_sets").notNull().default(3),
    defaultReps: varchar("default_reps", { length: 20 }).notNull().default("8-12"),
    defaultRestSeconds: integer("default_rest_seconds").notNull().default(90),
  },
  (t) => [index("idx_plan_variations_plan").on(t.planId, t.weekNumber)]
);

export const sessionExerciseSwaps = pgTable(
  "session_exercise_swaps",
  {
    id: serial("id").primaryKey(),
    sessionExerciseId: integer("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    originalExerciseId: integer("original_exercise_id")
      .notNull()
      .references(() => exercises.id),
    swappedExerciseId: integer("swapped_exercise_id")
      .notNull()
      .references(() => exercises.id),
    isSuggested: boolean("is_suggested").notNull().default(false),
    swappedAt: timestamp("swapped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_session_swaps").on(t.sessionExerciseId)]
);

// Relations
export const exercisesRelations = relations(exercises, ({ one }) => ({
  muscleGroup: one(muscleGroups, {
    fields: [exercises.muscleGroupId],
    references: [muscleGroups.id],
  }),
}));

export const workoutPlanExercisesRelations = relations(
  workoutPlanExercises,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [workoutPlanExercises.exerciseId],
      references: [exercises.id],
    }),
    plan: one(workoutPlans, {
      fields: [workoutPlanExercises.planId],
      references: [workoutPlans.id],
    }),
  })
);

export const sessionExercisesRelations = relations(
  sessionExercises,
  ({ one, many }) => ({
    exercise: one(exercises, {
      fields: [sessionExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sessionSets),
    session: one(workoutSessions, {
      fields: [sessionExercises.sessionId],
      references: [workoutSessions.id],
    }),
  })
);

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [sessionSets.sessionExerciseId],
    references: [sessionExercises.id],
  }),
}));

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    plan: one(workoutPlans, {
      fields: [workoutSessions.planId],
      references: [workoutPlans.id],
    }),
    exercises: many(sessionExercises),
    cardio: many(sessionCardio),
  })
);

// Inferred types
export type User = typeof users.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type WorkoutPlanExercise = typeof workoutPlanExercises.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type ProgramDay = typeof programDays.$inferSelect;
export type UserProgram = typeof userPrograms.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type SessionSet = typeof sessionSets.$inferSelect;
export type SessionCardio = typeof sessionCardio.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type ProgressiveOverloadSuggestion =
  typeof progressiveOverloadSuggestions.$inferSelect;
export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type CardioExercise = typeof cardioExercises.$inferSelect;

export function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  return parseFloat(v);
}
