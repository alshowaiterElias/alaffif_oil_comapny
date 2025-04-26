import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  CardMedia,
  Link,
  FormHelperText
} from '@mui/material';
import {
  Edit as EditIcon,
  RemoveRedEye as ViewIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  AddPhotoAlternate,
  Delete
} from '@mui/icons-material';
import { DieselReport, fetchDieselReports, updateDieselReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { supabase, bucketName } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const DieselReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DieselReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DieselReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DieselReport | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editedReport, setEditedReport] = useState<Partial<DieselReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // New image handling state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch diesel reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const fetchedReports = await fetchDieselReports();
        setReports(fetchedReports);
        setFilteredReports(fetchedReports);
      } catch (err) {
        console.error('Error loading diesel reports:', err);
        setError('Failed to load diesel reports. Please try again.');
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
        report.userName?.toLowerCase().includes(term) ||
        report.clientName?.toLowerCase().includes(term) ||
        report.shipmentManager?.toLowerCase().includes(term) ||
        report.receiptNumber?.toLowerCase().includes(term) ||
        report.cycleNumber?.toLowerCase().includes(term)
    );
    setFilteredReports(filtered);
    setPage(0);
  };

  // Handle view report
  const handleViewReport = (report: DieselReport) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };

  // Handle view image
  const handleViewImage = (report: DieselReport) => {
    setSelectedReport(report);
    setOpenImageDialog(true);
  };

  // Handle close view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedReport(null);
  };

  // Handle close image dialog
  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  // Handle edit report
  const handleEditReport = (report: DieselReport) => {
    setSelectedReport(report);
    setEditedReport({
      barrelsCount: report.barrelsCount,
      clientName: report.clientName,
      cycleNumber: report.cycleNumber,
      notes: report.notes,
      receiptNumber: report.receiptNumber,
      shipmentManager: report.shipmentManager,
      totalQuantityLiters: report.totalQuantityLiters,
      submissionDate: report.submissionDate,
      quantityDispenseDate: report.quantityDispenseDate,
      shipmentExitTime: report.shipmentExitTime,
      receiptImageUrl: report.receiptImageUrl
    });
    
    // Reset image state
    setImageFile(null);
    setImagePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
    
    setOpenEditDialog(true);
  };

  // Handle edit field change
  const handleEditFieldChange = (field: keyof DieselReport, value: any) => {
    if (!editedReport) return;

    setEditedReport({
      ...editedReport,
      [field]: value
    });
  };

  // Handle file selection for image update
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }

      setImageFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditedReport(null);
    setUpdateSuccess(false);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle save edited report
  const handleSaveEdit = async () => {
    if (!editedReport || !selectedReport) return;

    try {
      setLoading(true);
      
      let updatedReceiptImageUrl = editedReport.receiptImageUrl;
      
      // Upload new image if one is selected
      if (imageFile) {
        setIsUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}-${Date.now()}.${fileExt}`;
        const filePath = `dezil_receipts/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }

        // Get signed URL for the uploaded file
        const urlData = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 7); // 7 years expiry

        if (urlData.error) {
          throw new Error(`Error generating signed URL: ${urlData.error.message}`);
        }

        updatedReceiptImageUrl = urlData.data!.signedUrl;
        setIsUploading(false);
      }
      
      // Prepare update data with potentially new image URL
      const updateData = {
        ...editedReport,
        receiptImageUrl: updatedReceiptImageUrl
      };
      
      await updateDieselReport(selectedReport.id, updateData);
      
      // Update local state
      const updatedReports = reports.map(report => 
        report.id === selectedReport.id 
          ? { ...report, ...updateData }
          : report
      ) as DieselReport[];
      
      setReports(updatedReports);
      setFilteredReports(
        filteredReports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, ...updateData }
            : report
        ) as DieselReport[]
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
      'ID', 'Username', 'Client Name', 'Shipment Manager', 'Submission Date', 
      'Receipt Number', 'Barrels Count', 'Total Quantity', 'Cycle Number'
    ];
    
    const data = reports.map(report => [
      report.id,
      report.userName,
      report.clientName,
      report.shipmentManager,
      formatDate(report.submissionDate),
      report.receiptNumber,
      report.barrelsCount,
      report.totalQuantityLiters,
      report.cycleNumber
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
    link.setAttribute('download', 'diesel-reports.csv');
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
          تقرير حركة الديزل المنصرف للمحطات
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
        تقرير حركة الديزل المنصرف للمحطات
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
            onClick={() => navigate('/add-diesel-report')}
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
                <TableCell>العميل المصروف له</TableCell>
                <TableCell>المسؤول عن الحملة</TableCell>
                <TableCell>المستخدم</TableCell>
                <TableCell>تاريخ التقديم</TableCell>
                <TableCell>رقم الإيصال</TableCell>
                <TableCell>رقم الدورة</TableCell>
                <TableCell>الكمية الإجمالية</TableCell>
                <TableCell>الإيصال</TableCell>
                <TableCell align="right">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No diesel reports found</TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{report.clientName}</TableCell>
                      <TableCell>{report.shipmentManager}</TableCell>
                      <TableCell>{report.userName}</TableCell>
                      <TableCell>{formatDate(report.submissionDate)}</TableCell>
                      <TableCell>{report.receiptNumber}</TableCell>
                      <TableCell>{report.cycleNumber}</TableCell>
                      <TableCell>{report.totalQuantityLiters.toLocaleString()} L</TableCell>
                      <TableCell>
                        {report.receiptImageUrl && (
                          <Tooltip title="View Receipt">
                            <IconButton
                              color="primary"
                              onClick={() => handleViewImage(report)}
                            >
                              <ImageIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
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
          تفاصيل تقرير الديزل
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات الشحنة
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      العميل المصروف له
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.clientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      المسؤول عن الحملة
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.shipmentManager}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      رقم الدورة
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.cycleNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      رقم الإيصال
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.receiptNumber}
                    </Typography>
                  </Grid>
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
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات التاريخ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ التقديم
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.submissionDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ صرف الكمية
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.quantityDispenseDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      وقت خروج الشحنة
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.shipmentExitTime)}
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
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تم الإنشاء بواسطة
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.userName}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {selectedReport.receiptImageUrl && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    صورة الإيصال
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewImage(selectedReport)}
                    >
                      عرض صورة الإيصال
                    </Button>
                    <Box sx={{ mt: 1 }}>
                      <Link href={selectedReport.receiptImageUrl} target="_blank" rel="noopener">
                        Open in new tab
                      </Link>
                    </Box>
                  </Box>
                </Grid>
              )}

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
          تعديل تقرير الديزل
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
                  معلومات الشحنة
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="العميل المصروف له"
                      value={editedReport.clientName || ''}
                      onChange={(e) => handleEditFieldChange('clientName', e.target.value)}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="الزبيري">الزبيري</option>
                      <option value="فائز غبيس">فائز غبيس</option>
                      <option value="محطة التوفيق">محطة التوفيق</option>
                      <option value="محطة الصمود">محطة الصمود</option>
                      <option value="عميل جديد">عميل جديد</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="المسؤول عن الحملة"
                      value={editedReport.shipmentManager || ''}
                      onChange={(e) => handleEditFieldChange('shipmentManager', e.target.value)}
                      margin="normal"
                    />
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="رقم الإيصال"
                      value={editedReport.receiptNumber || ''}
                      onChange={(e) => handleEditFieldChange('receiptNumber', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
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
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  معلومات التاريخ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="تاريخ التقديم"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.submissionDate ? new Date(editedReport.submissionDate.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('submissionDate', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="تاريخ صرف الكمية"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.quantityDispenseDate ? new Date(editedReport.quantityDispenseDate.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('quantityDispenseDate', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="وقت خروج الشحنة"
                      InputLabelProps={{ shrink: true }}
                      value={editedReport.shipmentExitTime ? new Date(editedReport.shipmentExitTime.toMillis()).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Timestamp(new Date(e.target.value).getTime() / 1000, 0) : null;
                        handleEditFieldChange('shipmentExitTime', date);
                      }}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  صورة الإيصال
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="edit-receipt-image"
                    type="file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <label htmlFor="edit-receipt-image">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AddPhotoAlternate />}
                      sx={{ mb: 2 }}
                    >
                      {editedReport.receiptImageUrl ? 'تغيير صورة الإيصال' : 'رفع صورة الإيصال'}
                    </Button>
                  </label>
                  <FormHelperText>
                    تنسيقات مقبولة: JPG, PNG, GIF (الحد الأقصى 5 ميجابايت)
                  </FormHelperText>
                  
                  {/* Show image preview if a new image has been selected */}
                  {imagePreview ? (
                    <Box sx={{ mt: 2, textAlign: 'center', position: 'relative' }}>
                      <Box 
                        component="img" 
                        src={imagePreview} 
                        alt="New Receipt Preview" 
                        sx={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px', 
                          objectFit: 'contain',
                          border: '1px solid #eee',
                          borderRadius: 1,
                          p: 1
                        }} 
                      />
                      <IconButton 
                        onClick={clearImageSelection}
                        sx={{ position: 'absolute', top: 0, right: 0 }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                      <Typography variant="caption" display="block" mt={1}>
                        تم اختيار صورة جديدة (لم يتم الحفظ بعد)
                      </Typography>
                    </Box>
                  ) : (
                    /* Show existing image if available */
                    editedReport.receiptImageUrl && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <img 
                          src={editedReport.receiptImageUrl}
                          alt="Receipt"
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <Typography variant="caption" display="block" mt={1}>
                          صورة الإيصال الحالية
                        </Typography>
                      </Box>
                    )
                  )}
                  
                  {isUploading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <CircularProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" color="text.secondary">
                        جارٍ الرفع: {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </Box>
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
            disabled={loading || isUploading || updateSuccess}
          >
            {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          صورة الإيصال
        </DialogTitle>
        <DialogContent>
          {selectedReport && selectedReport.receiptImageUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CardMedia
                component="img"
                image={selectedReport.receiptImageUrl}
                alt="Receipt"
                sx={{ 
                  maxHeight: '70vh',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedReport && selectedReport.receiptImageUrl && (
            <Button 
              color="primary"
              onClick={() => window.open(selectedReport.receiptImageUrl, '_blank')}
            >
              فتح في علامة تبويب جديدة
            </Button>
          )}
          <Button onClick={handleCloseImageDialog}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DieselReports; 