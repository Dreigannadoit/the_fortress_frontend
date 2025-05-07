// src/components/core/PopupWindow.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import AppContent from './AppContent';

const PopupWindow = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!localStorage.getItem('jwtToken')) {
            navigate('/auth');
        }
    }, [navigate]);

    return (
        <div className="popup-window-container">
            <AppContent isPopup={true} />
        </div>
    );
};

export default PopupWindow;