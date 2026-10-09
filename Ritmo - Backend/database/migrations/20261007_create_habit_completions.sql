CREATE TABLE IF NOT EXISTS habit_completions (
    habit_id INT NOT NULL,
    user_id INT NOT NULL,
    completion_date DATE NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (habit_id, completion_date),
    KEY idx_habit_completions_user_date (user_id, completion_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
