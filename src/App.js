import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack'; 
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import UploadFiles from './pages/UploadFiles';
import Profile from './pages/Profile';
import MergeFiles from './pages/MergeFiles';
import { AuthProvider } from './AuthContext';
import EditFile from './pages/EditFile'
import AddColumn from './pages/addColumn';
import GroupAndPivot from './pages/GroupPivot';
import SortAndFilter from './pages/SortFilter';
import ApplyFormatting from './pages/applyFormatting';
import Visualization from './pages/Visualization';
import ReconcileFiles from './pages/ReconcileFiles';
import FileOperations from './pages/FileOperations';
// Create a theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Blue color for primary
        },
        secondary: {
            main: '#d32f2f', // Red color for secondary
        },
        
    },
});

const App = () => {
    // Simulate a check for an existing account (e.g., a token or user data in localStorage)
    return (
        <ThemeProvider theme={theme}>
             <SnackbarProvider
                maxSnack={3} // Maximum number of toasts displayed at once
                autoHideDuration={4000} // Duration each toast is visible
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Position of toasts
            >
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/register" />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/upload" element={<UploadFiles />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/merge" element={<MergeFiles />} />
                        <Route path="/edit-file" element={<EditFile />} /> {/* New Route */}
                        <Route path="/add-column" element={<AddColumn />} />
                        <Route path='/group-pivot' element = {<GroupAndPivot/>}/>
                        <Route path='/sort-filter' element = {<SortAndFilter/>}/>
                        <Route path='/apply-formatting' element={<ApplyFormatting/>}/>
                        <Route path='/visualization' element={<Visualization/>}/>
                        <Route path='/reconcile' element={<ReconcileFiles/>}/>
                        <Route path='/file-operations' element={<FileOperations/>}/>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
            </SnackbarProvider>
        </ThemeProvider>
    );
};

export default App;
