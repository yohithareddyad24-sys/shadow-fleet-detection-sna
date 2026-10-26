import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Building,
  User,
  Activity,
  X
} from 'lucide-react';
import { fetchNetworkGraph } from '../services/api';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function NetworkView({ 
  onSelectVessel, 
  selectedVessel, 
  allVessels = [] 
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [layoutName, setLayoutName] = useState('cose');
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [componentFilter, setComponentFilter] = useState('ALL');

  // Load Graph Data
  useEffect(() => {
    setLoading(true);
    fetchNetworkGraph().then(data => {
      setGraphData(data);
      setLoading(false);
    });
  }, []);

  // Initialize and update Cytoscape
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Filter elements if component filter is active
    let elements = graphData.elements;
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
        // 5.5 Node Styling: Distinct shape per type
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': '6px',
            'background-color': '#0B1220',
            'border-width': 2.5,
            'shape': (ele) => {
              const type = ele.data('entityType') || 'vessel';
              if (type === 'company') return 'round-rectangle';
              if (type === 'owner') return 'hexagon';
              if (type === 'port') return 'pentagon';
              if (type === 'sts_event') return 'star';
              return 'ellipse'; // default vessel
            },
            'border-color': (ele) => {
              const tier = ele.data('riskTier');
              if (tier === 'CRITICAL_MONITORING') return '#FF5C65';
              if (tier === 'ELEVATED_ATTENTION') return '#F5B942';
              if (tier === 'MODERATE_INTERACTION') return '#4285F4';
              return '#39D98A';
            },
            'width': (ele) => {
              const betw = ele.data('betweenness') || 0;
              return 34 + Math.min(betw * 65, 45); // Size scaled by betweenness centrality
            },
            'height': (ele) => {
              const betw = ele.data('betweenness') || 0;
              return 34 + Math.min(betw * 65, 45);
            },
            'transition-property': 'background-color, border-color, border-width, width, height, opacity',
            'transition-duration': '0.3s',
          }
        },
        // Selected Node with Glowing Halo
        {
          selector: 'node:selected',
          style: {
            'border-color': '#20D5E8',
            'border-width': 4,
            'background-color': '#162338',
            'color': '#20D5E8',
          }
        },
        // 5.5 Edges: Curved with subtle glow
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const count = ele.data('count') || 1;
              return Math.min(1.8 + count * 0.7, 5.5);
            },
            'line-color': (ele) => {
              const risk = ele.data('risk') || 0.5;
              if (risk >= 0.75) return '#FF5C65';
              if (risk >= 0.5) return '#F5B942';
              return '#334155';
            },
            'curve-style': 'bezier',
            'opacity': 0.75,
            'line-style': (ele) => {
              const type = ele.data('interactionType');
              if (type === 'PROXIMITY_EVENT' || type === 'UNVERIFIED') return 'dashed';
              if (type === 'TUG_SUPPORT') return 'dotted';
              return 'solid';
            }
          }
        },
        // 5.5 Unverified Edges dashed with tag
        {
          selector: 'edge[interactionType = "PROXIMITY_EVENT"], edge[interactionType = "UNVERIFIED"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'label': 'Unverified',
            'font-size': '8px',
            'color': '#F5B942',
            'text-background-color': '#070B14',
            'text-background-opacity': 0.85,
            'text-background-padding': '2px',
          }
        },
        // 5.5 Selected Node's Edges animate flowing dashes
        {
          selector: 'edge.highlighted',
          style: {
            'opacity': 1,
            'line-color': '#20D5E8',
            'width': 3.5,
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
            'line-dash-offset': 12,
            'target-arrow-color': '#20D5E8',
          }
        },
        // 5.5 Dimmed Unrelated Nodes to ~25% Opacity
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.25,
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'opacity': 1,
            'border-color': '#20D5E8',
            'border-width': 3.5,
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

    // 5.5 Hover tooltip in glass style
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      const renderedPos = node.renderedPosition();
      setHoveredNode(data);
      setHoverPos({ x: renderedPos.x, y: renderedPos.y });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

    // Node Click Handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNodeData(data);

      // Highlight 1-hop neighborhood and dim unrelated nodes to 25%
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.neighborhood().add(node);
      cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    // Background Click Handler
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        setSelectedNodeData(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, componentFilter]);

  // Smooth animated layout transition when layout changes
  const applyLayout = useCallback((name) => {
    setLayoutName(name);
    if (!cyRef.current) return;
    cyRef.current.layout({
      name: name,
      animate: true,
      animationDuration: 650,
      padding: 50,
      fit: true,
    }).run();
  }, []);

  const handleReset = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass('highlighted dimmed');
    setSelectedNodeData(null);
    cyRef.current.animate({
      fit: { eles: cyRef.current.elements(), padding: 50 },
      duration: 500,
    });
  };

  const handleZoom = (factor) => {
    if (!cyRef.current) return;
    cyRef.current.zoom({
      level: cyRef.current.zoom() * factor,
      renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
    });
  };

  return (
    <div className="w-full h-full relative network-canvas-container flex overflow-hidden select-none">
      
      {/* Top Left Toolbar in Glass Style */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 font-mono text-xs">
        {/* Controls Panel */}
        <div className="glass-panel rounded-lg p-3 shadow-panel space-y-2.5 min-w-[230px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
            <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>SNA TOPOLOGY CONTROLS</span>
            </span>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary text-[11px]">LAYOUT:</span>
            <select
              value={layoutName}
              onChange={(e) => applyLayout(e.target.value)}
              className="bg-navy-card border border-navy-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan"
            >
              <option value="cose">Force-Directed (CoSE)</option>
              <option value="concentric">Concentric (Risk)</option>
              <option value="circle">Circular Topology</option>
              <option value="breadthfirst">Hierarchical Tree</option>
            </select>
          </div>

          {/* Connected Component Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary text-[11px]">SUBGRAPH:</span>
            <select
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              className="bg-navy-card border border-navy-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan"
            >
              <option value="ALL">All Clusters ({graphData?.summary?.num_connected_components || 2})</option>
              <option value="1">Cluster 1 (Active Network - 10 Vessels)</option>
              <option value="2">Cluster 2 (Isolated Feeder - 2 Vessels)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 pt-1 border-t border-navy-border/60">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan flex items-center space-x-1"
              title="Reset View Layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="glass-panel rounded-lg p-2.5 shadow-panel space-y-1.5 text-[10px] text-text-secondary">
          <div className="font-bold uppercase text-white mb-1">Topology Encoding:</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full border-2 border-accent-cyan" />
            <span>Node Size = Betweenness (Bridge Role)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-0.5 bg-risk-alert" />
            <span>Red Edges = High Transfer Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-0.5 border-b border-dashed border-[#F5B942]" />
            <span className="text-risk-warning">Dashed with Tag = Unverified Proximity</span>
          </div>
        </div>
      </div>

      {/* Main Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* 5.5 Hover Tooltip in Glass Style */}
      {hoveredNode && !selectedNodeData && (
        <div 
          className="pointer-events-none fixed z-50 glass-panel p-2.5 rounded-md shadow-2xl font-mono text-xs border border-accent-cyan/60 animate-fadeIn"
          style={{
            left: `${hoverPos.x + 20}px`,
            top: `${hoverPos.y - 30}px`,
          }}
        >
          <div className="font-bold text-white text-[12px]">{hoveredNode.fullName || hoveredNode.label}</div>
          <div className="text-[10px] text-accent-cyan">MMSI: {hoveredNode.id} • {hoveredNode.flag}</div>
          <div className="text-[10px] text-text-secondary mt-1">
            Betweenness Centrality: <strong className="text-white">{hoveredNode.betweenness?.toFixed(4) || '0.0000'}</strong>
          </div>
          <div className="text-[10px] text-text-secondary">
            Composite Risk Score: <strong className="text-risk-warning">{((hoveredNode.riskScore || 0) * 100).toFixed(1)}%</strong>
          </div>
        </div>
      )}

      {/* Top Right: Network Summary HUD */}
      {graphData && (
        <div className="absolute top-4 right-4 z-20 glass-panel rounded-lg p-3 shadow-panel font-mono text-xs space-y-1.5 max-w-xs">
          <div className="font-bold text-accent-cyan pb-1 border-b border-navy-border/70 flex items-center justify-between">
            <span>GRAPH TOPOLOGY (NETWORKX)</span>
            <span className="text-[10px] text-text-secondary">UNDIRECTED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Nodes (Vessels):</span>
            <span className="text-white font-bold">{graphData.summary.num_nodes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Edges (Rendezvous):</span>
            <span className="text-white font-bold">{graphData.summary.num_edges}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Graph Density:</span>
            <span className="text-accent-cyan font-bold">{graphData.summary.density.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Avg Degree:</span>
            <span className="text-white font-bold">{graphData.summary.average_degree.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Connected Clusters:</span>
            <span className="text-risk-warning font-bold">{graphData.summary.num_connected_components}</span>
          </div>
        </div>
      )}

      {/* 5.5 Bottom Right: Slide-in Side Panel with Entity Details */}
      {selectedNodeData && (
        <HudCornerFrame className="absolute bottom-4 right-4 z-20 glass-panel border border-accent-cyan/60 rounded-lg p-4 shadow-panel font-mono text-xs space-y-2.5 max-w-sm animate-fadeIn" glow>
          <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
            <div className="font-bold text-white text-sm">
              {selectedNodeData.fullName}
            </div>
            <button
              onClick={() => {
                setSelectedNodeData(null);
                if (cyRef.current) cyRef.current.elements().removeClass('highlighted dimmed');
              }}
              className="text-text-secondary hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">MMSI:</span>
              <span className="text-accent-cyan font-bold">{selectedNodeData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Flag State:</span>
              <span className="text-white">{selectedNodeData.flag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Betweenness (Bridge):</span>
              <span className="text-white font-bold">{selectedNodeData.betweenness?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Degree Hub Rank:</span>
              <span className="text-white">{selectedNodeData.degree?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Composite Risk:</span>
              <span className="text-accent-cyan font-bold">{(selectedNodeData.riskScore * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-border/60">
            <button
              onClick={() => {
                const fullV = allVessels.find(v => v.mmsi === selectedNodeData.id);
                if (fullV) onSelectVessel(fullV);
              }}
              className="w-full py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect Full Vessel Dossier</span>
            </button>
          </div>
        </HudCornerFrame>
      )}

    </div>
  );
}
