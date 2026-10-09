CREATE TABLE expense_recurrences (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    concept VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    notes TEXT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly')
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    start_date DATE NOT NULL,
    next_scheduled_date DATE NOT NULL,
    anchor_day TINYINT UNSIGNED NOT NULL,
    anchor_month TINYINT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    canceled_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_expense_recurrences_id_user (id, user_id),
    KEY idx_expense_recurrences_user_active (user_id, is_active, deleted_at),
    CONSTRAINT fk_expense_recurrences_category_owner
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_expense_recurrences_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expense_recurrence_occurrences (
    id INT NOT NULL AUTO_INCREMENT,
    recurrence_id INT NOT NULL,
    user_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'canceled')
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'pending',
    expense_id INT NULL,
    confirmed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_expense_recurrence_occurrence_date (recurrence_id, scheduled_date),
    UNIQUE KEY uq_expense_recurrence_occurrence_expense (expense_id),
    KEY idx_expense_recurrence_occurrences_user_status_date (user_id, status, scheduled_date),
    CONSTRAINT fk_expense_recurrence_occurrences_recurrence_owner
        FOREIGN KEY (recurrence_id, user_id)
        REFERENCES expense_recurrences (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_expense_recurrence_occurrences_expense
        FOREIGN KEY (expense_id) REFERENCES expenses (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE expenses
    ADD COLUMN recurrence_id INT NULL AFTER category_id,
    ADD COLUMN scheduled_date DATE NULL AFTER expense_date,
    ADD KEY idx_expenses_recurrence_user (recurrence_id, user_id),
    ADD CONSTRAINT fk_expenses_recurrence_owner
        FOREIGN KEY (recurrence_id, user_id)
        REFERENCES expense_recurrences (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT;
