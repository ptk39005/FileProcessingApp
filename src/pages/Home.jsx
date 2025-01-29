import React, { useEffect, useState } from 'react';
import { fetchHome } from '../services/api';
import { Container, Typography, Alert } from '@mui/material';

const Home = () => {
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchHome();
                setContent(response.data.message);
            } catch (err) {
                setError('Unauthorized access. Please log in.');
            }
        };
        fetchData();
    }, []);

    return (
        <Container>
            {error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Typography variant="h4" marginTop={5}>
                    {content || 'Welcome to the Home Page!'}
                </Typography>
            )}
        </Container>
    );
};

export default Home;
