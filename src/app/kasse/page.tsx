"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BillingError } from "@/components/billing";
import { usePortalBase } from "@/components/Shell";
import { tourLabel } from "@/components/status";
import { Ic } from "@/components/ui";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { CHECKOUT_KEY, safeReturn } from "@/lib/billing";
import { setCurrentOrg } from "@/lib/current-org";
import { chf, dateNarrow, longDate, sameDay, shortDay } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { CheckoutBody, CheckoutResult, CheckoutStatus, PayBy, PortalApi, PortalOrg, TournamentSummary } from "@/lib/org-contract";

const YEAR = 365 * 86_400_000;
const DAY = 86_400_000;
const PLUS_PRICE = 14900;
const PASS_PRICE = 2900;


/** "Entwurf · Sa 12. Dez. · 16 Teams", "Live · heute" */
function tourLine(t: TournamentSummary, nowMs: number) {
  const when = t.startsAt && sameDay(t.startsAt, nowMs) ? "heute" : t.startsAt ? shortDay(t.startsAt) : "noch kein Datum";
  return [tourLabel(t).split(" · ")[0], when, t.state === "draft" || t.state === "open" ? `${t.maxTeams} Teams` : null].filter(Boolean).join(" · ");
}

function Radio({ name, on, off, onPick, icon, title, sub }: { name: string; on: boolean; off?: boolean; onPick: () => void; icon?: "card" | "file"; title: string; sub: string }) {
  return (
    <label className={`opt${on ? " on" : ""}${off ? " off" : ""}`}>
      <input type="radio" name={name} checked={on} disabled={off} onChange={onPick} />
      {icon ? <Ic name={icon} /> : null}
      <span className="grow">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      <span className="rad" aria-hidden="true" />
    </label>
  );
}

