import { useState } from "react";
import Card, { CardHeader } from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import WeekCalendarGrid from "../../ui/charts/WeekCalendarGrid";
import MonthMini from "../../ui/charts/MonthMini";
import VerticalTimeline from "../../ui/charts/VerticalTimeline";
import layoutColumns from "../../ui/charts/layoutColumns";
import EventDetailCard from "../../ui/domain/EventDetailCard";
import TaskPill from "../../ui/domain/TaskPill";
import EventDetailSheet from "../events/EventDetailSheet";
import EventFormModal from "../events/EventFormModal";
import { addDays, formatClock, getBogotaNow, mondayOf, parseDateKey, WEEKDAYS_SHORT } from "../../utils/dates";
import categoryColors from "../../constants/categoryColors";
import styles from "./UiPlayground.module.css";

// Componentes de la fase 4 (Eventos) con los datos de ejemplo de EventosWeb.dc.html y
// Eventos.dc.html. Solo existen en /dev/ui; la pantalla real usa GET /events.

const CATS = {
  sena: { id: 1, name: "SENA", color: categoryColors[5] },
  trabajo: { id: 2, name: "Trabajo", color: categoryColors[14] },
  familia: { id: 3, name: "Familia", color: categoryColors[0] },
  salud: { id: 4, name: "Salud", color: categoryColors[2] },
  personal: { id: 5, name: "Personal", color: categoryColors[7] },
};

// d = día de la semana (0 = lunes). "Cumpleaños" muestra la franja de todo el día y
// "Llamada de seguimiento" un solape con "Revisión de proyecto" (casos no dibujados).
const EVENTS = [
  { id: "a", d: 0, title: "Clase SENA", cat: "sena", s: 7, e: 9 },
  { id: "b", d: 0, title: "Revisión de proyecto", cat: "trabajo", s: 14, e: 15.5 },
  { id: "b2", d: 0, title: "Llamada de seguimiento", cat: "personal", s: 14.5, e: 15.5 },
  { id: "c", d: 1, title: "Entrenamiento", cat: "salud", s: 18, e: 19 },
  { id: "d", d: 2, title: "Cita odontológica", cat: "salud", s: 9, e: 10 },
  { id: "e", d: 3, title: "Clase SENA", cat: "sena", s: 7, e: 9 },
  { id: "f", d: 3, title: "Reunión con cliente", cat: "trabajo", s: 11, e: 12 },
  { id: "g", d: 4, title: "Llamada con proveedor", cat: "trabajo", s: 15, e: 16 },
  { id: "h", d: 5, title: "Salida de campo", cat: "personal", s: 8, e: 12 },
  { id: "bd", d: 5, title: "Cumpleaños de Laura", cat: "familia", s: null },
  { id: "i", d: 6, title: "Desayuno familiar", cat: "familia", s: 9, e: 10 },
  { id: "j", d: 6, title: "Almuerzo familiar", cat: "familia", s: 13, e: 14.5 },
  { id: "k", d: 6, title: "Entrenamiento", cat: "salud", s: 18, e: 19 },
];

const NOW = 10 + 40 / 60;

const SAMPLE_EVENT = {
  id: 99,
  title: "Almuerzo familiar",
  description: "Llevar el postre.",
  eventDate: "",
  eventTime: "13:00:00",
  duration: 90,
  location: "Casa de mis papás",
  status: "programado",
  categoryId: 3,
  category: CATS.familia,
  recurrenceFrequency: "weekly",
};

