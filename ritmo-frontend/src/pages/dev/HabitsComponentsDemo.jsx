import { useState } from "react";
import Card, { CardHeader } from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import HabitCard from "../../ui/domain/HabitCard";
import HabitRow from "../../ui/domain/HabitRow";
import HabitProgressSheet from "../../ui/domain/HabitProgressSheet";
import NextReminderCard from "../../ui/domain/NextReminderCard";
import ProgressRing from "../../ui/charts/ProgressRing";
import HeatMap from "../../ui/charts/HeatMap";
import ReminderLine from "../../ui/charts/ReminderLine";
import WeekRings from "../../ui/charts/WeekRings";
import HabitDetailSheet from "../habits/HabitDetailSheet";
import HabitFormModal from "../habits/HabitFormModal";
import { DAY_LETTERS as LETTERS, getHabitTint, getTodayMessage, selectHabitProgress } from "../../hooks/data/habitSelectors";
import categoryColors from "../../constants/categoryColors";
import styles from "./UiPlayground.module.css";

// Componentes de Hábitos (fase 5 y Hábitos v2 · B) con los datos de ejemplo de HabitosWeb.dc.html y
// Habitos.dc.html. Solo existen en /dev/ui; la pantalla real usa GET /habits.
// Los ejemplos tienen la forma de la API (goalType, goal, unit, todayAmount) para pasar por
// selectHabitProgress, igual que la pantalla: "vasos" (atajo, "+ 1 vaso"), "tazas" (texto libre,
// "+ 1" y "3/8 tazas") y tiempo ("15/30 min").

const HABITS = [
  { id: "water", name: "Tomar agua", frequency: "Todos los días", icon: "target", color: categoryColors[5], goalType: "count", goal: 8, unit: "vasos", streak: 5, week: [1, 1, 1, 0.5, 1, 0.75] },
  { id: "read", name: "Leer 20 minutos", frequency: "Todos los días", icon: "book-open", color: categoryColors[0], goalType: "check", goal: null, unit: null, streak: 12, week: [1, 1, 1, 1, 1, 1] },
  { id: "walk", name: "Caminar", frequency: "Lunes a viernes", icon: "heart-pulse", color: categoryColors[2], goalType: "duration", goal: 30, unit: null, streak: 3, week: [1, 0, 1, 1, 1, null] },
  { id: "tea", name: "Té verde", frequency: "Todos los días", icon: "heart", color: categoryColors[7], goalType: "count", goal: 8, unit: "tazas", streak: 2, week: [0, 1, 0, 1, 1, 1] },
];

const OFF_DAY = { id: "gym", name: "Gimnasio", frequency: "L, X, V", icon: "heart-pulse", color: categoryColors[2], goalType: "check", goal: null, unit: null, appliesToday: false };

const HEAT = [3, 4, 2, 4, 3, 1, 2, 4, 4, 3, 4, 2, 3, 3, 2, 3, 4, 4, 4, 3, 1, 4, 3, 2, 4, 4, 3, 3, 4, 3, 4, 2, 4, 3];
const NOW = 10 + 40 / 60;
const pos = (hours) => 4 + ((hours - 7) / 12) * 92;

const SAMPLE_HABIT = {
  id: 99,
  name: "Tomar agua",
  frequency: "Lunes a viernes",
  days: [1, 2, 3, 4, 5],
  goalType: "count",
  goal: 8,
  unit: "vasos",
  todayAmount: 4,
  todayTarget: 8,
  appliesToday: true,
  reminderTime: "21:00:00",
  status: "pendiente",
  categoryId: 2,
  category: { id: 2, name: "Bienestar", description: "Cuidarme cada día", color: categoryColors[0], icon: "book-open" },
};

function habitLike(habit) {
  return { category: { color: habit.color } };
}

