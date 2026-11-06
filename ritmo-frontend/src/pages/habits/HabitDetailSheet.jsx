import DetailSheet from "../../ui/domain/DetailSheet";
import { HABIT_STATUS_LABELS, isHabitDone } from "../../hooks/data/habitSelectors";
import { formatTime12 } from "../../utils/time";

// Detalle de un hábito con Editar, Duplicar, Marcar (o Desmarcar) hoy y Eliminar (DetailSheet):
// los mismos datos que mostraba la hoja anterior (MobileItemDetails). Marcar desde aquí sirve
// también para los hábitos de conteo, cuyo "+ 1" espera el conteo en la API (BACKEND_PENDIENTE #2).
function HabitDetailSheet({ habit, onClose, onEdit, onDuplicate, onDelete, onToggle }) {
  const done = isHabitDone(habit);
  const details = [
    { label: "Frecuencia", value: habit.frequency },
    { label: "Meta", value: habit.goal ? String(habit.goal) : "" },
    { label: "Recordatorio adicional", value: habit.reminderTime ? formatTime12(habit.reminderTime) : "Sin configurar" },
    { label: "Estado", value: HABIT_STATUS_LABELS[habit.status] || habit.status },
    { label: "Categoría", value: habit.category?.name || "Sin categoría" },
    { label: "Propósito", value: habit.category?.description || "" },
  ];

  return (
    <DetailSheet
      title={habit.name}
      details={details}
      deleteQuestion="¿Eliminar este hábito? Esta acción no se puede deshacer."
      onClose={onClose}
      onEdit={() => onEdit(habit)}
      onDuplicate={() => onDuplicate(habit)}
      onDelete={() => onDelete(habit)}
      extraAction={{ label: done ? "Desmarcar hoy" : "Marcar cumplido hoy", onRun: () => onToggle(habit) }}
    />
  );
}

export default HabitDetailSheet;
