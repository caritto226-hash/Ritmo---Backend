import { useEffect, useRef, useState } from "react";
import { formatTime12 } from "../utils/time";
import "../styles/time-picker.css";

// Horas de 12 h: 12, 1, 2 … 11. El período (a. m. / p. m.) se elige aparte.
const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minutes = Array.from({ length: 60 }, (_, minute) => minute);

function pad(value) {
  return String(value).padStart(2, "0");
}

// Convierte la hora de 12 h + período a la hora de 24 h que se guarda.
function to24Hour(hour12, period) {
  return (hour12 % 12) + (period === "pm" ? 12 : 0);
}

function TimePicker({ name, value, onChange, label, required = false }) {
  const rootRef = useRef(null);
  const hourOptionRefs = useRef({});
  const minuteOptionRefs = useRef({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => (
    /^\d{2}:\d{2}$/.test(value || "") ? Number(value.slice(0, 2)) : null
  ));
  const selectedMinute = /^\d{2}:\d{2}$/.test(value || "")
    ? Number(value.slice(3, 5))
    : null;
  const [period, setPeriod] = useState(() => (
    /^\d{2}:\d{2}$/.test(value || "") && Number(value.slice(0, 2)) >= 12 ? "pm" : "am"
  ));
  const selectedHour12 = selectedHour === null ? null : selectedHour % 12 || 12;

  useEffect(() => {
    function closeOnOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const selectedHourOption = hourOptionRefs.current[selectedHour12];
    const selectedMinuteOption = minuteOptionRefs.current[selectedMinute];
    selectedHourOption?.scrollIntoView({ block: "nearest" });
    selectedMinuteOption?.scrollIntoView({ block: "nearest" });
  }, [isOpen, selectedHour12, selectedMinute]);

  function selectHour(hour12) {
    const hour = to24Hour(hour12, period);
    setSelectedHour(hour);
    onChange({ target: { name, value: `${pad(hour)}:${pad(selectedMinute ?? 0)}` } });
  }

  // Cambiar a. m. / p. m. mueve la hora ya elegida 12 horas (2:00 a. m. → 2:00 p. m.).
  function selectPeriod(nextPeriod) {
    setPeriod(nextPeriod);
    if (selectedHour === null) return;
    const hour = to24Hour(selectedHour12, nextPeriod);
    setSelectedHour(hour);
    onChange({ target: { name, value: `${pad(hour)}:${pad(selectedMinute ?? 0)}` } });
  }

  function selectMinute(minute) {
    if (selectedHour === null) return;
    onChange({ target: { name, value: `${pad(selectedHour)}:${pad(minute)}` } });
    setIsOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") setIsOpen(false);
  }

  return (
    <div className="time-picker-field" ref={rootRef} onKeyDown={handleKeyDown}>
      <span className="time-picker-label">{label}</span>
      <button
        type="button"
        className={`time-picker-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={value ? `${label}: ${formatTime12(value)}` : `${label}: seleccionar`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span className={value ? "" : "placeholder"}>
          {value ? formatTime12(value) : "Seleccionar hora"}
        </span>
        <span className="time-picker-trigger-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <section className="time-picker-panel" role="dialog" aria-label={`Seleccionar ${label.toLowerCase()}`}>
          <div className="time-picker-period" role="group" aria-label="a. m. o p. m.">
            {[["am", "a. m."], ["pm", "p. m."]].map(([option, text]) => (
              <button
                type="button"
                key={option}
                className={`time-picker-option ${period === option ? "selected" : ""}`}
                aria-pressed={period === option}
                onClick={() => selectPeriod(option)}
              >
                {text}
              </button>
            ))}
          </div>
          <div className="time-picker-column">
            <span className="time-picker-column-label">Hora</span>
            <div className="time-picker-options" role="listbox" aria-label="Hora">
              {hours12.map((hour) => (
                <button
                  type="button"
                  className={`time-picker-option ${hour === selectedHour12 ? "selected" : ""}`}
                  key={hour}
                  ref={(element) => {
                    if (element) hourOptionRefs.current[hour] = element;
                  }}
                  role="option"
                  aria-selected={hour === selectedHour12}
                  onClick={() => selectHour(hour)}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>
          <div className="time-picker-column">
            <span className="time-picker-column-label">Minutos</span>
            {selectedHour === null && (
              <span className="time-picker-hint">Elige una hora primero</span>
            )}
            <div className="time-picker-options" role="listbox" aria-label="Minutos">
              {minutes.map((minute) => (
                <button
                  type="button"
                  className={`time-picker-option ${minute === selectedMinute ? "selected" : ""}`}
                  key={minute}
                  ref={(element) => {
                    if (element) minuteOptionRefs.current[minute] = element;
                  }}
                  role="option"
                  aria-selected={minute === selectedMinute}
                  aria-disabled={selectedHour === null}
                  disabled={selectedHour === null}
                  onClick={() => selectMinute(minute)}
                >
                  {pad(minute)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default TimePicker;
