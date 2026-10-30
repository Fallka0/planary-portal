"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BillingError } from "@/components/billing";
import { Ic } from "@/components/ui";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { VAULT_URL } from "@/lib/auth";
import { CHECKOUT_KEY, safeReturn } from "@/lib/billing";
import { setCurrentOrg } from "@/lib/current-org";
import { chf } from "@/lib/fmt";
import { useOrg } from "@/lib/org";
import type { CheckoutStatus, PortalOrg } from "@/lib/org-contract";

const VAULT_NOW: Record<"plus" | "pro", string[]> = {
  plus: ["200 GB, Dateien bis 20 GB", "Versionen ein Jahr lang", "Links bis ein Jahr, 100 Downloads", "Ende-zu-Ende verschlüsselt, wie bisher"],
  pro: ["2 TB, Dateien bis 50 GB", "Alle Versionen bleiben", "Links ohne Grenzen", "Ende-zu-Ende verschlüsselt, wie bisher"],
};
const VAULT_PRICE = { plus: { month: 400, year: 4000 }, pro: { month: 1000, year: 10000 } };

const PASS_NOW = ["Bis 128 Teams in diesem Turnier", "10 Organisatoren", "Warteliste, eigenes Logo, Export", "Gilt, bis das Turnier abgeschlossen ist. Danach bleibt alles sichtbar."];

