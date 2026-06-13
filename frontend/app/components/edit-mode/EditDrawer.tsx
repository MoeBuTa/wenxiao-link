"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { revalidateContent } from "../../actions";
import { ApiError } from "../../lib/api";
import { adminCreate, adminDelete, adminUpdate } from "../../lib/admin-client";
import { Field } from "../admin/Field";
import { ProfileEditor } from "../admin/ProfileEditor";
import { RESOURCES } from "../admin/resources";
import { useEditMode } from "./edit-mode-context";

// Single global drawer driven by edit-mode context. Edits/creates/deletes the
// item via the existing content API, then router.refresh() re-renders the
// server-fetched page so the change shows immediately.
export function EditDrawer() {
  const { target, closeDrawer } = useEditMode();
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);

  const cfg = target && target.mode !== "profile" ? RESOURCES[target.resource] : null;

  useEffect(() => {
    if (!target || target.mode === "profile") return;
    setDraft(target.mode === "edit" ? { ...target.seed } : (cfg ? cfg.makeEmpty() : {}));
    // Re-seed when the target identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.mode, (target as any)?.resource, (target as any)?.id]);

  const save = async () => {
    if (!target || target.mode === "profile" || !cfg) return;
    setBusy(true);
    try {
      if (target.mode === "create") await adminCreate(cfg.resource, draft);
      else await adminUpdate(cfg.resource, target.id, draft);
      toast({ status: "success", title: "Saved", duration: 1500 });
      await revalidateContent();
      router.refresh();
      closeDrawer();
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!target || target.mode !== "edit" || !cfg) return;
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    try {
      await adminDelete(cfg.resource, target.id);
      toast({ status: "success", title: "Deleted", duration: 1500 });
      await revalidateContent();
      router.refresh();
      closeDrawer();
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Delete failed" });
    } finally {
      setBusy(false);
    }
  };

  const heading =
    target?.mode === "profile"
      ? "Edit profile & about"
      : target?.mode === "create"
        ? `Add ${cfg?.label ?? ""}`
        : `Edit ${cfg?.label ?? ""}`;

  return (
    <Drawer isOpen={target !== null} placement="right" onClose={closeDrawer} size="md">
      <DrawerOverlay />
      <DrawerContent bg="bg.surface">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor="border.muted" textTransform="capitalize">
          {heading}
        </DrawerHeader>
        <DrawerBody py={5}>
          {target?.mode === "profile" ? (
            <ProfileEditor
              embedded
              onCancel={closeDrawer}
              onSaved={async () => {
                await revalidateContent();
                router.refresh();
                closeDrawer();
              }}
            />
          ) : cfg ? (
            <VStack align="stretch" spacing={4}>
              {cfg.fields.map((f) => (
                <Field
                  key={f.key}
                  def={f}
                  value={draft[f.key]}
                  onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                />
              ))}
              <HStack pt={2}>
                <Button colorScheme="orange" onClick={() => void save()} isLoading={busy}>
                  {target?.mode === "create" ? "Create" : "Save"}
                </Button>
                {target?.mode === "edit" ? (
                  <Button variant="ghost" color="red.300" onClick={() => void remove()} isDisabled={busy}>
                    Delete
                  </Button>
                ) : null}
                <Button bg="gray.600" color="white" _hover={{ bg: "gray.500" }} onClick={closeDrawer} isDisabled={busy}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
