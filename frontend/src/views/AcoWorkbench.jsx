import React, { useState } from 'react';
import { 
  GitBranch, 
  Play, 
  RotateCcw, 
  Compass, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  MapPin, 
  Sliders,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { runAcoOptimizer } from '../services/api';
import HudCornerFrame from '../components/effects/HudCornerFrame';

export default function AcoWorkbench({ 
  vessels = [], 
  onProjectToMap, 
  onSelectVessel,
  preselectedOrigin 
}) {
  const [source, setSource] = useState(preselectedOrigin?.mmsi || '999000001');
  const [destination, setDestination] = useState('999000010');
  const [numAnts, setNumAnts] = useState(15);
  const [numIterations, setNumIterations] = useState(25);
  const [alpha, setAlpha] = useState(1.0);
  const [beta, setBeta] = useState(2.0);
  const [evaporationRate, setEvaporationRate] = useState(0.2);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunOptimizer = async () => {
    if (source === destination) {
      setError("Source and destination vessels must be different.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await runAcoOptimizer({
        source,
        destination,
        num_ants: numAnts,
        num_iterations: numIterations,
        alpha,
        beta,
        evaporation_rate: evaporationRate,
      });
      setResult(res);
    } catch (err) {
      setError("Failed to execute ACO path search. Check network or vessel connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const convergenceChartData = result?.convergence_history
    ? result.convergence_history.map((val, idx) => ({
        iteration: idx + 1,
        fitness: parseFloat(val.toFixed(4)),
      }))
    : [];

  return (
    <div className="w-full h-full bg-navy-bg p-4 flex flex-col overflow-y-auto font-mono text-text-primary select-none space-y-4">
      
      {/* Page Title & Methodology Banner with HUD Frame */}
      <HudCornerFrame className="bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-3 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan font-bold text-sm">
            <GitBranch className="w-4 h-4" />
            <span>ANT COLONY OPTIMIZATION (ACO) // MULTI-HOP PATHFINDER</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Heuristic graph optimization discovering covert transfer chains and multi-tier STS relays (Origin &rarr; Intermediaries &rarr; Destination).
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-navy-card px-3 py-1.5 rounded border border-navy-border text-xs text-risk-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-[11px]">Exploratory Triage Only — Does not prove illicit operation.</span>
        </div>
      </HudCornerFrame>

      {/* Main Grid: Parameters on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Parameter Configuration Form (4 cols) */}
        <div className="lg:col-span-4 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex flex-col justify-between space-y-4 glass-panel">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-border">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
                <span>PATHWAY ENDPOINTS & HYPERPARAMETERS</span>
              </span>
            </div>

            {/* Source Vessel Select */}
            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary flex justify-between">
                <span>ORIGIN VESSEL (S):</span>
                <span className="text-accent-cyan font-semibold">FEEDER / EXPORTER</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-navy-card border border-navy-border rounded p-2 text-xs text-white focus:outline-none focus:border-accent-cyan"
              >
                {vessels.map(v => (
                  <option key={v.mmsi} value={v.mmsi}>
                    {v.vessel_name} [{v.mmsi}] - {v.flag}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Vessel Select */}
            <div className="space-y-1">
              <label className="text-[11px] text-text-secondary flex justify-between">
                <span>DESTINATION VESSEL (D):</span>
                <span className="text-accent-blue font-semibold">RECEIVER / TERMINAL</span>
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-navy-card border border-navy-border rounded p-2 text-xs text-white focus:outline-none focus:border-accent-cyan"
              >
                {vessels.map(v => (
                  <option key={v.mmsi} value={v.mmsi}>
                    {v.vessel_name} [{v.mmsi}] - {v.flag}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Ant Count */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Ant Agents per Iteration:</span>
                <span className="text-accent-cyan font-bold">{numAnts} ants</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={numAnts}
                onChange={(e) => setNumAnts(Number(e.target.value))}
                className="w-full accent-accent-cyan bg-navy-card h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Slider 2: Number of Iterations */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Optimization Iterations:</span>
                <span className="text-accent-cyan font-bold">{numIterations} cycles</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={numIterations}
                onChange={(e) => setNumIterations(Number(e.target.value))}
                className="w-full accent-accent-cyan bg-navy-card h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Slider 3: Alpha (Pheromone Weight) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Pheromone Importance (&alpha;):</span>
                <span className="text-white font-bold">{alpha.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.5"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full accent-accent-cyan bg-navy-card h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Slider 4: Beta (Heuristic Desirability Weight) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Heuristic Desirability (&beta;):</span>
                <span className="text-white font-bold">{beta.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.5"
                value={beta}
                onChange={(e) => setBeta(Number(e.target.value))}
                className="w-full accent-accent-cyan bg-navy-card h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Slider 5: Evaporation Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Pheromone Evaporation (&rho;):</span>
                <span className="text-white font-bold">{evaporationRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={evaporationRate}
                onChange={(e) => setEvaporationRate(Number(e.target.value))}
                className="w-full accent-accent-cyan bg-navy-card h-1.5 rounded cursor-pointer"
              />
            </div>

            {error && (
              <div className="p-2 rounded bg-risk-alert/15 border border-risk-alert/40 text-risk-alert text-xs">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={loading}
            className="w-full py-2.5 rounded bg-accent-blue/30 hover:bg-accent-blue/40 border border-accent-blue text-accent-cyan font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-radar disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                <span>Simulating Ant Colony Path Search...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Deploy Ant Colony Pathfinder</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results & Transfer Chain (8 cols) */}
        <div className="lg:col-span-8 bg-navy-sidebar border border-navy-border rounded-lg p-4 shadow-panel flex flex-col justify-between space-y-4">
          
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary space-y-3">
              <div className="w-12 h-12 rounded-full bg-navy-card border border-navy-border flex items-center justify-center text-accent-cyan">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                Ready to Execute Ant Colony Multi-Hop Route Optimization
              </div>
              <p className="text-xs max-w-md">
                Select your origin vessel (e.g. MOCK_NEPTUNE_FEEDER) and destination vessel (e.g. MOCK_HORIZON_DEST), adjust the ant colony parameters, and click &quot;Deploy Ant Colony Pathfinder&quot;.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative w-16 h-16 rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan animate-spin flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-accent-cyan" />
              </div>
              <div className="text-xs text-accent-cyan font-semibold animate-pulse">
                Deploying {numAnts} artificial ants across {numIterations} stochastic cycles...
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-navy-card border border-navy-border rounded-lg">
                  <div className="text-[10px] text-text-secondary">ROUTE STATUS</div>
                  <div className="text-sm font-bold text-risk-success mt-1 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>OPTIMAL PATH</span>
                  </div>
                </div>

                <div className="p-3 bg-navy-card border border-navy-border rounded-lg">
                  <div className="text-[10px] text-text-secondary">TOTAL INTERMEDIARIES</div>
                  <div className="text-sm font-bold text-accent-cyan mt-1">
                    {result.total_hops} Hops
                  </div>
                </div>

                <div className="p-3 bg-navy-card border border-navy-border rounded-lg">
                  <div className="text-[10px] text-text-secondary">CUMULATIVE RISK</div>
                  <div className="text-sm font-bold text-risk-alert mt-1">
                    {result.cumulative_risk.toFixed(4)}
                  </div>
                </div>

                <div className="p-3 bg-navy-card border border-navy-border rounded-lg">
                  <div className="text-[10px] text-text-secondary">PATH FITNESS SCORE</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {result.path_fitness.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Hop-by-Hop Visual Transfer Relay */}
              <div className="p-4 bg-navy-card border border-navy-border rounded-lg space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-border text-xs">
                  <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>DISCOVERED MULTI-HOP TRANSFER CHAIN</span>
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    HEURISTIC RISK PATHWAY
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {result.best_path.map((mmsi, idx) => {
                    const vObj = vessels.find(v => v.mmsi === mmsi);
                    const isFirst = idx === 0;
                    const isLast = idx === result.best_path.length - 1;

                    return (
                      <React.Fragment key={mmsi}>
                        <div 
                          onClick={() => vObj && onSelectVessel(vObj)}
                          className={`p-2 rounded border cursor-pointer transition-all hover:scale-105 ${
                            isFirst 
                              ? 'bg-accent-blue/20 border-accent-cyan text-white shadow-radar' 
                              : isLast 
                              ? 'bg-navy-elevated border-risk-success text-white' 
                              : 'bg-navy-elevated border-navy-border text-text-secondary hover:text-white'
                          }`}
                        >
                          <div className="text-[9px] uppercase font-bold text-accent-cyan">
                            {isFirst ? 'ORIGIN' : isLast ? 'DESTINATION' : `RELAY ${idx}`}
                          </div>
                          <div className="text-xs font-bold text-white truncate max-w-[130px]">
                            {result.best_path_vessel_names[idx] || mmsi}
                          </div>
                          <div className="text-[10px] font-mono text-text-secondary">
                            MMSI: {mmsi}
                          </div>
                        </div>

                        {!isLast && (
                          <div className="text-accent-cyan flex items-center">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Convergence Curve Chart (Recharts) */}
              <div className="p-4 bg-navy-card border border-navy-border rounded-lg">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-bold text-text-primary">Colony Pheromone Convergence Curve</span>
                  <span className="text-[10px] text-text-secondary">Fitness vs Iteration</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={convergenceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
                      <XAxis dataKey="iteration" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111B2D', borderColor: '#243249', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
                        itemStyle={{ color: '#20D5E8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fitness" 
                        stroke="#20D5E8" 
                        strokeWidth={2} 
                        dot={{ r: 2, fill: '#20D5E8' }} 
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Actions & Project Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-text-secondary max-w-sm">
                  Click below to immediately project this covert transfer pathway onto the Geospatial Tactical Map.
                </div>
                <button
                  onClick={() => onProjectToMap(result)}
                  className="px-4 py-2 rounded bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan text-accent-cyan font-bold text-xs flex items-center space-x-2 transition-all shadow-radar"
                >
                  <Compass className="w-4 h-4" />
                  <span>Project Pathway to Tactical Map &rarr;</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
