// node admin/add-user.mjs <name>   adds or resets a login in admin/users.json.
// no signup flow, no reset email: forgot it, run this again
import { readFileSync, writeFileSync } from "node:fs";
import { hashPassword } from "./auth.mjs";

const name = process.argv[2];
if (!name || !/^[\w.-]+$/.test(name)) {
  console.error("usage: node admin/add-user.mjs <name>");
  process.exit(1);
}

// not echoed. raw mode so the terminal doesn't print what you type
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

const file = new URL("./users.json", import.meta.url);
let users = {};
try {
  users = JSON.parse(readFileSync(file, "utf8"));
} catch {}
users[name] = hashPassword(pw);
writeFileSync(file, JSON.stringify(users, null, 2) + "\n", { mode: 0o600 });
console.log(`saved ${name} in admin/users.json`);
