import { useState, useEffect } from "react";
import tasksService from "../services/tasks.service";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  duration: "",
  priority: "media",
  start_at: "",
  end_at: "",
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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
          start_at: form.start_at || undefined,
          end_at: form.end_at || undefined,
        });
      }

      setForm(emptyForm);
      setEditingId(null);
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
      start_at: "",
      end_at: "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      await tasksService.changeStatus(taskId, newStatus);
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

  if (loading) {
    return <p>Cargando tareas...</p>;
  }

  return (
    <div>
      <h1>Mis tareas</h1>

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
          placeholder="Descripción"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        {!editingId && (
          <input
            name="duration"
            type="number"
            placeholder="Duración (minutos)"
            value={form.duration}
            onChange={handleChange}
          />
        )}
        <select name="priority" value={form.priority} onChange={handleChange}>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <button type="submit">{editingId ? "Guardar cambios" : "Crear tarea"}</button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong> — {task.priority} — {task.status}

            <select
              value={task.status.toLowerCase().replace(" ", "_")}
              onChange={(e) => handleStatusChange(task.id, e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="completada">Completada</option>
            </select>

            <button onClick={() => handleEdit(task)}>Editar</button>
            <button onClick={() => handleDelete(task.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tasks;