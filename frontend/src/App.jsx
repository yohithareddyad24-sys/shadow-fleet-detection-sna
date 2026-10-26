import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import DisclaimerBanner from './components/DisclaimerBanner';
import VesselDossierModal from './components/VesselDossierModal';

import GeospatialView from './views/GeospatialView';
import FleetTableView from './views/FleetTableView';
import NetworkView from './views/NetworkView';
import AcoWorkbench from './views/AcoWorkbench';
import AnalyticsView from './views/AnalyticsView';
import InvestigationsView from './views/InvestigationsView';

import { fetchVessels, checkBackendHealth, fetchMetricsSummary } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [vessels, setVessels] = useState([]);
  const [stats, setStats] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal & Selection States
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [preselectedOrigin, setPreselectedOrigin] = useState(null);
  const [selectedVesselForCase, setSelectedVesselForCase] = useState(null);
  const [acoRoute, setAcoRoute] = useState(null);

  // Search & Banner
  const [searchTerm, setSearchTerm] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Initial Data Ingestion & Health Polling
  useEffect(() => {
    async function loadData() {
      const health = await checkBackendHealth();
      setBackendOnline(health.online);

      const [vesselsList, summary] = await Promise.all([
        fetchVessels(),
        fetchMetricsSummary(),
      ]);

      setVessels(vesselsList);
      setStats(summary);
      setLoading(false);
    }

    loadData();

    // Periodic Health Check
    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setBackendOnline(health.online);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handlers for cross-component workflows
  const handleLocateOnMap = (vessel) => {
    setSelectedVessel(vessel);
    setActiveTab('map');
  };

  const handleViewInGraph = (vessel) => {
    setSelectedVessel(vessel);
    setActiveTab('network');
  };

  const handleRunAcoFromVessel = (vessel) => {
    setPreselectedOrigin(vessel);
    setActiveTab('aco');
    setSelectedVessel(null);
  };

  const handleProjectToMap = (result) => {
    setAcoRoute(result);
    setActiveTab('map');
  };

  const handleAddToCase = (vessel) => {
    setSelectedVesselForCase(vessel);
    setActiveTab('cases');
    setSelectedVessel(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden nautical-grid-bg text-text-primary">
      
      {/* 1. Global Tactical Header */}
      <Header
        stats={stats}
        backendOnline={backendOnline}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectVessel={setSelectedVessel}
        allVessels={vessels}
        onOpenDisclaimer={() => setShowDisclaimer(true)}
        isLoading={loading}
      />

      {/* 2. Mandatory Ethics & Evidentiary Standard Notice */}
      <DisclaimerBanner
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />

      {/* 3. Tactical Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        caseCount={2}
      />

      {/* 4. Active Surveillance Views with Smooth Page Transition */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="w-full h-full p-6 flex flex-col justify-center max-w-4xl mx-auto space-y-4 font-mono text-text-secondary">
            <div className="flex items-center space-x-3 text-accent-cyan">
              <span className="w-3 h-3 rounded-full bg-accent-cyan animate-ping" />
              <span className="text-xs uppercase tracking-widest font-bold">
                Synchronizing Maritime Signals & Graph Centralities...
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="h-24 skeleton-shimmer" />
              <div className="h-24 skeleton-shimmer" />
              <div className="h-24 skeleton-shimmer" />
              <div className="h-24 skeleton-shimmer" />
            </div>
            <div className="h-64 skeleton-shimmer" />
          </div>
        ) : (
          <div key={activeTab} className="w-full h-full page-transition-enter">
            {activeTab === 'map' && (
              <GeospatialView
                vessels={vessels}
                onSelectVessel={setSelectedVessel}
                selectedVessel={selectedVessel}
                acoRoute={acoRoute}
                onClearAcoRoute={() => setAcoRoute(null)}
              />
            )}

            {activeTab === 'table' && (
              <FleetTableView
                vessels={vessels}
                onSelectVessel={setSelectedVessel}
                onLocateOnMap={handleLocateOnMap}
                onViewInGraph={handleViewInGraph}
                onRunAcoFromVessel={handleRunAcoFromVessel}
              />
            )}

            {activeTab === 'network' && (
              <NetworkView
                onSelectVessel={setSelectedVessel}
                selectedVessel={selectedVessel}
                allVessels={vessels}
              />
            )}

            {activeTab === 'aco' && (
              <AcoWorkbench
                vessels={vessels}
                onProjectToMap={handleProjectToMap}
                onSelectVessel={setSelectedVessel}
                preselectedOrigin={preselectedOrigin}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                onSelectVessel={setSelectedVessel}
              />
            )}

            {activeTab === 'cases' && (
              <InvestigationsView
                vessels={vessels}
                onSelectVessel={setSelectedVessel}
                selectedVesselForCase={selectedVesselForCase}
                onClearVesselForCase={() => setSelectedVesselForCase(null)}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. Deep-Dive Vessel Intelligence Dossier Modal */}
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

    </div>
  );
}
