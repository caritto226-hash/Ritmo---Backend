-- Hábitos v2: tipo de meta, avance diario, días de la semana y fecha de inicio.
-- Base de datos: ritmo_organizadorpersonal (MySQL 8).
--
-- Antes de ejecutarla: hacer el respaldo con mysqldump y correr la parte "ANTES" de
-- 2026-11-08-habits-v2-verify.sql. Se ejecuta una sola vez: MySQL 8 no admite
-- ADD COLUMN IF NOT EXISTS. Las sentencias ALTER confirman por sí solas (no hay transacción
-- que deshacer); para volver atrás está 2026-11-08-habits-v2-down.sql.

-- Workbench y phpMyAdmin pueden tener activo el modo de actualizaciones seguras.
SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- 1) Columnas nuevas de habits.
--    days_mask: bit 0 = lunes … bit 6 = domingo (127 = todos los días).
--    start_date: primer día en que el hábito cuenta para rachas y porcentajes.
--    unit: sin charset propio, hereda el de la tabla habits.
ALTER TABLE `habits`
  ADD COLUMN `days_mask` TINYINT UNSIGNED NOT NULL DEFAULT 127 AFTER `frequency`,
  ADD COLUMN `start_date` DATE NULL DEFAULT NULL AFTER `days_mask`,
  ADD COLUMN `goal_type` ENUM('check','count','duration') NOT NULL DEFAULT 'check' AFTER `reminder_time`,
  ADD COLUMN `unit` VARCHAR(20) NULL DEFAULT NULL AFTER `goal`;

-- 2) Columnas nuevas de habit_completions.
--    amount: avance del día (cantidad o minutos). target: meta de ese día (copia de goal).
--    completed_at: cuándo llegó a la meta; NULL mientras no llegue.
ALTER TABLE `habit_completions`
  ADD COLUMN `amount` INT NOT NULL DEFAULT 1 AFTER `completion_date`,
  ADD COLUMN `target` INT NOT NULL DEFAULT 1 AFTER `amount`,
  MODIFY `completed_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3) Tipo de meta: goal mayor que 1 pasa a cantidad (sin unidad); el resto, a solo marcar.
UPDATE `habits` SET `goal_type` = 'count' WHERE `goal` > 1;
UPDATE `habits` SET `goal` = NULL WHERE `goal_type` = 'check';

-- 4) Días de la semana desde el texto libre (sin importar mayúsculas ni tildes, con la
--    colación de la tabla). "Diario" o vacío ya quedan en 127 por el valor por defecto; el resto
--    de textos también queda en 127 (la lista sale de la consulta de verificación).
UPDATE `habits` SET `days_mask` = 31
WHERE REGEXP_REPLACE(TRIM(`frequency`), '[[:space:]]+', ' ') = 'lunes a viernes';
UPDATE `habits` SET `days_mask` = 96
WHERE REGEXP_REPLACE(TRIM(`frequency`), '[[:space:]]+', ' ') = 'fines de semana';

-- 5) Fecha de inicio: el día de creación o el primer registro, el que sea anterior.
UPDATE `habits` h
  LEFT JOIN (
    SELECT `habit_id`, MIN(`completion_date`) AS first_day
    FROM `habit_completions`
    GROUP BY `habit_id`
  ) f ON f.habit_id = h.id
  SET h.start_date = LEAST(DATE(h.creation_date), COALESCE(f.first_day, DATE(h.creation_date)));

ALTER TABLE `habits` MODIFY `start_date` DATE NOT NULL;

-- 6) Registros existentes: cada fila significaba "cumplido", así que el avance queda igual a la
--    meta del hábito (1 en los de solo marcar).
UPDATE `habit_completions` hc
  JOIN `habits` h ON h.id = hc.habit_id
  SET hc.target = IF(h.goal_type = 'check', 1, h.goal),
      hc.amount = IF(h.goal_type = 'check', 1, h.goal);

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
