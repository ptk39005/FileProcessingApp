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
  ListItem,
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
} from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import PivotTableChartIcon from "@mui/icons-material/TableChart";
import { useNavigate, useLocation } from "react-router-dom";
import { logout as apiLogout } from "../services/api"; // Import the logout API function
import { useSnackbar } from "notistack";

const drawerWidth = 240;

const NavigationBar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current route
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleProfileMenuClick = (event) => setAnchorEl(event.currentTarget);

  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
      try {
        const token = localStorage.getItem("token");
    
        if (!token) {
          throw new Error("Token not found in localStorage");
        }
    
        // Send the token to the logout endpoint
        const response = await apiLogout({ token });
    
        if (response.message === "Logout successful") {
          // Clear token and email from localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("email");
    
          // Redirect to login page
          navigate("/login");
        } else {
          throw new Error("Failed to logout");
        }
      } catch (error) {
        console.error("Error during logout:", error.message || error);
        addNotification("error", error.message || "Failed to logout. Please try again.");
      }
    };
  

  const menuItems = [
    { name: "Home", icon: <HomeIcon />, path: "/dashboard" },
    { name: "Upload Files", icon: <UploadIcon />, path: "/upload" },
    { name: "Edit File", icon: <EditIcon />, path: "/edit-file" },
    { name: "Merge Files", icon: <MergeTypeIcon />, path: "/merge" },
    { name: "Sort and Filter", icon: <QueryStatsIcon />, path: "/sort-filter" },
    { name: "Group and Pivot", icon: <PivotTableChartIcon />, path: "/group-pivot" },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: "#1a73e8" }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ marginRight: 2, color: "white" }}>
            Hello, {email}
          </Typography>
          <IconButton color="inherit" onClick={handleProfileMenuClick}>
            <Avatar sx={{ bgcolor: "#3f51b5" }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleProfileMenuClose}
            sx={{ mt: "45px" }}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/profile"); }}>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? drawerWidth : 70,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: sidebarOpen ? drawerWidth : 70,
            boxSizing: "border-box",
            transition: "width 0.3s",
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path} // Highlight if current path matches
              sx={{
                backgroundColor: location.pathname === item.path ? "rgba(25, 118, 210, 0.1)" : "inherit",
                "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? "#1a73e8" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    color: location.pathname === item.path ? "#1a73e8" : "inherit",
                  }}
                />
              )}
            </ListItem>
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
