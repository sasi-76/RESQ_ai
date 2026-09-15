import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import MapView from './pages/MapView';
import Hospitals from './pages/Hospitals';
import Teams from './pages/Teams';
import Recommendations from './pages/Recommendations';
import AdminDashboard from './pages/AdminDashboard';
import DemoControls from './pages/DemoControls';
import MissionStatus from './pages/MissionStatus';
import FieldTasks from './pages/FieldTasks';
import IncidentReports from './pages/IncidentReports';
import ResQCopilot from './components/AICopilot/ResQCopilot';
import CriticalDisasterAlert from './components/CriticalDisasterAlert';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/tasks" element={<FieldTasks />} />
            <Route path="/field-tasks" element={<FieldTasks />} />
            <Route path="/missions" element={<MissionStatus />} />
            <Route path="/reports" element={<IncidentReports />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/demo" element={<DemoControls />} />
          </Routes>
          <ResQCopilot />
          <CriticalDisasterAlert />
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
