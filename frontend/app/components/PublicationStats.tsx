"use client";

import {
  Box,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import type { Publication, ScholarProfile } from "../lib/types";

// CORE ranks in quality order, each with a fixed colour so the pie and its
// legend always agree. "" (unranked) is folded into the trailing bucket.
const RANK_ORDER: { key: string; label: string; color: string }[] = [
  { key: "A*", label: "A*", color: "#fbbf24" },
  { key: "A", label: "A", color: "#fb923c" },
  { key: "B", label: "B", color: "#38bdf8" },
  { key: "C", label: "C", color: "#818cf8" },
  { key: "Preprint", label: "Preprint", color: "#64748b" },
  { key: "", label: "Unranked", color: "#475569" },
];

// Theme colours pulled as literals — recharts renders bare SVG, outside
// Chakra's styling, so it can't resolve semantic tokens.
const C = {
  accent: "#fb923c",
  ocean: "#7dd3fc",
  fgMuted: "#9aa7b5",
  fgFaint: "#8a95a3",
  surface: "#11161f",
};

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

// Dark tooltip shared by both charts. For the pie, recharts passes the slice
// name as payload[0].name (no `label`); for the bars, `label` is the year.
function ChartTip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string }[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  const title = label ?? point.name;
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      px={3}
      py={2}
      fontSize="xs"
      sx={{ fontVariantNumeric: "tabular-nums" }}
    >
      <Text color="fg.muted">{title}</Text>
      <Text color="fg.default" fontWeight="600">
        {point.value}
        {unit ? ` ${unit}` : ""}
      </Text>
    </Box>
  );
}

// Citations received per calendar year, oldest → newest, with the count above
// each bar. Bars share the page's ocean→accent vertical gradient.
function CitationsByYear({ data }: { data: { year: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={232}>
      <BarChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="citeBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.ocean} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: C.fgMuted }}
        />
        <Tooltip
          content={<ChartTip unit="citations" />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="count" fill="url(#citeBar)" radius={[4, 4, 0, 0]} maxBarSize={48}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 11, fill: C.fgFaint }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Full pie of the CORE-rank distribution, with a matching count legend below.
function RankPie({
  segments,
}: {
  segments: { label: string; count: number; color: string }[];
}) {
  return (
    <Box>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={segments}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            paddingAngle={1}
            stroke={C.surface}
            strokeWidth={2}
          >
            {segments.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ResponsiveContainer>
      <Wrap spacing={3} spacingY={2} mt={2} justify="center">
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

  // Citations received per calendar year, oldest → newest. Empty until the
  // backend re-syncs with the histogram parser (then the offline seed catches
  // up), so the chart simply hides itself until data is present.
  const citeData = Object.entries(profile.citationsByYear ?? {})
    .map(([year, count]) => ({ year, count: Number(count) || 0 }))
    .sort((a, b) => a.year.localeCompare(b.year));

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
        {citeData.length > 0 ? (
          <Box>
            <ChartHeading>Citations by year</ChartHeading>
            <CitationsByYear data={citeData} />
          </Box>
        ) : null}
        {rankSegments.length > 0 ? (
          <Box>
            <ChartHeading>CORE ranking</ChartHeading>
            <RankPie segments={rankSegments} />
          </Box>
        ) : null}
      </SimpleGrid>
    </Box>
  );
}
