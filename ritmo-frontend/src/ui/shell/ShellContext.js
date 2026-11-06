import { createContext, useContext } from "react";

/**
 * Lo que MainLayout comparte con las páginas:
 * profile ({ id, name } de GET /dashboard), isWeb, theme, notify(message, type),
 * comingSoon(feature) para acciones sin respaldo en la API, titleSlot (nodo donde la
 * página web pinta su PageTitle) y openSettings().
 */
export const ShellContext = createContext({});

export function useShell() {
  return useContext(ShellContext);
}
