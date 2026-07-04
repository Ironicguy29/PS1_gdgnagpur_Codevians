'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';

import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/providers/ToastProvider';
import { Logo } from '@/components/ui/Logo';
import { HospitalItem, useNearbyHospitals } from '@/hooks/useNearbyHospitals';
import { useNearbyBloodBanks, BloodBankItem } from '@/hooks/useNearbyBloodBanks';
import { getDirectionsUrl } from '@/lib/mapsHelper';
import { DEFAULT_LOCATION, DEFAULT_SEARCH_RADIUS_KM } from '@/config/mapConfig';
import {
  getCurrentLocation,
  moveMapToLocation,
  updateLocationState,
  reverseGeocode,
} from '@/lib/locationHelpers';
import {
  Search, X, ChevronLeft, ChevronRight, Navigation,
  Layers, RotateCcw, Plus, Minus, Loader2, Building2, AlertCircle,
  Droplet, ShieldAlert, Phone, Settings, AlertTriangle, Activity, CheckCircle2, MapPin, Send,
  Truck, Check
} from 'lucide-react';

async function geocode(query: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'ArogyaMitra/1.0' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    return null;
  }
}

export default function LiveMapClient() {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u) {
      setUser(JSON.parse(u));
    }
    if (t) {
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    }
  }, []);



  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userPinRef = useRef<maplibregl.Marker | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ambulancePinRef = useRef<maplibregl.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [selected, setSelected] = useState<HospitalItem | BloodBankItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [is3D, setIs3D] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchError, setSearchError] = useState('');

  // Emergency feature views and simulation states
  const [mapMode, setMapMode] = useState<'hospitals' | 'bloodbanks'>('hospitals');

  // Emergency Contacts state for SOS
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('arogya_emergency_contacts');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showContactSetup, setShowContactSetup] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [newContacts, setNewContacts] = useState<{ name: string; phone: string }[]>([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);

  // Blood type filter state
  const [selectedBloodType, setSelectedBloodType] = useState<string>('');
  const [showRequestBloodModal, setShowRequestBloodModal] = useState(false);
  const [selectedBloodBank, setSelectedBloodBank] = useState<BloodBankItem | HospitalItem | null>(null);
  const [bloodUnits, setBloodUnits] = useState<number>(1);
  const [bloodUrgency, setBloodUrgency] = useState<string>('Urgent');
  const [bloodContact, setBloodContact] = useState<string>('');

  // Ambulance request state
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [ambulanceDestination, setAmbulanceDestination] = useState<HospitalItem | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [ambulanceUrgency, setAmbulanceUrgency] = useState<string>('High');
  const [ambulanceReason, setAmbulanceReason] = useState<string>('');

  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  const mapTripToSimulationState = useCallback((trip: any) => {
    if (!trip) {
      return {
        active: false,
        stage: 'sent' as const,
        eta: 0,
        currentCoords: null
      };
    }
    
    // Status mapping
    let stage: 'sent' | 'assigned' | 'enroute' | 'arriving' | 'done' = 'sent';
    const status = trip.status;
    if (status === 'assigned') stage = 'assigned';
    else if (status === 'driver_accepted') stage = 'assigned';
    else if (status === 'en_route_to_patient') stage = 'enroute';
    else if (status === 'arrived_pickup') stage = 'arriving';
    else if (status === 'transporting') stage = 'enroute';
    else if (status === 'arrived_destination') stage = 'arriving';
    else if (status === 'completed' || status === 'cancelled') stage = 'done';

    // Get current ambulance location
    let currentCoords = null;
    const liveLoc = trip.liveAmbulanceLocation || trip.ambulance_id?.current_location;
    if (liveLoc && liveLoc.latitude && liveLoc.longitude) {
      currentCoords = { lat: liveLoc.latitude, lng: liveLoc.longitude };
    } else {
      // Fallback to base location
      const baseLoc = trip.ambulance_id?.base_location;
      if (baseLoc && baseLoc.latitude) {
        currentCoords = { lat: baseLoc.latitude, lng: baseLoc.longitude };
      }
    }

    // Get ETA minutes to patient/hospital depending on trip state
    let eta = 0;
    if (status === 'transporting' || status === 'arrived_pickup') {
      eta = trip.eta_minutes_to_hospital ?? 0;
    } else {
      eta = trip.eta_minutes_to_patient ?? 0;
    }

    return {
      active: status !== 'completed' && status !== 'cancelled',
      stage,
      eta,
      currentCoords
    };
  }, []);

  // Ambulance dispatch simulation states
  const [ambulanceSimulation, setAmbulanceSimulation] = useState<{
    active: boolean;
    stage: 'sent' | 'assigned' | 'enroute' | 'arriving' | 'done';
    eta: number; // in minutes (loaded from DB) or seconds (fallback)
    currentCoords: { lat: number; lng: number } | null;
  }>({
    active: false,
    stage: 'sent',
    eta: 0,
    currentCoords: null
  });

  const fetchActiveTrip = useCallback(async (patientId: string) => {
    try {
      const { data } = await api.get(`/ambulance/patient/${patientId}/trip`);
      if (data) {
        setActiveTrip(data);
        setAmbulanceSimulation(mapTripToSimulationState(data));
      } else {
        setActiveTrip(null);
        setAmbulanceSimulation(prev => ({ ...prev, active: false }));
      }
    } catch (err) {
      setActiveTrip(null);
      setAmbulanceSimulation(prev => ({ ...prev, active: false }));
    }
  }, [mapTripToSimulationState]);

  useEffect(() => {
    if (user) {
      fetchActiveTrip(user._id);
    }
  }, [user, fetchActiveTrip]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleLocation = (data: any) => {
      setActiveTrip((prev: any) => {
        if (!prev || prev.ambulance_id?._id !== data.ambulanceId) return prev;
        const updated = {
          ...prev,
          liveAmbulanceLocation: {
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            heading: data.heading
          }
        };
        setAmbulanceSimulation(mapTripToSimulationState(updated));
        return updated;
      });
    };

    const handleTripUpdate = (data: any) => {
      fetchActiveTrip(user._id);
    };

    const handleDispatched = (data: any) => {
      if (data.patientId === user._id) {
        toast('An ambulance has been dispatched to your location!', 'success');
        fetchActiveTrip(user._id);
      }
    };

    const handleEtaUpdate = (data: any) => {
      setActiveTrip((prev: any) => {
        if (!prev || prev._id !== data.tripId) return prev;
        const updated = {
          ...prev,
          eta_minutes_to_patient: data.etaMinToPatient ?? prev.eta_minutes_to_patient,
          eta_minutes_to_hospital: data.etaMinToHospital ?? prev.eta_minutes_to_hospital,
          distance_km_to_patient: data.distanceKmToPatient ?? prev.distance_km_to_patient,
          distance_km_to_hospital: data.distanceKmToHospital ?? prev.distance_km_to_hospital,
        };
        setAmbulanceSimulation(mapTripToSimulationState(updated));
        return updated;
      });
    };

    socket.on('ambulance.location', handleLocation);
    socket.on('ambulance.trip_update', handleTripUpdate);
    socket.on('ambulance.dispatched', handleDispatched);
    socket.on('ambulance.eta_update', handleEtaUpdate);

    const interval = setInterval(() => {
      fetchActiveTrip(user._id);
    }, 10000);

    return () => {
      socket.off('ambulance.location', handleLocation);
      socket.off('ambulance.trip_update', handleTripUpdate);
      socket.off('ambulance.dispatched', handleDispatched);
      socket.off('ambulance.eta_update', handleEtaUpdate);
      clearInterval(interval);
    };
  }, [socket, user, fetchActiveTrip, mapTripToSimulationState, toast]);

  // Geolocation states
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [currentLatitude, setCurrentLatitude] = useState<number | null>(null);
  const [currentLongitude, setCurrentLongitude] = useState<number | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LOCATION.latitude,
    lng: DEFAULT_LOCATION.longitude,
  });
  const [searchRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_KM);

  // Manual location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('arogya_user_location');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>(() => {
    if (typeof window !== 'undefined') {
      const mode = sessionStorage.getItem('arogya_location_mode');
      if (mode === 'gps' || mode === 'manual') return mode;
    }
    return 'manual';
  });

  const [manualPinMode, setManualPinMode] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // Fetch hospitals around the current map center
  const { hospitals, loading: hospitalsLoading, error: hospitalsError } = useNearbyHospitals(
    mapCenter,
    searchRadius * 1000
  );

  // Fetch blood banks around the current map center
  const { bloodBanks, loading: bloodBanksLoading, error: bloodBanksError } = useNearbyBloodBanks(
    mapCenter,
    searchRadius * 1000
  );

  // Request location helper
  const requestLocation = useCallback((active = true) => {
    updateLocationState<boolean>(setLoadingLocation, true);
    updateLocationState<string | null>(setLocationError, null);

    getCurrentLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
      .then((position) => {
        if (!active) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        updateLocationState<'prompt' | 'granted' | 'denied'>(setLocationPermission, 'granted');
        updateLocationState<number | null>(setCurrentLatitude, lat);
        updateLocationState<number | null>(setCurrentLongitude, lng);
        updateLocationState<number | null>(setCurrentAccuracy, accuracy);
        updateLocationState<boolean>(setLoadingLocation, false);
        updateLocationState<{ lat: number; lng: number }>(setMapCenter, { lat, lng });

        // Save to state & sessionStorage
        setUserLocation({ lat, lng });
        setLocationMode('gps');
        sessionStorage.setItem('arogya_user_location', JSON.stringify({ lat, lng }));
        sessionStorage.setItem('arogya_location_mode', 'gps');

        // Reverse geocode to populate search input
        reverseGeocode(lat, lng).then((address) => {
          sessionStorage.setItem('arogya_user_address', address);
          setSearchQuery(address);
        });

        if (mapRef.current) {
          moveMapToLocation(mapRef.current, lat, lng, 13, { pitch: is3D ? 55 : 0 });
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Error fetching geolocation:', err);
        updateLocationState<boolean>(setLoadingLocation, false);

        let permissionState: 'denied' | 'prompt' = 'prompt';
        let errMsg = 'Unable to determine your location. Using default city.';

        if (err.code === 1 || err.message?.toLowerCase().includes('denied')) {
          permissionState = 'denied';
          errMsg = 'Location permission denied. Showing nearby hospitals from default location.';
        }

        updateLocationState<'prompt' | 'granted' | 'denied'>(setLocationPermission, permissionState);
        updateLocationState<string | null>(setLocationError, errMsg);

        // Fall back if no stored location exists
        const stored = sessionStorage.getItem('arogya_user_location');
        if (!stored) {
          const defaultCoords = { lat: DEFAULT_LOCATION.latitude, lng: DEFAULT_LOCATION.longitude };
          setUserLocation(defaultCoords);
          setLocationMode('manual');
          sessionStorage.setItem('arogya_user_location', JSON.stringify(defaultCoords));
          sessionStorage.setItem('arogya_location_mode', 'manual');
          setMapCenter(defaultCoords);

          setSearchQuery(DEFAULT_LOCATION.name);
          sessionStorage.setItem('arogya_user_address', DEFAULT_LOCATION.name);

          if (mapRef.current) {
            moveMapToLocation(
              mapRef.current,
              DEFAULT_LOCATION.latitude,
              DEFAULT_LOCATION.longitude,
              DEFAULT_LOCATION.zoom,
              { pitch: is3D ? 55 : 0 }
            );
          }
        }
      });
  }, [is3D]);

  // Initial geolocating on mount
  useEffect(() => {
    let active = true;

    // Check if we have a stored user location
    const stored = sessionStorage.getItem('arogya_user_location');
    if (stored) {
      try {
        const coords = JSON.parse(stored);
        setUserLocation(coords);
        setMapCenter(coords);
        const storedAddr = sessionStorage.getItem('arogya_user_address');
        if (storedAddr) {
          setSearchQuery(storedAddr);
        }
        setLoadingLocation(false);
        if (mapRef.current) {
          moveMapToLocation(mapRef.current, coords.lat, coords.lng, 13, { pitch: is3D ? 55 : 0 });
        }
        return;
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
    }

    requestLocation(active);

    return () => {
      active = false;
    };
  }, [requestLocation]);

  const flyToCoords = useCallback((lat: number, lng: number, zoom = 14) => {
    if (!mapRef.current) return;
    moveMapToLocation(mapRef.current, lat, lng, zoom, { pitch: is3D ? 55 : 0 });
  }, [is3D]);

  // Sync refs so that event handlers inside map have access to latest state
  const manualPinModeRef = useRef(manualPinMode);
  useEffect(() => {
    manualPinModeRef.current = manualPinMode;
    if (containerRef.current) {
      containerRef.current.style.cursor = manualPinMode ? 'crosshair' : '';
    }
  }, [manualPinMode]);

  const is3DRef = useRef(is3D);
  useEffect(() => {
    is3DRef.current = is3D;
  }, [is3D]);

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const userLocationRef = useRef(userLocation);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const locationModeRef = useRef(locationMode);
  useEffect(() => {
    locationModeRef.current = locationMode;
  }, [locationMode]);

  const mapCenterRef = useRef(mapCenter);
  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  const mapModeRef = useRef(mapMode);
  useEffect(() => {
    mapModeRef.current = mapMode;
    updateMarkers();
  }, [mapMode]);

  const bloodBanksRef = useRef(bloodBanks);
  useEffect(() => {
    bloodBanksRef.current = bloodBanks;
    updateMarkers();
  }, [bloodBanks]);

  const selectedBloodTypeRef = useRef(selectedBloodType);
  useEffect(() => {
    selectedBloodTypeRef.current = selectedBloodType;
    updateMarkers();
  }, [selectedBloodType]);

  // Supercluster Update Markers logic
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const mode = mapModeRef.current;
    const currentHospitals = hospitalsRef.current;
    const currentBloodBanks = bloodBanksRef.current;
    const bloodType = selectedBloodTypeRef.current;

    let items: any[] = [];
    if (mode === 'hospitals') {
      items = currentHospitals;
    } else {
      const standalone = currentBloodBanks.map(b => ({ ...b, isBloodBank: true, isIntegrated: false }));
      const integrated = currentHospitals
        .filter(h => h.hasBloodBank)
        .map(h => ({
          id: h.id,
          name: `${h.name} Blood Bank`,
          amenity: 'blood_bank',
          address: h.address,
          lat: h.lat,
          lng: h.lng,
          phone: h.phone,
          distance: h.distance,
          bloodInventory: h.bloodInventory!,
          isBloodBank: true,
          isIntegrated: true
        }));
      items = [...standalone, ...integrated];
      if (bloodType) {
        items = items.filter(b => b.bloodInventory[bloodType] === 'available' || b.bloodInventory[bloodType] === 'low');
      }
    }

    if (items.length === 0) return;

    // Build features for Supercluster
    const points = items.map(item => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        itemId: item.id,
        item: item,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [item.lng, item.lat] as [number, number]
      }
    }));

    const index = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    index.load(points);

    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    const zoom = Math.floor(map.getZoom());
    const clusters = index.getClusters(bbox, zoom);

    clusters.forEach((cluster) => {
      const [longitude, latitude] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount, cluster_id: clusterId } = cluster.properties as any;

      if (isCluster) {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 40px;
          height: 40px;
          background: ${mode === 'hospitals' ? 'linear-gradient(135deg, #0d9488, #115e59)' : 'linear-gradient(135deg, #e11d48, #9f1239)'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.4);
          cursor: pointer;
          box-shadow: 0 4px 12px ${mode === 'hospitals' ? 'rgba(13, 148, 136, 0.6)' : 'rgba(225, 29, 72, 0.6)'};
          color: white;
          font-weight: bold;
          font-size: 14px;
          user-select: none;
        `;
        el.innerText = pointCount.toString();

        el.addEventListener('click', (event) => {
          event.stopPropagation();
          const expansionZoom = index.getClusterExpansionZoom(clusterId);
          map.flyTo({
            center: [longitude, latitude],
            zoom: Math.min(expansionZoom, 18),
            speed: 1.2
          });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);

        markersRef.current.push(marker);
      } else {
        const item = (cluster.properties as any).item;
        const isBloodBank = item.amenity === 'blood_bank';
        const el = document.createElement('div');
        
        const isSelected = selectedRef.current?.id === item.id;
        
        if (isBloodBank) {
          el.style.cssText = `
            width: 34px;
            height: 34px;
            background: ${isSelected ? 'linear-gradient(135deg, #ef4444, #9f1239)' : 'linear-gradient(135deg, #f43f5e, #be123c)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: ${isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.3)'};
            cursor: pointer;
            box-shadow: ${isSelected ? '0 0 15px #f43f5e' : '0 4px 12px rgba(244,63,94,0.5)'};
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: transform 0.2s ease, background 0.2s ease;
          `;
          el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
        } else {
          el.style.cssText = `
            width: 34px;
            height: 34px;
            background: ${isSelected ? 'linear-gradient(135deg, #ea580c, #f97316)' : 'linear-gradient(135deg, #0d9488, #2dd4bf)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: ${isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.3)'};
            cursor: pointer;
            box-shadow: ${isSelected ? '0 0 15px #ea580c' : '0 4px 12px rgba(13,148,136,0.5)'};
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: transform 0.2s ease, background 0.2s ease;
          `;
          el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        }

        const originLat = userLocationRef.current?.lat ?? mapCenterRef.current.lat;
        const originLng = userLocationRef.current?.lng ?? mapCenterRef.current.lng;
        const directionsUrl = getDirectionsUrl(originLat, originLng, item.lat, item.lng);

        let popupContent = '';
        if (isBloodBank) {
          const inventoryHtml = Object.entries(item.bloodInventory || {})
            .map(([type, status]: [string, any]) => {
              const color = status === 'available' ? '#166534' : status === 'low' ? '#854d0e' : '#991b1b';
              const bg = status === 'available' ? '#dcfce7' : status === 'low' ? '#fef9c3' : '#fee2e2';
              return `<span style="background:${bg};color:${color};font-size:10px;padding:2px 5px;border-radius:4px;font-weight:600;margin-right:4px;margin-bottom:4px;display:inline-block">${type}: ${status.toUpperCase()}</span>`;
            })
            .join('');

          popupContent = `
            <div style="font-family:Inter,sans-serif;padding:12px;min-width:220px">
              <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:4px">${item.name}</div>
              <span style="background:#fee2e2;color:#991b1b;font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600">BLOOD BANK</span>
              <div style="margin-top:8px;margin-bottom:8px">${inventoryHtml}</div>
              ${item.address ? `<div style="color:#64748b;font-size:12px;margin-top:6px">${item.address}</div>` : ''}
              ${item.distance !== undefined ? `<div style="color:#f43f5e;font-weight:700;font-size:13px;margin-top:4px">${item.distance.toFixed(2)} km away</div>` : ''}
              <div style="margin-top:10px; display:flex; gap: 6px;">
                <a href="${directionsUrl}" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;background:#ef4444;color:white;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none">
                  Directions ↗
                </a>
              </div>
            </div>
          `;
        } else {
          popupContent = `
            <div style="font-family:Inter,sans-serif;padding:12px;min-width:220px">
              <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:6px">${item.name}</div>
              <span style="background:${item.amenity === 'hospital' ? '#dcfce7' : '#dbeafe'};color:${item.amenity === 'hospital' ? '#166534' : '#1e40af'};font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600">${item.amenity.toUpperCase()}</span>
              ${item.address ? `<div style="color:#64748b;font-size:12px;margin-top:6px">${item.address}</div>` : ''}
              ${item.distance !== undefined ? `<div style="color:#0d9488;font-weight:700;font-size:13px;margin-top:4px">${item.distance.toFixed(2)} km away</div>` : ''}
              ${item.phone ? `<div style="color:#64748b;font-size:12px;margin-top:2px">📞 ${item.phone}</div>` : ''}
              <div style="margin-top:10px; display:flex;">
                <a href="${directionsUrl}" target="_blank" rel="noopener"
                   style="display:block;width:100%;text-align:center;background:#0d9488;color:white;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">
                  Directions ↗
                </a>
              </div>
            </div>
          `;
        }

        const popup = new maplibregl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(popupContent);

        el.addEventListener('click', (event) => {
          event.stopPropagation();
          selectItem(item);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([item.lng, item.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);

        if (isSelected) {
          if (!marker.getPopup().isOpen()) {
            marker.togglePopup();
          }
        }
      }
    });
  }, [mapReady]);

  const selectItem = useCallback((item: HospitalItem | BloodBankItem) => {
    setSelected(item);
    selectedRef.current = item;

    const prefix = item.amenity === 'blood_bank' ? 'bloodbank' : 'hospital';
    const cardEl = document.getElementById(`${prefix}-card-${item.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 15,
        speed: 1.2
      });
    }

    updateMarkers();
  }, [updateMarkers]);

  const selectHospital = selectItem as any; // Maintain compatibility

  const hospitalsRef = useRef(hospitals);
  useEffect(() => {
    hospitalsRef.current = hospitals;
    updateMarkers();
  }, [hospitals, updateMarkers]);

  useEffect(() => {
    updateMarkers();
  }, [selected, updateMarkers]);

  // Reverse geocode user location for modals
  const [userAddress, setUserAddress] = useState<string>('');
  useEffect(() => {
    const lat = userLocation?.lat ?? mapCenter.lat;
    const lng = userLocation?.lng ?? mapCenter.lng;
    reverseGeocode(lat, lng)
      .then(addr => setUserAddress(addr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`))
      .catch(() => setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`));
  }, [userLocation, mapCenter]);

  // SOS Countdown Timer effect
  const [sosSentInfo, setSosSentInfo] = useState<{
    message: string;
    links: { name: string; smsUrl: string; waUrl: string }[];
  } | null>(null);

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown === 0) {
      setSosCountdown(null);
      triggerSOSAlert();
      return;
    }

    const timer = setTimeout(() => {
      setSosCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [sosCountdown]);

  const handleSOSClick = () => {
    setSosSentInfo(null);
    if (emergencyContacts.length === 0) {
      setShowContactSetup(true);
    } else {
      setShowSOSModal(true);
      setSosCountdown(3);
    }
  };

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = newContacts.filter(c => c.name.trim() && c.phone.trim());
    if (valid.length === 0) return;
    setEmergencyContacts(valid);
    localStorage.setItem('arogya_emergency_contacts', JSON.stringify(valid));
    setShowContactSetup(false);
    setShowSOSModal(true);
    setSosCountdown(3);
  };

  const triggerSOSAlert = async () => {
    const lat = userLocation?.lat ?? mapCenter.lat;
    const lng = userLocation?.lng ?? mapCenter.lng;
    const timestamp = Date.now();
    
    // We can generate the tracking URL containing patientId!
    const patientIdParam = user?._id ? `&patientId=${user._id}` : '';
    const trackUrl = `${window.location.origin}/track?lat=${lat}&lng=${lng}&t=${timestamp}${patientIdParam}`;
    const nearest = hospitals[0] ? `${hospitals[0].name} (${hospitals[0].distance?.toFixed(2)} km)` : 'Nearby Facility';
    const message = `[ArogyaMitra EMERGENCY SOS] Urgent assistance needed! Location: ${trackUrl}. Nearest hospital: ${nearest}.`;

    const links = emergencyContacts.map(c => {
      const smsUrl = `sms:${c.phone}?body=${encodeURIComponent(message)}`;
      const waUrl = `https://wa.me/${c.phone}?text=${encodeURIComponent(message)}`;
      return { name: c.name, smsUrl, waUrl };
    });

    setSosSentInfo({ message, links });

    // Open first contact's SMS deep link immediately as default action
    if (links[0]) {
      window.open(links[0].smsUrl, '_blank');
    }

    // Call /ambulance/dispatch
    try {
      let addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const addressText = await reverseGeocode(lat, lng);
        if (addressText) addr = addressText;
      } catch (e) {}

      await api.post('/ambulance/dispatch', {
        chiefComplaint: `[SOS Alert] Critical emergency triggered via mobile SOS beacon.`,
        pickupAddress: addr,
        pickupLat: lat,
        pickupLng: lng,
        callerName: user?.name || "SOS Emergency Caller",
        callerPhone: user?.phone || "+919876543210",
        priority: "critical",
        patientId: user?._id
      });

      toast('Emergency SOS Dispatch Sent!', 'success');

      setTimeout(() => {
        if (user) {
          fetchActiveTrip(user._id);
        }
      }, 1500);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to trigger SOS dispatch', 'error');
    }
  };

  // Pre-fill ambulance pickup address when modal opens
  useEffect(() => {
    if (showAmbulanceModal && userLocation && !pickupAddress) {
      reverseGeocode(userLocation.lat, userLocation.lng)
        .then(addr => setPickupAddress(addr || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`))
        .catch(() => setPickupAddress(`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`));
    }
  }, [showAmbulanceModal, userLocation, pickupAddress]);

  const handleAmbulanceClick = (h: HospitalItem | null) => {
    setAmbulanceDestination(h || hospitals[0] || null);
    setShowAmbulanceModal(true);
  };

  const handleRequestAmbulanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambulanceDestination) return;

    setShowAmbulanceModal(false);
    
    try {
      const P = userLocation || mapCenter;
      
      await api.post('/ambulance/dispatch', {
        chiefComplaint: ambulanceReason || "Emergency Help Requested from Live Map",
        pickupAddress: pickupAddress || `${P.lat.toFixed(4)}, ${P.lng.toFixed(4)}`,
        pickupLat: P.lat,
        pickupLng: P.lng,
        callerName: user?.name || "Emergency Caller",
        callerPhone: user?.phone || "+919876543210",
        priority: ambulanceUrgency?.toLowerCase() || "high",
        patientId: user?._id
      });

      toast('Emergency request logged. Dispatching nearest ambulance!', 'success');
      
      setTimeout(() => {
        if (user) {
          fetchActiveTrip(user._id);
        }
      }, 1500);

    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to dispatch ambulance', 'error');
    }
  };

  // Sync simulated ambulance marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!ambulanceSimulation.active || !ambulanceSimulation.currentCoords) {
      if (ambulancePinRef.current) {
        ambulancePinRef.current.remove();
        ambulancePinRef.current = null;
      }
      return;
    }

    const coords = ambulanceSimulation.currentCoords;

    if (ambulancePinRef.current) {
      ambulancePinRef.current.setLngLat([coords.lng, coords.lat]);
    } else {
      const pinEl = document.createElement('div');
      pinEl.style.cssText = 'position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10000;';
      
      const pulseRing = document.createElement('div');
      pulseRing.style.cssText = 'position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(245, 158, 11, 0.4); animation: marker-ping 1.2s infinite;';
      
      const coreDot = document.createElement('div');
      coreDot.style.cssText = 'position: relative; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ef4444); border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);';
      coreDot.innerHTML = `
        <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
          <path d="M19 10.5V13h2v-2.5h-2zM5 10.5V13h2v-2.5H5zM2 15.5v3h2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5h9c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5H22v-6.5l-3-4H5L2 12v3.5zm4 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      `;

      pinEl.appendChild(pulseRing);
      pinEl.appendChild(coreDot);

      const marker = new maplibregl.Marker({ element: pinEl })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      ambulancePinRef.current = marker;
    }
  }, [ambulanceSimulation.active, ambulanceSimulation.currentCoords, mapReady]);

  // Request Blood handles
  const handleRequestBloodClick = (b: BloodBankItem | HospitalItem) => {
    setSelectedBloodBank(b);
    setBloodUnits(1);
    setBloodUrgency('Urgent');
    setBloodContact('');
    setShowRequestBloodModal(true);
  };

  const handleRequestBloodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBloodBank) return;

    const message = `[ArogyaMitra Blood Request] Urgent blood component request! \nFacility: ${selectedBloodBank.name} \nBlood Type: ${selectedBloodType || 'Any'} \nUnits: ${bloodUnits} \nUrgency: ${bloodUrgency} \nContact: ${bloodContact}`;
    const targetPhone = selectedBloodBank.phone || '+919999999999';

    const smsUrl = `sms:${targetPhone}?body=${encodeURIComponent(message)}`;
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
    setShowRequestBloodModal(false);
  };

  // Initializing Maplibre Map eagerly on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use stored location for initial center if available
    let initialCenter: [number, number] = [DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.latitude];
    const stored = sessionStorage.getItem('arogya_user_location');
    if (stored) {
      try {
        const coords = JSON.parse(stored);
        initialCenter = [coords.lng, coords.lat];
      } catch (e) {
        console.error('Error parsing stored location for initial center:', e);
      }
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: initialCenter,
      zoom: DEFAULT_LOCATION.zoom,
      pitch: is3DRef.current ? 55 : 0,
      bearing: -10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;

    // Error logging
    map.on('error', (e) => {
      console.error('MapLibre GL error:', e);
    });

    map.on('styledata', () => {
      console.log('MapLibre style data loaded.');
    });

    map.on('load', () => {
      setMapReady(true);
      // Wait for transition before removing skeleton completely
      setTimeout(() => {
        setShowSkeleton(false);
      }, 550);
    });

    map.on('click', (e) => {
      if (manualPinModeRef.current) {
        const clickedLat = e.lngLat.lat;
        const clickedLng = e.lngLat.lng;
        
        setLocationMode('manual');
        sessionStorage.setItem('arogya_location_mode', 'manual');
        
        const coords = { lat: clickedLat, lng: clickedLng };
        setUserLocation(coords);
        sessionStorage.setItem('arogya_user_location', JSON.stringify(coords));
        
        setMapCenter(coords);
        moveMapToLocation(map, clickedLat, clickedLng, 14, { pitch: is3DRef.current ? 55 : 0 });
        
        // Reverse geocode
        reverseGeocode(clickedLat, clickedLng).then((address) => {
          sessionStorage.setItem('arogya_user_address', address);
          setSearchQuery(address);
        });

        // Turn off manual pin mode after drop
        setManualPinMode(false);
        return;
      }

      // If not in manual pin mode, clicking empty map area deselects
      setSelected(null);
      selectedRef.current = null;
      markersRef.current.forEach(m => {
        if (m.getPopup().isOpen()) {
          m.togglePopup();
        }
      });
      updateMarkers();
    });

    // Debounced map drag/move event
    const handleMapMoveEnd = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        if (mapRef.current) {
          const newCenter = mapRef.current.getCenter();
          setMapCenter(prev => {
            const latDiff = Math.abs(prev.lat - newCenter.lat);
            const lngDiff = Math.abs(prev.lng - newCenter.lng);
            if (latDiff < 0.0001 && lngDiff < 0.0001) {
              return prev;
            }
            return { lat: newCenter.lat, lng: newCenter.lng };
          });
        }
      }, 500);
      
      updateMarkers();
    };

    map.on('moveend', handleMapMoveEnd);
    map.on('zoomend', () => {
      updateMarkers();
    });

    // ResizeObserver to handle map resize cleanly (flexbox zero-height bug fix)
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [updateMarkers]);

  // Synchronize User Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !userLocation) return;

    userPinRef.current?.remove();
    userPinRef.current = null;

    const pinEl = document.createElement('div');
    pinEl.style.cssText = 'position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 9999;';

    if (locationMode === 'gps') {
      pinEl.style.width = '24px';
      pinEl.style.height = '24px';
      pinEl.title = 'Your GPS Location';

      const pulseRing = document.createElement('div');
      pulseRing.style.cssText = 'position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(37, 99, 235, 0.4); animation: marker-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;';

      const coreDot = document.createElement('div');
      coreDot.style.cssText = 'position: relative; width: 12px; height: 12px; border-radius: 50%; background-color: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(37, 99, 235, 0.8);';

      pinEl.appendChild(pulseRing);
      pinEl.appendChild(coreDot);
    } else {
      pinEl.style.width = '32px';
      pinEl.style.height = '32px';
      pinEl.title = 'Your Selected Location (Draggable)';

      const pinSvg = document.createElement('div');
      pinSvg.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f59e0b" stroke="#ffffff"/>
          <circle cx="12" cy="9" r="3" fill="#ffffff"/>
        </svg>
      `;
      pinEl.appendChild(pinSvg);
    }

    const tooltipPopup = new maplibregl.Popup({ offset: locationMode === 'gps' ? 10 : 20, closeButton: false, closeOnClick: false })
      .setHTML(`<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#1e293b;padding:2px 4px;">${locationMode === 'gps' ? 'Your GPS Location' : 'Selected Location (Draggable)'}</div>`);

    pinEl.addEventListener('mouseenter', () => {
      if (mapRef.current && userLocationRef.current) {
        tooltipPopup.setLngLat([userLocationRef.current.lng, userLocationRef.current.lat]).addTo(mapRef.current);
      }
    });
    pinEl.addEventListener('mouseleave', () => {
      tooltipPopup.remove();
    });

    const isDraggable = locationMode === 'manual';

    const userMarker = new maplibregl.Marker({ element: pinEl, draggable: isDraggable })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    if (isDraggable) {
      userMarker.on('dragend', async () => {
        const lngLat = userMarker.getLngLat();
        const lat = lngLat.lat;
        const lng = lngLat.lng;
        
        setUserLocation({ lat, lng });
        sessionStorage.setItem('arogya_user_location', JSON.stringify({ lat, lng }));
        setMapCenter({ lat, lng });

        // Reverse geocode
        const address = await reverseGeocode(lat, lng);
        sessionStorage.setItem('arogya_user_address', address);
        setSearchQuery(address);
      });
    }

    userPinRef.current = userMarker;
  }, [userLocation, locationMode, mapReady]);

  // Escape key listener to clear hospital selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        selectedRef.current = null;
        markersRef.current.forEach(m => {
          if (m.getPopup().isOpen()) {
            m.togglePopup();
          }
        });
        updateMarkers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateMarkers]);

  // OSM Nominatim debounced suggestions list
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    // Don't auto-fetch suggestions if query is exactly matching selected address
    const storedAddr = sessionStorage.getItem('arogya_user_address');
    if (searchQuery === storedAddr) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'ArogyaMitra/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Nominatim suggestions error:', err);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({ pitch: next ? 55 : 0, duration: 600 });
  };

  const handleSelectSuggestion = async (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name;

    setUserLocation({ lat, lng });
    sessionStorage.setItem('arogya_user_location', JSON.stringify({ lat, lng }));
    sessionStorage.setItem('arogya_user_address', address);
    setLocationMode('manual');
    sessionStorage.setItem('arogya_location_mode', 'manual');
    setSearchQuery(address);
    setSuggestions([]);
    
    setMapCenter({ lat, lng });
    if (mapRef.current) {
      moveMapToLocation(mapRef.current, lat, lng, 13, { pitch: is3D ? 55 : 0 });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;

    setSearchingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'ArogyaMitra/1.0' } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setSearchError('Location not found.');
        return;
      }
      handleSelectSuggestion(data[0]);
    } catch (err) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchingSuggestions(false);
    }
  };

  const refetchGeo = () => {
    requestLocation(true);
  };

  const handleDirections = (h: HospitalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const originLat = userLocation?.lat ?? mapCenter.lat;
    const originLng = userLocation?.lng ?? mapCenter.lng;
    const url = getDirectionsUrl(originLat, originLng, h.lat, h.lng);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const standalone = bloodBanks.map(b => ({ ...b, isBloodBank: true, isIntegrated: false, amenity: 'blood_bank' as const }));
  const integrated = hospitals
    .filter(h => h.hasBloodBank)
    .map(h => ({
      id: h.id,
      name: `${h.name} Blood Bank`,
      amenity: 'blood_bank' as const,
      address: h.address,
      lat: h.lat,
      lng: h.lng,
      phone: h.phone,
      distance: h.distance,
      bloodInventory: h.bloodInventory!,
      isBloodBank: true,
      isIntegrated: true
    }));
  let bloodBankList = [...standalone, ...integrated];
  if (selectedBloodType) {
    bloodBankList = bloodBankList.filter(b => b.bloodInventory[selectedBloodType] === 'available' || b.bloodInventory[selectedBloodType] === 'low');
  }

  const isLocatingOrLoading = loadingLocation || hospitalsLoading;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[#0a0e1a]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .maplibregl-popup-content { border-radius:12px!important; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.3)!important; }
        .maplibregl-popup-close-button { font-size:18px; padding:4px 8px; color:#64748b; }
        .maplibregl-ctrl-attrib { background:rgba(10,14,26,0.8)!important; color:#94a3b8!important; border-radius:6px!important; font-size:10px!important; }
        .maplibregl-ctrl-group { display:none!important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:2px }
        @keyframes marker-ping {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>

      {/* Nav */}
      <header className="flex-shrink-0 z-20 flex items-center justify-between px-6 py-3 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Logo size="md" variant="light" href="/" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400 font-semibold">
            {loadingLocation ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                <span>Finding your location...</span>
              </>
            ) : locationError ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">
                  {locationPermission === 'denied' ? 'Location permission denied' : 'Location inactive'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>{hospitalsLoading ? 'Searching…' : `${hospitals.length} hospitals nearby`}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSOSClick}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 border border-red-500/30 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/30 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS EMERGENCY</span>
          </button>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← Home</Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`flex-shrink-0 z-10 flex flex-col bg-[#0d1120] border-r border-white/10 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <h2 className="text-white font-bold text-sm">Emergency Locator</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => { setMapMode('hospitals'); setSelected(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${mapMode === 'hospitals' ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Hospitals
              </button>
              <button
                onClick={() => { setMapMode('bloodbanks'); setSelected(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${mapMode === 'bloodbanks' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Blood Banks
              </button>
            </div>
          </div>

          {/* Blood Type Filter Chips */}
          {mapMode === 'bloodbanks' && (
            <div className="px-4 pb-3 flex-shrink-0 border-b border-white/10">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Filter by Blood Type</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedBloodType(selectedBloodType === type ? '' : type)}
                    className={`py-1 text-xs font-semibold rounded-md transition-all border ${
                      selectedBloodType === type
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Geolocation Status Card */}
            {locationPermission === 'denied' ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Location access denied. Search for an address above or click anywhere on the map to set your location manually.</span>
                </div>
              </div>
            ) : locationError ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
                <button
                  onClick={() => refetchGeo()}
                  className="w-full py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-white font-medium text-xs transition-colors"
                >
                  Retry Geolocation
                </button>
              </div>
            ) : null}

            {isLocatingOrLoading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2 mb-1" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            ))}

            {!isLocatingOrLoading && mapMode === 'hospitals' && hospitalsError && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{hospitalsError}</span>
                </div>
              </div>
            )}

            {/* Hospitals List */}
            {mapMode === 'hospitals' && !isLocatingOrLoading &&
              hospitals.map((h) => (
                <div
                  key={h.id}
                  id={`hospital-card-${h.id}`}
                  onClick={() => selectHospital(h)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selected?.id === h.id
                      ? 'bg-teal-500/15 border-teal-500/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{h.name}</p>
                      {h.address && <p className="text-slate-500 text-xs truncate mt-0.5">{h.address}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {h.distance !== undefined && (
                          <span className="text-teal-400 text-xs font-bold">{h.distance.toFixed(2)} km</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${h.amenity === 'hospital' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {h.amenity}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <button
                          onClick={(e) => handleDirections(h, e)}
                          className="flex-1 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-teal-300 hover:text-white text-xs font-semibold transition-all text-center"
                        >
                          Directions
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAmbulanceClick(h); }}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Ambulance</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Blood Banks List */}
            {mapMode === 'bloodbanks' && !isLocatingOrLoading && bloodBankList.length === 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                No matching blood banks found around your location.
              </div>
            )}

            {mapMode === 'bloodbanks' && !isLocatingOrLoading &&
              bloodBankList.map((b) => (
                <div
                  key={b.id}
                  id={`bloodbank-card-${b.id}`}
                  onClick={() => selectItem(b)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selected?.id === b.id
                      ? 'bg-rose-500/15 border-rose-500/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Droplet className="w-4 h-4 text-rose-400 fill-rose-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{b.name}</p>
                      {b.address && <p className="text-slate-500 text-xs truncate mt-0.5">{b.address}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {b.distance !== undefined && (
                          <span className="text-rose-400 text-xs font-bold">{b.distance.toFixed(2)} km</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-rose-500/20 text-rose-300">
                          {b.isIntegrated ? 'Integrated' : 'Standalone'}
                        </span>
                      </div>

                      {/* Blood levels list grid preview */}
                      <div className="grid grid-cols-4 gap-1 mt-2.5">
                        {Object.entries(b.bloodInventory).slice(0, 4).map(([type, status]: any) => (
                          <div
                            key={type}
                            className={`text-[9px] font-semibold py-0.5 rounded text-center ${
                              status === 'available' ? 'bg-emerald-500/15 text-emerald-400' :
                              status === 'low' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {type}
                          </div>
                        ))}
                        <div className="text-[9px] text-slate-500 font-semibold text-center mt-0.5">...</div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRequestBloodClick(b); }}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all text-center"
                        >
                          Request Blood
                        </button>
                        <button
                          onClick={(e) => handleDirections(b, e)}
                          className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10 text-center"
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </aside>

        {/* Sidebar toggle */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pl-1.5 pr-2 py-6 bg-[#0d1120] border border-l-0 border-white/10 rounded-r-xl text-teal-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Map Area */}
        <div className="flex-1 relative min-h-0">
          {/* Maplibre Container */}
          <div ref={containerRef} className="w-full h-full z-0" />

          {/* Premium Skeleton Map View Placeholder */}
          {showSkeleton && (
            <div
              className={`absolute inset-0 w-full h-full bg-[#0a0e1a] flex flex-col items-center justify-center overflow-hidden z-10 transition-opacity duration-500 ${
                mapReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Style rules for inline SVG keyframes */}
              <style>{`
                @keyframes skeleton-road-dash {
                  to {
                    stroke-dashoffset: -200;
                  }
                }
                @keyframes skeleton-glow-breathe {
                  0%, 100% {
                    transform: scale(0.9);
                    opacity: 0.35;
                  }
                  50% {
                    transform: scale(1.1);
                    opacity: 0.65;
                  }
                }
                .animate-skeleton-road-dash-1 {
                  animation: skeleton-road-dash 8s linear infinite;
                }
                .animate-skeleton-road-dash-2 {
                  animation: skeleton-road-dash 12s linear infinite;
                }
                .animate-skeleton-glow-breathe {
                  animation: skeleton-glow-breathe 7s ease-in-out infinite;
                }
              `}</style>

              {/* Glowing Center (Future Map Center) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-teal-500/10 to-transparent blur-3xl opacity-60 animate-skeleton-glow-breathe" />
              </div>

              {/* SVG Vector road grid */}
              <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="skeleton-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(45,212,191,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#skeleton-grid)" />

                {/* Simple land block outlines */}
                <rect x="8%" y="12%" width="15%" height="16%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="28%" y="6%" width="20%" height="18%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="52%" y="10%" width="18%" height="22%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="74%" y="4%" width="22%" height="16%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                
                <rect x="6%" y="42%" width="22%" height="20%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="34%" y="46%" width="14%" height="16%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="54%" y="50%" width="25%" height="18%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                
                <rect x="12%" y="76%" width="28%" height="15%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="46%" y="74%" width="16%" height="20%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />
                <rect x="66%" y="72%" width="22%" height="16%" rx="10" fill="rgba(45,212,191,0.01)" stroke="rgba(45,212,191,0.03)" strokeWidth="1" />

                {/* Primary and secondary road outlines / Junctions */}
                <line x1="0" y1="220" x2="2000" y2="220" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />
                <line x1="0" y1="460" x2="2000" y2="460" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />
                <line x1="0" y1="780" x2="2000" y2="780" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />
                <line x1="320" y1="0" x2="320" y2="1200" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />
                <line x1="780" y1="0" x2="780" y2="1200" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />
                <line x1="1220" y1="0" x2="1220" y2="1200" stroke="rgba(45,212,191,0.08)" strokeWidth="1.5" />

                {/* Highway curves */}
                <path d="M 160 -50 C 160 300 420 300 420 660 T 820 1260" fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth="2.5" />
                <path d="M -100 620 C 320 620 520 820 820 820 T 1820 620" fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth="2.5" />
                <path d="M 620 -50 C 620 420 920 420 920 870 T 1320 1270" fill="none" stroke="rgba(45,212,191,0.12)" strokeWidth="2.5" />

                {/* Primary highway outlines */}
                <path d="M -100 360 C 320 160 620 560 1020 260 T 2020 460" fill="none" stroke="rgba(45,212,191,0.22)" strokeWidth="5" />
                {/* Primary highway shimmers */}
                <path d="M -100 360 C 320 160 620 560 1020 260 T 2020 460" fill="none" stroke="#2dd4bf" strokeWidth="5" strokeDasharray="30 150" className="animate-skeleton-road-dash-1 opacity-60" />

                <path d="M 520 -100 C 720 420 320 820 120 1020 T 1120 1320" fill="none" stroke="rgba(45,212,191,0.22)" strokeWidth="5" />
                {/* Primary highway shimmers */}
                <path d="M 520 -100 C 720 420 320 820 120 1020 T 1120 1320" fill="none" stroke="#2dd4bf" strokeWidth="5" strokeDasharray="40 200" className="animate-skeleton-road-dash-2 opacity-60" />

                {/* Intersections */}
                <circle cx="224" cy="280" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
                <circle cx="546" cy="392" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
                <circle cx="896" cy="296" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
                <circle cx="568" cy="232" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
                <circle cx="346" cy="820" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
                <circle cx="688" cy="810" r="4" fill="#2dd4bf" className="opacity-40 animate-pulse" />
              </svg>

              {/* Indicator HUD */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <div className="p-4 rounded-xl bg-[#0d1120]/75 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                  <span className="text-xs text-slate-300 font-semibold tracking-wide">Initializing 3D Vector Engine…</span>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
            <div className="flex flex-col gap-1.5 font-sans relative">
              <div className="flex items-center gap-2 bg-[#0d1120]/90 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search city or address…"
                  className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
                {(isLocatingOrLoading || searchingSuggestions) && <Loader2 className="w-4 h-4 text-teal-400 animate-spin flex-shrink-0" />}
                <button type="submit" className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">Go</button>
              </div>
              {searchError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                  {searchError}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d1120]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/5 border-b border-white/5 last:border-0 hover:text-white transition-colors truncate"
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Controls */}
          <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
            {/* Red Pulsing Floating SOS Button */}
            <button
              onClick={handleSOSClick}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 hover:shadow-red-500/50 hover:scale-105 transition-all animate-pulse mb-1"
              title="Emergency SOS Alert"
            >
              <ShieldAlert className="w-5 h-5 text-white" />
            </button>

            {([
              { icon: <Plus className="w-4 h-4" />, fn: () => mapRef.current?.zoomIn(), tip: 'Zoom in' },
              { icon: <Minus className="w-4 h-4" />, fn: () => mapRef.current?.zoomOut(), tip: 'Zoom out' },
              { icon: <Layers className="w-4 h-4" />, fn: toggle3D, tip: is3D ? '2D' : '3D', active: is3D },
              { icon: <RotateCcw className="w-4 h-4" />, fn: () => mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 55 : 0, duration: 500 }), tip: 'Reset rotation' },
              { 
                icon: <Navigation className="w-4 h-4" />, 
                fn: () => {
                  setLocationMode('gps');
                  sessionStorage.setItem('arogya_location_mode', 'gps');
                  if (currentLatitude !== null && currentLongitude !== null) {
                    const coords = { lat: currentLatitude, lng: currentLongitude };
                    setUserLocation(coords);
                    sessionStorage.setItem('arogya_user_location', JSON.stringify(coords));
                    setMapCenter(coords);
                    flyToCoords(currentLatitude, currentLongitude, 14);
                    reverseGeocode(currentLatitude, currentLongitude).then((address) => {
                      sessionStorage.setItem('arogya_user_address', address);
                      setSearchQuery(address);
                    });
                  } else {
                    requestLocation(true);
                  }
                }, 
                tip: 'Use my current location (GPS)',
                active: locationMode === 'gps'
              },
            ] as any[]).map((b, i) => (
              <button key={i} onClick={b.fn} title={b.tip}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shadow-lg ${b.active ? 'bg-teal-500 border-teal-400 text-white' : 'bg-[#0d1120]/90 border-white/15 text-slate-300 hover:text-teal-400 hover:border-teal-500/50'}`}>
                {b.icon}
              </button>
            ))}
          </div>

          {/* Draggable Selector Pin Mode Button */}
          <button 
            onClick={() => setManualPinMode(!manualPinMode)}
            className={`absolute bottom-6 left-4 z-10 px-4 py-2 border rounded-full text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 ${
              manualPinMode 
                ? 'bg-amber-500 border-amber-400 text-white animate-pulse' 
                : 'bg-[#0d1120]/90 border-white/15 text-slate-300 hover:text-teal-400 hover:border-teal-500/50'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            <span>{manualPinMode ? 'Click on map to drop pin...' : 'Set location on map'}</span>
          </button>

          {/* Simulated Ambulance Tracker Dashboard Overlay */}
          {ambulanceSimulation.active && (
            <div className="absolute bottom-20 left-4 z-20 w-80 bg-[#0d1120]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 font-sans">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 animate-pulse">
                    <Truck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">Ambulance Dispatch Tracker</h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">To: {ambulanceDestination?.name || 'Your Location'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAmbulanceSimulation({ active: false, stage: 'sent', eta: 40, currentCoords: null });
                    setActiveTrip(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5 transition-colors"
                >
                  Dismiss
                </button>
              </div>

              {/* Stepper progress */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                {([
                  { id: 'sent', label: 'Request Dispatched' },
                  { id: 'assigned', label: 'Ambulance Assigned' },
                  { id: 'enroute', label: 'En Route to Location' },
                  { id: 'arriving', label: 'Arriving' },
                  { id: 'done', label: 'Ambulance Arrived' }
                ]).map((step, idx, arr) => {
                  const stages = ['sent', 'assigned', 'enroute', 'arriving', 'done'];
                  const currentIdx = stages.indexOf(ambulanceSimulation.stage);
                  const stepIdx = stages.indexOf(step.id);
                  const isDone = stepIdx < currentIdx;
                  const isActive = step.id === ambulanceSimulation.stage;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                          isDone ? 'bg-emerald-500 border-emerald-400 text-white' :
                          isActive ? 'bg-amber-500 border-amber-400 text-white animate-pulse' :
                          'bg-slate-800 border-slate-700'
                        }`}>
                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`w-0.5 h-6 -my-1 transition-all ${
                            stepIdx < currentIdx ? 'bg-emerald-500' : 'bg-slate-800'
                          }`} />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold transition-all ${
                        isActive ? 'text-amber-400 font-bold' :
                        isDone ? 'text-emerald-400' :
                        'text-slate-500'
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Driver & Vehicle Details */}
              {activeTrip && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-[10px] text-slate-300 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ambulance:</span>
                    <span className="font-semibold text-white">{activeTrip.ambulance_id?.registration_number || 'Assigning...'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Driver:</span>
                    <span className="font-semibold text-white">{activeTrip.driver_id?.name || 'Assigning...'}</span>
                  </div>
                  {activeTrip.driver_id?.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Phone:</span>
                      <a href={`tel:${activeTrip.driver_id.phone}`} className="text-teal-400 hover:underline">{activeTrip.driver_id.phone}</a>
                    </div>
                  )}
                </div>
              )}

              {/* ETA Display */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Estimated Time</span>
                <span className="text-xs text-amber-400 font-bold">
                  {ambulanceSimulation.stage === 'done' ? 'Ambulance Arrived' : `${ambulanceSimulation.eta} mins`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOS Alert Modal Overlay */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0d1120] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background red pulsing glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-red-600/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-rose-600/10 blur-3xl" />

            <div className="text-center space-y-2 relative">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg">EMERGENCY SOS ALERT</h3>
              <p className="text-slate-400 text-xs px-4">
                Sending emergency alert with your live GPS location link to your designated emergency contacts.
              </p>
            </div>

            {sosCountdown !== null ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1s' }} />
                  <span className="text-4xl text-white font-black">{sosCountdown}</span>
                </div>
                <button
                  onClick={() => { setSosCountdown(null); setShowSOSModal(false); }}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all"
                >
                  Cancel Trigger
                </button>
              </div>
            ) : (
              <div className="space-y-4 relative">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">YOUR COORDINATES:</span>
                    <span className="text-slate-300 font-mono font-bold">
                      {(userLocation?.lat ?? mapCenter.lat).toFixed(6)}, {(userLocation?.lng ?? mapCenter.lng).toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">PREVIEW ADDRESS:</span>
                    <p className="text-slate-300 mt-0.5 leading-normal">{userAddress || 'Loading address...'}</p>
                  </div>
                </div>

                {sosSentInfo && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      <p className="font-bold">✓ Emergency Alert Triggered!</p>
                      <p className="text-[11px] mt-1 text-slate-300">Choose a method below to transmit this message to your contacts immediately.</p>
                    </div>
                    <div className="space-y-2">
                      {sosSentInfo.links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white">
                          <span className="font-semibold truncate pr-2">{link.name}</span>
                          <div className="flex gap-2 flex-shrink-0">
                            <a
                              href={link.smsUrl}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] tracking-wider transition-all"
                            >
                              SMS
                            </a>
                            <a
                              href={link.waUrl}
                              target="_blank"
                              rel="noopener"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] tracking-wider transition-all"
                            >
                              WHATSAPP
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowSOSModal(false); setShowContactSetup(true); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 rounded-2xl transition-all"
                  >
                    Manage Contacts
                  </button>
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts Setup Modal */}
      {showContactSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <form onSubmit={handleSaveContacts} className="w-full max-w-md bg-[#0d1120] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">Setup Emergency Contacts</h3>
              <p className="text-slate-400 text-xs">Specify up to 3 emergency contacts to notify in case of SOS triggers.</p>
            </div>

            <div className="space-y-3">
              {newContacts.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder={`Contact ${i + 1} Name`}
                    value={c.name}
                    onChange={e => setNewContacts(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    required={i === 0}
                  />
                  <input
                    placeholder="Phone (e.g. +919999999999)"
                    value={c.phone}
                    onChange={e => setNewContacts(prev => prev.map((item, idx) => idx === i ? { ...item, phone: e.target.value } : item))}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    required={i === 0}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowContactSetup(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs rounded-2xl transition-all"
              >
                Save & SOS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Blood Component Modal */}
      {showRequestBloodModal && selectedBloodBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <form onSubmit={handleRequestBloodSubmit} className="w-full max-w-md bg-[#0d1120] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">Request Blood Component</h3>
              <p className="text-slate-400 text-xs truncate">Facility: {selectedBloodBank.name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Blood Type</label>
                <select
                  value={selectedBloodType || ''}
                  onChange={e => setSelectedBloodType(e.target.value || '')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-teal-500"
                  required
                >
                  <option value="" disabled className="bg-[#0d1120]">Select Blood Type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                    <option key={t} value={t} className="bg-[#0d1120]">{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Required Units</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={bloodUnits}
                    onChange={e => setBloodUnits(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Urgency</label>
                  <select
                    value={bloodUrgency}
                    onChange={e => setBloodUrgency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-teal-500"
                    required
                  >
                    {['Urgent', 'Standard', 'Critical'].map(u => (
                      <option key={u} value={u} className="bg-[#0d1120]">{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Your Contact Number</label>
                <input
                  type="tel"
                  placeholder="+919999999999"
                  value={bloodContact}
                  onChange={e => setBloodContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestBloodModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ambulance Dispatch Modal */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <form onSubmit={handleRequestAmbulanceSubmit} className="w-full max-w-md bg-[#0d1120] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">Request Emergency Ambulance</h3>
              <p className="text-slate-400 text-xs">Simulate ambulance dispatch from target hospital to your location.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Dispatching Hospital</label>
                <input
                  type="text"
                  value={ambulanceDestination?.name || 'Nearest Facility'}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Pickup Location Address</label>
                <textarea
                  rows={2}
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-0"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>This is a simulated hackathon demonstration. It runs a local 40-second real-time stepper showing dispatch phases.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAmbulanceModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0d1120] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
