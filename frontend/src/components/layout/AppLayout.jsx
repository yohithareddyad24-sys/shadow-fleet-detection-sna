import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import DisclaimerModal from '../common/DisclaimerModal';
import { pingBackend } from '../../services/api';
import { getFleetMetrics } from '../../services/analytics';
import { getVessels } from '../../services/vessels';

export default function AppLayout() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [stats, setStats] = useState(null);
  const [allVessels, setAllVessels] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    async function initTelemetry() {
      const ping = await pingBackend();
      setBackendOnline(ping.online);

      const [metricsRes, vesselsRes] = await Promise.all([
        getFleetMetrics(),
        getVessels(),
      ]);

      setStats(metricsRes.data);
      setAllVessels(vesselsRes.data);
      setIsDemoMode(metricsRes.isDemo || vesselsRes.isDemo);
    }

    initTelemetry();

    const interval = setInterval(async () => {
      const ping = await pingBackend();
      setBackendOnline(ping.online);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-navy-bg text-text-primary">
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        backendOnline={backendOnline}
        isDemoMode={isDemoMode}
        allVessels={allVessels}
        onOpenDisclaimer={() => setDisclaimerOpen(true)}
      />

      {/* Main Body: Sidebar + Page Outlet */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar alertCount={3} />
        <main className="flex-1 overflow-hidden relative bg-navy-bg">
          <Outlet context={{ backendOnline, stats, allVessels, isDemoMode }} />
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        totalVessels={stats?.total_vessels || allVessels.length || 12}
        isDemo={isDemoMode}
        backendOnline={backendOnline}
      />

      {/* Ethics & Legal Guidelines Modal */}
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}
