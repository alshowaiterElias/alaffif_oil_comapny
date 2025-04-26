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
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createOilReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AddOilReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    operatorName: '',
    operationChosen: '',
    cycleNumber: '',
    flowStatus: '',
    barrelsCount: 0,
    collectionTank: '',
    tankSource: '',
    quantitySource: '',
    totalQuantityLiters: 0,
    waterOutputLiters: 0,
    totalNetProduction: 0,
    notes: '',
    startTime: '',
    endTime: '',
    entryDate: '',
    totals: 0
  });

  // Dropdown options
  const operatorOptions = [
    "وليد النجار",
    'عبدالخالق',
  
  ];

  const operationTypeOptions = [
    'التشغيلة 1',
    'التشغيلة 2',
    'التشغيلة 3',
    'التشغيلة 4',
    'التشغيلة 5',
    'التشغيلة 6',
    'التشغيلة 7',
    'التشغيلة 8',
  ];

  const tankSourceOptions = [
    'خزان رقم 1',
    'خزان رقم 2',
    'خزان رقم 3',
    'خزان رقم 4',
    'خزان رقم 5',
    'خزان رقم 6',
    'خزان رقم 7',
    'خزان رقم 8',
    'خزان رقم 9',
    'خزان رقم 10',
  ];

  const collectionTankOptions = [
    'خزان رقم 1',
    'خزان رقم 2',
    'خزان رقم 3',
    'خزان رقم 4',
    'خزان رقم 5',
    'خزان رقم 6',
    'خزان رقم 7',
    'خزان رقم 8',
    'خزان رقم 9',
    'خزان رقم 10',
  ];

  const quantitySourceOptions = [
   "مدرك",
   "عدن",
   "الشعبي",
    "محمد الضحاك",
   "محطه المتحده",
    "محطه التوفيق",
   "محطة الزبيري",
    "مورد جديد"
  ];

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });

    // If updating totalQuantityLiters or waterOutputLiters, recalculate totalNetProduction
    if (field === 'totalQuantityLiters' || field === 'waterOutputLiters') {
      const totalQuantity = field === 'totalQuantityLiters' 
        ? Number(value) 
        : formData.totalQuantityLiters;
      
      const waterOutput = field === 'waterOutputLiters' 
        ? Number(value) 
        : formData.waterOutputLiters;
      
      setFormData(prev => ({
        ...prev,
        totalNetProduction: Math.max(0, totalQuantity - waterOutput)
      }));
    }
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
        startTime: formData.startTime ? new Timestamp(new Date(formData.startTime).getTime() / 1000, 0) : undefined,
        endTime: formData.endTime ? new Timestamp(new Date(formData.endTime).getTime() / 1000, 0) : undefined,
        entryDate: formData.entryDate ? new Timestamp(new Date(formData.entryDate).getTime() / 1000, 0) : Timestamp.now(),
        barrelsCount: Number(formData.barrelsCount),
        totalQuantityLiters: Number(formData.totalQuantityLiters),
        waterOutputLiters: Number(formData.waterOutputLiters),
        totalNetProduction: Number(formData.totalNetProduction),
        totals: formData.totals 
      };

      await createOilReport(reportData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        operatorName: '',
        operationChosen: '',
        cycleNumber: '',
        flowStatus: '',
        barrelsCount: 0,
        collectionTank: '',
        tankSource: '',
        quantitySource: '',
        totalQuantityLiters: 0,
        waterOutputLiters: 0,
        totalNetProduction: 0,
        notes: '',
        startTime: '',
        endTime: '',
        entryDate: '',
        totals: 0
      });

      // Redirect after a delay
      setTimeout(() => {
        navigate('/oil-reports');
      }, 2000);
    } catch (err) {
      console.error('Error creating oil report:', err);
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
          onClick={() => navigate('/oil-reports')}
          sx={{ mr: 2 }}
        >
          العودة إلى التقارير
        </Button>
        <Typography variant="h4" fontWeight={500}>إضافة تقرير زيت جديد</Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          تم إنشاء التقرير بنجاح! جاري التحويل إلى قائمة التقارير...
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
                معلومات التشغيل
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>اسم مسؤول التشغيلة</InputLabel>
                    <Select
                      value={formData.operatorName}
                      label="اسم مسؤول التشغيلة"
                      onChange={(e) => handleChange('operatorName', e.target.value)}
                    >
                      {operatorOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>التشغيلة المدخلة للفرن</InputLabel>
                    <Select
                      value={formData.operationChosen}
                      label="التشغيلة المخدلة للفرن"
                      onChange={(e) => handleChange('operationChosen', e.target.value)}
                    >
                      {operationTypeOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="رقم الدورة"
                    value={formData.cycleNumber}
                    onChange={(e) => handleChange('cycleNumber', e.target.value)}
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
                    label="عدد البراميل"
                    value={formData.barrelsCount}
                    onChange={(e) => handleChange('barrelsCount', parseInt(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                معلومات الخزانات والكميات
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>خزان التجميع</InputLabel>
                    <Select
                      value={formData.collectionTank}
                      label="خزان التجميع"
                      onChange={(e) => handleChange('collectionTank', e.target.value)}
                    >
                      {collectionTankOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>خزان المصدر</InputLabel>
                    <Select
                      value={formData.tankSource}
                      label="خزان المصدر"
                      onChange={(e) => handleChange('tankSource', e.target.value)}
                    >
                      {tankSourceOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>مصدر الكمية</InputLabel>
                    <Select
                      value={formData.quantitySource}
                      label="مصدر الكمية"
                      onChange={(e) => handleChange('quantitySource', e.target.value)}
                    >
                      {quantitySourceOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="إجمالي الكمية (لتر)"
                    value={formData.totalQuantityLiters}
                    onChange={(e) => handleChange('totalQuantityLiters', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="كمية الماء (لتر)"
                    value={formData.waterOutputLiters}
                    onChange={(e) => handleChange('waterOutputLiters', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="صافي الإنتاج (لتر)"
                    value={formData.totalNetProduction}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                معلومات الوقت
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="وقت البدء"
                    InputLabelProps={{ shrink: true }}
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="وقت الانتهاء"
                    InputLabelProps={{ shrink: true }}
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="تاريخ الإدخال"
                    InputLabelProps={{ shrink: true }}
                    value={formData.entryDate}
                    onChange={(e) => handleChange('entryDate', e.target.value)}
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
                  onClick={() => navigate('/oil-reports')}
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

export default AddOilReport; 