import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createWasteReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AddWasteReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplierName: '',
    receiverName: '',
    supplyType: '',
    flowStatus: '',
    barrelsDelivered: 0,
    deliveryDocNumber: '',
    totalQuantityLiters: 0,
    notes: '',
    submissionDate: '',
    quantityReceiptDate: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a report');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert date strings to Timestamp objects
      const reportData = {
        ...formData,
        userId: user.id || '',
        userName: user.name || 'Anonymous',
        createdAt: Timestamp.now(),
        submissionDate: formData.submissionDate ? new Timestamp(new Date(formData.submissionDate).getTime() / 1000, 0) : Timestamp.now(),
        quantityReceiptDate: formData.quantityReceiptDate ? new Timestamp(new Date(formData.quantityReceiptDate).getTime() / 1000, 0) : undefined,
        barrelsDelivered: Number(formData.barrelsDelivered),
        totalQuantityLiters: Number(formData.totalQuantityLiters)
      };

      await createWasteReport(reportData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        supplierName: '',
        receiverName: '',
        supplyType: '',
        flowStatus: '',
        barrelsDelivered: 0,
        deliveryDocNumber: '',
        totalQuantityLiters: 0,
        notes: '',
        submissionDate: '',
        quantityReceiptDate: ''
      });

      // Redirect after a delay
      setTimeout(() => {
        navigate('/waste-reports');
      }, 2000);
    } catch (err) {
      console.error('Error creating waste report:', err);
      setError('Failed to create report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/waste-reports')}
          sx={{ mr: 2 }}
        >
          Back to Reports
        </Button>
        <Typography variant="h4" fontWeight={500}>Add New Waste Report</Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Report created successfully! Redirecting to reports list...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Supply Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="نوع التوريد"
                    value={formData.supplyType}
                    onChange={(e) => handleChange('supplyType', e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value=""></option>
                    <option value="زيت محروق">زيت محروق</option>
                    <option value="زيت خام">زيت خام</option>
                    <option value="زيت مكرر">زيت مكرر</option>
                    <option value="نوع آخر">نوع آخر</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="رقم مستند التسليم"
                    value={formData.deliveryDocNumber}
                    onChange={(e) => handleChange('deliveryDocNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="حالة التدفق"
                    value={formData.flowStatus}
                    onChange={(e) => handleChange('flowStatus', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="عدد البراميل المسلمة"
                    value={formData.barrelsDelivered}
                    onChange={(e) => handleChange('barrelsDelivered', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="الكمية الإجمالية (لتر)"
                    value={formData.totalQuantityLiters}
                    onChange={(e) => handleChange('totalQuantityLiters', parseInt(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                معلومات الأشخاص
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="اسم المورد"
                    value={formData.supplierName}
                    onChange={(e) => handleChange('supplierName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="اسم المستلم"
                    value={formData.receiverName}
                    onChange={(e) => handleChange('receiverName', e.target.value)}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="تاريخ التقديم"
                    InputLabelProps={{ shrink: true }}
                    value={formData.submissionDate}
                    onChange={(e) => handleChange('submissionDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="تاريخ استلام الكمية"
                    InputLabelProps={{ shrink: true }}
                    value={formData.quantityReceiptDate}
                    onChange={(e) => handleChange('quantityReceiptDate', e.target.value)}
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
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate('/waste-reports')}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? 'جارٍ الحفظ...' : 'إنشاء التقرير'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddWasteReport; 