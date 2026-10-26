/**
 * Anomaly Events Service Module.
 * Connects to /api/events with fallback to demoEvents adapter.
 */

import { apiClient } from './api';
import { DEMO_EVENTS } from './demo/demoEvents';

export async function getAnomalyEvents(signal) {
  try {
    const res = await apiClient('/api/events', { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/events unreachable. Using demo events adapter.", err.message);
  }

  return { data: DEMO_EVENTS, isDemo: true };
}
