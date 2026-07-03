'use client';

/**
 * AmbulanceMapClient
 * 
 * Reusable live-tracking map component built on React Leaflet + OpenStreetMap.
 * Displays:
 *   - Live ambulance position (pulsing 🚑 icon, animates on move)
 *   - Patient pickup marker
 *   - Hospital destination marker
 *   - Animated Leaflet Routing Machine-style polyline (fallback drawn via OSRM)
 * 
 * Accepts optional `socket` to subscribe to real-time GPS events from the backend.
 */

import 'leaflet-defaulticon-compatibility';
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { NAGPUR_CENTER } from '@/services/overpass';

// ─── Icon factories ───────────────────────────────────────────────────────────

function makeAmbulanceIcon(heading = 0): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `
          <div style="transform: rotate(${heading}deg); transition: transform 0.5s ease;" class="relative">
            <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-red-200 animate-pulse">
              <span class="text-xl">🚑</span>
            </div>
          </div>
        `,
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
        popupAnchor:[0, -22],
    });
}

function makePickupIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `
          <div class="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-amber-100">
            <span class="text-lg">📍</span>
          </div>
        `,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor:[0, -32],
    });
}

function makeHospitalIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `
          <div class="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-100">
            <span class="text-lg">🏥</span>
          </div>
        `,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor:[0, -32],
    });
}

// ─── Fly-to helper ────────────────────────────────────────────────────────────

function MapFitter({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length === 0) return;
        if (positions.length === 1) {
            map.flyTo(positions[0], 15, { animate: true });
        } else {
            const bounds = L.latLngBounds(positions);
            map.flyToBounds(bounds, { padding: [60, 60], animate: true });
        }
    }, [positions.map(p => p.join(',')).join('|')]);
    return null;
}

// ─── Route polyline via OSRM ──────────────────────────────────────────────────

async function fetchRoute(from: [number, number], to: [number, number]): Promise<[number, number][]> {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error();
        const data: any = await res.json();
        const coords = data.routes?.[0]?.geometry?.coordinates ?? [];
        return coords.map(([lng, lat]: [number, number]) => [lat, lng]);
    } catch {
        return [from, to]; // straight line fallback
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AmbulancePosition {
    latitude:  number;
    longitude: number;
    speed?:    number;
    heading?:  number;
}

export interface AmbulanceMapProps {
    ambulance?:    AmbulancePosition;
    pickup?:       { latitude: number; longitude: number; address?: string };
    destination?:  { latitude: number; longitude: number; address?: string };
    gpsTrail?:     { latitude: number; longitude: number }[];
    height?:       string;   // CSS height, default 400px
    className?:    string;
    showRoute?:    boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AmbulanceMapClient({
    ambulance,
    pickup,
    destination,
    gpsTrail = [],
    height = '400px',
    className = '',
    showRoute = true,
}: AmbulanceMapProps) {
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const prevAmbRef = useRef<AmbulancePosition | undefined>(undefined);

    // Derive fit-bounds positions
    const fitPositions: [number, number][] = [
        ...(ambulance   ? [[ambulance.latitude,   ambulance.longitude]]   as [number,number][] : []),
        ...(pickup      ? [[pickup.latitude,      pickup.longitude]]      as [number,number][] : []),
        ...(destination ? [[destination.latitude, destination.longitude]] as [number,number][] : []),
    ];

    // Fetch OSRM route when ambulance or destination changes
    useEffect(() => {
        if (!showRoute || !ambulance || !destination) { setRouteCoords([]); return; }
        const from: [number, number] = [ambulance.latitude, ambulance.longitude];
        const to:   [number, number] = [destination.latitude, destination.longitude];
        fetchRoute(from, to).then(setRouteCoords);
    }, [ambulance?.latitude, ambulance?.longitude, destination?.latitude, destination?.longitude, showRoute]);

    const center: [number, number] = ambulance
        ? [ambulance.latitude, ambulance.longitude]
        : pickup
            ? [pickup.latitude, pickup.longitude]
            : [NAGPUR_CENTER.latitude, NAGPUR_CENTER.longitude];

    // GPS trail coords
    const trailCoords: [number, number][] = gpsTrail.map(p => [p.latitude, p.longitude]);

    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg ${className}`} style={{ height }}>
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFitter positions={fitPositions} />

                {/* OSRM route polyline */}
                {routeCoords.length > 1 && (
                    <Polyline positions={routeCoords} color="#2563eb" weight={4} dashArray="8 4" opacity={0.85} />
                )}

                {/* Historical GPS trail */}
                {trailCoords.length > 1 && (
                    <Polyline positions={trailCoords} color="#f97316" weight={2} opacity={0.5} />
                )}

                {/* Ambulance */}
                {ambulance && (
                    <Marker
                        position={[ambulance.latitude, ambulance.longitude]}
                        icon={makeAmbulanceIcon(ambulance.heading ?? 0)}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-bold">🚑 Ambulance</p>
                                <p className="text-slate-500">Speed: {ambulance.speed ?? 0} km/h</p>
                                <p className="text-xs text-slate-400">{ambulance.latitude.toFixed(5)}, {ambulance.longitude.toFixed(5)}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Pickup */}
                {pickup && (
                    <Marker position={[pickup.latitude, pickup.longitude]} icon={makePickupIcon()}>
                        <Popup>
                            <p className="font-bold text-amber-700">📍 Patient Pickup</p>
                            {pickup.address && <p className="text-sm text-slate-600">{pickup.address}</p>}
                        </Popup>
                    </Marker>
                )}

                {/* Destination (hospital) */}
                {destination && (
                    <Marker position={[destination.latitude, destination.longitude]} icon={makeHospitalIcon()}>
                        <Popup>
                            <p className="font-bold text-blue-700">🏥 Hospital</p>
                            {destination.address && <p className="text-sm text-slate-600">{destination.address}</p>}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
