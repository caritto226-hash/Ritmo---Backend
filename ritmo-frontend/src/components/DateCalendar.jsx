import { useEffect, useRef, useState } from "react";
import "../styles/date-calendar.css";

const monthFormatter = new Intl.DateTimeFormat("es-CO", { month: "long" });
const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: monthFormatter.format(new Date(2024, month, 1)),
}));
const yearOptions = Array.from({ length: 201 }, (_, index) => 1900 + index);
const weekdayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateCalendar({ name, value, onChange, label, required = false, onClear }) {
  const [openPicker, setOpenPicker] = useState(null);
  const calendarRef = useRef(null);
  const selectedYearRef = useRef(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDate(value);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    function closePicker(event) {
      if (!calendarRef.current?.contains(event.target)) {
        setOpenPicker(null);
      }
    }

    document.addEventListener("pointerdown", closePicker);
    return () => document.removeEventListener("pointerdown", closePicker);
  }, []);

  useEffect(() => {
    if (openPicker === "year") {
      selectedYearRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [openPicker]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = formatDate(new Date());
  const days = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `empty-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month, day);
      return {
        key: formatDate(date),
        date,
        day,
      };
    }),
  ];

  function changeMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function changeVisibleMonth(selectedMonth) {
    setVisibleMonth((current) => new Date(current.getFullYear(), selectedMonth, 1));
    setOpenPicker(null);
  }

  function changeVisibleYear(selectedYear) {
    setVisibleMonth((current) => new Date(selectedYear, current.getMonth(), 1));
    setOpenPicker(null);
  }

  function togglePicker(picker) {
    setOpenPicker((current) => current === picker ? null : picker);
  }

  function handleCalendarKeyDown(event) {
    if (event.key === "Escape") {
      setOpenPicker(null);
    }
  }

  function selectDate(date) {
    onChange({ target: { name, value: formatDate(date) } });
  }

  return (
    <div className="date-calendar-field">
      {label && <span className="date-calendar-label">{label}</span>}
      <section
        className="date-calendar"
        ref={calendarRef}
        role="group"
        aria-label={label || "Seleccionar fecha"}
        aria-required={required}
        onKeyDown={handleCalendarKeyDown}
      >
        <header className="date-calendar-header">
          <div className="date-calendar-month">
            <div className="date-calendar-picker-wrap">
              <button
                type="button"
                className={`date-calendar-picker-trigger date-calendar-month-trigger ${openPicker === "month" ? "open" : ""}`}
                onClick={() => togglePicker("month")}
                aria-label="Seleccionar mes"
                aria-haspopup="listbox"
                aria-expanded={openPicker === "month"}
              >
                {monthOptions[month].label}
                <span className="date-calendar-chevron" aria-hidden="true" />
              </button>
              {openPicker === "month" && (
                <div className="date-calendar-picker-menu date-calendar-month-menu" role="listbox" aria-label="Mes">
                  {monthOptions.map((option) => (
                    <button
                      type="button"
                      className={`date-calendar-picker-option ${option.value === month ? "selected" : ""}`}
                      key={option.value}
                      role="option"
                      aria-selected={option.value === month}
                      onClick={() => changeVisibleMonth(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="date-calendar-picker-wrap">
              <button
                type="button"
                className={`date-calendar-picker-trigger date-calendar-year-trigger ${openPicker === "year" ? "open" : ""}`}
                onClick={() => togglePicker("year")}
                aria-label="Seleccionar año"
                aria-haspopup="listbox"
                aria-expanded={openPicker === "year"}
              >
                {year}
                <span className="date-calendar-chevron" aria-hidden="true" />
              </button>
              {openPicker === "year" && (
                <div className="date-calendar-picker-menu date-calendar-year-menu" role="listbox" aria-label="Año">
                  {yearOptions.map((option) => (
                    <button
                      type="button"
                      className={`date-calendar-picker-option ${option === year ? "selected" : ""}`}
                      key={option}
                      ref={option === year ? selectedYearRef : null}
                      role="option"
                      aria-selected={option === year}
                      onClick={() => changeVisibleYear(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="date-calendar-navigation">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </header>
        <div className="date-calendar-grid">
          {weekdayLabels.map((weekday) => (
            <span className="date-calendar-weekday" key={weekday}>
              {weekday}
            </span>
          ))}
          {days.map((item) => item.date ? (
            <button
              type="button"
              className={[
                "date-calendar-day",
                item.key === value ? "selected" : "",
                item.key === today ? "today" : "",
              ].filter(Boolean).join(" ")}
              key={item.key}
              onClick={() => selectDate(item.date)}
              aria-label={item.date.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-pressed={item.key === value}
            >
              {item.day}
            </button>
          ) : (
            <span className="date-calendar-empty" key={item.key} aria-hidden="true" />
          ))}
        </div>
        {onClear && value && (
          <button type="button" className="date-calendar-clear" onClick={onClear}>
            Quitar fecha
          </button>
        )}
      </section>
    </div>
  );
}

export default DateCalendar;
