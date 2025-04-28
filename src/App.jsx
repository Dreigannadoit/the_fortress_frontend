import './App.css';
import Game from './components/Game/Game';
import StartMenu from './components/Game/StartMenu';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import TransitionWrapper from './components/UI/TransitionWrapper';
import Store from './components/Game/Store';
import { menu } from './assets';

function App() {
  const [playerData, setPlayerData] = useState({
    currency: 0,
    ownedItems: {
      weapons: ['pistol'],
      turrets: [],
      orbs: [],
      skills: []
    },
    currentWeapon: 'pistol',
    activeSkills: []
  });


  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      setPlayerData(JSON.parse(savedData));
    }
  }, []);

  return (
    <Router>
      <AnimatedRoutes playerData={playerData} setPlayerData={setPlayerData} />
    </Router>
  );
}

function AnimatedRoutes({ playerData, setPlayerData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameActive, setGameActive] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const audioRef = useRef(null);

  // Initialize audio (but don't play yet)
  useEffect(() => {
    const audio = new Audio(menu);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    setAudioInitialized(true);

    return () => {
      audio.pause();
    };
  }, []);

  // Play/pause based on route - only after user interaction
  useEffect(() => {
    if (!audioInitialized) return;

    if (location.pathname === '/game') {
      audioRef.current.pause();
    } else if (audioRef.current.paused) {
      // Only try to play if not already playing
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Play was prevented, we'll wait for user interaction
        });
      }
    }
  }, [location.pathname, audioInitialized]);

  // Add click handler to start audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log('Audio play error:', e));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);


  useEffect(() => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }

    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      setPlayerData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('playerData', JSON.stringify(playerData));
  }, [playerData]);

  useEffect(() => {
    if (gameActive && location.pathname === '/store') {
      navigate('/');
    }
  }, [gameActive, location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <TransitionWrapper>
            <StartMenu
              playerData={playerData}
              setPlayerData={setPlayerData}
              setGameActive={setGameActive}
            />
          </TransitionWrapper>
        } />
        <Route path="/game" element={
          <TransitionWrapper>
            <Game
              playerData={playerData}
              setPlayerData={setPlayerData}
              setGameActive={setGameActive}
            />
          </TransitionWrapper>
        } />
        <Route path="/store" element={
          <TransitionWrapper>
            <Store
              playerData={playerData}
              setPlayerData={setPlayerData}
              setGameActive={setGameActive}
            />
          </TransitionWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
