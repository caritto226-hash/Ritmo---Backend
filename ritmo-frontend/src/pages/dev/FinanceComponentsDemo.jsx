import { useState } from "react";
import Card from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import SplitAmount from "../../ui/primitives/SplitAmount";
import NoData from "../../ui/primitives/NoData";
import CurveChart from "../../ui/charts/CurveChart";
import BubbleStats from "../../ui/charts/BubbleStats";
import MoneyCard from "../../ui/domain/MoneyCard";
import TxRow from "../../ui/domain/TxRow";
import ConfirmPaymentSheet from "../../ui/domain/ConfirmPaymentSheet";
import MonthPickerSheet from "../../ui/domain/MonthPickerSheet";
import categoryColors from "../../constants/categoryColors";
import { formatCurrency } from "../../utils/financeFormat";
import { addDays, getBogotaNow } from "../../utils/dates";
import styles from "./UiPlayground.module.css";

// Componentes de la fase 6 (Finanzas, Recurrentes y Confirmar) con datos de ejemplo de los mockups.
// Solo existen en /dev/ui; las pantallas reales usan datos de la API.

const SAMPLE_REMINDERS = [
  { occurrenceId: 11, recurrenceId: 11, concept: "Tarjeta", amount: -800000, isOverdue: true, isActive: true, frequency: "monthly", category: { name: "Deudas y créditos", color: categoryColors[1], icon: "credit-card" } },
  { occurrenceId: 12, recurrenceId: 12, concept: "Arriendo", amount: -1200000, isOverdue: false, isActive: true, frequency: "monthly", category: { name: "Vivienda y servicios", color: categoryColors[8], icon: "house" } },
  { occurrenceId: 13, recurrenceId: 13, concept: "Freelance web", amount: 1200000, isOverdue: false, isActive: true, frequency: "monthly", category: { name: "Ingresos", color: categoryColors[0], icon: "briefcase" } },
];

const SETTLED = {
  recurrenceId: 14, concept: "Internet", amount: -95000, isActive: true, frequency: "monthly",
  category: { name: "Vivienda y servicios", color: categoryColors[2], icon: "house" },
};

const MONTHS = [
  { value: "2026-11", label: "Noviembre 2026" },
  { value: "2026-10", label: "Octubre 2026" },
  { value: "2026-09", label: "Septiembre 2026" },
];

function FinanceComponentsDemo() {
  const today = getBogotaNow().dateKey;
  const [sheet, setSheet] = useState(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [month, setMonth] = useState("2026-11");
  const reminders = SAMPLE_REMINDERS.map((reminder, index) => ({ ...reminder, scheduledDate: addDays(today, [-4, 1, 2][index]) }));
  const settled = { ...SETTLED, nextScheduledDate: addDays(today, 21) };

  return (
    <section className={styles.section} aria-labelledby="sec-finance">
      <h2 id="sec-finance" className={styles.h2}>Finanzas (fase 6)</h2>

      <h3 className={styles.h3}>MoneyCard · variantes pendingWeb y pendingMobile (abren ConfirmPaymentSheet)</h3>
      <div className={styles.row}>
        {reminders.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="pendingWeb" today={today} onSettle={(item) => setSheet({ reminder: item })} />
        ))}
      </div>
      <div className={styles.row}>
        {reminders.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="pendingMobile" today={today} onSettle={(item) => setSheet({ reminder: item })} />
        ))}
      </div>

      <h3 className={styles.h3}>TxRow · web, mobile y list</h3>
      {/* TxRow web es solo para ≥ 760 px: en el catálogo a 390 px se desplaza en horizontal. */}
      <Card padding="md">
        <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560 }}>
        <TxRow variant="web" title="Mercado del domingo" note="Efectivo" category="Alimentación" color={categoryColors[3]} amount="−$86.000" onClick={() => {}} />
        <TxRow variant="web" title="Salario" note="Recurrente · mensual" category="Ingresos" color={categoryColors[0]} amount="+$2.000.000" income onClick={() => {}} />
        <TxRow variant="web" title="Cine" note={<NoData>—</NoData>} category="Compras y ocio" amount="−$36.000" />
        </div>
        </div>
      </Card>
      <div className={styles.grid}>
        <Card radius="list" padding="none" style={{ padding: "4px 14px" }}>
          <TxRow variant="mobile" title="Salario" note="Ingresos" color={categoryColors[0]} icon="briefcase" amount="+$2.000.000" income onClick={() => {}} />
          <TxRow variant="mobile" title="Tarjeta" note="Deudas y créditos" color={categoryColors[1]} icon="credit-card" amount="−$800.000" onClick={() => {}} />
        </Card>
        <Card radius="list" padding="none" style={{ padding: "0 14px" }}>
          <TxRow variant="list" title="Arriendo" note="Vence mañana" metaStrong color={categoryColors[8]} icon="house" amount="$1.200.000" chevron onClick={() => setSheet({ reminder: reminders[1], recurrence: { ...reminders[1], nextScheduledDate: reminders[1].scheduledDate } })} />
          <TxRow variant="list" title="Internet" note="Pagada 28 oct · próxima 28 nov" color={categoryColors[2]} icon="house" amount="$95.000" onClick={() => setSheet({ recurrence: settled })} />
        </Card>
      </div>

      <h3 className={styles.h3}>CurveChart con guía · SplitAmount stat · BubbleStats finance · MonthPickerSheet</h3>
      <div className={styles.grid}>
        <Card>
          <SplitAmount size="stat" value={379000} />
          <CurveChart guide values={[52000, 120000, 35000, 64000, 86000, 18000, 4000]} labels={["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]} formatTip={formatCurrency} ariaLabel="Gasto diario de la semana" />
        </Card>
        <Card>
          <BubbleStats
            variant="finance"
            main={{ value: 54, unit: "%", caption: "Vivienda", ariaLabel: "Vivienda 54% de los gastos" }}
            satellites={[
              { key: "a", value: "22%", caption: "Deudas", ariaLabel: "Deudas 22%", size: 70, valueSize: 18, captionSize: 10, position: { top: 0, marginLeft: 50 } },
              { key: "b", value: "14%", caption: "Comida", ariaLabel: "Comida 14%", size: 58, valueSize: 15, captionSize: 9, position: { bottom: 0, marginLeft: -110 } },
            ]}
          />
        </Card>
        <Card>
          <PillButton icon="calendar" trailingIcon="chevronDown" onClick={() => setMonthOpen(true)}>
            {MONTHS.find((option) => option.value === month).label}
          </PillButton>
          <PillButton onClick={() => setSheet({ recurrence: settled, edit: true })}>Hoja de un recurrente al día</PillButton>
        </Card>
      </div>

      {sheet && (
        <ConfirmPaymentSheet
          key={sheet.reminder?.occurrenceId ?? `r-${sheet.recurrence?.recurrenceId}`}
          reminder={sheet.reminder || null}
          recurrence={sheet.recurrence || null}
          lastPaidDate={sheet.reminder ? null : addDays(today, -9)}
          onClose={() => setSheet(null)}
          onConfirm={async () => true}
          onCancel={async () => true}
          onEdit={sheet.recurrence ? () => setSheet(null) : undefined}
        />
      )}
      <MonthPickerSheet
        open={monthOpen}
        options={MONTHS}
        value={month}
        note="Meses con movimientos registrados."
        onChange={setMonth}
        onClose={() => setMonthOpen(false)}
      />
    </section>
  );
}

export default FinanceComponentsDemo;
