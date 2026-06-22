"use client";

import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PiEyeDuotone } from "react-icons/pi";

import { getStatsSummary } from "../lib/stats";

// One split-flap tile: a dark card showing a single digit with a center hinge
// line, like a flip clock / calendar page. When `char` changes the old digit
// folds down (rotateX 0 -> -90) while the new one drops in from the top edge
// (90 -> 0). AnimatePresence's default "sync" mode runs both at once so rapid
// changes during the count-up read as a board spinning up and settling.
function FlipDigit({ char }: { char: string }) {
  return (
    <Box
      position="relative"
      w={{ base: "22px", md: "26px" }}
      h={{ base: "32px", md: "38px" }}
      bgGradient="linear(to-b, coal.800, coal.900)"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="6px"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)"
      overflow="hidden"
      sx={{ perspective: "240px" }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={char}
          initial={{ rotateX: 90 }}
          animate={{ rotateX: 0 }}
          exit={{ rotateX: -90 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformOrigin: "center",
            backfaceVisibility: "hidden",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            fontSize: "1.1rem",
            color: "var(--chakra-colors-accent)",
          }}
        >
          {char}
        </motion.div>
      </AnimatePresence>
      {/* center hinge line */}
      <Box
        position="absolute"
        top="50%"
        left={0}
        right={0}
        h="1px"
        bg="rgba(0,0,0,0.55)"
        boxShadow="0 1px 0 rgba(255,255,255,0.04)"
        pointerEvents="none"
        zIndex={2}
      />
    </Box>
  );
}

// Counts up from 0 to `value` in discrete, eased steps so each digit visibly
// flips, then renders the running total as flip tiles. Padded with leading
// zeros to the final width so the row never reflows mid-count.
function FlipNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(value);
      return;
    }
    const steps = 28;
    const durationMs = 1700;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const t = i / steps;
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(i >= steps ? value : Math.round(eased * value));
      if (i >= steps) clearInterval(id);
    }, durationMs / steps);
    return () => clearInterval(id);
  }, [value]);

  const width = String(value).length;
  const padded = String(display).padStart(width, "0");
  const grouped = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // thousands commas

  return (
    <HStack spacing={1} align="center">
      {grouped.split("").map((ch, i) =>
        ch === "," ? (
          <Text
            key={`sep-${i}`}
            as="span"
            color="fg.faint"
            fontWeight="800"
            fontSize="lg"
            px={0.5}
          >
            ,
          </Text>
        ) : (
          <FlipDigit key={`d-${i}`} char={ch} />
        ),
      )}
    </HStack>
  );
}

// Quiet identity stat under the avatar: a pulsing duotone eye beside the
// all-time total page views, shown as a calendar-style flip board. Renders
// nothing until the count is loaded and positive, so it never flashes a zero.
export function ViewCount() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getStatsSummary()
      .then((s) => alive && setTotal(s.totalViews))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (total === null || total <= 0) return null;

  return (
    <HStack
      spacing={2.5}
      color="fg.faint"
      aria-label={`${total.toLocaleString()} total page views`}
    >
      <motion.span
        style={{ display: "inline-flex" }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon as={PiEyeDuotone} boxSize={5} color="accent" />
      </motion.span>
      <FlipNumber value={total} />
      <Text as="span" fontSize="sm" fontWeight="500">
        views
      </Text>
    </HStack>
  );
}
