/**
 * App Root — Router configuration with protected routes.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VirtualMachines from './pages/VirtualMachines';
import Storage from './pages/Storage';
import Billing from './pages/Billing';
import Monitoring from './pages/Monitoring';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import CloudCredentials from './pages/CloudCredentials';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: 200, height: 40 }} />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected — Dashboard Layout */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="vms" element={<VirtualMachines />} />
            <Route path="storage" element={<Storage />} />
            <Route path="billing" element={<Billing />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="credentials" element={<CloudCredentials />} />
          </Route>


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
