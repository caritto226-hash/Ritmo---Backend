import { useCallback, useEffect, useRef, useState } from "react";
import habitsService from "../../services/habits.service";
import categoriesService from "../../services/categories.service";
import { isHabitDone } from "./todaySelectors";
import { getGoalType } from "./habitSelectors";
import { usePageState } from "../../ui/shell/ShellContext";

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

// La API devuelve la hora como "HH:mm:ss"; el formulario y la API trabajan con "HH:mm".
function timeOf(value) {
  return value ? String(value).slice(0, 5) : null;
}

/**
 * Datos reales de Hábitos (GET /habits y las categorías de hábitos) con sus mutaciones.
 * Marcar o desmarcar hoy (PATCH /habits/:id/status) y "+ 1" (PATCH /habits/:id/progress) actualizan
 * la lista local al instante y luego vuelven a pedirla; el Inicio la vuelve a pedir al abrirse, así que
 * su esfera ya llega con el cambio. Crear, editar, duplicar y eliminar también vuelven a pedir la
 * lista. notify(message, type) muestra el aviso del shell.
 */
export default function useHabits({ notify } = {}) {
  const [habits, setHabits] = usePageState("data:habits", []);
  const [categories, setCategories] = usePageState("data:habits-categories", []);
  const [loading, setLoading] = usePageState("data:habits-loading", true);
  const [error, setError] = usePageState("data:habits-error", "");
  // Ya cargado en esta visita a la ruta: la página se volvió a montar al cruzar los 760 px.
  const restoredRef = useRef(!loading);
  const [pending, setPending] = useState({});
  const activeRef = useRef(true);
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const loadHabits = useCallback(async () => {
    try {
      const data = await habitsService.getAll();
      if (!activeRef.current) return;
      setHabits(data ?? []);
      setError("");
    } catch (loadError) {
      if (activeRef.current) setError(apiMessage(loadError, "No se pudieron cargar los hábitos."));
    }
  }, [setHabits, setError]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll("habits");
      if (activeRef.current) setCategories(data ?? []);
    } catch {
      // Sin categorías la pantalla funciona igual: los hábitos traen su propia categoría.
    }
  }, [setCategories]);

  const load = useCallback(async () => {
    const [habitsResult, categoriesResult] = await Promise.allSettled([
      habitsService.getAll(),
      categoriesService.getAll("habits"),
    ]);
    if (!activeRef.current) return;
    const loadError = habitsResult.status === "rejected"
      ? apiMessage(habitsResult.reason, "No se pudieron cargar los hábitos.")
      : "";
    setHabits((current) => (habitsResult.status === "fulfilled" ? habitsResult.value ?? [] : current));
    setCategories((current) => (categoriesResult.status === "fulfilled" ? categoriesResult.value ?? [] : current));
    setError(loadError);
    setLoading(false);
  }, [setHabits, setCategories, setError, setLoading]);

  useEffect(() => {
    activeRef.current = true;
    if (!restoredRef.current) load();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadHabits();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeRef.current = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load, loadHabits]);

  function setPendingId(id, value) {
    setPending((current) => {
      const next = { ...current };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function patchHabit(id, changes) {
    setHabits((current) => current.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)));
  }

  // Pendiente ↔ cumplido hoy, para todos los tipos: "completado" lleva el avance a la meta y
  // "pendiente" lo vuelve a 0 (así "✓ Completo" reinicia el conteo). Devuelve true si salió bien.
  async function toggleHabit(habit) {
    if (pending[habit.id]) return false;
    const nextStatus = isHabitDone(habit) ? "pendiente" : "completado";
    const target = Number(habit.todayTarget ?? habit.goal) || 1;
    setPendingId(habit.id, true);
    patchHabit(habit.id, {
      status: nextStatus,
      todayAmount: nextStatus === "completado" ? Math.max(Number(habit.todayAmount) || 0, target) : 0,
    });
    try {
      await habitsService.changeStatus(habit.id, nextStatus);
      await loadHabits();
      return true;
    } catch (statusError) {
      patchHabit(habit.id, { status: habit.status, todayAmount: habit.todayAmount });
      notifyRef.current?.(apiMessage(statusError, `No se pudo actualizar "${habit.name}".`), "error");
      return false;
    } finally {
      setPendingId(habit.id, false);
    }
  }

  // Avance de hoy en hábitos de cantidad o tiempo. "+ 1" suma en la API (delta, atómico) y
  // muestra el cambio al instante; al llegar a la meta el hábito queda cumplido.
  async function incrementHabit(habit) {
    if (pending[habit.id]) return false;
    const amount = (Number(habit.todayAmount) || 0) + 1;
    const target = Number(habit.todayTarget ?? habit.goal) || 1;
    setPendingId(habit.id, true);
    patchHabit(habit.id, { todayAmount: amount, status: amount >= target ? "completado" : "pendiente" });
    try {
      await habitsService.updateProgress(habit.id, { delta: 1 });
      await loadHabits();
      return true;
    } catch (progressError) {
      patchHabit(habit.id, { todayAmount: habit.todayAmount, status: habit.status });
      notifyRef.current?.(apiMessage(progressError, `No se pudo actualizar "${habit.name}".`), "error");
      return false;
    } finally {
      setPendingId(habit.id, false);
    }
  }

  // Valor exacto de hoy (hoja de avance: Guardar, y Deshacer con 0). Devuelve true si salió bien.
  async function setHabitProgress(habit, amount) {
    if (pending[habit.id]) return false;
    setPendingId(habit.id, true);
    try {
      await habitsService.updateProgress(habit.id, { amount });
      notifyRef.current?.(amount === 0 ? `"${habit.name}" volvió a 0 hoy.` : "Avance guardado.");
      await loadHabits();
      return true;
    } catch (progressError) {
      notifyRef.current?.(apiMessage(progressError, `No se pudo actualizar "${habit.name}".`), "error");
      return false;
    } finally {
      setPendingId(habit.id, false);
    }
  }

  // Días de la semana (days manda; la API genera la etiqueta de frequency), tipo de meta, meta y
  // unidad. Solo marcar no lleva meta ni unidad; tiempo no lleva unidad. Lanza el error para que
  // el formulario lo muestre sin cerrarse.
  async function saveHabit(form, original) {
    const goalType = form.goalType;
    const payload = {
      name: form.name,
      days: form.days,
      goalType,
      goal: goalType === "check" ? null : Number(form.goal),
      unit: goalType === "count" ? form.unit.trim() || null : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      reminderTime: form.reminderTime || null,
    };
    try {
      if (original) await habitsService.update(original.id, payload);
      else await habitsService.create(payload);
    } catch (saveError) {
      throw new Error(apiMessage(saveError, "No se pudo guardar el hábito"), { cause: saveError });
    }
    notifyRef.current?.(original ? "Hábito actualizado." : "Hábito creado.");
    await loadHabits();
  }

  // Igual que antes: el recordatorio se copia solo si la categoría todavía lo permite (si no, la
  // copia fallaría).
  async function duplicateHabit(habit) {
    try {
      await habitsService.create({
        // 92 + " (copia)" = 100, el máximo que admite el nombre del hábito.
        name: `${habit.name.slice(0, 92)} (copia)`,
        days: habit.days,
        goalType: getGoalType(habit),
        goal: habit.goal ?? null,
        unit: habit.unit ?? null,
        categoryId: habit.categoryId ?? null,
        reminderTime: habit.reminderTime
          && categories.find((category) => category.id === habit.categoryId)?.isRecurring
          ? timeOf(habit.reminderTime)
          : null,
      });
      notifyRef.current?.("Hábito duplicado.");
      await loadHabits();
      return true;
    } catch (duplicateError) {
      notifyRef.current?.(apiMessage(duplicateError, "No se pudo duplicar el hábito"), "error");
      return false;
    }
  }

  async function deleteHabit(habit) {
    try {
      await habitsService.remove(habit.id);
      notifyRef.current?.("Hábito eliminado.");
      await loadHabits();
      return true;
    } catch (deleteError) {
      notifyRef.current?.(apiMessage(deleteError, "No se pudo eliminar el hábito"), "error");
      return false;
    }
  }

  // Después de crear o editar categorías se recargan también los hábitos (traen nombre y color).
  async function reloadCategories() {
    await Promise.all([loadCategories(), loadHabits()]);
  }

  return {
    habits,
    categories,
    loading,
    error,
    isPending: (id) => Boolean(pending[id]),
    toggleHabit,
    incrementHabit,
    setHabitProgress,
    saveHabit,
    duplicateHabit,
    deleteHabit,
    reloadCategories,
  };
}
