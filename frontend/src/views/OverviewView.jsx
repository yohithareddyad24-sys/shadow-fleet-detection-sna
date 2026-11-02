import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Ship, 
  ShieldAlert, 
  Radio, 
  AlertTriangle, 
  Share2, 
  Activity, 
  ExternalLink, 
  Calendar, 
  RefreshCw, 
  Compass, 
  PieChart as PieIcon, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Layers, 
  ArrowUpDown, 
  Database, 
  Wifi, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Radar as RadarIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import KpiGlowCard from '../components/effects/KpiGlowCard';
import CountingNumber from '../components/effects/CountingNumber';
import Sparkline from '../components/effects/Sparkline';
import RadarSweepOverlay from '../components/effects/RadarSweepOverlay';
import HudCornerFrame from '../components/effects/HudCornerFrame';
import DemoBadge from '../components/common/DemoBadge';
import SkeletonLoader from '../components/effects/SkeletonLoader';
import EventDetailDrawer from '../components/effects/EventDetailDrawer';

import { getFleetMetrics } from '../services/analytics';
import { getVessels } from '../services/vessels';
import { getAnomalyEvents } from '../services/events';
import { getAlerts } from '../services/alerts';
import { MOCK_STS_ZONES, MOCK_GAP_CORRIDORS } from '../data/mockData';

