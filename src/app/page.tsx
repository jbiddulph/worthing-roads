import QuizSelector from '@/components/QuizSelector';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Map Test Link */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link 
          href="/map-test"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center w-full sm:w-auto"
        >
          🗺️ Take the Map Test - Find Roads in Worthing!
        </Link>
      </div>
      
      <QuizSelector />
    </div>
  );
}
