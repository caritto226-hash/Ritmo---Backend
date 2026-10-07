import { useState, useEffect } from "react";
import eventsService from "../services/events.service";
import MobileItemDetails from "../components/MobileItemDetails";
import DateCalendar from "../components/DateCalendar";
import TimePicker from "../components/TimePicker";
import "../styles/eventos.css";

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  duration: "",
  location: "",
};

const monthNames = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (err) {
      setError("No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.event_date) {
      setError("Selecciona una fecha para el evento");
      return;
    }

    if (!form.event_time) {
      setError("Selecciona una hora para el evento");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      event_time: form.event_time,
      duration: Number(form.duration),
      location: form.location || null,
    };

    try {
      if (editingId) {
        await eventsService.update(editingId, payload);
      } else {
        await eventsService.create(payload);
      }

      setForm(emptyForm);
      setError("");
      setEditingId(null);
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setError("No se pudo guardar el evento");
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      event_date: item.eventDate ? item.eventDate.slice(0, 10) : "",
      event_time: item.eventTime || "",
      duration: item.duration || "",
      location: item.location || "",
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleDelete(id) {
    try {
      await eventsService.remove(id);
      loadEvents();
    } catch (err) {
      setError("No se pudo eliminar el evento");
    }
  }

  async function handleDuplicate(item) {
    try {
      await eventsService.create({
        title: `${item.title.slice(0, 142)} (copia)`,
        description: item.description || null,
        event_date: item.eventDate ? item.eventDate.slice(0, 10) : "",
        event_time: item.eventTime,
        duration: Number(item.duration),
        location: item.location || null,
      });
      setSelectedEvent(null);
      await loadEvents();
    } catch {
      setError("No se pudo duplicar el evento");
    }
  }

  async function handleDeleteSelectedEvent() {
    if (!selectedEvent) return;
    const id = selectedEvent.id;
    setSelectedEvent(null);
    await handleDelete(id);
  }

  function dateParts(isoDate) {
    if (!isoDate) return { day: "--", month: "" };
    const date = new Date(isoDate);
    return { day: date.getUTCDate(), month: monthNames[date.getUTCMonth()] };
  }

  if (loading) return <p>Cargando eventos...</p>;

  return (
    <div>
      <div className="proximos-header">
        <span>Mis eventos</span>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      {showForm && (
        <>
          <div className="modal-overlay open" onClick={handleCancelEdit} />
          <div className="modal open" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Editar evento" : "Nuevo evento"}</h3>
              <button type="button" className="modal-close" onClick={handleCancelEdit} aria-label="Cerrar formulario">
                ✕
              </button>
            </div>
            {error && <p className="modal-form-error" role="alert">{error}</p>}
            <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Título</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Descripción (opcional)</label>
              <textarea className="ritmo-textarea" name="description" value={form.description} onChange={handleChange} />
            </div>
            <DateCalendar
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              label="Fecha"
              required
            />
            <div className="time-row">
              <TimePicker
                name="event_time"
                value={form.event_time}
                onChange={handleChange}
                label="Hora"
                required
              />
            </div>
            <div className="time-row">
              <div className="time-field">
                <label>Duración (min)</label>
                <input type="number" name="duration" value={form.duration} onChange={handleChange} required />
              </div>
              <div className="time-field">
                <label>Ubicación (opcional)</label>
                <input name="location" value={form.location} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn-guardar">
              {editingId ? "Guardar cambios" : "Crear evento"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancelar edición
              </button>
            )}
            </form>
          </div>
        </>
      )}

      <div className="event-list">
        {events.length === 0 && (
          <p className="event-empty">
            Aún no tienes eventos. Registra el primero con el botón +.
          </p>
        )}

        {events.map((item) => {
          const { day, month } = dateParts(item.eventDate);
          return (
            <div className="event-item" key={item.id}>
              <div className="event-date-badge">
                <span className="day">{day}</span>
                <span className="month">{month}</span>
              </div>

              <div className="event-info">
                <h4>{item.title}</h4>
                <p>{item.eventTime} · {item.duration} min</p>
                {item.location && <p className="event-location">📍 {item.location}</p>}
              </div>

              <button className="tx-edit" onClick={() => handleEdit(item)}>✎</button>
              <button className="tx-delete" onClick={() => handleDelete(item.id)}>🗑</button>
              <button
                type="button"
                className="mobile-row-open"
                onClick={() => setSelectedEvent(item)}
                aria-label={`Ver opciones de ${item.title}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <MobileItemDetails
        item={selectedEvent}
        title={selectedEvent?.title || ""}
        details={selectedEvent ? [
          { label: "Descripción", value: selectedEvent.description },
          { label: "Fecha", value: selectedEvent.eventDate?.slice(0, 10) },
          { label: "Hora", value: selectedEvent.eventTime },
          { label: "Duración", value: `${selectedEvent.duration} min` },
          { label: "Ubicación", value: selectedEvent.location },
        ] : []}
        onClose={() => setSelectedEvent(null)}
        onDuplicate={() => handleDuplicate(selectedEvent)}
        onEdit={() => {
          const item = selectedEvent;
          setSelectedEvent(null);
          if (item) handleEdit(item);
        }}
        onDelete={handleDeleteSelectedEvent}
      />

      {!showForm && (
        <button
          type="button"
          className="fab"
          onClick={openCreateForm}
          aria-label="Agregar evento"
          title="Agregar evento"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Events;