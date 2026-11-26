// the three that pay the bills go first everywhere, then everything else A to Z.
// one list so the homepage, /games, footer, /regions and /migrate can't disagree
const FEATURED = ["minecraft", "fivem", "beammp"];

const rank = (slug: string) => {
  const i = FEATURED.indexOf(slug);
  return i === -1 ? FEATURED.length : i;
};

export const byFeatured = (
  a: { data: { slug: string; shortLabel: string } },
  b: { data: { slug: string; shortLabel: string } },
) => rank(a.data.slug) - rank(b.data.slug) || a.data.shortLabel.localeCompare(b.data.shortLabel);
