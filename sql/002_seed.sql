-- ============================================================
-- WORKOUT APP — SEED DATA
-- 002_seed.sql
-- Run AFTER 001_schema.sql
-- ============================================================

-- ============================================================
-- DEFAULT USER
-- Single user for now. user_id = 1 is used throughout.
-- Add more users later without any schema changes.
-- ============================================================
INSERT INTO users (id, name, email, preferred_unit) VALUES (1, 'Dwight', NULL, 'lbs');

-- Default reminder: 7am every day
INSERT INTO workout_reminders (user_id, remind_time, days_of_week, is_active)
VALUES (1, '07:00', ARRAY[1,2,3,4,5,6,7], TRUE);

-- ============================================================
-- MUSCLE GROUPS
-- ============================================================
INSERT INTO muscle_groups (name, body_region) VALUES
  ('Chest',           'upper'),
  ('Back',            'upper'),
  ('Shoulders',       'upper'),
  ('Biceps',          'upper'),
  ('Triceps',         'upper'),
  ('Forearms',        'upper'),
  ('Traps',           'upper'),
  ('Quads',           'lower'),
  ('Hamstrings',      'lower'),
  ('Glutes',          'lower'),
  ('Calves',          'lower'),
  ('Adductors',       'lower'),
  ('Abductors',       'lower'),
  ('Abs',             'core'),
  ('Obliques',        'core'),
  ('Lower Back',      'core'),
  ('Full Body',       'full');

-- ============================================================
-- EXERCISES (60+ across all muscle groups)
-- ============================================================

-- CHEST
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Barbell Bench Press',      (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Triceps','Front Delts'], 'barbell', 'intermediate',
 'Lie flat on bench. Grip bar slightly wider than shoulder-width. Lower bar to mid-chest, press back up explosively. Keep feet flat, back slightly arched.',
 'barbell bench press proper form'),

