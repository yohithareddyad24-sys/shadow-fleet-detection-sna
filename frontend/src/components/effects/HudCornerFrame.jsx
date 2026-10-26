import React from 'react';

/**
 * Corner "bracket" tick marks on map frames and key panels for a military HUD feel.
 */
export default function HudCornerFrame({ 
  children, 
  className = '', 
  cornerColor = '#20D5E8',
  tickSize = 8,
  glow = false
}) {
  const tickStyle = {
    borderColor: cornerColor,
    width: `${tickSize}px`,
    height: `${tickSize}px`,
    boxShadow: glow ? `0 0 6px ${cornerColor}` : 'none',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Top Left Tick */}
      <span 
        className="absolute top-0 left-0 border-t-2 border-l-2 pointer-events-none z-20"
        style={tickStyle}
      />
      {/* Top Right Tick */}
      <span 
        className="absolute top-0 right-0 border-t-2 border-r-2 pointer-events-none z-20"
        style={tickStyle}
      />
      {/* Bottom Left Tick */}
      <span 
        className="absolute bottom-0 left-0 border-b-2 border-l-2 pointer-events-none z-20"
        style={tickStyle}
      />
      {/* Bottom Right Tick */}
      <span 
        className="absolute bottom-0 right-0 border-b-2 border-r-2 pointer-events-none z-20"
        style={tickStyle}
      />

      {children}
    </div>
  );
}
