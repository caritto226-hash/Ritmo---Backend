import BottomSheet from "../primitives/BottomSheet";
import Icon from "../icons/Icon";
import styles from "./MonthPickerSheet.module.css";

/**
 * Elegir el mes de Finanzas (la píldora "Noviembre 2026" / "Oct 2026" de los mockups no dibuja el
 * menú). options: [{ value: "2026-11", label: "Noviembre 2026" }]; note explica de dónde salen.
 * En web la hoja se muestra como diálogo centrado (BottomSheet).
 */
function MonthPickerSheet({ open, options, value, note, onChange, onClose }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Elegir mes">
      <div className={styles.list} role="radiogroup" aria-label="Mes">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={styles.option}
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              data-autofocus={selected || undefined}
            >
              {option.label}
              {selected && <Icon name="check" size={18} strokeWidth={2.4} />}
            </button>
          );
        })}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </BottomSheet>
  );
}

export default MonthPickerSheet;
