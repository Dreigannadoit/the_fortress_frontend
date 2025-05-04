import React, { useContext, useEffect, useRef, useState } from 'react'; // Import useContext, useEffect
import useCanvas from '../../hooks/useCanvas';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import minutesToMilliseconds from '../../utils/MinutesToMilliseconds';
import { useNavigate } from 'react-router-dom';
import InGameStats from '../UI/InGameStats';
import DialogueBox from '../UI/DialogueBox';
import WeaponNotOwnedPopup from '../UI/WeaponNotOwnedPopup';

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

    const gameDuration = minutesToMilliseconds(5);

    const [showInstructions, setShowInstructions] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [showObjective, setShowObjective] = useState(false);
    const [objectiveVisible, setObjectiveVisible] = useState(false);

    const [showDialogue, setShowDialogue] = useState(true);
    const [currentDialogueLine, setCurrentDialogueLine] = useState(0);
    const [showVictoryDialogue, setShowVictoryDialogue] = useState(false);
    const [currentVictoryLine, setCurrentVictoryLine] = useState(0);

    const [showNotOwnedPopup, setShowNotOwnedPopup] = useState(false);
    const [notOwnedWeaponName, setNotOwnedWeaponName] = useState('');
    const popupTimeoutRef = useRef(null);


    const dialogueLines = [
        "Rejoice human vermin your salvation has arrived. BOW DOWN TO THE GLORY OF THE DEMON KING!",
        "For HE has RISEN ONCE AGAIN!!",
        "Now you canaille humans, I shall give you two options",
        "Fight and DIE or",
        "Surrender and DIE a less painful death",
        "OOH WAIT, BOTH OPTIONS LEADS TO DEATH. HEHEHE",
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
            setShowInstructions(true); // Show instructions before starting game
        }
    };

    const handleStartGame = () => {
        setShowInstructions(false);
        setGameStarted(true);
        setGameActive(true);
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
        const statsToSave = finalState;

        try {
            await updateStatsAndRefresh(statsToSave); // Call the function passed from App
            console.log("Game progress saved successfully.");
        } catch (error) {
            console.error("Failed to save game progress:", error);
            // Maybe show an error message to the user before navigating
            alert("Error saving progress. Please check your connection.");
        }
    };

    useEffect(() => {
        if (gameStarted && !showDialogue && !showInstructions) {
            setShowObjective(true);
            setObjectiveVisible(true);

            // Hide after 3 seconds
            const timer = setTimeout(() => {
                setObjectiveVisible(false);
            }, 3000);

            // Fully remove after animation completes
            const removeTimer = setTimeout(() => {
                setShowObjective(false);
            }, 3500); // Matches animation duration

            return () => {
                clearTimeout(timer);
                clearTimeout(removeTimer);
            };
        }
    }, [gameStarted, showDialogue, showInstructions]);

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

    useEffect(() => {
        const handleLocalKeyDown = (e) => {
            // Let the engine handle movement, pause, reload etc. first
            const failedWeapon = handleKeyDown(e);

            // Check if the engine reported a failed weapon switch
            if (failedWeapon) {
                console.log(`Attempted to switch to unowned weapon: ${failedWeapon}`);
                setNotOwnedWeaponName(failedWeapon);
                setShowNotOwnedPopup(true);

                // Clear any existing timeout
                if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                }

                // Set a new timeout to hide the popup
                popupTimeoutRef.current = setTimeout(() => {
                    setShowNotOwnedPopup(false);
                    setNotOwnedWeaponName('');
                    popupTimeoutRef.current = null;
                }, 3000); // Hide after 3 seconds
            }
        };

        window.addEventListener('keydown', handleLocalKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleLocalKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
        };
    }, [handleKeyDown, handleKeyUp]);


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

            {showNotOwnedPopup && (
                <div className="popup-container">
                    <WeaponNotOwnedPopup weaponName={notOwnedWeaponName} />
                </div>
            )}

            <div className="game-ui" style={{
                position: 'relative',
                zIndex: 10  // Higher than canvas
            }}>
                {/* Currency, stats, etc. */}
                <div className="currency-display" style={{ position: "fixed", top: "90px", right: "90px" }}>
                    Currency: {currentCurrencyInGame}
                </div>

                {/* Un-comment for skill debugging */}
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

            {showObjective && (
                <div className={`mission-objective pixel-border ${objectiveVisible ? 'animate-in' : 'animate-out'}`}>
                    <h1 className="pixel-font">MISSION OBJECTIVE</h1>
                    <div className="objective-items">
                        <h3 className="pixel-font">» PROTECT THE WALL «</h3>
                        <h3 className="pixel-font">» ELIMINATE ALL THREATS «</h3>
                        <h3 className="pixel-font">» SURVIVE «</h3>
                    </div>
                </div>
            )}
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

            {showInstructions && (
                <div className={`instructions-overlay ${showInstructions ? 'animate-in' : 'animate-out'}`} onClick={handleStartGame}>
                    <div className="instructions-box" onClick={(e) => e.stopPropagation()}>
                        <h2>How to Play</h2>
                        <div className="instructions-content">
                            <div className="instruction-item">
                                <span className="key">W</span>
                                <span className="key">A</span>
                                <span className="key">S</span>
                                <span className="key">D</span>
                                <span className="instruction-text">- Move your character</span>
                            </div>
                            <div className="instruction-item">
                                <span className="mouse-icon">🖱️</span>
                                <span className="instruction-text">- Aim with your mouse</span>
                            </div>
                            <div className="instruction-item">
                                <span className="mouse-button">Left Click</span>
                                <span className="instruction-text">- Shoot</span>
                            </div>
                            <div className="instruction-item">
                                <span className="key">R</span>
                                <span className="instruction-text">- Reload your weapon</span>
                            </div>
                            <div className="instruction-item">
                                <span className="key">1</span>
                                <span className="key">2</span>
                                <span className="key">3</span>
                                <span className="instruction-text">- Switch weapons</span>
                            </div>
                            <div className="instruction-item">
                                <span className="key">ESC</span>
                                <span className="instruction-text">- Pause the game</span>
                            </div>
                        </div>
                        <button className="start-game-button" onClick={handleStartGame}>
                            Start Game
                        </button>
                    </div>
                </div>
            )}
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
                        <button onClick={() => setIsPaused(false)} className="pause-menu-button resume-button menu-button">
                            Resume Game
                        </button>
                        <button onClick={handleReplayOnPause} className="replay-menu-button menu-button">
                            Restart Level
                        </button>
                        <button onClick={handleReturnToMenu} className="pause-menu-button menu-button">
                            Return to Main Menu
                        </button>
                        {/* Add this new button for the manual */}
                        <button
                            onClick={() => setShowManual(true)}
                            className="manual-button menu-button"
                        >
                            View Manual
                        </button>
                    </div>
                    <p>Press ESC to toggle pause</p>

                    {/* Add this manual overlay that appears when showManual is true */}
                    {showManual && (
                        <div className="manual-overlay">
                            <div className="manual-content">
                                <h3>Game Controls</h3>
                                <div className="control-item">
                                    <span className="control-key">WASD</span>
                                    <span className="control-description">Move your character</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">Mouse</span>
                                    <span className="control-description">Aim</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">Left Click</span>
                                    <span className="control-description">Shoot</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">Right Click</span>
                                    <span className="control-description">Alternate Fire (if available)</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">1-3</span>
                                    <span className="control-description">Switch weapons</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">R</span>
                                    <span className="control-description">Reload</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">ESC</span>
                                    <span className="control-description">Pause game</span>
                                </div>

                                <h3>Gameplay Tips</h3>
                                <ul className="tips-list">
                                    <li>Protect the fortress at the bottom of the screen</li>
                                    <li>Enemies will get stronger over time</li>
                                    <li>Collect currency to upgrade between rounds</li>
                                    <li>Different weapons have different strengths</li>
                                </ul>

                                <button
                                    onClick={() => setShowManual(false)}
                                    className="close-manual-button"
                                >
                                    Close Manual
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default Game;