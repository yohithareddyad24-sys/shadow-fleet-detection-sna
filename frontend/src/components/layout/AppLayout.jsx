import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import DisclaimerModal from '../common/DisclaimerModal';
import VesselDossierModal from '../VesselDossierModal';
import { pingBackend } from '../../services/api';
import { getFleetMetrics } from '../../services/analytics';
import { getVessels } from '../../services/vessels';
import { getAlerts } from '../../services/alerts';

export default function AppLayout() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [stats, setStats] = useState(null);
  const [allVessels, setAllVessels] = useState([]);
  const [alertCount, setAlertCount] = useState(4);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global modals & selection states
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedVesselForCase, setSelectedVesselForCase] = useState(null);
  const [acoRoute, setAcoRoute] = useState(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Load backend telemetry & vessels
  const loadTelemetry = useCallback(async () => {
    try {
      const ping = await pingBackend();
      setBackendOnline(ping.online);

      const [metricsRes, vesselsRes, alertsRes] = await Promise.all([
        getFleetMetrics(),
        getVessels(),
        getAlerts(),
      ]);

      setStats(metricsRes.data);
      setAllVessels(vesselsRes.data || []);
      setAlertCount(alertsRes.data?.length || 4);
      setIsDemoMode(metricsRes.isDemo || vesselsRes.isDemo || !ping.online);
    } catch (err) {
      console.warn("Telemetry initialization error:", err);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();

    // Heartbeat health check every 15 seconds
    const interval = setInterval(async () => {
      const ping = await pingBackend();
      setBackendOnline(ping.online);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadTelemetry]);

  // Cross-module action handlers
  const handleLocateOnMap = (vessel) => {
    setSelectedVessel(vessel);
    navigate('/map');
  };

  const handleViewInGraph = (vessel) => {
    setSelectedVessel(vessel);
    navigate('/network');
  };

  const handleRunAcoFromVessel = (vessel) => {
    navigate('/network');
    setSelectedVessel(null);
  };

  const handleAddToCase = (vessel) => {
    setSelectedVesselForCase(vessel);
    navigate('/alerts');
    setSelectedVessel(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-navy-bg text-text-primary nautical-grid-bg">
      {/* 1. Top Navbar with Page Title, Global Search, Status, UTC Time & Profile */}
      <Navbar
        stats={stats}
        backendOnline={backendOnline}
        isDemoMode={isDemoMode}
        allVessels={allVessels}
        onOpenDisclaimer={() => setDisclaimerOpen(true)}
        onSelectVessel={(v) => setSelectedVessel(v)}
        onRefreshData={loadTelemetry}
      />

      {/* 2. Main Body: Collapsible Sidebar + Routed Page Outlet */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar alertCount={alertCount} isDemo={isDemoMode} />

        <main className="flex-1 overflow-hidden relative bg-navy-bg flex flex-col">
          <Outlet 
            context={{ 
              backendOnline, 
              stats, 
              allVessels, 
              isDemoMode,
              selectedVessel,
              onSelectVessel: (v) => setSelectedVessel(v),
              onLocateOnMap: handleLocateOnMap,
              onViewInGraph: handleViewInGraph,
              onRunAcoFromVessel: handleRunAcoFromVessel,
              onAddToCase: handleAddToCase,
              selectedVesselForCase,
              onClearVesselForCase: () => setSelectedVesselForCase(null),
              acoRoute,
              setAcoRoute,
              onClearAcoRoute: () => setAcoRoute(null),
              onRefreshData: loadTelemetry
            }} 
          />
        </main>
      </div>

      {/* 3. Bottom Operational Status Bar */}
      <StatusBar
        totalVessels={stats?.total_vessels || allVessels.length || 12}
        isDemo={isDemoMode}
        backendOnline={backendOnline}
      />

      {/* 4. Deep-Dive Vessel Intelligence Dossier Modal (Accessible from anywhere) */}
      {selectedVessel && (
        <VesselDossierModal
          vessel={selectedVessel}
          onClose={() => setSelectedVessel(null)}
          onLocateOnMap={handleLocateOnMap}
          onViewInGraph={handleViewInGraph}
          onRunAcoFromVessel={handleRunAcoFromVessel}
          onAddToCase={handleAddToCase}
        />
      )}

      {/* 5. Ethics & Legal Guidelines Modal */}
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}
