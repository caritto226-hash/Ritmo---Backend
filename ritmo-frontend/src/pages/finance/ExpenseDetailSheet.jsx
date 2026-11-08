import DetailSheet from "../../ui/domain/DetailSheet";
import { formatDayMonth, formatSignedAmount } from "../../utils/financeFormat";

function formatDate(value) {
  const key = value ? String(value).slice(0, 10) : "";
  return key ? `${formatDayMonth(key)} ${key.slice(0, 4)}` : "";
}

// Detalle de un movimiento con Editar, Duplicar y Eliminar (DetailSheet): los mismos datos que
// mostraba la hoja anterior (MobileItemDetails). Si el movimiento vino de un recurrente, al
// eliminarlo el backend deshace la confirmación y el recordatorio vuelve a quedar pendiente.
function ExpenseDetailSheet({ expense, onClose, onEdit, onDuplicate, onDelete }) {
  const details = [
    { label: "Categoría", value: expense.category?.name },
    { label: "Tipo", value: Number(expense.amount) > 0 ? "Ingreso" : "Gasto" },
    { label: "Valor", value: formatSignedAmount(expense.amount) },
    { label: "Fecha", value: formatDate(expense.expenseDate) },
    { label: "Fecha programada", value: formatDate(expense.scheduledDate) },
    { label: "Notas", value: expense.notes },
  ];
  const question = "¿Eliminar este movimiento? Esta acción no se puede deshacer.";

  return (
    <DetailSheet
      title={expense.concept}
      details={details}
      deleteQuestion={expense.recurrenceId
        ? `${question} Como vino de un pago recurrente, su recordatorio volverá a quedar por confirmar.`
        : question}
      onClose={onClose}
      onEdit={() => onEdit(expense)}
      onDuplicate={() => onDuplicate(expense)}
      onDelete={() => onDelete(expense)}
    />
  );
}

export default ExpenseDetailSheet;