('Dumbbell Bench Press',     (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Triceps','Front Delts'], 'dumbbell', 'beginner',
 'Lie flat on bench holding dumbbells at chest level. Press up until arms are extended. Control the descent.',
 'dumbbell bench press form'),

('Incline Barbell Press',    (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Front Delts','Triceps'], 'barbell', 'intermediate',
 'Set bench to 30-45°. Press bar from upper chest. Targets the upper chest more than flat press.',
 'incline barbell bench press form'),

('Incline Dumbbell Press',   (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Front Delts','Triceps'], 'dumbbell', 'beginner',
 'Set bench to 30-45°. Lower dumbbells to upper chest and press up. Great for upper chest development.',
 'incline dumbbell press form'),

('Cable Chest Fly',          (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Front Delts'], 'cable', 'beginner',
 'Stand between cable stations set at shoulder height. Bring handles together in a hugging motion. Keep a slight bend in elbows.',
 'cable chest fly form'),

('Dumbbell Fly',             (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Front Delts'], 'dumbbell', 'beginner',
 'Lie flat. Hold dumbbells above chest, arms slightly bent. Lower arms out wide, then bring back together.',
 'dumbbell fly form'),

('Push-Up',                  (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Triceps','Core','Front Delts'], 'bodyweight', 'beginner',
 'Start in high plank. Lower chest to floor keeping body straight. Press back up. Elbows at ~45° to body.',
 'push up proper form'),

('Chest Dip',                (SELECT id FROM muscle_groups WHERE name='Chest'),
 ARRAY['Triceps','Front Delts'], 'bodyweight', 'intermediate',
 'Lean forward on dip bars to target chest. Lower until upper arms are parallel to floor. Press up.',
 'chest dips form');

-- BACK
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Deadlift',                 (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Hamstrings','Glutes','Traps','Forearms'], 'barbell', 'advanced',
 'Feet hip-width. Bar over mid-foot. Hinge at hips, grip bar. Drive through floor, extend hips and knees simultaneously. Keep back flat throughout.',
 'deadlift proper form tutorial'),

('Barbell Row',              (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Rear Delts','Traps'], 'barbell', 'intermediate',
 'Hinge forward ~45°. Pull bar to lower chest/upper abdomen. Lead with elbows. Lower with control.',
 'barbell row form'),

('Pull-Up',                  (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Rear Delts'], 'bodyweight', 'intermediate',
 'Hang from bar, hands slightly wider than shoulders. Pull chest to bar, squeezing shoulder blades. Lower fully.',
 'pull up form'),

('Lat Pulldown',             (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Rear Delts'], 'cable', 'beginner',
 'Sit at lat pulldown station. Pull bar to upper chest. Lean back slightly. Focus on pulling with elbows.',
 'lat pulldown form'),

('Seated Cable Row',         (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Rear Delts','Lower Back'], 'cable', 'beginner',
 'Sit upright. Pull handle to lower abdomen. Squeeze shoulder blades at the top. Control the return.',
 'seated cable row form'),

('Single-Arm Dumbbell Row',  (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Rear Delts'], 'dumbbell', 'beginner',
 'Support yourself on a bench. Row dumbbell to hip. Keep back flat and elbow close to body.',
 'single arm dumbbell row form'),

('T-Bar Row',                (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Biceps','Traps'], 'barbell', 'intermediate',
 'Straddle the bar. Grip handles. Row to chest, keeping back neutral. Great for back thickness.',
 't bar row form'),

('Face Pull',                (SELECT id FROM muscle_groups WHERE name='Back'),
 ARRAY['Rear Delts','External Rotators'], 'cable', 'beginner',
 'Set cable at face height with rope. Pull to face, separating hands at the end. Key for shoulder health.',
 'face pull form');

-- SHOULDERS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Overhead Press',           (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY['Triceps','Upper Traps'], 'barbell', 'intermediate',
 'Stand or sit. Press bar from shoulders overhead. Keep core braced. Do not hyperextend lower back.',
 'overhead press form'),

('Dumbbell Shoulder Press',  (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY['Triceps'], 'dumbbell', 'beginner',
 'Press dumbbells from shoulder height to overhead. Can be seated or standing.',
 'dumbbell shoulder press form'),

('Lateral Raise',            (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY[], 'dumbbell', 'beginner',
 'Stand holding dumbbells at sides. Raise arms to shoulder height with a slight bend in elbow. Slow on the way down.',
 'lateral raise form'),

('Front Raise',              (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY[], 'dumbbell', 'beginner',
 'Hold dumbbells in front of thighs. Raise one or both arms to shoulder height. Control descent.',
 'front raise shoulder form'),

('Arnold Press',             (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY['Triceps'], 'dumbbell', 'intermediate',
 'Start with palms facing you at shoulder height. Rotate palms out as you press overhead. Reverse on descent.',
 'arnold press form'),

('Rear Delt Fly',            (SELECT id FROM muscle_groups WHERE name='Shoulders'),
 ARRAY['Traps'], 'dumbbell', 'beginner',
 'Hinge forward. Raise dumbbells out to sides with slight bend in elbows. Squeeze rear delts at top.',
 'rear delt fly form');

-- BICEPS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Barbell Curl',             (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY['Forearms'], 'barbell', 'beginner',
 'Stand holding barbell with underhand grip. Curl to shoulders. Keep elbows at sides. Squeeze at top.',
 'barbell curl form'),

('Dumbbell Curl',            (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY['Forearms'], 'dumbbell', 'beginner',
 'Alternate or both arms. Curl dumbbells to shoulder height. Supinate wrist at top for peak contraction.',
 'dumbbell curl form'),

('Hammer Curl',              (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY['Forearms','Brachialis'], 'dumbbell', 'beginner',
 'Neutral grip (thumbs up). Curl to shoulder height. Targets brachialis and forearms alongside biceps.',
 'hammer curl form'),

('Incline Dumbbell Curl',    (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY[], 'dumbbell', 'intermediate',
 'Lie back on inclined bench. Arms hang straight down. Curl up. Great stretch at the bottom.',
 'incline dumbbell curl form'),

('Cable Curl',               (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY['Forearms'], 'cable', 'beginner',
 'Stand at low cable. Curl bar or rope to shoulders. Constant tension throughout the movement.',
 'cable curl form'),

('Preacher Curl',            (SELECT id FROM muscle_groups WHERE name='Biceps'),
 ARRAY[], 'barbell', 'intermediate',
 'Rest upper arms on preacher pad. Curl weight up, lower to full extension slowly.',
 'preacher curl form');

-- TRICEPS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Tricep Dip',               (SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY['Chest','Shoulders'], 'bodyweight', 'intermediate',
 'Keep torso upright on dip bars to target triceps. Lower until elbows at 90°. Press back up.',
 'tricep dips form'),

('Skull Crusher',            (SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY[], 'barbell', 'intermediate',
 'Lie on bench. Hold bar above chest. Lower bar toward forehead by bending elbows only. Press back up.',
 'skull crusher form'),

('Tricep Pushdown',          (SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY[], 'cable', 'beginner',
 'Stand at cable with bar or rope overhead. Push down until arms extended. Keep elbows at sides.',
 'tricep pushdown form'),

('Overhead Tricep Extension',(SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY[], 'dumbbell', 'beginner',
 'Hold one dumbbell with both hands overhead. Lower behind head, elbows pointing up. Press back up.',
 'overhead tricep extension form'),

('Close-Grip Bench Press',   (SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY['Chest'], 'barbell', 'intermediate',
 'Grip bar shoulder-width or slightly narrower. Press up, keeping elbows close to body.',
 'close grip bench press form'),

('Diamond Push-Up',          (SELECT id FROM muscle_groups WHERE name='Triceps'),
 ARRAY['Chest'], 'bodyweight', 'intermediate',
 'Form a diamond with hands under chest. Perform push-up. Places extra load on triceps.',
 'diamond push up form');

-- QUADS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Barbell Back Squat',       (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY['Glutes','Hamstrings','Core'], 'barbell', 'advanced',
 'Bar on upper traps. Feet shoulder-width. Squat until thighs parallel or below. Drive through heels to stand.',
 'barbell back squat form'),

('Front Squat',              (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY['Core','Glutes'], 'barbell', 'advanced',
 'Bar rests on front delts. Elbows high. Squat deep while keeping torso upright.',
 'front squat form'),

('Leg Press',                (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY['Glutes','Hamstrings'], 'machine', 'beginner',
 'Feet shoulder-width on platform. Lower sled until 90° knee angle. Press back without locking out.',
 'leg press form'),

('Leg Extension',            (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY[], 'machine', 'beginner',
 'Sit in machine. Extend legs fully, squeeze quads at top. Slow controlled descent.',
 'leg extension form'),

('Bulgarian Split Squat',    (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY['Glutes','Hamstrings'], 'dumbbell', 'intermediate',
 'Rear foot elevated on bench. Lower front knee toward floor. Front shin stays vertical.',
 'bulgarian split squat form'),

('Walking Lunge',            (SELECT id FROM muscle_groups WHERE name='Quads'),
 ARRAY['Glutes','Hamstrings'], 'dumbbell', 'beginner',
 'Step forward into lunge. Back knee nearly touches floor. Push through front foot to next rep.',
 'walking lunge form');

-- HAMSTRINGS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Romanian Deadlift',        (SELECT id FROM muscle_groups WHERE name='Hamstrings'),
 ARRAY['Glutes','Lower Back'], 'barbell', 'intermediate',
 'Hinge at hips, soft bend in knees. Lower bar along legs until you feel a deep hamstring stretch. Drive hips forward to stand.',
 'romanian deadlift form'),

('Leg Curl (Machine)',       (SELECT id FROM muscle_groups WHERE name='Hamstrings'),
 ARRAY[], 'machine', 'beginner',
 'Lie face down. Curl legs toward glutes. Squeeze at top. Control the return.',
 'lying leg curl form'),

('Nordic Curl',              (SELECT id FROM muscle_groups WHERE name='Hamstrings'),
 ARRAY[], 'bodyweight', 'advanced',
 'Kneel with feet anchored. Lower torso toward floor slowly using hamstrings. Push up with hands.',
 'nordic curl form'),

('Stiff-Leg Deadlift',       (SELECT id FROM muscle_groups WHERE name='Hamstrings'),
 ARRAY['Lower Back','Glutes'], 'dumbbell', 'intermediate',
 'Similar to RDL but legs straighter. Feel the stretch at the bottom. Keep back flat throughout.',
 'stiff leg deadlift form');

-- GLUTES
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Hip Thrust',               (SELECT id FROM muscle_groups WHERE name='Glutes'),
 ARRAY['Hamstrings'], 'barbell', 'intermediate',
 'Upper back on bench. Barbell across hips. Drive hips to ceiling. Squeeze glutes hard at top.',
 'hip thrust form'),

('Glute Bridge',             (SELECT id FROM muscle_groups WHERE name='Glutes'),
 ARRAY['Hamstrings'], 'bodyweight', 'beginner',
 'Lie on back, knees bent. Drive hips up, squeezing glutes. Hold briefly at top.',
 'glute bridge form'),

('Cable Kickback',           (SELECT id FROM muscle_groups WHERE name='Glutes'),
 ARRAY[], 'cable', 'beginner',
 'Attach ankle strap to cable. Kick leg back and up. Keep core stable and avoid rotating hips.',
 'cable kickback glute form'),

('Sumo Squat',               (SELECT id FROM muscle_groups WHERE name='Glutes'),
 ARRAY['Adductors','Quads'], 'dumbbell', 'beginner',
 'Wide stance, toes pointed out. Hold dumbbell between legs. Squat deep. Great for glutes and inner thighs.',
 'sumo squat form');

-- CALVES
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Standing Calf Raise',      (SELECT id FROM muscle_groups WHERE name='Calves'),
 ARRAY[], 'machine', 'beginner',
 'Full range of motion — stretch at bottom, rise onto toes at top. Slow and controlled.',
 'standing calf raise form'),

('Seated Calf Raise',        (SELECT id FROM muscle_groups WHERE name='Calves'),
 ARRAY[], 'machine', 'beginner',
 'Targets soleus. Press up onto toes from seated position. Slow controlled reps.',
 'seated calf raise form'),

('Single-Leg Calf Raise',    (SELECT id FROM muscle_groups WHERE name='Calves'),
 ARRAY[], 'bodyweight', 'intermediate',
 'Balance on one foot. Rise onto toes slowly. Add a dumbbell for extra resistance.',
 'single leg calf raise form');

-- CORE / ABS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Plank',                    (SELECT id FROM muscle_groups WHERE name='Abs'),
 ARRAY['Lower Back','Glutes'], 'bodyweight', 'beginner',
 'Forearms on floor, body straight. Brace core, glutes, and quads. Hold without letting hips sag.',
 'plank proper form'),

('Cable Crunch',             (SELECT id FROM muscle_groups WHERE name='Abs'),
 ARRAY[], 'cable', 'beginner',
 'Kneel facing cable. Hold rope at head. Crunch down toward knees. Feel abs contract.',
 'cable crunch form'),

('Hanging Leg Raise',        (SELECT id FROM muscle_groups WHERE name='Abs'),
 ARRAY['Hip Flexors'], 'bodyweight', 'intermediate',
 'Hang from bar. Raise legs to 90° or higher. Control the descent — do not swing.',
 'hanging leg raise form'),

('Ab Wheel Rollout',         (SELECT id FROM muscle_groups WHERE name='Abs'),
 ARRAY['Lower Back','Lats'], 'other', 'advanced',
 'Kneel with ab wheel. Roll forward until body is nearly straight. Pull back using abs.',
 'ab wheel rollout form'),

('Russian Twist',            (SELECT id FROM muscle_groups WHERE name='Obliques'),
 ARRAY['Abs'], 'bodyweight', 'beginner',
 'Sit with feet off floor, torso leaned back. Rotate side to side. Hold a weight for progression.',
 'russian twist form'),

('Side Plank',               (SELECT id FROM muscle_groups WHERE name='Obliques'),
 ARRAY['Abs','Glutes'], 'bodyweight', 'beginner',
 'Lie on side, forearm on floor. Lift hips off ground. Body forms a straight line. Hold.',
 'side plank form');

-- TRAPS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Barbell Shrug',            (SELECT id FROM muscle_groups WHERE name='Traps'),
 ARRAY[], 'barbell', 'beginner',
 'Hold bar at thighs. Shrug shoulders straight up. Hold briefly at top. Do not roll shoulders.',
 'barbell shrug form'),

('Dumbbell Shrug',           (SELECT id FROM muscle_groups WHERE name='Traps'),
 ARRAY[], 'dumbbell', 'beginner',
 'Same as barbell shrug but with dumbbells. Allows slightly more range of motion.',
 'dumbbell shrug form');

-- FOREARMS
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Wrist Curl',               (SELECT id FROM muscle_groups WHERE name='Forearms'),
 ARRAY[], 'barbell', 'beginner',
 'Forearms resting on bench, palms up. Curl wrists up. Full range of motion.',
 'wrist curl form'),

('Reverse Curl',             (SELECT id FROM muscle_groups WHERE name='Forearms'),
 ARRAY['Biceps'], 'barbell', 'beginner',
 'Overhand grip on barbell. Curl up like a regular curl. Targets brachioradialis.',
 'reverse curl form'),

('Farmer Carry',             (SELECT id FROM muscle_groups WHERE name='Forearms'),
 ARRAY['Traps','Core'], 'dumbbell', 'beginner',
 'Hold heavy dumbbells at sides. Walk a set distance or time. Keep shoulders back.',
 'farmers carry form');

-- FULL BODY / COMPOUND
INSERT INTO exercises (name, muscle_group_id, secondary_muscles, equipment, difficulty, instructions, youtube_query)
VALUES
('Power Clean',              (SELECT id FROM muscle_groups WHERE name='Full Body'),
 ARRAY['Quads','Glutes','Traps','Forearms'], 'barbell', 'advanced',
 'Explosive pull from floor, shrug and drop under bar to catch in front rack. Full body power movement.',
 'power clean form tutorial'),

('Kettlebell Swing',         (SELECT id FROM muscle_groups WHERE name='Full Body'),
 ARRAY['Glutes','Hamstrings','Core'], 'kettlebell', 'intermediate',
 'Hinge at hips. Drive hips forward explosively to swing bell to shoulder height. Hinge back on descent.',
 'kettlebell swing form'),

('Thruster',                 (SELECT id FROM muscle_groups WHERE name='Full Body'),
 ARRAY['Quads','Shoulders','Triceps'], 'barbell', 'advanced',
 'Front squat combined with overhead press in one fluid motion. Explosive and efficient.',
 'barbell thruster form'),

('Box Jump',                 (SELECT id FROM muscle_groups WHERE name='Full Body'),
 ARRAY['Glutes','Quads'], 'bodyweight', 'intermediate',
 'Stand in front of box. Explode up, land softly with knees slightly bent. Step back down.',
 'box jump form'),

('Battle Ropes',             (SELECT id FROM muscle_groups WHERE name='Full Body'),
 ARRAY['Shoulders','Core'], 'other', 'beginner',
 'Alternate or simultaneous waves with heavy ropes. Keep core engaged. Great conditioning tool.',
 'battle ropes workout form');

-- ============================================================
-- MARK BODYWEIGHT EXERCISES
-- These exercises use bodyweight as resistance — no weight
-- input shown in the UI. Can still add extra weight optionally.
-- ============================================================
UPDATE exercises SET is_bodyweight = TRUE WHERE name IN (
  'Push-Up',
  'Pull-Up',
  'Chest Dip',
  'Tricep Dip',
  'Diamond Push-Up',
  'Plank',
  'Side Plank',
  'Hanging Leg Raise',
  'Ab Wheel Rollout',
  'Russian Twist',
  'Glute Bridge',
  'Box Jump',
  'Nordic Curl',
  'Single-Leg Calf Raise',
  'Walking Lunge'
);

-- ============================================================
-- CARDIO EXERCISES
-- ============================================================
INSERT INTO cardio_exercises (name, category, equipment, instructions, youtube_query)
VALUES
-- Machine
('Treadmill Run',        'machine', 'treadmill',
 'Adjust speed and incline. Maintain upright posture. Land mid-foot.',
 'proper treadmill running form'),

('Treadmill Walk (Incline)', 'machine', 'treadmill',
 'Set incline to 10-15%. Walk at 3-4 mph. Hands off rails for more effort.',
 'incline treadmill walk workout'),

('Elliptical',           'machine', 'elliptical',
 'Low impact. Keep resistance high enough that you feel challenged. Drive through full stride.',
 'elliptical machine proper form'),

('Stationary Bike',      'machine', 'stationary bike',
 'Adjust seat so knee has slight bend at bottom of pedal stroke. Keep cadence consistent.',
 'stationary bike workout form'),

('Rowing Machine',       'machine', 'rowing machine',
 'Sequence: legs push, lean back, arms pull. Reverse to return. Keep back straight.',
 'rowing machine form tutorial'),

('Stair Climber',        'machine', 'stair climber',
 'Keep hands off rails as much as possible. Full step for glute engagement. Upright posture.',
 'stair climber workout'),

('Ski Erg',              'machine', 'ski erg',
 'Pull handles down from overhead to hips. Powerful hip hinge drives the movement.',
 'ski erg form'),

('Air Bike',             'machine', 'air bike',
 'Push and pull handlebars while pedaling. Resistance increases with effort. Brutal but effective.',
 'assault air bike workout'),

-- Outdoor
('Outdoor Run',          'outdoor', 'none',
 'Maintain easy conversational pace for base runs. Vary terrain for conditioning.',
 'outdoor running form tips'),

('Trail Run',            'outdoor', 'none',
 'Shorter stride on uneven terrain. Watch your footing. More ankle stabilizer engagement.',
 'trail running form'),

('Cycling',              'outdoor', 'bicycle',
 'Outdoor cycling for endurance. Maintain cadence around 80-90 rpm.',
 'outdoor cycling tips beginner'),

('Sprints',              'outdoor', 'none',
 'All-out effort for 20-100m. Full recovery between reps. Drive knees high.',
 'sprint form running'),

('Jump Rope',            'outdoor', 'jump rope',
 'Keep jumps small, elbows at sides. Build to continuous sets. Great warm-up or finisher.',
 'jump rope form workout'),

-- Sport / Recreational
('Swimming',             'sport', 'pool',
 'Freestyle, breaststroke, backstroke or mix. Efficient full-body cardio.',
 'freestyle swimming technique'),

('Basketball',           'sport', 'basketball',
 'Recreational or pickup game. High intensity interval-style naturally.',
 'basketball conditioning workout'),

('Pickleball',           'sport', 'pickleball court',
 'Lower impact racquet sport with high cardio demand. Great for all ages.',
 'pickleball tips beginner'),

-- HIIT
('HIIT Sprint Intervals', 'hiit', 'none',
 '20-40 sec all-out sprint, 20-40 sec rest. Repeat 8-12 rounds. Adjust ratio to fitness level.',
 'hiit sprint interval workout'),

('Tabata',               'hiit', 'none',
 '20 seconds on, 10 seconds off for 8 rounds (4 minutes). Choose any compound movement.',
 'tabata workout explained'),

('Circuit Training',     'hiit', 'varies',
 'Cycle through 4-6 exercises with minimal rest. Keeps heart rate elevated throughout.',
 'circuit training workout beginner');

-- ============================================================
-- PUSH / PULL / LEGS WORKOUT PLANS
-- ============================================================

-- Day 1: Push A
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Push A', 'Chest, shoulders, and triceps — primary pressing movements', 'push', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Barbell Bench Press'), 1, 4, '6-8', 180),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Press'), 2, 3, '8-12', 120),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Overhead Press'), 3, 3, '8-10', 120),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Lateral Raise'), 4, 3, '12-15', 60),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Tricep Pushdown'), 5, 3, '12-15', 60),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Overhead Tricep Extension'), 6, 3, '10-12', 60);

-- Day 2: Pull A
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Pull A', 'Back and biceps — primary pulling movements', 'pull', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Deadlift'), 1, 4, '4-6', 240),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Row'), 2, 3, '6-8', 180),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Pull-Up'), 3, 3, 'AMRAP', 120),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Seated Cable Row'), 4, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Face Pull'), 5, 3, '15-20', 60),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Curl'), 6, 3, '10-12', 60),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Hammer Curl'), 7, 2, '12-15', 60);

-- Day 3: Legs A
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Legs A', 'Quad-dominant leg day with hamstring and calf work', 'legs', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Barbell Back Squat'), 1, 4, '6-8', 240),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Leg Press'), 2, 3, '10-12', 120),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Romanian Deadlift'), 3, 3, '8-10', 120),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Leg Curl (Machine)'), 4, 3, '12-15', 90),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Leg Extension'), 5, 3, '12-15', 90),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Standing Calf Raise'), 6, 4, '15-20', 60),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Plank'), 7, 3, '45-60 sec', 60);

