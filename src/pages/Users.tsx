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
  TextField,
  Tooltip,
  TablePagination,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  RemoveRedEye as ViewIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { fetchUsers, updateUserRoles } from '../services/firebaseService';
import { User } from '../types/user';
import { Timestamp } from 'firebase/firestore';

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

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.roles.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
    setPage(0);
  };

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
  };

  // Close view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedUser(null);
  };

  // Edit user roles
  const handleEditUserRoles = (user: User) => {
    setSelectedUser(user);
    
    // Initialize with current roles
    if (user.roles) {
      const rolesList = user.roles.split(',');
      setSelectedRoles(rolesList);
    } else {
      setSelectedRoles([]);
    }
    
    setRoleError(null);
    setOpenEditDialog(true);
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setSelectedRoles([]);
    setRoleError(null);
    setUpdateSuccess(false);
  };

  // Toggle role selection
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

  // Save updated roles
  const handleSaveRoles = async () => {
    if (!selectedUser?.id || selectedRoles.length === 0) {
      setRoleError('Please select at least one role');
      return;
    }

    try {
      setUpdateLoading(true);
      const rolesString = selectedRoles.join(',');
      
      // Update user roles in Firestore
      await updateUserRoles(selectedUser.id, rolesString);
      
      // Update local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, roles: rolesString, lastUpdated: Timestamp.now() } 
          : user
      );
      
      setUsers(updatedUsers);
      setFilteredUsers(
        filteredUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, roles: rolesString, lastUpdated: Timestamp.now() } 
            : user
        )
      );
      
      setUpdateSuccess(true);
      setTimeout(() => {
        handleCloseEditDialog();
      }, 1500);
    } catch (err) {
      console.error('Error updating user roles:', err);
      setError('Failed to update user roles. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Format timestamp
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toMillis()).toLocaleString();
  };

  // Get status chip
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && users.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
          Users
        </Typography>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Alert severity="error">{error}</Alert>
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
        Users
      </Typography>
      
      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 300 }}
        />
      </Box>
      
      {/* Users Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.default' }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No users found</TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.roles}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewUser(user)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {user.status === 'approved' && (
                          <Tooltip title="Edit Roles">
                            <IconButton
                              color="secondary"
                              onClick={() => handleEditUserRoles(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* View User Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedUser.name}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedUser.email}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedUser.phone}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {getStatusChip(selectedUser.status)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedUser.createdAt)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedUser.lastUpdated)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Roles
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedUser.roles || 'None'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          
          {selectedUser && selectedUser.status === 'approved' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                handleCloseViewDialog();
                handleEditUserRoles(selectedUser);
              }}
            >
              Edit Roles
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Edit Roles Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit User Roles</DialogTitle>
        <DialogContent dividers>
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              User roles updated successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <DialogContentText sx={{ mb: 3 }}>
                Update roles for user: <strong>{selectedUser.name}</strong> ({selectedUser.email})
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
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveRoles}
            disabled={updateLoading || updateSuccess || selectedRoles.length === 0}
          >
            {updateLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 