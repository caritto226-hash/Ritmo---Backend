import { useState } from "react";
import categoriesService from "../services/categories.service";
import CategoryIconBadge from "./CategoryIconBadge";
import CategoryIconPicker from "./CategoryIconPicker";
import CategoryColorPicker from "./CategoryColorPicker";
import categoryIcons from "../constants/categoryIcons";
import "../styles/category-manager.css";

const emptyForm = { name: "", description: "", icon: "tag", color: "#1565C0", isRecurring: false };

function CategoryManager({ module, categories, onClose, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function editCategory(category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      color: category.color,
      isRecurring: Boolean(category.isRecurring),
    });
    setError("");
  }

  async function saveCategory(event) {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      icon: form.icon,
      color: form.color,
      isRecurring: form.isRecurring,
    };

    try {
      if (editingId) {
        await categoriesService.update(editingId, payload);
      } else {
        await categoriesService.create({ module, ...payload });
      }
      setEditingId(null);
      setForm(emptyForm);
      setError("");
      await onChanged();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudo guardar la categoría");
    }
  }

  async function deactivateCategory(category) {
    if (!window.confirm(`¿Desactivar "${category.name}"? Los registros existentes se conservarán.`)) {
      return;
    }

    try {
      await categoriesService.remove(category.id);
      if (editingId === category.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await onChanged();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudo desactivar la categoría");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  return (
    <>
      <div className="modal-overlay open" onClick={onClose} />
      <div className="modal open category-manager-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Administrar categorías</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar categorías">✕</button>
        </div>

        {error && <p className="modal-form-error" role="alert">{error}</p>}

        <form className="category-manager-form" onSubmit={saveCategory}>
          <div className="input-group">
            <label htmlFor={`${module}-category-name`}>Nombre</label>
            <input
              id={`${module}-category-name`}
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor={`${module}-category-description`}>Descripción (opcional)</label>
            <textarea
              id={`${module}-category-description`}
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={250}
              rows={2}
            />
          </div>
          <div className="finance-category-editor-row category-manager-editor-row">
            <div className="input-group">
              <span className="category-manager-field-label">Icono</span>
              <CategoryIconPicker
                icons={categoryIcons}
                value={form.icon}
                label="Icono"
                onChange={(icon) => setForm((previous) => ({ ...previous, icon }))}
              />
            </div>
            <div className="input-group finance-color-field">
              <span className="category-manager-field-label">Color</span>
              <div className="finance-color-control">
                <CategoryColorPicker
                  value={form.color}
                  label="Color"
                  onChange={(color) => setForm((previous) => ({ ...previous, color }))}
                />
                <span aria-hidden="true">{form.color.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <label className="category-recurring-toggle">
            <span>Permitir recurrencia</span>
            <input
              type="checkbox"
              role="switch"
              checked={form.isRecurring}
              onChange={(event) => setForm((previous) => ({
                ...previous,
                isRecurring: event.target.checked,
              }))}
              aria-label="Permitir recurrencia en esta categoría"
            />
          </label>
          <div className="category-manager-preview">
            <CategoryIconBadge category={form} size={24} className="category-manager-preview-icon" />
            <span>{form.name || "Vista previa"}</span>
          </div>
          <button type="submit" className="btn-guardar">
            {editingId ? "Guardar categoría" : "Crear categoría"}
          </button>
          {editingId && (
            <button
              type="button"
              className="finance-cancel-category-edit"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>

        <div className="finance-category-list">
          <h4>Categorías disponibles</h4>
          {categories.map((category) => (
            <div className="finance-category-row" key={category.id}>
              <CategoryIconBadge category={category} size={19} className="finance-category-swatch" />
              <div className="finance-category-info">
                <span className="finance-category-name">{category.name}</span>
                {category.description && (
                  <span className="finance-category-description">{category.description}</span>
                )}
                {category.isRecurring && (
                  <span className="finance-category-description">Recurrencia habilitada</span>
                )}
              </div>
              {category.isDefault && <span className="finance-category-default">Predeterminada</span>}
              <button type="button" onClick={() => editCategory(category)} aria-label={`Editar ${category.name}`}>
                Editar
              </button>
              <button type="button" onClick={() => deactivateCategory(category)} aria-label={`Desactivar ${category.name}`}>
                Desactivar
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="task-empty">No hay categorías disponibles.</p>}
        </div>
      </div>
    </>
  );
}

export default CategoryManager;
