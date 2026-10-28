-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-10-2026 a las 09:58:13
-- Versión del servidor: 8.0.46
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ritmo_organizadorpersonal`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module` enum('finance','tasks','habits','events') CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(250) DEFAULT NULL,
  `normalized_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `icon` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `color` char(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_user_module_name` (`user_id`,`module`,`normalized_name`),
  UNIQUE KEY `uq_categories_id_user` (`id`,`user_id`),
  KEY `idx_categories_user_module_active` (`user_id`,`module`,`is_active`,`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `recurrence_frequency` enum('daily','weekly','monthly','yearly') CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `recurrence_anchor_day` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_anchor_month` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_advanced` tinyint(1) NOT NULL DEFAULT '0',
  `title` varchar(150) NOT NULL,
  `description` text,
  `event_date` datetime NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'programado',
  `deleted_at` datetime DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `duration` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_events_user` (`user_id`),
  KEY `idx_events_category_user` (`category_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expenses`
--

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `recurrence_id` int DEFAULT NULL,
  `concept` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `notes` text NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_expenses_user` (`user_id`),
  KEY `idx_expenses_category_user` (`category_id`,`user_id`),
  KEY `idx_expenses_recurrence_user` (`recurrence_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expense_recurrences`
--

CREATE TABLE IF NOT EXISTS `expense_recurrences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `concept` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `notes` text,
  `frequency` enum('daily','weekly','monthly','yearly') CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `start_date` date NOT NULL,
  `next_scheduled_date` date NOT NULL,
  `anchor_day` tinyint UNSIGNED NOT NULL,
  `anchor_month` tinyint UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `canceled_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expense_recurrences_id_user` (`id`,`user_id`),
  KEY `idx_expense_recurrences_user_active` (`user_id`,`is_active`,`deleted_at`),
  KEY `fk_expense_recurrences_category_owner` (`category_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expense_recurrence_occurrences`
--

CREATE TABLE IF NOT EXISTS `expense_recurrence_occurrences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recurrence_id` int NOT NULL,
  `user_id` int NOT NULL,
  `scheduled_date` date NOT NULL,
  `status` enum('pending','confirmed','canceled') CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'pending',
  `expense_id` int DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expense_recurrence_occurrence_date` (`recurrence_id`,`scheduled_date`),
  UNIQUE KEY `uq_expense_recurrence_occurrence_expense` (`expense_id`),
  KEY `idx_expense_recurrence_occurrences_user_status_date` (`user_id`,`status`,`scheduled_date`),
  KEY `fk_expense_recurrence_occurrences_recurrence_owner` (`recurrence_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habits`
--

CREATE TABLE IF NOT EXISTS `habits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `frequency` varchar(100) NOT NULL,
  `reminder_time` time DEFAULT NULL,
  `goal` int DEFAULT NULL,
  `status` enum('pendiente','completado') NOT NULL DEFAULT 'pendiente',
  `creation_date` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_habits_user` (`user_id`),
  KEY `idx_habits_category_user` (`category_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habit_completions`
--

CREATE TABLE IF NOT EXISTS `habit_completions` (
  `habit_id` int NOT NULL,
  `user_id` int NOT NULL,
  `completion_date` date NOT NULL,
  `completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`habit_id`,`completion_date`),
  KEY `idx_habit_completions_user_date` (`user_id`,`completion_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'usuario'),
(2, 'soporte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasks`
--

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `recurrence_frequency` enum('daily','weekly','monthly','yearly') CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `recurrence_anchor_day` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_anchor_month` tinyint UNSIGNED DEFAULT NULL,
  `recurrence_advanced` tinyint(1) NOT NULL DEFAULT '0',
  `title` varchar(45) NOT NULL,
  `description` text NOT NULL,
  `due_date` date NOT NULL,
  `priority` enum('Alta','Media','Baja') NOT NULL,
  `status` enum('Pendiente','En proceso','Completada') NOT NULL,
  `creation_date` datetime NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tasks_user` (`user_id`),
  KEY `idx_tasks_category_user` (`category_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `registration_date` date NOT NULL,
  `role_id` int NOT NULL DEFAULT '1',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo_UNIQUE` (`email`),
  KEY `fk_users_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_eventos_usuario` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_events_category_owner` FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expenses_category_owner` FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_expenses_recurrence_owner` FOREIGN KEY (`recurrence_id`,`user_id`) REFERENCES `expense_recurrences` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `expense_recurrences`
--
ALTER TABLE `expense_recurrences`
  ADD CONSTRAINT `fk_expense_recurrences_category_owner` FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_expense_recurrences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `expense_recurrence_occurrences`
--
ALTER TABLE `expense_recurrence_occurrences`
  ADD CONSTRAINT `fk_expense_recurrence_occurrences_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_expense_recurrence_occurrences_recurrence_owner` FOREIGN KEY (`recurrence_id`,`user_id`) REFERENCES `expense_recurrences` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `habits`
--
ALTER TABLE `habits`
  ADD CONSTRAINT `fk_habits_category_owner` FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_habits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_category_owner` FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories` (`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
