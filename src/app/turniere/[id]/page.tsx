"use client";

import Link from "next/link";
import { use, useState } from "react";
import { usePageBusy, usePortal } from "@/components/Shell";
import { tourLabel, TOURNAMENT_STATE } from "@/components/status";
import { Chip, ErrorCard, Ic, Loading, PageHead, Sk } from "@/components/ui";
import { TOURNAMENT_URL } from "@/lib/auth";
import { dayMonth, initials, num, sameDay, time, tourDateLong } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { PortalTournamentDetail } from "@/lib/org-contract";

function steps(t: PortalTournamentDetail, nowMs: number) {
  const order = ["draft", "open", "live", "done"] as const;
  const at = order.indexOf(t.state);
  const reg = t.registration;
  const regText = reg.opensAt ? `${dayMonth(reg.opensAt)}${reg.closesAt ? ` bis ${dayMonth(reg.closesAt)}` : ""}` : "noch nicht geöffnet";
  const day = (ms: number) => (sameDay(ms, nowMs) ? time(ms) : dayMonth(ms));
  const text = [
    dayMonth(t.createdAt),
    regText,
    t.state === "live" && t.startsAt ? `seit ${day(t.startsAt)}` : t.startsAt ? `geplant ${day(t.startsAt)}` : "noch kein Datum",
    t.state === "done" ? (t.endsAt ? day(t.endsAt) : "abgeschlossen") : t.endsAt ? `geplant ${day(t.endsAt)}` : "offen",
  ];
  return ["Entwurf", "Anmeldung", "Live", "Abgeschlossen"].map((label, i) => {
    const cls = i < at || t.state === "done" ? "done" : i === at ? "now" : "next";
    return { label, cls, text: text[i] };
  });
}

function Share({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="url">
      <Ic name="link" small />
      <span>{url.replace(/^https:\/\//, "")}</span>
      <button
        className="btn btn-ghost btn-s"
        type="button"
        onClick={() =>
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          })
        }
      >
        {copied ? "Kopiert" : "Kopieren"}
      </button>
      <span className="sr" role="status">
        {copied ? "Link kopiert" : ""}
      </span>
    </div>
  );
}

export default function TournamentPage({ params }: PageProps<"/turniere/[id]">) {
  const { id } = use(params);
  const { org } = usePortal();
  const nowMs = now();
  const { data: t, error, reload } = useOrg<PortalTournamentDetail>(`/portal/orgs/${org.id}/tournaments/${encodeURIComponent(id)}`, 15_000);
  usePageBusy(!t && !error);

  const crumb = (name: string) => (
    <p className="crumb">
      <Link className="ul" href="/turniere">
        Turniere
      </Link>
      <Ic name="chev-r" small />
      {name}
    </p>
  );

  if (error && !t) {
    return (
      <>
        {crumb("Turnier")}
        <ErrorCard title="Das Turnier hat nicht geladen" error={error} onRetry={reload} />
      </>
    );
  }
  if (!t) {
    return (
      <>
        {crumb("Turnier")}
        <Loading label="Turnier wird geladen">
          <div className="stack">
            <Sk h={120} r={12} />
            <Sk h={70} />
            <Sk h={110} />
            <Sk h={160} />
          </div>
        </Loading>
      </>
    );
  }

  const s = TOURNAMENT_STATE[t.state];
  const url = `${TOURNAMENT_URL}/${t.slug}`;
  const open = t.matches - t.played;
  const facts = [
    { l: "Teams", v: `${t.teams} / ${t.maxTeams}`, s: t.waiting ? `${num(t.waiting)} auf der Warteliste` : t.teams >= t.maxTeams ? "voll" : `${num(t.maxTeams - t.teams)} Plätze frei`, pct: t.maxTeams ? t.teams / t.maxTeams : 0 },
    { l: "Spiele gespielt", v: t.matches ? `${t.played} / ${t.matches}` : "–", s: !t.matches ? "Spielplan folgt" : open ? `${num(open)} noch offen` : "alle gespielt", pct: t.matches ? t.played / t.matches : null },
    { l: t.state === "live" ? "Zuschauer jetzt" : "Zuschauer", v: num(t.viewers), s: "über den Link und den Beamer", pct: null },
  ];
  const planLine = t.plan === "verein" ? "Verein · zählt nicht extra" : t.plan === "event" ? "Event · ein Turnier-Pass" : "Gratis";
  const exportLine = org.plan.limits.export ? (t.state === "done" ? "CSV und PDF, in Tournament unter Resultate" : "CSV und PDF, sobald das Turnier abgeschlossen ist") : "Ab Plan Event";
  const meta = [t.game, tourDateLong(t.startsAt, t.endsAt), t.venue].filter(Boolean).join(" · ");

  return (
    <>
      <PageHead
        crumb={crumb(t.name)}
        title={t.name}
        sub={meta}
        chip={
          <Chip chip={s.chip} dot={s.dot}>
            {tourLabel(t)}
          </Chip>
        }
      >
        <a className="btn btn-line btn-s" href={`${url}/beamer`}>
          <Ic name="screen" small />
          Beamer-Ansicht
        </a>
        <a className="btn btn-ink btn-s" href={url}>
          <Ic name="arrow-ur" small />
          In Tournament öffnen
        </a>
      </PageHead>
      <ol className="tsteps" aria-label="Ablauf">
        {steps(t, nowMs).map((x) => (
          <li key={x.label} className={`tstep ${x.cls}`} aria-current={x.cls === "now" ? "step" : undefined}>
            <b>
              <i>{x.cls === "done" ? <Ic name="check" /> : null}</i>
              {x.label}
              {x.cls === "done" ? <span className="sr"> (erledigt)</span> : null}
            </b>
            <span>{x.text}</span>
          </li>
        ))}
      </ol>
      <div className="facts3 sec">
        {facts.map((f) => (
          <div className="fact" key={f.l}>
            <span className="l">{f.l}</span>
            <span className="v">{f.v}</span>
            {f.pct !== null ? (
              <span className="meter" role="img" aria-label={`${Math.round(Math.min(1, f.pct) * 100)} Prozent`}>
                <i style={{ width: `${Math.round(Math.min(1, f.pct) * 100)}%` }} />
              </span>
            ) : null}
            <span className="s">{f.s}</span>
          </div>
        ))}
      </div>
      <div className="g2 sec">
        <section className="box" aria-labelledby="sh-h">
          <div className="box-h">
            <h2 id="sh-h" className="box-t">
              Teilen
            </h2>
          </div>
          <p className="box-s" style={{ marginBottom: 10 }}>
            Öffentlich, ohne Konto.
          </p>
          <Share url={url} />
        </section>
        <section className="box" aria-labelledby="og-h">
          <div className="box-h">
            <h2 id="og-h" className="box-t">
              Wer das Turnier leitet
            </h2>
          </div>
          <ul>
            {t.organisers.map((o) => (
              <li className="list-r" key={o.id}>
                <span className="av">{initials(o.name)}</span>
                <div className="grow">
                  <b>{o.name}</b>
                  <span className="s">{o.role}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="box sec" aria-labelledby="ex-h">
        <div className="box-h">
          <h2 id="ex-h" className="box-t">
            Resultate und Abrechnung
          </h2>
        </div>
        <dl className="kv">
          <dt>Format</dt>
          <dd>{t.format ?? "–"}</dd>
          <dt>Plan</dt>
          <dd>{planLine}</dd>
          <dt>Export</dt>
          <dd>{exportLine}</dd>
        </dl>
      </section>
    </>
  );
}
