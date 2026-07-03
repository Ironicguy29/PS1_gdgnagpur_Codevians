import { useState, useEffect, useCallback } from 'react';
import { haversine } from '@/lib/mapsHelper';

export interface HospitalItem {
  id: number;
  name: string;
  amenity: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  distance?: number;
}

export function useNearbyHospitals(
  location: { lat: number; lng: number } | null,
  radius = 5000
) {
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitalsList = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);

    const query = `[out:json][timeout:30];(node["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});way["amenity"~"hospital|clinic"](around:${radius},${lat},${lng}););out center;`;
    const encoded = encodeURIComponent(query);
    const endpoints = [
      `https://overpass-api.de/api/interpreter?data=${encoded}`,
      `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
    ];

    let results: any[] = [];
    let success = false;

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
        if (!res.ok) continue;
        const data = await res.json();
        results = (data.elements || [])
          .map((el: any) => ({
            id: el.id,
            name: el.tags?.name || 'Unnamed Facility',
            amenity: el.tags?.amenity || 'hospital',
            address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || el.tags?.['addr:full'] || '',
            lat: el.lat ?? el.center?.lat,
            lng: el.lon ?? el.center?.lon,
            phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
          }))
          .filter((h: any) => h.lat && h.lng);
        success = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!success) {
      setError('Hospital data temporarily unavailable. Try again shortly.');
      setLoading(false);
      return;
    }

    const withDist = results
      .map((h) => ({
        ...h,
        distance: haversine(lat, lng, h.lat, h.lng),
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    setHospitals(withDist);
    if (withDist.length === 0) {
      setError('No hospitals found within 5km. Try another area.');
    }
    setLoading(false);
  }, [radius]);

  useEffect(() => {
    if (location) {
      void fetchHospitalsList(location.lat, location.lng);
    } else {
      setHospitals([]);
    }
  }, [location, fetchHospitalsList]);

  return {
    hospitals,
    loading,
    error,
    refetch: () => {
      if (location) {
        void fetchHospitalsList(location.lat, location.lng);
      }
    },
  };
}
