import React, { useContext, useEffect } from 'react'; // Import useContext, useEffect
import useCanvas from '../../hooks/useCanvas';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import minutesToMilliseconds from '../../utils/MinutesToMilliseconds';
import { useNavigate } from 'react-router-dom';
import InGameStats from '../UI/InGameStats';

const Game = ({ playerData: initialPlayerData, // Rename prop for clarity
    setPlayerData, // For local updates during gameplay
    updateStatsAndRefresh, // Function to save final state to API
    setGameActive,
    // Pass down weapon/skill setters if needed
    setCurrentWeaponAndRefresh,
    setActiveSkillsAndRefreshs
 }) => {
    const navigate = useNavigate();
    const canvasRef = useCanvas();

    const gameDuration = minutesToMilliseconds(7); // Example: 2 minutes

    // --- Pass initialPlayerData and API interaction functions to the hook ---
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
        passiveSkills, // This should reflect playerData.activeSkills initially
        maxDrones,
        currentCurrencyInGame, // Get currency directly managed by engine

        // Methods
        handleRestart, // Restart might need to reset based on initialPlayerData again
        toggleSkill, // This should likely call setActiveSkillsAndRefresh
        updateDroneCount, // Local game mechanic

        // Input handlers
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        handleKeyDown, // Needs modification for weapon/skill switching via API
        handleKeyUp,
        setIsPaused,
        cleanupGame,

        // Music (Keep as is if purely local)
        isMusicPlaying,
        musicVolume,
        toggleMusic,
        setVolume,

        // Refs
        canvasRef: engineCanvasRef, // Ensure correct ref is used if needed
        getFinalGameState, // Add a function in useGameEngine to get savable state
    } = useGameEngine(
        canvasRef,
        gameDuration,
        initialPlayerData, // Pass the initial state from API
        setPlayerData, // Pass the local state setter
        setActiveSkillsAndRefreshs // Pass the API function for skill toggling
        // Pass setCurrentWeaponAndRefresh if needed
    );

    // --- Function to save game state via API ---
    const saveGameProgress = async () => {
        if (!getFinalGameState) {
             console.error("getFinalGameState function not available from useGameEngine");
             return; // Or handle error appropriately
        }
        const finalState = getFinalGameState(); // Get currency, level, kills etc. from engine
        console.log("Saving final game state:", finalState);

        // Prepare data matching the UpdatePlayerStatsRequest DTO
        const statsToSave = {
            currency: finalState.currency,
            level: finalState.level, // Ensure engine tracks level
            kills: finalState.kills,
            currentWeaponName: finalState.currentWeaponName, // Get from engine state
            activeSkillIds: finalState.activeSkillIds // Get from engine state
        };

        try {
             await updateStatsAndRefresh(statsToSave); // Call the function passed from App
             console.log("Game progress saved successfully.");
        } catch (error) {
             console.error("Failed to save game progress:", error);
             // Maybe show an error message to the user before navigating
             alert("Error saving progress. Please check your connection.");
        }
    };

    // --- Handle Game Over / Win ---
    useEffect(() => {
        if (win || gameOver) {
            saveGameProgress(); // Save progress when game ends
            // Navigation happens in the GameOver/YouWin components now
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [win, gameOver]); // Dependency array includes win and gameOver

    // --- Navigation Handlers (pass save function) ---
    const handleReturnToMenu = () => {
        setIsPaused(false); // Unpause if paused
        // Decide if exiting manually should save? Usually not unless it's a "Save & Exit" button
        // await saveGameProgress(); // Optional: Save on manual exit?
        cleanupGame(); // Clean up engine state/intervals
        setGameActive(false);
        navigate('/');
    };

     const handleRestartAndSave = async () => {
        await saveGameProgress(); // Save progress before restarting
        handleRestart(); // Call engine's restart logic
        setIsPaused(false);
     }

     const handleReplayOnPause = () => {
        // Decide whether to save before restarting from pause menu
        // await saveGameProgress(); // Optional
        setIsPaused(false);
        handleRestart(); // Engine's restart
     }


    // --- Render ---
    // Check if initialPlayerData is loaded before rendering game
    if (!initialPlayerData) {
        return <div className="loading-overlay">Loading Player Data...</div>;
    }


    // Render Logic
    return (
        <section className="game-container">
            {/* Use updated handlers for win/loss screens */}
            {win && <YouWin score={score} onRestart={handleRestartAndSave} handleReturnToMenu={handleReturnToMenu} />}
            {gameOver && <GameOver score={score} onRestart={handleRestartAndSave} handleReturnToMenu={handleReturnToMenu} />}

            {isPaused && (
                <div className="pause-overlay">
                    <h2>Game Paused</h2>
                    <div className="pause-menu-buttons">
                        <button onClick={() => setIsPaused(false)} className="pause-menu-button resume-button menu-button">Resume Game</button>
                        
                        <button onClick={handleReplayOnPause} className="replay-menu-button menu-button">Restart Level</button>
                        
                        <button onClick={handleReturnToMenu} className="pause-menu-button menu-button">Return to Main Menu</button>
                    </div>
                    <p>Press ESC to toggle pause</p>
                </div>
            )}

            {/* Currency Display (uses up-to-date context) */}
            <div className="currency-display" style={{ position:"fixed", top:"90px", right: "90px" }}>
                Currency: {currentCurrencyInGame} 
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} style={{ display: 'block' }} />

            {/* Passive Skills Checkboxes (use updated toggle handler) */}
            <PassiveSkillCheckboxes
                skills={passiveSkills}
                toggleSkill={toggleSkill} // Ensure toggleSkill now uses setActiveSkillsAndRefresh
            />

            {/* In-Game Stats Display */}
            <InGameStats
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

             {/* Drone Control */}
             <div className="drone-control">
                <button onClick={() => updateDroneCount(maxDrones - 1)}>-</button>
                <span>Drones: {maxDrones}</span>
                <button onClick={() => updateDroneCount(maxDrones + 1)}>+</button>
            </div>
        </section>
    );
};

export default Game;