"use client";

import Link from "next/link";
import { useState } from "react";
import { ServiceOff } from "@/components/services";
import { usePageBusy, usePortal } from "@/components/Shell";
import { tourLabel, tourTeams, TOURNAMENT_STATE } from "@/components/status";
import { Chip, Empty, ErrorCard, Ic, Loading, PageHead, Sk, Table, Td } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { TOURNAMENT_URL } from "@/lib/auth";
import { num, tourDate } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { PortalApi, TournamentState } from "@/lib/org-contract";

type Filter = "all" | TournamentState;

const FILTERS: [Filter, string][] = [
  ["all", "Alle"],
  ["live", "Live"],
  ["open", "Anmeldung offen"],
  ["draft", "Entwürfe"],
  ["done", "Abgeschlossen"],
];

function TournamentList() {
  const { org } = usePortal();
  const t = now();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, error, reload } = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(`/portal/orgs/${org.id}/tournaments`, 30_000);
  usePageBusy(!data && !error);
  const all = data?.tournaments ?? [];
  const rows = all.filter((x) => filter === "all" || x.state === filter);
  const count = (f: Filter) => all.filter((x) => f === "all" || x.state === f).length;
  const create = `${TOURNAMENT_URL}/neu?org=${org.id}`;

  return (
    <>
      <PageHead title={PORTAL.tournaments.h}>
        <a className="btn btn-ink" href={create}>
          <Ic name="plus" small />
          {PORTAL.create}
        </a>
      </PageHead>
      {error && !data ? (
        <ErrorCard title="Die Turniere haben nicht geladen" error={error} onRetry={reload} />
      ) : !data ? (
        <Loading label="Turniere werden geladen">
          <Sk h={420} />
        </Loading>
      ) : !all.length ? (
        <Empty
          icon="trophy"
          title={PORTAL.newOrg.emptyH}
          action={
            <a className="btn btn-ink btn-s" href={create}>
              {PORTAL.create}
            </a>
          }
        >
          {PORTAL.newOrg.emptyP}
        </Empty>
      ) : (
        <>
          <div className="filters" role="group" aria-label="Turniere filtern" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {FILTERS.map(([f, label]) => (
              <button key={f} className={`fchip${filter === f ? " on" : ""}`} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {label} <span className="c">{num(count(f))}</span>
              </button>
            ))}
          </div>
          <section className="box">
            <Table
              label="Turniere"
              cols="minmax(0,1.6fr) minmax(0,1.3fr) minmax(0,1.2fr) 90px 170px 150px"
              colsS="minmax(0,1fr) auto"
              head={[{ h: "Turnier" }, { h: "Datum", hide: true }, { h: "Spiel", hide: true }, { h: "Teams", r: true, hide: true }, { h: "Status" }, { h: "", hide: true }]}
            >
              {rows.map((x) => {
                const s = TOURNAMENT_STATE[x.state];
                const d = tourDate(x.startsAt, x.endsAt, t);
                return (
                  <tr className="dt-r" key={x.id}>
                    <Td>
                      <Link className="rowlink" href={`/turniere/${x.id}`}>
                        {x.name}
                      </Link>
                      <span className="box-s show-s">{d}</span>
                    </Td>
                    <Td hide>{d}</Td>
                    <Td hide>{x.game}</Td>
                    <Td r hide>
                      {tourTeams(x)}
                    </Td>
                    <Td>
                      <Chip chip={s.chip} dot={s.dot}>
                        {tourLabel(x)}
                      </Chip>
                    </Td>
                    <Td hide>
                      <a className="alink" href={`${TOURNAMENT_URL}/${x.slug}`}>
                        In Tournament öffnen
                        <Ic name="arrow-ur" small />
                      </a>
                    </Td>
                  </tr>
                );
              })}
            </Table>
            {!rows.length ? (
              <p className="box-s" style={{ marginTop: 12 }}>
                Kein Turnier in diesem Filter.
              </p>
            ) : null}
          </section>
        </>
      )}
    </>
  );
}

export default function TournamentsPage() {
  const { org } = usePortal();
  if (org.services.includes("tournament")) return <TournamentList />;
  return (
    <>
      <PageHead title={PORTAL.tournaments.h} />
      <ServiceOff id="tournament" />
    </>
  );
}
