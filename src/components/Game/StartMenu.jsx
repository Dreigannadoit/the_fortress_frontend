import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backgroundStart, border, foregroundStart } from '../../assets';
import HoverSoundButton from '../UI/HoverSoundButton';

const StartMenu = ({ playerData, setPlayerData, setGameActive }) => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [authForm, setAuthForm] = useState({
        username: '',
        password: '',
        email: '' // Only for registration
    });
    const [isLogin, setIsLogin] = useState(true);
    const [isRegister, setIsRegister] = useState(true)
    const [authError, setAuthError] = useState('');
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [lastToggleTime, setLastToggleTime] = useState(0); 

    const handleStartGame = () => {
        setGameActive(true);
        navigate('/game');
    };

    const handleOpenStore = () => {
        setGameActive(false);
        navigate('/store');
    };

    const handleOpenCharacter = () => {
        setGameActive(false);
        navigate('/character');
    };

    const handleAuthChange = (e) => {
        const { name, value } = e.target;
        setAuthForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(authForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Save token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));

            // Update player data if needed
            if (data.user.playerData) {
                setPlayerData(data.user.playerData);
            }

        } catch (error) {
            setAuthError(error.message);
            console.error('Auth error:', error);
        }
    };

    const toggleAuthMode = () => {
        const now = Date.now();
        // If clicked within 500ms of last click, toggle form visibility
        if (now - lastToggleTime < 500) {
            setShowAuthForm(prev => !prev);
        } else {
            setIsLogin(!isLogin);
            setAuthError('');
            // Only show form if switching modes (not double click)
            setShowAuthForm(true);
        }
        setLastToggleTime(now);
        };

        const toggleLoginDisplay = () => {
            return
        }

        const toggleRegisterDisplay = () => {
            return
        }

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const calculateTransform = (speed) => {
        const x = (mousePosition.x / window.innerWidth) * 2 - 1;
        const y = (mousePosition.y / window.innerHeight) * 2 - 1;
        return `translate(${-x * speed}px, ${-y * speed}px)`;
    };

    return (
        <div className="start-menu-container">
            <img
                src={backgroundStart}
                alt="background"
                className="parallax-background"
                style={{
                    transform: calculateTransform(5),
                    zIndex: -2
                }}
            />
            <img
                src={foregroundStart}
                alt="foreground"
                className="parallax-foreground"
                style={{
                    transform: calculateTransform(30),
                    zIndex: -1
                }}
            />

            <div className="content-wrapper">
                <img src={border} alt="" />
                <div className="content-container">
                    <div className="top">
                        <div className="left">
                            <div>
                                <HoverSoundButton className="login-button" onClick={toggleAuthMode}>
                                    Login
                                </HoverSoundButton>

                                <HoverSoundButton className="sign-button" onClick={toggleAuthMode}>
                                    Register
                                </HoverSoundButton>
                            </div>
                            <div className="currency-display">
                                Currency: {playerData.currency}
                            </div>
                        </div>
                        <div className="right">
                            <div className={`auth-form ${!showAuthForm ? 'hidden' : ''}`}>
                                <h3>{isLogin ? 'Login' : 'Register'}</h3>
                                {authError && <div className="auth-error">{authError}</div>}
                                <form onSubmit={handleAuthSubmit}>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Username"
                                        value={authForm.username}
                                        onChange={handleAuthChange}
                                        required
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={authForm.password}
                                        onChange={handleAuthChange}
                                        required
                                    />
                                    <br />
                                    <br />
                                    <HoverSoundButton type="submit">
                                        {isLogin ? 'Login' : 'Register'}
                                    </HoverSoundButton>
                                </form>
                            </div>
                        </div>

                    </div>
                    <div className="bottom">
                        <div className="left">
                            <h1 className="game-title">Until They Return</h1>
                            <p>Demo 2.7.4 - Pre-release</p>
                        </div>
                        <div className="right">
                            <div className="menu-options">
                                <HoverSoundButton className="start-button" onClick={handleStartGame}>
                                    Start Game
                                </HoverSoundButton>
                                <HoverSoundButton className="store-button" onClick={handleOpenStore}>
                                    Store
                                </HoverSoundButton>
                                <HoverSoundButton className="character-button" onClick={handleOpenCharacter}>
                                    Character
                                </HoverSoundButton>
                                <HoverSoundButton className="credits-button" onClick={handleStartGame}>
                                    Credits
                                </HoverSoundButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartMenu;