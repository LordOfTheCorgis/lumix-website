// the one copy of where things are. globe and the text list both read this.
// HOSTING lives in src/data/locations.json now, the admin edits it (admin/).
// the old comments on each field moved to lib/schemas.mjs, read them there.
// salt lake city was on the list once, dallas won the third slot instead.
// don't add it back until there's a node
import type { z } from "astro/zod";
import { locationsSchema, locationSchema } from "./schemas.mjs";
import hosting from "../data/locations.json";

export type Location = z.infer<typeof locationSchema>;

// west to east. a bad row fails the build, same as a bad game yaml
export const HOSTING: Location[] = locationsSchema.parse(hosting);

// scrubbing points. page never names providers (evan's call) so region is a
// flat label. for whoever asks: cosmicguard has six PoPs (LA, dallas, ashburn,
// london, amsterdam, frankfurt), cloudflare magic transit scrubs everywhere so
// the rest are its big hubs. dallas/ashburn skipped, a paper dot under a red
// one is invisible. west to east then south
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
