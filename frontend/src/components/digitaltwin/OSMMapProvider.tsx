'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { MapAdapterProps, MapMarker } from './MapAdapter';

// Factory for modern markers with status colors and battery indicators
function createCustomIcon(marker: MapMarker): L.DivIcon {
  const iconEmoji = {
    ambulance: '🚑',
    doctor: '🩺',
    ventilator: '🫁',
    wheelchair: '♿',
    defibrillator: '⚡',
    reception: '🛎️',
    building: '🏢',
    parking: '🅿️',
    default: '📍'
  }[marker.iconType] || '📍';

  const statusColor = marker.status === 'Active' ? 'bg-emerald-500 ring-emerald-300' :
                      marker.status === 'Maintenance' ? 'bg-amber-500 ring-amber-300' :
                      'bg-slate-500 ring-slate-300';

  const pulseClass = marker.pulse ? 'animate-ping opacity-75' : '';

  const htmlContent = `
    <div class="relative flex items-center justify-center">
      <!-- Glow Ring -->
      ${marker.pulse ? `<span class="absolute inline-flex h-10 w-10 rounded-full ${statusColor} ${pulseClass}"></span>` : ''}
      
      <!-- Core Icon Button -->
      <div class="relative w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg ring-2 ring-slate-800 transition-all duration-300 hover:scale-110">
        <span class="text-base select-none">${iconEmoji}</span>
        
        <!-- Status Indicator Dot -->
        ${marker.status ? `<span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-1 ring-slate-950 ${statusColor}"></span>` : ''}
      </div>

      <!-- Battery Bar if available -->
      ${typeof marker.battery === 'number' ? `
        <div class="absolute -top-3 w-8 bg-slate-950/80 rounded border border-slate-700 h-1 px-0.5 flex items-center">
          <div class="h-full rounded-sm ${marker.battery > 30 ? 'bg-emerald-500' : 'bg-red-500'}" style="width: ${marker.battery}%"></div>
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon-container',
    html: htmlContent,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
}

// Controller to fly to coordinates when center or markers change
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function OSMMapProvider({
  center,
  zoom,
  markers = [],
  polygons = [],
  polylines = [],
  onMarkerClick,
  onPolygonClick,
  tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution = '&copy; OpenStreetMap contributors &copy; CARTO'
}: MapAdapterProps) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <MapController center={center} zoom={zoom} />
        
        <TileLayer
          url={tileUrl}
          attribution={attribution}
        />

        {/* Polygons (e.g. Buildings, Restricted Zones) */}
        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.coordinates}
            eventHandlers={{
              click: () => onPolygonClick?.(polygon)
            }}
            pathOptions={{
              color: polygon.color || '#3b82f6',
              fillColor: polygon.fillColor || '#3b82f6',
              fillOpacity: polygon.fillOpacity || 0.15,
              weight: 2
            }}
          >
            {(polygon.popupTitle || polygon.popupDescription) && (
              <Popup className="custom-twin-popup">
                <div className="p-1 font-sans">
                  <h4 className="font-semibold text-slate-100 text-sm mb-0.5">{polygon.popupTitle}</h4>
                  {polygon.popupDescription && (
                    <p className="text-xs text-slate-400 leading-normal">{polygon.popupDescription}</p>
                  )}
                </div>
              </Popup>
            )}
          </Polygon>
        ))}

        {/* Polylines (e.g. Walkways, Navigation routes) */}
        {polylines.map((polyline) => (
          <Polyline
            key={polyline.id}
            positions={polyline.coordinates}
            pathOptions={{
              color: polyline.color || '#2563eb',
              dashArray: polyline.dashArray,
              weight: polyline.weight || 3
            }}
          >
            {polyline.popupTitle && (
              <Popup>
                <div className="p-1 font-sans text-xs font-medium text-slate-200">
                  {polyline.popupTitle}
                </div>
              </Popup>
            )}
          </Polyline>
        ))}

        {/* Markers (e.g. Assets, Staff, Ambulances) */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createCustomIcon(marker)}
            eventHandlers={{
              click: () => onMarkerClick?.(marker)
            }}
          >
            <Popup className="custom-twin-popup">
              <div className="p-2 font-sans min-w-[150px]">
                <h4 className="font-bold text-slate-100 text-sm mb-1">{marker.popupTitle}</h4>
                {marker.popupDescription && (
                  <p className="text-xs text-slate-300 leading-normal mb-1">{marker.popupDescription}</p>
                )}
                <div className="flex flex-col gap-1 border-t border-slate-800 pt-1.5 mt-1.5">
                  {typeof marker.battery === 'number' && (
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Battery Status:</span>
                      <span className={`font-semibold ${marker.battery > 30 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {marker.battery}%
                      </span>
                    </div>
                  )}
                  {marker.status && (
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Activity:</span>
                      <span className={`font-semibold uppercase tracking-wider text-[9px] px-1 rounded ${
                        marker.status === 'Active' ? 'bg-emerald-950 text-emerald-400' :
                        marker.status === 'Maintenance' ? 'bg-amber-950 text-amber-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {marker.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom Popup Stylings */}
      <style jsx global>{`
        .custom-twin-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important;
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5) !important;
          border-radius: 0.75rem !important;
          color: #f1f5f9 !important;
        }
        .custom-twin-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(51, 65, 85, 0.5) !important;
        }
        .custom-twin-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 8px 8px 0 0 !important;
        }
      `}</style>
    </div>
  );
}
