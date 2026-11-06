import { useState } from "react";
import BottomSheet from "../primitives/BottomSheet";
import PillButton from "../primitives/PillButton";
import styles from "./DetailSheet.module.css";

/**
 * Detalle de una tarea o un evento con Editar, Duplicar y Eliminar (reemplaza MobileItemDetails
 * de MUI). details: [{ label, value }]; los vacíos no se muestran. Eliminar pide confirmación
 * dentro de la misma hoja (deleteQuestion), sin window.confirm. onDuplicate y onDelete devuelven
 * true si salió bien; la hoja se cierra en ese caso.
 * extraAction ({ label, onRun }) agrega una acción de texto más (Eventos: "Cancelar evento" o
 * "Restaurar evento"), con el mismo estilo que "Detener futuras" en la hoja de confirmar pago.
 */
function DetailSheet({ title, details, deleteQuestion, onClose, onEdit, onDuplicate, onDelete, extraAction }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const shown = details.filter((detail) => detail.value);

  async function run(action) {
    setBusy(true);
    const ok = await action();
    if (ok) onClose();
    else setBusy(false);
  }

  return (
    <BottomSheet open onClose={onClose} title={title} busy={busy}>
      {confirmingDelete ? (
        <div className={styles.confirm} role="alert">
          <p className={styles.confirmText}>{deleteQuestion}</p>
          <div className={styles.actions}>
            <PillButton size="cta" variant="danger" block disabled={busy} onClick={() => run(onDelete)} data-autofocus>
              {busy ? "Eliminando…" : "Eliminar"}
            </PillButton>
            <button type="button" className={styles.textButton} disabled={busy} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className={styles.details}>
            {shown.map((detail) => (
              <div key={detail.label} className={styles.detail}>
                <dt className={styles.term}>{detail.label}</dt>
                <dd className={styles.value}>{detail.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.actions}>
            <PillButton size="cta" variant="primary" icon="pencil" block disabled={busy} onClick={onEdit}>
              Editar
            </PillButton>
            <div className={styles.secondary}>
              <button type="button" className={styles.textButton} disabled={busy} onClick={() => run(onDuplicate)}>
                Duplicar
              </button>
              {extraAction && (
                <button type="button" className={styles.textButton} disabled={busy} onClick={() => run(extraAction.onRun)}>
                  {extraAction.label}
                </button>
              )}
              <button
                type="button"
                className={`${styles.textButton} ${styles.danger}`}
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}

export default DetailSheet;
