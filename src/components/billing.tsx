"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { invoiceState, KIND_LABEL, lineName, lineSub } from "@/lib/billing";
import { chf, chfShort, date } from "@/lib/fmt";
import type { Billing, Invoice, Pass, Plan } from "@/lib/org-contract";
import { Chip, Ic, PageHead } from "./ui";

/** "Abrechnung" with the Plan · Rechnungen switch. */
export function BillingHead({ on }: { on: "plan" | "invoices" }) {
  return (
    <PageHead title={B.h}>
      <nav className="seg" aria-label={B.h}>
        <Link href="/abrechnung" className={on === "plan" ? "on" : ""} aria-current={on === "plan" ? "page" : undefined}>
          {B.tabs[0][1]}
        </Link>
        <Link href="/abrechnung/rechnungen" className={on === "invoices" ? "on" : ""} aria-current={on === "invoices" ? "page" : undefined}>
          {B.tabs[1][1]}
        </Link>
      </nav>
    </PageHead>
  );
}

/** PL-Plan-Error: billing doesn't load, tournaments keep running. */
export function BillingError({ onRetry, requestId }: { onRetry: () => void; requestId?: string }) {
  return (
    <div className="b-err" role="alert">
      <Ic name="alert" />
      <div>
        <h2>{B.error.t}</h2>
        <p>
          {B.error.s}
          {requestId ? (
            <>
              {" "}
              Fehlernummer <span className="mono-t">{requestId}</span>.
            </>
          ) : null}
        </p>
      </div>
      <div className="b-err-a">
        <button className="btn btn-ink btn-s" type="button" onClick={onRetry}>
          <Ic name="refresh" small />
          {B.error.retry}
        </button>
        <a className="alink" href="https://planary.ch/status">
          {B.error.status}
          <Ic name="arrow-ur" small />
        </a>
      </div>
    </div>
  );
}

const sk = (w: string, h: number, mt = 0, r?: number) => <span className="sk" style={{ display: "block", width: w, height: h, marginTop: mt, ...(r ? { borderRadius: r } : {}) }} />;

/** PL-Plan-Loading: flat blocks in the shape of the plan page. */
export function BillingLoading() {
  return (
    <>
      <p className="sr" role="status">
        {B.loading.label}
      </p>
      <div className="g3" aria-hidden="true">
        <div className="stack">
          <div className="box">
            {sk("30%", 14)}
            {sk("100%", 52, 18)}
            {sk("100%", 52, 10)}
            {sk("60%", 14, 18)}
          </div>
          <div className="box">
            {sk("24%", 14)}
            {sk("100%", 38, 18)}
            {sk("100%", 38, 8)}
          </div>
        </div>
        <div className="stack">
          {sk("100%", 220, 0, 22)}
          <div className="box">
            {sk("40%", 14)}
            {sk("100%", 40, 16)}
          </div>
        </div>
      </div>
    </>
  );
}

/** The subscription's lines: base plan, add-ons, one-offs. */
export function Lines({ b, chips = true }: { b: Billing; chips?: boolean }) {
  return (
    <div className="lines">
      {b.lines.map((l, i) => (
        <div className="ln" key={i}>
          {chips ? <span className={`chip ${KIND_LABEL[l.kind].chip}`}>{KIND_LABEL[l.kind].label}</span> : null}
          <span className="ln-m">
            <b>{lineName(l)}</b>
            <span>{lineSub(l, b)}</span>
          </span>
          <span className="ln-a">
            <b>{chf(l.amount)}</b>
            <span>{l.period === "year" ? "pro Jahr" : l.period === "month" ? "pro Monat" : "einmalig"}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function InvoiceChip({ i }: { i: Invoice }) {
  const st = invoiceState(i);
  return (
    <Chip chip={st.chip} dot={st.dot}>
      {st.label}
    </Chip>
  );
}

/** A meter row: label, value, bar. A full meter turns amber, so a limit is seen before it's met. */
export function Meter({ label, used, max, unit }: { label: string; used: number; max: number | null; unit?: string }) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="use-r">
      <div className="use-h">
        <b>{label}</b>
        <span>{max === null ? `${used}${unit ? ` ${unit}` : ""}, unbegrenzt` : `${used} von ${max}`}</span>
      </div>
      {max !== null ? (
        <span className={`meter${pct >= 100 ? " full" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used} aria-label={`${label}: ${used} von ${max}`}>
          <i style={{ width: `${pct}%` }} />
        </span>
      ) : null}
    </div>
  );
}

/** The Turnier-Pass card (ticket) and the Plus card (ink), side by side. */
export function PassCard({ pass, href, children }: { pass: Pass; href: string; children?: ReactNode }) {
  return (
    <article className="up" aria-labelledby="up-pass">
      <div className="up-t">
        <h3 id="up-pass">{B.pass.n}</h3>
        <span className="tkt" aria-hidden="true" />
      </div>
      <p className="up-p">
        {chfShort(pass.price)}
        <small>{B.pass.per}</small>
      </p>
      <ul>
        {B.pass.inc.map((x) => (
          <li key={x}>
            <Ic name="check" small />
            {x}
          </li>
        ))}
      </ul>
      {children}
      <Link className="btn btn-line" href={href}>
        {B.pass.cta}
      </Link>
    </article>
  );
}

export function PlusCard({ plus, href, short = false }: { plus: Plan; href: string; short?: boolean }) {
  return (
    <article className="up ink" aria-labelledby="up-plus">
      <div className="up-t">
        <h3 id="up-plus">{B.plus.n}</h3>
      </div>
      <p className="up-p">
        {chfShort(plus.price)}
        <small>{B.plus.per}</small>
      </p>
      {short ? (
        <p className="up-s">{B.five}</p>
      ) : (
        <ul>
          {B.plus.inc.map((x) => (
            <li key={x}>
              <Ic name="check" small />
              {x}
            </li>
          ))}
        </ul>
      )}
      <Link className="btn btn-paper" href={href}>
        {B.plus.cta}
      </Link>
    </article>
  );
}

/** "Ab fünf Turnieren im Jahr lohnt sich Plus." and the link to the full comparison. */
export function FiveLine() {
  return (
    <p className="five">
      <Ic name="info" small />
      <span>{B.five}</span>
      <a className="alink" href="https://planary.ch/preise/vergleich">
        {B.compare}
        <Ic name="arrow-r" small />
      </a>
    </p>
  );
}

export function InvoiceRow({ i }: { i: Invoice }) {
  return (
    <div className="list-r inv-r">
      <span className="grow">
        <b>{i.description}</b>
        <span className="s">
          <span className="mono-t">{i.number}</span> · {date(i.createdAt)}
        </span>
      </span>
      <b>{chf(i.amount)}</b>
      <InvoiceChip i={i} />
      {i.pdfUrl ? (
        <a className="ib" href={i.pdfUrl} aria-label={`${i.number} als PDF`}>
          <Ic name="download" small />
        </a>
      ) : null}
    </div>
  );
}