export default function OverviewView({ onSelectVessel }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [vessels, setVessels] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isDemo, setIsDemo] = useState(false);

  // Date Filter & Controls
  const [dateRange, setDateRange] = useState('30d'); // '24h', '7d', '30d', 'all'
  const [refreshing, setRefreshing] = useState(false);

  // Table Sorting
  const [sortField, setSortField] = useState('composite_risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Charts & Inspection
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mini Map Reference
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const previewLayersRef = useRef({ vessels: null, sweep: true });

  // Load telemetry data
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [metricsRes, vesselsRes, eventsRes, alertsRes] = await Promise.all([
        getFleetMetrics(),
        getVessels(),
        getAnomalyEvents(),
        getAlerts(),
      ]);

      setMetrics(metricsRes.data);
      setVessels(vesselsRes.data || []);
      setEvents(eventsRes.data || []);
      setAlerts(alertsRes.data || []);
      setIsDemo(metricsRes.isDemo || vesselsRes.isDemo || eventsRes.isDemo);
    } catch (err) {
      console.error("Overview data loading error:", err);
      setError(err.message || "Failed to synchronize operational intelligence.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize Embedded Mini Map Preview with Radar Sweep
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [36.0, 20.0],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    // STS zones & corridors preview
    MOCK_STS_ZONES.forEach(z => {
      L.circle([z.lat, z.lng], {
        radius: z.radius_km * 1000,
        color: z.alert_level === 'HIGH' ? '#FF5C65' : '#F5B942',
        fillColor: z.alert_level === 'HIGH' ? '#FF5C65' : '#F5B942',
        fillOpacity: 0.15,
        weight: 1,
        dashArray: '3, 6',
      }).addTo(map);
    });

    MOCK_GAP_CORRIDORS.forEach(c => {
      L.polyline([c.from, c.to], {
        color: '#FF5C65',
        weight: 2,
        dashArray: '4, 6',
        opacity: 0.8,
      }).addTo(map);
    });

    const vesselLayer = L.layerGroup().addTo(map);
    previewLayersRef.current.vessels = vesselLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Populate preview map vessels
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = previewLayersRef.current.vessels;
    if (!map || !layer) return;

    layer.clearLayers();

    vessels.forEach(v => {
      const isHigh = v.risk_tier === 'CRITICAL_MONITORING';
      const isElevated = v.risk_tier === 'ELEVATED_ATTENTION';
      const isAnomalous = v.risk_tier === 'MODERATE_INTERACTION';
      const color = isHigh ? '#FF5C65' : isElevated ? '#F5B942' : isAnomalous ? '#4285F4' : '#39D98A';

      const iconHtml = `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isHigh || isElevated ? `<div style="position: absolute; inset: -3px; border-radius: 50%; border: 1.5px solid ${color}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>` : ''}
          <div style="width: 16px; height: 16px; background: #0B1220; border: 1.5px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}88;">
            <div style="width: 6px; height: 6px; background: ${color}; border-radius: 50%;"></div>
          </div>
        </div>
      `;

      const marker = L.marker([v.lat, v.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'preview-vessel-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });

      marker.on('click', () => {
        if (onSelectVessel) onSelectVessel(v);
        else if (outletCtx.onSelectVessel) outletCtx.onSelectVessel(v);
      });

      marker.bindTooltip(`<strong>${v.vessel_name}</strong><br/>Score: ${(v.composite_risk_score * 100).toFixed(0)}% (${v.risk_tier.replace('_', ' ')})`, {
        direction: 'top',
        className: 'glass-panel text-xs font-mono',
      });

      layer.addLayer(marker);
    });
  }, [vessels, onSelectVessel, outletCtx]);

  // Jump mini-map preview to hotspot
  const jumpPreviewHotspot = (lat, lng, zoom = 6) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.0 });
  };

  // KPI Calculations
  const monitoredCount = vessels.length || metrics?.total_vessels || 12;
  const criticalCount = vessels.filter(v => v.risk_tier === 'CRITICAL_MONITORING').length || metrics?.critical_count || 2;
  const elevatedCount = vessels.filter(v => v.risk_tier === 'ELEVATED_ATTENTION').length || metrics?.elevated_count || 3;
  const anomalousCount = criticalCount + elevatedCount;
  const aisGapsTotal = vessels.reduce((acc, v) => acc + (v.ais_gap_count || 0), 0) || metrics?.total_dark_gaps_reported || 61;
  const stsEncountersTotal = metrics?.total_interactions || 14;
  const unresolvedAlertsTotal = alerts.length || 4;

  // 30-day Time-Series Analytics Data based on selected dateRange
  const trendData = useMemo(() => {
    const base30d = [
      { day: "Oct 01", index: 0.28, criticals: 1, gaps: 3 },
      { day: "Oct 05", index: 0.35, criticals: 2, gaps: 7 },
      { day: "Oct 09", index: 0.39, criticals: 2, gaps: 6 },
      { day: "Oct 13", index: 0.44, criticals: 3, gaps: 10 },
      { day: "Oct 17", index: 0.41, criticals: 2, gaps: 8 },
      { day: "Oct 21", index: 0.52, criticals: 4, gaps: 14 },
      { day: "Oct 24", index: 0.56, criticals: 4, gaps: 16 },
      { day: "Oct 26", index: 0.61, criticals: 5, gaps: 18 },
      { day: "Oct 28", index: 0.64, criticals: 5, gaps: 19 },
      { day: "Oct 31", index: 0.68, criticals: 6, gaps: 22 },
    ];

    if (dateRange === '24h') {
      return [
        { day: "00:00", index: 0.62, criticals: 5, gaps: 19 },
        { day: "04:00", index: 0.64, criticals: 5, gaps: 20 },
        { day: "08:00", index: 0.65, criticals: 6, gaps: 20 },
        { day: "12:00", index: 0.68, criticals: 6, gaps: 22 },
        { day: "16:00", index: 0.67, criticals: 6, gaps: 21 },
        { day: "20:00", index: 0.69, criticals: 6, gaps: 23 },
      ];
    }
    if (dateRange === '7d') {
      return base30d.slice(-5);
    }
    return base30d;
  }, [dateRange]);

  // Donut Distribution Data
  const pieData = useMemo(() => {
    return [
      { name: 'Critical Monitoring', value: criticalCount, color: '#FF5C65' },
      { name: 'Elevated Attention', value: elevatedCount, color: '#F5B942' },
      { name: 'Moderate Interaction', value: vessels.filter(v => v.risk_tier === 'MODERATE_INTERACTION').length || 4, color: '#4285F4' },
      { name: 'Baseline Legitimate', value: vessels.filter(v => v.risk_tier === 'BASELINE_LEGITIMATE').length || 3, color: '#39D98A' },
    ];
  }, [criticalCount, elevatedCount, vessels]);

  // Top vessels to investigate (sorted)
  const topVessels = useMemo(() => {
    return [...vessels].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    }).slice(0, 5);
  }, [vessels, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleInspectVessel = (vessel) => {
    if (onSelectVessel) onSelectVessel(vessel);
    else if (outletCtx.onSelectVessel) outletCtx.onSelectVessel(vessel);
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto font-mono text-text-primary select-none space-y-4">
      
      {/* 1. Header Toolbar with Refresh, Date Filters, & DEMO Badge */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-3.5 shadow-panel flex flex-wrap items-center justify-between gap-3 glass-panel">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>OPERATIONAL INTELLIGENCE SOC // OVERVIEW TELEMETRY</span>
          </div>
          {isDemo && (
            <DemoBadge tooltip="Displaying synthetic AIS feeds, graph centralities, and encounter logs." />
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-navy-card rounded border border-navy-border p-0.5">
            <span className="text-[10px] text-text-secondary px-2 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-accent-cyan" />
              <span>WINDOW:</span>
            </span>
            {[
              { id: '24h', label: '24H' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'all', label: 'ALL' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                  dateRange === tab.id
                    ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
            title="Reload backend telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent-cyan' : ''}`} />
          </button>
        </div>
      </HudCornerFrame>

      {/* Error State Banner */}
      {error && (
        <div className="p-3 bg-risk-alert/15 border border-risk-alert/40 rounded-lg text-xs flex items-center justify-between text-risk-alert">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => loadData()}
            className="px-2.5 py-1 bg-risk-alert/20 hover:bg-risk-alert/30 rounded border border-risk-alert/50 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Exactly 6 KPI Cards with Count-Up, Sparkline, and Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* KPI 1: Vessels Monitored */}
        <KpiGlowCard 
          accentColor="#00D4FF" 
          onClick={() => navigate('/vessels')}
          className="cursor-pointer group hover:border-accent-cyan/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>VESSELS MONITORED</span>
            <Ship className="w-3.5 h-3.5 text-accent-cyan group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={monitoredCount} className="text-2xl font-bold text-white" />
            )}
            <Sparkline data={[8, 9, 10, 11, 10, 12, monitoredCount]} color="#00D4FF" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Global fleet registry</span>
            <span className="text-accent-cyan group-hover:underline flex items-center">
              View <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

        {/* KPI 2: Vessels with Anomalies */}
        <KpiGlowCard 
          accentColor="#F5B942" 
          onClick={() => navigate('/vessels?tier=ANOMALOUS')}
          className="cursor-pointer group hover:border-risk-warning/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>WITH ANOMALIES</span>
            <ShieldAlert className="w-3.5 h-3.5 text-risk-warning group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={anomalousCount} className="text-2xl font-bold text-risk-warning" />
            )}
            <Sparkline data={[2, 3, 3, 4, 3, 5, anomalousCount]} color="#F5B942" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Elevated + Critical</span>
            <span className="text-risk-warning group-hover:underline flex items-center">
              Filter <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

        {/* KPI 3: High-Priority Reviews */}
        <KpiGlowCard 
          accentColor="#FF5C65" 
          onClick={() => navigate('/vessels?tier=CRITICAL_MONITORING')}
          className="cursor-pointer group hover:border-risk-alert/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>HIGH-PRIORITY REVIEWS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-risk-alert group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={criticalCount} className="text-2xl font-bold text-risk-alert" />
            )}
            <Sparkline data={[1, 1, 2, 2, 2, 2, criticalCount]} color="#FF5C65" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Requires dossier review</span>
            <span className="text-risk-alert group-hover:underline flex items-center">
              Triage <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

        {/* KPI 4: AIS Gaps */}
        <KpiGlowCard 
          accentColor="#FF5C65" 
          onClick={() => navigate('/map?layer=gaps')}
          className="cursor-pointer group hover:border-risk-alert/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>DARK AIS GAPS</span>
            <Radio className="w-3.5 h-3.5 text-risk-alert group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={aisGapsTotal} className="text-2xl font-bold text-white" />
            )}
            <Sparkline data={[38, 42, 45, 52, 57, 59, aisGapsTotal]} color="#FF5C65" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Transit blackouts</span>
            <span className="text-accent-cyan group-hover:underline flex items-center">
              Map <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

        {/* KPI 5: STS Encounters */}
        <KpiGlowCard 
          accentColor="#F5B942" 
          onClick={() => navigate('/map?layer=encounters')}
          className="cursor-pointer group hover:border-risk-warning/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>STS ENCOUNTERS</span>
            <Share2 className="w-3.5 h-3.5 text-risk-warning group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={stsEncountersTotal} className="text-2xl font-bold text-white" />
            )}
            <Sparkline data={[6, 8, 9, 11, 12, 13, stsEncountersTotal]} color="#F5B942" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Offshore rendezvous</span>
            <span className="text-accent-cyan group-hover:underline flex items-center">
              Map <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

        {/* KPI 6: Unresolved Alerts */}
        <KpiGlowCard 
          accentColor="#00D4FF" 
          onClick={() => navigate('/alerts')}
          className="cursor-pointer group hover:border-accent-cyan/60 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>UNRESOLVED ALERTS</span>
            <Clock className="w-3.5 h-3.5 text-accent-cyan group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            {loading ? (
              <div className="w-16 h-8 skeleton-shimmer" />
            ) : (
              <CountingNumber value={unresolvedAlertsTotal} className="text-2xl font-bold text-accent-cyan" />
            )}
            <Sparkline data={[2, 3, 3, 4, 3, 4, unresolvedAlertsTotal]} color="#00D4FF" width={55} height={18} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between items-center">
            <span>Active case files</span>
            <span className="text-accent-cyan group-hover:underline flex items-center">
              Review <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </KpiGlowCard>

      </div>

      {/* 3. Section A: Large Interactive Map Preview with Radar Sweep */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3 relative overflow-hidden" glow>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-navy-border text-xs z-10 relative">
          <div className="flex items-center space-x-2">
            <RadarIcon className="w-4 h-4 text-accent-cyan animate-spin-radar" />
            <span className="font-bold text-white uppercase tracking-wider">
              Section A // Geospatial Tactical Surveillance Preview
            </span>
            <span className="text-[10px] text-text-secondary font-mono">
              (RADAR SWEEP ACTIVE)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Hotspot Buttons */}
            <div className="hidden md:flex items-center space-x-1.5 text-[10px]">
              <span className="text-text-secondary">HOTSPOTS:</span>
              <button 
                onClick={() => jumpPreviewHotspot(36.45, 22.88, 7)}
                className="px-2 py-0.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan"
              >
                Laconic Gulf
              </button>
              <button 
                onClick={() => jumpPreviewHotspot(35.92, 14.56, 7)}
                className="px-2 py-0.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan"
              >
                Malta Hurd Bank
              </button>
              <button 
                onClick={() => jumpPreviewHotspot(36.10, -5.32, 7)}
                className="px-2 py-0.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan"
              >
                Gibraltar
              </button>
            </div>

            {/* Launch Full Tactical Map Button */}
            <button
              onClick={() => navigate('/map')}
              className="px-3 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-xs text-accent-cyan font-bold flex items-center space-x-1.5 transition-colors"
            >
              <span>Launch Full Interactive Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Map Container */}
        <div className="w-full h-80 rounded-lg overflow-hidden border border-navy-border relative bg-navy-bg">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          
          {/* Animated Conic Radar Sweep Overlay */}
          <RadarSweepOverlay active={true} showRings={true} />

          {/* Quick Stats Overlay Pill */}
          <div className="absolute bottom-3 left-3 z-10 glass-panel rounded px-3 py-1 text-[11px] font-mono text-text-secondary flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span>Visible in preview: <strong className="text-white">{vessels.length} vessels</strong></span>
            <span className="text-navy-border">•</span>
            <span>Click any marker to open intelligence dossier</span>
          </div>
        </div>
      </HudCornerFrame>

      {/* 4. Section B & Section C: Charts Grid (Anomaly Activity + Donut Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Section B: Anomaly Activity Line/Area Chart */}
        <HudCornerFrame className="lg:col-span-7 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
              <span>SECTION B // ANOMALY ACTIVITY TIMELINE & INCIDENT ACCUMULATION</span>
            </span>
            <span className="text-[10px] text-text-secondary font-mono">
              {dateRange.toUpperCase()} WINDOW
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="w-full h-full skeleton-shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="overviewAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 1]} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-2.5 rounded text-xs font-mono space-y-1">
                            <div className="font-bold text-accent-cyan">{label}</div>
                            <div className="text-white">Anomaly Index: {payload[0].value}</div>
                            <div className="text-risk-alert">Critical Monitors: {payload[0].payload.criticals}</div>
                            <div className="text-risk-warning">Dark AIS Gaps: {payload[0].payload.gaps}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="index" 
                    stroke="#00D4FF" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#overviewAreaGrad)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[10px] text-text-secondary text-right">
            Displays composite behavioral divergence index across monitored transit corridors.
          </div>
        </HudCornerFrame>

        {/* Section C: Anomaly Category Donut Chart */}
        <HudCornerFrame className="lg:col-span-5 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <PieIcon className="w-3.5 h-3.5 text-accent-cyan" />
              <span>SECTION C // ANOMALY CATEGORY DISTRIBUTION</span>
            </span>
            <span className="text-[10px] text-text-secondary">HOVER SEGMENT</span>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white font-mono">{monitoredCount}</span>
              <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                TOTAL VESSELS
              </span>
            </div>

            {loading ? (
              <div className="w-40 h-40 rounded-full skeleton-shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#070B14"
                        strokeWidth={activePieIndex === index ? 3 : 1}
                        style={{
                          transform: activePieIndex === index ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center center',
                          transition: 'transform 0.2s ease',
                          filter: activePieIndex === index ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0];
                        return (
                          <div className="glass-panel p-2 rounded text-xs font-mono">
                            <div className="font-bold text-white">{p.name}</div>
                            <div style={{ color: p.payload.color }}>
                              Count: {p.value} vessels ({((p.value / monitoredCount) * 100).toFixed(0)}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Interactive Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-border/60 text-[10px]">
            {pieData.map((item, idx) => (
              <div 
                key={idx}
                onMouseEnter={() => setActivePieIndex(idx)}
                onMouseLeave={() => setActivePieIndex(null)}
                className={`flex items-center space-x-1.5 p-1 rounded cursor-pointer transition-colors ${
                  activePieIndex === idx ? 'bg-navy-elevated' : 'hover:bg-navy-card'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary truncate">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </HudCornerFrame>

      </div>

      {/* 5. Section D: Sortable Top Vessels to Investigate Table */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3" glow>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-navy-border text-xs">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-risk-alert" />
            <span className="font-bold text-white uppercase tracking-wider">
              Section D // Top Priority Vessels Requiring Investigation
            </span>
          </div>
          <button
            onClick={() => navigate('/vessels')}
            className="text-xs text-accent-cyan hover:underline flex items-center space-x-1"
          >
            <span>View All in Vessel Explorer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-navy-card/80 text-text-secondary uppercase text-[10px] tracking-wider border-b border-navy-border">
              <tr>
                <th 
                  onClick={() => handleSort('vessel_name')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Vessel Identifier</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Flag State</th>
                <th className="py-2.5 px-3">Vessel Type</th>
                <th 
                  onClick={() => handleSort('composite_risk_score')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-accent-cyan select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Anomaly Score</span>
                    <ArrowUpDown className="w-3 h-3 text-accent-cyan" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Primary Driver</th>
                <th 
                  onClick={() => handleSort('ais_gap_count')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Dark Gaps</span>
                    <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-border/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="h-6 skeleton-shimmer" />
                      <div className="h-6 skeleton-shimmer" />
                      <div className="h-6 skeleton-shimmer" />
                    </div>
                  </td>
                </tr>
              ) : topVessels.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-secondary">
                    No high-risk vessels recorded in current window.
                  </td>
                </tr>
              ) : (
                topVessels.map(v => {
                  const score = v.composite_risk_score || 0;
                  const isCritical = v.risk_tier === 'CRITICAL_MONITORING';
                  const scoreColor = score >= 0.65 ? '#FF5C65' : score >= 0.45 ? '#F5B942' : '#00D4FF';

                  return (
                    <tr
                      key={v.mmsi}
                      onClick={() => handleInspectVessel(v)}
                      className={`hover:bg-navy-card/80 transition-colors group cursor-pointer ${
                        isCritical ? 'border-l-2 border-l-risk-alert bg-risk-alert/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white group-hover:text-accent-cyan transition-colors">
                          {v.vessel_name}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          MMSI: {v.mmsi} {v.imo && `• IMO: ${v.imo}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-primary">{v.flag}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{v.vessel_type}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-navy-card h-2 rounded-full overflow-hidden border border-navy-border">
                            <div 
                              className="h-full rounded-full" 
                              style={{ width: `${Math.round(score * 100)}%`, backgroundColor: scoreColor }}
                            />
                          </div>
                          <span className="font-bold text-xs tabular-nums" style={{ color: scoreColor }}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-text-secondary">{v.primary_risk_driver}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold tabular-nums ${v.ais_gap_count > 5 ? 'text-risk-warning' : 'text-text-secondary'}`}>
                          {v.ais_gap_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectVessel(v);
                          }}
                          className="px-2.5 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan font-bold transition-colors"
                        >
                          Dossier →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </HudCornerFrame>

      {/* 6. Section E & Section F: Recent Events Feed + Data Coverage Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Section E: Recent Maritime Events Feed */}
        <HudCornerFrame className="lg:col-span-7 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" />
              <span>SECTION E // RECENT MARITIME ANOMALY EVENTS</span>
            </span>
            <span className="text-[10px] text-accent-cyan font-bold animate-pulse">
              ● CLICK TO INSPECT
            </span>
          </div>

          <div className="space-y-2">
            {events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                onClick={() => {
                  setSelectedEvent(evt);
                  setDrawerOpen(true);
                }}
                className="p-2.5 rounded bg-navy-card/80 border border-navy-border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 hover:bg-navy-elevated/70 transition-colors cursor-pointer group hover:border-accent-cyan/40"
              >
                <div className="flex items-start sm:items-center space-x-2.5">
                  <span className="text-[10px] text-text-secondary shrink-0">{evt.timestamp}</span>
                  <span className="font-bold text-accent-cyan group-hover:underline shrink-0">{evt.vessel_name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-elevated border border-navy-border text-text-primary shrink-0">
                    {evt.event_type}
                  </span>
                  <span className="text-text-secondary text-[11px] truncate max-w-xs">{evt.details}</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase shrink-0 ${
                    evt.severity === 'CRITICAL' ? 'bg-risk-alert/20 text-risk-alert border-risk-alert/40' :
                    evt.severity === 'ELEVATED' ? 'bg-risk-warning/20 text-risk-warning border-risk-warning/40' :
                    'bg-accent-blue/20 text-accent-cyan border-accent-blue/40'
                  }`}>
                    {evt.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </HudCornerFrame>

        {/* Section F: Data Coverage & Freshness Indicators */}
        <HudCornerFrame className="lg:col-span-5 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel glass-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Wifi className="w-3.5 h-3.5 text-risk-success" />
              <span>SECTION F // DATA COVERAGE & INGESTION FRESHNESS</span>
            </span>
            <span className="text-[10px] text-risk-success flex items-center space-x-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-success animate-ping" />
              <span>SYNCHRONIZED</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded bg-navy-card border border-navy-border flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Satellite AIS Constellation</div>
                <div className="text-[10px] text-text-secondary">Orbital pass telemetry: 4 polar satellites active</div>
              </div>
              <span className="text-risk-success font-bold font-mono">98.4% Reception</span>
            </div>

            <div className="p-2.5 rounded bg-navy-card border border-navy-border flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Terrestrial Coastal Base Stations</div>
                <div className="text-[10px] text-text-secondary">Med & Baltic choke points (142 nodes)</div>
              </div>
              <span className="text-accent-cyan font-bold font-mono">142 / 142 ONLINE</span>
            </div>

            <div className="p-2.5 rounded bg-navy-card border border-navy-border flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Ingestion Pipeline Latency</div>
                <div className="text-[10px] text-text-secondary">Mean timestamp skew across stream</div>
              </div>
              <span className="text-white font-bold font-mono">~38s (Near Real-Time)</span>
            </div>

            <div className="p-2.5 rounded bg-navy-card border border-navy-border flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Data Mode State</div>
                <div className="text-[10px] text-text-secondary">Backend API & Synthetic Adapter Fallback</div>
              </div>
              {isDemo ? (
                <DemoBadge label="DEMO ADAPTER" />
              ) : (
                <span className="text-risk-success font-bold font-mono text-[10px]">LIVE BACKEND</span>
              )}
            </div>
          </div>
        </HudCornerFrame>

      </div>

      {/* Slide-in Event Detail Drawer */}
      <EventDetailDrawer 
        event={selectedEvent}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onInspectVessel={(evt) => {
          setDrawerOpen(false);
          const target = vessels.find(v => v.mmsi === evt.mmsi) || { vessel_name: evt.vessel_name, mmsi: evt.mmsi };
          handleInspectVessel(target);
        }}
      />

    </div>
  );
}
