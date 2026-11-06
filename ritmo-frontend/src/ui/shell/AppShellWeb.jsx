import { Link, NavLink } from "react-router-dom";
import { DESIGN_PREVIEW } from "../designPreview";
import IconButton from "../primitives/IconButton";
import PillButton from "../primitives/PillButton";
import cx from "../cx";
import Rail from "./Rail";
import { MAIN_NAV } from "./navigation";
import { LOGO_DARK, LOGO_LIGHT } from "./logo";
import styles from "./AppShellWeb.module.css";

/**
 * Shell web (≥ 760 px): cabecera con logo, píldoras y acciones; título de página; rail lateral.
 * hasUnread: sin API de notificaciones llega en null y la campana se muestra sin punto.
 */
function AppShellWeb({
  userName = "",
  theme = "light",
  onToggleTheme,
  hasUnread = null,
  onNotifications,
  onAccount,
  headerAction,
  title,
  railItems = [],
  onLogout,
  embedded = false,
  children,
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "·";
  const showDot = hasUnread ?? DESIGN_PREVIEW;
  const isDark = theme === "dark";

  return (
    <div className={cx(styles.page, embedded && styles.embedded)}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link to="/dashboard" className={styles.logo} aria-label="Ritmo, inicio">
            <img src={isDark ? LOGO_DARK : LOGO_LIGHT} alt="" className={styles.logoImage} />
          </Link>

          <nav aria-label="Principal" className={styles.nav}>
            {MAIN_NAV.map((item) => (
              <PillButton key={item.to} as={NavLink} to={item.to} icon={item.icon} variant="secondary" size="nav">
                {item.label}
              </PillButton>
            ))}
          </nav>

          <span className={styles.spacer} />
          {headerAction && (
            <>
              {headerAction}
              <span className={styles.spacer} />
            </>
          )}

          <div className={styles.actions}>
            <IconButton
              icon={isDark ? "sun" : "moon"}
              label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              onClick={onToggleTheme}
            />
            <IconButton
              icon="bell"
              label={showDot ? "Notificaciones, hay nuevas" : "Notificaciones"}
              badge={showDot}
              onClick={onNotifications}
            />
            <button type="button" className={styles.avatar} aria-label={`Mi cuenta: ${userName || "usuario"}`} onClick={onAccount}>
              {initial}
            </button>
          </div>
        </header>

        {title}

        <div className={styles.body}>
          <Rail items={railItems} onLogout={onLogout} />
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AppShellWeb;
