import { useState } from "react";
import BottomSheet from "../primitives/BottomSheet";
import PillButton from "../primitives/PillButton";
import MonthMini from "../charts/MonthMini";
import { parseDateKey } from "../../utils/dates";
import styles from "./DatePickerSheet.module.css";

/**
 * Elegir un día en el calendario del mes (hoja en móvil, diálogo centrado en web).
 * El mes visible se toma de value al montar: montarlo solo mientras está abierta.
 */
function DatePickerSheet({ onClose, value, todayKey, markedDates, onSelect, title = "Elegir día" }) {
  const [view, setView] = useState(() => parseDateKey(value));

  function shift(step) {
    setView(({ year, month }) => {
      const date = new Date(Date.UTC(year, month + step, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  function pick(dateKey) {
    onSelect(dateKey);
    onClose();
  }

  return (
    <BottomSheet open onClose={onClose} title={title}>
      <div className={styles.calendar}>
        <MonthMini
          year={view.year}
          month={view.month}
          selectedKey={value}
          todayKey={todayKey}
          markedDates={markedDates}
          onSelect={pick}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
        />
      </div>
      <PillButton variant="primary" size="cta" icon="calendar" block onClick={() => pick(todayKey)}>
        Ir a hoy
      </PillButton>
    </BottomSheet>
  );
}

export default DatePickerSheet;
