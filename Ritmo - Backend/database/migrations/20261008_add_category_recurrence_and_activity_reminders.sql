ALTER TABLE categories
	ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0 AFTER color;

ALTER TABLE tasks
	ADD COLUMN recurrence_frequency ENUM('daily', 'weekly', 'monthly', 'yearly')
		CHARACTER SET ascii COLLATE ascii_bin NULL AFTER category_id,
	ADD COLUMN recurrence_anchor_day TINYINT UNSIGNED NULL AFTER recurrence_frequency,
	ADD COLUMN recurrence_anchor_month TINYINT UNSIGNED NULL AFTER recurrence_anchor_day,
	ADD COLUMN recurrence_advanced TINYINT(1) NOT NULL DEFAULT 0 AFTER recurrence_anchor_month;

ALTER TABLE events
	ADD COLUMN category_id INT NULL AFTER user_id,
	ADD COLUMN recurrence_frequency ENUM('daily', 'weekly', 'monthly', 'yearly')
		CHARACTER SET ascii COLLATE ascii_bin NULL AFTER category_id,
	ADD COLUMN recurrence_anchor_day TINYINT UNSIGNED NULL AFTER recurrence_frequency,
	ADD COLUMN recurrence_anchor_month TINYINT UNSIGNED NULL AFTER recurrence_anchor_day,
	ADD COLUMN recurrence_advanced TINYINT(1) NOT NULL DEFAULT 0 AFTER recurrence_anchor_month,
	ADD KEY idx_events_category_user (category_id, user_id),
	ADD CONSTRAINT fk_events_category_owner
		FOREIGN KEY (category_id, user_id)
		REFERENCES categories (id, user_id)
		ON UPDATE RESTRICT ON DELETE RESTRICT;

UPDATE events SET status = 'programado' WHERE status IS NULL OR status = '';
ALTER TABLE events
	MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'programado';

ALTER TABLE habits
	ADD COLUMN reminder_time TIME NULL AFTER frequency;
