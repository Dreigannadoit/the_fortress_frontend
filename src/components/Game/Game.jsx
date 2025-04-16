import { useEffect, useRef } from 'react';
import { fortress, playerSprite, playerSprite_machine, playerSprite_pistol, playerSprite_shotgun } from '../../assets';
import useCanvas from '../../hooks/useCanvas';
import { useImage } from '../../hooks/useImage';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import WeaponDisplay from '../UI/WeaponDisplay';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import useMinutesToMilliseconds from '../../hooks/useMinutesToMilliseconds';

const Game = () => {
    const canvasRef = useCanvas();
    
    const fortressImageRef = useRef(null);

    useEffect(() => {
        // Directly use the imported fortress image
        if (fortress) {
            const img = new Image();
            img.src = fortress; 
            img.onload = () => {
                console.log("Fortress image loaded successfully");
                fortressImageRef.current = img;
            };
            img.onerror = (e) => {
                console.error("Failed to load fortress image:", e);
            };
        }
    }, [fortress]);

    const playerImageRef = useImage(playerSprite);

    const pistolSpriteRef = useImage(playerSprite_pistol);
    const shotgunSpriteRef = useImage(playerSprite_shotgun);
    const machinegunSpriteRef = useImage(playerSprite_machine);

    const gameDuration = useMinutesToMilliseconds(1.6);

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
    } =  useGameEngine(canvasRef, {
        pistol: pistolSpriteRef,
        shotgun: shotgunSpriteRef,
        machinegun: machinegunSpriteRef
    }, gameDuration, fortressImageRef);

    

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

            {/* <img className='fortress' src={fortress} alt="" /> */}

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