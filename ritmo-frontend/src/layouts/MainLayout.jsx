import { useContext } from "react";
import { Outlet, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function MainLayout() {
  const { logout } = useContext(AuthContext);

  return (
    <div>
      <header>
        <h2>Ritmo</h2>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <main>
        <Outlet />
      </main>

      <nav>
        <Link to="/dashboard">Hoy</Link>
        <Link to="/tasks">Tareas</Link>
        <Link to="/habits">Hábitos</Link>
        <Link to="/events">Eventos</Link>
        <Link to="/expenses">Gastos</Link>
      </nav>
    </div>
  );
}

export default MainLayout;