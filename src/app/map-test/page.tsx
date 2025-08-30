'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';

interface Road {
  road_name: string;
}

export default function MapTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<string>('');
  const [userMarker, setUserMarker] = useState<mapboxgl.Marker | null>(null);
  const [actualMarker, setActualMarker] = useState<mapboxgl.Marker | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [roads, setRoads] = useState<Road[]>([]);
  const [showRoadNames, setShowRoadNames] = useState(true); // State to control road names visibility

  // Function to select a random road
  const selectRandomRoad = useCallback(() => {
    if (roads.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * roads.length);
    setSelectedRoad(roads[randomIndex].road_name);
    // Reset distance and clear markers
    setDistance(null);
    setUserMarker(null);
    setActualMarker(null);
    // Clear map elements if map exists
    if (map.current) {
      if (userMarker) userMarker.remove();
      if (actualMarker) actualMarker.remove();
      if (map.current.getSource('line')) {
        map.current.removeLayer('line');
        map.current.removeSource('line');
      }
    }
  }, [roads, userMarker, actualMarker]);

  // Function to get a new random road
  const getNewRoad = useCallback(() => {
    selectRandomRoad();
  }, [selectRandomRoad]);

  // Load roads data and select first road only once
  useEffect(() => {
    fetch('/roads.json')
      .then(res => res.json())
      .then(data => {
        setRoads(data);
        // Randomly select a road only once on initial load
        const randomIndex = Math.floor(Math.random() * data.length);
        setSelectedRoad(data[randomIndex].road_name);
      })
      .catch(err => console.error('Error loading roads:', err));
  }, []); // Empty dependency array - only runs once

  // Calculate distance between two points in miles
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Draw line between two points
  const drawLine = useCallback((start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    // Remove previous line if it exists
    if (map.current.getSource('line')) {
      map.current.removeLayer('line');
      map.current.removeSource('line');
    }

    // Add line source
    map.current.addSource('line', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [start, end]
        }
      }
    });

    // Add line layer
    map.current.addLayer({
      id: 'line',
      type: 'line',
      source: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#888',
        'line-width': 3
      }
    });
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!map.current || !selectedRoad) return;

    const { lng, lat } = e.lngLat;

    // Remove previous user marker
    if (userMarker) {
      userMarker.remove();
    }

    // Add new user marker (red)
    const newUserMarker = new mapboxgl.Marker({ color: '#EF4444' })
      .setLngLat([lng, lat])
      .addTo(map.current);
    setUserMarker(newUserMarker);

    // Now find and mark the actual road location
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(selectedRoad + ', Worthing, UK')}.json?access_token=${token}&country=GB&types=address`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [actualLng, actualLat] = data.features[0].center;
        
        // Remove previous actual marker if it exists
        if (actualMarker) {
          actualMarker.remove();
        }
        
        // Add actual road marker (blue)
        const newActualMarker = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([actualLng, actualLat])
          .addTo(map.current);
        setActualMarker(newActualMarker);

        // Calculate distance
        const distanceInMiles = calculateDistance(lat, lng, actualLat, actualLng);
        setDistance(distanceInMiles);
        
        // Check if user is within 0.15 miles and trigger confetti
        if (distanceInMiles <= 0.15) {
          // Import confetti dynamically to avoid SSR issues
          import('canvas-confetti').then((confetti) => {
            confetti.default({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          });
        }
        
        // Draw line between markers
        drawLine([lng, lat], [actualLng, actualLat]);
      }
    } catch (err) {
      console.error('Error finding road location:', err);
    }
  }, [selectedRoad, userMarker, actualMarker, calculateDistance, drawLine]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('No Mapbox token found');
      return;
    }

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-0.3719, 50.8179], // Worthing, West Sussex
      zoom: 12
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully');
      // Set initial road names visibility
      toggleRoadNames(showRoadNames);
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });
  }, []);

  // Toggle road names visibility
  const toggleRoadNames = useCallback((show: boolean) => {
    if (!map.current) return;
    
    try {
      if (show) {
        // Show road names by setting visibility to visible
        map.current.setLayoutProperty('road-label', 'visibility', 'visible');
      } else {
        // Hide road names by setting visibility to none
        map.current.setLayoutProperty('road-label', 'visibility', 'none');
      }
    } catch (error) {
      console.log('Road names layer not available yet, will apply on next map update');
    }
  }, []);

  // Update road names when toggle changes
  useEffect(() => {
    if (map.current) {
      toggleRoadNames(showRoadNames);
    }
  }, [showRoadNames, toggleRoadNames]);

  // Add click event listener
  useEffect(() => {
    if (!map.current) return;

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [handleMapClick]);

  return (
    <div className="h-screen flex flex-col">
      {/* Road name header */}
      <div className="bg-white shadow-md p-4 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              Find: {selectedRoad}
            </h1>
          </div>
          <button
            onClick={() => setShowRoadNames(!showRoadNames)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {showRoadNames ? 'Hide Road Names' : 'Show Road Names'}
          </button>
          <button
            onClick={getNewRoad}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            🎲 New Road
          </button>
        </div>
        {distance !== null && (
          <p className="text-center text-lg text-gray-600 mt-2">
            Distance: {distance.toFixed(2)} miles
          </p>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md max-w-xs">
          <p className="text-sm text-gray-700">
            Click on the map where you think <strong>{selectedRoad}</strong> is located.
          </p>
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Your guess</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Actual location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
