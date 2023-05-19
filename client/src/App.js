import './App.css';
import { Routes, Route } from 'react-router-dom';
import LobbyScreen from './components/Lobby';
import RoomPage from './components/Room';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
}

export default App;
