"use client";

import { HStack, Icon, Text } from "@chakra-ui/react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { PiEyeDuotone } from "react-icons/pi";

import { getStatsSummary } from "../lib/stats";

const MotionSpan = motion.span;

// Odometer: drives a motion value from 0 up to the total on mount and writes
// the rounded, comma-grouped value straight to the DOM node (no re-render per
// frame). framer-motion is already a dependency.
function RollingNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo — fast start, gentle settle
    });
    return () => controls.stop();
  }, [value, count]);
  return <MotionSpan>{text}</MotionSpan>;
}

// Quiet identity stat shown under the avatar: a duotone eye (accent-tinted)
// with a slow pulse, beside the all-time total page views. Renders nothing
// until the count is loaded and positive, so it never flashes a zero.
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
      spacing={2}
      fontSize="sm"
      color="fg.faint"
      sx={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={`${total.toLocaleString()} total page views`}
    >
      <motion.span
        style={{ display: "inline-flex" }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon as={PiEyeDuotone} boxSize={4} color="accent" />
      </motion.span>
      <Text as="span" fontWeight="600" color="fg.muted">
        <RollingNumber value={total} />
      </Text>
      <Text as="span">views</Text>
    </HStack>
  );
}
