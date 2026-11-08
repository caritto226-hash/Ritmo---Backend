import { Fragment, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MobilePageTitle } from "../../ui/shell/MobileShell";
import Card from "../../ui/primitives/Card";
import PillButton from "../../ui/primitives/PillButton";
import Chip from "../../ui/primitives/Chip";
import Icon from "../../ui/icons/Icon";
import MoneyCard from "../../ui/domain/MoneyCard";
import TxRow from "../../ui/domain/TxRow";
import cx from "../../ui/cx";
import { formatCurrency, formatSignedAmount, getDayGroupLabel } from "../../utils/financeFormat";
import { isIncome, TYPE_CHIPS } from "../../hooks/data/financeSelectors";
import styles from "./FinanceMobile.module.css";

const HIDDEN = "$ •••••";

// Finanzas móvil (Finanzas.dc.html). La barra superior (menú y campana) la pone MainLayout.
function FinanceMobile(props) {
  const {
    loading, today, monthLabel, onPickMonth, emptyText, balance, hidden, onToggleHidden, reminders,
    groups, categories, filter, onFilter, query, onQuery, isFiltering, onResetFilters, onCreate,
    onCategories, onSettle, onOpenMovement,
  } = props;
  const [searchOpen, setSearchOpen] = useState(Boolean(query));
  const searchRef = useRef(null);

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      onQuery("");
      return;
    }
    setSearchOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  const quickActions = [
    { id: "income", label: "Ingreso", icon: "plus", onClick: () => onCreate("income") },
    { id: "expense", label: "Gasto", icon: "minus", onClick: () => onCreate("expense") },
    { id: "recurring", label: "Recurrente", icon: "repeat", onClick: () => onCreate("expense", true) },
    { id: "categories", label: "Categorías", icon: "tag", onClick: onCategories },
  ];

  return (
    <>
      <MobilePageTitle
        title="Finanzas"
        subtitle="Tu dinero, de un vistazo"
        action={
          <PillButton size="md" trailingIcon="chevronDown" className={styles.monthPill} onClick={onPickMonth} aria-haspopup="dialog">
            {monthLabel}
          </PillButton>
        }
      />

      <Card variant="darkMobile" padding="none" className={styles.balance} aria-label="Resumen del mes">
        <div className={styles.balanceHead}>
          <span className={styles.balanceTitle}>{balance.title}</span>
          <button
            type="button"
            className={styles.eye}
            onClick={onToggleHidden}
            aria-pressed={hidden}
            aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
          >
            <Icon name={hidden ? "eyeOff" : "eye"} size={20} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.balanceAmount}>{hidden ? HIDDEN : formatCurrency(balance.balance)}</div>
        <div className={styles.minis}>
          <div className={styles.mini}>
            <span className={styles.miniLabel}>
              <Icon name="arrowUp" size={14} strokeWidth={2.4} className={styles.arrowIncome} />
              Ingresos
            </span>
            <span className={styles.miniValue}>{hidden ? HIDDEN : formatCurrency(balance.income)}</span>
          </div>
          <div className={styles.mini}>
            <span className={styles.miniLabel}>
              <Icon name="arrowDown" size={14} strokeWidth={2.4} className={styles.arrowExpense} />
              Gastos
            </span>
            <span className={styles.miniValue}>{hidden ? HIDDEN : formatCurrency(balance.expenses)}</span>
          </div>
        </div>
      </Card>

      <nav className={styles.quick} aria-label="Accesos rápidos">
        {quickActions.map((action) => (
          <button key={action.id} type="button" className={styles.quickAction} onClick={action.onClick}>
            <span className={cx(styles.quickTile, styles[action.id])}>
              <Icon name={action.icon} size={22} strokeWidth={2} />
            </span>
            {action.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p role="status" className={styles.loading}>Cargando finanzas…</p>
      ) : (
        <>
          <section className={styles.block} aria-labelledby="m-pend">
            <div className={styles.blockHead}>
              <h2 id="m-pend" className={styles.h2}>
                Por confirmar <span className={styles.count}>{reminders.length}</span>
              </h2>
              <Link to="/expenses/recurrences" className={styles.link}>Ver todos</Link>
            </div>
            <div className={styles.carousel}>
              {reminders.map((reminder) => (
                <MoneyCard key={reminder.occurrenceId} reminder={reminder} variant="pendingMobile" today={today} onSettle={onSettle} />
              ))}
              {reminders.length === 0 && <div className={styles.allClear}>Todo al día ✓</div>}
            </div>
          </section>

          <section className={styles.block} aria-labelledby="m-mov">
            <div className={styles.blockHead}>
              <h2 id="m-mov" className={styles.h2}>Movimientos</h2>
              <button
                type="button"
                className={styles.searchToggle}
                onClick={toggleSearch}
                aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar movimientos"}
                aria-expanded={searchOpen}
                aria-controls="finance-search"
              >
                <Icon name={searchOpen ? "close" : "search"} size={20} strokeWidth={2} />
              </button>
            </div>

            {searchOpen && (
              <label className={styles.search}>
                <Icon name="search" size={17} strokeWidth={1.8} />
                <input
                  id="finance-search"
                  ref={searchRef}
                  type="search"
                  className={styles.searchInput}
                  placeholder="Buscar por concepto"
                  aria-label="Buscar movimientos por concepto"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") toggleSearch();
                  }}
                />
              </label>
            )}

            <div className={styles.chips} role="group" aria-label="Filtrar movimientos">
              {TYPE_CHIPS.map((chip) => (
                <Chip
                  key={chip.value}
                  variant="mobile"
                  selected={!filter.categoryId && filter.type === chip.value}
                  onClick={() => onFilter({ type: chip.value, categoryId: "" })}
                >
                  {chip.label}
                </Chip>
              ))}
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  variant="mobile"
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
                      variant="mobile"
                      title={item.concept}
                      note={item.category?.name || "Sin categoría"}
                      color={item.category?.color}
                      icon={item.category?.icon || "tag"}
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
                    <button type="button" className={styles.textLink} onClick={onResetFilters}>Ver todos los del mes</button>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default FinanceMobile;
