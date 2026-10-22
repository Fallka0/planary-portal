"use client";

import Link from "next/link";
import { useEnableService } from "@/components/services";
import { usePageBusy, usePortal } from "@/components/Shell";
import { included, includedWishlist, planPrice, REQUEST_STATE, tourLabel, tourTeams, TOURNAMENT_STATE } from "@/components/status";
import { Chip, Empty, ErrorCard, Ic, Loading, PageHead, Sk } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { TOURNAMENT_URL, WISHLIST_URL } from "@/lib/auth";
import { chf, longDate, num, sameDay, time, tourDate } from "@/lib/fmt";
import { now, type OrgError, useOrg } from "@/lib/org";
import { SERVICE_IDS, SERVICES } from "@/lib/services";
import type { PortalApi, PortalOrg, TournamentSummary } from "@/lib/org-contract";

function TRow({ t, nowMs }: { t: TournamentSummary; nowMs: number }) {
  const s = TOURNAMENT_STATE[t.state];
  const done = t.state === "done";
  return (
    <Link className="trow" href={`/turniere/${t.id}`}>
      <b>{t.name}</b>
      <Chip chip={done ? "" : s.chip} dot={done ? null : s.dot}>
        {tourLabel(t)}
      </Chip>
      <span className="s">
        {tourDate(t.startsAt, t.endsAt, nowMs)} · {t.game} · {tourTeams(t)} Teams
      </span>
    </Link>
  );
}

interface Step {
  t: string;
  p: string;
  done: boolean;
  cta?: { label: string; href: string; external?: boolean };
}

