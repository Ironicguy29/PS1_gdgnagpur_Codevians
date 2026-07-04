export type FacilityCategory =
  | 'hospital'
  | 'clinic'
  | 'medical_centre'
  | 'pharmacy'
  | 'blood_bank'
  | 'ambulance_station'
  | 'other';

export interface HospitalFacility {
  id: string;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  address: string | null;
  tags: Record<string, string>;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
