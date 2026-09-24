// who runs it. photos are image imports so they get resized, the old site
// shipped a 1.5MB png. bios are mine, evan rewrites his. no image = monogram
// tile, no name = title only. caleb has no last initial or photo yet
import type { ImageMetadata } from "astro";
import evan from "../assets/staff/evan-v.png";
import keaghan from "../assets/staff/keaghan-g.png";

export interface Person {
  name: string;
  /** for when there's no photo */
  mark: string;
  title: string;
  /** what the title actually means here */
  bio: string;
  image?: ImageMetadata;
  /** public stuff only */
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
    name: "Caleb",
    mark: "C",
    title: "Community Manager",
    bio: "Runs the Discord. First reply on most questions, keeps the partner list honest, and is the reason the FAQ says what people actually ask.",
    links: [],
  },
];
