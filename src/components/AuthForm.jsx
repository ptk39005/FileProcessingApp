import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Paper, Box, Switch, Alert } from '@mui/material';
import { register, login } from '../services/api';

const AuthForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isRegistering, setIsRegistering] = useState(true);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = isRegistering ? await register(formData) : await login(formData);
            setMessage({ type: 'success', text: response.data.message });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong' });
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 5 }}>
                <Typography variant="h4" textAlign="center" gutterBottom>
                    {isRegistering ? 'Register' : 'Login'}
                </Typography>
                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <TextField
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                    )}
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <Box textAlign="center" marginTop={2}>
                        <Button type="submit" variant="contained" color="primary">
                            {isRegistering ? 'Register' : 'Login'}
                        </Button>
                    </Box>
                </form>
                <Box textAlign="center" marginTop={2}>
                    <Typography variant="body2" color="textSecondary">
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                    </Typography>
                    <Switch
                        checked={!isRegistering}
                        onChange={() => setIsRegistering(!isRegistering)}
                        color="primary"
                    />
                    <Typography variant="body2" color="textSecondary">
                        {isRegistering ? 'Switch to Login' : 'Switch to Register'}
                    </Typography>
                </Box>
                {message && (
                    <Box marginTop={2}>
                        <Alert severity={message.type}>{message.text}</Alert>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default AuthForm;