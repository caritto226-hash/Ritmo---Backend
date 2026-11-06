import { useState } from "react";
import { DESIGN_PREVIEW } from "../../ui/designPreview";
import Card, { CardHeader } from "../../ui/primitives/Card";
import IconButton from "../../ui/primitives/IconButton";
import PillButton from "../../ui/primitives/PillButton";
import Chip from "../../ui/primitives/Chip";
import SegmentedControl from "../../ui/primitives/SegmentedControl";
import StatInline from "../../ui/primitives/StatInline";
import CheckCircle from "../../ui/primitives/CheckCircle";
import NoData from "../../ui/primitives/NoData";
import Toast from "../../ui/primitives/Toast";
import BottomSheet from "../../ui/primitives/BottomSheet";
import AppShellWeb from "../../ui/shell/AppShellWeb";
import PageTitle from "../../ui/shell/PageTitle";
import MobileShell, { CirclePill, MobilePageTitle, MobileTopBar } from "../../ui/shell/MobileShell";
import HomeComponentsDemo from "./HomeComponentsDemo";
import TasksComponentsDemo from "./TasksComponentsDemo";
import EventsComponentsDemo from "./EventsComponentsDemo";
import HabitsComponentsDemo from "./HabitsComponentsDemo";
import styles from "./UiPlayground.module.css";

// Catálogo visual del sistema de diseño (solo desarrollo: la ruta no existe en producción).

const COLOR_TOKENS = [
  "--bg-app", "--bg", "--surface", "--surface-muted", "--surface-soft", "--surface-subtle",
  "--line", "--line-strong", "--line-check", "--text", "--text-2", "--text-3", "--text-num-muted",
  "--accent", "--accent-strong", "--mint", "--mint-soft", "--teal", "--teal-soft", "--lav-grey",
  "--lav-grey-2", "--lime-soft", "--lilac", "--income", "--danger", "--danger-strong", "--danger-bg",
  "--danger-chip", "--warning", "--notify", "--ritmo-gradient", "--dark-card", "--bubble-gradient",
];

const RAIL_DEMO = [
  { label: "Inicio", icon: "home", to: "/dev/ui", end: true },
  { label: "Calendario", icon: "calendarDays" },
  { label: "Mi journal", icon: "journal" },
  { label: "Categorías", icon: "tag" },
  { label: "Ajustes", icon: "settings" },
];

