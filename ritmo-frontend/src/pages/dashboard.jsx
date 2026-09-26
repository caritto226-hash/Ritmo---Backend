import { useState, useEffect } from "react";
import dashboardService from "../services/dashboard.service";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (err) {
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>

      <h1>Tu ritmo de hoy</h1>
      <p>
        {data.todayRitmo.completed} de {data.todayRitmo.total} tareas completadas
        ({data.todayRitmo.percentage}%)
      </p>

      <h2>Próximos</h2>
      <ul>
        {data.upcoming.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <strong>[{item.type}]</strong> {item.title || item.name || item.concept}
            {item.date && ` — ${item.date}`}
            {item.amount && ` — $${item.amount}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;