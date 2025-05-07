import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppContent from './components/core/AppContent';
import PopupWindow from './components/core/PopupWindow';
import './App.css';

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;