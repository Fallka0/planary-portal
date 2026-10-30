// Plan and billing helpers: invoice states, line labels, checkout links and the return target.

import { chf, dateNarrow, longDate } from "./fmt";
import type { Billing, Invoice, PlanLimits, SubscriptionLine } from "./org-contract";

const DAY = 86_400_000;

/** What the checkout remembers across the trip to the provider, so a declined card comes back to the same form. */
export const CHECKOUT_KEY = "planary.portal.checkout";

/** Status chip of an invoice: [chip class, dot class, word]. Overdue is amber, never red. */
export function invoiceState(i: Invoice): { chip: string; dot: string; label: string; open: boolean } {
  if (i.status === "paid") return { chip: "", dot: "", label: i.paidWith === "card" ? "Bezahlt mit Karte" : "Bezahlt", open: false };
  if (i.status === "void") return { chip: "", dot: "", label: "Storniert", open: false };
  if (i.status === "draft") return { chip: "chip-line", dot: "", label: "Entwurf", open: false };
  if (i.overdueDays > 0) return { chip: "warn", dot: "warn", label: `Seit ${i.overdueDays} ${i.overdueDays === 1 ? "Tag" : "Tagen"} offen`, open: true };
  return { chip: "info", dot: "ok", label: "Offen", open: true };
}

/** The line's name without its tournament: "Turnier-Pass · Winter-LAN" → "Turnier-Pass". */
export function lineName(l: SubscriptionLine) {
  return l.name.split(" · ")[0];
}

/** The sub line under a line: the period for Plus and Vault, the tournament and purchase date for a pass. */
export function lineSub(l: SubscriptionLine, b: Pick<Billing, "renewsAt" | "passes"> & Partial<Pick<Billing, "vault">>) {
  if (l.kind === "base" && b.renewsAt) return `${dateNarrow(b.renewsAt - 365 * DAY)} bis ${dateNarrow(b.renewsAt - DAY)}`;
  if (l.kind === "addon" && l.name.startsWith("Vault") && b.vault) {
    const v = b.vault;
    return v.cancelAt ? `endet am ${dateNarrow(v.cancelAt)}` : v.renewsAt ? `${v.period === "year" ? "jährlich" : "monatlich"}, verlängert sich am ${dateNarrow(v.renewsAt)}` : "";
  }
  const tournament = l.name.split(" · ")[1] ?? "";
  const pass = l.tournamentId ? b.passes.find((p) => p.tournamentId === l.tournamentId) : undefined;
  return [tournament, pass ? `gekauft am ${dateNarrow(pass.boughtAt)}` : ""].filter(Boolean).join(", ");
}

export const KIND_LABEL: Record<SubscriptionLine["kind"], { label: string; chip: string }> = {
  base: { label: "Basisplan", chip: "chip-ink" },
  addon: { label: "Zusatz", chip: "chip-line" },
  once: { label: "Einmalig", chip: "chip-line" },
};

/** "Nächste Rechnung am 3. Februar 2027: CHF 149.00" from the recurring lines. */
export function nextInvoice(b: Billing) {
  if (!b.renewsAt || b.cancelAt) return null;
  // Planary Plus renews on its own date; Vault has its own subscription and period.
  const amount = b.lines.filter((l) => l.kind === "base").reduce((n, l) => n + l.amount, 0);
  return `Nächste Rechnung am ${longDate(b.renewsAt)}: ${chf(amount)}`;
}

/** Only planary.ch hosts are taken as a place to go back to. */
export function safeReturn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    return u.hostname === "planary.ch" || u.hostname.endsWith(".planary.ch") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Portal checkout links: /kasse?plan=plus or /kasse?pass=tournament, with the organisation and where to go back. */
export function kasseHref(what: "plus" | "pass", opts: { org?: string; tournament?: string; title?: string; returnTo?: string } = {}) {
  const q = new URLSearchParams(what === "plus" ? { plan: "plus" } : { pass: "tournament" });
  if (opts.org) q.set("org", opts.org);
  if (opts.tournament) q.set("tournament", opts.tournament);
  if (opts.title) q.set("title", opts.title);
  if (opts.returnTo) q.set("return", opts.returnTo);
  return `/kasse?${q}`;
}

/** What a plan or a pass unlocks, for the done page. */
export function unlocked(l: PlanLimits) {
  return [
    l.maxRunning === null ? "Unbegrenzt viele Turniere gleichzeitig" : null,
    `Bis ${l.maxTeams} Teams pro Turnier`,
    `${l.maxOrganisers} Organisatoren`,
    "Warteliste, eigenes Logo, Export",
    l.matchDaySupport ? "Support am Turniertag" : null,
    l.invoice ? "Zahlung auf Rechnung" : null,
  ].filter((x): x is string => !!x);
}
