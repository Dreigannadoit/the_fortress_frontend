import { playerSprite } from '../../assets';
import useCanvas from '../../hooks/useCanvas';
import { useImage } from '../../hooks/useImage';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import WeaponDisplay from '../UI/WeaponDisplay';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';

const Game = () => {
    const canvasRef = useCanvas();
    const playerImageRef = useImage(playerSprite);
    
    const gameDuration = 100000;

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
    } = useGameEngine(canvasRef, playerImageRef, gameDuration);

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
                gameDuration={gameDuration}
            />

            <div className="drone-control">
                <button onClick={() => updateDroneCount(maxDrones - 1)}>-</button>
                <span>Drones: {maxDrones}</span>
                <button onClick={() => updateDroneCount(maxDrones + 1)}>+</button>
            </div>
        </>
    );
};

export default Game;