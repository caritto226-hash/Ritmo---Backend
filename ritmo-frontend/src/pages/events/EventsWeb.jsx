import { useState } from "react";
import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import Card, { CardHeader } from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import SegmentedControl from "../../ui/primitives/SegmentedControl";
import WeekCalendarGrid from "../../ui/charts/WeekCalendarGrid";
import MonthMini from "../../ui/charts/MonthMini";
import EventDetailCard from "../../ui/domain/EventDetailCard";
import { getEventTimeRange, isEventCanceled, isEventDone } from "../../hooks/data/todaySelectors";
import {
  formatCountdown,
  formatEventClockRange,
  formatEventTime,
  getEventColor,
  selectDefaultEvent,
  selectEventDates,
  selectEventStats,
  selectGridDay,
  selectHourRange,
  selectUpcoming,
  selectWeekKeys,
} from "../../hooks/data/eventSelectors";
import { getInkOnColor } from "../../utils/color";
import {
  formatClockWithPeriod,
  formatDayPill,
  formatLongDate,
  formatShortDay,
  formatWeekRange,
  formatWeekTitle,
  MONTHS_SHORT,
  parseDateKey,
  toDateKey,
  WEEKDAYS_SHORT,
} from "../../utils/dates";
import { EVENTS_PREVIEW } from "./eventsPreview";
import styles from "./EventsWeb.module.css";

const VIEWS = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
];

function shortDay(dateKey) {
  const { day, weekday } = parseDateKey(dateKey);
  return `${WEEKDAYS_SHORT[weekday]} ${day}`;
}

// Fondo y tinta de una ficha de categoría sobre blanco: un color oscuro guardado (p. ej. el
// negro de "Trabajo" en el mockup) pasa a gris claro, como en "Próximos".
function badgeColors(color) {
  return getInkOnColor(color) === "var(--ink-on-dark)"
    ? { "--badge-bg": "var(--surface-muted)", "--badge-ink": "var(--text)" }
    : { "--badge-bg": color, "--badge-ink": "var(--ink-on-light)" };
}

// Cancelado: ficha de fecha gris (el gris de las fichas oscuras), sin color de categoría. La
// tinta es --text-3: --text-done sobre --surface-muted no llega a 4,5:1.
const CANCELED_BADGE = { "--badge-bg": "var(--surface-muted)", "--badge-ink": "var(--text-3)" };

