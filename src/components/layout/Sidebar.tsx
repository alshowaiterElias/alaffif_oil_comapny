import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as ReportIcon,
  LocalGasStation as OilIcon,
  DirectionsCar as DieselIcon,
  WaterDrop as WaterIcon,
  SupervisedUserCircle as UsersIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: Array<"admin" | "accountant">;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  drawerWidth, 
  mobileOpen, 
  handleDrawerToggle 
}) => {

  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Menu items with role restrictions
  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      allowedRoles: ['admin', 'accountant']
    },
    {
      title: 'User Requests',
      path: '/user-requests',
      icon: <PeopleIcon />,
      allowedRoles: ['admin'] // Only admin can manage user requests
    },
    {
      title: 'Users',
      path: '/users',
      icon: <UsersIcon />,
      allowedRoles: ['admin'] // Only admin can manage users
    },
    {
      title: 'تقرير حركة دخول الزيت الحارق الى الفرن',
      path: '/oil-reports',
      icon: <OilIcon />,
      allowedRoles: ['admin', 'accountant']
    },
    {
      title: 'إضافة تقرير زيت',
      path: '/add-oil-report',
      icon: <ReportIcon />,
      allowedRoles: ['admin'] // Only admin can add reports
    },
    {
      title: 'تقرير حركة الديزل المنصرف للمحطات',
      path: '/diesel-reports',
      icon: <DieselIcon />,
      allowedRoles: ['admin', 'accountant']
    },
    {
      title: 'إضافة تقرير ديزل',
      path: '/add-diesel-report',
      icon: <ReportIcon />,
      allowedRoles: ['admin'] // Only admin can add reports
    },
    {
      title: 'تقرير كميات الزيوت الواردة',
      path: '/waste-reports',
      icon: <WaterIcon />,
      allowedRoles: ['admin', 'accountant']
    },
    {
      title: 'إضافة تقرير وارد',
      path: '/add-waste-report',
      icon: <ReportIcon />,
      allowedRoles: ['admin'] // Only admin can add reports
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;
    // Split roles string into an array to check if any user role is in the allowed roles
    const userRoles = user.roles.split(',');
    return userRoles.some(role => item.allowedRoles.includes(role as "admin" | "accountant")); 
  });
  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Admin Panel
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (!matches) {
                  handleDrawerToggle();
                }
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );

  return (
    
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: 'none'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 