import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import JourneyBuilder from './pages/JourneyBuilder';

function App() {
  return (
    <Routes>
      <Route path="/event/:eventId" element={<LandingPage />} />
      <Route path="/admin/event/:eventId" element={<JourneyBuilder />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
