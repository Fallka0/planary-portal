"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { PORTAL } from "@/design/portal-copy";
import { AUTH_BASE_URL } from "@/lib/auth";
import { currentOrgSnapshot, serverOrgSnapshot, setCurrentOrg, subscribeCurrentOrg } from "@/lib/current-org";
import { initials } from "@/lib/fmt";
import { useOrg } from "@/lib/org";
import type { OrgError } from "@/lib/org";
import type { Person, PortalApi, PortalOrg, PortalOrgSummary } from "@/lib/org-contract";
import { ROLE } from "./status";
import { Empty, ErrorCard, Ic, Mark, MarkSprite, PageHead, Sk } from "./ui";

interface Base {
  me: Person;
  orgs: PortalOrgSummary[];
  toast: (text: string, tone?: "err") => void;
  setPageBusy: (busy: boolean) => void;
}

interface Portal extends Base {
  org: PortalOrg;
  isOwner: boolean;
}

const BaseCtx = createContext<Base | null>(null);
const PortalCtx = createContext<Portal | null>(null);

/** The signed-in person and their organisations (for pages that work without one, like /neu). */
export function usePortalBase() {
  const ctx = useContext(BaseCtx);
  if (!ctx) throw new Error("usePortalBase must be used inside <Shell>");
  return ctx;
}

/** Pages report while their data loads: the shell draws the progress line and holds the footer back. */
export function usePageBusy(busy: boolean) {
  const { setPageBusy } = usePortalBase();
  useEffect(() => {
    setPageBusy(busy);
    return () => setPageBusy(false);
  }, [busy, setPageBusy]);
}

/** The current organisation, loaded. */
export function usePortal() {
  const ctx = useContext(PortalCtx);
  if (!ctx) throw new Error("usePortal must be used inside <Shell> with an organisation");
  return ctx;
}

