import { useState } from "react";
import Card from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import SplitAmount from "../../ui/primitives/SplitAmount";
import LiquidOrb from "../../ui/charts/LiquidOrb";
import HourBars from "../../ui/charts/HourBars";
import HalfGauge from "../../ui/charts/HalfGauge";
import CurveChart from "../../ui/charts/CurveChart";
import Sparkline from "../../ui/charts/Sparkline";
import BubbleStats from "../../ui/charts/BubbleStats";
import HorizontalTimeline from "../../ui/charts/HorizontalTimeline";
import LollipopTimeline from "../../ui/charts/LollipopTimeline";
import MonthMini from "../../ui/charts/MonthMini";
import MoneyCard from "../../ui/domain/MoneyCard";
import ConfirmPaymentSheet from "../../ui/domain/ConfirmPaymentSheet";
import MobileDrawer from "../../ui/shell/MobileDrawer";
import WidgetGrid, { EditBanner } from "../../ui/widgets/WidgetGrid";
import MobileWidgetGrid, { MobileEditBanner } from "../../ui/widgets/MobileWidgetGrid";
import CategoryIconBadge from "../../components/CategoryIconBadge";
import categoryColors from "../../constants/categoryColors";
import { addDays, getBogotaNow, parseDateKey } from "../../utils/dates";
import styles from "./UiPlayground.module.css";

// Componentes de la fase 2 (Inicio / Hoy) con datos de ejemplo de los mockups.
// Solo existen en /dev/ui; las pantallas reales usan datos de la API.

// Dos colores de la paleta anterior, que siguen guardados en categorías existentes.
const LEGACY_COLORS = ["#D94F70", "#2D3748"];

const SAMPLE_REMINDERS = [
  { occurrenceId: 1, recurrenceId: 1, concept: "Tarjeta", amount: -800000, scheduledDate: "", isOverdue: true, isActive: true, frequency: "monthly", category: { name: "Deudas", color: categoryColors[1], icon: "credit-card" } },
  { occurrenceId: 2, recurrenceId: 2, concept: "Arriendo", amount: -1200000, scheduledDate: "", isOverdue: false, isActive: true, frequency: "monthly", category: { name: "Vivienda", color: categoryColors[8], icon: "house" } },
  { occurrenceId: 3, recurrenceId: 3, concept: "Freelance web", amount: 1200000, scheduledDate: "", isOverdue: false, isActive: true, frequency: "monthly", category: { name: "Ingresos", color: categoryColors[0], icon: "briefcase" } },
];

const TIMELINE_ITEMS = [
  { key: "e1", kind: "event", title: "Clase SENA", start: 7, end: 9, lane: 0, done: true, to: "/dev/ui", ariaLabel: "Evento: Clase SENA" },
  { key: "t2", kind: "task", title: "Rediseño Finanzas", start: 8, end: 10, lane: 1, done: false, ariaLabel: "Tarea: Rediseño Finanzas" },
  { key: "e2", kind: "event", title: "Reunión con cliente", start: 11, end: 12, lane: 0, done: false, to: "/dev/ui", ariaLabel: "Evento: Reunión con cliente" },
  { key: "t4", kind: "task", title: "Mercado de la semana", start: 14.5, end: 15.5, lane: 2, done: false, ariaLabel: "Tarea: Mercado de la semana" },
];

