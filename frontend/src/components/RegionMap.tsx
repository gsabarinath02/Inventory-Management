import React, { useEffect, useState } from 'react';
import { Spin, Alert } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon issue in Leaflet
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RegionMapProps {
  region: string;
}

interface RegionCoords {
  name: string;
  lat: number;
  lon: number;
}

const FitBounds: React.FC<{ coords: RegionCoords[] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 1) {
      map.setView([coords[0].lat, coords[0].lon], 8);
    } else if (coords.length > 1) {
      const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
};

export const RegionMap: React.FC<RegionMapProps> = ({ region }) => {
  const [coords, setCoords] = useState<RegionCoords[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!region) return;
    setLoading(true);
    setError(null);
    setCoords([]);
    // Split by comma for multiple regions
    const regions = region.split(',').map(r => r.trim()).filter(Boolean);
    Promise.all(
      regions.map(r =>
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(r)}`)
          .then(res => res.json())
          .then(data =>
            data && data.length > 0
              ? { name: r, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
              : null
          )
          .catch(() => null)
      )
    ).then(results => {
      const found = results.filter(Boolean) as RegionCoords[];
      if (found.length > 0) {
        setCoords(found);
      } else {
        setError('No regions found on map.');
      }
    }).catch(() => setError('Failed to load map.')).finally(() => setLoading(false));
  }, [region]);

  if (loading) return <Spin tip="Loading map..." />;
  if (error) return <Alert type="warning" message={error} showIcon />;
  if (!coords.length) return null;

  return (
    <MapContainer center={[coords[0].lat, coords[0].lon]} zoom={8} style={{ height: 250, width: '100%', marginTop: 16, borderRadius: 8 }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds coords={coords} />
      {coords.map((c, i) => (
        <Marker key={c.name + i} position={[c.lat, c.lon]}>
          <Popup>{c.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default RegionMap; 