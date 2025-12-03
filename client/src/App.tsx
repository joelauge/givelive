import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import JourneyBuilder from './pages/JourneyBuilder';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<AdminDashboard />} /> {/* Redirect root to admin for now, or landing */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/event/:eventId" element={<LandingPage />} />
      </Route>
      <Route path="/admin/event/:eventId" element={<JourneyBuilder />} />
    </Routes>
  );
}

export default App;
