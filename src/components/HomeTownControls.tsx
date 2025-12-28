'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTown } from './TownProvider';
import type { TownSelection } from '@/lib/town';

export default function HomeTownControls() {
  const { town, setTown, hasStoredTown } = useTown();
  const [townQuery, setTownQuery] = useState(town.label);
  const [townLoading, setTownLoading] = useState(false);
  const [townError, setTownError] = useState('');
  const [autoTownMessage, setAutoTownMessage] = useState('');

  const token = useMemo(() => process.env.NEXT_PUBLIC_MAPBOX_TOKEN, []);

  useEffect(() => {
    setTownQuery(town.label);
  }, [town.label]);

  const applyTown = useCallback(
    (nextTown: TownSelection) => {
      setTown(nextTown);
      setAutoTownMessage('');
      setTownError('');
    },
    [setTown]
  );

  const searchAndSetTown = useCallback(
    async (query: string) => {
      if (!token) {
        setTownError('Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).');
        return;
      }

      setTownLoading(true);
      setTownError('');
      setAutoTownMessage('');
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            `${query}, UK`
          )}.json?access_token=${token}&country=GB&types=place&limit=1`
        );
        const data = await res.json();
        const feature = data?.features?.[0];
        if (!feature?.center) throw new Error('Town not found. Try “Town, County” (e.g. “Rochdale”).');

        const nextTown: TownSelection = {
          label: feature.text || query,
          displayName: feature.place_name || query,
          center: feature.center as [number, number],
          bbox: (feature.bbox as [number, number, number, number] | undefined) ?? undefined,
        };
        applyTown(nextTown);
      } catch (e) {
        setTownError(e instanceof Error ? e.message : String(e));
      } finally {
        setTownLoading(false);
      }
    },
    [applyTown, token]
  );

  // On first homepage load, if no stored selection, try to use geolocation to pick a nearby UK town.
  useEffect(() => {
    let cancelled = false;
    if (hasStoredTown) return;
    if (!token) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setAutoTownMessage('Detecting your town…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;

          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=GB&types=place&limit=1`
          );
          const data = await res.json();
          const feature = data?.features?.[0];
          if (!feature?.center) {
            setAutoTownMessage('Could not detect a UK town — staying on default.');
            return;
          }

          const detectedTown: TownSelection = {
            label: feature.text || 'Your town',
            displayName: feature.place_name || feature.text || 'Your town',
            center: feature.center as [number, number],
            bbox: (feature.bbox as [number, number, number, number] | undefined) ?? undefined,
          };
          applyTown(detectedTown);
          setAutoTownMessage(`Using your town: ${detectedTown.label}`);
        } catch (e) {
          console.error(e);
          setAutoTownMessage('Could not detect your town — staying on default.');
        }
      },
      () => {
        if (cancelled) return;
        setAutoTownMessage('Location permission denied — staying on default.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );

    return () => {
      cancelled = true;
    };
  }, [applyTown, hasStoredTown, token]);

  const useMyLocation = useCallback(() => {
    if (!token) {
      setTownError('Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setTownError('Geolocation not available in this browser.');
      return;
    }

    setAutoTownMessage('Detecting your town…');
    setTownError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=GB&types=place&limit=1`
          );
          const data = await res.json();
          const feature = data?.features?.[0];
          if (!feature?.center) throw new Error('Could not detect a UK town.');

          const detectedTown: TownSelection = {
            label: feature.text || 'Your town',
            displayName: feature.place_name || feature.text || 'Your town',
            center: feature.center as [number, number],
            bbox: (feature.bbox as [number, number, number, number] | undefined) ?? undefined,
          };

          applyTown(detectedTown);
          setAutoTownMessage(`Using your town: ${detectedTown.label}`);
        } catch (e) {
          setTownError(e instanceof Error ? e.message : String(e));
        }
      },
      () => setTownError('Location permission denied.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  }, [applyTown, token]);

  return (
    <div className="max-w-4xl mx-auto mb-6 bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">Selected town</div>
          <div className="text-lg font-semibold text-gray-900">{town.label}</div>
          {town.displayName && <div className="text-xs text-gray-500">{town.displayName}</div>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={useMyLocation}
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            type="button"
          >
            Use my location
          </button>

          <form
            className="flex items-center gap-2 w-full sm:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              void searchAndSetTown(townQuery);
            }}
          >
            <input
              value={townQuery}
              onChange={(e) => setTownQuery(e.target.value)}
              placeholder="Search a UK town…"
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
              disabled={townLoading || townQuery.trim().length === 0}
            >
              {townLoading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {autoTownMessage && <div className="mt-2 text-xs text-gray-500">{autoTownMessage}</div>}
      {townError && <div className="mt-2 text-sm text-red-600">{townError}</div>}
      {!token && <div className="mt-2 text-sm text-amber-700">Mapbox token not configured — town search won’t work.</div>}
    </div>
  );
}

