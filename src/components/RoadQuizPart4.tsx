'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import mapboxgl from 'mapbox-gl';

interface RoadQuestion {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

interface RoadMapProps {
  roadName: string;
  mainRoad: string;
  isVisible: boolean;
}

// Road Map Component
function RoadMap({ roadName, mainRoad, isVisible }: RoadMapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapExists, setMapExists] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    console.log('RoadMap render:', { isVisible, roadName, loading, error, mapExists, mainRoad });
    
    if (!isVisible || !roadName) {
      console.log('RoadMap: Not visible or no road name, skipping');
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('Mapbox token not found');
      return;
    }

    // Initialize map if it doesn't exist
    if (!map.current) {
      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-0.3719, 50.8179], // Worthing, UK
        zoom: 14
      });

      map.current.on('load', () => {
        console.log('Map loaded');
        setMapExists(true);
        setLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Map error occurred');
      });
    }

    // Clear existing markers and sources
    if (map.current && mapExists) {
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());

      // Remove existing sources and layers
      if (map.current.getSource('road-highlight')) {
        map.current.removeLayer('road-highlight');
        map.current.removeSource('road-highlight');
      }
    }

    // Wait for map to be ready
    if (!map.current || !mapExists) {
      return;
    }

    // Add blue marker for the correct answer road
    const cleanRoadName = roadName.replace(/\s+/g, ' ').trim();
    const searchQuery = `${cleanRoadName}, Worthing, UK`;

    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&country=GB&types=address&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;

          // Fly to the location
          map.current!.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 2000
          });

          // Add blue marker
          new mapboxgl.Marker({
            color: '#3B82F6', // Blue color
            scale: 1.0
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          console.log('Blue marker added at:', [lng, lat]);

          // Get road geometry from Mapbox Directions API
          fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${lng},${lat};${lng + 0.001},${lat + 0.001}?geometries=geojson&access_token=${token}`)
            .then(res => res.json())
            .then(directionsData => {
              if (directionsData.routes && directionsData.routes.length > 0) {
                const route = directionsData.routes[0];

                // Add road highlighting
                if (map.current!.getSource('road-highlight')) {
                  map.current!.removeLayer('road-highlight');
                  map.current!.removeSource('road-highlight');
                }

                map.current!.addSource('road-highlight', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: route.geometry
                  }
                });

                map.current!.addLayer({
                  id: 'road-highlight',
                  type: 'line',
                  source: 'road-highlight',
                  layout: {},
                  paint: {
                    'line-color': '#3B82F6',
                    'line-width': 4
                  }
                });

                console.log('Road highlighting added');
              }
            })
            .catch(err => console.log('Error getting road geometry:', err));
        }
      })
      .catch(err => {
        console.error('Error geocoding road:', err);
        setError('Error finding road location');
      });

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

  }, [isVisible, roadName, mapExists, mainRoad]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Road Map</h3>
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        {loading && (
          <div className="text-gray-500 mb-4">Loading map...</div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg"
          style={{ minHeight: '384px' }}
        />
      </div>
    </div>
  );
}

export default function RoadQuizPart4() {
  const [questions, setQuestions] = useState<RoadQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correctRoadName, setCorrectRoadName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Load roads data
        const roadsResponse = await fetch('/roads.json');
        const roadsData = await roadsResponse.json();
        const roadNames = new Set(roadsData.map((road: { road_name: string }) => road.road_name));

        // Load junctions data
        const junctionsResponse = await fetch('/junctions_part4.json');
        const junctionsData = await junctionsResponse.json();
        const entries = Object.entries(junctionsData);

        // Helper function to get distractors
        const getDistractors = (mainRoad: string, correct: string, count: number) => {
          const allSmallerRoads = new Set<string>();
          
          // Collect all smaller roads from all main roads
          entries.forEach(([, smallerRoadList]) => {
            if (Array.isArray(smallerRoadList)) {
              (smallerRoadList as string[]).forEach(road => allSmallerRoads.add(road));
            }
          });

          // Remove the correct answer and the main road
          allSmallerRoads.delete(correct);
          allSmallerRoads.delete(mainRoad);

          // Convert to array and shuffle
          const allRoadsArray = Array.from(allSmallerRoads);
          for (let i = allRoadsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allRoadsArray[i], allRoadsArray[j]] = [allRoadsArray[j], allRoadsArray[i]];
          }

          return allRoadsArray.slice(0, count);
        };

        const built: RoadQuestion[] = [];
        let id = 1;
        for (const [mainRoad, smallerRoadList] of entries) {
          // pick one correct smaller road from the curated list that exists in roads
          const validSmallerRoads = (smallerRoadList as string[]).filter((s: string) => roadNames.has(s));
          if (validSmallerRoads.length === 0) continue;
          const correct = validSmallerRoads[Math.floor(Math.random() * validSmallerRoads.length)];

          // pick 3 distractors - these should be other smaller roads that could junction off the main road
          const distractors = getDistractors(mainRoad, correct, 3);
          if (distractors.length < 3) continue;

          // combine and shuffle options
          const optionsArray = [correct, ...distractors];
          for (let i = optionsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
          }

          const keyMap: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
          const correctIndex = optionsArray.indexOf(correct);
          const correctKey = keyMap[correctIndex];

          built.push({
            id: id++,
            question: `Which of these forms a junction with ${mainRoad}?`,
            options: { a: optionsArray[0], b: optionsArray[1], c: optionsArray[2], d: optionsArray[3] },
            correctAnswer: correctKey,
            explanation: `${correct} junctions off ${mainRoad}.`
          });
        }

        // Shuffle questions and use all available questions
        for (let i = built.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [built[i], built[j]] = [built[j], built[i]];
        }

        console.log(`Generated ${built.length} questions from ${entries.length} junction entries for Part 4`);
        setQuestions(built);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Trigger confetti when quiz is completed
  useEffect(() => {
    if (quizComplete) {
      // Create a festive confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Add some delayed confetti for extra celebration
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.8 }
        });
      }, 500);
      
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.4 }
        });
      }, 1000);
    }
  }, [quizComplete]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">Loading Road Quiz Part 4…</div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
        <p className="text-gray-800">There are no questions available for this quiz part.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: 'a' | 'b' | 'c' | 'd') => {
    if (selectedAnswer !== null) return; // Prevent multiple selections

    setSelectedAnswer(answer);
    const isAnswerCorrect = answer === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setScore(score + 1);
      setCorrectRoadName(currentQuestion.options[answer]);
    } else {
      setCorrectRoadName(currentQuestion.options[currentQuestion.correctAnswer]);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCorrectRoadName('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setQuizComplete(false);
    setCorrectRoadName('');
  };

  if (quizComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Quiz Complete! 🎉</h2>
        <p className="text-xl mb-4">
          Your final score: <span className="font-bold text-blue-600">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>
        <p className="text-lg mb-6">
          Percentage: <span className="font-bold text-purple-600">{Math.round((score / questions.length) * 100)}%</span>
        </p>
        <button
          onClick={handleRestart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Road Quiz Part 4</h1>
        <p className="text-center text-gray-800 mb-4">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-800 mt-2">
          <span>Score: {score}</span>
          <span>{Math.round((score / questions.length) * 100)}%</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{currentQuestion.question}</h2>
        <div className="space-y-3">
          {(['a', 'b', 'c', 'd'] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === null
                  ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  : selectedAnswer === option
                  ? isCorrect
                    ? 'border-green-500 bg-green-100'
                    : 'border-red-500 bg-red-100'
                  : option === currentQuestion.correctAnswer
                  ? 'border-green-500 bg-green-100'
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              <span className="font-semibold mr-2 text-gray-800">{option.toUpperCase()}.</span>
              <span className="text-gray-800">{currentQuestion.options[option]}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedAnswer && (
        <div className={`p-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
          </h3>
          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
            {currentQuestion.explanation}
          </p>
          <button
            onClick={handleNextQuestion}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      )}

      {/* Road Map Component - Only render when we have a road name and answer is selected */}
      {correctRoadName && (
        <RoadMap 
          roadName={correctRoadName} 
          mainRoad={currentQuestion.question.match(/with (.+?)\?/)?.[1] || ''}
          isVisible={!!selectedAnswer} 
        />
      )}
    </div>
  );
}
