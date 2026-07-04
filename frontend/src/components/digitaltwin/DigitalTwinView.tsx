'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { 
  Building2, 
  Layers, 
  Navigation, 
  ShieldAlert, 
  Activity, 
  Battery, 
  AlertTriangle, 
  Sliders, 
  Play, 
  Settings, 
  Search,
  Eye, 
  Power,
  Zap,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { MapMarker, MapPolygon, MapPolyline } from './MapAdapter';

// Load OpenStreetMap wrapper dynamically with SSR disabled to prevent Leaflet window errors
const OSMMap = dynamic(() => import('./OSMMapProvider'), { ssr: false });

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/digital-twin`;

export default function DigitalTwinView() {
  const { socket, isConnected } = useSocket();

  // Raw Database states
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [parkingSlots, setParkingSlots] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  // UI Selection states
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [searchAssetQuery, setSearchAssetQuery] = useState<string>('');
  
  // Navigation Planner states
  const [startRoom, setStartRoom] = useState<string>('');
  const [endRoom, setEndRoom] = useState<string>('');
  const [calculatedRoute, setCalculatedRoute] = useState<any | null>(null);

  // Overlay Toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showParking, setShowParking] = useState<boolean>(true);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);

  // Crisis / Emergency states
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [drillStatus, setDrillStatus] = useState<string>('System Normal');

  // Map viewport settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.1458, 79.0882]);
  const [mapZoom, setMapZoom] = useState<number>(18);

  // Load Initial Data
  const fetchData = async () => {
    try {
      const campusRes = await axios.get(`${API_BASE}/campus`);
      if (campusRes.data.success) {
        setBuildings(campusRes.data.buildings);
        setFloors(campusRes.data.floors);
        setRooms(campusRes.data.rooms);
        setParkingSlots(campusRes.data.parkingSlots);
      }

      const assetsRes = await axios.get(`${API_BASE}/assets`);
      if (assetsRes.data.success) {
        setAssets(assetsRes.data.assets);
      }

      const routesRes = await axios.get(`${API_BASE}/routes`);
      if (routesRes.data.success) {
        setRoutes(routesRes.data.routes);
      }
    } catch (err) {
      console.error('Error fetching digital twin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to WebSocket broadcasts for real-time asset tracking and emergency route updates
  useEffect(() => {
    if (!socket) return;

    socket.on('digitaltwin.asset.telemetry', (updatedAsset: any) => {
      setAssets(prev => prev.map(a => a._id === updatedAsset.assetId ? { ...a, ...updatedAsset } : a));
    });

    socket.on('digitaltwin.route.update', (updatedRoute: any) => {
      setRoutes(prev => prev.map(r => r._id === updatedRoute._id ? updatedRoute : r));
      // Re-trigger calculation if active route was updated
      if (calculatedRoute && calculatedRoute._id === updatedRoute._id) {
        setCalculatedRoute(updatedRoute);
      }
    });

    return () => {
      socket.off('digitaltwin.asset.telemetry');
      socket.off('digitaltwin.route.update');
    };
  }, [socket, calculatedRoute]);

  // Automatic asset movements simulation loop (useful for hackathon showcase)
  useEffect(() => {
    if (!autoSimulate) return;

    const interval = setInterval(async () => {
      try {
        await axios.post(`${API_BASE}/simulate`);
      } catch (err) {
        console.error('Simulation tick failed:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoSimulate]);

  // Handle single manual simulation step
  const handleSimulateStep = async () => {
    try {
      await axios.post(`${API_BASE}/simulate`);
    } catch (err) {
      console.error('Manual simulation tick failed:', err);
    }
  };

  // Build Map Markers dynamically
  const getMapMarkers = (): MapMarker[] => {
    const list: MapMarker[] = [];

    // 1. Live Assets (Ambulance, Ventilators, etc.)
    assets.forEach(asset => {
      // Filter asset coordinates based on floor (only show asset if it is in the active floor OR if it is an ambulance outside)
      const assetRoom = rooms.find(r => r._id === asset.room_id);
      const assetFloor = assetRoom ? floors.find(f => f._id === assetRoom.floor_id) : null;
      
      const isAmbulance = asset.type === 'Ambulance';
      const isCurrentFloor = assetFloor && assetFloor.level === selectedFloor;

      if (isAmbulance || isCurrentFloor || !asset.room_id) {
        list.push({
          id: `asset-${asset._id}`,
          position: [asset.latitude, asset.longitude],
          iconType: asset.type.toLowerCase() as any,
          popupTitle: asset.name,
          popupDescription: `Status: ${asset.status} | Location: ${assetRoom ? assetRoom.name : 'Staging Area'}`,
          pulse: asset.status === 'Active',
          battery: asset.battery_level,
          status: asset.status
        });
      }
    });

    // 2. Parking slots
    if (showParking) {
      parkingSlots.forEach(slot => {
        list.push({
          id: `parking-${slot._id}`,
          position: [slot.latitude, slot.longitude],
          iconType: 'parking',
          popupTitle: `Parking Space: ${slot.slot_number}`,
          popupDescription: `Type: ${slot.type} Parking | State: ${slot.status}`,
          status: slot.status === 'Available' ? 'Active' : 'Maintenance' // green vs yellow
        });
      });
    }

    return list;
  };

  // Build Map Footprint Polygons
  const getMapPolygons = (): MapPolygon[] => {
    const list: MapPolygon[] = [];

    // Buildings footprints
    buildings.forEach(b => {
      list.push({
        id: `building-${b._id}`,
        coordinates: b.polygon_coordinates,
        color: emergencyMode ? '#ef4444' : '#3b82f6',
        fillColor: emergencyMode ? '#fee2e2' : '#dbeafe',
        fillOpacity: 0.1,
        popupTitle: b.name,
        popupDescription: b.description
      });
    });

    // Room boundaries as smaller polygons centered on their latitude/longitude
    rooms.forEach(r => {
      const roomFloor = floors.find(f => f._id === r.floor_id);
      if (roomFloor && roomFloor.level === selectedFloor) {
        // Draw a neat small room grid square around its coordinate
        const size = 0.0001; // dimensions offset
        const coords: [number, number][] = [
          [r.latitude + size, r.longitude - size],
          [r.latitude + size, r.longitude + size],
          [r.latitude - size, r.longitude + size],
          [r.latitude - size, r.longitude - size],
          [r.latitude + size, r.longitude - size]
        ];

        // Color based on occupancy / availability
        let color = '#10b981'; // Green available
        if (r.capacity_beds > 0 && r.available_beds === 0) {
          color = '#ef4444'; // Red full
        } else if (r.capacity_beds > 0 && r.available_beds < r.capacity_beds / 2) {
          color = '#f59e0b'; // Amber warning
        }

        // Override if heatmap is toggled
        if (showHeatmap) {
          const occupancy = r.capacity_beds - r.available_beds;
          color = occupancy > 10 ? '#ef4444' : occupancy > 5 ? '#f97316' : occupancy > 2 ? '#eab308' : '#10b981';
        }

        list.push({
          id: `room-${r._id}`,
          coordinates: coords,
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          popupTitle: r.name,
          popupDescription: `Code: ${r.code} | Type: ${r.type} | Bed Capacity: ${r.capacity_beds} | Available: ${r.available_beds}`
        });
      }
    });

    return list;
  };

  // Build Polyline Vectors (Paths/Routes)
  const getMapPolylines = (): MapPolyline[] => {
    const list: MapPolyline[] = [];

    // Render calculated route if active
    if (calculatedRoute) {
      list.push({
        id: `active-route-${calculatedRoute._id}`,
        coordinates: calculatedRoute.coordinates,
        color: calculatedRoute.is_blocked ? '#dc2626' : (calculatedRoute.is_emergency ? '#ef4444' : '#10b981'),
        dashArray: calculatedRoute.is_blocked ? '5, 10' : undefined,
        weight: 6,
        popupTitle: `${calculatedRoute.name} (${calculatedRoute.distance_meters}m | ${calculatedRoute.estimated_time_seconds}s)`
      });
    }

    return list;
  };

  // Compute navigation path
  const handleCalculateRoute = () => {
    if (!startRoom || !endRoom) return;

    // Find seeded route mapping
    const matchingRoute = routes.find(r => 
      (r.start_room_id === startRoom && r.end_room_id === endRoom) ||
      (r.start_room_id === endRoom && r.end_room_id === startRoom)
    );

    if (matchingRoute) {
      setCalculatedRoute(matchingRoute);
      // Snap map center to route start
      const start = rooms.find(r => r._id === startRoom);
      if (start) setMapCenter([start.latitude, start.longitude]);
    } else {
      setCalculatedRoute(null);
      alert('Direct pathway not mapped. Generating standard emergency transit path fallback.');
      
      // Draw standard straight-line fallback path between rooms
      const start = rooms.find(r => r._id === startRoom);
      const end = rooms.find(r => r._id === endRoom);
      if (start && end) {
        setCalculatedRoute({
          _id: 'fallback-route',
          name: `${start.name} to ${end.name} Fallback Transit`,
          coordinates: [[start.latitude, start.longitude], [end.latitude, end.longitude]],
          distance_meters: 120,
          estimated_time_seconds: 90,
          is_emergency: false,
          is_blocked: false
        });
        setMapCenter([start.latitude, start.longitude]);
      }
    }
  };

  // Toggle route blocks or hazard controls (Crisis Mode simulation)
  const handleToggleRouteBlocked = async (routeId: string, isBlocked: boolean) => {
    try {
      const res = await axios.post(`${API_BASE}/emergency/${routeId}`, {
        isEmergency: emergencyMode,
        isBlocked: isBlocked
      });
      if (res.data.success) {
        setDrillStatus(isBlocked ? 'Active Hazard / Route Blocked' : 'Routes Re-cleared');
      }
    } catch (err) {
      console.error('Failed to toggle path status:', err);
    }
  };

  // Trigger emergency modes
  const handleTriggerCrisisMode = (active: boolean) => {
    setEmergencyMode(active);
    if (active) {
      setDrillStatus('CRITICAL ALERT: Emergency Level-1 Declared');
      // Highlight fast corridors and auto-calculate routes for code red
      const traumaRoute = routes.find(r => r.is_emergency === true);
      if (traumaRoute) {
        setCalculatedRoute(traumaRoute);
        // Find ER room
        const erRoom = rooms.find(r => r.type === 'Emergency');
        if (erRoom) {
          setStartRoom(erRoom._id);
          setMapCenter([erRoom.latitude, erRoom.longitude]);
        }
        const otRoom = rooms.find(r => r.type === 'OT');
        if (otRoom) setEndRoom(otRoom._id);
      }
    } else {
      setDrillStatus('System Normal');
      setCalculatedRoute(null);
      setStartRoom('');
      setEndRoom('');
    }
  };

  // Snap map to specific asset location
  const handleTrackAsset = (asset: any) => {
    setMapCenter([asset.latitude, asset.longitude]);
    setMapZoom(19);
  };

  // Filter assets list based on query
  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchAssetQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen text-slate-100 bg-slate-950 p-4 lg:p-6 gap-6">
      {/* Header and Live Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-blue-200 to-blue-400 bg-clip-text text-transparent">
                ArogyaMitra Digital Campus Twin
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic 2D spatial asset routing & emergency operations oversight
              </p>
            </div>
          </div>
        </div>

        {/* Live Network & Alarm indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-300">
              WebSocket: {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-500 ${
            emergencyMode 
              ? 'bg-rose-950/60 border-rose-800 text-rose-400 animate-pulse' 
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <ShieldAlert className={`w-4 h-4 ${emergencyMode ? 'animate-bounce' : ''}`} />
            <span>Crisis Command Desk: {emergencyMode ? 'CODE RED' : 'INACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Control Column (Campus switcher, Overlays, Crisis Controls) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Card 1: Floor / Building Switcher */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Campus Level Switcher
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { level: 3, label: '3rd Floor', desc: 'ICU & OTs' },
                { level: 2, label: '2nd Floor', desc: 'Pathology Lab' },
                { level: 1, label: '1st Floor', desc: 'Outpatient OPD' },
                { level: 0, label: 'Ground Floor', desc: 'Lobby & Pharmacy' }
              ].map(f => (
                <button
                  key={f.level}
                  onClick={() => setSelectedFloor(f.level)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    selectedFloor === f.level
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{f.label}</span>
                  <span className={`text-[10px] ${selectedFloor === f.level ? 'text-blue-100' : 'text-slate-500'} mt-0.5`}>
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Visual Overlays Control */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Map Visualizer Layers
            </h2>
            
            <div className="flex flex-col gap-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-slate-300">Crowd Occupancy Density (Heatmap)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showParking}
                  onChange={(e) => setShowParking(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-slate-300">Ambulance & Staff Parking Lots</span>
              </label>
            </div>
          </div>

          {/* Card 3: Emergency Operations Desk */}
          <div className={`border rounded-xl p-4 transition-all duration-300 backdrop-blur-md ${
            emergencyMode 
              ? 'bg-rose-950/20 border-rose-800' 
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${emergencyMode ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`} />
              Trauma Crisis Command
            </h2>
            
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
              Declare emergency alerts to highlight rapid patient transfer pathways and clear designated corridors.
            </p>

            <button
              onClick={() => handleTriggerCrisisMode(!emergencyMode)}
              className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase transition-all shadow ${
                emergencyMode 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20' 
                  : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300'
              }`}
            >
              <Power className="w-4 h-4" />
              {emergencyMode ? 'Deactivate Emergency' : 'Activate Code Red'}
            </button>

            {emergencyMode && (
              <div className="mt-4 pt-3 border-t border-rose-900/60 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Drill Monitor: {drillStatus}</span>
                </div>
                
                {/* Block pathways list simulation */}
                <div className="text-[10px] text-rose-300 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg">
                  <span className="font-bold block mb-1">Simulate Corridor Blockages:</span>
                  <div className="flex flex-col gap-2 mt-1.5">
                    {routes.map(route => (
                      <div key={route._id} className="flex items-center justify-between gap-2 border-b border-rose-950 pb-1.5 last:border-b-0 last:pb-0">
                        <span className="truncate max-w-[120px]">{route.name}</span>
                        <button
                          onClick={() => handleToggleRouteBlocked(route._id, !route.is_blocked)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            route.is_blocked
                              ? 'bg-emerald-900 text-emerald-300 hover:bg-emerald-800'
                              : 'bg-rose-900 text-rose-300 hover:bg-rose-800'
                          }`}
                        >
                          {route.is_blocked ? 'Clear Block' : 'Block Route'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas Column (Map Engine) */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <div className="relative w-full h-[520px]">
            {/* The Concrete Leaflet Map wrapper */}
            <OSMMap
              center={mapCenter}
              zoom={mapZoom}
              markers={getMapMarkers()}
              polygons={getMapPolygons()}
              polylines={getMapPolylines()}
            />

            {/* Float HUD inside map */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
              <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur shadow-md flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-slate-300">
                  Campus Floor: L{selectedFloor}
                </span>
              </div>
            </div>
            
            <div className="absolute bottom-4 right-4 z-[400] pointer-events-auto">
              <button 
                onClick={fetchData}
                className="bg-slate-950/90 border border-slate-800 p-2 rounded-lg hover:bg-slate-800 transition shadow-lg text-slate-300 hover:text-white"
                title="Refresh Map Layers"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Occupancy Indicators Gauges & Live Ticker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Bed Allocation Status
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-extrabold text-blue-400">
                  {rooms.filter(r => r.type === 'ICU' || r.type === 'Emergency').reduce((acc, curr) => acc + curr.available_beds, 0)} Beds
                </span>
                <span className="text-[10px] text-slate-500">Available / Open</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Ambulance Status
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-extrabold text-emerald-400">
                  {assets.filter(a => a.type === 'Ambulance' && a.status === 'Active').length} Active
                </span>
                <span className="text-[10px] text-slate-500">Fleet Response Ready</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Operations Live Load
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-extrabold text-amber-400">Normal</span>
                <span className="text-[10px] text-slate-500">62% Occupancy index</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Assets list and route planner */}
        <div className="xl:col-span-3 flex flex-col gap-6">

          {/* Card 1: Route Planner */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-400" />
              Dynamic Route Planner
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Start Room</label>
                <select
                  value={startRoom}
                  onChange={(e) => setStartRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select location...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (L{floors.find(f => f._id === r.floor_id)?.level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">End Destination</label>
                <select
                  value={endRoom}
                  onChange={(e) => setEndRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select location...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (L{floors.find(f => f._id === r.floor_id)?.level})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCalculateRoute}
                disabled={!startRoom || !endRoom}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
              >
                Calculate Route
              </button>

              {calculatedRoute && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-850 text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Active Route:</span>
                    <span className="font-semibold text-slate-200">{calculatedRoute.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Est. Distance:</span>
                    <span className="font-semibold text-blue-400">{calculatedRoute.distance_meters} meters</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Transit Time:</span>
                    <span className="font-semibold text-emerald-400">{calculatedRoute.estimated_time_seconds} seconds</span>
                  </div>
                  {calculatedRoute.is_blocked && (
                    <div className="text-[9px] font-bold bg-rose-950/60 border border-rose-900 text-rose-400 p-1.5 rounded flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warning: Designated path is blocked! Use emergency bypass route.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Live Telemetry & Assets */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md flex flex-col max-h-[320px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Live Asset Telemetry
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                {assets.length} items
              </span>
            </h2>

            {/* Search */}
            <div className="relative mb-3.5">
              <input
                type="text"
                placeholder="Search active assets..."
                value={searchAssetQuery}
                onChange={(e) => setSearchAssetQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto pr-1 flex flex-col gap-2 flex-grow scrollbar-thin">
              {filteredAssets.map(asset => {
                const isBatteryLow = asset.battery_level < 30;
                return (
                  <div 
                    key={asset._id} 
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-slate-200 truncate">{asset.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Type: {asset.type}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Battery indicator */}
                      <div className="flex items-center gap-1">
                        <Battery className={`w-3.5 h-3.5 ${isBatteryLow ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-semibold ${isBatteryLow ? 'text-red-400' : 'text-slate-300'}`}>
                          {asset.battery_level}%
                        </span>
                      </div>

                      <button
                        onClick={() => handleTrackAsset(asset)}
                        className="p-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-bold transition text-blue-400"
                        title="Locate Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Simulator Control Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              Simulator Control
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={autoSimulate}
                  onChange={(e) => setAutoSimulate(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-slate-300 font-semibold">Continuous Auto-Simulation</span>
              </label>

              <button
                onClick={handleSimulateStep}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-300 hover:text-white"
              >
                <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                Simulate Telemetry Tick
              </button>
            </div>
          </div>
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
