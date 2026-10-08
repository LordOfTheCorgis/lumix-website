// Browser-side latency to a region. Shared by PingTest (home, /regions) and
// the order builder's location step so both report the same number for the
// same place.

async function sample(url: string): Promise<number> {
  const t = performance.now();
  // cache: "no-store" plus a nonce so no layer between here and there
  // answers from cache and reports 0 ms to Ashburn from Perth.
  await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
    mode: "no-cors",
    cache: "no-store",
    credentials: "omit",
  });
  return performance.now() - t;
}

/** Median of four round trips, after one throwaway to open the connection. */
export async function pingMs(url: string): Promise<number> {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) times.push(await sample(url));
  times.shift(); // first one pays for the connection
  times.sort((a, b) => a - b);
  return Math.round(times[Math.floor(times.length / 2)]);
}
