import useCanvas from '../../hooks/useCanvas';
import GameOver from '../UI/GameOver';
import PassiveSkillCheckboxes from '../UI/PassiveSkillCheckboxes';
import WeaponDisplay from '../UI/WeaponDisplay';
import YouWin from '../UI/YouWin';
import useGameEngine from './GameEngine';
import minutesToMilliseconds from '../../utils/MinutesToMilliseconds';
import { useNavigate } from 'react-router-dom';

const Game = ({ playerData, setPlayerData, setGameActive }) => {
    const navigate = useNavigate();
    const canvasRef = useCanvas();

    const gameDuration = minutesToMilliseconds(2);

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
        playerCurrency,
        inStore,

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
        setIsPaused,
        cleanupGame,

        isMusicPlaying,
        musicVolume,
        toggleMusic,
        setVolume,

        // Refs
        canvasRef: engineCanvasRef,
    } = useGameEngine(canvasRef, gameDuration, playerData, setPlayerData);

    const handleReplayOnPause = () => {
        setIsPaused(false);
        handleRestart()
    }

    const handleReturnToMenu = () => {
        setIsPaused(false);
        setGameActive(false);
        cleanupGame();
        navigate('/');
    };

    return (
        <section className="game-container">
            {win && <YouWin score={score} onRestart={handleRestart} handleReturnToMenu={handleReturnToMenu} />}
            {gameOver && <GameOver score={score} onRestart={handleRestart} handleReturnToMenu={handleReturnToMenu} />}

            {isPaused && (
                <div className="pause-overlay">
                    <h2>Game Paused</h2>
                    <div className="pause-menu-buttons">
                        <button
                            onClick={() => setIsPaused(false)}
                            className="pause-menu-button resume-button menu-button"
                        >
                            Resume Game
                        </button>
                        <button
                            onClick={handleReplayOnPause}
                            className="replay-menu-button menu-button"
                        >
                            Restart Level
                        </button>
                        <button
                            onClick={handleReturnToMenu}
                            className="pause-menu-button menu-button"
                        >
                            Return to Main Menu
                        </button>
                    </div>
                    <p>Press ESC to toggle pause</p>
                </div>
            )}

            <div className="currency-display" style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '10px 15px',
                borderRadius: '30px',
                color: 'white',
                fontSize: '16px',
                zIndex: 100
            }}>
                Currency: {playerData.currency}
            </div>

            <canvas ref={canvasRef} style={{ display: 'block' }} />

            <div className='fortress' />

            <PassiveSkillCheckboxes
                skills={passiveSkills}
                toggleSkill={toggleSkill}
            />

            <div className="music-controls" style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '10px 15px',
                borderRadius: '30px',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 100
            }}>
                <button
                    onClick={toggleMusic}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        ':hover': {
                            background: 'rgba(255, 255, 255, 0.1)'
                        }
                    }}
                >
                    {isMusicPlaying ? '🔊' : '🔇'}
                </button>

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={musicVolume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{
                        width: '100px',
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        outline: 'none',
                        appearance: 'none',
                        '::-webkit-slider-thumb': {
                            appearance: 'none',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#4CAF50',
                            cursor: 'pointer'
                        }
                    }}
                />

                <span style={{
                    color: '#fff',
                    fontSize: '14px',
                    minWidth: '30px',
                    textAlign: 'center'
                }}>
                    {Math.round(musicVolume * 100)}%
                </span>
            </div>

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
        </section>
    );
};

export default Game;