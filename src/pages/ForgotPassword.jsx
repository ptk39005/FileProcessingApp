import React, { useState } from 'react';
import { TextField, Button, Container, Paper, Typography, Alert, Box } from '@mui/material';
import { requestPasswordReset, validateForgotPasswordOtp, resetPassword } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const navigate = useNavigate();

    // Step 1: Request OTP for email
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await requestPasswordReset({ email });
            setMessage({ type: 'success', text: response.message || 'OTP sent to your email.' });
            setIsOtpSent(true); // OTP sent, show OTP input
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Request failed.' });
        }
    };

    // Step 2: Validate OTP
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await validateForgotPasswordOtp({ email, otp });
            setMessage({ type: 'success', text: response.message });
            setIsOtpVerified(true); // OTP verified, show password reset form
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'OTP validation failed.' });
        }
    };

    // Step 3: Reset Password
    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        try {
            const response = await resetPassword({ email, otp, new_password: newPassword });
            setMessage({ type: 'success', text: response.message });
            navigate('/login'); // Navigate to login after successful reset
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Password reset failed.' });
        }
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
                    Forgot Password
                </Typography>
                {message && <Alert severity={message.type}>{message.text}</Alert>}

                {!isOtpSent ? (
                    // Email form
                    <form onSubmit={handleEmailSubmit}>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Box textAlign="center" marginTop={2}>
                            <Button type="submit" variant="contained" color="primary">
                                Request OTP
                            </Button>
                        </Box>
                    </form>
                ) : !isOtpVerified ? (
                    // OTP form
                    <form onSubmit={handleOtpSubmit}>
                        <TextField
                            label="OTP"
                            name="otp"
                            type="text"
                            fullWidth
                            margin="normal"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <Box textAlign="center" marginTop={2}>
                            <Button type="submit" variant="contained" color="primary">
                                Verify OTP
                            </Button>
                        </Box>
                    </form>
                ) : (
                    // Password reset form
                    <form onSubmit={handlePasswordResetSubmit}>
                        <TextField
                            label="New Password"
                            name="new_password"
                            type="password"
                            fullWidth
                            margin="normal"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <TextField
                            label="Confirm Password"
                            name="confirm_password"
                            type="password"
                            fullWidth
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <Box textAlign="center" marginTop={2}>
                            <Button type="submit" variant="contained" color="primary">
                                Reset Password
                            </Button>
                        </Box>
                    </form>
                )}
            </Paper>
        </Container>
    );
};

export default ForgotPassword;
