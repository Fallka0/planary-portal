// Fixture answers for every planary-org call the portal makes: the handoff's sample data
// (content/fixtures/portal.json) in the contract's shapes. Development and screenshots only.
// Writes change an in-memory copy, so flows (send a request, invite someone) can be clicked through.

import type {
  Billing,
  BillingContact,
  BillingState,
  CheckoutBody,
  CheckoutStatus,
  Pass,
  PassEntitlement,
  PayBy,
  SubscriptionLine,
  Invoice,
  MemberRole,
  OrgService,
  OrgWishlist,
  PaymentMethod,
  Person,
  Plan,
  PlanId,
  PortalBanner,
  PortalInvite,
  PortalMember,
  PortalOrg,
  PortalOrgSummary,
  PortalRequestDetail,
  PortalTournamentDetail,
  TournamentSummary,
} from "./org-contract";

const NOW = Date.parse("2026-10-20T20:11:00+02:00");
const at = (iso: string) => Date.parse(iso);

// default: Verein Gurten LAN on Plus. gratis / pass / new: Spielclub Thun on Gratis (with usage, with passes, brand new).
// overdue, card (card expires before the renewal), canceling: Gurten in that billing state.
// none: signed in without an organisation (solo checkout). payfail: the card payment comes back declined.
// billing-error / billing-loading: only the billing call fails or hangs (PL-Plan-Error, PL-Plan-Loading).
type State = "default" | "new" | "gratis" | "pass" | "overdue" | "card" | "canceling" | "incident" | "member" | "none" | "payfail" | "billing-error" | "billing-loading" | "error" | "loading";
const STATES: State[] = ["new", "gratis", "pass", "overdue", "card", "canceling", "incident", "member", "none", "payfail", "billing-error", "billing-loading", "error", "loading"];

function fixtureState(): State {
  if (typeof window === "undefined") return "default";
  const s = new URLSearchParams(window.location.search).get("state");
  return STATES.find((x) => x === s) ?? "default";
}

const LIMITS = {
  gratis: { maxTeams: 16, maxRunning: 1, maxOrganisers: 2, branding: false, checkIn: true, waitingList: false, export: false, matchDaySupport: false, invoice: false },
  plus: { maxTeams: 128, maxRunning: null, maxOrganisers: 10, branding: true, checkIn: true, waitingList: true, export: true, matchDaySupport: true, invoice: true },
};
const PLANS: Record<PlanId, Plan> = {
  gratis: { id: "gratis", name: "Gratis", price: 0, period: "forever", limits: LIMITS.gratis, wishlist: { maxLists: 3 } },
  plus: { id: "plus", name: "Plus", price: 14900, period: "year", limits: LIMITS.plus, wishlist: { maxLists: null } },
};
const PASS: Pass = { id: "tournament_pass", name: "Turnier-Pass", nameEn: "Tournament Pass", price: 2900, period: "tournament", limits: { ...LIMITS.plus, maxRunning: 1, matchDaySupport: false, invoice: false } };

const MATTEO: Person = { id: "u_matteo", name: "Matteo Keller", email: "matteo.keller@gurtenlan.ch" };
const LENA: Person = { id: "u_lena", name: "Lena Aebi", email: "lena.aebi@spielclub-thun.ch" };
const NOA: Person = { id: "u_noa", name: "Noa Brunner", email: "noa.brunner@example.ch" };

function tour(t: Partial<TournamentSummary> & Pick<TournamentSummary, "id" | "slug" | "name" | "game" | "state">): TournamentSummary {
  return {
    startsAt: null,
    endsAt: null,
    phase: null,
    teams: 0,
    maxTeams: 16,
    waiting: 0,
    organisationId: "org_gurten",
    organisationName: "Verein Gurten LAN",
    ownerId: MATTEO.id,
    plan: "plus",
    viewers: 0,
    updatedAt: NOW - 3_600_000,
    ...t,
  };
}

