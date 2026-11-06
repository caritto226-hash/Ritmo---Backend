import { useState } from "react";
import { useShell, useShellRail } from "../../ui/shell/ShellContext";
import useTasks from "../../hooks/data/useTasks";
import useNow from "../../hooks/useNow";
import useCreateIntent from "../../hooks/useCreateIntent";
import { selectTaskDates } from "../../hooks/data/taskSelectors";
import DatePickerSheet from "../../ui/domain/DatePickerSheet";
import CategoryManager from "../../components/CategoryManager";
import TaskFormModal from "./TaskFormModal";
import TaskDetailSheet from "./TaskDetailSheet";
import TasksWeb from "./TasksWeb";
import TasksMobile from "./TasksMobile";

/**
 * Tareas: web (TareasWeb.dc.html, ≥ 760 px) y móvil (Tareas.dc.html, < 760 px) con los mismos
 * datos (GET /tasks) y manejadores. El rail web cambia lo que lista la tabla:
 * el día elegido (con las vencidas), las próximas o el archivo de completadas.
 */
function TasksPage() {
  const { isWeb, notify, comingSoon } = useShell();
  const now = useNow();
  const data = useTasks({ notify });
  const todayKey = now.dateKey;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [view, setView] = useState("day");
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);

  useCreateIntent(() => setForm({ task: null }));

  useShellRail([
    { label: "Inicio", icon: "home", to: "/dashboard", end: true },
    { label: "Tareas de hoy", icon: "taskCircle", active: view === "day", onClick: () => setView("day") },
    { label: "Próximas", icon: "clock", active: view === "upcoming", onClick: () => setView("upcoming") },
    { label: "Categorías", icon: "tag", onClick: () => setManagingCategories(true) },
    { label: "Archivo de completadas", icon: "archive", active: view === "archive", onClick: () => setView("archive") },
  ]);

  // El detalle se lee de la lista actual: si la tarea cambia o desaparece, la hoja lo refleja.
  const detailTask = data.tasks.find((task) => task.id === detailId) || null;

  function selectDay(dateKey) {
    setSelectedKey(dateKey);
    setView("day");
  }

  const shared = {
    tasks: data.tasks,
    categories: data.categories,
    loading: data.loading,
    error: data.error,
    todayKey,
    selectedKey,
    now,
    onSelectDay: selectDay,
    onPickDate: () => setPickingDate(true),
    onToggle: data.toggleTask,
    isPending: data.isPending,
    onOpen: (task) => setDetailId(task.id),
    onCreate: () => setForm({ task: null }),
  };

  return (
    <>
      {isWeb ? <TasksWeb {...shared} view={view} comingSoon={comingSoon} /> : <TasksMobile {...shared} />}

      {detailTask && !form && (
        <TaskDetailSheet
          key={detailTask.id}
          task={detailTask}
          onClose={() => setDetailId(null)}
          onEdit={(task) => {
            setDetailId(null);
            setForm({ task });
          }}
          onDuplicate={data.duplicateTask}
          onDelete={data.deleteTask}
        />
      )}

      {form && (
        <TaskFormModal
          task={form.task}
          categories={data.categories}
          onClose={() => setForm(null)}
          onSubmit={data.saveTask}
          onCategoriesChanged={data.reloadCategories}
        />
      )}

      {pickingDate && (
        <DatePickerSheet
          value={selectedKey}
          todayKey={todayKey}
          markedDates={selectTaskDates(data.tasks)}
          onSelect={selectDay}
          onClose={() => setPickingDate(false)}
        />
      )}

      {managingCategories && (
        <CategoryManager
          module="tasks"
          categories={data.categories}
          onClose={() => setManagingCategories(false)}
          onChanged={data.reloadCategories}
        />
      )}
    </>
  );
}

export default TasksPage;
