"use client";

import { useState } from "react";
import { BillingError, BillingHead, BillingLoading, InvoiceChip } from "@/components/billing";
import { OwnerOnly, usePageBusy, usePortal } from "@/components/Shell";
import { Empty, Ic, Table, Td } from "@/components/ui";
import { PORTAL_BILLING as B } from "@/design/billing-copy";
import { invoiceState, lineName } from "@/lib/billing";
import { chf, date } from "@/lib/fmt";
import { type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { Billing, Invoice } from "@/lib/org-contract";

function Detail({ i }: { i: Invoice }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const st = invoiceState(i);
  const pay = async () => {
    try {
      const { url } = await act<{ url: string }>(`/portal/orgs/${org.id}/invoices/${i.id}/pay`);
      window.location.assign(url);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };
  return (
    <section className="box inv-d" aria-labelledby="ivd-h">
      <div className="box-h">
        <h2 id="ivd-h" className="box-t">
          {B.inv.detailH} <span className="mono-t">{i.number}</span>
        </h2>
        <InvoiceChip i={i} />
      </div>
      <p className="box-s">
        {date(i.createdAt)}
        {i.dueAt ? ` · ${B.inv.due} ${date(i.dueAt)}` : ""}
      </p>
      <div className="lines" style={{ marginTop: 14 }}>
        {(i.lines.length ? i.lines : [{ kind: "base" as const, name: i.description, period: "once" as const, amount: i.amount, tournamentId: null }]).map((l, n) => (
          <div className="ln" key={n}>
            <span className="ln-m">
              <b>{lineName(l)}</b>
              <span>{l.name.split(" · ")[1] ?? (l.kind === "base" ? i.description.replace(/^Plus, /, "") : "")}</span>
            </span>
            <span className="ln-a">
              <b>{chf(l.amount)}</b>
            </span>
          </div>
        ))}
      </div>
      <div className="ln-tot">
        <span>{B.inv.total}</span>
        <b>{chf(i.amount)}</b>
      </div>
      <div className="due-pa" style={{ marginTop: 16 }}>
        {st.open ? (
          <button className="btn btn-ink btn-s" type="button" onClick={pay}>
            <Ic name="card" small />
            {B.inv.payCard}
          </button>
        ) : null}
        {i.pdfUrl ? (
          <a className="btn btn-line btn-s" href={i.pdfUrl}>
            <Ic name="download" small />
            {st.open ? B.inv.qr : "PDF"}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function Invoices() {
  const { org } = usePortal();
  const { data, error, reload } = useOrg<Billing>(`/portal/orgs/${org.id}/billing`, 60_000);
  usePageBusy(!data && !error);
  const [sel, setSel] = useState<string | null>(null);
  if (error && !data) return <BillingError onRetry={reload} requestId={error.requestId} />;
  if (!data) return <BillingLoading />;
  if (!data.invoices.length)
    return (
      <Empty icon="invoice" title="Noch keine Rechnungen">
        Rechnungen erscheinen hier, sobald du einen Turnier-Pass oder Plus kaufst.
      </Empty>
    );
  const picked = data.invoices.find((i) => i.id === sel) ?? data.invoices.find((i) => invoiceState(i).open) ?? data.invoices[0];
  return (
    <div className="inv-g">
      <section className="box" aria-label="Rechnungen">
        <Table
          label="Rechnungen"
          cols="96px minmax(0,1fr) 96px 150px 96px"
          colsS="minmax(0,1fr) auto"
          head={[{ h: B.inv.cols[0] }, { h: B.inv.cols[1], hide: true }, { h: B.inv.cols[2], r: true, hide: true }, { h: B.inv.cols[3] }, { h: "", hide: true }]}
        >
          {data.invoices.map((i) => {
            const st = invoiceState(i);
            return (
              <tr className={`dt-r${i.id === picked.id ? " is-sel" : ""}`} key={i.id}>
                <Td>
                  <button className="inv-pick" type="button" aria-pressed={i.id === picked.id} onClick={() => setSel(i.id)}>
                    <b className="mono-t">{i.number}</b>
                    <span className="sr"> zeigen</span>
                  </button>
                  <span className="box-s" style={{ display: "block" }}>
                    {date(i.createdAt)}
                  </span>
                </Td>
                <Td hide>{i.description}</Td>
                <Td r hide>
                  <b>{chf(i.amount)}</b>
                </Td>
                <Td>
                  <InvoiceChip i={i} />
                  {i.dueAt ? (
                    <span className="box-s" style={{ display: "block", marginTop: 4 }}>
                      {B.inv.due} {date(i.dueAt)}
                    </span>
                  ) : null}
                </Td>
                <Td r hide>
                  {st.open ? (
                    <button className="btn btn-ink btn-s" type="button" onClick={() => setSel(i.id)}>
                      {B.inv.pay}
                    </button>
                  ) : i.pdfUrl ? (
                    <a className="alink" href={i.pdfUrl}>
                      <Ic name="download" small />
                      {B.inv.pdf}
                      <span className="sr"> von Rechnung {i.number}</span>
                    </a>
                  ) : null}
                </Td>
              </tr>
            );
          })}
        </Table>
      </section>
      <Detail i={picked} />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <>
      <BillingHead on="invoices" />
      <OwnerOnly>
        <Invoices />
      </OwnerOnly>
    </>
  );
}
