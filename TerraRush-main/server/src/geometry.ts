/**
 * Geometry utilities for TerraRush territory engine.
 * Uses Turf.js for polygon operations.
 */
import * as turf from '@turf/turf';
import type { Feature, Polygon as GeoPolygon, MultiPolygon as GeoMultiPolygon } from 'geojson';
import type { Position } from './types';

export type Ring = Position[];
export type TerritoryPolygon = Ring[]; // [outerRing, ...holeRings]

// ── Conversion helpers ─────────────────────────────────────────────────────

function toTurfRing(ring: Ring): number[][] {
  const coords = ring.map(p => [p.x, p.y]);
  const first = coords[0];
  const last  = coords[coords.length - 1];
  if (!first || first[0] !== last?.[0] || first[1] !== last?.[1]) {
    coords.push([...(first ?? [0, 0])]);
  }
  return coords;
}

function fromTurfCoords(coords: number[][]): Ring {
  return coords.map(c => ({ x: c[0], y: c[1] }));
}

function toTurfPolygon(poly: TerritoryPolygon): Feature<GeoPolygon> {
  const rings = poly.map(toTurfRing);
  return turf.polygon(rings);
}

// ── Area calculations ──────────────────────────────────────────────────────

/** Shoelace formula for planar signed area */
export function signedArea(ring: Ring): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i].x * ring[j].y;
    area -= ring[j].x * ring[i].y;
  }
  return area / 2;
}

export function ringArea(ring: Ring): number {
  return Math.abs(signedArea(ring));
}

/** Total area for an array of polygons */
export function totalArea(polys: TerritoryPolygon[]): number {
  return polys.reduce((sum, poly) => sum + ringArea(poly[0]), 0);
}

// ── Point-in-polygon ───────────────────────────────────────────────────────

/** Ray-casting point-in-polygon test */
export function pointInPolygon(point: Position, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x, yi = ring[i].y;
    const xj = ring[j].x, yj = ring[j].y;
    const intersect = (yi > point.y) !== (yj > point.y)
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Test against an array of polygons (multi-polygon) */
export function pointInPolygons(point: Position, polys: TerritoryPolygon[]): boolean {
  return polys.some(poly => pointInPolygon(point, poly[0]));
}

// ── Distance / intersection ────────────────────────────────────────────────

export function dist(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Returns intersection point of segments AB and CD, or null */
export function segmentIntersection(
  a: Position, b: Position,
  c: Position, d: Position
): Position | null {
  const dxAB = b.x - a.x, dyAB = b.y - a.y;
  const dxCD = d.x - c.x, dyCD = d.y - c.y;
  const denom = dxAB * dyCD - dyAB * dxCD;
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((c.x - a.x) * dyCD - (c.y - a.y) * dxCD) / denom;
  const u = ((c.x - a.x) * dyAB - (c.y - a.y) * dxAB) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: a.x + t * dxAB, y: a.y + t * dyAB };
  }
  return null;
}

/** Check if two polylines intersect */
export function pathIntersectsPath(pathA: Ring, pathB: Ring): boolean {
  for (let i = 0; i < pathA.length - 1; i++) {
    for (let j = 0; j < pathB.length - 1; j++) {
      if (segmentIntersection(pathA[i], pathA[i + 1], pathB[j], pathB[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

// ── Territory capture ──────────────────────────────────────────────────────

/**
 * Build the union of a closed path polygon with existing territory.
 * Returns the resulting multi-polygon, or null if the path is invalid.
 */
export function buildCapturePolygon(
  path: Ring,
  existingTerritories: TerritoryPolygon[]
): TerritoryPolygon[] | null {
  if (path.length < 3) return null;

  // Close ring
  const closedPath: Ring = [...path];
  const first = closedPath[0];
  const last  = closedPath[closedPath.length - 1];
  if (first.x !== last.x || first.y !== last.y) {
    closedPath.push({ ...first });
  }

  // Area check
  if (ringArea(closedPath) < 0.0002) return null;

  // Self-intersection check
  for (let i = 0; i < closedPath.length - 1; i++) {
    for (let j = i + 2; j < closedPath.length - 1; j++) {
      if (i === 0 && j === closedPath.length - 2) continue;
      if (segmentIntersection(closedPath[i], closedPath[i + 1], closedPath[j], closedPath[j + 1])) {
        return null;
      }
    }
  }

  try {
    const newPoly: Feature<GeoPolygon> = turf.polygon([toTurfRing(closedPath)]);

    let unionResult: Feature<GeoPolygon | GeoMultiPolygon> = newPoly;

    for (const existing of existingTerritories) {
      if (!existing[0] || existing[0].length < 3) continue;
      try {
        const existingTurf = toTurfPolygon(existing);
        const fc = turf.featureCollection([unionResult, existingTurf]);
        const unioned = turf.union(fc as Parameters<typeof turf.union>[0]);
        if (unioned) unionResult = unioned;
      } catch {
        // skip bad polygon silently
      }
    }

    return extractPolygons(unionResult);
  } catch {
    return [[closedPath]];
  }
}

/**
 * Subtract polygons B from polygons A (A - B).
 */
export function subtractTerritory(
  territoryA: TerritoryPolygon[],
  territoryB: TerritoryPolygon[]
): TerritoryPolygon[] {
  if (territoryA.length === 0) return [];

  let results: Feature<GeoPolygon | GeoMultiPolygon>[] = territoryA.map(toTurfPolygon);

  for (const subtractPoly of territoryB) {
    if (!subtractPoly[0] || subtractPoly[0].length < 3) continue;
    const subTurf = toTurfPolygon(subtractPoly);
    results = results.flatMap(poly => {
      try {
        const fc = turf.featureCollection([poly, subTurf]) as Parameters<typeof turf.difference>[0];
        const diffed = turf.difference(fc);
        if (!diffed) return [];
        return [diffed];
      } catch {
        return [poly];
      }
    });
  }

  return results.flatMap(extractPolygons);
}

function extractPolygons(feat: Feature<GeoPolygon | GeoMultiPolygon>): TerritoryPolygon[] {
  if (feat.geometry.type === 'Polygon') {
    return [feat.geometry.coordinates.map((ring: number[][]) => fromTurfCoords(ring))];
  } else if (feat.geometry.type === 'MultiPolygon') {
    return feat.geometry.coordinates.map((poly: number[][][]) =>
      poly.map((ring: number[][]) => fromTurfCoords(ring))
    );
  }
  return [];
}

// ── Misc ───────────────────────────────────────────────────────────────────

/** Clamp position to arena bounds */
export function clamp(pos: Position): Position {
  return {
    x: Math.max(0.01, Math.min(0.99, pos.x)),
    y: Math.max(0.01, Math.min(0.99, pos.y)),
  };
}

/** Point in circle check */
export function pointInCircle(point: Position, center: Position, radius: number): boolean {
  return dist(point, center) <= radius;
}
