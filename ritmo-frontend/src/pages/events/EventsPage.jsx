import { useState } from "react";
import { useShell, useShellRail } from "../../ui/shell/ShellContext";
import useEvents from "../../hooks/data/useEvents";
import useNow from "../../hooks/useNow";
import useCreateIntent from "../../hooks/useCreateIntent";
import { selectEventDates } from "../../hooks/data/eventSelectors";
import DatePickerSheet from "../../ui/domain/DatePickerSheet";
import EventFormModal from "./EventFormModal";
import EventDetailSheet from "./EventDetailSheet";
import EventsWeb from "./EventsWeb";
import EventsMobile from "./EventsMobile";

/**
 * Eventos: web (EventosWeb.dc.html, ≥ 760 px) y móvil (Eventos.dc.html, < 760 px) con los mismos
 * datos (GET /events) y manejadores. "Reuniones" y "Lugares" del rail no tienen respaldo en la
 * API: avisan "Próximamente".
 */
function EventsPage() {
  const { isWeb, notify, comingSoon } = useShell();
  const now = useNow();
  const data = useEvents({ notify });
  const todayKey = now.dateKey;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);

  useCreateIntent(() => setForm({ event: null }));

  useShellRail([
    { label: "Inicio", icon: "home", to: "/dashboard", end: true },
    { label: "Calendario", icon: "calendarDays", to: "/events" },
    { label: "Reuniones", icon: "users", onClick: () => comingSoon("Reuniones") },
    { label: "Lugares", icon: "pin", onClick: () => comingSoon("Lugares") },
  ]);

  // El detalle se lee de la lista actual: si el evento cambia o desaparece, la hoja lo refleja.
  const detailEvent = data.events.find((event) => event.id === detailId) || null;

  const shared = {
    events: data.events,
    loading: data.loading,
    error: data.error,
    todayKey,
    selectedKey,
    now,
    onSelectDay: setSelectedKey,
    onPickDate: () => setPickingDate(true),
    onToggle: data.toggleEvent,
    onCancel: data.cancelEvent,
    onRestore: data.restoreEvent,
    isPending: data.isPending,
    onOpen: (event) => setDetailId(event.id),
    onCreate: () => setForm({ event: null }),
  };

  return (
    <>
      {isWeb ? <EventsWeb {...shared} /> : <EventsMobile {...shared} />}

      {detailEvent && !form && (
        <EventDetailSheet
          key={detailEvent.id}
          event={detailEvent}
          onClose={() => setDetailId(null)}
          onEdit={(event) => {
            setDetailId(null);
            setForm({ event });
          }}
          onDuplicate={data.duplicateEvent}
          onDelete={data.deleteEvent}
          onCancel={data.cancelEvent}
          onRestore={data.restoreEvent}
        />
      )}

      {form && (
        <EventFormModal
          event={form.event}
          categories={data.categories}
          onClose={() => setForm(null)}
          onSubmit={data.saveEvent}
          onCategoriesChanged={data.reloadCategories}
        />
      )}

      {pickingDate && (
        <DatePickerSheet
          value={selectedKey}
          todayKey={todayKey}
          markedDates={selectEventDates(data.events)}
          onSelect={setSelectedKey}
          onClose={() => setPickingDate(false)}
        />
      )}
    </>
  );
}

export default EventsPage;
