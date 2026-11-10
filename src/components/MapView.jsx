import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// Ícones coloridos personalizados
function colorIcon(color, iconClass = 'fa-location-dot') {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:30px;height:30px;background:${color};
        border:3px solid #fff;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.45);
        display:flex;align-items:center;justify-content:center;
      ">
        <i class="fa-solid ${iconClass}" style="color:#fff;font-size:11px;transform:rotate(45deg);"></i>
      </div>
    `,
    iconSize:   [30, 30],
    iconAnchor: [15, 30],
    popupAnchor:[0, -32],
  });
}

// Cálculo Haversine (distância em km)
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  return R * c;
}

// Gera rota urbana realista de fallback caso o servidor público OSRM oscile
function buildUrbanFallbackRoute(from, to) {
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const coords = [
    [from.lat, from.lng],
    [from.lat + dLat * 0.18, from.lng + dLng * 0.06],
    [from.lat + dLat * 0.35, from.lng + dLng * 0.28],
    [from.lat + dLat * 0.52, from.lng + dLng * 0.48],
    [from.lat + dLat * 0.68, from.lng + dLng * 0.72],
    [from.lat + dLat * 0.85, from.lng + dLng * 0.91],
    [to.lat, to.lng],
  ];
  const straightKm = haversineKm(from, to);
  const roadKm = Math.max(1.2, straightKm * 1.32);
  const mins = Math.max(6, Math.round((roadKm / 26) * 60));
  return {
    coords,
    distance: `${roadKm.toFixed(1)} km`,
    duration: mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`,
  };
}

/**
 * MapView — Leaflet + OpenStreetMap + OSRM (100% gratuito, sem chave)
 */
