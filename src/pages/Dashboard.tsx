import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Assignment as ReportIcon,
  LocalGasStation as OilIcon,
  WaterDrop as WaterIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { fetchOilReports, fetchWasteReports, OilReport, WasteReport } from '../services/firebaseService';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [oilReports, setOilReports] = useState<OilReport[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch oil and waste reports in parallel
        const [fetchedOilReports, fetchedWasteReports] = await Promise.all([
          fetchOilReports(),
          fetchWasteReports()
        ]);
        
        setOilReports(fetchedOilReports);
        setWasteReports(fetchedWasteReports);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          Dashboard
        </Typography>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  // Calculate totals
  const totalOilQuantity = oilReports.reduce((sum, report) => sum + report.totalQuantityLiters, 0);
  const totalOilNet = oilReports.reduce((sum, report) => sum + report.totalNetProduction, 0);
  const totalWasteQuantity = wasteReports.reduce((sum, report) => sum + report.totalQuantityLiters, 0);
  const totalWasteBarrels = wasteReports.reduce((sum, report) => sum + report.barrelsDelivered, 0);
  
  // Prepare data for oil operations pie chart
  const oilOperationsCount = oilReports.reduce((acc, report) => {
    const operation = report.operationChosen;
    if (!operation) return acc;
    
    if (!acc[operation]) {
      acc[operation] = 1;
    } else {
      acc[operation]++;
    }
    return acc;
  }, {} as Record<string, number>);

  const oilOperationsData = {
    labels: Object.keys(oilOperationsCount),
    datasets: [
      {
        data: Object.values(oilOperationsCount),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for waste supply types distribution
  const wasteSupplyTypesCount = wasteReports.reduce((acc, report) => {
    const supplyType = report.supplyType;
    if (!supplyType) return acc;
    
    if (!acc[supplyType]) {
      acc[supplyType] = 1;
    } else {
      acc[supplyType]++;
    }
    return acc;
  }, {} as Record<string, number>);

  const wasteSupplyTypesData = {
    labels: Object.keys(wasteSupplyTypesCount),
    datasets: [
      {
        label: 'Supply Types',
        data: Object.values(wasteSupplyTypesCount),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Group reports by month for monthly trends
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Initialize monthly data structure
    const monthlyData = {
      oilQuantity: Array(12).fill(0),
      wasteQuantity: Array(12).fill(0)
    };
    
    // Calculate oil quantities by month
    oilReports.forEach(report => {
      if (report.createdAt) {
        const date = new Date(report.createdAt.toMillis());
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData.oilQuantity[month] += report.totalQuantityLiters;
        }
      }
    });
    
    // Calculate waste quantities by month
    wasteReports.forEach(report => {
      if (report.createdAt) {
        const date = new Date(report.createdAt.toMillis());
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData.wasteQuantity[month] += report.totalQuantityLiters;
        }
      }
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Oil Quantity (Liters)',
          data: monthlyData.oilQuantity,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Waste Quantity (Liters)',
          data: monthlyData.wasteQuantity,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
        }
      ],
    };
  };

  const monthlyQuantityData = getMonthlyData();

  // Recent activities (using real reports)
  const recentReports = [...oilReports, ...wasteReports]
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 5)
    .map(report => {
      const isOilReport = 'totalNetProduction' in report;
      return {
        id: report.id,
        name: report.userName,
        action: isOilReport 
          ? `Added Oil Report (${report.operationChosen || 'N/A'})`
          : `Added Waste Report (${(report as WasteReport).supplyType || 'N/A'})`,
        date: new Date(report.createdAt.toMillis()).toLocaleDateString(),
        isOil: isOilReport
      };
    });

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                height: 56,
                width: 56,
                mr: 2,
              }}
            >
              <OilIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" variant="subtitle2">
                Total Oil (Liters)
              </Typography>
              <Typography variant="h4">{totalOilQuantity.toLocaleString()}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                height: 56,
                width: 56,
                mr: 2,
              }}
            >
              <OilIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" variant="subtitle2">
                Net Oil Production
              </Typography>
              <Typography variant="h4">{totalOilNet.toLocaleString()}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'success.main',
                height: 56,
                width: 56,
                mr: 2,
              }}
            >
              <WaterIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" variant="subtitle2">
                Total Waste (Liters)
              </Typography>
              <Typography variant="h4">{totalWasteQuantity.toLocaleString()}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'info.main',
                height: 56,
                width: 56,
                mr: 2,
              }}
            >
              <ReportIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" variant="subtitle2">
                Total Reports
              </Typography>
              <Typography variant="h4">{oilReports.length + wasteReports.length}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader title="Oil Operations Distribution" />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" alignItems="center" justifyContent="center">
                <Pie 
                  data={oilOperationsData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader title="Waste Supply Types" />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" alignItems="center" justifyContent="center">
                <Bar 
                  data={wasteSupplyTypesData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Monthly Trend & Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader title="Monthly Quantities" />
            <Divider />
            <CardContent>
              <Box height={300}>
                <Line 
                  data={monthlyQuantityData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader title="Recent Reports" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%' }}>
                {recentReports.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No recent reports" />
                  </ListItem>
                ) : (
                  recentReports.map((report, index) => (
                    <React.Fragment key={report.id || index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: report.isOil ? 'primary.main' : 'success.main' }}>
                            {report.isOil ? <OilIcon /> : <WaterIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={report.name}
                          secondary={
                            <React.Fragment>
                              <Typography
                                sx={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                                color="textPrimary"
                              >
                                {report.action}
                              </Typography>
                              {` — ${report.date}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < recentReports.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 