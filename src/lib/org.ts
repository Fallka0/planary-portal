"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fixtureCall } from "./portal-fixtures";

/** planary-org: organisations, billing, team and support for the portal. */
export const ORG_API = process.env.NEXT_PUBLIC_ORG_API || "https://org.planary.ch";

/**
 * `fixtures` answers every planary-org call from the handoff's sample data, with a fixed clock
 * (20.10.2026 20:11) and no sign-in. For local development and screenshot checks only; never set
 * it in production. `?state=new|overdue|incident|member|none|error|loading` picks a designed state.
 */
export const FIXTURES = process.env.NEXT_PUBLIC_PORTAL_DATA === "fixtures";

/** The fixed clock the fixtures were written against. */
export const FIXTURE_NOW = Date.parse("2026-10-20T20:11:00+02:00");

export function now() {
  return FIXTURES ? FIXTURE_NOW : Date.now();
}

export class OrgError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string | undefined,
    public requestId: string | undefined,
    public at: number,
  ) {
    super(message);
  }
}

/** The service answers in English; people here read German. Known codes get their own sentence. */
const GERMAN: Record<string, string> = {
  network: "Planary antwortet gerade nicht. Prüf deine Verbindung und versuch es nochmals.",
  forbidden: "Dafür fehlen dir die Rechte in dieser Organisation.",
  not_found: "Das gibt es nicht (mehr).",
  slug_taken: "Diese Adresse ist schon vergeben.",
  seats_full: "Alle Plätze im Plan sind belegt.",
  file_too_large: "Bilder dürfen bis 10 MB gross sein.",
  invalid_file_type: "Bilder müssen PNG oder JPG sein.",
  invite_expired: "Diese Einladung ist abgelaufen. Bitte um eine neue.",
  invite_used: "Diese Einladung wurde schon angenommen.",
  last_owner: "Eine Organisation braucht mindestens eine Inhaberin oder einen Inhaber.",
};

function german(status: number, code: string | undefined) {
  if (code && GERMAN[code]) return GERMAN[code];
  if (status === 401) return "Deine Anmeldung ist abgelaufen. Lade die Seite neu.";
  if (status === 403) return GERMAN.forbidden;
  if (status === 404) return GERMAN.not_found;
  if (status === 409) return "Das hat sich inzwischen geändert. Lade die Seite neu.";
  if (status === 429) return "Zu viele Versuche. Warte einen Moment.";
  return `Planary hat mit einem Fehler geantwortet (${status}). Versuch es nochmals.`;
}

export async function orgCall<T>(token: string, method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  if (FIXTURES) {
    return fixtureCall<T>(method, path, body).catch((e: Error & { status?: number; code?: string; requestId?: string; at?: number }) => {
      throw new OrgError(e.message, e.status ?? 500, e.code, e.requestId, e.at ?? FIXTURE_NOW);
    });
  }
  const form = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${ORG_API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined || form ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new OrgError(GERMAN.network, 0, "network", undefined, Date.now());
  }
  const requestId = res.headers.get("x-request-id") ?? undefined;
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const e = (typeof data === "object" ? data : {}) as { code?: string; requestId?: string };
    throw new OrgError(german(res.status, e.code), res.status, e.code, e.requestId ?? requestId, Date.now());
  }
  return data as T;
}

/** Reads from planary-org; refreshes every `every` ms and after any change made through `useOrgAction`. */
export function useOrg<T>(path: string | null, every = 0) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<{ path: string | null; data: T | null; error: OrgError | null }>({ path: null, data: null, error: null });

  const load = useCallback(() => {
    if (!path) return;
    orgCall<T>(accessToken, "GET", path).then(
      (data) => setState({ path, data, error: null }),
      (error: OrgError) => setState((s) => ({ path, data: s.path === path ? s.data : null, error })),
    );
  }, [accessToken, path]);

  useEffect(() => {
    load();
    window.addEventListener("org:changed", load);
    const timer = every ? window.setInterval(load, every) : 0;
    return () => {
      window.removeEventListener("org:changed", load);
      if (timer) window.clearInterval(timer);
    };
  }, [load, every]);

  const current = state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !!path && (!current || (!state.data && !state.error)),
    reload: load,
  };
}

/** Writes to planary-org, then tells every `useOrg` to reload. */
export function useOrgAction() {
  const { accessToken } = useAuth();
  return useCallback(
    async <T,>(path: string, body: unknown = {}): Promise<T> => {
      const result = await orgCall<T>(accessToken, "POST", path, body);
      window.dispatchEvent(new Event("org:changed"));
      return result;
    },
    [accessToken],
  );
}