const TOURS: TournamentSummary[] = [
  tour({ id: "t_gurten", slug: "gurten-lan", name: "Gurten LAN", game: "Counter-Strike 2", state: "live", phase: "Halbfinals", startsAt: at("2026-10-20T10:00:00+02:00"), endsAt: at("2026-10-20T20:30:00+02:00"), teams: 16, maxTeams: 16, waiting: 2, viewers: 142 }),
  tour({ id: "t_winter", slug: "winter-lan", name: "Winter-LAN", game: "Counter-Strike 2", state: "open", startsAt: at("2026-12-13T10:00:00+01:00"), endsAt: at("2026-12-13T22:00:00+01:00"), teams: 4, maxTeams: 32 }),
  tour({ id: "t_eafc", slug: "ea-fc-abend", name: "EA FC Abend", game: "EA Sports FC 26", state: "draft" }),
  tour({ id: "t_sommer", slug: "sommer-lan", name: "Sommer-LAN", game: "Counter-Strike 2", state: "done", startsAt: at("2026-08-09T10:00:00+02:00"), teams: 16, maxTeams: 16 }),
  tour({ id: "t_fruehling", slug: "fruehlings-cup", name: "Frühlings-Cup", game: "Valorant", state: "done", startsAt: at("2026-04-26T10:00:00+02:00"), teams: 12, maxTeams: 16 }),
  tour({ id: "t_rl", slug: "rocket-league-night", name: "Rocket League Night", game: "Rocket League", state: "done", startsAt: at("2026-03-14T18:00:00+01:00"), teams: 8, maxTeams: 8 }),
  tour({ id: "t_warmup", slug: "gurten-lan-warm-up", name: "Gurten LAN Warm-up", game: "Counter-Strike 2", state: "done", startsAt: at("2026-02-15T10:00:00+01:00"), teams: 10, maxTeams: 16 }),
];

const INCIDENT: PortalBanner = {
  kind: "incident",
  title: "Störung bei Planary: Live-Resultate kommen verzögert an.",
  text: "Seit 19:58. Eure Resultate sind gespeichert, die Beamer-Ansicht holt sie nach. Wir melden uns hier, sobald es wieder läuft.",
  ref: "inc_0412",
  tournamentIds: ["t_gurten"],
};

const OVERDUE: PortalBanner = {
  kind: "overdue",
  title: "Rechnung 2026-0213 über CHF 149.00 ist seit 12 Tagen offen.",
  text: "Plus läuft bis 7. November normal weiter.",
  ref: "inv_0213",
  tournamentIds: [],
};

interface OrgStore {
  org: PortalOrg;
  billing: Omit<Billing, "plans" | "pass" | "current" | "invoices" | "paymentMethod" | "contact" | "renewsAt" | "usage" | "state">;
  tournaments: TournamentSummary[];
  wishlists: OrgWishlist[];
  invoices: Invoice[];
  paymentMethod: PaymentMethod | null;
  members: PortalMember[];
  invites: PortalInvite[];
  requests: PortalRequestDetail[];
}

