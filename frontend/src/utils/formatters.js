/**
 * Utility Formatters for Maritime Intelligence Metrics.
 */

export function formatCoords(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
}

export function formatKnots(speed) {
  if (speed === undefined || speed === null) return '0.0 kn';
  return `${Number(speed).toFixed(1)} kn`;
}

export function formatCourse(heading) {
  if (heading === undefined || heading === null) return '000°';
  return `${String(Math.round(heading)).padStart(3, '0')}°`;
}

export function formatScore(score) {
  if (score === undefined || score === null) return '0.0000';
  return Number(score).toFixed(4);
}

export function formatPercent(score) {
  if (score === undefined || score === null) return '0%';
  return `${Math.round(Number(score) * 100)}%`;
}

export function formatDwt(dwt) {
  if (!dwt) return 'N/A';
  return `${Number(dwt).toLocaleString()} t`;
}

export function getTierColor(tier) {
  switch (tier) {
    case 'CRITICAL_MONITORING':
      return {
        text: 'text-risk-alert',
        bg: 'bg-risk-alert/15',
        border: 'border-risk-alert/40',
        badge: 'bg-risk-alert/20 text-risk-alert border-risk-alert/40',
        hex: '#FF5C65',
      };
    case 'ELEVATED_ATTENTION':
      return {
        text: 'text-risk-warning',
        bg: 'bg-risk-warning/15',
        border: 'border-risk-warning/40',
        badge: 'bg-risk-warning/20 text-risk-warning border-risk-warning/40',
        hex: '#F5B942',
      };
    case 'MODERATE_INTERACTION':
      return {
        text: 'text-accent-cyan',
        bg: 'bg-accent-blue/15',
        border: 'border-accent-cyan/40',
        badge: 'bg-accent-blue/20 text-accent-cyan border-accent-blue/40',
        hex: '#4285F4',
      };
    default:
      return {
        text: 'text-risk-success',
        bg: 'bg-risk-success/15',
        border: 'border-risk-success/40',
        badge: 'bg-risk-success/20 text-risk-success border-risk-success/40',
        hex: '#39D98A',
      };
  }
}
