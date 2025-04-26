import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Protected route component that checks authentication and role-based access.
 * If allowedRoles is not provided, any authenticated user can access the route.
 * If allowedRoles is provided, only users with specified roles can access the route.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && allowedRoles.length > 0) {
    // Check if the user has any of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => 
      user.roles.includes(role)
    );
    
    if (!hasAllowedRole) {
      // Redirect to unauthorized page
      return <Navigate to="/unauthorized" />;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute; 