-- Day 4: Push B
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Push B', 'Chest, shoulders, and triceps — volume and isolation focus', 'push', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Incline Barbell Press'), 1, 4, '8-10', 150),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Dumbbell Bench Press'), 2, 3, '10-12', 120),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Cable Chest Fly'), 3, 3, '12-15', 60),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Arnold Press'), 4, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Lateral Raise'), 5, 4, '15-20', 60),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Skull Crusher'), 6, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Diamond Push-Up'), 7, 2, '12-15', 60);

-- Day 5: Pull B
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Pull B', 'Back and biceps — volume and isolation focus', 'pull', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Lat Pulldown'), 1, 4, '8-10', 120),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Single-Arm Dumbbell Row'), 2, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='T-Bar Row'), 3, 3, '8-10', 120),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Seated Cable Row'), 4, 3, '12-15', 90),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Rear Delt Fly'), 5, 3, '15-20', 60),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Curl'), 6, 3, '10-12', 60),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Cable Curl'), 7, 3, '12-15', 60),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Barbell Shrug'), 8, 3, '12-15', 60);

-- Day 6: Legs B
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Legs B', 'Posterior-chain and glute-dominant leg day', 'legs', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Romanian Deadlift'), 1, 4, '8-10', 180),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Hip Thrust'), 2, 4, '10-12', 120),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'), 3, 3, '10-12', 120),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Walking Lunge'), 4, 3, '12-16 steps', 90),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Leg Curl (Machine)'), 5, 3, '12-15', 90),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Seated Calf Raise'), 6, 4, '15-20', 60),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Hanging Leg Raise'), 7, 3, '10-15', 60),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Russian Twist'), 8, 3, '20 reps', 60);

