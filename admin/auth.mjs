// passwords, sessions, brute-force lockout. all in memory on purpose: two or
// three people use this, a restart just logs everybody out
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw, stored) {
  const [kind, saltHex, hashHex] = String(stored).split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = scryptSync(pw, Buffer.from(saltHex, "hex"), want.length);
  return timingSafeEqual(got, want);
}

// an unknown username still burns a scrypt, or response time tells you which
// usernames exist
const DUMMY = hashPassword("not a real password");

export function checkLogin(users, name, pw) {
  const stored = Object.hasOwn(users, name) ? users[name] : null;
  const ok = verifyPassword(pw, stored ?? DUMMY);
  return Boolean(stored) && ok;
}

export function makeSessions({ ttlMs = 12 * 3600e3, now = Date.now } = {}) {
  const map = new Map();
  return {
    create(user) {
      const id = randomBytes(32).toString("hex");
      map.set(id, { user, exp: now() + ttlMs });
      return id;
    },
    get(id) {
      const s = map.get(id);
      if (!s) return null;
      if (s.exp < now()) {
        map.delete(id);
        return null;
      }
      return s.user;
    },
    destroy(id) {
      map.delete(id);
    },
  };
}

// 5 misses from one address = locked out for 5 minutes
export function makeLimiter({ max = 5, lockMs = 5 * 60e3, now = Date.now } = {}) {
  const map = new Map();
  return {
    locked(ip) {
      const e = map.get(ip);
      return Boolean(e && e.until > now());
    },
    fail(ip) {
      const e = map.get(ip) ?? { n: 0, until: 0 };
      if (e.until && e.until <= now()) e.n = 0;
      e.n += 1;
      if (e.n >= max) e.until = now() + lockMs;
      map.set(ip, e);
    },
    ok(ip) {
      map.delete(ip);
    },
  };
}
