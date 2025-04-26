import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserRequests from './pages/UserRequests';
import Users from './pages/Users';
import OilReports from './pages/OilReports';
import Unauthorized from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import WasteReports from './pages/WasteReports';
import AddOilReport from './pages/AddOilReport';
import AddWasteReport from './pages/AddWasteReport';
import DieselReports from './pages/DieselReports';
import AddDieselReport from './pages/AddDieselReport';

// Main App content with routes
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />
        
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes for both admin and accountant */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Admin-only routes */}
        <Route path="/user-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <UserRequests />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Routes for both admin and accountant */}
        <Route path="/oil-reports" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Layout>
              <OilReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/add-oil-report" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AddOilReport />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/diesel-reports" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Layout>
              <DieselReports/>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/add-diesel-report" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AddDieselReport />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/waste-reports" element={
          <ProtectedRoute allowedRoles={['admin', 'accountant']}>
            <Layout>
              <WasteReports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/add-waste-report" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AddWasteReport />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

// App with providers
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
