"use client";

import { Box, Container, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaEnvelope, FaGithub, FaGraduationCap, FaLinkedin, FaRegEye } from "react-icons/fa";

import { getStatsSummary, type StatsSummary } from "../lib/stats";

const LINKS = [
  { href: "mailto:moebutamail@gmail.com", icon: FaEnvelope, label: "Email" },
  {
    href: "https://scholar.google.com/citations?hl=en&user=Yf6xHJ4AAAAJ",
    icon: FaGraduationCap,
    label: "Google Scholar",
  },
  { href: "https://github.com/MoeBuTa", icon: FaGithub, label: "GitHub" },
  { href: "https://www.linkedin.com/in/wenxiao-zhang-a0801b206/", icon: FaLinkedin, label: "LinkedIn" },
];

export function SiteFooter() {
  const [stats, setStats] = useState<StatsSummary | null>(null);

  useEffect(() => {
    let alive = true;
    getStatsSummary()
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Box as="footer" borderTopWidth="1px" borderColor="border.muted" mt={8}>
      <Container maxW="5xl" py={8} px={{ base: 6, md: 10 }}>
        <VStack spacing={3}>
          <HStack spacing={5}>
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                isExternal={link.href.startsWith("http")}
                aria-label={link.label}
              >
                <Icon as={link.icon} boxSize={5} color="fg.faint" _hover={{ color: "accent" }} />
              </Link>
            ))}
          </HStack>
          {stats ? (
            <HStack spacing={2} fontSize="xs" color="fg.faint">
              <Icon as={FaRegEye} boxSize={3.5} />
              <Text>{stats.totalViews.toLocaleString()} views</Text>
              <Text aria-hidden>·</Text>
              <Text>{stats.todayViews.toLocaleString()} today</Text>
              <Text aria-hidden>·</Text>
              <Text>{stats.uniqueVisitors.toLocaleString()} visitors</Text>
            </HStack>
          ) : null}
          <Text fontSize="xs" color="fg.faint">
            © {new Date().getFullYear()} Wenxiao Zhang · wenxiao.link
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
