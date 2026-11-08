import { Fragment } from "react";
import { Link } from "react-router-dom";
import ShellTitle from "../../ui/shell/ShellTitle";
import PageTitle from "../../ui/shell/PageTitle";
import Card from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import Chip from "../../ui/primitives/Chip";
import SplitAmount from "../../ui/primitives/SplitAmount";
import Icon from "../../ui/icons/Icon";
import CurveChart from "../../ui/charts/CurveChart";
import BubbleStats from "../../ui/charts/BubbleStats";
import MoneyCard from "../../ui/domain/MoneyCard";
import TxRow from "../../ui/domain/TxRow";
import { NO_DATA } from "../../ui/designPreview";
import cx from "../../ui/cx";
import { formatCurrency, formatSignedAmount, getDayGroupLabel } from "../../utils/financeFormat";
import { isIncome, TYPE_CHIPS, weekDiffText } from "../../hooks/data/financeSelectors";
import styles from "./FinanceWeb.module.css";

function BalanceCard({ balance, hidden, onToggleHidden }) {
  const { comparison } = balance;
  return (
    <Card variant="dark" className={styles.saldo} aria-labelledby="h-saldo">
      <div aria-hidden="true" className={styles.saldoBlob} />
      <div className={styles.saldoHead}>
        <h2 id="h-saldo" className={styles.saldoTitle}>{balance.title}</h2>
        <button
          type="button"
          className={styles.eye}
          onClick={onToggleHidden}
          aria-pressed={hidden}
          aria-label={hidden ? "Mostrar montos" : "Ocultar montos"}
        >
          <Icon name={hidden ? "eyeOff" : "eye"} size={18} strokeWidth={1.8} />
        </button>
      </div>
      <span className={styles.saldoAmount}>{hidden ? "$ •••••••" : formatCurrency(balance.balance)}</span>
      <span className={cx(styles.saldoDelta, comparison.tone === "none" && styles.saldoDeltaMuted)}>
        {comparison.tone !== "none" && (
          <Icon name={comparison.tone === "up" ? "arrowUpRight" : "arrowDownRight"} size={14} strokeWidth={2} />
        )}
        {comparison.text}
      </span>
      <div className={styles.flex} />
      <div className={styles.saldoMinis}>
        <div className={styles.saldoMini}>
          <span className={styles.saldoMiniLabel}>↑ Ingresos</span>
          <span className={styles.saldoMiniValue}>{hidden ? "$ •••••" : formatCurrency(balance.income)}</span>
        </div>
        <div className={styles.saldoMini}>
          <span className={styles.saldoMiniLabel}>↓ Gastos</span>
          <span className={styles.saldoMiniValue}>{hidden ? "$ •••••" : formatCurrency(balance.expenses)}</span>
        </div>
      </div>
    </Card>
  );
}

function WeekCard({ week }) {
  const max = Math.max(...week.days.map((day) => day.amount));
  const maxDay = week.days.find((day) => day.amount === max);
  const less = week.diff <= 0;

  return (
    <Card className={styles.week} aria-labelledby="h-sem">
      <div className={styles.cardHead}>
        <h2 id="h-sem" className={styles.cardTitle}>Gastos de la semana</h2>
        <span className={styles.meta}>{week.range}</span>
      </div>
      <div className={styles.weekBody}>
        <div className={styles.weekLead}>
          <SplitAmount value={week.total} size="stat" />
          <span className={styles.weekDiff}>
            <Icon
              name={less ? "arrowDownRight" : "arrowUpRight"}
              size={14}
              strokeWidth={2}
              className={less ? styles.iconIncome : styles.iconMore}
            />
            {weekDiffText(week)}
            <span className={styles.srOnly}> que los mismos días de la semana pasada</span>
          </span>
          <div className={styles.flex} />
          <span className={styles.avg}>
            <strong className={styles.avgValue}>{formatCurrency(week.average)}</strong>promedio/día
          </span>
        </div>
        <CurveChart
          guide
          values={week.days.map((day) => day.amount)}
          labels={week.days.map((day) => day.label)}
          formatTip={formatCurrency}
          ariaLabel={max === 0
            ? "Gasto diario de la semana: sin gastos todavía"
            : `Gasto diario de la semana; el mayor fue el ${maxDay.label} con ${formatCurrency(max)}`}
        />
      </div>
    </Card>
  );
}

// Burbujas de "En qué gastas": las tres categorías con más gasto del mes (posiciones del mockup).
function categoryBubbles(shares) {
  const [first, second, third] = shares;
  const satellite = (share, layout) => ({
    ...layout,
    key: layout.key,
    value: share ? `${share.pct}%` : NO_DATA,
    caption: share ? share.name : "—",
    ariaLabel: share ? `${share.name} ${share.pct}%` : "Sin más categorías con gastos",
  });
  return {
    main: first
      ? { value: first.pct, unit: "%", caption: first.name, ariaLabel: `${first.name} ${first.pct}% de los gastos` }
      : { value: NO_DATA, caption: "Sin gastos", ariaLabel: "Sin gastos en el mes" },
    satellites: [
      satellite(second, { key: "second", size: 70, valueSize: 18, captionSize: 10, position: { top: 0, marginLeft: 50 } }),
      satellite(third, { key: "third", size: 58, valueSize: 15, captionSize: 9, position: { bottom: 0, marginLeft: -110 } }),
    ],
  };
}

