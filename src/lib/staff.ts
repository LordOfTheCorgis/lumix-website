// Who runs it. Three people today. Photos are Astro image imports so they get
// resized and served as webp; the old site shipped an 840px PNG to everyone.
//
// Bios are ours, short, and in the site's voice rather than the old site's
// "overseeing operational efficiency" register. Evan rewrites his own.
// A person with no `image` gets a monogram tile, same as a partner with no
// logo. A person with no `name` renders by title only; that's the community
// manager until Evan fills it in.
import type { ImageMetadata } from "astro";
import evan from "../assets/staff/evan-v.png";
import keaghan from "../assets/staff/keaghan-g.png";

export interface Person {
  name: string;
  /** Two or three letters, for when there's no photo. */
  mark: string;
  title: string;
  /** What the title actually means here, in one or two lines. */
  bio: string;
  image?: ImageMetadata;
  /** Whatever's public. Leave it empty rather than linking a personal account. */
  links: { label: string; href: string }[];
}

export const staff: Person[] = [
  {
    name: "Evan V.",
    mark: "EV",
    title: "Chief Executive Officer",
    bio: "Runs the company. Decides what gets bought, where it goes, and how many servers a node is allowed to hold before it stops selling.",
    image: evan,
    links: [],
  },
  {
    name: "Keaghan G.",
    mark: "KG",
    title: "Chief Operating Officer",
    bio: "Runs the day to day: provisioning, the panel, the ticket queue, and whether a region is ready to sell before it goes on the site.",
    image: keaghan,
    links: [],
  },
  {
    name: "",
    mark: "CM",
    title: "Community Manager",
    bio: "Runs the Discord. First reply on most questions, keeps the partner list honest, and is the reason the FAQ says what people actually ask.",
    links: [],
  },
];
