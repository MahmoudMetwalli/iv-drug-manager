import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import PreparationWorksheet from "./pages/PreparationWorksheet";
import DrugsPage from "./pages/DrugsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="prep/:patientId" element={<PreparationWorksheet />} />
            <Route path="drugs" element={<DrugsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

export default App;
