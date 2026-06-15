"use client";

import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

import type { Publication, ScholarProfile } from "../lib/types";

// CORE ranks in quality order, each with a fixed colour so the segmented bar
// and legend always agree. "" (unranked) is folded into the trailing bucket.
const RANK_ORDER: { key: string; label: string; color: string }[] = [
  { key: "A*", label: "A*", color: "#fbbf24" },
  { key: "A", label: "A", color: "#fb923c" },
  { key: "B", label: "B", color: "#38bdf8" },
  { key: "C", label: "C", color: "#818cf8" },
  { key: "Preprint", label: "Preprint", color: "#64748b" },
  { key: "", label: "Unranked", color: "#475569" },
];

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Stat
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <StatNumber
        color="accent"
        fontSize="2xl"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </StatNumber>
      <StatLabel color="fg.muted" fontSize="xs">
        {label}
      </StatLabel>
    </Stat>
  );
}

function ChartHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="700"
      color="ocean"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={4}
    >
      {children}
    </Text>
  );
}

// Vertical bars, one per year, sharing a common baseline. Heights scale to the
// busiest year; an empty year still shows a sliver so the axis reads evenly.
function YearBars({ data }: { data: { year: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <Box>
      <Flex align="flex-end" gap={2} h="116px">
        {data.map((d) => (
          <VStack key={d.year} flex="1" spacing={1} justify="flex-end" h="full">
            <Text
              fontSize="2xs"
              color="fg.faint"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {d.count}
            </Text>
            <Box
              w="full"
              maxW="44px"
              h={`${Math.max((d.count / max) * 90, 6)}px`}
              bgGradient="linear(to-t, ocean, accent)"
              borderTopRadius="md"
              transition="opacity 0.15s ease"
              _hover={{ opacity: 0.82 }}
              title={`${d.year}: ${d.count} publication${d.count === 1 ? "" : "s"}`}
            />
          </VStack>
        ))}
      </Flex>
      <Flex gap={2} mt={2}>
        {data.map((d) => (
          <Text
            key={d.year}
            flex="1"
            textAlign="center"
            fontSize="2xs"
            color="fg.muted"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {d.year}
          </Text>
        ))}
      </Flex>
    </Box>
  );
}

// One proportional segment per non-empty rank, plus a matching legend.
function RankBar({
  segments,
}: {
  segments: { label: string; count: number; color: string }[];
}) {
  return (
    <Box>
      <HStack spacing={0.5} h="16px" borderRadius="full" overflow="hidden" mb={4}>
        {segments.map((s) => (
          <Box
            key={s.label}
            flex={s.count}
            bg={s.color}
            h="full"
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </HStack>
      <Wrap spacing={3} spacingY={2}>
        {segments.map((s) => (
          <WrapItem key={s.label}>
            <HStack spacing={1.5}>
              <Box boxSize="9px" borderRadius="full" bg={s.color} flexShrink={0} />
              <Text fontSize="xs" color="fg.muted">
                {s.label}
                <Text
                  as="span"
                  color="fg.faint"
                  ml={1}
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {s.count}
                </Text>
              </Text>
            </HStack>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
}

export function PublicationStats({
  profile,
  publications,
}: {
  profile: ScholarProfile;
  publications: Publication[];
}) {
  const hasCitations = profile.citationsAll > 0;

  // Publications per year, oldest → newest, gaps filled so the axis is continuous.
  const counts = new Map<number, number>();
  for (const pub of publications) {
    if (pub.year) counts.set(pub.year, (counts.get(pub.year) ?? 0) + 1);
  }
  const knownYears = [...counts.keys()].sort((a, b) => a - b);
  const yearData =
    knownYears.length > 0
      ? Array.from(
          { length: knownYears[knownYears.length - 1] - knownYears[0] + 1 },
          (_, i) => {
            const year = knownYears[0] + i;
            return { year: String(year), count: counts.get(year) ?? 0 };
          },
        )
      : [];

  // CORE rank tallies, keeping only ranks that actually occur.
  const rankCounts = new Map<string, number>();
  for (const pub of publications) {
    const key = pub.coreRank ?? "";
    rankCounts.set(key, (rankCounts.get(key) ?? 0) + 1);
  }
  const rankSegments = RANK_ORDER.map((r) => ({
    label: r.label,
    color: r.color,
    count: rankCounts.get(r.key) ?? 0,
  })).filter((s) => s.count > 0);

  const tiles = [
    ...(hasCitations
      ? [
          { label: "Citations", value: profile.citationsAll },
          { label: "h-index", value: profile.hIndexAll },
          { label: "i10-index", value: profile.i10IndexAll },
        ]
      : []),
    { label: "Publications", value: publications.length },
  ];

  return (
    <Box
      bg="bg.card"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      mb={8}
    >
      <SimpleGrid columns={{ base: 2, sm: Math.min(tiles.length, 4) }} spacing={3} mb={6}>
        {tiles.map((t) => (
          <MetricTile key={t.label} label={t.label} value={t.value} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 10 }}>
        {yearData.length > 0 ? (
          <Box>
            <ChartHeading>Publications by year</ChartHeading>
            <YearBars data={yearData} />
          </Box>
        ) : null}
        {rankSegments.length > 0 ? (
          <Box>
            <ChartHeading>CORE ranking</ChartHeading>
            <RankBar segments={rankSegments} />
          </Box>
        ) : null}
      </SimpleGrid>
    </Box>
  );
}
