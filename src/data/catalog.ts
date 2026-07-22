// ═══════════════════════════════════════════════════════════════════════════
// LUMIX SOLUTIONS — Product Catalog
// ═══════════════════════════════════════════════════════════════════════════
//
// SINGLE SOURCE OF TRUTH for the "build your server" flow.
// Every price, spec, and WHMCS ID on the public site comes from this file.
//
// WHMCS remains the system of record for what customers are actually charged.
// The numbers here are display copy. When you change a price in WHMCS admin,
// change it here too, or the site will quote a price the cart won't honour.
//
// All IDs below were read from the live storefront at billing.lumixsolutions.org.
// To re-verify after a WHMCS change, open a category page, view source, and read
// the `lxTiersData` JSON block plus the `data-lx-opt` / `data-val` attributes.
// ═══════════════════════════════════════════════════════════════════════════

export type BillingCycle =
    | "monthly"
    | "quarterly"
    | "semiannually"
    | "annually"
    | "biennially"
    | "triennially";

/** Prices keyed by cycle. A missing key means that cycle is not sold for the plan. */
export type Pricing = Partial<Record<BillingCycle, number>>;

export interface CycleMeta {
    key: BillingCycle;
    label: string;
    shortLabel: string;
    months: number;
}

/** Display order for billing cycles. Only cycles present in a plan's `pricing` render. */
export const billingCycles: CycleMeta[] = [
    { key: "monthly", label: "Monthly", shortLabel: "mo", months: 1 },
    { key: "quarterly", label: "Quarterly", shortLabel: "3 mo", months: 3 },
    { key: "semiannually", label: "Semi-Annually", shortLabel: "6 mo", months: 6 },
    { key: "annually", label: "Annually", shortLabel: "yr", months: 12 },
    { key: "biennially", label: "Biennially", shortLabel: "2 yr", months: 24 },
    { key: "triennially", label: "Triennially", shortLabel: "3 yr", months: 36 },
];

export interface PlanSpecs {
    /** String, not number — some tiers are fractional ("2.5"). */
    vcores: string;
    ramGb: number;
    storageGb: number;
    slots: string;
    databases: number;
    backups: number;
}

export interface Plan {
    key: string;
    name: string;
    /** WHMCS product ID. Drives cart.php?a=add&pid=… */
    pid: number;
    specs: PlanSpecs;
    pricing: Pricing;
    /** Renders a "Most Popular" ribbon on the plan card. At most one per category. */
    popular?: boolean;
}

export interface ConfigOptionValue {
    key: string;
    label: string;
    /** WHMCS configurable option VALUE id, passed as configoption[groupId]=valueId */
    valueId: number;
    note?: string;
}

export interface ConfigOptionGroup {
    /** WHMCS configurable option GROUP id, the N in configoption[N] */
    groupId: number;
    label: string;
    values: ConfigOptionValue[];
}

// ───────────────────────────────────────────────────────────────────────────
// Locations
// ───────────────────────────────────────────────────────────────────────────
// One shared configurable option group (id 3) is attached to every game
// product. Application hosting products have no location option attached,
// which is why `hasLocations` is false for that category.

export const locationOptions: ConfigOptionGroup = {
    groupId: 3,
    label: "Location",
    values: [
        { key: "miami", label: "Miami, FL", valueId: 3, note: "US East · DDoS protected" },
        { key: "ashburn", label: "Ashburn, VA", valueId: 5, note: "US East · DDoS protected" },
    ],
};

export type CategoryStatus = "live" | "coming_soon";

