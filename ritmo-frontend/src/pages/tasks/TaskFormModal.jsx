import { useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import DateCalendar from "../../components/DateCalendar";
import TimePicker from "../../components/TimePicker";
import CategorySelect from "../../components/CategorySelect";
import CategoryManager from "../../components/CategoryManager";
import { TASK_STATUS_LABELS } from "../../hooks/data/taskSelectors";
import { RECURRENCE_FREQUENCIES } from "../../constants/recurrence";
import styles from "../../ui/domain/FormSheet.module.css";

const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  date: "",
  startTime: "",
  endTime: "",
  duration: "",
  priority: "media",
  status: "pendiente",
  recurrenceFrequency: "",
};

// "2026-11-05 08:00:00" o "2026-11-05T08:00" → "08:00" (valor del TimePicker).
function timeOf(dateTime) {
  const match = typeof dateTime === "string" ? dateTime.match(/[ T](\d{2}:\d{2})/) : null;
  return match ? match[1] : "";
}

function formFromTask(task) {
  return {
    title: task.title,
    description: task.description || "",
    date: task.dueDate ? task.dueDate.slice(0, 10) : "",
    startTime: timeOf(task.startAt),
    endTime: timeOf(task.endAt),
    duration: task.duration || "",
    categoryId: task.categoryId ? String(task.categoryId) : "",
    priority: task.priority.toLowerCase(),
    status: task.status,
    recurrenceFrequency: task.recurrenceFrequency || "",
  };
}

/**
 * Crear o editar una tarea. Mismos campos y validaciones de la pantalla anterior (Tasks.jsx):
 * título (45), descripción obligatoria (2000), categoría (opcional, con "crear categoría"),
 * repetir (solo con categoría recurrente), fecha obligatoria, duración (solo al crear),
 * prioridad y estado (solo al editar). Más hora de inicio y fin opcionales (start_at / end_at):
 * el fin exige inicio y debe ser posterior. onSubmit(form, task) guarda y lanza Error si falla.
 * Se monta solo mientras está abierto: el formulario arranca de cero en cada apertura.
 */
function TaskFormModal({ task, categories, onClose, onSubmit, onCategoriesChanged }) {
  const isEditing = Boolean(task);
  const [form, setForm] = useState(() => (task ? formFromTask(task) : emptyForm));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  // El TimePicker guarda su hora internamente: al quitarla se vuelve a montar con su key.
  const [clearedTimes, setClearedTimes] = useState({ startTime: 0, endTime: 0 });

  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId);
  const showRecurrence = selectedCategory?.isRecurring || Boolean(form.recurrenceFrequency);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function clearTime(name) {
    setForm((previous) => ({ ...previous, [name]: "" }));
    setClearedTimes((previous) => ({ ...previous, [name]: previous[name] + 1 }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (!form.date) {
      setError("Selecciona una fecha para la tarea");
      return;
    }

    if (form.endTime && !form.startTime) {
      setError("Elige la hora de inicio antes de la de fin");
      return;
    }

    // "HH:mm" se compara bien como texto.
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      setError("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form, task);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar la tarea");
      setSaving(false);
    }
  }

  // El administrador de categorías es un modal propio: la hoja se oculta mientras está abierto
  // (el estado del formulario se conserva) y vuelve al cerrarlo.
  if (managingCategories) {
    return (
      <CategoryManager
        module="tasks"
        categories={categories}
        onClose={() => setManagingCategories(false)}
        onChanged={onCategoriesChanged}
      />
    );
  }

  return (
    <BottomSheet open onClose={onClose} title={isEditing ? "Editar tarea" : "Nueva tarea"} busy={saving}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="task-title" className={styles.label}>Título</label>
          <input
            id="task-title"
            name="title"
            className={styles.input}
            value={form.title}
            onChange={handleChange}
            maxLength={45}
            required
            data-autofocus
          />
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.field}>
          <label htmlFor="task-description" className={styles.label}>Descripción</label>
          <textarea
            id="task-description"
            name="description"
            className={styles.textarea}
            maxLength={2000}
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <CategorySelect
            categories={categories}
            value={form.categoryId}
            inactiveCategory={isEditing ? task.category : null}
            onChange={(categoryId) => setForm((previous) => ({
              ...previous,
              categoryId,
              recurrenceFrequency: categories.find((category) => String(category.id) === categoryId)?.isRecurring
                ? previous.recurrenceFrequency
                : "",
            }))}
            onCreateCategory={() => setManagingCategories(true)}
          />
        </div>

        {showRecurrence && (
          <div className={styles.field}>
            <label htmlFor="task-recurrence-frequency" className={styles.label}>Repetir tarea</label>
            <select
              id="task-recurrence-frequency"
              name="recurrenceFrequency"
              className={styles.select}
              value={form.recurrenceFrequency}
              onChange={handleChange}
            >
              <option value="">No repetir</option>
              {RECURRENCE_FREQUENCIES.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.calendar}>
          <DateCalendar name="date" value={form.date} onChange={handleChange} label="Fecha" required />
        </div>

        <div className={styles.row}>
          {[["startTime", "Hora de inicio"], ["endTime", "Hora de fin"]].map(([name, label]) => (
            <div key={name} className={`${styles.field} ${styles.timeField}`}>
              <TimePicker key={clearedTimes[name]} name={name} value={form[name]} onChange={handleChange} label={label} />
              {form[name] && (
                <button
                  type="button"
                  className={styles.clearTime}
                  onClick={() => clearTime(name)}
                  aria-label={`Quitar ${label.toLowerCase()}`}
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.row}>
          {!isEditing && (
            <div className={styles.field}>
              <label htmlFor="task-duration" className={styles.label}>Duración (min)</label>
              <input
                id="task-duration"
                type="number"
                min="1"
                max="1440"
                name="duration"
                className={styles.input}
                value={form.duration}
                onChange={handleChange}
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="task-priority" className={styles.label}>Prioridad</label>
            <select id="task-priority" name="priority" className={styles.select} value={form.priority} onChange={handleChange}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          {isEditing && (
            <div className={styles.field}>
              <label htmlFor="task-status" className={styles.label}>Estado</label>
              <select id="task-status" name="status" className={styles.select} value={form.status} onChange={handleChange}>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <PillButton type="submit" variant="primary" size="cta" block disabled={saving}>
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear tarea"}
          </PillButton>
          {isEditing && (
            <button type="button" className={styles.textButton} onClick={onClose} disabled={saving}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}

export default TaskFormModal;
