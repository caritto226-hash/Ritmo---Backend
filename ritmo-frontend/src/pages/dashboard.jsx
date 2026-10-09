import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import dashboardService from "../services/dashboard.service";
import habitsService from "../services/habits.service";
import tasksService from "../services/tasks.service";
import eventsService from "../services/events.service";
import expensesService from "../services/expenses.service";
import categoriesService from "../services/categories.service";
import CategoryIconBadge from "../components/CategoryIconBadge";
import DashboardCalendar from "../components/DashboardCalendar";
import DashboardDailyOverview from "../components/DashboardDailyOverview";
import FinanceRecurrenceReminders from "../components/FinanceRecurrenceReminders";
import dashboardWidgets from "../constants/dashboardWidgets";
import "../styles/dashboard.css";

const defaultWidgetOrder = dashboardWidgets.map(({ id }) => id);
const widgetLabels = Object.fromEntries(dashboardWidgets.map(({ id, label }) => [id, label]));

async function getDashboardData() {
  return dashboardService.getDashboard();
}

const categoryModulesByItemType = {
  task: "tasks",
  habit: "habits",
  expense: "finance",
};

async function getDashboardCategories() {
  const modules = Object.values(categoryModulesByItemType);
  const results = await Promise.allSettled(
    modules.map((module) => categoriesService.getAll(module)),
  );

  return results.reduce((catalogs, result, index) => {
    const module = modules[index];
    if (result.status === "fulfilled") {
      catalogs[module] = result.value;
    } else {
      catalogs[module] = [];
    }
    return catalogs;
  }, {});
}

function getCommitmentDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : null;
}

async function getDashboardDayData() {
  const [taskResult, eventResult, expenseResult, reminderResult] = await Promise.allSettled([
    tasksService.getAll(),
    eventsService.getAll(),
    expensesService.getAll(),
    expensesService.getRecurrenceReminders(),
  ]);
  const dates = new Set();
  const tasks = taskResult.status === "fulfilled" ? taskResult.value : [];
  const expenses = expenseResult.status === "fulfilled" ? expenseResult.value : [];
  const reminders = reminderResult.status === "fulfilled" ? reminderResult.value : [];

  tasks.forEach((task) => {
    const date = getCommitmentDate(task.dueDate);
    if (date) dates.add(date);
  });

  if (eventResult.status === "fulfilled") {
    eventResult.value.forEach((event) => {
      const date = getCommitmentDate(event.eventDate);
      if (date) dates.add(date);
    });
  }

  reminders.forEach((reminder) => {
    const date = getCommitmentDate(reminder.scheduledDate);
    if (date) dates.add(date);
  });

  const failedSources = [
    taskResult.status === "rejected" ? "tareas" : null,
    eventResult.status === "rejected" ? "eventos" : null,
    reminderResult.status === "rejected" ? "recordatorios financieros" : null,
  ].filter(Boolean);
  const failedDailySources = [
    taskResult.status === "rejected" ? "tareas" : null,
    expenseResult.status === "rejected" ? "gastos" : null,
    reminderResult.status === "rejected" ? "recordatorios financieros" : null,
  ].filter(Boolean);

  return {
    dates: [...dates],
    error: failedSources.length > 0
      ? `No se pudieron cargar las fechas de ${failedSources.join(" y ")}.`
      : "",
    tasks,
    expenses,
    reminders,
    dailyOverviewError: failedDailySources.length > 0
      ? `No se pudieron cargar ${failedDailySources.join(" y ")} de la agenda.`
      : "",
  };
}

