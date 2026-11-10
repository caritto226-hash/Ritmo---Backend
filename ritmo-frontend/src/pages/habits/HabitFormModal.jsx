import { useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import Chip from "../../ui/primitives/Chip";
import TimePicker from "../../components/TimePicker";
import CategorySelect from "../../components/CategorySelect";
import CategoryManager from "../../components/CategoryManager";
import {
  ALL_DAYS,
  DAY_LETTERS,
  DAY_NAMES,
  GOAL_LIMITS,
  MAX_UNIT_LENGTH,
  MINUTE_PRESETS,
  UNIT_PRESETS,
  WEEKDAYS,
  getGoalType,
  getUnitPreset,
} from "../../hooks/data/habitSelectors";
import styles from "../../ui/domain/FormSheet.module.css";
import own from "./HabitFormModal.module.css";

const GOAL_TYPES = [
  { value: "check", label: "Solo marcar", hint: "Lo marcas como hecho cada día." },
  { value: "count", label: "Cantidad", hint: "Sumas de a uno hasta tu meta del día." },
  { value: "duration", label: "Tiempo", hint: "Registras los minutos que le dedicas cada día." },
];

const OTHER_UNIT = "other";

const emptyForm = {
  name: "",
  days: ALL_DAYS,
  goalType: "check",
  goal: "",
  unitChoice: "",
  unitText: "",
  categoryId: "",
  reminderTime: "",
};

function formFromHabit(habit) {
  const goalType = getGoalType(habit);
  const preset = getUnitPreset(habit.unit);
  return {
    name: habit.name,
    days: habit.days?.length ? habit.days : ALL_DAYS,
    goalType,
    goal: goalType === "check" ? "" : String(habit.goal ?? ""),
    unitChoice: preset ? preset.many : habit.unit ? OTHER_UNIT : "",
    unitText: preset ? "" : habit.unit ?? "",
    categoryId: habit.categoryId ? String(habit.categoryId) : "",
    reminderTime: habit.reminderTime ? habit.reminderTime.slice(0, 5) : "",
  };
}

const sameDays = (a, b) => a.length === b.length && a.every((day) => b.includes(day));

// noValidate en el formulario: los mensajes salen en la caja de error, en español y en un solo lugar.
function validate(form) {
  if (!form.name.trim()) return "Escribe el nombre del hábito.";
  if (form.days.length === 0) return "Elige al menos un día de la semana.";
  if (form.goalType === "check") return "";
  const max = GOAL_LIMITS[form.goalType];
  const goal = Number(form.goal);
  if (form.goal === "" || !Number.isInteger(goal) || goal < 1 || goal > max) {
    return form.goalType === "count"
      ? `La meta diaria debe ser un número entero entre 1 y ${max}.`
      : `Los minutos al día deben ser un número entero entre 1 y ${max}.`;
  }
  if (form.goalType === "count" && form.unitChoice === OTHER_UNIT && !form.unitText.trim()) {
    return "Escribe la unidad o elige una de la lista.";
  }
  return "";
}

/**
 * Crear o editar un hábito (Hábitos v2). Nombre (100, obligatorio); días de la semana con chips
 * L M X J V S D y los atajos "Todos los días" y "Lunes a viernes" (al menos uno); "¿Cómo mides
 * este hábito?": Solo marcar, Cantidad (meta 1–999 y unidad opcional: vasos, páginas, veces u
 * otra en texto libre de hasta 20) o Tiempo (minutos 1–1440, con atajos de 15 a 60); categoría
 * (opcional, con "crear categoría") y recordatorio adicional (solo con categoría recurrente o si
 * ya tenía uno). onSubmit(values, habit) guarda y lanza Error si falla.
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
  const daysChanged = isEditing && habit.days?.length > 0 && !sameDays(form.days, habit.days);
  const goalTypeHint = GOAL_TYPES.find((type) => type.value === form.goalType).hint;

  function update(changes) {
    setForm((previous) => ({ ...previous, ...changes }));
    setError("");
  }

  function handleChange(event) {
    update({ [event.target.name]: event.target.value });
  }

  function toggleDay(day) {
    const days = form.days.includes(day) ? form.days.filter((value) => value !== day) : [...form.days, day];
    update({ days: days.sort((a, b) => a - b) });
  }

  function clearReminder() {
    update({ reminderTime: "" });
    setClearedTime((previous) => previous + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const invalid = validate(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        days: form.days,
        goalType: form.goalType,
        goal: form.goal,
        unit: form.unitChoice === OTHER_UNIT ? form.unitText : form.unitChoice,
        categoryId: form.categoryId,
        reminderTime: form.reminderTime,
      }, habit);
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
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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

        <div className={styles.field} role="group" aria-labelledby="habit-days-label">
          <span id="habit-days-label" className={styles.label}>¿Qué días?</span>
          <div className={own.days}>
            {DAY_LETTERS.map((letter, index) => {
              const day = index + 1;
              return (
                <Chip
                  key={day}
                  className={own.day}
                  selected={form.days.includes(day)}
                  aria-label={DAY_NAMES[index]}
                  onClick={() => toggleDay(day)}
                >
                  {letter}
                </Chip>
              );
            })}
          </div>
          <div className={own.chips}>
            <Chip selected={sameDays(form.days, ALL_DAYS)} onClick={() => update({ days: ALL_DAYS })}>
              Todos los días
            </Chip>
            <Chip selected={sameDays(form.days, WEEKDAYS)} onClick={() => update({ days: WEEKDAYS })}>
              Lunes a viernes
            </Chip>
          </div>
          {daysChanged && <p className={own.hint}>Al cambiar los días se recalculan tu racha y tu historial.</p>}
        </div>

        <div className={styles.field} role="group" aria-labelledby="habit-type-label">
          <span id="habit-type-label" className={styles.label}>¿Cómo mides este hábito?</span>
          <div className={own.chips}>
            {GOAL_TYPES.map((type) => (
              <Chip key={type.value} selected={form.goalType === type.value} onClick={() => update({ goalType: type.value })}>
                {type.label}
              </Chip>
            ))}
          </div>
          <p className={own.hint}>{goalTypeHint}</p>
        </div>

        {form.goalType === "count" && (
          <div className={own.measure}>
            <div className={styles.field}>
              <label htmlFor="habit-goal" className={styles.label}>Meta diaria</label>
              <input
                id="habit-goal"
                type="number"
                name="goal"
                inputMode="numeric"
                className={`${styles.input} ${own.goalInput}`}
                value={form.goal}
                onChange={handleChange}
                min="1"
                max={GOAL_LIMITS.count}
                step="1"
                required
              />
            </div>
            <div className={styles.field} role="group" aria-labelledby="habit-unit-label">
              <span id="habit-unit-label" className={styles.label}>Unidad (opcional)</span>
              <div className={own.chips}>
                {UNIT_PRESETS.map((preset) => (
                  <Chip
                    key={preset.many}
                    className={own.boxChip}
                    selected={form.unitChoice === preset.many}
                    onClick={() => update({ unitChoice: form.unitChoice === preset.many ? "" : preset.many })}
                  >
                    {preset.many}
                  </Chip>
                ))}
                <Chip
                  className={own.boxChip}
                  selected={form.unitChoice === OTHER_UNIT}
                  onClick={() => update({ unitChoice: form.unitChoice === OTHER_UNIT ? "" : OTHER_UNIT })}
                >
                  Otra
                </Chip>
              </div>
            </div>
            {form.unitChoice === OTHER_UNIT && (
              <div className={styles.field}>
                <label htmlFor="habit-unit" className={styles.label}>Escribe la unidad en plural</label>
                <input
                  id="habit-unit"
                  name="unitText"
                  className={styles.input}
                  value={form.unitText}
                  onChange={handleChange}
                  maxLength={MAX_UNIT_LENGTH}
                  placeholder="Por ejemplo: tazas"
                />
              </div>
            )}
          </div>
        )}

        {form.goalType === "duration" && (
          <div className={own.measure}>
            <div className={styles.field} role="group" aria-labelledby="habit-minutes-label">
              <span id="habit-minutes-label" className={styles.label}>Minutos al día</span>
              <div className={own.chips}>
                {MINUTE_PRESETS.map((minutes) => (
                  <Chip
                    key={minutes}
                    className={own.boxChip}
                    selected={form.goal === String(minutes)}
                    aria-label={`${minutes} minutos`}
                    onClick={() => update({ goal: String(minutes) })}
                  >
                    {minutes}
                  </Chip>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="habit-minutes" className={styles.label}>U otra cantidad de minutos</label>
              <input
                id="habit-minutes"
                type="number"
                name="goal"
                inputMode="numeric"
                className={`${styles.input} ${own.goalInput}`}
                value={form.goal}
                onChange={handleChange}
                min="1"
                max={GOAL_LIMITS.duration}
                step="1"
                required
              />
            </div>
          </div>
        )}

        <div className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <CategorySelect
            categories={categories}
            value={form.categoryId}
            inactiveCategory={isEditing ? habit.category : null}
            onChange={(categoryId) => {
              const recurring = categories.find((category) => String(category.id) === categoryId)?.isRecurring;
              if (!recurring && form.reminderTime) setClearedTime((previous) => previous + 1);
              update({ categoryId, reminderTime: recurring ? form.reminderTime : "" });
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
