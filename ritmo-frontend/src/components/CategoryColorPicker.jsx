import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const colorPalette = [
  "#D94F70", "#E8754D", "#F2A541", "#E3C547", "#83B84A",
  "#38A780", "#36A6A6", "#4A9CD6", "#4972CF", "#7558C7",
  "#A24FBA", "#D35A9A", "#7B8794", "#596579", "#2D3748",
  "#1565C0", "#00897B", "#6D4C41", "#EF6C00", "#C62828",
];

const hexColorPattern = /^#[0-9A-F]{6}$/i;

function CategoryColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    function updatePosition() {
      if (!triggerRef.current || !popoverRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const margin = 12;
      const fitsBelow = triggerRect.bottom + 8 + popoverRect.height <= window.innerHeight - margin;
      const top = fitsBelow
        ? triggerRect.bottom + 8
        : Math.max(margin, triggerRect.top - popoverRect.height - 8);
      const left = Math.min(
        Math.max(margin, triggerRect.left),
        window.innerWidth - popoverRect.width - margin,
      );

      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function updateCustomColor(nextColor) {
    setCustomColor(nextColor);
    if (hexColorPattern.test(nextColor)) onChange(nextColor.toUpperCase());
  }

  function closePicker() {
    setOpen(false);
  }

  return (
    <div className="category-color-picker">
      <button
        ref={triggerRef}
        type="button"
        className="category-color-picker-trigger"
        aria-label={`${label}: ${value}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="category-color-picker-popover"
        onClick={() => {
          setCustomColor(value);
          setOpen((isOpen) => !isOpen);
        }}
      >
        <span className="category-color-picker-current" style={{ backgroundColor: value }} aria-hidden="true" />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && createPortal(
        <div className="category-color-picker-layer">
          <button
            type="button"
            className="category-color-picker-backdrop"
            aria-label="Cerrar selector de color"
            onClick={closePicker}
          />
          <section
            ref={popoverRef}
            id="category-color-picker-popover"
            className="category-color-picker-popover"
            role="dialog"
            aria-label="Elegir color"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
          >
            <header className="category-color-picker-header">
              <div>
                <h3>Color de categoría</h3>
                <p>Elige un tono o escribe un código hexadecimal.</p>
              </div>
              <button type="button" className="category-color-picker-close" onClick={closePicker} aria-label="Cerrar selector">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="category-color-picker-palette" aria-label="Colores predeterminados">
              {colorPalette.map((color) => (
                <button
                  type="button"
                  key={color}
                  className="category-color-picker-swatch"
                  style={{ "--swatch-color": color }}
                  aria-label={color}
                  aria-pressed={value.toUpperCase() === color}
                  title={color}
                  onClick={() => {
                    onChange(color);
                    setCustomColor(color);
                    closePicker();
                  }}
                />
              ))}
            </div>
            <div className="category-color-picker-custom">
              <span className="category-color-picker-preview" style={{ backgroundColor: value }} aria-hidden="true" />
              <label htmlFor="category-color-hex">Color personalizado</label>
              <input
                id="category-color-hex"
                type="text"
                value={customColor}
                maxLength={7}
                spellCheck="false"
                autoComplete="off"
                aria-label="Código hexadecimal del color"
                aria-invalid={!hexColorPattern.test(customColor)}
                onChange={(event) => updateCustomColor(event.target.value)}
                onBlur={() => {
                  if (!hexColorPattern.test(customColor)) setCustomColor(value);
                }}
              />
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default CategoryColorPicker;
