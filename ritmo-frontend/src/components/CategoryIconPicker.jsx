import { useState } from "react";
import CategoryIcon from "./CategoryIcon";

function CategoryIconPicker({ icons, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const selectedIcon = icons.find(([icon]) => icon === value);

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }

  // Escape cierra solo la lista (desde el botón o desde una opción). preventDefault avisa al
  // diálogo que la contiene (useDialogFocus) que ese Escape ya se atendió.
  function handleKeyDown(event) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    setOpen(false);
    event.currentTarget.querySelector(".category-icon-picker-trigger")?.focus();
  }

  return (
    <div className="category-icon-picker" onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="category-icon-picker-trigger"
        aria-label={`${label}: ${selectedIcon?.[1] || "Etiqueta"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="category-icon-picker-options"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <CategoryIcon name={value} size={22} />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div
          className="category-icon-picker-options"
          id="category-icon-picker-options"
          role="listbox"
          aria-label="Iconos disponibles"
        >
          {icons.map(([icon, iconLabel]) => (
            <button
              type="button"
              role="option"
              aria-selected={icon === value}
              aria-label={iconLabel}
              title={iconLabel}
              className="category-icon-picker-option"
              key={icon}
              onClick={() => {
                onChange(icon);
                setOpen(false);
              }}
            >
              <CategoryIcon name={icon} size={22} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryIconPicker;
