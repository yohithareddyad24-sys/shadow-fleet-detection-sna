# Shadow Fleet AI — Frontend Development Progress

## Overview
Maritime Intelligence Platform & Behavioral Social Network Analysis (SNA) Console for detecting illicit vessel networks, dark AIS gaps, ship-to-ship (STS) transfers, and multi-hop transfer chains using Ant Colony Optimization (ACO).

---

## Current Status & Verification
- **Dev Server**: Running (`vite v8.3.5` on `http://localhost:5173/`)
- **Build Status**: Production bundle compiled cleanly via `vite build` (0 errors)
- **Backend Service**: FastAPI backend (`server.py`) with unified fallback demo adapters in `src/services/`
- **Dependencies**: React 19, Leaflet 1.9.4, Recharts 3.10.1, Cytoscape 3.34.4, Lucide React 1.61.0, Tailwind CSS 3.4.17

---

## Completed Modules & Sections

### Section 1: Foundation & Setup
- Configured Vite with React 19, Tailwind CSS, PostCSS, and Autoprefixer.
- Design tokens defined in `src/styles/tokens.css` with tactical maritime operations center color palette (navy backgrounds `#070B14`, `#111B2D`, `#162338`, `#243249`, cyan `#00D4FF`, alert `#FF5C65`, warning `#F5B942`, success `#39D98A`).

### Section 2: Core Components & Layout
- Global Tactical `Header` with real-time fleet stats, backend online heartbeat indicator, fast search, and disclaimer trigger.
- `DisclaimerBanner` & `DisclaimerModal` establishing synthetic illustrative data standards and strict non-probabilistic heuristic disclaimers.
- Tactical `Navigation` with active tab indicators and alert/case badges.

### Section 3: SNA Network Graph & ACO Pathfinder
- `NetworkView.jsx`: Attributed vessel-interaction network using Cytoscape.js with degree/betweenness centrality encoding, component filtering, and detailed node drawer.
- `AcoWorkbench.jsx`: Ant Colony Optimization multi-hop graph pathfinder finding high-risk transfer chains between origin and destination vessels with convergence curve telemetry.
- Direct projection from ACO pathfinder onto the Geospatial tactical map.

### Section 4: Data Services & Integration
- Modular services: `vessels.js`, `analytics.js`, `network.js`, `alerts.js`, `encounters.js`, `trajectories.js`.
- Universal `apiClient` with request tracking, abort controllers, and automated demo fallback adapters.
- Backward-compatible convenience wrappers in `src/services/api.js`.

### Section 5: Graphics & Visual Effects Layer
- **Centralized CSS**: `src/styles/effects.css` with nautical grid background, glassmorphism (`backdrop-filter: blur(12px)`), corner bracket tick marks, and GPU-optimized keyframe animations.
- **Reusable Effects Components**:
  - `TopProgressBar.jsx`: Glowing top progress indicator on route and data changes.
  - `HudCornerFrame.jsx`: Corner bracket tick marks (CSS pseudo-elements) for authentic HUD aesthetics.
  - `KpiGlowCard.jsx`: Radial cursor-following highlight via throttled `requestAnimationFrame`.
  - `CountingNumber.jsx`: Smooth easing count-up numbers with `tabular-nums`.
  - `StatusDot.jsx`: Breathing pulse dot indicator with live, stale, down, demo states.
  - `SkeletonLoader.jsx`: Linear shimmer sweep loaders for cards, tables, and charts.
  - `RadarSweepOverlay.jsx`: Conic-gradient rotating radar beam with range rings and cardinal markings.
  - `RiskGaugeArc.jsx`: SVG arc gauge labeled strictly "Anomaly score (uncalibrated)" with zero probability styling.
  - `Sparkline.jsx`: Mini SVG trend charts for table rows and KPI cards.
  - `AisTimelineBarcode.jsx`: Dense transmission cadence tick barcode with dark gap voids.
  - `EventDetailDrawer.jsx`: Right slide-in drawer with chronological vertical evidence timeline.
  - `ReducedEffectsToggle.jsx`: Global effects toggle persisted in `localStorage`.

---

