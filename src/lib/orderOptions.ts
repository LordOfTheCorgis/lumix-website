// Choices a customer makes on the game page before the cart, sent to WHMCS as
// configoption[groupId]=valueId on the cart link. Add a new group here (and the
// matching configurable option group in WHMCS) and the game page grows a
// picker for it; nothing else has to change.
//
// valueId is the WHMCS option value, not ours. Read them off the config screen:
// cart.php?a=add&pid=<any game pid>, then the <select name="configoption[N]">.
// A choice with valueId null renders greyed and can't be picked, which is how a
// region gets listed before it takes orders.
//
// Checked against the live cart 2026-10-08: group 3 "Server Location" offers
// exactly one value, Dallas = 6, on FiveM, Minecraft, Palworld and Terraria.
// BeamMP has no location group attached at all. main's notes from earlier had
// Miami = 3 and Ashburn = 5 in the same group; neither is offered now, so
// they're not wired. Turn them back on in WHMCS, confirm the ids, fill them in.
import { HOSTING } from "./locations";

export interface OptionChoice {
  id: string;
  label: string;
  detail?: string;
  valueId: number | null;
}

export interface OptionGroup {
  key: string;
  label: string;
  /** The N in configoption[N]. */
  groupId: number;
  choices: OptionChoice[];
  /** Game slugs whose WHMCS products don't have this group attached. Sending
      a configoption the product doesn't have is ignored at best. */
  skip?: string[];
}

const REGION_VALUE_IDS: Record<string, number | null> = {
  "salt-lake-city": null,
  dallas: 6,
  ashburn: null,
  miami: null,
};

export const OPTION_GROUPS: OptionGroup[] = [
  {
    key: "region",
    label: "Where it runs",
    groupId: 3,
    skip: ["beammp"],
    choices: HOSTING.map((h) => ({
      id: h.slug!,
      label: h.city,
      detail: h.region,
      valueId: REGION_VALUE_IDS[h.slug!] ?? null,
    })),
  },
];

export function groupsFor(gameSlug: string): OptionGroup[] {
  return OPTION_GROUPS.filter((g) => !g.skip?.includes(gameSlug));
}

/** First choice that's actually orderable, or null if the group has none. */
export function defaultChoice(group: OptionGroup): OptionChoice | null {
  return group.choices.find((c) => c.valueId !== null) ?? null;
}

/** configoption map for the defaults, what the links say before any JS runs. */
export function defaultOptions(groups: OptionGroup[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const g of groups) {
    const c = defaultChoice(g);
    if (c?.valueId != null) out[g.groupId] = c.valueId;
  }
  return out;
}
