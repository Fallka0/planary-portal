import type { OrgService } from "./org-contract";
import { TOURNAMENT_URL, WISHLIST_URL } from "./auth";
import { num } from "./fmt";

/** The Planary services an organisation can use, as the portal describes them. */
export const SERVICES: Record<OrgService, { name: string; what: string; url: string; href: string; icon: "trophy" | "gift" }> = {
  tournament: {
    name: "Tournament",
    what: "Turniere, Bracket und Beamer.",
    url: TOURNAMENT_URL,
    href: "/turniere",
    icon: "trophy",
  },
  wishlist: {
    name: "Wishlist",
    what: "Gemeinsame Wunschlisten fürs Team.",
    url: WISHLIST_URL,
    href: "/wunschlisten",
    icon: "gift",
  },
};

export const SERVICE_IDS: OrgService[] = ["tournament", "wishlist"];

/** "2 von 2 Wunschlisten im Plan Gratis" or "3 Wunschlisten, unbegrenzt im Plan Verein". */
export function wishlistRoom(count: number, max: number | null, plan: string) {
  const n = `${num(count)} ${count === 1 ? "Wunschliste" : "Wunschlisten"}`;
  return max === null ? `${n}, unbegrenzt im Plan ${plan}` : `${num(count)} von ${num(max)} Wunschlisten im Plan ${plan}`;
}
