import NoData from "../primitives/NoData";
import cx from "../cx";
import styles from "./HeatMap.module.css";

const LEVELS = [styles.l0, styles.l1, styles.l2, styles.l3, styles.l4];

/**
 * Mapa de constancia (HabitosWeb.dc.html): columnas de lunes a domingo y una fila por semana.
 * cells: [{ key, level (0–4; null = sin datos, pista vacía), future, today }].
 * noData muestra "Próximamente" junto a la leyenda.
 */
function HeatMap({ letters, cells, ariaLabel, noData = false }) {
  return (
    <>
      <div role="img" aria-label={ariaLabel} className={styles.grid}>
        {letters.map((letter, index) => (
          <span key={`l${index}`} className={styles.letter}>{letter}</span>
        ))}
        {cells.map((cell) => (
          <span
            key={cell.key}
            className={cx(styles.cell, cell.future ? styles.future : LEVELS[cell.level ?? 0], cell.today && styles.today)}
          />
        ))}
      </div>
      <div className={styles.legend}>
        Menos
        {LEVELS.map((level, index) => <span key={index} className={cx(styles.swatch, level)} />)}
        Más
        {noData && <NoData className={styles.noData} />}
      </div>
    </>
  );
}

export default HeatMap;
