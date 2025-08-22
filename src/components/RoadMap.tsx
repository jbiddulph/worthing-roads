'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RoadMapProps {
  roadName: string;
  mainRoad: string;
  isVisible: boolean;
}

export default function RoadMap({ roadName, mainRoad, isVisible }: RoadMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('RoadMap render:', { isVisible, roadName, mapExists: !!map.current });

  // Initialize map once
  useEffect(() => {
    console.log('Map init effect:', { hasContainer: !!mapContainer.current, hasMap: !!map.current });
    
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.log('No Mapbox token found');
      return;
    }

    console.log('Creating map...');
    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-0.3719, 50.8179],
      zoom: 13
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });
  }, []);

  // Update road when roadName changes
  useEffect(() => {
    console.log('Road update effect:', { hasMap: !!map.current, roadName, isVisible });
    
    if (!map.current || !roadName || !isVisible) return;

    setLoading(true);
    
    // Clear old markers first
    document.querySelectorAll('.mapboxgl-marker').forEach(m => m.remove());
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    console.log('Searching for road:', roadName);

    // Search for road
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(roadName + ', Worthing, UK')}.json?access_token=${token}&country=GB&types=address`)
      .then(res => res.json())
      .then(data => {
        console.log('Geocoding response:', data);
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          console.log('Found location:', [lng, lat]);
          
          // Add blue marker for the correct answer road (centered)
          new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([lng, lat])
            .addTo(map.current!);
          
          // Fly to location (centered on the correct answer)
          map.current!.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1500
          });
          
          // Add road highlighting for the correct answer road (blue)
          const cleanRoadName = roadName.replace(/\s+/g, ' ').trim();
          const searchRoadQuery = `${cleanRoadName}, Worthing, UK`;
          
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchRoadQuery)}.json?access_token=${token}&country=GB&types=address&limit=1`)
            .then(res => res.json())
            .then(roadData => {
              if (roadData.features && roadData.features.length > 0) {
                const roadFeature = roadData.features[0];
                
                // Get road geometry from Mapbox Directions API for highlighting
                fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${roadFeature.center[0]},${roadFeature.center[1]};${roadFeature.center[0] + 0.001},${roadFeature.center[1] + 0.001}?geometries=geojson&access_token=${token}`)
                  .then(res => res.json())
                  .then(directionsData => {
                    if (directionsData.routes && directionsData.routes.length > 0) {
                      const route = directionsData.routes[0];
                      
                      // Remove existing road highlighting
                      if (map.current!.getSource('highlighted-road')) {
                        map.current!.removeLayer('highlighted-road-layer');
                        map.current!.removeSource('highlighted-road');
                      }
                      
                      // Add the road source and layer with blue highlighting
                      map.current!.addSource('highlighted-road', {
                        type: 'geojson',
                        data: {
                          type: 'Feature',
                          properties: {},
                          geometry: route.geometry
                        }
                      });
                      
                      map.current!.addLayer({
                        id: 'highlighted-road-layer',
                        type: 'line',
                        source: 'highlighted-road',
                        layout: {
                          'line-join': 'round',
                          'line-cap': 'round'
                        },
                        paint: {
                          'line-color': '#3B82F6', // Solid blue
                          'line-width': 4, // 4px stroke
                          'line-opacity': 1.0 // Solid (no transparency)
                        }
                      });
                      
                      console.log('Road highlighting added (blue, 4px) for correct answer road');
                    }
                  })
                  .catch(err => console.log('Error getting road geometry:', err));
              }
            })
            .catch(err => console.log('Error highlighting road:', err));
          
          // Now add green marker on the main road from the question
          const cleanMainRoadName = mainRoad.replace(/\s+/g, ' ').trim();
          const searchMainRoadQuery = `${cleanMainRoadName}, Worthing, UK`;
          
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchMainRoadQuery)}.json?access_token=${token}&country=GB&types=address&limit=1`)
            .then(res => res.json())
            .then(mainRoadData => {
              if (mainRoadData.features && mainRoadData.features.length > 0) {
                const mainRoadFeature = mainRoadData.features[0];
                
                // Get road geometry from Mapbox Directions API for the main road
                fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${mainRoadFeature.center[0]},${mainRoadFeature.center[1]};${mainRoadFeature.center[0] + 0.001},${mainRoadFeature.center[1] + 0.001}?geometries=geojson&access_token=${token}`)
                  .then(res => res.json())
                  .then(mainRoadDirectionsData => {
                    if (mainRoadDirectionsData.routes && mainRoadDirectionsData.routes.length > 0) {
                      const mainRoadRoute = mainRoadDirectionsData.routes[0];
                      
                      // Add a smaller green marker on the main road from the question
                      if (mainRoadRoute.geometry.coordinates && mainRoadRoute.geometry.coordinates.length > 0) {
                        // Use the middle point of the main road for the green marker
                        const mainRoadMidPoint = mainRoadRoute.geometry.coordinates[Math.floor(mainRoadRoute.geometry.coordinates.length / 2)];
                        
                        new mapboxgl.Marker({ 
                          color: '#10B981', // Green color
                          scale: 0.7 // Smaller size (70% of normal marker size)
                        })
                          .setLngLat(mainRoadMidPoint)
                          .addTo(map.current!);
                        
                        console.log('Green marker added on main road (question road) at:', mainRoadMidPoint);
                      }
                    }
                  })
                  .catch(err => console.log('Error getting main road geometry:', err));
              }
            })
            .catch(err => console.log('Error highlighting main road:', err));
          
          console.log('Map updated successfully');
        } else {
          console.log('No location found for:', roadName);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error searching for road:', err);
        setLoading(false);
      });
  }, [roadName, mainRoad, isVisible]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (!isVisible) {
    console.log('Map not visible, returning null');
    return null;
  }

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

        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg border border-gray-300"
          style={{ height: '256px' }}
        />

        <p className="text-sm text-gray-600 mt-2">
          This map shows the approximate location of {roadName} in Worthing.
        </p>
      </div>
    </div>
  );
}