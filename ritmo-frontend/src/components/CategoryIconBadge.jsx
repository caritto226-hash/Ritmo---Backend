import CategoryIcon from "./CategoryIcon";

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
        color,
        backgroundColor: `${color}1A`,
      } : undefined}
      title={category?.name || "Sin categoría"}
    >
      <CategoryIcon name={category?.icon || fallbackIcon} size={size} />
    </span>
  );
}

export default CategoryIconBadge;
