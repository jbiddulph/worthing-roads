'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RoadMapProps {
  roadName: string;
  isVisible: boolean;
}

export default function RoadMap({ roadName, isVisible }: RoadMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;

    // Initialize map
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-0.3719, 50.8179], // Worthing coordinates
        zoom: 13
      });

      map.current.on('load', () => {
        setLoading(false);
      });
    }

    // Search for the road location
    const searchRoad = async () => {
      if (!map.current) return;

      setLoading(true);
      setError(null);

      try {
        const searchQuery = `${roadName}, Worthing, UK`;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&country=GB&types=address`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          // Remove existing markers
          const markers = document.querySelectorAll('.mapboxgl-marker');
          markers.forEach(marker => marker.remove());

          // Add new marker
          new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${roadName}</h3><p>Worthing, UK</p>`))
            .addTo(map.current);

          // Fly to the location
          map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 2000
          });
        } else {
          setError(`Could not find location for ${roadName}`);
        }
      } catch (err) {
        setError('Failed to load map data');
        console.error('Map error:', err);
      } finally {
        setLoading(false);
      }
    };

    searchRoad();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [roadName, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="mt-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          📍 Location: {roadName}
        </h3>
        
        {loading && (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-gray-600">Loading map...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-center">
              <p className="font-medium">Map Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg border border-gray-300"
            style={{ minHeight: '256px' }}
          />
        )}

        <p className="text-sm text-gray-600 mt-2">
          This map shows the approximate location of {roadName} in Worthing.
        </p>
      </div>
    </div>
  );
}
