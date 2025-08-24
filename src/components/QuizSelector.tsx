'use client';

import { useState } from 'react';
import RoadQuiz from './RoadQuiz';
import RoadQuizPart2 from './RoadQuizPart2';
import RoadQuizPart3 from './RoadQuizPart3';
import RoadQuizPart4 from './RoadQuizPart4';
import RoadQuizPart5 from './RoadQuizPart5';
import RoadQuizPart6 from './RoadQuizPart6';

export default function QuizSelector() {
  const [selectedQuiz, setSelectedQuiz] = useState<'none' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'part6'>('none');

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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Worthing Roads Knowledge Quiz</h1>
      
      <div className="text-center mb-8">
                  <p className="text-lg text-gray-600 mb-4">
            Test your knowledge of Worthing&apos;s road network! Choose a quiz part to get started.
          </p>
        <p className="text-sm text-gray-500">
          Each part contains unique questions about road junctions in Worthing.
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
            Additional questions about Worthing&apos;s road network.
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
            More road junction questions with additional Worthing roads.
          </p>
          <div className="text-sm text-purple-600 font-medium">
            • 100+ new questions<br/>
            • Mainly Durrington area (canada and australia)<br/>
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
            More road junction challenges from the Findon area.
          </p>
          <div className="text-sm text-teal-600 font-medium">
            • 50 new questions<br/>
            • More roads<br/>
          </div>
          <button className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 5
          </button>
        </div>

        {/* <div className="border-2 border-indigo-200 rounded-lg p-6 hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50 hover:bg-indigo-100" onClick={() => setSelectedQuiz('part6')}>
          <h2 className="text-2xl font-bold text-indigo-800 mb-3">Part 6</h2>
          <p className="text-gray-700 mb-4">
            European-themed road junction questions.
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            • 100 new questions<br/>
            • European city themes<br/>
          </div>
          <button className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Start Part 6
          </button>
        </div> */}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All five quiz parts include timing, scoring, and confetti celebrations!</p>
      </div>
    </div>
  );
}
