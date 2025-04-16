import './App.css'
import Game from './components/Game/Game';
import StartMenu from './components/Game/StartMenu';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {

  return (
    <Router>
        <Routes>
            <Route path="/" element={<StartMenu />} />
            <Route path="/game" element={<Game />} />
            {/* Add other routes as needed */}
        </Routes>
    </Router>
  )
}


export default App
