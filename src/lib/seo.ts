// search-facing copy per game, kept out of the yaml so the content schema
// stays alone. title is what ranks, the on-page h1 stays g.label.
// descriptions are built with the live entry price so they can't go stale
// when the yaml changes. keep them under ~160 chars or google rewrites them.
export interface GameSeo {
  title: string;
  description: (from: string) => string;
}

export const GAME_SEO: Record<string, GameSeo> = {
  fivem: {
    title: "FiveM Server Hosting with txAdmin",
    description: (from) =>
      `FiveM server hosting from ${from} a month. Dedicated vCores, NVMe, txAdmin and MySQL ready on deploy, QBCore, ESX and vRP supported, DDoS protected.`,
  },
  minecraft: {
    title: "Minecraft Server Hosting",
    description: (from) =>
      `Minecraft server hosting from ${from} a month. Paper, Forge and Fabric install from the panel, NVMe storage, DDoS protection, and online in minutes.`,
  },
  palworld: {
    title: "Palworld Dedicated Server Hosting",
    description: (from) =>
      `Palworld dedicated server hosting from ${from} a month. Live player tools, mod and map uploads, saves before every stop, and DDoS protection included.`,
  },
  beammp: {
    title: "BeamMP Server Hosting",
    description: (from) =>
      `BeamMP server hosting from ${from} a month. Low latency US regions, NVMe storage, DDoS protection, and your BeamNG.drive friends joined in minutes.`,
  },
};

// FiveM pre-sale questions people actually search. every answer sticks to what
// the yaml, the panel, or the shared FAQ already claims.
export const FIVEM_FAQ = [
  {
    q: "What is the best FiveM server hosting?",
    a: "The best host is the one that matches your player count and resource list. Look for dedicated CPU cores, because the FiveM server's main thread is the usual bottleneck, NVMe storage so restarts stay fast, DDoS protection, and a real person to talk to. Lumix FiveM plans cover all four, from a 2 GB Starter plan to a 16 GB Ultimate plan.",
  },
  {
    q: "How much RAM does a FiveM server need?",
    a: "A small server with a light resource list runs on 2 to 4 GB. A full QBCore or ESX roleplay server with a typical resource list usually wants 6 to 8 GB, and servers with a very heavy resource list or many players are more comfortable at 10 GB or more. These are rules of thumb, not hard limits. Our guide on FiveM server requirements goes through it.",
  },
  {
    q: "Does Lumix install txAdmin and MySQL for FiveM?",
    a: "Yes. txAdmin and a MySQL database are provisioned when the server deploys, so you paste in your Cfx license key and start configuring instead of installing software.",
  },
  {
    q: "Which frameworks work: QBCore, ESX or vRP?",
    a: "All of them, plus custom frameworks. The server is a normal FiveM server, so anything that runs on FiveM runs here. Our free server.cfg maker sets the resource order for each framework.",
  },
  {
    q: "Do you limit FiveM player slots?",
    a: "Lumix does not meter slots on FiveM plans. The slot cap comes from your Cfx license, and your CPU and RAM decide how many players the server actually carries smoothly.",
  },
  {
    q: "Is FiveM hosting protected from DDoS attacks?",
    a: "Yes, on every plan at no extra cost. Attack traffic is scrubbed upstream before it reaches your server.",
  },
  {
    q: "Can I move my existing FiveM server to Lumix?",
    a: "Yes. Pull it in over SFTP with the Server Importer, or open a ticket and support will move it for you. Files come across as they are.",
  },
];
