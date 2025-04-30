import './App.css';
import Game from './components/Game/Game';
import StartMenu from './components/Game/StartMenu';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState, useRef, useCallback } from 'react'; // Added React import
import TransitionWrapper from './components/UI/TransitionWrapper';
import Store from './components/Game/Store';
import AuthPage from './components/Auth/AuthPage'
import LoadingSpinner from './components/UI/LoadingSpinner';
import { getPlayerData, login, register, updatePlayerDataApi } from './utils/api';
import { menu } from './assets';
// Context for easier state management (Optional but recommended)
export const AppContext = React.createContext(null);

function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [playerData, setPlayerData] = useState(null); // Start as null
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // For save operations
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Get location here

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoading = true) => {
        // console.log("Attempting to fetch player data...");
        if (showLoading) setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            // console.log("No token found, setting not authenticated.");
            setIsAuthenticated(false);
            setPlayerData(null);
            setIsLoading(false);
            if (location.pathname !== '/auth') { // Redirect if not on auth page
                // console.log("Redirecting to /auth");
                navigate('/auth', { replace: true });
            }
            return null; // Indicate data wasn't fetched
        }

        try {
            const response = await getPlayerData();
            // console.log("API Response:", response.data);

            // --- Map API response to your React state structure ---
            const mappedData = {
                currency: response.data.currency,
                level: response.data.level,
                kills: response.data.kills,
                // Ensure ownedItems always has the basic structure
                ownedItems: {
                    weapons: response.data.ownedWeaponNames ? [...response.data.ownedWeaponNames] : ['pistol'], // Ensure pistol is default if empty
                    turrets: response.data.ownedItemsByCategory?.turrets ? [...response.data.ownedItemsByCategory.turrets] : [],
                    orbs: response.data.ownedItemsByCategory?.orbs ? [...response.data.ownedItemsByCategory.orbs] : [],
                    skills: response.data.ownedItemsByCategory?.skills ? [...response.data.ownedItemsByCategory.skills] : [],
                    ultimates: response.data.ownedItemsByCategory?.ultimates ? [...response.data.ownedItemsByCategory.ultimates] : [],
                },
                currentWeapon: response.data.currentWeaponName || 'pistol', // Default if null
                activeSkills: response.data.activeSkillIds ? [...response.data.activeSkillIds] : [],
            };
            // console.log("Mapped Player Data:", mappedData);
            setPlayerData(mappedData);
            setIsAuthenticated(true);
            return mappedData; // Return fetched data
        } catch (err) {
            console.error("Failed to fetch player data:", err);
            setError(err.response?.data?.message || "Failed to load game data. Session might be invalid.");
            localStorage.removeItem('jwtToken'); // Clear invalid token
            setIsAuthenticated(false);
            setPlayerData(null);
            if (location.pathname !== '/auth') { // Redirect if not on auth page
                // console.log("Redirecting to /auth due to fetch error");
                navigate('/auth', { replace: true });
            }
            return null; // Indicate data wasn't fetched
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [navigate, location.pathname]); // Add navigate and location.pathname dependency

    // --- Check token on initial load ---
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // --- Authentication Handlers ---
    const handleLogin = useCallback(async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await login(username, password);
            if (response.data?.token) {
                localStorage.setItem('jwtToken', response.data.token);
                const data = await fetchData(false); // Skip loading state
                if (data) {
                    navigate('/', { replace: true });
                }
            } else {
                throw new Error("No token received");
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.message || 
                    err.response?.data || 
                    err.message || 
                    "Login failed. Check username/password.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchData, navigate]);

    const handleRegister = useCallback(async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            await register(username, password);
            // Auto-login after successful registration
            await handleLogin(username, password);
        } catch (err) {
            console.error("Registration failed:", err);
            const errorMsg = err.response?.data || "Registration failed.";
            setError(errorMsg);
            setIsLoading(false); // Ensure loading stops on error
        }
        // No finally setIsLoading(false) here, because login handles it
    }, [handleLogin]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        setIsAuthenticated(false);
        setPlayerData(null);
        navigate('/auth'); // Redirect to login page
    }, [navigate]);

    // --- Data Saving ---
    // Function to be called by Game component when game ends
    const saveGameProgress = useCallback(async (finalStats) => {
        if (!isAuthenticated) return; // Don't save if not logged in
        console.log("Attempting to save game progress:", finalStats);
        setIsSaving(true);
        setError(null);
        try {
            const response = await updatePlayerDataApi(finalStats);
            // Update local state immediately with the response from the save
            const mappedData = { /* ... map response.data like in fetchData ... */
                currency: response.data.currency,
                level: response.data.level,
                kills: response.data.kills,
                ownedItems: {
                    weapons: response.data.ownedWeaponNames ? [...response.data.ownedWeaponNames] : ['pistol'],
                    turrets: response.data.ownedItemsByCategory?.turrets ? [...response.data.ownedItemsByCategory.turrets] : [],
                    orbs: response.data.ownedItemsByCategory?.orbs ? [...response.data.ownedItemsByCategory.orbs] : [],
                    skills: response.data.ownedItemsByCategory?.skills ? [...response.data.ownedItemsByCategory.skills] : [],
                    ultimates: response.data.ownedItemsByCategory?.ultimates ? [...response.data.ownedItemsByCategory.ultimates] : [],
                },
                currentWeapon: response.data.currentWeaponName || 'pistol',
                activeSkills: response.data.activeSkillIds ? [...response.data.activeSkillIds] : [],
            };
            setPlayerData(mappedData);
            console.log("Progress saved successfully.");
        } catch (err) {
            console.error("Failed to save game progress:", err);
            setError(err.response?.data?.message || "Failed to save progress. Check connection.");
            // Optionally try fetching data again to ensure consistency
            // await fetchData(false);
        } finally {
            setIsSaving(false);
        }
    }, [isAuthenticated]); // Removed fetchData dependency

    // --- Context Value ---
    const contextValue = {
        isAuthenticated,
        playerData,
        isLoading: isLoading || isSaving, // Combine loading states
        error,
        fetchData, // Provide function to refresh data
        handleLogout,
        saveGameProgress, // Provide function to save data
        setPlayerData // Allow direct updates for things like in-game currency gain *before* saving
    };

    // --- Render Logic ---
    // Use isLoading state BEFORE checking authentication
    if (isLoading && !error) {
        return <LoadingSpinner />; // Show loading indicator
    }

    // Handle critical errors after loading attempt
    if (error && !isAuthenticated && location.pathname !== '/auth') {
        // If there was an error fetching initial data and we aren't on auth page, force auth page
        return (
            <Routes>
                <Route path="*" element={<AuthPage onLogin={handleLogin} onRegister={handleRegister} error={error} isLoading={isLoading} />} />
            </Routes>
        );
    }


    return (
        <AppContext.Provider value={contextValue}>
            {/* Conditional rendering based on authentication */}
            {isAuthenticated && playerData ? (
                <AnimatedRoutes /> // Routes now implicitly use context or get props
            ) : (
                // Show AuthPage if not authenticated, using Routes to handle the path
                <Routes>
                    <Route path="/auth" element={<AuthPage onLogin={handleLogin} onRegister={handleRegister} error={error} isLoading={isLoading} />} />
                    {/* Redirect any other path to /auth if not authenticated */}
                    <Route path="*" element={<AuthRedirect />} />
                </Routes>
            )}
        </AppContext.Provider>
    );
}

