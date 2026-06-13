"use client";

import { Button, Icon, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { FiCheck, FiEdit3, FiFileText } from "react-icons/fi";

import { useEditMode } from "./edit-mode-context";

// Owner-only floating controls (bottom-right): toggle inline edit mode + jump
// to the blog editor. Hidden for non-owners and while a drawer is open.
export function EditModeFab() {
  const { canEdit, enabled, toggle, target } = useEditMode();
  if (!canEdit || target) return null;

  return (
    <VStack position="fixed" bottom={6} right={6} zIndex={1500} spacing={2} align="stretch">
      <Button
        as={NextLink}
        href="/admin/blog"
        size="sm"
        variant="outline"
        colorScheme="orange"
        bg="bg.surface"
        boxShadow="lg"
        borderRadius="full"
        leftIcon={<Icon as={FiFileText} />}
      >
        Blog
      </Button>
      <Button
        size="md"
        colorScheme="orange"
        boxShadow="lg"
        borderRadius="full"
        leftIcon={<Icon as={enabled ? FiCheck : FiEdit3} />}
        onClick={toggle}
      >
        {enabled ? "Done" : "Edit"}
      </Button>
    </VStack>
  );
}
