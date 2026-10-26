import React, { useState } from 'react';

/**
 * Dense tick-barcode visualization showing AIS transmission density.
 * Dark voids explicitly represent unmonitored blackout gaps with tooltips.
 */
export default function AisTimelineBarcode({ 
  segments = null, 
  hours = 48, 
  vesselName = "Target Vessel",
  gapCount = 2,
  className = '' 
}) {
  const [hoveredTick, setHoveredTick] = useState(null);

  // Generate synthetic 48-hour timeline ticks if custom segments not provided
  const timelineTicks = segments || Array.from({ length: 96 }).map((_, i) => {
    const hourOffset = (i * 0.5);
    // Introduce dark voids at specific intervals
    const isGap1 = i >= 32 && i <= 44; // 6-hour gap
    const isGap2 = i >= 70 && i <= 76; // 3-hour gap
    const isIrregular = (i >= 28 && i < 32) || (i > 44 && i <= 48);

    if (isGap1) {
      return { id: i, type: 'GAP', time: `${hourOffset}h ago`, label: 'DARK AIS BLACKOUT (6.0h gap)', duration: '6.0h', status: 'SIGNAL_LOST' };
    }
    if (isGap2) {
      return { id: i, type: 'GAP', time: `${hourOffset}h ago`, label: 'DARK AIS BLACKOUT (3.0h gap)', duration: '3.0h', status: 'SIGNAL_LOST' };
    }
    if (isIrregular) {
      return { id: i, type: 'IRREGULAR', time: `${hourOffset}h ago`, label: 'Degraded transmission interval (cadence >15m)', status: 'IRREGULAR_CADENCE' };
    }
    return { id: i, type: 'ACTIVE', time: `${hourOffset}h ago`, label: 'Nominal broadcast interval (30s - 2m)', status: 'NOMINAL_BROADCAST' };
  });

  return (
    <div className={`w-full font-mono select-none ${className}`}>
      {/* Header telemetry info */}
      <div className="flex items-center justify-between text-[11px] mb-2 text-text-secondary">
        <span className="flex items-center space-x-1.5 font-bold text-text-primary">
          <span className="w-2 h-2 rounded-full bg-accent-cyan" />
          <span>AIS BROADCAST DENSITY BARCODE ({hours}H WINDOW)</span>
        </span>
        <div className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-accent-cyan rounded-xs inline-block" />
            <span>Active</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-risk-warning rounded-xs inline-block" />
            <span>Degraded</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-navy-bg border border-risk-alert/60 rounded-xs inline-block" />
            <span className="text-risk-alert font-bold">Dark Void</span>
          </span>
        </div>
      </div>

      {/* Barcode Frame */}
      <div className="relative bg-navy-bg p-2 rounded border border-navy-border/80">
        <div className="flex items-stretch h-8 w-full gap-[1.5px] bg-[#070B14] p-1 rounded overflow-hidden">
          {timelineTicks.map((tick) => {
            let tickBg = 'bg-accent-cyan/80 hover:bg-accent-cyan';
            let tickHeight = 'h-full';

            if (tick.type === 'GAP') {
              tickBg = 'bg-transparent border-b-2 border-risk-alert hover:bg-risk-alert/20';
              tickHeight = 'h-full';
            } else if (tick.type === 'IRREGULAR') {
              tickBg = 'bg-risk-warning/75 hover:bg-risk-warning';
              tickHeight = 'h-3/4 self-end';
            }

            return (
              <div
                key={tick.id}
                onMouseEnter={() => setHoveredTick(tick)}
                onMouseLeave={() => setHoveredTick(null)}
                className={`flex-1 transition-all cursor-pointer ${tickHeight} ${tickBg}`}
                title={`${tick.time}: ${tick.label}`}
              />
            );
          })}
        </div>

        {/* Time Axis Markers */}
        <div className="flex justify-between text-[9px] text-text-secondary font-mono mt-1 px-1">
          <span>-48h (T-48)</span>
          <span>-36h</span>
          <span>-24h (T-24)</span>
          <span>-12h</span>
          <span className="text-accent-cyan font-bold">NOW (0h)</span>
        </div>
      </div>

      {/* Interactive Tooltip Inspector Callout */}
      {hoveredTick ? (
        <div className="mt-2 p-2 rounded bg-navy-elevated border border-navy-border text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              hoveredTick.type === 'GAP' ? 'bg-risk-alert animate-ping' :
              hoveredTick.type === 'IRREGULAR' ? 'bg-risk-warning' : 'bg-accent-cyan'
            }`} />
            <span className="text-white font-semibold">T {hoveredTick.time}:</span>
            <span className={hoveredTick.type === 'GAP' ? 'text-risk-alert font-bold' : 'text-text-secondary'}>
              {hoveredTick.label}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-navy-card border border-navy-border text-text-secondary">
            {hoveredTick.status}
          </span>
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-text-secondary/70 italic px-1 flex justify-between">
          <span>Hover ticks to inspect exact transmission windows and dark gap duration.</span>
          <span className="text-risk-warning">{gapCount} anomalous blackout voids identified</span>
        </div>
      )}
    </div>
  );
}
