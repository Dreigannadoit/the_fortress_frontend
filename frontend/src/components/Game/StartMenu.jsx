import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { useNavigate } from 'react-router-dom';
import { backgroundStart, border, foregroundStart } from '../../assets';
import HoverSoundButton from '../UI/HoverSoundButton';
import { AppContext } from '../../App'; // Import context


const StartMenu = ({ setGameActive, handleLogout }) => { 
    const navigate = useNavigate();
    const { playerData, isLoading } = useContext(AppContext); // Get data from context
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleStartGame = () => {
        setGameActive(true);
        navigate('/game');
    };

    const handleOpenStore = () => {
        setGameActive(false);
        navigate('/store');
    };

    const handleOpenCharacter = () => {
        // Implement navigation or modal for character screen
        console.log("Navigate to Character Screen (Not Implemented)");
        // navigate('/character');
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const calculateTransform = (speed) => {
        const x = (mousePosition.x / window.innerWidth) * 2 - 1;
        const y = (mousePosition.y / window.innerHeight) * 2 - 1;
        return `translate(${-x * speed}px, ${-y * speed}px)`;
    };

    if (isLoading || !playerData) {
        // Optionally show a simplified loading state here or rely on App.js's loading
        return <div>Loading Menu...</div>;
    }

    return (
        <div className="start-menu-container">
            <img /* Background Parallax */
                src={backgroundStart} alt="background" className="parallax-background"
                style={{ transform: calculateTransform(5), zIndex: -2 }} />
            <img /* Foreground Parallax */
                src={foregroundStart} alt="foreground" className="parallax-foreground"
                style={{ transform: calculateTransform(30), zIndex: -1 }} />

            <div className="content-wrapper">
                <img src={border} alt="" className="menu-border" /> {/* Added class */}
                <div className="content-container">
                    <div className="top">
                        <div className="left">
                            {/* Logout button */}
                             <HoverSoundButton className="logout-button" onClick={handleLogout}>
                                Logout
                            </HoverSoundButton>
                            <div className="currency-display">
                                {/* Use playerData from context */}
                                Currency: {playerData?.currency ?? 0}
                            </div>
                        </div>
                        <div className="right">
                           {/* Auth form removed, handled by AuthPage */}
                           <div className="welcome-message">
                                Welcome, {playerData?.username || 'Player'}! {/* Display username if available */}
                            </div>
                        </div>
                    </div>
                    <div className="bottom">
                        <div className="left">
                            <h1 className="game-title">Until They Return</h1>
                            <p>Demo 2.7.4 - Pre-release</p>
                        </div>
                        <div className="right">
                            <div className="menu-options">
                                <HoverSoundButton className="start-button" onClick={handleStartGame}>
                                    Start Game
                                </HoverSoundButton>
                                <HoverSoundButton className="store-button" onClick={handleOpenStore}>
                                    Store
                                </HoverSoundButton>
                                <HoverSoundButton className="character-button" onClick={handleOpenCharacter}>
                                    Character
                                </HoverSoundButton>
                                <HoverSoundButton className="credits-button" > {/* Removed onClick={handleStartGame} */}
                                    Credits
                                </HoverSoundButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartMenu;