import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// "Nueva actividad" navega al módulo con state { create: true }: la página abre su formulario
// de creación una sola vez y limpia el state para que recargar o volver atrás no lo repita.
export default function useCreateIntent(openCreate) {
  const location = useLocation();
  const navigate = useNavigate();
  const openRef = useRef(openCreate);

  useEffect(() => {
    openRef.current = openCreate;
  });

  useEffect(() => {
    if (!location.state?.create) return;
    openRef.current();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
}
