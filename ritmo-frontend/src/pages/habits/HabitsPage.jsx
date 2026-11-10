import { useState } from "react";
import { useShell, useShellRail } from "../../ui/shell/ShellContext";
import useHabits from "../../hooks/data/useHabits";
import useNow from "../../hooks/useNow";
import useCreateIntent from "../../hooks/useCreateIntent";
import { selectHabitProgress } from "../../hooks/data/habitSelectors";
import HabitProgressSheet from "../../ui/domain/HabitProgressSheet";
import HabitFormModal from "./HabitFormModal";
import HabitDetailSheet from "./HabitDetailSheet";
import HabitsWeb from "./HabitsWeb";
import HabitsMobile from "./HabitsMobile";

/**
 * Hábitos: web (HabitosWeb.dc.html, ≥ 760 px) y móvil (Habitos.dc.html, < 760 px) con los mismos
 * datos (GET /habits) y manejadores. Hábitos v2: solo marcar (check), cantidad ("+ 1" suma con
 * PATCH /habits/:id/progress) y tiempo; la cifra de los dos últimos y "Registrar tiempo" abren
 * HabitProgressSheet (Guardar fija el valor de hoy y Deshacer lo vuelve a 0).
 */
function HabitsPage() {
  const { isWeb, notify, comingSoon } = useShell();
  const now = useNow();
  const data = useHabits({ notify });
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [progressId, setProgressId] = useState(null);

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
  const progressHabit = data.habits.find((habit) => habit.id === progressId) || null;
  const progress = progressHabit ? selectHabitProgress(progressHabit) : null;

  const shared = {
    habits: data.habits,
    loading: data.loading,
    error: data.error,
    now,
    onToggle: data.toggleHabit,
    onIncrement: data.incrementHabit,
    onAdjust: (habit) => setProgressId(habit.id),
    isPending: data.isPending,
    onOpen: (habit) => setDetailId(habit.id),
    onEdit: (habit) => setForm({ habit }),
    onCreate: () => setForm({ habit: null }),
    onStats: () => comingSoon(isWeb ? "Estadísticas" : "Progreso"),
  };

  return (
    <>
      {isWeb ? <HabitsWeb {...shared} /> : <HabitsMobile {...shared} />}

      {detailHabit && !form && !progressHabit && (
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
          onToggle={data.toggleHabit}
          onAdjust={(habit) => setProgressId(habit.id)}
        />
      )}

      {progressHabit && progress && (
        <HabitProgressSheet
          key={progressHabit.id}
          name={progressHabit.name}
          type={progress.type}
          count={progress.count}
          goal={progress.goal}
          unitLabel={progress.unitLabel}
          onSave={(amount) => data.setHabitProgress(progressHabit, amount)}
          onUndo={() => data.setHabitProgress(progressHabit, 0)}
          onClose={() => setProgressId(null)}
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
