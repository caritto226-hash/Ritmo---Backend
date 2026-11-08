import { usePageState } from "../../ui/shell/ShellContext";
import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import Card from "../../ui/primitives/Card";
import IconButton from "../../ui/primitives/IconButton";
import PillButton from "../../ui/primitives/PillButton";
import SegmentedControl from "../../ui/primitives/SegmentedControl";
import Icon from "../../ui/icons/Icon";
import TxRow from "../../ui/domain/TxRow";
import { describeSettled, isIncome } from "../../hooks/data/financeSelectors";
import { formatCurrency, getDueLabel } from "../../utils/financeFormat";
import styles from "./RecurrencesView.module.css";

function plainAmount(item) {
  return formatCurrency(Math.abs(Number(item.amount)));
}

/**
 * Recurrentes (Recurrentes.dc.html) en /expenses/recurrences. En móvil es una pantalla propia con
 * "Volver"; en web va dentro del shell con la misma lista en una tarjeta. Cada fila abre la hoja de
 * confirmar: para confirmar si está pendiente, o para editar, detener o eliminar si está al día.
 * Los pendientes son los que devuelve GET /expenses/recurrences/reminders (aparecen 2 días antes de
 * su fecha, el mismo día si son diarios); no se filtran en el cliente.
 */
function RecurrencesView({ isWeb, loading, today, reminders, settled, lastPaid, onBack, onCreate, onOpenReminder, onOpenRecurrence }) {
  const [tab, setTab] = usePageState("tab", null);
  // Sin elección, abre en "Por confirmar" si hay pendientes; si no, en "Al día".
  const shownTab = tab ?? (reminders.length > 0 ? "pending" : "settled");

  const tabs = (
    <SegmentedControl
      variant="mobile"
      label="Estado de los recurrentes"
      value={shownTab}
      onChange={setTab}
      className={styles.tabs}
      options={[
        { value: "pending", label: `Por confirmar · ${reminders.length}` },
        { value: "settled", label: `Al día · ${settled.length}` },
      ]}
    />
  );

  const rows = shownTab === "pending"
    ? reminders.map((reminder) => (
        <TxRow
          key={`pending-${reminder.occurrenceId}`}
          variant="list"
          title={reminder.concept}
          note={getDueLabel(reminder.scheduledDate, today)}
          metaStrong
          color={reminder.category?.color}
          icon={reminder.category?.icon || "calendar-days"}
          amount={plainAmount(reminder)}
          income={isIncome(reminder)}
          chevron
          onClick={() => onOpenReminder(reminder)}
        />
      ))
    : settled.map((recurrence) => (
        <TxRow
          key={`settled-${recurrence.recurrenceId}`}
          variant="list"
          title={recurrence.concept}
          note={describeSettled(recurrence, lastPaid.get(recurrence.recurrenceId))}
          color={recurrence.category?.color}
          icon={recurrence.category?.icon || "calendar-days"}
          amount={plainAmount(recurrence)}
          income={isIncome(recurrence)}
          onClick={() => onOpenRecurrence(recurrence)}
        />
      ));

  const body = loading ? (
    <p role="status" className={styles.loading}>Cargando recurrentes…</p>
  ) : (
    <div className={styles.listCard} role="region" aria-label={shownTab === "pending" ? "Por confirmar" : "Al día"}>
      {rows.length > 0 ? rows : (
        <p className={styles.empty}>
          {shownTab === "pending" ? "Nada por confirmar. Todo al día ✓" : "Aún no hay pagos al día."}
        </p>
      )}
    </div>
  );

  const note = (
    <p className={styles.note}>
      <Icon name="info" size={16} strokeWidth={2} className={styles.noteIcon} />
      Aparecen 2 días antes de su fecha. Toca uno para confirmarlo, detenerlo o eliminarlo.
    </p>
  );

  if (isWeb) {
    return (
      <>
        <ShellTitle>
          <PageTitle
            breadcrumb={[{ label: "Inicio", to: "/dashboard" }, { label: "Finanzas", to: "/expenses" }, { label: "Recurrentes" }]}
            title="Recurrentes"
            actions={<PillButton variant="primary" icon="plus" onClick={onCreate}>Nuevo recurrente</PillButton>}
          />
        </ShellTitle>
        <Card className={styles.webCard} aria-label="Pagos recurrentes">
          {tabs}
          {body}
          {note}
        </Card>
      </>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <IconButton icon="chevronLeft" label="Volver" size={44} variant="ghost" iconSize={22} strokeWidth={2.2} className={styles.back} onClick={onBack} />
        <h1 className={styles.h1}>Recurrentes</h1>
        <IconButton icon="plus" label="Nuevo recurrente" size={44} variant="primary" strokeWidth={2.4} onClick={onCreate} />
      </div>
      {tabs}
      {body}
      {note}
    </>
  );
}

export default RecurrencesView;
