"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { buildAuthUrl, signOutUrl } from "@/lib/auth";
import { clearSession, serverSessionSnapshot, sessionSnapshot, type StoredSession, subscribeSession, verifySession } from "@/lib/session";

export interface PlanaryUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: PlanaryUser;
  accessToken: string;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Organisers sign in with their Planary account. Without a session we hop to planary-auth, which sends
 *  already-signed-in people straight back (single sign-on). Which organisations they belong to is the API's call. */
function goSignIn() {
  window.location.replace(buildAuthUrl("login", window.location.href.split("#")[0], true));
}

/** Fixture mode (local development and screenshot checks only): no sign-in, the handoff's persona. */
const FIXTURE_SESSION =
  process.env.NEXT_PUBLIC_PORTAL_DATA === "fixtures" ? { user: { id: "u_matteo", email: "matteo.keller@gurtenlan.ch", name: "Matteo Keller" }, accessToken: "fixtures" } : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore<StoredSession | null | undefined>(subscribeSession, sessionSnapshot, serverSessionSnapshot);
  const session = FIXTURE_SESSION ?? (stored ? { user: { id: stored.userId, email: stored.email, name: stored.name }, accessToken: stored.accessToken } : null);

  useEffect(() => {
    if (FIXTURE_SESSION || stored === undefined) return;
    if (!stored) {
      goSignIn();
      return;
    }
    let active = true;
    void verifySession(stored).then((ok) => {
      if (!active || ok) return;
      clearSession();
      goSignIn();
    });
    // Tokens last an hour; fetch a fresh one the same silent way shortly before that.
    const timer = window.setTimeout(() => {
      clearSession();
      goSignIn();
    }, Math.max(0, stored.expiresAt * 1000 - Date.now() - 60_000));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [stored]);

  const signOut = useCallback(() => {
    clearSession();
    // End the Planary session too, or single sign-on would sign them straight back in.
    window.location.assign(signOutUrl());
  }, []);

  if (!session) {
    return (
      <div className="loading" role="status">
        <p>Anmeldung läuft …</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...session, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
