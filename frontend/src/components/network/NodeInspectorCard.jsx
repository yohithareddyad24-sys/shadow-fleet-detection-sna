import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ShieldAlert, GitBranch } from 'lucide-react';
import VesselRiskBadge from '../vessels/VesselRiskBadge';
import { formatScore } from '../../utils/formatters';

export default function NodeInspectorCard({ 
  nodeData, 
  onClose,
  onRunAcoFromVessel 
}) {
  const navigate = useNavigate();
  if (!nodeData) return null;

  return (
    <div className="bg-navy-sidebar/95 border border-accent-cyan/60 rounded-lg p-4 shadow-radar backdrop-blur-md font-mono text-xs space-y-2.5 max-w-sm select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border">
        <div className="font-bold text-white text-sm truncate max-w-[200px]">
          {nodeData.fullName || nodeData.id}
        </div>
        <VesselRiskBadge tier={nodeData.riskTier} />
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-text-secondary">MMSI:</span>
          <span className="text-accent-cyan font-bold">{nodeData.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Flag State:</span>
          <span className="text-white">{nodeData.flag}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Betweenness (Bridge):</span>
          <span className="text-white font-bold">{nodeData.betweenness?.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Degree Centrality:</span>
          <span className="text-white">{nodeData.degree?.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Composite Risk:</span>
          <span className="text-accent-cyan font-bold">{(nodeData.riskScore * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={() => navigate(`/vessels/${nodeData.id}`)}
          className="flex-1 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-accent-cyan text-accent-cyan font-semibold flex items-center justify-center space-x-1.5 transition-colors focus:outline-none"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Dossier</span>
        </button>

        {onRunAcoFromVessel && (
          <button
            onClick={() => onRunAcoFromVessel(nodeData.id)}
            className="px-2.5 py-1.5 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/50 text-accent-cyan flex items-center space-x-1"
            title="Set as ACO Origin"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>ACO</span>
          </button>
        )}
      </div>
    </div>
  );
}
