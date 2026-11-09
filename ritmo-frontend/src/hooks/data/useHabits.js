import { useCallback, useEffect, useRef, useState } from "react";
import habitsService from "../../services/habits.service";
import categoriesService from "../../services/categories.service";
import { isHabitDone } from "./todaySelectors";
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
 * Marcar o desmarcar hoy actualiza la lista local al instante y luego hace PATCH
 * /habits/:id/status y vuelve a pedir la lista; el Inicio la vuelve a pedir al abrirse, así que
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

  // Pendiente ↔ cumplido hoy. Devuelve true si salió bien.
  async function toggleHabit(habit) {
    if (pending[habit.id]) return false;
    const nextStatus = isHabitDone(habit) ? "pendiente" : "completado";
    setPendingId(habit.id, true);
    patchHabit(habit.id, { status: nextStatus });
    try {
      await habitsService.changeStatus(habit.id, nextStatus);
      await loadHabits();
      return true;
    } catch (statusError) {
      patchHabit(habit.id, { status: habit.status });
      notifyRef.current?.(apiMessage(statusError, `No se pudo actualizar "${habit.name}".`), "error");
      return false;
    } finally {
      setPendingId(habit.id, false);
    }
  }

  // Mismo payload que la pantalla anterior (Habits.jsx): solo un campo vacío significa "sin
  // meta". Lanza el error para que el formulario lo muestre sin cerrarse.
  async function saveHabit(form, original) {
    const payload = {
      name: form.name,
      frequency: form.frequency,
      goal: form.goal === "" ? null : Number(form.goal),
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
        frequency: habit.frequency,
        goal: habit.goal ?? null,
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
    saveHabit,
    duplicateHabit,
    deleteHabit,
    reloadCategories,
  };
}
