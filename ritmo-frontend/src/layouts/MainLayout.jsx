import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import dashboardService from "../services/dashboard.service";
import useIsWeb from "../hooks/useIsWeb";
import AppShellWeb from "../ui/shell/AppShellWeb";
import MobileShell, { MobileTopBar } from "../ui/shell/MobileShell";
import MobileDrawer from "../ui/shell/MobileDrawer";
import { ShellContext } from "../ui/shell/ShellContext";
import PillButton from "../ui/primitives/PillButton";
import Toast from "../ui/primitives/Toast";
import { CategoriesSheet, NewActivitySheet, SettingsSheet } from "./ShellSheets";
import styles from "./MainLayout.module.css";

const THEME_KEY = "ritmo-theme";

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Shell de las pantallas con sesión: AppShellWeb (≥ 760 px) o MobileShell (< 760 px).
 * El nombre del usuario sale de GET /dashboard (user.name); el resto de cada pantalla lo carga la página.
 */
function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const isWeb = useIsWeb();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(readTheme);
  const [profile, setProfile] = useState(null);
  const [titleSlot, setTitleSlot] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Sin almacenamiento el tema dura lo que dure la sesión del navegador.
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    dashboardService.getDashboard()
      .then((data) => active && setProfile(data.user))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Al cambiar de pantalla se cierran el cajón y las hojas.
  const [shownPath, setShownPath] = useState(location.pathname);
  if (shownPath !== location.pathname) {
    setShownPath(location.pathname);
    setDrawerOpen(false);
    setSheet(null);
  }

  const notify = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const comingSoon = useCallback((feature) => {
    notify(`${feature}: próximamente.`);
  }, [notify]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const shell = useMemo(() => ({
    profile,
    isWeb,
    theme,
    toggleTheme,
    notify,
    comingSoon,
    titleSlot,
    openSettings: () => setSheet("settings"),
  }), [profile, isWeb, theme, toggleTheme, notify, comingSoon, titleSlot]);

  const userName = profile?.name?.trim() || "";
  const email = user?.correo || "";
  const isHome = location.pathname === "/dashboard";

  const railItems = [
    { label: "Inicio", icon: "home", to: "/dashboard", end: true },
    { label: "Calendario", icon: "calendarDays", to: "/events" },
    { label: "Mi journal", icon: "journal", onClick: () => comingSoon("Mi journal") },
    { label: "Categorías", icon: "tag", onClick: () => setSheet("categories") },
    { label: "Ajustes", icon: "settings", onClick: () => setSheet("settings") },
  ];

  function startActivity(path) {
    setSheet(null);
    navigate(path, { state: { create: true } });
  }

  const sheets = (
    <>
      <NewActivitySheet open={sheet === "new"} onClose={() => setSheet(null)} onPick={startActivity} />
      <SettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        userName={userName}
        email={email}
        theme={theme}
        onThemeChange={setTheme}
        onCustomize={() => {
          setSheet(null);
          navigate("/dashboard", { state: { customize: true } });
        }}
        onCategories={() => setSheet("categories")}
        onLogout={logout}
      />
      {sheet === "categories" && <CategoriesSheet open onClose={() => setSheet(null)} notify={notify} />}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );

  if (isWeb) {
    return (
      <ShellContext.Provider value={shell}>
        <AppShellWeb
          userName={userName || email}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNotifications={() => comingSoon("Notificaciones")}
          onAccount={() => setSheet("settings")}
          headerAction={
            <PillButton icon="plus" size="nav" onClick={() => setSheet("new")}>Nueva actividad</PillButton>
          }
          title={<div ref={setTitleSlot} className={styles.titleSlot} />}
          railItems={railItems}
          onLogout={logout}
        >
          <Outlet />
        </AppShellWeb>
        {sheets}
      </ShellContext.Provider>
    );
  }

  return (
    <ShellContext.Provider value={shell}>
      <MobileShell layout={isHome ? "home" : "default"}>
        <MobileTopBar
          onMenu={() => setDrawerOpen(true)}
          onAdd={() => setSheet("new")}
          onNotifications={() => comingSoon("Notificaciones")}
        />
        <Outlet />
      </MobileShell>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userName}
        email={email}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSettings={() => {
          setDrawerOpen(false);
          setSheet("settings");
        }}
        onLogout={logout}
      />
      {sheets}
    </ShellContext.Provider>
  );
}

export default MainLayout;
