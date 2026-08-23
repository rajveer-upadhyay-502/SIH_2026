import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

import { useAuth } from "./context/AuthContext";

import CollegeSetup from "./pages/admin/CollegeSetup";

import CreateTimetable from "./pages/coordinator/CreateTimetable";

import TimetableResults from "./pages/coordinator/TimetableResults";

const HomeRedirect = () => {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case "admin":
      return <Navigate to="/admin" replace />;

    case "coordinator":
      return <Navigate to="/coordinator" replace />;

    case "faculty":
      return <Navigate to="/faculty" replace />;

    case "student":
      return <Navigate to="/student" replace />;

    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

const App = () => {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/setup"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <CollegeSetup />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coordinator"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["coordinator"]}>
              <CoordinatorDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/create-timetable"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["coordinator"]}>
              <CreateTimetable />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/timetable-results"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["coordinator"]}>
              <TimetableResults />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />


    </Routes>
  );
};

export default App;