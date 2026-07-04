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
  hasBloodBank?: boolean;
  bloodInventory?: { [type: string]: 'available' | 'low' | 'unavailable' };
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function generateMockInventory(): { [type: string]: 'available' | 'low' | 'unavailable' } {
  const inventory: { [type: string]: 'available' | 'low' | 'unavailable' } = {};
  BLOOD_TYPES.forEach(type => {
    const r = Math.random();
    if (r < 0.5) inventory[type] = 'available';
    else if (r < 0.8) inventory[type] = 'low';
    else inventory[type] = 'unavailable';
  });
  return inventory;
}

// Fallback mock hospitals for when API fails
function generateMockHospitals(lat: number, lng: number): HospitalItem[] {
  const mockNames = [
    'City Hospital', 'General Medical Centre', 'Emergency Care Clinic',
    'Diagnostic Clinic', 'Health Centre', 'Medical Plus Hospital',
    'Care Hospital', 'Advanced Medical Centre', 'Community Health Clinic'
  ];
  
  return mockNames.map((name, i) => ({
    id: 1000 + i,
    name,
    amenity: i % 3 === 0 ? 'hospital' : 'clinic',
    address: `${100 + i} Healthcare Road, Medical District`,
    lat: lat + (Math.random() - 0.5) * 0.08,
    lng: lng + (Math.random() - 0.5) * 0.08,
    phone: `+91 712 ${250000 + Math.random() * 50000 | 0}`,
    distance: Math.random() * 5,
    hasBloodBank: i % 2 === 0,
    bloodInventory: i % 2 === 0 ? generateMockInventory() : undefined,
  }));
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

    const query = `[out:json][timeout:20];(node["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});way["amenity"~"hospital|clinic"](around:${radius},${lat},${lng}););out center;`;
    const encoded = encodeURIComponent(query);
    const endpoints = [
      `https://overpass-api.de/api/interpreter?data=${encoded}`,
      `https://overpass.kumi.systems/api/interpreter?data=${encoded}`,
    ];

    let results: any[] = [];
    let success = false;

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
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
            hasBloodBank: el.id % 2 === 0,
            bloodInventory: el.id % 2 === 0 ? generateMockInventory() : undefined,
          }))
          .filter((h: any) => h.lat && h.lng);
        success = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!success) {
      // Use mock data as fallback
      const mockData = generateMockHospitals(lat, lng).map(h => ({
        ...h,
        distance: haversine(lat, lng, h.lat, h.lng),
      })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
      setHospitals(mockData);
      setError("Unable to connect to live hospital server. Displaying simulated hospital data.");
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
