/**
 * DEMO DATA ADAPTER: Broadcast AIS Trajectories
 * Synthetic kinematic sequences over open water.
 */

export function getDemoTrajectory(mmsi, baseLat = 36.42, baseLng = 22.85, speed = 1.2, heading = 142) {
  return [
    {
      timestamp: "2026-10-24 06:00 UTC",
      lat: Number((baseLat - 0.85).toFixed(4)),
      lng: Number((baseLng - 1.15).toFixed(4)),
      speed: 12.4,
      course: 140,
      event: "AIS_ACTIVE",
      isDemo: true,
    },
    {
      timestamp: "2026-10-24 18:00 UTC",
      lat: Number((baseLat - 0.55).toFixed(4)),
      lng: Number((baseLng - 0.75).toFixed(4)),
      speed: 11.8,
      course: 138,
      event: "AIS_ACTIVE",
      isDemo: true,
    },
    {
      timestamp: "2026-10-25 04:00 UTC",
      lat: Number((baseLat - 0.25).toFixed(4)),
      lng: Number((baseLng - 0.35).toFixed(4)),
      speed: 6.2,
      course: 145,
      event: "SPEED_REDUCTION",
      isDemo: true,
    },
    {
      timestamp: "2026-10-25 12:00 UTC",
      lat: Number((baseLat - 0.08).toFixed(4)),
      lng: Number((baseLng - 0.08).toFixed(4)),
      speed: 1.1,
      course: 142,
      event: "STS_RENDEZVOUS_START",
      isDemo: true,
    },
    {
      timestamp: "2026-10-26 06:00 UTC",
      lat: Number(baseLat.toFixed(4)),
      lng: Number(baseLng.toFixed(4)),
      speed: speed,
      course: heading,
      event: "MONITORED_POSITION",
      isDemo: true,
    },
  ];
}
