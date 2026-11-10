import { useState } from "react";
import BottomSheet from "../primitives/BottomSheet";
import IconButton from "../primitives/IconButton";
import PillButton from "../primitives/PillButton";
import Chip from "../primitives/Chip";
import styles from "./HabitProgressSheet.module.css";

const MAX_AMOUNT = 9999;
// Sumar tiempo de un toque (la hoja registra minutos; el formulario usa 15 a 60 para la meta).
const MINUTE_STEPS = [5, 15, 30];

/**
 * Ajustar la cantidad o registrar el tiempo de hoy de un hábito (Hábitos v2). Sin mockup: hoja
 * del sistema con la cifra grande de la tarjeta. type: count | duration; count: lo guardado hoy;
 * goal: la meta; unitLabel: "vasos", "tazas", "min" o null.
 * − y + cambian de a 1 (cantidad) o de a 5 (tiempo), y en tiempo hay atajos +5, +15 y +30 min.
 * Guardar llama onSave(valor) y Deshacer onUndo() (vuelve a 0 hoy); los dos devuelven true si
 * salió bien y la hoja se cierra. En web la hoja se muestra como diálogo centrado (BottomSheet).
 */
function HabitProgressSheet({ name, type, count, goal, unitLabel, onSave, onUndo, onClose }) {
  const [value, setValue] = useState(String(count));
  const [busy, setBusy] = useState(false);
  const isDuration = type === "duration";
  const step = isDuration ? 5 : 1;
  const amount = Number(value);
  const valid = value !== "" && Number.isInteger(amount) && amount >= 0 && amount <= MAX_AMOUNT;
  const unit = unitLabel ? ` ${unitLabel}` : "";
  const subject = isDuration ? "Minutos de hoy" : "Cantidad de hoy";

  function change(next) {
    setValue(String(Math.min(MAX_AMOUNT, Math.max(0, next))));
  }

  async function run(action) {
    setBusy(true);
    const ok = await action();
    if (ok) onClose();
    else setBusy(false);
  }

  return (
    <BottomSheet open onClose={onClose} title={name} busy={busy}>
      <div className={styles.body}>
        <p className={styles.lead}>
          {isDuration ? "Registrar tiempo de hoy" : "Ajustar cantidad de hoy"}
          <span className={styles.goal}> · Meta: {goal}{unit}</span>
        </p>

        <div className={styles.stepper}>
          <IconButton
            icon="minus"
            label={`Restar ${step}${isDuration ? " min" : ""}`}
            size={46}
            variant="soft"
            disabled={busy || !valid || amount <= 0}
            onClick={() => change(amount - step)}
          />
          <span className={styles.value}>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min="0"
              max={MAX_AMOUNT}
              step="1"
              value={value}
              aria-label={`${subject}${unitLabel ? ` (${unitLabel})` : ""}`}
              onChange={(event) => setValue(event.target.value)}
              disabled={busy}
              data-autofocus
            />
            <span className={styles.unit} aria-hidden="true">/{goal}{unit}</span>
          </span>
          <IconButton
            icon="plus"
            label={`Sumar ${step}${isDuration ? " min" : ""}`}
            size={46}
            variant="soft"
            disabled={busy || !valid || amount >= MAX_AMOUNT}
            onClick={() => change(amount + step)}
          />
        </div>

        {isDuration && (
          <div className={styles.chips} role="group" aria-label="Sumar minutos">
            {MINUTE_STEPS.map((minutes) => (
              <Chip key={minutes} disabled={busy || !valid} onClick={() => change(amount + minutes)} aria-label={`Sumar ${minutes} minutos`}>
                + {minutes} min
              </Chip>
            ))}
          </div>
        )}

        {!valid && <p className={styles.error} role="alert">Escribe un número entero entre 0 y {MAX_AMOUNT}.</p>}

        <div className={styles.actions}>
          <PillButton
            size="cta"
            variant="primary"
            block
            disabled={busy || !valid || amount === count}
            onClick={() => run(() => onSave(amount))}
          >
            {busy ? "Guardando…" : "Guardar"}
          </PillButton>
          <button
            type="button"
            className={styles.textButton}
            disabled={busy || count === 0}
            onClick={() => run(onUndo)}
            aria-label={`Deshacer: volver ${name} a 0 hoy`}
          >
            Deshacer
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default HabitProgressSheet;
