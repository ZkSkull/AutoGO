import React, { useEffect, useRef, useState } from 'react';
import './MapView.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet no Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// Ícones coloridos
function colorIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.4)"></div>`,
    iconSize:   [26, 26],
    iconAnchor: [13, 26],
    popupAnchor:[0, -30],
  });
}

/**
 * MapView — Leaflet + OpenStreetMap (100% gratuito, sem chave)
 *
 * Props:
 *   mode:           'driver' | 'client'
 *   origin:         { lat, lng, label }
 *   destination:    { lat, lng, label }
 *   driverPosition: { lat, lng }
 *   eta:            string
 *   onNavigate:     () => void
 *   onCall:         () => void
 */
export default function MapView({ mode = 'driver', origin, destination, driverPosition, eta, onNavigate, onCall }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const routeRef      = useRef(null);
  const markersRef    = useRef([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const center = driverPosition || origin || { lat: -23.5505, lng: -46.6333 };

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [center.lat, center.lng], zoom: 14, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers + route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (routeRef.current) { routeRef.current.remove(); routeRef.current = null; }

    const pts = [];

    if (origin) {
      const m = L.marker([origin.lat, origin.lng], { icon: colorIcon('#E11A2C') })
        .addTo(map).bindPopup(`<b>${origin.label || 'Loja'}</b><br>Ponto de coleta`);
      markersRef.current.push(m);
      pts.push([origin.lat, origin.lng]);
    }

    if (destination) {
      const m = L.marker([destination.lat, destination.lng], { icon: colorIcon('#22C55E') })
        .addTo(map).bindPopup(`<b>${destination.label || 'Cliente'}</b><br>Ponto de entrega`);
      markersRef.current.push(m);
      pts.push([destination.lat, destination.lng]);
    }

    if (driverPosition) {
      const m = L.marker([driverPosition.lat, driverPosition.lng], { icon: colorIcon('#3B82F6') })
        .addTo(map).bindPopup('<b>Entregador</b><br>Posição atual');
      markersRef.current.push(m);
    }

    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.18));

    if (origin && destination) calcRoute(map, origin, destination);
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, driverPosition?.lat, driverPosition?.lng]);

  const calcRoute = async (map, from, to) => {
    setLoading(true); setError(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const data = await fetch(url).then(r => r.json());
      if (data.code !== 'Ok') throw new Error('Rota não encontrada');
      const route  = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const dist   = (route.distance / 1000).toFixed(1) + ' km';
      const mins   = Math.round(route.duration / 60);
      const dur    = mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${mins%60}min`;
      if (routeRef.current) routeRef.current.remove();
      routeRef.current = L.polyline(coords, { color: '#E11A2C', weight: 5, opacity: 0.85 }).addTo(map);
      setRouteInfo({ distance: dist, duration: dur });
    } catch {
      setError('Não foi possível calcular a rota.');
      if (from && to) {
        if (routeRef.current) routeRef.current.remove();
        routeRef.current = L.polyline([[from.lat,from.lng],[to.lat,to.lng]], { color:'#E11A2C', weight:4, dashArray:'8 8' }).addTo(map);
      }
    } finally { setLoading(false); }
  };

  const handleNavigate = () => {
    if (onNavigate) { onNavigate(); return; }
    if (destination) window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`, '_blank');
  };

  return (
    <div className="mapview-wrap">
      <div className="mapview-map">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {loading && (
          <div className="map-route-loading">
            <div className="map-spinner" /><span>Calculando rota…</span>
          </div>
        )}
      </div>
      <div className="mapview-panel">
        <div className="mapview-route">
          {origin && (
            <div className="mapview-stop">
              <div className="mapview-stop-dot red" />
              <div className="mapview-stop-info">
                <span className="mapview-stop-label">{mode === 'driver' ? 'Coleta' : 'Loja'}</span>
                <span className="mapview-stop-addr">{origin.label}</span>
              </div>
            </div>
          )}
          {origin && destination && <div className="mapview-connector" />}
          {destination && (
            <div className="mapview-stop">
              <div className="mapview-stop-dot green" />
              <div className="mapview-stop-info">
                <span className="mapview-stop-label">{mode === 'driver' ? 'Entrega' : 'Seu endereço'}</span>
                <span className="mapview-stop-addr">{destination.label}</span>
              </div>
            </div>
          )}
        </div>
        {(routeInfo || eta) && (
          <div className="mapview-stats">
            <div className="mapview-stat">
              <i className="fa-solid fa-clock" />
              <div><span className="stat-val">{routeInfo?.duration || eta}</span><span className="stat-lbl">Tempo estimado</span></div>
            </div>
            {routeInfo?.distance && <>
              <div className="mapview-stat-divider" />
              <div className="mapview-stat">
                <i className="fa-solid fa-road" />
                <div><span className="stat-val">{routeInfo.distance}</span><span className="stat-lbl">Distância</span></div>
              </div>
            </>}
          </div>
        )}
        {error && <p className="map-route-error"><i className="fa-solid fa-triangle-exclamation" /> {error}</p>}
        <div className="mapview-actions">
          <button className="btn btn-primary" onClick={handleNavigate}><i className="fa-solid fa-diamond-turn-right" /> Navegar</button>
          {onCall && <button className="btn btn-outline" onClick={onCall}><i className="fa-solid fa-phone" /> Ligar</button>}
          {mode === 'driver' && (
            <button className="btn btn-ghost" onClick={() => calcRoute(mapRef.current, origin, destination)}>
              <i className="fa-solid fa-rotate" /> Recalcular
            </button>
          )}
        </div>
      </div>
    </div>
  );
}