import React from 'react';
import { Play, Pause, RotateCcw, StepForward, GitFork, Compass, Layers, Sliders } from 'lucide-react';

export default function NetworkTraversalPanel({
  selectedNode,
  hopDistance,
  setHopDistance,
  traversalAlgorithm, // 'bfs' or 'dfs'
  setTraversalAlgorithm,
  isTraversing,
  onPlayTraversal,
  onPauseTraversal,
  onStepTraversal,
  onResetTraversal,
  traversalStep,
  traversalSequence = [],
  nodeNameMap = {},
  onClearSelection
}) {
  return (
    <div className="glass-panel rounded-lg p-3 shadow-panel font-mono text-xs space-y-2.5 min-w-[280px] max-w-sm select-none border border-navy-border/80">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-navy-border/70">
        <span className="font-bold text-accent-cyan flex items-center space-x-1.5">
          <GitFork className="w-3.5 h-3.5" />
          <span>NEIGHBORHOOD & TRAVERSAL</span>
        </span>
        {selectedNode && (
          <button
            onClick={onClearSelection}
            className="text-[10px] text-text-secondary hover:text-white"
            title="Clear active vessel focus"
          >
            Clear Focus
          </button>
        )}
      </div>

      {/* Selected Vessel Focus Banner */}
      {selectedNode ? (
        <div className="p-2 rounded bg-navy-card/80 border border-accent-cyan/50 flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="text-[10px] text-text-secondary">ROOT VESSEL:</span>
            <div className="font-bold text-white truncate">{selectedNode.fullName || selectedNode.label}</div>
          </div>
          <span className="text-[10px] font-mono font-bold text-accent-cyan bg-accent-blue/20 px-1.5 py-0.5 rounded border border-accent-cyan/30">
            {selectedNode.id}
          </span>
        </div>
      ) : (
        <div className="p-2 rounded bg-navy-card/50 border border-navy-border text-[11px] text-text-secondary italic">
          Click any vessel node on the canvas to activate N-hop radius and step-by-step path traversals.
        </div>
      )}

      {/* 1. N-Hop Neighborhood Slider (1 to 4 hops) */}
      <div className="space-y-1.5 p-2 rounded bg-navy-card/60 border border-navy-border">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-text-secondary flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-accent-cyan" />
            <span>Neighborhood Radius:</span>
          </span>
          <span className="font-bold text-accent-cyan font-mono">{hopDistance} {hopDistance === 1 ? 'Hop' : 'Hops'}</span>
        </div>

        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={hopDistance}
          disabled={!selectedNode}
          onChange={(e) => setHopDistance(Number(e.target.value))}
          className="w-full h-1.5 bg-navy-sidebar rounded-lg appearance-none cursor-pointer accent-[#00D4FF] disabled:opacity-40"
        />

        <div className="flex justify-between text-[9px] text-text-secondary px-0.5">
          <span>1 Hop (Direct)</span>
          <span>2 Hops</span>
          <span>3 Hops</span>
          <span>4 Hops (Global)</span>
        </div>
      </div>

      {/* 2. BFS / DFS Traversal Controls */}
      <div className="space-y-2 p-2 rounded bg-navy-card/60 border border-navy-border">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-secondary font-bold">ALGORITHM:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setTraversalAlgorithm('bfs')}
              disabled={!selectedNode}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                traversalAlgorithm === 'bfs'
                  ? 'bg-accent-blue/30 text-accent-cyan border-accent-blue/50'
                  : 'bg-navy-sidebar text-text-secondary border-navy-border hover:text-white'
              } disabled:opacity-40`}
            >
              BFS (Breadth)
            </button>
            <button
              onClick={() => setTraversalAlgorithm('dfs')}
              disabled={!selectedNode}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                traversalAlgorithm === 'dfs'
                  ? 'bg-accent-blue/30 text-accent-cyan border-accent-blue/50'
                  : 'bg-navy-sidebar text-text-secondary border-navy-border hover:text-white'
              } disabled:opacity-40`}
            >
              DFS (Depth)
            </button>
          </div>
        </div>

        {/* Playback Button Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-navy-border/60">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={isTraversing ? onPauseTraversal : onPlayTraversal}
              disabled={!selectedNode || traversalSequence.length === 0}
              className="px-2.5 py-1 rounded bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 text-accent-cyan font-bold flex items-center space-x-1 text-xs disabled:opacity-40"
              title={isTraversing ? "Pause traversal" : "Play step-by-step traversal"}
            >
              {isTraversing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isTraversing ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={onStepTraversal}
              disabled={!selectedNode || isTraversing || traversalStep >= traversalSequence.length - 1}
              className="p-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white disabled:opacity-40"
              title="Step forward one node"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetTraversal}
              disabled={!selectedNode}
              className="p-1 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-text-secondary hover:text-white disabled:opacity-40"
              title="Reset traversal sequence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[10px] text-text-secondary font-mono">
            Step: <strong className="text-white">{traversalStep + 1}</strong> / {traversalSequence.length || 0}
          </span>
        </div>

        {/* Ordered Visit Sequence List */}
        {traversalSequence.length > 0 && (
          <div className="pt-1.5 border-t border-navy-border/60 space-y-1">
            <div className="text-[9px] uppercase font-bold text-text-secondary flex justify-between">
              <span>Ordered Visit List ({traversalAlgorithm.toUpperCase()}):</span>
              <span className="text-accent-cyan">Active Path</span>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-0.5 text-[10px] pr-1">
              {traversalSequence.map((nodeId, idx) => {
                const isVisited = idx <= traversalStep;
                const isCurrent = idx === traversalStep;

                return (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 rounded flex items-center justify-between font-mono transition-colors ${
                      isCurrent 
                        ? 'bg-accent-blue/40 text-accent-cyan border border-accent-cyan font-bold' 
                        : isVisited 
                        ? 'bg-navy-card/60 text-white' 
                        : 'text-text-secondary/50'
                    }`}
                  >
                    <span>
                      <strong className="mr-1.5 text-accent-cyan/80">#{idx + 1}</strong>
                      {nodeNameMap[nodeId] || nodeId}
                    </span>
                    {isCurrent && <span className="text-[9px] animate-pulse">CURRENT</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
