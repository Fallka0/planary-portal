"use client";

import { useState } from "react";
import { usePageBusy, usePortal } from "@/components/Shell";
import { ROLE } from "@/components/status";
import { Chip, Dialog, ErrorCard, Ic, Loading, PageHead, Sk, Table, Td } from "@/components/ui";
import { PORTAL } from "@/design/portal-copy";
import { dayMonth, initials, lastActive } from "@/lib/fmt";
import { now, type OrgError, useOrg, useOrgAction } from "@/lib/org";
import type { MemberRole, PortalApi, PortalMember } from "@/lib/org-contract";

type Members = PortalApi["GET /portal/orgs/:id/members"]["R"];

function Invite({ full, seats }: { full: boolean; seats: number }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("Gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setBusy(true);
    try {
      await act(`/portal/orgs/${org.id}/invites`, { email: email.trim(), role });
      toast(`Einladung an ${email.trim()} gesendet.`);
      setEmail("");
      setErr("");
    } catch (x) {
      setErr((x as OrgError).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="box" aria-labelledby="iv2-h">
      <h2 id="iv2-h" className="box-t">
        {PORTAL.team.inviteH}
      </h2>
      <p className="box-s" style={{ marginTop: 6 }}>
        {full ? `Alle ${seats} ${seats === 1 ? "Platz" : "Plätze"} belegt. Mehr Plätze gibt es mit Plus.` : PORTAL.team.inviteP}
      </p>
      <form className="form" style={{ marginTop: 14 }} onSubmit={send} noValidate>
        <div className="f">
          <label className="f-l" htmlFor="i-mail">
            E-Mail
          </label>
          <input id="i-mail" className="inp" type="email" placeholder="name@beispiel.ch" value={email} disabled={full} aria-invalid={!!err} aria-describedby={err ? "i-err" : undefined} onChange={(e) => setEmail(e.target.value)} />
          {err ? (
            <span id="i-err" className="f-err">
              {err}
            </span>
          ) : null}
        </div>
        <div className="f">
          <label className="f-l" htmlFor="i-role">
            Rolle
          </label>
          <select id="i-role" className="sel" value={role} disabled={full} onChange={(e) => setRole(e.target.value as MemberRole)}>
            <option value="member">{ROLE.member}</option>
            <option value="owner">{ROLE.owner}</option>
          </select>
        </div>
        <button className="btn btn-ink" type="submit" disabled={busy || full}>
          <Ic name="send" small />
          {PORTAL.team.invite}
        </button>
      </form>
    </section>
  );
}

function Remove({ m, onClose }: { m: PortalMember; onClose: () => void }) {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={`${m.name} entfernen?`}
      onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost btn-s" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-danger btn-s"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await act(`/portal/orgs/${org.id}/members/${m.id}/remove`);
                toast(`${m.name} ist nicht mehr im Team.`);
                onClose();
              } catch (e) {
                toast((e as OrgError).message, "err");
                setBusy(false);
              }
            }}
          >
            Entfernen
          </button>
        </>
      }
    >
      <p className="box-s">
        {m.name} verliert den Zugang zu {org.name}. Turniere und Listen bleiben.
      </p>
    </Dialog>
  );
}

