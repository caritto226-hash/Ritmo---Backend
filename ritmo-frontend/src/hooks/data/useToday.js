import { useCallback, useEffect, useRef, useState } from "react";
import tasksService from "../../services/tasks.service";
import eventsService from "../../services/events.service";
import habitsService from "../../services/habits.service";
import expensesService from "../../services/expenses.service";
import { isHabitDone, isTaskDone } from "./todaySelectors";
import { usePageState } from "../../ui/shell/ShellContext";

// Fuentes del Inicio. Ningún GET acepta filtro de fechas: el día, la semana y el mes
// se calculan en el cliente (ver todaySelectors.js).
const SOURCES = {
  tasks: { load: tasksService.getAll, label: "tareas", empty: [] },
  events: { load: eventsService.getAll, label: "eventos", empty: [] },
  habits: { load: habitsService.getAll, label: "hábitos", empty: [] },
  expenses: { load: () => expensesService.getAll(), label: "movimientos", empty: [] },
  reminders: { load: expensesService.getRecurrenceReminders, label: "pagos pendientes", empty: [] },
  recurrences: { load: expensesService.getRecurrences, label: "pagos recurrentes", empty: [] },
  summary: { load: expensesService.getMonthlySummary, label: "resumen del mes", empty: null },
};

const ALL_SOURCES = Object.keys(SOURCES);
const FINANCE_SOURCES = ["reminders", "expenses", "summary", "recurrences"];

const initialData = Object.fromEntries(ALL_SOURCES.map((key) => [key, SOURCES[key].empty]));

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

/**
 * Datos reales del Inicio (web) y Hoy (móvil) con sus mutaciones.
 * Marcar una tarea o un hábito actualiza el estado local al instante (la esfera y los
 * resúmenes cambian sin recargar) y luego vuelve a pedir esa fuente. Confirmar un pago
 * vuelve a pedir los recordatorios: la tarjeta desaparece porque la API ya no la devuelve.
 * notify(message, type) muestra el aviso del shell.
 */
export default function useToday({ notify } = {}) {
  const [data, setData] = usePageState("data:today", initialData);
  const [failed, setFailed] = usePageState("data:today-failed", []);
  const [loading, setLoading] = usePageState("data:today-loading", true);
  // Ya cargado en esta visita a la ruta: la página se volvió a montar al cruzar los 760 px.
  const restoredRef = useRef(!loading);
  const [pending, setPending] = useState({});
  const activeRef = useRef(true);
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const load = useCallback(async (keys = ALL_SOURCES) => {
    const results = await Promise.allSettled(keys.map((key) => SOURCES[key].load()));
    if (!activeRef.current) return;

    const loaded = {};
    const failedKeys = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") loaded[keys[index]] = result.value ?? SOURCES[keys[index]].empty;
      else failedKeys.push(keys[index]);
    });

    setData((current) => ({ ...current, ...loaded }));
    setFailed((current) => [...current.filter((key) => !keys.includes(key)), ...failedKeys]);
    setLoading(false);
  }, [setData, setFailed, setLoading]);

  useEffect(() => {
    activeRef.current = true;
    if (!restoredRef.current) load();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") load();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeRef.current = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  function setPendingKey(key, value) {
    setPending((current) => {
      const next = { ...current };
      if (value) next[key] = true;
      else delete next[key];
      return next;
    });
  }

  function patchItem(source, id, changes) {
    setData((current) => ({
      ...current,
      [source]: current[source].map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  }

  async function toggleTask(task) {
    const key = `task-${task.id}`;
    if (pending[key]) return;
    const nextStatus = isTaskDone(task) ? "pendiente" : "completada";
    setPendingKey(key, true);
    patchItem("tasks", task.id, { status: nextStatus });
    try {
      await tasksService.changeStatus(task.id, nextStatus);
      // Una tarea recurrente crea la siguiente al completarse: se vuelve a pedir la lista.
      await load(["tasks"]);
    } catch (error) {
      patchItem("tasks", task.id, { status: task.status });
      notifyRef.current?.(apiMessage(error, `No se pudo actualizar "${task.title}".`), "error");
    } finally {
      setPendingKey(key, false);
    }
  }

  async function toggleHabit(habit) {
    const key = `habit-${habit.id}`;
    if (pending[key]) return;
    const nextStatus = isHabitDone(habit) ? "pendiente" : "completado";
    setPendingKey(key, true);
    patchItem("habits", habit.id, { status: nextStatus });
    try {
      await habitsService.changeStatus(habit.id, nextStatus);
      await load(["habits"]);
    } catch (error) {
      patchItem("habits", habit.id, { status: habit.status });
      notifyRef.current?.(apiMessage(error, `No se pudo actualizar "${habit.name}".`), "error");
    } finally {
      setPendingKey(key, false);
    }
  }

  // Confirma por occurrenceId con la fecha real (Hoy, Ayer u Otra). Devuelve true si se
  // confirmó, para que la hoja se cierre solo en ese caso.
  async function confirmReminder(reminder, paidDate) {
    try {
      await expensesService.confirmRecurrenceOccurrence(reminder.occurrenceId, paidDate);
      notifyRef.current?.(`${Number(reminder.amount) > 0 ? "Ingreso recibido" : "Pago registrado"} en Movimientos.`);
      await load(FINANCE_SOURCES);
      return true;
    } catch (error) {
      notifyRef.current?.(apiMessage(error, "No se pudo confirmar el recordatorio"), "error");
      return false;
    }
  }

  // Detener = scope "future" (los vencidos siguen confirmables); Eliminar = scope "all".
  // La hoja de confirmar pide la confirmación antes de llegar aquí.
  async function cancelRecurrence(reminder, scope) {
    try {
      await expensesService.cancelRecurrence(reminder.recurrenceId, scope);
      notifyRef.current?.(scope === "future" ? "Se detuvieron las próximas fechas." : "Recurrente eliminado.");
      await load(FINANCE_SOURCES);
      return true;
    } catch (error) {
      notifyRef.current?.(apiMessage(error, "No se pudo eliminar la recurrencia"), "error");
      return false;
    }
  }

  const failedLabels = failed.map((key) => SOURCES[key].label);

  return {
    data,
    loading,
    failed,
    error: failedLabels.length > 0 ? `No se pudieron cargar: ${failedLabels.join(", ")}.` : "",
    isPending: (kind, id) => Boolean(pending[`${kind}-${id}`]),
    reload: load,
    toggleTask,
    toggleHabit,
    confirmReminder,
    cancelRecurrence,
  };
}
