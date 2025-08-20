'use client';

import { useState } from 'react';

// Quiz data - moved inline to avoid import issues
const quizData = {
  "questions": [
    {
      "id": 1,
      "question": "What is the capital of France?",
      "options": {
        "a": "London",
        "b": "Berlin",
        "c": "Paris",
        "d": "Madrid"
      },
      "correctAnswer": "c"
    },
    {
      "id": 2,
      "question": "Which planet is known as the Red Planet?",
      "options": {
        "a": "Venus",
        "b": "Mars",
        "c": "Jupiter",
        "d": "Saturn"
      },
      "correctAnswer": "b"
    },
    {
      "id": 3,
      "question": "What is the largest ocean on Earth?",
      "options": {
        "a": "Atlantic Ocean",
        "b": "Indian Ocean",
        "c": "Arctic Ocean",
        "d": "Pacific Ocean"
      },
      "correctAnswer": "d"
    },
    {
      "id": 4,
      "question": "Who painted the Mona Lisa?",
      "options": {
        "a": "Vincent van Gogh",
        "b": "Pablo Picasso",
        "c": "Leonardo da Vinci",
        "d": "Michelangelo"
      },
      "correctAnswer": "c"
    }
  ]
};

interface Question {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
}

interface QuizData {
  questions: Question[];
}

export default function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  const questions = (quizData as QuizData).questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple selections
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    if (answer === currentQuestion.correctAnswer) {
      setFeedback('Correct answer!');
    } else {
      setFeedback('Wrong answer!');
    }
    
    setQuestionsAnswered(prev => prev + 1);
    
    // Store the user's answer
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFeedback('');
      setShowFeedback(false);
    } else {
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
  };

  if (quizComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Quiz Complete!
        </h2>
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 mb-2">
            Total questions answered: {questionsAnswered}
          </p>
          <p className="text-lg text-gray-600">
            Score: {userAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length} out of {questions.length}
          </p>
        </div>
        
        {/* Questions and Answers Summary */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Quiz Summary</h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">
                      Question {index + 1}: {question.question}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          key === question.correctAnswer
                            ? 'bg-green-500 text-white'
                            : key === userAnswer && key !== question.correctAnswer
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {key.toUpperCase()}
                        </span>
                        <span className={`${
                          key === question.correctAnswer
                            ? 'text-green-700 font-medium'
                            : key === userAnswer && key !== question.correctAnswer
                            ? 'text-red-700 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {value}
                        </span>
                        {key === question.correctAnswer && (
                          <span className="text-green-600 text-sm">✓ Correct Answer</span>
                        )}
                        {key === userAnswer && key !== question.correctAnswer && (
                          <span className="text-red-600 text-sm">✗ Your Answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Answered: {questionsAnswered}
          </span>
        </div>
        
        <p className="text-lg text-gray-700 mb-6">
          {currentQuestion.question}
        </p>
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
        <div className={`p-4 rounded-lg mb-4 ${
          feedback === 'Correct answer!' 
            ? 'bg-green-100 border border-green-300' 
            : 'bg-red-100 border border-red-300'
        }`}>
          <p className={`font-semibold ${
            feedback === 'Correct answer!' ? 'text-green-800' : 'text-red-800'
          }`}>
            {feedback}
          </p>
        </div>
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
