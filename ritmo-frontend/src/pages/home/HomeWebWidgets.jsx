// Contenido de cada widget del Inicio web (Inicio.dc.html). El marco (título, abrir,
// controles de Personalizar) lo pone WidgetGrid.
import Icon from "../../ui/icons/Icon";
import IconButton from "../../ui/primitives/IconButton";
import Chip from "../../ui/primitives/Chip";
import SplitAmount from "../../ui/primitives/SplitAmount";
import LiquidOrb from "../../ui/charts/LiquidOrb";
import HorizontalTimeline from "../../ui/charts/HorizontalTimeline";
import MonthMini from "../../ui/charts/MonthMini";
import BubbleStats from "../../ui/charts/BubbleStats";
import CurveChart from "../../ui/charts/CurveChart";
import MoneyCarousel from "../../ui/domain/MoneyCarousel";
import { NO_DATA } from "../../ui/designPreview";
import cx from "../../ui/cx";
import { formatCurrency } from "../../utils/financeFormat";
import { formatClockWithPeriod } from "../../utils/dates";
import { getTaskTimeRange, isHabitDone, isTaskDone } from "../../hooks/data/todaySelectors";
import styles from "./HomeWeb.module.css";

export function RitmoWidget({ ritmo, quote, onNextQuote, onEditQuotes, streakDays }) {
  const parts = [
    { label: "Tareas", value: `${ritmo.tasks.done}/${ritmo.tasks.total}` },
    { label: "Hábitos", value: `${ritmo.habits.done}/${ritmo.habits.total}` },
    { label: "Eventos", value: `${ritmo.events.done}/${ritmo.events.total}` },
  ];

  return (
    <>
      <div className={styles.blobLime} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />
      <div className={styles.ritmoBody}>
        <LiquidOrb pct={ritmo.pct} label={`${ritmo.done} de ${ritmo.total} actividades`} />
        <div className={styles.parts}>
          {parts.map((part) => (
            <div key={part.label} className={styles.part}>
              <span className={styles.partLabel}>{part.label}</span>
              <span className={styles.partValue}>{part.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.quotePanel}>
        <div className={styles.quoteTop}>
          <span className={styles.quoteLabel}>
            <Icon name="note" size={15} />
            Tu frase de hoy
          </span>
          <span className={styles.streak} aria-label={streakDays ? `Racha de ${streakDays} días` : "Racha: sin datos todavía"}>
            <Icon name="flameSolid" size={13} />
            {streakDays ? `${streakDays} días` : NO_DATA}
          </span>
        </div>
        <p className={styles.quote}>“{quote}”</p>
        <div className={styles.quoteActions}>
          <button type="button" className={styles.nextQuote} onClick={onNextQuote}>
            Otra frase
            <span className={styles.nextQuoteIcon} aria-hidden="true">
              <Icon name="refresh" size={14} strokeWidth={2} />
            </span>
          </button>
          <IconButton icon="pencil" label="Editar mis frases" size={44} variant="glass" iconSize={16} strokeWidth={1.8} onClick={onEditQuotes} />
        </div>
      </div>
    </>
  );
}

const AGENDA_FILTERS = [
  { value: "all", label: "Todo" },
  { value: "event", label: "Eventos" },
  { value: "task", label: "Tareas" },
];

export function AgendaWidget({ dayLabel, items, filter, onFilter, onPrev, onNext, now }) {
  return (
    <>
      <div className={styles.agendaBar}>
        <IconButton icon="chevronLeft" label="Día anterior" size={40} variant="soft" strokeWidth={2} onClick={onPrev} />
        <span className={styles.dayLabel}>{dayLabel}</span>
        <IconButton icon="chevronRight" label="Día siguiente" size={40} variant="soft" strokeWidth={2} onClick={onNext} />
        <span className={styles.flex} />
        {AGENDA_FILTERS.map((option) => (
          <Chip key={option.value} selected={filter === option.value} onClick={() => onFilter(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>
      <HorizontalTimeline items={items} now={now} emptyText="Nada programado para este día." />
    </>
  );
}

export function PagosWidget({ groups, today, onSettle }) {
  const sections = [
    { key: "out", title: "Próximos gastos", total: `Por pagar ${formatCurrency(groups.outTotal)}`, list: groups.out },
    { key: "in", title: "Próximos ingresos", total: `Por cobrar ${formatCurrency(groups.inTotal)}`, list: groups.in },
  ];

  return sections.map((section) => (
    <MoneyCarousel
      key={section.key}
      title={section.title}
      total={section.total}
      reminders={section.list}
      today={today}
      onSettle={onSettle}
    />
  ));
}

export function CalendarWidget(props) {
  return <MonthMini {...props} />;
}

function taskMeta(task) {
  const range = getTaskTimeRange(task);
  return [range ? formatClockWithPeriod(range.start) : "Sin hora", task.category?.name].filter(Boolean).join(" · ");
}

export function TasksWidget({ tasks, onToggle, isPending }) {
  if (tasks.length === 0) return <p className={styles.empty}>No tienes tareas para hoy.</p>;

  return (
    <div className={styles.taskList}>
      {tasks.map((task) => {
        const done = isTaskDone(task);
        return (
          <button
            key={task.id}
            type="button"
            className={cx(styles.taskRow, done && styles.taskDone)}
            aria-pressed={done}
            disabled={isPending("task", task.id)}
            onClick={() => onToggle(task)}
          >
            <span className={styles.taskCheck} aria-hidden="true">
              {done && <Icon name="check" size={13} strokeWidth={3} />}
            </span>
            <span className={styles.taskCopy}>
              <span className={styles.taskTitle}>{task.title}</span>
              <span className={styles.taskMeta}>{taskMeta(task)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function HabitsWidget({ habits, summary, onToggle, isPending, preview }) {
  const pct = summary.total === 0 ? 0 : Math.round((summary.done / summary.total) * 100);
  const water = preview?.water;

  return (
    <div className={styles.habits}>
      <BubbleStats
        main={{ value: pct, unit: "%", caption: "hoy", ariaLabel: `${summary.done} de ${summary.total} hábitos cumplidos hoy` }}
        satellites={[
          {
            key: "streak",
            value: preview ? `${preview.streakDays}d` : NO_DATA,
            caption: "racha",
            ariaLabel: preview ? `Racha de ${preview.streakDays} días` : "Racha: sin datos todavía",
            size: 76,
            valueSize: 22,
            captionSize: 10,
            position: { top: 4, marginLeft: 34 },
          },
          {
            key: "water",
            value: water ? `${water.count}/${water.goal}` : NO_DATA,
            caption: "agua",
            ariaLabel: water ? `${water.count} de ${water.goal} vasos de agua` : "Conteo de agua: sin datos todavía",
            size: 60,
            valueSize: 17,
            captionSize: 9,
            position: { bottom: 6, marginLeft: -118 },
          },
        ]}
      />
      <div className={styles.habitList}>
        {habits.length === 0 && <p className={styles.empty}>Aún no tienes hábitos.</p>}
        {habits.map((habit) => {
          const done = isHabitDone(habit);
          return (
            <div key={habit.id} className={cx(styles.habitRow, done && styles.habitDone)}>
              <span className={styles.habitCopy}>
                <span className={styles.habitName}>{habit.name}</span>
                <span className={styles.habitMeta}>{done ? "Cumplido hoy" : habit.frequency}</span>
              </span>
              <button
                type="button"
                className={styles.habitCheck}
                aria-pressed={done}
                aria-label={`${done ? "Desmarcar" : "Marcar cumplido"}: ${habit.name}`}
                disabled={isPending("habit", habit.id)}
                onClick={() => onToggle(habit)}
              >
                <Icon name="check" size={15} strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FinanceWidget({ finance }) {
  const rows = [
    { label: "Ingresos", pct: finance?.incomePct },
    { label: "Gastos", pct: finance?.expensePct },
  ];

  return (
    <>
      <div className={styles.finTop}>
        <span className={styles.finLabel}>Disponible este mes</span>
        <SplitAmount value={finance ? finance.balance : null} />
        <span className={styles.finIncome}>
          <Icon name="arrowUpRight" size={14} strokeWidth={2} className={styles.incomeIcon} />
          {finance ? `${formatCurrency(finance.income)} en ingresos` : `${NO_DATA} en ingresos`}
        </span>
      </div>
      <span className={styles.flex} />
      <div className={styles.shares}>
        {rows.map((row) => (
          <ShareRow key={row.label} label={row.label} pct={row.pct} />
        ))}
      </div>
    </>
  );
}

function ShareRow({ label, pct }) {
  return (
    <>
      <span className={styles.shareLabel}>{label}</span>
      <span className={styles.shareBar} style={{ width: `${pct ?? 0}%` }}>
        {pct ?? NO_DATA}
        {pct !== undefined && pct !== null && <span className={styles.shareUnit}>%</span>}
      </span>
    </>
  );
}

export function WeekExpensesWidget({ week }) {
  const less = week.diff <= 0;
  const max = Math.max(...week.days.map((day) => day.amount));
  const maxDay = week.days.find((day) => day.amount === max);
  const comparison = week.diff === 0
    ? "Igual que la semana anterior"
    : `${formatCurrency(Math.abs(week.diff))} ${less ? "menos" : "más"}`;

  return (
    <div className={styles.week}>
      <div className={styles.weekLead}>
        <span className={styles.finLabel}>Últimos 7 días</span>
        <SplitAmount value={week.total} />
        <span className={styles.finIncome}>
          <Icon name={less ? "arrowDownRight" : "arrowUpRight"} size={14} strokeWidth={2} className={styles.weekIcon} />
          {comparison}
        </span>
      </div>
      <CurveChart
        values={week.days.map((day) => day.amount)}
        labels={week.days.map((day) => day.label)}
        formatTip={formatCurrency}
        ariaLabel={`Gasto diario de los últimos 7 días; el mayor fue el ${maxDay.label} con ${formatCurrency(max)}`}
      />
    </div>
  );
}
