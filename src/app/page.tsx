"use client";

import Link from "next/link";
import { usePageBusy, usePortal } from "@/components/Shell";
import { included, planPrice, REQUEST_STATE, tourLabel, tourTeams, TOURNAMENT_STATE } from "@/components/status";
import { Chip, Empty, ErrorCard, Ic, Loading, PageHead, Sk } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { TOURNAMENT_URL } from "@/lib/auth";
import { longDate, num, sameDay, time, tourDate } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
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

function Welcome({ org, name }: { org: PortalOrg; name: string }) {
  const c = PORTAL.newOrg;
  const done = [true, org.onboarding.logo, org.onboarding.team, org.onboarding.tournament];
  const href: Record<string, string> = { settings: "/einstellungen", team: "/team", create: `${TOURNAMENT_URL}/neu?org=${org.id}` };
  return (
    <section className="welcome" aria-labelledby="wl-h">
      <div>
        <h2 id="wl-h">Willkommen, {name.split(" ")[0]}.</h2>
        <p className="l">{org.name} ist eingerichtet. Vier Schritte, dann läuft euer erstes Turnier.</p>
      </div>
      <ol className="ob">
        {c.steps.map((step, i) => {
          const isDone = done[i];
          const cta = "cta" in step && !isDone ? step : null;
          return (
            <li key={step.t} className={isDone ? "done" : ""}>
              <span className="n">{isDone ? <Ic name="check" small /> : i + 1}</span>
              <div>
                <b>
                  {step.t}
                  {isDone ? <span className="sr"> (erledigt)</span> : null}
                </b>
                <span className="s">{step.p}</span>
              </div>
              {cta ? (
                cta.go === "create" ? (
                  <a className="btn btn-ink btn-s" href={href.create}>
                    {cta.cta}
                  </a>
                ) : (
                  <Link className="btn btn-line btn-s" href={href[cta.go]}>
                    {cta.cta}
                  </Link>
                )
              ) : null}
            </li>
          );
        })}
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
        <ul>
          {included(org.plan.limits).map((x) => (
            <li key={x}>
              <Ic name="check" small />
              {x}
            </li>
          ))}
        </ul>
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

function Usage({ org }: { org: PortalOrg }) {
  const l = org.plan.limits;
  const u = org.usage;
  const rows = [
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
    { l: "Organisatoren", v: num(u.organisers), s: `von ${l.maxOrganisers}`, pct: u.organisers / l.maxOrganisers },
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

export default function OverviewPage() {
  const { org, me } = usePortal();
  const t = now();
  const { data, error, reload } = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(`/portal/orgs/${org.id}/tournaments`, 30_000);
  usePageBusy(!data && !error);
  const fresh = !org.onboarding.tournament && org.usage.tournamentsThisYear === 0;
  const all = data?.tournaments ?? [];
  const upcoming = all.filter((x) => x.state !== "done");
  const past = all.filter((x) => x.state === "done").slice(0, 3);
  const members = org.usage.organisers;
  const sub = [
    `Plan ${org.plan.name}`,
    `${num(members)} ${members === 1 ? "Mitglied" : "Mitglieder"}`,
    org.usage.tournamentsThisYear
      ? `${num(org.usage.tournamentsThisYear)} ${org.usage.tournamentsThisYear === 1 ? "Turnier" : "Turniere"} ${new Date(t).getFullYear()}`
      : sameDay(org.createdAt, t)
        ? "seit heute"
        : `seit ${longDate(org.createdAt)}`,
  ].join(" · ");
  const create = `${TOURNAMENT_URL}/neu?org=${org.id}`;

  return (
    <>
      <PageHead title={org.name} sub={sub}>
        <a className="btn btn-ink" href={create}>
          <Ic name="plus" small />
          {PORTAL.create}
        </a>
      </PageHead>
      {fresh ? <Welcome org={org} name={me.name} /> : null}
      {!data && !error ? (
        // One swap from placeholder to content, so nothing below moves while the lists load.
        <Loading label="Übersicht wird geladen">
          <div className="g3 sec">
            <div className="stack">
              <Sk h={fresh ? 260 : 250} />
              {fresh ? null : <Sk h={250} />}
            </div>
            <div className="stack">
              <Sk h={380} r={22} />
              <Sk h={250} />
            </div>
          </div>
        </Loading>
      ) : (
        <div className="g3 sec">
          <div className="stack">
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
                    <TRow key={x.id} t={x} nowMs={t} />
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
                  {all.length ? "Gerade ist kein Turnier geplant. Das nächste erstellst du in Tournament." : PORTAL.newOrg.emptyP}
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
                    <TRow key={x.id} t={x} nowMs={t} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="stack">
            <PlanCard org={org} />
            <Usage org={org} />
            <OpenRequest orgId={org.id} nowMs={t} />
          </div>
        </div>
      )}
    </>
  );
}
