import { useCallback, useEffect, useRef, useState } from "react";
import expensesService from "../../services/expenses.service";
import categoriesService from "../../services/categories.service";
import { getTodayDate } from "../../utils/financeFormat";
import { usePageState } from "../../ui/shell/ShellContext";

// Fuentes de Finanzas. GET /expenses trae todos los movimientos: el mes, la semana, los chips y
// la búsqueda se calculan en el cliente (financeSelectors.js).
const SOURCES = {
  expenses: { load: () => expensesService.getAll(), empty: [] },
  summary: { load: expensesService.getMonthlySummary, empty: null },
  reminders: { load: expensesService.getRecurrenceReminders, empty: [] },
  recurrences: { load: expensesService.getRecurrences, empty: [] },
  categories: { load: () => categoriesService.getAll("finance"), empty: [] },
};

const ALL_SOURCES = Object.keys(SOURCES);
// Lo que cambia al confirmar, detener o eliminar un recurrente, o al borrar un movimiento que vino
// de uno (el backend deshace la confirmación y el recordatorio vuelve a quedar pendiente).
const MONEY_SOURCES = ["expenses", "summary", "reminders", "recurrences"];

const initialData = Object.fromEntries(ALL_SOURCES.map((key) => [key, SOURCES[key].empty]));

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

/**
 * Datos reales de Finanzas (movimientos, resumen del mes, recordatorios, recurrentes y categorías)
 * con sus mutaciones. Todas las acciones comparten un bloqueo contra doble clic: mientras una
 * está en curso, las demás se ignoran (devuelven false). Después de cada mutación se vuelven a
 * pedir los datos a la API; nada se oculta solo en el cliente. notify(message, type) muestra el
 * aviso del shell con los mismos textos de la pantalla anterior.
 */
export default function useFinance({ notify } = {}) {
  const [data, setData] = usePageState("data:finance", initialData);
  const [loading, setLoading] = usePageState("data:finance-loading", true);
  // Ya cargado en esta visita a la ruta: la página se volvió a montar al cruzar los 760 px.
  const restoredRef = useRef(!loading);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const activeRef = useRef(true);
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // Devuelve false si alguna fuente falló (los datos que sí llegaron se aplican igual).
  const load = useCallback(async (keys = ALL_SOURCES) => {
    const results = await Promise.allSettled(keys.map((key) => SOURCES[key].load()));
    if (!activeRef.current) return false;
    const loaded = {};
    let failedError = null;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") loaded[keys[index]] = result.value ?? SOURCES[keys[index]].empty;
      else failedError ??= result.reason;
    });
    setData((current) => ({ ...current, ...loaded }));
    setLoading(false);
    if (failedError) notifyRef.current?.(apiMessage(failedError, "No se pudieron cargar las finanzas"), "error");
    return !failedError;
  }, [setData, setLoading]);

  useEffect(() => {
    activeRef.current = true;
    if (!restoredRef.current) load();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible" && !busyRef.current) load(MONEY_SOURCES);
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeRef.current = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  // Bloqueo compartido: una acción a la vez.
  async function exclusive(action) {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  /**
   * Guarda lo que arma ExpenseFormModal. request: { kind, id?, payload }, con kind
   * "create" | "update" (movimiento), "createRecurrence" o "updateRecurrence" (solo concepto,
   * categoría, monto y notas). Lanza Error con el mensaje para que el formulario lo muestre.
   */
  async function saveMovement(request) {
    const done = await exclusive(async () => {
      try {
        if (request.kind === "updateRecurrence") await expensesService.updateRecurrence(request.id, request.payload);
        else if (request.kind === "createRecurrence") await expensesService.createRecurrence(request.payload);
        else if (request.kind === "update") await expensesService.update(request.id, request.payload);
        else await expensesService.create(request.payload);
      } catch (saveError) {
        throw new Error(apiMessage(saveError, "No se pudo guardar el movimiento"), { cause: saveError });
      }
      if (request.kind === "updateRecurrence") notifyRef.current?.("Recurrente actualizado. Los pagos ya registrados no cambian.");
      if (request.kind === "createRecurrence") notifyRef.current?.("Recurrente creado. Aparecerá para confirmar 2 días antes de su fecha.");
      await load(MONEY_SOURCES);
      return true;
    });
    if (!done) throw new Error("Espera a que termine la acción anterior.");
  }

  async function deleteMovement(expense) {
    return exclusive(async () => {
      try {
        await expensesService.remove(expense.id);
      } catch (deleteError) {
        notifyRef.current?.(apiMessage(deleteError, "No se pudo eliminar el movimiento"), "error");
        return false;
      }
      notifyRef.current?.("Movimiento eliminado.");
      await load(MONEY_SOURCES);
      return true;
    });
  }

  async function duplicateMovement(expense) {
    return exclusive(async () => {
      try {
        await expensesService.create({
          // 92 + " (copia)" = 100, el máximo que admite el concepto.
          concept: `${expense.concept.slice(0, 92)} (copia)`,
          categoryId: expense.categoryId,
          amount: Number(expense.amount),
          expense_date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : undefined,
          notes: expense.notes || null,
        });
      } catch {
        notifyRef.current?.("No se pudo duplicar el movimiento", "error");
        return false;
      }
      await load(MONEY_SOURCES);
      return true;
    });
  }

  // Confirma por occurrenceId (no recurrenceId) con la fecha real: Hoy, Ayer u Otra, nunca futura
  // (hora de Bogotá). Luego vuelve a pedir /reminders: la tarjeta desaparece porque la API ya no
  // la devuelve. Devuelve true si se confirmó, para que la hoja se cierre solo en ese caso.
  async function confirmReminder(reminder, paidDate) {
    return exclusive(async () => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate || "") || paidDate > getTodayDate()) {
        notifyRef.current?.("No se pudo confirmar el recordatorio", "error");
        return false;
      }
      try {
        await expensesService.confirmRecurrenceOccurrence(reminder.occurrenceId, paidDate);
      } catch (confirmError) {
        notifyRef.current?.(apiMessage(confirmError, "No se pudo confirmar el recordatorio"), "error");
        // Si ya estaba confirmado (409), la lista se actualiza para que deje de aparecer.
        await load(MONEY_SOURCES);
        return false;
      }
      notifyRef.current?.(`${Number(reminder.amount) > 0 ? "Ingreso recibido" : "Pago registrado"} en Movimientos.`);
      await load(MONEY_SOURCES);
      return true;
    });
  }

  // Detener = scope "future" (los vencidos siguen confirmables); Eliminar = scope "all".
  // La confirmación se pide en la hoja antes de llegar aquí.
  async function cancelRecurrence(item, scope) {
    return exclusive(async () => {
      try {
        await expensesService.cancelRecurrence(item.recurrenceId, scope);
      } catch (cancelError) {
        notifyRef.current?.(apiMessage(cancelError, "No se pudo eliminar la recurrencia"), "error");
        return false;
      }
      notifyRef.current?.(scope === "future" ? "Se detuvieron las próximas fechas." : "Recurrente eliminado.");
      await load(MONEY_SOURCES);
      return true;
    });
  }

  // Después de crear o editar categorías se recargan también los movimientos (traen nombre y color).
  async function reloadCategories() {
    await load(ALL_SOURCES);
  }

  return {
    ...data,
    loading,
    busy,
    saveMovement,
    deleteMovement,
    duplicateMovement,
    confirmReminder,
    cancelRecurrence,
    reloadCategories,
  };
}
