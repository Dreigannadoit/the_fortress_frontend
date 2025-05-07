import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from '../Auth/AuthPage';
import StartMenu from '../Game/StartMenu';
import TransitionWrapper from '../UI/TransitionWrapper';
import Game from '../Game/Game';
import Store from '../Game/Store';
import { menu } from '../../assets';
import Title from '../Game/Title';

function AnimatedRoutes({
    isAuthenticated,
    playerData,
    username,
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
        } else if (isAuthenticated && audioRef.current.paused) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { /* Autoplay prevented */ });
            }
        }
    }, [location.pathname, audioInitialized, isAuthenticated]);

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
                    path="/prologue"
                    element={
                        isAuthenticated ? (
                            <TransitionWrapper>
                                <Title />
                            </TransitionWrapper>
                        ) : (
                            <Navigate to="/auth" replace />
                        )
                    }
                />

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
                                    setPlayerData={setPlayerData}
                                    updateStatsAndRefresh={updateStatsAndRefresh}
                                    setGameActive={setGameActive}
                                    gameActive={gameActive}
                                    setCurrentWeaponAndRefresh={setCurrentWeaponAndRefresh}
                                    setActiveSkillsAndRefreshs={setActiveSkillsAndRefresh}
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
                                    purchaseItemAndRefresh={purchaseItemAndRefresh}
                                    setGameActive={setGameActive} // Keep if needed
                                />
                            </TransitionWrapper>
                        ) : (
                            <Navigate to="/auth" replace />
                        )
                    }
                />

                {/* Fallback for unknown routes (optional) */}
                <Route path="*" element={isAuthenticated ? <Navigate to="/prologue" replace /> : <Navigate to="/auth" replace />} />

            </Routes>
        </AnimatePresence>
    );
}

export default AnimatedRoutes;