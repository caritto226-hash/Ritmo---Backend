import cx from "../cx";
import styles from "./BrandLogo.module.css";

// Logo de la marca (mascota + "Ritmo"), recortado y optimizado en WebP desde public/Ritmo-logo.png
// (459 × 192 px, ~12 kB). La versión oscura tiene el texto en blanco, como Ritmo-logo-mo.svg.
// Los originales (PNG y SVG) siguen en public/ como archivos de marca.
const LOGO_LIGHT = "/Ritmo-logo.webp";
const LOGO_DARK = "/Ritmo-logo-mo.webp";

/**
 * size: "web" (cabecera web, 40 px), "header" (cajón móvil, 30 px como el logo de los mockups)
 * o "auth" (login, registro, recuperación y 404, 64 px). Se muestra la versión del tema activo con CSS
 * ([data-theme="dark"] en <html>), así no necesita recibir el tema.
 * Es decorativo: el nombre accesible lo pone el enlace o el contenedor que lo rodea.
 */
function BrandLogo({ size = "header", className }) {
  return (
    <span className={cx(styles.logo, styles[size], className)} aria-hidden="true">
      <img src={LOGO_LIGHT} alt="" className={styles.light} width="459" height="192" decoding="async" />
      <img src={LOGO_DARK} alt="" className={styles.dark} width="459" height="192" decoding="async" />
    </span>
  );
}

export default BrandLogo;
