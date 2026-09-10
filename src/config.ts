// Bare minimum to render a page and get the SEO tags right. Everything else that
// used to live in src/data (the WHMCS catalog, staff, legal, spotlight) is gone
// from this branch on purpose. It's all still on origin/main if it's needed back.

export const siteConfig = {
    name: "Lumix Solutions LLC",
    domain: "lumixsolutions.org",
    description:
        "Game server hosting for communities. A finite number of servers, run properly.",
    logo: "/images/logo.png",
    socialImage: "/images/og-image.png",
};
