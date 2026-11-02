import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Layers, 
  Radio, 
  AlertTriangle, 
  Crosshair, 
  Anchor, 
  Share2, 
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Radar as RadarIcon,
  Activity,
  Compass,
  X,
  Search,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Clock,
  Eye,
  Ship,
  Info
} from 'lucide-react';
import { MOCK_STS_ZONES, MOCK_GAP_CORRIDORS } from '../data/mockData';
import { DEMO_ENCOUNTERS } from '../services/demo/demoEncounters';
import { getDemoTrajectory } from '../services/demo/demoTrajectories';
import RadarSweepOverlay from '../components/effects/RadarSweepOverlay';
import HudCornerFrame from '../components/effects/HudCornerFrame';

const MAJOR_PORTS_AND_HOTSPOTS = [
  { name: "Laconic Gulf Anchorage (GR)", lat: 36.45, lng: 22.88, type: "STS_ANCHORAGE", desc: "Primary STS crude transshipment zone in southern Peloponnese" },
  { name: "Malta Hurd's Bank", lat: 35.92, lng: 14.56, type: "BUNKERING_ZONE", desc: "Offshore bunkering and STS rendezvous zone outside territorial waters" },
  { name: "Strait of Gibraltar (East)", lat: 36.12, lng: -5.35, type: "TRANSIT_CHOKEPOINT", desc: "Eastern Mediterranean gateway with dense holding patterns" },
  { name: "Skagerrak Approaches (DK/NO)", lat: 57.72, lng: 11.96, type: "DARK_CORRIDOR", desc: "Northern Baltic transit corridor characterized by recurring transponder blackouts" },
  { name: "Singapore Eastern Anchorage", lat: 1.30, lng: 104.05, type: "MAJOR_PORT", desc: "Global transshipment and refueling hub with dense vessel traffic" },
  { name: "Port of Algeciras (ES)", lat: 36.13, lng: -5.44, type: "MAJOR_PORT", desc: "Major container and cargo terminal at Mediterranean entrance" },
  { name: "Port of Piraeus (GR)", lat: 37.94, lng: 23.63, type: "MAJOR_PORT", desc: "Primary Greek commercial cargo and tanker port" },
];

