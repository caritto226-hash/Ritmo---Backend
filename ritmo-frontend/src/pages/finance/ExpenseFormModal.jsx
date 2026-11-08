import { useEffect, useRef, useState } from "react";
import BottomSheet from "../../ui/primitives/BottomSheet";
import PillButton from "../../ui/primitives/PillButton";
import CategorySelect from "../../components/CategorySelect";
import CategoryManager from "../../components/CategoryManager";
import DateCalendar from "../../components/DateCalendar";
import expensesService from "../../services/expenses.service";
import { formatAmountDigits, formatDayMonth, frequencyLabels, getTodayDate } from "../../utils/financeFormat";
import cx from "../../ui/cx";
import formStyles from "../../ui/domain/FormSheet.module.css";
import styles from "./ExpenseFormModal.module.css";

const emptyForm = { concept: "", categoryId: "", amount: "", expense_date: "", notes: "" };
const recurrenceFrequencies = [
  ["daily", "Diaria"],
  ["weekly", "Semanal"],
  ["monthly", "Mensual"],
  ["yearly", "Anual"],
];

// Los montos son pesos enteros; coincide con el máximo que se permite registrar.
const MAX_AMOUNT = 99999999;
// Al pegar solo se aceptan cifras simples ("1500000") o con puntos de miles bien puestos ("1.500.000").
const PASTED_AMOUNT_PATTERN = /^(\d+|\d{1,3}(\.\d{3})+)$/;
const AMOUNT_FORMAT_ERROR = "El valor debe ser un número entero de pesos, sin comas ni decimales.";

// La sugerencia de categoría se pide al crear, con 3 caracteres o más y 400 ms después de dejar de escribir.
const SUGGESTION_MIN_LENGTH = 3;
const SUGGESTION_DELAY_MS = 400;

// "1.500.000" → 1500000. El signo no viene del campo: lo pone el selector Gasto / Ingreso.
function parseCopAmount(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : NaN;
}

function formatCopInput(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return formatAmountDigits(String(Math.round(Math.abs(amount))));
}

function formFrom(item, withDate) {
  return {
    concept: item.concept,
    categoryId: String(item.categoryId),
    amount: formatCopInput(item.amount),
    expense_date: withDate && item.expenseDate ? item.expenseDate.slice(0, 10) : "",
    notes: item.notes || "",
  };
}

/**
 * Crear o editar un movimiento, o editar un recurrente. Misma lógica de la pantalla anterior
 * (Expenses.jsx): monto con puntos de miles (rechaza comas, decimales y signos, también al pegar),
 * tipo Gasto / Ingreso, sugerencia de categoría por ML al crear (400 ms de espera y AbortController;
 * nunca cambia una categoría elegida a mano), casilla "Programar como pago o ingreso fijo" con su
 * frecuencia (solo con categorías recurrentes) y edición de recurrente (solo concepto, categoría,
 * monto y notas). Se monta solo mientras está abierto.
 * mode: { expense } (editar movimiento) | { recurrence } (editar recurrente) |
 * { type: "expense" | "income", recurring } (crear). onSubmit(request) guarda y lanza Error si falla.
 */