-- Day 7: Active Recovery (optional)
INSERT INTO workout_plans (name, description, split_type, is_custom)
VALUES ('Active Recovery', 'Light movement, mobility, and core. Optional 7th day.', 'custom', FALSE);

INSERT INTO workout_plan_exercises (plan_id, exercise_id, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Active Recovery'),
 (SELECT id FROM exercises WHERE name='Plank'), 1, 3, '45-60 sec', 60),
((SELECT id FROM workout_plans WHERE name='Active Recovery'),
 (SELECT id FROM exercises WHERE name='Side Plank'), 2, 3, '30-45 sec', 60),
((SELECT id FROM workout_plans WHERE name='Active Recovery'),
 (SELECT id FROM exercises WHERE name='Glute Bridge'), 3, 3, '15-20', 45),
((SELECT id FROM workout_plans WHERE name='Active Recovery'),
 (SELECT id FROM exercises WHERE name='Face Pull'), 4, 3, '15-20', 45),
((SELECT id FROM workout_plans WHERE name='Active Recovery'),
 (SELECT id FROM exercises WHERE name='Ab Wheel Rollout'), 5, 3, '8-10', 60);

-- ============================================================
-- PROGRAM: PPL 6-Day
-- ============================================================
INSERT INTO programs (name, description, days_per_week, is_custom, user_id)
VALUES ('PPL 6-Day', 'Push / Pull / Legs split, 6 days per week. Cycles Push A/B, Pull A/B, Legs A/B.', 6, FALSE, NULL);

