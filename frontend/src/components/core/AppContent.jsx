import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Game from '../Game/Game';
import StartMenu from '../Game/StartMenu';
import Store from '../Game/Store';
import AuthPage from '../Auth/AuthPage';
import TransitionWrapper from '../UI/TransitionWrapper';
import { menu } from '../../assets';
import { getPlayerData, login, register, updatePlayerStatsApi, purchaseItemApi, setCurrentWeaponApi, setActiveSkillsApi } from '../../utils/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import mapApiDataToReactState from '../../utils/mapApiDataToReactState';
import AnimatedRoutes from './AnimatedRoutes';

function AppContent({ isPopup = false }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggedInUsername, setLoggedInUsername] = useState(null);
    const [playerData, setPlayerData] = useState(null); // Start null
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const navigate = useNavigate();
    const popupWindowRef = useRef(null);

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

    // const openFullscreenWindow = useCallback(() => {
    //     // Don't open if we're already in the popup
    //     if (isPopup) return;

    //     // If window already exists, just focus it
    //     if (popupWindowRef.current && !popupWindowRef.current.closed) {
    //         popupWindowRef.current.focus();
    //         return;
    //     }

    //     const width = window.screen.width;
    //     const height = window.screen.height;

    //     const features = `
    //         width=${width},
    //         height=${height},
    //         left=0,
    //         top=0,
    //         fullscreen=yes,
    //         scrollbars=no,
    //         toolbar=no,
    //         menubar=no,
    //         location=no,
    //         status=no,
    //         resizable=no
    //     `;

    //     popupWindowRef.current = window.open(
    //         '/popup',
    //         'GameWindow',
    //         features
    //     );

    //     if (popupWindowRef.current) {
    //         popupWindowRef.current.focus();

    //         // Handle cases where popup might be blocked
    //         popupWindowRef.current.onload = () => {
    //             if (popupWindowRef.current.closed) {
    //                 alert('Popup was blocked. Please allow popups for this site.');
    //             }
    //         };
    //     }
    // }, [isPopup]);

    // const closeFullscreenWindow = useCallback(() => {
    //     if (popupWindowRef.current && !popupWindowRef.current.closed) {
    //         popupWindowRef.current.close();
    //     }
    // }, []);

    // // Open popup window when authenticated
    // useEffect(() => {
    //     if (isAuthenticated && !isPopup) {
    //         openFullscreenWindow();

    //         return () => {
    //             closeFullscreenWindow();
    //         };
    //     }
    // }, [isAuthenticated, isPopup, openFullscreenWindow, closeFullscreenWindow]);


    // --- Check token on initial load ---
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const storedUsername = localStorage.getItem('username');
        if (token && storedUsername) {
            console.log("Token and username found, fetching initial data...");
            setLoggedInUsername(storedUsername);
            fetchData().then(() => {
                // After fetching data, redirect to prologue if not already there
                if (!['/prologue', '/game', '/store'].includes(window.location.pathname)) {
                    navigate('/prologue', { replace: true });
                }
            });
        } else {
            console.log("No token or username found, user needs to log in.");
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('username');
            setIsLoading(false);
            setIsAuthenticated(false);
            setLoggedInUsername(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Check for full screen exit

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
            // openFullscreenWindow();
            setTimeout(() => navigate('/prologue'), 0);
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
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setPlayerData(null);
        setLoggedInUsername(null);
        // closeFullscreenWindow();
        navigate('/auth');
    };

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
        // Ensure we have current player data to work with for skills
        if (!playerData && category === 'skills') {
            console.error("Cannot activate skill: Player data not loaded.");
            setApiError("Cannot activate skill: Player data not loaded.");
            throw new Error("Player data not available"); // Prevent purchase if data is missing
        }

        setIsLoading(true); // Indicate activity
        setApiError(null);  // Clear previous errors
        let purchaseSuccessful = false;

        try {
            // Attempt the purchase
            console.log(`Attempting purchase: ID=${itemId}, Category=${category}`);
            await purchaseItemApi(itemId, category);
            console.log(`Item ${itemId} purchased successfully.`);
            purchaseSuccessful = true; // Mark purchase as successful

            // If it was a skill, attempt to activate it immediately
            if (category === 'skills') {
                console.log(`Item is a skill. Attempting to activate: ${itemId}`);
                const currentActiveSkills = playerData?.activeSkills || [];
                // Use a Set to automatically handle duplicates if the skill was already active (shouldn't happen ideally)
                const nextActiveSkillsSet = new Set([...currentActiveSkills, itemId]);
                const nextActiveSkillsArray = Array.from(nextActiveSkillsSet);

                console.log('Setting active skills via API:', nextActiveSkillsArray);
                await setActiveSkillsApi(nextActiveSkillsArray); // Call API to update active skills
                console.log(`Skill ${itemId} activated successfully via API.`);
            }

            // Fetch the latest player data reflecting purchase (and activation if applicable)
            await fetchData(false); // Refresh data without main loading screen

        } catch (err) {
            console.error("Purchase or activation failed:", err);
            const errorMessage = err.response?.data || `Failed to process purchase/activation for ${itemId}.`;
            setApiError(errorMessage);
            // Re-throw the error so the calling component (Store) can be aware of the failure
            throw new Error(errorMessage); // Throw a generic error or the specific message
        } finally {
            setIsLoading(false); // Stop loading indicator
        }
    }, [fetchData, playerData, setActiveSkillsApi]);

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

    // This is for indirect activation/deactivation (e.g., from checkboxes)
    // const setActiveSkillsAndRefresh = useCallback(async (skillIds) => {
    //     setIsLoading(true);
    //     try {
    //         await setActiveSkillsApi(skillIds);
    //         await fetchData(false);
    //     } catch (err) {
    //         console.error("Failed to set active skills:", err);
    //         setApiError(err.response?.data || "Failed to set active skills.");
    //         throw err;
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, [fetchData]);

    // This is for direct activation/deactivation (e.g., from checkboxes)
    const setActiveSkillsAndRefreshDirect = useCallback(async (skillIds) => {
        setIsLoading(true);
        setApiError(null);
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
    if (isLoading && !playerData) {
        return <LoadingSpinner />;
    }

    return (
        <>
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
                setActiveSkillsAndRefresh={setActiveSkillsAndRefreshDirect}
                onLogin={handleLogin}
                onRegister={handleRegister}
                handleLogout={handleLogout}
                authError={apiError}
                isAuthLoading={isLoading && !isAuthenticated}
                isLoading={isLoading}
            />
        </>
    );
}



export default AppContent