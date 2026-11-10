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
 * racha, la cifra del día, la semana en círculos y el botón del día, según el tipo:
 * - Solo marcar (progress null): "Hecho/Pendiente" y "Marcar hecho" / "✓ Hecho".
 * - Cantidad: "4/8 vasos", segmentos y "+ 1 vaso" (con un atajo de unidad) o "+ 1" (onIncrement).
 * - Tiempo: "15/30 min", barra continua y "Registrar tiempo" (onAdjust abre la hoja de avance).
 * En cantidad y tiempo la cifra también abre la hoja (onAdjust) y, cumplido, "✓ Completo" llama
 * onToggle (vuelve a 0). progress: { type, count, goal, unitLabel, unitOne }.
 * offDay: el hábito no toca hoy; atenuado, sin botón (Hábitos v2, decisión 8).
 * tint: color de fondo (con transparencia). Completado = gris con check negro, sin rayas.
 * streak: texto o null ("—"). week: [{ key, label, value (1, 0–1, 0, null = no aplica,
 * undefined = sin datos), today }]; weekNoData muestra "Próximamente" sobre los círculos.
 */
function HabitCard({
  name,
  frequency,
  icon,
  tint,
  done = false,
  progress = null,
  offDay = false,
  streak = null,
  week,
  weekLabel,
  weekNoData = false,
  disabled = false,
  onToggle,
  onIncrement,
  onAdjust,
  onOpen,
}) {
  const measured = Boolean(progress);
  const isDuration = progress?.type === "duration";
  const unit = progress?.unitLabel ? ` ${progress.unitLabel}` : "";
  const amountText = measured ? `${progress.count} de ${progress.goal}${unit}` : "";
  // Sin botón cuando el hábito no toca hoy.
  let button = null;
  if (offDay) {
    button = null;
  } else if (measured && done) {
    button = { label: "✓ Completo", aria: `Volver a 0 hoy: ${name}`, onClick: onToggle, dark: true, pressed: true };
  } else if (isDuration) {
    button = { label: "Registrar tiempo", aria: `Registrar tiempo: ${name}`, onClick: onAdjust, dark: true };
  } else if (measured) {
    button = {
      label: progress.unitOne ? `+ 1 ${progress.unitOne}` : "+ 1",
      aria: `Sumar ${progress.unitOne ? `un ${progress.unitOne}` : "uno"}: ${name}`,
      onClick: onIncrement,
      dark: true,
    };
  } else {
    button = {
      label: done ? "✓ Hecho" : "Marcar hecho",
      aria: `${done ? "Desmarcar" : "Marcar hecho"}: ${name}`,
      onClick: onToggle,
      dark: done,
      pressed: done,
    };
  }

  const ratio = measured ? Math.min(progress.count, progress.goal) / progress.goal : 0;
  const segments = measured && !isDuration ? Math.min(progress.goal, MAX_SEGMENTS) : 0;
  const filled = Math.round(ratio * segments);

  const figure = measured && (
    <span className={styles.big}>
      {progress.count}
      <span className={styles.unit}>/{progress.goal}{unit}</span>
    </span>
  );

  return (
    <section
      aria-label={name}
      className={cx(styles.card, done && styles.done, offDay && styles.offDay)}
      style={done || offDay ? undefined : { "--habit-tint": tint }}
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
        {offDay ? (
          <span className={styles.big}>No toca hoy</span>
        ) : measured ? (
          <>
            {onAdjust ? (
              <button
                type="button"
                className={styles.figureButton}
                onClick={onAdjust}
                disabled={disabled}
                aria-label={`${isDuration ? "Registrar tiempo" : "Ajustar cantidad"} de ${name}: ${amountText}`}
              >
                {figure}
              </button>
            ) : figure}
            {isDuration ? (
              <div className={styles.bar} role="img" aria-label={amountText}>
                <span className={styles.barFill} style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
            ) : (
              <div
                className={styles.segments}
                style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
                role="img"
                aria-label={amountText}
              >
                {Array.from({ length: segments }, (_, index) => (
                  <span key={index} className={cx(styles.segment, index < filled && styles.segmentOn)} />
                ))}
              </div>
            )}
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
        {button && (
          <button
            type="button"
            className={cx(styles.action, button.dark && styles.actionDark)}
            aria-pressed={button.pressed}
            aria-label={button.aria}
            disabled={disabled || !button.onClick}
            onClick={button.onClick}
          >
            {button.label}
          </button>
        )}
      </div>
    </section>
  );
}

export default HabitCard;
