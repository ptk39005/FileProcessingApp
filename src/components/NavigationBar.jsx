import React, { useState, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Divider,
  Box,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  MergeType as MergeTypeIcon,
  QueryStats as QueryStatsIcon,
  Add,
  FilterList,
  FormatPaint,
} from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import PivotTableChartIcon from "@mui/icons-material/TableChart";
import { logout as apiLogout } from "../services/api";
import { useSnackbar } from "notistack";
import BarChartIcon from '@mui/icons-material/BarChart';
import FileOperationsIcon from '@mui/icons-material/FindReplace';
const drawerWidth = 240;

const NavigationBar = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const addNotification = useCallback(
    (type, text) => {
      enqueueSnackbar(text, { variant: type });
    },
    [enqueueSnackbar]
  );

  const email = localStorage.getItem("email") || "User";

  const open = Boolean(anchorEl);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleProfileMenuClick = (event) => setAnchorEl(event.currentTarget);

  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleMenuItemClick = (path, callback = null) => {
    if (callback) callback();
    console.log("Navigating to:", path);
    window.location.href = path;
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found");

      const response = await apiLogout({ token });

      if (response.message === "Logout successful") {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        addNotification("success", "Logged out successfully.");
        handleMenuItemClick("/login");
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout Error:", error.message || error);
      addNotification("error", "Logout failed. Please try again.");
    }
  };

  const menuItems = [
    { text: "Home", icon: <HomeIcon />, path: "/dashboard" },
    { text: "Upload Files", icon: <UploadIcon />, path: "/upload" },
    { text: "Edit File", icon: <EditIcon />, path: "/edit-file" },
    { text: "Add Column", icon: <Add />, path: "/add-column" },
    { text: "Merge Files", icon: <MergeTypeIcon />, path: "/merge" },
    { text: "Group & Pivot", icon: <PivotTableChartIcon />, path: "/group-pivot" },
    { text: "Sort & Filter", icon: <FilterList />, path: "/sort-filter" },
    { text: "Apply Formatting", icon: <FormatPaint />, path: "/apply-formatting" },
    { text: "Visualization", icon: <BarChartIcon />, path: "/visualization" },
    { text: "File Operations", icon: <FileOperationsIcon />, path: "/file-operations" },
    { text: "Reconcile Files", icon: <MergeTypeIcon />, path: "/reconcile" },
    { text: "Profile", icon: <AccountCircleIcon />, path: "/profile" },

  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          backgroundColor: "#2C3E50",  // Updated to match dashboard's dark color
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'  // Enhanced shadow
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ marginRight: 2, color: "#ffffff" }}>
            Hello, {email}
          </Typography>
          <IconButton color="inherit" onClick={handleProfileMenuClick}>
            <Avatar sx={{ 
              bgcolor: "#B82132",  // Updated to match brand color
              '&:hover': {
                bgcolor: '#961a28'  // Darker shade for hover
              }
            }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleProfileMenuClose}
            sx={{ mt: "45px" }}
          >
            <MenuItem onClick={() => handleMenuItemClick("/profile")}>Profile</MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleProfileMenuClose();
                handleLogout();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#ffffff",  // Clean white background
            borderRight: "1px solid rgba(0, 0, 0, 0.08)",
            color: "#2C3E50",    // Matching text color
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="h6" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: "#2C3E50",
              borderBottom: '3px solid #B82132',
              display: 'inline-block',
              paddingBottom: '8px'
            }}
          >
            Excel Operations
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <MenuItem
              key={item.text}
              onClick={() => handleMenuItemClick(item.path)}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(184, 33, 50, 0.08)",  // Light red hover effect
                },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                color: "#2C3E50",
                '& .MuiListItemIcon-root': {
                  color: "#2C3E50",  // Icon color
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </MenuItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default NavigationBar;
