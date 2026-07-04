export interface LocationConfig {
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

export const DEFAULT_LOCATION: LocationConfig = {
  name: 'Nagpur',
  latitude: 21.1458,
  longitude: 79.0882,
  zoom: 13,
};

export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const SEARCH_RADIUS_OPTIONS = [5, 10, 25, 50];

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
