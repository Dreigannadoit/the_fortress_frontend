import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { useNavigate } from 'react-router-dom';
import { backgroundStart, border, foregroundStart } from '../../assets';
import HoverSoundButton from '../UI/HoverSoundButton';
import { deleteAccountApi } from '../../utils/api';


const StartMenu = ({ playerData, username, handleLogout, setGameActive, isLoading }) => { 
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isDeleting, setIsDeleting] = useState(false); 
    const [deleteError, setDeleteError] = useState(null);
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

    const handleDeleteAccount = async () => {
        // **Crucial Confirmation Step**
        const confirmation = window.confirm(
            "Are you absolutely sure you want to delete your account?\n" +
            "This action is irreversible and all your progress, currency, and items will be lost forever."
        );

        if (confirmation) {
            setIsDeleting(true);
            setDeleteError(null);
            console.log("Attempting to delete account...");
            try {
                await deleteAccountApi();
                console.log("Account deleted successfully via API.");
                // IMPORTANT: Call handleLogout provided by App.js to clear state and redirect
                handleLogout();
                // No need to navigate here, handleLogout should do it.
            } catch (err) {
                console.error("Failed to delete account:", err);
                setDeleteError(err.response?.data || "Failed to delete account. Please try again.");
                setIsDeleting(false); // Stop loading indicator on error
            }
            // No finally needed as handleLogout navigates away on success
        } else {
            console.log("Account deletion cancelled.");
        }
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
                           <div className="welcome-message">
                                Welcome, {username || 'Player'}!!
                            </div>
                            <div className="currency-display">
                                Money: {playerData?.currency ?? 0}
                            </div>
                        </div>
                        <div className="right">
                             <HoverSoundButton className="logout-button" onClick={handleLogout}>
                                Logout
                            </HoverSoundButton>
                            <HoverSoundButton
                                className="delete-account-button" // Add specific styling if needed
                                onClick={handleDeleteAccount}
                                disabled={isDeleting} // Disable while deleting
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </HoverSoundButton>
                            {deleteError && <span className="delete-error">{deleteError}</span>}
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