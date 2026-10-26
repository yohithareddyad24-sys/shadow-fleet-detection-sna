import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  AlertTriangle, 
  Radio, 
  Share2, 
  Ship, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { fetchMetricsSummary } from '../services/api';
import KpiGlowCard from '../components/effects/KpiGlowCard';
import CountingNumber from '../components/effects/CountingNumber';
import Sparkline from '../components/effects/Sparkline';
import AisTimelineBarcode from '../components/effects/AisTimelineBarcode';
import EventDetailDrawer from '../components/effects/EventDetailDrawer';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function AnalyticsView({ onSelectVessel }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterTier, setFilterTier] = useState('ALL');

  useEffect(() => {
    fetchMetricsSummary().then(data => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  const TIER_COLORS = {
    CRITICAL: '#FF5C65',
    ELEVATED: '#F5B942',
    MODERATE: '#4285F4',
    BASELINE: '#39D98A',
  };

  // 30-day Anomaly Index Timeline with gradient and brush/zoom
  const anomalyTimelineData = [
    { day: "Oct 01", index: 0.28, criticals: 1, gaps: 3 },
    { day: "Oct 03", index: 0.31, criticals: 1, gaps: 5 },
    { day: "Oct 05", index: 0.35, criticals: 2, gaps: 7 },
    { day: "Oct 08", index: 0.42, criticals: 2, gaps: 8 },
    { day: "Oct 11", index: 0.39, criticals: 2, gaps: 6 },
    { day: "Oct 14", index: 0.48, criticals: 3, gaps: 11 },
    { day: "Oct 17", index: 0.44, criticals: 2, gaps: 9 },
    { day: "Oct 20", index: 0.52, criticals: 4, gaps: 14 },
    { day: "Oct 22", index: 0.49, criticals: 3, gaps: 12 },
    { day: "Oct 24", index: 0.58, criticals: 4, gaps: 16 },
    { day: "Oct 26", index: 0.61, criticals: 5, gaps: 18 },
  ];

  // Speed vs Kinematics chart with gap window shaded as translucent band
  const speedKinematicsData = [
    { time: "00:00", speed: 12.2, heading: 140, state: "CRUISING" },
    { time: "04:00", speed: 11.8, heading: 142, state: "CRUISING" },
    { time: "08:00", speed: 6.5, heading: 145, state: "SLOWDOWN" },
    { time: "12:00", speed: 1.1, heading: 150, state: "BLACKOUT_START" },
    { time: "16:00", speed: 0.8, heading: 148, state: "DARK_STS" },
    { time: "20:00", speed: 0.6, heading: 152, state: "DARK_STS" },
    { time: "24:00", speed: 1.2, heading: 150, state: "BLACKOUT_END" },
    { time: "28:00", speed: 7.2, heading: 135, state: "REACCELERATION" },
    { time: "32:00", speed: 11.4, heading: 138, state: "NOMINAL" },
  ];

  const pieData = [
    { name: 'Critical Monitoring', value: metrics?.critical_count || 2, color: '#FF5C65' },
    { name: 'Elevated Attention', value: metrics?.elevated_count || 3, color: '#F5B942' },
    { name: 'Moderate Interaction', value: 4, color: '#4285F4' },
    { name: 'Baseline Legitimate', value: 3, color: '#39D98A' },
  ];

  const incidentLog = [
    { time: "2026-10-26 21:40 UTC", vessel: "MOCK_NEPTUNE_FEEDER", type: "AIS_GAP_DETECTED", desc: "Transponder blackout in Laconic Gulf STS anchorage zone (12.5h)", severity: "ELEVATED", location: "Laconic Gulf Waters (36.42N, 22.85E)" },
    { time: "2026-10-26 19:15 UTC", vessel: "MOCK_PACIFIC_STAR", type: "STS_RENDEZVOUS", desc: "Maintained 0.03 nm proximity with MOCK_AEGEAN_BRIDGE for 22.0h off Malta", severity: "HIGH", location: "Malta Hurd's Bank (35.95N, 14.62E)" },
    { time: "2026-10-26 14:02 UTC", vessel: "MOCK_BALTIC_RUNNER", type: "SPEED_DISCREPANCY", desc: "Kinematic anomaly: 28 kn calculated speed vs 11 kn broadcast capability in Skagerrak", severity: "ELEVATED", location: "Skagerrak Approaches (57.72N, 11.96E)" },
    { time: "2026-10-26 08:30 UTC", vessel: "MOCK_OCEAN_SHADOW", type: "DRAUGHT_VARIANCE", desc: "Draught increased by +2.8m following 14h unmonitored passage", severity: "HIGH", location: "Eastern Mediterranean (34.20N, 28.50E)" },
    { time: "2026-10-25 23:10 UTC", vessel: "MOCK_ATLANTIC_PEARL", type: "LOITERING_ALERT", desc: "Stationary loitering pattern near Gibraltar Strait eastern anchorage (9h)", severity: "MODERATE", location: "Strait of Gibraltar (36.12N, -5.35W)" },
  ];

  const handleRowClick = (item) => {
    setSelectedEvent(item);
    setDrawerOpen(true);
  };

  return (
    <div className="w-full h-full p-4 flex flex-col overflow-y-auto font-mono text-text-primary select-none space-y-4">
      
      {/* Top Banner with HUD Brackets */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex items-center justify-between glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>MARITIME INTELLIGENCE SOC // ANOMALY ANALYTICS & FLEET METRICS</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Aggregated Social Network Analysis indices, AIS transmission dark gaps, and flag-of-convenience distributions.
          </p>
        </div>

        <div className="text-[11px] text-text-secondary flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-accent-cyan" />
          <span>REAL-TIME AGGREGATION WINDOW: 30 DAYS</span>
        </div>
      </HudCornerFrame>

      {/* 5.4 KPI Cards with cursor-following radial highlight, CountingNumber & Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1 */}
        <KpiGlowCard>
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>TOTAL MONITORED FLEET</span>
            <Ship className="w-3.5 h-3.5 text-accent-cyan" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <CountingNumber 
              value={metrics?.total_vessels || 12} 
              className="text-3xl font-bold text-white" 
            />
            <Sparkline data={[8, 9, 10, 11, 10, 12, 12]} color="#20D5E8" width={70} height={20} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between">
            <span>Across 10 distinct flag registries</span>
            <span className="text-accent-cyan">Active</span>
          </div>
        </KpiGlowCard>

        {/* KPI 2 */}
        <KpiGlowCard accentColor="#F5B942">
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>ELEVATED / CRITICAL TIERS</span>
            <ShieldAlert className="w-3.5 h-3.5 text-risk-warning" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <CountingNumber 
              value={(metrics?.critical_count || 0) + (metrics?.elevated_count || 3)} 
              className="text-3xl font-bold text-risk-warning" 
            />
            <Sparkline data={[2, 3, 3, 4, 3, 5, 5]} color="#F5B942" width={70} height={20} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between">
            <span>Requiring analyst priority review</span>
            <span className="text-risk-warning">Action</span>
          </div>
        </KpiGlowCard>

        {/* KPI 3 */}
        <KpiGlowCard accentColor="#FF5C65">
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>TOTAL DARK AIS GAPS</span>
            <Radio className="w-3.5 h-3.5 text-risk-alert" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <CountingNumber 
              value={metrics?.total_dark_gaps_reported || 61} 
              className="text-3xl font-bold text-risk-alert" 
            />
            <Sparkline data={[34, 38, 42, 45, 52, 58, 61]} color="#FF5C65" width={70} height={20} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between">
            <span>Unmonitored corridor blackouts</span>
            <span className="text-risk-alert">+14% 30d</span>
          </div>
        </KpiGlowCard>

        {/* KPI 4 */}
        <KpiGlowCard accentColor="#4285F4">
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
            <span>SPOOFING INCIDENTS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-accent-blue" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <CountingNumber 
              value={metrics?.total_spoofing_incidents || 22} 
              className="text-3xl font-bold text-accent-cyan" 
            />
            <Sparkline data={[12, 14, 16, 15, 18, 20, 22]} color="#4285F4" width={70} height={20} />
          </div>
          <div className="text-[10px] text-text-secondary flex justify-between">
            <span>Kinematic broadcast mismatches</span>
            <span className="text-accent-blue">GPS/AIS</span>
          </div>
        </KpiGlowCard>
      </div>

      {/* 5.4 Charts Grid: Donut + Line/Area Chart with Brush & Glow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* 5.4 Donut Chart: Animated sweep-in, center label with total count, hover expands segment */}
        <div className="lg:col-span-5 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel space-y-3 glass-panel">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <PieIcon className="w-3.5 h-3.5 text-accent-cyan" />
              <span>FLEET ANOMALY TIER DONUT</span>
            </span>
            <span className="text-[10px] text-text-secondary">HOVER SEGMENT</span>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            {/* Center Label with Total Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white font-mono">
                {metrics?.total_vessels || 12}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                TOTAL SHIPS
              </span>
            </div>

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
                        transition: 'transform 0.25s ease',
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
                            Count: {p.value} vessels ({((p.value / 12) * 100).toFixed(0)}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend linked to filtering */}
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
        </div>

        {/* 5.4 Line/Area Chart: Gradient fills, glowing line stroke, crosshair tooltip, Brush/Zoom */}
        <div className="lg:col-span-7 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel space-y-3 glass-panel">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
              <span>30-DAY COMPOSITE ANOMALY TREND (BRUSH & ZOOM)</span>
            </span>
            <span className="text-[10px] text-text-secondary font-mono">
              RANGE SELECTOR ACTIVE
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={anomalyTimelineData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20D5E8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#20D5E8" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#20D5E8" floodOpacity="0.75" />
                  </filter>
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
                          <div className="text-risk-alert">Active Criticals: {payload[0].payload.criticals}</div>
                          <div className="text-risk-warning">Dark Gaps: {payload[0].payload.gaps}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="index" 
                  stroke="#20D5E8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#areaGradient)" 
                  filter="url(#lineGlow)"
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Brush 
                  dataKey="day" 
                  height={22} 
                  stroke="#20D5E8" 
                  fill="#0B1220"
                  tickFormatter={(t) => t}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-text-secondary text-right">
            Drag the bottom brush handles to zoom timeline interval.
          </div>
        </div>

      </div>

      {/* 5.4 Speed & Kinematics Chart: Reference Lines & Shaded Gap Translucent Band */}
      <div className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel space-y-3 glass-panel">
        <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-risk-warning" />
            <span>KINEMATIC SPEED PROFILE WITH TRANSLUCENT AIS BLACKOUT BAND</span>
          </span>
          <span className="text-[10px] text-risk-alert font-bold">
            SHADED WINDOW: AIS TRANSMISSION CESSATION
          </span>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={speedKinematicsData}>
              <defs>
                <linearGradient id="speedBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={10} unit=" kn" domain={[0, 16]} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-panel p-2.5 rounded text-xs font-mono">
                        <div className="font-bold text-accent-cyan">Time: {label}</div>
                        <div className="text-white">Speed: {payload[0].value} knots</div>
                        <div className="text-text-secondary">Heading: {payload[0].payload.heading}°</div>
                        <div className="text-risk-warning font-semibold">State: {payload[0].payload.state}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* 5.4 Shaded Gap Window as Translucent Band */}
              <ReferenceArea 
                x1="12:00" 
                x2="24:00" 
                fill="#FF5C65" 
                fillOpacity={0.16} 
                stroke="#FF5C65"
                strokeDasharray="4 4"
                label={{ value: 'DARK AIS BLACKOUT (12.0H UNMONITORED)', fill: '#FF5C65', fontSize: 10, position: 'insideTop' }}
              />

              {/* Reference line for loitering threshold */}
              <ReferenceLine y={2.0} stroke="#F5B942" strokeDasharray="3 3" label={{ value: 'LOITERING THRESHOLD (2.0 kn)', fill: '#F5B942', fontSize: 9 }} />

              <Area 
                type="monotone" 
                dataKey="speed" 
                stroke="#4285F4" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#speedBandGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5.4 AIS Transmission Timeline Barcode Visualization */}
      <AisTimelineBarcode 
        hours={48} 
        vesselName="Fleet Composite" 
        gapCount={4} 
        className="p-4 bg-navy-sidebar border border-navy-border rounded-lg shadow-panel glass-panel"
      />

      {/* 5.6 Live Incident Surveillance Log with slide-in EventDetailDrawer */}
      <div className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel space-y-3 glass-panel">
        <div className="flex items-center justify-between pb-2 border-b border-navy-border text-xs">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-accent-cyan" />
            <span>OPERATIONAL SURVEILLANCE FEED & ANOMALY EVENTS</span>
          </span>
          <span className="text-[10px] text-accent-cyan font-bold animate-pulse">
            ● CLICK EVENT TO INSPECT EVIDENCE TRAIL
          </span>
        </div>

        <div className="space-y-2">
          {incidentLog.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleRowClick(item)}
              className="p-2.5 rounded bg-navy-card/80 border border-navy-border flex flex-col md:flex-row md:items-center justify-between text-xs gap-2 hover:bg-navy-elevated/70 transition-colors cursor-pointer group hover:border-accent-cyan/40"
            >
              <div className="flex items-start md:items-center space-x-3">
                <span className="text-[10px] text-text-secondary">{item.time}</span>
                <span className="font-bold text-accent-cyan group-hover:underline flex items-center space-x-1">
                  <span>{item.vessel}</span>
                  <ChevronRight className="w-3 h-3 text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-navy-elevated border border-navy-border text-text-primary">
                  {item.type}
                </span>
                <span className="text-text-secondary text-[11px] truncate max-w-md">{item.desc}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase shrink-0 ${
                  item.severity === 'HIGH' ? 'bg-risk-alert/20 text-risk-alert border-risk-alert/40' :
                  item.severity === 'ELEVATED' ? 'bg-risk-warning/20 text-risk-warning border-risk-warning/40' :
                  'bg-accent-blue/20 text-accent-cyan border-accent-blue/40'
                }`}>
                  {item.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5.6 Slide-in Event Detail Drawer with Vertical Timeline of Evidence */}
      <EventDetailDrawer 
        event={selectedEvent}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onInspectVessel={(evt) => {
          setDrawerOpen(false);
          if (onSelectVessel) {
            onSelectVessel({ vessel_name: evt.vessel || evt.vessel_name, mmsi: "999000001" });
          }
        }}
      />

    </div>
  );
}
