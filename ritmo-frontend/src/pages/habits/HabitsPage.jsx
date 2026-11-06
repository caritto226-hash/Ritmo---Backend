import { useState } from "react";
import { useShell, useShellRail } from "../../ui/shell/ShellContext";
import useHabits from "../../hooks/data/useHabits";
import useNow from "../../hooks/useNow";
import useCreateIntent from "../../hooks/useCreateIntent";
import { isCounterHabit, isHabitDone } from "../../hooks/data/habitSelectors";
import { HABITS_PREVIEW } from "./habitsPreview";
import HabitFormModal from "./HabitFormModal";
import HabitDetailSheet from "./HabitDetailSheet";
import HabitsWeb from "./HabitsWeb";
import HabitsMobile from "./HabitsMobile";

/**
 * Hábitos: web (HabitosWeb.dc.html, ≥ 760 px) y móvil (Habitos.dc.html, < 760 px) con los mismos
 * datos (GET /habits) y manejadores. El conteo del día ("+ 1 vaso") no existe en la API
 * (BACKEND_PENDIENTE #2): sin vista previa el botón queda deshabilitado y el hábito de conteo se
 * marca desde su detalle. En la vista previa el conteo es local y al llegar a la meta se marca
 * cumplido de verdad (PATCH), como en el mockup.
 */
function HabitsPage() {
  const { isWeb, notify, comingSoon } = useShell();
  const now = useNow();
  const data = useHabits({ notify });
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [previewCounts, setPreviewCounts] = useState({});

  useCreateIntent(() => setForm({ habit: null }));

  useShellRail([
    { label: "Inicio", icon: "home", to: "/dashboard", end: true },
    { label: "Hábitos de hoy", icon: "check", to: "/habits" },
    {
      label: "Recordatorios",
      icon: "bell",
      onClick: () => document.getElementById("h-rec")?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "center" }),
    },
    { label: "Mi journal", icon: "journal", onClick: () => comingSoon("Mi journal") },
  ]);

  const detailHabit = data.habits.find((habit) => habit.id === detailId) || null;

  function counterOf(habit) {
    if (!isCounterHabit(habit)) return null;
    const goal = Number(habit.goal);
    if (!HABITS_PREVIEW) return { goal, count: null, unit: null };
    return { goal, count: previewCounts[habit.id] ?? Math.min(HABITS_PREVIEW.count, goal - 1), unit: HABITS_PREVIEW.unit };
  }

  function setPreviewCount(habit, count) {
    setPreviewCounts((current) => ({ ...current, [habit.id]: count }));
  }

  // Solo en la vista previa: sumar uno y, al llegar a la meta, marcar cumplido.
  const increment = HABITS_PREVIEW
    ? (habit) => {
        const counter = counterOf(habit);
        const next = counter.count + 1;
        setPreviewCount(habit, Math.min(next, counter.goal));
        if (next >= counter.goal) data.toggleHabit(habit);
      }
    : null;

  function toggle(habit) {
    if (HABITS_PREVIEW && isCounterHabit(habit) && isHabitDone(habit)) setPreviewCount(habit, 0);
    return data.toggleHabit(habit);
  }

  const shared = {
    habits: data.habits,
    loading: data.loading,
    error: data.error,
    now,
    counterOf,
    onToggle: toggle,
    onIncrement: increment,
    isPending: data.isPending,
    onOpen: (habit) => setDetailId(habit.id),
    onEdit: (habit) => setForm({ habit }),
    onCreate: () => setForm({ habit: null }),
    onStats: () => comingSoon(isWeb ? "Estadísticas" : "Progreso"),
  };

  return (
    <>
      {isWeb ? <HabitsWeb {...shared} /> : <HabitsMobile {...shared} />}

      {detailHabit && !form && (
        <HabitDetailSheet
          key={detailHabit.id}
          habit={detailHabit}
          onClose={() => setDetailId(null)}
          onEdit={(habit) => {
            setDetailId(null);
            setForm({ habit });
          }}
          onDuplicate={data.duplicateHabit}
          onDelete={data.deleteHabit}
          onToggle={toggle}
        />
      )}

      {form && (
        <HabitFormModal
          habit={form.habit}
          categories={data.categories}
          onClose={() => setForm(null)}
          onSubmit={data.saveHabit}
          onCategoriesChanged={data.reloadCategories}
        />
      )}
    </>
  );
}

export default HabitsPage;
