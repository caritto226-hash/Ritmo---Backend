// Contenido de cada widget de Hoy móvil (Hoy.dc.html). El marco (abrir, controles de
// Personalizar) lo pone MobileWidgetGrid.
import { Link } from "react-router-dom";
import Icon from "../../ui/icons/Icon";
import IconButton from "../../ui/primitives/IconButton";
import SplitAmount from "../../ui/primitives/SplitAmount";
import LiquidOrb from "../../ui/charts/LiquidOrb";
import HourBars from "../../ui/charts/HourBars";
import HalfGauge from "../../ui/charts/HalfGauge";
import Sparkline from "../../ui/charts/Sparkline";
import LollipopTimeline from "../../ui/charts/LollipopTimeline";
import MoneyCard from "../../ui/domain/MoneyCard";
import { NO_DATA } from "../../ui/designPreview";
import cx from "../../ui/cx";
import { formatCurrency } from "../../utils/financeFormat";
import { formatClock, formatClockWithPeriod } from "../../utils/dates";
import { getEventTimeRange, getTaskTimeRange, isEventDone, isTaskDone } from "../../hooks/data/todaySelectors";
import styles from "./HomeMobile.module.css";

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function WidgetHead({ icon, iconClass, title, filled = false }) {
  return (
    <div className={styles.head}>
      <div className={styles.headLead}>
        <span className={cx(styles.headIcon, iconClass)} aria-hidden="true">
          <Icon name={icon} size={icon === "pulse" ? 16 : 15} strokeWidth={filled ? undefined : 2} />
        </span>
        <h2 className={styles.tileTitle}>{title}</h2>
      </div>
    </div>
  );
}

