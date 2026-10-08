// The site never takes payment. Everything here is a link into WHMCS with the
// product preselected; WHMCS owns the cart, the price, and the config screen.
//
// Deliberately no `skipconfig=1`. That flag only bypasses WHMCS's own config
// page when EVERY configurable option group is present in the URL, and region is
// one of those. Sending people through WHMCS's screen costs a click and means we
// can never quote a region we don't actually have stock in.

import { promo } from "../config";

const BILLING_BASE = "https://billing.lumixsolutions.org";

interface OrderOptions {
  billingcycle?: string;
  // Pre-applies the promo in the cart so nobody has to type it. Off for bot
  // hosting (the bar says "any game server", and WHMCS complains if the code
  // isn't valid for what's in the cart) and for the Offer schema, which has to
  // match the undiscounted price it declares.
  withPromo?: boolean;
}

export function orderUrl(
  pid: number,
  { billingcycle = "monthly", withPromo = true }: OrderOptions = {}
): string {
  const params = new URLSearchParams({
    a: "add",
    pid: String(pid),
    billingcycle,
  });
  // Follows `live`, so flipping the promo off in config pulls it from the cart
  // links too, not just the banner.
  if (withPromo && promo.live) params.set("promocode", promo.code);
  return `${BILLING_BASE}/cart.php?${params.toString()}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function price(amount: number): string {
  return usd.format(amount);
}
