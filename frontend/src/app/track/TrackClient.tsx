'use client';

import { useEffect, useRef, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Logo } from '@/components/ui/Logo';
import { reverseGeocode } from '@/lib/locationHelpers';
import { 
  ShieldAlert, MapPin, Navigation, Phone, 
  ExternalLink, Clock, AlertTriangle, Loader2, Check 
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

function TrackContent() {
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const ambulanceMarkerRef = useRef<maplibregl.Marker | null>(null);

  const tripId = searchParams.get('tripId');
  const patientId = searchParams.get('patientId');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const timeParam = searchParams.get('t');

  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [ambulanceMarker, setAmbulanceMarker] = useState<{ lat: number; lng: number } | null>(null);

  const lat = activeTrip?.pickup_location?.latitude ?? (latParam ? parseFloat(latParam) : 21.1458);
  const lng = activeTrip?.pickup_location?.longitude ?? (lngParam ? parseFloat(lngParam) : 79.0882);
  const timestamp = timeParam ? new Date(parseInt(timeParam)).toLocaleTimeString() : new Date().toLocaleTimeString();

  const [address, setAddress] = useState('Loading address...');
  const [mapReady, setMapReady] = useState(false);

  // Fetch Active Trip
  const fetchTrip = useCallback(async () => {
    if (!tripId && !patientId) return;
    setLoadingTrip(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        api.defaults.headers.common['Authorization'] = `Bearer mock.jwt.token.guest`;
      }

      let data;
      if (tripId) {
        const response = await api.get(`/ambulance/trip/${tripId}`);
        data = response.data;
      } else if (patientId) {
        const response = await api.get(`/ambulance/patient/${patientId}/trip`);
        data = response.data;
      }

      if (data) {
        setActiveTrip(data);
        
        // Set initial ambulance location
        const liveLoc = data.liveAmbulanceLocation || data.ambulance_id?.current_location;
        if (liveLoc && liveLoc.latitude && liveLoc.longitude) {
          setAmbulanceMarker({ lat: liveLoc.latitude, lng: liveLoc.longitude });
        } else {
          const baseLoc = data.ambulance_id?.base_location;
          if (baseLoc && baseLoc.latitude) {
            setAmbulanceMarker({ lat: baseLoc.latitude, lng: baseLoc.longitude });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch active trip details:', err);
    } finally {
      setLoadingTrip(false);
    }
  }, [tripId, patientId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Subscribe to real-time socket updates for this trip
  useEffect(() => {
    if (!socket || !activeTrip) return;

    const handleLocationUpdate = (data: any) => {
      if (activeTrip.ambulance_id?._id === data.ambulanceId) {
        setAmbulanceMarker({ lat: data.latitude, lng: data.longitude });
      }
    };

    const handleTripUpdate = (data: any) => {
      if (data.tripId === activeTrip._id) {
        fetchTrip();
      }
    };

    socket.on('ambulance.location', handleLocationUpdate);
    socket.on('ambulance.trip_update', handleTripUpdate);

    return () => {
      socket.off('ambulance.location', handleLocationUpdate);
      socket.off('ambulance.trip_update', handleTripUpdate);
    };
  }, [socket, activeTrip, fetchTrip]);

  // Reverse geocode patient location
  useEffect(() => {
    if (activeTrip?.pickup_location?.address) {
      setAddress(activeTrip.pickup_location.address);
    } else if (latParam && lngParam) {
      reverseGeocode(lat, lng).then(addr => setAddress(addr));
    } else {
      setAddress('Default Mock Location (Nagpur)');
    }
  }, [lat, lng, latParam, lngParam, activeTrip]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [lng, lat],
      zoom: 14,
      pitch: 45,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapReady(true);

      // Create Custom Pulsing red marker HTML element
      const el = document.createElement('div');
      el.className = 'custom-sos-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444';
      el.style.border = '2px solid #ffffff';
      el.style.position = 'relative';
      el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';

      const pulse = document.createElement('div');
      pulse.style.position = 'absolute';
      pulse.style.inset = '-12px';
      pulse.style.borderRadius = '50%';
      pulse.style.border = '2px solid #ef4444';
      pulse.style.animation = 'marker-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite';
      el.appendChild(pulse);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, closeButton: false })
            .setHTML(`
              <div style="font-family: Inter, sans-serif; padding: 4px;">
                <p style="color: #ef4444; font-weight: 700; font-size: 12px; margin: 0 0 4px 0;">🚨 EMERGENCY SOS</p>
                <p style="color: #ffffff; font-size: 11px; margin: 0 0 2px 0; font-weight: 500;">Active Live Signal</p>
                <p style="color: #94a3b8; font-size: 10px; margin: 0;">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</p>
              </div>
            `)
        )
        .addTo(map);

      marker.togglePopup();
      markerRef.current = marker;
    });

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  // Sync ambulance marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !ambulanceMarker) {
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.remove();
        ambulanceMarkerRef.current = null;
      }
      return;
    }

    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.setLngLat([ambulanceMarker.lng, ambulanceMarker.lat]);
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
        .setLngLat([ambulanceMarker.lng, ambulanceMarker.lat])
        .addTo(map);

      ambulanceMarkerRef.current = marker;
    }
  }, [ambulanceMarker, mapReady]);

  const handleOpenNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[#0a0e1a]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .maplibregl-popup-content { border-radius: 12px!important; overflow: hidden; background: #0d1120!important; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 60px rgba(0,0,0,0.5)!important; }
        .maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #0d1120!important; }
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #0d1120!important; }
        .maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #0d1120!important; }
        .maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #0d1120!important; }
        @keyframes marker-ping {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Nav */}
      <header className="flex-shrink-0 z-20 flex items-center justify-between px-6 py-3 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Logo size="md" variant="light" href="/" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS Live Tracking Active</span>
          </div>
        </div>
        <Link href="/live-map" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors bg-teal-500/10 px-3 py-1.5 border border-teal-500/20 rounded-lg">
          Open Emergency Map
        </Link>
      </header>

      {/* Map + Sidebar Overlay Layout */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Tracking Info Card */}
        <div className="absolute top-4 left-4 z-10 w-96 bg-[#0d1120]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-w-[calc(100vw-32px)]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/20 animate-pulse border border-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-white font-black text-sm">Emergency Alert Signal</h2>
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Patient Beacon Status</p>
              </div>
            </div>
            <span className={`text-[10px] ${
              activeTrip?.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
            } border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${activeTrip?.status !== 'completed' ? 'animate-pulse' : ''}`}>
              {activeTrip ? activeTrip.status.toUpperCase().replace(/_/g, ' ') : 'ACTIVE'}
            </span>
          </div>

          <div className="space-y-2 border-t border-white/5 pt-3">
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[9px] block">Location Address</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">{address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 bg-white/5 p-2 rounded-xl border border-white/5 text-[11px]">
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Coordinates</span>
                <span className="text-slate-300 font-mono font-bold">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Trigger Time</span>
                <span className="text-slate-300 font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Active Trip Details */}
          {activeTrip && activeTrip.ambulance_id && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Vehicle Model:</span>
                <span className="font-bold text-white">{activeTrip.ambulance_id.vehicle_type || 'Standard Ambulance'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Registration:</span>
                <span className="font-bold text-white">{activeTrip.ambulance_id.registration_number}</span>
              </div>
              {activeTrip.driver_id && (
                <>
                  <div className="flex justify-between items-center text-slate-400 border-t border-white/5 pt-2 mt-1">
                    <span>Driver Name:</span>
                    <span className="font-bold text-white">{activeTrip.driver_id.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Driver Contact:</span>
                    <a href={`tel:${activeTrip.driver_id.phone}`} className="font-bold text-teal-400 hover:underline">{activeTrip.driver_id.phone}</a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ETA Display */}
          {activeTrip && (activeTrip.eta_minutes_to_patient !== undefined || activeTrip.eta_minutes_to_hospital !== undefined) && (
            <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 p-2.5 rounded-xl text-teal-300">
              <span className="text-[10px] uppercase font-bold tracking-wider">ETA to Destination</span>
              <span className="text-xs font-black">
                {activeTrip.status === 'transporting' || activeTrip.status === 'arrived_pickup'
                  ? `${activeTrip.eta_minutes_to_hospital ?? 0} mins (Hospital)`
                  : `${activeTrip.eta_minutes_to_patient ?? 0} mins (Pickup)`
                }
              </span>
            </div>
          )}

          {/* Responder Guidance Alert */}
          {!activeTrip && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-normal">
                Please share this tracking link with dispatch services or rescue squads immediately. Live coordinates refresh dynamically when the sender transmits updating links.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleOpenNavigation}
              className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-[#0d1120] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </button>
            <a
              href={`tel:${activeTrip?.driver_id?.phone || searchParams.get('phone') || ''}`}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center"
              title="Call Contact"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Loading overlay if map is initializing */}
        {!mapReady && (
          <div className="absolute inset-0 bg-[#0a0e1a] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Initializing Satellite Beacon Engine...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackClient() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide">Loading Tracker Beacons…</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
