"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { useAuth } from "../../lib/auth-context";
import type { ResourceKey } from "../admin/resources";

export type DrawerTarget =
  | { mode: "edit"; resource: ResourceKey; id: number; seed: Record<string, any> }
  | { mode: "create"; resource: ResourceKey }
  | { mode: "profile" };

type EditModeValue = {
  canEdit: boolean; // owner (superuser) — drives whether the toggle even shows
  enabled: boolean; // canEdit && toggled on — drives the edit affordances
  toggle: () => void;
  target: DrawerTarget | null;
  openDrawer: (t: DrawerTarget) => void;
  closeDrawer: () => void;
};

const Ctx = createContext<EditModeValue | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canEdit = Boolean(user?.isSuperuser);
  const [toggledOn, setToggledOn] = useState(false);
  const [target, setTarget] = useState<DrawerTarget | null>(null);
  const enabled = canEdit && toggledOn;

  const toggle = useCallback(() => {
    setToggledOn((v) => !v);
    setTarget(null);
  }, []);
  const openDrawer = useCallback((t: DrawerTarget) => setTarget(t), []);
  const closeDrawer = useCallback(() => setTarget(null), []);

  const value = useMemo<EditModeValue>(
    () => ({
      canEdit,
      enabled,
      toggle,
      target: enabled ? target : null,
      openDrawer,
      closeDrawer,
    }),
    [canEdit, enabled, target, toggle, openDrawer, closeDrawer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditMode(): EditModeValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEditMode must be used inside <EditModeProvider>");
  return ctx;
}
