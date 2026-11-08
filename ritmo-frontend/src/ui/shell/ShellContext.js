import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Lo que MainLayout comparte con las páginas:
 * profile ({ id, name } de GET /dashboard), isWeb, theme, notify(message, type),
 * comingSoon(feature) para acciones sin respaldo en la API, titleSlot (nodo donde la
 * página web pinta su PageTitle), setRailItems (rail propio de la pantalla), openSettings()
 * y pageStore (lo que guarda usePageState).
 */
export const ShellContext = createContext({});

export function useShell() {
  return useContext(ShellContext);
}

/**
 * useState que sobrevive al corte de 760 px: MainLayout cambia AppShellWeb por MobileShell y la
 * página se vuelve a montar. El valor queda en MainLayout por ruta y clave, así que el mes, los
 * filtros, la búsqueda, el día o la vista siguen igual en el otro layout. Al salir de la ruta se
 * descarta: volver a la pantalla empieza de cero. Fuera del shell (/dev/ui) es un useState común.
 */
export function usePageState(key, initial) {
  const { pageStore } = useShell();
  const { pathname } = useLocation();
  const storeKey = `${pathname}|${key}`;
  const [value, setValue] = useState(() => {
    if (pageStore?.has(storeKey)) return pageStore.get(storeKey);
    return typeof initial === "function" ? initial() : initial;
  });

  useEffect(() => {
    pageStore?.set(storeKey, value);
  }, [pageStore, storeKey, value]);

  return [value, setValue];
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
