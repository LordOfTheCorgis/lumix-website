// who runs it. photos are image imports so they get resized, the old site
// shipped a 1.5MB png. bios are mine, evan rewrites his. no image = monogram
// tile, no name = title only. caleb has no last initial or photo yet
import type { ImageMetadata } from "astro";
import type { z } from "astro/zod";
import { staffSchema, personSchema } from "./schemas.mjs";
import data from "../data/staff.json";

// the admin edits src/data/staff.json. image is a filename in src/assets/staff
const photos = import.meta.glob<{ default: ImageMetadata }>("../assets/staff/*", { eager: true });

export type Person = Omit<z.infer<typeof personSchema>, "image"> & { image?: ImageMetadata };

export const staff: Person[] = staffSchema.parse(data).map(({ image, ...p }) => {
  if (!image) return p;
  const img = photos[`../assets/staff/${image}`]?.default;
  if (!img) throw new Error(`staff.json: ${p.name} points at image "${image}" and src/assets/staff has no such file`);
  return { ...p, image: img };
});
