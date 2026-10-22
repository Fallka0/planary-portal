"use client";

// The organisation picked in the switcher, remembered per browser. A tiny external store, so the
// first render on the server and in the browser agree (no organisation yet) and the switch is instant.

const KEY = "planary.portal.org";
const listeners = new Set<() => void>();

export function getCurrentOrg(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setCurrentOrg(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
    memory = id;
  }
  listeners.forEach((l) => l());
}

let memory: string | null = null;

export function subscribeCurrentOrg(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export const currentOrgSnapshot = () => getCurrentOrg() ?? memory;
export const serverOrgSnapshot = () => null;
