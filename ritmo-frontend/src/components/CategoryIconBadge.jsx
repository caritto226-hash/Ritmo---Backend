import CategoryIcon from "./CategoryIcon";
import { getInkOnColor } from "../utils/color";

// El fondo es el color guardado de la categoría, tal cual; el ícono usa la tinta
// (oscura o blanca) que más contrasta con él. Antes el ícono se pintaba del mismo
// color sobre un fondo al 10 % y los pasteles quedaban casi invisibles.
function CategoryIconBadge({
  category,
  fallbackIcon = "tag",
  size = 20,
  className = "",
}) {
  const color = category?.color;

  return (
    <span
      className={`category-icon-badge ${className}`.trim()}
      style={color ? {
        color: getInkOnColor(color),
        backgroundColor: color,
      } : undefined}
      title={category?.name || "Sin categoría"}
    >
      <CategoryIcon name={category?.icon || fallbackIcon} size={size} />
    </span>
  );
}

export default CategoryIconBadge;
