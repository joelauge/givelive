import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import JourneyBuilder from './pages/JourneyBuilder';
import Layout from './components/Layout';

import Home from './pages/Home';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/event/:eventId" element={<LandingPage />} />
      </Route>
      <Route path="/admin/event/:eventId" element={<JourneyBuilder />} />
    </Routes>
  );
}

export default App;
