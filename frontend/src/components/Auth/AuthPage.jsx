import React, { useState } from 'react';

const AuthPage = ({ onLogin, onRegister, error, isLoading }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (isLoading) return; // Prevent multiple submissions

        if (isLoginView) {
            onLogin(username, password);
        } else {
            onRegister(username, password);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <h2>{isLoginView ? 'Login' : 'Register'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isLoading} className="auth-button auth-submit-button ">
                        {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Register')}
                    </button>
                </form>
                <br />
                <br />
                <button
                    onClick={() => setIsLoginView(!isLoginView)}
                    className="auth-toggle-button"
                    disabled={isLoading}
                >
                    {isLoginView ? 'Need an account? Register' : 'Have an account? Login'}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;