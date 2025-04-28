import React from 'react'


const YouWin = ({ score, onRestart, handleReturnToMenu }) => (
    <div className="screen win-screen">
        <h2>Victory!</h2>
        <h1>Total Score: {score}</h1>
        <br />
        <button
            className="restart-button menu-button"
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


export default YouWin