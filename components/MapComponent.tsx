import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Pane } from 'react-leaflet';
import L from 'leaflet';
import { Report, Volunteer, ReportStatus, Prediction, IssueType } from '../types';

// Enhanced Icons
const createIcon = (colorClass: string, iconEmoji: string) => new L.DivIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative group">
      <div class="absolute -inset-2 bg-${colorClass} opacity-30 rounded-full blur-sm group-hover:opacity-50 transition"></div>
      <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-lg bg-slate-900 flex items-center justify-center text-lg z-10 hover:scale-110 transition-transform">
        ${iconEmoji}
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white z-0"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 36],
  popupAnchor: [0, -36]
});

const reportIcon = (type: IssueType) => {
  switch (type) {
    case IssueType.FIRE: return createIcon('red-600', '🔥');
    case IssueType.MEDICAL: return createIcon('blue-600', '🚑');
    case IssueType.CROWD: return createIcon('yellow-500', '👥');
    case IssueType.SUPPLIES: return createIcon('purple-500', '📦');
    default: return createIcon('orange-500', '⚠️');
  }
};

const volIcon = createIcon('emerald-500', '⛑️');

interface MapProps {
  reports: Report[];
  volunteers: Volunteer[];
  predictions?: Prediction[];
  center?: { lat: number, lng: number };
  zoom?: number;
  interactive?: boolean;
  onReportClick?: (reportId: string) => void;
  heatmapMode?: boolean;
}

const Recenter = ({ lat, lng, zoom }: { lat: number, lng: number, zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [lat, lng, zoom, map]);
  return null;
};

// Default Center: Al Madinah Al Munawwarah
const DEFAULT_CENTER = { lat: 24.4672, lng: 39.6102 };

type MapType = 'dark' | 'light' | 'satellite';

const MapComponent: React.FC<MapProps> = ({ reports, volunteers, predictions = [], center = DEFAULT_CENTER, zoom = 14, interactive = true, onReportClick, heatmapMode = false }) => {
  const [mapType, setMapType] = useState<MapType>('dark');

  const getTileLayer = () => {
    switch(mapType) {
      case 'light':
        return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      case 'satellite':
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case 'dark':
      default:
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        className="w-full h-full rounded-lg bg-slate-900"
        zoomControl={interactive}
        scrollWheelZoom={interactive}
        dragging={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={getTileLayer()}
        />
        <Recenter lat={center.lat} lng={center.lng} zoom={zoom} />

        {/* Fluid Heatmap Layer */}
        {heatmapMode ? (
          <Pane name="heatmap-pane" style={{ zIndex: 450 }}>
            {/* The CSS filter in index.html will blur this pane to create fluidity */}
            <div className="heatmap-layer">
              {reports.filter(r => r.status !== ReportStatus.RESOLVED).map(report => (
                <Circle 
                  key={`heat-${report.id}`}
                  center={[report.location.lat, report.location.lng]}
                  radius={150} 
                  pathOptions={{ 
                    fillColor: '#ef4444', 
                    color: 'transparent',
                    fillOpacity: 0.8,
                  }}
                />
              ))}
            </div>
          </Pane>
        ) : (
          <>
            {/* Standard Markers */}
            {reports.filter(r => r.status !== ReportStatus.RESOLVED).map(report => (
              <Marker 
                key={report.id} 
                position={[report.location.lat, report.location.lng]} 
                icon={reportIcon(report.type)}
                eventHandlers={{
                  click: () => {
                    if (onReportClick) onReportClick(report.id);
                  }
                }}
              >
                <Popup className="text-slate-900 text-right font-sans" dir="rtl">
                  <div className="p-1">
                    <h3 className="font-bold text-sm mb-1">{report.type}</h3>
                    <p className="text-xs mb-1">{report.description}</p>
                    <div className="flex gap-1">
                      <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded">خطورة: {report.aiSeverityScore}</span>
                      {report.assignedVolunteerId && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">جاري التعامل</span>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* Volunteers - Always visible for context */}
        {volunteers.filter(v => v.isOnline).map(vol => (
          <Marker key={vol.id} position={[vol.location.lat, vol.location.lng]} icon={volIcon}>
            <Popup className="text-slate-900 text-right" dir="rtl">
              <h3 className="font-bold">{vol.name}</h3>
              <p className="text-xs">{vol.skills.join(', ')}</p>
            </Popup>
          </Marker>
        ))}

        {/* AI Predictions */}
        {predictions.map(pred => (
          <Circle 
            key={pred.id}
            center={[pred.location.lat, pred.location.lng]}
            radius={pred.radius}
            pathOptions={{ 
              color: pred.severity === 'high' ? 'red' : 'orange', 
              fillColor: pred.severity === 'high' ? 'red' : 'orange',
              fillOpacity: 0.1,
              dashArray: '5, 5'
            }}
          >
             <Popup className="text-slate-900 text-right" dir="rtl">
              <h3 className="font-bold text-red-600">توقع خطر: {pred.severity === 'high' ? 'عالي' : 'متوسط'}</h3>
              <p>{pred.description}</p>
            </Popup>
          </Circle>
        ))}

      </MapContainer>

      {/* Map Layer Controls - Floating Widget */}
      {interactive && (
        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 p-1 rounded-lg shadow-xl flex flex-col gap-1">
          <button 
            onClick={() => setMapType('dark')}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs transition ${mapType === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            title="ليلي"
          >
            🌑
          </button>
          <button 
            onClick={() => setMapType('light')}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs transition ${mapType === 'light' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            title="نهاري"
          >
            ☀️
          </button>
          <button 
            onClick={() => setMapType('satellite')}
            className={`w-8 h-8 rounded flex items-center justify-center text-xs transition ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            title="قمر صناعي"
          >
            🛰️
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;