import DetailSheet from "../../ui/domain/DetailSheet";
import {
  HABIT_STATUS_LABELS,
  appliesToday,
  describeProgress,
  formatGoal,
  getGoalType,
  isHabitDone,
  selectHabitProgress,
} from "../../hooks/data/habitSelectors";
import { formatTime12 } from "../../utils/time";

const MEASURE_LABELS = { check: "Solo marcar", count: "Cantidad", duration: "Tiempo" };

// Detalle de un hábito con Editar, Duplicar, Marcar (o Desmarcar) hoy y Eliminar (DetailSheet).
// En los de cantidad o tiempo suma "Ajustar cantidad" o "Registrar tiempo" (onAdjust abre la hoja
// de avance). Si el hábito no toca hoy no hay acciones del día (la API las rechaza).
function HabitDetailSheet({ habit, onClose, onEdit, onDuplicate, onDelete, onToggle, onAdjust }) {
  const done = isHabitDone(habit);
  const type = getGoalType(habit);
  const progress = selectHabitProgress(habit);
  const today = appliesToday(habit);
  const goal = formatGoal(habit);

  let todayValue = "No toca hoy";
  if (today) todayValue = progress ? `${describeProgress(progress)}${done ? " · cumplido" : ""}` : HABIT_STATUS_LABELS[habit.status] || habit.status;

  const details = [
    { label: "Días", value: habit.frequency },
    { label: "Cómo se mide", value: MEASURE_LABELS[type] },
    { label: "Meta diaria", value: goal || "" },
    { label: "Hoy", value: todayValue },
    { label: "Recordatorio adicional", value: habit.reminderTime ? formatTime12(habit.reminderTime) : "Sin configurar" },
    { label: "Categoría", value: habit.category?.name || "Sin categoría" },
    { label: "Propósito", value: habit.category?.description || "" },
  ];

  const extraActions = [];
  if (today && progress && onAdjust) {
    // Devuelve true para que la hoja de detalle se cierre y la página abra la de avance.
    extraActions.push({
      label: type === "duration" ? "Registrar tiempo" : "Ajustar cantidad",
      onRun: async () => {
        onAdjust(habit);
        return true;
      },
    });
  }
  if (today) {
    extraActions.push({
      label: done ? (progress ? "Volver a 0 hoy" : "Desmarcar hoy") : "Marcar cumplido hoy",
      onRun: () => onToggle(habit),
    });
  }

  return (
    <DetailSheet
      title={habit.name}
      details={details}
      deleteQuestion="¿Eliminar este hábito? Esta acción no se puede deshacer."
      onClose={onClose}
      onEdit={() => onEdit(habit)}
      onDuplicate={() => onDuplicate(habit)}
      onDelete={() => onDelete(habit)}
      extraActions={extraActions}
    />
  );
}

export default HabitDetailSheet;
