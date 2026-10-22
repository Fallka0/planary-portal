"use client";

import { useRef, useState } from "react";
import { OwnerOnly, usePortal } from "@/components/Shell";
import { Dialog, Ic, PageHead } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { longDate } from "@/lib/fmt";
import { type OrgError, useOrgAction } from "@/lib/org";
import type { PortalOrg } from "@/lib/org-contract";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

function Delete({ org, onClose }: { org: PortalOrg; onClose: () => void }) {
  const { toast } = usePortal();
  const act = useOrgAction();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title="Organisation löschen?"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost btn-s" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-danger btn-s"
            type="button"
            disabled={busy || confirm.trim() !== org.name}
            onClick={async () => {
              setBusy(true);
              try {
                const { deleteAt } = await act<{ deleteAt: number }>(`/portal/orgs/${org.id}/delete`, { confirm: confirm.trim() });
                toast(`${org.name} wird am ${longDate(deleteAt)} gelöscht. Bis dann kannst du das bei uns im Support rückgängig machen.`);
                onClose();
              } catch (e) {
                toast((e as OrgError).message, "err");
                setBusy(false);
              }
            }}
          >
            {PORTAL.settings.danger}
          </button>
        </>
      }
    >
      <p className="box-s">{PORTAL.settings.dangerP} Laufende und geplante Turniere werden abgesagt.</p>
      <div className="f">
        <label className="f-l" htmlFor="del-n">
          Tipp zur Bestätigung „{org.name}“ ein
        </label>
        <input id="del-n" className="inp" type="text" value={confirm} autoComplete="off" onChange={(e) => setConfirm(e.target.value)} />
      </div>
    </Dialog>
  );
}

function Settings({ org }: { org: PortalOrg }) {
  const { toast } = usePortal();
  const act = useOrgAction();
  const s = PORTAL.settings;
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [mail, setMail] = useState(org.contact.email);
  const [phone, setPhone] = useState(org.contact.phone);
  const [addr, setAddr] = useState(org.contact.address.join("\n"));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Der Name fehlt.";
    if (!SLUG.test(slug)) next.slug = "3 bis 40 Zeichen: Kleinbuchstaben, Ziffern und Bindestriche, nicht am Anfang oder Ende.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) next.mail = "Gib eine gültige E-Mail-Adresse ein.";
    if (!addr.trim()) next.addr = "Die Rechnungsadresse fehlt.";
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await act(`/portal/orgs/${org.id}`, {
        ...(name.trim() !== org.name ? { name: name.trim() } : {}),
        ...(slug !== org.slug ? { slug } : {}),
        contact: { email: mail.trim(), phone: phone.trim(), address: addr.split("\n").map((l) => l.trim()).filter(Boolean) },
      });
      toast("Gespeichert.");
    } catch (x) {
      const err = x as OrgError;
      if (err.code === "slug_taken") setErrs({ slug: err.message });
      else toast(err.message, "err");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (f: File | undefined) => {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) return toast("Logos müssen PNG oder JPG sein.", "err");
    if (f.size > 2 * 1024 * 1024) return toast("Logos dürfen bis 2 MB gross sein.", "err");
    const form = new FormData();
    form.set("file", f);
    try {
      await act(`/portal/orgs/${org.id}/logo`, form);
      toast("Logo gespeichert.");
    } catch (x) {
      toast((x as OrgError).message, "err");
    }
  };

  const field = (k: string) => (errs[k] ? { "aria-invalid": true, "aria-describedby": `${k}-e` } : {});
  const errLine = (k: string) =>
    errs[k] ? (
      <span id={`${k}-e`} className="f-err">
        {errs[k]}
      </span>
    ) : null;

  return (
    <div className="g3">
      <div className="stack">
        <form id="settings" className="box form" aria-labelledby="so-h" onSubmit={save} noValidate>
          <h2 id="so-h" className="box-t">
            {s.orgH}
          </h2>
          <div className="f">
            <label className="f-l" htmlFor="s-n">
              {s.nameL}
            </label>
            <input id="s-n" className="inp" type="text" value={name} onChange={(e) => setName(e.target.value)} {...field("name")} />
            {errLine("name")}
          </div>
          <div className="f">
            <label className="f-l" htmlFor="s-s">
              {s.slugL}
            </label>
            <div className="slug">
              <span aria-hidden="true">tournament.planary.ch/</span>
              <input id="s-s" className="inp" type="text" value={slug} spellCheck={false} onChange={(e) => setSlug(e.target.value.toLowerCase())} {...field("slug")} />
            </div>
            {errLine("slug")}
          </div>
          <div className="f">
            <span className="f-l">{s.logoL}</span>
            <div className="logo-up">
              {/* Logos are the organisation's own uploads (R2 or a local preview); next/image adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="logo logo-xl">{org.logoUrl ? <img src={org.logoUrl} alt={`Logo von ${org.name}`} /> : org.initials}</span>
              <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
                <span className="f-h">{s.logoP}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-line btn-s" type="button" onClick={() => file.current?.click()}>
                    <Ic name="upload" small />
                    Neues Logo
                  </button>
                  {org.logoUrl ? (
                    <button
                      className="btn btn-ghost btn-s"
                      type="button"
                      onClick={() =>
                        act(`/portal/orgs/${org.id}`, { removeLogo: true }).then(
                          () => toast("Logo entfernt."),
                          (x: OrgError) => toast(x.message, "err"),
                        )
                      }
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>
                <input ref={file} className="sr" type="file" accept="image/png,image/jpeg" tabIndex={-1} aria-hidden="true" onChange={(e) => void upload(e.target.files?.[0])} />
              </div>
            </div>
          </div>
        </form>
        <section className="box form" aria-labelledby="sc-h">
          <h2 id="sc-h" className="box-t">
            {s.contactH}
          </h2>
          <div className="form-2">
            <div className="f">
              <label className="f-l" htmlFor="s-m">
                {s.mailL}
              </label>
              <input id="s-m" className="inp" type="email" form="settings" value={mail} onChange={(e) => setMail(e.target.value)} {...field("mail")} />
              {errLine("mail")}
            </div>
            <div className="f">
              <label className="f-l" htmlFor="s-p">
                {s.phoneL}
              </label>
              <input id="s-p" className="inp" type="tel" form="settings" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="f">
            <label className="f-l" htmlFor="s-a">
              {s.addrL}
            </label>
            <textarea id="s-a" className="ta" style={{ minHeight: 100 }} form="settings" value={addr} onChange={(e) => setAddr(e.target.value)} {...field("addr")} />
            {errLine("addr")}
          </div>
          <div>
            <button className="btn btn-ink" type="submit" form="settings" disabled={busy}>
              {s.save}
            </button>
          </div>
        </section>
      </div>
      <div className="stack">
        <section className="danger" aria-labelledby="dz-h">
          <div>
            <h2 id="dz-h">{s.dangerH}</h2>
            <p>{s.dangerP}</p>
          </div>
          <button className="btn btn-danger btn-s" type="button" onClick={() => setDeleting(true)}>
            {s.danger}
          </button>
        </section>
      </div>
      {deleting ? <Delete org={org} onClose={() => setDeleting(false)} /> : null}
    </div>
  );
}

export default function SettingsPage() {
  const { org } = usePortal();
  return (
    <>
      <PageHead title={PORTAL.settings.h} />
      <OwnerOnly>
        <Settings key={org.id} org={org} />
      </OwnerOnly>
    </>
  );
}
