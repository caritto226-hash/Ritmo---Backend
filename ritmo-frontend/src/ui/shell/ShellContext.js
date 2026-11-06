import { createContext, useContext, useEffect, useRef } from "react";

/**
 * Lo que MainLayout comparte con las páginas:
 * profile ({ id, name } de GET /dashboard), isWeb, theme, notify(message, type),
 * comingSoon(feature) para acciones sin respaldo en la API, titleSlot (nodo donde la
 * página web pinta su PageTitle), setRailItems (rail propio de la pantalla) y openSettings().
 */
export const ShellContext = createContext({});

export function useShell() {
  return useContext(ShellContext);
}

/**
 * Rail lateral propio de una pantalla web (cada mockup tiene sus accesos).
 * items: los mismos de Rail ({ label, icon, to?, end?, onClick?, active? }). Solo se vuelve a
 * publicar cuando cambian etiqueta, ícono, ruta o activo; los onClick leen siempre la versión
 * más reciente. Al salir de la pantalla vuelve el rail del Inicio.
 */
export function useShellRail(items) {
  const { setRailItems } = useShell();
  const itemsRef = useRef(items);
  const signature = items.map((item) => `${item.label}|${item.icon}|${item.to || ""}|${item.active ? 1 : 0}`).join(",");

  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    if (!setRailItems) return undefined;
    setRailItems(itemsRef.current.map((item, index) => (
      item.onClick ? { ...item, onClick: () => itemsRef.current[index]?.onClick?.() } : item
    )));
    return () => setRailItems(null);
  }, [signature, setRailItems]);
}
