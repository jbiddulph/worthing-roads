'use client';

import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import RoadMap from './RoadMap';
import { getTownBbox } from '@/lib/town';
import { useTown } from './TownProvider';

type Road = { road_name: string };
type JunctionMap = Record<string, string[]>;

type RoadQuestion = {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
};

function fnv1a(str: string) {
  // 32-bit FNV-1a
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // unsigned
  return h >>> 0;
}

function bucketForPart(name: string, parts: number) {
  return (fnv1a(name.toLowerCase()) % parts) + 1;
}

export default function RoadQuizDynamic({ part }: { part: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  const { town } = useTown();
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
  const [correctRoadName, setCorrectRoadName] = useState<string>('');

  const bboxParam = useMemo(() => {
    const bbox = getTownBbox(town);
    return `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  }, [town]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setFeedback('');
      setShowFeedback(false);
      setQuizComplete(false);
      setUserAnswers([]);
      setQuestionsAnswered(0);
      setStartTime(null);
      setEndTime(null);
      setCorrectRoadName('');

      try {
        const res = await fetch(`/api/town-junctions?bbox=${encodeURIComponent(bboxParam)}`);
        const json = (await res.json()) as
          | { roads?: Road[]; junctions?: JunctionMap; error?: string }
          | { error: string };

        if (!res.ok) throw new Error('error' in json ? json.error : 'Failed to load junctions');

        const roadsData = (json as { roads?: Road[] }).roads ?? [];
        const junctions = (json as { junctions?: JunctionMap }).junctions ?? {};

        const roadNames = new Set<string>(roadsData.map((r) => r.road_name));
        const entriesAll = Object.entries(junctions).filter(([main, list]) => {
          if (!roadNames.has(main)) return false;
          return list.some((j) => roadNames.has(j));
        });

        const PARTS = 7;
        const entriesBucketed = entriesAll.filter(([main]) => bucketForPart(main, PARTS) === part);
        const entries = entriesBucketed.length >= 10 ? entriesBucketed : entriesAll;

        const allRoadsArray = Array.from(roadNames);
        const COMMON_WORDS = new Set([
          'road',
          'street',
          'avenue',
          'close',
          'drive',
          'lane',
          'place',
          'court',
          'crescent',
          'terrace',
          'walk',
          'mews',
          'gardens',
          'way',
          'green',
          'park',
          'mount',
          'hill',
          'vale',
          'view',
          'roundabout',
        ]);
        const tokenize = (name: string) =>
          name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2 && !COMMON_WORDS.has(t));

        const getDistractors = (main: string, correct: string, count: number) => {
          const keyTokens = new Set([...tokenize(main), ...tokenize(correct)]);
          const nearbyPool = allRoadsArray.filter((name) => {
            if (name === main || name === correct) return false;
            return tokenize(name).some((t) => keyTokens.has(t));
          });
          const fallbackPool = allRoadsArray.filter((name) => name !== main && name !== correct);

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
            fallbackPool.filter((n) => !prioritized.includes(n)),
            remaining
          );
          return [...prioritized, ...fallback];
        };

        const built: RoadQuestion[] = [];
        let id = 1;
        for (const [mainRoad, smallerRoadList] of entries) {
          const validSmallerRoads = smallerRoadList.filter((s) => roadNames.has(s));
          if (validSmallerRoads.length === 0) continue;
          const correct = validSmallerRoads[Math.floor(Math.random() * validSmallerRoads.length)];

          const distractors = getDistractors(mainRoad, correct, 3);
          if (distractors.length < 3) continue;

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
            explanation: `${correct} forms a junction with ${mainRoad}.`,
          });
        }

        for (let i = built.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [built[i], built[j]] = [built[j], built[i]];
        }

        setQuestions(built);
      } catch (e) {
        console.error(e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [bboxParam, part]);

  useEffect(() => {
    if (!quizComplete) return;
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } }), 500);
    setTimeout(() => confetti({ particleCount: 75, spread: 60, origin: { y: 0.4 } }), 1000);
  }, [quizComplete]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        Loading Road Quiz Part {part} for {town.label}…
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        No questions available for {town.label}. Try searching a different town or zooming in on the map test.
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    if (!startTime) setStartTime(new Date());

    setSelectedAnswer(answer);
    setShowFeedback(true);
    setFeedback(answer === currentQuestion.correctAnswer ? 'Correct answer!' : 'Wrong answer!');

    const correctAnswerKey = currentQuestion.correctAnswer;
    const correctRoad = currentQuestion.options[correctAnswerKey];
    setCorrectRoadName(correctRoad);

    setQuestionsAnswered((prev) => prev + 1);
    setUserAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = answer;
      return next;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedAnswer(null);
      setFeedback('');
      setShowFeedback(false);
      setCorrectRoadName('');
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
    setCorrectRoadName('');
  };

  if (quizComplete) {
    const score = userAnswers.filter((a, idx) => a === questions[idx].correctAnswer).length;
    const timeElapsed = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;
    const minutes = Math.floor(timeElapsed / 60000);
    const seconds = Math.floor((timeElapsed % 60000) / 1000);

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Road Knowledge Quiz Part {part} ({town.label}) Complete!
        </h2>
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 mb-2">Total questions answered: {questionsAnswered}</p>
          <p className="text-lg text-gray-600 mb-2">
            Score: {score} out of {questions.length}
          </p>
          <p className="text-lg text-gray-600">
            Time taken: {minutes}m {seconds}s
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={handleRestartQuiz}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Part {part}: Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Answered: {questionsAnswered}
            </span>
            {startTime && (
              <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                Time: {Math.floor((new Date().getTime() - startTime.getTime()) / 60000)}m{' '}
                {Math.floor(((new Date().getTime() - startTime.getTime()) % 60000) / 1000)}s
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
        <p className="text-lg text-gray-700 mb-2">{currentQuestion.question}</p>
        <p className="text-sm text-gray-500">Town: {town.label}</p>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(currentQuestion.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleAnswerSelect(key)}
            disabled={selectedAnswer !== null}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === key
                ? key === currentQuestion.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${selectedAnswer !== null ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="font-semibold text-gray-700">{key.toUpperCase()}. </span>
            <span className="text-gray-600">{value}</span>
          </button>
        ))}
      </div>

      {showFeedback && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            feedback === 'Correct answer!' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}
        >
          <p className={`font-semibold ${feedback === 'Correct answer!' ? 'text-green-800' : 'text-red-800'}`}>
            {feedback}
          </p>
        </div>
      )}

      {correctRoadName && (
        <RoadMap
          roadName={correctRoadName}
          mainRoad={currentQuestion.question.match(/with (.+?)\?/)?.[1] || ''}
          isVisible={!!selectedAnswer}
          townLabel={town.label}
          townCenter={town.center}
        />
      )}

      {selectedAnswer && (
        <div className="text-center">
          <button
            onClick={handleNextQuestion}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

