// Curva suave (Catmull-Rom → Bézier) que pasa por todos los puntos, igual que en los mockups.
const fixed = (value) => value.toFixed(1);

export function smoothPath(points) {
  if (points.length === 0) return "";
  let path = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    path += ` C${fixed(p1[0] + (p2[0] - p0[0]) / 6)} ${fixed(p1[1] + (p2[1] - p0[1]) / 6)}, `
      + `${fixed(p2[0] - (p3[0] - p1[0]) / 6)} ${fixed(p2[1] - (p3[1] - p1[1]) / 6)}, `
      + `${fixed(p2[0])} ${fixed(p2[1])}`;
  }
  return path;
}
