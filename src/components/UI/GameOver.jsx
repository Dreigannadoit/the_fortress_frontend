import React from 'react'

const GameOver = ({ score, onRestart, handleReturnToMenu }) => (
    <div className="screen game-over-screen">
        <h2>Game Over!</h2>
        <p>Final Score: {score}</p>
        <button
            className="restart-button menu-button"
            onClick={onRestart}
            autoFocus
        >
            Play Again
        </button>

        <button
            onClick={handleReturnToMenu}
            className="pause-menu-button menu-button"
        >
            Return to Main Menu
        </button>
    </div>
);

export default GameOver