function Welcome({ org, name, wishlistStarted }: { org: PortalOrg; name: string; wishlistStarted: boolean }) {
  const c = PORTAL.newOrg.steps;
  const steps: Step[] = [
    { t: c[0].t, p: c[0].p, done: true },
    { t: c[1].t, p: c[1].p, done: org.onboarding.logo, cta: { label: "Logo hochladen", href: "/einstellungen" } },
    { t: c[2].t, p: c[2].p, done: org.onboarding.team, cta: { label: "Einladen", href: "/team" } },
  ];
  if (org.services.includes("tournament")) {
    steps.push({ t: c[3].t, p: c[3].p, done: org.onboarding.tournament, cta: { label: PORTAL.create, href: `${TOURNAMENT_URL}/neu?org=${org.id}`, external: true } });
  }
  if (org.services.includes("wishlist")) {
    steps.push({
      t: "Erste Wunschliste anlegen",
      p: "Für Material oder ein Fest.",
      done: wishlistStarted,
      cta: { label: "Wunschliste erstellen", href: `${WISHLIST_URL}/app?org=${org.id}`, external: true },
    });
  }
  return (
    <section className="welcome" aria-labelledby="wl-h">
      <div>
        <h2 id="wl-h">Willkommen, {name.split(" ")[0]}.</h2>
        <p className="l">{org.name} ist eingerichtet.</p>
      </div>
      <ol className="ob">
        {steps.map((step, i) => (
          <li key={step.t} className={step.done ? "done" : ""}>
            <span className="n">{step.done ? <Ic name="check" small /> : i + 1}</span>
            <div>
              <b>
                {step.t}
                {step.done ? <span className="sr"> (erledigt)</span> : null}
              </b>
              <span className="s">{step.p}</span>
            </div>
            {step.cta && !step.done ? (
              step.cta.external ? (
                <a className="btn btn-ink btn-s" href={step.cta.href}>
                  {step.cta.label}
                </a>
              ) : (
                <Link className="btn btn-line btn-s" href={step.cta.href}>
                  {step.cta.label}
                </Link>
              )
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function PlanCard({ org }: { org: PortalOrg }) {
  const free = org.plan.id === "gratis";
  return (
    <section className={`plan${free ? " free" : ""}`} aria-labelledby="pn-h">
      <p className="plan-l">{PORTAL.overview.plan}</p>
      <h2 id="pn-h" className="plan-n">
        {org.plan.name}
        <small>
          {planPrice(org.plan)}
          {org.plan.period === "month_yearly" ? ", jährlich" : ""}
        </small>
      </h2>
      <div>
        <p className="plan-l" style={{ marginBottom: 10 }}>
          {PORTAL.overview.included}
        </p>
        {SERVICE_IDS.filter((id) => org.services.includes(id)).map((id) => (
          <div key={id} className="plan-svc">
            {org.services.length > 1 ? <p className="plan-sv">{SERVICES[id].name}</p> : null}
            <ul>
              {(id === "tournament" ? included(org.plan.limits) : includedWishlist(org.plan.wishlist)).map((x) => (
                <li key={x}>
                  <Ic name="check" small />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="plan-f">
        <span>{org.renewsAt ? `Nächste Rechnung am ${longDate(org.renewsAt)}` : free ? "Kein Abo, keine Rechnung" : "Keine weitere Rechnung geplant"}</span>
        {org.role === "owner" ? (
          <Link className="alink" href="/abrechnung">
            {free ? "Pläne vergleichen" : PORTAL.overview.change}
            <Ic name="arrow-r" small />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function Usage({ org, wishlists }: { org: PortalOrg; wishlists: number | null }) {
  const l = org.plan.limits;
  const u = org.usage;
  const tournament = org.services.includes("tournament");
  const rows = [
    ...(tournament ? [
    {
      l: "Turniere",
      v: num(u.tournamentsThisYear),
      s: l.maxRunning === null ? `unbegrenzt im Plan ${org.plan.name}` : `${l.maxRunning === 1 ? "eines" : num(l.maxRunning)} gleichzeitig im Plan ${org.plan.name}`,
      pct: null as number | null,
    },
    {
      l: "Grösstes Turnier",
      v: u.largestTournament ? `${num(u.largestTournament)} Teams` : "–",
      s: u.largestTournament ? `von ${l.maxTeams}` : `bis ${l.maxTeams} Teams`,
      pct: u.largestTournament / l.maxTeams,
    },
    ] : []),
    ...(wishlists !== null
      ? [
          {
            l: "Wunschlisten",
            v: num(wishlists),
            s: org.plan.wishlist.maxLists === null ? `unbegrenzt im Plan ${org.plan.name}` : `von ${org.plan.wishlist.maxLists}`,
            pct: org.plan.wishlist.maxLists === null ? null : wishlists / org.plan.wishlist.maxLists,
          },
        ]
      : []),
    { l: tournament ? "Organisatoren" : "Mitglieder", v: num(u.organisers), s: `von ${l.maxOrganisers}`, pct: u.organisers / l.maxOrganisers },
  ];
  return (
    <section className="box" aria-labelledby="us-h">
      <div className="box-h">
        <h2 id="us-h" className="box-t">
          Nutzung {new Date(now()).getFullYear()}
        </h2>
      </div>
      <div className="use">
        {rows.map((r) => (
          <div className="use-r" key={r.l}>
            <div className="use-h">
              <b>{r.l}</b>
              <span>{r.s}</span>
            </div>
            <span className="use-v">{r.v}</span>
            {r.pct !== null ? (
              <span className="meter" role="img" aria-label={`${Math.round(Math.min(1, r.pct) * 100)} Prozent`}>
                <i style={{ width: `${Math.round(Math.min(1, r.pct) * 100)}%` }} />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function OpenRequest({ orgId, nowMs }: { orgId: string; nowMs: number }) {
  const { data } = useOrg<PortalApi["GET /portal/orgs/:id/requests"]["R"]>(`/portal/orgs/${orgId}/requests`, 60_000);
  const r = data?.requests.find((x) => x.status !== "done");
  if (!r) return null;
  const st = REQUEST_STATE[r.status];
  return (
    <Link className="reqcard" href={`/support/${r.id}`}>
      <span className="box-s">
        {r.status === "waiting" ? st.label : PORTAL.overview.openReq} · {r.code}
      </span>
      <b>{r.subject}</b>
      <span className="s">
        <Ic name="reply" small />
        {r.lastBy === "staff" ? PORTAL.overview.replied : "Du hast geschrieben"} · {sameDay(r.updatedAt, nowMs) ? time(r.updatedAt) : longDate(r.updatedAt)}
      </span>
    </Link>
  );
}

function Tournaments({ org, data, error, reload, nowMs }: { org: PortalOrg; data: TournamentsR | null; error: OrgError | null; reload: () => void; nowMs: number }) {
  const all = data?.tournaments ?? [];
  const upcoming = all.filter((x) => x.state !== "done");
  const past = all.filter((x) => x.state === "done").slice(0, 3);
  const create = `${TOURNAMENT_URL}/neu?org=${org.id}`;
  return (
    <>
      <section className="box" aria-labelledby="up-h">
        <div className="box-h">
          <h2 id="up-h" className="box-t">
            {PORTAL.overview.upcoming}
          </h2>
          <Link className="alink" href="/turniere">
            {PORTAL.overview.all}
            <Ic name="arrow-r" small />
          </Link>
        </div>
        {error && !data ? (
          <ErrorCard title="Die Turniere haben nicht geladen" error={error} onRetry={reload} />
        ) : upcoming.length ? (
          <div>
            {upcoming.map((x) => (
              <TRow key={x.id} t={x} nowMs={nowMs} />
            ))}
          </div>
        ) : (
          <Empty
            icon="trophy"
            title={all.length ? "Nichts geplant" : PORTAL.newOrg.emptyH}
            action={
              <a className="btn btn-ink btn-s" href={create}>
                {PORTAL.create}
              </a>
            }
          >
            {all.length ? "Gerade ist nichts geplant." : PORTAL.newOrg.emptyP}
          </Empty>
        )}
      </section>
      {past.length ? (
        <section className="box" aria-labelledby="pa-h">
          <div className="box-h">
            <h2 id="pa-h" className="box-t">
              {PORTAL.overview.past}
            </h2>
          </div>
          <div>
            {past.map((x) => (
              <TRow key={x.id} t={x} nowMs={nowMs} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Wishlists({ org, data, error, reload }: { org: PortalOrg; data: WishlistsR | null; error: OrgError | null; reload: () => void }) {
  const newUrl = data?.newUrl ?? `${WISHLIST_URL}/app?org=${org.id}`;
  const full = !!data && data.maxLists !== null && data.lists.length >= data.maxLists;
  return (
    <section className="box" aria-labelledby="wi-h">
      <div className="box-h">
        <h2 id="wi-h" className="box-t">
          Wunschlisten
        </h2>
        <Link className="alink" href="/wunschlisten">
          Alle Wunschlisten
          <Ic name="arrow-r" small />
        </Link>
      </div>
      {error && !data ? (
        <ErrorCard title="Die Wunschlisten haben nicht geladen" error={error} onRetry={reload} />
      ) : data && !data.connected ? (
        <p className="box-s">Wishlist antwortet gerade nicht.</p>
      ) : data?.lists.length ? (
        <div>
          {data.lists.slice(0, 4).map((l) => (
            <a className="trow" key={l.id} href={l.url}>
              <b>{l.title}</b>
              <Chip chip={l.shared ? "" : "chip-line"} dot={null}>
                <Ic name={l.shared ? "globe" : "lock"} small />
                {l.shared ? "Per Link geteilt" : "Nur das Team"}
              </Chip>
              <span className="s">
                {num(l.items)} {l.items === 1 ? "Eintrag" : "Einträge"}
                {l.value ? ` · ${chf(l.value)}` : ""}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <Empty
          icon="gift"
          title="Noch keine Wunschlisten"
          action={
            full ? undefined : (
              <a className="btn btn-ink btn-s" href={newUrl}>
                Wunschliste erstellen
              </a>
            )
          }
        >
          Für Material, Spenden oder ein Fest.
        </Empty>
      )}
    </section>
  );
}

/** The services the organisation doesn't use yet, with a switch for owners. */
function MoreServices({ org }: { org: PortalOrg }) {
  const { isOwner } = usePortal();
  const { enable, busy } = useEnableService();
  const off = SERVICE_IDS.filter((id) => !org.services.includes(id));
  if (!off.length) return null;
  return (
    <section className="box" aria-labelledby="ms-h">
      <div className="box-h">
        <h2 id="ms-h" className="box-t">
          Weitere Dienste
        </h2>
      </div>
      <div className="svc-more">
        {off.map((id) => (
          <div key={id} className="svc-row">
            <span className="svc-ic" aria-hidden="true">
              <Ic name={SERVICES[id].icon} />
            </span>
            <div className="grow">
              <b>{SERVICES[id].name}</b>
              <span className="s">{SERVICES[id].what}</span>
            </div>
            {isOwner ? (
              <button className="btn btn-line btn-s" type="button" disabled={busy} onClick={() => enable(id)}>
                Einschalten
              </button>
            ) : null}
          </div>
        ))}
        {!isOwner ? <p className="box-s">Einschalten können die Inhaber.</p> : null}
      </div>
    </section>
  );
}

type TournamentsR = PortalApi["GET /portal/orgs/:id/tournaments"]["R"];
type WishlistsR = PortalApi["GET /portal/orgs/:id/wishlists"]["R"];

export default function OverviewPage() {
  const { org, me } = usePortal();
  const t = now();
  const hasTournament = org.services.includes("tournament");
  const hasWishlist = org.services.includes("wishlist");
  const tq = useOrg<TournamentsR>(hasTournament ? `/portal/orgs/${org.id}/tournaments` : null, 30_000);
  const wq = useOrg<WishlistsR>(hasWishlist ? `/portal/orgs/${org.id}/wishlists` : null, 60_000);
  const loading = (hasTournament && !tq.data && !tq.error) || (hasWishlist && !wq.data && !wq.error);
  usePageBusy(loading);
  const wishlistCount = hasWishlist && wq.data?.connected ? wq.data.lists.length : null;
  const tournamentStarted = org.onboarding.tournament || org.usage.tournamentsThisYear > 0;
  const wishlistStarted = (wishlistCount ?? 0) > 0;
  // Welcome until any service the organisation uses has its first tournament or list.
  const fresh = !(hasTournament && tournamentStarted) && !(hasWishlist && wishlistStarted);
  const members = org.usage.organisers;
  const sub = [
    `Plan ${org.plan.name}`,
    `${num(members)} ${members === 1 ? "Mitglied" : "Mitglieder"}`,
    hasTournament && org.usage.tournamentsThisYear
      ? `${num(org.usage.tournamentsThisYear)} ${org.usage.tournamentsThisYear === 1 ? "Turnier" : "Turniere"} ${new Date(t).getFullYear()}`
      : sameDay(org.createdAt, t)
        ? "seit heute"
        : `seit ${longDate(org.createdAt)}`,
  ].join(" · ");

  return (
    <>
      <PageHead title={org.name} sub={sub}>
        {hasTournament ? (
          <a className="btn btn-ink" href={`${TOURNAMENT_URL}/neu?org=${org.id}`}>
            <Ic name="plus" small />
            {PORTAL.create}
          </a>
        ) : null}
        {hasWishlist ? (
          <a className={`btn ${hasTournament ? "btn-line" : "btn-ink"}`} href={wq.data?.newUrl ?? `${WISHLIST_URL}/app?org=${org.id}`}>
            <Ic name="plus" small />
            Wunschliste erstellen
          </a>
        ) : null}
      </PageHead>
      {loading ? (
        // One swap from placeholder to content, so nothing below moves while the lists load.
        <Loading label="Übersicht wird geladen">
          <div className="g3 sec">
            <div className="stack">
              <Sk h={260} />
              <Sk h={250} />
            </div>
            <div className="stack">
              <Sk h={380} r={22} />
              <Sk h={250} />
            </div>
          </div>
        </Loading>
      ) : (
        <>
          {fresh ? <Welcome org={org} name={me.name} wishlistStarted={wishlistStarted} /> : null}
          <div className="g3 sec">
            <div className="stack">
              {hasTournament ? <Tournaments org={org} data={tq.data} error={tq.error} reload={tq.reload} nowMs={t} /> : null}
              {hasWishlist ? <Wishlists org={org} data={wq.data} error={wq.error} reload={wq.reload} /> : null}
              <MoreServices org={org} />
            </div>
            <div className="stack">
              <PlanCard org={org} />
              <Usage org={org} wishlists={wishlistCount} />
              <OpenRequest orgId={org.id} nowMs={t} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
