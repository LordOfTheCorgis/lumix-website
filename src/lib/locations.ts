// The one copy of where things are. The globe draws from this and the home
// page prints it as text, so the information exists without WebGL.

export interface Location {
  city: string;
  region: string;
  lat: number;
  lng: number;
  /** Something HTTP in that region that answers fast. The ping test times a
      no-cors fetch against it, so it needs no CORS headers and can 404 for
      all we care. Leave it off and the region is skipped. */
  pingUrl?: string;
}

// Where servers run. West to east.
export const HOSTING: Location[] = [
  { city: "Salt Lake City", region: "Utah", lat: 40.7608, lng: -111.891 },
  { city: "Dallas", region: "Texas", lat: 32.7767, lng: -96.797 },
  { city: "Ashburn", region: "Virginia", lat: 39.0438, lng: -77.4874 },
  { city: "Miami", region: "Florida", lat: 25.7617, lng: -80.1918 },
];

// Where attack traffic gets scrubbed before it reaches one of the above.
//
// The page never names the providers, Evan's call, so `region` is a flat label
// here. Sources for the maintainer though, because someone will ask: CosmicGuard
// lists exactly six PoPs on cosmicguard.com (Los Angeles, Dallas, Ashburn,
// London, Amsterdam, Frankfurt). Cloudflare has no scrubbing centres as such,
// Magic Transit scrubs at every one of its ~348 cities, so the rest are its
// major hubs rather than a complete list. Dallas and Ashburn are CosmicGuard
// PoPs too but they're already red above; a paper dot under a red one is
// invisible so they aren't repeated.
//
// Ordered so the list reads west to east across the map, then south.
export const MITIGATION: Location[] = [
  { city: "Los Angeles", region: "Mitigation", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", region: "Mitigation", lat: 41.8781, lng: -87.6298 },
  { city: "Newark", region: "Mitigation", lat: 40.7357, lng: -74.1724 },
  { city: "São Paulo", region: "Mitigation", lat: -23.5505, lng: -46.6333 },
  { city: "London", region: "Mitigation", lat: 51.5074, lng: -0.1278 },
  { city: "Amsterdam", region: "Mitigation", lat: 52.3676, lng: 4.9041 },
  { city: "Frankfurt", region: "Mitigation", lat: 50.1109, lng: 8.6821 },
  { city: "Singapore", region: "Mitigation", lat: 1.3521, lng: 103.8198 },
  { city: "Tokyo", region: "Mitigation", lat: 35.6762, lng: 139.6503 },
  { city: "Sydney", region: "Mitigation", lat: -33.8688, lng: 151.2093 },
];
