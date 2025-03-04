import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import SalesLedger from '../pages/accounts/SalesLedger';
import AccountLedger from '../pages/accounts/AccountLedger';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts/:accountId/ledger"
        element={
          <ProtectedRoute>
            <AccountLedger />
          </ProtectedRoute>
        }
      />

      
      
      {/* Default route */}
      <Route 
        path="/" 
        element={
          user 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/login" replace />
        } 
      />
      

      {/* Catch all route */}
      <Route 
        path="*" 
        element={
          user 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/login" replace />
        }
      />
    </Routes>

   
  );
};

export default AppRoutes; 