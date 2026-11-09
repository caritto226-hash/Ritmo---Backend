import { useCallback, useEffect, useRef, useState } from "react";
import eventsService from "../../services/events.service";
import categoriesService from "../../services/categories.service";
import { isEventDone } from "./todaySelectors";
import { usePageState } from "../../ui/shell/ShellContext";

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

// La API devuelve la hora como "HH:mm:ss"; el formulario y la API trabajan con "HH:mm".
function timeOf(value) {
  return value ? String(value).slice(0, 5) : null;
}

/**
 * Datos reales de Eventos (GET /events y las categorías de eventos) con sus mutaciones.
 * Cambiar el estado (realizado, programado, cancelado) actualiza la lista local al instante y
 * luego la vuelve a pedir: un evento recurrente crea el siguiente al marcarse realizado. Crear, editar, duplicar y eliminar
 * también vuelven a pedir la lista. notify(message, type) muestra el aviso del shell.
 */
export default function useEvents({ notify } = {}) {
  const [events, setEvents] = usePageState("data:events", []);
  const [categories, setCategories] = usePageState("data:events-categories", []);
  const [loading, setLoading] = usePageState("data:events-loading", true);
  const [error, setError] = usePageState("data:events-error", "");
  // Ya cargado en esta visita a la ruta: la página se volvió a montar al cruzar los 760 px.
  const restoredRef = useRef(!loading);
  const [pending, setPending] = useState({});
  const activeRef = useRef(true);
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventsService.getAll();
      if (!activeRef.current) return;
      setEvents(data ?? []);
      setError("");
    } catch (loadError) {
      if (activeRef.current) setError(apiMessage(loadError, "No se pudieron cargar los eventos."));
    }
  }, [setEvents, setError]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll("events");
      if (activeRef.current) setCategories(data ?? []);
    } catch {
      // Sin categorías la pantalla funciona igual: los eventos traen su propia categoría.
    }
  }, [setCategories]);

  const load = useCallback(async () => {
    const [eventsResult, categoriesResult] = await Promise.allSettled([
      eventsService.getAll(),
      categoriesService.getAll("events"),
    ]);
    if (!activeRef.current) return;
    const loadError = eventsResult.status === "rejected"
      ? apiMessage(eventsResult.reason, "No se pudieron cargar los eventos.")
      : "";
    setEvents((current) => (eventsResult.status === "fulfilled" ? eventsResult.value ?? [] : current));
    setCategories((current) => (categoriesResult.status === "fulfilled" ? categoriesResult.value ?? [] : current));
    setError(loadError);
    setLoading(false);
  }, [setEvents, setCategories, setError, setLoading]);

  useEffect(() => {
    activeRef.current = true;
    if (!restoredRef.current) load();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadEvents();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeRef.current = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load, loadEvents]);

  function setPendingId(id, value) {
    setPending((current) => {
      const next = { ...current };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function patchEvent(id, changes) {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, ...changes } : event)));
  }

  // PATCH /events/:id/status y después GET /events. Devuelve true si salió bien.
  async function changeStatus(event, nextStatus, message) {
    if (pending[event.id]) return false;
    setPendingId(event.id, true);
    patchEvent(event.id, { status: nextStatus });
    try {
      await eventsService.changeStatus(event.id, nextStatus);
      if (message) notifyRef.current?.(message);
      await loadEvents();
      return true;
    } catch (statusError) {
      patchEvent(event.id, { status: event.status });
      notifyRef.current?.(apiMessage(statusError, `No se pudo actualizar "${event.title}".`), "error");
      return false;
    } finally {
      setPendingId(event.id, false);
    }
  }

  // Programado ↔ realizado.
  function toggleEvent(event) {
    return changeStatus(event, isEventDone(event) ? "programado" : "completado");
  }

  // Cancelar no genera la siguiente repetición; restaurar lo devuelve a programado.
  function cancelEvent(event) {
    return changeStatus(event, "cancelado", "Evento cancelado.");
  }

  function restoreEvent(event) {
    return changeStatus(event, "programado", "Evento restaurado.");
  }

  // Mismo payload que la pantalla anterior (Events.jsx). Sin hora = evento de todo el día; la
  // duración es opcional y no aplica a todo el día. Lanza el error para que el formulario lo
  // muestre sin cerrarse.
  async function saveEvent(form, original) {
    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      event_time: form.allDay ? null : form.event_time,
      duration: form.allDay || form.duration === "" ? null : Number(form.duration),
      location: form.location || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      recurrenceFrequency: form.recurrenceFrequency || null,
    };
    try {
      if (original) await eventsService.update(original.id, payload);
      else await eventsService.create(payload);
    } catch (saveError) {
      throw new Error(apiMessage(saveError, "No se pudo guardar el evento"), { cause: saveError });
    }
    notifyRef.current?.(original ? "Evento actualizado." : "Evento creado.");
    await loadEvents();
  }

  // Igual que antes: copia sin la repetición.
  async function duplicateEvent(event) {
    try {
      await eventsService.create({
        title: `${event.title.slice(0, 142)} (copia)`,
        description: event.description || null,
        event_date: event.eventDate ? event.eventDate.slice(0, 10) : "",
        event_time: timeOf(event.eventTime),
        duration: event.duration ? Number(event.duration) : null,
        location: event.location || null,
        categoryId: event.categoryId ?? null,
      });
      notifyRef.current?.("Evento duplicado.");
      await loadEvents();
      return true;
    } catch (duplicateError) {
      notifyRef.current?.(apiMessage(duplicateError, "No se pudo duplicar el evento"), "error");
      return false;
    }
  }

  async function deleteEvent(event) {
    try {
      await eventsService.remove(event.id);
      notifyRef.current?.("Evento eliminado.");
      await loadEvents();
      return true;
    } catch (deleteError) {
      notifyRef.current?.(apiMessage(deleteError, "No se pudo eliminar el evento"), "error");
      return false;
    }
  }

  // Después de crear o editar categorías se recargan también los eventos (traen nombre y color).
  async function reloadCategories() {
    await Promise.all([loadCategories(), loadEvents()]);
  }

  return {
    events,
    categories,
    loading,
    error,
    isPending: (id) => Boolean(pending[id]),
    toggleEvent,
    cancelEvent,
    restoreEvent,
    saveEvent,
    duplicateEvent,
    deleteEvent,
    reloadCategories,
  };
}
