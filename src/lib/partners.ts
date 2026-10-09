// The partner roster, as Evan supplied it 2026-09-14. Copy is theirs, not
// ours, so it's kept as given; tighten it with them, not here. All of them
// are FiveM asset shops, which is why /partners reads as a FiveM page.
//
// Order is Evan's, 2026-09-14. Cartoon's blurb is ours, written from what
// Evan said (animations, LEO emotes, scripts as a side line); the rest is
// each studio's own copy.

import elevioLogo from "../assets/partners/elevio-modifications.webp";
import nleLogo from "../assets/partners/natural-light-enhanced.webp";
import marcoLogo from "../assets/partners/marcos-presets.webp";
import kezLogo from "../assets/partners/kez-modifications.webp";
import eliteLogo from "../assets/partners/elite-modification.webp";
import fgLogo from "../assets/partners/fg-development-studio.webp";
import cartoonLogo from "../assets/partners/cartoon.webp";
import celestrativeLogo from "../assets/partners/celestrative-modifications.webp";

export interface Partner {
  name: string;
  /** Two to three letters, stands in for a logo. Same idea as `mark` on a game. */
  mark: string;
  /** Their logo, trimmed and on transparent. Takes the monogram's place
   *  when present; `mark` stays as the fallback and the alt-free label. */
  logo?: ImageMetadata;
  founder: string;
  description: string;
  services: string[];
  /** Hiring, commissions open, roadmap: whatever they want said. */
  note?: string;
  /** A code Lumix customers can use at their checkout, not ours. */
  offer?: { code: string; text: string };
  url?: string;
  /** A second link when the shop and the portfolio are different pages. */
  gallery?: string;
  discord: string;
}

