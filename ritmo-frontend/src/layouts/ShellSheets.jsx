import { useState } from "react";
import BottomSheet from "../ui/primitives/BottomSheet";
import SegmentedControl from "../ui/primitives/SegmentedControl";
import Icon from "../ui/icons/Icon";
import CategoryManager from "../components/CategoryManager";
import categoriesService from "../services/categories.service";
import styles from "./MainLayout.module.css";

const NEW_ACTIVITY_OPTIONS = [
  { to: "/tasks", icon: "taskCircle", title: "Tarea", description: "Algo por hacer, con o sin hora" },
  { to: "/habits", icon: "flame", title: "Hábito", description: "Una rutina para marcar cada día" },
  { to: "/events", icon: "calendar", title: "Evento", description: "Una cita con fecha y hora" },
  { to: "/expenses", icon: "wallet", title: "Movimiento", description: "Un gasto o un ingreso" },
];

const CATEGORY_MODULES = [
  { module: "tasks", title: "Tareas" },
  { module: "habits", title: "Hábitos" },
  { module: "events", title: "Eventos" },
  { module: "finance", title: "Finanzas" },
];

function SheetRow({ icon, title, description, trailing = "chevronRight", onClick }) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      {icon && (
        <span className={styles.rowIcon} aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className={styles.rowCopy}>
        <span className={styles.rowTitle}>{title}</span>
        {description && <span className={styles.rowDescription}>{description}</span>}
      </span>
      <Icon name={trailing} size={16} strokeWidth={2} />
    </button>
  );
}

// "Nueva actividad": abre el formulario de creación del módulo elegido.
export function NewActivitySheet({ open, onClose, onPick }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Nueva actividad" className={styles.sheet}>
      {NEW_ACTIVITY_OPTIONS.map((option) => (
        <SheetRow
          key={option.to}
          icon={option.icon}
          title={option.title}
          description={option.description}
          trailing="plus"
          onClick={() => onPick(option.to)}
        />
      ))}
    </BottomSheet>
  );
}

// Ajustes: cuenta, tema, personalizar el inicio y categorías.
export function SettingsSheet({ open, onClose, userName, email, theme, onThemeChange, onCustomize, onCategories, onLogout }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Ajustes" className={styles.sheet}>
      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">
          {(userName || email || "").trim().charAt(0).toUpperCase() || "·"}
        </span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>{userName || "Mi cuenta"}</span>
          {email && <span className={styles.rowDescription}>{email}</span>}
        </span>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Tema</span>
        <SegmentedControl
          label="Tema"
          variant="mobile"
          value={theme}
          onChange={onThemeChange}
          options={[
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
          ]}
        />
      </div>

      <SheetRow icon="layout" title="Personalizar el inicio" description="Ordena, cambia el tamaño o quita widgets" onClick={onCustomize} />
      <SheetRow icon="tag" title="Categorías" description="Nombres, íconos y colores" onClick={onCategories} />
      <SheetRow icon="logout" title="Cerrar sesión" trailing="arrowRight" onClick={onLogout} />
    </BottomSheet>
  );
}

// Categorías: elegir un módulo y abrir su administrador (el mismo de cada pantalla).
export function CategoriesSheet({ open, onClose, notify }) {
  const [managed, setManaged] = useState(null);

  async function openModule(module) {
    try {
      const categories = await categoriesService.getAll(module);
      setManaged({ module, categories });
    } catch {
      notify("No se pudieron cargar las categorías.", "error");
    }
  }

  async function reload() {
    const categories = await categoriesService.getAll(managed.module);
    setManaged((current) => current && { ...current, categories });
  }

  if (managed) {
    return (
      <CategoryManager
        module={managed.module}
        categories={managed.categories}
        onClose={() => setManaged(null)}
        onChanged={reload}
      />
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Categorías" className={styles.sheet}>
      {CATEGORY_MODULES.map((item) => (
        <SheetRow key={item.module} icon="tag" title={item.title} onClick={() => openModule(item.module)} />
      ))}
    </BottomSheet>
  );
}
