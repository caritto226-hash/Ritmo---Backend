import { useCallback, useEffect, useRef, useState } from "react";
import IconButton from "../primitives/IconButton";
import MoneyCard from "./MoneyCard";
import styles from "./MoneyCarousel.module.css";

/**
 * Fila de pagos o cobros pendientes en carrusel horizontal (Pagos y cobros del Inicio web).
 * Se desplaza con las flechas, con arrastre o con la rueda; cada tarjeta encaja al soltar.
 * Las flechas solo aparecen si hay más tarjetas de las que caben.
 * title y total van en la cabecera; empty es el texto cuando no hay pendientes.
 */
function MoneyCarousel({ title, total, reminders, today, onSettle, empty = "Todo al día" }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setEdges({ start: track.scrollLeft <= 1, end: track.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, reminders.length]);

  function scrollByPage(direction) {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const scrollable = !(edges.start && edges.end);

  return (
    <div className={styles.group} role="group" aria-label={title}>
      <div className={styles.head}>
        <span className={styles.title}>{title}</span>
        <span className={styles.total}>{total}</span>
        {scrollable && (
          <span className={styles.arrows}>
            <IconButton icon="chevronLeft" label={`${title}: anteriores`} size={36} variant="soft" strokeWidth={2} onClick={() => scrollByPage(-1)} disabled={edges.start} />
            <IconButton icon="chevronRight" label={`${title}: siguientes`} size={36} variant="soft" strokeWidth={2} onClick={() => scrollByPage(1)} disabled={edges.end} />
          </span>
        )}
      </div>
      <div ref={trackRef} className={styles.track} onScroll={measure}>
        {reminders.map((reminder) => (
          <div key={reminder.occurrenceId} className={styles.slide}>
            <MoneyCard reminder={reminder} variant="compact" today={today} onSettle={onSettle} />
          </div>
        ))}
        {reminders.length === 0 && <div className={styles.empty}>{empty}</div>}
      </div>
    </div>
  );
}

export default MoneyCarousel;
