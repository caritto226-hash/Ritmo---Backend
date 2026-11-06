import { useRef } from "react";
import { createPortal } from "react-dom";
import useDialogFocus from "../../hooks/useDialogFocus";
import Icon from "../icons/Icon";
import IconButton from "../primitives/IconButton";
import styles from "./MobileDrawer.module.css";

/**
 * Cajón del menú móvil (hamburguesa): cuenta, tema, ajustes y cerrar sesión.
 * La navegación principal vive en la barra inferior, por eso no se repite aquí.
 */
function MobileDrawer({ open, onClose, userName, email, theme, onToggleTheme, onSettings, onLogout }) {
  const panelRef = useRef(null);
  useDialogFocus(panelRef, open, onClose);

  if (!open) return null;

  const isDark = theme === "dark";
  const initial = (userName || email || "").trim().charAt(0).toUpperCase() || "·";

  return createPortal(
    <div className={styles.layer}>
      <button type="button" className={styles.scrim} aria-label="Cerrar menú" tabIndex={-1} onClick={onClose} />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú" className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.logo}>
            <Icon name="logo" size={26} strokeWidth={1.8} />
            Ritmo
          </span>
          <IconButton icon="close" label="Cerrar menú" size={44} variant="soft" iconSize={14} strokeWidth={2.2} onClick={onClose} />
        </div>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">{initial}</span>
          <span className={styles.accountCopy}>
            <span className={styles.accountName}>{userName || "Mi cuenta"}</span>
            {email && <span className={styles.accountEmail}>{email}</span>}
          </span>
        </div>

        <nav aria-label="Opciones" className={styles.list}>
          <button type="button" role="switch" aria-checked={isDark} className={styles.item} onClick={onToggleTheme}>
            <Icon name={isDark ? "sun" : "moon"} size={20} />
            <span className={styles.itemLabel}>Modo oscuro</span>
            <span className={styles.switch} aria-hidden="true"><span className={styles.knob} /></span>
          </button>
          <button type="button" className={styles.item} onClick={onSettings}>
            <Icon name="settings" size={20} />
            <span className={styles.itemLabel}>Ajustes</span>
            <Icon name="chevronRight" size={16} strokeWidth={2} />
          </button>
        </nav>

        <span className={styles.spacer} />

        <button type="button" className={styles.item} onClick={onLogout}>
          <Icon name="logout" size={20} />
          <span className={styles.itemLabel}>Cerrar sesión</span>
        </button>
      </aside>
    </div>,
    document.body,
  );
}

export default MobileDrawer;