function Team({ data }: { data: Members }) {
  const { org, isOwner, toast } = usePortal();
  const act = useOrgAction();
  const [removing, setRemoving] = useState<PortalMember | null>(null);
  const t = now();
  const owners = data.members.filter((m) => m.role === "owner").length;
  const full = data.members.length + data.invites.length >= data.seats;

  const run = async (path: string, body: unknown, ok: string) => {
    try {
      await act(path, body);
      toast(ok);
    } catch (e) {
      toast((e as OrgError).message, "err");
    }
  };

  return (
    <div className="g3">
      <section className="box" aria-labelledby="mm-h">
        <div className="box-h">
          <h2 id="mm-h" className="box-t">
            Mitglieder
          </h2>
        </div>
        <Table label="Mitglieder" cols="minmax(0,1.6fr) 150px 90px 44px" colsS="minmax(0,1fr) 120px" head={[{ h: "Name" }, { h: "Rolle" }, { h: "Aktiv", hide: true }, { h: "", hide: true }]}>
          {data.members.map((m) => {
            // The last owner can't be demoted or removed; members only read.
            const locked = !isOwner || m.me || (m.role === "owner" && owners <= 1);
            return (
              <tr className="dt-r" key={m.id}>
                <Td>
                  <span className="who">
                    <span className="av">{initials(m.name)}</span>
                    <span>
                      <b>
                        {m.name}
                        {m.me ? " (du)" : ""}
                      </b>
                      <span>{m.email}</span>
                    </span>
                  </span>
                </Td>
                <Td>
                  <label className="sr" htmlFor={`r-${m.id}`}>
                    Rolle von {m.name}
                  </label>
                  <select
                    id={`r-${m.id}`}
                    className="sel"
                    style={{ height: 36, borderRadius: 999 }}
                    value={m.role}
                    disabled={locked}
                    onChange={(e) => run(`/portal/orgs/${org.id}/members/${m.id}`, { role: e.target.value }, `${m.name} ist jetzt ${ROLE[e.target.value as MemberRole]}.`)}
                  >
                    <option value="owner">{ROLE.owner}</option>
                    <option value="member">{ROLE.member}</option>
                  </select>
                </Td>
                <Td hide>{lastActive(m.lastActive, t)}</Td>
                <Td hide>
                  {!locked ? (
                    <button className="ib" type="button" aria-label={`${m.name} entfernen`} onClick={() => setRemoving(m)}>
                      <Ic name="trash" small />
                    </button>
                  ) : null}
                </Td>
              </tr>
            );
          })}
          {data.invites.map((i) => (
            <tr className="dt-r" key={i.id}>
              <Td>
                <span className="who">
                  <span className="av">
                    <Ic name="mail" small />
                  </span>
                  <span>
                    <b>{i.email}</b>
                    <span>
                      eingeladen am {dayMonth(i.sentAt)} · {ROLE[i.role]}
                    </span>
                  </span>
                </span>
              </Td>
              <Td>
                <Chip chip="chip-line">Ausstehend</Chip>
              </Td>
              <Td hide>
                {isOwner ? (
                  <button className="alink" type="button" onClick={() => run(`/portal/orgs/${org.id}/invites/${i.id}/resend`, {}, `Einladung an ${i.email} nochmals gesendet.`)}>
                    Erneut senden
                  </button>
                ) : null}
              </Td>
              <Td hide>
                {isOwner ? (
                  <button className="ib" type="button" aria-label={`Einladung an ${i.email} zurückziehen`} onClick={() => run(`/portal/orgs/${org.id}/invites/${i.id}/withdraw`, {}, "Einladung zurückgezogen.")}>
                    <Ic name="x" small />
                  </button>
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </section>
      <div className="stack">
        {isOwner ? <Invite full={full} seats={data.seats} /> : null}
        <section className="box" aria-labelledby="rl-h">
          <h2 id="rl-h" className="box-t">
            Rollen
          </h2>
          <div className="roles2">
            {PORTAL.team.roles.map((r) => (
              <div key={r.n}>
                <b>{r.n}</b>
                <p>{r.p}</p>
              </div>
            ))}
          </div>
          {!isOwner ? (
            <p className="box-s" style={{ marginTop: 12 }}>
              Einladen und Rollen ändern können die Inhaber.
            </p>
          ) : null}
        </section>
      </div>
      {removing ? <Remove m={removing} onClose={() => setRemoving(null)} /> : null}
    </div>
  );
}

export default function TeamPage() {
  const { org } = usePortal();
  const { data, error, reload } = useOrg<Members>(`/portal/orgs/${org.id}/members`);
  usePageBusy(!data && !error);
  return (
    <>
      <PageHead title={PORTAL.team.h}>
        {data ? (
          <Chip>
            {data.members.length} von {data.seats} {data.seats === 1 ? "Platz" : "Plätzen"} im Plan {org.plan.name}
          </Chip>
        ) : null}
      </PageHead>
      {error && !data ? (
        <ErrorCard title="Das Team hat nicht geladen" error={error} onRetry={reload} />
      ) : !data ? (
        <Loading label="Team wird geladen">
          <div className="g3">
            <Sk h={300} />
            <Sk h={300} />
          </div>
        </Loading>
      ) : (
        <Team data={data} />
      )}
    </>
  );
}
