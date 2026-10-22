"use client";

import { useState } from "react";
import { type OrgError, useOrgAction } from "@/lib/org";
import type { OrgService, PortalOrg } from "@/lib/org-contract";
import { SERVICE_IDS, SERVICES } from "@/lib/services";
import { usePortal } from "./Shell";
import { Empty, Ic } from "./ui";

/** Choose services: one card per service with a real checkbox, at least one stays on. */
export function ServicePicker({ value, onChange, label, error }: { value: OrgService[]; onChange: (next: OrgService[]) => void; label: string; error?: string }) {
  return (
    <fieldset className="svc-pick" aria-describedby={error ? "svc-e" : undefined}>
      <legend className="f-l">{label}</legend>
      {SERVICE_IDS.map((id) => {
        const s = SERVICES[id];
        const on = value.includes(id);
        return (
          <label key={id} className={`svc-opt${on ? " on" : ""}`}>
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => onChange(SERVICE_IDS.filter((x) => (x === id ? e.target.checked : value.includes(x))))}
            />
            <span className="svc-ic" aria-hidden="true">
              <Ic name={s.icon} />
            </span>
            <span className="grow">
              <b>{s.name}</b>
              <span className="s">{s.what}</span>
            </span>
            <span className="svc-tick" aria-hidden="true">
              {on ? <Ic name="check" small /> : null}
            </span>
          </label>
        );
      })}
      {error ? (
        <span id="svc-e" className="f-err">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

/** Switches one service on; owners only. */
export function useEnableService() {
  const { org, toast } = usePortal();
  const act = useOrgAction();
  const [busy, setBusy] = useState(false);
  const enable = async (id: OrgService) => {
    setBusy(true);
    try {
      await act(`/portal/orgs/${org.id}`, { services: SERVICE_IDS.filter((x) => x === id || org.services.includes(x)) });
      toast(`${SERVICES[id].name} ist für ${org.name} eingeschaltet.`);
    } catch (e) {
      toast((e as OrgError).message, "err");
    } finally {
      setBusy(false);
    }
  };
  return { enable, busy };
}

/** A service page while the organisation doesn't use the service. */
export function ServiceOff({ id, org }: { id: OrgService; org: PortalOrg }) {
  const { isOwner } = usePortal();
  const { enable, busy } = useEnableService();
  const s = SERVICES[id];
  return (
    <Empty
      icon={s.icon}
      title={`${s.name} ist aus`}
      action={
        isOwner ? (
          <button className="btn btn-ink btn-s" type="button" disabled={busy} onClick={() => enable(id)}>
            {s.name} einschalten
          </button>
        ) : undefined
      }
    >
      {s.what} {isOwner ? `Schalte ${s.name} für ${org.name} ein, es ist in eurem Plan enthalten.` : `Die Inhaber von ${org.name} können ${s.name} einschalten.`}
    </Empty>
  );
}
