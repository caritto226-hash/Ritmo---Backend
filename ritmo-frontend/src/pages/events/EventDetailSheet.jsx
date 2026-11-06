import DetailSheet from "../../ui/domain/DetailSheet";
import { EVENT_STATUS_LABELS, formatEventTime } from "../../hooks/data/eventSelectors";
import { isEventCanceled } from "../../hooks/data/todaySelectors";
import { RECURRENCE_LABELS } from "../../constants/recurrence";
import { formatLongDate, toDateKey } from "../../utils/dates";

// Detalle de un evento con Editar, Duplicar, Cancelar (o Restaurar) y Eliminar (DetailSheet): los
// mismos datos que mostraba la hoja anterior (MobileItemDetails).
function EventDetailSheet({ event, onClose, onEdit, onDuplicate, onDelete, onCancel, onRestore }) {
  const dateKey = toDateKey(event.eventDate);
  const canceled = isEventCanceled(event);
  const details = [
    { label: "Descripción", value: event.description || "Sin descripción" },
    { label: "Fecha", value: dateKey ? formatLongDate(dateKey) : "Sin fecha" },
    { label: "Hora", value: formatEventTime(event) },
    { label: "Duración", value: event.duration ? `${event.duration} min` : "" },
    { label: "Ubicación", value: event.location || "" },
    { label: "Categoría", value: event.category?.name || "Sin categoría" },
    { label: "Estado", value: EVENT_STATUS_LABELS[event.status] || event.status },
    { label: "Repetir", value: RECURRENCE_LABELS[event.recurrenceFrequency] || "No se repite" },
  ];

  return (
    <DetailSheet
      title={event.title}
      details={details}
      deleteQuestion="¿Eliminar este evento? Esta acción no se puede deshacer."
      onClose={onClose}
      onEdit={() => onEdit(event)}
      onDuplicate={() => onDuplicate(event)}
      onDelete={() => onDelete(event)}
      extraAction={canceled
        ? { label: "Restaurar evento", onRun: () => onRestore(event) }
        : { label: "Cancelar evento", onRun: () => onCancel(event) }}
    />
  );
}

export default EventDetailSheet;
