import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backgroundStart, border, foregroundStart } from '../../assets';

const StartMenu = ({ playerData, setPlayerData, setGameActive }) => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleStartGame = () => {
    setGameActive(true);
    navigate('/game');
  };

  const handleOpenStore = () => {
    setGameActive(false);
    navigate('/store');
  };

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
        // Normalize mouse position to be between -1 and 1
        const x = (mousePosition.x / window.innerWidth) * 2 - 1;
        const y = (mousePosition.y / window.innerHeight) * 2 - 1;

        // Apply speed factor (background should move slower than foreground)
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
                        <div className="form">
                            <a href="#">Login</a>
                            <a href="#">Sign Up</a>
                        </div>
                        <div className="currency-display">
                            Currency: {playerData.currency}
                        </div>
                    </div>
                    <div className="bottom">
                        <div className="left">
                            <h1 className="game-title">Until They Return</h1>
                        </div>
                        <div className="right">
                            <div className="menu-options">
                                <button
                                    className="menu-button start-button"
                                    onClick={handleStartGame}
                                >
                                    Start Game
                                </button>
                                <button
                                    className="menu-button store-button"
                                    onClick={handleOpenStore}
                                >
                                    STORE
                                </button>
                                <button
                                    className="menu-button character-button"
                                    onClick={handleStartGame}
                                >
                                    CHARACTER
                                </button>
                                <button
                                    className="menu-button credits-button"
                                    onClick={handleStartGame}
                                >
                                    CREDITS
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StartMenu;