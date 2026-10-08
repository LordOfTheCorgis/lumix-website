// The site never takes payment. Everything here is a link into WHMCS with the
// product preselected; WHMCS owns the cart, the price, and checkout.
//
// `skipconfig=1` is only sent when the caller says every configurable option
// group on that product is already in the URL (the game page picker, see
// orderOptions.ts). WHMCS only honours it in that case anyway: miss a group and
// it shows its own config screen for the missing one, which is the safe
// failure. Choices come from valueIds read off the live cart, so we can't quote
// a region WHMCS isn't selling.
//
// No `promocode` param. Tried 2026-10-08 in clean sessions: on a=add with and
// without skipconfig, and on a=view. This install's cart (custom nexus_cart
// template) ignores it every time; typing LUMIX10 into the cart's box works.
// Getting it pre-applied needs a WHMCS hook that reads the param and sets
// $_SESSION['cart']['promo'], not anything on this side.

const BILLING_BASE = "https://billing.lumixsolutions.org";

interface OrderOptions {
  billingcycle?: string;
  /** configoption[groupId] = valueId */
  configOptions?: Record<number, number>;
  /** Only true when configOptions covers every group the product has. */
  skipConfig?: boolean;
}

export function orderUrl(
  pid: number,
  { billingcycle = "monthly", configOptions = {}, skipConfig = false }: OrderOptions = {}
): string {
  const params = new URLSearchParams({
    a: "add",
    pid: String(pid),
    billingcycle,
  });
  for (const [groupId, valueId] of Object.entries(configOptions)) {
    params.set(`configoption[${groupId}]`, String(valueId));
  }
  if (skipConfig) params.set("skipconfig", "1");
  return `${BILLING_BASE}/cart.php?${params.toString()}`;
}

// WHMCS's own cycle names, which is also how the yaml keys `pricing`. Order is
// shortest first. A plan only offers the ones its yaml lists (Terraria has 4).
export const CYCLES = [
  { key: "monthly", label: "Monthly", months: 1 },
  { key: "quarterly", label: "Every 3 months", months: 3 },
  { key: "semiannually", label: "Every 6 months", months: 6 },
  { key: "annually", label: "Yearly", months: 12 },
  { key: "biennially", label: "Every 2 years", months: 24 },
  { key: "triennially", label: "Every 3 years", months: 36 },
] as const;

export type CycleKey = (typeof CYCLES)[number]["key"];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function price(amount: number): string {
  return usd.format(amount);
}
