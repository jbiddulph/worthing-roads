'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import { useTown } from '@/components/TownProvider';
import type { TownSelection } from '@/lib/town';

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
  const { town, setTown } = useTown();
  const [townQuery, setTownQuery] = useState(town.label);
  const [townLoading, setTownLoading] = useState(false);
  const [townError, setTownError] = useState<string>('');
  const [autoTownMessage, setAutoTownMessage] = useState<string>('');

  useEffect(() => {
    setTownQuery(town.label);
  }, [town.label]);

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

  const resetRoundState = useCallback(() => {
    setDistance(null);
    if (userMarker) userMarker.remove();
    if (actualMarker) actualMarker.remove();
    setUserMarker(null);
    setActualMarker(null);
    if (map.current?.getSource('line')) {
      map.current.removeLayer('line');
      map.current.removeSource('line');
    }
  }, [userMarker, actualMarker]);

  const loadRoadsForTown = useCallback(
    async (t: TownSelection) => {
      // Prefer existing Worthing dataset for speed & offline-ish behaviour
      const isWorthing = t.label.trim().toLowerCase() === 'worthing';
      try {
        if (isWorthing) {
          const res = await fetch('/roads.json');
          const data = (await res.json()) as Road[];
          setRoads(data);
          if (data.length > 0) {
            setSelectedRoad(data[Math.floor(Math.random() * data.length)].road_name);
          }
          return;
        }

        const bbox =
          t.bbox ??
          ([
            t.center[0] - 0.12,
            t.center[1] - 0.08,
            t.center[0] + 0.12,
            t.center[1] + 0.08,
          ] as [number, number, number, number]);

        const bboxParam = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
        const res = await fetch(`/api/town-roads?bbox=${encodeURIComponent(bboxParam)}`);
        const json = (await res.json()) as { roads?: Road[]; error?: string };
        if (!res.ok) throw new Error(json.error || 'Failed to load roads');

        const list = json.roads ?? [];
        setRoads(list);
        if (list.length > 0) {
          setSelectedRoad(list[Math.floor(Math.random() * list.length)].road_name);
        } else {
          setSelectedRoad('');
        }
      } catch (e) {
        console.error('Error loading roads:', e);
        setRoads([]);
        setSelectedRoad('');
      }
    },
    []
  );

  const applyTown = useCallback(
    async (nextTown: TownSelection) => {
      setTown(nextTown);
      setTownQuery(nextTown.label);
      resetRoundState();

      if (map.current) {
        map.current.flyTo({
          center: nextTown.center,
          zoom: 12,
          duration: 900,
        });
      }

      await loadRoadsForTown(nextTown);
    },
    [loadRoadsForTown, resetRoundState, setTown]
  );

  // Load roads when town changes (includes stored town from homepage)
  useEffect(() => {
    void loadRoadsForTown(town);
  }, [loadRoadsForTown, town]);

  // On first load, try to detect the user's current UK town and switch to it.
  useEffect(() => {
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setAutoTownMessage('Detecting your town…');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;

          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=GB&types=place&limit=1`
          );
          const data = await res.json();
          const feature = data?.features?.[0];
          if (!feature?.center) {
            setAutoTownMessage('Could not detect a UK town — staying on current town.');
            return;
          }

          const detectedTown: TownSelection = {
            label: feature.text || 'Your town',
            displayName: feature.place_name || feature.text || 'Your town',
            center: feature.center as [number, number],
            bbox: (feature.bbox as [number, number, number, number] | undefined) ?? undefined,
          };

          await applyTown(detectedTown);
          setAutoTownMessage(`Using your town: ${detectedTown.label}`);
        } catch (e) {
          console.error('Failed to detect town:', e);
          setAutoTownMessage('Could not detect your town — staying on current town.');
        }
      },
      () => {
        if (cancelled) return;
        setAutoTownMessage('Location permission denied — staying on current town.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );

    return () => {
      cancelled = true;
    };
  }, [applyTown]);

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
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          `${selectedRoad}, ${town.label}, UK`
        )}.json?access_token=${token}&country=GB&types=address`
      );
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
  }, [selectedRoad, userMarker, actualMarker, calculateDistance, drawLine, town.label]);

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
    } catch {
      console.log('Road names layer not available yet, will apply on next map update');
    }
  }, []);

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
      center: town.center, // default town
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
  }, [showRoadNames, toggleRoadNames, town.center]);

  // Update road names when toggle changes
  useEffect(() => {
    if (map.current) {
      toggleRoadNames(showRoadNames);
    }
  }, [showRoadNames, toggleRoadNames]);

  const searchAndSetTown = useCallback(
    async (query: string) => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setTownError('Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).');
        return;
      }

      setTownLoading(true);
      setTownError('');
      setAutoTownMessage('');
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            `${query}, UK`
          )}.json?access_token=${token}&country=GB&types=place&limit=1`
        );
        const data = await res.json();
        const feature = data?.features?.[0];
        if (!feature?.center) {
          throw new Error('Town not found. Try “Town, County” (e.g. “Rochdale”).');
        }

        const nextTown: TownSelection = {
          label: feature.text || query,
          displayName: feature.place_name || query,
          center: feature.center as [number, number],
          bbox: (feature.bbox as [number, number, number, number] | undefined) ?? undefined,
        };

        await applyTown(nextTown);
      } catch (e) {
        setTownError(e instanceof Error ? e.message : String(e));
      } finally {
        setTownLoading(false);
      }
    },
    [applyTown]
  );

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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setShowRoadNames(!showRoadNames)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {showRoadNames ? 'Hide Road Names' : 'Show Road Names'}
            </button>

            <button
              onClick={getNewRoad}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              disabled={roads.length === 0}
              title={roads.length === 0 ? 'No roads loaded for this town yet' : 'Pick a new road'}
            >
              🎲 New Road
            </button>

            <form
              className="flex items-center gap-2 w-full sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                void searchAndSetTown(townQuery);
              }}
            >
              <span className="text-sm text-gray-700 whitespace-nowrap">Town (UK):</span>
              <input
                value={townQuery}
                onChange={(e) => setTownQuery(e.target.value)}
                placeholder="Search a UK town…"
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60"
                disabled={townLoading || townQuery.trim().length === 0}
              >
                {townLoading ? 'Searching…' : 'Search'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-700">
          Town: <span className="font-semibold">{town.label}</span>
          {roads.length > 0 && <span className="text-gray-500"> (roads loaded: {roads.length})</span>}
        </div>
        {autoTownMessage && <div className="mt-1 text-xs text-gray-500">{autoTownMessage}</div>}
        {townError && <div className="mt-1 text-sm text-red-600">{townError}</div>}
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
