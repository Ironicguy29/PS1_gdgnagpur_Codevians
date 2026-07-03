'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { Logo } from '@/components/ui/Logo';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyHospitals, HospitalItem } from '@/hooks/useNearbyHospitals';
import { getDirectionsUrl } from '@/lib/mapsHelper';
import {
  Search, X, ChevronLeft, ChevronRight, Navigation,
  Layers, RotateCcw, Plus, Minus, Loader2, Building2, AlertCircle
} from 'lucide-react';

const NAGPUR = { lat: 21.1458, lng: 79.0882 };

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userPinRef = useRef<maplibregl.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>(NAGPUR);
  const [selected, setSelected] = useState<HospitalItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [is3D, setIs3D] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchError, setSearchError] = useState('');

  // Geolocation & Nearby Hospitals hooks
  const { coordinates: userLocation, error: geoError, loading: geoLoading, refetch: refetchGeo } = useGeolocation();
  const { hospitals, loading: hospitalsLoading, error: hospitalsError } = useNearbyHospitals(searchCenter);

  // Initialize search center to user location once it is loaded
  const [hasSetCenter, setHasSetCenter] = useState(false);
  useEffect(() => {
    if (userLocation && !hasSetCenter) {
      setSearchCenter(userLocation);
      setHasSetCenter(true);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, pitch: is3D ? 55 : 0, speed: 1.2 });
      }
    }
  }, [userLocation, hasSetCenter, is3D]);

  const flyToCoords = useCallback((lat: number, lng: number, zoom = 14) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      pitch: is3D ? 55 : 0,
      speed: 1.2,
    });
  }, [is3D]);

  // Initializing Maplibre Map eagerly on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [searchCenter.lng, searchCenter.lat],
      zoom: 13,
      pitch: is3D ? 55 : 0,
      bearing: -10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
      setMapReady(true);
      // Wait for transition before removing skeleton completely
      setTimeout(() => {
        setShowSkeleton(false);
      }, 550);
    });

    map.on('click', (e) => {
      const clickedLat = e.lngLat.lat;
      const clickedLng = e.lngLat.lng;
      setSearchCenter({ lat: clickedLat, lng: clickedLng });
      map.flyTo({ center: [clickedLng, clickedLat], zoom: 14, pitch: is3D ? 55 : 0, speed: 1.2 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Synchronize Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    hospitals.forEach((h, idx) => {
      const el = document.createElement('div');
      el.style.cssText = `width:34px;height:34px;background:linear-gradient(135deg,#0d9488,#2dd4bf);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.3);cursor:pointer;box-shadow:0 4px 12px rgba(13,148,136,0.5);`;
      el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

      // Driving directions url from user physical location or search center
      const originLat = userLocation?.lat ?? searchCenter.lat;
      const originLng = userLocation?.lng ?? searchCenter.lng;
      const directionsUrl = getDirectionsUrl(originLat, originLng, h.lat, h.lng);

      const popup = new maplibregl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`
        <div style="font-family:Inter,sans-serif;padding:12px;min-width:220px">
          <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:6px">${h.name}</div>
          <span style="background:${h.amenity === 'hospital' ? '#dcfce7' : '#dbeafe'};color:${h.amenity === 'hospital' ? '#166534' : '#1e40af'};font-size:10px;padding:2px 8px;border-radius:99px;font-weight:600">${h.amenity.toUpperCase()}</span>
          ${h.address ? `<div style="color:#64748b;font-size:12px;margin-top:6px">${h.address}</div>` : ''}
          ${h.distance !== undefined ? `<div style="color:#0d9488;font-weight:700;font-size:13px;margin-top:4px">${h.distance.toFixed(2)} km away</div>` : ''}
          ${h.phone ? `<div style="color:#64748b;font-size:12px;margin-top:2px">📞 ${h.phone}</div>` : ''}
          <div style="margin-top:10px; display:flex;">
            <a href="${directionsUrl}" target="_blank" rel="noopener"
               style="display:block;width:100%;text-align:center;background:#0d9488;color:white;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">
              Directions ↗
            </a>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [hospitals, mapReady, userLocation, searchCenter]);

  // Synchronize User Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userPinRef.current?.remove();
    userPinRef.current = null;

    const pinCoords = userLocation || searchCenter;
    if (!pinCoords) return;

    const pinEl = document.createElement('div');
    pinEl.style.cssText =
      'width:18px;height:18px;background:#2dd4bf;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(45,212,191,0.25);';

    userPinRef.current = new maplibregl.Marker({ element: pinEl })
      .setLngLat([pinCoords.lng, pinCoords.lat])
      .addTo(map);
  }, [userLocation, searchCenter, mapReady]);

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({ pitch: next ? 55 : 0, duration: 600 });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;

    const result = await geocode(searchQuery);
    if (!result) {
      setSearchError('Location not found.');
      return;
    }

    setSearchCenter(result);
    flyToCoords(result.lat, result.lng, 13);
  };

  const flyToHospital = (h: HospitalItem, idx: number) => {
    setSelected(h);
    flyToCoords(h.lat, h.lng, 16);
    setTimeout(() => {
      markersRef.current[idx]?.togglePopup();
    }, 800);
  };

  const handleDirections = (h: HospitalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userLocation) {
      alert('Please enable location access to compute directions from your current location.');
      refetchGeo();
      return;
    }
    const url = getDirectionsUrl(userLocation.lat, userLocation.lng, h.lat, h.lng);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isLocatingOrLoading = geoLoading || hospitalsLoading;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[#0a0e1a]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .maplibregl-popup-content { border-radius:12px!important; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.3)!important; }
        .maplibregl-popup-close-button { font-size:18px; padding:4px 8px; color:#64748b; }
        .maplibregl-ctrl-attrib { background:rgba(10,14,26,0.8)!important; color:#94a3b8!important; border-radius:6px!important; font-size:10px!important; }
        .maplibregl-ctrl-group { display:none!important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:2px }
      `}</style>

      {/* Nav */}
      <header className="flex-shrink-0 z-20 flex items-center justify-between px-6 py-3 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <Logo size="md" variant="light" href="/" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400 font-semibold">
            {geoLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                <span>Locating you…</span>
              </>
            ) : geoError ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Location inactive</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>{hospitalsLoading ? 'Searching…' : `${hospitals.length} hospitals nearby`}</span>
              </>
            )}
          </div>
        </div>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← Home</Link>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`flex-shrink-0 z-10 flex flex-col bg-[#0d1120] border-r border-white/10 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <h2 className="text-white font-bold text-sm">Nearby Hospitals</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Geolocation Status Card if Not Success */}
            {geoError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{geoError}</span>
                </div>
                <button
                  onClick={() => refetchGeo()}
                  className="w-full py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-white font-medium text-xs transition-colors"
                >
                  Retry Geolocation
                </button>
              </div>
            )}

            {isLocatingOrLoading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2 mb-1" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            ))}

            {!isLocatingOrLoading && hospitalsError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{hospitalsError}</span>
              </div>
            )}

            {!isLocatingOrLoading &&
              hospitals.map((h, i) => (
                <div
                  key={h.id}
                  onClick={() => flyToHospital(h, i)}
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
                      <button
                        onClick={(e) => handleDirections(h, e)}
                        className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-teal-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        Directions ↗
                      </button>
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 bg-[#0d1120]/90 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search city or address…"
                  className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
                {isLocatingOrLoading && <Loader2 className="w-4 h-4 text-teal-400 animate-spin flex-shrink-0" />}
                <button type="submit" className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">Go</button>
              </div>
              {searchError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                  {searchError}
                </div>
              )}
            </div>
          </form>

          {/* Controls */}
          <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
            {([
              { icon: <Plus className="w-4 h-4" />, fn: () => mapRef.current?.zoomIn(), tip: 'Zoom in' },
              { icon: <Minus className="w-4 h-4" />, fn: () => mapRef.current?.zoomOut(), tip: 'Zoom out' },
              { icon: <Layers className="w-4 h-4" />, fn: toggle3D, tip: is3D ? '2D' : '3D', active: is3D },
              { icon: <RotateCcw className="w-4 h-4" />, fn: () => mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 55 : 0, duration: 500 }), tip: 'Reset rotation' },
              { icon: <Navigation className="w-4 h-4" />, fn: () => flyToCoords(searchCenter.lat, searchCenter.lng, 14), tip: 'Recenter' },
            ] as any[]).map((b, i) => (
              <button key={i} onClick={b.fn} title={b.tip}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shadow-lg ${b.active ? 'bg-teal-500 border-teal-400 text-white' : 'bg-[#0d1120]/90 border-white/15 text-slate-300 hover:text-teal-400 hover:border-teal-500/50'}`}>
                {b.icon}
              </button>
            ))}
          </div>

          <div className="absolute bottom-6 left-4 z-10 px-3 py-1.5 bg-[#0d1120]/80 border border-white/10 rounded-full text-slate-500 text-xs">
            Click map to search a different area
          </div>
        </div>
      </div>
    </div>
  );
}