export const partners: Partner[] = [
  {
    name: "Elevio Modifications",
    mark: "EV",
    logo: elevioLogo,
    founder: "Elevio",
    description:
      "Elevio Modifications makes liveries, EUP and paint work for FiveM at prices small communities can actually pay, and will film your server a showcase video to go with it. More on the way.",
    services: [
      "Vehicle liveries",
      "Custom EUP packs",
      "Character and vehicle paintings",
      "3D badge commissions",
      "Custom showcase videos",
      "Commissions",
    ],
    note: "Cheap and affordable is the pitch. Commissions open; the gallery has current work.",
    url: "https://eleviomods.xyz/",
    gallery: "https://eleviomods.xyz/gallery",
    discord: "https://discord.gg/rGGSPRfTzv",
  },
  {
    name: "Natural Light Enhanced",
    mark: "NLE",
    logo: nleLogo,
    founder: "NLE",
    description:
      "NLE specializes in creating realistic, performance-friendly graphics mods for FiveM focused on natural lighting. Their mission is to continually improve and refine visuals for everyone to enjoy.",
    services: [
      "High-quality ENB graphics",
      "Custom mod packs",
      "Realistic lighting enhancements",
      "Optimized performance",
      "Constant updates & improvements",
    ],
    url: "https://naturallightenhanced.com/",
    discord: "https://discord.gg/F5rvPwNJc2",
  },
  {
    name: "Marco's Presets",
    mark: "MP",
    logo: marcoLogo,
    founder: "Marco",
    description:
      "Marco's Presets offers high-quality ENB and Reshade products for FiveM, enhancing visual fidelity and performance while preserving the freedom of custom media configurations. With a focus on reliability and customer satisfaction, they provide tailored solutions to elevate your server's aesthetics.",
    services: ["High quality ENB graphics", "High quality Reshade products"],
    url: "https://www.patreon.com/cw/marcopresets/shop",
    discord: "https://discord.gg/marco",
  },
  {
    name: "Cartoon",
    mark: "CT",
    // Courage the Cowardly Dog, cropped off their avatar. It's Cartoon
    // Network's character, not theirs; Evan's call on 2026-10-08 to run it.
    // Swap it the day they send a mark of their own.
    logo: cartoonLogo,
    founder: "Cartoon",
    description:
      "Cartoon does custom animations for FiveM: law enforcement emotes, cuffing and searching sequences, the small movements that make a traffic stop look like one instead of two people standing still. Scripts too, when an animation needs one to run.",
    services: [
      "Custom animations",
      "Law enforcement emotes",
      "Animation commissions",
      "Supporting scripts",
    ],
    note: "Animations are the thing; go watch them in the Discord.",
    discord: "https://discord.gg/EnVMwY7HeH",
  },
  {
    name: "Kez Modifications",
    mark: "KEZ",
    logo: kezLogo,
    founder: "Kez",
    description:
      "Kez Modifications is focused on delivering high-quality assets for the FiveM community, with a strong emphasis on reliability, professionalism, and long-term trust.",
    services: [
      "EUP commissions",
      "EUP listings",
      "EUP packages",
      "Patches",
      "Custom EUP work",
      "Upcoming EUP models",
    ],
    note: "Accepting EUP commissions and listings now. Current work is in the Discord.",
    discord: "https://discord.gg/AMSrHMZRhW",
  },
  {
    // Was Valerisn Upfitting until 2026-10-08. Same founder, same Discord
    // as far as we know; Evan only passed on the new name and logo.
    name: "Celestrative Modifications",
    mark: "CM",
    logo: celestrativeLogo,
    founder: "Valerisn",
    description:
      "Focused on creating clean, high quality Non-ELS vehicles for FiveM with realistic designs, optimized builds, and attention to detail, Celestrative's mission is to provide communities with reliable, immersive vehicle assets that enhance gameplay and fit seamlessly into any server.",
    services: ["Non-ELS FiveM vehicles", "Optimized vehicles", "Custom commission work"],
    discord: "https://discord.gg/esfvwXEzG7",
  },
  {
    name: "Centrix Development Hub",
    mark: "CDH",
    founder: "Mike",
    description:
      "Centrix Development Hub is a versatile FiveM development team offering a wide range of services, including custom vehicle modifications and graphics design. With a focus on quality and client satisfaction, they provide tailored solutions to enhance your server's experience.",
    services: ["Custom LEO vehicles", "Custom GFX for your server"],
    discord: "https://discord.gg/zamxskR2fQ",
  },
  {
    name: "Elite Modification",
    mark: "EM",
    logo: eliteLogo,
    founder: "EM Team",
    description:
      "Elite Modification is back and focused on helping communities level up with premium, practical server assets. Their work is built for immersive gameplay, clean branding, and dependable performance.",
    services: [
      "Livery development",
      "EUP packages",
      "Patches and badges",
      "Server-sided sirens",
      "Custom scripts",
      "Graphics and branding",
      "Website development",
      "Discord bots and automation",
    ],
    note: "Currently growing their support team. Open a ticket in their Discord to apply.",
    offer: { code: "LSXEM", text: "15% off at checkout" },
    url: "https://elitemodification.com/",
    discord: "https://discord.gg/tW2Ybp5UDt",
  },
  {
    name: "FG Development Studio",
    mark: "FG",
    logo: fgLogo,
    founder: "Freedom_Gaming23",
    description:
      "FG Development Studios is a veteran-run FiveM development studio focused on quality assets at prices server owners can actually afford. Every release is actively maintained and supported after purchase. No abandonware, no upsells.",
    services: [
      "MLOs & Ymaps",
      "Custom props & 3D modeling",
      "Vehicle liveries & EUP retextures",
      "Custom patches & logos",
      "Occasional server scripts",
    ],
    note: "Building for FiveM today, with development already pointed at next-gen GTARP platforms and the GTA 6 ecosystem.",
    offer: { code: "Lumix15FG", text: "15% off at checkout" },
    url: "https://fgdevelopment.tebex.io/",
    discord: "https://discord.gg/SZhU2cFc4Q",
  },
];

/** Anchor id for a partner's row on /partners. Built from the name so nobody
 *  has to remember to add a field; "Marco's Presets" comes out marcos-presets. */
export const partnerSlug = (p: Partner) =>
  p.name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
