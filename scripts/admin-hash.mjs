// node scripts/admin-hash.mjs evan
// prints a line to paste into the "users" list in lumix-admin/config.php on the
// server. pbkdf2 because node and php both have it built in, no bcrypt needed.
// nothing is stored here, the hash goes straight to your terminal
import { pbkdf2Sync, randomBytes } from "node:crypto";

const name = process.argv[2];
if (!name || !/^[\w.-]+$/.test(name)) {
  console.error("usage: node scripts/admin-hash.mjs <username>");
  process.exit(1);
}

// raw mode so the terminal doesn't echo the password
function ask(q) {
  return new Promise((resolve) => {
    process.stdout.write(q);
    const stdin = process.stdin;
    if (stdin.isTTY) stdin.setRawMode(true);
    let buf = "";
    stdin.resume();
    stdin.setEncoding("utf8");
    const on = (ch) => {
      for (const c of ch) {
        if (c === "\n" || c === "\r" || c === "\u0004") {
          if (stdin.isTTY) stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", on);
          process.stdout.write("\n");
          return resolve(buf);
        }
        if (c === "\u0003") process.exit(130);
        if (c === "\u007f") buf = buf.slice(0, -1);
        else buf += c;
      }
    };
    stdin.on("data", on);
  });
}

const pw = await ask("password: ");
if (pw.length < 12) {
  console.error("12 characters minimum. it's on the internet.");
  process.exit(1);
}
if ((await ask("again: ")) !== pw) {
  console.error("those don't match");
  process.exit(1);
}

const ITER = 600000; // owasp's number for pbkdf2-sha256. php takes ~0.2s to check one, fine for a login
const salt = randomBytes(16);
const hash = pbkdf2Sync(pw, salt, ITER, 32, "sha256").toString("hex");
console.log(`\nPaste this inside 'users' => [ ... ] in config.php:\n\n    '${name}' => 'pbkdf2$${ITER}$${salt.toString("hex")}$${hash}',\n`);
