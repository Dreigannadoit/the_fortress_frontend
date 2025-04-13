import React from 'react'


const YouWin = ({ score, onRestart }) => (
    <div className="screen win-screen">
        <h2>Victory!</h2>
        <p>Total Score: {score}</p>
        <button
            className="restart-button"
            onClick={onRestart}
            autoFocus
        >
            Play Again
        </button>
    </div>
);


export default YouWin