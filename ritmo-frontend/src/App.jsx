import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import MainLayout from "./layouts/MainLayout";

// Cada página es un paquete aparte (se descarga al entrar a su ruta). Las pantallas con sesión
// tienen su Suspense dentro de MainLayout, así el shell no desaparece mientras llega la página.
const Login = lazy(() => import("./pages/login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const TasksPage = lazy(() => import("./pages/tasks/TasksPage"));
const HabitsPage = lazy(() => import("./pages/habits/HabitsPage"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const FinancePage = lazy(() => import("./pages/finance/FinancePage"));

// Catálogo del sistema de diseño: solo existe en desarrollo (no entra al build de producción).
const UiPlayground = import.meta.env.DEV ? lazy(() => import("./pages/dev/UiPlayground")) : null;

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/expenses" element={<FinancePage />} />
          <Route path="/expenses/recurrences" element={<FinancePage view="recurrences" />} />
        </Route>

        {UiPlayground && <Route path="/dev/ui" element={<UiPlayground />} />}

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