function gurten(state: State): OrgStore {
  const role: MemberRole = state === "member" ? "member" : "owner";
  const overdue = state === "overdue";
  const contact: BillingContact = { email: "kasse@gurtenlan.ch", phone: "+41 31 000 00 00", address: ["Verein Gurten LAN", "z. H. Kassier", "Postfach 123", "3000 Bern"] };
  const plusLine: SubscriptionLine = { kind: "base", name: "Plus", period: "year", amount: 14900, tournamentId: null };
  const warmup: SubscriptionLine = { kind: "once", name: "Turnier-Pass · Gurten LAN Warm-up", period: "once", amount: 2900, tournamentId: "t_warmup" };
  const plusInvoice: Invoice = overdue
    ? {
        id: "inv_0213",
        number: "2026-0213",
        createdAt: at("2026-09-12T09:00:00+02:00"),
        dueAt: at("2026-10-12T23:59:00+02:00"),
        amount: 14900,
        currency: "CHF",
        status: "open",
        description: "Plus, 3.2.2026 bis 2.2.2027",
        lines: [plusLine],
        paidWith: null,
        overdueDays: 12,
        pdfUrl: "https://org.planary.ch/files/invoices/2026-0213.pdf",
        payUrl: "https://invoice.stripe.com/i/test_2026-0213",
      }
    : {
        id: "inv_0031",
        number: "2026-0031",
        createdAt: at("2026-02-03T09:00:00+01:00"),
        dueAt: at("2026-03-05T23:59:00+01:00"),
        amount: 14900,
        currency: "CHF",
        status: "paid",
        description: "Plus, 3.2.2026 bis 2.2.2027",
        lines: [plusLine],
        paidWith: "invoice",
        overdueDays: 0,
        pdfUrl: "https://org.planary.ch/files/invoices/2026-0031.pdf",
        payUrl: null,
      };
  const invoices: Invoice[] = [
    plusInvoice,
    {
      id: "inv_0009",
      number: "2026-0009",
      createdAt: at("2026-01-15T09:00:00+01:00"),
      dueAt: at("2026-01-15T23:59:00+01:00"),
      amount: 2900,
      currency: "CHF",
      status: "paid",
      description: "Turnier-Pass, Gurten LAN Warm-up",
      lines: [warmup],
      paidWith: "card",
      overdueDays: 0,
      pdfUrl: "https://org.planary.ch/files/invoices/2026-0009.pdf",
      payUrl: null,
    },
  ];
  const billingState: BillingState = overdue ? "overdue" : state === "card" ? "card_expires" : state === "canceling" ? "canceling" : "active";
  const me = state === "member" ? { ...NOA, me: true } : { ...MATTEO, me: true };
  const members: PortalMember[] = [
    { ...MATTEO, role: "owner", lastActive: NOW - 60_000, me: me.id === MATTEO.id },
    { ...NOA, role: "member", lastActive: at("2026-10-20T14:20:00+02:00"), me: me.id === NOA.id },
    { id: "u_celine", name: "Céline Favre", email: "celine.favre@example.ch", role: "member", lastActive: at("2026-10-12T19:00:00+02:00"), me: false },
  ];
  const requests: PortalRequestDetail[] = [
    {
      id: "req_1184",
      code: "REQ-1184",
      subject: "Beamer-Ansicht zeigt alte Resultate",
      topic: "tournament",
      status: "open",
      urgent: true,
      organisation: { id: "org_gurten", name: "Verein Gurten LAN" },
      from: MATTEO,
      tournament: { id: "t_gurten", name: "Gurten LAN" },
      createdAt: at("2026-10-20T20:02:00+02:00"),
      updatedAt: at("2026-10-20T20:06:00+02:00"),
      lastEvent: "Planary hat um 20:06 geantwortet",
      lastBy: "staff",
      messages: [
        {
          id: "m1",
          kind: "customer",
          author: { id: MATTEO.id, name: MATTEO.name },
          body: "Hallo, seit etwa 19:55 zeigt die Beamer-Ansicht beim Gurten LAN noch das Resultat vom Viertelfinal. Wir haben das Halbfinal 2 schon eingetragen, im Handy ist es auch richtig.\n\nNeu laden hilft nicht. Das Final startet um 21:00, es wäre super, wenn es bis dann wieder geht.",
          attachments: [{ id: "att_1", name: "beamer-foto.jpg", size: 1_840_000, type: "image/jpeg", url: "https://org.planary.ch/files/att_1" }],
          at: at("2026-10-20T20:02:00+02:00"),
        },
        {
          id: "m2",
          kind: "staff",
          author: { id: "planary", name: "Mykyta von Planary" },
          body: "Hallo Matteo, danke für die schnelle Meldung. Das liegt an einer Störung bei uns, nicht an eurem Turnier. Wir sind dran und melden uns spätestens um 20:30.\n\nEure Resultate sind gespeichert, es geht nichts verloren.",
          attachments: [],
          at: at("2026-10-20T20:06:00+02:00"),
        },
      ],
    },
    {
      id: "req_1174",
      code: "REQ-1174",
      subject: "Gruppen nachträglich ändern",
      topic: "tournament",
      status: "waiting",
      urgent: false,
      organisation: { id: "org_gurten", name: "Verein Gurten LAN" },
      from: MATTEO,
      tournament: { id: "t_winter", name: "Winter-LAN" },
      createdAt: at("2026-10-17T11:20:00+02:00"),
      updatedAt: at("2026-10-17T15:40:00+02:00"),
      lastEvent: "Wir brauchen noch eine Angabe von dir",
      lastBy: "staff",
      messages: [
        { id: "m3", kind: "customer", author: { id: MATTEO.id, name: MATTEO.name }, body: "Können wir die Gruppen nach dem Anmeldeschluss noch von Hand ändern?", attachments: [], at: at("2026-10-17T11:20:00+02:00") },
        { id: "m4", kind: "staff", author: { id: "planary", name: "Mykyta von Planary" }, body: "Ja, das geht. Welche Teams sollen getauscht werden?", attachments: [], at: at("2026-10-17T15:40:00+02:00") },
      ],
    },
    {
      id: "req_1150",
      code: "REQ-1150",
      subject: "Rechnung an die Vereinsadresse",
      topic: "billing",
      status: "done",
      urgent: false,
      organisation: { id: "org_gurten", name: "Verein Gurten LAN" },
      from: MATTEO,
      tournament: null,
      createdAt: at("2026-09-28T10:00:00+02:00"),
      updatedAt: at("2026-09-29T09:10:00+02:00"),
      lastEvent: "Erledigt am 29.09.",
      lastBy: "staff",
      messages: [
        { id: "m5", kind: "customer", author: { id: MATTEO.id, name: MATTEO.name }, body: "Bitte stellt die Rechnungen ans Postfach des Vereins aus.", attachments: [], at: at("2026-09-28T10:00:00+02:00") },
        { id: "m6", kind: "staff", author: { id: "planary", name: "Mykyta von Planary" }, body: "Erledigt. Ab der nächsten Rechnung steht das Postfach drauf.", attachments: [], at: at("2026-09-29T09:10:00+02:00") },
      ],
    },
  ];
  const banners = [...(overdue ? [OVERDUE] : []), ...(state === "incident" ? [INCIDENT] : [])];
  return {
    org: {
      id: "org_gurten",
      name: "Verein Gurten LAN",
      initials: "GL",
      slug: "gurten-lan",
      logoUrl: null,
      role,
      plan: PLANS.plus,
      services: ["tournament", "wishlist"],
      renewsAt: at("2027-02-03T00:00:00+01:00"),
      billingState,
      activePasses: 0,
      createdAt: at("2026-02-01T12:00:00+01:00"),
      contact,
      usage: { tournamentsThisYear: 7, largestTournament: 32, organisers: 3 },
      onboarding: { logo: true, team: true, tournament: true },
      banners,
      counts: { openRequests: 1, overdueInvoices: overdue ? 1 : 0 },
    },
    tournaments: TOURS,
    wishlists: [
      { id: 41, title: "Material Saison 2027", items: 6, value: 84500, shared: false, createdBy: "Matteo Keller", updatedAt: at("2026-10-19T18:40:00+02:00"), url: "https://wishlist.planary.ch/app/lists/41" },
      { id: 42, title: "Tombola Gurten LAN", items: 14, value: 61200, shared: true, createdBy: "Noa Brunner", updatedAt: at("2026-10-20T19:02:00+02:00"), url: "https://wishlist.planary.ch/app/lists/42" },
    ],
    invoices,
    paymentMethod: state === "card" ? { brand: "visa", last4: "4242", expMonth: 11, expYear: 2026, kind: "card" } : { brand: "visa", last4: "4242", expMonth: 8, expYear: 2028, kind: "card" },
    billing: {
      lines: [plusLine, warmup],
      passes: [{ id: "pass_warmup", tournamentId: "t_warmup", tournamentName: "Gurten LAN Warm-up", boughtAt: at("2026-01-15T09:00:00+01:00"), amount: 2900, state: "done", teams: 10, invoiceId: "inv_0009", receiptUrl: "https://org.planary.ch/files/invoices/2026-0009.pdf" }],
      payBy: overdue ? "invoice" : "card",
      reminderAt: at("2027-01-04T00:00:00+01:00"),
      graceUntil: overdue ? at("2026-11-07T00:00:00+01:00") : null,
      cancelAt: state === "canceling" ? at("2027-02-03T00:00:00+01:00") : null,
    },
    members,
    invites: [{ id: "inv_luca", email: "luca.steiner@example.ch", role: "member", sentAt: at("2026-10-18T09:00:00+02:00") }],
    requests,
  };
}

