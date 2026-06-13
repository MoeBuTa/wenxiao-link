"use client";

import { Box, Button, Icon } from "@chakra-ui/react";
import { FiEdit3, FiPlus } from "react-icons/fi";

import type { ResourceKey } from "../admin/resources";
import { useEditMode } from "./edit-mode-context";

// Wraps a rendered content item. When edit mode is off it renders its
// children untouched (identical public view, no extra DOM). When on, it shows
// a hover outline and opens the drawer to edit/delete that item. The capture
// handler intercepts clicks so links inside (project cards, news links) open
// the editor instead of navigating.
export function EditableItem({
  resource,
  id,
  seed,
  children,
}: {
  resource: ResourceKey;
  id: number;
  seed: Record<string, any>;
  children: React.ReactNode;
}) {
  const { enabled, openDrawer } = useEditMode();
  if (!enabled) return <>{children}</>;

  return (
    <Box
      position="relative"
      role="button"
      cursor="pointer"
      borderRadius="md"
      transition="box-shadow 0.12s ease"
      _hover={{ boxShadow: "0 0 0 2px var(--chakra-colors-accent)" }}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openDrawer({ mode: "edit", resource, id, seed });
      }}
    >
      {children}
    </Box>
  );
}

// Small "+ Add" button placed next to a section heading (owner + edit mode only).
export function AddNewButton({ resource, label }: { resource: ResourceKey; label?: string }) {
  const { enabled, openDrawer } = useEditMode();
  if (!enabled) return null;

  return (
    <Button
      size="xs"
      variant="outline"
      colorScheme="orange"
      leftIcon={<Icon as={FiPlus} />}
      onClick={() => openDrawer({ mode: "create", resource })}
    >
      {label ?? "Add"}
    </Button>
  );
}

// Opens the profile/about singleton editor.
export function EditProfileButton() {
  const { enabled, openDrawer } = useEditMode();
  if (!enabled) return null;

  return (
    <Button
      size="xs"
      variant="outline"
      colorScheme="orange"
      leftIcon={<Icon as={FiEdit3} />}
      onClick={() => openDrawer({ mode: "profile" })}
    >
      Edit profile
    </Button>
  );
}
