"use client";

import { Box, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";

const CARDS = [
  { href: "/admin/profile", title: "Profile & About", desc: "Name, tagline, summary, interests, links." },
  { href: "/admin/news", title: "News", desc: "Add/edit news items with inline links." },
  { href: "/admin/education", title: "Education", desc: "Degrees and institutions." },
  { href: "/admin/experience", title: "Experience", desc: "Roles and detail." },
  { href: "/admin/skills", title: "Skills", desc: "Skill groups and items." },
  { href: "/admin/projects", title: "Projects", desc: "Cards, tags, featured flag." },
  { href: "/admin/blog", title: "Blog", desc: "Write posts in markdown." },
];

export default function AdminDashboard() {
  return (
    <Box>
      <Heading size="lg" mb={2}>
        Dashboard
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Edit everything on the site. Changes go live within ~30 seconds. Publications sync
        automatically from Google Scholar and aren&apos;t edited here.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {CARDS.map((c) => (
          <Link
            key={c.href}
            as={NextLink}
            href={c.href}
            _hover={{ textDecoration: "none" }}
          >
            <Box
              borderWidth="1px"
              borderColor="border.muted"
              borderRadius="lg"
              bg="bg.card"
              p={5}
              h="full"
              _hover={{ borderColor: "accent", boxShadow: "0 0 0 1px rgba(249,115,22,0.25)" }}
              transition="all 0.15s ease"
            >
              <Heading size="sm" color="fg.default">
                {c.title}
              </Heading>
              <Text fontSize="sm" color="fg.muted" mt={1}>
                {c.desc}
              </Text>
            </Box>
          </Link>
        ))}
      </SimpleGrid>
    </Box>
  );
}
