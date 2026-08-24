import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect } from "react";

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

/* =========================================================
   HOME REDIRECT
========================================================= */

const HomeRedirect = () => {
  const { profile } =
    useAuth();

  if (!profile) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  switch (
  profile.role
  ) {
    case "admin":
      return (
        <Navigate
          to="/admin"
          replace
        />
      );

    case "coordinator":
      return (
        <Navigate
          to="/coordinator"
          replace
        />
      );

    case "faculty":
      return (
        <Navigate
          to="/faculty"
          replace
        />
      );

    case "student":
      return (
        <Navigate
          to="/student"
          replace
        />
      );

    default:
      return (
        <Navigate
          to="/unauthorized"
          replace
        />
      );
  }
};

/* =========================================================
   APP
========================================================= */

const App = () => {
  useEffect(() => {
    /*
      -------------------------------------------------------
      WEBSITE TITLE
      -------------------------------------------------------
    */

    document.title =
      "Smart Timetable";

    /*
      -------------------------------------------------------
      REMOVE DEFAULT / VITE / THUNDER FAVICON
      -------------------------------------------------------

      Remove every existing favicon link from
      the document head.

      Then use a transparent SVG favicon so
      the browser doesn't fall back to an old
      Vite / React icon.
    */

    const existingFavicons =
      document.querySelectorAll(
        'link[rel~="icon"], link[rel="shortcut icon"]'
      );

    existingFavicons.forEach(
      (icon) => {
        icon.remove();
      }
    );

    const transparentIcon =
      document.createElement(
        "link"
      );

    transparentIcon.rel =
      "icon";

    transparentIcon.type =
      "image/svg+xml";

    transparentIcon.href =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='transparent'/%3E%3C/svg%3E";

    document.head.appendChild(
      transparentIcon
    );

    /*
      -------------------------------------------------------
      BROWSER THEME COLOR
      -------------------------------------------------------
    */

    let themeMeta =
      document.querySelector(
        'meta[name="theme-color"]'
      );

    if (!themeMeta) {
      themeMeta =
        document.createElement(
          "meta"
        );

      themeMeta.name =
        "theme-color";

      document.head.appendChild(
        themeMeta
      );
    }

    themeMeta.content =
      "#eef4fb";

    /*
      Cleanup only removes the temporary
      favicon created by this effect.
    */

    return () => {
      const icon =
        document.querySelector(
          'link[data-smart-timetable-icon="true"]'
        );

      if (icon) {
        icon.remove();
      }
    };
  }, []);

  return (
    <div className="app-shell min-h-screen">

      <Routes>

        {/* =================================================
            PUBLIC
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/signup"
          element={
            <Signup />
          }
        />

        <Route
          path="/unauthorized"
          element={
            <Unauthorized />
          }
        />

        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/setup"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <CollegeSetup />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* =================================================
            COORDINATOR
        ================================================= */}

        <Route
          path="/coordinator"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "coordinator",
                ]}
              >
                <CoordinatorDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/create-timetable"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "coordinator",
                ]}
              >
                <CreateTimetable />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/timetable-results"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "coordinator",
                ]}
              >
                <TimetableResults />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* =================================================
            FACULTY
        ================================================= */}

        <Route
          path="/faculty"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "faculty",
                ]}
              >
                <FacultyDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* =================================================
            STUDENT
        ================================================= */}

        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={[
                  "student",
                ]}
              >
                <StudentDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

      </Routes>

    </div>
  );
};

export default App;