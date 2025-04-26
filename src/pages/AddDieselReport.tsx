import React, { useState, useRef, useEffect } from 'react';
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
  Input,
  FormHelperText,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createDieselReport } from '../services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { ArrowBack as ArrowBackIcon, AddPhotoAlternate, Delete } from '@mui/icons-material';
import { supabase, bucketName } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const AddDieselReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    shipmentManager: '',
    receiptNumber: '',
    cycleNumber: '',
    barrelsCount: 0,
    totalQuantityLiters: 0,
    notes: '',
    submissionDate: '',
    quantityDispenseDate: '',
    shipmentExitTime: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

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

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to create a report');
      }

      // Validate required fields
      const requiredFields = ['clientName', 'shipmentManager', 'receiptNumber', 'totalQuantityLiters', 'submissionDate'];
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          throw new Error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        }
      }

      let receiptImageUrl = '';

      // Upload image to Supabase if provided
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

        // Get public URL for the uploaded file
        const urlData = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath , 60 * 60 *24 * 365 * 7)

        receiptImageUrl = urlData.data!.signedUrl;
        setIsUploading(false);
      }

      // Prepare report data
      const reportData = {
        ...formData,
        barrelsCount: Number(formData.barrelsCount),
        totalQuantityLiters: Number(formData.totalQuantityLiters),
        submissionDate: formData.submissionDate ? new Timestamp(new Date(formData.submissionDate).getTime() / 1000, 0) : undefined,
        quantityDispenseDate: formData.quantityDispenseDate ? new Timestamp(new Date(formData.quantityDispenseDate).getTime() / 1000, 0) : undefined,
        shipmentExitTime: formData.shipmentExitTime ? new Timestamp(new Date(formData.shipmentExitTime).getTime() / 1000, 0) : undefined,
        userId: user.id,
        userName: user.name,
        receiptImageUrl
      };

      // Create report in Firestore
      await createDieselReport(reportData);
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/diesel-reports');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating diesel report:', err);
      setError(err.message || 'Failed to create diesel report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'إضافة تقرير ديزل';
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/diesel-reports')}
          sx={{ mr: 2 }}
        >
          Back to Reports
        </Button>
        <Typography variant="h4" fontWeight={500}>إضافة تقرير ديزل جديد</Typography>
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
                معلومات الشحنة
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="العميل المصروف له"
                    value={formData.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
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
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="المسؤول عن الحملة"
                    value={formData.shipmentManager}
                    onChange={(e) => handleChange('shipmentManager', e.target.value)}
                  />
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
                    required
                    label="رقم الإيصال"
                    value={formData.receiptNumber}
                    onChange={(e) => handleChange('receiptNumber', e.target.value)}
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
                معلومات التاريخ
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    type="datetime-local"
                    label="تاريخ التقديم"
                    InputLabelProps={{ shrink: true }}
                    value={formData.submissionDate}
                    onChange={(e) => handleChange('submissionDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="تاريخ صرف الكمية"
                    InputLabelProps={{ shrink: true }}
                    value={formData.quantityDispenseDate}
                    onChange={(e) => handleChange('quantityDispenseDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="وقت خروج الشحنة"
                    InputLabelProps={{ shrink: true }}
                    value={formData.shipmentExitTime}
                    onChange={(e) => handleChange('shipmentExitTime', e.target.value)}
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
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <label htmlFor="raised-button-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AddPhotoAlternate />}
                    sx={{ mb: 2 }}
                  >
                    رفع صورة الإيصال
                  </Button>
                </label>
                <FormHelperText>
                  تنسيقات مقبولة: JPG, PNG, GIF (الحد الأقصى 5 ميجابايت)
                </FormHelperText>
                
                {imagePreview && (
                  <Box sx={{ mt: 2, textAlign: 'center', position: 'relative' }}>
                    <Box 
                      component="img" 
                      src={imagePreview} 
                      alt="Receipt Preview" 
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
                  </Box>
                )}
                
                {isUploading && (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <CircularProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" color="text.secondary">
                      Uploading: {uploadProgress}%
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
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate('/diesel-reports')}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || isUploading}
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

export default AddDieselReport; 