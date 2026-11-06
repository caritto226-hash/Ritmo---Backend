import { useState } from "react";
import { CirclePill, MobilePageTitle } from "../../ui/shell/MobileShell";
import MobileWidgetGrid, { AddWidgetSheet, MobileEditBanner } from "../../ui/widgets/MobileWidgetGrid";
import { formatLongDate } from "../../utils/dates";
import { MOBILE_WIDGETS } from "./homeWidgets";
import { previewActivityBars } from "./homePreview";
import {
  ActivityWidget,
  DayWidget,
  EventsWidget,
  FinanceWidget,
  HabitsWidget,
  PaymentsWidget,
  SummaryWidget,
  TasksWidget,
} from "./HomeMobileWidgets";
import styles from "./HomeMobile.module.css";

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

// Hoy móvil (Hoy.dc.html). La barra superior (menú, +, campana) la pone MainLayout.
function HomeMobile({ model, now, firstName, loading, error, editing, onToggleEditing, onSettle, layout }) {
  const [addOpen, setAddOpen] = useState(false);
  const { ritmo, reminders } = model;

  const tasksLeft = ritmo.tasks.total - ritmo.tasks.done;
  const eventsLeft = ritmo.events.total - ritmo.events.done;
  const tail = reminders.lateCount > 0
    ? `Tienes ${plural(reminders.lateCount, "pago vencido", "pagos vencidos")}.`
    : "Vas muy bien, sigue así.";
  const summaryLine = `Te faltan ${plural(tasksLeft, "tarea", "tareas")}, ${plural(eventsLeft, "evento", "eventos")} y ${plural(reminders.out.length, "pago", "pagos")}. ${tail}`;

  const contentFor = {
    resumen: () => <SummaryWidget ritmo={ritmo} summaryLine={summaryLine} />,
    ritmo: () => <ActivityWidget ritmo={ritmo} bars={previewActivityBars(ritmo.pct, now.hours)} />,
    eventos: () => <EventsWidget events={model.events} nowHours={now.hours} />,
    habitos: () => <HabitsWidget summary={ritmo.habits} />,
    tareas: () => <TasksWidget tasks={model.tasks} summary={ritmo.tasks} nowHours={now.hours} />,
    fin: () => <FinanceWidget finance={model.finance} monthBalance={model.monthBalance} />,
    pagos: () => <PaymentsWidget groups={reminders} today={model.todayKey} onSettle={onSettle} />,
    dia: () => <DayWidget tasks={model.tasks} events={model.events} nowHours={now.hours} />,
  };

  const widgets = layout.layout.map(({ id }) => {
    const meta = MOBILE_WIDGETS[id];
    return {
      id,
      title: meta.title,
      size: meta.size,
      href: meta.href,
      openLabel: meta.openLabel,
      tone: id === "resumen" ? "ritmo" : "white",
      content: contentFor[id](),
    };
  });

  return (
    <>
      <MobilePageTitle
        title={firstName ? `Hola, ${firstName}` : "Hola"}
        subtitle={formatLongDate(model.todayKey)}
        action={
          <CirclePill icon="layout" pressed={editing} onClick={onToggleEditing}>
            {editing ? "Listo" : "Personalizar"}
          </CirclePill>
        }
      />

      {editing && <MobileEditBanner onAdd={() => setAddOpen(true)} onReset={layout.reset} />}
      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tu día…</p>
      ) : (
        <MobileWidgetGrid
          widgets={widgets}
          editing={editing}
          onMove={layout.move}
          onRemove={layout.remove}
          onAddRequest={() => setAddOpen(true)}
        />
      )}

      <AddWidgetSheet
        open={addOpen}
        hidden={layout.hidden.map((id) => ({ id, title: MOBILE_WIDGETS[id].title, description: MOBILE_WIDGETS[id].description }))}
        onAdd={layout.add}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}

export default HomeMobile;