INSERT INTO program_days (program_id, day_number, plan_id, rest_day, label)
VALUES
((SELECT id FROM programs WHERE name='PPL 6-Day'), 1, (SELECT id FROM workout_plans WHERE name='Push A'), FALSE, 'Push A'),
((SELECT id FROM programs WHERE name='PPL 6-Day'), 2, (SELECT id FROM workout_plans WHERE name='Pull A'), FALSE, 'Pull A'),
((SELECT id FROM programs WHERE name='PPL 6-Day'), 3, (SELECT id FROM workout_plans WHERE name='Legs A'), FALSE, 'Legs A'),
((SELECT id FROM programs WHERE name='PPL 6-Day'), 4, (SELECT id FROM workout_plans WHERE name='Push B'), FALSE, 'Push B'),
((SELECT id FROM programs WHERE name='PPL 6-Day'), 5, (SELECT id FROM workout_plans WHERE name='Pull B'), FALSE, 'Pull B'),
((SELECT id FROM programs WHERE name='PPL 6-Day'), 6, (SELECT id FROM workout_plans WHERE name='Legs B'), FALSE, 'Legs B');

-- PROGRAM: PPL 5-Day (with rest day built in)
INSERT INTO programs (name, description, days_per_week, is_custom, user_id)
VALUES ('PPL 5-Day', 'Push / Pull / Legs split, 5 days per week with one rest day built in.', 5, FALSE, NULL);

