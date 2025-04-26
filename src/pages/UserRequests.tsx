import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  TextField,
  Tooltip,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  RemoveRedEye as ViewIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { UserRequest } from '../types/user';
import { Timestamp } from 'firebase/firestore';
import { 
  fetchUserRequests, 
  approveUserRequest, 
  rejectUserRequest 
} from '../services/firebaseService';

// Define the available roles
const roles = {
  admin: { 
    value: 'admin', 
    label: 'Admin', 
    description: 'Full control over the system',
    category: 'admin'
  },
  accountant: { 
    value: 'accountant', 
    label: 'Accountant', 
    description: 'Access to financial reports',
    category: 'admin'
  },
  deizelOperator: { 
    value: 'deizelOperator', 
    label: 'Dezil Operator', 
    description: 'Access to diesel operations',
    category: 'operator'
  },
  oilOperator: { 
    value: 'oilOperator', 
    label: 'Oil Operator', 
    description: 'Access to oil operations',
    category: 'operator'
  },
  wasteOperator: { 
    value: 'wasteOperator', 
    label: 'Waste Operator', 
    description: 'Access to waste operations',
    category: 'operator'
  }
};

const UserRequests: React.FC = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'approve' | 'reject'>('view');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadUserRequests = async () => {
      try {
        setLoading(true);
        const userRequests = await fetchUserRequests();
        setRequests(userRequests as UserRequest[]);
      } catch (err) {
        console.error('Error loading user requests:', err);
        setError('Failed to load user requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUserRequests();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (request: UserRequest, type: 'view' | 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDialogType(type);
    
    // For approve dialog, initialize with the existing roles
    if (type === 'approve') {
      if (request.roles) {
        const rolesList = request.roles.split(',');
        setSelectedRoles(rolesList);
      } else {
        setSelectedRoles([]);
      }
      setRoleError(null);
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoles([]);
    setRoleError(null);
    setRejectReason('');
  };

  const toggleRole = (roleKey: string) => {
    setRoleError(null);
    
    const role = roles[roleKey as keyof typeof roles];
    
    // Check if the role is already selected
    if (selectedRoles.includes(role.value)) {
      // If it is, remove it
      setSelectedRoles(prev => prev.filter(r => r !== role.value));
      return;
    }
    
    // Handle role selection rules
    if (role.category === 'admin') {
      // If selecting an admin role (admin or accountant)
      if (role.value === 'admin' && selectedRoles.includes('accountant')) {
        // Admin cannot be selected with accountant
        setRoleError('Admin and Accountant roles cannot be selected together');
        return;
      }
      
      if (role.value === 'accountant' && selectedRoles.includes('admin')) {
        // Accountant cannot be selected with admin
        setRoleError('Admin and Accountant roles cannot be selected together');
        return;
      }
      
      // Check if any operator roles are selected
      const hasOperators = selectedRoles.some(r => 
        r === 'deizelOperator' || r === 'oilOperator' || r === 'wasteOperator'
      );
      
      if (hasOperators) {
        setRoleError('Admin/Accountant roles cannot be mixed with Operator roles');
        return;
      }
      
      // If all checks pass, add the role
      setSelectedRoles(prev => [...prev, role.value]);
    } else {
      // Selecting an operator role
      const hasAdminRoles = selectedRoles.includes('admin') || selectedRoles.includes('accountant');
      
      if (hasAdminRoles) {
        setRoleError('Operator roles cannot be mixed with Admin/Accountant roles');
        return;
      }
      
      // If all checks pass, add the role
      setSelectedRoles(prev => [...prev, role.value]);
    }
  };

  const handleApproveRequest = async () => {
    if (selectedRoles.length === 0) {
      setRoleError('Please select at least one role');
      return;
    }
    
    if (selectedRequest && selectedRequest.id && selectedRequest.userId) {
      try {
        const rolesString = selectedRoles.join(',');
        
        await approveUserRequest(
          selectedRequest.id,
          selectedRequest.userId,
          rolesString
        );
        
        // Update local state
        const updatedRequests = requests.map(req => 
          req.id === selectedRequest.id ? {
            ...req,
            status: 'approved' as const,
            roles: rolesString,
            lastUpdated: Timestamp.now()
          } : req
        );
        
        setRequests(updatedRequests);
        handleCloseDialog();
      } catch (err) {
        console.error('Error approving request:', err);
        setError('Failed to approve user request. Please try again.');
      }
    }
  };

  const handleRejectRequest = async () => {
    if (selectedRequest && selectedRequest.id) {
      try {
        await rejectUserRequest(selectedRequest.id);
        
        // Update local state
        const updatedRequests = requests.map(req => 
          req.id === selectedRequest.id ? {
            ...req,
            status: 'rejected' as const,
            lastUpdated: Timestamp.now()
          } : req
        );
        
        setRequests(updatedRequests);
        handleCloseDialog();
      } catch (err) {
        console.error('Error rejecting request:', err);
        setError('Failed to reject user request. Please try again.');
      }
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toMillis()).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
          User Requests
        </Typography>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
        User Requests
      </Typography>
      
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.default' }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No user requests found</TableCell>
                </TableRow>
              ) : (
                requests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell component="th" scope="row">
                      {request.name}
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(request, 'view')}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {request.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              onClick={() => handleOpenDialog(request, 'approve')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Reject">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDialog(request, 'reject')}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={requests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* View Details Dialog */}
      <Dialog open={openDialog && dialogType === 'view'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {selectedRequest.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedRequest.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Phone:</strong> {selectedRequest.phone || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Request Date:</strong> {formatDate(selectedRequest.createdAt)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Updated:</strong> {formatDate(selectedRequest.lastUpdated)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {selectedRequest.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Requested Roles:</strong> {selectedRequest.roles || 'None'}
              </Typography>
              {selectedRequest.message && (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Message:</strong>
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1 }}
                  >
                    <Typography variant="body2">
                      {selectedRequest.message}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Approve Dialog */}
      <Dialog open={openDialog && dialogType === 'approve'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Approve User Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <DialogContentText sx={{ mb: 3 }}>
                You are about to approve the access request from <strong>{selectedRequest.name}</strong>. 
                Please select the role(s) to assign to this user.
              </DialogContentText>
              
              {roleError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {roleError}
                </Alert>
              )}
              
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select Role(s):
              </Typography>
              
              <Grid container spacing={2}>
                {/* Admin Role Card */}
                <Grid item xs={12} sm={6} lg={4}>
                  <Card 
                    variant={selectedRoles.includes('admin') ? 'elevation' : 'outlined'} 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderColor: selectedRoles.includes('admin') ? 'primary.main' : 'divider',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => toggleRole('admin')} sx={{ height: '100%' }}>
                      {selectedRoles.includes('admin') && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                          <CheckIcon color="primary" />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Admin
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Full control over the system
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                
                {/* Accountant Role Card */}
                <Grid item xs={12} sm={6} lg={4}>
                  <Card 
                    variant={selectedRoles.includes('accountant') ? 'elevation' : 'outlined'} 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderColor: selectedRoles.includes('accountant') ? 'primary.main' : 'divider',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => toggleRole('accountant')} sx={{ height: '100%' }}>
                      {selectedRoles.includes('accountant') && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                          <CheckIcon color="primary" />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Accountant
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access to financial reports
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                
                {/* Dezil Operator Role Card */}
                <Grid item xs={12} sm={6} lg={4}>
                  <Card 
                    variant={selectedRoles.includes('deizelOperator') ? 'elevation' : 'outlined'} 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderColor: selectedRoles.includes('deizelOperator') ? 'primary.main' : 'divider',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => toggleRole('deizelOperator')} sx={{ height: '100%' }}>
                      {selectedRoles.includes('deizelOperator') && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                          <CheckIcon color="primary" />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Dezil Operator
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access to diesel operations
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                
                {/* Oil Operator Role Card */}
                <Grid item xs={12} sm={6} lg={4}>
                  <Card 
                    variant={selectedRoles.includes('oilOperator') ? 'elevation' : 'outlined'} 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderColor: selectedRoles.includes('oilOperator') ? 'primary.main' : 'divider',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => toggleRole('oilOperator')} sx={{ height: '100%' }}>
                      {selectedRoles.includes('oilOperator') && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                          <CheckIcon color="primary" />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Oil Operator
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access to oil operations
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                
                {/* Waste Operator Role Card */}
                <Grid item xs={12} sm={6} lg={4}>
                  <Card 
                    variant={selectedRoles.includes('wasteOperator') ? 'elevation' : 'outlined'} 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderColor: selectedRoles.includes('wasteOperator') ? 'primary.main' : 'divider',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => toggleRole('wasteOperator')} sx={{ height: '100%' }}>
                      {selectedRoles.includes('wasteOperator') && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                          <CheckIcon color="primary" />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Waste Operator
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access to waste operations
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
              
              {selectedRoles.length > 0 && (
                <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2">Selected Role(s):</Typography>
                  <Typography>
                    {selectedRoles.map(role => {
                      const roleObj = Object.values(roles).find(r => r.value === role);
                      return roleObj?.label || role;
                    }).join(', ')}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleApproveRequest} 
            variant="contained" 
            color="success"
            disabled={selectedRoles.length === 0}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={openDialog && dialogType === 'reject'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject User Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogContentText>
                You are about to reject the access request from <strong>{selectedRequest.name}</strong>.
              </DialogContentText>
              <TextField
                margin="normal"
                label="Reason for Rejection (Optional)"
                fullWidth
                multiline
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleRejectRequest} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRequests; 