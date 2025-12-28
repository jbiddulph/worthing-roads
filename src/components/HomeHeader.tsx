'use client';

import Link from 'next/link';
import { useTown } from './TownProvider';

export default function HomeHeader() {
  const { town } = useTown();
  return (
    <div className="max-w-4xl mx-auto mb-6">
      <Link
        href="/map-test"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 text-center w-full sm:w-auto"
      >
        🗺️ Take the Map Test - Find Roads in {town.label}!
      </Link>
    </div>
  );
}