function Checkout() {
  const params = useSearchParams();
  const router = useRouter();
  const { me, orgs, toast } = usePortalBase();
  const act = useOrgAction();
  const nowMs = now();

  const isPass = params.get("pass") === "tournament" || (!params.get("plan") && !!params.get("tournament"));
  const returnTo = safeReturn(params.get("return"));
  const askedTour = params.get("tournament");
  const askedTitle = params.get("title");
  const failedId = params.get("checkout");

  // The organisation: the one asked for, else one this person owns. Without one, step 1 creates it.
  // planary.ch links here without parameters (/kasse?pass=tournament, /kasse?plan=plus): someone with
  // several organisations picks one in step 1.
  const owned = orgs.filter((o) => o.role === "owner");
  const [orgPick, setOrgPick] = useState<string | null>(null);
  const orgId = (owned.find((o) => o.id === orgPick) ?? owned.find((o) => o.id === params.get("org")) ?? owned[0])?.id ?? null;
  const orgQ = useOrg<PortalOrg>(orgId ? `/portal/orgs/${orgId}` : null);
  const toursQ = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(orgId && isPass ? `/portal/orgs/${orgId}/tournaments` : null);
  const failedQ = useOrg<CheckoutStatus>(failedId ? `/portal/checkout/${encodeURIComponent(failedId)}` : null);
  const org = orgQ.data;

  const [name, setName] = useState(`${me.name} Turniere`);
  const [email, setEmail] = useState(me.email);
  const [payBy, setPayBy] = useState<PayBy>("card");
  const [tid, setTid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errs, setErrs] = useState<{ name?: string; email?: string }>({});

  // Tournaments a pass can be for: not finished. The one Tournament sent comes first, also before it is in the list.
  const listed = (toursQ.data?.tournaments ?? []).filter((t) => t.state !== "done");
  const tours: { id: string; name: string; sub: string }[] = listed.map((t) => ({ id: t.id, name: t.name, sub: tourLine(t, nowMs) }));
  if (askedTour && !tours.some((t) => t.id === askedTour)) tours.unshift({ id: askedTour, name: askedTitle || "Dein Turnier", sub: "aus Tournament" });
  const pickedTour = tid ?? (askedTour && tours.some((t) => t.id === askedTour) ? askedTour : tours[0]?.id ?? null);
  const tourName = tours.find((t) => t.id === pickedTour)?.name ?? null;

  const failed = failedQ.data?.state === "failed" ? failedQ.data : null;
  const loading = (orgId && !org && !orgQ.error) || (orgId && isPass && !toursQ.data && !toursQ.error);
  if (orgQ.error && !org) return <BillingError onRetry={orgQ.reload} requestId={orgQ.error.requestId} />;
  if (loading) {
    return (
      <>
        <p className="sr" role="status">
          Kasse wird geladen
        </p>
        <div className="co" aria-hidden="true">
          <div className="co-main">
            <span className="sk" style={{ display: "block", width: "50%", height: 40 }} />
            <span className="sk" style={{ display: "block", height: 120, marginTop: 28, borderRadius: 20 }} />
            <span className="sk" style={{ display: "block", height: 160, marginTop: 12, borderRadius: 20 }} />
          </div>
          <span className="sk" style={{ display: "block", height: 320, borderRadius: 22 }} />
        </div>
      </>
    );
  }

  if (!isPass && org?.plan.id === "plus") {
    return (
      <div className="done">
        <h1 className="co-h">{org.name} hat schon Plus.</h1>
        <p className="done-p">Plus gilt für alle Turniere der Organisation, ein Pass ist nicht nötig.</p>
        <div className="done-a">
          <Link className="btn btn-ink" href={returnTo ?? "/abrechnung"}>
            {returnTo ? "Zurück" : "Zur Abrechnung"}
          </Link>
        </div>
      </div>
    );
  }
  const price = isPass ? PASS_PRICE : PLUS_PRICE;
  const today = !isPass && payBy === "invoice" ? 0 : price;
  const orgName = org?.name ?? name;
  const back = returnTo ? { href: returnTo, label: `Zurück zu ${tourName ?? askedTitle ?? "Tournament"}` } : org ? { href: "/abrechnung", label: B.checkout.back } : { href: "https://planary.ch/preise", label: "Zurück zu den Preisen" };

  const go = async () => {
    const e: { name?: string; email?: string } = {};
    if (!org) {
      if (name.trim().length < 2) e.name = "Gib der Organisation einen Namen.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = "Diese E-Mail-Adresse stimmt nicht.";
    }
    setErrs(e);
    if (Object.keys(e).length) return;
    if (isPass && !pickedTour) return setErr("Wähl das Turnier, für das der Pass gilt.");
    setBusy(true);
    setErr(null);
    const body: CheckoutBody = isPass ? { pass: "tournament", tournamentId: pickedTour as string, ...(returnTo ? { returnTo } : {}) } : { plan: "plus", payBy, ...(returnTo ? { returnTo } : {}) };
    try {
      const r: CheckoutResult & { orgId?: string } = org
        ? await act<CheckoutResult>(`/portal/orgs/${org.id}/checkout`, body)
        : await act<CheckoutResult & { orgId: string }>(`/portal/checkout`, { ...body, org: { name: name.trim(), email: email.trim() } });
      if (r.orgId) setCurrentOrg(r.orgId);
      try {
        sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify({ id: r.checkoutId, query: params.toString() }));
      } catch {
        // Private mode: a declined card then comes back to an empty form, nothing worse.
      }
      // Card: the provider's page (never card fields here). Invoice: the portal's done page.
      if (r.url.startsWith("/")) router.push(r.url);
      else window.location.assign(r.url);
    } catch (x) {
      setErr((x as OrgError).message);
      toast((x as OrgError).message, "err");
      setBusy(false);
    }
  };

  return (
    <>
      <Link className="back" href={back.href}>
        <Ic name="arrow-l" small />
        {back.label}
      </Link>
      <div className="co">
        <div className="co-main">
          <h1 className="co-h">{isPass ? B.checkout.passH : `Plus für ${orgName}`}</h1>
          <ol className="co-steps">
            {org ? (
              <li className="co-s">
                <span className="co-n">1</span>
                <div className="co-b">
                  <h2>{B.checkout.orgH}</h2>
                  {owned.length > 1 ? (
                    <div className="pick2" role="radiogroup" aria-label={B.checkout.orgH}>
                      {owned.map((o) => (
                        <Radio
                          key={o.id}
                          name="co-o"
                          on={o.id === org.id}
                          onPick={() => {
                            setOrgPick(o.id);
                            setTid(null);
                          }}
                          title={o.name}
                          sub={o.id === org.id ? `Rechnungen an ${org.contact.email}` : `Plan ${o.plan === "plus" ? "Plus" : "Gratis"}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="co-org">
                      <span className="logo" aria-hidden="true">
                        {org.initials}
                      </span>
                      <span className="grow">
                        <b>{org.name}</b>
                        <span>Rechnungen an {org.contact.email}</span>
                      </span>
                      <Link className="alink" href="/einstellungen">
                        Ändern
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            ) : (
              <li className="co-s">
                <span className="co-n">1</span>
                <div className="co-b">
                  <h2>{B.checkout.orgNewH}</h2>
                  <p className="box-s">Pässe und Rechnungen gehören einer Organisation. Du wirst ihr Inhaber.</p>
                  <div className="form-2" style={{ marginTop: 12 }}>
                    <div className="f">
                      <label className="f-l" htmlFor="co-on">
                        {B.checkout.orgName}
                      </label>
                      <input id="co-on" className="inp" value={name} autoComplete="organization" aria-invalid={!!errs.name} aria-describedby={errs.name ? "co-on-e" : undefined} onChange={(x) => setName(x.target.value)} />
                      {errs.name ? (
                        <span id="co-on-e" className="f-e">
                          {errs.name}
                        </span>
                      ) : null}
                    </div>
                    <div className="f">
                      <label className="f-l" htmlFor="co-om">
                        {B.checkout.orgMail}
                      </label>
                      <input id="co-om" className="inp" type="email" value={email} autoComplete="email" aria-invalid={!!errs.email} aria-describedby={errs.email ? "co-om-e" : undefined} onChange={(x) => setEmail(x.target.value)} />
                      {errs.email ? (
                        <span id="co-om-e" className="f-e">
                          {errs.email}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            )}
            {isPass ? (
              <li className="co-s">
                <span className="co-n">2</span>
                <div className="co-b">
                  <h2>{B.checkout.tourH}</h2>
                  {tours.length ? (
                    <div className="pick2" role="radiogroup" aria-label={B.checkout.tourH}>
                      {tours.map((t) => (
                        <Radio key={t.id} name="co-t" on={t.id === pickedTour} onPick={() => setTid(t.id)} title={t.name} sub={t.sub} />
                      ))}
                    </div>
                  ) : (
                    <p className="box-s" style={{ marginTop: 6 }}>
                      Noch kein Turnier, für das ein Pass gelten könnte. Leg es in Tournament an und kauf den Pass von dort.{" "}
                      <a className="alink" href="https://tournament.planary.ch/neu">
                        Turnier erstellen
                        <Ic name="arrow-ur" small />
                      </a>
                    </p>
                  )}
                </div>
              </li>
            ) : null}
            <li className="co-s">
              <span className="co-n">{isPass ? 3 : 2}</span>
              <div className="co-b">
                <h2>{B.checkout.payH}</h2>
                <div className="pick2" role="radiogroup" aria-label={B.checkout.payH}>
                  <Radio name="co-p" on={payBy === "card" || isPass} onPick={() => setPayBy("card")} icon="card" title={B.checkout.card} sub={B.checkout.cardS} />
                  <Radio name="co-p" on={!isPass && payBy === "invoice"} off={isPass} onPick={() => setPayBy("invoice")} icon="file" title={B.checkout.invoice} sub={isPass ? B.checkout.invoiceOff : B.checkout.invoiceS} />
                </div>
              </div>
            </li>
          </ol>
        </div>
        <aside className="co-sum" aria-labelledby="sum-h">
          <h2 id="sum-h" className="box-t">
            {B.checkout.sumH}
          </h2>
          <div className="lines" style={{ marginTop: 14 }}>
            <div className="ln">
              <span className="ln-m">
                <b>{isPass ? "Turnier-Pass" : "Plus"}</b>
                <span>{isPass ? (tourName ?? "Turnier wählen") : `${dateNarrow(nowMs)} bis ${dateNarrow(nowMs + YEAR - DAY)}`}</span>
              </span>
              <span className="ln-a">
                <b>{chf(price)}</b>
              </span>
            </div>
          </div>
          <div className="ln-tot">
            <span>{B.checkout.total}</span>
            <b>{chf(price)}</b>
          </div>
          <div className="today">
            <span>{B.checkout.today}</span>
            <b>{chf(today)}</b>
          </div>
          {failed && !busy ? (
            <>
              <div className="alert err" role="alert" style={{ marginTop: 14 }}>
                <Ic name="alert" />
                <span className="grow">
                  <b>{B.checkout.err}</b> {failed.failure ?? ""}
                </span>
              </div>
              <div className="due-pa" style={{ marginTop: 12 }}>
                <button className="btn btn-ink" type="button" style={{ flex: 1 }} disabled={busy} onClick={go}>
                  <Ic name="refresh" small />
                  {B.checkout.retry}
                </button>
                <button className="btn btn-line" type="button" disabled={busy} onClick={go}>
                  {B.checkout.other}
                </button>
              </div>
            </>
          ) : (
            <>
              {err ? (
                <div className="alert err" role="alert" style={{ marginTop: 14 }}>
                  <Ic name="alert" />
                  <span className="grow">{err}</span>
                </div>
              ) : null}
              <button className={`btn btn-ink co-go${busy ? " busy" : ""}`} type="button" disabled={busy || (isPass && !pickedTour)} onClick={go}>
                {!isPass && payBy === "invoice" ? <Ic name="check" small /> : <Ic name="lock" small />}
                {busy ? "Einen Moment" : !isPass && payBy === "invoice" ? B.checkout.goInvoice : B.checkout.go}
              </button>
            </>
          )}
          <p className="co-fine">
            {isPass ? B.checkout.passRule : `Verlängert sich am ${longDate(nowMs + YEAR)}. Wir erinnern dich 30 Tage vorher, kündigen geht im Portal mit einem Klick.`}
          </p>
          <p className="co-fine">
            Mit dem Kauf akzeptierst du die <a href="https://planary.ch/agb">AGB</a>, einschliesslich der <a href="https://planary.ch/agb#rueckerstattung">Rückerstattung</a>. Wie wir Daten bearbeiten, steht in der <a href="https://planary.ch/datenschutz">Datenschutzerklärung</a>.
          </p>
        </aside>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}