function HomeComponentsDemo({ theme, onToggleTheme }) {
  const today = getBogotaNow().dateKey;
  const [selected, setSelected] = useState(today);
  const [pct, setPct] = useState(33);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { year, month } = parseDateKey(selected);
  const reminders = SAMPLE_REMINDERS.map((reminder, index) => ({
    ...reminder,
    scheduledDate: addDays(today, [-4, 1, 2][index]),
  }));
  const demoWidget = (title) => <span className={styles.caption}>{title}</span>;

  return (
    <section className={styles.section} aria-labelledby="sec-home">
      <h2 id="sec-home" className={styles.h2}>Inicio / Hoy (fase 2)</h2>

      <h3 className={styles.h3}>LiquidOrb · HalfGauge · HourBars</h3>
      <div className={styles.row}>
        <Card variant="ritmo"><LiquidOrb pct={pct} label="4 de 12 actividades" /></Card>
        <Card variant="ritmo" radius="bento" padding="sm"><LiquidOrb size="mobile" pct={pct} label="4 de 12 actividades" /></Card>
        <PillButton size="sm" onClick={() => setPct((value) => (value + 17) % 101)}>Subir nivel</PillButton>
        <Card radius="bento" padding="sm" style={{ width: 170 }}>
          <HalfGauge ratio={0.4} value={3} caption="por hacer" ariaLabel="2 de 5 tareas hechas" />
        </Card>
        <Card radius="bento" padding="sm" style={{ width: 170, height: 200 }}>
          <HourBars ariaLabel="Actividad por horas" bars={Array.from({ length: 12 }, (_, i) => (i < 3 ? { height: 14 + i * 6, state: "past" } : i === 3 ? { height: 60, state: "current" } : { height: 10, state: "future" }))} />
        </Card>
        <Card radius="bento" padding="sm" style={{ width: 170, height: 200 }}>
          <HourBars />
        </Card>
      </div>

      <h3 className={styles.h3}>CurveChart · Sparkline · SplitAmount · BubbleStats</h3>
      <div className={styles.grid}>
        <Card>
          <CurveChart values={[52000, 120000, 35000, 64000, 86000, 18000, 4000]} labels={["Vie", "Sáb", "Dom", "Lun", "Mar", "Mié", "Jue"]} formatTip={(v) => `$${v.toLocaleString("es-CO").replace(/,/g, ".")}`} ariaLabel="Gasto diario" />
        </Card>
        <Card>
          <Sparkline values={[0, 120000, 80000, 300000, 260000, 520000]} ariaLabel="Saldo del mes en aumento" />
          <SplitAmount value={1110800} />
          <SplitAmount size="md" value={1110800} />
          <SplitAmount value={null} />
        </Card>
        <Card>
          <BubbleStats
            main={{ value: 50, unit: "%", caption: "hoy", ariaLabel: "2 de 4 hábitos" }}
            satellites={[
              { key: "s", value: "—", caption: "racha", ariaLabel: "Racha sin datos", size: 76, valueSize: 22, captionSize: 10, position: { top: 4, marginLeft: 34 } },
              { key: "w", value: "—", caption: "agua", ariaLabel: "Agua sin datos", size: 60, valueSize: 17, captionSize: 9, position: { bottom: 6, marginLeft: -118 } },
            ]}
          />
        </Card>
      </div>

      <h3 className={styles.h3}>HorizontalTimeline · LollipopTimeline · MonthMini</h3>
      <Card><HorizontalTimeline items={TIMELINE_ITEMS} now={10.67} emptyText="Nada programado para este día." /></Card>
      <div className={styles.grid}>
        <Card radius="bento" padding="sm">
          <LollipopTimeline
            now={10.67}
            ariaLabel="Línea de tiempo"
            pins={[{ key: "a", hours: 9, kind: "event", done: true }, { key: "b", hours: 11, kind: "task", done: false }, { key: "c", hours: 13, kind: "event", done: false }, { key: "d", hours: 16, kind: "task", done: false }]}
          />
        </Card>
        <Card>
          <MonthMini
            year={year}
            month={month}
            selectedKey={selected}
            todayKey={today}
            markedDates={new Set([today, addDays(today, 2)])}
            onSelect={setSelected}
            onPrev={() => setSelected(addDays(selected, -30))}
            onNext={() => setSelected(addDays(selected, 30))}
          />
        </Card>
        <Card>
          <span className={styles.caption}>Agenda sin actividades</span>
          <HorizontalTimeline items={[]} emptyText="Nada programado para este día." />
        </Card>
      </div>

      <h3 className={styles.h3}>MoneyCard · ConfirmPaymentSheet</h3>
      <div className={styles.row}>
        {reminders.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} today={today} onSettle={setConfirming} />
        ))}
      </div>
      <Card radius="bento" padding="sm" style={{ maxWidth: 360 }}>
        {reminders.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="row" today={today} onSettle={setConfirming} />
        ))}
      </Card>

      <h3 className={styles.h3}>Íconos de categoría con la paleta pastel (tinta según contraste)</h3>
      <div className={styles.row}>
        {[...categoryColors, ...LEGACY_COLORS].map((color) => (
          <CategoryIconBadge key={color} category={{ name: color, color, icon: "tag" }} size={20} className={styles.badgeDemo} />
        ))}
      </div>

      <h3 className={styles.h3}>WidgetGrid (web) y MobileWidgetGrid</h3>
      <div className={styles.row}>
        <PillButton icon="layout" iconSize={17} pressed={editing} onClick={() => setEditing((value) => !value)}>
          {editing ? "Listo" : "Personalizar"}
        </PillButton>
        <PillButton onClick={() => setDrawerOpen(true)}>Abrir cajón móvil</PillButton>
      </div>
      {editing && <EditBanner onReset={() => {}} onDone={() => setEditing(false)} />}
      <WidgetGrid
        editing={editing}
        onMoveTo={() => {}}
        onMove={() => {}}
        onResize={() => {}}
        onRemove={() => {}}
        widgets={[
          { id: "a", title: "Tu ritmo de hoy", span: 1, tone: "ritmo", href: "/dev/ui", openLabel: "Abrir", content: demoWidget("ritmo") },
          { id: "b", title: "Agenda", span: 3, canResize: true, meta: "", href: "/dev/ui", openLabel: "Abrir", content: demoWidget("span 3") },
        ]}
      />
      <div style={{ maxWidth: 390 }}>
        {editing && <MobileEditBanner onAdd={() => {}} onReset={() => {}} />}
        <MobileWidgetGrid
          editing={editing}
          onMove={() => {}}
          onRemove={() => {}}
          widgets={[
            { id: "a", title: "Tu ritmo de hoy", size: "full", tone: "ritmo", content: demoWidget("full") },
            { id: "b", title: "Actividad", size: "tall", href: "/dev/ui", openLabel: "Abrir", content: demoWidget("tall") },
            { id: "c", title: "Eventos", size: "half", href: "/dev/ui", openLabel: "Abrir", content: demoWidget("half") },
            { id: "d", title: "Hábitos", size: "half", href: "/dev/ui", openLabel: "Abrir", content: demoWidget("half") },
          ]}
        />
      </div>

      {confirming && (
        <ConfirmPaymentSheet
          key={confirming.occurrenceId}
          reminder={confirming}
          onClose={() => setConfirming(null)}
          onConfirm={async () => true}
          onCancel={async () => true}
        />
      )}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName="Ana"
        email="ana@ejemplo.com"
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSettings={() => setDrawerOpen(false)}
        onLogout={() => setDrawerOpen(false)}
      />
    </section>
  );
}

export default HomeComponentsDemo;
