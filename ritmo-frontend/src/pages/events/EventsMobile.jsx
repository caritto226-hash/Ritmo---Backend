import { CirclePill, MobilePageTitle } from "../../ui/shell/MobileShell";
import Icon from "../../ui/icons/Icon";
import WeekStrip from "../../ui/charts/WeekStrip";
import VerticalTimeline from "../../ui/charts/VerticalTimeline";
import TaskPill from "../../ui/domain/TaskPill";
import { isEventCanceled, isEventDone, selectDayEvents } from "../../hooks/data/todaySelectors";
import { selectWeekDays } from "../../hooks/data/taskSelectors";
import {
  formatNextWhen,
  getEventColor,
  selectEventDates,
  selectGridDay,
  selectNextEvent,
} from "../../hooks/data/eventSelectors";
import { formatLongDate } from "../../utils/dates";
import styles from "./EventsMobile.module.css";

function toggleLabel(event) {
  return `${isEventDone(event) ? "Marcar programado" : "Marcar realizado"}: ${event.title}`;
}

// Eventos móvil (Eventos.dc.html). La barra superior (menú, + Nuevo evento, campana) la pone MainLayout.
function EventsMobile({
  events,
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
  const dayEvents = selectDayEvents(events, selectedKey);
  const doneCount = dayEvents.filter(isEventDone).length;
  const { timed, allDay } = selectGridDay(events, selectedKey);
  const next = selectNextEvent(events, todayKey, now.hours);

  const timeline = timed.map(({ event, start, end }) => {
    const done = isEventDone(event);
    const place = event.location || event.category?.name || "Sin ubicación";
    return {
      key: event.id,
      title: event.title,
      meta: done ? `Realizado · ${place}` : place,
      start,
      end,
      done,
      canceled: isEventCanceled(event),
      color: getEventColor(event),
      disabled: isPending(event.id),
      onToggle: () => onToggle(event),
      onOpen: () => onOpen(event),
      toggleLabel: toggleLabel(event),
      openLabel: `Ver detalles de ${event.title}`,
    };
  });

  return (
    <>
      <MobilePageTitle
        title="Mis eventos"
        subtitle={formatLongDate(selectedKey)}
        action={<CirclePill icon="calendar" onClick={onPickDate}>Calendario</CirclePill>}
      />

      <WeekStrip
        days={selectWeekDays(selectedKey)}
        selectedKey={selectedKey}
        todayKey={todayKey}
        markedDates={selectEventDates(events)}
        markedLabel="con eventos"
        onSelect={onSelectDay}
      />

      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tus eventos…</p>
      ) : (
        <>
          <div className={styles.next}>
            <span className={styles.nextIcon} aria-hidden="true">
              <Icon name="clockSm" size={18} strokeWidth={2} />
            </span>
            <span className={styles.nextText}>
              <span className={styles.nextKicker}>Siguiente{next ? ` · ${formatNextWhen(next, todayKey)}` : ""}</span>
              <span className={styles.nextTitle}>{next ? next.event.title : "Sin eventos próximos"}</span>
            </span>
            <span className={styles.nextCount}>{doneCount}/{dayEvents.length} realizados</span>
          </div>

          {allDay.length > 0 && (
            <section className={styles.group} aria-labelledby="m-todoeldia">
              <h2 id="m-todoeldia" className={styles.groupTitle}>Todo el día</h2>
              <div className={styles.pills}>
                {allDay.map((event) => (
                  <TaskPill
                    key={event.id}
                    variant="mobile"
                    tone={isEventCanceled(event) ? "canceled" : undefined}
                    title={event.title}
                    done={isEventDone(event)}
                    color={getEventColor(event)}
                    disabled={isPending(event.id)}
                    toggleLabel={toggleLabel(event)}
                    onToggle={() => onToggle(event)}
                    onOpen={() => onOpen(event)}
                  />
                ))}
              </div>
            </section>
          )}

          <VerticalTimeline
            items={timeline}
            now={isToday ? now.hours : null}
            startHour={7}
            endHour={20}
            emptyText={allDay.length > 0 ? "No hay eventos con hora este día." : "No hay eventos este día."}
          />
        </>
      )}
    </>
  );
}

export default EventsMobile;
