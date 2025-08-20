'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Road { road_name: string }
interface RoadQuestion {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

type JunctionMap = Record<string, string[]>;

export default function RoadQuizPart2() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<RoadQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [roadsRes, junctionsRes] = await Promise.all([
          fetch('/roads.json'),
          fetch('/junctions_part2.json')
        ]);
        const roadsData: Road[] = await roadsRes.json();
        const junctions: JunctionMap = await junctionsRes.json();

        const roadNames = new Set(roadsData.map(r => r.road_name));

        // Build questions from curated junction map; only include entries present in roads list
        const entries = Object.entries(junctions).filter(([main, junctionList]) => {
          return roadNames.has(main) && junctionList.some(j => roadNames.has(j));
        });

        // Helper to get plausible nearby distractors (real roads, not the correct, not main)
        const allRoadsArray = Array.from(roadNames);
        const COMMON_WORDS = new Set([
          'road','street','avenue','close','drive','lane','place','court','crescent','terrace','walk','mews','gardens','way','green','park','mount','hill','vale','view','roundabout'
        ]);
        const tokenize = (name: string) => name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(t => t.length > 2 && !COMMON_WORDS.has(t));

        const getDistractors = (main: string, correct: string, count: number) => {
          const mainTokens = tokenize(main);
          const correctTokens = tokenize(correct);
          const keyTokens = new Set([...mainTokens, ...correctTokens]);

          // Prefer roads sharing at least one meaningful token with main/correct
          const nearbyPool = allRoadsArray.filter(name => {
            if (name === main || name === correct) return false;
            const tokens = tokenize(name);
            return tokens.some(t => keyTokens.has(t));
          });

          // Fallback broader pool if not enough
          const fallbackPool = allRoadsArray.filter(name => name !== main && name !== correct);

          const pickFrom = (arr: string[], needed: number) => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy.slice(0, needed);
          };

          const prioritized = pickFrom(nearbyPool, count);
          if (prioritized.length >= count) return prioritized;
          const remaining = count - prioritized.length;
          const fallback = pickFrom(
            fallbackPool.filter(n => !prioritized.includes(n)),
            remaining
          );
          return [...prioritized, ...fallback];
        };

        const built: RoadQuestion[] = [];
        let id = 1;
        for (const [mainRoad, smallerRoadList] of entries) {
          // pick one correct smaller road from the curated list that exists in roads
          const validSmallerRoads = smallerRoadList.filter(s => roadNames.has(s));
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
            question: `What road junctions off ${mainRoad}?`,
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

        console.log(`Generated ${built.length} questions from ${entries.length} junction entries for Part 2`);
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
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">Loading Road Quiz Part 2…</div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">No questions available for Part 2.</div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    
    // Start timer on first answer if not already started
    if (!startTime) {
      setStartTime(new Date());
    }
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    setFeedback(answer === currentQuestion.correctAnswer ? 'Correct answer!' : 'Wrong answer!');
    setQuestionsAnswered(prev => prev + 1);
    setUserAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIndex] = answer;
      return next;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setFeedback('');
      setShowFeedback(false);
    } else {
      setEndTime(new Date());
      setQuizComplete(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback('');
    setShowFeedback(false);
    setQuestionsAnswered(0);
    setQuizComplete(false);
    setUserAnswers([]);
    setStartTime(null);
    setEndTime(null);
  };

  if (quizComplete) {
    const score = userAnswers.filter((a, idx) => a === questions[idx].correctAnswer).length;
    const timeElapsed = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;
    const minutes = Math.floor(timeElapsed / 60000);
    const seconds = Math.floor((timeElapsed % 60000) / 1000);
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Road Knowledge Quiz Part 2 Complete!</h2>
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 mb-2">Total questions answered: {questionsAnswered}</p>
          <p className="text-lg text-gray-600 mb-2">Score: {score} out of {questions.length}</p>
          <p className="text-lg text-gray-600">Time taken: {minutes}m {seconds}s</p>
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Quiz Summary</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const user = userAnswers[idx];
              const isCorrect = user === q.correctAnswer;
              return (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Question {idx + 1}: {q.question}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {Object.entries(q.options).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${key === q.correctAnswer ? 'bg-green-500 text-white' : key === user && key !== q.correctAnswer ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{key.toUpperCase()}</span>
                        <span className={`${key === q.correctAnswer ? 'text-green-700 font-medium' : key === user && key !== q.correctAnswer ? 'text-red-700 font-medium' : 'text-gray-600'}`}>{value}</span>
                        {key === q.correctAnswer && (<span className="text-green-600 text-sm">✓ Correct Answer</span>)}
                        {key === user && key !== q.correctAnswer && (<span className="text-red-600 text-sm">✗ Your Answer</span>)}
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-sm text-blue-800"><span className="font-medium">Explanation:</span> {q.explanation}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-center">
          <button onClick={handleRestartQuiz} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Restart Quiz Part 2</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Answered: {questionsAnswered}</span>
            {startTime && (
              <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                Time: {Math.floor((new Date().getTime() - startTime.getTime()) / 60000)}m {Math.floor(((new Date().getTime() - startTime.getTime()) % 60000) / 1000)}s
              </span>
            )}
            <button
              onClick={handleRestartQuiz}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              Reset Quiz
            </button>
          </div>
        </div>
        <p className="text-lg text-gray-700 mb-6">{currentQuestion.question}</p>
      </div>
      <div className="space-y-3 mb-6">
        {Object.entries(currentQuestion.options).map(([key, value]) => (
          <button key={key} onClick={() => handleAnswerSelect(key)} disabled={selectedAnswer !== null} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswer === key ? key === currentQuestion.correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'} ${selectedAnswer !== null ? 'cursor-default' : 'cursor-pointer'}`}>
            <span className="font-semibold text-gray-700">{key.toUpperCase()}. </span>
            <span className="text-gray-600">{value}</span>
          </button>
        ))}
      </div>
      {showFeedback && (
        <div className={`p-4 rounded-lg mb-4 ${feedback === 'Correct answer!' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
          <p className={`font-semibold ${feedback === 'Correct answer!' ? 'text-green-800' : 'text-red-800'}`}>{feedback}</p>
        </div>
      )}
      {selectedAnswer && (
        <div className="text-center">
          <button onClick={handleNextQuestion} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</button>
        </div>
      )}
    </div>
  );
}
