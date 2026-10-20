"use client";

import { useEffect, useState } from "react";
import type { PublicUser, StorageKind } from "@/lib/types";

export interface SessionState {
  loading: boolean;
  user: PublicUser | null;
  /** False when this deployment has no storage or secret: sign-in is switched off. */
  accounts: boolean;
  storage: StorageKind | null;
}

const INITIAL: SessionState = { loading: true, user: null, accounts: true, storage: null };

let cache: Promise<SessionState> | null = null;
const listeners = new Set<(s: SessionState) => void>();

function load(): Promise<SessionState> {
  cache ??= fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => r.json())
    .then((d: { user: PublicUser | null; accounts: boolean; storage: StorageKind }) => ({
      loading: false,
      user: d.user,
      accounts: d.accounts,
      storage: d.storage,
    }))
    .catch(() => ({ loading: false, user: null, accounts: false, storage: null }));
  return cache;
}

/** Re-reads the session everywhere (after sign in, sign out, or a profile change). */
export function refreshSession(): Promise<SessionState> {
  cache = null;
  return load().then((s) => {
    listeners.forEach((l) => l(s));
    return s;
  });
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(INITIAL);
  useEffect(() => {
    let live = true;
    void load().then((s) => live && setState(s));
    const l = (s: SessionState) => live && setState(s);
    listeners.add(l);
    return () => {
      live = false;
      listeners.delete(l);
    };
  }, []);
  return state;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  await refreshSession();
}
