import React, { useState } from 'react';
import { TextField, Button, Container, Paper, Typography, Alert, Box, IconButton, InputAdornment } from '@mui/material';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(formData);
            console.log("Login response:", response);
            if (response && response.email) {  // Ensure email is in the response
                localStorage.setItem('email', response.email);   // Save email to localStorage
                setMessage({ type: 'success', text: response.message || 'Login successful!' });
                navigate('/dashboard');
            } else {
                setMessage({ type: 'error', text: 'Login failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Login failed' });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 5 }}>
                <Typography
                    variant="h4"
                    textAlign="center"
                    gutterBottom
                    sx={{ color: '#003366' }} // Very dark blue color
                >
                    Login
                </Typography>
                {message && <Alert severity={message.type}>{message.text}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        fullWidth
                        margin="normal"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={togglePasswordVisibility} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box textAlign="center" marginTop={2}>
                        <Button type="submit" variant="contained" color="primary" sx={{ marginRight: 2 }}>
                            Login
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate('/register')}
                            sx={{ marginRight: 2 }}
                        >
                            No account? Register
                        </Button>
                         {/* Adjust the positioning of the "Forgot Password?" button */}
                    <Box textAlign="center" marginTop={4}>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot Password?
                        </Button>
                    </Box>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;