function EventsComponentsDemo() {
  const today = getBogotaNow().dateKey;
  const monday = mondayOf(today);
  const [done, setDone] = useState({ a: true, b: true, c: true, d: true });
  const [pickedId, setPickedId] = useState("j");
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => parseDateKey(today));
  const [sheet, setSheet] = useState(null);
  // Cancelados de ejemplo: "Llamada de seguimiento" (rejilla) y "Entrenamiento" (línea vertical).
  const [canceled, setCanceled] = useState({ b2: true, m4: true });
  const flip = (id) => setDone((current) => ({ ...current, [id]: !current[id] }));
  const setCanceledId = (id, value) => setCanceled((current) => ({ ...current, [id]: value }));

  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index);
    const { day, weekday } = parseDateKey(key);
    const dayEvents = EVENTS.filter((event) => event.d === index);
    const block = (event) => ({
      key: event.id,
      title: event.title,
      done: Boolean(done[event.id]),
      canceled: Boolean(canceled[event.id]),
      selected: pickedId === event.id,
      color: CATS[event.cat].color,
      onSelect: () => setPickedId(event.id),
      ariaLabel: `${event.title}, ${WEEKDAYS_SHORT[weekday]} ${day}`,
    });
    return {
      key,
      label: WEEKDAYS_SHORT[weekday],
      number: day,
      today: key === today,
      selected: key === today,
      timed: layoutColumns(dayEvents.filter((event) => event.s !== null).map((event) => ({ ...event, start: event.s, end: event.e })))
        .map((event) => ({
          ...block(event),
          range: canceled[event.id] ? "Cancelado" : `${formatClock(event.start)} – ${formatClock(event.end)}`,
          start: event.start,
          end: event.end,
          column: event.column,
          columns: event.columns,
        })),
      allDay: dayEvents.filter((event) => event.s === null).map(block),
    };
  });

  const picked = EVENTS.find((event) => event.id === pickedId);
  const pickedDone = Boolean(done[picked.id]);
  const pickedCanceled = Boolean(canceled[picked.id]);
  let pickedKicker = "Empieza en 2 h 20 min";
  if (pickedCanceled) pickedKicker = "Cancelado";
  else if (pickedDone) pickedKicker = "Realizado";

  const marked = new Set([1, 3, 5, 9, 12, 18, 20, 24, 27].map((day) => `${today.slice(0, 8)}${String(day).padStart(2, "0")}`));

  const vertical = [
    { id: "m1", title: "Clase SENA", cat: "sena", place: "Sede Calle 52", s: 7, e: 9 },
    { id: "m2", title: "Reunión con cliente", cat: "familia", place: "Videollamada", s: 11, e: 12 },
    { id: "m3", title: "Almuerzo familiar", cat: "salud", place: "Casa", s: 13, e: 14.5 },
    { id: "m4", title: "Entrenamiento", cat: "personal", place: "Parque Simón Bolívar", s: 18, e: 19 },
  ].map((event) => ({
    key: event.id,
    title: event.title,
    meta: done[event.id] ? `Realizado · ${event.place}` : event.place,
    start: event.s,
    end: event.e,
    done: Boolean(done[event.id]),
    canceled: Boolean(canceled[event.id]),
    color: CATS[event.cat].color,
    onToggle: () => flip(event.id),
    onOpen: () => setSheet("detail"),
    toggleLabel: `${done[event.id] ? "Marcar programado" : "Marcar realizado"}: ${event.title}`,
    openLabel: `Ver detalles de ${event.title}`,
  }));

  function shiftMonth(step) {
    setMonth(({ year, month: current }) => {
      const date = new Date(Date.UTC(year, current + step, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  return (
    <section className={styles.section} aria-labelledby="sec-events">
      <h2 id="sec-events" className={styles.h2}>Eventos (fase 4)</h2>

      <h3 className={styles.h3}>WeekCalendarGrid · semana (con todo el día y un solape)</h3>
      <Card>
        <CardHeader title="Semana" meta="Toca un evento para ver el detalle" />
        <WeekCalendarGrid days={days} startHour={7} endHour={20} now={NOW} minWidth={860} focusKey={today} />
      </Card>

      <div className={styles.grid}>
        <div>
          <h3 className={styles.h3}>EventDetailCard · toca un bloque (Llamada de seguimiento está cancelado)</h3>
          <EventDetailCard
            key={picked.id}
            titleId="demo-det"
            kicker={pickedKicker}
            category={{ label: CATS[picked.cat].name, color: CATS[picked.cat].color }}
            title={picked.title}
            when="Dom 1 · 1:00 – 2:30 p. m."
            place="Casa de mis papás"
            reminder={null}
            done={pickedDone}
            canceled={pickedCanceled}
            onToggle={() => flip(picked.id)}
            onCancel={async () => {
              setCanceledId(picked.id, true);
              return true;
            }}
            onRestore={() => setCanceledId(picked.id, false)}
            onEdit={() => setSheet("detail")}
          />
        </div>
        <div>
          <h3 className={styles.h3}>EventDetailCard · cancelado</h3>
          <EventDetailCard
            titleId="demo-det-canceled"
            kicker="Cancelado"
            category={{ label: CATS.salud.name, color: CATS.salud.color }}
            title="Cita odontológica"
            when="Mié 28 · 9:00 – 10:00 a. m."
            place="Clínica Dental Norte"
            reminder={null}
            canceled
            onRestore={() => {}}
            onEdit={() => setSheet("detail")}
          />
        </div>
        <div>
          <h3 className={styles.h3}>EventDetailCard · sin eventos</h3>
          <EventDetailCard titleId="demo-det-empty" kicker="Sin eventos" title="Aún no tienes eventos" reminder={null} empty onEmptyAction={() => setSheet("form")} />
        </div>
        <Card>
          <h3 className={styles.h3}>MonthMini · variant=&quot;events&quot;</h3>
          <MonthMini
            variant="events"
            titleId="demo-mes"
            markedLabel="con eventos"
            year={month.year}
            month={month.month}
            selectedKey={selected}
            todayKey={today}
            markedDates={marked}
            onSelect={setSelected}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
          />
        </Card>
      </div>

      <div className={styles.grid}>
        <div style={{ maxWidth: 350 }}>
          <h3 className={styles.h3}>VerticalTimeline · 7 a. m. a 8 p. m. (Entrenamiento cancelado)</h3>
          {/* La etiqueta de la primera hora sube 7 px sobre su línea */}
          <div style={{ paddingTop: 12 }}>
            <VerticalTimeline items={vertical} now={NOW} startHour={7} endHour={20} />
          </div>
        </div>
        <Card>
          <h3 className={styles.h3}>TaskPill · todo el día (móvil): normal y cancelado</h3>
          <div className={styles.row}>
            <TaskPill variant="mobile" title="Cumpleaños de Laura" color={CATS.familia.color} done={false} toggleLabel="Marcar realizado: Cumpleaños de Laura" onToggle={() => {}} onOpen={() => setSheet("detail")} />
            <TaskPill variant="mobile" tone="canceled" title="Cumpleaños de Sofía" onOpen={() => setSheet("canceled")} />
          </div>
          <h3 className={styles.h3}>Hojas</h3>
          <div className={styles.row}>
            <PillButton onClick={() => setSheet("detail")}>EventDetailSheet (DetailSheet)</PillButton>
            <PillButton onClick={() => setSheet("canceled")}>EventDetailSheet · cancelado</PillButton>
            <PillButton variant="primary" icon="plus" onClick={() => setSheet("form")}>EventFormModal</PillButton>
          </div>
        </Card>
      </div>

      {(sheet === "detail" || sheet === "canceled") && (
        <EventDetailSheet
          event={{ ...SAMPLE_EVENT, eventDate: today, status: sheet === "canceled" ? "cancelado" : "programado" }}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet("form")}
          onDuplicate={async () => true}
          onDelete={async () => true}
          onCancel={async () => true}
          onRestore={async () => true}
        />
      )}
      {sheet === "form" && (
        <EventFormModal
          event={null}
          categories={Object.values(CATS).map((category) => ({ ...category, icon: "tag", isRecurring: category.id === 3 }))}
          onClose={() => setSheet(null)}
          onSubmit={async () => {}}
          onCategoriesChanged={async () => {}}
        />
      )}
    </section>
  );
}

export default EventsComponentsDemo;
