import QuizSelector from '@/components/QuizSelector';
import HomeTownControls from '@/components/HomeTownControls';
import HomeHeader from '@/components/HomeHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <HomeTownControls />
      <HomeHeader />
      
      <QuizSelector />
    </div>
  );
}
