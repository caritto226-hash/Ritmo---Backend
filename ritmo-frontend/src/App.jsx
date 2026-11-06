import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/home/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import MainLayout from "./layouts/MainLayout";
import TasksPage from "./pages/tasks/TasksPage";
import Habits from "./pages/Habits";
import EventsPage from "./pages/events/EventsPage";
import Expenses from "./pages/Expenses";

// Catálogo del sistema de diseño: solo existe en desarrollo (no entra al build de producción).
const UiPlayground = import.meta.env.DEV ? lazy(() => import("./pages/dev/UiPlayground")) : null;

function App() {
  return (
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
        <Route path="/habits" element={<Habits />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/expenses" element={<Expenses />} />
      </Route>

      {UiPlayground && (
        <Route path="/dev/ui" element={<Suspense fallback={null}><UiPlayground /></Suspense>} />
      )}

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