const LENA_MAIL = "lena@spielclub-thun.ch";

/** Spielclub Thun on Gratis: brand new, with some use, or with passes. */
function thun(kind: "new" | "gratis" | "pass" = "new"): OrgStore {
  const used = kind !== "new";
  const t = (x: Partial<TournamentSummary> & Pick<TournamentSummary, "id" | "slug" | "name" | "game" | "state">) =>
    tour({ organisationId: "org_thun", organisationName: "Spielclub Thun", ownerId: LENA.id, plan: "gratis", ...x });
  const tournaments: TournamentSummary[] = !used
    ? []
    : [
        t({ id: "t_wintercup", slug: "planary-winter-cup", name: "Planary Winter Cup", game: "Counter-Strike 2", state: "draft", startsAt: at("2026-12-12T10:00:00+01:00"), teams: 0, maxTeams: 16 }),
        t({ id: "t_herbst", slug: "thuner-herbst-cup", name: "Thuner Herbst-Cup", game: "Valorant", state: "open", startsAt: at("2026-11-14T10:00:00+01:00"), teams: kind === "pass" ? 23 : 12, maxTeams: kind === "pass" ? 128 : 16 }),
        t({ id: "t_friday", slug: "friday-night-cup", name: "Friday Night Cup", game: "Rocket League", state: "draft" }),
        t({ id: "t_fruehling_thun", slug: "fruehlings-turnier", name: "Frühlings-Turnier", game: "Valorant", state: "done", startsAt: at("2026-04-25T10:00:00+02:00"), teams: 40, maxTeams: 128 }),
      ];
  const passes: PassEntitlement[] =
    kind === "pass"
      ? [
          { id: "pass_herbst", tournamentId: "t_herbst", tournamentName: "Thuner Herbst-Cup", boughtAt: at("2026-10-12T10:00:00+02:00"), amount: 2900, state: "active", teams: 23, invoiceId: "inv_0190", receiptUrl: "https://org.planary.ch/files/invoices/2026-0190.pdf" },
          { id: "pass_fruehling", tournamentId: "t_fruehling_thun", tournamentName: "Frühlings-Turnier", boughtAt: at("2026-04-02T10:00:00+02:00"), amount: 2900, state: "done", teams: 40, invoiceId: "inv_0061", receiptUrl: "https://org.planary.ch/files/invoices/2026-0061.pdf" },
        ]
      : [];
  const invoices: Invoice[] = passes.map((x, n) => ({
    id: x.invoiceId ?? `inv_p${n}`,
    number: n ? "2026-0061" : "2026-0190",
    createdAt: x.boughtAt,
    dueAt: x.boughtAt,
    amount: x.amount,
    currency: "CHF",
    status: "paid",
    description: `Turnier-Pass, ${x.tournamentName}`,
    lines: [{ kind: "once", name: `Turnier-Pass · ${x.tournamentName}`, period: "once", amount: x.amount, tournamentId: x.tournamentId }],
    paidWith: "card",
    overdueDays: 0,
    pdfUrl: x.receiptUrl,
    payUrl: null,
  }));
  return {
    org: {
      id: "org_thun",
      name: "Spielclub Thun",
      initials: "ST",
      slug: "spielclub-thun",
      logoUrl: null,
      role: "owner",
      plan: PLANS.gratis,
      services: ["tournament", "wishlist"],
      renewsAt: null,
      billingState: "free",
      activePasses: passes.filter((x) => x.state === "active").length,
      createdAt: used ? at("2026-03-01T12:00:00+01:00") : NOW - 20 * 60_000,
      contact: { email: LENA_MAIL, phone: "", address: ["Spielclub Thun", "Lena Aebi", "Bälliz 12", "3600 Thun"] },
      usage: { tournamentsThisYear: used ? 4 : 0, largestTournament: used ? 12 : 0, organisers: 1 },
      onboarding: { logo: false, team: false, tournament: used },
      banners: [],
      counts: { openRequests: 0, overdueInvoices: 0 },
    },
    tournaments,
    wishlists: used ? [{ id: 51, title: "Preise Herbst-Cup", items: 4, value: 18000, shared: true, createdBy: "Lena Aebi", updatedAt: at("2026-10-18T18:00:00+02:00"), url: "https://wishlist.planary.ch/app/lists/51" }] : [],
    invoices,
    paymentMethod: passes.length ? { brand: "mastercard", last4: "5100", expMonth: 4, expYear: 2028, kind: "card" } : null,
    billing: {
      lines: passes.filter((x) => x.boughtAt >= at("2026-01-01T00:00:00+01:00")).map((x) => ({ kind: "once", name: `Turnier-Pass · ${x.tournamentName}`, period: "once", amount: x.amount, tournamentId: x.tournamentId })),
      passes,
      payBy: null,
      reminderAt: null,
      graceUntil: null,
      cancelAt: null,
    },
    members: [{ ...LENA, email: LENA_MAIL, role: "owner", lastActive: NOW - 60_000, me: true }],
    invites: [],
    requests: [],
  };
}

