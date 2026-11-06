import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import Card, { CardHeader } from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import HabitCard from "../../ui/domain/HabitCard";
import NextReminderCard from "../../ui/domain/NextReminderCard";
import ProgressRing from "../../ui/charts/ProgressRing";
import HeatMap from "../../ui/charts/HeatMap";
import ReminderLine from "../../ui/charts/ReminderLine";
import {
  getHabitTint,
  getHeatLevel,
  getTodayMessage,
  isHabitDone,
  selectHabitWeekKeys,
  selectHeatKeys,
  selectNextReminder,
  selectReminderLine,
  selectTodaySummary,
} from "../../hooks/data/habitSelectors";
import { formatHourLabel } from "../../utils/dates";
import { HABITS_PREVIEW } from "./habitsPreview";
import styles from "./HabitsWeb.module.css";

const LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
const HABIT_ICON_FALLBACK = "heart-pulse";

// Semana de la tarjeta: hoy sale de status; los días anteriores no existen en la API (#1).
function selectCardWeek(weekKeys, todayKey, { done, counter, previewWeek }) {
  return weekKeys.map((key, index) => {
    let value;
    if (key < todayKey) value = previewWeek ? previewWeek[index] : undefined;
    else if (key === todayKey) {
      if (done) value = 1;
      else if (counter) value = counter.count === null ? undefined : counter.count / counter.goal;
      else value = 0;
    }
    return { key, label: LETTERS[index], value, today: key === todayKey };
  });
}

// "Recordatorios cada 3 horas" del mockup (vista previa): ya tomados según el conteo de agua.
function previewReminderLine(nowHours, count) {
  const pos = (hours) => 4 + ((hours - 7) / 12) * 92;
  return {
    progress: Math.min(92, Math.max(0, pos(nowHours) - 4)),
    points: HABITS_PREVIEW.reminders.times.map((hours, index) => {
      const past = hours <= nowHours;
      return {
        key: String(hours),
        left: pos(hours),
        label: formatHourLabel(hours),
        state: past ? (index < count / 2 ? "done" : "missed") : "upcoming",
        ariaLabel: formatHourLabel(hours),
      };
    }),
  };
}

