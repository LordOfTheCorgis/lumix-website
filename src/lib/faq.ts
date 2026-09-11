// Answers to the questions people ask before they buy. Rendered on the home
// page as <details> and as FAQPage JSON-LD, from this one list.
//
// Every answer here is a claim on a marketing page. Keep them to things the
// yaml, the terms, or Evan has actually said. The support and backup lines
// are the ones most likely to drift, check them when either changes.
import { promo, botHosting } from "../config";

export interface Faq {
  q: string;
  a: string;
}

export const FAQ: Faq[] = [
  {
    q: "How long until my server is online?",
    a: "Minutes. Provisioning is automatic the moment the invoice is paid, and you get panel access and connection details straight away. There's no manual setup step on our side.",
  },
  {
    q: "Where can my server run?",
    a: "Salt Lake City, Dallas, Ashburn or Miami. You pick the region at checkout, and you should pick the one closest to most of your players, not to you.",
  },
  {
    q: "Is DDoS protection included?",
    a: "On every plan, at no extra cost. Attack traffic is scrubbed upstream at mitigation points around the world before it reaches your server, so a hit on you is dropped there and your players don't notice.",
  },
  {
    q: "What comes with every plan?",
    a: "Dedicated vCores that are never oversold, NVMe storage on RAID 1, automatic backups, MySQL databases, full file access over SFTP and the panel, and unmetered player slots on the games that support it. The exact backup and database counts are listed on each plan.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes. Upgrade or downgrade from the client area at any time and the difference is prorated against your current term. Your files and world stay where they are.",
  },
  {
    q: "Do you support mods, plugins and frameworks?",
    a: "Yes. FiveM servers run QBCore, ESX, vRP or a custom framework with txAdmin provisioned on deploy. Minecraft modpacks, Paper, Forge and Fabric install from the panel. Terraria supports tModLoader, and Palworld takes mod and map uploads.",
  },
  {
    q: "How do I get support?",
    a: "Open a ticket from the client area or ask in Discord. Either way you're talking to the people who run the hardware, not a first-line script.",
  },
  {
    q: "Is there a free trial or a refund?",
    a: "No free trial. Refunds are handled case by case rather than on a fixed window; if something is genuinely wrong on our side, we'll make it right.",
  },
  {
    q: "Is there a discount code?",
    a: promo.live
      ? `${promo.code} takes ${promo.percent}% off any game server. Enter it at checkout.`
      : "Not right now. Discord is where any code gets announced first.",
  },
  {
    q: "Can I host a Discord bot or a Node.js app?",
    a: `Yes. Application hosting is $${botHosting.monthly.toFixed(2)} a month, on the same network and with the same DDoS protection as the game servers.`,
  },
];
