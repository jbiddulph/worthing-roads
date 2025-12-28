import { NextResponse } from 'next/server';

type OverpassNode = {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
};

type OverpassWay = {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
};

type OverpassElement = OverpassNode | OverpassWay;

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

function isLikelyBadName(name: string) {
  const n = name.trim();
  if (n.length < 2 || n.length > 80) return true;
  const lower = n.toLowerCase();
  if (lower === 'unnamed road') return true;
  if (lower.includes('unknown')) return true;
  return false;
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

  // Keep queries bounded (roughly: > ~55km x 55km at UK latitudes)
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
out body;
>;
out skel qt;
`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: overpassQuery }).toString(),
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
    const ways = (json.elements ?? []).filter((e): e is OverpassWay => e.type === 'way');

    // nodeId -> set(roadName)
    const nodeToRoads = new Map<number, Set<string>>();
    const roadNames = new Set<string>();

    for (const way of ways) {
      const name = way.tags?.name?.trim();
      if (!name || isLikelyBadName(name)) continue;
      roadNames.add(name);
      for (const nodeId of way.nodes ?? []) {
        let set = nodeToRoads.get(nodeId);
        if (!set) {
          set = new Set<string>();
          nodeToRoads.set(nodeId, set);
        }
        set.add(name);
      }
    }

    // Build adjacency from shared nodes
    const adjacency = new Map<string, Set<string>>();
    const MAX_ROADS_PER_NODE = 10; // skip huge junction clusters

    for (const roadsAtNode of nodeToRoads.values()) {
      const roads = Array.from(roadsAtNode);
      if (roads.length < 2) continue;
      if (roads.length > MAX_ROADS_PER_NODE) continue;

      for (let i = 0; i < roads.length; i++) {
        for (let j = i + 1; j < roads.length; j++) {
          const a = roads[i];
          const b = roads[j];
          if (a === b) continue;
          if (!adjacency.has(a)) adjacency.set(a, new Set<string>());
          if (!adjacency.has(b)) adjacency.set(b, new Set<string>());
          adjacency.get(a)!.add(b);
          adjacency.get(b)!.add(a);
        }
      }
    }

    // Convert to plain object and keep only meaningful keys
    const junctions: Record<string, string[]> = {};
    for (const [main, set] of adjacency.entries()) {
      const list = Array.from(set).sort((a, b) => a.localeCompare(b, 'en-GB'));
      if (list.length === 0) continue;
      junctions[main] = list;
    }

    const roads = Array.from(roadNames)
      .sort((a, b) => a.localeCompare(b, 'en-GB'))
      .slice(0, 1500)
      .map((road_name) => ({ road_name }));

    return NextResponse.json({
      roadsCount: roads.length,
      junctionsCount: Object.keys(junctions).length,
      roads,
      junctions,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch junctions', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