// Eventos web (EventosWeb.dc.html). Las cifras junto al título son de la semana de hoy.
function EventsWeb({
  events,
  loading,
  error,
  todayKey,
  selectedKey,
  now,
  onSelectDay,
  onPickDate,
  onToggle,
  onCancel,
  onRestore,
  isPending,
  onOpen,
  onCreate,
}) {
  const [view, setView] = useState("week");
  const [pickedId, setPickedId] = useState(null);
  const [month, setMonth] = useState(() => ({ ...parseDateKey(selectedKey), anchor: selectedKey }));

  // El mes visible sigue al día elegido; las flechas lo mueven sin cambiar ese día.
  if (month.anchor !== selectedKey) setMonth({ ...parseDateKey(selectedKey), anchor: selectedKey });

  function shiftMonth(step) {
    setMonth((current) => {
      const date = new Date(Date.UTC(current.year, current.month + step, 1));
      return { ...current, year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  const isWeek = view === "week";
  const dayKeys = isWeek ? selectWeekKeys(selectedKey) : [selectedKey];
  const gridDays = dayKeys.map((key) => ({ key, ...selectGridDay(events, key) }));
  const hourRange = selectHourRange(gridDays);
  const stats = selectEventStats(events, todayKey);
  const upcoming = selectUpcoming(events, todayKey);

  const picked = events.find((event) => event.id === pickedId);
  const selected = picked || selectDefaultEvent(events, todayKey, now.hours);

  function blockFor(event, extra) {
    const done = isEventDone(event);
    const canceled = isEventCanceled(event);
    const dateKey = toDateKey(event.eventDate);
    const state = done ? ", realizado" : canceled ? ", cancelado" : "";
    return {
      key: event.id,
      title: event.title,
      done,
      canceled,
      selected: selected?.id === event.id,
      color: getEventColor(event),
      onSelect: () => setPickedId(event.id),
      ariaLabel: `${event.title}, ${shortDay(dateKey)}, ${formatEventTime(event)}${state}`,
      ...extra,
    };
  }

  const days = gridDays.map((day) => {
    const { day: number, weekday } = parseDateKey(day.key);
    return {
      key: day.key,
      label: WEEKDAYS_SHORT[weekday],
      number,
      today: day.key === todayKey,
      selected: day.key === selectedKey,
      timed: day.timed.map((entry) => blockFor(entry.event, {
        range: isEventCanceled(entry.event) ? "Cancelado" : formatEventClockRange(entry.event),
        start: entry.start,
        end: entry.end,
        column: entry.column,
        columns: entry.columns,
      })),
      allDay: day.allDay.map((event) => blockFor(event)),
    };
  });

  const titleStats = [
    { value: stats.week, delta: EVENTS_PREVIEW?.deltas.week ?? null, deltaTone: "positive", label: "Esta semana" },
    { value: stats.todayLeft, delta: "hoy", label: "Por asistir" },
    { value: stats.done, delta: "✓", deltaTone: "positive", label: "Realizados" },
  ];

  const pillLabel = isWeek ? formatWeekRange(dayKeys[0], dayKeys[6]) : formatDayPill(selectedKey);

  return (
    <>
      <ShellTitle>
        <PageTitle
          breadcrumb={[{ label: "Inicio", to: "/dashboard" }, { label: "Eventos" }]}
          title="Mis eventos"
          stats={titleStats}
          actions={
            <>
              <SegmentedControl label="Vista" value={view} onChange={setView} options={VIEWS} />
              <PillButton icon="calendar" trailingIcon="chevronDown" onClick={onPickDate} aria-label={`${isWeek ? "Semana" : "Día"}: ${pillLabel}. Cambiar día`}>
                {pillLabel}
              </PillButton>
              <PillButton variant="primary" icon="plus" onClick={onCreate}>Nuevo evento</PillButton>
            </>
          }
        />
      </ShellTitle>

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus eventos…</p>
      ) : (
        <div className={styles.layout}>
          <Card aria-labelledby="h-cal" className={styles.calendar}>
            <CardHeader
              titleId="h-cal"
              className={styles.cardHeader}
              title={isWeek ? formatWeekTitle(dayKeys[0]) : formatLongDate(selectedKey)}
              meta="Toca un evento para ver el detalle"
            />
            <WeekCalendarGrid
              days={days}
              startHour={hourRange.start}
              endHour={hourRange.end}
              now={dayKeys.includes(todayKey) ? now.hours : null}
              minWidth={isWeek ? 860 : 360}
              focusKey={dayKeys.includes(todayKey) ? todayKey : selectedKey}
              emptyText={isWeek ? "No hay eventos esta semana." : "No hay eventos este día."}
            />
          </Card>

          <div className={styles.side}>
            {selected ? (
              <SelectedEventCard
                key={selected.id}
                event={selected}
                todayKey={todayKey}
                nowHours={now.hours}
                inView={dayKeys.includes(toDateKey(selected.eventDate))}
                disabled={isPending(selected.id)}
                onToggle={() => onToggle(selected)}
                onCancel={() => onCancel(selected)}
                onRestore={() => onRestore(selected)}
                onEdit={() => onOpen(selected)}
              />
            ) : (
              <EventDetailCard
                titleId="h-det"
                kicker="Sin eventos"
                title="Aún no tienes eventos"
                reminder={EVENTS_PREVIEW?.reminder ?? null}
                empty
                onEmptyAction={onCreate}
              />
            )}

            <Card aria-labelledby="h-mes" className={styles.month}>
              <MonthMini
                variant="events"
                titleId="h-mes"
                markedLabel="con eventos"
                year={month.year}
                month={month.month}
                selectedKey={selectedKey}
                todayKey={todayKey}
                markedDates={selectEventDates(events)}
                onSelect={onSelectDay}
                onPrev={() => shiftMonth(-1)}
                onNext={() => shiftMonth(1)}
              />
            </Card>

            <Card aria-labelledby="h-prox" className={styles.upcoming}>
              <h2 id="h-prox" className={styles.upcomingTitle}>Próximos</h2>
              {upcoming.map((event) => {
                const dateKey = toDateKey(event.eventDate);
                const { day, month: monthIndex, weekday } = parseDateKey(dateKey);
                const range = getEventTimeRange(event);
                const canceled = isEventCanceled(event);
                const meta = [
                  WEEKDAYS_SHORT[weekday],
                  range ? formatClockWithPeriod(range.start) : "Todo el día",
                  canceled ? "Cancelado" : event.location,
                ].filter(Boolean).join(" · ");
                return (
                  <div key={event.id} className={styles.upcomingRow}>
                    <span className={styles.badge} style={canceled ? CANCELED_BADGE : badgeColors(getEventColor(event))}>
                      <span className={styles.badgeDay}>{day}</span>
                      <span className={styles.badgeMonth}>{MONTHS_SHORT[monthIndex]}</span>
                    </span>
                    <span className={styles.upcomingText}>
                      <span className={styles.upcomingName}>{event.title}</span>
                      <span className={styles.upcomingMeta}>{meta}</span>
                    </span>
                  </div>
                );
              })}
              {upcoming.length === 0 && <p className={styles.empty}>No hay eventos próximos.</p>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

// Tarjeta negra del evento elegido. inView: si el evento está en los días visibles basta "Dom 1";
// si no, se agrega el mes ("Dom 1 nov").
function SelectedEventCard({ event, todayKey, nowHours, inView, disabled, onToggle, onCancel, onRestore, onEdit }) {
  const done = isEventDone(event);
  const canceled = isEventCanceled(event);
  const dateKey = toDateKey(event.eventDate);
  const range = getEventTimeRange(event);
  const minutes = dateKey === todayKey && range ? Math.round((range.start - nowHours) * 60) : 0;
  let kicker = "Programado";
  if (canceled) kicker = "Cancelado";
  else if (done) kicker = "Realizado";
  else if (minutes > 0) kicker = `Empieza en ${formatCountdown(minutes)}`;

  return (
    <EventDetailCard
      titleId="h-det"
      kicker={kicker}
      category={{ label: event.category?.name || "Sin categoría", color: getEventColor(event) }}
      title={event.title}
      when={`${inView ? shortDay(dateKey) : formatShortDay(dateKey)} · ${formatEventTime(event)}`}
      place={event.location || "Sin ubicación"}
      reminder={EVENTS_PREVIEW?.reminder ?? null}
      done={done}
      canceled={canceled}
      disabled={disabled}
      onToggle={onToggle}
      onCancel={onCancel}
      onRestore={onRestore}
      onEdit={onEdit}
      editLabel={`Editar, duplicar o eliminar: ${event.title}`}
    />
  );
}

export default EventsWeb;