/** Areas only owners see (open question 8): Abrechnung and Einstellungen. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isOwner } = usePortal();
  if (isOwner) return <>{children}</>;
  return (
    <Empty
      icon="lock"
      title="Nur für Inhaber"
      action={
        <Link className="btn btn-line btn-s" href="/">
          Zur Übersicht
        </Link>
      }
    >
      Das verwalten die Inhaber.
    </Empty>
  );
}

const TAB_HREF: Record<string, string> = {
  overview: "/",
  tournaments: "/turniere",
  wishlists: "/wunschlisten",
  billing: "/abrechnung",
  team: "/team",
  support: "/support",
  settings: "/einstellungen",
};

function tabOf(path: string) {
  const first = path.split("/")[1] ?? "";
  return Object.entries(TAB_HREF).find(([, href]) => href !== "/" && href.slice(1) === first)?.[0] ?? (first === "" ? "overview" : null);
}

const noop = () => () => {};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button className="ib" type="button" aria-label={dark ? PORTAL.theme.light : PORTAL.theme.dark} onClick={() => setTheme(dark ? "light" : "dark")}>
      <Ic name={dark ? "sun" : "moon"} />
    </button>
  );
}

function OrgSwitch({ org, orgs }: { org: PortalOrgSummary | PortalOrg | null; orgs: PortalOrgSummary[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);
  if (!org) return null;
  return (
    <div className="orgm" ref={box}>
      <button className="orgsw" type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="logo" aria-hidden="true">
          {/* Logos are the organisation's own uploads (R2 or a local preview); next/image adds nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {"logoUrl" in org && org.logoUrl ? <img src={org.logoUrl} alt="" /> : org.initials}
        </span>
        <span className="n">
          <span className="sr">{PORTAL.switchOrg}: </span>
          {org.name}
        </span>
        <Ic name="chev-d" small />
      </button>
      {open ? (
        <div className="orgm-l">
          {orgs.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-current={o.id === org.id ? "true" : undefined}
              onClick={() => {
                setCurrentOrg(o.id);
                setOpen(false);
              }}
            >
              <span className="logo">{o.initials}</span>
              <span className="grow">
                {o.name}
                <span className="s">{ROLE[o.role]}</span>
              </span>
              {o.id === org.id ? <Ic name="check" small /> : null}
            </button>
          ))}
          <hr />
          <Link href="/neu" onClick={() => setOpen(false)}>
            <Ic name="plus" small />
            Neue Organisation
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Banners({ org }: { org: PortalOrg }) {
  return (
    <>
      {org.banners
        .filter((b) => b.kind === "overdue")
        .map((b) => (
          <div className="pbanner warn" role="status" key={b.ref}>
            <Ic name="alert" />
            <span className="grow">
              <b>{b.title}</b> {b.text}
            </span>
            <Link className="btn btn-ink btn-s" href="/abrechnung">
              {PORTAL.overdue.cta}
            </Link>
          </div>
        ))}
      {org.banners
        .filter((b) => b.kind === "incident")
        .map((b) => (
          <div className="pbanner warn" role="status" key={b.ref}>
            <Ic name="info" />
            <span className="grow">
              <b>{b.title}</b> {b.text}
            </span>
          </div>
        ))}
    </>
  );
}

function Tabs({ org, role }: { org: PortalOrg | null; role: PortalOrg["role"] | null }) {
  const path = usePathname();
  const active = tabOf(path);
  // Until the role is known, show every tab: most people here are owners, and nothing jumps for them.
  const owner = role !== "member";
  // A service's tab shows while the organisation uses it (and before that's known, Tournament's).
  const uses = (id: string) => (id === "tournaments" ? !org || org.services.includes("tournament") : id === "wishlists" ? !!org?.services.includes("wishlist") : true);
  return (
    <nav className="ptabs" aria-label="Portal">
      {PORTAL.tabs
        .filter((t) => (owner || (t.id !== "billing" && t.id !== "settings")) && (uses(t.id) || active === t.id))
        .map((t) => {
          const n = !org ? 0 : t.id === "support" ? org.counts.openRequests : t.id === "billing" ? org.counts.overdueInvoices : 0;
          return (
            <Link key={t.id} className={`ptab${active === t.id ? " on" : ""}`} href={TAB_HREF[t.id]} aria-current={active === t.id ? "page" : undefined}>
              {t.label}
              {n ? (
                <span className={`n${t.id === "billing" ? " warn" : ""}`}>
                  {n}
                  <span className="sr">{t.id === "billing" ? " Rechnung offen" : " offen"}</span>
                </span>
              ) : null}
            </Link>
          );
        })}
    </nav>
  );
}

function Frame({
  me,
  org,
  current,
  orgs,
  busy,
  tabs,
  slim,
  children,
}: {
  me: Person | null;
  org: PortalOrg | null;
  current: PortalOrgSummary | PortalOrg | null;
  orgs: PortalOrgSummary[];
  busy: boolean;
  tabs: boolean;
  /** Checkout: wordmark, theme and account only. No organisation switcher, tabs or banners. */
  slim: boolean;
  children: ReactNode;
}) {
  return (
    <div className="pl">
      <MarkSprite />
      <div className="site">
        <a className="skip" href="#main">
          Zum Inhalt springen
        </a>
        <header className="top">
          <div className="brand">
            <a className="wm" href="https://planary.ch" aria-label="Planary">
              <Mark />
              <span>Planary</span>
            </a>
            <span className="app-n">{PORTAL.app}</span>
          </div>
          {slim ? null : <OrgSwitch org={current} orgs={orgs} />}
          <div className="top-r">
            <ThemeToggle />
            {me ? (
              <a className="av av-l av-ink" href={AUTH_BASE_URL}>
                <span aria-hidden="true">{initials(me.name)}</span>
                <span className="sr">Konto von {me.name}</span>
              </a>
            ) : (
              <span className="av av-l" aria-hidden="true" />
            )}
          </div>
        </header>
        {busy ? <span className="prog-top" aria-hidden="true" /> : null}
        {tabs && !slim ? <Tabs org={org} role={org?.role ?? current?.role ?? null} /> : null}
        {org && !slim ? <Banners org={org} /> : null}
        <main className="pmain" id="main" tabIndex={-1}>
          {children}
        </main>
        {/* The footer waits for the page, so it doesn't slide down while content arrives. */}
        {busy ? null : (
          <footer className="pfoot">
            <span>{PORTAL.footer.copy}</span>
            <nav aria-label="Rechtliches">
              {PORTAL.footer.links.map(([label, href]) => (
                <a key={href} className="ul" href={href}>
                  {label}
                </a>
              ))}
            </nav>
          </footer>
        )}
      </div>
    </div>
  );
}

function Toast({ text, tone, onDone }: { text: string; tone?: "err"; onDone: () => void }) {
  useEffect(() => {
    if (tone === "err") return;
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone, tone, text]);
  return (
    <div className={`toast${tone ? ` ${tone}` : ""}`} role={tone ? "alert" : "status"} onClick={onDone}>
      {text}
    </div>
  );
}

