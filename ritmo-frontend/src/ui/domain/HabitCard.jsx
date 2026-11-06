import CategoryIcon from "../../components/CategoryIcon";
import Icon from "../icons/Icon";
import NoData from "../primitives/NoData";
import { NO_DATA } from "../designPreview";
import cx from "../cx";
import styles from "./HabitCard.module.css";

// Más segmentos no caben en la tarjeta: con metas grandes cada segmento vale varias unidades.
const MAX_SEGMENTS = 12;

function dayClass(value) {
  if (value === null) return styles.dayNone;
  if (value >= 1) return styles.dayDone;
  if (value > 0) return styles.dayPartial;
  return null;
}

/**
 * Tarjeta pastel de un hábito (HabitosWeb.dc.html): ícono, nombre (abre el detalle), frecuencia,
 * racha, "Hecho/Pendiente" o el conteo con segmentos, la semana en círculos y el botón del día.
 * tint: color de fondo (con transparencia). Completado = gris con check negro, sin rayas.
 * counter: { count (null sin datos), goal, unit? { one, many } }; onIncrement (sin él, "+ 1"
 * queda deshabilitado con "Próximamente"). streak: texto o null ("—").
 * week: [{ key, label, value (1, 0–1, 0, null = no aplica, undefined = sin datos), today }];
 * weekNoData muestra "Próximamente" sobre los círculos.
 */
function HabitCard({
  name,
  frequency,
  icon,
  tint,
  done = false,
  counter = null,
  streak = null,
  week,
  weekLabel,
  weekNoData = false,
  disabled = false,
  onToggle,
  onIncrement,
  onOpen,
}) {
  const isCounter = Boolean(counter);
  const unit = counter?.unit;
  let button;
  if (isCounter && !done) {
    button = {
      label: `+ 1${unit ? ` ${unit.one}` : ""}`,
      aria: `Sumar ${unit ? `un ${unit.one}` : "uno"}: ${name}`,
      onClick: onIncrement,
      dark: true,
      unavailable: !onIncrement,
    };
  } else {
    button = {
      label: done ? (isCounter ? "✓ Completo" : "✓ Hecho") : "Marcar hecho",
      aria: `${done ? "Desmarcar" : "Marcar hecho"}: ${name}`,
      onClick: onToggle,
      dark: done,
      pressed: done,
    };
  }

  const segments = isCounter ? Math.min(counter.goal, MAX_SEGMENTS) : 0;
  const filled = isCounter && counter.count !== null ? Math.round((Math.min(counter.count, counter.goal) / counter.goal) * segments) : 0;

  return (
    <section
      aria-label={name}
      className={cx(styles.card, done && styles.done)}
      style={done ? undefined : { "--habit-tint": tint }}
    >
      <div className={styles.head}>
        <div className={styles.identity}>
          <span className={styles.icon} aria-hidden="true">
            <CategoryIcon name={icon} size={22} />
          </span>
          <div className={styles.copy}>
            <h2 className={styles.name}>
              {onOpen ? (
                <button type="button" className={styles.nameButton} onClick={onOpen} aria-label={`Ver detalles de ${name}`}>
                  {name}
                </button>
              ) : name}
            </h2>
            <span className={styles.freq}>{frequency}</span>
          </div>
        </div>
        <span className={styles.streak}>
          <Icon name="flameSolid" size={12} />
          <span className={styles.visuallyHidden}>Racha:</span>
          {streak ?? NO_DATA}
        </span>
      </div>

      <div className={styles.body}>
        {isCounter ? (
          <>
            <span className={styles.big}>
              {done ? counter.goal : counter.count ?? NO_DATA}
              <span className={styles.unit}>/{counter.goal}{unit ? ` ${unit.many}` : ""}</span>
            </span>
            <div
              className={styles.segments}
              style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
              role="img"
              aria-label={counter.count === null && !done ? "Conteo del día: próximamente" : `${done ? counter.goal : counter.count} de ${counter.goal}`}
            >
              {Array.from({ length: segments }, (_, index) => (
                <span key={index} className={cx(styles.segment, (done || index < filled) && styles.segmentOn)} />
              ))}
            </div>
            {counter.count === null && !done && <NoData className={styles.noData} />}
          </>
        ) : (
          <span className={styles.big}>{done ? "Hecho" : "Pendiente"}</span>
        )}
      </div>

      <div className={styles.foot}>
        <div className={styles.weekBlock}>
          {weekNoData && <NoData className={styles.noData} />}
          <div role="img" aria-label={weekLabel} className={styles.week}>
            {week.map((day) => (
              <span key={day.key} className={styles.day}>
                <span className={cx(styles.dayCircle, dayClass(day.value), day.today && styles.dayToday)} />
                <span className={styles.dayLabel}>{day.label}</span>
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={cx(styles.action, button.dark && styles.actionDark)}
          aria-pressed={button.pressed}
          aria-label={button.unavailable ? `${button.aria} (próximamente)` : button.aria}
          disabled={disabled || button.unavailable}
          onClick={button.onClick}
        >
          {button.label}
        </button>
      </div>
    </section>
  );
}

export default HabitCard;
