"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { usePortalBase } from "@/components/Shell";
import { Ic, PageHead } from "@/components/ui";
import { setCurrentOrg } from "@/lib/current-org";
import { type OrgError, useOrgAction } from "@/lib/org";

/** The link from the invitation e-mail: portal.planary.ch/einladung/<token>. */
export default function InvitePage({ params }: PageProps<"/einladung/[token]">) {
  const { token } = use(params);
  const { me } = usePortalBase();
  const router = useRouter();
  const act = useOrgAction();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      const { orgId } = await act<{ orgId: string }>(`/portal/invites/${encodeURIComponent(token)}/accept`);
      setCurrentOrg(orgId);
      router.push("/");
    } catch (e) {
      setError((e as OrgError).message);
      setBusy(false);
    }
  };

  return (
    <div className="card-c">
      <PageHead title="Einladung annehmen" />
      <section className="box form" aria-label="Einladung">
        <p>
          Du bist als <b>{me.name}</b> ({me.email}) angemeldet. Nimmst du die Einladung an, leitest du ab jetzt Turniere im Namen der Organisation.
        </p>
        <p className="box-s">Falsches Konto? Melde dich bei auth.planary.ch ab und öffne den Link aus der E-Mail nochmals.</p>
        {error ? (
          <p className="alert err" role="alert">
            <Ic name="alert" />
            <span className="grow">{error}</span>
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ink" type="button" disabled={busy} onClick={accept}>
            <Ic name="check" small />
            Einladung annehmen
          </button>
          <Link className="btn btn-ghost" href="/">
            Nicht jetzt
          </Link>
        </div>
      </section>
    </div>
  );
}
