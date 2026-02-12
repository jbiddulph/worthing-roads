'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

function buildGoogleMapsDirectionsUrl(stops: string[]) {
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1);

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });

  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function RouteCalculationPage() {
  const [addresses, setAddresses] = useState<string[]>(['', '']);
  const [error, setError] = useState('');

  const filledAddresses = useMemo(
    () => addresses.map((item) => item.trim()).filter((item) => item.length > 0),
    [addresses]
  );

  const updateAddress = (index: number, value: string) => {
    setAddresses((previous) => previous.map((address, i) => (i === index ? value : address)));
  };

  const addAddress = () => {
    setAddresses((previous) => [...previous, '']);
  };

  const removeAddress = (index: number) => {
    setAddresses((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, i) => i !== index);
    });
  };

  const sendToGoogleMaps = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (filledAddresses.length < 2) {
      setError('Please enter at least two addresses before sending to Google Maps.');
      return;
    }

    const mapsUrl = buildGoogleMapsDirectionsUrl(filledAddresses);
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Link
            href="/"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-center"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Root Calculation</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Add all the addresses you want in your trip, then send them to Google Maps to calculate
          the quickest route.
        </p>

        <form onSubmit={sendToGoogleMaps}>
          <div className="space-y-3">
            {addresses.map((address, index) => (
              <div key={`address-${index}`} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-sm font-medium text-gray-700 sm:w-28" htmlFor={`address-${index}`}>
                  Address {index + 1}
                </label>
                <input
                  id={`address-${index}`}
                  type="text"
                  value={address}
                  onChange={(event) => updateAddress(index, event.target.value)}
                  placeholder="Enter an address"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  disabled={addresses.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={addAddress}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              + Add address
            </button>
            <span className="text-xs text-gray-500">{addresses.length} address fields</span>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-60"
            disabled={filledAddresses.length < 2}
          >
            Send to Google Maps
          </button>
        </form>
      </div>
    </div>
  );
}
