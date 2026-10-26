import React from 'react';
import { SearchX, Filter } from 'lucide-react';

export default function EmptyState({ 
  title = "No Matching Targets Identified", 
  message = "No vessels or records matched the current surveillance criteria or search parameters.", 
  onReset 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 font-mono">
      <div className="w-12 h-12 rounded-full bg-navy-card border border-navy-border flex items-center justify-center text-text-secondary">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm leading-relaxed">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-2 px-3 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
