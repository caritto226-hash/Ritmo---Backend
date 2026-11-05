import { useRef } from "react";
import cx from "../cx";
import styles from "./SegmentedControl.module.css";

/**
 * Control segmentado con semántica de pestañas (role="tablist").
 * options: [{ value, label }]. Las flechas izquierda/derecha cambian la selección.
 */
function SegmentedControl({ options, value, onChange, label, variant = "web", className }) {
  const groupRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    groupRef.current?.querySelector(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="tablist"
      aria-label={label}
      className={cx(styles.group, styles[variant], className)}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            data-value={option.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
