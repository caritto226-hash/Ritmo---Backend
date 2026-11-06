import { useState } from "react";
import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import IconButton from "../../ui/primitives/IconButton";
import PillButton from "../../ui/primitives/PillButton";
import WidgetGrid, { AddWidgetButton, EditBanner } from "../../ui/widgets/WidgetGrid";
import { selectAgendaItems } from "../../hooks/data/todaySelectors";
import { addDays, formatAgendaDay, formatClockWithPeriod, formatDayPill, parseDateKey } from "../../utils/dates";
import { WEB_WIDGETS } from "./homeWidgets";
import { HOME_PREVIEW } from "./homePreview";
import useQuote from "./useQuote";
import {
  AgendaWidget,
  CalendarWidget,
  FinanceWidget,
  HabitsWidget,
  PagosWidget,
  RitmoWidget,
  TasksWidget,
  WeekExpensesWidget,
} from "./HomeWebWidgets";
import styles from "./HomeWeb.module.css";

// Inicio web (Inicio.dc.html). La Agenda y el Calendario comparten el día elegido.
function HomeWeb({
  model,
  data,
  now,
  firstName,
  loading,
  error,
  editing,
  onToggleEditing,
  onToggleTask,
  onToggleHabit,
  isPending,
  onSettle,
  comingSoon,
  layout,
}) {
  const { todayKey } = model;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(todayKey));
  const [filter, setFilter] = useState("all");
  const { quote, next: nextQuote } = useQuote();

  function selectDay(dateKey) {
    setSelectedKey(dateKey);
    setViewMonth(parseDateKey(dateKey));
  }

  function shiftMonth(step) {
    setViewMonth(({ year, month }) => {
      const date = new Date(Date.UTC(year, month + step, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  const isToday = selectedKey === todayKey;
  const agendaItems = selectAgendaItems(data, selectedKey)
    .filter((entry) => filter === "all" || entry.kind === filter)
    .map((entry) => ({
      key: entry.key,
      kind: entry.kind,
      title: entry.item.title,
      start: entry.range.start,
      end: entry.range.end,
      lane: entry.lane,
      done: entry.done,
      to: "/events",
      disabled: entry.kind === "task" && isPending("task", entry.item.id),
      onToggle: entry.kind === "task" ? () => onToggleTask(entry.item) : undefined,
      ariaLabel: `${entry.kind === "event" ? "Evento" : "Tarea"}: ${entry.item.title}, ${formatClockWithPeriod(entry.range.start)}${entry.done ? ", hecho" : ""}`,
    }));

  const pendingOut = model.reminders.out.length;
  const metaFor = {
    pagos: `${pendingOut} por pagar`,
    tareas: `${model.ritmo.tasks.done}/${model.ritmo.tasks.total}`,
    habitos: `${model.ritmo.habits.done}/${model.ritmo.habits.total} hoy`,
  };

  const contentFor = {
    ritmo: () => (
      <RitmoWidget
        ritmo={model.ritmo}
        quote={quote}
        onNextQuote={nextQuote}
        onEditQuotes={() => comingSoon("Editar tus frases")}
        streakDays={HOME_PREVIEW?.streakDays}
      />
    ),
    agenda: () => (
      <AgendaWidget
        dayLabel={`${formatAgendaDay(selectedKey)}${isToday ? " · Hoy" : ""}`}
        items={agendaItems}
        filter={filter}
        onFilter={setFilter}
        onPrev={() => selectDay(addDays(selectedKey, -1))}
        onNext={() => selectDay(addDays(selectedKey, 1))}
        now={isToday ? now.hours : null}
      />
    ),
    pagos: () => <PagosWidget groups={model.reminders} today={todayKey} onSettle={onSettle} />,
    cal: () => (
      <CalendarWidget
        year={viewMonth.year}
        month={viewMonth.month}
        selectedKey={selectedKey}
        todayKey={todayKey}
        markedDates={model.markedDates}
        onSelect={selectDay}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      />
    ),
    tareas: () => <TasksWidget tasks={model.tasks} onToggle={onToggleTask} isPending={isPending} />,
    habitos: () => (
      <HabitsWidget habits={model.habits} summary={model.ritmo.habits} onToggle={onToggleHabit} isPending={isPending} preview={HOME_PREVIEW} />
    ),
    fin: () => <FinanceWidget finance={model.finance} />,
    gastos: () => <WeekExpensesWidget week={model.week} />,
  };

  const widgets = layout.layout.map(({ id, span }) => {
    const meta = WEB_WIDGETS[id];
    return {
      id,
      span,
      title: meta.title,
      tall: meta.tall,
      canResize: meta.sizes.length > 1,
      meta: metaFor[id],
      href: meta.href,
      openLabel: meta.openLabel,
      tone: id === "ritmo" ? "ritmo" : "white",
      content: contentFor[id](),
    };
  });

  return (
    <>
      <ShellTitle>
        <PageTitle
          breadcrumb={[{ label: "Inicio" }, { label: "Resumen del día" }]}
          crumbStyle="folder"
          title={firstName ? `Hola, ${firstName}` : "Hola"}
          actions={
            <>
              <IconButton icon="search" label="Buscar" onClick={() => comingSoon("Búsqueda")} />
              <PillButton icon="calendar" onClick={() => selectDay(todayKey)} aria-label={`Hoy, ${formatDayPill(todayKey)}. Volver la agenda a hoy`}>
                {formatDayPill(todayKey)}
              </PillButton>
              <AddWidgetButton
                hidden={layout.hidden.map((id) => ({ id, title: WEB_WIDGETS[id].title }))}
                onAdd={layout.add}
              />
              <PillButton icon="layout" iconSize={17} pressed={editing} className={styles.customize} onClick={onToggleEditing}>
                {editing ? "Listo" : "Personalizar"}
              </PillButton>
            </>
          }
        />
      </ShellTitle>

      {editing && <EditBanner onReset={layout.reset} onDone={onToggleEditing} />}
      {error && <p role="alert" className={styles.alert}>{error}</p>}

      {loading ? (
        <p role="status" className={styles.loading}>Cargando tu día…</p>
      ) : (
        <WidgetGrid
          widgets={widgets}
          editing={editing}
          onMoveTo={layout.moveTo}
          onMove={layout.move}
          onResize={layout.resize}
          onRemove={layout.remove}
        />
      )}
    </>
  );
}

export default HomeWeb;
