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
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
  TablePagination,
  Grid,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  RemoveRedEye as ViewIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { WasteReport, fetchWasteReports, updateWasteReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const WasteReports: React.FC = () => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WasteReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editedReport, setEditedReport] = useState<Partial<WasteReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch waste reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const fetchedReports = await fetchWasteReports();
        setReports(fetchedReports);
        setFilteredReports(fetchedReports);
      } catch (err) {
        console.error('Error loading waste reports:', err);
        setError('Failed to load waste reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
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
      setFilteredReports(reports);
      return;
    }

    const filtered = reports.filter(
      report =>
        report.userName.toLowerCase().includes(term) ||
        report.supplierName.toLowerCase().includes(term) ||
        report.receiverName.toLowerCase().includes(term) ||
        report.supplyType.toLowerCase().includes(term) ||
        report.deliveryDocNumber.toLowerCase().includes(term)
    );
    setFilteredReports(filtered);
    setPage(0);
  };

  // Handle view report
  const handleViewReport = (report: WasteReport) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };

  // Handle close view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedReport(null);
  };

  // Handle edit report
  const handleEditReport = (report: WasteReport) => {
    setSelectedReport(report);
    setEditedReport({
      barrelsDelivered: report.barrelsDelivered,
      deliveryDocNumber: report.deliveryDocNumber,
      flowStatus: report.flowStatus,
      notes: report.notes,
      receiverName: report.receiverName,
      submissionDate: report.submissionDate,
      supplierName: report.supplierName,
      supplyType: report.supplyType,
      totalQuantityLiters: report.totalQuantityLiters,
      quantityReceiptDate: report.quantityReceiptDate
    });
    setOpenEditDialog(true);
  };

  // Handle edit field change
  const handleEditFieldChange = (field: keyof WasteReport, value: any) => {
    if (!editedReport) return;

    setEditedReport({
      ...editedReport,
      [field]: value
    });
  };

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditedReport(null);
    setUpdateSuccess(false);
  };

  // Handle save edited report
  const handleSaveEdit = async () => {
    if (!editedReport || !selectedReport) return;

    try {
      setLoading(true);
      await updateWasteReport(selectedReport.id, editedReport);
      
      // Update local state
      const updatedReports = reports.map(report => 
        report.id === selectedReport.id 
          ? { ...report, ...editedReport }
          : report
      ) as WasteReport[];
      
      setReports(updatedReports);
      setFilteredReports(
        filteredReports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, ...editedReport }
            : report
        ) as WasteReport[]
      );
      
      setUpdateSuccess(true);
      setTimeout(() => {
        handleCloseEditDialog();
      }, 1500);
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to a readable date string
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toMillis()).toLocaleString();
  };

  // Function to export CSV
  const exportToCSV = () => {
    // Convert data to CSV format
    const headers = [
      'ID', 'Username', 'Supplier Name', 'Receiver Name', 'Submission Date', 
      'Delivery Doc', 'Supply Type', 'Total Quantity', 'Barrels Delivered'
    ];
    
    const data = reports.map(report => [
      report.id,
      report.userName,
      report.supplierName,
      report.receiverName,
      formatDate(report.submissionDate),
      report.deliveryDocNumber,
      report.supplyType,
      report.totalQuantityLiters,
      report.barrelsDelivered
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell.replace('"', '""')}"` 
          : cell
      ).join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'waste-reports.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && reports.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && reports.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
          Waste Reports
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
        Waste Reports
      </Typography>
      
      {/* Actions Row */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate('/add-waste-report')}
            sx={{ mr: 1 }}
          >
            + Add New Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
            onClick={exportToCSV}
          >
            Export to CSV
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PdfIcon />}
          >
            Export to PDF
          </Button>
        </Box>
      </Box>
      
      {/* Reports Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.default' }}>
                <TableCell>Supplier</TableCell>
                <TableCell>Receiver</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Supply Type</TableCell>
                <TableCell>Doc Number</TableCell>
                <TableCell>Flow Status</TableCell>
                <TableCell>Total Quantity</TableCell>
                <TableCell>Barrels</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No waste reports found</TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{report.supplierName}</TableCell>
                      <TableCell>{report.receiverName}</TableCell>
                      <TableCell>{report.userName}</TableCell>
                      <TableCell>{formatDate(report.submissionDate)}</TableCell>
                      <TableCell>{report.supplyType}</TableCell>
                      <TableCell>{report.deliveryDocNumber}</TableCell>
                      <TableCell>{report.flowStatus}</TableCell>
                      <TableCell>{report.totalQuantityLiters.toLocaleString()} L</TableCell>
                      <TableCell>{report.barrelsDelivered}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewReport(report)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Report">
                          <IconButton 
                            color="secondary" 
                            onClick={() => handleEditReport(report)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
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
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* View Report Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Waste Report Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Supply Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Supply Type
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.supplyType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Delivery Document Number
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.deliveryDocNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Flow Status
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.flowStatus}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Barrels Delivered
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.barrelsDelivered}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Quantity (Liters)
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.totalQuantityLiters.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  People and Dates
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Supplier Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.supplierName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Receiver Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.receiverName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.userName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Submission Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.submissionDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Receipt Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.quantityReceiptDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.createdAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {selectedReport.notes || 'No notes provided'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              handleCloseViewDialog();
              if (selectedReport) {
                handleEditReport(selectedReport);
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Report Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Edit Waste Report
        </DialogTitle>
        <DialogContent dividers>
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Report updated successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {editedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Supply Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Supply Type"
                      value={editedReport.supplyType || ''}
                      onChange={(e) => handleEditFieldChange('supplyType', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Delivery Document Number"
                      value={editedReport.deliveryDocNumber || ''}
                      onChange={(e) => handleEditFieldChange('deliveryDocNumber', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Flow Status"
                      value={editedReport.flowStatus || ''}
                      onChange={(e) => handleEditFieldChange('flowStatus', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Barrels Delivered"
                      type="number"
                      value={editedReport.barrelsDelivered || 0}
                      onChange={(e) => handleEditFieldChange('barrelsDelivered', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Quantity (Liters)"
                      type="number"
                      value={editedReport.totalQuantityLiters || 0}
                      onChange={(e) => handleEditFieldChange('totalQuantityLiters', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  People Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Supplier Name"
                      value={editedReport.supplierName || ''}
                      onChange={(e) => handleEditFieldChange('supplierName', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Receiver Name"
                      value={editedReport.receiverName || ''}
                      onChange={(e) => handleEditFieldChange('receiverName', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Date Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Submission Date"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.submissionDate ? new Date(editedReport.submissionDate.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('submissionDate', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Receipt Date"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.quantityReceiptDate ? new Date(editedReport.quantityReceiptDate.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('quantityReceiptDate', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={editedReport.notes || ''}
                  onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveEdit}
            disabled={loading || updateSuccess}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WasteReports; 