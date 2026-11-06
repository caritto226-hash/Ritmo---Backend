import { useState } from "react";
import Card from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import HorizontalTimeline from "../../ui/charts/HorizontalTimeline";
import VerticalTimeline from "../../ui/charts/VerticalTimeline";
import WeekBars from "../../ui/charts/WeekBars";
import WeekStrip from "../../ui/charts/WeekStrip";
import TaskRow, { TaskTableHeader } from "../../ui/domain/TaskRow";
import TaskPill from "../../ui/domain/TaskPill";
import DatePickerSheet from "../../ui/domain/DatePickerSheet";
import TaskDetailSheet from "../tasks/TaskDetailSheet";
import TaskFormModal from "../tasks/TaskFormModal";
import { selectWeekDays, TASK_PRIORITIES } from "../../hooks/data/taskSelectors";
import { addDays, getBogotaNow } from "../../utils/dates";
import categoryColors from "../../constants/categoryColors";
import styles from "./UiPlayground.module.css";

// Componentes de la fase 3 (Tareas) con los datos de ejemplo de TareasWeb.dc.html y Tareas.dc.html.
// Solo existen en /dev/ui; la pantalla real usa GET /tasks.

const CATS = {
  lectura: { id: 1, name: "Lectura", color: categoryColors[0] },
  ritmo: { id: 2, name: "Proyecto Ritmo", color: categoryColors[2] },
  sena: { id: 3, name: "SENA", color: categoryColors[5] },
  hogar: { id: 4, name: "Hogar", color: categoryColors[7] },
  trabajo: { id: 5, name: "Trabajo", color: categoryColors[1] },
};

const TIMED = [
  { id: "t1", title: "Leer 20 minutos", cat: "lectura", start: 7, end: 7.5, lane: 0 },
  { id: "t2", title: "Rediseño módulo Finanzas", cat: "ritmo", start: 8, end: 10, lane: 1 },
  { id: "t3", title: "Grabar video evidencia", cat: "sena", start: 10.75, end: 11.75, lane: 0 },
  { id: "t4", title: "Mercado de la semana", cat: "hogar", start: 14, end: 15, lane: 1 },
  { id: "t5", title: "Responder correos", cat: "trabajo", start: 16, end: 16.5, lane: 2 },
];

const NOW = 10 + 40 / 60;

const SAMPLE_TASK = {
  id: 99,
  title: "Grabar video evidencia",
  description: "Evidencia de la guía 4.",
  dueDate: "",
  startAt: null,
  endAt: null,
  duration: 60,
  priority: "alta",
  status: "pendiente",
  categoryId: 3,
  category: { ...CATS.sena, description: "Formación" },
  recurrenceFrequency: null,
};

