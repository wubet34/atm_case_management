import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CaseTracking from "./pages/CaseTracking";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ManageCase from "./pages/atm/ManageCase";
import AppointTechnician from "./pages/atm/AppointTechnician";
import TerminateCase from "./pages/atm/TerminateCase";
import Technicians from "./pages/Technicians";
import Reports from "./pages/Reports";
import DashboardLayout from "./layouts/DashboardLayout";
import { DarkModeProvider } from "./context/DarkModeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CaseProvider } from "./context/CaseContext";
import { NotificationProvider } from "./context/NotificationContext";
import MyAssignedCases from './pages/technician/MyAssignedCases';
import MySchedule from './pages/technician/MySchedule';
import CompletedCases from './pages/technician/CompletedCases';
import ResetPassword from './pages/ResetPassword';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Login />;
  }
  return children;
};

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CaseProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                {/* Common Routes - Both Admin & Technician */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cases" element={<CaseTracking />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reports" element={<Reports />} />
                
                {/* Admin Only Routes */}
                <Route path="/atm/manage" element={<ManageCase />} />
                <Route path="/atm/appoint" element={<AppointTechnician />} />
                <Route path="/atm/terminate" element={<TerminateCase />} />
                <Route path="/technicians" element={<Technicians />} />
                
                {/* Technician Only Routes */}
                <Route path="/technician/my-cases" element={<MyAssignedCases />} />
                <Route path="/technician/schedule" element={<MySchedule />} />
                <Route path="/technician/completed" element={<CompletedCases />} />
              </Route>
            </Routes>
          </CaseProvider>
        </NotificationProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;