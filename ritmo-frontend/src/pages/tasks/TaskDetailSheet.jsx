import { useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import { getTaskTimeRange } from "../../hooks/data/todaySelectors";
import { TASK_PRIORITIES, TASK_STATUS_LABELS } from "../../hooks/data/taskSelectors";
import { formatClockWithPeriod, formatLongDate, toDateKey } from "../../utils/dates";
import styles from "./TaskDetailSheet.module.css";

const RECURRENCE_LABELS = { daily: "Diaria", weekly: "Semanal", monthly: "Mensual", yearly: "Anual" };

/**
 * Detalle de una tarea con Editar, Duplicar y Eliminar (reemplaza MobileItemDetails de MUI).
 * Eliminar pide confirmación dentro de la misma hoja, sin window.confirm.
 * onDuplicate y onDelete devuelven true si salió bien; la hoja se cierra en ese caso.
 */
function TaskDetailSheet({ task, onClose, onEdit, onDuplicate, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

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
  ].filter((detail) => detail.value);

  async function run(action) {
    setBusy(true);
    const ok = await action(task);
    if (ok) onClose();
    else setBusy(false);
  }

  return (
    <BottomSheet open onClose={onClose} title={task.title} busy={busy}>
      {confirmingDelete ? (
        <div className={styles.confirm} role="alert">
          <p className={styles.confirmText}>¿Eliminar esta tarea? Esta acción no se puede deshacer.</p>
          <div className={styles.actions}>
            <PillButton size="cta" variant="danger" block disabled={busy} onClick={() => run(onDelete)} data-autofocus>
              {busy ? "Eliminando…" : "Eliminar"}
            </PillButton>
            <button type="button" className={styles.textButton} disabled={busy} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className={styles.details}>
            {details.map((detail) => (
              <div key={detail.label} className={styles.detail}>
                <dt className={styles.term}>{detail.label}</dt>
                <dd className={styles.value}>{detail.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.actions}>
            <PillButton size="cta" variant="primary" icon="pencil" block disabled={busy} onClick={() => onEdit(task)}>
              Editar
            </PillButton>
            <div className={styles.secondary}>
              <button type="button" className={styles.textButton} disabled={busy} onClick={() => run(onDuplicate)}>
                {busy ? "Duplicando…" : "Duplicar"}
              </button>
              <button
                type="button"
                className={`${styles.textButton} ${styles.danger}`}
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}

export default TaskDetailSheet;
