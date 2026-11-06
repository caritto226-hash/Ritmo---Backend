import { useState } from "react";
import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import Card, { CardHeader } from "../../ui/primitives/Card";
import IconButton from "../../ui/primitives/IconButton";
import PillButton from "../../ui/primitives/PillButton";
import Chip from "../../ui/primitives/Chip";
import HorizontalTimeline from "../../ui/charts/HorizontalTimeline";
import WeekBars from "../../ui/charts/WeekBars";
import TaskRow, { TaskTableHeader } from "../../ui/domain/TaskRow";
import TaskPill from "../../ui/domain/TaskPill";
import { isTaskDone } from "../../hooks/data/todaySelectors";
import {
  filterTasks,
  formatTaskWhen,
  getTaskCategoryKey,
  NO_CATEGORY_KEY,
  selectByCategory,
  selectListTasks,
  selectTaskStats,
  selectTimedTasks,
  selectUntimedTasks,
  selectWeekCompleted,
  TASK_PRIORITIES,
} from "../../hooks/data/taskSelectors";
import { formatAgendaDay, formatClockWithPeriod, formatDayPill } from "../../utils/dates";
import { TASKS_PREVIEW } from "./tasksPreview";
import styles from "./TasksWeb.module.css";

const STATUS_TABS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "done", label: "Completadas" },
];

const LIST_TITLES = { day: "Todas las tareas", upcoming: "Próximas", archive: "Archivo de completadas" };

