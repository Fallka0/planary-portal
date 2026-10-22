"use client";

import { ServiceOff } from "@/components/services";
import { usePageBusy, usePortal } from "@/components/Shell";
import { Chip, Empty, ErrorCard, Ic, Loading, PageHead, Sk, Table, Td } from "@/components/ui";
import { chf, longDate, num, sameDay, time } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { PortalApi } from "@/lib/org-contract";
import { wishlistRoom } from "@/lib/services";

type R = PortalApi["GET /portal/orgs/:id/wishlists"]["R"];

function WishlistList() {
  const { org } = usePortal();
  const t = now();
  const { data, error, reload } = useOrg<R>(`/portal/orgs/${org.id}/wishlists`, 60_000);
  usePageBusy(!data && !error);
  const full = !!data && data.maxLists !== null && data.lists.length >= data.maxLists;
  const add = data && !full ? (
    <a className="btn btn-ink" href={data.newUrl}>
      <Ic name="plus" small />
      Wunschliste erstellen
    </a>
  ) : null;

  return (
    <>
      <PageHead title="Wunschlisten" sub={data?.connected ? wishlistRoom(data.lists.length, data.maxLists, org.plan.name) : undefined}>
        {add}
      </PageHead>
      {error && !data ? (
        <ErrorCard title="Die Wunschlisten haben nicht geladen" error={error} onRetry={reload} />
      ) : !data ? (
        <Loading label="Wunschlisten werden geladen">
          <Sk h={320} />
        </Loading>
      ) : !data.connected ? (
        <Empty icon="alert" title="Wishlist antwortet gerade nicht">
          Eure Wunschlisten sind gespeichert. Versuch es in ein paar Minuten nochmals oder öffne sie direkt in Wishlist.
        </Empty>
      ) : !data.lists.length ? (
        <Empty icon="gift" title="Noch keine Wunschlisten" action={add ? <a className="btn btn-ink btn-s" href={data.newUrl}>Wunschliste erstellen</a> : undefined}>
          Wunschlisten von {org.name} pflegt das ganze Team gemeinsam in Wishlist. Teilt ihr eine per Link, reservieren Freunde dort, was sie mitbringen. Was reserviert ist, sieht niemand im Team.
        </Empty>
      ) : (
        <section className="box">
          <Table
            label="Wunschlisten"
            cols="minmax(0,1.6fr) 90px 130px minmax(0,1.1fr) 150px 170px"
            colsS="minmax(0,1fr) auto"
            head={[{ h: "Wunschliste" }, { h: "Einträge", r: true, hide: true }, { h: "Wert", r: true, hide: true }, { h: "Angelegt von", hide: true }, { h: "Sichtbarkeit" }, { h: "", hide: true }]}
          >
            {data.lists.map((l) => (
              <tr className="dt-r" key={l.id}>
                <Td>
                  <a className="rowlink" href={l.url}>
                    {l.title}
                  </a>
                  <span className="box-s hide-s">{l.updatedAt ? `Zuletzt geändert ${sameDay(l.updatedAt, t) ? `um ${time(l.updatedAt)}` : `am ${longDate(l.updatedAt)}`}` : ""}</span>
                  <span className="box-s show-s">
                    {num(l.items)} {l.items === 1 ? "Eintrag" : "Einträge"}
                    {l.value ? ` · ${chf(l.value)}` : ""}
                  </span>
                </Td>
                <Td r hide>
                  {num(l.items)}
                </Td>
                <Td r hide>
                  {l.value ? chf(l.value) : "–"}
                </Td>
                <Td hide>{l.createdBy || "–"}</Td>
                <Td>
                  <Chip chip={l.shared ? "" : "chip-line"} dot={null}>
                    <Ic name={l.shared ? "globe" : "lock"} small />
                    {l.shared ? "Per Link geteilt" : "Nur das Team"}
                  </Chip>
                </Td>
                <Td hide>
                  <a className="alink" href={l.url}>
                    In Wishlist öffnen
                    <Ic name="arrow-ur" small />
                  </a>
                </Td>
              </tr>
            ))}
          </Table>
          {full ? (
            <p className="box-s" style={{ marginTop: 12 }}>
              Euer Plan hat Platz für {num(data.maxLists ?? 0)} Wunschlisten. Mit dem Plan Verein sind es unbegrenzt viele.
            </p>
          ) : null}
        </section>
      )}
    </>
  );
}

export default function WishlistsPage() {
  const { org } = usePortal();
  if (org.services.includes("wishlist")) return <WishlistList />;
  return (
    <>
      <PageHead title="Wunschlisten" />
      <ServiceOff id="wishlist" org={org} />
    </>
  );
}
