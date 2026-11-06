import { useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import TimePicker from "../../components/TimePicker";
import CategorySelect from "../../components/CategorySelect";
import CategoryManager from "../../components/CategoryManager";
import styles from "../../ui/domain/FormSheet.module.css";

const emptyForm = { name: "", frequency: "", goal: "", categoryId: "", reminderTime: "" };

function formFromHabit(habit) {
  return {
    name: habit.name,
    frequency: habit.frequency,
    goal: habit.goal ?? "",
    categoryId: habit.categoryId ? String(habit.categoryId) : "",
    reminderTime: habit.reminderTime ? habit.reminderTime.slice(0, 5) : "",
  };
}

/**
 * Crear o editar un hábito. Mismos campos y validaciones de la pantalla anterior (Habits.jsx):
 * nombre (100, obligatorio), frecuencia (100, obligatoria), categoría (opcional, con "crear
 * categoría"), recordatorio adicional (solo con categoría recurrente o si ya tenía uno) y meta
 * opcional (entero desde 1). onSubmit(form, habit) guarda y lanza Error si falla.
 * Se monta solo mientras está abierto: el formulario arranca de cero en cada apertura.
 */
function HabitFormModal({ habit, categories, onClose, onSubmit, onCategoriesChanged }) {
  const isEditing = Boolean(habit);
  const [form, setForm] = useState(() => (habit ? formFromHabit(habit) : emptyForm));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  // El TimePicker guarda su hora internamente: al quitarla se vuelve a montar con su key.
  const [clearedTime, setClearedTime] = useState(0);

  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId);
  const showReminder = selectedCategory?.isRecurring || Boolean(form.reminderTime);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function clearReminder() {
    setForm((previous) => ({ ...previous, reminderTime: "" }));
    setClearedTime((previous) => previous + 1);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit(form, habit);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar el hábito");
      setSaving(false);
    }
  }

  // El administrador de categorías es un modal propio: la hoja se oculta mientras está abierto
  // (el estado del formulario se conserva) y vuelve al cerrarlo.
  if (managingCategories) {
    return (
      <CategoryManager
        module="habits"
        categories={categories}
        onClose={() => setManagingCategories(false)}
        onChanged={onCategoriesChanged}
      />
    );
  }

  return (
    <BottomSheet open onClose={onClose} title={isEditing ? "Editar hábito" : "Nuevo hábito"} busy={saving}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="habit-name" className={styles.label}>Nombre del hábito</label>
          <input
            id="habit-name"
            name="name"
            className={styles.input}
            value={form.name}
            onChange={handleChange}
            maxLength={100}
            required
            data-autofocus
          />
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.field}>
          <label htmlFor="habit-frequency" className={styles.label}>Frecuencia</label>
          <input
            id="habit-frequency"
            name="frequency"
            className={styles.input}
            value={form.frequency}
            onChange={handleChange}
            maxLength={100}
            required
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <CategorySelect
            categories={categories}
            value={form.categoryId}
            inactiveCategory={isEditing ? habit.category : null}
            onChange={(categoryId) => {
              const recurring = categories.find((category) => String(category.id) === categoryId)?.isRecurring;
              if (!recurring && form.reminderTime) setClearedTime((previous) => previous + 1);
              setForm((previous) => ({ ...previous, categoryId, reminderTime: recurring ? previous.reminderTime : "" }));
            }}
            onCreateCategory={() => setManagingCategories(true)}
          />
        </div>

        {showReminder && (
          <div className={`${styles.field} ${styles.timeField}`}>
            <TimePicker
              key={clearedTime}
              name="reminderTime"
              value={form.reminderTime}
              onChange={handleChange}
              label="Recordatorio adicional (opcional)"
            />
            {form.reminderTime && (
              <button type="button" className={styles.clearTime} onClick={clearReminder} aria-label="Quitar recordatorio">
                Quitar
              </button>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="habit-goal" className={styles.label}>Meta (opcional)</label>
          <input
            id="habit-goal"
            type="number"
            name="goal"
            className={styles.input}
            value={form.goal}
            onChange={handleChange}
            min="1"
            step="1"
          />
        </div>

        <div className={styles.actions}>
          <PillButton type="submit" variant="primary" size="cta" block disabled={saving}>
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear hábito"}
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

export default HabitFormModal;
