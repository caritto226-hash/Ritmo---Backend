/**
 * Columnas para bloques que se solapan en una línea de tiempo vertical: cada grupo que se
 * cruza se reparte en carriles del mismo ancho (los mockups no dibujan solapes; así ningún
 * bloque tapa a otro). items: [{ start, end, ... }] en horas. Devuelve cada item con
 * column (0…) y columns (carriles de su grupo).
 */
export default function layoutColumns(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  function closeCluster() {
    const columns = Math.max(1, ...cluster.map((entry) => entry.column + 1));
    cluster.forEach((entry) => placed.push({ ...entry, columns }));
    cluster = [];
  }

  sorted.forEach((item) => {
    if (item.start >= clusterEnd && cluster.length > 0) closeCluster();
    const taken = new Set(cluster.filter((entry) => entry.end > item.start).map((entry) => entry.column));
    let column = 0;
    while (taken.has(column)) column += 1;
    cluster.push({ ...item, column });
    clusterEnd = Math.max(clusterEnd, item.end);
  });
  if (cluster.length > 0) closeCluster();
  return placed;
}
