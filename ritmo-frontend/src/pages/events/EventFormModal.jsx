import { useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import DateCalendar from "../../components/DateCalendar";
import TimePicker from "../../components/TimePicker";
import CategorySelect from "../../components/CategorySelect";
import CategoryManager from "../../components/CategoryManager";
import { RECURRENCE_FREQUENCIES } from "../../constants/recurrence";
import styles from "../../ui/domain/FormSheet.module.css";

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  allDay: false,
  duration: "",
  location: "",
  categoryId: "",
  recurrenceFrequency: "",
};

// La API devuelve la hora como "HH:mm:ss"; el TimePicker trabaja con "HH:mm".
function formatTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

function formFromEvent(event) {
  return {
    title: event.title,
    description: event.description || "",
    event_date: event.eventDate ? event.eventDate.slice(0, 10) : "",
    event_time: formatTime(event.eventTime),
    allDay: !event.eventTime,
    duration: event.duration || "",
    location: event.location || "",
    categoryId: event.categoryId ? String(event.categoryId) : "",
    recurrenceFrequency: event.recurrenceFrequency || "",
  };
}

/**
 * Crear o editar un evento. Mismos campos y validaciones de la pantalla anterior (Events.jsx):
 * título (150), categoría (opcional, con "crear categoría"), repetir (solo con categoría
 * recurrente), descripción opcional (2000), fecha obligatoria, "Todo el día" o la hora con el
 * TimePicker (obligatoria si no es todo el día), duración opcional (1–1440 min, no aplica a todo
 * el día) y ubicación opcional (150). onSubmit(form, event) guarda y lanza Error si falla.
 * Se monta solo mientras está abierto: el formulario arranca de cero en cada apertura.
 */
function EventFormModal({ event, categories, onClose, onSubmit, onCategoriesChanged }) {
  const isEditing = Boolean(event);
  const [form, setForm] = useState(() => (event ? formFromEvent(event) : emptyForm));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);

  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId);
  const showRecurrence = selectedCategory?.isRecurring || Boolean(form.recurrenceFrequency);

  function handleChange(changeEvent) {
    const { name, value } = changeEvent.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  // Al marcar todo el día se limpian la hora y la duración, que dejan de aplicar.
  function handleAllDay(changeEvent) {
    const allDay = changeEvent.target.checked;
    setForm((previous) => ({
      ...previous,
      allDay,
      event_time: allDay ? "" : previous.event_time,
      duration: allDay ? "" : previous.duration,
    }));
    setError("");
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;

    if (!form.event_date) {
      setError("Selecciona una fecha para el evento");
      return;
    }

    if (!form.allDay && !form.event_time) {
      setError("Selecciona una hora o marca «Todo el día»");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form, event);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar el evento");
      setSaving(false);
    }
  }

  // El administrador de categorías es un modal propio: la hoja se oculta mientras está abierto
  // (el estado del formulario se conserva) y vuelve al cerrarlo.
  if (managingCategories) {
    return (
      <CategoryManager
        module="events"
        categories={categories}
        onClose={() => setManagingCategories(false)}
        onChanged={onCategoriesChanged}
      />
    );
  }

  return (
    <BottomSheet open onClose={onClose} title={isEditing ? "Editar evento" : "Nuevo evento"} busy={saving}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="event-title" className={styles.label}>Título</label>
          <input
            id="event-title"
            name="title"
            className={styles.input}
            value={form.title}
            onChange={handleChange}
            maxLength={150}
            required
            data-autofocus
          />
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <CategorySelect
            categories={categories}
            value={form.categoryId}
            inactiveCategory={isEditing ? event.category : null}
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
            <label htmlFor="event-recurrence-frequency" className={styles.label}>Repetir evento</label>
            <select
              id="event-recurrence-frequency"
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

        <div className={styles.field}>
          <label htmlFor="event-description" className={styles.label}>Descripción (opcional)</label>
          <textarea
            id="event-description"
            name="description"
            className={styles.textarea}
            maxLength={2000}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className={styles.calendar}>
          <DateCalendar name="event_date" value={form.event_date} onChange={handleChange} label="Fecha" required />
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" checked={form.allDay} onChange={handleAllDay} />
          <span>Todo el día</span>
        </label>

        {!form.allDay && (
          <div className={`${styles.field} ${styles.timeField}`}>
            <TimePicker name="event_time" value={form.event_time} onChange={handleChange} label="Hora" required />
          </div>
        )}

        <div className={styles.row}>
          {!form.allDay && (
            <div className={styles.field}>
              <label htmlFor="event-duration" className={styles.label}>Duración en minutos (opcional)</label>
              <input
                id="event-duration"
                type="number"
                min="1"
                max="1440"
                step="1"
                name="duration"
                className={styles.input}
                value={form.duration}
                onChange={handleChange}
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="event-location" className={styles.label}>Ubicación (opcional)</label>
            <input
              id="event-location"
              name="location"
              className={styles.input}
              value={form.location}
              onChange={handleChange}
              maxLength={150}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <PillButton type="submit" variant="primary" size="cta" block disabled={saving}>
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear evento"}
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

export default EventFormModal;
