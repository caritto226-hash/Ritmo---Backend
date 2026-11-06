import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useShell } from "../../ui/shell/ShellContext";
import useToday from "../../hooks/data/useToday";
import useNow from "../../hooks/useNow";
import useWidgetLayout from "../../ui/widgets/useWidgetLayout";
import ConfirmPaymentSheet from "../../ui/domain/ConfirmPaymentSheet";
import {
  selectDayEvents,
  selectDayTasks,
  selectFinance,
  selectMarkedDates,
  selectMonthBalance,
  selectReminderGroups,
  selectRitmo,
  selectWeekExpenses,
} from "../../hooks/data/todaySelectors";
import { HOME_LAYOUT_KEY, MOBILE_DEFAULT, MOBILE_WIDGETS, WEB_DEFAULT, WEB_WIDGETS } from "./homeWidgets";
import HomeWeb from "./HomeWeb";
import HomeMobile from "./HomeMobile";

/**
 * Inicio (web, ≥ 760 px) y Hoy (móvil, < 760 px): misma ruta, mismos datos y manejadores.
 * El ✓ de un pago abre la hoja de confirmación (Hoy, Ayer u Otra) en lugar de confirmar
 * sin fecha, que era el error de paidDate del dashboard anterior.
 */
function HomePage() {
  const { profile, isWeb, notify, comingSoon } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow();
  const today = useToday({ notify });
  const [editing, setEditing] = useState(false);
  const [customizeKey, setCustomizeKey] = useState(null);
  const [confirming, setConfirming] = useState(null);

  // "Personalizar el inicio" desde Ajustes llega con state { customize: true }: entra al modo
  // Personalizar una vez por navegación y luego se limpia el state.
  if (location.state?.customize && customizeKey !== location.key) {
    setCustomizeKey(location.key);
    setEditing(true);
  }

  useEffect(() => {
    if (!location.state?.customize) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const notifyError = useCallback((message) => notify(message, "error"), [notify]);
  const storageKey = profile?.id ? HOME_LAYOUT_KEY(profile.id) : null;
  const webLayout = useWidgetLayout({ storageKey, platform: "web", catalog: WEB_WIDGETS, defaults: WEB_DEFAULT, onError: notifyError });
  const mobileLayout = useWidgetLayout({ storageKey, platform: "mobile", catalog: MOBILE_WIDGETS, defaults: MOBILE_DEFAULT, onError: notifyError });

  const { data } = today;
  const todayKey = now.dateKey;
  const model = useMemo(() => ({
    todayKey,
    ritmo: selectRitmo(data, todayKey),
    tasks: selectDayTasks(data.tasks, todayKey),
    events: selectDayEvents(data.events, todayKey),
    habits: data.habits,
    reminders: selectReminderGroups(data.reminders),
    finance: today.failed.includes("summary") ? null : selectFinance(data.summary),
    week: selectWeekExpenses(data.expenses, todayKey),
    monthBalance: selectMonthBalance(data.expenses, todayKey),
    markedDates: selectMarkedDates(data),
  }), [data, todayKey, today.failed]);

  const shared = {
    model,
    data,
    now,
    firstName: profile?.name?.trim().split(/\s+/)[0] || "",
    loading: today.loading,
    error: today.error,
    editing,
    onToggleEditing: () => setEditing((value) => !value),
    onToggleTask: today.toggleTask,
    onToggleHabit: today.toggleHabit,
    isPending: today.isPending,
    onSettle: setConfirming,
    comingSoon,
  };

  return (
    <>
      {isWeb ? <HomeWeb {...shared} layout={webLayout} /> : <HomeMobile {...shared} layout={mobileLayout} />}
      {confirming && (
        <ConfirmPaymentSheet
          key={confirming.occurrenceId}
          reminder={confirming}
          onClose={() => setConfirming(null)}
          onConfirm={today.confirmReminder}
          onCancel={today.cancelRecurrence}
        />
      )}
    </>
  );
}

export default HomePage;
