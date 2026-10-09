CREATE TABLE categories (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    module ENUM('finance', 'tasks', 'habits', 'events')
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    icon VARCHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    color CHAR(7)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_user_module_name (user_id, module, normalized_name),
    UNIQUE KEY uq_categories_id_user (id, user_id),
    KEY idx_categories_user_module_active (user_id, module, is_active, deleted_at),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE expenses
    ADD COLUMN category_id INT NULL AFTER user_id,
    ADD KEY idx_expenses_category_user (category_id, user_id);

INSERT INTO categories (
    user_id,
    module,
    name,
    normalized_name,
    icon,
    color,
    is_default,
    is_active
)
SELECT
    grouped_categories.user_id,
    'finance',
    grouped_categories.category_name,
    grouped_categories.normalized_name,
    'wallet',
    '#64748B',
    0,
    1
FROM (
    SELECT
        expense_categories.user_id,
        MIN(
            CONVERT(
                COALESCE(NULLIF(TRIM(expense_categories.category), ''), 'Sin categoría')
                USING utf8mb4
            ) COLLATE utf8mb4_bin
        ) AS category_name,
        CONVERT(
            LOWER(COALESCE(NULLIF(TRIM(expense_categories.category), ''), 'Sin categoría'))
            USING utf8mb4
        ) COLLATE utf8mb4_bin AS normalized_name
    FROM expenses AS expense_categories
    GROUP BY
        expense_categories.user_id,
        CONVERT(
            LOWER(COALESCE(NULLIF(TRIM(expense_categories.category), ''), 'Sin categoría'))
            USING utf8mb4
        ) COLLATE utf8mb4_bin
) AS grouped_categories;

UPDATE expenses AS expense
JOIN categories AS category
    ON category.user_id = expense.user_id
    AND category.module = 'finance'
    AND category.normalized_name = CONVERT(
        LOWER(COALESCE(NULLIF(TRIM(expense.category), ''), 'Sin categoría'))
        USING utf8mb4
    ) COLLATE utf8mb4_bin
SET expense.category_id = category.id;

DROP PROCEDURE IF EXISTS ritmo_migration_20261007_assert_expenses_categories_migrated;
DELIMITER //
CREATE PROCEDURE ritmo_migration_20261007_assert_expenses_categories_migrated()
BEGIN
    DECLARE unassigned_count BIGINT DEFAULT 0;

    SELECT COUNT(*)
    INTO unassigned_count
    FROM expenses
    WHERE category_id IS NULL;

    IF unassigned_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Category migration stopped: expenses remain without category_id.';
    END IF;
END//
DELIMITER ;

CALL ritmo_migration_20261007_assert_expenses_categories_migrated();
DROP PROCEDURE ritmo_migration_20261007_assert_expenses_categories_migrated;

ALTER TABLE expenses
    MODIFY COLUMN category_id INT NOT NULL,
    ADD CONSTRAINT fk_expenses_category_owner
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE expenses
    DROP COLUMN category;
