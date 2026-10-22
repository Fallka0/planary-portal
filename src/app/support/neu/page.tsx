"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePortal } from "@/components/Shell";
import { Ic, PageHead } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { shortDay, sameDay } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { PortalApi, RequestTopic, TournamentSummary } from "@/lib/org-contract";

const TOPICS: [RequestTopic, string][] = [
  ["tournament", PORTAL.newReq.topics[0]],
  ["billing", PORTAL.newReq.topics[1]],
  ["account", PORTAL.newReq.topics[2]],
  ["other", PORTAL.newReq.topics[3]],
];
const MAX_BYTES = 10 * 1024 * 1024;

function option(t: TournamentSummary, nowMs: number) {
  if (t.state === "live") return `${t.name} · ${t.startsAt && sameDay(t.startsAt, nowMs) ? "heute, " : ""}live`;
  if (t.state === "draft") return `${t.name} · Entwurf`;
  if (t.state === "done") return `${t.name} · abgeschlossen`;
  return `${t.name}${t.startsAt ? ` · ${shortDay(t.startsAt).replace(/^\S+ /, "")}` : ""}`;
}

function NewRequest() {
  const { org } = usePortal();
  const router = useRouter();
  // From Tournament's "Etwas stimmt nicht": that tournament, preselected.
  const asked = useSearchParams().get("turnier");
  const act = useOrgAction();
  const nowMs = now();
  const { data } = useOrg<PortalApi["GET /portal/orgs/:id/tournaments"]["R"]>(`/portal/orgs/${org.id}/tournaments`);
  const tours = data?.tournaments ?? [];
  const live = tours.find((t) => t.state === "live");

  const [topic, setTopic] = useState<RequestTopic>("tournament");
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [urgentPick, setUrgentPick] = useState<boolean | null>(null);
  const [errs, setErrs] = useState<{ text?: string; file?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  // Until someone picks, the request is about the tournament that's running, and urgent while it runs.
  const tid = picked ?? (asked && tours.some((t) => t.id === asked) ? asked : null) ?? live?.id ?? tours.find((t) => t.state !== "done")?.id ?? "";
  const tour = tours.find((t) => t.id === tid);
  const urgent = urgentPick ?? (topic === "tournament" && tour?.state === "live");

  const pickFile = (f: File | null) => {
    if (f && !["image/png", "image/jpeg"].includes(f.type)) return setErrs((e) => ({ ...e, file: "Bilder müssen PNG oder JPG sein." }));
    if (f && f.size > MAX_BYTES) return setErrs((e) => ({ ...e, file: "Bilder dürfen bis 10 MB gross sein." }));
    setErrs((e) => ({ ...e, file: undefined }));
    setFile(f);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) {
      setErrs({ text: "Beschreib kurz, was passiert ist. Ein, zwei Sätze reichen." });
      document.getElementById("n-w")?.focus();
      return;
    }
    const form = new FormData();
    form.set("topic", topic);
    form.set("body", text.trim());
    if (topic === "tournament" && tid) form.set("tournamentId", tid);
    form.set("urgent", urgent ? "1" : "0");
    if (file) form.append("files", file);
    setBusy(true);
    try {
      const { id } = await act<{ id: string }>(`/portal/orgs/${org.id}/requests`, form);
      router.push(`/support/${id}`);
    } catch (x) {
      setErrs({ form: (x as OrgError).message });
      setBusy(false);
    }
  };

  const c = PORTAL.newReq;
  return (
    <>
      <PageHead
        crumb={
          <p className="crumb">
            <Link className="ul" href="/support">
              Support
            </Link>
            <Ic name="chev-r" small />
            Neue Anfrage
          </p>
        }
        title={c.h}
      />
      <div className="g3">
        <form className="box form" aria-labelledby="nr-h" onSubmit={send} noValidate>
          <h2 id="nr-h" className="sr">
            {c.h}
          </h2>
          {errs.form ? (
            <p className="alert err" role="alert">
              <Ic name="alert" />
              <span className="grow">{errs.form}</span>
            </p>
          ) : null}
          <fieldset className="f" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="f-l" style={{ marginBottom: 8 }}>
              {c.topicL}
            </legend>
            <div className="pills">
              {TOPICS.map(([k, label]) => (
                <button key={k} className={`pill${topic === k ? " on" : ""}`} type="button" aria-pressed={topic === k} onClick={() => setTopic(k)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {topic === "tournament" ? (
            <div className="f">
              <label className="f-l" htmlFor="n-t">
                {c.tourL}
              </label>
              <select id="n-t" className="sel" value={tid} onChange={(e) => setPicked(e.target.value)}>
                {tours.length ? null : <option value="">Noch kein Turnier</option>}
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {option(t, nowMs)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="f">
            <label className="f-l" htmlFor="n-w">
              {c.whatL}
            </label>
            <textarea id="n-w" className="ta" placeholder={c.whatPh} value={text} aria-invalid={!!errs.text} aria-describedby={errs.text ? "n-w-e" : undefined} onChange={(e) => setText(e.target.value)} />
            {errs.text ? (
              <span id="n-w-e" className="f-err">
                {errs.text}
              </span>
            ) : null}
          </div>
          <div className="f">
            <span className="f-l" id="n-f-l">
              {c.attL}
            </span>
            <label
              className={`drop${file ? " has" : ""}`}
              htmlFor="n-f"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files[0] ?? null);
              }}
            >
              <Ic name={file ? "image" : "upload"} />
              <b>{file ? file.name : "Datei auswählen"}</b>
              {file ? "Klicken, um ein anderes Bild zu wählen." : c.attP}
            </label>
            <input id="n-f" className="sr" type="file" accept="image/png,image/jpeg" aria-labelledby="n-f-l" aria-describedby={errs.file ? "n-f-e" : undefined} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <button className="btn btn-ghost btn-s" type="button" style={{ justifySelf: "start" }} onClick={() => setFile(null)}>
                Bild entfernen
              </button>
            ) : null}
            {errs.file ? (
              <span id="n-f-e" className="f-err" role="alert">
                {errs.file}
              </span>
            ) : null}
          </div>
          <label className="tgl">
            <span className={`sw${urgent ? " on" : ""}`} aria-hidden="true" />
            <input className="sr" type="checkbox" checked={urgent} onChange={(e) => setUrgentPick(e.target.checked)} />
            <span>
              <b>{c.liveL}</b>
              <span className="s">{c.liveP}</span>
            </span>
          </label>
          <div>
            <button className="btn btn-ink" type="submit" disabled={busy}>
              <Ic name="send" small />
              {c.send}
            </button>
          </div>
        </form>
        <section className="box" aria-labelledby="tp-h">
          <h2 id="tp-h" className="box-t">
            {c.tipsH}
          </h2>
          <ul className="tips" style={{ marginTop: 12 }}>
            {c.tips.map((x) => (
              <li key={x}>
                <Ic name="check" small />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={null}>
      <NewRequest />
    </Suspense>
  );
}