function HabitsComponentsDemo() {
  const [state, setState] = useState({ water: 4, read: 1, walk: 15, tea: 3 });
  const [sheet, setSheet] = useState(null);
  const [adjusting, setAdjusting] = useState(null);

  const asApi = (habit) => ({ ...habit, todayAmount: state[habit.id], todayTarget: habit.goal ?? 1 });
  const progressOf = (habit) => selectHabitProgress(asApi(habit));
  const isDone = (habit) => state[habit.id] >= (habit.goal ?? 1);
  const todayDone = HABITS.filter(isDone).length;
  const set = (habit, value) => setState((current) => ({ ...current, [habit.id]: value }));

  const reminders = [7, 10, 13, 16, 19].map((hours, index) => ({
    key: String(hours),
    left: pos(hours),
    label: `${((hours + 11) % 12) + 1} ${hours < 12 ? "a. m." : "p. m."}`,
    state: hours <= NOW ? (index < state.water / 2 ? "done" : "missed") : "upcoming",
    ariaLabel: String(hours),
  }));

  const heat = [...HEAT.map((level, index) => ({ key: `h${index}`, level })), { key: "today", level: todayDone, today: true }];
  const heatEmpty = [
    ...HEAT.slice(0, 31).map((_, index) => ({ key: `e${index}`, level: null })),
    { key: "today", level: 2, today: true },
    ...[0, 1, 2].map((index) => ({ key: `f${index}`, future: true })),
  ];

  const mobileWeek = ["D", "L", "M", "M", "J", "V", "S"].map((letter, index) => {
    const today = index === 3;
    const value = today ? todayDone / 4 : [1, 0.75, 0.5][index] ?? 0;
    return { key: `w${index}`, letter, number: 25 + index, today, value, ariaLabel: `${letter} ${25 + index}, ${Math.round(value * 100)}% cumplido` };
  });

  const adjustingProgress = adjusting ? progressOf(adjusting) : null;

  return (
    <section className={styles.section} aria-labelledby="sec-habits">
      <h2 id="sec-habits" className={styles.h2}>Hábitos (fase 5 y Hábitos v2)</h2>

      <h3 className={styles.h3}>HabitCard · cantidad con atajo, solo marcar, tiempo, cantidad con texto libre y "No toca hoy" (los botones funcionan)</h3>
      <div className={styles.grid}>
        {HABITS.map((habit) => {
          const done = isDone(habit);
          const progress = progressOf(habit);
          const week = [...habit.week, done ? 1 : progress ? Math.min(1, progress.count / progress.goal) : 0].map((value, index) => ({
            key: LETTERS[index] + index,
            label: LETTERS[index],
            value,
            today: index === 6,
          }));
          const goalText = progress ? ` · ${habit.goal} ${progress.unitLabel ?? ""}`.trimEnd() : "";
          return (
            <HabitCard
              key={habit.id}
              name={habit.name}
              frequency={`${habit.frequency}${goalText}`}
              icon={habit.icon}
              tint={getHabitTint(habitLike(habit), "web")}
              done={done}
              progress={progress}
              streak={`${habit.streak + (done ? 1 : 0)} días`}
              week={week}
              weekLabel="Semana de ejemplo"
              onToggle={() => set(habit, done ? 0 : habit.goal ?? 1)}
              onIncrement={() => set(habit, state[habit.id] + 1)}
              onAdjust={() => setAdjusting(habit)}
              onOpen={() => setSheet("detail")}
            />
          );
        })}
        <HabitCard
          name={OFF_DAY.name}
          frequency={OFF_DAY.frequency}
          icon={OFF_DAY.icon}
          tint={getHabitTint(habitLike(OFF_DAY), "web")}
          offDay
          week={LETTERS.map((label, index) => ({ key: label + index, label, value: [0, 2, 4].includes(index) ? undefined : null, today: index === 6 }))}
          weekNoData
          weekLabel="Sin datos"
          onToggle={() => {}}
          onOpen={() => setSheet("detail")}
        />
      </div>

      <div className={styles.grid}>
        <Card variant="ritmo" style={{ alignItems: "center" }}>
          <h3 className={styles.h3} style={{ alignSelf: "flex-start" }}>ProgressRing · Hoy</h3>
          <ProgressRing done={todayDone} total={4} ariaLabel={`${todayDone} de 4 hábitos cumplidos hoy`} />
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-orb)" }}>{getTodayMessage({ done: todayDone, total: 4 })}</p>
        </Card>
        <Card>
          <CardHeader title="Constancia" meta="Últimas 5 semanas" />
          <HeatMap letters={LETTERS} cells={heat} ariaLabel="Mapa de ejemplo" />
        </Card>
        <Card>
          <CardHeader title="Constancia · sin datos" meta="Hoy jueves" />
          <HeatMap letters={LETTERS} cells={heatEmpty} ariaLabel="Mapa sin datos" noData />
        </Card>
      </div>

      <Card>
        <CardHeader title="ReminderLine · Recordatorios de hoy" meta="Tomar agua cada 3 horas" />
        <ReminderLine points={reminders} progress={pos(NOW) - 4} ariaLabel="Recordatorios de ejemplo" />
        <ReminderLine points={[]} progress={pos(NOW) - 4} ariaLabel="Sin recordatorios" emptyText="Agrega una hora de recordatorio a un hábito para verla aquí." />
      </Card>

      <div className={styles.grid}>
        <NextReminderCard variant="web" titleId="demo-next-web" title="Tomar agua · 1:00 p. m." onEdit={() => setSheet("form")} editLabel="Editar recordatorio" />
        <NextReminderCard variant="web" titleId="demo-next-none" title="Sin recordatorios" editLabel="Editar recordatorio (no hay recordatorios)" />
      </div>

      <div className={styles.grid}>
        <div style={{ maxWidth: 350, display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 className={styles.h3}>WeekRings, HabitRow (tres tipos y "No toca hoy") y NextReminderCard móvil</h3>
          <WeekRings days={mobileWeek} />
          <WeekRings days={mobileWeek.map((day) => ({ ...day, value: day.today ? day.value : null }))} noData />
          {HABITS.map((habit) => {
            const done = isDone(habit);
            const progress = progressOf(habit);
            const like = habitLike(habit);
            return (
              <HabitRow
                key={habit.id}
                name={habit.name}
                meta={habit.frequency}
                icon={habit.icon}
                tint={getHabitTint(like, "mobile", progress ? 28 : undefined)}
                fillTint={progress ? getHabitTint(like, "mobile", 90) : undefined}
                done={done}
                progress={progress}
                onToggle={() => set(habit, done ? 0 : habit.goal ?? 1)}
                onIncrement={() => set(habit, state[habit.id] + 1)}
                onAdjust={() => setAdjusting(habit)}
                onOpen={() => setSheet("detail")}
              />
            );
          })}
          <HabitRow
            name={OFF_DAY.name}
            meta={OFF_DAY.frequency}
            icon={OFF_DAY.icon}
            tint={getHabitTint(habitLike(OFF_DAY), "mobile")}
            offDay
            onToggle={() => {}}
            onOpen={() => setSheet("detail")}
          />
          <NextReminderCard variant="mobile" titleId="demo-next-mob" title="Tomar agua · 1:00 p. m." onEdit={() => setSheet("form")} editLabel="Editar recordatorio" />
        </div>
        <Card>
          <h3 className={styles.h3}>Hojas</h3>
          <div className={styles.row}>
            <PillButton onClick={() => setSheet("detail")}>HabitDetailSheet (DetailSheet)</PillButton>
            <PillButton variant="primary" icon="plus" onClick={() => setSheet("form")}>HabitFormModal · nuevo</PillButton>
            <PillButton onClick={() => setSheet("edit")}>HabitFormModal · editar cantidad</PillButton>
            <PillButton onClick={() => setAdjusting(HABITS[0])}>HabitProgressSheet · cantidad</PillButton>
            <PillButton onClick={() => setAdjusting(HABITS[2])}>HabitProgressSheet · tiempo</PillButton>
          </div>
        </Card>
      </div>

      {sheet === "detail" && (
        <HabitDetailSheet
          habit={SAMPLE_HABIT}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet("edit")}
          onDuplicate={async () => true}
          onDelete={async () => true}
          onToggle={async () => true}
          onAdjust={() => setAdjusting(HABITS[0])}
        />
      )}
      {(sheet === "form" || sheet === "edit") && (
        <HabitFormModal
          habit={sheet === "edit" ? SAMPLE_HABIT : null}
          categories={[
            { ...SAMPLE_HABIT.category, isRecurring: true },
            { id: 3, name: "Salud", color: categoryColors[2], icon: "heart", isRecurring: false },
          ]}
          onClose={() => setSheet(null)}
          onSubmit={async () => {}}
          onCategoriesChanged={async () => {}}
        />
      )}
      {adjusting && adjustingProgress && (
        <HabitProgressSheet
          key={adjusting.id}
          name={adjusting.name}
          type={adjustingProgress.type}
          count={adjustingProgress.count}
          goal={adjustingProgress.goal}
          unitLabel={adjustingProgress.unitLabel}
          onSave={async (amount) => {
            set(adjusting, amount);
            return true;
          }}
          onUndo={async () => {
            set(adjusting, 0);
            return true;
          }}
          onClose={() => setAdjusting(null)}
        />
      )}
    </section>
  );
}

export default HabitsComponentsDemo;
