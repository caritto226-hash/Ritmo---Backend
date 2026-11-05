import { useSyncExternalStore } from "react";
import { WEB_MIN_WIDTH } from "../ui/shell/navigation";

const QUERY = `(min-width: ${WEB_MIN_WIDTH}px)`;

function subscribe(callback) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

// true con el layout web (≥ 760 px); false con el móvil. La misma ruta cambia de layout.
export default function useIsWeb() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true);
}
