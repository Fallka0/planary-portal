"use client";

import Link from "next/link";
import { usePageBusy, usePortal } from "@/components/Shell";
import { REQUEST_STATE, TOPIC } from "@/components/status";
import { Chip, Empty, ErrorCard, Ic, Loading, PageHead, Sk } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { when } from "@/lib/fmt";
import { now, useOrg } from "@/lib/org";
import type { PortalApi } from "@/lib/org-contract";

export default function SupportPage() {
  const { org } = usePortal();
  const t = now();
  const { data, error, reload } = useOrg<PortalApi["GET /portal/orgs/:id/requests"]["R"]>(`/portal/orgs/${org.id}/requests`, 30_000);
  usePageBusy(!data && !error);
  const action = (
    <Link className="btn btn-ink" href="/support/neu">
      <Ic name="msg" small />
      {PORTAL.support.new}
    </Link>
  );
  return (
    <>
      <PageHead title={PORTAL.support.h}>{action}</PageHead>
      {error && !data ? (
        <ErrorCard title="Die Anfragen haben nicht geladen" error={error} onRetry={reload} />
      ) : !data ? (
        <Loading label="Anfragen werden geladen">
          <Sk h={260} />
        </Loading>
      ) : !data.requests.length ? (
        <Empty icon="inbox" title="Keine Anfragen" action={action}>
          Wenn etwas nicht stimmt, schreib uns hier. Wir antworten an Werktagen innert eines Tages, während eines laufenden Turniers schneller.
        </Empty>
      ) : (
        <section className="box">
          <div>
            {data.requests.map((r) => {
              const st = REQUEST_STATE[r.status];
              return (
                <Link className="req" href={`/support/${r.id}`} key={r.id}>
                  <b>{r.subject}</b>
                  <Chip chip={st.chip} dot={st.dot}>
                    {st.label}
                  </Chip>
                  <span className="s">
                    <span className="mono-t">{r.code}</span> · {r.tournament?.name ?? TOPIC[r.topic]} · {when(r.createdAt, t)} · {r.lastEvent}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
