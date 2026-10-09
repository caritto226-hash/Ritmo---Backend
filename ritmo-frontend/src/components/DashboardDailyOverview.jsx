import { useState } from "react";
import CategoryIconBadge from "./CategoryIconBadge";

const filterGroups = [
  { module: "tasks", label: "Tareas" },
  { module: "finance", label: "Gastos" },
  { module: "habits", label: "Hábitos" },
];

function getWeekday(date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    timeZone: "America/Bogota",
  }).format(date);
}

function formatTaskTime(value) {
  if (!value) return "";
  const match = String(value).match(/(?:T)?(\d{2}:\d{2})/);
  return match ? `${match[1]} · ` : "";
}

function formatExpenseAmount(value) {
  const amount = Number(value);
  const formatted = Math.abs(amount).toLocaleString("es-CO", {
    minimumFractionDigits: Number.isInteger(Math.abs(amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-$" : "$"}${formatted}`;
}

function DashboardDailyOverview({
  date,
  tasks,
  expenses,
  habits,
  reminders,
  categories,
  hiddenCategoryIds,
  hiddenModules,
  onToggleCategory,
  onToggleModule,
  onResetFilters,
  onConfirmReminder,
  error,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dayValues = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const dayNumber = Number(dayValues.day);
  const weekday = getWeekday(date);

  function isCompleted(status) {
    const normalizedStatus = status?.trim().toLocaleLowerCase();
    return ["completada", "completado", "completed", "done"].includes(normalizedStatus);
  }

  function categoryIsVisible(item, module) {
    const id = item.categoryId ?? item.category?.id;
    return id === undefined || id === null
      || !(hiddenCategoryIds[module] || []).includes(Number(id));
  }

  const entries = [
    ...tasks
      .filter((task) => !isCompleted(task.status) && categoryIsVisible(task, "tasks"))
      .map((task) => ({
        id: `task-${task.id}`,
        module: "tasks",
        item: task,
        title: task.title,
        prefix: formatTaskTime(task.startAt),
        category: task.category,
      })),
    ...expenses
      .filter((expense) => categoryIsVisible(expense, "finance"))
      .map((expense) => ({
        id: `expense-${expense.id}`,
        module: "finance",
        item: expense,
        title: expense.concept,
        suffix: formatExpenseAmount(expense.amount),
        category: expense.category,
      })),
    ...reminders
      .filter((reminder) => categoryIsVisible(reminder, "finance"))
      .map((reminder) => ({
        id: `reminder-${reminder.occurrenceId}`,
        module: "finance",
        title: reminder.concept,
        prefix: reminder.isOverdue ? "Vencido · " : "Hoy · ",
        category: reminder.category,
        reminder,
      })),
    ...habits
      .filter((habit) => !isCompleted(habit.status) && categoryIsVisible(habit, "habits"))
      .map((habit) => ({
        id: `habit-${habit.id}`,
        module: "habits",
        item: habit,
        title: habit.name,
        category: habit.category,
      })),
  ].filter((entry) => !hiddenModules[entry.module]);

  return (
    <section className="card dashboard-widget-content dashboard-day-overview">
      <header className="dashboard-day-overview-header">
        <div>
          <h2>Agenda del día</h2>
          <p>{weekday}</p>
        </div>
        <button
          type="button"
          className={`dashboard-agenda-filter-trigger ${filtersOpen ? "active" : ""}`}
          aria-expanded={filtersOpen}
          aria-controls="dashboard-agenda-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10m-7 6h4" />
          </svg>
          Categorías
        </button>
      </header>

      {filtersOpen && (
        <div className="dashboard-agenda-filters" id="dashboard-agenda-filters">
          <fieldset className="dashboard-agenda-module-filters">
            <legend>Módulos</legend>
            {filterGroups.map(({ module, label }) => (
              <label className="dashboard-agenda-module-option" key={module}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={!hiddenModules[module]}
                  onChange={() => onToggleModule(module)}
                  aria-label={`Mostrar módulo ${label}`}
                />
              </label>
            ))}
          </fieldset>
          {filterGroups.map(({ module, label }) => (
            <fieldset className="dashboard-agenda-filter-group" key={module}>
              <legend>{label}</legend>
              {(categories[module] || []).map((category) => {
                const isVisible = !(hiddenCategoryIds[module] || []).includes(Number(category.id));
                return (
                  <label className="dashboard-agenda-filter-option" key={category.id}>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onToggleCategory(module, category.id)}
                    />
                    <CategoryIconBadge category={category} size={17} className="dashboard-agenda-filter-icon" />
                    <span>{category.name}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <button type="button" className="dashboard-agenda-reset" onClick={onResetFilters}>
            Restablecer filtros
          </button>
        </div>
      )}

      {error && <p className="dashboard-day-overview-error" role="status">{error}</p>}

      <div className="dashboard-day-overview-content">
        <div className="dashboard-day-number" aria-label={`Día ${dayNumber}`}>
          {dayNumber}
        </div>
        <div className="dashboard-day-divider" aria-hidden="true" />
        <div className="dashboard-day-entries">
          {entries.length === 0 ? (
            <p className="dashboard-day-empty">No hay compromisos para este día.</p>
          ) : entries.map((entry) => (
            <div
              className={`dashboard-day-entry ${entry.completed ? "completed" : ""}`}
              key={entry.id}
            >
              <CategoryIconBadge
                category={entry.category}
                fallbackIcon={entry.module === "finance" ? "wallet" : entry.module === "habits" ? "heart-pulse" : "list-checks"}
                size={18}
                className="dashboard-day-entry-icon"
              />
              <span className="dashboard-day-entry-title">
                {entry.prefix}{entry.title}{entry.suffix ? ` · ${entry.suffix}` : ""}
              </span>
              {entry.reminder && (
                <>
                  {entry.reminder.isOverdue && (
                    <span className="dashboard-day-entry-urgent" aria-label="Pendiente vencido" />
                  )}
                  <button
                    type="button"
                    className="dashboard-day-entry-confirm"
                    onClick={() => onConfirmReminder(entry.reminder)}
                  >
                    {Number(entry.reminder.amount) > 0 ? "Recibido" : "Pagado"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardDailyOverview;
