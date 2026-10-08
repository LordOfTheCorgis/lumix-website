// Client half of OrderBuilder.astro. Reads the radios, rewrites the summary
// and both Place order links. The markup already shows the defaults, so if
// this never runs the page is still right, just not interactive.
import { orderUrl, price } from "../lib/order";
import { pingMs } from "./ping";

interface BuilderData {
  plans: { pid: number; name: string; pricing: Record<string, number> }[];
  groups: { groupId: number; key: string; label: string }[];
  cycles: readonly { key: string; label: string; months: number }[];
}

const root = document.querySelector<HTMLElement>("[data-builder]");
const raw = root?.querySelector("[data-builder-data]")?.textContent;

if (root && raw) {
  const data = JSON.parse(raw) as BuilderData;
  const orderLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-order-link]"));
  const all = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
  const checked = (name: string) =>
    root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  const twoDp = (n: number) => price(Math.round(n * 100) / 100);

  // Prices for whichever plan is picked go onto the cycle rows. A cycle the
  // plan doesn't sell gets disabled, and if it was the picked one we fall
  // back to monthly, which every plan has (the schema requires it).
  function syncCycles(pricing: Record<string, number>) {
    for (const row of all("[data-cycle-row]")) {
      const c = data.cycles.find((x) => x.key === row.dataset.cycleRow)!;
      const input = row.querySelector<HTMLInputElement>("input")!;
      const amount = pricing[c.key];
      const offered = amount !== undefined;
      input.disabled = !offered;
      row.classList.toggle("is-off", !offered);
      row.classList.toggle("cursor-pointer", offered);
      row.querySelector("[data-cycle-total]")!.textContent = offered ? `${price(amount)} today` : "Not offered";
      row.querySelector("[data-cycle-monthly]")!.textContent =
        offered && c.months > 1 ? `${twoDp(amount / c.months)}/mo` : "";
      if (!offered && input.checked) {
        root!.querySelector<HTMLInputElement>('input[name="billingcycle"][value="monthly"]')!.checked = true;
      }
    }
  }

  function render() {
    const pid = Number(checked("plan")?.value);
    const plan = data.plans.find((p) => p.pid === pid) ?? data.plans[0];
    syncCycles(plan.pricing);

    const cycleKey = checked("billingcycle")?.value ?? "monthly";
    const cycle = data.cycles.find((c) => c.key === cycleKey)!;

    const configOptions: Record<number, number> = {};
    let regionLabel = "";
    for (const g of data.groups) {
      const input = checked(`configoption-${g.groupId}`);
      if (input?.value) configOptions[g.groupId] = Number(input.value);
      if (g.key === "region") regionLabel = input?.dataset.label ?? "";
    }
    const skipConfig = data.groups.every((g) => g.groupId in configOptions);

    const href = orderUrl(plan.pid, { billingcycle: cycle.key, configOptions, skipConfig });
    for (const a of orderLinks) a.href = href;

    const total = price(plan.pricing[cycle.key]);
    const set = (sel: string, text: string) => all(sel).forEach((el) => (el.textContent = text));
    set("[data-sum-plan]", plan.name);
    set("[data-sum-region]", regionLabel || "Picked in the cart");
    set("[data-sum-cycle]", cycle.label);
    set("[data-sum-total]", total);
    set("[data-sum-short]", [plan.name, regionLabel, cycle.label].filter(Boolean).join(" · "));
  }

  root.addEventListener("change", render);
  render();

  // ── Ping ──────────────────────────────────────────────────────────────
  // Only regions with a pingUrl get measured, and only once the location step
  // is on screen. The lowest gets "Closest to you", but only among regions
  // you can actually order; recommending a greyed one would be cruel.
  const pingCells = all("[data-ping-url]").filter((el) => el.dataset.pingUrl);
  if (pingCells.length) {
    const io = new IntersectionObserver(async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const results = await Promise.all(
        pingCells.map(async (cell) => {
          try {
            const ms = await pingMs(cell.dataset.pingUrl!);
            cell.textContent = `${ms} ms`;
            return { cell, ms };
          } catch {
            return { cell, ms: Infinity };
          }
        })
      );
      const orderable = results.filter(
        (r) => Number.isFinite(r.ms) && !r.cell.closest("label")?.querySelector("input")?.disabled
      );
      orderable.sort((a, b) => a.ms - b.ms);
      const best = orderable[0]?.cell.closest("label");
      const flag = best?.querySelector<HTMLElement>("[data-closest]");
      if (flag) flag.hidden = false;
    });
    io.observe(pingCells[0].closest("fieldset")!);
  }

  // ── Duplicate-cart warning ────────────────────────────────────────────
  // WHMCS appends on every a=add, see the TODO. Session storage so it lasts
  // the visit; pageshow so it also fires on a back-button bfcache restore,
  // which is exactly the double-order case.
  const NOTE_KEY = "lumix:sent-to-cart";
  for (const a of orderLinks) {
    a.addEventListener("click", () => {
      try { sessionStorage.setItem(NOTE_KEY, "1"); } catch {}
    });
  }
  window.addEventListener("pageshow", () => {
    let sent = false;
    try { sent = sessionStorage.getItem(NOTE_KEY) === "1"; } catch {}
    all("[data-cart-note]").forEach((n) => (n.hidden = !sent));
  });
}
