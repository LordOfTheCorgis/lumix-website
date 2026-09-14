// site never takes payment, everything is a link into WHMCS with the product
// preselected.
//
// no skipconfig=1 on purpose. it only skips the config page when every option
// group is in the url, and region is one of them. one extra click, and we
// never quote a region we don't have stock in

const BILLING_BASE = "https://billing.lumixsolutions.org";

export function orderUrl(pid: number, billingcycle = "monthly"): string {
  const params = new URLSearchParams({
    a: "add",
    pid: String(pid),
    billingcycle,
  });
  return `${BILLING_BASE}/cart.php?${params.toString()}`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function price(amount: number): string {
  return usd.format(amount);
}
