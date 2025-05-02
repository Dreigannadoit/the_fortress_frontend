import './App.css';
import Game from './components/Game/Game';
import StartMenu from './components/Game/StartMenu';
import Store from './components/Game/Store';
import AuthPage from './components/Auth/AuthPage'; // Import AuthPage
import TransitionWrapper from './components/UI/TransitionWrapper';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { menu } from './assets';
import { getPlayerData, login, register, updatePlayerStatsApi, purchaseItemApi, setCurrentWeaponApi, setActiveSkillsApi } from './utils/api'; // Import API functions
import LoadingSpinner from './components/UI/LoadingSpinner';

// Helper to map API response to React state structure
const mapApiDataToReactState = (apiData) => {
    if (!apiData) return null;
    return {
        currency: apiData.currency,
        level: apiData.level,
        kills: apiData.kills,
        ownedItems: {
            weapons: apiData.ownedWeaponNames ? [...apiData.ownedWeaponNames] : ['pistol'], // Ensure default pistol if empty initially
            turrets: apiData.ownedItemsByCategory?.turrets ? [...apiData.ownedItemsByCategory.turrets] : [],
            orbs: apiData.ownedItemsByCategory?.orbs ? [...apiData.ownedItemsByCategory.orbs] : [],
            skills: apiData.ownedItemsByCategory?.skills ? [...apiData.ownedItemsByCategory.skills] : [],
            ultimates: apiData.ownedItemsByCategory?.ultimates ? [...apiData.ownedItemsByCategory.ultimates] : [],
            // Add other categories if needed
        },
        currentWeapon: apiData.currentWeaponName || 'pistol', // Default to pistol if not set
        activeSkills: apiData.activeSkillIds ? [...apiData.activeSkillIds] : [],
    };
};


