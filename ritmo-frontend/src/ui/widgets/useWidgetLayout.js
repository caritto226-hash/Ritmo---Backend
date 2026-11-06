import { useEffect, useRef, useState } from "react";

// Lee el objeto guardado ({ web: [...], mobile: [...] }). localStorage puede fallar
// (modo privado, cuota llena o JSON dañado): en ese caso se usa el layout por defecto.
function readStore(storageKey) {
  if (!storageKey) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// Descarta ids desconocidos o repetidos y anchos que el widget no admite.
function sanitize(items, catalog) {
  if (!Array.isArray(items)) return null;
  const seen = new Set();
  return items
    .filter((item) => item && catalog[item.id] && !seen.has(item.id) && seen.add(item.id))
    .map((item) => {
      const sizes = catalog[item.id].sizes;
      if (!sizes) return { id: item.id };
      return { id: item.id, span: sizes.includes(item.span) ? item.span : sizes[0] };
    });
}

/**
 * Layout de widgets del Inicio (orden, ancho y quitados) guardado por usuario y plataforma.
 * catalog: { [id]: { sizes?: number[] } }; defaults: [{ id, span? }].
 * onError(message) avisa si no se pudo guardar; el cambio se mantiene en pantalla igual.
 */
export default function useWidgetLayout({ storageKey, platform, catalog, defaults, onError }) {
  const source = `${storageKey}|${platform}`;
  const read = () => sanitize(readStore(storageKey)[platform], catalog) || defaults;
  const [state, setState] = useState(() => ({ source, layout: read(), dirty: false }));
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Al conocer el usuario (o cambiar de plataforma) se carga su layout guardado.
  if (state.source !== source) setState({ source, layout: read(), dirty: false });
  const { layout } = state;

  // Guardar es sincronizar con localStorage: se hace después de cada cambio del usuario.
  useEffect(() => {
    if (!state.dirty || !storageKey) return;
    try {
      const store = readStore(storageKey);
      localStorage.setItem(storageKey, JSON.stringify({ ...store, [platform]: state.layout }));
    } catch {
      onErrorRef.current?.("No se pudo guardar la organización de tus widgets en este navegador.");
    }
  }, [state, storageKey, platform]);

  // Cada cambio parte del layout más reciente (varios toques seguidos no se pisan).
  function update(change) {
    setState((current) => {
      const next = change(current.layout);
      return next === current.layout ? current : { source: current.source, layout: next, dirty: true };
    });
  }

  function move(id, direction) {
    update((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveTo(sourceId, targetId) {
    if (sourceId === targetId) return;
    update((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.id === sourceId);
      if (from < 0) return current;
      const [item] = next.splice(from, 1);
      const to = next.findIndex((entry) => entry.id === targetId);
      if (to < 0) return current;
      next.splice(to, 0, item);
      return next;
    });
  }

  function resize(id) {
    const sizes = catalog[id]?.sizes;
    if (!sizes || sizes.length < 2) return;
    update((current) => current.map((item) => (
      item.id === id ? { ...item, span: sizes[(sizes.indexOf(item.span) + 1) % sizes.length] } : item
    )));
  }

  function remove(id) {
    update((current) => current.filter((item) => item.id !== id));
  }

  function add(id) {
    const sizes = catalog[id]?.sizes;
    update((current) => (
      !catalog[id] || current.some((item) => item.id === id)
        ? current
        : [...current, sizes ? { id, span: sizes[Math.min(1, sizes.length - 1)] } : { id }]
    ));
  }

  return {
    layout,
    hidden: Object.keys(catalog).filter((id) => !layout.some((item) => item.id === id)),
    move,
    moveTo,
    resize,
    remove,
    add,
    reset: () => update(() => defaults),
  };
}
