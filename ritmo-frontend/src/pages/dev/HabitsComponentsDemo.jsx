import { useState } from "react";
import Card, { CardHeader } from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import HabitCard from "../../ui/domain/HabitCard";
import HabitRow from "../../ui/domain/HabitRow";
import NextReminderCard from "../../ui/domain/NextReminderCard";
import ProgressRing from "../../ui/charts/ProgressRing";
import HeatMap from "../../ui/charts/HeatMap";
import ReminderLine from "../../ui/charts/ReminderLine";
import WeekRings from "../../ui/charts/WeekRings";
import HabitDetailSheet from "../habits/HabitDetailSheet";
import HabitFormModal from "../habits/HabitFormModal";
import { getHabitTint, getTodayMessage } from "../../hooks/data/habitSelectors";
import categoryColors from "../../constants/categoryColors";
import styles from "./UiPlayground.module.css";

// Componentes de la fase 5 (Hábitos) con los datos de ejemplo de HabitosWeb.dc.html y
// Habitos.dc.html. Solo existen en /dev/ui; la pantalla real usa GET /habits.

const LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

const HABITS = [
  { id: "water", name: "Tomar agua", freq: "Diario · 8 vasos", icon: "target", color: categoryColors[5], goal: 8, streak: 5, week: [1, 1, 1, 0.5, 1, 0.75] },
  { id: "read", name: "Leer 20 minutos", freq: "Diario", icon: "book-open", color: categoryColors[0], goal: 1, streak: 12, week: [1, 1, 1, 1, 1, 1] },
  { id: "walk", name: "Caminar 30 minutos", freq: "Lunes a viernes", icon: "heart-pulse", color: categoryColors[2], goal: 1, streak: 3, week: [1, 0, 1, 1, 1, null] },
  { id: "sleep", name: "Dormir antes de las 11 p. m.", freq: "Diario", icon: "heart", color: categoryColors[7], goal: 1, streak: 2, week: [0, 1, 0, 1, 1, 1] },
];

const HEAT = [3, 4, 2, 4, 3, 1, 2, 4, 4, 3, 4, 2, 3, 3, 2, 3, 4, 4, 4, 3, 1, 4, 3, 2, 4, 4, 3, 3, 4, 3, 4, 2, 4, 3];
const NOW = 10 + 40 / 60;
const pos = (hours) => 4 + ((hours - 7) / 12) * 92;

const SAMPLE_HABIT = {
  id: 99,
  name: "Leer 20 minutos",
  frequency: "Diario",
  goal: null,
  reminderTime: "21:00:00",
  status: "pendiente",
  categoryId: 2,
  category: { id: 2, name: "Bienestar", description: "Cuidarme cada día", color: categoryColors[0], icon: "book-open" },
};

function habitLike(habit) {
  return { category: { color: habit.color } };
}

function HabitsComponentsDemo() {
  const [state, setState] = useState({ water: 4, read: 1, walk: 0, sleep: 0 });
  const [sheet, setSheet] = useState(null);
  const isDone = (habit) => state[habit.id] >= habit.goal;
  const todayDone = HABITS.filter(isDone).length;

  function act(habit) {
    const value = state[habit.id];
    const counter = habit.goal > 1;
    setState((current) => ({ ...current, [habit.id]: counter ? (isDone(habit) ? 0 : value + 1) : (isDone(habit) ? 0 : 1) }));
  }

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

  return (
    <section className={styles.section} aria-labelledby="sec-habits">
      <h2 id="sec-habits" className={styles.h2}>Hábitos (fase 5)</h2>

      <h3 className={styles.h3}>HabitCard · conteo, binario y completado (los botones funcionan)</h3>
      <div className={styles.grid}>
        {HABITS.map((habit) => {
          const done = isDone(habit);
          const counter = habit.goal > 1 ? { count: state[habit.id], goal: habit.goal, unit: { one: "vaso", many: "vasos" } } : null;
          const week = [...habit.week, done ? 1 : counter ? state.water / habit.goal : 0].map((value, index) => ({
            key: LETTERS[index] + index,
            label: LETTERS[index],
            value,
            today: index === 6,
          }));
          return (
            <HabitCard
              key={habit.id}
              name={habit.name}
              frequency={habit.freq}
              icon={habit.icon}
              tint={getHabitTint(habitLike(habit), "web")}
              done={done}
              counter={counter}
              streak={`${habit.streak + (done ? 1 : 0)} días`}
              week={week}
              weekLabel="Semana de ejemplo"
              onToggle={() => act(habit)}
              onIncrement={() => act(habit)}
              onOpen={() => setSheet("detail")}
            />
          );
        })}
        <HabitCard
          name="Tomar agua · sin datos"
          frequency="Diario · 8 vasos"
          icon="target"
          tint={getHabitTint(habitLike(HABITS[0]), "web")}
          counter={{ count: null, goal: 8, unit: null }}
          week={LETTERS.map((label, index) => ({ key: label + index, label, value: undefined, today: index === 6 }))}
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
          <h3 className={styles.h3}>WeekRings, HabitRow y NextReminderCard móvil</h3>
          <WeekRings days={mobileWeek} />
          <WeekRings days={mobileWeek.map((day) => ({ ...day, value: day.today ? day.value : null }))} noData />
          {HABITS.map((habit) => {
            const done = isDone(habit);
            const counter = habit.goal > 1 ? { count: state[habit.id], goal: habit.goal, unit: null } : null;
            const like = habitLike(habit);
            return (
              <HabitRow
                key={habit.id}
                name={habit.name}
                meta={counter ? "Un vaso cada 3 h" : habit.freq}
                icon={habit.icon}
                tint={getHabitTint(like, "mobile", counter ? 28 : undefined)}
                fillTint={counter ? getHabitTint(like, "mobile", 90) : undefined}
                done={done}
                counter={counter}
                onToggle={() => act(habit)}
                onIncrement={() => act(habit)}
                onOpen={() => setSheet("detail")}
              />
            );
          })}
          <HabitRow
            name="Tomar agua · sin datos"
            meta="Diario"
            icon="target"
            tint={getHabitTint(habitLike(HABITS[0]), "mobile", 28)}
            fillTint={getHabitTint(habitLike(HABITS[0]), "mobile", 90)}
            counter={{ count: null, goal: 8 }}
            onToggle={() => {}}
            onOpen={() => setSheet("detail")}
          />
          <NextReminderCard variant="mobile" titleId="demo-next-mob" title="Tomar agua · 1:00 p. m." onEdit={() => setSheet("form")} editLabel="Editar recordatorio" />
        </div>
        <Card>
          <h3 className={styles.h3}>Hojas</h3>
          <div className={styles.row}>
            <PillButton onClick={() => setSheet("detail")}>HabitDetailSheet (DetailSheet)</PillButton>
            <PillButton variant="primary" icon="plus" onClick={() => setSheet("form")}>HabitFormModal</PillButton>
          </div>
        </Card>
      </div>

      {sheet === "detail" && (
        <HabitDetailSheet
          habit={SAMPLE_HABIT}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet("form")}
          onDuplicate={async () => true}
          onDelete={async () => true}
          onToggle={async () => true}
        />
      )}
      {sheet === "form" && (
        <HabitFormModal
          habit={null}
          categories={[
            { ...SAMPLE_HABIT.category, isRecurring: true },
            { id: 3, name: "Salud", color: categoryColors[2], icon: "heart", isRecurring: false },
          ]}
          onClose={() => setSheet(null)}
          onSubmit={async () => {}}
          onCategoriesChanged={async () => {}}
        />
      )}
    </section>
  );
}

export default HabitsComponentsDemo;
