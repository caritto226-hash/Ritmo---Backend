import { NavLink } from "react-router-dom";
import IconButton from "../primitives/IconButton";
import styles from "./Rail.module.css";

/**
 * Rail lateral de accesos de cada pantalla web.
 * items: [{ label, icon, to?, end?, onClick?, active? }]. Con "to" es un enlace (activo por ruta);
 * sin "to" es un botón y "active" lo marca como seleccionado.
 */
function Rail({ items, onLogout }) {
  return (
    <nav aria-label="Accesos" className={styles.rail}>
      {items.map((item) =>
        item.to ? (
          <IconButton key={item.label} as={NavLink} to={item.to} end={item.end} icon={item.icon} label={item.label} />
        ) : (
          <IconButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            aria-current={item.active ? "page" : undefined}
          />
        ),
      )}
      <span className={styles.spacer} />
      {onLogout && <IconButton icon="logout" label="Cerrar sesión" onClick={onLogout} />}
    </nav>
  );
}

export default Rail;
