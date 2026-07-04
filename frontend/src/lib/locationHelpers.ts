import { HospitalItem } from '@/hooks/useNearbyHospitals';
import { haversine } from '@/lib/mapsHelper';
import React from 'react';

/**
 * getCurrentLocation
 * 
 * Fetches user's current GPS location via browser Geolocation API.
 * This is designed as a promise-based wrapper to easily support future fallback
 * providers (IP geolocation, manual picking, etc.) without altering component usage.
 */
export async function getCurrentLocation(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * reverseGeocode
 * 
 * Takes latitude and longitude, queries Nominatim OpenStreetMap API,
 * and returns a friendly readable address or fallback coordinates.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'ArogyaMitra/1.0' } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (err) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * searchNearbyHospitals
 * 
 * Standalone search utility. Queries OpenStreetMap Overpass API for hospitals/clinics
 * around a specific coordinate, returns sorted list of HospitalItems.
 */
export async function searchNearbyHospitals(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<HospitalItem[]> {
  const radius = radiusKm * 1000;
  const query = `[out:json][timeout:20];(node["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});way["amenity"~"hospital|clinic"](around:${radius},${lat},${lng}););out center;`;
  const encoded = encodeURIComponent(query);
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encoded}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const data = await res.json();
      const results = (data.elements || [])
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || 'Unnamed Facility',
          amenity: el.tags?.amenity || 'hospital',
          address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || el.tags?.['addr:full'] || '',
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
        }))
        .filter((h: any) => h.lat && h.lng)
        .map((h: any) => ({
          ...h,
          distance: haversine(lat, lng, h.lat, h.lng),
        }))
        .sort((a: any, b: any) => (a.distance ?? 0) - (b.distance ?? 0));
      return results;
    } catch (e) {
      continue;
    }
  }
  throw new Error('All Overpass API endpoints failed');
}

/**
 * moveMapToLocation
 * 
 * Smoothly animations map camera coordinates, zoom, pitch, and bearing.
 */
export function moveMapToLocation(
  map: any,
  lat: number,
  lng: number,
  zoom?: number,
  options?: { pitch?: number; bearing?: number; speed?: number }
): void {
  if (!map) return;
  map.flyTo({
    center: [lng, lat],
    zoom: zoom ?? map.getZoom(),
    pitch: options?.pitch ?? map.getPitch(),
    bearing: options?.bearing ?? map.getBearing(),
    speed: options?.speed ?? 1.2,
  });
}

/**
 * updateLocationState
 * 
 * Reusable wrapper to update location state reactively.
 */
export function updateLocationState<T>(
  stateSetter: React.Dispatch<React.SetStateAction<T>>,
  newState: T | ((prev: T) => T)
): void {
  stateSetter(newState);
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
