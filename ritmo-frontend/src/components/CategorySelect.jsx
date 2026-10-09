import { useState } from "react";
import CategoryIconBadge from "./CategoryIconBadge";

function CategorySelect({
  categories,
  value,
  onChange,
  inactiveCategory,
  includeAllLabel,
  placeholder = "Selecciona una categoría",
  className = "",
  onCreateCategory,
}) {
  const [open, setOpen] = useState(false);
  const selectedCategory = categories.find((category) => String(category.id) === value)
    || (inactiveCategory && String(inactiveCategory.id) === value ? inactiveCategory : null);

  function selectCategory(category) {
    onChange(String(category.id));
    setOpen(false);
  }

  return (
    <div className={`category-select ${className}`}>
      <button
        type="button"
        className="category-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selectedCategory ? (
          <>
            <CategoryIconBadge category={selectedCategory} className="category-select-icon" />
            <span>{selectedCategory.name}{inactiveCategory && !categories.some((category) => category.id === inactiveCategory.id) ? " (desactivada)" : ""}</span>
          </>
        ) : (
          <span className="category-select-placeholder">
            {value === "" && includeAllLabel ? includeAllLabel : placeholder}
          </span>
        )}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="category-select-dismiss"
            aria-label="Cerrar categorías"
            onClick={() => setOpen(false)}
          />
          <div className="category-select-options" role="listbox" aria-label="Categorías">
            {includeAllLabel && (
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                className="category-select-option category-select-all"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {includeAllLabel}
              </button>
            )}
            {categories.map((category) => (
              <button
                type="button"
                role="option"
                aria-selected={String(category.id) === value}
                className="category-select-option"
                key={category.id}
                onClick={() => selectCategory(category)}
              >
                <CategoryIconBadge category={category} className="category-select-icon" />
                <span className="category-select-option-copy">
                  <span>{category.name}</span>
                  {category.description && <small>{category.description}</small>}
                </span>
                {category.isDefault && <span className="category-select-default">Predeterminada</span>}
              </button>
            ))}
            {onCreateCategory && (
              <button
                type="button"
                className="category-select-option category-select-create"
                onClick={() => {
                  setOpen(false);
                  onCreateCategory();
                }}
              >
                <span className="category-select-create-icon" aria-hidden="true">+</span>
                <span>Nueva categoría</span>
              </button>
            )}
            {categories.length === 0 && (
              <p className="category-select-empty">No hay categorías activas.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CategorySelect;
