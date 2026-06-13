"use client";

import { Box } from "@chakra-ui/react";

// Explicit dark-mode styling per rank — orange for the prestige A* tier,
// blue/teal for A/B, neutral for C, muted outline for preprints. Keeps the
// orange·blue·black palette consistent instead of relying on Chakra's
// light "subtle" badge variants.
const RANK_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  "A*": { bg: "rgba(249,115,22,0.16)", color: "#fdba74", border: "rgba(249,115,22,0.45)" },
  A: { bg: "rgba(56,189,248,0.15)", color: "#7dd3fc", border: "rgba(56,189,248,0.4)" },
  B: { bg: "rgba(45,212,191,0.14)", color: "#5eead4", border: "rgba(45,212,191,0.38)" },
  C: { bg: "rgba(148,163,184,0.14)", color: "#cbd5e1", border: "rgba(148,163,184,0.34)" },
  Preprint: { bg: "transparent", color: "#fdba74", border: "rgba(249,115,22,0.4)" },
  Unranked: { bg: "transparent", color: "#9aa7b5", border: "rgba(148,163,184,0.3)" },
};

export function CoreRankBadge({ rank }: { rank: string }) {
  if (!rank) return null;
  const style = RANK_STYLE[rank] ?? RANK_STYLE.Unranked;
  const isCoreRank = rank === "A*" || rank === "A" || rank === "B" || rank === "C";
  return (
    <Box
      as="span"
      display="inline-block"
      bg={style.bg}
      color={style.color}
      borderWidth="1px"
      borderColor={style.border}
      borderRadius="full"
      px={2}
      py="1px"
      fontSize="0.7em"
      fontWeight="700"
      lineHeight="1.5"
      whiteSpace="nowrap"
    >
      {isCoreRank ? `CORE ${rank}` : rank}
    </Box>
  );
}
