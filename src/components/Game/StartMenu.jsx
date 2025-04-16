import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartMenu = () => {
    const navigate = useNavigate();

    const handleStartGame = () => {
        navigate('/game'); // Navigate to your game route
    };

    return (
        <div className="start-menu-container">
            <h1 className="game-title">Zombie Defense</h1>
            
            <div className="menu-options">
                <button 
                    className="menu-button start-button"
                    onClick={handleStartGame}
                >
                    Start Game
                </button>

                <button 
                    className="menu-button quit-button"
                    onClick={() => window.close()}
                >
                    Quit
                </button>
            </div>
            
            <div className="game-info">
                <p>Defend your base from the zombie horde!</p>
                <p>Survive for 2 minutes to win.</p>
            </div>
        </div>
    );
};

export default StartMenu;