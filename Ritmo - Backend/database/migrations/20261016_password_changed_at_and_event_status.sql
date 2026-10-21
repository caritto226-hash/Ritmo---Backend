-- Invalida los JWT emitidos antes de un cambio de contraseña (hallazgo A1 del informe QA).
ALTER TABLE users
	ADD COLUMN password_changed_at DATETIME NULL AFTER password_hash;

-- Estados de eventos según la regla de negocio: programado | completado | cancelado (hallazgo M1).
UPDATE events SET status = 'completado' WHERE status = 'realizado';
