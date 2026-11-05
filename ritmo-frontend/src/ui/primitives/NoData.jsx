import cx from "../cx";
import styles from "./NoData.module.css";

// Etiqueta discreta para lo que no tiene respaldo en la API (ver design-handoff/BACKEND_PENDIENTE.md).
function NoData({ children = "Próximamente", className }) {
  return <span className={cx(styles.label, className)}>{children}</span>;
}

export default NoData;
