-- Reversa de 2026-11-08-habits-v2.sql. Solo si hay que volver a la versión anterior.
--
-- Se pierde: el avance parcial (días sin llegar a la meta se borran, porque antes una fila
-- significaba "cumplido"), el tipo de meta, la unidad, los días de la semana y la fecha de inicio.
-- Los hábitos de tiempo conservan sus minutos en goal y la versión anterior los verá como meta
-- numérica. Lo más seguro es restaurar el respaldo de mysqldump tomado antes de la migración.

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DELETE FROM `habit_completions` WHERE `amount` < `target`;
UPDATE `habit_completions` SET `completed_at` = `updated_at` WHERE `completed_at` IS NULL;

ALTER TABLE `habit_completions`
  DROP COLUMN `amount`,
  DROP COLUMN `target`,
  DROP COLUMN `updated_at`,
  MODIFY `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `habits`
  DROP COLUMN `days_mask`,
  DROP COLUMN `start_date`,
  DROP COLUMN `goal_type`,
  DROP COLUMN `unit`;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
