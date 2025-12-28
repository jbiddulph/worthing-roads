'use client';

import { useState } from 'react';
import RoadQuiz from './RoadQuiz';
import RoadQuizPart2 from './RoadQuizPart2';
import RoadQuizPart3 from './RoadQuizPart3';
import RoadQuizPart4 from './RoadQuizPart4';
import RoadQuizPart5 from './RoadQuizPart5';
import RoadQuizPart6 from './RoadQuizPart6';
import RoadQuizPart7 from './RoadQuizPart7';
import POIQuiz from './POIQuiz';
import { useTown } from './TownProvider';

export default function QuizSelector() {
  const [selectedQuiz, setSelectedQuiz] = useState<'none' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'part6' | 'part7' | 'poi'>('none');
  const { town } = useTown();
  const poiEnabled = town.label.trim().toLowerCase() === 'worthing';

  if (selectedQuiz === 'part1') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuiz />
      </div>
    );
  }

  if (selectedQuiz === 'part2') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart2 />
      </div>
    );
  }

  if (selectedQuiz === 'part3') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart3 />
      </div>
    );
  }

  if (selectedQuiz === 'part4') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart4 />
      </div>
    );
  }

  if (selectedQuiz === 'part5') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart5 />
      </div>
    );
  }

  if (selectedQuiz === 'part6') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart6 />
      </div>
    );
  }

  if (selectedQuiz === 'part7') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <RoadQuizPart7 />
      </div>
    );
  }

  if (selectedQuiz === 'poi') {
    return (
      <div>
        <div className="mb-6 text-center">
          <button 
            onClick={() => setSelectedQuiz('none')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            ← Back to Quiz Selection
          </button>
        </div>
        <POIQuiz />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-3 text-gray-800">{town.label} Roads Knowledge Quiz</h1>
      <p className="text-center text-sm text-gray-500 mb-8">
        Town selection comes from the homepage search / your location / the map test page.
      </p>
      
      <div className="text-center mb-8">
                  <p className="text-lg text-gray-600 mb-4">
            Test your knowledge of {town.label}&apos;s road network! Choose a quiz part to get started.
          </p>
        <p className="text-sm text-gray-500">
          Each part contains a unique slice of junction questions for {town.label}.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer bg-blue-50 hover:bg-blue-100" onClick={() => setSelectedQuiz('part1')}>
          <h2 className="text-2xl font-bold text-blue-800 mb-3">Part 1</h2>
          <p className="text-gray-700 mb-4">
            The original road knowledge quiz with questions about main roads and their junctions.
          </p>
          <div className="text-sm text-blue-600 font-medium">
            • 100+ questions available<br/>
            • Test your basic road knowledge<br/>
          </div>
          <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 1
          </button>
        </div>

        <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-400 transition-colors cursor-pointer bg-green-50 hover:bg-green-100" onClick={() => setSelectedQuiz('part2')}>
          <h2 className="text-2xl font-bold text-green-800 mb-3">Part 2</h2>
          <p className="text-gray-700 mb-4">
            Additional questions about {town.label}&apos;s road network.
          </p>
          <div className="text-sm text-green-600 font-medium">
            • 57 new questions<br/>
            • Challenge your road expertise<br/>
          </div>
          <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 2
          </button>
        </div>

        <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors cursor-pointer bg-purple-50 hover:bg-purple-100" onClick={() => setSelectedQuiz('part3')}>
          <h2 className="text-2xl font-bold text-purple-800 mb-3">Part 3</h2>
          <p className="text-gray-700 mb-4">
            More road junction questions for {town.label}.
          </p>
          <div className="text-sm text-purple-600 font-medium">
            • More questions<br/>
            • Different junction slice<br/>
          </div>
          <button className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 3
          </button>
        </div>

        <div className="border-2 border-orange-200 rounded-lg p-6 hover:border-orange-400 transition-colors cursor-pointer bg-orange-50 hover:bg-orange-100" onClick={() => setSelectedQuiz('part4')}>
          <h2 className="text-2xl font-bold text-orange-800 mb-3">Part 4</h2>
          <p className="text-gray-700 mb-4">
            Additional road junction questions with unique road combinations.
          </p>
          <div className="text-sm text-orange-600 font-medium">
            • 43 new questions<br/>
            • Unique road combinations<br/>
          </div>
          <button className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 4
          </button>
        </div>

        <div className="border-2 border-teal-200 rounded-lg p-6 hover:border-teal-400 transition-colors cursor-pointer bg-teal-50 hover:bg-teal-100" onClick={() => setSelectedQuiz('part5')}>
          <h2 className="text-2xl font-bold text-teal-800 mb-3">Part 5</h2>
          <p className="text-gray-700 mb-4">
            More road junction challenges for {town.label}.
          </p>
          <div className="text-sm text-teal-600 font-medium">
            • More questions<br/>
            • Different junction slice<br/>
          </div>
          <button className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 5
          </button>
        </div>

        <div className="border-2 border-indigo-200 rounded-lg p-6 hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50 hover:bg-indigo-100" onClick={() => setSelectedQuiz('part6')}>
          <h2 className="text-2xl font-bold text-indigo-800 mb-3">Part 6</h2>
          <p className="text-gray-700 mb-4">
            More road junction questions for {town.label}.
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            • More questions<br/>
            • Different junction slice<br/>
          </div>
          <button className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 6
          </button>
        </div>

        <div className="border-2 border-pink-200 rounded-lg p-6 hover:border-pink-400 transition-colors cursor-pointer bg-pink-50 hover:bg-pink-100" onClick={() => setSelectedQuiz('part7')}>
          <h2 className="text-2xl font-bold text-pink-800 mb-3">Part 7</h2>
          <p className="text-gray-700 mb-4">
            More road junction questions for {town.label}.
          </p>
          <div className="text-sm text-pink-600 font-medium">
            • More questions<br/>
            • Different junction slice<br/>
          </div>
          <button className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 7
          </button>
        </div>

        <div
          className={`border-2 rounded-lg p-6 transition-colors cursor-pointer ${
            poiEnabled
              ? 'border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          }`}
          onClick={() => {
            if (poiEnabled) setSelectedQuiz('poi');
          }}
          title={poiEnabled ? 'Start POI quiz' : 'POI quiz currently only available for Worthing'}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">POI Quiz</h2>
          <p className="text-gray-700 mb-4">
            Test your knowledge of where {town.label}&apos;s Points of Interest are located.
          </p>
          <div className="text-sm text-gray-600 font-medium">
            {poiEnabled ? (
              <>
                • 67 POI questions<br />
                • Road location knowledge<br />
              </>
            ) : (
              <>
                • Available for Worthing only (for now)<br />
                • Switch town to Worthing to play<br />
              </>
            )}
          </div>
          <button
            className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60"
            disabled={!poiEnabled}
          >
            Start POI Quiz
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All quiz parts include timing, scoring, and confetti celebrations!</p>
      </div>
    </div>
  );
}