// Tareas web (TareasWeb.dc.html). Las cifras junto al título son siempre de hoy.
function TasksWeb({
  tasks,
  categories,
  loading,
  error,
  todayKey,
  selectedKey,
  now,
  view,
  onPickDate,
  onToggle,
  isPending,
  onOpen,
  onCreate,
  comingSoon,
}) {
  const [status, setStatus] = useState("all");
  const [categoryKey, setCategoryKey] = useState("all");

  const isToday = selectedKey === todayKey;
  const stats = selectTaskStats(tasks, todayKey);
  const deltas = TASKS_PREVIEW?.deltas;
  const titleStats = [
    { value: stats.pending, delta: "hoy", label: "Por hacer" },
    { value: stats.doneToday, delta: deltas?.done ?? null, deltaTone: "positive", label: "Completadas" },
    { value: stats.week, delta: deltas?.week ?? null, deltaTone: "positive", label: "Esta semana" },
    { value: stats.overdue, delta: deltas?.overdue ?? null, deltaTone: "negative", label: "Vencidas" },
  ];

  const timeline = selectTimedTasks(tasks, selectedKey, isToday ? now.hours : null).map((entry) => ({
    key: `task-${entry.task.id}`,
    kind: "task",
    title: entry.task.title,
    start: entry.range.start,
    end: entry.range.end,
    lane: entry.lane,
    done: entry.done,
    hot: entry.hot,
    color: entry.task.category?.color,
    disabled: isPending(entry.task.id),
    onToggle: () => onToggle(entry.task),
    ariaLabel: `${entry.done ? "Marcar pendiente" : "Completar"}: ${entry.task.title}, ${formatClockWithPeriod(entry.range.start)}`,
  }));

  const untimed = selectUntimedTasks(tasks, selectedKey);
  const baseList = selectListTasks(tasks, view, selectedKey, todayKey);
  const rows = filterTasks(baseList, status, categoryKey);
  const week = selectWeekCompleted(tasks, todayKey);
  const byCategory = selectByCategory(baseList);

  const categoryChips = [
    { key: "all", label: "Todas las categorías", dot: "var(--text)" },
    ...categories.map((category) => ({ key: String(category.id), label: category.name, dot: category.color })),
  ];
  // Categorías desactivadas o tareas sin categoría que aparecen en la lista también se pueden filtrar.
  baseList.forEach((task) => {
    const key = getTaskCategoryKey(task);
    if (categoryChips.some((chip) => chip.key === key)) return;
    categoryChips.push(key === NO_CATEGORY_KEY
      ? { key, label: "Sin categoría", dot: "var(--lav-grey)" }
      : { key, label: task.category.name, dot: task.category.color });
  });

  return (
    <>
      <ShellTitle>
        <PageTitle
          breadcrumb={[{ label: "Inicio", to: "/dashboard" }, { label: "Tareas" }]}
          title="Mis tareas"
          stats={titleStats}
          actions={
            <>
              <IconButton icon="search" label="Buscar" onClick={() => comingSoon("Búsqueda")} />
              <PillButton icon="calendar" trailingIcon="chevronDown" onClick={onPickDate} aria-label={`Día: ${formatDayPill(selectedKey)}. Cambiar día`}>
                {formatDayPill(selectedKey)}
              </PillButton>
              <PillButton variant="primary" icon="plus" onClick={onCreate}>Nueva tarea</PillButton>
            </>
          }
        />
      </ShellTitle>

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus tareas…</p>
      ) : (
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <Card aria-labelledby="h-hor" className={styles.card}>
              <CardHeader
                titleId="h-hor"
                className={styles.cardHeader}
                title={isToday ? "Tu horario de hoy" : `Tu horario · ${formatAgendaDay(selectedKey)}`}
                meta="Toca una tarea para completarla"
              />
              <HorizontalTimeline
                variant="tasks"
                items={timeline}
                now={isToday ? now.hours : null}
                emptyText="No hay tareas con hora este día."
              />
            </Card>

            <Card aria-labelledby="h-lista" className={styles.card}>
              <div className={styles.listHeader}>
                <h2 id="h-lista" className={styles.h2}>{LIST_TITLES[view]}</h2>
                <div className={styles.tabs} role="group" aria-label="Estado">
                  {STATUS_TABS.map((tab) => (
                    <Chip key={tab.value} selected={status === tab.value} onClick={() => setStatus(tab.value)}>
                      {tab.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className={styles.chips} role="group" aria-label="Categoría">
                {categoryChips.map((chip) => (
                  <Chip
                    key={chip.key}
                    variant="category"
                    className={styles.categoryChip}
                    dotColor={chip.dot}
                    selected={categoryKey === chip.key}
                    onClick={() => setCategoryKey(chip.key)}
                  >
                    {chip.label}
                  </Chip>
                ))}
              </div>
              <div className={styles.table}>
                <TaskTableHeader />
                {rows.map((task) => {
                  const done = isTaskDone(task);
                  return (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      done={done}
                      category={task.category}
                      priority={TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.media}
                      when={formatTaskWhen(task, todayKey)}
                      disabled={isPending(task.id)}
                      onToggle={() => onToggle(task)}
                      onOpen={() => onOpen(task)}
                    />
                  );
                })}
                {rows.length === 0 && <p className={styles.noRows}>No hay tareas con estos filtros.</p>}
              </div>
            </Card>
          </div>

          <div className={styles.sideColumn}>
            <Card aria-labelledby="h-sem" className={`${styles.card} ${styles.weekCard}`}>
              <h2 id="h-sem" className={styles.h2}>Esta semana</h2>
              <span className={styles.meta}>Completadas por día · según la fecha de cada tarea</span>
              <span className={styles.weekTotal}>
                {week.total}
                <span className={styles.weekUnit}> {week.total === 1 ? "tarea" : "tareas"}</span>
              </span>
              <WeekBars
                days={week.days}
                ariaLabel={`Completadas esta semana: ${week.days.map((day) => `${day.label} ${day.count}`).join(", ")}`}
              />
            </Card>

            <Card aria-labelledby="h-sinhora" className={styles.card}>
              <CardHeader titleId="h-sinhora" className={styles.cardHeader} title="Sin hora" meta="Cuando puedas" />
              <div className={styles.pills}>
                {untimed.map((task) => (
                  <TaskPill
                    key={task.id}
                    title={task.title}
                    done={isTaskDone(task)}
                    disabled={isPending(task.id)}
                    onToggle={() => onToggle(task)}
                  />
                ))}
                {untimed.length === 0 && <p className={styles.empty}>No hay tareas sin hora este día.</p>}
              </div>
            </Card>

            <Card aria-labelledby="h-cat" className={styles.card}>
              <h2 id="h-cat" className={styles.h2}>Por categoría</h2>
              {byCategory.map((group) => (
                <div key={group.key} className={styles.catRow}>
                  <span className={styles.catLabel}>{group.label}</span>
                  <span className={styles.catTrack}>
                    <span className={styles.catBar} style={{ width: `${group.pct}%`, "--cat-color": group.color }} />
                  </span>
                  <span className={styles.catCount}>{group.count}</span>
                </div>
              ))}
              {byCategory.length === 0 && <p className={styles.empty}>Sin tareas en esta vista.</p>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export default TasksWeb;
