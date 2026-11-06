import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./IconButton.module.css";

const ICON_SIZES = { 46: 19, 44: 20, 40: 16, 36: 14 };

/**
 * Botón circular de solo ícono. label es obligatorio (aria-label).
 * variant: muted | soft | subtle | surface | outline | float | glass | menu | ghost | onDark | primary.
 * Con as={NavLink} toma el estado activo de aria-current="page".
 */
function IconButton({
  as: Component = "button",
  icon,
  label,
  size = 46,
  variant = "muted",
  iconSize,
  strokeWidth,
  badge = false,
  pressed,
  className,
  children,
  ...rest
}) {
  const isButton = Component === "button";

  return (
    <Component
      type={isButton ? "button" : undefined}
      aria-label={label}
      aria-pressed={pressed}
      className={cx(styles.button, styles[`s${size}`], styles[variant], className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize || ICON_SIZES[size] || 18} strokeWidth={strokeWidth} />}
      {children}
      {badge && <span className={styles.badge} aria-hidden="true" />}
    </Component>
  );
}

export default IconButton;
