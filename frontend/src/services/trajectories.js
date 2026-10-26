/**
 * Trajectories Service Module.
 * Connects to /api/trajectories/{mmsi} with fallback to demoTrajectories adapter.
 */

import { apiClient } from './api';
import { getDemoTrajectory } from './demo/demoTrajectories';
import { DEMO_VESSELS } from './demo/demoVessels';

export async function getTrajectoryByMmsi(mmsi, signal) {
  try {
    const res = await apiClient(`/api/trajectories/${mmsi}`, { signal });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isDemo: false };
    }
  } catch (err) {
    console.warn(`Backend /api/trajectories/${mmsi} unreachable. Using demo trajectory.`, err.message);
  }

  const v = DEMO_VESSELS.find(item => item.mmsi === String(mmsi)) || DEMO_VESSELS[0];
  const demoData = getDemoTrajectory(mmsi, v.lat, v.lng, v.speed, v.heading);
  return { data: demoData, isDemo: true };
}
