// ═══════════════════════════════════════════════════════════════════════════
// WHMCS order URL — dependency-free core
// ═══════════════════════════════════════════════════════════════════════════
//
// Deliberately imports nothing. The ServerBuilder island ships this to the
// browser, and any import here (site config, catalog) would be bundled with it.
// `whmcs.ts` wraps this for server-side callers and binds the billing base.
// ═══════════════════════════════════════════════════════════════════════════

export interface OrderUrlInput {
    /** Origin of the WHMCS install, no trailing slash. */
    billingBase: string;
    /** WHMCS product ID. */
    pid: number;
    billingcycle: string;
    /** Map of configurable option GROUP id to selected VALUE id. */
    configOptions?: Record<string | number, number>;
}

export function buildOrderUrl({
    billingBase,
    pid,
    billingcycle,
    configOptions = {},
}: OrderUrlInput): string {
    const search = new URLSearchParams({
        a: "add",
        pid: String(pid),
        billingcycle,
        skipconfig: "1",
    });

    for (const [groupId, valueId] of Object.entries(configOptions)) {
        search.set(`configoption[${groupId}]`, String(valueId));
    }

    return `${billingBase}/cart.php?${search.toString()}`;
}
