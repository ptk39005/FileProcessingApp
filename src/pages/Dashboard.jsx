import React, { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Container,
  Typography,
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  MergeType as MergeTypeIcon,
  FilterList as FilterListIcon,
  AddBox as AddBoxIcon,
  Transform as TransformIcon,
  SyncAlt as SyncAltIcon,
  FormatPaint as FormatPaintIcon,
  QueryStats as QueryStatsIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  ExitToApp as ExitToAppIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import NavigationBar from '../components/NavigationBar';
import { useNavigate } from 'react-router-dom';
import { getUserFiles, getProcessedFiles, deleteFile } from '../services/api'; // Update import

const drawerWidth = 240;

const Dashboard = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) setEmail(storedEmail);

    const fetchAllFiles = async () => {
      try {
        setIsLoading(true);
        // Fetch uploaded files
        const uploadedResponse = await getUserFiles();
        setUploadedFiles(uploadedResponse.files || []);
        // Fetch processed files
        const processedResponse = await getProcessedFiles();
        setProcessedFiles(processedResponse.files || []);
      } catch (err) {
        console.error('Failed to fetch files:', err);
        setError('Failed to fetch files.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFiles();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleProfileMenuClick = (event) => setAnchorEl(event.currentTarget);

  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleDownload = (downloadUrl) => {
    if (!downloadUrl) {
      alert('Download link is not available.');
      return;
    }
    window.open(downloadUrl, '_blank');
  };

  const handleDelete = async (fileName, folder) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        await deleteFile(fileName, folder);
        // Refresh the file lists after deletion
        const uploadedResponse = await getUserFiles();
        setUploadedFiles(uploadedResponse.files || []);
        const processedResponse = await getProcessedFiles();
        setProcessedFiles(processedResponse.files || []);
      } catch (error) {
        console.error('Failed to delete file:', error);
        setError('Failed to delete file.');
      }
    }
  };

  return (
    <NavigationBar>
      <Container>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Uploaded Files */}
            <Box sx={{ textAlign: 'center', mb: 3, mt: 4 }}>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#2C3E50',
                  borderBottom: '3px solid #B82132',
                  display: 'inline-block',
                  paddingBottom: '8px'
                }}
              >
                Uploaded Files
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ mb: 5, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>File Name</strong></TableCell>
                    <TableCell><strong>Uploaded Time</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadedFiles.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell>{file.fileName}</TableCell>
                      <TableCell>{new Date(file.uploadTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="contained"
                            color="#B82132"
                            onClick={() => handleDownload(file.downloadUrl)}
                            disabled={!file.downloadUrl}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            color="#B82132"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(file.fileName, 'uploaded_files')}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Processed Files */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#2C3E50',
                  borderBottom: '3px solid #B82132',
                  display: 'inline-block',
                  paddingBottom: '8px'
                }}
              >
                Processed Files
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>File Name</strong></TableCell>
                    <TableCell><strong>Processed Time</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedFiles.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell>{file.fileName}</TableCell>
                      <TableCell>{new Date(file.uploadTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="contained"
                            color="#B82132"
                            onClick={() => handleDownload(file.downloadUrl)}
                            disabled={!file.downloadUrl}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            color="#B82132"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(file.fileName, 'processed_files')}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>
    </NavigationBar>
  );
};

export default Dashboard;
