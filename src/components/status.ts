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

/** "CHF 149 pro Jahr", "CHF 0" */
export function planPrice(p: Plan) {
  return p.period === "year" ? `${chfShort(p.price)} pro Jahr` : chfShort(p.price);
}

/** What a plan includes in Tournament, in the order the boards list it. */
export function included(l: PlanLimits) {
  if (!l.branding) {
    return [`Bis ${l.maxTeams} Teams pro Turnier`, l.maxRunning === 1 ? "Ein Turnier gleichzeitig" : `${l.maxRunning} Turniere gleichzeitig`, `${l.maxOrganisers} Organisatoren`, "Check-in am Turniertag"];
  }
  return [
    l.maxRunning === null ? "Unbegrenzt viele Turniere gleichzeitig" : `${l.maxRunning} Turniere gleichzeitig`,
    `Bis ${l.maxTeams} Teams pro Turnier`,
    `${l.maxOrganisers} Organisatoren`,
    "Eigenes Logo, Warteliste, Export",
    ...(l.invoice ? ["Zahlung auf Rechnung"] : []),
  ];
}

/** What a plan includes in Wishlist. */
export function includedWishlist(w: WishlistLimits) {
  return [w.maxLists === null ? "Unbegrenzt viele Wunschlisten" : `${w.maxLists} Wunschlisten für die Organisation`, "Gemeinsam im Team pflegen, per Link teilen"];
}
