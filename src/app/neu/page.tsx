"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePortalBase } from "@/components/Shell";
import { PageHead } from "@/components/ui";
import { setCurrentOrg } from "@/lib/current-org";
import { type OrgError, useOrgAction } from "@/lib/org";

/** "Verein Gurten LAN" → "verein-gurten-lan" */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export default function CreateOrgPage() {
  const { orgs } = usePortalBase();
  const router = useRouter();
  const act = useOrgAction();
  const [name, setName] = useState("");
  const [slugEdit, setSlugEdit] = useState<string | null>(null);
  const [errs, setErrs] = useState<{ name?: string; slug?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const slug = slugEdit ?? toSlug(name);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errs = {};
    if (name.trim().length < 2) next.name = "Wie heisst eure Organisation?";
    if (!SLUG.test(slug)) next.slug = "3 bis 40 Zeichen: Kleinbuchstaben, Ziffern und Bindestriche, nicht am Anfang oder Ende.";
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const { id } = await act<{ id: string }>("/portal/orgs", { name: name.trim(), slug });
      setCurrentOrg(id);
      router.push("/");
    } catch (x) {
      const err = x as OrgError;
      setErrs(err.code === "slug_taken" ? { slug: err.message } : { form: err.message });
      setBusy(false);
    }
  };

  return (
    <div className="card-c">
      <PageHead title="Organisation erstellen" />
      <form className="box form" onSubmit={create} noValidate aria-label="Organisation erstellen">
        <p className="box-s">Für Vereine, Schulen und Communities. Du wirst Inhaber, startest im Plan Gratis und kannst danach dein Team einladen.</p>
        {errs.form ? (
          <p className="alert err" role="alert">
            {errs.form}
          </p>
        ) : null}
        <div className="f">
          <label className="f-l" htmlFor="o-n">
            Name
          </label>
          <input id="o-n" className="inp" type="text" placeholder="Verein Gurten LAN" value={name} autoComplete="organization" aria-invalid={!!errs.name} aria-describedby={errs.name ? "o-n-e" : undefined} onChange={(e) => setName(e.target.value)} />
          {errs.name ? (
            <span id="o-n-e" className="f-err">
              {errs.name}
            </span>
          ) : null}
        </div>
        <div className="f">
          <label className="f-l" htmlFor="o-s">
            Adresse eurer Turniere
          </label>
          <div className="slug">
            <span aria-hidden="true">tournament.planary.ch/</span>
            <input id="o-s" className="inp" type="text" value={slug} spellCheck={false} aria-invalid={!!errs.slug} aria-describedby={errs.slug ? "o-s-e" : undefined} onChange={(e) => setSlugEdit(e.target.value.toLowerCase())} />
          </div>
          {errs.slug ? (
            <span id="o-s-e" className="f-err">
              {errs.slug}
            </span>
          ) : (
            <span className="f-h">Kannst du später in den Einstellungen ändern.</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ink" type="submit" disabled={busy}>
            Organisation erstellen
          </button>
          {orgs.length ? (
            <Link className="btn btn-ghost" href="/">
              Abbrechen
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
