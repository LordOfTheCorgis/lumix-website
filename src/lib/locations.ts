// the one copy of where things are. globe and the text list both read this

export interface Location {
  city: string;
  region: string;
  lat: number;
  lng: number;
  /** for /regions#dallas. hosting only */
  slug?: string;
  /** one line on who it serves. hosting only */
  serves?: string;
  /** something in that dc. the node ips work even with nothing listening,
      see lib/ping.ts for why a refused connection still times right.
      missing = region skipped */
  pingUrl?: string;
  /** vms on that node, /status lists them under the region. empty ip = no
      ping of its own, it shows "host up/down" off the node's check instead */
  vms?: { name: string; ip: string }[];
  /** node's at its cap, not taking new servers. existing ones keep running */
  soldOut?: boolean;
}

// where servers run, west to east. salt lake city was on here once, dallas
// won the third slot instead. don't add it back until there's a node
export const HOSTING: Location[] = [
  {
    city: "Dallas",
    region: "Texas",
    slug: "dallas",
    lat: 32.7767,
    lng: -96.797,
    serves: "Texas, the South, the Midwest, and most of Mexico. The middle of the country.",
    pingUrl: "https://193.31.31.102/",
    vms: [
      { name: "gm-srv-03", ip: "" },
    ],
  },
  {
    city: "Ashburn",
    soldOut: true,
    region: "Virginia",
    slug: "ashburn",
    lat: 39.0438,
    lng: -77.4874,
    serves: "The Northeast, the Mid-Atlantic, eastern Canada, and the shortest hop from Europe.",
    pingUrl: "https://206.168.173.77/",
    vms: [
      { name: "gm-srv-02", ip: "" },
      { name: "staff-gm-srv-01", ip: "" },
    ],
  },
  {
    city: "Miami",
    soldOut: true,
    region: "Florida",
    slug: "miami",
    lat: 25.7617,
    lng: -80.1918,
    serves: "Florida, the Gulf, the Caribbean, and South America.",
    pingUrl: "https://216.173.77.231/",
    vms: [
      { name: "gm-srv-01", ip: "" },
      { name: "web-srv-01", ip: "" },
      { name: "web-srv-02", ip: "" },
      { name: "dev-srv-01", ip: "" },
    ],
  },
];

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
