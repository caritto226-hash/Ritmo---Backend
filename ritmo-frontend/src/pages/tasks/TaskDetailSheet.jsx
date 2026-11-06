import DetailSheet from "../../ui/domain/DetailSheet";
import { getTaskTimeRange } from "../../hooks/data/todaySelectors";
import { TASK_PRIORITIES, TASK_STATUS_LABELS } from "../../hooks/data/taskSelectors";
import { formatClockWithPeriod, formatLongDate, toDateKey } from "../../utils/dates";
import { RECURRENCE_LABELS } from "../../constants/recurrence";

// Detalle de una tarea con Editar, Duplicar y Eliminar (DetailSheet).
function TaskDetailSheet({ task, onClose, onEdit, onDuplicate, onDelete }) {
  const dateKey = toDateKey(task.dueDate);
  const range = getTaskTimeRange(task);
  const details = [
    { label: "Descripción", value: task.description || "Sin descripción" },
    { label: "Fecha", value: dateKey ? formatLongDate(dateKey) : "Sin fecha" },
    { label: "Hora", value: range ? `${formatClockWithPeriod(range.start)} – ${formatClockWithPeriod(range.end)}` : "Sin hora" },
    { label: "Prioridad", value: TASK_PRIORITIES[task.priority]?.label || task.priority },
    { label: "Estado", value: TASK_STATUS_LABELS[task.status] || task.status },
    { label: "Duración", value: task.duration ? `${task.duration} min` : "" },
    { label: "Categoría", value: task.category?.name || "Sin categoría" },
    { label: "Propósito", value: task.category?.description || "" },
    { label: "Repetir", value: RECURRENCE_LABELS[task.recurrenceFrequency] || "" },
  ];

  return (
    <DetailSheet
      title={task.title}
      details={details}
      deleteQuestion="¿Eliminar esta tarea? Esta acción no se puede deshacer."
      onClose={onClose}
      onEdit={() => onEdit(task)}
      onDuplicate={() => onDuplicate(task)}
      onDelete={() => onDelete(task)}
    />
  );
}

export default TaskDetailSheet;
