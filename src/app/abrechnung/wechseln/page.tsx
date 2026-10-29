"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BillingError, BillingHead, BillingLoading } from "@/components/billing";
import { OwnerOnly, usePageBusy, usePortal } from "@/components/Shell";
import { ROLE } from "@/components/status";
import { Ic } from "@/components/ui";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { initials, longDate } from "@/lib/fmt";
import { type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { Billing, PortalApi } from "@/lib/org-contract";

const DAY = 86_400_000;
const dayMonth = (ms: number) => longDate(ms).replace(/ \d{4}$/, "");

/** PL-Cancel: switch to Gratis at the end of the paid year. Both buttons weigh the same. */
function Cancel() {
  const { org, toast } = usePortal();
  const router = useRouter();
  const act = useOrgAction();
  const billing = useOrg<Billing>(`/portal/orgs/${org.id}/billing`);
  const team = useOrg<PortalApi["GET /portal/orgs/:id/members"]["R"]>(`/portal/orgs/${org.id}/members`);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  usePageBusy(!billing.data && !billing.error);

  if (billing.error && !billing.data) return <BillingError onRetry={billing.reload} requestId={billing.error.requestId} />;
  if (!billing.data) return <BillingLoading />;
  const b = billing.data;
  if (b.current !== "plus" || !b.renewsAt) {
    return (
      <p className="cx-p">
        Ihr seid auf Gratis. <Link href="/abrechnung">Zurück zur Abrechnung</Link>
      </p>
    );
  }
  const gratis = b.plans.find((p) => p.id === "gratis");
  const seats = gratis?.limits.maxOrganisers ?? 2;
  const members = team.data?.members ?? [];
  // Owners first, then whoever was active last: the default two.
  const keep = picked ?? members.slice().sort((x, y) => (x.role === y.role ? (y.lastActive ?? 0) - (x.lastActive ?? 0) : x.role === "owner" ? -1 : 1)).slice(0, seats).map((m) => m.id);
  const over = members.length > seats;
  const from = b.renewsAt;
  const last = from - DAY;

  const toggle = (id: string) => {
    if (keep.includes(id)) setPicked(keep.filter((x) => x !== id));
    else if (keep.length < seats) setPicked([...keep, id]);
    else toast(`Gratis hat ${seats} Plätze. Wähl zuerst jemanden ab.`, "err");
  };
  const confirm = async () => {
    setBusy(true);
    try {
      await act(`/portal/orgs/${org.id}/cancel`, { keep: over ? keep : members.map((m) => m.id) });
      toast(`Erledigt. Ab ${longDate(from)} seid ihr auf Gratis.`);
      router.push("/abrechnung");
    } catch (e) {
      toast((e as OrgError).message, "err");
      setBusy(false);
    }
  };

  return (
    <section className="cx" aria-labelledby="cx-h">
      <h2 id="cx-h" className="b-h2">
        {B.cancel.h}
      </h2>
      <p className="cx-p">
        Plus läuft bis {longDate(last)}. Ab {longDate(from)} seid ihr auf Gratis. Bis dahin kannst du jederzeit bei Plus bleiben.
      </p>
      <div className="tl" aria-hidden="true">
        <div>
          <span>Bis {longDate(last)}</span>
          <b>Plus</b>
        </div>
        <i />
        <div>
          <span>Ab {longDate(from)}</span>
          <b>Gratis</b>
        </div>
      </div>
      <div className="g2 sec">
        <div className="box">
          <h3 className="box-t">{B.cancel.keepH}</h3>
          <ul className="miss" style={{ marginTop: 12 }}>
            {B.cancel.keep.map((x) => (
              <li key={x}>
                <Ic name="check" small />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="box">
          <h3 className="box-t">Ändert sich ab {dayMonth(from)}</h3>
          <ul className="miss" style={{ marginTop: 12 }}>
            {B.cancel.lose.map((x) => (
              <li key={x}>
                <Ic name="clock" small />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {over ? (
        <fieldset className="box sec" style={{ border: 0, marginInline: 0 }}>
          <legend className="sr">{B.cancel.seatsH}</legend>
          <h3 className="box-t" aria-hidden="true">
            {B.cancel.seatsH}
          </h3>
          <p className="box-s" style={{ marginTop: 4 }}>
            Gratis hat {seats} Plätze. Die anderen behalten ihr Konto.
          </p>
          <div className="seats">
            {members.map((m) => {
              const on = keep.includes(m.id);
              return (
                <label className={`seat${on ? " on" : ""}`} key={m.id}>
                  <input type="checkbox" checked={on} onChange={() => toggle(m.id)} />
                  <span className="av" aria-hidden="true">
                    {initials(m.name)}
                  </span>
                  <span className="grow">
                    <b>{m.name}</b>
                    <span>{ROLE[m.role]}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <div className="cx-a">
        <button className="btn btn-ink" type="button" disabled={busy || (over && keep.length === 0)} onClick={confirm}>
          {B.cancel.confirm}
        </button>
        <Link className="btn btn-ghost" href="/abrechnung">
          {B.cancel.keepPlus}
        </Link>
      </div>
    </section>
  );
}

export default function CancelPage() {
  return (
    <>
      <BillingHead on="plan" />
      <OwnerOnly>
        <Cancel />
      </OwnerOnly>
    </>
  );
}
