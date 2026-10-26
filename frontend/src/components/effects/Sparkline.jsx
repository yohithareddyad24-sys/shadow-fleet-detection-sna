import React from 'react';

/**
 * Compact SVG Sparkline for KPI cards and table rows.
 * Uses linear gradient fill and glowing stroke.
 */
export default function Sparkline({ 
  data = [12, 14, 11, 16, 18, 15, 22, 20, 25], 
  width = 80, 
  height = 20, 
  color = '#20D5E8',
  className = '' 
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  // Calculate points
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * usableWidth;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}-${Math.floor(Math.random() * 10000)}`;

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible inline-block align-middle ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Subtle Area Fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Main Sparkline Stroke */}
      <path 
        d={pathD} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Latest value point */}
      <circle 
        cx={points[points.length - 1].x} 
        cy={points[points.length - 1].y} 
        r="2" 
        fill={color} 
      />
    </svg>
  );
}