/** PL-Done: what is unlocked now, and the way back to where the organiser was. */
function Done() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  // After two minutes without an answer the page says so and lets the person go.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 120_000);
    return () => window.clearTimeout(t);
  }, []);
  // Waits for the provider's confirmation: every two seconds while pending, for up to two minutes.
  const [answer, setAnswer] = useState<CheckoutStatus | null>(null);
  const st = useOrg<CheckoutStatus>(id ? `/portal/checkout/${encodeURIComponent(id)}` : null, answer && answer.state !== "pending" ? 0 : 2_000);
  const c = st.data;
  if (c && c !== answer && c.state !== "pending") setAnswer(c);
  const orgQ = useOrg<PortalOrg>(c?.state === "paid" ? `/portal/orgs/${c.orgId}` : null);

  useEffect(() => {
    if (c?.state === "paid") setCurrentOrg(c.orgId);
    if (c?.state !== "failed") return;
    // Declined: back to the same checkout, which shows why and offers to try again.
    // Vault is bought in Vault: a declined card goes back there.
    if (c.product === "vault") {
      const back = safeReturn(c.returnTo);
      if (back) {
        const u = new URL(back);
        u.searchParams.set("checkout", "failed");
        window.location.replace(u.toString());
      }
      else router.replace("/abrechnung");
      return;
    }
    let query = c.kind === "plan" ? "plan=plus" : `pass=tournament${c.tournamentId ? `&tournament=${c.tournamentId}` : ""}`;
    try {
      const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) ?? "null") as { id: string; query: string } | null;
      if (saved?.id === c.id) query = saved.query;
    } catch {
      // Nothing saved: the defaults above.
    }
    const q = new URLSearchParams(query);
    q.set("checkout", c.id);
    q.set("org", c.orgId);
    router.replace(`/kasse?${q}`);
  }, [c, router]);

  if (!id) {
    return (
      <div className="done">
        <h1 className="co-h">Nichts zu bestätigen.</h1>
        <div className="done-a">
          <Link className="btn btn-ink" href="/abrechnung">
            Zur Abrechnung
          </Link>
        </div>
      </div>
    );
  }
  if (st.error && !c) return <BillingError onRetry={st.reload} requestId={st.error.requestId} />;
  if (!c || c.state !== "paid") {
    return (
      <section className="done" aria-labelledby="dn-h" aria-busy="true">
        <span className="prog-top" aria-hidden="true" />
        <h1 id="dn-h" className="co-h">
          {slow ? "Die Bestätigung dauert länger." : "Zahlung wird bestätigt."}
        </h1>
        <p className="done-p" role="status">
          {slow ? "Du bekommst eine E-Mail, sobald sie da ist. Du kannst diese Seite schliessen." : "Einen Moment, das dauert meist nur ein paar Sekunden."}
        </p>
      </section>
    );
  }

  const plan = c.kind === "plan";
  const vault = c.product === "vault" && c.productPlan ? c.productPlan : null;
  const back = safeReturn(c.returnTo);
  const org = orgQ.data;
  const invoiceAmount = vault ? VAULT_PRICE[vault][c.period ?? "year"] : 14900;
  const paidLine =
    plan && c.payBy === "invoice"
      ? `${org?.name ?? ""} · Rechnung über ${chf(invoiceAmount)} an ${c.receiptEmail}, zahlbar in 30 Tagen`
      : `${org?.name ?? ""} · ${chf(c.amount)} bezahlt · Beleg an ${c.receiptEmail}`;
  if (vault) {
    return (
      <section className="done" aria-labelledby="dn-h">
        <span className="done-i" aria-hidden="true">
          <Ic name="check" />
        </span>
        <h1 id="dn-h" className="co-h">
          {vault === "pro" ? "Vault Pro" : "Vault Plus"} ist aktiv.
        </h1>
        <p className="done-p">{paidLine.replace(/^ · /, "")}</p>
        <div className="done-g">
          <div className="box">
            <h2 className="box-t">{B.done.nowH}</h2>
            <ul className="miss" style={{ marginTop: 14 }}>
              {VAULT_NOW[vault].map((x) => (
                <li key={x}>
                  <Ic name="check" small />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="box">
            <h2 className="box-t">{B.done.nextH}</h2>
            <div className="done-a">
              <a className="btn btn-ink" href={back ?? `${VAULT_URL}/plans?checkout=done`}>
                <Ic name="arrow-l" small />
                Zurück zu Vault
              </a>
              <Link className="btn btn-line" href="/abrechnung">
                <Ic name="arrow-r" small />
                Zur Abrechnung
              </Link>
              {c.receiptUrl ? (
                <a className="alink" href={c.receiptUrl}>
                  <Ic name="download" small />
                  {B.done.pdf}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="done" aria-labelledby="dn-h">
      <span className="done-i" aria-hidden="true">
        <Ic name="check" />
      </span>
      <h1 id="dn-h" className="co-h">
        {plan ? B.done.h : `Der Turnier-Pass für ${c.tournamentName ?? "dein Turnier"} ist aktiv.`}
      </h1>
      <p className="done-p">{paidLine.replace(/^ · /, "")}</p>
      <div className="done-g">
        <div className="box">
          <h2 className="box-t">{B.done.nowH}</h2>
          <ul className="miss" style={{ marginTop: 14 }}>
            {(plan ? B.done.now : PASS_NOW).map((x) => (
              <li key={x}>
                <Ic name="check" small />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="box">
          <h2 className="box-t">{B.done.nextH}</h2>
          <div className="done-a">
            {back ? (
              <a className="btn btn-ink" href={back}>
                <Ic name="arrow-l" small />
                Zurück zu {c.tournamentName ?? "Tournament"}
              </a>
            ) : (
              <Link className="btn btn-ink" href="/abrechnung">
                <Ic name="arrow-r" small />
                Zur Abrechnung
              </Link>
            )}
            <Link className="btn btn-line" href="/team">
              <Ic name="users" small />
              {B.done.team}
            </Link>
            <Link className="btn btn-line" href="/einstellungen">
              <Ic name="upload" small />
              {B.done.logo}
            </Link>
            {c.receiptUrl ? (
              <a className="alink" href={c.receiptUrl}>
                <Ic name="download" small />
                {B.done.pdf}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DonePage() {
  return (
    <Suspense fallback={null}>
      <Done />
    </Suspense>
  );
}
