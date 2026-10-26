/**
 * Encounters Service Module.
 * Connects to /api/encounters with fallback to demoEncounters adapter.
 */

import { apiClient } from './api';
import { DEMO_ENCOUNTERS } from './demo/demoEncounters';

export async function getEncounters(signal) {
  try {
    const res = await apiClient('/api/encounters', { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn("Backend /api/encounters unreachable. Using demo encounters adapter.", err.message);
  }

  return { data: DEMO_ENCOUNTERS, isDemo: true };
}