export interface GameCategory {
    slug: string;
    label: string;
    /** Short name for cards and breadcrumbs, e.g. "FiveM" rather than "FiveM Hosting". */
    shortLabel: string;
    status: CategoryStatus;
    tagline: string;
    description: string;
    /** Accent hex used by the generated key-art tile when `image` is absent. */
    accent: string;
    /** Two to four characters rendered on the generated tile. */
    mark: string;
    /** Optional real key-art. Drop a file in /public/images/games/ and set the path. */
    image?: string;
    plans: Plan[];
    hasLocations: boolean;
    addonGroups?: ConfigOptionGroup[];
    /** Marketing bullets shown alongside the builder. */
    highlights?: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Live categories
// ───────────────────────────────────────────────────────────────────────────

const fivem: GameCategory = {
    slug: "fivem",
    label: "FiveM Server Hosting",
    shortLabel: "FiveM",
    status: "live",
    tagline: "Roleplay-grade GTA V servers with headroom for heavy resource packs.",
    description:
        "Purpose-built for FiveM communities. Unmetered slots, dedicated vCores, and NVMe storage on RAID 1, so restarts stay fast even with a loaded resource list.",
    accent: "#f5a524",
    mark: "FM",
    // Official FiveM brand logo (Wikimedia Commons), not GTA V key art.
    image: "/images/games/fivem.png",
    hasLocations: true,
    highlights: [
        "Unmetered player slots on every tier",
        "txAdmin and MySQL provisioned on deploy",
        "Dedicated vCores, never oversold",
    ],
    plans: [
        {
            key: "starter",
            name: "Starter FiveM Server",
            pid: 16,
            specs: { vcores: "2", ramGb: 2, storageGb: 35, slots: "Unmetered", databases: 1, backups: 3 },
            pricing: { monthly: 8.99, quarterly: 25.49, semiannually: 49.99, annually: 95.99, biennially: 179.99, triennially: 251.99 },
        },
        {
            key: "budget",
            name: "Budget FiveM Server",
            pid: 17,
            specs: { vcores: "2.5", ramGb: 4, storageGb: 50, slots: "Unmetered", databases: 2, backups: 3 },
            pricing: { monthly: 12.99, quarterly: 36.99, semiannually: 73.99, annually: 143.99, biennially: 275.99, triennially: 395.99 },
        },
        {
            key: "standard",
            name: "Standard FiveM Server",
            pid: 18,
            popular: true,
            specs: { vcores: "4", ramGb: 6, storageGb: 85, slots: "Unmetered", databases: 4, backups: 4 },
            pricing: { monthly: 18.99, quarterly: 53.99, semiannually: 107.99, annually: 215.99, biennially: 407.99, triennially: 611.99 },
        },
        {
            key: "advanced",
            name: "Advanced FiveM Server",
            pid: 22,
            specs: { vcores: "5", ramGb: 8, storageGb: 105, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 26.99, quarterly: 76.99, semiannually: 149.99, annually: 311.99, biennially: 599.99, triennially: 863.99 },
        },
        {
            key: "premium",
            name: "Premium FiveM Server",
            pid: 21,
            specs: { vcores: "6", ramGb: 10, storageGb: 120, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 31.99, quarterly: 90.99, semiannually: 179.99, annually: 347.99, biennially: 671.99, triennially: 971.99 },
        },
        {
            key: "elite",
            name: "Elite FiveM Server",
            pid: 20,
            specs: { vcores: "6", ramGb: 12, storageGb: 150, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 42.99, quarterly: 122.99, semiannually: 239.99, annually: 467.99, biennially: 887.99, triennially: 1295.99 },
        },
        {
            key: "ultimate",
            name: "Ultimate FiveM Server",
            pid: 19,
            specs: { vcores: "6", ramGb: 16, storageGb: 175, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 52.99, quarterly: 150.99, semiannually: 299.99, annually: 575.99, biennially: 1103.99, triennially: 1583.99 },
        },
    ],
};

const minecraft: GameCategory = {
    slug: "minecraft",
    label: "Minecraft Server Hosting",
    shortLabel: "Minecraft",
    status: "live",
    tagline: "Vanilla, modded, or a 200-plugin network. Same hardware either way.",
    description:
        "Java and Bedrock ready. Every tier ships with unmetered slots and enough allocated heap for modpacks that actually chew memory, not the theoretical minimum.",
    accent: "#4ade80",
    mark: "MC",
    image: "/images/games/minecraft.png",
    hasLocations: true,
    highlights: [
        "Modpack and plugin installs from the panel",
        "Unmetered slots, no per-player upcharge",
        "Automatic daily backups retained per tier",
    ],
    plans: [
        {
            key: "starter",
            name: "Starter Minecraft Server",
            pid: 24,
            specs: { vcores: "2", ramGb: 5, storageGb: 65, slots: "Unmetered", databases: 1, backups: 3 },
            pricing: { monthly: 14.99, quarterly: 42.99, semiannually: 83.99, annually: 167.99, biennially: 323.99, triennially: 467.99 },
        },
        {
            key: "budget",
            name: "Budget Minecraft Plan",
            pid: 25,
            specs: { vcores: "2.5", ramGb: 8, storageGb: 95, slots: "Unmetered", databases: 2, backups: 3 },
            pricing: { monthly: 19.99, quarterly: 56.99, semiannually: 113.99, annually: 227.99, biennially: 431.99, triennially: 647.99 },
        },
        {
            key: "standard",
            name: "Standard Minecraft Plan",
            pid: 26,
            popular: true,
            specs: { vcores: "4", ramGb: 10, storageGb: 115, slots: "Unmetered", databases: 4, backups: 4 },
            pricing: { monthly: 27.99, quarterly: 79.99, semiannually: 155.99, annually: 323.99, biennially: 623.99, triennially: 899.99 },
        },
        {
            key: "advanced",
            name: "Advanced Minecraft Plan",
            pid: 27,
            specs: { vcores: "5", ramGb: 12, storageGb: 150, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 34.99, quarterly: 99.99, semiannually: 203.99, annually: 407.99, biennially: 791.99, triennially: 1151.99 },
        },
        {
            key: "premium",
            name: "Premium Minecraft Plan",
            pid: 28,
            specs: { vcores: "6", ramGb: 14, storageGb: 200, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 42.99, quarterly: 122.99, semiannually: 251.99, annually: 503.99, biennially: 983.99, triennially: 1439.99 },
        },
        {
            key: "elite",
            name: "Elite Minecraft Plan",
            pid: 29,
            specs: { vcores: "6", ramGb: 16, storageGb: 300, slots: "Unmetered", databases: 5, backups: 5 },
            pricing: { monthly: 58.99, quarterly: 167.99, semiannually: 335.99, annually: 671.99, biennially: 1343.99, triennially: 1943.99 },
        },
        {
            key: "ultimate",
            name: "Ultimate Minecraft Plan",
            pid: 30,
            specs: { vcores: "6", ramGb: 18, storageGb: 400, slots: "Unmetered", databases: 5, backups: 5 },
            // `biennially` is deliberately omitted. WHMCS currently has it at
            // $15,335.99, which is ~6.6x the triennial price and is a typo.
            // Fix the product in WHMCS admin, then add `biennially: <price>` back.
            pricing: { monthly: 67.99, quarterly: 191.99, semiannually: 383.99, annually: 767.99, triennially: 2303.99 },
        },
    ],
};

const terraria: GameCategory = {
    slug: "terraria",
    label: "Terraria Server Hosting",
    shortLabel: "Terraria",
    status: "live",
    tagline: "Small worlds, steady tick rate, no fuss.",
    description:
        "Tuned for vanilla and lightly modded Terraria worlds. Sized for friend groups rather than public servers, and priced accordingly.",
    accent: "#22d3ee",
    mark: "TR",
    image: "/images/games/terraria.jpg",
    hasLocations: true,
    highlights: ["Instant world provisioning", "tModLoader supported", "Daily backups included"],
    plans: [
        {
            key: "standard",
            name: "Terraria Server",
            pid: 14,
            popular: true,
            specs: { vcores: "2", ramGb: 2, storageGb: 15, slots: "Unmetered", databases: 1, backups: 3 },
            pricing: { monthly: 5.0, quarterly: 14.0, semiannually: 27.0, annually: 48.0 },
        },
    ],
};

// Application Hosting (Node/Python/Go, pids 6/7/8) is still a live WHMCS
// product but is intentionally not surfaced on /games — it is not a game
// category. Re-add a GameCategory entry here to bring it back.

// ───────────────────────────────────────────────────────────────────────────
// Coming soon
// ───────────────────────────────────────────────────────────────────────────
// Catalog/marketing entries only. No WHMCS product needs to exist yet.
//
// To promote one to live: create the product in WHMCS, read its pid from the
// storefront source, then move the entry up into the live block above with
// status: "live" and a populated `plans` array.

interface ComingSoonSeed {
    slug: string;
    label: string;
    shortLabel: string;
    tagline: string;
    accent: string;
    mark: string;
}

const comingSoonSeeds: ComingSoonSeed[] = [
    // Palworld is already built in WHMCS but hidden. Fill in `plans` and flip
    // status to "live" the moment the category is unhidden.
    // Palworld is already built in WHMCS but hidden. Fill in `plans` and flip
    // status to "live" the moment the category is unhidden.
    { slug: "palworld", label: "Palworld Server Hosting", shortLabel: "Palworld", tagline: "Dedicated Pal worlds with room to grow.", accent: "#60a5fa", mark: "PW" },
    { slug: "ark-survival-ascended", label: "ARK: Survival Ascended Hosting", shortLabel: "ARK: SA", tagline: "Clustered maps and heavy mod lists.", accent: "#f97316", mark: "ARK" },
    { slug: "rust", label: "Rust Server Hosting", shortLabel: "Rust", tagline: "Wipe-day ready, high player counts.", accent: "#cd412b", mark: "RS" },
    { slug: "beamng", label: "BeamNG.drive (BeamMP) Hosting", shortLabel: "BeamNG", tagline: "Multiplayer BeamMP servers with real physics.", accent: "#f59e0b", mark: "BNG" },
    { slug: "arma-reforger", label: "Arma Reforger Server Hosting", shortLabel: "Arma Reforger", tagline: "Milsim-grade dedicated servers.", accent: "#65a30d", mark: "ARR" },
    { slug: "squad", label: "Squad Server Hosting", shortLabel: "Squad", tagline: "100-player tactical servers, licensed slots.", accent: "#3f6212", mark: "SQ" },
];

// Every seed has matching art in /public/images/games/<slug>.jpg. Add the file
// first when adding a seed, or the tile falls back to the generated mark.
const comingSoon: GameCategory[] = comingSoonSeeds.map((seed) => ({
    ...seed,
    status: "coming_soon" as const,
    description: seed.tagline,
    image: `/images/games/${seed.slug}.jpg`,
    hasLocations: true,
    plans: [],
}));

export const catalog: GameCategory[] = [fivem, minecraft, terraria, ...comingSoon];

// ───────────────────────────────────────────────────────────────────────────
// Derived views
// ───────────────────────────────────────────────────────────────────────────

/** A category is only orderable when it is live AND has at least one plan with a pid. */
export const liveCategories = catalog.filter((c) => c.status === "live" && c.plans.length > 0);

export const comingSoonCategories = catalog.filter((c) => c.status !== "live" || c.plans.length === 0);

export function getCategory(slug: string): GameCategory | undefined {
    return catalog.find((c) => c.slug === slug);
}

/** Lowest monthly price across a category's plans, for "from $X/mo" copy. */
export function startingPrice(category: GameCategory): number | null {
    const monthly = category.plans
        .map((plan) => plan.pricing.monthly)
        .filter((price): price is number => typeof price === "number");

    return monthly.length > 0 ? Math.min(...monthly) : null;
}
