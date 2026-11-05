import { NavLink } from "react-router-dom";
import { DESIGN_PREVIEW } from "../designPreview";
import Icon from "../icons/Icon";
import IconButton from "../primitives/IconButton";
import cx from "../cx";
import { MAIN_NAV } from "./navigation";
import styles from "./MobileShell.module.css";

/**
 * Pantalla móvil (< 760 px) con la barra inferior de 5 pestañas.
 * layout "home" usa los márgenes de Hoy (16) y "default" los del resto (20).
 * contained dibuja la pantalla en un marco fijo (solo para /dev/ui).
 */
function MobileShell({ layout = "default", contained = false, showTabBar = true, children }) {
  const screen = (
    <div className={cx(styles.screen, layout === "home" && styles.home, contained && styles.contained)}>
      {children}
      {showTabBar && !contained && <BottomTabBar />}
    </div>
  );

  if (!contained) return screen;
  return (
    <div className={styles.containedFrame}>
      {screen}
      {showTabBar && <BottomTabBar contained />}
    </div>
  );
}

/**
 * Barra superior: menú, espacio, "+" opcional y campana.
 * elevated aplica la sombra del botón de menú de Tareas/Eventos/Hábitos.
 */
export function MobileTopBar({ onMenu, onAdd, addLabel = "Nueva actividad", hasUnread = null, onNotifications, elevated = false }) {
  const showDot = hasUnread ?? DESIGN_PREVIEW;
  const strokeWidth = elevated ? 2 : 1.8;

  return (
    <div className={styles.topBar}>
      <IconButton icon="menu" label="Menú" size={44} variant={elevated ? "menu" : "muted"} strokeWidth={strokeWidth} onClick={onMenu} />
      <span className={styles.spacer} />
      {onAdd && <IconButton icon="plus" label={addLabel} size={44} variant="primary" strokeWidth={2} onClick={onAdd} />}
      <IconButton
        icon="bell"
        label={showDot ? "Notificaciones, hay nuevas" : "Notificaciones"}
        size={44}
        strokeWidth={strokeWidth}
        badge={showDot}
        onClick={onNotifications}
      />
    </div>
  );
}

// Título móvil: h1 de 30 px, subtítulo y una acción a la derecha.
export function MobilePageTitle({ title, subtitle, action }) {
  return (
    <div className={styles.titleRow}>
      <div className={styles.heading}>
        <h1 className={styles.h1}>{title}</h1>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

// Píldora con círculo blanco interno: "Personalizar", "Calendario", "Progreso".
export function CirclePill({ icon, pressed, children, ...rest }) {
  return (
    <button type="button" aria-pressed={pressed} className={styles.circlePill} {...rest}>
      <span className={styles.circlePillIcon} aria-hidden="true">
        <Icon name={icon} size={17} strokeWidth={1.8} />
      </span>
      {children}
    </button>
  );
}

export function BottomTabBar({ contained = false }) {
  return (
    <nav aria-label="Principal" className={cx(styles.tabBar, contained && styles.tabBarContained)}>
      {MAIN_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} className={styles.tab}>
          {({ isActive }) => (
            <>
              <span className={styles.tabIcon}>
                <Icon name={item.tabIcon} size={isActive ? 20 : 22} strokeWidth={isActive ? 2.2 : 2} />
              </span>
              {item.mobileLabel || item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileShell;