function UiPlayground() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const [view, setView] = useState("week");
  const [tab, setTab] = useState("pend");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("sena");
  const [done, setDone] = useState({ a: false, b: true });
  const [editing, setEditing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  function showToast(type) {
    setToast({ id: Date.now(), type, message: type === "error" ? "No se pudo guardar. Intenta de nuevo." : "Pago registrado en Movimientos." });
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.h1}>Sistema de diseño</h1>
            <p className={styles.lead}>
              /dev/ui · solo desarrollo · vista previa de diseño {DESIGN_PREVIEW ? "activada" : "desactivada"} (VITE_DESIGN_PREVIEW)
            </p>
          </div>
          <PillButton icon={theme === "dark" ? "sun" : "moon"} onClick={toggleTheme}>
            {theme === "dark" ? "Modo claro" : "Modo oscuro (provisional)"}
          </PillButton>
        </div>

        <section className={styles.section} aria-labelledby="sec-tokens">
          <h2 id="sec-tokens" className={styles.h2}>Tokens de color</h2>
          <div className={styles.swatches}>
            {COLOR_TOKENS.map((token) => (
              <div key={token} className={styles.swatch}>
                <span className={styles.chipSample} style={{ background: `var(${token})` }} />
                {token}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-type">
          <h2 id="sec-type" className={styles.h2}>Tipografía · Urbanist</h2>
          <div className={styles.type}>
            <span style={{ fontSize: 52, letterSpacing: -1.2, lineHeight: 1.05 }}>Título 52 / 400</span>
            <span style={{ fontSize: 22 }}>Título de tarjeta 22 / 400</span>
            <span className={styles.bigNumber}>$1.110<span className={styles.numMuted}>.800</span></span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Cuerpo y nombres 15 / 500</span>
            <span className={styles.caption}>Metadatos 12 / 400 · texto 3</span>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-cards">
          <h2 id="sec-cards" className={styles.h2}>Card</h2>
          <div className={styles.grid}>
            <Card>
              <CardHeader title="Blanca" meta="1/5">
                <IconButton icon="arrowUpRight" label="Abrir" size={40} variant="soft" />
              </CardHeader>
              <span className={styles.caption}>radio 28 · padding 24</span>
            </Card>
            <Card variant="ritmo">
              <CardHeader title="Tu ritmo de hoy">
                <IconButton icon="arrowUpRight" label="Abrir" size={40} variant="surface" />
              </CardHeader>
              <span className={styles.caption}>degradado ritmo</span>
            </Card>
            <Card variant="dark">
              <CardHeader title="Oscura" />
              <span className={styles.darkText}>Disponible este mes</span>
              <span className={styles.bigNumber}>$1.110.800</span>
            </Card>
            <Card variant="pastel" tint="teal">
              <CardHeader title="Pastel con rayas" />
              <span className={styles.caption}>tarjeta de hábito</span>
            </Card>
            <Card variant="pastel" tint="lime" done>
              <CardHeader title="Pastel completada" />
              <span className={styles.caption}>gris, sin rayas</span>
            </Card>
            <Card radius="bento" padding="sm">
              <CardHeader title="Bento móvil" />
              <span className={styles.caption}>radio 26 · padding 16</span>
            </Card>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-buttons">
          <h2 id="sec-buttons" className={styles.h2}>IconButton</h2>
          <div className={styles.row}>
            <IconButton icon="moon" label="Gris (46)" />
            <IconButton icon="bell" label="Con aviso" badge />
            <IconButton icon="home" label="Seleccionado" pressed />
            <IconButton icon="plus" label="Principal" variant="primary" />
            <IconButton icon="menu" label="Móvil (44)" size={44} />
            <IconButton icon="arrowUpRight" label="En tarjeta (40)" size={40} variant="soft" />
            <IconButton icon="chevronLeft" label="Flecha (36)" size={36} variant="soft" />
            <IconButton icon="chevronRight" label="Contorno" size={40} variant="outline" />
            <IconButton icon="close" label="Deshabilitado" disabled />
          </div>

          <h3 className={styles.h3}>PillButton</h3>
          <div className={styles.row}>
            <PillButton variant="primary" icon="plus">Nueva tarea</PillButton>
            <PillButton icon="tag">Categorías</PillButton>
            <PillButton icon="plus" iconTone="income">Ingreso</PillButton>
            <PillButton icon="layout" pressed={editing} onClick={() => setEditing((value) => !value)}>
              {editing ? "Listo" : "Personalizar"}
            </PillButton>
            <PillButton size="sm" variant="outline">Restablecer</PillButton>
            <PillButton size="sm" variant="accent">Acento</PillButton>
            <PillButton disabled>Deshabilitado</PillButton>
          </div>

          <h3 className={styles.h3}>Chip</h3>
          <div className={styles.row}>
            {[["all", "Todo"], ["events", "Eventos"], ["tasks", "Tareas"]].map(([value, label]) => (
              <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{label}</Chip>
            ))}
            <Chip variant="mobile" selected>Todos</Chip>
            <Chip variant="mobile">Ingresos</Chip>
            {[["sena", "SENA", "var(--teal)"], ["lectura", "Lectura", "var(--accent)"], ["hogar", "Hogar", "var(--lav-grey)"]].map(([value, label, dot]) => (
              <Chip key={value} variant="category" dotColor={dot} selected={category === value} onClick={() => setCategory(value)}>
                {label}
              </Chip>
            ))}
            <Chip disabled>Deshabilitado</Chip>
          </div>

          <h3 className={styles.h3}>SegmentedControl</h3>
          <div className={styles.row}>
            <SegmentedControl label="Vista" value={view} onChange={setView} options={[{ value: "day", label: "Día" }, { value: "week", label: "Semana" }]} />
            <div style={{ width: 350 }}>
              <SegmentedControl
                variant="mobile"
                label="Recurrentes"
                value={tab}
                onChange={setTab}
                options={[{ value: "pend", label: "Por confirmar · 2" }, { value: "done", label: "Al día · 1" }]}
              />
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-states">
          <h2 id="sec-states" className={styles.h2}>Estados y StatInline</h2>
          <div className={styles.row}>
            <StatInline value={8} delta="hoy" label="Por hacer" />
            <StatInline value={2} delta="+2" deltaTone="positive" label="Completadas" />
            <StatInline value={1} delta="−1" deltaTone="negative" label="Vencidas" />
            <StatInline value={null} delta={null} label="Días de racha" />
            <NoData />
          </div>
          <div className={styles.grid}>
            <div className={styles.stateRow}>
              <CheckCircle checked={done.a} label="Enviar cotización" onToggle={() => setDone((d) => ({ ...d, a: !d.a }))} />
              Normal · toca para completar
            </div>
            <div className={`${styles.stateRow} ${styles.stateDone}`}>
              <CheckCircle checked={done.b} label="Leer 20 minutos" onToggle={() => setDone((d) => ({ ...d, b: !d.b }))} />
              Completado (sin tachar)
            </div>
            <div className={`${styles.stateRow} ${styles.stateOverdue}`}>
              Tarjeta
              <span className={styles.stateOverdueMeta}>Venció hace 4 días</span>
            </div>
            <div className={styles.stateRow}>
              <CheckCircle label="Deshabilitado" disabled />
              Deshabilitado
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.dayCircle}>27</span>
            <span className={`${styles.dayCircle} ${styles.dayToday}`}>29</span>
            <span className={`${styles.dayCircle} ${styles.daySelected}`}>28</span>
            <span className={styles.caption}>normal · hoy (lima) · seleccionado (negro)</span>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-overlays">
          <h2 id="sec-overlays" className={styles.h2}>Toast y BottomSheet</h2>
          <div className={styles.row}>
            <PillButton onClick={() => showToast("success")}>Mostrar aviso</PillButton>
            <PillButton onClick={() => showToast("error")}>Mostrar error</PillButton>
            <PillButton variant="primary" onClick={() => setSheetOpen(true)}>Abrir hoja</PillButton>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sec-shell-web">
          <h2 id="sec-shell-web" className={styles.h2}>AppShellWeb</h2>
          <AppShellWeb
            embedded
            userName="Ana"
            theme={theme}
            onToggleTheme={toggleTheme}
            headerAction={<PillButton icon="plus">Nueva actividad</PillButton>}
            railItems={RAIL_DEMO}
            onLogout={() => {}}
            title={
              <PageTitle
                breadcrumb={[{ label: "Inicio", to: "/dev/ui" }, { label: "Tareas" }]}
                title="Mis tareas"
                stats={[
                  { value: 8, delta: "hoy", label: "Por hacer" },
                  { value: 2, delta: null, label: "Completadas" },
                ]}
                actions={
                  <>
                    <IconButton icon="search" label="Buscar" />
                    <PillButton icon="calendar" trailingIcon="chevronDown">Dom 1 nov, 2026</PillButton>
                    <PillButton variant="primary" icon="plus">Nueva tarea</PillButton>
                  </>
                }
              />
            }
          >
            <Card>
              <CardHeader className={styles.wrapHeader} title="Contenido de la pantalla" meta="Toca una tarea para completarla" />
            </Card>
          </AppShellWeb>
          <PageTitle
            crumbStyle="folder"
            breadcrumb={[{ label: "Inicio" }, { label: "Resumen del día" }]}
            title="Hola, Ana"
          />
        </section>

        <section className={styles.section} aria-labelledby="sec-shell-mobile">
          <h2 id="sec-shell-mobile" className={styles.h2}>MobileShell y BottomTabBar</h2>
          <div className={styles.frames}>
            <MobileShell layout="home" contained>
              <MobileTopBar onAdd={() => {}} />
              <MobilePageTitle
                title="Hola, Ana"
                subtitle="Domingo 1 de noviembre"
                action={<CirclePill icon="layout" pressed={editing} onClick={() => setEditing((value) => !value)}>{editing ? "Listo" : "Personalizar"}</CirclePill>}
              />
              <div className={styles.mobileBody}>
                <Card radius="bento" padding="sm"><CardHeader title="Widget" /></Card>
              </div>
            </MobileShell>
            <MobileShell contained>
              <MobileTopBar elevated onAdd={() => {}} addLabel="Nueva tarea" />
              <MobilePageTitle title="Mis tareas" subtitle="Miércoles 28 de octubre" action={<CirclePill icon="calendar">Calendario</CirclePill>} />
              <div className={styles.mobileBody}>
                <Card radius="list" padding="sm"><span className={styles.caption}>Lista</span></Card>
              </div>
            </MobileShell>
          </div>
        </section>

        <HomeComponentsDemo theme={theme} onToggleTheme={toggleTheme} />
        <TasksComponentsDemo />
        <EventsComponentsDemo />
        <HabitsComponentsDemo />
      </div>

      <Toast toast={toast} onDone={() => setToast(null)} />
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Agregar widget">
        <span className={styles.caption}>Contenido de la hoja. Escape o el fondo la cierran.</span>
        <PillButton variant="primary" size="cta" icon="check" block onClick={() => setSheetOpen(false)}>
          Marcar como pagado
        </PillButton>
      </BottomSheet>
    </div>
  );
}

export default UiPlayground;
