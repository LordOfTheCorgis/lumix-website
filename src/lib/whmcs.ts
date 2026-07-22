// ═══════════════════════════════════════════════════════════════════════════
// LUMIX SOLUTIONS — WHMCS cart link builder
// ═══════════════════════════════════════════════════════════════════════════
//
// The site never processes payment. Everything the builder collects is encoded
// into a cart.php URL and the customer is handed to WHMCS already configured.
//
// Verified against the live install: a request to
//   cart.php?a=add&pid=16&billingcycle=monthly&configoption%5B3%5D=3&skipconfig=1
// lands on cart.php?a=view with the item in the cart, bypassing the WHMCS
// product configuration screen.
//
// `skipconfig=1` only bypasses that screen when EVERY configurable option group
// attached to the product has a value in the URL. Leave one out and WHMCS shows
// its own config page for the missing group — degraded, but not broken.
// ═══════════════════════════════════════════════════════════════════════════

import { siteConfig } from "../data/site";
import { billingCycles, type BillingCycle, type CycleMeta, type Pricing } from "../data/catalog";
import { buildOrderUrl as buildOrderUrlCore } from "./orderUrl";

export interface OrderUrlParams {
    /** WHMCS product ID. */
    pid: number;
    /** Map of configurable option GROUP id to selected VALUE id. */
    configOptions?: Record<number, number>;
    billingcycle: BillingCycle;
}

/** Server-side wrapper binding the billing origin from site config. */
export function buildOrderUrl(params: OrderUrlParams): string {
    return buildOrderUrlCore({ billingBase: siteConfig.links.billing, ...params });
}

/** Origin of the WHMCS install, handed to the client island. */
export const billingBase = siteConfig.links.billing;

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

export function formatPrice(amount: number): string {
    return currency.format(amount);
}

export function getCycle(key: BillingCycle): CycleMeta | undefined {
    return billingCycles.find((cycle) => cycle.key === key);
}

/** Cycles a plan actually sells, in display order. */
export function availableCycles(pricing: Pricing): CycleMeta[] {
    return billingCycles.filter((cycle) => typeof pricing[cycle.key] === "number");
}

/** Effective per-month cost of a term, used for "$X/mo billed annually" copy. */
export function perMonth(amount: number, months: number): number {
    return amount / months;
}

/**
 * Percentage saved versus paying the shortest available term repeatedly.
 * Returns 0 when there is no saving or no baseline to compare against.
 */
export function cycleSavings(pricing: Pricing, cycle: CycleMeta): number {
    const cycles = availableCycles(pricing);
    const baseline = cycles[0];
    if (!baseline || baseline.key === cycle.key) return 0;

    const baselinePrice = pricing[baseline.key];
    const cyclePrice = pricing[cycle.key];
    if (typeof baselinePrice !== "number" || typeof cyclePrice !== "number") return 0;

    const baselinePerMonth = perMonth(baselinePrice, baseline.months);
    const cyclePerMonth = perMonth(cyclePrice, cycle.months);
    if (baselinePerMonth <= 0) return 0;

    return Math.max(0, Math.round(100 - (cyclePerMonth / baselinePerMonth) * 100));
}
