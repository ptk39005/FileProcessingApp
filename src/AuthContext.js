import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [email, setEmail] = useState(localStorage.getItem('email'));

    useEffect(() => {
        // Ensure email stays synchronized with localStorage
        const storedEmail = localStorage.getItem('email');
        if (storedEmail) {
            setEmail(storedEmail);
        }
    }, []);

    const clearAuth = () => {
        localStorage.removeItem('email');
        localStorage.removeItem('token');
        setEmail(null);
    };

    return (
        <AuthContext.Provider value={{ email, setEmail, clearAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
