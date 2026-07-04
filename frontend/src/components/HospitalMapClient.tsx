'use client';

import 'leaflet-defaulticon-compatibility';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import L, { type DivIcon, type Map as LeafletMap } from 'leaflet';
import Supercluster, { type BBox, type PointFeature } from 'supercluster';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  Building2,
  Droplets,
  HeartPulse,
  LocateFixed,
  MapPin,
  Pill,
  Search,
  Siren,
  Stethoscope,
  Loader2,
  ChevronRight,
  Star,
  Activity,
  Phone,
  Navigation,
  CheckCircle,
  HelpCircle,
  Share2,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Flame,
  type LucideIcon,
} from 'lucide-react';

import { useHospitals } from '@/hooks/useHospitals';
import { NAGPUR_CENTER } from '@/services/overpass';
import type { FacilityCategory, HospitalFacility, UserLocation } from '@/types/hospital';

const NAGPUR_VIEW = {
  latitude: NAGPUR_CENTER.latitude,
  longitude: NAGPUR_CENTER.longitude,
  zoom: 13,
};

interface FacilityPointProperties {
  facilityId: string;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  address: string | null;
  latitude: number;
  longitude: number;
  // Dynamic fields added for Discovery Platform
  rating: number;
  beds: number;
  icuBeds: number;
  waitTime: number;
  doctors: string[];
  departments: string[];
  insuranceAccepted: boolean;
  abhaEnabled: boolean;
  phone: string;
  hours: string;
  isOpen: boolean;
}

type ClusterProperties = FacilityPointProperties | { cluster: true; point_count: number };

const FACILITY_STYLES: Record<
  FacilityCategory,
  {
    label: string;
    emoji: string;
    pill: string;
    marker: string;
    text: string;
    icon: LucideIcon;
  }
> = {
  hospital: {
    label: 'Hospital',
    emoji: '🏥',
    pill: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    marker: 'bg-rose-600 text-white ring-rose-500/20',
    text: 'text-rose-400',
    icon: HeartPulse,
  },
  clinic: {
    label: 'Clinic',
    emoji: '🩺',
    pill: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
    marker: 'bg-sky-600 text-white ring-sky-500/20',
    text: 'text-sky-400',
    icon: Stethoscope,
  },
  medical_centre: {
    label: 'Medical Centre',
    emoji: '🏥',
    pill: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    marker: 'bg-indigo-600 text-white ring-indigo-500/20',
    text: 'text-indigo-400',
    icon: Building2,
  },
  pharmacy: {
    label: 'Pharmacy',
    emoji: '💊',
    pill: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    marker: 'bg-emerald-600 text-white ring-emerald-500/20',
    text: 'text-emerald-400',
    icon: Pill,
  },
  blood_bank: {
    label: 'Blood Bank',
    emoji: '🩸',
    pill: 'border-red-500/20 bg-red-500/10 text-red-400',
    marker: 'bg-red-600 text-white ring-red-500/20',
    text: 'text-red-400',
    icon: Droplets,
  },
  ambulance_station: {
    label: 'Ambulance',
    emoji: '🚑',
    pill: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    marker: 'bg-amber-500 text-white ring-amber-500/20',
    text: 'text-amber-400',
    icon: Siren,
  },
  other: {
    label: 'Healthcare Facility',
    emoji: '📍',
    pill: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
    marker: 'bg-slate-600 text-white ring-slate-500/20',
    text: 'text-slate-400',
    icon: MapPin,
  },
};