// Helper component to redirect if not authenticated
function AuthRedirect() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/auth', { replace: true });
    }, [navigate]);
    return null; // Render nothing while redirecting
}


// Modify AnimatedRoutes to use Context or receive props from App
function AnimatedRoutes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playerData, setPlayerData, fetchData, handleLogout, saveGameProgress } = React.useContext(AppContext); // Use context
    const [gameActive, setGameActive] = useState(false);


    const [audioInitialized, setAudioInitialized] = useState(false);
    const audioRef = useRef(null);
    useEffect(() => {
        const audio = new Audio(menu);
        audio.loop = true;
        audio.volume = 0.5;
        audioRef.current = audio;
        setAudioInitialized(true);
        return () => { audio.pause(); };
    }, []);

    useEffect(() => {
        if (!audioInitialized) return;
        const shouldPlay = !['/game'].includes(location.pathname); // Only play outside game route

        const playAudio = async () => {
            if (audioRef.current && audioRef.current.paused) {
                try {
                    await audioRef.current.play();
                } catch (e) {
                    // console.log('Audio play prevented by browser. Waiting for interaction.');
                }
            }
        };

        const pauseAudio = () => {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        };

        if (shouldPlay) {
            playAudio();
        } else {
            pauseAudio();
        }
    }, [location.pathname, audioInitialized]);

    useEffect(() => {
        const handleFirstInteraction = async () => {
            if (audioRef.current && audioRef.current.paused && !['/game'].includes(location.pathname)) {
                try {
                    await audioRef.current.play();
                    console.log('Audio playing after interaction.');
                } catch (e) {
                    console.log('Audio play error after interaction:', e);
                }
            }
            document.removeEventListener('click', handleFirstInteraction);
        };
        document.addEventListener('click', handleFirstInteraction);
        return () => {
            document.removeEventListener('click', handleFirstInteraction);
        };
    }, [location.pathname]); 

    // Navigate away from store if game becomes active
    useEffect(() => {
        if (gameActive && location.pathname === '/store') {
            navigate('/');
        }
    }, [gameActive, location.pathname, navigate]);

    if (!playerData) {
        return <LoadingSpinner />; 
    }

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <TransitionWrapper>
                        <StartMenu setGameActive={setGameActive} handleLogout={handleLogout} />
                    </TransitionWrapper>
                } />
                <Route path="/game" element={
                    <TransitionWrapper>
                        <Game setGameActive={setGameActive} saveGameProgress={saveGameProgress} />
                    </TransitionWrapper>
                } />
                <Route path="/store" element={
                    <TransitionWrapper>
                        <Store setGameActive={setGameActive} fetchData={fetchData} />
                    </TransitionWrapper>
                } />
                {/* <Route path="/character" element={<TransitionWrapper><Character /></TransitionWrapper>} /> */}
                {/* Optional: Add a fallback route for unknown paths */}
                {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
        </AnimatePresence>
    );
}

export default AppWrapper;

