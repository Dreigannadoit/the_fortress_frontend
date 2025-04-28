import React from 'react'

const GameOver = ({ score, onRestart, handleReturnToMenu }) => (
    <div className="screen game-over-screen">
        <h2>Game Over!</h2>
        <p>The Wall has fallen. A promise unkept.</p>
        <h1>Final Score: {score}</h1>
        <br />
        <button
            className="restart-button resume-button menu-button"
            onClick={onRestart}
            autoFocus
        >
            Play Again
        </button>
        <br />

        <button
            onClick={handleReturnToMenu}
            className="pause-menu-button menu-button"
        >
            Return to Main Menu
        </button>
    </div>
);

export default GameOver