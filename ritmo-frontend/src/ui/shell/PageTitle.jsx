import { Fragment } from "react";
import { Link } from "react-router-dom";
import Icon from "../icons/Icon";
import StatInline from "../primitives/StatInline";
import cx from "../cx";
import styles from "./PageTitle.module.css";

/**
 * Título de pantalla web. breadcrumb: [{ label, to? }].
 * crumbStyle "folder" (Inicio: íconos de carpeta y flecha) o "plain" ("Inicio → Tareas").
 * stats: props de StatInline que se muestran en línea junto al h1.
 */
function PageTitle({ breadcrumb = [], crumbStyle = "plain", title, stats, actions }) {
  const isFolder = crumbStyle === "folder";

  return (
    <div className={styles.titlepad}>
      <div className={styles.lead}>
        <div className={styles.heading}>
          {breadcrumb.length > 0 && (
            <nav aria-label="Ruta">
              <ol className={cx(styles.crumbs, isFolder && styles.folder)}>
                {breadcrumb.map((crumb, index) => (
                  <Fragment key={crumb.label}>
                    {index > 0 && (
                      <li aria-hidden="true" className={styles.crumb}>
                        {isFolder ? <Icon name="arrowRight" size={16} strokeWidth={1.6} /> : "→"}
                      </li>
                    )}
                    <li className={styles.crumb} aria-current={index === breadcrumb.length - 1 ? "page" : undefined}>
                      {isFolder && <Icon name="folder" size={16} strokeWidth={1.6} />}
                      {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
                    </li>
                  </Fragment>
                ))}
              </ol>
            </nav>
          )}
          <h1 className={styles.h1}>{title}</h1>
        </div>
        {stats?.length > 0 && (
          <div className={styles.stats}>
            {stats.map((stat) => <StatInline key={stat.label} {...stat} />)}
          </div>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export default PageTitle;
