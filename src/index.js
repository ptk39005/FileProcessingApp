import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; // Optional styles

// Create the root using React 18's createRoot API
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component wrapped in BrowserRouter
root.render(
    <App/>
);
