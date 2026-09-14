// regenerates the favicons from public/images/logo.png. run after the mark
// changes. the L is white on transparent so a bare favicon vanishes on a
// light tab, everything gets composited onto ink first
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "public/images/logo.png";
const INK = { r: 0x12, g: 0x12, b: 0x14, alpha: 1 };

async function icon(size, pad, out) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const buf = await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, buf);
  return buf;
}

const p32 = await icon(32, 0.12, "public/favicon-32.png");
await icon(16, 0.08, "public/favicon-16.png");
await icon(180, 0.16, "public/apple-touch-icon.png");
await icon(192, 0.14, "public/icon-192.png");
await icon(512, 0.14, "public/icon-512.png");

// minimal ico wrapping the 32px png, fine since vista
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = 32;
entry[1] = 32;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(p32.length, 8);
entry.writeUInt32LE(22, 12);
writeFileSync("public/favicon.ico", Buffer.concat([header, entry, p32]));

console.log("icons written");
