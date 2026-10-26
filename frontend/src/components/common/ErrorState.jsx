import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorState({ 
  title = "Telemetry Transmission Interrupted", 
  message = "An error occurred while communicating with the surveillance service.", 
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-3 font-mono" role="alert">
      <div className="w-12 h-12 rounded-full bg-risk-alert/15 border border-risk-alert/40 flex items-center justify-center text-risk-alert">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1.5 rounded bg-navy-card hover:bg-navy-elevated border border-navy-border text-xs text-accent-cyan flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-establish Connection</span>
        </button>
      )}
    </div>
  );
}
