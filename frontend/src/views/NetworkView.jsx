import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { 
  Share2, 
  Maximize2, 
  RotateCcw, 
  Filter, 
  Info, 
  Anchor, 
  ExternalLink, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Crosshair,
  ShieldAlert,
  Activity,
  X,
  Search,
  Bell,
  Sliders,
  Play,
  RotateCw,
  GitBranch,
  Radio,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

import { getNetworkGraph, getInitialNetworkNotifications } from '../services/network';
import { 
  computeGraphMetrics, 
  getBfsTraversal, 
  getDfsTraversal, 
  getNHopNeighborhood 
} from '../utils/graphMetrics';

import HudCornerFrame from '../components/effects/HudCornerFrame';
import DemoBadge from '../components/common/DemoBadge';

import SnaMetricsHUD from '../components/network/SnaMetricsHUD';
import RiskDistributionLegend from '../components/network/RiskDistributionLegend';
import VesselEvidencePanel from '../components/network/VesselEvidencePanel';
import EdgeDetailsCard from '../components/network/EdgeDetailsCard';
import NetworkTraversalPanel from '../components/network/NetworkTraversalPanel';
import NetworkNotificationsDrawer from '../components/network/NetworkNotificationsDrawer';

export default function NetworkView({ 
  onSelectVessel, 
  selectedVessel, 
  allVessels = [],
  onRunAcoFromVessel 
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // Graph Data & Modes
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [isMultigraph, setIsMultigraph] = useState(true);
  const [isDirected, setIsDirected] = useState(false);
  const [layoutName, setLayoutName] = useState('cose');

  // Selection & Inspector States
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'
  const [filterEdgeType, setFilterEdgeType] = useState('ALL');
  const [componentFilter, setComponentFilter] = useState('ALL');

  // SNA Centrality & Sizing Driver
  const [centralityMetric, setCentralityMetric] = useState('betweenness'); // 'betweenness', 'degree', 'closeness'

  // Traversal & N-Hop States
  const [hopDistance, setHopDistance] = useState(1); // 1 to 4 hops
  const [traversalAlgorithm, setTraversalAlgorithm] = useState('bfs'); // 'bfs' or 'dfs'
  const [isTraversing, setIsTraversing] = useState(false);
  const [traversalStep, setTraversalStep] = useState(0);
  const [traversalSequence, setTraversalSequence] = useState([]);
  const traversalTimerRef = useRef(null);

  // Dynamic Simulation & Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(getInitialNetworkNotifications);
  const [eventHistory, setEventHistory] = useState([
    { timestamp: "2026-10-26 19:45 UTC", action: "Dark Corridor Lapsed", description: "MOCK_NEPTUNE_FEEDER transponder blackout recorded (12.5h)", prevCategory: "HIGH", newCategory: "CRITICAL" },
    { timestamp: "2026-10-26 17:30 UTC", action: "Bilateral Encounter", description: "MOCK_PACIFIC_STAR ↔ MOCK_AEGEAN_BRIDGE 22h rendezvous", prevCategory: "MEDIUM", newCategory: "HIGH" },
    { timestamp: "2026-10-25 14:00 UTC", action: "Graph Construction", description: "Baseline SNA topology loaded from synthetic maritime logs", prevCategory: null, newCategory: null }
  ]);
  const [demoSimulationActive, setDemoSimulationActive] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const simulationTimerRef = useRef(null);

  // Load Graph Data
  const loadGraph = useCallback(async (multigraphMode = isMultigraph) => {
    setLoading(true);
    const res = await getNetworkGraph({ isMultigraph: multigraphMode });
    setGraphData(res.data);
    setLoading(false);
  }, [isMultigraph]);

  useEffect(() => {
    loadGraph(isMultigraph);
  }, [isMultigraph, loadGraph]);

  // Compute SNA metrics using utils/graphMetrics.js
  const computedMetrics = useMemo(() => {
    if (!graphData?.elements) return null;
    const nodes = graphData.elements.filter(el => !el.data.source).map(el => el.data);
    const edges = graphData.elements.filter(el => el.data.source && el.data.target).map(el => el.data);
    return computeGraphMetrics(nodes, edges, isDirected);
  }, [graphData, isDirected]);

  // Map of node ID to full name
  const nodeNameMap = useMemo(() => {
    const map = {};
    if (!graphData?.elements) return map;
    graphData.elements.forEach(el => {
      if (!el.data.source) {
        map[el.data.id] = el.data.fullName || el.data.label;
      }
    });
    return map;
  }, [graphData]);

  // Top 5 Centrality Vessels
  const topCentralityNodes = useMemo(() => {
    if (!graphData?.elements || !computedMetrics) return [];
    const nodes = graphData.elements
      .filter(el => !el.data.source)
      .map(el => {
        const id = el.data.id;
        return {
          ...el.data,
          betweenness: computedMetrics.betweennessMap[id] ?? el.data.betweenness ?? 0,
          degree: computedMetrics.degreeCentralityMap[id] ?? el.data.degree ?? 0,
          closeness: computedMetrics.closenessMap[id] ?? el.data.closeness ?? 0,
        };
      });

    return nodes.sort((a, b) => {
      const valA = a[centralityMetric] || 0;
      const valB = b[centralityMetric] || 0;
      return valB - valA;
    });
  }, [graphData, computedMetrics, centralityMetric]);

  // 5-Color Risk Category Counts
  const riskCategoryCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    if (!graphData?.elements) return counts;
    graphData.elements.forEach(el => {
      if (!el.data.source) {
        const cat = el.data.riskCategory || 'LOW';
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [graphData]);

  // Initialize and Render Cytoscape Graph
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Filter elements
    let elements = graphData.elements.filter(el => {
      // Node filtering
      if (!el.data.source) {
        if (filterCategory !== 'ALL' && el.data.riskCategory !== filterCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match = 
            (el.data.fullName && el.data.fullName.toLowerCase().includes(q)) ||
            (el.data.id && el.data.id.includes(q)) ||
            (el.data.flag && el.data.flag.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      }

      // Edge filtering
      if (filterEdgeType !== 'ALL' && el.data.interactionType !== filterEdgeType) return false;
      return true;
    });

    // Subgraph component filter
    if (componentFilter !== 'ALL' && graphData.components) {
      const comp = graphData.components.find(c => String(c.component_id) === componentFilter);
      if (comp) {
        const allowedVessels = new Set(comp.vessels);
        elements = elements.filter(el => {
          if (el.data.source && el.data.target) {
            return allowedVessels.has(el.data.source) && allowedVessels.has(el.data.target);
          }
          return allowedVessels.has(el.data.id);
        });
      }
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        // 1. Node Base Style: Shape, Risk Border Color, Dynamic Centrality Size
        {
          selector: 'node',
          style: {
            'label': (ele) => `[${ele.data('riskSymbol') || '●'}] ${ele.data('label')}`,
            'color': '#F1F5F9',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': '6px',
            'background-color': '#0B1220',
            'border-width': 3,
            'shape': (ele) => {
              const type = ele.data('entityType') || 'vessel';
              if (type === 'company') return 'round-rectangle';
              if (type === 'owner') return 'hexagon';
              if (type === 'port') return 'pentagon';
              return 'ellipse';
            },
            'border-color': (ele) => {
              const cat = ele.data('riskCategory') || 'LOW';
              if (cat === 'CRITICAL') return '#FF5C65';
              if (cat === 'HIGH') return '#FF9900';
              if (cat === 'MEDIUM') return '#F5B942';
              if (cat === 'UNKNOWN') return '#94A3B8';
              return '#39D98A';
            },
            // Dynamic Size driven by chosen Centrality Metric
            'width': (ele) => {
              const val = ele.data(centralityMetric) || ele.data('betweenness') || 0.1;
              return 32 + Math.min(val * 55, 45);
            },
            'height': (ele) => {
              const val = ele.data(centralityMetric) || ele.data('betweenness') || 0.1;
              return 32 + Math.min(val * 55, 45);
            },
            'transition-property': 'background-color, border-color, border-width, width, height, opacity',
            'transition-duration': '0.3s',
          }
        },
        // Selected Node with Glowing Halo
        {
          selector: 'node:selected',
          style: {
            'border-color': '#00D4FF',
            'border-width': 4.5,
            'background-color': '#162338',
            'color': '#00D4FF',
          }
        },
        // Low Zoom: Hide labels to ensure readability
        {
          selector: 'node.low-zoom-hide-label',
          style: {
            'label': '',
          }
        },
        // Top 5 Centrality Highlight Ring
        {
          selector: 'node.top-centrality-node',
          style: {
            'border-width': 4,
            'shadow-blur': 12,
            'shadow-color': '#00D4FF',
            'shadow-opacity': 0.7,
          }
        },
        // 2. Edges: Multigraph Bezier curve with separate paths for parallel edges
        {
          selector: 'edge',
          style: {
            'width': (ele) => Math.min(1.8 + (ele.data('count') || 1) * 0.7, 5.0),
            'line-color': (ele) => {
              const risk = ele.data('risk') || 0.5;
              if (risk >= 0.75) return '#FF5C65';
              if (risk >= 0.5) return '#F5B942';
              return '#334155';
            },
            'curve-style': isMultigraph ? 'bezier' : 'bezier',
            'control-point-step-size': 36,
            'opacity': 0.75,
            'line-style': 'solid',
            'transition-property': 'line-color, opacity, width',
            'transition-duration': '0.3s',
          }
        },
        // Unverified Edges dashed and tagged "Unverified"
        {
          selector: 'edge[?isVerified = false], edge[interactionType = "UNVERIFIED_PROXIMITY"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'label': 'Unverified',
            'font-size': '8px',
            'font-family': 'JetBrains Mono, monospace',
            'color': '#F5B942',
            'text-background-color': '#070B14',
            'text-background-opacity': 0.85,
            'text-background-padding': '2px',
          }
        },
        // Traversal Highlighted Path
        {
          selector: '.traversal-active',
          style: {
            'opacity': 1,
            'line-color': '#00D4FF',
            'border-color': '#00D4FF',
            'border-width': 4,
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
          }
        },
        // Dimmed Elements outside N-Hop or Traversal
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15,
          }
        },
        // Highlighted Neighborhood
        {
          selector: '.neighborhood-active',
          style: {
            'opacity': 1,
          }
        }
      ],
      layout: {
        name: layoutName,
        padding: 50,
        animate: true,
        animationDuration: 600,
      }
    });

    // Label Visibility on Zoom Scale
    const updateLabelVisibility = () => {
      const zoom = cy.zoom();
      if (zoom < 0.65) {
        cy.elements('node:not(:selected)').addClass('low-zoom-hide-label');
      } else {
        cy.elements('node').removeClass('low-zoom-hide-label');
      }
    };

    cy.on('zoom', updateLabelVisibility);

    // Hover Tooltip
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      node.removeClass('low-zoom-hide-label');
      const data = node.data();
      const pos = node.renderedPosition();
      setHoveredNode(data);
      setHoverPos({ x: pos.x, y: pos.y });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      updateLabelVisibility();
    });

    // Node Tap Event: Open Evidence Details Panel & Activate N-Hop radius
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNodeData(data);
      setSelectedEdgeData(null);

      // Compute and apply N-Hop Neighborhood
      applyNHopRadius(data.id, hopDistance, cy);
    });

    // Edge Tap Event: Open Edge Evidence Inspector Card
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const data = edge.data();
      setSelectedEdgeData(data);
      setSelectedNodeData(null);

      cy.elements().removeClass('dimmed traversal-active');
      cy.elements().difference(edge.connectedNodes().add(edge)).addClass('dimmed');
    });

    // Canvas Tap Event: Clear selections
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('dimmed neighborhood-active traversal-active');
        setSelectedNodeData(null);
        setSelectedEdgeData(null);
        setIsTraversing(false);
      }
    });

    // Tag Top 5 Centrality Nodes with special glowing border
    topCentralityNodes.slice(0, 5).forEach(n => {
      cy.getElementById(n.id).addClass('top-centrality-node');
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, layoutName, filterCategory, filterEdgeType, componentFilter, isMultigraph, centralityMetric]);

  // Apply N-Hop Neighborhood on the graph
  const applyNHopRadius = useCallback((centerNodeId, hops, cyInstance = cyRef.current) => {
    if (!cyInstance || !graphData?.elements) return;

    const nodes = graphData.elements.filter(el => !el.data.source).map(el => el.data);
    const edges = graphData.elements.filter(el => el.data.source && el.data.target).map(el => el.data);

    const { nodeIds } = getNHopNeighborhood(centerNodeId, hops, nodes, edges, isDirected);
    const allowedNodeSet = new Set(nodeIds);

    cyInstance.batch(() => {
      cyInstance.elements().removeClass('dimmed neighborhood-active');
      
      const activeEles = cyInstance.elements().filter(ele => {
        if (ele.isNode()) return allowedNodeSet.has(ele.id());
        if (ele.isEdge()) return allowedNodeSet.has(ele.data('source')) && allowedNodeSet.has(ele.data('target'));
        return false;
      });

      cyInstance.elements().difference(activeEles).addClass('dimmed');
      activeEles.addClass('neighborhood-active');
    });
  }, [graphData, isDirected]);

  // Update N-Hop when slider moves
  useEffect(() => {
    if (selectedNodeData) {
      applyNHopRadius(selectedNodeData.id, hopDistance);
    }
  }, [hopDistance, selectedNodeData, applyNHopRadius]);

  // Setup BFS / DFS Traversal Sequence when selectedNode or algorithm changes
  useEffect(() => {
    if (!selectedNodeData || !graphData?.elements) {
      setTraversalSequence([]);
      setTraversalStep(0);
      return;
    }

    const nodes = graphData.elements.filter(el => !el.data.source).map(el => el.data);
    const edges = graphData.elements.filter(el => el.data.source && el.data.target).map(el => el.data);

    const res = traversalAlgorithm === 'bfs'
      ? getBfsTraversal(selectedNodeData.id, nodes, edges, isDirected)
      : getDfsTraversal(selectedNodeData.id, nodes, edges, isDirected);

    setTraversalSequence(res.visitedOrder || []);
    setTraversalStep(0);
  }, [selectedNodeData, traversalAlgorithm, graphData, isDirected]);

  // Animate Traversal Step-by-Step
  const renderTraversalStep = useCallback((stepIndex) => {
    const cy = cyRef.current;
    if (!cy || traversalSequence.length === 0) return;

    const visitedUpToNow = new Set(traversalSequence.slice(0, stepIndex + 1));
    const currentNodeId = traversalSequence[stepIndex];

    cy.batch(() => {
      cy.elements().removeClass('traversal-active dimmed');

      // Highlight visited nodes and edges between visited nodes
      const activeNodes = cy.nodes().filter(n => visitedUpToNow.has(n.id()));
      const activeEdges = cy.edges().filter(e => visitedUpToNow.has(e.data('source')) && visitedUpToNow.has(e.data('target')));

      const activeEles = activeNodes.add(activeEdges);
      activeEles.addClass('traversal-active');
      cy.elements().difference(activeEles).addClass('dimmed');

      // Pan to current node smoothly
      const currEle = cy.getElementById(currentNodeId);
      if (currEle.length > 0) {
        cy.animate({
          center: { eles: currEle },
          duration: 350,
        });
      }
    });
  }, [traversalSequence]);

  // Traversal Playback Timer Loop
  useEffect(() => {
    if (!isTraversing || traversalSequence.length <= 1) {
      if (traversalTimerRef.current) clearInterval(traversalTimerRef.current);
      return;
    }

    traversalTimerRef.current = setInterval(() => {
      setTraversalStep(prev => {
        if (prev >= traversalSequence.length - 1) {
          setIsTraversing(false);
          return prev;
        }
        const next = prev + 1;
        renderTraversalStep(next);
        return next;
      });
    }, 1100);

    return () => {
      if (traversalTimerRef.current) clearInterval(traversalTimerRef.current);
    };
  }, [isTraversing, traversalSequence, renderTraversalStep]);

  const handlePlayTraversal = () => {
    if (traversalSequence.length === 0) return;
    if (traversalStep >= traversalSequence.length - 1) {
      setTraversalStep(0);
      renderTraversalStep(0);
    }
    setIsTraversing(true);
  };

  const handlePauseTraversal = () => {
    setIsTraversing(false);
  };

  const handleStepTraversal = () => {
    setIsTraversing(false);
    if (traversalStep < traversalSequence.length - 1) {
      const next = traversalStep + 1;
      setTraversalStep(next);
      renderTraversalStep(next);
    }
  };

  const handleResetTraversal = () => {
    setIsTraversing(false);
    setTraversalStep(0);
    if (selectedNodeData) {
      applyNHopRadius(selectedNodeData.id, hopDistance);
    }
  };

  // Zoom and Fit Controls
  const handleZoom = (factor) => {
    if (!cyRef.current) return;
    cyRef.current.zoom({
      level: cyRef.current.zoom() * factor,
      renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
    });
  };

  const handleResetFit = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass('traversal-active dimmed neighborhood-active');
    setSelectedNodeData(null);
    setSelectedEdgeData(null);
    cyRef.current.animate({
      fit: { eles: cyRef.current.elements(), padding: 50 },
      duration: 500,
    });
  };

  // Trigger Simulated Dynamic In-Place Update (Adding node or shifting risk)
  const triggerDynamicUpdate = useCallback(() => {
    if (!graphData) return;

    const dynamicVesselId = `9990000${Math.floor(13 + Math.random() * 80)}`;
    const newVessel = {
      data: {
        id: dynamicVesselId,
        label: `INCOMING_${dynamicVesselId.slice(-3)}`,
        fullName: `MOCK_DYNAMIC_SURVEILLANCE_${dynamicVesselId.slice(-3)}`,
        flag: "Panama",
        riskScore: 0.72,
        riskTier: "CRITICAL_MONITORING",
        riskCategory: "CRITICAL",
        riskSymbol: "!",
        riskColor: "#FF5C65",
        betweenness: 0.22,
        degree: 0.35,
        closeness: 0.65,
        aisGaps: 6,
        spoofingCount: 1,
        isDemo: true,
      }
    };

    const newEdge = {
      data: {
        id: `dynamic-edge-${Date.now()}`,
        source: dynamicVesselId,
        target: "999000001",
        interactionType: "STS_ENCOUNTER",
        label: "Dynamic STS Alert",
        count: 1,
        duration: 9.5,
        risk: 0.84,
        distance: 0.06,
        isVerified: true,
        evidence: "Algorithmic ingestion identified new zero-speed encounter off Laconic Gulf corridor.",
        timestamps: { firstSeen: "Just now", lastSeen: "Just now" },
        sourceInfo: "Stream Ingestion Pipeline",
        curveOffset: 20,
        isDemo: true,
      }
    };

    // Update in Cytoscape canvas in place with subtle highlight animation
    if (cyRef.current) {
      cyRef.current.add([newVessel, newEdge]);
      const addedNode = cyRef.current.getElementById(dynamicVesselId);
      addedNode.flashClass('traversal-active', 1500);
      cyRef.current.layout({ name: layoutName, animate: true, animationDuration: 500 }).run();
    }

    // Append to event history
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const newHist = {
      timestamp: nowTime,
      action: "New Vessel Integrated",
      description: `Vessel ${dynamicVesselId} linked to MOCK_NEPTUNE_FEEDER via STS encounter.`,
      prevCategory: "MEDIUM",
      newCategory: "CRITICAL",
    };
    setEventHistory(prev => [newHist, ...prev]);

    // Append notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      vesselId: dynamicVesselId,
      vesselName: `MOCK_DYNAMIC_${dynamicVesselId.slice(-3)}`,
      type: "new_high_risk",
      title: "New Critical Anomaly Ingested",
      message: `Dynamic stream added vessel ${dynamicVesselId} with high transfer risk rating (0.72).`,
      timestamp: "Just now",
      severity: "CRITICAL",
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Toast alert on risk-category change
    setActiveToast(`Alert: Vessel ${dynamicVesselId} categorized as CRITICAL anomaly`);
    setTimeout(() => setActiveToast(null), 4500);
  }, [graphData, layoutName]);

  // Automated simulation toggle loop
  useEffect(() => {
    if (!demoSimulationActive) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }

    simulationTimerRef.current = setInterval(() => {
      triggerDynamicUpdate();
    }, 12000);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [demoSimulationActive, triggerDynamicUpdate]);

  return (
    <div className="w-full h-full relative network-canvas-container flex overflow-hidden select-none font-mono text-text-primary">
      
      {/* 1. Top Bar: Controls, Layout, Search, Multigraph Toggle, Notifications */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        
        {/* Left Toolbar: Search & Topology Selectors */}
        <div className="glass-panel rounded-lg p-2 shadow-panel flex flex-wrap items-center gap-2 text-xs">
          {/* Search Node */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search graph vessels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 bg-navy-card border border-navy-border rounded text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent-cyan"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white">
                ✕
              </button>
            )}
          </div>

          {/* Layout Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-text-secondary">LAYOUT:</span>
            <select
              value={layoutName}
              onChange={(e) => {
                setLayoutName(e.target.value);
                if (cyRef.current) cyRef.current.layout({ name: e.target.value, animate: true, animationDuration: 600 }).run();
              }}
              className="bg-navy-card border border-navy-border rounded px-2 py-1 text-xs text-white"
            >
              <option value="cose">Force-Directed (CoSE)</option>
              <option value="concentric">Concentric (Risk Rings)</option>
              <option value="circle">Circular</option>
              <option value="breadthfirst">Hierarchical Tree</option>
            </select>
          </div>

          {/* Multigraph vs Simple Graph Toggle */}
          <button
            onClick={() => setIsMultigraph(!isMultigraph)}
            className={`px-2 py-1 rounded text-xs font-bold border transition-colors flex items-center space-x-1 ${
              isMultigraph
                ? 'bg-accent-blue/30 text-accent-cyan border-accent-blue/50'
                : 'bg-navy-card text-text-secondary border-navy-border hover:text-white'
            }`}
            title="Toggle parallel edges (multigraph) vs collapsed simple graph"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isMultigraph ? 'MULTIGRAPH (PARALLEL EDGES)' : 'SIMPLE GRAPH'}</span>
          </button>
        </div>

        {/* Right Toolbar: Zoom, Reset, Simulation Toggle, Notifications Trigger */}
        <div className="glass-panel rounded-lg p-2 shadow-panel flex items-center space-x-2 text-xs">
          {/* Zoom Buttons */}
          <button onClick={() => handleZoom(1.25)} className="p-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleResetFit} className="px-2 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan flex items-center space-x-1" title="Reset Layout & Fit">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Fit</span>
          </button>

          {/* DEMO Simulation Trigger */}
          <button
            onClick={triggerDynamicUpdate}
            className="px-2.5 py-1 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-bold text-xs flex items-center space-x-1"
            title="Trigger in-place dynamic graph event without reload"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DEMO Ingest Event</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative px-2.5 py-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white flex items-center space-x-1.5"
            title="Open Notifications & Change Log"
          >
            <Bell className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden sm:inline">Alerts</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-risk-alert animate-ping" />
            )}
          </button>
        </div>

      </div>

      {/* 2. Main Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* 3. Left HUD Stack: SNA Core Metrics Panel & Traversal Controls */}
      <div className="absolute top-16 left-3 z-20 flex flex-col space-y-2 pointer-events-auto max-w-sm">
        <SnaMetricsHUD
          metrics={computedMetrics}
          centralityMetric={centralityMetric}
          setCentralityMetric={setCentralityMetric}
          topCentralityNodes={topCentralityNodes}
          onSelectNode={(node) => {
            setSelectedNodeData(node);
            if (cyRef.current) {
              const ele = cyRef.current.getElementById(node.id);
              if (ele.length > 0) {
                cyRef.current.animate({ center: { eles: ele }, zoom: 1.2, duration: 400 });
              }
            }
          }}
          isDirected={isDirected}
          setIsDirected={setIsDirected}
        />

        <NetworkTraversalPanel
          selectedNode={selectedNodeData}
          hopDistance={hopDistance}
          setHopDistance={setHopDistance}
          traversalAlgorithm={traversalAlgorithm}
          setTraversalAlgorithm={setTraversalAlgorithm}
          isTraversing={isTraversing}
          onPlayTraversal={handlePlayTraversal}
          onPauseTraversal={handlePauseTraversal}
          onStepTraversal={handleStepTraversal}
          onResetTraversal={handleResetTraversal}
          traversalStep={traversalStep}
          traversalSequence={traversalSequence}
          nodeNameMap={nodeNameMap}
          onClearSelection={() => {
            setSelectedNodeData(null);
            if (cyRef.current) cyRef.current.elements().removeClass('dimmed traversal-active neighborhood-active');
          }}
        />
      </div>

      {/* 4. Bottom Center: 5-Color Risk Distribution Bar & Permanent Disclaimer Note */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20 pointer-events-auto max-w-2xl w-full">
        <RiskDistributionLegend
          counts={riskCategoryCounts}
          selectedCategory={filterCategory}
          onSelectCategory={(cat) => setFilterCategory(cat)}
        />
      </div>

      {/* 5. Right Inspector Panels: Node Evidence Panel or Edge Evidence Card */}
      <div className="absolute top-16 right-3 z-30 pointer-events-auto">
        {selectedNodeData && (
          <VesselEvidencePanel
            nodeData={selectedNodeData}
            onClose={() => {
              setSelectedNodeData(null);
              if (cyRef.current) cyRef.current.elements().removeClass('dimmed traversal-active neighborhood-active');
            }}
            onOpenProfile={(vessel) => {
              if (onSelectVessel) onSelectVessel(vessel);
            }}
            allVessels={allVessels}
          />
        )}

        {selectedEdgeData && !selectedNodeData && (
          <EdgeDetailsCard
            edgeData={selectedEdgeData}
            onClose={() => {
              setSelectedEdgeData(null);
              if (cyRef.current) cyRef.current.elements().removeClass('dimmed traversal-active');
            }}
          />
        )}
      </div>

      {/* 6. Notifications & Event History Drawer */}
      <NetworkNotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
        onClearNotifications={() => setNotifications([])}
        onSelectVessel={(vessel) => {
          setNotificationsOpen(false);
          const found = allVessels.find(v => v.mmsi === vessel.mmsi) || vessel;
          if (onSelectVessel) onSelectVessel(found);
        }}
        eventHistory={eventHistory}
        demoSimulationActive={demoSimulationActive}
        onToggleDemoSimulation={() => setDemoSimulationActive(prev => !prev)}
        onTriggerSimulationStep={triggerDynamicUpdate}
      />

      {/* 7. Hover Tooltip */}
      {hoveredNode && !selectedNodeData && (
        <div 
          className="pointer-events-none fixed z-50 glass-panel p-2.5 rounded-md shadow-2xl font-mono text-xs border border-accent-cyan/60 animate-fadeIn"
          style={{
            left: `${hoverPos.x + 20}px`,
            top: `${hoverPos.y - 30}px`,
          }}
        >
          <div className="font-bold text-white text-[12px] flex items-center space-x-1.5">
            <span 
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ backgroundColor: `${hoveredNode.riskColor}25`, color: hoveredNode.riskColor, border: `1px solid ${hoveredNode.riskColor}` }}
            >
              {hoveredNode.riskSymbol || '●'}
            </span>
            <span>{hoveredNode.fullName || hoveredNode.label}</span>
          </div>
          <div className="text-[10px] text-accent-cyan mt-0.5">MMSI: {hoveredNode.id} • {hoveredNode.flag}</div>
          <div className="text-[10px] text-text-secondary mt-1">
            Category: <strong style={{ color: hoveredNode.riskColor }}>{hoveredNode.riskCategory}</strong>
          </div>
          <div className="text-[10px] text-text-secondary">
            Betweenness Centrality: <strong className="text-white">{hoveredNode.betweenness?.toFixed(4) || '0.0000'}</strong>
          </div>
        </div>
      )}

      {/* 8. Live Toast Notification on Risk Change */}
      {activeToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 glass-panel border border-risk-alert/80 rounded-lg px-4 py-2 shadow-2xl font-mono text-xs text-white flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-risk-alert animate-pulse" />
          <span>{activeToast}</span>
        </div>
      )}

    </div>
  );
}