// Generates robust static attributes for facilities dynamically
const mockDetailGenerator = (id: string, name: string, category: FacilityCategory) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = parseFloat((4.0 + (hash % 10) * 0.1).toFixed(1));
  const beds = 10 + (hash % 150);
  const icuBeds = 2 + (hash % 20);
  const waitTime = 5 + (hash % 45); // Minutes
  const phone = `+91 712 25${(hash % 9000) + 1000}`;
  
  // Generate opening hours (most facilities 9 AM - 9 PM, some 24/7)
  const is24Hour = hash % 5 === 0; // 20% are 24-hour
  const openHour = is24Hour ? 0 : 9;
  const closeHour = is24Hour ? 24 : 21;
  const hours = is24Hour ? '24/7' : `${openHour}:00 AM - ${closeHour === 24 ? '12:00 AM' : `${closeHour % 12}:00 PM`}`;
  
  // Determine if open right now (simplified: assume current time is 10 AM)
  const currentHour = 10;
  const isOpen = is24Hour || (currentHour >= openHour && currentHour < closeHour);
  
  const doctorsPool = [
    'Dr. Sanjay Deshmukh (Cardiologist)',
    'Dr. Meera Sen (Gynecologist)',
    'Dr. Amit Verma (Pediatrician)',
    'Dr. Rohan Patil (Neurologist)',
    'Dr. Sneha Joshi (General Surgeon)',
    'Dr. K. R. Rao (Orthopedic)',
    'Dr. Pooja Shah (Oncologist)'
  ];
  
  const deptsPool = [
    'Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 
    'Gynecology', 'Emergency Medicine', 'ICU Care', 'General Medicine'
  ];

  const countD = 2 + (hash % 4);
  const doctors = [];
  for (let i = 0; i < countD; i++) {
    doctors.push(doctorsPool[(hash + i) % doctorsPool.length]);
  }

  const countDept = 3 + (hash % 3);
  const departments = [];
  for (let i = 0; i < countDept; i++) {
    departments.push(deptsPool[(hash + i) % deptsPool.length]);
  }

  return {
    rating,
    beds,
    icuBeds,
    waitTime,
    doctors,
    departments,
    insuranceAccepted: hash % 2 === 0,
    abhaEnabled: hash % 3 !== 0,
    phone,
    hours,
    isOpen,
  };
};

function toPointFeature(facility: HospitalFacility): PointFeature<FacilityPointProperties> {
  const details = mockDetailGenerator(facility.id, facility.name, facility.category);
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [facility.longitude, facility.latitude],
    },
    properties: {
      facilityId: facility.id,
      name: facility.name,
      category: facility.category,
      categoryLabel: facility.categoryLabel,
      address: facility.address,
      latitude: facility.latitude,
      longitude: facility.longitude,
      ...details,
    },
  };
}