function TasksComponentsDemo() {
  const today = getBogotaNow().dateKey;
  const [done, setDone] = useState({ t1: true, u2: true });
  const [selected, setSelected] = useState(today);
  const [sheet, setSheet] = useState(null);
  const flip = (id) => setDone((current) => ({ ...current, [id]: !current[id] }));

  const horizontal = TIMED.map((task) => ({
    key: task.id,
    kind: "task",
    title: task.title,
    start: task.start,
    end: task.end,
    lane: task.lane,
    done: Boolean(done[task.id]),
    hot: !done[task.id] && task.start <= NOW + 0.5 && task.end > NOW,
    color: CATS[task.cat].color,
    onToggle: () => flip(task.id),
    ariaLabel: `Completar: ${task.title}`,
  }));

  const vertical = TIMED.map((task) => ({
    key: task.id,
    title: task.title,
    meta: CATS[task.cat].name,
    start: task.start,
    end: task.end,
    done: Boolean(done[task.id]),
    color: CATS[task.cat].color,
    onToggle: () => flip(task.id),
    onOpen: () => setSheet("detail"),
    toggleLabel: `Marcar completada: ${task.title}`,
    openLabel: `Ver detalles de ${task.title}`,
  }));

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label, index) => ({
    key: label,
    label,
    count: [3, 4, 2, 6, 5, 3, 2][index],
    isToday: index === 6,
  }));

  const rows = [
    { id: "t0", title: "Enviar cotización a cliente", cat: "trabajo", priority: "alta", when: { text: "Venció ayer", overdue: true } },
    { id: "t1", title: "Leer 20 minutos", cat: "lectura", priority: "baja", when: { text: "7:00 a. m.", overdue: false } },
    { id: "t2", title: "Rediseño módulo Finanzas", cat: "ritmo", priority: "alta", when: { text: "8:00 a. m.", overdue: false } },
    { id: "u1", title: "Pagar internet", cat: null, priority: "media", when: { text: "Hoy · sin hora", overdue: false } },
  ];

  const marked = new Set([addDays(today, -2), addDays(today, -1), today, addDays(today, 1)]);

  return (
    <section className={styles.section} aria-labelledby="sec-tasks">
      <h2 id="sec-tasks" className={styles.h2}>Tareas (fase 3)</h2>

      <h3 className={styles.h3}>HorizontalTimeline · variant=&quot;tasks&quot;</h3>
      <Card>
        <HorizontalTimeline variant="tasks" items={horizontal} now={NOW} emptyText="Sin tareas con hora." />
      </Card>

      <h3 className={styles.h3}>TaskRow</h3>
      <Card>
        {/* Tabla solo web: en /dev/ui a 390 px se desplaza en horizontal */}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <TaskTableHeader />
            {rows.map((row) => (
              <TaskRow
                key={row.id}
                title={row.title}
                done={Boolean(done[row.id])}
                category={row.cat ? CATS[row.cat] : null}
                priority={TASK_PRIORITIES[row.priority]}
                when={row.when}
                onToggle={() => flip(row.id)}
                onOpen={() => setSheet("detail")}
              />
            ))}
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        <Card>
          <h3 className={styles.h3}>WeekBars</h3>
          <WeekBars days={weekDays} ariaLabel="Completadas por día" />
        </Card>
        <Card>
          <h3 className={styles.h3}>TaskPill · web</h3>
          <div className={styles.row}>
            <TaskPill title="Pagar internet" done={Boolean(done.u1)} onToggle={() => flip("u1")} />
            <TaskPill title="Organizar escritorio" done={Boolean(done.u2)} onToggle={() => flip("u2")} />
          </div>
          <h3 className={styles.h3}>TaskPill · móvil</h3>
          <div className={styles.row}>
            <TaskPill variant="mobile" title="Pagar internet" color={CATS.hogar.color} done={Boolean(done.u1)} onToggle={() => flip("u1")} onOpen={() => setSheet("detail")} />
            <TaskPill variant="mobile" title="Organizar escritorio" color={CATS.sena.color} done={Boolean(done.u2)} onToggle={() => flip("u2")} onOpen={() => setSheet("detail")} />
            <TaskPill variant="mobile" tone="overdue" title="Enviar cotización" done={false} onToggle={() => {}} onOpen={() => setSheet("detail")} />
          </div>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card>
          <h3 className={styles.h3}>WeekStrip</h3>
          <WeekStrip days={selectWeekDays(selected)} selectedKey={selected} todayKey={today} markedDates={marked} onSelect={setSelected} />
        </Card>
        <Card>
          <h3 className={styles.h3}>Hojas</h3>
          <div className={styles.row}>
            <PillButton icon="calendar" onClick={() => setSheet("date")}>DatePickerSheet</PillButton>
            <PillButton onClick={() => setSheet("detail")}>TaskDetailSheet</PillButton>
            <PillButton variant="primary" icon="plus" onClick={() => setSheet("form")}>TaskFormModal</PillButton>
          </div>
        </Card>
      </div>

      <h3 className={styles.h3}>VerticalTimeline</h3>
      <div style={{ maxWidth: 350 }}>
        <VerticalTimeline items={vertical} now={NOW} emptyText="Sin tareas con hora." />
      </div>

      {sheet === "date" && (
        <DatePickerSheet value={selected} todayKey={today} markedDates={marked} onSelect={setSelected} onClose={() => setSheet(null)} />
      )}
      {sheet === "detail" && (
        <TaskDetailSheet
          task={{ ...SAMPLE_TASK, dueDate: today }}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet("form")}
          onDuplicate={async () => true}
          onDelete={async () => true}
        />
      )}
      {sheet === "form" && (
        <TaskFormModal
          task={null}
          categories={Object.values(CATS).map((category) => ({ ...category, icon: "tag", isRecurring: category.id === 5 }))}
          onClose={() => setSheet(null)}
          onSubmit={async () => {}}
          onCategoriesChanged={async () => {}}
        />
      )}
    </section>
  );
}

export default TasksComponentsDemo;
