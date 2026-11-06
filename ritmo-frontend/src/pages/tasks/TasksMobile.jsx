import { CirclePill, MobilePageTitle } from "../../ui/shell/MobileShell";
import WeekStrip from "../../ui/charts/WeekStrip";
import VerticalTimeline from "../../ui/charts/VerticalTimeline";
import TaskPill from "../../ui/domain/TaskPill";
import { isTaskDone, selectDayTasks } from "../../hooks/data/todaySelectors";
import {
  isTaskOverdue,
  selectTaskDates,
  selectTimedTasks,
  selectUntimedTasks,
  selectWeekDays,
} from "../../hooks/data/taskSelectors";
import { formatLongDate } from "../../utils/dates";
import styles from "./TasksMobile.module.css";

// Tareas móvil (Tareas.dc.html). La barra superior (menú, + Nueva tarea, campana) la pone MainLayout.
function TasksMobile({
  tasks,
  loading,
  error,
  todayKey,
  selectedKey,
  now,
  onSelectDay,
  onPickDate,
  onToggle,
  isPending,
  onOpen,
}) {
  const isToday = selectedKey === todayKey;
  const dayTasks = selectDayTasks(tasks, selectedKey);
  const doneCount = dayTasks.filter(isTaskDone).length;
  const pct = dayTasks.length === 0 ? 0 : Math.round((doneCount / dayTasks.length) * 100);
  // Caso no dibujado en el mockup: las vencidas de días anteriores se muestran hoy, en rojo.
  const overdue = isToday ? tasks.filter((task) => isTaskOverdue(task, todayKey)) : [];
  const untimed = selectUntimedTasks(tasks, selectedKey);

  const timeline = selectTimedTasks(tasks, selectedKey).map((entry) => ({
    key: entry.task.id,
    title: entry.task.title,
    meta: entry.task.category?.name || "Sin categoría",
    start: entry.range.start,
    end: entry.range.end,
    done: entry.done,
    color: entry.task.category?.color,
    disabled: isPending(entry.task.id),
    onToggle: () => onToggle(entry.task),
    onOpen: () => onOpen(entry.task),
    toggleLabel: `${entry.done ? "Marcar pendiente" : "Marcar completada"}: ${entry.task.title}`,
    openLabel: `Ver detalles de ${entry.task.title}`,
  }));

  const pill = (task, tone) => (
    <TaskPill
      key={task.id}
      variant="mobile"
      tone={tone}
      title={task.title}
      done={isTaskDone(task)}
      color={task.category?.color}
      disabled={isPending(task.id)}
      onToggle={() => onToggle(task)}
      onOpen={() => onOpen(task)}
    />
  );

  return (
    <>
      <MobilePageTitle
        title="Mis tareas"
        subtitle={formatLongDate(selectedKey)}
        action={<CirclePill icon="calendar" onClick={onPickDate}>Calendario</CirclePill>}
      />

      <WeekStrip
        days={selectWeekDays(selectedKey)}
        selectedKey={selectedKey}
        todayKey={todayKey}
        markedDates={selectTaskDates(tasks)}
        onSelect={onSelectDay}
      />

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus tareas…</p>
      ) : (
        <>
          <div className={styles.progress}>
            <div className={styles.progressText}>
              <span>{doneCount} de {dayTasks.length} completadas</span>
              <span className={styles.pct}>{pct}%</span>
            </div>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="Tareas completadas del día"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {overdue.length > 0 && (
            <section className={styles.group} aria-labelledby="m-vencidas">
              <h2 id="m-vencidas" className={`${styles.groupTitle} ${styles.overdueTitle}`}>Vencidas</h2>
              <div className={styles.pills}>{overdue.map((task) => pill(task, "overdue"))}</div>
            </section>
          )}

          <section className={styles.group} aria-labelledby="m-sinhora">
            <h2 id="m-sinhora" className={styles.groupTitle}>Sin hora</h2>
            <div className={styles.pills}>
              {untimed.map((task) => pill(task))}
              {untimed.length === 0 && <p className={styles.empty}>No hay tareas sin hora este día.</p>}
            </div>
          </section>

          <VerticalTimeline
            items={timeline}
            now={isToday ? now.hours : null}
            emptyText="No hay tareas con hora este día."
          />
        </>
      )}
    </>
  );
}

export default TasksMobile;
