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

type MapMode = 'quiz' | 'route';

interface RouteStop {
  id: string;
  address: string;
}

interface GeocodedStop extends RouteStop {
  placeName: string;
  coordinates: [number, number];
}

interface RouteSummary {
  distanceMiles: number;
  durationMinutes: number;
  furthestStop: string;
  orderedStops: string[];
}

interface MapboxGeocodingFeature {
  center: [number, number];
  place_name: string;
  text?: string;
}

interface MapboxGeocodingResponse {
  features?: MapboxGeocodingFeature[];
}

interface DrivingLineGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

interface OptimizedTrip {
  geometry: DrivingLineGeometry;
  distance: number;
  duration: number;
}

interface OptimizedTripWaypoint {
  location?: [number, number];
  waypoint_index?: number;
}

interface OptimizedTripResponse {
  code?: string;
  message?: string;
  trips?: OptimizedTrip[];
  waypoints?: OptimizedTripWaypoint[];
}

const QUIZ_LINE_ID = 'line';
const ROUTE_SOURCE_ID = 'driving-route-source';
const ROUTE_LAYER_ID = 'driving-route-layer';
const MAX_ROUTE_STOPS = 10;

export default function MapTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<string>('');
  const [mapMode, setMapMode] = useState<MapMode>('quiz');
  const [userMarker, setUserMarker] = useState<mapboxgl.Marker | null>(null);
  const [actualMarker, setActualMarker] = useState<mapboxgl.Marker | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [roads, setRoads] = useState<Road[]>([]);
  const [showRoadNames, setShowRoadNames] = useState(true); // State to control road names visibility
  const { town, setTown, hasStoredTown } = useTown();
  const [townQuery, setTownQuery] = useState(town.label);
  const [townLoading, setTownLoading] = useState(false);
  const [townError, setTownError] = useState<string>('');
  const [autoTownMessage, setAutoTownMessage] = useState<string>('');
  const [routeAddressInput, setRouteAddressInput] = useState('');
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [routeError, setRouteError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  useEffect(() => {
    setTownQuery(town.label);
  }, [town.label]);

  const removeLayerAndSource = useCallback((layerId: string, sourceId: string) => {
    if (!map.current) return;
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }
  }, []);

  const clearRouteVisuals = useCallback(() => {
    routeMarkersRef.current.forEach((marker) => marker.remove());
    routeMarkersRef.current = [];
    removeLayerAndSource(ROUTE_LAYER_ID, ROUTE_SOURCE_ID);
  }, [removeLayerAndSource]);

  const clearRoutePlanner = useCallback(() => {
    setRouteAddressInput('');
    setRouteStops([]);
    setRouteError('');
    setRouteSummary(null);
    clearRouteVisuals();
  }, [clearRouteVisuals]);

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
      removeLayerAndSource(QUIZ_LINE_ID, QUIZ_LINE_ID);
    }
  }, [roads, userMarker, actualMarker, removeLayerAndSource]);

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
    removeLayerAndSource(QUIZ_LINE_ID, QUIZ_LINE_ID);
  }, [userMarker, actualMarker, removeLayerAndSource]);

  const addRouteStop = useCallback(() => {
    const trimmedAddress = routeAddressInput.trim();
    if (!trimmedAddress) return;
    if (routeStops.length >= MAX_ROUTE_STOPS) {
      setRouteError(`You can add up to ${MAX_ROUTE_STOPS} addresses at once.`);
      return;
    }

    const nextStop: RouteStop = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      address: trimmedAddress,
    };

    setRouteStops((prev) => [...prev, nextStop]);
    setRouteAddressInput('');
    setRouteError('');
    setRouteSummary(null);
  }, [routeAddressInput, routeStops.length]);

  const removeRouteStop = useCallback(
    (stopId: string) => {
      setRouteStops((prev) => prev.filter((stop) => stop.id !== stopId));
      setRouteError('');
      setRouteSummary(null);
      clearRouteVisuals();
    },
    [clearRouteVisuals]
  );

  const getLiveLocation = useCallback((): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not available in this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        () => {
          reject(new Error('Unable to get your live location. Please allow location access and try again.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      );
    });
  }, []);

  // Calculate distance between two points in miles
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const earthRadiusMiles = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  }, []);

  const geocodeAddress = useCallback(
    async (address: string, token: string): Promise<Omit<GeocodedStop, 'id' | 'address'>> => {
      const searchVariants = Array.from(
        new Set([`${address}, ${town.label}, UK`, `${address}, UK`, address].map((value) => value.trim()))
      );

      for (const query of searchVariants) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${token}&country=GB&types=address,poi&limit=1`
        );
        const data = (await response.json()) as MapboxGeocodingResponse;
        const firstFeature = data.features?.[0];

        if (firstFeature?.center && firstFeature.center.length === 2) {
          return {
            placeName: firstFeature.place_name || firstFeature.text || address,
            coordinates: [firstFeature.center[0], firstFeature.center[1]],
          };
        }
      }

      throw new Error(`Could not find "${address}".`);
    },
    [town.label]
  );

  const formatDuration = useCallback((minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  const calculateDrivingRoute = useCallback(async () => {
    if (!map.current) return;
    if (routeStops.length === 0) {
      setRouteError('Add at least one address to calculate a route.');
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setRouteError('Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).');
      return;
    }

    setRouteLoading(true);
    setRouteError('');
    setRouteSummary(null);
    clearRouteVisuals();

    try {
      const liveLocation = await getLiveLocation();
      const geocodedStops = await Promise.all(
        routeStops.map(async (stop) => {
          const geocoded = await geocodeAddress(stop.address, token);
          return {
            ...stop,
            ...geocoded,
          } as GeocodedStop;
        })
      );

      const furthestStop = geocodedStops.reduce((furthest, current) => {
        const furthestDistance = calculateDistance(
          liveLocation[1],
          liveLocation[0],
          furthest.coordinates[1],
          furthest.coordinates[0]
        );
        const currentDistance = calculateDistance(
          liveLocation[1],
          liveLocation[0],
          current.coordinates[1],
          current.coordinates[0]
        );
        return currentDistance > furthestDistance ? current : furthest;
      }, geocodedStops[0]);

      const intermediateStops = geocodedStops.filter((stop) => stop.id !== furthestStop.id);
      const inputOrderedStops = [...intermediateStops, furthestStop];
      const coordinatesParam = [liveLocation, ...inputOrderedStops.map((stop) => stop.coordinates)]
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(';');

      const routeResponse = await fetch(
        `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinatesParam}?source=first&destination=last&roundtrip=false&geometries=geojson&overview=full&steps=true&access_token=${token}`
      );
      const routeData = (await routeResponse.json()) as OptimizedTripResponse;

      if (!routeResponse.ok || routeData.code !== 'Ok' || !routeData.trips?.length) {
        throw new Error(routeData.message || 'Could not calculate the driving route.');
      }

      const routeTrip = routeData.trips[0];
      if (routeTrip.geometry.type !== 'LineString' || routeTrip.geometry.coordinates.length === 0) {
        throw new Error('Mapbox did not return a valid route line.');
      }

      if (!map.current) return;
      map.current.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: routeTrip.geometry,
        },
      });

      map.current.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563EB',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });

      const waypointEntries = (routeData.waypoints ?? [])
        .map((waypoint, inputIndex) => ({ waypoint, inputIndex }))
        .filter((entry) => entry.inputIndex > 0);

      const orderedStops =
        waypointEntries.length === inputOrderedStops.length
          ? waypointEntries
              .sort((a, b) => (a.waypoint.waypoint_index ?? 0) - (b.waypoint.waypoint_index ?? 0))
              .map((entry) => {
                const baseStop = inputOrderedStops[entry.inputIndex - 1];
                const snappedCoordinates =
                  entry.waypoint.location && entry.waypoint.location.length === 2
                    ? [entry.waypoint.location[0], entry.waypoint.location[1]]
                    : baseStop.coordinates;

                return {
                  ...baseStop,
                  coordinates: snappedCoordinates as [number, number],
                };
              })
          : inputOrderedStops;

      const generatedMarkers: mapboxgl.Marker[] = [];

      generatedMarkers.push(
        new mapboxgl.Marker({ color: '#16A34A' })
          .setLngLat(liveLocation)
          .setPopup(new mapboxgl.Popup({ offset: 24 }).setText('Start: your live location'))
          .addTo(map.current)
      );

      orderedStops.forEach((stop, index) => {
        const isFurthestStop = stop.id === furthestStop.id;
        generatedMarkers.push(
          new mapboxgl.Marker({ color: isFurthestStop ? '#DC2626' : '#3B82F6' })
            .setLngLat(stop.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 24 }).setText(
                `${index + 1}. ${stop.placeName}${isFurthestStop ? ' (furthest stop)' : ''}`
              )
            )
            .addTo(map.current!)
        );
      });

      routeMarkersRef.current = generatedMarkers;

      const firstCoordinate = routeTrip.geometry.coordinates[0];
      const bounds = new mapboxgl.LngLatBounds(firstCoordinate, firstCoordinate);
      routeTrip.geometry.coordinates.forEach((coordinate) => bounds.extend(coordinate));
      map.current.fitBounds(bounds, {
        padding: 80,
        duration: 1200,
      });

      setRouteSummary({
        distanceMiles: routeTrip.distance / 1609.344,
        durationMinutes: routeTrip.duration / 60,
        furthestStop: furthestStop.placeName,
        orderedStops: orderedStops.map(
          (stop, index) => `${index + 1}. ${stop.placeName}${stop.id === furthestStop.id ? ' (furthest)' : ''}`
        ),
      });
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Failed to calculate route.');
    } finally {
      setRouteLoading(false);
    }
  }, [
    clearRouteVisuals,
    routeStops,
    geocodeAddress,
    getLiveLocation,
    calculateDistance,
  ]);

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
    (nextTown: TownSelection) => {
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
    },
    [resetRoundState, setTown]
  );

  // Load roads when town changes (includes stored town from homepage)
  useEffect(() => {
    void loadRoadsForTown(town);
  }, [loadRoadsForTown, town]);

  // On first load, try to detect the user's current UK town and switch to it.
  useEffect(() => {
    let cancelled = false;
    // If the user already picked a town (homepage/map-test), don't override it here.
    if (hasStoredTown) return;
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

          applyTown(detectedTown);
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
  }, [applyTown, hasStoredTown]);

  // Draw line between two points
  const drawLine = useCallback((start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    // Remove previous line if it exists
    removeLayerAndSource(QUIZ_LINE_ID, QUIZ_LINE_ID);

    // Add line source
    map.current.addSource(QUIZ_LINE_ID, {
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
      id: QUIZ_LINE_ID,
      type: 'line',
      source: QUIZ_LINE_ID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#888',
        'line-width': 3
      }
    });
  }, [removeLayerAndSource]);

  // Handle map click
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (mapMode !== 'quiz' || !map.current || !selectedRoad) return;

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
  }, [selectedRoad, userMarker, actualMarker, calculateDistance, drawLine, town.label, mapMode]);

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

        applyTown(nextTown);
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

  useEffect(() => {
    if (mapMode === 'quiz') {
      clearRouteVisuals();
      setRouteSummary(null);
      setRouteError('');
    }
  }, [mapMode, clearRouteVisuals]);

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
              {mapMode === 'quiz' ? `Find: ${selectedRoad}` : 'Route Calculator'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setMapMode('quiz')}
              className={`font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${
                mapMode === 'quiz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              Quiz Mode
            </button>
            <button
              onClick={() => setMapMode('route')}
              className={`font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${
                mapMode === 'route'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
              }`}
            >
              Route Mode
            </button>

            <button
              onClick={() => setShowRoadNames(!showRoadNames)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {showRoadNames ? 'Hide Road Names' : 'Show Road Names'}
            </button>

            {mapMode === 'quiz' && (
              <button
                onClick={getNewRoad}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                disabled={roads.length === 0}
                title={roads.length === 0 ? 'No roads loaded for this town yet' : 'Pick a new road'}
              >
                🎲 New Road
              </button>
            )}

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
        {mapMode === 'quiz' && distance !== null && (
          <p className="text-center text-lg text-gray-600 mt-2">
            Distance: {distance.toFixed(2)} miles
          </p>
        )}

        {mapMode === 'route' && (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">
              Driving Route from Your Live Location
            </h2>
            <p className="text-sm text-indigo-800 mb-3">
              Add addresses, then calculate the quickest route. The route will start from your live
              location, place markers for every address, and finish at the furthest stop.
            </p>

            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
              <form
                className="flex items-center gap-2 w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRouteStop();
                }}
              >
                <input
                  value={routeAddressInput}
                  onChange={(e) => setRouteAddressInput(e.target.value)}
                  placeholder={`Add an address in or near ${town.label}…`}
                  className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60"
                  disabled={routeAddressInput.trim().length === 0 || routeStops.length >= MAX_ROUTE_STOPS}
                >
                  Add
                </button>
              </form>

              <button
                onClick={() => void calculateDrivingRoute()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60"
                disabled={routeLoading || routeStops.length === 0}
              >
                {routeLoading ? 'Calculating…' : 'Calculate Quickest Route'}
              </button>

              <button
                onClick={clearRoutePlanner}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Clear
              </button>
            </div>

            <div className="text-xs text-indigo-700 mb-2">
              Stops added: {routeStops.length} / {MAX_ROUTE_STOPS}
            </div>

            {routeStops.length > 0 && (
              <ul className="space-y-2 mb-3">
                {routeStops.map((stop, index) => (
                  <li
                    key={stop.id}
                    className="flex items-center justify-between bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-gray-800">
                      {index + 1}. {stop.address}
                    </span>
                    <button
                      onClick={() => removeRouteStop(stop.id)}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {routeError && <div className="text-sm text-red-600 mb-2">{routeError}</div>}

            {routeSummary && (
              <div className="bg-white border border-indigo-100 rounded-lg p-3 text-sm text-gray-800">
                <div className="font-semibold text-indigo-900 mb-1">Route summary</div>
                <div>Total distance: {routeSummary.distanceMiles.toFixed(1)} miles</div>
                <div>Total driving time: {formatDuration(routeSummary.durationMinutes)}</div>
                <div className="mt-1">Furthest stop: {routeSummary.furthestStop}</div>
                <div className="mt-2">
                  <div className="font-medium">Optimized stop order:</div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {routeSummary.orderedStops.map((stop, index) => (
                      <li key={`${stop}-${index}`}>{stop}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md max-w-xs">
          {mapMode === 'quiz' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                Add addresses above, then calculate the quickest driving route.
              </p>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span>Live start location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Address stops</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>Furthest stop (route end)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
