"use client";

import { Flex, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The per-section admin pages were replaced by inline editing on the live
// site (toggle Edit mode). Blog still has a dedicated editor, so /admin lands
// there.
export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/blog");
  }, [router]);

  return (
    <Flex justify="center" py={20}>
      <Spinner color="accent" />
    </Flex>
  );
}
