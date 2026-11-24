// site never takes payment, everything is a link into WHMCS with the product
// preselected.
//
// no skipconfig=1 on purpose, one extra click on the config page and the
// customer sees what they're about to buy. the region they picked on the game
// page rides along as configoption[3] so it's preselected there

const BILLING_BASE = "https://billing.lumixsolutions.org";

export function orderUrl(pid: number, billingcycle = "monthly", locationId?: number): string {
  const params = new URLSearchParams({
    a: "add",
    pid: String(pid),
    billingcycle,
  });
  if (locationId) params.set("configoption[3]", String(locationId));
  return `${BILLING_BASE}/cart.php?${params.toString()}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function price(amount: number): string {
  return usd.format(amount);
}
