-- Consultas de verificación de 2026-11-08-habits-v2.sql (solo lectura).
-- Correr la parte ANTES, guardar los resultados, migrar y correr la parte DESPUÉS.

-- =====================================================================
-- ANTES de la migración
-- =====================================================================

-- A1. Hábitos (activos y borrados) y cuántos tienen meta mayor que 1 (pasarán a "cantidad").
SELECT COUNT(*) AS habits_total,
       SUM(deleted_at IS NULL) AS habits_active,
       SUM(goal > 1) AS will_be_count,
       SUM(goal IS NULL OR goal <= 1) AS will_be_check
FROM habits;

-- A2. Registros de cumplimiento.
SELECT COUNT(*) AS completions_total,
       COUNT(DISTINCT habit_id) AS habits_with_completions,
       MIN(completion_date) AS first_day,
       MAX(completion_date) AS last_day
FROM habit_completions;

-- A3. Cómo se leerá cada frecuencia.
SELECT REGEXP_REPLACE(TRIM(frequency), '[[:space:]]+', ' ') AS frequency_text,
       CASE
         WHEN REGEXP_REPLACE(TRIM(frequency), '[[:space:]]+', ' ') IN ('', 'diario') THEN 'Todos los días'
         WHEN REGEXP_REPLACE(TRIM(frequency), '[[:space:]]+', ' ') = 'lunes a viernes' THEN 'Lunes a viernes'
         WHEN REGEXP_REPLACE(TRIM(frequency), '[[:space:]]+', ' ') = 'fines de semana' THEN 'Fines de semana'
         ELSE 'Todos los días (texto no reconocido)'
       END AS will_become,
       COUNT(*) AS habits
FROM habits
GROUP BY frequency_text, will_become
ORDER BY habits DESC;

-- A4. Lista de hábitos cuyo texto no se reconoce y pasarán a todos los días (para revisarlos).
SELECT id, user_id, name, frequency, deleted_at IS NOT NULL AS is_deleted
FROM habits
WHERE REGEXP_REPLACE(TRIM(frequency), '[[:space:]]+', ' ') NOT IN ('', 'diario', 'lunes a viernes', 'fines de semana')
ORDER BY user_id, id;

-- A5. Cumplidos de hoy (hora de Bogotá) para comparar con /dashboard después.
SELECT COUNT(*) AS completed_today
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id AND h.deleted_at IS NULL
WHERE hc.completion_date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-05:00'));

-- =====================================================================
-- DESPUÉS de la migración
-- =====================================================================

-- D1. Columnas nuevas (deben salir las 8).
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'ritmo_organizadorpersonal'
  AND ((TABLE_NAME = 'habits' AND COLUMN_NAME IN ('days_mask', 'start_date', 'goal_type', 'unit'))
    OR (TABLE_NAME = 'habit_completions' AND COLUMN_NAME IN ('amount', 'target', 'completed_at', 'updated_at')))
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- D2. Mismos totales que A1, ahora por tipo (count = will_be_count y check = will_be_check).
SELECT COUNT(*) AS habits_total,
       SUM(goal_type = 'count') AS count_habits,
       SUM(goal_type = 'check') AS check_habits,
       SUM(goal_type = 'duration') AS duration_habits,
       SUM(goal_type = 'check' AND goal IS NOT NULL) AS check_with_goal_must_be_0,
       SUM(start_date IS NULL) AS without_start_date_must_be_0
FROM habits;

-- D3. Mismos registros que A2 y todos cumplidos.
SELECT COUNT(*) AS completions_total,
       SUM(amount < target) AS below_target_must_be_0,
       SUM(completed_at IS NULL) AS without_completed_at_must_be_0
FROM habit_completions;

-- D4. Días por hábito (127 todos, 31 lunes a viernes, 96 fines de semana).
SELECT days_mask, COUNT(*) AS habits FROM habits GROUP BY days_mask ORDER BY days_mask;

-- D5. Ningún registro antes de la fecha de inicio de su hábito (debe dar 0).
SELECT COUNT(*) AS before_start_must_be_0
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id
WHERE hc.completion_date < h.start_date;

-- D6. Igual que A5 (los cumplidos de hoy no cambian).
SELECT COUNT(*) AS completed_today
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id AND h.deleted_at IS NULL
WHERE hc.completion_date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-05:00'))
  AND hc.amount >= hc.target;
