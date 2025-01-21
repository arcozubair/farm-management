import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Livestock from './pages/Livestock';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Unauthorized from './pages/Unauthorized';
import Profile from './pages/Profile';
import { createTheme, ThemeProvider } from '@mui/material';
import DayBook from './pages/DayBook';
import CustomerLedger from './components/customer/CustomerLedger';
import theme from './theme';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/livestock"
          element={
            <ProtectedRoute>
              <Livestock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />
         <Route
          path="/daybook"
          element={
            <ProtectedRoute>
              <DayBook />
            </ProtectedRoute>
          }
        />


        {/* Admin Only Routes */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute roles={['admin']}>
              <Customers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/customers/:customerId/ledger" element={<CustomerLedger />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
