import React, { useEffect, useState } from 'react';

/**
 * Thin animated top progress bar on route changes and data refreshes.
 */
export default function TopProgressBar({ isLoading = false }) {
  const [visible, setVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div 
      className="top-progress-bar"
      role="progressbar"
      aria-label="Operations Center Telemetry Synchronization"
    />
  );
}
