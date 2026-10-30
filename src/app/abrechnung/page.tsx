"use client";

import Link from "next/link";
import { BillingError, BillingHead, BillingLoading, FiveLine, InvoiceRow, Lines, Meter, PassCard, PlusCard } from "@/components/billing";
import { OwnerOnly, usePageBusy, usePortal } from "@/components/Shell";
import { planPrice } from "@/components/status";
import { Chip, Ic } from "@/components/ui";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { VAULT_URL } from "@/lib/auth";
import { kasseHref, nextInvoice } from "@/lib/billing";
import { chf, chfShort, dateNarrow, longDate, shortDay } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { Billing, Plan, PortalApi } from "@/lib/org-contract";

const MONTH = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** "3. Februar" from a date (the year is clear from the banner around it). */
const dayMonthLong = (ms: number) => longDate(ms).replace(/ \d{4}$/, "");

function plusOf(b: Billing): Plan {
  return b.plans.find((p) => p.id === "plus") ?? b.plans[b.plans.length - 1];
}

/** PL-Plan-Gratis: usage against the limits, what's missing, both ways up. */
function GratisView({ b }: { b: Billing }) {
  const { org } = usePortal();
  const plan = b.plans.find((p) => p.id === "gratis") ?? b.plans[0];
  const l = plan.limits;
  return (
    <>
      <div className="g2">
        <section className="plan free" aria-labelledby="pf-h">
          <p className="plan-l">Dein Plan</p>
          <h2 id="pf-h" className="plan-n">
            {plan.name}
            <small>{chfShort(plan.price)}, kein Abo</small>
          </h2>
          <div className="use">
            <Meter label="Teams im grössten Turnier" used={b.usage.largestTournament} max={l.maxTeams} />
            <Meter label="Turniere gleichzeitig" used={b.usage.running} max={l.maxRunning} />
            <Meter label="Organisatoren" used={b.usage.organisers} max={l.maxOrganisers} />
            {org.services.includes("wishlist") ? <Meter label="Wishlist-Listen" used={b.usage.wishlists} max={plan.wishlist.maxLists} /> : null}
          </div>
        </section>
        <section className="box" aria-labelledby="mi-h">
          <div className="box-h">
            <h2 id="mi-h" className="box-t">
              {B.missingH}
            </h2>
          </div>
          <ul className="miss">
            {B.missing.map((x) => (
              <li key={x}>
                <Ic name="lock" small />
                {x}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="sec-l" aria-labelledby="up-h2">
        <h2 id="up-h2" className="b-h2">
          {B.upH}
        </h2>
        <div className="ups">
          <PassCard pass={b.pass} href={kasseHref("pass", { org: org.id })} />
          <PlusCard plus={plusOf(b)} href={kasseHref("plus", { org: org.id })} />
        </div>
        <FiveLine />
      </section>
    </>
  );
}

/** PL-Plan-Pass: Gratis with passes, each with its tournament, and what stays after it. */
function PassView({ b }: { b: Billing }) {
  const { org } = usePortal();
  const t = now();
  const year = new Date(t).getFullYear();
  const thisYear = b.passes.filter((p) => new Date(p.boughtAt).getFullYear() === year);
  const active = b.passes.filter((p) => p.state === "active").length;
  const { data: tours } = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(`/portal/orgs/${org.id}/tournaments`);
  const startsAt = (id: string) => tours?.tournaments.find((x) => x.id === id)?.startsAt ?? null;
  return (
    <div className="g3">
      <div className="stack">
        <section className="box" aria-labelledby="ps-h">
          <div className="box-h">
            <h2 id="ps-h" className="box-t">
              Turnier-Pässe
            </h2>
            <Link className="btn btn-line btn-s" href={kasseHref("pass", { org: org.id })}>
              <Ic name="plus" small />
              Weiteren Pass kaufen
            </Link>
          </div>
          <div className="passes">
            {b.passes.map((p) => (
              <div className={`pass${p.state === "done" ? " spent" : " act"}`} key={p.id}>
                <span className="pass-i" aria-hidden="true">
                  <Ic name="trophy" />
                </span>
                <div className="pass-m">
                  <p>
                    <b>{p.tournamentName}</b>
                    {p.state === "active" ? (
                      <Chip chip="ok" dot="ok">
                        Aktiv
                      </Chip>
                    ) : (
                      <Chip dot="">Abgeschlossen</Chip>
                    )}
                  </p>
                  <span className="s">
                    {[startsAt(p.tournamentId) ? shortDay(startsAt(p.tournamentId) as number) : "", `gekauft am ${dateNarrow(p.boughtAt)}`, chf(p.amount)].filter(Boolean).join(" · ")}
                  </span>
                  {p.state === "active" ? (
                    <div className="pass-u">
                      <span className="meter" role="meter" aria-valuemin={0} aria-valuemax={b.pass.limits.maxTeams} aria-valuenow={p.teams} aria-label={`${p.teams} von ${b.pass.limits.maxTeams} Teams`}>
                        <i style={{ width: `${Math.min(100, Math.round((p.teams / b.pass.limits.maxTeams) * 100))}%` }} />
                      </span>
                      <span className="s">
                        {p.teams} von {b.pass.limits.maxTeams} Teams
                      </span>
                    </div>
                  ) : (
                    <div className="kept">
                      <b>Was nach dem Turnier bleibt</b>
                      <p>Alles, was das Turnier hatte: Teams, Resultate, Bracket und Export. Es bleibt für immer sichtbar. Ändern kannst du es nur noch im Rahmen von Gratis.</p>
                    </div>
                  )}
                </div>
                {p.receiptUrl ? (
                  <a className="alink" href={p.receiptUrl}>
                    <Ic name="download" small />
                    Beleg<span className="sr"> für {p.tournamentName}</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="stack">
        <section className="plan free" aria-labelledby="pp-h">
          <p className="plan-l">Dein Plan</p>
          <h2 id="pp-h" className="plan-n">
            Gratis<small>{active ? `mit ${active} aktiven ${active === 1 ? "Pass" : "Pässen"}` : "CHF 0, kein Abo"}</small>
          </h2>
          <div className="plan-f">
            <span>
              {year}: {thisYear.length} {thisYear.length === 1 ? "Pass" : "Pässe"}, {chf(thisYear.reduce((n, p) => n + p.amount, 0))}
            </span>
          </div>
        </section>
        <PlusCard plus={plusOf(b)} href={kasseHref("plus", { org: org.id })} short />
      </div>
    </div>
  );
}

/** PL-Overdue: calm, what keeps running, what pauses, how to pay. */
function Overdue({ b }: { b: Billing }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const inv = b.invoices.find((i) => i.status === "open" && i.overdueDays > 0) ?? b.invoices.find((i) => i.status === "open");
  if (!inv) return null;
  const until = b.graceUntil ? dayMonthLong(b.graceUntil) : null;
  const pay = async () => {
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/invoices/${inv.id}/pay`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  return (
    <section className="due" aria-labelledby="due-h">
      <div className="due-t">
        <h2 id="due-h">{B.overdue.h}</h2>
        <p>{until ? `Plus läuft bis ${until} normal weiter. Danach gelten für neue Turniere die Grenzen von Gratis, bis die Rechnung bezahlt ist.` : "Plus läuft normal weiter, bis die Rechnung bezahlt ist."}</p>
      </div>
      <div className="due-c">
        <h3>{B.overdue.keepH}</h3>
        <ul>
          {B.overdue.keep.map((x) => (
            <li key={x}>
              <Ic name="check" small />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="due-c">
        <h3>{until ? `Ab ${until} pausiert` : "Danach pausiert"}</h3>
        <ul>
          {B.overdue.stop.map((x) => (
            <li key={x}>
              <Ic name="clock" small />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="due-p">
        <h3>{B.overdue.payH}</h3>
        <div className="due-pa">
          <button className="btn btn-ink btn-s" type="button" onClick={pay}>
            <Ic name="card" small />
            {B.overdue.card}
          </button>
          {inv.pdfUrl ? (
            <a className="btn btn-line btn-s" href={inv.pdfUrl}>
              <Ic name="download" small />
              {B.overdue.qr}
            </a>
          ) : null}
        </div>
        <p>{B.overdue.paid}</p>
        <Link className="alink" href="/support/neu?topic=billing">
          {B.overdue.time}
          <Ic name="arrow-r" small />
        </Link>
      </div>
    </section>
  );
}

/** PL-Plan-Plus, with the overdue panel, the card note or the cancel note on top when they apply. */
function PlusView({ b }: { b: Billing }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const plan = b.plans.find((p) => p.id === b.current) ?? plusOf(b);
  const pm = b.paymentMethod;
  const next = nextInvoice(b);
  const cardSoon = b.state === "card_expires" && pm?.kind === "card";
  const stripe = async () => {
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/billing-portal`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  const payBy = async (to: "invoice" | "card") => {
    try {
      await act(`/portal/orgs/${org.id}/pay-by`, { payBy: to });
      toast(to === "invoice" ? "Die nächste Rechnung kommt per E-Mail mit QR-Rechnung." : "Die nächste Rechnung wird der Karte belastet.");
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  const stay = async () => {
    try {
      await act(`/portal/orgs/${org.id}/cancel/undo`);
      toast("Plus bleibt. Es verlängert sich wie bisher.");
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  return (
    <>
      {b.state === "overdue" ? <Overdue b={b} /> : null}
      {cardSoon && b.renewsAt ? (
        <div className="alert info b-note" role="status">
          <Ic name="card" />
          <span className="grow">
            <b>
              Deine Karte läuft im {MONTH[pm.expMonth - 1]} ab, Plus verlängert sich am {dayMonthLong(b.renewsAt)}.
            </b>
          </span>
          <button className="btn btn-ink btn-s" type="button" onClick={stripe}>
            {B.cardExp.cta}
          </button>
          <button className="btn btn-ghost btn-s" type="button" onClick={() => payBy("invoice")}>
            {B.cardExp.alt}
          </button>
        </div>
      ) : null}
      {b.state === "canceling" && b.cancelAt ? (
        <div className="alert info b-note" role="status">
          <Ic name="info" />
          <span className="grow">
            <b>Ab {longDate(b.cancelAt)} seid ihr auf Gratis.</b> Bis dahin läuft Plus wie gewohnt.
          </span>
          <button className="btn btn-ink btn-s" type="button" onClick={stay}>
            {B.cancel.keepPlus}
          </button>
        </div>
      ) : null}
      <div className="g3">
        <div className="stack">
          <section className="box" aria-labelledby="ab-h">
            <div className="box-h">
              <h2 id="ab-h" className="box-t">
                {B.lines.h}
              </h2>
            </div>
            <Lines b={b} />
            {next || b.reminderAt ? (
              <div className="ln-f">
                <span>{next ?? (b.cancelAt ? `Keine weitere Rechnung, Gratis ab ${longDate(b.cancelAt)}` : "")}</span>
                {b.reminderAt && !b.cancelAt ? <span className="box-s">Erinnerung am {longDate(b.reminderAt)}</span> : null}
              </div>
            ) : null}
          </section>
          <section className="box" aria-labelledby="li-h">
            <div className="box-h">
              <h2 id="li-h" className="box-t">
                {B.lastInv}
              </h2>
              <Link className="alink" href="/abrechnung/rechnungen">
                {B.allInv}
                <Ic name="arrow-r" small />
              </Link>
            </div>
            <div>
              {b.invoices.length ? b.invoices.slice(0, 2).map((i) => <InvoiceRow i={i} key={i.id} />) : <p className="box-s">Noch keine Rechnungen.</p>}
            </div>
          </section>
          <section className="box" aria-labelledby="us2-h">
            <div className="box-h">
              <h2 id="us2-h" className="box-t">
                Nutzung
              </h2>
            </div>
            <div className="use use3">
              <UseCell label="Grösstes Turnier" sub={`von ${plan.limits.maxTeams} Teams`} v={b.usage.largestTournament} max={plan.limits.maxTeams} />
              <UseCell label="Gleichzeitig" sub={plan.limits.maxRunning === null ? "Turniere, unbegrenzt" : `von ${plan.limits.maxRunning}`} v={b.usage.running} max={plan.limits.maxRunning} />
              <UseCell label="Organisatoren" sub={`von ${plan.limits.maxOrganisers}`} v={b.usage.organisers} max={plan.limits.maxOrganisers} />
            </div>
          </section>
        </div>
        <div className="stack">
          <section className="plan" aria-labelledby="pl-h">
            <p className="plan-l">Dein Plan</p>
            <h2 id="pl-h" className="plan-n">
              {plan.name}
              <small>{planPrice(plan)}</small>
            </h2>
            <div className="plan-f">
              <span>{b.cancelAt ? `Plus bis ${longDate(b.cancelAt - 86_400_000)}` : b.renewsAt ? `Verlängert sich am ${longDate(b.renewsAt)}` : ""}</span>
            </div>
          </section>
          <section className={`box${cardSoon ? " hl" : ""}`} aria-labelledby="pm2-h">
            <div className="box-h">
              <h2 id="pm2-h" className="box-t">
                {B.payH}
              </h2>
              <span className="box-s">{B.payNote}</span>
            </div>
            {b.payBy === "invoice" ? (
              <div className="paym">
                <span className="cardi" aria-hidden="true">
                  <Ic name="mail" small />
                </span>
                <div className="grow">
                  <b>Rechnung per E-Mail</b>
                  <span className="s">mit QR-Rechnung, zahlbar in 30 Tagen</span>
                </div>
              </div>
            ) : pm ? (
              <div className="paym">
                <span className="cardi" aria-hidden="true">
                  {pm.kind === "card" ? pm.brand.toUpperCase().slice(0, 4) : "TWINT"}
                </span>
                <div className="grow">
                  <b>{pm.kind === "card" ? `${pm.brand.charAt(0).toUpperCase()}${pm.brand.slice(1)} •••• ${pm.last4}` : "TWINT"}</b>
                  {pm.kind === "card" ? (
                    <span className={`s${cardSoon ? " warn-t" : ""}`}>
                      {cardSoon ? `Läuft ab ${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}, vor der Verlängerung.` : `läuft ab ${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}`}
                    </span>
                  ) : null}
                </div>
                <button className="btn btn-line btn-s" type="button" onClick={stripe}>
                  {B.payCta}
                  <Ic name="arrow-ur" small />
                </button>
              </div>
            ) : (
              <p className="box-s">Noch keins hinterlegt.</p>
            )}
            <button className="alink" type="button" style={{ marginTop: 8 }} onClick={() => payBy(b.payBy === "invoice" ? "card" : "invoice")}>
              {b.payBy === "invoice" ? "Mit Karte zahlen" : B.payAlt}
              <Ic name="arrow-r" small />
            </button>
          </section>
          <section className="box" aria-labelledby="ct-h">
            <div className="box-h">
              <h2 id="ct-h" className="box-t">
                {B.contactH}
              </h2>
              <Link className="alink" href="/einstellungen">
                {B.contactCta}
              </Link>
            </div>
            <p className="addr">
              <b style={{ display: "block" }}>{b.contact.email}</b>
              {b.contact.address.map((a, i) => (
                <span key={i} style={{ display: "block" }}>
                  {a}
                </span>
              ))}
            </p>
          </section>
          {b.state !== "canceling" ? (
            <p className="out">
              <Link className="ul" href="/abrechnung/wechseln">
                {B.out}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Vault's own subscription (ADR 0003): plan, price, what happens next. Changes are made in Vault. */
function VaultCard({ b }: { b: Billing }) {
  const v = b.vault;
  const plan = v.plans.find((p) => p.id === v.current) ?? v.plans[0];
  const price =
    v.current === "free" ? "CHF 0" : v.period === "year" ? `${chf(plan.yearly)} pro Jahr` : v.period === "month" ? `${chf(plan.monthly)} pro Monat` : "von Planary freigeschaltet";
  const pending = v.pending ? v.plans.find((p) => p.id === v.pending?.plan) : null;
  const status = v.cancelAt
    ? `Ab ${longDate(v.cancelAt)} gilt Vault Free. Es wird nichts gelöscht.`
    : pending && v.renewsAt
      ? `Wechselt am ${longDate(v.renewsAt)} zu ${pending.name}, ${v.pending?.period === "year" ? "jährlich" : "monatlich"}.`
      : v.renewsAt
        ? `Verlängert sich am ${longDate(v.renewsAt)}.`
        : `${plan.quotaGb >= 1024 ? `${plan.quotaGb / 1024} TB` : `${plan.quotaGb} GB`}, Ende-zu-Ende verschlüsselt.`;
  return (
    <section className="plan" aria-labelledby="va-h">
      <p className="plan-l">Vault</p>
      <h2 id="va-h" className="plan-n">
        {plan.name}
        <small>{price}</small>
      </h2>
      <div className="plan-f">
        <span>{status}</span>
      </div>
      <a className="alink" href={`${VAULT_URL}/plans`}>
        {v.current === "free" ? "Pläne ansehen" : "In Vault verwalten"}
        <Ic name="arrow-ur" small />
      </a>
    </section>
  );
}

/** A personal account (someone who pays for Vault on their own): Vault, invoices, payment, contact. */
function PersonalView({ b }: { b: Billing }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const pm = b.paymentMethod;
  const open = b.invoices.find((i) => i.status === "open");
  const stripe = async () => {
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/billing-portal`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  const pay = async () => {
    if (!open) return;
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/invoices/${open.id}/pay`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  return (
    <>
      {open && open.overdueDays > 0 ? (
        <div className="alert info b-note" role="status">
          <Ic name="info" />
          <span className="grow">
            <b>Eine Rechnung ist seit {open.overdueDays} {open.overdueDays === 1 ? "Tag" : "Tagen"} offen.</b> Vault läuft normal weiter. Bleibt sie länger offen, gilt Vault Free, bis sie bezahlt ist. Es wird nichts gelöscht.
          </span>
          <button className="btn btn-ink btn-s" type="button" onClick={pay}>
            Jetzt bezahlen
          </button>
        </div>
      ) : null}
      <div className="g3">
        <div className="stack">
          {b.lines.length ? (
            <section className="box" aria-labelledby="pab-h">
              <div className="box-h">
                <h2 id="pab-h" className="box-t">
                  {B.lines.h}
                </h2>
              </div>
              {/* Nothing here is an add-on to anything: no kind chips. */}
              <Lines b={b} chips={false} />
            </section>
          ) : null}
          <section className="box" aria-labelledby="pli-h">
            <div className="box-h">
              <h2 id="pli-h" className="box-t">
                {B.lastInv}
              </h2>
              <Link className="alink" href="/abrechnung/rechnungen">
                {B.allInv}
                <Ic name="arrow-r" small />
              </Link>
            </div>
            <div>{b.invoices.length ? b.invoices.slice(0, 3).map((i) => <InvoiceRow i={i} key={i.id} />) : <p className="box-s">Noch keine Rechnungen.</p>}</div>
          </section>
        </div>
        <div className="stack">
          <VaultCard b={b} />
          <section className="box" aria-labelledby="ppm-h">
            <div className="box-h">
              <h2 id="ppm-h" className="box-t">
                {B.payH}
              </h2>
            </div>
            {b.vault.payBy === "invoice" ? (
              <p className="box-s">Rechnung per E-Mail mit QR-Rechnung, zahlbar in 30 Tagen.</p>
            ) : pm && pm.kind === "card" ? (
              <div className="paym">
                <span className="cardi" aria-hidden="true">
                  {pm.brand.toUpperCase().slice(0, 4)}
                </span>
                <div className="grow">
                  <b>{`${pm.brand.charAt(0).toUpperCase()}${pm.brand.slice(1)} •••• ${pm.last4}`}</b>
                  <span className="s">läuft ab {String(pm.expMonth).padStart(2, "0")}/{String(pm.expYear).slice(-2)}</span>
                </div>
                <button className="btn btn-line btn-s" type="button" onClick={stripe}>
                  {B.payCta}
                  <Ic name="arrow-ur" small />
                </button>
              </div>
            ) : (
              <p className="box-s">Noch keins hinterlegt.</p>
            )}
          </section>
          <section className="box" aria-labelledby="pct-h">
            <div className="box-h">
              <h2 id="pct-h" className="box-t">
                {B.contactH}
              </h2>
            </div>
            <p className="addr">
              <b style={{ display: "block" }}>{b.contact.email}</b>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

function UseCell({ label, sub, v, max }: { label: string; sub: string; v: number; max: number | null }) {
  const pct = max ? Math.min(100, Math.round((v / max) * 100)) : 0;
  return (
    <div className="use-r">
      <div className="use-h">
        <b>{label}</b>
        <span>{sub}</span>
      </div>
      <span className="use-v">{v}</span>
      {max !== null ? (
        <span className={`meter${pct >= 100 ? " full" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={v} aria-label={`${label}: ${v} von ${max}`}>
          <i style={{ width: `${pct}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function Plan() {
  const { org } = usePortal();
  const { data, error, reload } = useOrg<Billing>(`/portal/orgs/${org.id}/billing`, 60_000);
  usePageBusy(!data && !error);
  if (error && !data) return <BillingError onRetry={reload} requestId={error.requestId} />;
  if (!data) return <BillingLoading />;
  if (org.kind === "personal") return <PersonalView b={data} />;
  const view = data.current === "plus" ? <PlusView b={data} /> : data.passes.length ? <PassView b={data} /> : <GratisView b={data} />;
  // An organisation that also pays for Vault sees that subscription below its plan.
  return data.vault.current === "free" ? (
    view
  ) : (
    <>
      {view}
      <div className="g2 sec-l">
        <VaultCard b={data} />
      </div>
    </>
  );
}

export default function BillingPage() {
  return (
    <>
      <BillingHead on="plan" />
      <OwnerOnly>
        <Plan />
      </OwnerOnly>
    </>
  );
}