// Hábitos web (HabitosWeb.dc.html).
function HabitsWeb({ habits, loading, error, now, counterOf, onToggle, onIncrement, isPending, onOpen, onEdit, onCreate, onStats }) {
  const P = HABITS_PREVIEW;
  const todayKey = now.dateKey;
  const summary = selectTodaySummary(habits);
  const weekKeys = selectHabitWeekKeys(todayKey);
  const next = selectNextReminder(habits, now.hours);

  const titleStats = [
    { value: P?.stats.streak ?? null, delta: P?.stats.streakDelta ?? null, deltaTone: "positive", label: "Días de racha" },
    { value: `${summary.done}/${summary.total}`, delta: "hoy", label: "Cumplidos" },
    { value: P?.stats.week ?? null, delta: P?.stats.weekDelta ?? null, deltaTone: "positive", label: "Esta semana" },
    { value: P?.stats.best ?? null, delta: P?.stats.bestDelta ?? null, label: "Mejor racha" },
  ];

  const firstCounter = habits.map(counterOf).find(Boolean);
  const line = P ? previewReminderLine(now.hours, firstCounter?.count ?? P.count) : selectReminderLine(habits, now.hours);
  const reminderCount = line.points.length;
  const reminderMeta = P
    ? P.reminders.meta
    : reminderCount === 0
      ? "Sin recordatorios"
      : `${reminderCount} ${reminderCount === 1 ? "hora" : "horas"} con recordatorio`;

  const heatKeys = selectHeatKeys(todayKey);
  const pastCount = heatKeys.filter((key) => key < todayKey).length;
  const heatCells = heatKeys.map((key, index) => {
    if (key < todayKey) return { key, level: P ? P.heat[P.heat.length - pastCount + index] ?? 0 : null };
    if (key === todayKey) return { key, level: getHeatLevel(summary), today: true };
    return { key, future: true };
  });

  return (
    <>
      <ShellTitle>
        <PageTitle
          breadcrumb={[{ label: "Inicio", to: "/dashboard" }, { label: "Hábitos" }]}
          title="Mis hábitos"
          stats={titleStats}
          actions={
            <>
              <PillButton icon="barChart" onClick={onStats}>Estadísticas</PillButton>
              <PillButton variant="primary" icon="plus" onClick={onCreate}>Nuevo hábito</PillButton>
            </>
          }
        />
      </ShellTitle>

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus hábitos…</p>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.cards}>
              {habits.map((habit, index) => {
                const done = isHabitDone(habit);
                const counter = counterOf(habit);
                const week = selectCardWeek(weekKeys, todayKey, { done, counter, previewWeek: P?.weeks[index % P.weeks.length] });
                const doneDays = week.filter((day) => day.value >= 1).length;
                return (
                  <HabitCard
                    key={habit.id}
                    name={habit.name}
                    frequency={habit.frequency}
                    icon={habit.category?.icon || HABIT_ICON_FALLBACK}
                    tint={getHabitTint(habit, "web")}
                    done={done}
                    counter={counter}
                    streak={P ? `${P.streaks[index % P.streaks.length] + (done ? 1 : 0)} días` : null}
                    week={week}
                    weekNoData={!P}
                    weekLabel={P
                      ? `Esta semana: ${doneDays} de 7 días cumplidos`
                      : `Esta semana: hoy ${done ? "cumplido" : "pendiente"}; los días anteriores, próximamente`}
                    disabled={isPending(habit.id)}
                    onToggle={() => onToggle(habit)}
                    onIncrement={onIncrement && counter ? () => onIncrement(habit) : undefined}
                    onOpen={() => onOpen(habit)}
                  />
                );
              })}
              {habits.length === 0 && (
                <Card className={styles.emptyCard}>
                  <h2 className={styles.emptyTitle}>Aún no tienes hábitos</h2>
                  <p className={styles.empty}>Registra el primero y márcalo cada día.</p>
                  <PillButton variant="primary" icon="plus" onClick={onCreate}>Nuevo hábito</PillButton>
                </Card>
              )}
            </div>

            <Card aria-labelledby="h-rec">
              <CardHeader titleId="h-rec" title="Recordatorios de hoy" meta={reminderMeta} className={styles.cardHeader} />
              <ReminderLine
                points={line.points}
                progress={line.progress}
                ariaLabel={reminderCount === 0
                  ? "Sin recordatorios hoy"
                  : `Recordatorios de hoy: ${line.points.map((point) => point.ariaLabel).join("; ")}`}
                emptyText="Agrega una hora de recordatorio a un hábito para verla aquí."
              />
            </Card>
          </div>

          <div className={styles.side}>
            <Card variant="ritmo" aria-labelledby="h-hoy" className={styles.today}>
              <div aria-hidden="true" className={styles.blobLime} />
              <div aria-hidden="true" className={styles.blobTeal} />
              <h2 id="h-hoy" className={styles.todayTitle}>Hoy</h2>
              <ProgressRing
                done={summary.done}
                total={summary.total}
                ariaLabel={`${summary.done} de ${summary.total} hábitos cumplidos hoy`}
              />
              <p className={styles.todayMsg}>{getTodayMessage(summary)}</p>
            </Card>

            <Card aria-labelledby="h-const" className={styles.const}>
              <CardHeader titleId="h-const" title="Constancia" meta="Últimas 5 semanas" className={styles.cardHeader} />
              <HeatMap
                letters={LETTERS}
                cells={heatCells}
                noData={!P}
                ariaLabel={P
                  ? "Mapa de constancia: la mayoría de días con 3 o 4 hábitos cumplidos"
                  : `Mapa de constancia: hoy ${summary.done} de ${summary.total} hábitos cumplidos; los días anteriores, próximamente`}
              />
            </Card>

            <NextReminderCard
              variant="web"
              titleId="h-next"
              title={next ? next.label : "Sin recordatorios"}
              onEdit={next ? () => onEdit(next.habit) : undefined}
              editLabel={next ? `Editar recordatorio de ${next.habit.name}` : "Editar recordatorio (no hay recordatorios)"}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default HabitsWeb;
