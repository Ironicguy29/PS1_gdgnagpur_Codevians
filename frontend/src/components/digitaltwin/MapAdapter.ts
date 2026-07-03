export interface MapMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  iconType: 'ambulance' | 'doctor' | 'ventilator' | 'wheelchair' | 'defibrillator' | 'reception' | 'building' | 'parking' | 'default';
  popupTitle: string;
  popupDescription?: string;
  pulse?: boolean;
  battery?: number;
  status?: string;
}

export interface MapPolygon {
  id: string;
  coordinates: [number, number][]; // [[lat, lng], ...]
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  popupTitle?: string;
  popupDescription?: string;
  label?: string;
}

export interface MapPolyline {
  id: string;
  coordinates: [number, number][]; // [[lat, lng], ...]
  color?: string;
  dashArray?: string;
  weight?: number;
  popupTitle?: string;
}

export interface MapAdapterProps {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  polylines?: MapPolyline[];
  onMarkerClick?: (marker: MapMarker) => void;
  onPolygonClick?: (polygon: MapPolygon) => void;
  tileUrl?: string;
  attribution?: string;
  showHeatmap?: boolean;
  heatmapPoints?: { lat: number; lng: number; intensity: number }[];
}
