// Une nombres de clase ignorando los vacíos: cx("a", cond && "b").
export default function cx(...names) {
  return names.filter(Boolean).join(" ");
}
