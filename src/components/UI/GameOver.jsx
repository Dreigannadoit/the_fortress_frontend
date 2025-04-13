import React from 'react'

const GameOver = ({ score, onRestart }) => (
    <div className="screen game-over-screen">
        <h2>Game Over!</h2>
        <p>Final Score: {score}</p>
        <button
            className="restart-button"
            onClick={onRestart}
            autoFocus
        >
            Play Again
        </button>
    </div>
);

export default GameOver