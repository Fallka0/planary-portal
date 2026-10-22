import type { Plan, PlanLimits, RequestStatus, RequestTopic, TournamentState, TournamentSummary, WishlistLimits } from "@/lib/org-contract";
import { chfShort } from "@/lib/fmt";

/** Status chips: [chip class, dot class, word]. */
export const TOURNAMENT_STATE: Record<TournamentState, { chip: string; dot: string; label: string }> = {
  live: { chip: "warn", dot: "warn", label: "Live" },
  open: { chip: "", dot: "ok", label: "Anmeldung offen" },
  draft: { chip: "chip-line", dot: "", label: "Entwurf" },
  done: { chip: "", dot: "", label: "Abgeschlossen" },
};

export function tourLabel(t: Pick<TournamentSummary, "state" | "phase">) {
  return t.state === "live" && t.phase ? `Live · ${t.phase}` : TOURNAMENT_STATE[t.state].label;
}

export function tourTeams(t: TournamentSummary) {
  return t.state === "draft" && !t.teams ? "–" : `${t.teams} / ${t.maxTeams}`;
}

export const REQUEST_STATE: Record<RequestStatus, { chip: string; dot: string; label: string }> = {
  open: { chip: "info", dot: "ok", label: "Offen" },
  waiting: { chip: "warn", dot: "warn", label: "Wartet auf dich" },
  done: { chip: "", dot: "", label: "Erledigt" },
};

export const TOPIC: Record<RequestTopic, string> = {
  tournament: "Ein Turnier",
  billing: "Abrechnung",
  plan: "Abrechnung",
  account: "Team und Konto",
  other: "Etwas anderes",
};

export const ROLE = { owner: "Inhaber", member: "Mitglied" } as const;

/** "CHF 19 pro Monat", "CHF 49 pro Turnier", "CHF 0" */
export function planPrice(p: Plan) {
  if (p.period === "forever") return chfShort(p.price);
  return `${chfShort(p.price)} ${p.period === "tournament" ? "pro Turnier" : "pro Monat"}`;
}

/** What a plan includes, in the order the boards list it. */
/** What a plan includes in Tournament. */
export function included(l: PlanLimits) {
  if (!l.branding) {
    return [`Bis ${l.maxTeams} Teams pro Turnier`, l.maxRunning === 1 ? "Ein laufendes Turnier" : `${l.maxRunning} laufende Turniere`, "Anmeldung, Spielplan, Bracket", "Beamer-Ansicht mit Planary-Logo"];
  }
  return [
    l.maxRunning === null ? "Unbegrenzt viele Turniere" : "Ein Turnier, vom Entwurf bis zum Export",
    `Bis ${l.maxTeams} Teams pro Turnier`,
    l.maxOrganisers > 1 ? `Bis ${l.maxOrganisers} Organisatoren` : "Check-in und Warteliste",
    "Eigenes Logo auf dem Beamer",
    l.invoice ? "Rechnung per E-Mail" : "Export als CSV und PDF",
  ];
}

/** What a plan includes in Wishlist. */
export function includedWishlist(w: WishlistLimits) {
  return [w.maxLists === null ? "Unbegrenzt viele Wunschlisten" : `${w.maxLists} Wunschlisten für die Organisation`, "Gemeinsam im Team pflegen, per Link teilen"];
}
