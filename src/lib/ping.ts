// one timed request from the browser. PingTest and /status both go through this
//
// the node ips don't serve http, 80/443 answer with a RST. the fetch rejects,
// but it rejects after exactly one round trip, so the time to failure IS the
// ping. checked with curl on 2026-09-23, refused-at matched icmp within a few
// ms for all three. a real https endpoint later works too, it just resolves.
//
// what we can't tell apart from js: refused vs dns fail vs offline. they're all
// the same TypeError. so anything under 3ms is treated as "didn't leave the
// machine" and anything that hangs to the timeout is "nothing answered"

export interface Probe {
  ms: number;
  /** true = got an actual http response. false = something sent a RST back */
  answered: boolean;
}

export async function probe(url: string, timeoutMs = 4000): Promise<Probe | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  // no-store plus a nonce or something caches it and reports 0ms to
  // ashburn from perth
  const nonced = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const t = performance.now();
  try {
    await fetch(nonced, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: ctrl.signal,
    });
    return { ms: performance.now() - t, answered: true };
  } catch {
    const ms = performance.now() - t;
    if (ctrl.signal.aborted || ms < 3) return null;
    return { ms, answered: false };
  } finally {
    clearTimeout(timer);
  }
}

/** n samples, first one dropped (it pays for setup), median of the rest */
export async function medianPing(url: string, n = 5): Promise<number | null> {
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = await probe(url);
    // one timeout means nothing's there. waiting out four more of them made a
    // dead box take 16s to show up as dead
    if (!p) return null;
    times.push(p.ms);
  }
  if (times.length > 1) times.shift();
  times.sort((a, b) => a - b);
  return Math.round(times[Math.floor(times.length / 2)]);
}
