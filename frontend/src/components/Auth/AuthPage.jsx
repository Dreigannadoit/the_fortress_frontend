import React, { useState } from 'react';
import HoverSoundButton from '../UI/HoverSoundButton';

const AuthPage = ({ onLogin, onRegister, error, isLoading }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLoginMode) {
            onLogin(formData.username, formData.password);
        } else {
            onRegister(formData.username, formData.password);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <h2>{isLoginMode ? 'Login' : 'Register'}</h2>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <HoverSoundButton type="submit" className="auth-submit-button" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Register')}
                    </HoverSoundButton>
                </form>
                <br />
                <p>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={() => setIsLoginMode(!isLoginMode)} className="auth-toggle-button" disabled={isLoading}>
                        {isLoginMode ? 'Register here' : 'Login here'}
                    </button>
                </p>
                
                <div className="corner-bottom-left"></div>
                <div className="corner-bottom-right"></div>
            </div>
        </div>
    );
};
export default AuthPage;