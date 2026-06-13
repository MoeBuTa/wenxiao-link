"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth-context";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/profile", label: "Profile & About" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/blog", label: "Blog" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <Flex justify="center" py={20}>
        <Spinner color="accent" />
      </Flex>
    );
  }

  if (!user || !user.isSuperuser) {
    return (
      <Container maxW="md" py={20} textAlign="center">
        <Heading size="md" mb={3}>
          Admin access required
        </Heading>
        <Text color="fg.muted" mb={6}>
          {user
            ? "Your account doesn't have admin privileges."
            : "Please sign in with the owner account to edit site content."}
        </Text>
        <Button as={NextLink} href="/login" colorScheme="orange">
          {user ? "Switch account" : "Sign in"}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Flex align="baseline" justify="space-between" mb={2} wrap="wrap" gap={2}>
        <Heading size="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Content admin
        </Heading>
        <Link as={NextLink} href="/" fontSize="sm" color="accent">
          ← View site
        </Link>
      </Flex>
      <Wrap spacing={2} mb={8} pb={4} borderBottomWidth="1px" borderColor="border.muted">
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <WrapItem key={item.href}>
              <Link
                as={NextLink}
                href={item.href}
                fontSize="sm"
                fontWeight={active ? "700" : "500"}
                color={active ? "accent" : "fg.muted"}
                bg={active ? "bg.card" : "transparent"}
                px={3}
                py={1}
                borderRadius="md"
                _hover={{ textDecoration: "none", color: "fg.default", bg: "bg.card" }}
              >
                {item.label}
              </Link>
            </WrapItem>
          );
        })}
      </Wrap>
      <Box>{children}</Box>
    </Container>
  );
}