INSERT INTO program_days (program_id, day_number, plan_id, rest_day, label)
VALUES
((SELECT id FROM programs WHERE name='PPL 5-Day'), 1, (SELECT id FROM workout_plans WHERE name='Push A'), FALSE, 'Push A'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 2, (SELECT id FROM workout_plans WHERE name='Pull A'), FALSE, 'Pull A'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 3, (SELECT id FROM workout_plans WHERE name='Legs A'), FALSE, 'Legs A'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 4, NULL,                                                TRUE,  'Rest'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 5, (SELECT id FROM workout_plans WHERE name='Push B'), FALSE, 'Push B'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 6, (SELECT id FROM workout_plans WHERE name='Pull B'), FALSE, 'Pull B'),
((SELECT id FROM programs WHERE name='PPL 5-Day'), 7, (SELECT id FROM workout_plans WHERE name='Legs B'), FALSE, 'Legs B');

-- ============================================================
-- USER PROGRAM — Start user 1 on PPL 6-Day by default
-- ============================================================
INSERT INTO user_programs (user_id, program_id, started_at, current_week, next_day_number, is_active)
VALUES (1, (SELECT id FROM programs WHERE name='PPL 6-Day'), CURRENT_DATE, 1, 1, TRUE);

-- ============================================================
-- EXERCISE ALTERNATIVES
-- Grouped by movement pattern. Bidirectional pairs.
-- ============================================================

-- CHEST press alternatives
INSERT INTO exercise_alternatives (exercise_id, alternative_id, similarity_score, notes) VALUES
((SELECT id FROM exercises WHERE name='Barbell Bench Press'),   (SELECT id FROM exercises WHERE name='Dumbbell Bench Press'),  5, 'Same movement, dumbbells add range of motion'),
((SELECT id FROM exercises WHERE name='Dumbbell Bench Press'),  (SELECT id FROM exercises WHERE name='Barbell Bench Press'),   5, 'Same movement, barbell allows more load'),
((SELECT id FROM exercises WHERE name='Barbell Bench Press'),   (SELECT id FROM exercises WHERE name='Push-Up'),               3, 'Bodyweight alternative when no equipment'),
((SELECT id FROM exercises WHERE name='Incline Barbell Press'), (SELECT id FROM exercises WHERE name='Incline Dumbbell Press'),5, 'Same angle, dumbbells add stability challenge'),
((SELECT id FROM exercises WHERE name='Incline Dumbbell Press'),(SELECT id FROM exercises WHERE name='Incline Barbell Press'), 5, 'Same angle, barbell allows more load'),
((SELECT id FROM exercises WHERE name='Cable Chest Fly'),       (SELECT id FROM exercises WHERE name='Dumbbell Fly'),          4, 'Same fly pattern, cable provides constant tension'),
((SELECT id FROM exercises WHERE name='Dumbbell Fly'),          (SELECT id FROM exercises WHERE name='Cable Chest Fly'),       4, 'Same fly pattern, dumbbell is more accessible'),

-- BACK pull alternatives
((SELECT id FROM exercises WHERE name='Pull-Up'),               (SELECT id FROM exercises WHERE name='Lat Pulldown'),          4, 'Same vertical pull, pulldown is easier to scale'),
((SELECT id FROM exercises WHERE name='Lat Pulldown'),          (SELECT id FROM exercises WHERE name='Pull-Up'),               4, 'Same vertical pull, pull-up is harder'),
((SELECT id FROM exercises WHERE name='Barbell Row'),           (SELECT id FROM exercises WHERE name='Single-Arm Dumbbell Row'),4,'Same horizontal pull, dumbbell allows better ROM'),
((SELECT id FROM exercises WHERE name='Single-Arm Dumbbell Row'),(SELECT id FROM exercises WHERE name='Barbell Row'),          4, 'Same horizontal pull, barbell allows more load'),
((SELECT id FROM exercises WHERE name='Barbell Row'),           (SELECT id FROM exercises WHERE name='T-Bar Row'),             4, 'Both heavy horizontal rows'),
((SELECT id FROM exercises WHERE name='Seated Cable Row'),      (SELECT id FROM exercises WHERE name='Single-Arm Dumbbell Row'),3,'Both horizontal pulls'),

