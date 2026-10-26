import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, MapPin, Share2, GitBranch, ExternalLink } from 'lucide-react';
import VesselRiskBadge from './VesselRiskBadge';
import { formatScore, formatDwt } from '../../utils/formatters';
import Sparkline from '../effects/Sparkline';

export default function VesselTable({ 
  vessels = [], 
  sortField, 
  sortAsc, 
  onSort, 
  onLocateOnMap,
  onRunAco 
}) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-navy-sidebar border border-navy-border rounded-lg overflow-hidden flex flex-col shadow-panel">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs font-mono border-collapse" role="table">
          <thead className="bg-navy-card/90 text-text-secondary uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-navy-border">
            <tr>
              <th 
                onClick={() => onSort('vessel_name')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Target Identifier</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('flag')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Flag State</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('vessel_type')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('composite_risk_score')}
                className="py-3 px-3 cursor-pointer hover:text-accent-cyan select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Composite Risk</span>
                  <ArrowUpDown className="w-3 h-3 text-accent-cyan" />
                </div>
              </th>
              <th className="py-3 px-2 text-center whitespace-nowrap" role="columnheader">
                <span>Trend</span>
              </th>
              <th 
                onClick={() => onSort('risk_tier')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Alert Tier</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('primary_risk_driver')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Primary Driver</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('betweenness_centrality')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Betweenness</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('ais_gap_count')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Dark Gaps</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th 
                onClick={() => onSort('spoofing_incident_count')}
                className="py-3 px-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                role="columnheader"
              >
                <div className="flex items-center space-x-1">
                  <span>Spoofing</span>
                  <ArrowUpDown className="w-3 h-3 text-text-secondary/60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-navy-border/60">
            {vessels.map(v => {
              const isCritical = v.risk_tier === 'CRITICAL_MONITORING';
              const sparkColor = (v.composite_risk_score || 0) >= 0.65 ? '#FF5C65' : (v.composite_risk_score || 0) >= 0.45 ? '#F5B942' : '#20D5E8';

              return (
                <tr 
                  key={v.mmsi}
                  className={`hover:bg-navy-card/80 transition-colors group cursor-pointer ${
                    isCritical ? 'border-l-2 border-l-risk-alert row-attention-pulse bg-risk-alert/5' : ''
                  }`}
                  onClick={() => navigate(`/vessels/${v.mmsi}`)}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white group-hover:text-accent-cyan transition-colors">
                      {v.vessel_name}
                    </div>
                    <div className="text-[10px] text-text-secondary font-mono">
                      MMSI: {v.mmsi} {v.imo && `• IMO: ${v.imo}`}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="text-text-primary">{v.flag}</div>
                    <div className="text-[10px] text-text-secondary">
                      Weight: {v.flag_risk_weight?.toFixed(2)}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-text-secondary">
                    {v.vessel_type}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`font-bold tabular-nums text-sm ${
                      v.composite_risk_score >= 0.65 ? 'text-risk-alert' :
                      v.composite_risk_score >= 0.45 ? 'text-risk-warning' :
                      v.composite_risk_score >= 0.25 ? 'text-accent-cyan' : 'text-risk-success'
                    }`}>
                      {formatScore(v.composite_risk_score)}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <Sparkline 
                      data={[
                        Math.max((v.speed || 10) * 0.7, 1),
                        Math.max((v.speed || 10) * 0.9, 1),
                        Math.max((v.speed || 10) * 1.1, 1),
                        Math.max((v.speed || 10) * 0.6, 0.5),
                        Math.max(v.speed || 10, 1)
                      ]} 
                      color={sparkColor} 
                      width={55} 
                      height={16} 
                    />
                  </td>

                  <td className="py-2.5 px-3">
                    <VesselRiskBadge tier={v.risk_tier} />
                  </td>

                  <td className="py-2.5 px-3 text-[11px] text-text-secondary">
                    {v.primary_risk_driver}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`font-mono tabular-nums ${v.betweenness_centrality > 0.15 ? 'text-accent-cyan font-bold' : 'text-text-secondary'}`}>
                      {v.betweenness_centrality?.toFixed(4)}
                    </span>
                  </td>

                <td className="py-2.5 px-3">
                  <span className={`font-bold tabular-nums ${v.ais_gap_count > 5 ? 'text-risk-warning' : 'text-text-secondary'}`}>
                    {v.ais_gap_count}
                  </span>
                </td>

                <td className="py-2.5 px-3">
                  <span className={`font-bold tabular-nums ${v.spoofing_incident_count > 0 ? 'text-risk-alert' : 'text-text-secondary'}`}>
                    {v.spoofing_incident_count}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1">
                    {onLocateOnMap && (
                      <button
                        onClick={() => onLocateOnMap(v.mmsi)}
                        title="Locate on Tactical Map"
                        className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-cyan transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/network?focus=${v.mmsi}`)}
                      title="Inspect SNA Graph"
                      className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-accent-blue transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/vessels/${v.mmsi}`)}
                      title="Open Full Dossier"
                      className="p-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
