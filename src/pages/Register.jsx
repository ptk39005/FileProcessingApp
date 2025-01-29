import React, { useState } from 'react';
import { TextField, Button, Container, Paper, Typography, Alert, Box, IconButton, InputAdornment } from '@mui/material';
import { register, validateOtp } from '../services/api'; // Assuming `validateOtp` is a function for OTP validation
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', company_name: '', password: '', confirmPassword: '' });
    const [message, setMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // To toggle password visibility
    const [passwordMismatch, setPasswordMismatch] = useState(false); // To check if passwords match
    const [otp, setOtp] = useState(''); // State to handle OTP input
    const [isOtpSent, setIsOtpSent] = useState(false); // Flag to track OTP sent status
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (e) => {
        setOtp(e.target.value);
    };

    const handlePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset the error state before starting the registration process
        setMessage(null);
        setPasswordMismatch(false);

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            setPasswordMismatch(true);
            setTimeout(() => setPasswordMismatch(false), 3000); // Clear password mismatch error after 3 seconds
            console.log("Passwords do not match");
            return;
        }

        try {
            console.log("Attempting to register user:", formData);
            await register(formData);  // No need to store the response if not required
            setMessage({ type: 'success', text: 'Registration successful! OTP sent to email.' });
            setIsOtpSent(true); // OTP has been sent
            console.log("Registration successful, OTP sent.");
        } catch (error) {
            console.error("Registration failed:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Registration failed' });
            setTimeout(() => setMessage(null), 3000); // Clear general error message after 3 seconds
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        // Reset any previous messages
        setMessage(null);

        try {
            console.log("Attempting to validate OTP:", { email: formData.email, otp });
            await validateOtp({ email: formData.email, otp });  // No need to store the response if not required
            console.log(formData.email +" "+ otp)
            setMessage({ type: 'success', text: 'OTP validated successfully!' });
            console.log("OTP validated successfully!");
            setTimeout(() => navigate('/login'), 2000); // Redirect after successful OTP validation
        } catch (error) {
            console.error("OTP validation failed:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Invalid OTP' });
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 5 }}>
                <Typography variant="h4" textAlign="center" gutterBottom>
                    Register
                </Typography>
                {message && <Alert severity={message.type}>{message.text}</Alert>}
                {passwordMismatch && (
                    <Alert severity="error">Passwords do not match. Please try again.</Alert>
                )}
                {!isOtpSent ? (
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Name"
                            name="name"
                            fullWidth
                            margin="normal"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
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
                            label="Company Name"
                            name="company_name"
                            fullWidth
                            margin="normal"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Enter your company name"
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
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handlePasswordVisibility} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            margin="normal"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <Box textAlign="center" marginTop={2}>
                            <Button type="submit" variant="contained" color="primary" sx={{ marginRight: 2 }}>
                                Register
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/login')}
                            >
                                Already have an account? Login
                            </Button>
                        </Box>
                    </form>
                ) : (
                    // OTP Verification Screen
                    <form onSubmit={handleOtpSubmit}>
                        <TextField
                            label="Enter OTP"
                            name="otp"
                            type="text"
                            fullWidth
                            margin="normal"
                            value={otp}
                            onChange={handleOtpChange}
                            required
                        />
                        <Box textAlign="center" marginTop={2}>
                            <Button type="submit" variant="contained" color="primary">
                                Verify OTP
                            </Button>
                        </Box>
                    </form>
                )}
            </Paper>
        </Container>
    );
};

export default Register;
