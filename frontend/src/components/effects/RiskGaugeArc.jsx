import React, { useEffect, useState } from 'react';

/**
 * Tactical SVG Arc Gauge.
 * STRICT SPECIFICATION:
 * - Animated needle / arc to the anomaly score.
 * - Explicitly labeled "Anomaly score (uncalibrated)".
 * - Never styled like a probability or a "danger meter" percentage.
 */
export default function RiskGaugeArc({ 
  score = 0, 
  size = 180, 
  showLabel = true,
  className = '' 
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const isReduced = 
      document.body.classList.contains('reduce-effects') || 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      setAnimatedScore(Number(score) || 0);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedScore(Number(score) || 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [score]);

  // Radius and Arc parameters (220 degree arc from 160 deg to 380 deg)
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const center = size / 2;

  // Arc angle calculation
  const startAngle = -210; // degrees
  const endAngle = 30;    // degrees
  const totalAngle = endAngle - startAngle; // 240 degrees

  const normalized = Math.min(Math.max(animatedScore, 0), 1);
  const currentAngle = startAngle + totalAngle * normalized;

  // Determine color based on scientific tier
  let arcColor = '#39D98A';
  if (normalized >= 0.65) arcColor = '#FF5C65';
  else if (normalized >= 0.45) arcColor = '#F5B942';
  else if (normalized >= 0.25) arcColor = '#4285F4';

  // Helper to convert polar to cartesian coordinates
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, r, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, endAngle);
  const valueArc = normalized > 0.01 
    ? describeArc(center, center, radius, startAngle, currentAngle)
    : '';

  // Needle tip coordinate
  const needleTip = polarToCartesian(center, center, radius - 8, currentAngle);
  const needleBase1 = polarToCartesian(center, center, 6, currentAngle + 90);
  const needleBase2 = polarToCartesian(center, center, 6, currentAngle - 90);

  return (
    <div className={`flex flex-col items-center justify-center font-mono select-none ${className}`}>
      <svg 
        width={size} 
        height={size * 0.75} 
        viewBox={`0 0 ${size} ${size * 0.85}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={arcColor} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Range Segment Ticks */}
        {[-210, -150, -90, -30, 30].map((angle, idx) => {
          const inner = polarToCartesian(center, center, radius - strokeWidth / 2 - 3, angle);
          const outer = polarToCartesian(center, center, radius + strokeWidth / 2 + 3, angle);
          return (
            <line
              key={idx}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#334155"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Foreground Colored Arc */}
        {valueArc && (
          <path
            d={valueArc}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#arcGlow)"
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Needle */}
        <polygon
          points={`${center},${center} ${needleBase1.x},${needleBase1.y} ${needleTip.x},${needleTip.y} ${needleBase2.x},${needleBase2.y}`}
          fill={arcColor}
          opacity="0.9"
          className="transition-all duration-700 ease-out"
        />
        <circle cx={center} cy={center} r="5" fill="#0B1220" stroke={arcColor} strokeWidth="2" />

        {/* Score Value readout in center */}
        <text
          x={center}
          y={center + size * 0.22}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={size * 0.13}
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
        >
          {score.toFixed(4)}
        </text>

        {/* Range bounds */}
        <text x={center - radius} y={center + size * 0.18} textAnchor="middle" fill="#64748B" fontSize="9">
          0.0
        </text>
        <text x={center + radius} y={center + size * 0.18} textAnchor="middle" fill="#64748B" fontSize="9">
          1.0
        </text>
      </svg>

      {/* Mandatory Scientific Label */}
      {showLabel && (
        <div className="text-center mt-1">
          <div className="text-[11px] font-bold tracking-wider text-text-primary">
            Anomaly score (uncalibrated)
          </div>
          <div className="text-[9px] text-text-secondary uppercase tracking-tight">
            Heuristic behavioral anomaly index
          </div>
        </div>
      )}
    </div>
  );
}
