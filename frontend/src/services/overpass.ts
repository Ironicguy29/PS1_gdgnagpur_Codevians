import type { FacilityCategory, HospitalFacility, OverpassElement } from '@/types/hospital';

const NAGPUR_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
};

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 20000;

let cachedFacilities: HospitalFacility[] | null = null;
let pendingRequest: Promise<HospitalFacility[]> | null = null;

const FACILITY_LABELS: Record<FacilityCategory, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  medical_centre: 'Medical Centre',
  pharmacy: 'Pharmacy',
  blood_bank: 'Blood Bank',
  ambulance_station: 'Ambulance',
  other: 'Healthcare Facility',
};

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}

function normalizeCategory(tags: Record<string, string>): FacilityCategory {
  const amenity = tags.amenity?.toLowerCase();
  const healthcare = tags.healthcare?.toLowerCase();
  const emergency = tags.emergency?.toLowerCase();

  if (amenity === 'hospital' || healthcare === 'hospital') return 'hospital';
  if (amenity === 'clinic' || healthcare === 'clinic') return 'clinic';
  if (amenity === 'pharmacy' || healthcare === 'pharmacy') return 'pharmacy';
  if (amenity === 'blood_bank' || healthcare === 'blood_bank' || healthcare === 'blood_donation') {
    return 'blood_bank';
  }
  if (emergency === 'ambulance_station' || amenity === 'ambulance_station') return 'ambulance_station';
  if (
    amenity === 'doctors' ||
    healthcare === 'doctor' ||
    healthcare === 'centre' ||
    healthcare === 'medical_center' ||
    healthcare === 'medical_centre'
  ) {
    return 'medical_centre';
  }

  return 'other';
}

function extractCoordinates(element: OverpassElement): { latitude: number; longitude: number } | null {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

function buildQuery(latitude: number, longitude: number, radiusMeters: number) {
  return `
    [out:json][timeout:60];
    (
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="hospital"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="hospital"];
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="clinic"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="clinic"];
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="doctors"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="doctor"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="centre"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="medical_center"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="medical_centre"];
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="pharmacy"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="pharmacy"];
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="blood_bank"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="blood_bank"];
      nwr(around:${radiusMeters},${latitude},${longitude})["healthcare"="blood_donation"];
      nwr(around:${radiusMeters},${latitude},${longitude})["emergency"="ambulance_station"];
      nwr(around:${radiusMeters},${latitude},${longitude})["amenity"="ambulance_station"];
    );
    out center tags;
  `;
}

export async function fetchHospitalsAroundNagpur(forceRefresh = false): Promise<HospitalFacility[]> {
  if (!forceRefresh && cachedFacilities) {
    return cachedFacilities;
  }

  if (!forceRefresh && pendingRequest) {
    return pendingRequest;
  }

  const query = buildQuery(NAGPUR_CENTER.latitude, NAGPUR_CENTER.longitude, SEARCH_RADIUS_METERS);
  const request = (async () => {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({ data: query }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Overpass API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const uniqueFacilities = new Map<string, HospitalFacility>();

    for (const element of payload.elements ?? []) {
      const coordinates = extractCoordinates(element);
      const tags = element.tags ?? {};

      if (!coordinates) {
        continue;
      }

      const category = normalizeCategory(tags);
      const key = `${element.type}:${element.id}`;
      const name = tags.name?.trim() || FACILITY_LABELS[category];

      uniqueFacilities.set(key, {
        id: key,
        name,
        category,
        categoryLabel: FACILITY_LABELS[category],
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: buildAddress(tags),
        tags,
      });
    }

    const facilities = Array.from(uniqueFacilities.values());
    cachedFacilities = facilities;
    return facilities;
  })();

  if (!forceRefresh) {
    pendingRequest = request;
  }

  try {
    return await request;
  } finally {
    if (!forceRefresh) {
      pendingRequest = null;
    }
  }
}

export { NAGPUR_CENTER };
