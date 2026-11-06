import styles from "./ProgressRing.module.css";

const RADIUS = 74;
const CIRCUMFERENCE = 465;

/**
 * Anillo "Hoy x/y cumplidos" de Hábitos web (HabitosWeb.dc.html), 170 px.
 * done y total son los hábitos cumplidos hoy y el total.
 */
function ProgressRing({ done, total, caption = "cumplidos", ariaLabel }) {
  const dash = total > 0 ? (done / total) * CIRCUMFERENCE : 0;

  return (
    <div role="img" aria-label={ariaLabel} className={styles.ring}>
      <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true" className={styles.svg}>
        <circle cx="85" cy="85" r={RADIUS} className={styles.track} strokeWidth="10" />
        {dash > 0 && (
          <circle
            cx="85"
            cy="85"
            r={RADIUS}
            fill="none"
            className={styles.value}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash.toFixed(1)} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <div className={styles.center}>
        <span className={styles.number}>{done}<span className={styles.total}>/{total}</span></span>
        <span className={styles.caption}>{caption}</span>
      </div>
    </div>
  );
}

export default ProgressRing;