let db: { state: State; me: Person; stores: OrgStore[]; checkouts: Record<string, CheckoutStatus> } | null = null;

function data() {
  const state = fixtureState();
  if (!db || db.state !== state) {
    if (state === "none") db = { state, me: NOA, stores: [], checkouts: {} };
    else if (state === "new") db = { state, me: { ...LENA, email: LENA_MAIL }, stores: [thun("new")], checkouts: {} };
    else if (state === "gratis" || state === "pass" || state === "payfail") db = { state, me: { ...LENA, email: LENA_MAIL }, stores: [thun(state === "pass" ? "pass" : "gratis")], checkouts: {} };
    else db = { state, me: state === "member" ? NOA : MATTEO, stores: [gurten(state)], checkouts: {} };
  }
  return db;
}

class FixtureError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

function store(id: string) {
  const s = data().stores.find((x) => x.org.id === id);
  if (!s) throw new FixtureError(404, "Das gibt es nicht (mehr).", "not_found");
  return s;
}

function detail(s: OrgStore, t: TournamentSummary): PortalTournamentDetail {
  const gurtenLan = t.id === "t_gurten";
  return {
    ...t,
    createdAt: gurtenLan ? at("2026-09-02T18:00:00+02:00") : t.updatedAt - 30 * 86_400_000,
    registration: gurtenLan ? { opensAt: at("2026-09-05T12:00:00+02:00"), closesAt: at("2026-10-15T23:59:00+02:00") } : { opensAt: null, closesAt: null },
    venue: gurtenLan ? "Gurtenpark, Bern" : null,
    format: gurtenLan ? "Gruppen + K.-o. · Best of 3" : "K.-o. · Best of 1",
    organisers: gurtenLan
      ? [
          { id: MATTEO.id, name: MATTEO.name, role: "leitet" },
          { id: NOA.id, name: NOA.name, role: "trägt Resultate ein" },
        ]
      : [{ id: MATTEO.id, name: MATTEO.name, role: "leitet" }],
    played: gurtenLan ? 29 : t.state === "done" ? t.teams - 1 : 0,
    matches: gurtenLan ? 31 : Math.max(0, t.teams - 1),
    banners: s.org.banners.filter((b) => b.kind === "incident" && b.tournamentIds.includes(t.id)),
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const YEAR = 365 * 86_400_000;

function billingOf(s: OrgStore): Billing {
  const plan = s.org.plan;
  const running = s.tournaments.filter((t) => t.state === "live" || t.state === "open").length;
  return {
    plans: Object.values(PLANS),
    pass: PASS,
    current: plan.id,
    state: s.org.billingState,
    ...s.billing,
    invoices: s.invoices,
    paymentMethod: s.paymentMethod,
    contact: s.org.contact,
    renewsAt: s.org.renewsAt,
    usage: { largestTournament: s.org.usage.largestTournament, running: plan.id === "plus" ? 2 : Math.min(running, 1), organisers: s.org.usage.organisers, wishlists: s.wishlists.length },
  };
}

/** A checkout in the fixtures: paid at once (the provider is skipped), or declined in `payfail`. */
function checkout(d: NonNullable<typeof db>, s: OrgStore, body: CheckoutBody): { url: string; checkoutId: string } {
  const id = `co_${Object.keys(d.checkouts).length + 1}`;
  const plan = "plan" in body;
  const t = plan ? null : s.tournaments.find((x) => x.id === body.tournamentId);
  if (!plan && !t) throw new FixtureError(404, "Dieses Turnier gibt es in der Organisation nicht.", "not_found");
  const payBy: PayBy = plan ? body.payBy : "card";
  const failed = d.state === "payfail" && payBy === "card";
  const amount = plan ? (payBy === "invoice" ? 0 : PLANS.plus.price) : PASS.price;
  d.checkouts[id] = {
    id,
    orgId: s.org.id,
    kind: plan ? "plan" : "pass",
    state: failed ? "failed" : "paid",
    failure: failed ? "Deine Bank hat die Karte abgelehnt." : null,
    amount,
    payBy,
    tournamentId: t?.id ?? null,
    tournamentName: t?.name ?? null,
    receiptEmail: s.org.contact.email,
    receiptUrl: failed ? null : "https://org.planary.ch/files/invoices/2026-0221.pdf",
    returnTo: body.returnTo ?? null,
  };
  if (!failed && plan) {
    s.org = { ...s.org, plan: PLANS.plus, renewsAt: NOW + YEAR, billingState: "active" };
    s.billing = { ...s.billing, payBy, reminderAt: NOW + YEAR - 30 * 86_400_000, lines: [{ kind: "base", name: "Plus", period: "year", amount: PLANS.plus.price, tournamentId: null }, ...s.billing.lines] };
  }
  if (!failed && t) {
    const entitlement: PassEntitlement = { id: `pass_${id}`, tournamentId: t.id, tournamentName: t.name, boughtAt: NOW, amount: PASS.price, state: "active", teams: t.teams, invoiceId: null, receiptUrl: "https://org.planary.ch/files/invoices/2026-0221.pdf" };
    s.billing = { ...s.billing, passes: [entitlement, ...s.billing.passes], lines: [...s.billing.lines, { kind: "once", name: `Turnier-Pass · ${t.name}`, period: "once", amount: PASS.price, tournamentId: t.id }] };
    s.tournaments = s.tournaments.map((x) => (x.id === t.id ? { ...x, maxTeams: Math.max(x.maxTeams, 16) } : x));
    s.org = { ...s.org, activePasses: s.org.activePasses + 1 };
  }
  // The fixtures keep their state in the URL; the provider would bring people back here.
  return { url: `/kasse/fertig?id=${id}${d.state === "default" ? "" : `&state=${d.state}`}`, checkoutId: id };
}

export async function fixtureCall<T>(method: "GET" | "POST", rawPath: string, body?: unknown): Promise<T> {
  const d = data();
  if (d.state === "loading") return new Promise<T>(() => {});
  await delay(method === "POST" ? 250 : 60);
  if (d.state === "error" && method === "GET" && rawPath !== "/portal/me") {
    const e = new FixtureError(503, "Planary antwortet gerade nicht. Prüf deine Verbindung und versuch es nochmals.", "unavailable");
    throw Object.assign(new Error(e.message), { status: 503, code: e.code, requestId: "req_7f3a9c21", at: NOW });
  }
  const path = rawPath.split("?")[0];
  if (path.endsWith("/billing") && d.state === "billing-loading") return new Promise<T>(() => {});
  if (path.endsWith("/billing") && d.state === "billing-error") throw Object.assign(new Error("Planary antwortet gerade nicht."), { status: 503, code: "unavailable", requestId: "req_7f3a9c21", at: NOW });
  const seg = path.split("/").filter(Boolean); // ["portal", "orgs", id, ...]
  const ok = { ok: true } as T;
  try {
    if (method === "GET" && path === "/portal/me") {
      const orgs: PortalOrgSummary[] = d.stores.map((s) => ({ id: s.org.id, name: s.org.name, initials: s.org.initials, role: s.org.role, plan: s.org.plan.id, services: s.org.services }));
      return { me: d.me, orgs } as T;
    }
    if (method === "POST" && path === "/portal/orgs") {
      const b = body as { name: string; slug: string; services: OrgService[] };
      const s = thun();
      s.org = { ...s.org, id: `org_${b.slug}`, name: b.name, slug: b.slug, services: b.services, initials: b.name.slice(0, 2).toUpperCase(), createdAt: NOW };
      d.stores.push(s);
      return { id: s.org.id } as T;
    }
    if (method === "POST" && path === "/portal/checkout") {
      const b = body as CheckoutBody & { org: { name: string; email: string } };
      const slug = b.org.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const n = thun("gratis");
      n.org = { ...n.org, id: `org_${slug}`, name: b.org.name, slug, initials: b.org.name.slice(0, 2).toUpperCase(), createdAt: NOW, contact: { email: b.org.email, phone: "", address: [b.org.name] }, onboarding: { logo: false, team: false, tournament: true } };
      n.members = [{ ...d.me, role: "owner", lastActive: NOW, me: true }];
      // The solo organiser's own tournaments join the new organisation.
      n.tournaments = n.tournaments.filter((t) => t.state !== "done").map((t) => ({ ...t, organisationId: n.org.id, organisationName: n.org.name, ownerId: d.me.id }));
      d.stores.push(n);
      return { ...checkout(d, n, "pass" in b ? { ...b, tournamentId: n.tournaments.some((t) => t.id === b.tournamentId) ? b.tournamentId : n.tournaments[0].id } : b), orgId: n.org.id } as T;
    }
    if (method === "GET" && seg[1] === "checkout" && seg[2]) {
      const c = d.checkouts[seg[2]];
      if (!c) throw new FixtureError(404, "Das gibt es nicht (mehr).", "not_found");
      return c as T;
    }
    if (method === "POST" && seg[1] === "invites" && seg[3] === "accept") {
      if (!d.stores.length) d.stores.push(gurten("member"));
      return { orgId: d.stores[0].org.id } as T;
    }
    const s = store(seg[2]);
    const rest = seg.slice(3).join("/");
    if (method === "GET") {
      if (rest === "") return s.org as T;
      if (rest === "tournaments") return { tournaments: s.tournaments } as T;
      if (rest === "wishlists") {
        if (!s.org.services.includes("wishlist")) throw new FixtureError(404, "Das gibt es nicht (mehr).", "not_found");
        return { connected: true, lists: s.wishlists, maxLists: s.org.plan.wishlist.maxLists, newUrl: `https://wishlist.planary.ch/app?org=${s.org.id}` } as T;
      }
      if (seg[3] === "tournaments" && seg[4]) {
        const t = s.tournaments.find((x) => x.id === seg[4] || x.slug === seg[4]);
        if (!t) throw new FixtureError(404, "Das gibt es nicht (mehr).", "not_found");
        return detail(s, t) as T;
      }
      if (rest === "billing") return billingOf(s) as T;
      if (rest === "members") return { members: s.members, invites: s.invites, seats: s.org.plan.limits.maxOrganisers } as T;
      if (rest === "requests") return { requests: s.requests.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "messages"))) } as T;
      if (seg[3] === "requests" && seg[4]) {
        const r = s.requests.find((x) => x.id === seg[4]);
        if (!r) throw new FixtureError(404, "Das gibt es nicht (mehr).", "not_found");
        return r as T;
      }
    } else {
      if (rest === "") {
        const b = body as { name?: string; slug?: string; contact?: BillingContact; removeLogo?: true; services?: OrgService[] };
        s.org = { ...s.org, ...(b.name ? { name: b.name } : {}), ...(b.slug ? { slug: b.slug } : {}), ...(b.contact ? { contact: b.contact } : {}), ...(b.removeLogo ? { logoUrl: null } : {}), ...(b.services ? { services: b.services } : {}) };
        return ok;
      }
      if (rest === "logo") {
        const file = (body as FormData).get("file");
        const url = file instanceof File ? URL.createObjectURL(file) : null;
        s.org = { ...s.org, logoUrl: url, onboarding: { ...s.org.onboarding, logo: true } };
        return { logoUrl: url } as T;
      }
      if (rest === "delete") return { deleteAt: NOW + 30 * 86_400_000 } as T;
      if (rest === "checkout") return checkout(d, s, body as CheckoutBody) as T;
      if (rest === "billing-portal") return { url: "https://billing.stripe.com/p/session/test_fixture" } as T;
      if (rest === "pay-by") {
        s.billing = { ...s.billing, payBy: (body as { payBy: PayBy }).payBy };
        if (s.org.billingState === "card_expires") s.org = { ...s.org, billingState: "active" };
        return ok;
      }
      if (seg[3] === "invoices" && seg[5] === "pay") return { url: s.invoices.find((i) => i.id === seg[4])?.payUrl ?? "https://invoice.stripe.com/i/test_fixture" } as T;
      if (rest === "cancel") {
        const cancelAt = s.org.renewsAt ?? NOW;
        s.org = { ...s.org, billingState: "canceling" };
        s.billing = { ...s.billing, cancelAt };
        return { cancelAt } as T;
      }
      if (rest === "cancel/undo") {
        s.org = { ...s.org, billingState: "active" };
        s.billing = { ...s.billing, cancelAt: null };
        return ok;
      }
      if (rest === "invites") {
        const b = body as { email: string; role: MemberRole };
        if (s.members.length + s.invites.length >= s.org.plan.limits.maxOrganisers) throw new FixtureError(409, "Alle Plätze im Plan sind belegt.", "seats_full");
        s.invites = [...s.invites, { id: `inv_${s.invites.length + 1}`, email: b.email, role: b.role, sentAt: NOW }];
        return ok;
      }
      if (seg[3] === "invites" && seg[5] === "withdraw") {
        s.invites = s.invites.filter((i) => i.id !== seg[4]);
        return ok;
      }
      if (seg[3] === "invites" && seg[5] === "resend") return ok;
      if (seg[3] === "members" && seg[5] === "remove") {
        s.members = s.members.filter((m) => m.id !== seg[4]);
        return ok;
      }
      if (seg[3] === "members" && seg[4]) {
        const role = (body as { role: MemberRole }).role;
        s.members = s.members.map((m) => (m.id === seg[4] ? { ...m, role } : m));
        return ok;
      }
      if (rest === "requests") {
        const f = body as FormData;
        const text = String(f.get("body") ?? "");
        const tid = String(f.get("tournamentId") ?? "");
        const t = s.tournaments.find((x) => x.id === tid);
        const n = 1185 + s.requests.length;
        const files = f.getAll("files").filter((x): x is File => x instanceof File);
        const r: PortalRequestDetail = {
          id: `req_${n}`,
          code: `REQ-${n}`,
          subject: String(f.get("subject") || text.split("\n")[0]).slice(0, 120),
          topic: (String(f.get("topic")) as PortalRequestDetail["topic"]) || "other",
          status: "open",
          urgent: f.get("urgent") === "1",
          organisation: { id: s.org.id, name: s.org.name },
          from: d.me,
          tournament: t ? { id: t.id, name: t.name } : null,
          createdAt: NOW,
          updatedAt: NOW,
          lastEvent: "Gesendet um 20:11",
          lastBy: "customer",
          messages: [{ id: `m_${n}`, kind: "customer", author: { id: d.me.id, name: d.me.name }, body: text, attachments: files.map((x, i) => ({ id: `att_${n}_${i}`, name: x.name, size: x.size, type: x.type, url: URL.createObjectURL(x) })), at: NOW }],
        };
        s.requests = [r, ...s.requests];
        s.org = { ...s.org, counts: { ...s.org.counts, openRequests: s.org.counts.openRequests + 1 } };
        return { id: r.id } as T;
      }
      if (seg[3] === "requests" && seg[5] === "messages") {
        const f = body instanceof FormData ? body : null;
        const text = f ? String(f.get("body") ?? "") : (body as { body: string }).body;
        const files = f ? f.getAll("files").filter((x): x is File => x instanceof File) : [];
        s.requests = s.requests.map((r) =>
          r.id === seg[4]
            ? { ...r, status: "open", updatedAt: NOW, lastBy: "customer", lastEvent: "Gesendet um 20:11", messages: [...r.messages, { id: `m_${r.messages.length + 1}`, kind: "customer", author: { id: d.me.id, name: d.me.name }, body: text, attachments: files.map((x, i) => ({ id: `att_r${i}`, name: x.name, size: x.size, type: x.type, url: URL.createObjectURL(x) })), at: NOW }] }
            : r,
        );
        return ok;
      }
      if (seg[3] === "requests" && seg[5] === "done") {
        s.requests = s.requests.map((r) => (r.id === seg[4] ? { ...r, status: "done", lastEvent: "Erledigt am 20.10." } : r));
        return ok;
      }
    }
  } catch (e) {
    if (e instanceof FixtureError) throw Object.assign(new Error(e.message), { status: e.status, code: e.code, requestId: "req_fixture", at: NOW });
    throw e;
  }
  throw Object.assign(new Error(`Keine Fixture für ${method} ${path}.`), { status: 404, code: "not_found", requestId: "req_fixture", at: NOW });
}
