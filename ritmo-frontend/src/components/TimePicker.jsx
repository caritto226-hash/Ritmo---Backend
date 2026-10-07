import { useEffect, useRef, useState } from "react";
import "../styles/time-picker.css";

const hours = Array.from({ length: 24 }, (_, hour) => hour);
const minutes = Array.from({ length: 60 }, (_, minute) => minute);

function pad(value) {
  return String(value).padStart(2, "0");
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
    const selectedHourOption = hourOptionRefs.current[selectedHour];
    const selectedMinuteOption = minuteOptionRefs.current[selectedMinute];
    selectedHourOption?.scrollIntoView({ block: "nearest" });
    selectedMinuteOption?.scrollIntoView({ block: "nearest" });
  }, [isOpen, selectedHour, selectedMinute]);

  function selectHour(hour) {
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
        aria-label={value ? `${label}: ${value}` : `${label}: seleccionar`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span className={value ? "" : "placeholder"}>
          {value || "Seleccionar hora"}
        </span>
        <span className="time-picker-trigger-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <section className="time-picker-panel" role="dialog" aria-label={`Seleccionar ${label.toLowerCase()}`}>
          <div className="time-picker-column">
            <span className="time-picker-column-label">Hora</span>
            <div className="time-picker-options" role="listbox" aria-label="Hora">
              {hours.map((hour) => (
                <button
                  type="button"
                  className={`time-picker-option ${hour === selectedHour ? "selected" : ""}`}
                  key={hour}
                  ref={(element) => {
                    if (element) hourOptionRefs.current[hour] = element;
                  }}
                  role="option"
                  aria-selected={hour === selectedHour}
                  onClick={() => selectHour(hour)}
                >
                  {pad(hour)}
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
