"use client";

import Link from "next/link";
import { useState } from "react";
import { OwnerOnly, usePageBusy, usePortal } from "@/components/Shell";
import { planPrice } from "@/components/status";
import { Chip, Dialog, ErrorCard, Ic, Loading, PageHead, Sk, Table, Td } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { chf, chfShort, date, longDate } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { Invoice, Plan, PlanId, PortalApi } from "@/lib/org-contract";

type Billing = PortalApi["GET /portal/orgs/:id/billing"]["R"];

function invoiceState(i: Invoice): { chip: string; label: string; pay: boolean } {
  if (i.status === "paid") return { chip: "ok", label: "Bezahlt", pay: false };
  if (i.status === "void") return { chip: "", label: "Storniert", pay: false };
  if (i.status === "uncollectible") return { chip: "err", label: "Nicht bezahlt", pay: false };
  if (i.status === "draft") return { chip: "", label: "Entwurf", pay: false };
  if (i.overdueDays > 0) return { chip: "err", label: `Überfällig seit ${i.overdueDays} ${i.overdueDays === 1 ? "Tag" : "Tagen"}`, pay: true };
  return { chip: "warn", label: "Offen", pay: true };
}

const PLAN_SUB: Record<PlanId, (p: Plan) => string> = {
  gratis: (p) => `bis ${p.limits.maxTeams} Teams`,
  event: () => "pro Turnier",
  verein: () => "pro Monat, jährlich",
};

function ChangePlan({ to, billing, onClose }: { to: Plan; billing: Billing; onClose: () => void }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [payBy, setPayBy] = useState<"card" | "invoice">("card");
  const [tid, setTid] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: tours } = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(to.id === "event" ? `/portal/orgs/${org.id}/tournaments` : null);
  const candidates = (tours?.tournaments ?? []).filter((t) => t.state !== "done" && t.plan === "gratis");
  const go = async () => {
    setBusy(true);
    try {
      const { url } =
        to.id === "gratis"
          ? await act<{ url: string }>(`/portal/orgs/${org.id}/billing-portal`)
          : await act<{ url: string }>(`/portal/orgs/${org.id}/checkout`, { plan: to.id, ...(to.id === "event" ? { tournamentId: tid } : { payBy }) });
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
      setBusy(false);
    }
  };
  const current = billing.plans.find((p) => p.id === billing.current);
  return (
    <Dialog
      title={to.id === "gratis" ? "Zu Gratis wechseln" : `Plan ${to.name}`}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost btn-s" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn-ink btn-s" type="button" disabled={busy || (to.id === "event" && !tid)} onClick={go}>
            {to.id === "gratis" ? "Weiter zu Stripe" : "Weiter zur Zahlung"}
            <Ic name="arrow-ur" small />
          </button>
        </>
      }
    >
      {to.id === "gratis" ? (
        <p className="box-s">
          Dein Abo {current ? `im Plan ${current.name}` : ""} läuft bis zum Ende der bezahlten Zeit weiter. Danach gelten die Grenzen von Gratis: bis {to.limits.maxTeams} Teams und ein laufendes Turnier. Kündigen kannst du bei Stripe.
        </p>
      ) : to.id === "event" ? (
        <>
          <p className="box-s">{chfShort(to.price)} für ein Turnier: bis {to.limits.maxTeams} Teams, Check-in, Warteliste, eigenes Logo auf dem Beamer und Export.</p>
          <div className="f">
            <label className="f-l" htmlFor="cp-t">
              Für welches Turnier?
            </label>
            <select id="cp-t" className="sel" value={tid} onChange={(e) => setTid(e.target.value)}>
              <option value="">Turnier wählen</option>
              {candidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {tours && !candidates.length ? <span className="f-h">Kein offenes Turnier im Plan Gratis. Erstell zuerst eines in Tournament.</span> : null}
          </div>
        </>
      ) : (
        <>
          <p className="box-s">
            {planPrice(to)}, jährlich verrechnet ({chf(to.price * 12)}). Unbegrenzt viele Turniere, bis {to.limits.maxOrganisers} Organisatoren. Ein Wechsel von Event wird anteilig angerechnet.
          </p>
          <fieldset className="f" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="f-l" style={{ marginBottom: 8 }}>
              Bezahlen mit
            </legend>
            <div className="pills">
              <button className="pill" type="button" aria-pressed={payBy === "card"} onClick={() => setPayBy("card")}>
                Karte oder TWINT
              </button>
              <button className="pill" type="button" aria-pressed={payBy === "invoice"} onClick={() => setPayBy("invoice")}>
                Rechnung per E-Mail
              </button>
            </div>
            <span className="f-h">{payBy === "invoice" ? "Du bekommst die Rechnung als PDF, zahlbar innert 30 Tagen." : "Die Zahlung läuft über Stripe."}</span>
          </fieldset>
        </>
      )}
    </Dialog>
  );
}

