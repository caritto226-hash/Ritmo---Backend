import { CirclePill, MobilePageTitle } from "../../ui/shell/MobileShell";
import PillButton from "../../ui/primitives/PillButton";
import WeekRings from "../../ui/charts/WeekRings";
import HabitRow from "../../ui/domain/HabitRow";
import NextReminderCard from "../../ui/domain/NextReminderCard";
import { getHabitTint, isHabitDone, selectNextReminder, selectTodaySummary } from "../../hooks/data/habitSelectors";
import { selectWeekDays } from "../../hooks/data/taskSelectors";
import { parseDateKey, WEEKDAYS_SHORT } from "../../utils/dates";
import { HABITS_PREVIEW } from "./habitsPreview";
import styles from "./HabitsMobile.module.css";

const LETTERS = ["D", "L", "M", "M", "J", "V", "S"];
const HABIT_ICON_FALLBACK = "heart-pulse";

// Hábitos móvil (Habitos.dc.html). La barra superior (menú, + Nuevo hábito, campana) la pone MainLayout.
function HabitsMobile({ habits, loading, error, now, counterOf, onToggle, onIncrement, isPending, onOpen, onEdit, onCreate, onStats }) {
  const P = HABITS_PREVIEW;
  const todayKey = now.dateKey;
  const summary = selectTodaySummary(habits);
  const next = selectNextReminder(habits, now.hours);

  // Hoy sale de status; los días anteriores no existen en la API (BACKEND_PENDIENTE #1).
  const week = selectWeekDays(todayKey).map((key, index) => {
    const { day, weekday } = parseDateKey(key);
    const today = key === todayKey;
    let value = 0;
    if (today) value = summary.total ? summary.done / summary.total : 0;
    else if (key < todayKey) value = P ? P.mobileWeek[index] ?? 0 : null;
    const name = `${WEEKDAYS_SHORT[weekday]} ${day}${today ? ", hoy" : ""}`;
    return {
      key,
      letter: LETTERS[weekday],
      number: day,
      today,
      value,
      ariaLabel: value === null ? `${name}, sin datos todavía` : key > todayKey ? name : `${name}, ${Math.round(value * 100)}% cumplido`,
    };
  });

  return (
    <>
      <MobilePageTitle
        title="Mis hábitos"
        subtitle={`${summary.done} de ${summary.total} cumplidos hoy`}
        action={<CirclePill icon="barChart" onClick={onStats}>Progreso</CirclePill>}
      />

      <WeekRings days={week} noData={!P} />

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus hábitos…</p>
      ) : (
        <>
          <div className={styles.rows}>
            {habits.map((habit) => {
              const counter = counterOf(habit);
              return (
                <HabitRow
                  key={habit.id}
                  name={habit.name}
                  meta={habit.frequency}
                  icon={habit.category?.icon || HABIT_ICON_FALLBACK}
                  tint={getHabitTint(habit, "mobile", counter ? 28 : undefined)}
                  fillTint={counter ? getHabitTint(habit, "mobile", 90) : undefined}
                  done={isHabitDone(habit)}
                  counter={counter}
                  disabled={isPending(habit.id)}
                  onToggle={() => onToggle(habit)}
                  onIncrement={onIncrement && counter ? () => onIncrement(habit) : undefined}
                  onOpen={() => onOpen(habit)}
                />
              );
            })}
            {habits.length === 0 && (
              <div className={styles.empty}>
                <p className={styles.emptyText}>Aún no tienes hábitos. Registra el primero y márcalo cada día.</p>
                <PillButton variant="primary" size="md" icon="plus" onClick={onCreate}>Nuevo hábito</PillButton>
              </div>
            )}
          </div>

          <NextReminderCard
            variant="mobile"
            titleId="m-next"
            title={next ? next.label : "Sin recordatorios"}
            onEdit={next ? () => onEdit(next.habit) : undefined}
            editLabel={next ? `Editar recordatorio de ${next.habit.name}` : "Editar recordatorio (no hay recordatorios)"}
          />
        </>
      )}
    </>
  );
}

export default HabitsMobile;
