// partner roster as evan gave it. copy is theirs, tighten it with them not
// here. order is evan's. cartoon's blurb is ours, he had nothing for them
//
// logos are trimmed, on transparent. the monogram `mark` is the fallback for
// any studio that hasn't sent one. valerisn upfitting reuses the celestrative
// logo file: same shop, it was renamed on another branch, name TBD with evan.
import type { ImageMetadata } from "astro";
import type { z } from "astro/zod";
import { partnersSchema, partnerSchema } from "./schemas.mjs";
import data from "../data/partners.json";

// the admin edits src/data/partners.json. logo is a filename in
// src/assets/partners, resolved here so astro:assets still makes the webp
// and srcset. a filename with no file behind it fails the build on purpose
const logos = import.meta.glob<{ default: ImageMetadata }>("../assets/partners/*", { eager: true });

export type Partner = Omit<z.infer<typeof partnerSchema>, "logo"> & {
  /** their logo, on transparent. takes the monogram's place when present */
  logo?: ImageMetadata;
};

export const partners: Partner[] = partnersSchema.parse(data).map(({ logo, ...p }) => {
  if (!logo) return p;
  const img = logos[`../assets/partners/${logo}`]?.default;
  if (!img) throw new Error(`partners.json: ${p.name} points at logo "${logo}" and src/assets/partners has no such file`);
  return { ...p, logo: img };
});
