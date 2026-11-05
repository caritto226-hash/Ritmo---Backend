import Icon from "../icons/Icon";
import cx from "../cx";
import styles from "./PillButton.module.css";

/**
 * Botón píldora. variant: primary | secondary | soft | surface | outline | bordered | accent | onDark | danger.
 * size: lg (46, web) | nav (46, píldora de navegación) | md (44, móvil) | sm (40, dentro de tarjetas)
 * | cta (54, acción de hoja).
 * pressed activa aria-pressed y el estilo seleccionado (negro).
 */
function PillButton({
  as: Component = "button",
  variant = "secondary",
  size = "lg",
  icon,
  iconTone,
  trailingIcon,
  pressed,
  block = false,
  className,
  children,
  ...rest
}) {
  const isButton = Component === "button";
  const iconSize = size === "sm" ? 16 : 18;

  return (
    <Component
      type={isButton ? "button" : undefined}
      aria-pressed={pressed}
      className={cx(styles.pill, styles[size], styles[variant], block && styles.block, className)}
      {...rest}
    >
      {icon && (
        <span className={cx(styles.iconWrap, iconTone === "income" && styles.iconIncome)}>
          <Icon name={icon} size={iconSize} strokeWidth={variant === "primary" ? 1.8 : 1.7} />
        </span>
      )}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={16} strokeWidth={1.8} />}
    </Component>
  );
}

export default PillButton;
