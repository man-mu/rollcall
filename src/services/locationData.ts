// Mirrors CQUPTRollcall/Services/LocationData.swift
// CQUPT teaching buildings in GCJ-02

export interface Coordinate {
  lat: number;
  lon: number;
}

const TEACHING_BUILDINGS: Record<string, Coordinate> = {
  '1': { lat: 29.531049, lon: 106.605647 },
  '2': { lat: 29.532345, lon: 106.606620 },
  '3': { lat: 29.535101, lon: 106.609243 },
  '4': { lat: 29.536307, lon: 106.609269 },
  '5': { lat: 29.536018, lon: 106.610354 },
  '8': { lat: 29.534461, lon: 106.611013 },
  '9': { lat: 29.525971, lon: 106.606189 },
};

const OTHER_BUILDINGS: { keyword: string; lat: number; lon: number }[] = [
  { keyword: '综合实验楼A', lat: 29.525598, lon: 106.605528 },
  { keyword: '综合实验楼B', lat: 29.525013, lon: 106.605611 },
  { keyword: '综合实验楼C', lat: 29.524309, lon: 106.605629 },
  { keyword: '桂花篮球场', lat: 29.530162, lon: 106.607208 },
  { keyword: '灯光篮球场', lat: 29.532465, lon: 106.608514 },
  { keyword: '风华运动场', lat: 29.532786, lon: 106.607568 },
  { keyword: '太极运动场', lat: 29.532896, lon: 106.609731 },
];

function applyJitter(lat: number, lon: number): Coordinate {
  const jitterLat = (Math.random() - 0.2) * 0.0008;
  const jitterLon = (Math.random() - 0.2) * 0.0008;
  return { lat: lat + jitterLat, lon: lon + jitterLon };
}

export function getCoords(locationName: string): Coordinate | null {
  if (!locationName) return null;

  // 4-digit room number: first digit = building
  if (locationName.length === 4 && /^\d{4}$/.test(locationName)) {
    const first = locationName[0]!;
    const b = TEACHING_BUILDINGS[first];
    if (b) return applyJitter(b.lat, b.lon);
  }

  // Keyword match
  for (const b of OTHER_BUILDINGS) {
    if (locationName.includes(b.keyword)) {
      return applyJitter(b.lat, b.lon);
    }
  }

  return null;
}
