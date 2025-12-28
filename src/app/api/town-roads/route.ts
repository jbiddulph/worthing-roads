import { NextResponse } from 'next/server';

type OverpassElement = {
  type: string;
  id: number;
  tags?: Record<string, string>;
};

function parseBbox(bboxParam: string | null) {
  if (!bboxParam) return null;
  // Expected: "west,south,east,north" (Mapbox-style)
  const parts = bboxParam.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;
  return { west, south, east, north };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bbox = parseBbox(searchParams.get('bbox'));
  if (!bbox) {
    return NextResponse.json(
      { error: 'Missing/invalid bbox. Expected bbox=west,south,east,north' },
      { status: 400 }
    );
  }

  // Prevent extremely large queries (roughly: > ~55km x 55km at UK latitudes)
  const maxSpan = 0.5;
  if (bbox.east - bbox.west > maxSpan || bbox.north - bbox.south > maxSpan) {
    return NextResponse.json(
      { error: 'Bbox too large; please zoom in / pick a specific town.' },
      { status: 400 }
    );
  }

  const overpassQuery = `
[out:json][timeout:25];
(
  way["highway"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out tags;
`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: overpassQuery }).toString(),
      // Keep this endpoint non-cached by default; town searches should feel fresh.
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Overpass error', status: res.status, details: text.slice(0, 1000) },
        { status: 502 }
      );
    }

    const json = (await res.json()) as { elements?: OverpassElement[] };
    const names = new Set<string>();

    for (const el of json.elements ?? []) {
      const name = el.tags?.name?.trim();
      if (!name) continue;
      // Avoid overly noisy names
      if (name.length < 2 || name.length > 80) continue;
      names.add(name);
    }

    const roads = Array.from(names)
      .sort((a, b) => a.localeCompare(b, 'en-GB'))
      .slice(0, 800)
      .map((road_name) => ({ road_name }));

    return NextResponse.json({ count: roads.length, roads });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch roads', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

