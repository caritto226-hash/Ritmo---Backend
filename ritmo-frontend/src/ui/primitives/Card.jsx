import cx from "../cx";
import styles from "./Card.module.css";

const VARIANTS = {
  white: styles.white,
  ritmo: styles.ritmo,
  dark: styles.dark,
  darkMobile: styles.darkMobile,
  pastel: styles.pastel,
};

const RADII = { card: styles.radiusCard, bento: styles.radiusBento, list: styles.radiusList };
const PADDINGS = { lg: styles.padLg, md: styles.padMd, sm: styles.padSm, none: styles.padNone };

// Pasteles disponibles para la variante "pastel" (tarjetas de hábito y bloques).
const TINTS = {
  lime: "var(--pastel-lime)",
  mint: "var(--pastel-mint)",
  teal: "var(--pastel-teal)",
  grey: "var(--pastel-grey)",
};

/**
 * Tarjeta base. variant: white | ritmo | dark | darkMobile | pastel.
 * tint (solo pastel): lime | mint | teal | grey, o un color de categoría.
 */
function Card({
  as: Component = "section",
  variant = "white",
  radius = "card",
  padding = "lg",
  tint,
  done = false,
  className,
  style,
  children,
  ...rest
}) {
  const tintValue = tint ? TINTS[tint] || tint : undefined;

  return (
    <Component
      className={cx(styles.card, VARIANTS[variant], RADII[radius], PADDINGS[padding], done && styles.done, className)}
      style={tintValue ? { "--card-tint": tintValue, ...style } : style}
      {...rest}
    >
      {children}
    </Component>
  );
}

// Fila de encabezado: título h2 a la izquierda, metadatos o acciones a la derecha.
export function CardHeader({ title, titleId, meta, children, className }) {
  return (
    <div className={cx(styles.header, className)}>
      <h2 id={titleId} className={styles.title}>{title}</h2>
      {(meta || children) && (
        <div className={styles.actions}>
          {meta && <span className={styles.meta}>{meta}</span>}
          {children}
        </div>
      )}
    </div>
  );
}

export default Card;