function App() {
    // Root component doesn't use hooks like useNavigate directly
    // Wrap Routes logic in a component that *is* inside Router
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

// This component is inside Router, so it can use hooks
function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggedInUsername, setLoggedInUsername] = useState(null);
    const [playerData, setPlayerData] = useState(null); // Start null
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const navigate = useNavigate();

    // --- Centralized Data Fetching ---
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setApiError(null);
        console.log("Attempting to fetch player data...");
        try {
            const response = await getPlayerData();
            console.log("API Response Data:", response.data);
            const mappedData = mapApiDataToReactState(response.data);
            setPlayerData(mappedData);
            setIsAuthenticated(true); // Successful fetch implies authenticated
            console.log("Mapped Player Data:", mappedData);
        } catch (err) {
            console.error("Failed to fetch player data:", err);
            // Don't set error if it's a 401 handled by interceptor causing redirect
            if (err.response?.status !== 401) {
                setApiError("Failed to load game data. Please try logging in again.");
            }
            // If fetch fails, assume not authenticated (token might be invalid)
            localStorage.removeItem('jwtToken');
            setIsAuthenticated(false);
            setPlayerData(null);
            // navigate('/auth'); // Let interceptor handle redirect or show AuthPage
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [navigate]); // Add navigate to dependencies if used for redirect

    // --- Check token on initial load ---
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const storedUsername = localStorage.getItem('username'); // <-- Get stored username
        if (token && storedUsername) { // <-- Check for both
            console.log("Token and username found, fetching initial data...");
            setLoggedInUsername(storedUsername); // <-- Set username state
            fetchData();
        } else {
            console.log("No token or username found, user needs to log in.");
            localStorage.removeItem('jwtToken'); // Clean up just in case
            localStorage.removeItem('username');
            setIsLoading(false);
            setIsAuthenticated(false);
            setLoggedInUsername(null); // <-- Ensure username is null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Authentication Handlers ---
    const handleLogin = async (username, password) => {
        setIsLoading(true);
        setApiError(null);
        try {
            const response = await login(username, password);
            localStorage.setItem('jwtToken', response.data.token);
            localStorage.setItem('username', response.data.username); // <-- Store username
            setLoggedInUsername(response.data.username); // <-- Set username state
            await fetchData(false);
            // navigate('/'); // Optional: Navigate after successful login + fetch
        } catch (err) {
            console.error("Login failed:", err);
            setApiError(err.response?.data?.message || err.response?.data || "Login failed. Check credentials.");
            localStorage.removeItem('jwtToken'); // Clear on failure
            localStorage.removeItem('username');
            setLoggedInUsername(null); // Clear username state on failure
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (username, password) => {
        setIsLoading(true);
        setApiError(null);
        try {
            await register(username, password);
            // Login automatically sets token and username in localStorage and state
            await handleLogin(username, password);
        } catch (err) {
            console.error("Registration failed:", err);
            setApiError(err.response?.data || "Registration failed. Username might be taken.");
            setIsLoading(false);
        }
        // Loading state handled by handleLogin call
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username'); // <-- Clear username from storage
        setIsAuthenticated(false);
        setPlayerData(null);
        setLoggedInUsername(null); // <-- Clear username state
        navigate('/auth');
    };


    // --- API Update Wrappers (Call API then Refresh Local State) ---
    // Use these functions in child components to ensure data consistency

    const updateStatsAndRefresh = useCallback(async (statsData) => {
        setIsLoading(true); // Indicate background activity
        try {
            await updatePlayerStatsApi(statsData);
            await fetchData(false); // Refresh data without main loading screen
        } catch (err) {
            console.error("Failed to update stats:", err);
            setApiError("Failed to save progress. Please try again.");
            // Potentially revert local state or notify user more explicitly
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    const purchaseItemAndRefresh = useCallback(async (itemId, category) => {
        setIsLoading(true);
        try {
            await purchaseItemApi(itemId, category);
            await fetchData(false); // Refresh data after purchase
        } catch (err) {
            console.error("Purchase failed:", err);
            // Set specific error for purchase failure
            setApiError(err.response?.data || "Purchase failed. Not enough currency or item unavailable?");
            // Throw the error again so the component calling it can catch it (e.g., Store)
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    const setCurrentWeaponAndRefresh = useCallback(async (weaponName) => {
        setIsLoading(true);
        try {
            await setCurrentWeaponApi(weaponName);
            await fetchData(false);
        } catch (err) {
            console.error("Failed to set weapon:", err);
            setApiError(err.response?.data || "Failed to equip weapon.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    const setActiveSkillsAndRefresh = useCallback(async (skillIds) => {
        setIsLoading(true);
        try {
            await setActiveSkillsApi(skillIds);
            await fetchData(false);
        } catch (err) {
            console.error("Failed to set active skills:", err);
            setApiError(err.response?.data || "Failed to set active skills.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);


    // --- Render Logic ---
    if (isLoading && !playerData) { // Show loading only on initial load
        return <LoadingSpinner />; // Or a better spinner
    }

    return (
        <>
            {/* Display persistent errors or loading indicators if needed */}
            {apiError && <div className="api-error-banner">{apiError} <button onClick={() => setApiError(null)}>X</button></div>}
            {isLoading && <div className="loading-indicator">Saving...</div>}

            <AnimatedRoutes
                isAuthenticated={isAuthenticated}
                playerData={playerData}
                username={loggedInUsername}
                setPlayerData={setPlayerData}
                updateStatsAndRefresh={updateStatsAndRefresh}
                purchaseItemAndRefresh={purchaseItemAndRefresh}
                setCurrentWeaponAndRefresh={setCurrentWeaponAndRefresh}
                setActiveSkillsAndRefresh={setActiveSkillsAndRefresh}
                onLogin={handleLogin}
                onRegister={handleRegister}
                handleLogout={handleLogout}
                authError={apiError}
                isAuthLoading={isLoading && !isAuthenticated} 
                isLoading={isLoading} // Add this line to pass the loading state
            />
        </>
    );
}


// --- Animated Routes Component (Handles Routing Logic) ---
function AnimatedRoutes({
    isAuthenticated,
    playerData,
    username, // <-- Accept username prop
    setPlayerData,
    updateStatsAndRefresh,
    purchaseItemAndRefresh,
    setCurrentWeaponAndRefresh,
    setActiveSkillsAndRefresh,
    onLogin,
    onRegister,
    handleLogout,
    authError,
    isAuthLoading,
    isLoading
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [gameActive, setGameActive] = useState(false);
    const audioRef = useRef(null);
    const [audioInitialized, setAudioInitialized] = useState(false);

    useEffect(() => {
        const audio = new Audio(menu);
        audio.loop = true;
        audio.volume = 0.5;
        audioRef.current = audio;
        setAudioInitialized(true);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!audioInitialized || !audioRef.current) return;

        if (location.pathname === '/game') {
            audioRef.current.pause();
        } else if (isAuthenticated && audioRef.current.paused) { // Only play if logged in and paused
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { /* Autoplay prevented */ });
            }
        }
    }, [location.pathname, audioInitialized, isAuthenticated]); // Add isAuthenticated

    useEffect(() => {
        if (!audioInitialized || !audioRef.current) return;

        const handleAudio = async () => {
            try {
                // Pause only if entering game route
                if (location.pathname === '/game') {
                    if (!audioRef.current.paused) {
                        audioRef.current.pause();
                    }
                } 
                // Play in all other authenticated routes
                else if (isAuthenticated && audioRef.current.paused) {
                    await audioRef.current.play();
                }
            } catch (err) {
                console.log('Audio playback error:', err);
            }
        };

        handleAudio();
    }, [location.pathname, audioInitialized, isAuthenticated]);

    // First interaction handler (needed for autoplay policy)
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleFirstInteraction = () => {
            if (audioRef.current && audioRef.current.paused && location.pathname !== '/game') {
                audioRef.current.play().catch(e => console.log('Audio play error:', e));
            }
            document.removeEventListener('click', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        return () => document.removeEventListener('click', handleFirstInteraction);
    }, [isAuthenticated, location.pathname]); 


    // Prevent access to game routes if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated && location.pathname !== '/auth') {
            console.log("Redirecting to auth because not authenticated.");
            navigate('/auth', { replace: true });
        }
    }, [isAuthenticated, location.pathname, navigate, isLoading]); // Add isLoading


    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                {/* Authentication Route */}
                <Route path="/auth" element={
                    isAuthenticated ? <Navigate to="/" replace /> : // If somehow logged in, redirect from auth
                        <TransitionWrapper>
                            <AuthPage onLogin={onLogin} onRegister={onRegister} error={authError} isLoading={isAuthLoading} />
                        </TransitionWrapper>
                } />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <TransitionWrapper>
                                 <StartMenu
                                    playerData={playerData}
                                    username={username}
                                    handleLogout={handleLogout}
                                    setGameActive={setGameActive}
                                    isLoading={isLoading || !playerData}
                                />
                            </TransitionWrapper>
                        ) : (
                            <Navigate to="/auth" replace />
                        )
                    }
                />
                <Route
                    path="/game"
                    element={
                        isAuthenticated ? (
                            <TransitionWrapper>
                                <Game
                                    playerData={playerData}
                                    setPlayerData={setPlayerData} // For local updates
                                    updateStatsAndRefresh={updateStatsAndRefresh} // For saving
                                    setGameActive={setGameActive}
                                    setCurrentWeaponAndRefresh={setCurrentWeaponAndRefresh} // Pass down if game can change weapon
                                    setActiveSkillsAndRefresh={setActiveSkillsAndRefresh} // Pass down if game can change skills
                                />
                            </TransitionWrapper>
                        ) : (
                            <Navigate to="/auth" replace />
                        )
                    }
                />
                <Route
                    path="/store"
                    element={
                        isAuthenticated ? (
                            <TransitionWrapper>
                                <Store
                                    playerData={playerData}
                                    purchaseItemAndRefresh={purchaseItemAndRefresh} // Pass purchase function
                                    setGameActive={setGameActive} // Keep if needed
                                />
                            </TransitionWrapper>
                        ) : (
                            <Navigate to="/auth" replace />
                        )
                    }
                />

                {/* Fallback for unknown routes (optional) */}
                <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />} />

            </Routes>
        </AnimatePresence>
    );
}


export default App;