"use client";

import Link from "next/link";
import { use, useRef, useState } from "react";
import { usePageBusy, usePortal } from "@/components/Shell";
import { REQUEST_STATE, TOPIC } from "@/components/status";
import { Chip, ErrorCard, Ic, Loading, PageHead, Sk } from "@/components/ui";
import { dayMonth, initials, sameDay, time } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { PortalRequestDetail } from "@/lib/org-contract";

const HEAD: Record<PortalRequestDetail["status"], string> = {
  open: "Offen · Planary kümmert sich",
  waiting: "Wartet auf dich",
  done: "Erledigt",
};

function Composer({ r }: { r: PortalRequestDetail }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) return toast("Bilder müssen PNG oder JPG sein.", "err");
    if (f.size > 10 * 1024 * 1024) return toast("Bilder dürfen bis 10 MB gross sein.", "err");
    setFile(f);
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      area.current?.focus();
      return;
    }
    let body: { body: string } | FormData = { body: text.trim() };
    if (file) {
      body = new FormData();
      body.set("body", text.trim());
      body.append("files", file);
    }
    setBusy(true);
    try {
      await act(`/portal/orgs/${org.id}/requests/${r.id}/messages`, body);
      setText("");
      setFile(null);
      toast(r.status === "done" ? "Gesendet. Die Anfrage ist wieder offen." : "Gesendet.");
    } catch (x) {
      toast((x as OrgError).message, "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="comp" onSubmit={send}>
      <label className="sr" htmlFor="p-rep">
        Antworten
      </label>
      <textarea id="p-rep" ref={area} className="ta" placeholder="Antworten" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="comp-f">
        <button className="ib" type="button" aria-label={file ? `Anhang ${file.name} ersetzen` : "Datei anhängen"} onClick={() => picker.current?.click()}>
          <Ic name="clip" small />
        </button>
        <input ref={picker} className="sr" type="file" accept="image/png,image/jpeg" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <span className="comp-file">
            <Ic name="image" small />
            {file.name}
            <button className="ib" type="button" style={{ width: 28, height: 28 }} aria-label="Anhang entfernen" onClick={() => setFile(null)}>
              <Ic name="x" small />
            </button>
          </span>
        ) : null}
        <span className="grow box-s">{r.status === "done" ? "Mit einer Antwort öffnest du die Anfrage wieder." : "Wir bekommen deine Antwort sofort."}</span>
        <button className="btn btn-ink btn-s" type="submit" disabled={busy}>
          <Ic name="send" small />
          Senden
        </button>
      </div>
    </form>
  );
}

export default function RequestPage({ params }: PageProps<"/support/[id]">) {
  const { id } = use(params);
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const t = now();
  const { data: r, error, reload } = useOrg<PortalRequestDetail>(`/portal/orgs/${org.id}/requests/${encodeURIComponent(id)}`, 20_000);
  usePageBusy(!r && !error);

  const crumb = (label: string) => (
    <p className="crumb">
      <Link className="ul" href="/support">
        Support
      </Link>
      <Ic name="chev-r" small />
      {label}
    </p>
  );
  if (error && !r) {
    return (
      <>
        {crumb("Anfrage")}
        <ErrorCard title="Die Anfrage hat nicht geladen" error={error} onRetry={reload} />
      </>
    );
  }
  if (!r) {
    return (
      <>
        {crumb("Anfrage")}
        <Loading label="Anfrage wird geladen">
          <div className="g3">
            <Sk h={360} />
            <Sk h={240} />
          </div>
        </Loading>
      </>
    );
  }

  const st = REQUEST_STATE[r.status];
  const opened = sameDay(r.createdAt, t) ? `heute um ${time(r.createdAt)}` : `am ${dayMonth(r.createdAt)} um ${time(r.createdAt)}`;
  const markDone = async () => {
    try {
      await act(`/portal/orgs/${org.id}/requests/${r.id}/done`);
      toast("Als erledigt markiert.");
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };

  return (
    <>
      <PageHead
        crumb={crumb(r.code)}
        title={r.subject}
        sub={`${r.tournament?.name ?? TOPIC[r.topic]} · geöffnet ${opened} von ${r.from.name}`}
        chip={
          <Chip chip={st.chip} dot={st.dot}>
            {HEAD[r.status]}
          </Chip>
        }
      >
        {r.status !== "done" ? (
          <button className="btn btn-line btn-s" type="button" onClick={markDone}>
            <Ic name="check" small />
            Als erledigt markieren
          </button>
        ) : null}
      </PageHead>
      <div className="g3">
        <section aria-label="Verlauf">
          <div className="thread">
            {r.messages.map((m) => {
              const staff = m.kind === "staff";
              // planary-org already names staff "Mykyta von Planary".
              const who = m.author.name;
              return (
                <div className={`msg ${staff ? "us" : "me"}`} key={m.id}>
                  <p className="msg-h">
                    <span className="av" style={{ width: 22, height: 22, fontSize: 8 }} aria-hidden="true">
                      {staff ? "P" : initials(m.author.name)}
                    </span>
                    <b>{who}</b>
                    {sameDay(m.at, t) ? time(m.at) : `${dayMonth(m.at)} ${time(m.at)}`}
                  </p>
                  <div className="msg-b">
                    {m.body.split(/\n{2,}/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {m.attachments.map((a) => (
                      <a className="att" key={a.id} href={a.url} target="_blank" rel="noreferrer">
                        <Ic name="image" small />
                        {a.name}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Composer r={r} />
        </section>
        <div className="stack">
          <section className="box" aria-labelledby="rs-h">
            <h2 id="rs-h" className="box-t" style={{ marginBottom: 12 }}>
              Status
            </h2>
            <dl className="kv">
              <dt>Status</dt>
              <dd>{st.label}</dd>
              <dt>{r.tournament ? "Turnier" : "Thema"}</dt>
              <dd>{r.tournament?.name ?? TOPIC[r.topic]}</dd>
              <dt>Dringend</dt>
              <dd>{r.urgent ? "Ja, das Turnier läuft" : "Nein"}</dd>
              <dt>Nummer</dt>
              <dd className="mono-t">{r.code}</dd>
            </dl>
          </section>
          <section className="box" aria-labelledby="sx-h">
            <h2 id="sx-h" className="box-t">
              Was „{st.label}“ heisst
            </h2>
            <ul className="tips" style={{ marginTop: 10 }}>
              <li>
                <Chip chip="info" style={{ flex: "none" }}>
                  Offen
                </Chip>
                <span>Wir sind dran.</span>
              </li>
              <li>
                <Chip chip="warn" style={{ flex: "none" }}>
                  Wartet auf dich
                </Chip>
                <span>Wir brauchen eine Antwort von dir.</span>
              </li>
              <li>
                <Chip style={{ flex: "none" }}>Erledigt</Chip>
                <span>Gelöst. Antworte, um sie wieder zu öffnen.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
