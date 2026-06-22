import { createBrowserRouter, Navigate } from "react-router";
import { getCurrentUser } from "./auth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/student/DashboardPage";
import ProfilePage from "./pages/student/ProfilePage";
import RoomsPage from "./pages/student/RoomsPage";
import ApplicationsPage from "./pages/student/ApplicationsPage";
import ContractsPage from "./pages/student/ContractsPage";
import InvoicesPage from "./pages/student/InvoicesPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminRoomsPage from "./pages/admin/AdminRoomsPage";

function RequireStudent({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/student" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/student" replace />;
  if (user.role === "student") return <Navigate to="/student" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/student" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/student",
    element: (
      <RequireStudent>
        <StudentLayout />
      </RequireStudent>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "rooms", element: <RoomsPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "contracts", element: <ContractsPage /> },
      { path: "invoices", element: <InvoicesPage /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="applications" replace /> },
      { path: "applications", element: <AdminApplicationsPage /> },
      { path: "rooms", element: <AdminRoomsPage /> },
    ],
  },
]);
