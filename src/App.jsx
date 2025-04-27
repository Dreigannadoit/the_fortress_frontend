import './App.css';
import Game from './components/Game/Game';
import StartMenu from './components/Game/StartMenu';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import TransitionWrapper from './components/UI/TransitionWrapper';
import Store from './components/Game/Store';

function App() {
  // State to manage player data across routes
  const [playerData, setPlayerData] = useState({
    currency: 0,  // Starting currency
    ownedItems: {
      weapons: ['pistol'],  // Starting weapon
      turrets: [],
      orbs: [],
      skills: []
    },
    currentWeapon: 'pistol',
    activeSkills: []
  });


  // Load saved data on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      setPlayerData(JSON.parse(savedData));
    }
  }, []);

  // Save player data whenever it changes
  useEffect(() => {
    localStorage.setItem('playerData', JSON.stringify(playerData));
  }, [playerData]);

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

  useEffect(() => {
    // On first load, if path is not "/", go to "/"
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }

    // Load saved data from localStorage
    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      setPlayerData(JSON.parse(savedData));
    }
  }, []);

  // Save player data whenever it changes
  useEffect(() => {
    localStorage.setItem('playerData', JSON.stringify(playerData));
  }, [playerData]);

  // Prevent store access during gameplay
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