-- SHOULDER press alternatives
((SELECT id FROM exercises WHERE name='Overhead Press'),        (SELECT id FROM exercises WHERE name='Dumbbell Shoulder Press'),4,'Same vertical press, dumbbells allow independent arms'),
((SELECT id FROM exercises WHERE name='Dumbbell Shoulder Press'),(SELECT id FROM exercises WHERE name='Overhead Press'),       4, 'Same vertical press, barbell allows more load'),
((SELECT id FROM exercises WHERE name='Overhead Press'),        (SELECT id FROM exercises WHERE name='Arnold Press'),          3, 'Arnold adds rotation, hits more of the delt'),
((SELECT id FROM exercises WHERE name='Lateral Raise'),         (SELECT id FROM exercises WHERE name='Front Raise'),           3, 'Both delt isolation, different heads'),

-- BICEP alternatives
((SELECT id FROM exercises WHERE name='Barbell Curl'),          (SELECT id FROM exercises WHERE name='Dumbbell Curl'),         5, 'Same curl pattern'),
((SELECT id FROM exercises WHERE name='Dumbbell Curl'),         (SELECT id FROM exercises WHERE name='Barbell Curl'),          5, 'Same curl pattern'),
((SELECT id FROM exercises WHERE name='Barbell Curl'),          (SELECT id FROM exercises WHERE name='Cable Curl'),            4, 'Cable provides constant tension'),
((SELECT id FROM exercises WHERE name='Hammer Curl'),           (SELECT id FROM exercises WHERE name='Preacher Curl'),         3, 'Both bicep isolation, different emphasis'),
((SELECT id FROM exercises WHERE name='Incline Dumbbell Curl'), (SELECT id FROM exercises WHERE name='Cable Curl'),            3, 'Both stretch-focused curl variations'),

-- TRICEP alternatives
((SELECT id FROM exercises WHERE name='Tricep Pushdown'),       (SELECT id FROM exercises WHERE name='Overhead Tricep Extension'),4,'Both tricep isolation'),
((SELECT id FROM exercises WHERE name='Skull Crusher'),         (SELECT id FROM exercises WHERE name='Close-Grip Bench Press'), 4, 'Both compound tricep movements'),
((SELECT id FROM exercises WHERE name='Tricep Dip'),            (SELECT id FROM exercises WHERE name='Close-Grip Bench Press'), 3, 'Both heavy tricep movements'),
((SELECT id FROM exercises WHERE name='Diamond Push-Up'),       (SELECT id FROM exercises WHERE name='Tricep Pushdown'),        3, 'Both tricep focused'),

-- QUAD alternatives
((SELECT id FROM exercises WHERE name='Barbell Back Squat'),    (SELECT id FROM exercises WHERE name='Front Squat'),           4, 'Both barbell squats, front is more quad-dominant'),
((SELECT id FROM exercises WHERE name='Barbell Back Squat'),    (SELECT id FROM exercises WHERE name='Leg Press'),             3, 'Leg press is easier on the back'),
((SELECT id FROM exercises WHERE name='Bulgarian Split Squat'), (SELECT id FROM exercises WHERE name='Walking Lunge'),         4, 'Both single-leg quad movements'),
((SELECT id FROM exercises WHERE name='Walking Lunge'),         (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'), 4, 'Both single-leg quad movements'),
((SELECT id FROM exercises WHERE name='Leg Extension'),         (SELECT id FROM exercises WHERE name='Front Squat'),           2, 'Both quad-focused'),

-- HAMSTRING alternatives
((SELECT id FROM exercises WHERE name='Romanian Deadlift'),     (SELECT id FROM exercises WHERE name='Stiff-Leg Deadlift'),    4, 'Very similar hinge pattern'),
((SELECT id FROM exercises WHERE name='Stiff-Leg Deadlift'),    (SELECT id FROM exercises WHERE name='Romanian Deadlift'),     4, 'Very similar hinge pattern'),
((SELECT id FROM exercises WHERE name='Leg Curl (Machine)'),    (SELECT id FROM exercises WHERE name='Nordic Curl'),           3, 'Both hamstring curl patterns'),

-- GLUTE alternatives
((SELECT id FROM exercises WHERE name='Hip Thrust'),            (SELECT id FROM exercises WHERE name='Glute Bridge'),          4, 'Same movement, hip thrust has better range'),
((SELECT id FROM exercises WHERE name='Glute Bridge'),          (SELECT id FROM exercises WHERE name='Hip Thrust'),            4, 'Same movement, bridge needs no bench'),
((SELECT id FROM exercises WHERE name='Hip Thrust'),            (SELECT id FROM exercises WHERE name='Cable Kickback'),        2, 'Both glute isolation'),

-- CALF alternatives
((SELECT id FROM exercises WHERE name='Standing Calf Raise'),   (SELECT id FROM exercises WHERE name='Single-Leg Calf Raise'), 4, 'Single-leg adds balance challenge'),
((SELECT id FROM exercises WHERE name='Seated Calf Raise'),     (SELECT id FROM exercises WHERE name='Standing Calf Raise'),   3, 'Seated targets soleus more'),

-- CORE alternatives
((SELECT id FROM exercises WHERE name='Plank'),                 (SELECT id FROM exercises WHERE name='Ab Wheel Rollout'),      3, 'Both anti-extension core movements'),
((SELECT id FROM exercises WHERE name='Hanging Leg Raise'),     (SELECT id FROM exercises WHERE name='Cable Crunch'),          3, 'Both lower ab focused'),
((SELECT id FROM exercises WHERE name='Russian Twist'),         (SELECT id FROM exercises WHERE name='Side Plank'),            3, 'Both oblique focused');

-- ============================================================
-- WEEKLY EXERCISE VARIATIONS
-- Weeks 1 & 3 = base exercises (defaults in workout_plan_exercises)
-- Weeks 2 & 4 = variant exercises (defined here)
-- Only 1-2 exercises per session are rotated to keep integrity.
-- ============================================================

-- PUSH A: Week 2/4 — swap Barbell Bench Press → Dumbbell Bench Press
--                     swap Overhead Press → Arnold Press
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Barbell Bench Press'),
 (SELECT id FROM exercises WHERE name='Dumbbell Bench Press'),
 2, 1, 4, '8-10', 150),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Barbell Bench Press'),
 (SELECT id FROM exercises WHERE name='Dumbbell Bench Press'),
 4, 1, 4, '8-10', 150),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Overhead Press'),
 (SELECT id FROM exercises WHERE name='Arnold Press'),
 2, 3, 3, '10-12', 120),
