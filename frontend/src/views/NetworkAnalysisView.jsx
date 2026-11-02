import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Share2, GitBranch, Compass, Layers } from 'lucide-react';
import NetworkView from './NetworkView';
import AcoWorkbench from './AcoWorkbench';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function NetworkAnalysisView() {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'aco'
  const [preselectedOrigin, setPreselectedOrigin] = useState(null);
  const outletCtx = useOutletContext() || {};
  const navigate = useNavigate();

  const handleSelectVessel = (vessel) => {
    if (outletCtx.onSelectVessel) {
      outletCtx.onSelectVessel(vessel);
    }
  };

  const handleProjectToMap = (result) => {
    if (outletCtx.setAcoRoute) {
      outletCtx.setAcoRoute(result);
    }
    navigate('/map');
  };

  const handleRunAcoFromVessel = (vessel) => {
    setPreselectedOrigin(vessel);
    setActiveTab('aco');
  };

  return (
    <div className="w-full h-full flex flex-col bg-navy-bg overflow-hidden font-mono text-text-primary">
      {/* Sub-tab Navigation Bar */}
      <div className="bg-navy-sidebar border-b border-navy-border px-4 py-2 flex items-center justify-between text-xs shrink-0 glass-panel">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-all font-bold ${
              activeTab === 'graph'
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50 shadow-sm'
                : 'text-text-secondary hover:text-white hover:bg-navy-card'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>SNA Interaction Topology (Cytoscape Graph)</span>
          </button>

          <button
            onClick={() => setActiveTab('aco')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-all font-bold ${
              activeTab === 'aco'
                ? 'bg-accent-blue/30 text-accent-cyan border border-accent-blue/50 shadow-sm'
                : 'text-text-secondary hover:text-white hover:bg-navy-card'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>ACO Multi-Hop Transfer Pathfinder</span>
          </button>
        </div>

        <div className="text-[10px] text-text-secondary hidden sm:flex items-center space-x-2">
          <span>ALGORITHM:</span>
          <span className="text-white font-bold">NetworkX Centralities + Ant Colony Path Optimization</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'graph' ? (
          <NetworkView
            onSelectVessel={handleSelectVessel}
            selectedVessel={outletCtx.selectedVessel}
            allVessels={outletCtx.allVessels || []}
            onRunAcoFromVessel={handleRunAcoFromVessel}
          />
        ) : (
          <AcoWorkbench
            vessels={outletCtx.allVessels || []}
            onProjectToMap={handleProjectToMap}
            onSelectVessel={handleSelectVessel}
            preselectedOrigin={preselectedOrigin}
          />
        )}
      </div>
    </div>
  );
}
