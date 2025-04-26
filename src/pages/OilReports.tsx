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
  DialogTitle,
  TextField,
  Tooltip,
  TablePagination,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  RemoveRedEye as ViewIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { OilReport, fetchOilReports, updateOilReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { log } from 'console';
import { useNavigate } from 'react-router-dom';

const OilReports: React.FC = () => {
  const [reports, setReports] = useState<OilReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<OilReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<OilReport | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editedReport, setEditedReport] = useState<Partial<OilReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch oil reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const fetchedReports = await fetchOilReports();
        setReports(fetchedReports);
        setFilteredReports(fetchedReports);
      } catch (err) {
        console.error('Error loading oil reports:', err);
        setError('Failed to load oil reports. Please try again.');
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
        report.operatorName.toLowerCase().includes(term) ||
        report.collectionTank.toLowerCase().includes(term) ||
        report.tankSource.toLowerCase().includes(term) ||
        report.operationChosen.toLowerCase().includes(term)
    );
    setFilteredReports(filtered);
    setPage(0);
  };

  // Handle view report
  const handleViewReport = (report: OilReport) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };

  // Handle close view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedReport(null);
  };

  // Handle edit report
  const handleEditReport = (report: OilReport) => {
    setSelectedReport(report);
    setEditedReport({
      barrelsCount: report.barrelsCount,
      collectionTank: report.collectionTank,
      cycleNumber: report.cycleNumber,
      flowStatus: report.flowStatus,
      notes: report.notes,
      operationChosen: report.operationChosen,
      operatorName: report.operatorName,
      quantitySource: report.quantitySource,
      tankSource: report.tankSource,
      totalNetProduction: report.totalNetProduction,
      totalQuantityLiters: report.totalQuantityLiters,
      waterOutputLiters: report.waterOutputLiters,
      startTime: report.startTime,
      endTime: report.endTime,
      entryDate: report.entryDate,
      totals: report.totals || 0
    });
    setOpenEditDialog(true);
  };

  // Handle edit field change
  const handleEditFieldChange = (field: keyof OilReport, value: any) => {
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
      console.log(editedReport)
      await updateOilReport(selectedReport.id, editedReport);
      
      // Update local state
      const updatedReports = reports.map(report => 
        report.id === selectedReport.id 
          ? { ...report, ...editedReport }
          : report
      ) as OilReport[];
      
      setReports(updatedReports);
      setFilteredReports(
        filteredReports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, ...editedReport }
            : report
        ) as OilReport[]
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
      'ID', 'Username', 'Operator Name', 'Entry Date', 'Total Production', 
      'Total Quantity', 'Water Output', 'Collection Tank', 'Tank Source'
    ];
    
    const data = reports.map(report => [
      report.id,
      report.userName,
      report.operatorName,
      formatDate(report.entryDate),
      report.totalNetProduction,
      report.totalQuantityLiters,
      report.waterOutputLiters,
      report.collectionTank,
      report.tankSource
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
    link.setAttribute('download', 'oil-reports.csv');
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
          تقرير حركة دخول الزيت الحارق الى الفرن
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
        تقرير حركة دخول الزيت الحارق الى الفرن
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
            onClick={() => navigate('/add-oil-report')}
            sx={{ mr: 1 }}
          >
            + إضافة تقرير جديد
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
                <TableCell>اسم مسؤول التشغيلة</TableCell>
                <TableCell>التشغيلة المدخلة للفرن</TableCell>
                <TableCell>الخزان المأخوذ منه الكمية</TableCell>
                <TableCell>الخزان المفرغ إاليه الكمية</TableCell>
                <TableCell>إسم المورد</TableCell>
                <TableCell>تاريخ الإدخال</TableCell>
                <TableCell>وقت البدء</TableCell>
                <TableCell>الكمية الإجمالية</TableCell>
                <TableCell align="right">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No oil reports found</TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{report.operatorName}</TableCell>
                      <TableCell>{report.operationChosen}</TableCell>
                      <TableCell>{report.tankSource}</TableCell>
                      <TableCell>{report.collectionTank}</TableCell>
                      <TableCell>{report.quantitySource}</TableCell>
                      <TableCell>{formatDate(report.entryDate)}</TableCell>
                      <TableCell>{formatDate(report.startTime)}</TableCell>
                      <TableCell>{report.totalNetProduction.toLocaleString()} L</TableCell>
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
          تفاصيل تقرير الزيت
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات التشغيل
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      اسم مسؤول التشغيلة
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.operatorName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      التشغيلة المدخلة للفرن
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.operationChosen}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الخزان المأخوذ منه الكمية
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.tankSource}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الخزان المفرغ إاليه الكمية
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.collectionTank}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      إسم المورد
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.quantitySource}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      وقت البدء
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.startTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      وقت الانتهاء
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.endTime)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات الكمية
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      عدد البراميل
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.barrelsCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الكمية الإجمالية (لتر)
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.totalQuantityLiters.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      كمية المياه (لتر)
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.waterOutputLiters.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      صافي الإنتاج
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.totalNetProduction.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات التاريخ والوقت
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ الإدخال
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.entryDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ الإنشاء
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.createdAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  ملاحظات
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
          <Button onClick={handleCloseViewDialog}>إغلاق</Button>
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
            تعديل
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
          تعديل تقرير الزيت
        </DialogTitle>
        <DialogContent dividers>
          {updateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              تم تحديث التقرير بنجاح!
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
                  معلومات التشغيل
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="اسم مسؤول التشغيلة"
                      value={editedReport.operatorName || ''}
                      onChange={(e) => handleEditFieldChange('operatorName', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="وليد النجار">وليد النجار</option>
                      <option value="عبد الخالق">عبد الخالق</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="التشغيلة المدخلة للفرن"
                      value={editedReport.operationChosen || ''}
                      onChange={(e) => handleEditFieldChange('operationChosen', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="التشغيلة 1">التشغيلة 1</option>
                      <option value="التشغيلة 2">التشغيلة 2</option>
                      <option value="التشغيلة 3">التشغيلة 3</option>
                      <option value="التشغيلة 4">التشغيلة 4</option>
                      <option value="التشغيلة 5">التشغيلة 5</option>
                      <option value="التشغيلة 6">التشغيلة 6</option>
                      <option value="التشغيلة 7">التشغيلة 7</option>
                      <option value="التشغيلة 8">التشغيلة 8</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="الخزان المأخوذ منه الكمية"
                      value={editedReport.tankSource || ''}
                      onChange={(e) => handleEditFieldChange('tankSource', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="الخزان 1">الخزان 1</option>
                      <option value="الخزان 2">الخزان 2</option>
                      <option value="الخزان 3">الخزان 3</option>
                      <option value="الخزان 4">الخزان 4</option>
                      <option value="الخزان 5">الخزان 5</option>
                      <option value="الخزان 6">الخزان 6</option>
                      <option value="الخزان 7">الخزان 7</option>
                      <option value="الخزان 8">الخزان 8</option>
                      <option value="الخزان 9">الخزان 9</option>
                      <option value="الخزان 10">الخزان 10</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="الخزان المفرغ إاليه الكمية"
                      value={editedReport.collectionTank || ''}
                      onChange={(e) => handleEditFieldChange('collectionTank', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="الخزان 1">الخزان 1</option>
                      <option value="الخزان 2">الخزان 2</option>
                      <option value="الخزان 3">الخزان 3</option>
                      <option value="الخزان 4">الخزان 4</option>
                      <option value="الخزان 5">الخزان 5</option>
                      <option value="الخزان 6">الخزان 6</option>
                      <option value="الخزان 7">الخزان 7</option>
                      <option value="الخزان 8">الخزان 8</option>
                      <option value="الخزان 9">الخزان 9</option>
                      <option value="الخزان 10">الخزان 10</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="إسم المورد"
                      value={editedReport.quantitySource || ''}
                      onChange={(e) => handleEditFieldChange('quantitySource', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="مدرك">مدرك</option>
                      <option value="عدن">عدن</option>
                      <option value="الشعبي">الشعبي</option>
                      <option value="محمد الضحاك">محمد الضحاك</option>
                      <option value="محطه المتحده">محطه المتحده</option>
                      <option value="محطه التوفيق">محطه التوفيق</option>
                      <option value="محطة الزبيري">محطة الزبيري</option>
                      <option value="مورد جديد">مورد جديد</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="رقم الدورة"
                      value={editedReport.cycleNumber || ''}
                      onChange={(e) => handleEditFieldChange('cycleNumber', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات الكمية
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="عدد البراميل"
                      value={editedReport.barrelsCount || 0}
                      onChange={(e) => handleEditFieldChange('barrelsCount', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="الكمية الإجمالية (لتر)"
                      value={editedReport.totalQuantityLiters || 0}
                      onChange={(e) => handleEditFieldChange('totalQuantityLiters', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="كمية المياه (لتر)"
                      value={editedReport.waterOutputLiters || 0}
                      onChange={(e) => handleEditFieldChange('waterOutputLiters', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="صافي الإنتاج"
                      value={editedReport.totalNetProduction || 0}
                      onChange={(e) => handleEditFieldChange('totalNetProduction', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الإجماليات"
                      value={editedReport.totals || 0}
                      onChange={(e) => handleEditFieldChange('totals', parseInt(e.target.value))}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات التاريخ والوقت
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="تاريخ الإدخال"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.entryDate ? new Date(editedReport.entryDate.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('entryDate', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="وقت البدء"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.startTime ? new Date(editedReport.startTime.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('startTime', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="وقت الانتهاء"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.endTime ? new Date(editedReport.endTime.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('endTime', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="ملاحظات"
                  value={editedReport.notes || ''}
                  onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>إلغاء</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveEdit}
            disabled={loading || updateSuccess}
          >
            {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OilReports; 