export default function MapView({ mode = 'driver', origin, destination, driverPosition, eta, onNavigate, onCall }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const routeRef      = useRef([]);
  const markersRef    = useRef([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading]     = useState(false);

  const defaultOrigin = origin || { lat: -23.6012, lng: -46.6782, label: 'Auto Peças Bandeirantes' };
  const defaultDest   = destination || { lat: -23.5615, lng: -46.6560, label: 'Av. Paulista, 1000 — São Paulo' };
  const center        = driverPosition || defaultOrigin;

  const clearRouteLayers = () => {
    routeRef.current.forEach(layer => {
      try { layer.remove(); } catch { /* ignore */ }
    });
    routeRef.current = [];
  };

  const drawRoute = useCallback((map, coords) => {
    clearRouteLayers();
    const outline = L.polyline(coords, {
      color: '#0D0D0D',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    const mainLine = L.polyline(coords, {
      color: '#E11A2C',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeRef.current = [outline, mainLine];
  }, []);

  const calcRoute = useCallback(async (map, from, to) => {
    if (!map || !from || !to) return;
    setLoading(true);

    const fetchWithTimeout = (url, ms = 3200) =>
      Promise.race([
        fetch(url).then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
      ]);

    try {
      const endpoints = [
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
      ];

      let data = null;
      for (const url of endpoints) {
        try {
          const res = await fetchWithTimeout(url, 3000);
          if (res && res.code === 'Ok' && res.routes?.length) {
            data = res;
            break;
          }
        } catch {
          /* tenta próximo endpoint gratuito */
        }
      }

      if (!data) throw new Error('fallback');

      const route  = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const dist   = (route.distance / 1000).toFixed(1) + ' km';
      const mins   = Math.max(4, Math.round(route.duration / 60));
      const dur    = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;

      drawRoute(map, coords);
      setRouteInfo({ distance: dist, duration: dur });
      map.fitBounds(L.latLngBounds(coords).pad(0.18));
    } catch {
      const fallback = buildUrbanFallbackRoute(from, to);
      drawRoute(map, fallback.coords);
      setRouteInfo({ distance: fallback.distance, duration: fallback.duration });
      map.fitBounds(L.latLngBounds(fallback.coords).pad(0.22));
    } finally {
      setLoading(false);
    }
  }, [drawRoute]);

  // Inicializa o mapa Leaflet e observa redimensionamentos
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors · OSRM',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(el);
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza marcadores e rota
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.invalidateSize();

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    clearRouteLayers();

    const pts = [];

    if (defaultOrigin) {
      const m = L.marker([defaultOrigin.lat, defaultOrigin.lng], { icon: colorIcon('#E11A2C', 'fa-store') })
        .addTo(map)
        .bindPopup(`<b>${defaultOrigin.label || 'Loja'}</b><br>Ponto de coleta`);
      markersRef.current.push(m);
      pts.push([defaultOrigin.lat, defaultOrigin.lng]);
    }

    if (defaultDest) {
      const m = L.marker([defaultDest.lat, defaultDest.lng], { icon: colorIcon('#22C55E', 'fa-flag-checkered') })
        .addTo(map)
        .bindPopup(`<b>${defaultDest.label || 'Cliente'}</b><br>Ponto de entrega`);
      markersRef.current.push(m);
      pts.push([defaultDest.lat, defaultDest.lng]);
    }

    if (driverPosition) {
      const m = L.marker([driverPosition.lat, driverPosition.lng], { icon: colorIcon('#3B82F6', 'fa-motorcycle') })
        .addTo(map)
        .bindPopup('<b>Entregador (Você)</b><br>Em deslocamento');
      markersRef.current.push(m);
      pts.push([driverPosition.lat, driverPosition.lng]);
    }

    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts).pad(0.22));
    }

    if (defaultOrigin && defaultDest) {
      calcRoute(map, defaultOrigin, defaultDest);
    }
  }, [
    defaultOrigin?.lat,
    defaultOrigin?.lng,
    defaultOrigin?.label,
    defaultDest?.lat,
    defaultDest?.lng,
    defaultDest?.label,
    driverPosition?.lat,
    driverPosition?.lng,
    calcRoute,
  ]);

  const handleNavigate = () => {
    if (onNavigate) { onNavigate(); return; }
    if (defaultDest) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${defaultOrigin.lat},${defaultOrigin.lng}&destination=${defaultDest.lat},${defaultDest.lng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  return (
    <div className="mapview-wrap">
      <div className="mapview-header">
        <div className="mapview-badge">
          <span className="mapview-badge-dot" />
          Rota em Tempo Real Ativa
        </div>
        <span className="mapview-provider">
          <i className="fa-solid fa-map-location-dot" /> OpenStreetMap + OSRM Free Routing
        </span>
      </div>

      <div className="mapview-map">
        <div ref={containerRef} className="mapview-canvas" />
        {loading && (
          <div className="map-route-loading">
            <div className="map-spinner" /><span>Calculando melhor rota…</span>
          </div>
        )}
      </div>

      <div className="mapview-panel">
        <div className="mapview-route">
          {defaultOrigin && (
            <div className="mapview-stop">
              <div className="mapview-stop-dot red" />
              <div className="mapview-stop-info">
                <span className="mapview-stop-label">{mode === 'driver' ? 'Coleta na Loja' : 'Loja de Origem'}</span>
                <span className="mapview-stop-addr">{defaultOrigin.label}</span>
              </div>
            </div>
          )}
          {defaultOrigin && defaultDest && <div className="mapview-connector" />}
          {defaultDest && (
            <div className="mapview-stop">
              <div className="mapview-stop-dot green" />
              <div className="mapview-stop-info">
                <span className="mapview-stop-label">{mode === 'driver' ? 'Entrega ao Cliente' : 'Seu Endereço'}</span>
                <span className="mapview-stop-addr">{defaultDest.label}</span>
              </div>
            </div>
          )}
        </div>

        {(routeInfo || eta) && (
          <div className="mapview-stats">
            <div className="mapview-stat">
              <i className="fa-solid fa-clock" />
              <div>
                <span className="stat-val">{routeInfo?.duration || eta || '18 min'}</span>
                <span className="stat-lbl">Tempo estimado</span>
              </div>
            </div>
            <div className="mapview-stat-divider" />
            <div className="mapview-stat">
              <i className="fa-solid fa-road" />
              <div>
                <span className="stat-val">{routeInfo?.distance || '5.4 km'}</span>
                <span className="stat-lbl">Distância da rota</span>
              </div>
            </div>
          </div>
        )}

        <div className="mapview-actions">
          <button type="button" className="btn btn-primary" onClick={handleNavigate}>
            <i className="fa-solid fa-diamond-turn-right" /> Abrir no GPS
          </button>
          {onCall && (
            <button type="button" className="btn btn-outline" onClick={onCall}>
              <i className="fa-solid fa-phone" /> Ligar
            </button>
          )}
          {mode === 'driver' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => calcRoute(mapRef.current, defaultOrigin, defaultDest)}
            >
              <i className="fa-solid fa-rotate" /> Recalcular Rota
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
