import type { Hotspot, ScoredHotspot } from '../data/mockHotspots';

export function getHotScore(hotspot: Hotspot): number {
  return hotspot.likes + hotspot.comments * 3 + hotspot.reposts * 5;
}

export function getPotentialScore(hotspot: Hotspot): number {
  const baseScore = hotspot.likes * 0.2 + hotspot.comments * 0.5 + hotspot.reposts * 0.8;

  if (hotspot.trend === '快速上升') {
    return Math.round(baseScore + 1000);
  }

  if (hotspot.trend === '上升') {
    return Math.round(baseScore + 500);
  }

  return Math.round(baseScore);
}

export function scoreHotspot(hotspot: Hotspot): ScoredHotspot {
  return {
    ...hotspot,
    hotScore: getHotScore(hotspot),
    potentialScore: getPotentialScore(hotspot)
  };
}

export function scoreHotspots(hotspots: Hotspot[]): ScoredHotspot[] {
  return hotspots.map(scoreHotspot);
}

export function getTopRecommendations(hotspots: ScoredHotspot[], count = 3): ScoredHotspot[] {
  return [...hotspots].sort((a, b) => b.potentialScore - a.potentialScore).slice(0, count);
}
