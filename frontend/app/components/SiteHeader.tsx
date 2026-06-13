"use client";

import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiChevronDown, FiMenu, FiUser, FiX } from "react-icons/fi";

import { useAuth } from "../lib/auth-context";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/publications", label: "Publications" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/qa", label: "Q&A" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      as={NextLink}
      href={href}
      onClick={onClick}
      fontSize="sm"
      fontWeight={active ? "700" : "500"}
      color={active ? "accent" : "fg.muted"}
      borderBottomWidth="2px"
      borderColor={active ? "accent" : "transparent"}
      pb={1}
      _hover={{ textDecoration: "none", color: "fg.default" }}
    >
      {label}
    </Link>
  );
}

function AuthControl({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  if (loading) return null;

  if (!user) {
    return (
      <Link
        as={NextLink}
        href="/login"
        onClick={onNavigate}
        fontSize="sm"
        fontWeight="600"
        color="fg.default"
        _hover={{ color: "accent" }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        variant="ghost"
        color="fg.default"
        _hover={{ bg: "bg.card" }}
        _active={{ bg: "bg.card" }}
        leftIcon={<FiUser />}
        rightIcon={<FiChevronDown />}
      >
        <Text as="span" maxW="120px" noOfLines={1}>
          {user.username}
        </Text>
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={() => {
            onNavigate?.();
            void logout().then(() => router.refresh());
          }}
        >
          Sign out
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

export function SiteHeader() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      bg="rgba(17, 22, 31, 0.85)"
      backdropFilter="blur(8px)"
      borderBottomWidth="1px"
      borderColor="border.muted"
    >
      <Container maxW="5xl" py={3} px={{ base: 6, md: 10 }}>
        <Flex align="center" gap={6}>
          <Link
            as={NextLink}
            href="/"
            fontFamily="heading"
            fontWeight="700"
            fontSize="lg"
            color="fg.default"
            _hover={{ textDecoration: "none", color: "accent" }}
          >
            Wenxiao Zhang
          </Link>
          <Spacer />

          {/* Desktop nav */}
          <HStack spacing={6} display={{ base: "none", md: "flex" }}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            <AuthControl />
          </HStack>

          {/* Mobile trigger */}
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            display={{ base: "inline-flex", md: "none" }}
            onClick={onOpen}
          />
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="bg.surface">
          <Box position="absolute" top={3} right={3}>
            <IconButton aria-label="Close menu" icon={<FiX />} variant="ghost" size="sm" onClick={onClose} />
          </Box>
          <DrawerBody pt={16}>
            <VStack align="stretch" spacing={5}>
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} onClick={onClose} />
              ))}
              <Box pt={2} borderTopWidth="1px" borderColor="border.muted">
                <Box pt={4}>
                  <AuthControl onNavigate={onClose} />
                </Box>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
