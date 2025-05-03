import React, { useContext, useEffect, useState } from 'react'; // Import useContext, useEffect
import useCanvas from '../../hooks/useCanvas';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import minutesToMilliseconds from '../../utils/MinutesToMilliseconds';
import { useNavigate } from 'react-router-dom';
import InGameStats from '../UI/InGameStats';
import DialogueBox from '../UI/DialogueBox';

const Game = ({
    playerData: initialPlayerData,
    setPlayerData,
    updateStatsAndRefresh,
    setGameActive,
    gameActive,
    setCurrentWeaponAndRefresh,
    setActiveSkillsAndRefreshs
}) => {
    const navigate = useNavigate();
    const canvasRef = useCanvas();

    const gameDuration = minutesToMilliseconds(0.5);

    const [showDialogue, setShowDialogue] = useState(true);
    const [currentDialogueLine, setCurrentDialogueLine] = useState(0);
    const [showVictoryDialogue, setShowVictoryDialogue] = useState(false);
    const [currentVictoryLine, setCurrentVictoryLine] = useState(0);


    const dialogueLines = [
        "Rejoice human vermin your salvation has arrived. BOW DOWN TO THE GLORY OF THE DEMON KING!",
        "For HE has RISEN ONCE AGAIN!!",
        "Now you canaille humans, I shall give you two options",
        "Fight and DIE",
        "Surrender and DIE a less painful death",
        "OOH WAIT, YOU'LL BOTH LEADS TO DEATH. HEHEHE",
        "MINIONS, TEAR DOWN THAT WALL AND KILL ALL THE HUMAN VERMIN WHO RESIDES IN IT."
    ];

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
        cleanupGame,
        gameStarted,

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
        setGameStarted,

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
        initialPlayerData,
        setActiveSkillsAndRefreshs /// Pass the API function for skill toggling
        // Pass setCurrentWeaponAndRefresh if needed
    );

    const victoryLines = [
        "I... I... IMPoOOSsSIBLE!!",
        "YOu'RNT eVEn a CHooSeN HeeEROoo!!",
        "nO... yOU THiNk... THiS. IS. oOOVeRRRR?!?",
        "yOUr FrrRivvOLOuS hErOeS—StILL GAWN!!",
        "AnD—UNtiL ThEy ReTURNNnN—I WiLL KeeEEeep AAaTTaCKinGGG... 'TiiL eVerY LaaST wReTCH in tHaT ViiLLaaGE is BuUuRNT... AnD SSSSlaUGHTeR'd!!"
    ];


    const handleNextDialogue = () => {
        if (currentDialogueLine < dialogueLines.length - 1) {
            setCurrentDialogueLine(currentDialogueLine + 1);
        } else {
            setShowDialogue(false);
            setGameStarted(true); // This starts the actual gameplay
            setGameActive(true); // This enables the game systems
        }
    };

    const handleSkipDialogue = () => {
        setShowDialogue(false);
        setGameStarted(true); // Start gameplay
        setGameActive(true); // Enable game systems
    };

    const handleNextVictoryLine = () => {
        if (currentVictoryLine < victoryLines.length - 1) {
            setCurrentVictoryLine(currentVictoryLine + 1);
        } else {
            setShowVictoryDialogue(false);
            saveGameProgress(); // Save after all dialogue is shown
        }
    };

    const handleSkipVictoryDialogue = () => {
        setShowVictoryDialogue(false);
        saveGameProgress();
    };

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
        if (gameOver) {
            saveGameProgress();
        }
        if (win) {
            setShowVictoryDialogue(true); // Show victory dialogue first
            setGameActive(false); // Pause the game
        }
    }, [win, gameOver]);

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
        <section className={`game-container ${!showDialogue ? 'show-gameplay' : ''}`}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                }}
            />

            <div className="game-ui" style={{
                position: 'relative',
                zIndex: 10  // Higher than canvas
            }}>
                {/* Currency, stats, etc. */}
                <div className="currency-display" style={{ position: "fixed", top: "90px", right: "90px" }}>
                    Currency: {currentCurrencyInGame}
                </div>

                {/* Un log for skill debugging */}
                {/* <PassiveSkillCheckboxes
                    skills={passiveSkills}
                    toggleSkill={toggleSkill}
                /> */}

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
            </div>


            {/* Use updated handlers for win/loss screens */}
            {showDialogue && (
                <div style={{ /* existing styles */ }}>
                    <DialogueBox
                        text={dialogueLines[currentDialogueLine]}
                        onNext={handleNextDialogue}
                        onSkip={handleSkipDialogue}
                    />
                </div>
            )}

            {/* Victory dialogue */}
            {showVictoryDialogue && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 100,
                    pointerEvents: 'auto'
                }}>
                    <DialogueBox
                        text={victoryLines[currentVictoryLine]}
                        onNext={handleNextVictoryLine}
                        onSkip={handleSkipVictoryDialogue}
                    />
                </div>
            )}


            {win && !showVictoryDialogue && (
                <YouWin
                    score={score}
                    onRestart={handleRestartAndSave}
                    handleReturnToMenu={handleReturnToMenu}
                />
            )}

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
        </section>
    );
};

export default Game;