### Section 6: Persistent Application Structure & Navigation
- Implemented persistent layout with React Router (`AppLayout.jsx` with `<Outlet />`).
- **Sidebar**: Brand `SHADOW FLEET AI` with small animated radar-style logo mark, 7 numbered surveillance modules (1 Overview, 2 Maritime Map, 3 Vessel Explorer, 4 Risk Intelligence, 5 Network Analysis, 6 Alerts & Events, 7 Research Methodology), and smooth collapsible behavior to icons with persisted state in `localStorage`.
- **Top Bar**: Dynamic page title matching current route, global vessel search (debounced, MMSI/IMO/name matching, keyboard shortcut `/` and `Ctrl/Cmd+K`), data-source status (`API LIVE` / `DEMO ADAPTER`), live UTC clock with manual refresh, notification bell with unread count badge & popover, and profile menu (`Desk 03`) with the **"Reduce effects" toggle**.

### Section 7: Page 1 — Intelligence Overview (`OverviewView.jsx`)
- **6 KPI Cards** with easing count-up numbers (`CountingNumber`) and SVG sparklines (`Sparkline`):
  1. Vessels monitored (navigates to `/vessels`)
  2. Vessels with anomalies (navigates to `/vessels?tier=ANOMALOUS`)
  3. High-priority reviews (navigates to `/vessels?tier=CRITICAL_MONITORING`)
  4. Dark AIS gaps (navigates to `/map?layer=gaps`)
  5. STS encounters (navigates to `/map?layer=encounters`)
  6. Unresolved alerts (navigates to `/alerts`)
- **Section A**: Embedded Leaflet mini-map preview with tactical vessel markers, hotspots, and animated conic radar sweep overlay (`RadarSweepOverlay.jsx`).
- **Section B**: 30-day composite anomaly activity timeline area chart with gradient fills and date window filters (24H, 7D, 30D, ALL).
- **Section C**: Fleet anomaly category distribution donut chart with center vessel count, interactive segment hover, and legend.
- **Section D**: Sortable top-vessels-to-investigate table with mini score progress bars and row click opening deep-dive dossiers.
- **Section E**: Recent maritime events feed with timestamps, severity badges, and slide-in evidence drawer.
- **Section F**: Data coverage and ingestion freshness telemetry indicators with visible `DEMO DATA` badge when synthetic adapters are active.

### Section 8: Page 2 — Interactive Maritime Map (`GeospatialView.jsx`)
- Full-size Leaflet tactical map with CARTO Dark Matter basemap.
- Directional vessel markers rotated to heading, color-coded by anomaly category (`#39D98A`, `#4285F4`, `#F5B942`, `#FF5C65`), with pulsing beacon halos for elevated/critical tiers.
- Trajectory polylines with outer drop-shadow glow and animated comets.
- AIS dark gap corridors with "Signal Lost" expanding ripple origin markers and duration.
- Bilateral STS encounter connector lines with proximity circle and pulsing midpoint indicator.
- Ports and anchorages layer with custom anchor glyphs.
- Map controls: Zoom in/out, pan, reset view, and fit-to-data bounds.
- Layer toggles, tactical legend, and time-range filters (24h, 48h, 7d, 30d).
- Vessel search and filter panel: Vessel type, anomaly category, AIS-gap status, encounter status, flag state.
- Interactive Trajectory Replay scrubber with play/pause, rewind, speed multiplier (1x, 5x, 20x), and marker dimming during blackout gaps.
- Glass-style marker popup displaying vessel name, MMSI, IMO, type, speed, heading, anomaly score, and "Open Vessel Details" button, strictly labeled **"Last reported positions"**.

### Section 9: Page 3 — Vessel Explorer (`FleetTableView.jsx`)
- Debounced search by Name, MMSI, IMO, and Flag.
- Modern table displaying: Vessel Identifier, MMSI, IMO, Type, Flag State, Last Position, Last AIS Update, Anomaly Score with mini progress bar, Detected Events badges (AIS gaps, STS, Spoofing, Loitering), Investigation Status, and quick triage action buttons.
- Multi-column sorting (Score, Name, Flag, Gaps, MMSI, Type).
- Pagination (10, 25, 50 rows per page with page numbers).
- Multi-dimensional filters (Category tier, Flag, Type, AIS gaps, STS encounters) with "Clear Filters" button.
- Loading shimmer skeletons, empty results state with reset, and error states.
- Row click opens the comprehensive 43KB `VesselDossierModal.jsx` intelligence profile.

---

## Verification & Status
- Both dev server and production build verified cleanly with 0 errors (`vite build` compiled in 2.19s).
- Full browser subagent test recorded and verified across all pages.
