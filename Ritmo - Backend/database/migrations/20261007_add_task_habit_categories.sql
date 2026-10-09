ALTER TABLE categories
    ADD COLUMN description VARCHAR(250) NULL AFTER name;

ALTER TABLE tasks
    ADD COLUMN category_id INT NULL AFTER user_id,
    ADD KEY idx_tasks_category_user (category_id, user_id),
    ADD CONSTRAINT fk_tasks_category_owner
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE habits
    ADD COLUMN category_id INT NULL AFTER user_id,
    ADD KEY idx_habits_category_user (category_id, user_id),
    ADD CONSTRAINT fk_habits_category_owner
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories (id, user_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT;
