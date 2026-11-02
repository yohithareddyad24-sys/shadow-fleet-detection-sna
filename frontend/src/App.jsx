import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext, useParams } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

import OverviewView from './views/OverviewView';
import GeospatialView from './views/GeospatialView';
import FleetTableView from './views/FleetTableView';
import AnalyticsView from './views/AnalyticsView';
import NetworkAnalysisView from './views/NetworkAnalysisView';
import InvestigationsView from './views/InvestigationsView';
import MethodologyView from './views/MethodologyView';

// Route wrappers to bind Outlet context cleanly
function OverviewRoute() {
  const ctx = useOutletContext() || {};
  return <OverviewView onSelectVessel={ctx.onSelectVessel} />;
}

function MapRoute() {
  const ctx = useOutletContext() || {};
  return (
    <GeospatialView
      vessels={ctx.allVessels || []}
      onSelectVessel={ctx.onSelectVessel}
      selectedVessel={ctx.selectedVessel}
      acoRoute={ctx.acoRoute}
      onClearAcoRoute={ctx.onClearAcoRoute}
    />
  );
}

function VesselsRoute() {
  const ctx = useOutletContext() || {};
  return (
    <FleetTableView
      vessels={ctx.allVessels || []}
      onSelectVessel={ctx.onSelectVessel}
      onLocateOnMap={ctx.onLocateOnMap}
      onViewInGraph={ctx.onViewInGraph}
      onRunAcoFromVessel={ctx.onRunAcoFromVessel}
    />
  );
}

function VesselDetailParamRoute() {
  const { mmsi } = useParams();
  const ctx = useOutletContext() || {};

  useEffect(() => {
    if (mmsi && ctx.allVessels?.length > 0) {
      const found = ctx.allVessels.find(v => v.mmsi === mmsi);
      if (found) ctx.onSelectVessel(found);
    }
  }, [mmsi, ctx.allVessels, ctx.onSelectVessel]);

  return <VesselsRoute />;
}

function RiskIntelligenceRoute() {
  const ctx = useOutletContext() || {};
  return <AnalyticsView onSelectVessel={ctx.onSelectVessel} />;
}

function AlertsRoute() {
  const ctx = useOutletContext() || {};
  return (
    <InvestigationsView
      vessels={ctx.allVessels || []}
      onSelectVessel={ctx.onSelectVessel}
      selectedVesselForCase={ctx.selectedVesselForCase}
      onClearVesselForCase={ctx.onClearVesselForCase}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* 1. Page 1: Intelligence Overview */}
          <Route index element={<OverviewRoute />} />
          <Route path="overview" element={<OverviewRoute />} />

          {/* 2. Page 2: Interactive Maritime Map */}
          <Route path="map" element={<MapRoute />} />

          {/* 3. Page 3: Vessel Explorer */}
          <Route path="vessels" element={<VesselsRoute />} />
          <Route path="vessels/:mmsi" element={<VesselDetailParamRoute />} />

          {/* 4. Page 4: Risk Intelligence */}
          <Route path="risk-intelligence" element={<RiskIntelligenceRoute />} />

          {/* 5. Page 5: Network Analysis (SNA Graph + ACO Pathfinder) */}
          <Route path="network" element={<NetworkAnalysisView />} />

          {/* 6. Page 6: Alerts & Events (Investigation Cases) */}
          <Route path="alerts" element={<AlertsRoute />} />

          {/* 7. Page 7: Research Methodology & Standards */}
          <Route path="methodology" element={<MethodologyView />} />

          {/* Catch-all redirect to Overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
