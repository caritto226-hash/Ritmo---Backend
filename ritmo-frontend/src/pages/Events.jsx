import { useState, useEffect } from "react";
import eventsService from "../services/events.service";
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
  }

  async function handleSubmit(event) {
    event.preventDefault();

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
        <button className="ver-link" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {error && <p style={{ color: "#e0697e" }}>{error}</p>}

      {showForm && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Título</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Descripción (opcional)</label>
              <textarea className="ritmo-textarea" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="time-row">
              <div className="time-field">
                <label>Fecha</label>
                <input type="date" name="event_date" value={form.event_date} onChange={handleChange} required />
              </div>
              <div className="time-field">
                <label>Hora</label>
                <input type="time" name="event_time" value={form.event_time} onChange={handleChange} required />
              </div>
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
      )}

      <div className="event-list">
        {events.length === 0 && <p className="event-empty">Aún no tienes eventos programados</p>}

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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Events;