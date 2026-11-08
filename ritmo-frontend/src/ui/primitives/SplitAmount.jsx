import { NO_DATA } from "../designPreview";
import { formatAmountDigits } from "../../utils/financeFormat";
import cx from "../cx";
import styles from "./SplitAmount.module.css";

/**
 * Monto grande en pesos enteros con el último grupo atenuado: $1.110.800 → "$1.110" + ".800".
 * size: lg (40, tarjetas web) | stat (40 con el $ de 24, Finanzas web) | md (24, bento móvil).
 * value null → "—".
 */
function SplitAmount({ value, size = "lg", className }) {
  if (value === null || value === undefined) {
    return <span className={cx(styles.amount, styles[size], className)}>{NO_DATA}</span>;
  }

  const amount = Math.round(Number(value));
  const digits = formatAmountDigits(String(Math.abs(amount)));
  const cut = digits.lastIndexOf(".");
  const head = cut < 0 ? digits : digits.slice(0, cut);
  const tail = cut < 0 ? "" : digits.slice(cut);

  return (
    <span className={cx(styles.amount, styles[size], className)}>
      {amount < 0 && "−"}
      <span className={styles.currency}>$</span>
      {head}
      {tail && <span className={styles.tail}>{tail}</span>}
    </span>
  );
}

export default SplitAmount;
