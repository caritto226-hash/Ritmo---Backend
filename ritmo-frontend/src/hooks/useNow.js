import { useEffect, useState } from "react";
import { getBogotaNow } from "../utils/dates";

const TICK_MS = 60 * 1000;

// Fecha y hora de Bogotá que se actualiza cada minuto (marca "ahora" y cambio de día a medianoche).
export default function useNow() {
  const [now, setNow] = useState(getBogotaNow);

  useEffect(() => {
    const timer = setInterval(() => setNow(getBogotaNow()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return now;
}