function CategoriesCard({ shares }) {
  const bubbles = categoryBubbles(shares.shares);
  const cell = (share) => ({ value: share ? share.pct : NO_DATA, label: share ? `${share.name} %` : "Otra categoría" });
  const cells = [cell(shares.shares[3]), cell(shares.shares[4]), { value: shares.shares.length, label: "Categorías" }];

  return (
    <Card className={styles.cats} aria-labelledby="h-cats">
      <h2 id="h-cats" className={styles.cardTitle}>En qué gastas</h2>
      <BubbleStats variant="finance" main={bubbles.main} satellites={bubbles.satellites} />
      <div className={styles.catStats}>
        {cells.map((item, index) => (
          <div key={index} className={styles.catStat}>
            <span className={styles.catValue}>{item.value}</span>
            <span className={styles.catLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PendingCard({ reminders, totals, today, onSettle }) {
  return (
    <Card aria-labelledby="h-pend" className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 id="h-pend" className={styles.cardTitle}>Por confirmar</h2>
        <div className={styles.totals}>
          <span>Por pagar <strong className={styles.totalOut}>{formatCurrency(totals.out)}</strong></span>
          <span>Por cobrar <strong className={styles.totalIn}>{formatCurrency(totals.in)}</strong></span>
          <PillButton as={Link} to="/expenses/recurrences" variant="soft" size="sm">Ver recurrentes</PillButton>
        </div>
      </div>
      <div className={styles.track}>
        {reminders.map((reminder) => (
          <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="pendingWeb" today={today} onSettle={onSettle} />
        ))}
        {reminders.length === 0 && <div className={styles.allClear}>Todo al día ✓</div>}
      </div>
    </Card>
  );
}

// Finanzas web (FinanzasWeb.dc.html).
function FinanceWeb(props) {
  const {
    loading, today, monthLabel, onPickMonth, emptyText, balance, hidden, onToggleHidden, week, shares,
    reminders, reminderTotals, groups, noteFor, categories, filter, onFilter, query, onQuery,
    isFiltering, onResetFilters, onCreate, onCategories, onSettle, onOpenMovement,
  } = props;

  return (
    <>
      <ShellTitle>
        <PageTitle
          breadcrumb={[{ label: "Inicio", to: "/dashboard" }, { label: "Finanzas" }]}
          title="Finanzas"
          actions={
            <>
              <PillButton icon="calendar" trailingIcon="chevronDown" onClick={onPickMonth} aria-haspopup="dialog">
                {monthLabel}
              </PillButton>
              <PillButton icon="tag" onClick={onCategories}>Categorías</PillButton>
              <PillButton icon="plus" iconSize={16} iconTone="income" className={styles.tightPill} onClick={() => onCreate("income")}>
                Ingreso
              </PillButton>
              <PillButton variant="primary" icon="minus" iconSize={16} className={styles.tightPill} onClick={() => onCreate("expense")}>
                Gasto
              </PillButton>
            </>
          }
        />
      </ShellTitle>

      {loading ? (
        <p role="status" className={styles.loading}>Cargando finanzas…</p>
      ) : (
        <div className={styles.main}>
          <div className={styles.top}>
            <BalanceCard balance={balance} hidden={hidden} onToggleHidden={onToggleHidden} />
            <WeekCard week={week} />
            <CategoriesCard shares={shares} />
          </div>

          <PendingCard reminders={reminders} totals={reminderTotals} today={today} onSettle={onSettle} />

          <Card aria-labelledby="h-mov" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="h-mov" className={styles.cardTitle}>Movimientos</h2>
              <label className={styles.search}>
                <Icon name="search" size={17} strokeWidth={1.8} />
                <input
                  type="search"
                  aria-label="Buscar por concepto"
                  placeholder="Buscar por concepto"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  className={styles.searchInput}
                />
              </label>
            </div>
            <div className={styles.chips} role="group" aria-label="Filtrar movimientos">
              {TYPE_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={!filter.categoryId && filter.type === chip.value}
                  onClick={() => onFilter({ type: chip.value, categoryId: "" })}
                >
                  {chip.label}
                </Chip>
              ))}
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  selected={filter.categoryId === String(category.id)}
                  onClick={() => onFilter({ type: "all", categoryId: String(category.id) })}
                >
                  {category.name}
                </Chip>
              ))}
            </div>
            <div className={styles.list}>
              {groups.map((group) => (
                <Fragment key={group.day}>
                  <h3 className={styles.dayLabel}>{getDayGroupLabel(group.day, today)}</h3>
                  {group.items.map((item) => (
                    <TxRow
                      key={item.id}
                      variant="web"
                      title={item.concept}
                      note={noteFor(item)}
                      category={item.category?.name || "Sin categoría"}
                      color={item.category?.color}
                      amount={formatSignedAmount(item.amount)}
                      income={isIncome(item)}
                      onClick={() => onOpenMovement(item)}
                    />
                  ))}
                </Fragment>
              ))}
              {groups.length === 0 && (
                <div className={styles.noRows}>
                  <p className={styles.noRowsText}>{emptyText}</p>
                  {isFiltering && (
                    <PillButton variant="soft" size="sm" onClick={onResetFilters}>Ver todos los del mes</PillButton>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default FinanceWeb;