/** Titles that don't depend on data, so they show while the organisation loads. */
const TITLES: Record<string, string> = {
  "/turniere": PORTAL.tournaments.h,
  "/wunschlisten": "Wunschlisten",
  "/abrechnung": PORTAL.billing.h,
  "/abrechnung/rechnungen": PORTAL.billing.h,
  "/abrechnung/wechseln": PORTAL.billing.h,
  "/team": PORTAL.team.h,
  "/support": PORTAL.support.h,
  "/support/neu": PORTAL.newReq.h,
  "/einstellungen": PORTAL.settings.h,
};

function PageSkeleton({ title, sub }: { title?: string; sub?: boolean }) {
  return (
    <>
      <p className="sr" role="status">
        Wird geladen
      </p>
      {/* The overview has a sub line under the organisation name; keep its room. */}
      <PageHead title={title ?? "\u00a0"} sub={sub ? "\u00a0" : undefined} />
      <div className="stack" aria-hidden="true">
        <div className="g3">
          <Sk h={420} />
          <Sk h={420} r={22} />
        </div>
      </div>
    </>
  );
}

/** Pages that work before an organisation exists or is chosen. */
const WITHOUT_ORG = /^\/(neu|einladung|kasse)(\/|$)/;
/** Checkout and its done page: slim chrome. */
const SLIM = /^\/kasse(\/|$)/;

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [note, setNote] = useState<{ text: string; tone?: "err"; id: number } | null>(null);
  const toast = useCallback((text: string, tone?: "err") => setNote({ text, tone, id: Date.now() }), []);
  const clear = useCallback(() => setNote(null), []);
  const [pageBusy, setPageBusy] = useState(false);
  const stored = useSyncExternalStore(subscribeCurrentOrg, currentOrgSnapshot, serverOrgSnapshot);

  const meQ = useOrg<PortalApi["GET /portal/me"]["R"]>("/portal/me");
  const orgs = meQ.data?.orgs ?? [];
  const orgId = meQ.data ? ((orgs.find((o) => o.id === stored) ?? orgs[0])?.id ?? null) : null;
  const orgQ = useOrg<PortalOrg>(orgId ? `/portal/orgs/${orgId}` : null, 60_000);
  const free = WITHOUT_ORG.test(path);
  const summaryName = orgs.find((o) => o.id === orgId)?.name;
  const skeletonTitle = TITLES[path] ?? (path === "/" ? summaryName : undefined);

  const base: Base | null = meQ.data ? { me: meQ.data.me, orgs, toast, setPageBusy } : null;
  const org = orgQ.data && orgQ.data.id === orgId ? orgQ.data : null;

  let body: ReactNode;
  if (meQ.error && !meQ.data) body = <ErrorCard title="Das Portal hat nicht geladen" error={meQ.error as OrgError} onRetry={meQ.reload} />;
  else if (!base) body = <PageSkeleton title={TITLES[path]} sub={path === "/"} />;
  else if (free) body = children;
  else if (!orgId)
    body = (
      <Empty
        icon="org"
        title="Noch keine Organisation"
        action={
          <Link className="btn btn-ink btn-s" href="/neu">
            Organisation erstellen
          </Link>
        }
      >
        Leg eine an oder öffne deine Einladung.
      </Empty>
    );
  else if (orgQ.error && !org) body = <ErrorCard title="Die Organisation hat nicht geladen" error={orgQ.error} onRetry={orgQ.reload} />;
  else if (!org) body = <PageSkeleton title={skeletonTitle} sub={path === "/"} />;
  else body = children;

  const summary = org ?? (orgId ? orgs.find((o) => o.id === orgId) : null) ?? null;
  return (
    <BaseCtx.Provider value={base}>
      <PortalCtx.Provider value={org && base ? { ...base, org, isOwner: org.role === "owner" } : null}>
        <Frame me={base?.me ?? null} org={free ? null : org} current={summary} orgs={orgs} busy={!base || (!free && !!orgId && !org && !orgQ.error) || pageBusy} tabs={!free && (!base || !!orgId)} slim={SLIM.test(path)}>
          {body}
        </Frame>
        {note ? <Toast key={note.id} text={note.text} tone={note.tone} onDone={clear} /> : null}
      </PortalCtx.Provider>
    </BaseCtx.Provider>
  );
}
