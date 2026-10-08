// What each region actually runs on. Read off the provider panel screenshots
// Evan sent 2026-10-08 (nodes MFL014, ASH510, DTX56): CPU, base clock, core
// count, RAM, storage. Threads, boost clock and memory generation are AMD's
// published specs for that chip, not measured; AM4 boards take DDR4 and AM5
// only takes DDR5, so the 7600 is DDR5 by construction.
//
// Real numbers only. Customers can read the CPU model straight out of a game
// server console, so anything rounded up here gets caught the first week.
// When a node is added or swapped, change it here and nowhere else.
//
// Storage: the panel says "2 TB, 2 disks" on all three. The site already
// says NVMe on RAID 1 (Included, FAQ, yaml); that's what's printed below.
// If the second disk isn't a mirror, both places need fixing, not just this.

export interface Node {
  /** Matches HOSTING slugs in locations.ts. */
  region: string;
  cpu: string;
  arch: string;
  cores: number;
  threads: number;
  baseGhz: number;
  boostGhz: number;
  ramGb: number;
  ramType: "DDR4" | "DDR5";
  storage: string;
}

export const NODES: Node[] = [
  {
    region: "dallas",
    cpu: "AMD Ryzen 7 5700X",
    arch: "Zen 3",
    cores: 8,
    threads: 16,
    baseGhz: 3.4,
    boostGhz: 4.6,
    ramGb: 128,
    ramType: "DDR4",
    storage: "2 TB NVMe, two drives in RAID 1",
  },
  {
    region: "ashburn",
    cpu: "AMD Ryzen 5 7600",
    arch: "Zen 4",
    cores: 6,
    threads: 12,
    baseGhz: 3.8,
    boostGhz: 5.1,
    ramGb: 128,
    ramType: "DDR5",
    storage: "2 TB NVMe, two drives in RAID 1",
  },
  {
    region: "miami",
    cpu: "AMD Ryzen 5 5600X",
    arch: "Zen 3",
    cores: 6,
    threads: 12,
    baseGhz: 3.7,
    boostGhz: 4.6,
    ramGb: 128,
    ramType: "DDR4",
    storage: "2 TB NVMe, two drives in RAID 1",
  },
];

/** Day the numbers were read off the provider panel. Shown on the page. */
export const HARDWARE_CHECKED = "8 October 2026";
