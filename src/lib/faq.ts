// pre-sale questions, rendered as <details> and FAQPage json-ld from this one
// list. the text lives in src/data/faq.json (the admin edits it). every answer is
// a claim, keep to what the game data, the terms, or evan has said. support and
// backup lines drift the most
import { promo, botHosting } from "../config";
import { HOSTING } from "./locations";
import { faqSchema } from "./schemas.mjs";
import faqJson from "../data/faq.json";

// so the answer can't drift from the flag in locations.ts
const full = HOSTING.filter((r) => r.soldOut).map((r) => r.city);
const open = HOSTING.filter((r) => !r.soldOut).map((r) => r.city);

export interface Faq {
  q: string;
  a: string;
}

// answers can hold tokens so they can't drift from the data behind them
const tokens: Record<string, string> = {
  fullNote: full.length ? ` ${full.join(" and ")} ${full.length > 1 ? "are" : "is"} full right now, so new servers go in ${open.join(" or ")}.` : "",
  promoCode: promo.code,
  promoPercent: String(promo.percent),
  botPrice: botHosting.monthly.toFixed(2),
  botRuntimes: botHosting.runtimes.join(", ").replace(/, ([^,]*)$/, ", or $1"),
};
const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k) => (k in tokens ? tokens[k] : m));

// a promo answer with the promo off says its aOff line instead, or is dropped
export const FAQ: Faq[] = faqSchema.parse(faqJson).flatMap((e) => {
  if (e.a.includes("{promoCode}") && !promo.live) return e.aOff ? [{ q: e.q, a: fill(e.aOff) }] : [];
  return [{ q: e.q, a: fill(e.a) }];
});
