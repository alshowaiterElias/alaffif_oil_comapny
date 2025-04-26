import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <ErrorOutline color="error" sx={{ fontSize: 72, mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom fontWeight="500">
            Access Denied
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have permission to access this page. 
            This area requires specific role permissions.
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoToDashboard}
            >
              Go to Dashboard
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Unauthorized; 