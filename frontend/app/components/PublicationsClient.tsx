"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Container,
  Divider,
  HStack,
  Heading,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";

import type { Publication, PublicationsPayload } from "../lib/types";
import { PublicationItem } from "./PublicationItem";
import { PublicationStats } from "./PublicationStats";

export function PublicationsClient({ payload }: { payload: PublicationsPayload }) {
  const { profile, publications } = payload;

  const byYear = new Map<string, Publication[]>();
  for (const pub of publications) {
    const key = pub.year ? String(pub.year) : "Other";
    byYear.set(key, [...(byYear.get(key) ?? []), pub]);
  }
  const years = [...byYear.keys()].sort((a, b) => (a < b ? 1 : -1));

  // Every year expanded by default.
  const allOpen = years.map((_, i) => i);

  const syncedDate = profile.syncedAt
    ? new Date(profile.syncedAt).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Australia/Perth",
      })
    : null;

  return (
    <Container maxW="4xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={1}>
        Publications
      </Heading>
      <HStack mt={2} mb={6} spacing={3} flexWrap="wrap" fontSize="sm" color="fg.muted">
        <Link
          href={`https://scholar.google.com/citations?hl=en&user=${profile.userId}`}
          isExternal
        >
          <HStack spacing={1}>
            <Text>Google Scholar</Text>
            <FaExternalLinkAlt size="0.7em" />
          </HStack>
        </Link>
        {syncedDate ? <Text color="fg.faint">auto-synced {syncedDate}</Text> : null}
      </HStack>

      {publications.length > 0 ? (
        <PublicationStats profile={profile} publications={publications} />
      ) : null}

      <Divider borderColor="border.muted" mb={2} />

      {publications.length === 0 ? (
        <Text color="fg.muted" fontSize="sm" pt={4}>
          Publications are syncing from Google Scholar — check back shortly.
        </Text>
      ) : (
        <Accordion allowMultiple defaultIndex={allOpen}>
          {years.map((year) => {
            const items = byYear.get(year)!;
            return (
              <AccordionItem key={year} borderColor="border.muted">
                <AccordionButton px={1} py={3} _hover={{ bg: "transparent" }}>
                  <HStack flex="1" textAlign="left" spacing={3}>
                    <Heading
                      size="md"
                      color="accent"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {year}
                    </Heading>
                    <Badge
                      bg="bg.subtle"
                      color="fg.muted"
                      borderRadius="full"
                      px={2}
                    >
                      {items.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color="fg.muted" />
                </AccordionButton>
                <AccordionPanel px={0} pb={5}>
                  <VStack align="stretch" spacing={3}>
                    {items.map((pub) => (
                      <PublicationItem key={pub.scholarId || pub.id} pub={pub} />
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </Container>
  );
}
