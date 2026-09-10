// The site never takes payment. Everything here is a link into WHMCS with the
// product preselected; WHMCS owns the cart, the price, and the config screen.
//
// Deliberately no `skipconfig=1`. That flag only bypasses WHMCS's own config
// page when EVERY configurable option group is present in the URL, and region is
// one of those. Sending people through WHMCS's screen costs a click and means we
// can never quote a region we don't actually have stock in.

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
