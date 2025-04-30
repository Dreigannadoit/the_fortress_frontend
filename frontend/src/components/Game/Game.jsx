import React, { useContext, useEffect } from 'react'; // Import useContext, useEffect
import useCanvas from '../../hooks/useCanvas';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import minutesToMilliseconds from '../../utils/MinutesToMilliseconds';
import { useNavigate } from 'react-router-dom';
import InGameStats from '../UI/InGameStats';
import { AppContext } from '../../App'; // Import context
import { updatePlayerDataApi } from '../../utils/api'; // If needed directly

const Game = ({ setGameActive, saveGameProgress }) => { // Receive saveGameProgress
    const navigate = useNavigate();
    const canvasRef = useCanvas();
    const { playerData, setPlayerData } = useContext(AppContext); // Use context

    const gameDuration = minutesToMilliseconds(0.5); // Short duration for testing save

    const gameEngine = useGameEngine(
        canvasRef,
        gameDuration,
        playerData, // Pass current player data
        setPlayerData // Pass setter for immediate updates (like currency gain)
    );

    const {
        // State from gameEngine
        win, gameOver, isPaused, baseHealth, score, timeElapsed, playerHealth,
        currentWeaponInfo, currentAmmo, isReloading, reloadTime, passiveSkills,
        maxDrones, INITIAL_PLAYER_HEALTH, INITIAL_BASE_HEALTH,

        // Methods from gameEngine
        handleRestart, toggleSkill, updateDroneCount, setIsPaused, cleanupGame, handleWeaponSwitch,

        // Input handlers etc. (if needed directly, often not)
    } = gameEngine;


    // --- Save progress on Win or GameOver ---
    useEffect(() => {
        if (win || gameOver) {
            // Prepare the data to be saved
            const finalStats = {
                currency: playerData.currency, // Get the latest currency from context/state
                level: playerData.level, // TODO: Implement level progression logic if needed
                kills: score, // Assuming score directly relates to kills to be saved this way
                currentWeaponName: currentWeaponInfo.name, // Save the equipped weapon
                activeSkillIds: Object.entries(passiveSkills)
                                    .filter(([_, isActive]) => isActive)
                                    .map(([skillId, _]) => skillId), // Save active skills
                // Add other fields your API expects, ensure names match UpdatePlayerStatsRequest DTO
            };
             saveGameProgress(finalStats);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [win, gameOver]); // Trigger only when win/gameOver state changes

    const handleReplayOnPause = () => {
        setIsPaused(false);
        handleRestart();
    };

    const handleReturnToMenu = () => {
        // No need to save here, useEffect above handles win/gameOver save
        setIsPaused(false);
        setGameActive(false);
        cleanupGame();
        navigate('/');
    };

    // --- Handle Persisting Mid-Game Changes (Optional but good UX) ---
    const handleWeaponSwitchAndPersist = async (weaponName) => {
        // 1. Call the original weapon switch logic (updates visuals/ammo locally)
         handleWeaponSwitch(weaponName); // This is from useGameEngine

        // 2. Call the API to persist the change
        try {
            // Assuming you have an API endpoint for this
            // await setCurrentWeaponApi(weaponName); // From api.js
             // If the API returns updated player data, update context:
             // const response = await setCurrentWeaponApi(weaponName);
             // setPlayerData(mapApiResponseToPlayerData(response.data)); // Create mapping function
             console.log(`Persisted current weapon: ${weaponName}`); // Placeholder
        } catch (error) {
            console.error(`Failed to persist weapon switch to ${weaponName}:`, error);
            // Handle error - maybe revert local state or show message
        }
     };

     const handleToggleSkillAndPersist = async (skillId) => {
         // 1. Call the original toggle logic (updates local state in useGameEngine)
         toggleSkill(skillId); // This updates gameEngine's passiveSkills state

         // 2. Determine the *next* state of active skills AFTER the toggle
         const nextPassiveSkillsState = { ...passiveSkills, [skillId]: !passiveSkills[skillId] };
         const nextActiveSkillIds = Object.entries(nextPassiveSkillsState)
                                       .filter(([_, isActive]) => isActive)
                                       .map(([id, _]) => id);

         // 3. Call the API
         try {
             // Assuming you have an API endpoint for this
             // await setActiveSkillsApi(nextActiveSkillIds); // From api.js
             // If API returns updated data, update context:
             // const response = await setActiveSkillsApi(nextActiveSkillIds);
             // setPlayerData(mapApiResponseToPlayerData(response.data)); // Create mapping function
              console.log(`Persisted active skills:`, nextActiveSkillIds); // Placeholder
         } catch (error) {
             console.error(`Failed to persist skill toggle for ${skillId}:`, error);
             // Handle error - maybe revert local toggle or show message
             // Revert local state if API fails:
             // toggleSkill(skillId);
         }
     };


    // Render Logic
    return (
        <section className="game-container">
            {/* Use updated handlers for win/loss screens */}
            {win && <YouWin score={score} onRestart={handleRestart} handleReturnToMenu={handleReturnToMenu} />}
            {gameOver && <GameOver score={score} onRestart={handleRestart} handleReturnToMenu={handleReturnToMenu} />}

            {/* Pause Overlay */}
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
                Currency: {playerData?.currency ?? 0}
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} style={{ display: 'block' }} />

            {/* Passive Skills Checkboxes (use updated toggle handler) */}
             <PassiveSkillCheckboxes
                 skills={passiveSkills}
                 toggleSkill={handleToggleSkillAndPersist} // Use the persisting version
             />

            {/* In-Game Stats Display */}
            <InGameStats
                currentWeapon={currentWeaponInfo}
                currentAmmo={currentAmmo}
                isReloading={isReloading}
                reloadTime={reloadTime}
                playerHealth={playerHealth}
                playerInitialHealth={INITIAL_PLAYER_HEALTH}
                baseHealth={baseHealth}
                baseInitialHealth={INITIAL_BASE_HEALTH}
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

             {/* Add event listeners to GameEngine's handlers.
                 Note: useGameEngine already sets up listeners internally.
                 If you needed to pass the *persisting* handlers to useGameEngine,
                 you would pass handleWeaponSwitchAndPersist and handleToggleSkillAndPersist
                 as props to the hook itself. */}

        </section>
    );
};

export default Game;