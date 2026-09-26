import { useState, useEffect } from "react";
import eventsService from "../services/events.service";

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  duration: "",
  location: "",
};

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    try {
      await eventsService.remove(id);
      loadEvents();
    } catch (err) {
      setError("No se pudo eliminar el evento");
    }
  }

  if (loading) {
    return <p>Cargando eventos...</p>;
  }

  return (
    <div>
      <h1>Mis eventos</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Título"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Descripción (opcional)"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="event_date"
          type="date"
          value={form.event_date}
          onChange={handleChange}
          required
        />
        <input
          name="event_time"
          type="time"
          value={form.event_time}
          onChange={handleChange}
          required
        />
        <input
          name="duration"
          type="number"
          placeholder="Duración (minutos)"
          value={form.duration}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Ubicación (opcional)"
          value={form.location}
          onChange={handleChange}
        />

        <button type="submit">{editingId ? "Guardar cambios" : "Crear evento"}</button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      <ul>
        {events.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> — {item.eventDate?.slice(0, 10)} {item.eventTime}
            {item.location && ` — ${item.location}`} — {item.duration} min

            <button onClick={() => handleEdit(item)}>Editar</button>
            <button onClick={() => handleDelete(item.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Events;