import React from 'react'


const YouWin = ({ score, onRestart, handleReturnToMenu }) => (
    <div className="screen win-screen">
        <h2>Victory!</h2>
        <p>Total Score: {score}</p>
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


export default YouWin