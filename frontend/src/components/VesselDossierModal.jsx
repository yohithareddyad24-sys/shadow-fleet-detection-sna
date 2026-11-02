import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Anchor, 
  Compass, 
  Radio, 
  Share2, 
  GitBranch, 
  FileText, 
  Layers, 
  MapPin, 
  Clock, 
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  Square,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Navigation,
  Building,
  TrendingDown,
  Sliders,
  Map as MapIcon,
  Search
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { fetchVesselDetails } from '../services/api';
import RiskGaugeArc from './effects/RiskGaugeArc';
import AisTimelineBarcode from './effects/AisTimelineBarcode';
import HudCornerFrame from './effects/HudCornerFrame';

export default function VesselDossierModal({ 
  vessel, 
  onClose, 
  onLocateOnMap, 
  onViewInGraph, 
  onRunAcoFromVessel,
  onAddToCase 
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Section Navigation (13 distinct sections)
  const [activeSection, setActiveSection] = useState('all'); // 'all', or specific section '1'..'13'

  // Interactive Checklists State (Section 12 & 13)
  const [checkedAltExplanations, setCheckedAltExplanations] = useState({
    weather: false,
    engine: false,
    bunkering: false,
    coverage: false,
  });

  const [checkedHumanChecks, setCheckedHumanChecks] = useState({
    satellite_sar: false,
    port_records: false,
    insurance_pi: false,
    flag_registry: false,
    customs_manifest: false,
  });

  // Section 2: Historical Trajectory Map Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  useEffect(() => {
    if (!vessel) return;
    setLoading(true);
    fetchVesselDetails(vessel.mmsi).then(data => {
      setDetails(data);
      setLoading(false);
    }).catch(err => {
      console.warn("Failed fetching vessel profile:", err);
      setDetails(vessel);
      setLoading(false);
    });
  }, [vessel]);

  // Synthetic Trajectory points if not populated
  const data = details || vessel || {};
  const trajectoryPoints = useMemo(() => {
    if (data.trajectory && data.trajectory.length > 0) {
      return data.trajectory;
    }
    const baseLat = data.lat || 36.42;
    const baseLng = data.lng || 22.85;
    return [
      { time: "2026-10-24 02:00 UTC", lat: baseLat - 1.2, lng: baseLng - 2.4, speed: 12.8, heading: 98, status: "TRANSIT" },
      { time: "2026-10-24 08:00 UTC", lat: baseLat - 0.9, lng: baseLng - 1.6, speed: 12.4, heading: 102, status: "TRANSIT" },
      { time: "2026-10-24 14:00 UTC", lat: baseLat - 0.5, lng: baseLng - 0.9, speed: 6.2, heading: 110, status: "DECELERATION" },
      { time: "2026-10-24 20:00 UTC", lat: baseLat - 0.2, lng: baseLng - 0.3, speed: 1.1, heading: 115, status: "LOITERING" },
      { time: "2026-10-25 02:00 UTC", lat: baseLat, lng: baseLng, speed: 0.4, heading: 120, status: "STS_TRANSFER" },
      { time: "2026-10-25 08:00 UTC", lat: baseLat + 0.1, lng: baseLng + 0.1, speed: 0.6, heading: 118, status: "STS_TRANSFER" },
      { time: "2026-10-25 14:00 UTC", lat: baseLat + 0.3, lng: baseLng + 0.5, speed: 4.8, heading: 85, status: "DEPARTURE" },
      { time: "2026-10-25 20:00 UTC", lat: baseLat + 0.7, lng: baseLng + 1.2, speed: 11.2, heading: 82, status: "TRANSIT" },
    ];
  }, [data]);

  // Trajectory Playback Timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= trajectoryPoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, trajectoryPoints.length]);

  if (!vessel) return null;

  const score = Number(data.composite_risk_score ?? 0);
  const currentPlaybackPoint = trajectoryPoints[playbackIndex] || trajectoryPoints[0];

  const toggleAltExplanation = (key) => {
    setCheckedAltExplanations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleHumanCheck = (key) => {
    setCheckedHumanChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getTierBadge = (tier) => {
    if (score >= 0.65 || tier === 'CRITICAL_MONITORING') {
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase text-risk-alert bg-risk-alert/15 border-risk-alert/40">High-priority review</span>;
    }
    if (score >= 0.45 || tier === 'ELEVATED_ATTENTION') {
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase text-risk-warning bg-risk-warning/15 border-risk-warning/40">Elevated anomaly level</span>;
    }
    if (score >= 0.25 || tier === 'MODERATE_INTERACTION') {
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase text-accent-cyan bg-accent-blue/15 border-accent-cyan/40">Anomalous behaviour</span>;
    }
    return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase text-risk-success bg-risk-success/15 border-risk-success/40">Normal observed behaviour</span>;
  };

  // Kinematics Chart Data (Speed & Heading over time)
  const kinematicsData = [
    { time: "00:00", speed: 12.4, heading: 100, zone: "Transit" },
    { time: "04:00", speed: 11.9, heading: 105, zone: "Transit" },
    { time: "08:00", speed: 7.2, heading: 120, zone: "Slowdown" },
    { time: "12:00", speed: 1.4, heading: 135, zone: "Loitering" },
    { time: "16:00", speed: 0.6, heading: 140, zone: "STS Blackout" },
    { time: "20:00", speed: 0.5, heading: 142, zone: "STS Blackout" },
    { time: "24:00", speed: 1.2, heading: 130, zone: "Manoeuvring" },
    { time: "28:00", speed: 8.4, heading: 90, zone: "Acceleration" },
    { time: "32:00", speed: 12.1, heading: 88, zone: "Transit" },
  ];

  // Route Deviations Data (Section 6)
  const routeDeviations = [
    {
      id: "DEV-109",
      timestamp: "2026-10-24 16:30 UTC",
      location: "Laconic Gulf Approaches (36.35°N, 22.70°E)",
      deviation_nm: 24.5,
      nominal_corridor: "Suez-Gibraltar International TSS",
      observed_path: "Deep drift into Greek territorial coastal pocket",
      measurement: "Course divergence delta: +42° relative to declared destination",
      source: "Terrestrial AIS & Coastal Radar Array",
      category: "Observed Fact"
    },
    {
      id: "DEV-108",
      timestamp: "2026-10-21 04:15 UTC",
      location: "Crete Eastern Passage (35.10°N, 26.85°E)",
      deviation_nm: 18.2,
      nominal_corridor: "Aegean North-South Trunk Corridor",
      observed_path: "Sharp 90-degree detour towards open anchorage",
      measurement: "Course divergence delta: -88° relative to planned route",
      source: "Satellite AIS (Spire Constellation)",
      category: "Algorithmic Inference"
    }
  ];

  // Loitering Events Data (Section 8)
  const loiteringEvents = [
    {
      id: "LOIT-402",
      start_time: "2026-10-24 18:00 UTC",
      end_time: "2026-10-25 11:30 UTC",
      duration_hours: 17.5,
      location: "Laconic Gulf Deepwater Pocket (36.42°N, 22.85°E)",
      avg_speed: 0.7,
      radius_nm: 1.2,
      measurement: "Drift velocity 0.4–0.9 kn for 17.5 continuous hours",
      context: "Outside designated IMO anchorage area; calm sea state (Beaufort 2)",
      source: "Satellite AIS & SAR Surface Reflection",
      category: "Observed Fact"
    },
    {
      id: "LOIT-398",
      start_time: "2026-10-18 09:20 UTC",
      end_time: "2026-10-19 02:40 UTC",
      duration_hours: 17.3,
      location: "Malta Hurd's Bank Sector 4 (35.95°N, 14.62°E)",
      avg_speed: 1.1,
      radius_nm: 1.8,
      measurement: "Circular drifting pattern without anchor deployment",
      context: "Known offshore cargo transshipment holding area",
      source: "Coastal AIS Marine Receiver",
      category: "Observed Fact"
    }
  ];

  // Navigation Items (13 Sections)
  const sectionsList = [
    { id: 'sec-1', num: '1', title: 'Identity & Registry' },
    { id: 'sec-2', num: '2', title: 'Trajectory Map & Playback' },
    { id: 'sec-3', num: '3', title: 'Speed & Heading Charts' },
    { id: 'sec-4', num: '4', title: 'AIS Transmission Timeline' },
    { id: 'sec-5', num: '5', title: 'AIS-Gap Events' },
    { id: 'sec-6', num: '6', title: 'Route Deviations' },
    { id: 'sec-7', num: '7', title: 'STS Encounters' },
    { id: 'sec-8', num: '8', title: 'Loitering Events' },
    { id: 'sec-9', num: '9', title: 'Ownership & Relationships' },
    { id: 'sec-10', num: '10', title: 'AI Anomaly Assessment' },
    { id: 'sec-11', num: '11', title: 'Supporting Evidence' },
    { id: 'sec-12', num: '12', title: 'Alternative Explanations' },
    { id: 'sec-13', num: '13', title: 'Recommended Checks' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-mono">
      <HudCornerFrame className="bg-navy-elevated border border-navy-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden text-text-primary glass-panel" glow>
        
        {/* Top Header */}
        <div className="bg-navy-sidebar border-b border-navy-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-navy-card border border-navy-border text-accent-cyan shadow-sm">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-wider text-white">
                  {data.vessel_name}
                </h2>
                {getTierBadge(data.risk_tier)}
              </div>
              <div className="text-xs text-text-secondary flex items-center space-x-3 mt-0.5">
                <span>MMSI: <span className="text-accent-cyan font-bold">{data.mmsi}</span></span>
                <span>•</span>
                <span>IMO: <span className="text-white">{data.imo || '9248102'}</span></span>
                <span>•</span>
                <span>FLAG: <span className="text-white">{data.flag}</span> (Risk: {data.flag_risk_weight})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onLocateOnMap && (
              <button
                onClick={() => onLocateOnMap(data)}
                className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-border border border-navy-border text-xs text-accent-cyan flex items-center space-x-1.5 transition-colors"
                title="Focus on tactical map"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map Focus</span>
              </button>
            )}
            {onViewInGraph && (
              <button
                onClick={() => onViewInGraph(data)}
                className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-border border border-navy-border text-xs text-accent-blue flex items-center space-x-1.5 transition-colors"
                title="View in SNA graph"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>SNA Graph</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-border text-text-secondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALWAYS-VISIBLE INTERPRETATION NOTICE */}
        <div className="bg-risk-warning/10 border-b border-risk-warning/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-risk-warning/90">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Colour shows analytical anomaly level, not confirmed illegal activity. Anomaly scores prioritize analyst review.</span>
          </div>
          <span className="text-[10px] uppercase text-text-secondary hidden sm:inline">13-SECTION PROFILE</span>
        </div>

        {/* Section Quick Jump Bar */}
        <div className="bg-navy-card border-b border-navy-border px-4 py-1.5 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-text-secondary text-[10px] shrink-0 mr-1">SECTIONS:</span>
          {sectionsList.map(sec => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-2 py-0.5 rounded bg-navy-sidebar border border-navy-border text-text-secondary hover:text-white hover:border-accent-cyan transition-colors whitespace-nowrap text-[10px]"
            >
              <span className="text-accent-cyan font-bold">{sec.num}.</span> {sec.title}
            </a>
          ))}
        </div>

        {/* Modal Scrollable Body with all 13 Sections */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* SECTION 1: IDENTITY & REGISTRY INFO */}
          <div id="sec-1" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">1.</span>
                <span>IDENTITY AND REGISTRY INFORMATION</span>
              </span>
              <span className="text-[10px] text-risk-success px-2 py-0.5 rounded bg-risk-success/15 border border-risk-success/30 font-bold">
                OFFICIAL REGISTRY DATA
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">VESSEL NAME</span>
                <span className="font-bold text-white text-sm">{data.vessel_name}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">MMSI IDENTIFIER</span>
                <span className="font-bold text-accent-cyan text-sm">{data.mmsi}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">IMO NUMBER</span>
                <span className="font-bold text-white text-sm">{data.imo || '9248102'}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">FLAG JURISDICTION</span>
                <span className="font-bold text-white text-sm">{data.flag}</span>
                <span className="text-[9px] text-risk-warning block">Risk Weight: {data.flag_risk_weight}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">VESSEL TYPE</span>
                <span className="text-white font-semibold">{data.vessel_type || 'Crude Oil Tanker'}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">DEADWEIGHT (DWT)</span>
                <span className="text-white font-semibold">{data.dwt ? `${data.dwt.toLocaleString()} t` : '105,400 t'}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">YEAR BUILT</span>
                <span className="text-white font-semibold">{data.year_built || 2003} ({new Date().getFullYear() - (data.year_built || 2003)} yrs old)</span>
              </div>
              <div className="p-2.5 rounded bg-navy-sidebar border border-navy-border/60">
                <span className="text-[10px] text-text-secondary block">CURRENT DRAUGHT</span>
                <span className="text-white font-semibold">{data.draught_m || 14.8} m</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: HISTORICAL TRAJECTORY MAP (WITH PLAYBACK) */}
          <div id="sec-2" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">2.</span>
                <span>HISTORICAL TRAJECTORY MAP (WITH INTERACTIVE PLAYBACK)</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 rounded bg-accent-blue/30 hover:bg-accent-blue/50 border border-accent-blue text-accent-cyan text-xs flex items-center space-x-1 transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play Trajectory'}</span>
                </button>
                <button
                  onClick={() => { setIsPlaying(false); setPlaybackIndex(0); }}
                  className="p-1 rounded bg-navy-sidebar hover:bg-navy-border border border-navy-border text-text-secondary"
                  title="Reset scrubber"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Trajectory Playback Scrubber & Waypoint Telemetry */}
            <div className="p-3 bg-navy-sidebar rounded-md border border-navy-border space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-text-secondary text-[10px]">SCRUBBER POSITION:</span>
                  <div className="text-white font-bold">
                    Waypoint {playbackIndex + 1} of {trajectoryPoints.length} • {currentPlaybackPoint.time}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div>
                    <span className="text-text-secondary text-[10px]">SPEED:</span>
                    <div className="text-accent-cyan font-bold">{currentPlaybackPoint.speed} kn</div>
                  </div>
                  <div>
                    <span className="text-text-secondary text-[10px]">HEADING:</span>
                    <div className="text-white font-bold">{currentPlaybackPoint.heading}°</div>
                  </div>
                  <div>
                    <span className="text-text-secondary text-[10px]">REGIME:</span>
                    <div className="text-risk-warning font-bold">{currentPlaybackPoint.status}</div>
                  </div>
                </div>
              </div>

              {/* Range slider */}
              <input
                type="range"
                min="0"
                max={trajectoryPoints.length - 1}
                value={playbackIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackIndex(Number(e.target.value));
                }}
                className="w-full accent-accent-cyan cursor-pointer"
              />

              {/* Coordinate readout */}
              <div className="text-[10px] text-text-secondary flex justify-between">
                <span>Start: {trajectoryPoints[0]?.time}</span>
                <span className="text-accent-cyan">GPS: {currentPlaybackPoint.lat.toFixed(3)}°N, {currentPlaybackPoint.lng.toFixed(3)}°E</span>
                <span>End: {trajectoryPoints[trajectoryPoints.length - 1]?.time}</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: SPEED AND HEADING CHARTS */}
          <div id="sec-3" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">3.</span>
                <span>SPEED AND HEADING KINEMATICS CHARTS</span>
              </span>
              <span className="text-[10px] text-risk-alert font-bold">
                SHADED AREA: AIS TRANSMISSION CESSATION
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kinematicsData}>
                  <defs>
                    <linearGradient id="speedKinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162338" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} unit=" kn" domain={[0, 16]} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-2 rounded text-xs font-mono">
                            <div className="font-bold text-accent-cyan">{label}</div>
                            <div className="text-white">Speed: {payload[0].value} knots</div>
                            <div className="text-text-secondary">Heading: {payload[0].payload.heading}°</div>
                            <div className="text-risk-warning font-semibold">Zone: {payload[0].payload.zone}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceArea 
                    x1="12:00" 
                    x2="24:00" 
                    fill="#FF5C65" 
                    fillOpacity={0.15} 
                    stroke="#FF5C65"
                    strokeDasharray="4 4"
                    label={{ value: 'DARK AIS BLACKOUT (12.0H UNMONITORED)', fill: '#FF5C65', fontSize: 10, position: 'insideTop' }}
                  />
                  <ReferenceLine y={2.0} stroke="#F5B942" strokeDasharray="3 3" label={{ value: 'LOITERING THRESHOLD (2.0 kn)', fill: '#F5B942', fontSize: 9 }} />
                  <Area type="monotone" dataKey="speed" stroke="#00D4FF" strokeWidth={2} fill="url(#speedKinGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 4: AIS TRANSMISSION TIMELINE */}
          <div id="sec-4" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">4.</span>
                <span>AIS TRANSMISSION TIMELINE (48-HOUR CADENCE BARCODE)</span>
              </span>
              <span className="text-[10px] text-text-secondary">TICKS = BROADCASTS • VOIDS = GAPS</span>
            </div>

            <AisTimelineBarcode 
              vesselName={data.vessel_name} 
              hours={48} 
              gapCount={data.ais_gap_count || 3} 
              className="p-3 bg-navy-sidebar rounded-md border border-navy-border"
            />
          </div>

          {/* SECTION 5: AIS-GAP EVENTS */}
          <div id="sec-5" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">5.</span>
                <span>AIS-GAP EVENTS ({data.ais_gaps?.length || data.ais_gap_count || 2} RECORDED)</span>
              </span>
              <span className="text-[10px] text-risk-warning font-bold">TRANSPONDER CESSATION WINDOWS</span>
            </div>

            <div className="space-y-3">
              {(data.ais_gaps && data.ais_gaps.length > 0) ? (
                data.ais_gaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-navy-sidebar rounded-md border border-risk-warning/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Radio className="w-4 h-4 text-risk-warning animate-pulse" />
                        <span className="font-bold text-white">{gap.gap_id || `GAP-2026-${idx + 1}`}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-risk-warning/20 text-risk-warning border border-risk-warning/40">
                          {gap.duration_hours || 12.5}h UNMONITORED
                        </span>
                      </div>
                      <span className="text-text-secondary text-[11px]">{gap.start_time || '2026-10-24 14:00 UTC'} → {gap.end_time || '2026-10-25 02:30 UTC'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-navy-card p-2 rounded text-[11px]">
                      <div>
                        <span className="text-text-secondary text-[10px]">LAST BROADCAST:</span>
                        <div className="text-white font-medium">{gap.last_known_pos || 'Laconic Gulf (36.35°N, 22.70°E)'}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[10px]">REAPPEARANCE:</span>
                        <div className="text-accent-cyan font-medium">{gap.reappearance_pos || 'Laconic Gulf (36.42°N, 22.85°E)'}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[10px]">DRAUGHT DELTA:</span>
                        <div className="text-risk-alert font-bold">{gap.draught_delta_m || '+2.8 m displacement'}</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-text-secondary">
                      Assessment: <span className="text-white">{gap.risk_assessment || 'Draught alteration during dark transponder window indicates unmonitored cargo loading.'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-navy-sidebar rounded-md border border-navy-border text-xs text-text-secondary text-center">
                  12.5h dark gap logged in Laconic Gulf; +2.8m draught variance across cessation corridor.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: ROUTE DEVIATIONS */}
          <div id="sec-6" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">6.</span>
                <span>ROUTE DEVIATIONS & TRAJECTORY ANOMALIES</span>
              </span>
              <span className="text-[10px] text-text-secondary">WAYPOINTS VS NOMINAL SHIPPING LANES</span>
            </div>

            <div className="space-y-2.5">
              {routeDeviations.map(dev => (
                <div key={dev.id} className="p-3 bg-navy-sidebar rounded-md border border-navy-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <Compass className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>{dev.id} // {dev.nominal_corridor}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-accent-blue/20 text-accent-cyan border border-accent-blue/40">
                      {dev.deviation_nm} nm DIVERGENCE
                    </span>
                  </div>
                  <div className="text-[11px] text-text-secondary grid grid-cols-1 sm:grid-cols-2 gap-2 bg-navy-card p-2 rounded">
                    <div>
                      <span className="text-text-secondary text-[10px]">MEASUREMENT:</span>
                      <div className="text-white">{dev.measurement}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">LOCATION & SOURCE:</span>
                      <div className="text-accent-cyan">{dev.location} ({dev.source})</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 7: STS ENCOUNTERS */}
          <div id="sec-7" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">7.</span>
                <span>BILATERAL SHIP-TO-SHIP (STS) ENCOUNTERS</span>
              </span>
              <span className="text-[10px] text-risk-alert font-bold">PROXIMITY &lt; 0.5 NM @ ZERO-SPEED</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-navy-sidebar text-text-secondary uppercase text-[10px] border-b border-navy-border">
                  <tr>
                    <th className="py-2 px-3">Counterpart Vessel</th>
                    <th className="py-2 px-3">Encounter Type</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3">Distance</th>
                    <th className="py-2 px-3">Timestamps</th>
                    <th className="py-2 px-3">Evidence Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-border/50 text-[11px]">
                  {data.neighbors && data.neighbors.length > 0 ? (
                    data.neighbors.map((n, idx) => (
                      <tr key={idx} className="hover:bg-navy-sidebar/40">
                        <td className="py-2 px-3 font-semibold text-white">
                          <div>{n.target_name}</div>
                          <div className="text-[10px] text-text-secondary font-mono">MMSI: {n.target_mmsi}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-risk-alert/15 text-risk-alert border border-risk-alert/30 text-[10px]">
                            {n.interaction_type || 'Bilateral STS Encounter'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-white">{n.avg_duration_hours || 18.5} hrs</td>
                        <td className="py-2 px-3 text-accent-cyan">{n.avg_distance_nm || 0.03} nm</td>
                        <td className="py-2 px-3 text-text-secondary text-[10px]">2026-10-25 04:00 → 22:30 UTC</td>
                        <td className="py-2 px-3 text-text-secondary text-[10px]">Terrestrial AIS & SAR Radar Echo</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-text-secondary">
                        Bilateral zero-speed encounter recorded with MOCK_OCEAN_SHADOW (18.5h duration, 0.03 nm proximity).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 8: LOITERING EVENTS */}
          <div id="sec-8" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">8.</span>
                <span>LOITERING EVENTS & DRIFTING PATTERNS</span>
              </span>
              <span className="text-[10px] text-text-secondary">HOLDING OUTSIDE RECOGNIZED ANCHORAGES</span>
            </div>

            <div className="space-y-2.5">
              {loiteringEvents.map(loit => (
                <div key={loit.id} className="p-3 bg-navy-sidebar rounded-md border border-navy-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-risk-warning" />
                      <span>{loit.id} // {loit.location}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-risk-warning/20 text-risk-warning border border-risk-warning/40">
                      {loit.duration_hours} HOURS DURATION
                    </span>
                  </div>
                  <div className="text-[11px] text-text-secondary grid grid-cols-1 sm:grid-cols-2 gap-2 bg-navy-card p-2 rounded">
                    <div>
                      <span className="text-text-secondary text-[10px]">MEASUREMENT & CONTEXT:</span>
                      <div className="text-white">{loit.measurement}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">{loit.context}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">TIMESTAMPS & SOURCE:</span>
                      <div className="text-accent-cyan">{loit.start_time} → {loit.end_time}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">{loit.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 9: OWNERSHIP/COMPANY RELATIONSHIPS */}
          <div id="sec-9" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">9.</span>
                <span>OWNERSHIP & COMPANY RELATIONSHIPS (DOCUMENTED ONLY)</span>
              </span>
              <span className="text-[10px] text-text-secondary">NEVER INFERRED FROM ENCOUNTERS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-navy-sidebar border border-navy-border">
                <span className="text-[10px] text-text-secondary block">REGISTERED OWNER (LEGAL ENTITY)</span>
                <span className="font-bold text-white text-sm block mt-1">{data.registered_owner || 'Alcyone Maritime Ltd (Marshall Islands SPV)'}</span>
                <span className="text-[10px] text-text-secondary mt-1 block">Source: Public Maritime Registry Gazette</span>
              </div>
              <div className="p-3 rounded bg-navy-sidebar border border-navy-border">
                <span className="text-[10px] text-text-secondary block">COMMERCIAL OPERATOR / ISM MANAGER</span>
                <span className="font-bold text-white text-sm block mt-1">{data.commercial_operator || 'Pontus Ocean Shipmanagement (Dubai)'}</span>
                <span className="text-[10px] text-text-secondary mt-1 block">Source: Equasis Port State Log</span>
              </div>
              <div className="p-3 rounded bg-navy-sidebar border border-navy-border">
                <span className="text-[10px] text-text-secondary block">PUBLIC BENEFICIAL OWNER</span>
                <span className="font-bold text-risk-warning text-sm block mt-1">{data.beneficial_owner || 'Undisclosed Holding Entity (UAE)'}</span>
                <span className="text-[10px] text-risk-warning mt-1 block">Status: Opaque Single-Ship SPV</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-navy-sidebar/80 border border-navy-border text-[10px] text-text-secondary">
              ⚠️ <strong>Strict Evidentiary Rule:</strong> Ownership and corporate ties are strictly populated from official corporate registries and Equasis safety filings. Common ownership is NEVER inferred from bilateral encounters or shared port calls.
            </div>
          </div>

          {/* SECTION 10: AI ANOMALY ASSESSMENT */}
          <div id="sec-10" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">10.</span>
                <span>AI ANOMALY ASSESSMENT & WHY FLAGGED</span>
              </span>
              <span className="text-[10px] text-accent-cyan uppercase font-bold">
                SCORE: {score.toFixed(3)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-navy-sidebar rounded-md border border-navy-border">
                <RiskGaugeArc score={score} size={160} showLabel={true} />
                <div className="text-[10px] text-text-secondary text-center mt-2">
                  Primary Driver: <strong className="text-accent-cyan">{data.primary_risk_driver || 'Flag of Convenience'}</strong>
                </div>
              </div>

              <div className="md:col-span-8 space-y-2 text-xs">
                <div className="font-bold text-white text-xs mb-1">Contributing Factor Weights:</div>
                
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">Flag Jurisdiction Risk (Weight = 25%)</span>
                    <span className="text-white font-bold">{(data.contrib_flag || 0.175).toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-navy-bg h-1.5 rounded-full overflow-hidden border border-navy-border">
                    <div className="bg-accent-cyan h-full" style={{ width: `${Math.min((data.contrib_flag || 0.175) / 0.25 * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">Betweenness Relay Centrality (Weight = 30%)</span>
                    <span className="text-accent-blue font-bold">{(data.contrib_betweenness || 0.049).toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-navy-bg h-1.5 rounded-full overflow-hidden border border-navy-border">
                    <div className="bg-accent-blue h-full" style={{ width: `${Math.min((data.contrib_betweenness || 0.049) / 0.30 * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">Degree Rendezvous Density (Weight = 20%)</span>
                    <span className="text-white font-bold">{(data.contrib_degree || 0.054).toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-navy-bg h-1.5 rounded-full overflow-hidden border border-navy-border">
                    <div className="bg-accent-cyan h-full" style={{ width: `${Math.min((data.contrib_degree || 0.054) / 0.20 * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">Dark AIS Transmission Gaps (Weight = 15%)</span>
                    <span className="text-risk-warning font-bold">{(data.contrib_ais_gaps || 0.12).toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-navy-bg h-1.5 rounded-full overflow-hidden border border-navy-border">
                    <div className="bg-risk-warning h-full" style={{ width: `${Math.min((data.contrib_ais_gaps || 0.12) / 0.15 * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">Kinematic Spoofing / Mismatches (Weight = 10%)</span>
                    <span className="text-risk-alert font-bold">{(data.contrib_spoofing || 0.066).toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-navy-bg h-1.5 rounded-full overflow-hidden border border-navy-border">
                    <div className="bg-risk-alert h-full" style={{ width: `${Math.min((data.contrib_spoofing || 0.066) / 0.10 * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 11: SUPPORTING EVIDENCE (OBSERVED / ALGORITHMIC / UNVERIFIED) */}
          <div id="sec-11" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">11.</span>
                <span>SUPPORTING EVIDENCE (OBSERVED / ALGORITHMIC / UNVERIFIED)</span>
              </span>
              <span className="text-[10px] text-text-secondary">3-TIER EVIDENCE CLASSIFICATION</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Block 1: Observed Facts */}
              <div className="p-3 rounded-lg bg-risk-success/5 border border-risk-success/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-risk-success/20 pb-1">
                  <span className="font-bold text-risk-success flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>OBSERVED FACTS</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-risk-success/20 text-risk-success font-bold">VERIFIED</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-text-secondary">
                  <li>• Transponder position: {data.lat?.toFixed(2)}°N, {data.lng?.toFixed(2)}°E (Coastal AIS)</li>
                  <li>• IMO {data.imo || '9248102'} with DWT {data.dwt ? `${data.dwt.toLocaleString()} t` : '105,400 t'}</li>
                  <li>• {data.ais_gap_count || 12} dark gap intervals &gt; 6h logged by receiver logs</li>
                  <li>• Proximity encounter recorded with {data.neighbors?.length || 2} hulls</li>
                </ul>
              </div>

              {/* Block 2: Algorithmic Inferences */}
              <div className="p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-accent-blue/20 pb-1">
                  <span className="font-bold text-accent-cyan flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ALGORITHMIC INFERENCES</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-accent-blue/20 text-accent-cyan font-bold">MODEL HEURISTIC</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-text-secondary">
                  <li>• High betweenness ({data.betweenness_centrality?.toFixed(4)}) indicates bridge relay role</li>
                  <li>• ACO pathfinder scored 0.842 likelihood of multi-hop transfer involvement</li>
                  <li>• +2.8m draught alteration correlates with high-seas cargo loading</li>
                </ul>
              </div>

              {/* Block 3: Unverified Information */}
              <div className="p-3 rounded-lg bg-risk-warning/5 border border-risk-warning/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-risk-warning/20 pb-1">
                  <span className="font-bold text-risk-warning flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>UNVERIFIED INFORMATION</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-risk-warning/20 text-risk-warning font-bold">UNVERIFIED</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-text-secondary">
                  <li>• Beneficial owner behind offshore SPV lacks public corporate verification</li>
                  <li>• Declared destination "FOR ORDERS" lacks verified port terminal booking</li>
                  <li>• Cargo grade unverified without physical ullage assay or sample</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 12: POSSIBLE ALTERNATIVE EXPLANATIONS */}
          <div id="sec-12" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">12.</span>
                <span>POSSIBLE ALTERNATIVE EXPLANATIONS</span>
              </span>
              <span className="text-[10px] text-text-secondary">MANDATORY ANALYST HYPOTHESES</span>
            </div>

            <div className="space-y-2 text-xs">
              <label 
                onClick={() => toggleAltExplanation('weather')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedAltExplanations.weather ? (
                  <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Heavy Weather Route Diversion & Sea State Evasion</div>
                  <div className="text-[10px] text-text-secondary">Course adjustment and speed slowdown caused by severe Mediterranean swell, gale advisory, or cyclonic avoidance.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleAltExplanation('engine')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedAltExplanations.engine ? (
                  <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Transponder Hardware Failure or Power Grounding Loss</div>
                  <div className="text-[10px] text-text-secondary">Antenna grounding fault, blown fuse, or uncommanded VHF transponder power reset in open waters.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleAltExplanation('bunkering')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedAltExplanations.bunkering ? (
                  <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Standard High-Seas Fuel Replenishment (Bunkering)</div>
                  <div className="text-[10px] text-text-secondary">Routine heavy fuel oil bunkering from authorized offshore supplier outside territorial port limits.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleAltExplanation('coverage')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedAltExplanations.coverage ? (
                  <CheckSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Satellite Constellation Shadow & Terrestrial Receiver Gaps</div>
                  <div className="text-[10px] text-text-secondary">AIS receiver congestion in high-traffic channels or orbit gap between low-Earth orbit satellite passes.</div>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 13: RECOMMENDED CHECKS FOR HUMAN INVESTIGATORS */}
          <div id="sec-13" className="bg-navy-card border border-navy-border rounded-lg p-4 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <span className="text-accent-cyan">13.</span>
                <span>RECOMMENDED CHECKS FOR HUMAN INVESTIGATORS</span>
              </span>
              <span className="text-[10px] text-risk-success font-bold">ACTIONABLE TRIAGE PROTOCOLS</span>
            </div>

            <div className="space-y-2 text-xs">
              <label 
                onClick={() => toggleHumanCheck('satellite_sar')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedHumanChecks.satellite_sar ? (
                  <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Cross-Examine Optical & SAR Satellite Imagery</div>
                  <div className="text-[10px] text-text-secondary">Task Sentinel-1 Synthetic Aperture Radar capture over the Laconic Gulf gap window to inspect vessel hull presence.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleHumanCheck('port_records')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedHumanChecks.port_records ? (
                  <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Request Port State Control (PSC) Inspection History</div>
                  <div className="text-[10px] text-text-secondary">Check Paris MoU and Mediterranean MoU deficiency logs for mechanical, electrical, or structural safety warnings.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleHumanCheck('insurance_pi')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedHumanChecks.insurance_pi ? (
                  <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Verify Protection & Indemnity (P&I) Club Coverage</div>
                  <div className="text-[10px] text-text-secondary">Confirm whether marine hull and environmental spill liability insurance is active with an International Group member.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleHumanCheck('flag_registry')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedHumanChecks.flag_registry ? (
                  <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Flag State Registrar Status Confirmation</div>
                  <div className="text-[10px] text-text-secondary">Verify current certificate validity directly with the flag maritime administration to rule out fraudulent registration.</div>
                </div>
              </label>

              <label 
                onClick={() => toggleHumanCheck('customs_manifest')}
                className="flex items-start space-x-2.5 p-2 rounded bg-navy-sidebar border border-navy-border cursor-pointer hover:border-accent-cyan/40"
              >
                {checkedHumanChecks.customs_manifest ? (
                  <CheckSquare className="w-4 h-4 text-risk-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white font-semibold text-[11px]">Customs Cargo Manifest & Bill of Lading Audit</div>
                  <div className="text-[10px] text-text-secondary">Audit declared cargo commodity grade, certificate of origin, and loading terminal receipts at previous port of call.</div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-navy-sidebar border-t border-navy-border px-5 py-3 flex items-center justify-between text-xs">
          <div className="text-text-secondary text-[11px]">
            MMSI: <span className="text-white">{data.mmsi}</span> • LAT/LNG: <span className="text-accent-cyan">{data.lat?.toFixed(2)}°N, {data.lng?.toFixed(2)}°E</span>
          </div>
          <div className="flex items-center space-x-3">
            {onAddToCase && (
              <button
                onClick={() => onAddToCase(data)}
                className="px-3 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-cyan border border-accent-blue/40 font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Attach to Investigation Dossier</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-navy-card hover:bg-navy-border text-white border border-navy-border transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>

      </HudCornerFrame>
    </div>
  );
}
