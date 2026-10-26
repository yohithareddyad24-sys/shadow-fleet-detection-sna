import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, GitBranch } from 'lucide-react';
import MapLayerControls from './MapLayerControls';
import HotspotPresets from './HotspotPresets';
import { MOCK_STS_ZONES, MOCK_GAP_CORRIDORS } from '../../data/mockData';
import { formatCoords } from '../../utils/formatters';

export default function TacticalMap({ 
  vessels = [], 
  selectedMmsi, 
  acoRoute, 
  onClearAcoRoute 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    vessels: null,
    stsZones: null,
    gapCorridors: null,
    acoPath: null,
  });

  const [showVessels, setShowVessels] = useState(true);
  const [showStsZones, setShowStsZones] = useState(true);
  const [showGapCorridors, setShowGapCorridors] = useState(true);
  const [showAcoPath, setShowAcoPath] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ lat: 36.42, lng: 22.85 });

  const navigate = useNavigate();

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [36.0, 20.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      });
    });

    layersRef.current.vessels = L.layerGroup().addTo(map);
    layersRef.current.stsZones = L.layerGroup().addTo(map);
    layersRef.current.gapCorridors = L.layerGroup().addTo(map);
    layersRef.current.acoPath = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size on resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update STS Zones
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
          <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 700; color: #20D5E8; margin-bottom: 2px;">
              STS HOTSPOT // ${zone.alert_level}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              ${zone.name}
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 4px;">
              ${zone.description}
            </div>
            <div style="font-size: 10px; font-family: monospace; color: #F5B942;">
              RADIUS: ${zone.radius_km} KM
            </div>
          </div>
        `);

        layersRef.current.stsZones.addLayer(circle);
      });
    }
  }, [showStsZones]);

  // Update Gap Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.gapCorridors) return;

    layersRef.current.gapCorridors.clearLayers();

    if (showGapCorridors) {
      MOCK_GAP_CORRIDORS.forEach(corr => {
        const polyline = L.polyline([corr.from, corr.to], {
          color: '#FF5C65',
          weight: 2,
          dashArray: '6, 8',
          opacity: 0.8,
        });

        polyline.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 700; color: #FF5C65; margin-bottom: 2px;">
              DARK AIS CORRIDOR
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #FFFFFF;">
              ${corr.name}
            </div>
            <div style="font-size: 11px; font-family: monospace; color: #94A3B8;">
              Duration: ${corr.duration} | MMSI: ${corr.vessel_mmsi}
            </div>
          </div>
        `);

        layersRef.current.gapCorridors.addLayer(polyline);
      });
    }
  }, [showGapCorridors]);

  // Update Vessels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.vessels) return;

    layersRef.current.vessels.clearLayers();

    if (showVessels) {
      vessels.forEach(v => {
        const isSelected = selectedMmsi === v.mmsi;

        let markerColor = '#39D98A';
        if (v.risk_tier === 'CRITICAL_MONITORING') markerColor = '#FF5C65';
        else if (v.risk_tier === 'ELEVATED_ATTENTION') markerColor = '#F5B942';
        else if (v.risk_tier === 'MODERATE_INTERACTION') markerColor = '#4285F4';

        const iconHtml = `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${isSelected ? `
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px dashed #20D5E8;
                animation: spin 6s linear infinite;
              "></div>
            ` : ''}
            <div style="
              width: 22px;
              height: 22px;
              background: #0B1220;
              border: 2px solid ${markerColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px ${markerColor}66;
            ">
              <svg 
                style="width: 14px; height: 14px; transform: rotate(${v.heading || 0}deg); color: ${markerColor};" 
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
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([v.lat, v.lng], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-family: monospace; color: #20D5E8; font-weight: 700;">
                MMSI: ${v.mmsi}
              </span>
              <span style="font-size: 9px; font-family: monospace; font-weight: 700; padding: 2px 5px; border-radius: 3px; background: ${markerColor}22; color: ${markerColor}; border: 1px solid ${markerColor}66;">
                ${v.risk_tier.replace(/_/g, ' ')}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">
              ${v.vessel_name}
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">
              ${v.flag} • ${v.vessel_type}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; font-family: monospace; background: #070B14; padding: 6px; border-radius: 4px; margin-bottom: 8px; border: 1px solid #243249;">
              <div>Speed: <span style="color: #FFF;">${v.speed} kn</span></div>
              <div>Heading: <span style="color: #FFF;">${v.heading}°</span></div>
              <div>AIS Gaps: <span style="color: #F5B942;">${v.ais_gap_count}</span></div>
              <div>Risk: <span style="color: ${markerColor}; font-weight: bold;">${(v.composite_risk_score * 100).toFixed(0)}%</span></div>
            </div>
            <button 
              id="map-popup-btn-${v.mmsi}" 
              style="
                width: 100%;
                padding: 6px 10px;
                background: #162338;
                border: 1px solid #20D5E8;
                border-radius: 4px;
                color: #20D5E8;
                font-size: 11px;
                font-family: monospace;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
              "
            >
              Inspect Intelligence Dossier →
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`map-popup-btn-${v.mmsi}`);
          if (btn) {
            btn.onclick = () => navigate(`/vessels/${v.mmsi}`);
          }
        });

        layersRef.current.vessels.addLayer(marker);
      });
    }
  }, [vessels, showVessels, selectedMmsi, navigate]);

  // Center on selected vessel
  useEffect(() => {
    if (!selectedMmsi || !mapInstanceRef.current) return;
    const v = vessels.find(item => item.mmsi === selectedMmsi);
    if (v) {
      mapInstanceRef.current.flyTo([v.lat, v.lng], 9, { duration: 1.2 });
    }
  }, [selectedMmsi, vessels]);

  // Update Projected ACO Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current.acoPath) return;

    layersRef.current.acoPath.clearLayers();

    if (showAcoPath && acoRoute && acoRoute.hops_with_coords && acoRoute.hops_with_coords.length > 1) {
      const latlngs = acoRoute.hops_with_coords.map(h => [h.lat, h.lng]);

      const glowLine = L.polyline(latlngs, {
        color: '#20D5E8',
        weight: 6,
        opacity: 0.35,
      });

      const pathLine = L.polyline(latlngs, {
        color: '#20D5E8',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.95,
      });

      layersRef.current.acoPath.addLayer(glowLine);
      layersRef.current.acoPath.addLayer(pathLine);

      acoRoute.hops_with_coords.forEach((hop, idx) => {
        const marker = L.circleMarker([hop.lat, hop.lng], {
          radius: 6,
          fillColor: '#20D5E8',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 1,
        });
        marker.bindTooltip(`Hop ${idx + 1}: ${hop.vessel_name}`, { permanent: false, direction: 'top' });
        layersRef.current.acoPath.addLayer(marker);
      });

      map.fitBounds(pathLine.getBounds(), { padding: [60, 60] });
    }
  }, [acoRoute, showAcoPath]);

  const handleSelectHotspot = (lat, lng, zoom) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  return (
    <div className="relative w-full h-full bg-navy-bg select-none overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-auto">
        <MapLayerControls
          showVessels={showVessels}
          setShowVessels={setShowVessels}
          showStsZones={showStsZones}
          setShowStsZones={setShowStsZones}
          showGapCorridors={showGapCorridors}
          setShowGapCorridors={setShowGapCorridors}
          hasAcoRoute={Boolean(acoRoute)}
          showAcoPath={showAcoPath}
          setShowAcoPath={setShowAcoPath}
        />
        <HotspotPresets onSelectHotspot={handleSelectHotspot} />
      </div>

      {/* Top Right ACO Route Overlay */}
      {acoRoute && (
        <div className="absolute top-4 right-4 z-10 bg-navy-sidebar/95 border border-accent-cyan/60 rounded-lg p-3 backdrop-blur-md shadow-radar max-w-sm font-mono text-xs text-text-primary">
          <div className="flex items-center justify-between pb-2 border-b border-navy-border/80">
            <div className="flex items-center space-x-2 text-accent-cyan font-bold">
              <GitBranch className="w-4 h-4" />
              <span>PROJECTED ACO ROUTE</span>
            </div>
            {onClearAcoRoute && (
              <button 
                onClick={onClearAcoRoute}
                className="text-text-secondary hover:text-white text-[10px]"
              >
                Clear
              </button>
            )}
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
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Hops:</span>
              <span className="text-accent-cyan font-bold">{acoRoute.total_hops} Relays</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left Cursor HUD */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-3 pointer-events-auto font-mono text-[11px]">
        <div className="bg-navy-sidebar/90 border border-navy-border rounded-md px-3 py-1.5 backdrop-blur-md text-text-secondary flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-accent-cyan" />
          <span>CURSOR:</span>
          <span className="text-white font-bold">{formatCoords(cursorCoords.lat, cursorCoords.lng)}</span>
        </div>
      </div>
    </div>
  );
}