function getDateKey(date) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function Dashboard() {
  const { theme, toggleTheme, widgetVisibility = {} } = useOutletContext();
  const [data, setData] = useState(null);
  const [dashboardHabits, setDashboardHabits] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [recurrenceReminders, setRecurrenceReminders] = useState([]);
  const [dailyOverviewError, setDailyOverviewError] = useState("");
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState({});
  const [hiddenAgendaModules, setHiddenAgendaModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryCatalogs, setCategoryCatalogs] = useState({});
  const [categorySyncError, setCategorySyncError] = useState("");
  const [commitmentDates, setCommitmentDates] = useState([]);
  const [calendarError, setCalendarError] = useState("");
  const [preferenceError, setPreferenceError] = useState("");
  const [, setWidgetOrderRevision] = useState(0);
  const [draggingWidget, setDraggingWidget] = useState(null);
  const [dropTargetWidget, setDropTargetWidget] = useState(null);
  const [updatingHabitId, setUpdatingHabitId] = useState(null);
  const dragState = useRef(null);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const [result, habits, catalogs, dayData] = await Promise.all([
          getDashboardData(),
          habitsService.getAll(),
          getDashboardCategories(),
          getDashboardDayData(),
        ]);
        if (active) {
          setData(result);
          setDashboardHabits(habits);
          setDailyTasks(dayData.tasks);
          setDailyExpenses(dayData.expenses);
          setRecurrenceReminders(dayData.reminders);
          setDailyOverviewError(dayData.dailyOverviewError);
          setCategoryCatalogs(catalogs);
          setCommitmentDates(dayData.dates);
          setCalendarError(dayData.error);
          const missingCatalogs = Object.entries(catalogs)
            .filter(([, categories]) => categories.length === 0)
            .map(([module]) => module);
          setCategorySyncError(
            missingCatalogs.length > 0
              ? `No se pudieron sincronizar categorías de: ${missingCatalogs.join(", ")}.`
              : "",
          );
          setError("");
        }
      } catch {
        if (active) setError("No se pudo cargar el dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") fetchDashboard();
    }

    fetchDashboard(() => active);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const userId = data?.user?.id;
  useEffect(() => {
    if (!userId) return;
    try {
      const savedFilters = localStorage.getItem(`ritmo-dashboard-agenda-hidden-categories-${userId}`);
      setHiddenCategoryIds(savedFilters ? JSON.parse(savedFilters) : {});
      const savedModules = localStorage.getItem(`ritmo-dashboard-agenda-hidden-modules-${userId}`);
      setHiddenAgendaModules(savedModules ? JSON.parse(savedModules) : {});
    } catch {
      setHiddenCategoryIds({});
      setHiddenAgendaModules({});
      setPreferenceError("No se pudieron cargar los filtros de la agenda.");
    }
  }, [userId]);

  let widgetOrder = defaultWidgetOrder;
  if (userId) {
    try {
      const savedOrder = localStorage.getItem(`ritmo-dashboard-widgets-${userId}`);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder)) {
          const validSavedOrder = parsedOrder.filter((widgetId, index) => (
            defaultWidgetOrder.includes(widgetId)
            && parsedOrder.indexOf(widgetId) === index
          ));
          widgetOrder = [
            ...validSavedOrder,
            ...defaultWidgetOrder.filter((widgetId) => !validSavedOrder.includes(widgetId)),
          ];
        }
      }
    } catch {
      widgetOrder = defaultWidgetOrder;
    }
  }

  function saveWidgetOrder(nextOrder) {
    try {
      localStorage.setItem(`ritmo-dashboard-widgets-${userId}`, JSON.stringify(nextOrder));
      setWidgetOrderRevision((revision) => revision + 1);
      setPreferenceError("");
    } catch {
      setPreferenceError("No se pudo guardar el orden de las tarjetas.");
    }
  }

  function toggleAgendaCategory(module, categoryId) {
    const id = Number(categoryId);
    const nextFilters = {
      ...hiddenCategoryIds,
      [module]: hiddenCategoryIds[module]?.includes(id)
        ? hiddenCategoryIds[module].filter((hiddenId) => hiddenId !== id)
        : [...(hiddenCategoryIds[module] || []), id],
    };
    setHiddenCategoryIds(nextFilters);
    try {
      localStorage.setItem(
        `ritmo-dashboard-agenda-hidden-categories-${userId}`,
        JSON.stringify(nextFilters),
      );
      setPreferenceError("");
    } catch {
      setPreferenceError("No se pudieron guardar los filtros de categorías de la agenda.");
    }
  }

  function resetAgendaCategoryFilters() {
    setHiddenCategoryIds({});
    setHiddenAgendaModules({});
    try {
      localStorage.removeItem(`ritmo-dashboard-agenda-hidden-categories-${userId}`);
      localStorage.removeItem(`ritmo-dashboard-agenda-hidden-modules-${userId}`);
      setPreferenceError("");
    } catch {
      setPreferenceError("No se pudieron restablecer los filtros de categorías de la agenda.");
    }
  }

  function toggleAgendaModule(module) {
    const nextHiddenModules = {
      ...hiddenAgendaModules,
      [module]: !hiddenAgendaModules[module],
    };
    setHiddenAgendaModules(nextHiddenModules);
    try {
      localStorage.setItem(
        `ritmo-dashboard-agenda-hidden-modules-${userId}`,
        JSON.stringify(nextHiddenModules),
      );
      setPreferenceError("");
    } catch {
      setPreferenceError("No se pudieron guardar los módulos visibles de la agenda.");
    }
  }

  function reorderWidget(sourceId, targetId, direction = 0) {
    const sourceIndex = widgetOrder.indexOf(sourceId);
    const targetIndex = widgetOrder.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextOrder = [...widgetOrder];
    nextOrder.splice(sourceIndex, 1);
    const insertionIndex = direction === 0
      ? targetIndex
      : Math.max(0, Math.min(widgetOrder.length - 1, sourceIndex + direction));
    nextOrder.splice(insertionIndex, 0, sourceId);
    saveWidgetOrder(nextOrder);
  }

  function startWidgetDrag(event, widgetId) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      widgetId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      targetId: widgetId,
    };
    setDraggingWidget(widgetId);
  }

  function moveWidgetDrag(event) {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    if (!currentDrag.started) {
      const distance = Math.hypot(event.clientX - currentDrag.startX, event.clientY - currentDrag.startY);
      if (distance < 8) return;
      currentDrag.started = true;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-dashboard-widget]");
    if (target && target.dataset.dashboardWidget !== currentDrag.widgetId) {
      currentDrag.targetId = target.dataset.dashboardWidget;
      setDropTargetWidget(currentDrag.targetId);
    } else {
      currentDrag.targetId = currentDrag.widgetId;
      setDropTargetWidget(null);
    }
  }

  function finishWidgetDrag(event) {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    if (currentDrag.started && currentDrag.targetId !== currentDrag.widgetId) {
      reorderWidget(currentDrag.widgetId, currentDrag.targetId);
    }
    dragState.current = null;
    setDraggingWidget(null);
    setDropTargetWidget(null);
  }

  async function toggleHabitCompletion(habit) {
    setUpdatingHabitId(habit.id);
    setError("");
    try {
      const nextStatus = habit.status?.toLowerCase() === "completado"
        ? "pendiente"
        : "completado";
      await habitsService.changeStatus(habit.id, nextStatus);
      const [dashboardData, habits] = await Promise.all([
        getDashboardData(),
        habitsService.getAll(),
      ]);
      setData(dashboardData);
      setDashboardHabits(habits);
    } catch {
      setError(`No se pudo actualizar "${habit.name}".`);
    } finally {
      setUpdatingHabitId(null);
    }
  }

  async function confirmRecurrenceReminder(reminder) {
    try {
      await expensesService.confirmRecurrenceOccurrence(reminder.occurrenceId);
      const [dashboardData, habits, dayData] = await Promise.all([
        getDashboardData(),
        habitsService.getAll(),
        getDashboardDayData(),
      ]);
      setData(dashboardData);
      setDashboardHabits(habits);
      setDailyTasks(dayData.tasks);
      setDailyExpenses(dayData.expenses);
      setRecurrenceReminders(dayData.reminders);
      setCommitmentDates(dayData.dates);
      setCalendarError(dayData.error);
      setDailyOverviewError(dayData.dailyOverviewError);
    } catch {
      setError(`No se pudo confirmar "${reminder.concept}".`);
    }
  }

  const userName = data?.user?.name?.trim().split(/\s+/)[0];
  const greeting = (
    <div className="greeting dashboard-greeting">
      <div>
        <h1>Hola{userName ? ` ${userName}!` : ""} ✨</h1>
        <p>¿Cómo va tu ritmo hoy?</p>
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42 1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
          </svg>
        )}
      </button>
    </div>
  );

  if (loading) return <div className="dashboard-page">{greeting}<p>Cargando...</p></div>;
  if (error && !data) return <div className="dashboard-page">{greeting}<p role="alert">{error}</p></div>;

  const { percentage, tasks, habits, pending } = data.todayRitmo;
  const circumference = 175.93;
  const dashOffset = circumference - (circumference * percentage) / 100;
  const habitsForDashboard = dashboardHabits;
  const todayDate = new Date();
  const todayKey = getDateKey(todayDate);
  const todayTasks = dailyTasks.filter((task) => getCommitmentDate(task.dueDate) === todayKey);
  const todayExpenses = dailyExpenses.filter((expense) => getCommitmentDate(expense.expenseDate) === todayKey);
  const todayAndOverdueReminders = recurrenceReminders.filter((reminder) => (
    reminder.isOverdue || reminder.isDueToday
  ));
  const overdueReminders = recurrenceReminders.filter((reminder) => reminder.isOverdue);
  const visibleOverdueReminders = hiddenAgendaModules.finance
    ? []
    : overdueReminders.filter((reminder) => (
      !(hiddenCategoryIds.finance || []).includes(Number(reminder.categoryId))
    ));
  const upcomingItems = data.upcoming.filter((item) => item.type !== "habit");

  function categoryFor(item) {
    const module = categoryModulesByItemType[item.type];
    const categories = module ? categoryCatalogs[module] || [] : [];
    const categoryId = item.categoryId ?? item.category?.id;
    const categoryName = typeof item.category === "string"
      ? item.category.trim().toLocaleLowerCase()
      : item.category?.name?.trim().toLocaleLowerCase();
    const catalogCategory = categories.find((category) => (
      (categoryId !== undefined && categoryId !== null && Number(category.id) === Number(categoryId))
      || (categoryName && category.name.trim().toLocaleLowerCase() === categoryName)
    ));

    if (!item.category || typeof item.category === "string") {
      return catalogCategory || null;
    }

    return {
      ...catalogCategory,
      ...item.category,
      icon: item.category.icon || catalogCategory?.icon,
      color: item.category.color || catalogCategory?.color,
      name: item.category.name || catalogCategory?.name,
    };
  }

  function iconColorFor(item) {
    if (item.type === "habit") return "purple";
    if (item.type === "expense") return Number(item.amount) < 0 ? "orange" : "green";
    return "orange";
  }

  function iconFor(type) {
    if (type === "habit") return <path d="M12 2C8 7 5 10 5 14a7 7 0 0 0 14 0C19 10 16 7 12 2z" />;
    if (type === "expense") return <circle cx="12" cy="12" r="9" />;
    if (type === "event") {
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      );
    }
    return <polyline points="9 11 12 14 22 4" />;
  }

  function widgetContent(widgetId) {
    if (widgetId === "rhythm") {
      return (
        <div className="card dashboard-widget-content">
          <div className="ritmo-card-header">
            <span>Tu ritmo de hoy</span>
            <Link to="/tasks" className="ver-link">Ver agenda ›</Link>
          </div>
          <div className="ritmo-card">
            <div className="donut-wrap">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle className="donut-bg" cx="38" cy="38" r="28" />
                <circle className="donut-fg" cx="38" cy="38" r="28" style={{ strokeDashoffset: dashOffset }} />
              </svg>
              <div className="donut-label">{percentage}%</div>
            </div>
            <div className="ritmo-info">
              <h3>{data.todayRitmo.completed} de {data.todayRitmo.total} actividades completadas</h3>
              <p className="sub">
                <span>♥</span> Tareas {tasks.completed}/{tasks.total} · Hábitos {habits.completed}/{habits.total} · {pending} pendientes
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (widgetId === "habits") {
      return (
        <section className="card dashboard-widget-content dashboard-habits">
          <header className="dashboard-habits-header">
            <div>
              <h2>Hábitos</h2>
              <p>Marca los que ya completaste hoy</p>
            </div>
            <Link to="/habits" className="ver-link">Ver todos ›</Link>
          </header>
          {habitsForDashboard.length === 0 ? (
            <p className="dashboard-habits-empty">Aún no tienes hábitos registrados.</p>
          ) : (
            <ul className="dashboard-habit-list">
              {habitsForDashboard.map((habit) => {
                const category = categoryFor(habit);
                const isCompleted = habit.status?.toLowerCase() === "completado";
                return (
                  <li className={`dashboard-habit ${isCompleted ? "completed" : ""}`} key={habit.id}>
                    <CategoryIconBadge
                      category={category}
                      fallbackIcon="heart-pulse"
                      size={20}
                      className="dashboard-category-icon"
                    />
                    <span className="dashboard-habit-name">{habit.name}</span>
                    <button
                      type="button"
                      className={`dashboard-habit-check ${isCompleted ? "checked" : ""} ${updatingHabitId === habit.id ? "updating" : ""}`}
                      onClick={() => toggleHabitCompletion(habit)}
                      disabled={updatingHabitId !== null}
                      aria-pressed={isCompleted}
                      aria-label={`${isCompleted ? "Desmarcar" : "Marcar"} ${habit.name} ${isCompleted ? "como pendiente" : "como completado"}`}
                    >
                      {isCompleted && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    }

    if (widgetId === "calendar") {
      return (
        <DashboardCalendar
          commitmentDates={new Set(commitmentDates)}
          error={calendarError}
        />
      );
    }

    if (widgetId === "dayOverview") {
      return (
        <DashboardDailyOverview
          date={todayDate}
          tasks={todayTasks}
          expenses={todayExpenses}
          habits={habitsForDashboard}
          reminders={todayAndOverdueReminders}
          categories={categoryCatalogs}
          hiddenCategoryIds={hiddenCategoryIds}
          hiddenModules={hiddenAgendaModules}
          onToggleCategory={toggleAgendaCategory}
          onToggleModule={toggleAgendaModule}
          onResetFilters={resetAgendaCategoryFilters}
          onConfirmReminder={confirmRecurrenceReminder}
          error={dailyOverviewError}
        />
      );
    }

    if (widgetId === "upcoming") {
      return (
        <div className="card dashboard-widget-content">
          <div className="proximos-header">
            <span>Próximos</span>
          </div>
          {upcomingItems.length === 0 ? (
            <p className="dashboard-habits-empty">No tienes próximos elementos por ahora.</p>
          ) : (
            <div className="dashboard-upcoming-grid">
              {upcomingItems.map((item) => {
                const category = categoryFor(item);
                return (
                  <div className="dashboard-upcoming-item" key={`${item.type}-${item.id}`}>
                  {category ? (
                    <CategoryIconBadge
                      category={category}
                      size={20}
                      className="dashboard-category-icon"
                    />
                  ) : (
                    <span className={`dashboard-category-icon item-icon ${iconColorFor(item)}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {iconFor(item.type)}
                      </svg>
                    </span>
                  )}
                  <div className="dashboard-upcoming-copy">
                    <h4>{item.title || item.name || item.concept}</h4>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="card motiv-card dashboard-widget-content">
        <p className="motiv-title">✦ Pequeños pasos, gran ritmo ♥</p>
        <p className="motiv-sub">Vas muy bien, sigue así ✨</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <svg width="0" height="0" className="dashboard-svg-defs" aria-hidden="true">
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5a66d" />
            <stop offset="100%" stopColor="#e07fa0" />
          </linearGradient>
        </defs>
      </svg>

      {greeting}
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {preferenceError && <p className="dashboard-error" role="alert">{preferenceError}</p>}
      {categorySyncError && <p className="dashboard-error" role="status">{categorySyncError}</p>}

      {widgetVisibility.dayOverview !== false && visibleOverdueReminders.length > 0 && (
        <FinanceRecurrenceReminders
          reminders={visibleOverdueReminders}
          onConfirm={confirmRecurrenceReminder}
          onCancel={() => {}}
          compact
        />
      )}

      <div className="dashboard-widgets" aria-label="Tarjetas del dashboard">
        {widgetOrder.filter((widgetId) => widgetVisibility[widgetId] !== false).map((widgetId) => (
          <section
            className={[
              "dashboard-widget",
              `dashboard-widget-${widgetId}`,
              draggingWidget === widgetId ? "dragging" : "",
              dropTargetWidget === widgetId ? "drop-target" : "",
            ].filter(Boolean).join(" ")}
            data-dashboard-widget={widgetId}
            key={widgetId}
          >
            <button
              type="button"
              className="dashboard-widget-handle"
              aria-label={`Mover tarjeta ${widgetLabels[widgetId]}. Usa las flechas arriba y abajo para reordenar.`}
              title="Mantén presionado y arrastra para mover"
              onPointerDown={(event) => startWidgetDrag(event, widgetId)}
              onPointerMove={moveWidgetDrag}
              onPointerUp={finishWidgetDrag}
              onPointerCancel={finishWidgetDrag}
              onKeyDown={(event) => {
                const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                if (!direction) return;
                event.preventDefault();
                const index = widgetOrder.indexOf(widgetId);
                const targetId = widgetOrder[index + direction];
                if (targetId) reorderWidget(widgetId, targetId, direction);
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="8" cy="5" r="1.5" /><circle cx="16" cy="5" r="1.5" />
                <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
                <circle cx="8" cy="19" r="1.5" /><circle cx="16" cy="19" r="1.5" />
              </svg>
            </button>
            {widgetContent(widgetId)}
          </section>
        ))}
        {widgetOrder.every((widgetId) => widgetVisibility[widgetId] === false) && (
          <p className="dashboard-widgets-empty">
            No hay widgets activos. Puedes activarlos desde Ajustes en el menú principal.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
