import { useState, useEffect } from "react";
import tasksService from "../services/tasks.service";
import "../styles/tareas.css";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  duration: "",
  priority: "media",
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await tasksService.getAll();
      setTasks(data);
    } catch (err) {
      setError("No se pudieron cargar las tareas");
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

    try {
      if (editingId) {
        await tasksService.update(editingId, {
          title: form.title,
          description: form.description,
          due_date: form.date,
          priority: form.priority,
        });
      } else {
        await tasksService.create({
          title: form.title,
          description: form.description,
          date: form.date,
          duration: form.duration ? Number(form.duration) : undefined,
          priority: form.priority,
        });
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadTasks();
    } catch (err) {
      setError("No se pudo guardar la tarea");
    }
  }

  function handleEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      date: task.dueDate ? task.dueDate.slice(0, 10) : "",
      duration: task.duration || "",
      priority: task.priority.toLowerCase(),
    });
    setShowForm(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function toggleDone(task) {
    const isDone = task.status.toLowerCase() === "completada";
    try {
      await tasksService.changeStatus(task.id, isDone ? "pendiente" : "completada");
      loadTasks();
    } catch (err) {
      setError("No se pudo cambiar el estado");
    }
  }

  async function handleDelete(taskId) {
    try {
      await tasksService.remove(taskId);
      loadTasks();
    } catch (err) {
      setError("No se pudo eliminar la tarea");
    }
  }

  if (loading) return <p>Cargando tareas...</p>;

  return (
    <div>
      <div className="proximos-header">
        <span>Mis tareas</span>
        <button className="ver-link" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancelar" : "+ Nueva"}
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
              <label>Descripción</label>
              <textarea
                className="ritmo-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="time-row">
              <div className="time-field">
                <label>Fecha</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              {!editingId && (
                <div className="time-field">
                  <label>Duración (min)</label>
                  <input type="number" name="duration" value={form.duration} onChange={handleChange} />
                </div>
              )}
            </div>
            <div className="input-group">
              <label>Prioridad</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <button type="submit" className="btn-guardar">
              {editingId ? "Guardar cambios" : "Crear tarea"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      )}

      <div className="task-list">
        {tasks.map((task) => {
          const isDone = task.status.toLowerCase() === "completada";
          return (
            <div className={`task-item ${isDone ? "done" : ""}`} key={task.id}>
              <div className="task-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="3" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="13" y2="14" />
                </svg>
              </div>

              <div className="task-info">
                <h4>{task.title}</h4>
                <p>
                  {task.dueDate?.slice(0, 10)} · {task.priority}
                  {task.status.toLowerCase() === "en proceso" && " · En proceso"}
                </p>
              </div>

              <button
                className={`task-check ${isDone ? "done" : ""}`}
                onClick={() => toggleDone(task)}
                aria-label="Marcar como completada"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              <button className="tx-edit" onClick={() => handleEdit(task)} aria-label="Editar">
                ✎
              </button>
              <button className="tx-delete" onClick={() => handleDelete(task.id)} aria-label="Eliminar">
                🗑
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tasks;