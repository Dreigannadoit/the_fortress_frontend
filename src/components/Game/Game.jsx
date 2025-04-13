import { playerSprite } from '../../assets';
import useCanvas from '../../hooks/useCanvas';
import { useImage } from '../../hooks/useImage';
import useGameEngine from './GameEngine';

const Game = () => {
    const canvasRef = useCanvas();
    const playerImageRef = useImage(playerSprite);
    
    const {
        // State
        win,
        gameOver,
        isPaused,
        baseHealth,
        score,
        timeElapsed,
        playerHealth,
        currentWeaponInfo,
        currentAmmo,
        isReloading,
        reloadTime,
        passiveSkills,
        maxDrones,
        
        // Methods
        handleRestart,
        toggleSkill,
        updateDroneCount,
        
        // Input handlers
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        handleKeyDown,
        handleKeyUp,
        
        // Refs
        canvasRef: engineCanvasRef,
        playerImageRef: enginePlayerImageRef
    } = useGameEngine(canvasRef, playerImageRef);

    return (
        <>
            {win && <YouWin score={score} onRestart={handleRestart} />}
            {gameOver && <GameOver score={score} onRestart={handleRestart} />}

            {isPaused && (
                <div className="pause-overlay">
                    <h2>Game Paused</h2>
                    <p>Switch back to window to resume</p>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'block' }} />

            <PassiveSkillCheckboxes
                skills={passiveSkills}
                toggleSkill={toggleSkill}
            />

            <WeaponDisplay
                currentWeapon={currentWeaponInfo}
                currentAmmo={currentAmmo}
                isReloading={isReloading}
                reloadTime={reloadTime}
                playerHealth={playerHealth}
                baseHealth={baseHealth}
                score={score}
                timeElapsed={timeElapsed}
                gameDuration={120000}
            />

            <div className="drone-control">
                <button onClick={() => updateDroneCount(maxDrones - 1)}>-</button>
                <span>Drones: {maxDrones}</span>
                <button onClick={() => updateDroneCount(maxDrones + 1)}>+</button>
            </div>
        </>
    );
};

const PassiveSkillCheckboxes = ({ skills, toggleSkill }) => (
    <div className="passive-skills-ui">
        {Object.entries(skills).map(([skill, isActive]) => (
            <label key={skill}>
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleSkill(skill)}
                />
                {skill.charAt(0).toUpperCase() + skill.slice(1)}
            </label>
        ))}
    </div>
);

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

const WeaponDisplay = ({
    currentWeapon,
    currentAmmo,
    isReloading,
    reloadTime,
    playerHealth,
    baseHealth,
    score,
    timeElapsed,
    gameDuration
}) => {
    const timeLeft = Math.max(0, gameDuration - timeElapsed);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return (
        <div className="weapon_display">
            <div>Score: {score}</div>
            <div>Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}</div>
            <div className="key"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: "10px"
                }}>
                <p className={`${currentWeapon.name === 'pistol' ? "active" : ""}`}>1</p>
                <p className={`${currentWeapon.name === 'shotgun' ? "active" : ""}`}>2</p>
                <p className={`${currentWeapon.name === 'machinegun' ? "active" : ""}`}>3</p>
            </div>
            <h3>Weapon: {currentWeapon.name}</h3>
            <p>Ammo: {currentAmmo} / {currentWeapon.maxAmmo}</p>
            <p>{isReloading ? `Reloading... ${Math.ceil(reloadTime)}mas` : "Ready to fire"}</p>
            <p>Player Health: {playerHealth}</p>
            <p>Base Health: {baseHealth}</p>
        </div>
    );
};

export default Game;