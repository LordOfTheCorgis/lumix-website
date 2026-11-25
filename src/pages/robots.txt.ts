// Was public/robots.txt. An endpoint now so the dev deploy can shut crawlers
// out entirely while production keeps the real rules.
import type { APIRoute } from "astro";

const PROD = `User-agent: *
Allow: /

Sitemap: https://lumixsolutions.org/sitemap-index.xml
`;

// Staging. Belt and braces with the noindex meta in Layout: robots.txt stops
// the crawl, the meta covers anything that got linked from elsewhere.
const DEV = `User-agent: *
Disallow: /
`;

export const GET: APIRoute = () =>
  new Response(import.meta.env.PUBLIC_DEPLOY_ENV === "dev" ? DEV : PROD, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
