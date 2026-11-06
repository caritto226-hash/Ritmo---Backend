import { useState } from "react";
import { DEFAULT_QUOTES } from "./homeWidgets";

const QUOTE_KEY = "ritmo-home-quote";

function readIndex() {
  try {
    const saved = Number(localStorage.getItem(QUOTE_KEY));
    return Number.isInteger(saved) && saved >= 0 ? saved % DEFAULT_QUOTES.length : 0;
  } catch {
    return 0;
  }
}

// Frase por defecto en rotación ("Otra frase"); la posición se recuerda en este navegador.
export default function useQuote() {
  const [index, setIndex] = useState(readIndex);

  function next() {
    const nextIndex = (index + 1) % DEFAULT_QUOTES.length;
    setIndex(nextIndex);
    try {
      localStorage.setItem(QUOTE_KEY, String(nextIndex));
    } catch {
      // Sin almacenamiento la rotación funciona igual durante la visita.
    }
  }

  return { quote: DEFAULT_QUOTES[index], next };
}
