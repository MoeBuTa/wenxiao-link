"use client";

import { Button, Icon } from "@chakra-ui/react";
import { FiCheck, FiEdit3 } from "react-icons/fi";

import { useEditMode } from "./edit-mode-context";

// Owner-only floating toggle. Hidden for non-owners and while a drawer is open.
export function EditModeFab() {
  const { canEdit, enabled, toggle, target } = useEditMode();
  if (!canEdit || target) return null;

  return (
    <Button
      position="fixed"
      bottom={6}
      right={6}
      zIndex={1500}
      size="md"
      colorScheme="orange"
      boxShadow="lg"
      borderRadius="full"
      leftIcon={<Icon as={enabled ? FiCheck : FiEdit3} />}
      onClick={toggle}
    >
      {enabled ? "Done" : "Edit"}
    </Button>
  );
}