export default function GeospatialView({ 
  vessels = [], 
  onSelectVessel, 
  selectedVessel, 
  acoRoute,
  onClearAcoRoute 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    vessels: null,
    stsZones: null,
    gapCorridors: null,
    encounters: null,
    trajectories: null,
    ports: null,
    heatmap: null,
    acoPath: null,
    playbackMarker: null,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterGapStatus, setFilterGapStatus] = useState('ALL'); // 'ALL', 'WITH_GAPS', 'NO_GAPS'
  const [filterEncounterStatus, setFilterEncounterStatus] = useState('ALL'); // 'ALL', 'IN_ENCOUNTER'
  const [filterFlag, setFilterFlag] = useState('ALL');
  const [timeRange, setTimeRange] = useState('30d'); // '24h', '48h', '7d', '30d'
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Layer Visibility States
  const [showVessels, setShowVessels] = useState(true);
  const [showStsZones, setShowStsZones] = useState(true);
  const [showGapCorridors, setShowGapCorridors] = useState(true);
  const [showEncounters, setShowEncounters] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAcoPath, setShowAcoPath] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);

  // Telemetry HUD state
  const [cursorCoords, setCursorCoords] = useState({ lat: '36.42', lng: '22.85' });
  const [mapZoom, setMapZoom] = useState(5);

  // Trajectory Playback Scrubber State
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackPlaying, setPlaybackPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 20x
  const [playbackPoints, setPlaybackPoints] = useState([]);
  const playbackTimerRef = useRef(null);

  // Distinct flags & types for filters
  const distinctFlags = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.flag))].sort(), [vessels]);
  const distinctTypes = useMemo(() => ['ALL', ...new Set(vessels.map(v => v.vessel_type))].sort(), [vessels]);

  // Filtered vessels based on active criteria
  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      // Search by Name, MMSI, IMO
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          v.vessel_name.toLowerCase().includes(q) ||
          v.mmsi.includes(q) ||
          (v.imo && String(v.imo).includes(q)) ||
          v.flag.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filter by type
      if (filterType !== 'ALL' && v.vessel_type !== filterType) return false;

      // Filter by Tier
      if (filterTier !== 'ALL' && v.risk_tier !== filterTier) return false;

      // Filter by AIS gap status
      if (filterGapStatus === 'WITH_GAPS' && (v.ais_gap_count || 0) <= 0) return false;
      if (filterGapStatus === 'NO_GAPS' && (v.ais_gap_count || 0) > 0) return false;

      // Filter by encounter status
      if (filterEncounterStatus === 'IN_ENCOUNTER') {
        const inEncounter = DEMO_ENCOUNTERS.some(e => e.source_mmsi === v.mmsi || e.target_mmsi === v.mmsi);
        if (!inEncounter) return false;
      }

      // Filter by flag
      if (filterFlag !== 'ALL' && v.flag !== filterFlag) return false;

      return true;
    });
  }, [vessels, searchQuery, filterType, filterTier, filterGapStatus, filterEncounterStatus, filterFlag]);

  const hasActiveFilters = searchQuery || filterType !== 'ALL' || filterTier !== 'ALL' || filterGapStatus !== 'ALL' || filterEncounterStatus !== 'ALL' || filterFlag !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterTier('ALL');
    setFilterGapStatus('ALL');
    setFilterEncounterStatus('ALL');
    setFilterFlag('ALL');
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Mediterranean corridor anchor (36.0, 20.0), Zoom: 5
    const map = L.map(mapContainerRef.current, {
      center: [36.0, 20.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark Basemap with CARTO Dark Matter and correct OSM / CARTO attribution
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(map);

    // Mouse movement coordinates
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: e.latlng.lat.toFixed(4),
        lng: e.latlng.lng.toFixed(4),
      });
    });

    map.on('zoomend', () => {
      setMapZoom(map.getZoom());
    });

    // Initialize layer groups in order
    layersRef.current.heatmap = L.layerGroup().addTo(map);
    layersRef.current.stsZones = L.layerGroup().addTo(map);
    layersRef.current.gapCorridors = L.layerGroup().addTo(map);
    layersRef.current.encounters = L.layerGroup().addTo(map);
    layersRef.current.ports = L.layerGroup().addTo(map);
    layersRef.current.trajectories = L.layerGroup().addTo(map);
    layersRef.current.acoPath = L.layerGroup().addTo(map);
    layersRef.current.vessels = L.layerGroup().addTo(map);
    layersRef.current.playbackMarker = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Anomaly Density Heatmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.heatmap) return;

    layersRef.current.heatmap.clearLayers();

    if (showHeatmap && filteredVessels.length > 0) {
      filteredVessels.forEach(v => {
        const risk = v.composite_risk_score || 0.1;
        const radius = Math.max(risk * 130000, 40000);
        const heatColor = risk >= 0.65 ? '#FF5C65' : risk >= 0.45 ? '#F5B942' : '#00D4FF';

        const circle = L.circle([v.lat, v.lng], {
          radius: radius,
          color: 'transparent',
          fillColor: heatColor,
          fillOpacity: Math.min(risk * 0.4, 0.4),
          weight: 0,
        });

        circle.bindTooltip(`Density Risk: ${(risk * 100).toFixed(0)}% (${v.vessel_name})`, {
          direction: 'top',
          className: 'glass-panel text-xs font-mono',
        });

        layersRef.current.heatmap.addLayer(circle);
      });
    }
  }, [showHeatmap, filteredVessels]);

  // Update STS Rendezvous Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.stsZones) return;

    layersRef.current.stsZones.clearLayers();

    if (showStsZones) {
      MOCK_STS_ZONES.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius_km * 1000,
          color: zone.alert_level === 'HIGH' ? '#FF5C65' : '#F5B942',
          fillColor: zone.alert_level === 'HIGH' ? '#FF5C65' : '#F5B942',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 6',
        });

        circle.bindPopup(`
          <div class="glass-panel" style="font-family: 'JetBrains Mono', monospace; min-width: 220px; padding: 6px;">
            <div style="font-size: 10px; font-weight: 700; color: #00D4FF; margin-bottom: 2px;">
              STS HOTSPOT // ${zone.alert_level}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              ${zone.name}
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 4px;">
              ${zone.description}
            </div>
            <div style="font-size: 10px; color: #F5B942;">
              RADIUS: ${zone.radius_km} KM
            </div>
          </div>
        `);

        layersRef.current.stsZones.addLayer(circle);
      });
    }
  }, [showStsZones]);

  // Update Dark AIS Gap Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.gapCorridors) return;

    layersRef.current.gapCorridors.clearLayers();

    if (showGapCorridors) {
      MOCK_GAP_CORRIDORS.forEach(corr => {
        const polyline = L.polyline([corr.from, corr.to], {
          color: '#FF5C65',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.85,
          className: 'ais-gap-flicker',
        });

        polyline.bindPopup(`
          <div class="glass-panel" style="font-family: 'JetBrains Mono', monospace; min-width: 220px; padding: 6px;">
            <div style="font-size: 10px; font-weight: 700; color: #FF5C65; margin-bottom: 2px;">
              DARK AIS TRANSMISSION GAP
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">
              ${corr.name}
            </div>
            <div style="font-size: 10px; color: #94A3B8; margin-bottom: 4px;">
              Blackout Duration: <span style="color: #F5B942; font-weight: bold;">${corr.duration}</span>
            </div>
            <div style="font-size: 9px; color: #00D4FF;">
              MMSI: ${corr.vessel_mmsi} | Status: ${corr.status}
            </div>
          </div>
        `);

        layersRef.current.gapCorridors.addLayer(polyline);

        // "Signal Lost" Origin Marker with expanding ripple
        const signalLostIcon = L.divIcon({
          className: 'signal-lost-wrapper',
          html: `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
              <div class="signal-lost-ripple-fx" style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #FF5C65;"></div>
              <div style="width: 12px; height: 12px; background: #FF5C65; border-radius: 50%; box-shadow: 0 0 10px #FF5C65; border: 1.5px solid #FFFFFF;"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const lostMarker = L.marker(corr.from, { icon: signalLostIcon });
        lostMarker.bindTooltip(`Signal Lost: ${corr.duration}`, { direction: 'top', className: 'glass-panel text-xs font-mono' });
        layersRef.current.gapCorridors.addLayer(lostMarker);
      });
    }
  }, [showGapCorridors]);

  // Update Major Ports & Hotspots Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.ports) return;

    layersRef.current.ports.clearLayers();

    if (showPorts) {
      MAJOR_PORTS_AND_HOTSPOTS.forEach(port => {
        const portIcon = L.divIcon({
          className: 'port-marker-wrapper',
          html: `
            <div style="
              width: 18px; 
              height: 18px; 
              border-radius: 3px; 
              background: #111B2D; 
              border: 1px solid #00D4FF; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 0 6px rgba(0,212,255,0.4);
            ">
              <span style="font-size: 9px; color: #00D4FF; font-weight: bold;">⚓</span>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([port.lat, port.lng], { icon: portIcon });
        marker.bindPopup(`
          <div class="glass-panel" style="font-family: 'JetBrains Mono', monospace; min-width: 200px; padding: 4px;">
            <div style="font-size: 9px; color: #00D4FF; font-weight: 700; text-transform: uppercase;">
              PORT / ANCHORAGE
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #FFF; margin: 2px 0;">
              ${port.name}
            </div>
            <div style="font-size: 10px; color: #94A3B8;">
              ${port.desc}
            </div>
            <div style="font-size: 9px; color: #39D98A; margin-top: 4px;">
              Pos: ${port.lat.toFixed(2)}°N, ${port.lng.toFixed(2)}°E
            </div>
          </div>
        `);

        layersRef.current.ports.addLayer(marker);
      });
    }
  }, [showPorts]);

  // Update STS Encounters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.encounters) return;

    layersRef.current.encounters.clearLayers();

    if (showEncounters && vessels.length > 0) {
      DEMO_ENCOUNTERS.slice(0, 6).forEach(enc => {
        const v1 = vessels.find(v => v.mmsi === enc.source_mmsi);
        const v2 = vessels.find(v => v.mmsi === enc.target_mmsi);

        if (v1 && v2) {
          const latlngs = [[v1.lat, v1.lng], [v2.lat, v2.lng]];
          const midpoint = [(v1.lat + v2.lat) / 2, (v1.lng + v2.lng) / 2];

          const connector = L.polyline(latlngs, {
            color: '#F5B942',
            weight: 2,
            dashArray: '4, 6',
            opacity: 0.75,
          });

          const radiusMeters = (enc.avg_distance_nm || 0.1) * 1852;
          const proximityCircle = L.circle(midpoint, {
            radius: Math.max(radiusMeters, 1500),
            color: '#F5B942',
            fillColor: '#F5B942',
            fillOpacity: 0.18,
            weight: 1,
          });

          const midpointIcon = L.divIcon({
            className: 'sts-midpoint-wrapper',
            html: `
              <div style="
                width: 14px; 
                height: 14px; 
                border-radius: 50%; 
                background: #F5B942; 
                border: 2px solid #FFFFFF;
                box-shadow: 0 0 8px #F5B942;
              ">
              </div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const midpointMarker = L.marker(midpoint, { icon: midpointIcon });
          midpointMarker.bindPopup(`
            <div class="glass-panel" style="font-family: 'JetBrains Mono', monospace; min-width: 220px; padding: 6px;">
              <div style="font-size: 10px; font-weight: 700; color: #F5B942; margin-bottom: 2px;">
                STS BILATERAL RENDEZVOUS
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #FFFFFF;">
                ${enc.source_name} ↔ ${enc.target_name}
              </div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">
                Duration: <strong style="color: #FFF;">${enc.avg_duration_hours}h</strong> | Separation: <strong style="color: #FFF;">${enc.avg_distance_nm} nm</strong>
              </div>
              <div style="font-size: 10px; color: #00D4FF; margin-top: 2px;">
                Transfer Risk: ${(enc.interaction_risk * 100).toFixed(0)}%
              </div>
            </div>
          `);

          layersRef.current.encounters.addLayer(connector);
          layersRef.current.encounters.addLayer(proximityCircle);
          layersRef.current.encounters.addLayer(midpointMarker);
        }
      });
    }
  }, [showEncounters, vessels]);

  // Update Trajectories
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.trajectories) return;

    layersRef.current.trajectories.clearLayers();

    if (showTrajectories && filteredVessels.length > 0) {
      const targets = selectedVessel 
        ? [selectedVessel]
        : filteredVessels.filter(v => v.risk_tier === 'CRITICAL_MONITORING' || v.risk_tier === 'ELEVATED_ATTENTION').slice(0, 4);

      targets.forEach(v => {
        const traj = getDemoTrajectory(v.mmsi, v.lat, v.lng, v.speed, v.heading);
        const latlngs = traj.map(pt => [pt.lat, pt.lng]);

        if (latlngs.length > 1) {
          const glowPolyline = L.polyline(latlngs, {
            color: '#00D4FF',
            weight: 6,
            opacity: 0.25,
          });

          const cometPolyline = L.polyline(latlngs, {
            color: '#00D4FF',
            weight: 2.5,
            className: 'trajectory-comet-path',
            opacity: 0.9,
          });

          cometPolyline.bindTooltip(`Trajectory: ${v.vessel_name}`, {
            direction: 'top',
            className: 'glass-panel text-xs font-mono',
          });

          layersRef.current.trajectories.addLayer(glowPolyline);
          layersRef.current.trajectories.addLayer(cometPolyline);
        }
      });
    }
  }, [showTrajectories, filteredVessels, selectedVessel]);

  // Update Vessel Markers: SVG ship glyph rotated to heading, colored by anomaly tier
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.vessels) return;

    layersRef.current.vessels.clearLayers();

    if (showVessels) {
      filteredVessels.forEach(v => {
        const isSelected = selectedVessel?.mmsi === v.mmsi;

        // Specific anomaly colors:
        // Normal = #39D98A, Anomalous = #4285F4, Elevated = #F5B942, High-priority = #FF5C65
        let markerColor = '#39D98A';
        const isHigh = v.risk_tier === 'CRITICAL_MONITORING';
        const isElevated = v.risk_tier === 'ELEVATED_ATTENTION';
        const isAnomalous = v.risk_tier === 'MODERATE_INTERACTION';

        if (isHigh) markerColor = '#FF5C65';
        else if (isElevated) markerColor = '#F5B942';
        else if (isAnomalous) markerColor = '#4285F4';

        const shouldPulse = isHigh || isElevated;

        const iconHtml = `
          <div style="
            position: relative;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${isSelected ? `
              <div class="vessel-selected-halo" style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                border: 2px solid #00D4FF;
              "></div>
            ` : ''}

            ${shouldPulse ? `
              <div class="vessel-pulse-ring" style="color: ${markerColor};"></div>
            ` : ''}

            <div style="
              width: 24px;
              height: 24px;
              background: #0B1220;
              border: 2px solid ${markerColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 12px ${markerColor}66;
            ">
              <svg 
                style="width: 14px; height: 14px; transform: rotate(${v.heading !== undefined ? v.heading : 0}deg); color: ${markerColor};" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              >
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'tactical-vessel-marker',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([v.lat, v.lng], { icon: customIcon });

        marker.on('click', () => {
          if (onSelectVessel) onSelectVessel(v);
        });

        // Glass-style Popup strictly showing only supplied fields & labeled "last reported positions"
        const speedText = v.speed !== undefined ? `${v.speed} kn` : 'Not Reported';
        const headingText = v.heading !== undefined ? `${v.heading}°` : 'Not Reported';
        const lastPositionText = `${v.lat.toFixed(4)}°N, ${v.lng.toFixed(4)}°E`;
        const lastAisText = v.eta || '2026-10-26 18:30 UTC';
        const riskPct = v.composite_risk_score !== undefined ? `${(v.composite_risk_score * 100).toFixed(0)}%` : 'N/A';

        marker.bindPopup(`
          <div class="glass-panel" style="font-family: 'JetBrains Mono', monospace; min-width: 250px; padding: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; color: #00D4FF; font-weight: 700;">
                MMSI: ${v.mmsi}
              </span>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; background: ${markerColor}22; color: ${markerColor}; border: 1px solid ${markerColor}66;">
                ${v.risk_tier.replace(/_/g, ' ')}
              </span>
            </div>

            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 1px;">
              ${v.vessel_name}
            </div>

            <div style="font-size: 10px; color: #94A3B8; margin-bottom: 6px;">
              ${v.flag} • ${v.vessel_type} ${v.imo ? `• IMO: ${v.imo}` : ''}
            </div>

            <div style="font-size: 9px; color: #F5B942; background: rgba(245,185,66,0.1); border: 1px solid rgba(245,185,66,0.3); border-radius: 3px; padding: 3px 6px; margin-bottom: 6px;">
              POSITION STATUS: LAST REPORTED POSITIONS
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; background: rgba(7, 11, 20, 0.85); padding: 6px; border-radius: 4px; margin-bottom: 8px; border: 1px solid #243249;">
              <div>Last Position: <span style="color: #FFF; font-weight: bold;">${v.lat.toFixed(2)}N, ${v.lng.toFixed(2)}E</span></div>
              <div>Last AIS Update: <span style="color: #FFF;">Recent</span></div>
              <div>Speed: <span style="color: #FFF;">${speedText}</span></div>
              <div>Heading: <span style="color: #FFF;">${headingText}</span></div>
              <div>AIS Gaps: <span style="color: #F5B942;">${v.ais_gap_count ?? 0}</span></div>
              <div>Anomaly Score: <span style="color: ${markerColor}; font-weight: bold;">${riskPct}</span></div>
            </div>

            <button 
              id="btn-inspect-modal-${v.mmsi}" 
              style="
                width: 100%;
                padding: 6px 10px;
                background: #162338;
                border: 1px solid #00D4FF;
                border-radius: 4px;
                color: #00D4FF;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
              "
            >
              Open Vessel Details →
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-modal-${v.mmsi}`);
          if (btn) {
            btn.onclick = () => onSelectVessel(v);
          }
        });

        layersRef.current.vessels.addLayer(marker);
      });
    }
  }, [filteredVessels, showVessels, selectedVessel, onSelectVessel]);

  // Smooth flyTo on selected vessel
  useEffect(() => {
    if (!selectedVessel || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedVessel.lat, selectedVessel.lng], 9, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedVessel]);

  // Fit map to data bounds
  const fitToData = () => {
    const map = mapInstanceRef.current;
    if (!map || filteredVessels.length === 0) return;

    const bounds = L.latLngBounds(filteredVessels.map(v => [v.lat, v.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  };

  // Reset map view to Mediterranean central view
  const resetMapView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([36.0, 20.0], 5, { duration: 1.0 });
  };

  // Zoom controls
  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();

  // Trajectory Playback Scrubber Setup
  const startTrajectoryPlayback = useCallback((vesselToPlay) => {
    const target = vesselToPlay || selectedVessel || filteredVessels[0] || vessels[0];
    if (!target) return;

    const traj = getDemoTrajectory(target.mmsi, target.lat, target.lng, target.speed, target.heading);
    setPlaybackPoints(traj);
    setPlaybackProgress(0);
    setPlaybackActive(true);
    setPlaybackPlaying(true);
  }, [selectedVessel, filteredVessels, vessels]);

  // Playback Loop
  useEffect(() => {
    if (!playbackActive || !playbackPlaying || playbackPoints.length < 2) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    const intervalMs = 100 / playbackSpeed;
    playbackTimerRef.current = setInterval(() => {
      setPlaybackProgress(prev => {
        if (prev >= 100) {
          setPlaybackPlaying(false);
          return 100;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [playbackActive, playbackPlaying, playbackSpeed, playbackPoints]);

  // Update animated Playback marker on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.playbackMarker) return;

    layersRef.current.playbackMarker.clearLayers();

    if (playbackActive && playbackPoints.length >= 2) {
      const totalSegments = playbackPoints.length - 1;
      const progressFraction = playbackProgress / 100;
      const segmentIndex = Math.min(Math.floor(progressFraction * totalSegments), totalSegments - 1);
      const segmentFraction = (progressFraction * totalSegments) - segmentIndex;

      const p1 = playbackPoints[segmentIndex];
      const p2 = playbackPoints[segmentIndex + 1];

      const currentLat = p1.lat + (p2.lat - p1.lat) * segmentFraction;
      const currentLng = p1.lng + (p2.lng - p1.lng) * segmentFraction;

      const isInsideGap = p1.event === 'SPEED_REDUCTION' || p1.event === 'STS_RENDEZVOUS_START';

      const iconHtml = `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: ${isInsideGap ? 0.35 : 1};
          transition: opacity 0.3s ease;
        ">
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px dashed #00D4FF;
            animation: spin 3s linear infinite;
          "></div>
          <div style="
            width: 22px;
            height: 22px;
            background: #00D4FF;
            border-radius: 50%;
            box-shadow: 0 0 16px #00D4FF;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #070B14;
            font-weight: bold;
            font-size: 11px;
          ">
            ▶
          </div>
        </div>
      `;

      const pbMarker = L.marker([currentLat, currentLng], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'playback-vessel-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      });

      pbMarker.bindTooltip(`Replaying: ${p1.timestamp} (${isInsideGap ? '⚠️ AIS GAP FADING' : 'BROADCASTING'})`, {
        direction: 'top',
        className: 'glass-panel text-xs font-mono',
      });

      layersRef.current.playbackMarker.addLayer(pbMarker);
    }
  }, [playbackActive, playbackPoints, playbackProgress]);

  // Jump to Hotspot preset
  const jumpToHotspot = (lat, lng, zoom) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  return (
    <HudCornerFrame className="relative w-full h-full bg-navy-bg select-none overflow-hidden" glow>
      
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Radar Sweep Overlay with range rings */}
      <RadarSweepOverlay active={showRadarSweep} showRings={true} />

      {/* Top Left: Filter Bar & Tactical Layer Toggles */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-auto max-w-sm">
        
        {/* Search & Filter Trigger Bar */}
        <div className="glass-panel rounded-lg p-2.5 shadow-panel space-y-2 text-xs font-mono text-text-primary">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search map vessels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-navy-card border border-navy-border rounded text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-1.5 rounded border transition-colors flex items-center space-x-1 ${
                hasActiveFilters || filtersOpen 
                  ? 'bg-accent-blue/30 text-accent-cyan border-accent-blue/50' 
                  : 'bg-navy-card text-text-secondary border-navy-border hover:text-white'
              }`}
              title="Toggle vessel filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapsible Filter Controls */}
          {filtersOpen && (
            <div className="pt-2 border-t border-navy-border/70 space-y-2 text-[11px] animate-fadeIn">
              {/* Anomaly Category */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">TIER:</span>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="bg-navy-card border border-navy-border rounded px-1.5 py-0.5 text-[11px] text-text-primary"
                >
                  <option value="ALL">All Categories</option>
                  <option value="CRITICAL_MONITORING">Critical Monitoring</option>
                  <option value="ELEVATED_ATTENTION">Elevated Attention</option>
                  <option value="MODERATE_INTERACTION">Moderate Interaction</option>
                  <option value="BASELINE_LEGITIMATE">Baseline Legitimate</option>
                </select>
              </div>

              {/* Vessel Type */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">TYPE:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-navy-card border border-navy-border rounded px-1.5 py-0.5 text-[11px] text-text-primary max-w-[150px]"
                >
                  {distinctTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* AIS Gap Status */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">AIS GAPS:</span>
                <select
                  value={filterGapStatus}
                  onChange={(e) => setFilterGapStatus(e.target.value)}
                  className="bg-navy-card border border-navy-border rounded px-1.5 py-0.5 text-[11px] text-text-primary"
                >
                  <option value="ALL">All Vessels</option>
                  <option value="WITH_GAPS">Has Dark AIS Gaps</option>
                  <option value="NO_GAPS">Continuous AIS Only</option>
                </select>
              </div>

              {/* Encounter Status */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">ENCOUNTER:</span>
                <select
                  value={filterEncounterStatus}
                  onChange={(e) => setFilterEncounterStatus(e.target.value)}
                  className="bg-navy-card border border-navy-border rounded px-1.5 py-0.5 text-[11px] text-text-primary"
                >
                  <option value="ALL">All Vessels</option>
                  <option value="IN_ENCOUNTER">In STS Rendezvous</option>
                </select>
              </div>

              {/* Flag */}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">FLAG:</span>
                <select
                  value={filterFlag}
                  onChange={(e) => setFilterFlag(e.target.value)}
                  className="bg-navy-card border border-navy-border rounded px-1.5 py-0.5 text-[11px] text-text-primary max-w-[150px]"
                >
                  {distinctFlags.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-secondary">WINDOW:</span>
                <div className="flex items-center space-x-1">
                  {['24h', '48h', '7d', '30d'].map(tr => (
                    <button
                      key={tr}
                      onClick={() => setTimeRange(tr)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        timeRange === tr 
                          ? 'bg-accent-cyan text-navy-bg font-bold' 
                          : 'bg-navy-card text-text-secondary hover:text-white'
                      }`}
                    >
                      {tr.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-[10px] text-risk-warning font-bold"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Visible Vessels Counter */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-navy-border/60">
            <span className="text-text-secondary">
              Showing <strong className="text-accent-cyan">{filteredVessels.length}</strong> of {vessels.length} vessels
            </span>
            <span className="text-[10px] text-risk-warning/90 font-bold">
              Last reported positions
            </span>
          </div>
        </div>

        {/* Tactical Layer Toggles Glass Panel */}
        <div className="glass-panel rounded-lg p-2.5 shadow-panel space-y-2 text-xs font-mono text-text-primary">
          <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
            <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>TACTICAL LAYERS</span>
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-accent-cyan" />
                <span>Monitored Fleet</span>
              </span>
              <input
                type="checkbox"
                checked={showVessels}
                onChange={() => setShowVessels(!showVessels)}
                className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-risk-warning" />
                <span>STS Hotspots</span>
              </span>
              <input
                type="checkbox"
                checked={showStsZones}
                onChange={() => setShowStsZones(!showStsZones)}
                className="rounded bg-navy-card border-navy-border text-risk-warning focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-risk-alert" />
                <span>Dark AIS Gaps</span>
              </span>
              <input
                type="checkbox"
                checked={showGapCorridors}
                onChange={() => setShowGapCorridors(!showGapCorridors)}
                className="rounded bg-navy-card border-navy-border text-risk-alert focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#F5B942]" />
                <span>Bilateral Encounters</span>
              </span>
              <input
                type="checkbox"
                checked={showEncounters}
                onChange={() => setShowEncounters(!showEncounters)}
                className="rounded bg-navy-card border-navy-border text-[#F5B942] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                <span>Trajectory Tracks</span>
              </span>
              <input
                type="checkbox"
                checked={showTrajectories}
                onChange={() => setShowTrajectories(!showTrajectories)}
                className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <Anchor className="w-3 h-3 text-accent-cyan" />
                <span>Ports & Anchorages</span>
              </span>
              <input
                type="checkbox"
                checked={showPorts}
                onChange={() => setShowPorts(!showPorts)}
                className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <Flame className="w-3 h-3 text-risk-alert" />
                <span>Anomaly Heatmap</span>
              </span>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={() => setShowHeatmap(!showHeatmap)}
                className="rounded bg-navy-card border-navy-border text-risk-alert focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between space-x-3 cursor-pointer hover:text-white">
              <span className="flex items-center space-x-2">
                <RadarIcon className="w-3 h-3 text-accent-cyan" />
                <span>Radar Sweep Overlay</span>
              </span>
              <input
                type="checkbox"
                checked={showRadarSweep}
                onChange={() => setShowRadarSweep(!showRadarSweep)}
                className="rounded bg-navy-card border-navy-border text-accent-cyan focus:ring-0"
              />
            </label>
          </div>

          <div className="pt-1.5 border-t border-navy-border/60">
            <button
              onClick={() => startTrajectoryPlayback()}
              className="w-full py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-[11px] text-accent-cyan font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Launch Trajectory Replay</span>
            </button>
          </div>
        </div>

        {/* Hotspot Presets Glass Panel */}
        <div className="glass-panel rounded-lg p-2.5 shadow-panel space-y-1.5 text-[11px] font-mono">
          <div className="text-text-secondary font-bold uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Compass className="w-3 h-3 text-accent-cyan" />
            <span>Tactical Hotspots</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => jumpToHotspot(36.45, 22.88, 8)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors"
            >
              Laconic Gulf (GR)
            </button>
            <button
              onClick={() => jumpToHotspot(35.92, 14.56, 8)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors"
            >
              Malta Hurd Bank
            </button>
            <button
              onClick={() => jumpToHotspot(36.10, -5.32, 8)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors"
            >
              Gibraltar Strait
            </button>
            <button
              onClick={() => jumpToHotspot(57.72, 11.96, 7)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors"
            >
              Skagerrak / North
            </button>
            <button
              onClick={() => jumpToHotspot(1.30, 103.90, 8)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-primary hover:text-accent-cyan text-left truncate transition-colors"
            >
              Singapore Strait
            </button>
            <button
              onClick={() => jumpToHotspot(36.0, 20.0, 5)}
              className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-accent-cyan text-left truncate transition-colors"
            >
              Central Med
            </button>
          </div>
        </div>
      </div>

      {/* Top Right: Zoom & Map View Control HUD */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        <div className="glass-panel rounded-lg p-1.5 shadow-panel flex flex-col space-y-1 text-xs">
          <button
            onClick={zoomIn}
            className="p-2 rounded bg-navy-card hover:bg-navy-elevated text-text-secondary hover:text-white border border-navy-border transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded bg-navy-card hover:bg-navy-elevated text-text-secondary hover:text-white border border-navy-border transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-navy-border my-0.5" />
          <button
            onClick={fitToData}
            className="p-2 rounded bg-navy-card hover:bg-navy-elevated text-accent-cyan hover:text-white border border-navy-border transition-colors"
            title="Fit to Filtered Data"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={resetMapView}
            className="p-2 rounded bg-navy-card hover:bg-navy-elevated text-text-secondary hover:text-accent-cyan border border-navy-border transition-colors"
            title="Reset Map View"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Active ACO Route Bar if projected */}
        {acoRoute && (
          <div className="glass-panel border border-accent-cyan/60 rounded-lg p-3 shadow-panel max-w-xs font-mono text-xs text-text-primary animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border/80">
              <div className="flex items-center space-x-2 text-accent-cyan font-bold">
                <GitBranch className="w-4 h-4" />
                <span>ACO PATHWAY</span>
              </div>
              <button 
                onClick={onClearAcoRoute}
                className="text-text-secondary hover:text-white text-[10px]"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Path:</span>
                <span className="text-white font-bold">{acoRoute.source} → {acoRoute.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cumulative Risk:</span>
                <span className="text-risk-alert font-bold">{acoRoute.cumulative_risk}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center Bottom: Trajectory Playback Scrubber Panel */}
      {playbackActive && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-lg p-3 shadow-panel min-w-[360px] max-w-md w-full font-mono text-xs text-text-primary pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-navy-border/70">
            <div className="flex items-center space-x-2 text-accent-cyan font-bold">
              <Activity className="w-4 h-4" />
              <span>TRAJECTORY KINEMATIC REPLAY</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-text-secondary">
                {selectedVessel?.vessel_name || 'Vessel 999000001'}
              </span>
              <button 
                onClick={() => setPlaybackActive(false)}
                className="text-text-secondary hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrubber slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>T-48h</span>
              <span className="text-accent-cyan font-bold">{playbackProgress}% Window</span>
              <span>T-0h (Now)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={playbackProgress}
              onChange={(e) => setPlaybackProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-navy-card rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
            />
          </div>

          {/* Controls: Play/Pause and Speeds */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-navy-border/60">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPlaybackPlaying(!playbackPlaying)}
                className="px-2.5 py-1 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-bold flex items-center space-x-1"
              >
                {playbackPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{playbackPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setPlaybackProgress(0)}
                className="p-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white"
                title="Rewind to start"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-text-secondary mr-1">Speed:</span>
              {[1, 5, 20].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    playbackSpeed === s 
                      ? 'bg-accent-cyan text-navy-bg border-accent-cyan' 
                      : 'bg-navy-card text-text-secondary border-navy-border hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left HUD: Cursor Coordinates, Scale & Anomaly Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto font-mono text-[11px]">
        {/* Cursor Coordinates Panel */}
        <div className="glass-panel rounded-md px-3 py-1.5 text-text-secondary flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-accent-cyan" />
          <span>CURSOR:</span>
          <span className="text-white font-bold">{cursorCoords.lat}°N, {cursorCoords.lng}°E</span>
          <span className="text-navy-border">•</span>
          <span className="text-text-secondary">Z:{mapZoom}</span>
        </div>

        {/* Tactical Anomaly Classification Legend (Glass style) */}
        <div className="flex items-center space-x-3 glass-panel rounded-md px-3 py-1.5 text-text-secondary">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF5C65] animate-pulse" />
            <span className="text-white">High Priority</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5B942]" />
            <span className="text-white">Elevated</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
            <span>Anomalous</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39D98A]" />
            <span>Normal</span>
          </span>
        </div>
      </div>
    </HudCornerFrame>
  );
}