((SELECT id FROM workout_plans WHERE name='Push A'),
 (SELECT id FROM exercises WHERE name='Overhead Press'),
 (SELECT id FROM exercises WHERE name='Arnold Press'),
 4, 3, 3, '10-12', 120);

-- PULL A: Week 2/4 — swap Barbell Row → T-Bar Row
--                     swap Barbell Curl → Cable Curl
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Row'),
 (SELECT id FROM exercises WHERE name='T-Bar Row'),
 2, 2, 3, '8-10', 180),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Row'),
 (SELECT id FROM exercises WHERE name='T-Bar Row'),
 4, 2, 3, '8-10', 180),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Curl'),
 (SELECT id FROM exercises WHERE name='Cable Curl'),
 2, 6, 3, '12-15', 60),
((SELECT id FROM workout_plans WHERE name='Pull A'),
 (SELECT id FROM exercises WHERE name='Barbell Curl'),
 (SELECT id FROM exercises WHERE name='Cable Curl'),
 4, 6, 3, '12-15', 60);

-- LEGS A: Week 2/4 — swap Barbell Back Squat → Front Squat
--                     swap Leg Extension → Bulgarian Split Squat
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Barbell Back Squat'),
 (SELECT id FROM exercises WHERE name='Front Squat'),
 2, 1, 4, '6-8', 240),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Barbell Back Squat'),
 (SELECT id FROM exercises WHERE name='Front Squat'),
 4, 1, 4, '6-8', 240),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Leg Extension'),
 (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'),
 2, 5, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Legs A'),
 (SELECT id FROM exercises WHERE name='Leg Extension'),
 (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'),
 4, 5, 3, '10-12', 90);

-- PUSH B: Week 2/4 — swap Incline Barbell Press → Incline Dumbbell Press
--                     swap Arnold Press → Dumbbell Shoulder Press
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Incline Barbell Press'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Press'),
 2, 1, 4, '10-12', 150),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Incline Barbell Press'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Press'),
 4, 1, 4, '10-12', 150),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Arnold Press'),
 (SELECT id FROM exercises WHERE name='Overhead Press'),
 2, 4, 3, '8-10', 120),
((SELECT id FROM workout_plans WHERE name='Push B'),
 (SELECT id FROM exercises WHERE name='Arnold Press'),
 (SELECT id FROM exercises WHERE name='Overhead Press'),
 4, 4, 3, '8-10', 120);

-- PULL B: Week 2/4 — swap Lat Pulldown → Pull-Up
--                     swap Incline Dumbbell Curl → Preacher Curl
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Lat Pulldown'),
 (SELECT id FROM exercises WHERE name='Pull-Up'),
 2, 1, 4, 'AMRAP', 120),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Lat Pulldown'),
 (SELECT id FROM exercises WHERE name='Pull-Up'),
 4, 1, 4, 'AMRAP', 120),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Curl'),
 (SELECT id FROM exercises WHERE name='Preacher Curl'),
 2, 6, 3, '10-12', 60),
((SELECT id FROM workout_plans WHERE name='Pull B'),
 (SELECT id FROM exercises WHERE name='Incline Dumbbell Curl'),
 (SELECT id FROM exercises WHERE name='Preacher Curl'),
 4, 6, 3, '10-12', 60);

-- LEGS B: Week 2/4 — swap Romanian Deadlift → Stiff-Leg Deadlift
--                     swap Walking Lunge → Bulgarian Split Squat
INSERT INTO plan_exercise_variations (plan_id, base_exercise_id, variant_exercise_id, week_number, sort_order, default_sets, default_reps, default_rest_seconds)
VALUES
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Romanian Deadlift'),
 (SELECT id FROM exercises WHERE name='Stiff-Leg Deadlift'),
 2, 1, 4, '8-10', 180),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Romanian Deadlift'),
 (SELECT id FROM exercises WHERE name='Stiff-Leg Deadlift'),
 4, 1, 4, '8-10', 180),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Walking Lunge'),
 (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'),
 2, 4, 3, '10-12', 90),
((SELECT id FROM workout_plans WHERE name='Legs B'),
 (SELECT id FROM exercises WHERE name='Walking Lunge'),
 (SELECT id FROM exercises WHERE name='Bulgarian Split Squat'),
 4, 4, 3, '10-12', 90);
