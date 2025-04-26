import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const success = await login(values.email, values.password);
        if (success) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight="500">
            Admin Panel
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mb={3}>
            Sign in to continue to your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <TextField
              margin="normal"
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={formik.isSubmitting || loading}
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              {(formik.isSubmitting || loading) ? (
                <CircularProgress size={24} />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" align="center">
              Demo credentials: admin@example.com / password
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 