function Billing() {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [to, setTo] = useState<Plan | null>(null);
  const { data, error, reload } = useOrg<Billing>(`/portal/orgs/${org.id}/billing`, 60_000);
  usePageBusy(!data && !error);
  const t = now();

  if (error && !data) return <ErrorCard title="Die Abrechnung hat nicht geladen" error={error} onRetry={reload} />;
  if (!data) {
    return (
      <Loading label="Abrechnung wird geladen">
        <div className="g3">
          <div className="stack">
            <Sk h={220} />
            <Sk h={200} />
          </div>
          <div className="stack">
            <Sk h={150} r={22} />
            <Sk h={120} />
            <Sk h={150} />
          </div>
        </div>
      </Loading>
    );
  }

  const current = data.plans.find((p) => p.id === data.current) ?? org.plan;
  const pm = data.paymentMethod;
  const stripe = async () => {
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/billing-portal`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };

  return (
    <div className="g3">
      <div className="stack">
        <section className="box" aria-labelledby="iv-h">
          <div className="box-h">
            <h2 id="iv-h" className="box-t">
              {PORTAL.billing.invH}
            </h2>
            <span className="box-s">als PDF</span>
          </div>
          {data.invoices.length ? (
            <Table
              label={PORTAL.billing.invH}
              cols="100px minmax(0,1fr) 100px 150px 120px"
              colsS="minmax(0,1fr) auto"
              head={[{ h: "Nummer" }, { h: "Leistung", hide: true }, { h: "Betrag", r: true, hide: true }, { h: "Status" }, { h: "", hide: true }]}
            >
              {data.invoices.map((i) => {
                const st = invoiceState(i);
                return (
                  <tr className="dt-r" key={i.id}>
                    <Td>
                      <b className="mono-t">{i.number}</b>
                      <span className="box-s" style={{ display: "block" }}>
                        {date(i.createdAt)}
                      </span>
                    </Td>
                    <Td hide>{i.description}</Td>
                    <Td r hide>
                      <b>{chf(i.amount)}</b>
                    </Td>
                    <Td>
                      <Chip chip={st.chip} dot={st.chip}>
                        {st.label}
                      </Chip>
                      {i.dueAt ? (
                        <span className="box-s" style={{ display: "block", marginTop: 4 }}>
                          fällig {date(i.dueAt)}
                        </span>
                      ) : null}
                    </Td>
                    <Td r hide>
                      {st.pay && i.payUrl ? (
                        <a className="btn btn-ink btn-s" href={i.payUrl}>
                          Bezahlen
                        </a>
                      ) : i.pdfUrl ? (
                        <a className="alink" href={i.pdfUrl} download>
                          <Ic name="download" small />
                          PDF<span className="sr"> von Rechnung {i.number}</span>
                        </a>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <p className="box-s">Noch keine Rechnungen. Im Plan Gratis gibt es keine.</p>
          )}
        </section>
        <section className="box" aria-labelledby="pw-h">
          <div className="box-h">
            <h2 id="pw-h" className="box-t">
              {PORTAL.billing.plansH}
            </h2>
            <span className="box-s">Gilt ab der nächsten Rechnung</span>
          </div>
          <div className="plan3">
            {data.plans.map((p) => {
              const cur = p.id === data.current;
              return (
                <button key={p.id} className={`p3${cur ? " cur" : ""}`} type="button" aria-pressed={cur} disabled={cur} onClick={() => setTo(p)}>
                  <b>
                    {p.name}
                    {cur ? (
                      <span className="chip" style={{ height: 20 }}>
                        Aktuell
                      </span>
                    ) : null}
                  </b>
                  <span className="pp">{chfShort(p.price)}</span>
                  <span className="s">{PLAN_SUB[p.id](p)}</span>
                </button>
              );
            })}
          </div>
          {data.plans.some((p) => p.placeholder) ? (
            <p className="box-s" style={{ marginTop: 12 }}>
              Preise sind Platzhalter, bis Planary sie festlegt.
            </p>
          ) : null}
        </section>
      </div>
      <div className="stack">
        <section className="plan" aria-labelledby="bp-h">
          <p className="plan-l">{PORTAL.overview.plan}</p>
          <h2 id="bp-h" className="plan-n">
            {current.name}
            <small>
              {planPrice(current)}
              {current.period === "month_yearly" ? `, jährlich, ${chfShort(current.price * 12)}` : ""}
            </small>
          </h2>
          <div className="plan-f">
            <span>{data.renewsAt ? `Nächste Rechnung am ${longDate(data.renewsAt)}` : "Kein Abo, keine Rechnung"}</span>
          </div>
        </section>
        <section className="box" aria-labelledby="pm-h">
          <div className="box-h">
            <h2 id="pm-h" className="box-t">
              {PORTAL.billing.payH}
            </h2>
            <span className="box-s">{PORTAL.billing.payNote}</span>
          </div>
          {pm ? (
            <div className="paym">
              <span className="cardi">{pm.kind === "card" ? pm.brand.toUpperCase().slice(0, 4) : pm.kind === "twint" ? "TWINT" : "QR"}</span>
              <div className="grow">
                <b>{pm.kind === "card" ? `${pm.brand.charAt(0).toUpperCase()}${pm.brand.slice(1)} •••• ${pm.last4}` : pm.kind === "twint" ? "TWINT" : "Rechnung per E-Mail"}</b>
                {pm.kind === "card" ? (
                  <span className="s">
                    läuft ab {String(pm.expMonth).padStart(2, "0")}/{String(pm.expYear).slice(-2)}
                    {new Date(pm.expYear, pm.expMonth).getTime() < t ? " (abgelaufen)" : ""}
                  </span>
                ) : null}
              </div>
              <button className="btn btn-line btn-s" type="button" onClick={stripe}>
                {PORTAL.billing.payCta}
                <Ic name="arrow-ur" small />
              </button>
            </div>
          ) : (
            <p className="box-s">Noch kein Zahlungsmittel. Du gibst es beim ersten Planwechsel bei Stripe ein.</p>
          )}
        </section>
        <section className="box" aria-labelledby="ad-h">
          <div className="box-h">
            <h2 id="ad-h" className="box-t">
              {PORTAL.billing.addrH}
            </h2>
            <Link className="alink" href="/einstellungen">
              Ändern
            </Link>
          </div>
          <address className="addr">
            {data.contact.address.map((a, i) => (
              <span key={i} style={{ display: "block" }}>
                {a}
              </span>
            ))}
          </address>
        </section>
      </div>
      {to ? <ChangePlan to={to} billing={data} onClose={() => setTo(null)} /> : null}
    </div>
  );
}

export default function BillingPage() {
  return (
    <>
      <PageHead title={PORTAL.billing.h} />
      <OwnerOnly>
        <Billing />
      </OwnerOnly>
    </>
  );
}
