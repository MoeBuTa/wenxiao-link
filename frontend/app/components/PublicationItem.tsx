"use client";

import { Box, HStack, Link, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";

import type { Publication } from "../lib/types";
import { CoreRankBadge } from "./CoreRankBadge";

const OWN_NAME_PATTERNS = ["w zhang", "wenxiao zhang", "wx zhang"];

export function AuthorLine({ authors }: { authors: string }) {
  const parts = authors.split(/,\s*/);
  return (
    <Text fontSize="sm" color="fg.muted">
      {parts.map((part, i) => {
        const isSelf = OWN_NAME_PATTERNS.includes(part.trim().toLowerCase());
        return (
          <Text
            key={`${part}-${i}`}
            as="span"
            fontWeight={isSelf ? "700" : "400"}
            color={isSelf ? "ocean" : undefined}
          >
            {part}
            {i < parts.length - 1 ? ", " : ""}
          </Text>
        );
      })}
    </Text>
  );
}

function VenueAcronymBadge({ acronym }: { acronym: string }) {
  return (
    <Box
      as="span"
      display="inline-block"
      bg="rgba(56,189,248,0.12)"
      color="ocean"
      borderWidth="1px"
      borderColor="rgba(56,189,248,0.3)"
      borderRadius="full"
      px={2}
      py="1px"
      fontSize="0.7em"
      fontWeight="700"
      lineHeight="1.5"
    >
      {acronym}
    </Box>
  );
}

export function PublicationItem({ pub }: { pub: Publication }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg.card"
      px={4}
      py={3}
      _hover={{ borderColor: "accent", boxShadow: "0 0 0 1px rgba(249,115,22,0.25)" }}
      transition="all 0.15s ease"
    >
      <VStack align="stretch" spacing={1.5}>
        <Link href={pub.url} isExternal fontWeight="600" color="fg.default" fontSize="md">
          {pub.title}
        </Link>
        <AuthorLine authors={pub.authors} />
        {pub.venue ? (
          <Text fontSize="sm" color="fg.faint" fontStyle="italic">
            {pub.venue}
            {pub.year ? `, ${pub.year}` : ""}
          </Text>
        ) : null}
        <Wrap spacing={2} pt={1} align="center">
          {pub.coreAcronym && pub.coreAcronym !== "arXiv" ? (
            <WrapItem>
              <VenueAcronymBadge acronym={pub.coreAcronym} />
            </WrapItem>
          ) : null}
          <WrapItem>
            <CoreRankBadge rank={pub.coreRank} />
          </WrapItem>
          {pub.citedBy > 0 ? (
            <WrapItem>
              <Link
                href={pub.citedByUrl || undefined}
                isExternal
                fontSize="xs"
                color="fg.faint"
                _hover={{ color: "accent" }}
              >
                {pub.citedBy} citation{pub.citedBy === 1 ? "" : "s"}
              </Link>
            </WrapItem>
          ) : null}
        </Wrap>
      </VStack>
    </Box>
  );
}
