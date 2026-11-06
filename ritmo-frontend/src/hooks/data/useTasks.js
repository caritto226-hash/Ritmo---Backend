import { useCallback, useEffect, useRef, useState } from "react";
import tasksService from "../../services/tasks.service";
import categoriesService from "../../services/categories.service";
import { isTaskDone } from "./todaySelectors";

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

// "2026-11-05 08:00:00" (como lo devuelve la API) → "2026-11-05T08:00" (como lo valida al guardar).
function toApiDateTime(value) {
  const match = typeof value === "string" ? value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/) : null;
  return match ? `${match[1]}T${match[2]}` : null;
}

/**
 * Datos reales de Tareas (GET /tasks y las categorías de tareas) con sus mutaciones.
 * Marcar una tarea actualiza el estado local al instante y luego vuelve a pedir la lista:
 * una tarea recurrente crea la siguiente al completarse. Crear, editar, duplicar y eliminar
 * también vuelven a pedir la lista. notify(message, type) muestra el aviso del shell.
 */
export default function useTasks({ notify } = {}) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState({});
  const activeRef = useRef(true);
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const loadTasks = useCallback(async () => {
    try {
      const data = await tasksService.getAll();
      if (!activeRef.current) return;
      setTasks(data ?? []);
      setError("");
    } catch (loadError) {
      if (activeRef.current) setError(apiMessage(loadError, "No se pudieron cargar las tareas."));
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll("tasks");
      if (activeRef.current) setCategories(data ?? []);
    } catch {
      // Sin categorías la pantalla funciona igual: las tareas traen su propia categoría.
    }
  }, []);

  const load = useCallback(async () => {
    const [tasksResult, categoriesResult] = await Promise.allSettled([
      tasksService.getAll(),
      categoriesService.getAll("tasks"),
    ]);
    if (!activeRef.current) return;
    const loadError = tasksResult.status === "rejected"
      ? apiMessage(tasksResult.reason, "No se pudieron cargar las tareas.")
      : "";
    setTasks((current) => (tasksResult.status === "fulfilled" ? tasksResult.value ?? [] : current));
    setCategories((current) => (categoriesResult.status === "fulfilled" ? categoriesResult.value ?? [] : current));
    setError(loadError);
    setLoading(false);
  }, []);

  useEffect(() => {
    activeRef.current = true;
    load();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadTasks();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeRef.current = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load, loadTasks]);

  function setPendingId(id, value) {
    setPending((current) => {
      const next = { ...current };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function patchTask(id, changes) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...changes } : task)));
  }

  async function toggleTask(task) {
    if (pending[task.id]) return;
    const nextStatus = isTaskDone(task) ? "pendiente" : "completada";
    setPendingId(task.id, true);
    patchTask(task.id, { status: nextStatus });
    try {
      await tasksService.changeStatus(task.id, nextStatus);
      await loadTasks();
    } catch (toggleError) {
      patchTask(task.id, { status: task.status });
      notifyRef.current?.(apiMessage(toggleError, `No se pudo actualizar "${task.title}".`), "error");
    } finally {
      setPendingId(task.id, false);
    }
  }

  // Misma lógica que la pantalla anterior: al editar, PUT y, si cambió el estado, PATCH del estado.
  // Lanza el error para que el formulario lo muestre sin cerrarse.
  // Horas opcionales: start_at / end_at con la fecha de la tarea ("YYYY-MM-DDTHH:mm", el formato
  // que valida la API); vacías se envían en null, lo que también quita una hora guardada.
  async function saveTask(form, original) {
    const times = {
      start_at: form.startTime ? `${form.date}T${form.startTime}` : null,
      end_at: form.endTime ? `${form.date}T${form.endTime}` : null,
    };
    try {
      if (original) {
        await tasksService.update(original.id, {
          title: form.title,
          description: form.description,
          due_date: form.date,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          recurrenceFrequency: form.recurrenceFrequency || null,
          ...times,
        });
        if (form.status !== original.status) {
          await tasksService.changeStatus(original.id, form.status);
        }
      } else {
        await tasksService.create({
          title: form.title,
          description: form.description,
          date: form.date,
          duration: form.duration ? Number(form.duration) : undefined,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          recurrenceFrequency: form.recurrenceFrequency || null,
          ...times,
        });
      }
    } catch (saveError) {
      throw new Error(apiMessage(saveError, "No se pudo guardar la tarea"), { cause: saveError });
    }
    notifyRef.current?.(original ? "Tarea actualizada." : "Tarea creada.");
    await loadTasks();
  }

  async function duplicateTask(task) {
    try {
      await tasksService.create({
        title: `${task.title.slice(0, 37)} (copia)`,
        description: task.description || "",
        date: task.dueDate ? task.dueDate.slice(0, 10) : "",
        duration: task.duration ? Number(task.duration) : undefined,
        priority: task.priority.toLowerCase(),
        categoryId: task.categoryId ?? null,
        start_at: toApiDateTime(task.startAt),
        end_at: toApiDateTime(task.endAt),
      });
      notifyRef.current?.("Tarea duplicada.");
      await loadTasks();
      return true;
    } catch (duplicateError) {
      notifyRef.current?.(apiMessage(duplicateError, "No se pudo duplicar la tarea"), "error");
      return false;
    }
  }

  async function deleteTask(task) {
    try {
      await tasksService.remove(task.id);
      notifyRef.current?.("Tarea eliminada.");
      await loadTasks();
      return true;
    } catch (deleteError) {
      notifyRef.current?.(apiMessage(deleteError, "No se pudo eliminar la tarea"), "error");
      return false;
    }
  }

  // Después de crear o editar categorías se recargan también las tareas (traen nombre y color).
  async function reloadCategories() {
    await Promise.all([loadCategories(), loadTasks()]);
  }

  return {
    tasks,
    categories,
    loading,
    error,
    isPending: (id) => Boolean(pending[id]),
    toggleTask,
    saveTask,
    duplicateTask,
    deleteTask,
    reloadCategories,
  };
}