function ExpenseFormModal({ mode, categories, onClose, onSubmit, onCategoriesChanged }) {
  const editingExpense = mode.expense || null;
  const editingRecurrence = mode.recurrence || null;
  const editingItem = editingExpense || editingRecurrence;
  const isCreating = !editingItem;

  const [form, setForm] = useState(() => (editingItem ? formFrom(editingItem, Boolean(editingExpense)) : emptyForm));
  const [movementType, setMovementType] = useState(() => (
    editingItem ? (Number(editingItem.amount) > 0 ? "income" : "expense") : mode.type || "expense"
  ));
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(() => (
    isCreating && Boolean(mode.recurring) && categories.some((category) => category.isRecurring && category.isActive !== false)
  ));
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");
  const [amountTouched, setAmountTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  // De dónde salió la categoría al crear: "" (ninguna), "suggested" o "manual". El ref se lee
  // cuando llega la respuesta de la sugerencia, que puede llegar después de otros cambios.
  const [categorySource, setCategorySource] = useState("");
  const categorySourceRef = useRef("");
  // Cada cambio del concepto invalida las sugerencias que aún no han llegado.
  const suggestionRequestRef = useRef(0);

  const originalAmount = editingItem ? Number(editingItem.amount) : null;
  const selectedCategory = categories.find((category) => String(category.id) === form.categoryId);

  useEffect(() => {
    categorySourceRef.current = categorySource;
  }, [categorySource]);

  // Sugerencia de categoría mientras se escribe el concepto, solo al crear. Nunca cambia el tipo
  // de movimiento, y si falla o no hay sugerencia el formulario sigue como siempre.
  useEffect(() => {
    if (!isCreating) return undefined;

    const requestId = suggestionRequestRef.current + 1;
    suggestionRequestRef.current = requestId;
    const concept = form.concept.trim();

    // Solo quita la categoría si la puso la sugerencia; una elegida a mano no se toca.
    function clearSuggestedCategory() {
      if (categorySourceRef.current !== "suggested") return;
      setCategorySource("");
      setForm((previous) => ({ ...previous, categoryId: "" }));
    }

    if (concept.length < SUGGESTION_MIN_LENGTH) {
      clearSuggestedCategory();
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let suggestion = null;
      try {
        suggestion = await expensesService.suggestCategory(concept, controller.signal);
      } catch {
        // Sin sugerencia: no se muestra ningún error.
      }

      // Se ignora si la persona siguió escribiendo o ya eligió una categoría a mano.
      if (requestId !== suggestionRequestRef.current || categorySourceRef.current === "manual") return;

      // Con "Programar como pago fijo" marcado, solo sirven categorías que permiten recurrencia.
      const category = suggestion && categories.find((item) => (
        item.id === suggestion.categoryId
        && item.isActive !== false
        && (!recurrenceEnabled || item.isRecurring)
      ));
      if (category) {
        setCategorySource("suggested");
        setForm((previous) => ({ ...previous, categoryId: String(category.id) }));
      } else {
        clearSuggestedCategory();
      }
    }, SUGGESTION_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.concept, isCreating, categories, recurrenceEnabled]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function handleAmountChange(event) {
    // Los puntos son los separadores de miles que pone el propio campo; cualquier otro carácter se rechaza.
    if (/[^\d.]/.test(event.target.value)) {
      setError(AMOUNT_FORMAT_ERROR);
      return;
    }
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setForm((previous) => ({ ...previous, amount: formatAmountDigits(digits) }));
    setAmountTouched(true);
    setError("");
  }

  // Bloquea coma, punto y signos desde el teclado: sin esto, "1500,50" terminaría siendo 150050.
  function handleAmountKeyDown(event) {
    if ([",", ".", "-", "+", "e", "E"].includes(event.key)) {
      event.preventDefault();
      setError(AMOUNT_FORMAT_ERROR);
    }
  }

  // Un texto pegado como "1.500,50" o "1500.50" se rechaza en lugar de convertirse en 150050.
  function handleAmountPaste(event) {
    const pasted = event.clipboardData.getData("text").trim().replace(/^\$\s*/, "");
    if (!PASTED_AMOUNT_PATTERN.test(pasted)) {
      event.preventDefault();
      setError(AMOUNT_FORMAT_ERROR);
    }
  }

  function selectType(type) {
    setMovementType(type);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (!form.categoryId) {
      setError("Selecciona una categoría para el movimiento.");
      return;
    }

    // El valor del campo siempre es positivo; el selector decide si se guarda como gasto (-) o ingreso (+).
    const absoluteAmount = editingItem && !amountTouched ? Math.abs(originalAmount) : parseCopAmount(form.amount);
    if (!Number.isFinite(absoluteAmount) || absoluteAmount === 0) {
      setError("Escribe un valor mayor que cero.");
      return;
    }
    if (absoluteAmount > MAX_AMOUNT) {
      setError("El valor no puede superar $ 99.999.999.");
      return;
    }

    const amount = movementType === "expense" ? -absoluteAmount : absoluteAmount;
    const categoryId = Number(form.categoryId);
    let request;
    if (editingRecurrence) {
      request = {
        kind: "updateRecurrence",
        id: editingRecurrence.recurrenceId,
        payload: { concept: form.concept, categoryId, amount, notes: form.notes || null },
      };
    } else if (recurrenceEnabled && isCreating) {
      request = {
        kind: "createRecurrence",
        payload: {
          concept: form.concept,
          categoryId,
          amount,
          frequency: recurrenceFrequency,
          startDate: form.expense_date || getTodayDate(),
          notes: form.notes || null,
        },
      };
    } else {
      request = {
        kind: editingExpense ? "update" : "create",
        id: editingExpense?.id,
        payload: {
          concept: form.concept,
          categoryId,
          amount,
          expense_date: form.expense_date || undefined,
          notes: form.notes || null,
        },
      };
    }

    setSaving(true);
    try {
      await onSubmit(request);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar el movimiento");
      setSaving(false);
    }
  }

  // El administrador de categorías es un modal propio: la hoja se oculta mientras está abierto
  // (el estado del formulario se conserva) y vuelve al cerrarlo.
  if (managingCategories) {
    return (
      <CategoryManager
        module="finance"
        categories={categories}
        onClose={() => setManagingCategories(false)}
        onChanged={onCategoriesChanged}
      />
    );
  }

  const title = editingRecurrence ? "Editar recurrente" : editingExpense ? "Editar movimiento" : "Nuevo movimiento";

  return (
    <BottomSheet open onClose={onClose} title={title} busy={saving}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        {error && <p className={formStyles.error} role="alert">{error}</p>}

        <div className={formStyles.field}>
          <label htmlFor="expense-concept" className={formStyles.label}>Concepto</label>
          <input
            id="expense-concept"
            name="concept"
            className={formStyles.input}
            value={form.concept}
            onChange={handleChange}
            maxLength={100}
            required
            data-autofocus
          />
        </div>

        <div className={formStyles.field}>
          <div className={styles.labelRow}>
            <span className={formStyles.label}>Categoría</span>
            <span aria-live="polite">
              {categorySource === "suggested" && form.categoryId && <span className={styles.suggested}>Sugerida</span>}
            </span>
          </div>
          <CategorySelect
            categories={editingRecurrence ? categories.filter((category) => category.isRecurring) : categories}
            value={form.categoryId}
            onChange={(categoryId) => {
              const picked = categories.find((category) => String(category.id) === categoryId);
              // Elegida a mano: ninguna sugerencia posterior la cambia.
              setCategorySource("manual");
              setForm((previous) => ({ ...previous, categoryId }));
              if (!picked?.isRecurring) setRecurrenceEnabled(false);
              setError("");
            }}
            inactiveCategory={editingItem?.category || null}
            onCreateCategory={() => setManagingCategories(true)}
          />
        </div>

        <div className={formStyles.field}>
          <span className={formStyles.label} id="movement-type-label">Tipo de movimiento</span>
          <div className={styles.typeToggle} role="group" aria-labelledby="movement-type-label">
            <button
              type="button"
              className={styles.typeOption}
              aria-pressed={movementType === "expense"}
              onClick={() => selectType("expense")}
            >
              Gasto
            </button>
            <button
              type="button"
              className={cx(styles.typeOption, styles.income)}
              aria-pressed={movementType === "income"}
              onClick={() => selectType("income")}
            >
              Ingreso
            </button>
          </div>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="expense-amount" className={formStyles.label}>Valor (COP)</label>
          <input
            id="expense-amount"
            type="text"
            inputMode="numeric"
            name="amount"
            className={formStyles.input}
            value={form.amount}
            onChange={handleAmountChange}
            onKeyDown={handleAmountKeyDown}
            onPaste={handleAmountPaste}
            placeholder="0"
            autoComplete="off"
            required
            aria-describedby="expense-amount-hint"
          />
          <span id="expense-amount-hint" className={styles.hint}>Pesos enteros, sin decimales. Máximo 99.999.999.</span>
        </div>

        {editingRecurrence ? (
          <p className={styles.recurrenceInfo}>
            {frequencyLabels[editingRecurrence.frequency] || editingRecurrence.frequency}
            {editingRecurrence.isActive && ` · próxima ${formatDayMonth(editingRecurrence.nextScheduledDate)}`}
            <span className={styles.hint}>Los cambios aplican desde el próximo pago; lo ya registrado no cambia.</span>
          </p>
        ) : (
          <div className={formStyles.calendar}>
            <DateCalendar
              key={form.expense_date || "empty"}
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              label="Fecha"
              onClear={() => handleChange({ target: { name: "expense_date", value: "" } })}
            />
          </div>
        )}

        {isCreating && selectedCategory?.isRecurring && (
          <div className={styles.recurrence}>
            <label className={formStyles.checkbox}>
              <input
                type="checkbox"
                checked={recurrenceEnabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setRecurrenceEnabled(enabled);
                  if (enabled && !form.expense_date) {
                    setForm((previous) => ({ ...previous, expense_date: getTodayDate() }));
                  }
                }}
              />
              <span>Programar como pago o ingreso fijo</span>
            </label>
            {recurrenceEnabled && (
              <div className={formStyles.field}>
                <label htmlFor="expense-recurrence-frequency" className={formStyles.label}>Frecuencia del recordatorio</label>
                <select
                  id="expense-recurrence-frequency"
                  className={formStyles.select}
                  value={recurrenceFrequency}
                  onChange={(event) => setRecurrenceFrequency(event.target.value)}
                >
                  {recurrenceFrequencies.map(([frequency, label]) => (
                    <option value={frequency} key={frequency}>{label}</option>
                  ))}
                </select>
                <span className={styles.hint}>
                  La primera fecha será la fecha indicada arriba. El movimiento se crea solo al confirmarlo.
                </span>
              </div>
            )}
          </div>
        )}

        <div className={formStyles.field}>
          <label htmlFor="expense-notes" className={formStyles.label}>Notas</label>
          <textarea
            id="expense-notes"
            name="notes"
            className={formStyles.textarea}
            value={form.notes}
            onChange={handleChange}
            maxLength={2000}
          />
        </div>

        <div className={formStyles.actions}>
          <PillButton type="submit" variant="primary" size="cta" block disabled={saving}>
            {saving ? "Guardando…" : editingItem ? "Guardar cambios" : "Guardar movimiento"}
          </PillButton>
          {editingItem && (
            <button type="button" className={formStyles.textButton} onClick={onClose} disabled={saving}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}

export default ExpenseFormModal;