export function SummaryWidget({ ritmo, summaryLine }) {
  const parts = [
    { label: "Tareas", value: `${ritmo.tasks.done}/${ritmo.tasks.total}` },
    { label: "Hábitos", value: `${ritmo.habits.done}/${ritmo.habits.total}` },
    { label: "Eventos", value: `${ritmo.events.done}/${ritmo.events.total}` },
  ];

  return (
    <>
      <div className={styles.blobLime} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />
      <h2 className={cx(styles.cardTitle, styles.raised)}>Tu ritmo de hoy</h2>
      <div className={cx(styles.summaryRow, styles.raised)}>
        <LiquidOrb size="mobile" pct={ritmo.pct} label={`${ritmo.done} de ${ritmo.total} actividades`} />
        <div className={styles.summaryParts}>
          {parts.map((part) => (
            <div key={part.label} className={styles.summaryPart}>
              <span className={styles.summaryPartLabel}>{part.label}</span>
              <span className={styles.summaryPartValue}>{part.value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={cx(styles.summaryLine, styles.raised)}>{summaryLine}</p>
    </>
  );
}

export function ActivityWidget({ ritmo, bars }) {
  return (
    <>
      <WidgetHead icon="pulse" iconClass={styles.iconTeal} title="Actividad" />
      <div className={cx(styles.activityCount, styles.countGap)}>
        <span className={styles.bigNumber}>{ritmo.done}</span>
        <span className={styles.bigUnit}>hechas</span>
      </div>
      <span className={styles.meta}>de {ritmo.total} actividades del día</span>
      <HourBars bars={bars} ariaLabel={`Avance del día ${ritmo.pct}%: ${ritmo.done} de ${ritmo.total} actividades`} />
      <div className={styles.activityAxis} aria-hidden="true">
        <span>7 a. m.</span>
        <span className={styles.activityNow}>Ahora</span>
        <span>6 p. m.</span>
      </div>
    </>
  );
}

export function EventsWidget({ events, nowHours }) {
  const scheduled = events.filter((event) => event.status === "programado");
  const next = scheduled.find((event) => (getEventTimeRange(event)?.start ?? 24) > nowHours) || null;
  const nextRange = next && getEventTimeRange(next);

  return (
    <>
      <WidgetHead icon="calendar" iconClass={styles.iconDark} title="Eventos" />
      <span className={styles.flex} />
      <div className={styles.bigRow}>
        <span className={styles.midNumber}>{scheduled.length}</span>
        <span className={styles.midUnit}>por asistir</span>
      </div>
      <span className={styles.metaClip}>
        {next ? `Próximo: ${next.title}${nextRange ? ` · ${formatClockWithPeriod(nextRange.start)}` : ""}` : "Sin eventos pendientes"}
      </span>
    </>
  );
}

export function HabitsWidget({ summary }) {
  return (
    <>
      <WidgetHead icon="flameSolid" iconClass={styles.iconLime} title="Hábitos" filled />
      <span className={styles.flex} />
      <div className={styles.activityCount}>
        <span className={styles.midNumber}>{summary.done}</span>
        <span className={styles.bigUnit}>/{summary.total} hoy</span>
      </div>
      <div className={styles.pips} role="img" aria-label={`${summary.done} de ${summary.total} hábitos cumplidos`}>
        {Array.from({ length: Math.max(summary.total, 1) }, (_, index) => (
          <span key={index} className={cx(styles.pip, index < summary.done && styles.pipOn)} />
        ))}
      </div>
    </>
  );
}

export function TasksWidget({ tasks, summary, nowHours }) {
  const pending = tasks.filter((task) => !isTaskDone(task));
  const next = pending.find((task) => (getTaskTimeRange(task)?.start ?? -1) > nowHours) || pending[0];
  const left = summary.total - summary.done;
  const nextLabel = summary.total === 0 ? "Sin tareas para hoy" : next ? `Sigue: ${next.title}` : "¡Todo listo!";

  return (
    <>
      <WidgetHead icon="taskCircle" iconClass={styles.iconMuted} title="Tareas" />
      <HalfGauge
        ratio={summary.total === 0 ? 0 : summary.done / summary.total}
        value={left}
        caption="por hacer"
        ariaLabel={`${summary.done} de ${summary.total} tareas hechas, ${left} por hacer`}
      />
      {/* En el mockup la cifra va en la cabecera, debajo del botón de abrir; aquí queda visible. */}
      <div className={styles.footRow}>
        <span className={styles.metaClip}>{nextLabel}</span>
        <span className={styles.meta}>{summary.done}/{summary.total}</span>
      </div>
    </>
  );
}

export function FinanceWidget({ finance, monthBalance }) {
  const rising = monthBalance[monthBalance.length - 1] >= monthBalance[0];

  return (
    <>
      <WidgetHead icon="wallet" iconClass={styles.iconMint} title="Disponible" />
      <Sparkline values={monthBalance} ariaLabel={`Saldo del mes ${rising ? "en aumento" : "en descenso"}`} />
      <SplitAmount size="md" value={finance ? finance.balance : null} />
      <span className={styles.meta}>
        {finance ? `Ingresos ${finance.incomePct} % · Gastos ${finance.expensePct} %` : `Ingresos ${NO_DATA} · Gastos ${NO_DATA}`}
      </span>
    </>
  );
}

export function PaymentsWidget({ groups, today, onSettle }) {
  const next = [...groups.out, ...groups.in].slice(0, 3);

  return (
    <>
      <div className={styles.headRow}>
        <h2 className={styles.cardTitle}>Pagos y cobros</h2>
        <IconButton as={Link} to="/expenses" icon="arrowUpRight" label="Ver recurrentes" size={44} variant="soft" iconSize={16} strokeWidth={1.8} />
      </div>
      <div className={styles.payBoxes}>
        <div className={styles.payBox}>
          <span className={styles.payLabel}>
            Por pagar · {groups.out.length}
            {groups.lateCount > 0 && (
              <span className={styles.lateChip}>{plural(groups.lateCount, "vencido", "vencidos")}</span>
            )}
          </span>
          <span className={styles.payTotal}>{formatCurrency(groups.outTotal)}</span>
        </div>
        <div className={styles.payBox}>
          <span className={styles.payLabel}>Por cobrar · {groups.in.length}</span>
          <span className={cx(styles.payTotal, styles.income)}>{formatCurrency(groups.inTotal)}</span>
        </div>
      </div>
      <div className={styles.payList}>
        {next.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="row" today={today} onSettle={onSettle} />
        ))}
        {next.length === 0 && <span className={styles.allClear}>Todo al día ✓</span>}
      </div>
    </>
  );
}

export function DayWidget({ tasks, events, nowHours }) {
  const pins = [
    ...events.map((event) => ({ key: `event-${event.id}`, range: getEventTimeRange(event), kind: "event", done: isEventDone(event) })),
    ...tasks.map((task) => ({ key: `task-${task.id}`, range: getTaskTimeRange(task), kind: "task", done: isTaskDone(task) })),
  ]
    .filter((pin) => pin.range)
    .map((pin) => ({ key: pin.key, hours: pin.range.start, kind: pin.kind, done: pin.done }));
  const pendingCount = pins.filter((pin) => !pin.done).length;

  return (
    <>
      <div className={styles.headRow}>
        <h2 className={styles.cardTitle}>Tu día</h2>
        <span className={styles.meta}>{plural(pendingCount, "pendiente", "pendientes")}</span>
      </div>
      <LollipopTimeline
        pins={pins}
        now={nowHours}
        ariaLabel={`Línea de tiempo de hoy de 7 a. m. a 8 p. m. con ${pins.length} actividades; son las ${formatClock(nowHours)}`}
      />
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={cx(styles.legendDot, styles.legendEvent)} />Eventos</span>
        <span className={styles.legendItem}><span className={cx(styles.legendDot, styles.legendTask)} />Tareas</span>
        <span className={styles.legendItem}><span className={cx(styles.legendDot, styles.legendDone)} />Hecho</span>
      </div>
    </>
  );
}