function createMarkerIcon(category: FacilityCategory, isHighlighted = false): DivIcon {
  const style = FACILITY_STYLES[category];
  const ringColor = isHighlighted ? 'ring-cyan-400 scale-110 shadow-cyan-500/50' : 'ring-white/10';

  return L.divIcon({
    className: '',
    html: `
      <div class="flex h-11 w-11 items-center justify-center rounded-full ${style.marker} shadow-2xl ring-4 ${ringColor} transition-transform duration-300">
        <span class="text-base leading-none">${style.emoji}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
  });
}

function createClusterIcon(pointCount: number): DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-sm font-semibold text-white shadow-xl ring-4 ring-cyan-500/20">
        ${pointCount}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -42],
  });
}

function createUserLocationIcon(): DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="flex h-6 w-6 items-center justify-center relative">
        <span class="absolute h-6 w-6 animate-ping rounded-full bg-cyan-400/40"></span>
        <span class="relative h-4.5 w-4.5 rounded-full border-2 border-white bg-cyan-500 shadow-xl"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createAmbulanceIcon(status: string): DivIcon {
  const glowColor = status === 'Responding' ? 'bg-rose-500 ring-rose-500/30' : 'bg-amber-500 ring-amber-500/30';
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-white/20 shadow-xl ring-2 ${glowColor}">
        <span class="text-xs leading-none">🚑</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function buildBoundsArray(bounds: L.LatLngBounds): BBox {
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}

function MapBridge({ onMapReady, onViewportChange }: {
  onMapReady: (map: LeafletMap) => void;
  onViewportChange: (bounds: BBox, zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    const raf = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(raf);
  }, [map, onMapReady]);

  useMapEvents({
    moveend: () => onViewportChange(buildBoundsArray(map.getBounds()), map.getZoom()),
    zoomend: () => onViewportChange(buildBoundsArray(map.getBounds()), map.getZoom()),
  });

  useEffect(() => {
    onViewportChange(buildBoundsArray(map.getBounds()), map.getZoom());
  }, [map, onViewportChange]);

  return null;
}

export default function HospitalMapClient() {
  const { facilities, status, error, isLoading, refetch } = useHospitals();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [viewport, setViewport] = useState<{ bounds: BBox; zoom: number } | null>(null);
  
  // Advanced filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [onlyAbha, setOnlyAbha] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [minBeds, setMinBeds] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(20); // km
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  
  // Heatmap and active layer selections
  const [activeHeatmap, setActiveHeatmap] = useState<string | null>(null);
  const [trafficOverlay, setTrafficOverlay] = useState(false);

  // Active items
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [simulatedRoute, setSimulatedRoute] = useState<[number, number][] | null>(null);
  const selectedCardRef = useRef<HTMLDivElement | null>(null);
  
  // User Location
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>({
    latitude: NAGPUR_VIEW.latitude,
    longitude: NAGPUR_VIEW.longitude
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Live ambulances mock
  const [ambulances, setAmbulances] = useState([
    { id: 'amb-1', lat: 21.1412, lng: 79.0815, status: 'Responding', speed: 45 },
    { id: 'amb-2', lat: 21.1525, lng: 79.0982, status: 'Available', speed: 0 },
    { id: 'amb-3', lat: 21.1320, lng: 79.0720, status: 'Responding', speed: 60 }
  ]);

  // Slowly drift ambulance locations to simulate real-time moving targets
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances(prev => prev.map(amb => {
        if (amb.status === 'Responding') {
          return {
            ...amb,
            lat: amb.lat + (Math.random() - 0.5) * 0.0008,
            lng: amb.lng + (Math.random() - 0.5) * 0.0008,
          };
        }
        return amb;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to selected facility card when marker is clicked
  useEffect(() => {
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFacility]);

  // Facility enrichment helper
  const enrichedFacilities = useMemo(() => {
    return facilities.map((facility) => {
      const details = mockDetailGenerator(facility.id, facility.name, facility.category);
      // Calculate real distance in km from Selected Location
      let distance = 0;
      if (selectedLocation) {
        const radlat1 = (Math.PI * selectedLocation.latitude) / 180;
        const radlat2 = (Math.PI * facility.latitude) / 180;
        const theta = selectedLocation.longitude - facility.longitude;
        const radtheta = (Math.PI * theta) / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist > 1 ? 1 : dist);
        dist = (dist * 180) / Math.PI;
        distance = parseFloat((dist * 60 * 1.1515 * 1.609344).toFixed(1)); // km
      }

      return {
        id: facility.id,
        name: facility.name,
        category: facility.category,
        categoryLabel: facility.categoryLabel,
        latitude: facility.latitude,
        longitude: facility.longitude,
        address: facility.address || 'Nagpur Central, Maharashtra',
        tags: facility.tags,
        distance,
        ...details
      };
    });
  }, [facilities, selectedLocation]);

  // Autocomplete Suggestions logic
  const autocompleteSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    // Scan matching words
    const matches: string[] = [];
    const lowerQuery = searchTerm.toLowerCase();

    // Check pre-packaged medical matches
    const medicalTerms = ['Cardiology', 'ICU', 'MRI', 'Blood Bank', 'Pharmacy', 'Emergency', 'Dialysis', 'CT Scan'];
    medicalTerms.forEach(term => {
      if (term.toLowerCase().includes(lowerQuery) && !matches.includes(term)) {
        matches.push(term);
      }
    });

    enrichedFacilities.forEach(fac => {
      if (fac.name.toLowerCase().includes(lowerQuery) && !matches.includes(fac.name)) {
        matches.push(fac.name);
      }
    });

    return matches.slice(0, 5);
  }, [searchTerm, enrichedFacilities]);

  // AI Symptoms Advisor Recommendation
  const aiRecommendation = useMemo(() => {
    const query = searchTerm.toLowerCase();
    if (query.includes('chest pain') || query.includes('heart') || query.includes('cardio')) {
      return {
        title: 'Cardiac Priority Dispatch Alert',
        severity: 'Critical',
        text: 'Chest pain detected. Recommending emergency dispatch with active Cardiology Depts and Free ICU beds.',
        bestHospital: 'Orange City Hospital & Research Institute',
        reason: 'Shortest wait time (8 min) with 5 available ICU beds. Emergency cardiology unit active.',
      };
    }
    if (query.includes('accident') || query.includes('fracture') || query.includes('trauma')) {
      return {
        title: 'Trauma & Fracture Response',
        severity: 'High',
        text: 'Accident reported. Recommending nearest trauma care center with orthopedics and active CT Scan/X-Ray services.',
        bestHospital: 'Kingsway Hospital Nagpur',
        reason: 'Only 12 mins travel time. Orthopedic surgeon on duty with zero queue delay.',
      };
    }
    if (query.includes('blood') || query.includes('plasma')) {
      return {
        title: 'Blood Bank Stock Discovery',
        severity: 'Normal',
        text: 'Searching for emergency blood availability.',
        bestHospital: 'Nagpur Central Blood Bank',
        reason: 'O-Negative and B-Positive reserve packages verified online within 5 mins.',
      };
    }
    return null;
  }, [searchTerm]);

  // Filter facilities on all selections
  const filteredFacilities = useMemo(() => {
    return enrichedFacilities.filter((facility) => {
      // 1. Text Search matching name, doctors, depts, tags
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesName = facility.name.toLowerCase().includes(lowerSearch);
        const matchesDept = facility.departments.some(d => d.toLowerCase().includes(lowerSearch));
        const matchesDoc = facility.doctors.some(d => d.toLowerCase().includes(lowerSearch));
        const matchesAddr = facility.address.toLowerCase().includes(lowerSearch);
        
        if (!matchesName && !matchesDept && !matchesDoc && !matchesAddr) {
          return false;
        }
      }

      // 2. Category selection
      if (selectedCategory && facility.category !== selectedCategory) {
        return false;
      }

      // 3. ABHA enabled
      if (onlyAbha && !facility.abhaEnabled) {
        return false;
      }

      // 4. Emergency focus
      if (onlyEmergency && facility.category !== 'hospital' && facility.category !== 'ambulance_station') {
        return false;
      }

      // 5. Min Beds available
      if (minBeds > 0 && facility.beds < minBeds) {
        return false;
      }

      // 6. Max Distance limit
      if (selectedLocation && facility.distance > maxDistance) {
        return false;
      }

      // 7. Min Rating filter
      if (ratingFilter && facility.rating < ratingFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedFacilities, searchTerm, selectedCategory, onlyAbha, onlyEmergency, minBeds, maxDistance, ratingFilter, selectedLocation]);

  // Supercluster setup
  const clusterIndex = useMemo(() => {
    const index = new Supercluster<FacilityPointProperties>({
      radius: 75,
      maxZoom: 16,
      minPoints: 2,
    });

    index.load(filteredFacilities.map(f => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [f.longitude, f.latitude] },
      properties: {
        facilityId: f.id,
        name: f.name,
        category: f.category,
        categoryLabel: f.categoryLabel,
        address: f.address,
        latitude: f.latitude,
        longitude: f.longitude,
        rating: f.rating,
        beds: f.beds,
        icuBeds: f.icuBeds,
        waitTime: f.waitTime,
        doctors: f.doctors,
        departments: f.departments,
        insuranceAccepted: f.insuranceAccepted,
        abhaEnabled: f.abhaEnabled,
        phone: f.phone,
        hours: f.hours,
        isOpen: f.isOpen
      }
    })));
    return index;
  }, [filteredFacilities]);

  const clusters = useMemo(() => {
    if (!viewport) return [];
    return clusterIndex.getClusters(viewport.bounds, Math.round(viewport.zoom)) as Array<
      PointFeature<ClusterProperties>
    >;
  }, [clusterIndex, viewport]);

  const handleMapReady = useCallback((instance: LeafletMap) => {
    setMap(instance);
  }, []);

  const handleViewportChange = useCallback((bounds: BBox, zoom: number) => {
    setViewport(current => {
      if (
        current &&
        current.zoom === zoom &&
        current.bounds[0] === bounds[0] &&
        current.bounds[1] === bounds[1] &&
        current.bounds[2] === bounds[2] &&
        current.bounds[3] === bounds[3]
      ) {
        return current;
      }
      return { bounds, zoom };
    });
  }, []);

  // Simulates drawing a neon route to a selected hospital
  const handleDirections = (destLat: number, destLng: number) => {
    if (!selectedLocation) return;
    
    // Draw a neat diagonal mock route with some zig-zags
    const midLat = (selectedLocation.latitude + destLat) / 2 + 0.002;
    const midLng = (selectedLocation.longitude + destLng) / 2 - 0.002;
    
    const routeCoordinates: [number, number][] = [
      [selectedLocation.latitude, selectedLocation.longitude],
      [selectedLocation.latitude + 0.001, selectedLocation.longitude + 0.003],
      [midLat, midLng],
      [destLat - 0.001, destLng - 0.002],
      [destLat, destLng]
    ];

    setSimulatedRoute(routeCoordinates);
    map?.fitBounds(L.latLngBounds(routeCoordinates), { padding: [50, 50] });
  };

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setSelectedLocation(nextLocation);
        setIsLocating(false);
        map?.flyTo([nextLocation.latitude, nextLocation.longitude], 15, { animate: true });
      },
      () => {
        setIsLocating(false);
        setLocationMessage('Location permission denied.');
      }
    );
  }, [map]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setOnlyAbha(false);
    setOnlyEmergency(false);
    setMinBeds(0);
    setMaxDistance(20);
    setRatingFilter(null);
    setSimulatedRoute(null);
    setSelectedFacility(null);
    setActiveHeatmap(null);
    setTrafficOverlay(false);
    map?.setView([NAGPUR_VIEW.latitude, NAGPUR_VIEW.longitude], NAGPUR_VIEW.zoom);
  };

  // Listen for external window events to control filters/search
  useEffect(() => {
    const handleMapAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.search !== undefined) setSearchTerm(customEvent.detail.search);
        if (customEvent.detail.category !== undefined) setSelectedCategory(customEvent.detail.category);
        if (customEvent.detail.onlyEmergency !== undefined) setOnlyEmergency(customEvent.detail.onlyEmergency);
      }
    };
    window.addEventListener('map-action', handleMapAction);
    return () => window.removeEventListener('map-action', handleMapAction);
  }, []);

  return (
    <div id="facility-map" className="w-full flex flex-col gap-6 pt-12 pb-16">
      
      {/* 1. Interactive Header Controls */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-white/5 pb-6">
        
        {/* Unified Smart Search bar */}
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hospitals, doctors, specializations, CT scan, blood..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-slate-900/60 focus:border-cyan-500/50 focus:outline-none text-sm text-white placeholder-slate-400 transition-colors"
          />

          {/* Autocomplete suggestions dropdown */}
          {autocompleteSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 p-2 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-[500] flex flex-col gap-1">
              {autocompleteSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchTerm(sug);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Location controllers */}
        <div className="lg:col-span-6 flex flex-wrap gap-3 lg:justify-end">
          <button
            onClick={useCurrentLocation}
            className="px-4 py-2 text-xs font-bold rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            Locate Me
          </button>
          
          <button
            onClick={() => setOnlyEmergency(!onlyEmergency)}
            className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors flex items-center gap-1.5 ${
              onlyEmergency 
                ? 'bg-rose-500 border-rose-400 text-white' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
            }`}
          >
            <Siren className="w-3.5 h-3.5 animate-pulse" />
            Emergency Center
          </button>

          <button
            onClick={resetAllFilters}
            className="px-4 py-2 text-xs font-bold rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            Reset View
          </button>
        </div>

      </div>

      {/* 2. AI Recommendation Alert (Symptom Matching card) */}
      {aiRecommendation && (
        <div className="w-full p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 to-slate-950/40 border border-cyan-500/20 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-bold tracking-widest">{aiRecommendation.severity}</span>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                {aiRecommendation.title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">{aiRecommendation.text}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 min-w-[280px]">
            <span className="block text-[10px] uppercase font-semibold text-cyan-400 tracking-wider">Top Recommendation</span>
            <span className="block text-xs font-bold text-white mt-1">{aiRecommendation.bestHospital}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">{aiRecommendation.reason}</span>
          </div>
        </div>
      )}

      {/* 3. Main Discovery Dashboard Workspace */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 relative min-h-[600px]">
        
        {/* LEFT SEARCH PANEL: Matching List */}
        <div className="xl:col-span-3 flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-xs uppercase tracking-widest font-bold text-slate-400 px-1">
            Nearby Facilities ({filteredFacilities.length})
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/10 text-center space-y-3">
              <Info className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">
                {maxDistance < 20 ? `No facilities within ${maxDistance} km.` : selectedCategory && selectedCategory in FACILITY_STYLES ? `No ${FACILITY_STYLES[selectedCategory as FacilityCategory].label}s match your criteria.` : 'No facilities match your search.'}
              </p>
              <button onClick={resetAllFilters} className="text-xs font-bold text-cyan-400 hover:underline">Clear All Filters</button>
            </div>
          ) : (
            filteredFacilities.map((fac) => (
              <div
                key={fac.id}
                ref={highlightedId === fac.id ? selectedCardRef : null}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedFacility(fac);
                  setHighlightedId(fac.id);
                  map?.flyTo([fac.latitude, fac.longitude], 15, { animate: true });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedFacility(fac);
                    setHighlightedId(fac.id);
                    map?.flyTo([fac.latitude, fac.longitude], 15, { animate: true });
                  }
                }}
                aria-label={`${fac.name}, ${fac.categoryLabel}, ${fac.distance} km away, Rating ${fac.rating}`}
                className={`p-4 rounded-2xl border transition-all cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-cyan-400 flex flex-col justify-between min-h-[140px] ${
                  highlightedId === fac.id 
                    ? 'border-cyan-500/50 bg-[#090d16]/80' 
                    : 'border-white/5 bg-slate-900/20 hover:border-white/10 hover:bg-slate-900/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${FACILITY_STYLES[fac.category].pill}`}>
                      {fac.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{fac.distance} km away</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2 group-hover:text-cyan-400 transition-colors line-clamp-1">{fac.name}</h4>
                  
                  <div className="flex items-center gap-3.5 mt-2.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                      {fac.rating}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      {fac.beds} Beds
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {fac.waitTime}m
                    </div>
                    <div className={`text-[11px] font-semibold ${fac.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fac.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </div>
                  </div>

                  {fac.hours && (
                    <p className="text-[10px] text-slate-400 mt-1.5">{fac.hours}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-3.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirections(fac.latitude, fac.longitude);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-slate-300 hover:text-white focus:outline-2 focus:outline-cyan-400"
                    aria-label={`Get directions to ${fac.name}`}
                  >
                    <Navigation className="w-3 h-3" aria-hidden="true" />
                    Directions
                  </button>
                  <a 
                    href="/auth/patient/login"
                    className="text-[10px] font-bold text-cyan-400 hover:underline focus:outline-2 focus:outline-cyan-400"
                    aria-label={`Book appointment at ${fac.name}`}
                  >
                    Book Now
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CENTER COLUMN: Leaflet Map */}
        <div className="xl:col-span-6 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#030611]">
          
          {/* Map Layer filter overlays */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setTrafficOverlay(!trafficOverlay)}
                className={`p-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all ${
                  trafficOverlay 
                    ? 'bg-cyan-500 border-cyan-400 text-slate-900' 
                    : 'bg-[#090d16]/90 border-white/10 text-slate-300 hover:text-white'
                }`}
                title="Traffic Overlay"
                aria-label="Toggle traffic overlay"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveHeatmap(activeHeatmap ? null : 'occupancy')}
                className={`px-3 py-1.5 rounded-full border shadow-2xl text-xs font-bold backdrop-blur-xl transition-all ${
                  activeHeatmap === 'occupancy' 
                    ? 'bg-rose-500 border-rose-400 text-white' 
                    : 'bg-[#090d16]/90 border-white/10 text-slate-300 hover:text-white'
                }`}
                aria-label="Toggle occupancy heatmap grid"
              >
                Heatmap Grid
              </button>
            </div>
          </div>

          <MapContainer
            center={[NAGPUR_VIEW.latitude, NAGPUR_VIEW.longitude]}
            zoom={NAGPUR_VIEW.zoom}
            minZoom={10}
            maxZoom={18}
            scrollWheelZoom={false}
            className="h-[520px] w-full md:h-[600px] z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapBridge onMapReady={handleMapReady} onViewportChange={handleViewportChange} />

            {/* Simulated Neon Route polyline */}
            {simulatedRoute && (
              <Polyline
                positions={simulatedRoute}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 4.5,
                  opacity: 0.85,
                  dashArray: '8, 8',
                }}
              />
            )}

            {/* Clusters and Markers */}
            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const properties = cluster.properties as ClusterProperties;

              if ('cluster' in properties) {
                const pointCount = properties.point_count;
                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    position={[latitude, longitude]}
                    icon={createClusterIcon(pointCount)}
                    eventHandlers={{
                      click: () => {
                        const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(cluster.id as number), 18);
                        map?.flyTo([latitude, longitude], expansionZoom, { animate: true });
                      },
                    }}
                  />
                );
              }

              const facility = properties;
              return (
                <Marker
                  key={facility.facilityId}
                  position={[facility.latitude, facility.longitude]}
                  icon={createMarkerIcon(facility.category, highlightedId === facility.facilityId)}
                  eventHandlers={{
                    click: () => {
                      setSelectedFacility(facility);
                      setHighlightedId(facility.facilityId);
                    }
                  }}
                />
              );
            })}

            {/* User coordinate marker */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.latitude, selectedLocation.longitude]}
                icon={createUserLocationIcon()}
              >
                <Popup>Nagpur Gateway Command</Popup>
              </Marker>
            )}

            {/* Moving ambulances */}
            {ambulances.map(amb => (
              <Marker
                key={amb.id}
                position={[amb.lat, amb.lng]}
                icon={createAmbulanceIcon(amb.status)}
              >
                <Popup>
                  <div className="space-y-1.5 text-slate-800">
                    <h5 className="font-bold text-sm">Ambulance Tracker ({amb.id})</h5>
                    <p className="text-xs text-slate-600">Status: <span className="font-bold text-rose-500">{amb.status}</span></p>
                    <p className="text-[11px] text-slate-500">Speed: {amb.speed} km/h</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>

          {/* Interactive Legend overlay inside Map bottom left */}
          <div className="absolute bottom-4 left-4 z-[400] p-3.5 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl max-w-xs shadow-2xl">
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Category Legend</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              {Object.entries(FACILITY_STYLES).map(([cat, style]) => (
                <div 
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`flex items-center gap-1.5 cursor-pointer hover:text-cyan-400 ${
                    selectedCategory && selectedCategory !== cat ? 'opacity-40' : ''
                  }`}
                >
                  <span className="text-xs">{style.emoji}</span>
                  <span className="font-medium truncate">{style.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT SIDE DETAILS PANEL: Selected Facility stats */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="text-xs uppercase tracking-widest font-bold text-slate-400 px-1">
            Facility Details
          </div>

          {selectedFacility ? (
            <div className="p-6 rounded-3xl border border-cyan-500/20 bg-[#090d16]/70 backdrop-blur-md flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    {selectedFacility.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2 leading-tight">{selectedFacility.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="line-clamp-1">{selectedFacility.address}</span>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-slate-400">Rating Score</span>
                  <div className="flex items-center gap-1 font-bold text-sm text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    {selectedFacility.rating}
                  </div>
                </div>

                {/* Occupancy and stats */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">ICU Bed Occupancy</span>
                      <span className="text-rose-400">{selectedFacility.beds} / 150 Free</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400" 
                        style={{ width: `${Math.min(100, (selectedFacility.beds / 150) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Average Wait Prediction</span>
                      <span className="text-cyan-400">{selectedFacility.waitTime} Mins</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400" 
                        style={{ width: `${Math.min(100, (selectedFacility.waitTime / 60) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Available doctors list */}
                <div className="space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Specialist Doctors</span>
                  <div className="flex flex-col gap-1.5">
                    {selectedFacility.doctors.map((doc: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integrated features */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedFacility.abhaEnabled && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">ABHA Sync</span>
                  )}
                  {selectedFacility.insuranceAccepted && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase">Ayushman Bharat</span>
                  )}
                </div>
              </div>

              {/* Call and Book buttons */}
              <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-white/5">
                <a
                  href={`tel:${selectedFacility.phone}`}
                  className="px-3 py-2 text-center text-xs font-bold rounded-xl border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
                <a
                  href="/auth/patient/login"
                  className="px-3 py-2 text-center text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1"
                >
                  Book Token
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/10 text-center flex-1 flex flex-col justify-center space-y-3">
              <MapPin className="w-8 h-8 text-slate-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-slate-400">Select a Healthcare Facility</h4>
              <p className="text-xs text-slate-500">Click markers on the map to inspect live availability stats, doctors, phone numbers, and routes.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
