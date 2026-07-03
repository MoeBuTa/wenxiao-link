"use client";

import {
  Box,
  Collapse,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FaBolt,
  FaBriefcase,
  FaChevronDown,
  FaChevronRight,
  FaCode,
  FaCompass,
  FaGraduationCap,
  FaLayerGroup,
  FaMagic,
  FaPuzzlePiece,
  FaRobot,
  FaSearch,
  FaTachometerAlt,
  FaTerminal,
  FaToolbox,
  FaUser,
} from "react-icons/fa";
import { GiBrain } from "react-icons/gi";
import type { IconType } from "react-icons";

import type { AgentSkillCategory, AgentSkillEntry, AgentSkillSource } from "../lib/types";

const SOURCE_LABELS: Record<AgentSkillSource, string> = {
  plugin: "Plugin",
  "npx-package": "npx package",
  "self-authored": "Self-authored",
  "linked-project": "Linked project",
};

const CATEGORY_LABELS: Record<AgentSkillCategory, string> = {
  skill: "Skill",
  command: "Command",
  agent: "Agent",
};

const CATEGORY_ICONS: Record<AgentSkillCategory, IconType> = {
  skill: FaPuzzlePiece,
  command: FaTerminal,
  agent: FaRobot,
};

const SOURCES: AgentSkillSource[] = ["plugin", "npx-package", "self-authored", "linked-project"];
const CATEGORIES: AgentSkillCategory[] = ["skill", "command", "agent"];

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tag
      as="button"
      onClick={onClick}
      size="md"
      cursor="pointer"
      bg={active ? "accent" : "bg.card"}
      color={active ? "coal.900" : "fg.muted"}
      borderWidth="1px"
      borderColor={active ? "accent" : "border.muted"}
      fontWeight={active ? "700" : "500"}
      _hover={{ borderColor: "accent" }}
    >
      {label}
    </Tag>
  );
}

// Compact row, not a card — a large catalog reads better as a dense list
// than as a grid of boxes, which eats vertical space fast at 75+ entries.
function SkillRow({ entry }: { entry: AgentSkillEntry }) {
  const CategoryIcon = CATEGORY_ICONS[entry.category];
  const isHighlighted = Boolean(entry.highlightBlurb);
  return (
    <HStack
      align="start"
      spacing={2}
      py={1.5}
      borderBottomWidth="1px"
      borderColor="border.muted"
      _last={{ borderBottomWidth: 0 }}
    >
      <Icon as={CategoryIcon} color={isHighlighted ? "accent" : "fg.faint"} boxSize={3} mt={1} flexShrink={0} />
      <Box minW={0} flex={1}>
        <HStack spacing={1.5}>
          <Text fontSize="sm" fontWeight={isHighlighted ? "700" : "600"} color="fg.default" noOfLines={1}>
            {entry.name}
          </Text>
          {isHighlighted ? <Icon as={FaMagic} color="accent" boxSize={2.5} flexShrink={0} /> : null}
        </HStack>
        <Text fontSize="xs" color="fg.muted" noOfLines={1}>
          {isHighlighted ? entry.highlightBlurb : entry.description}
        </Text>
      </Box>
    </HStack>
  );
}

function originLabel(origin: string): string {
  return origin.trim() || "Personal";
}

// One-line summary of what each source actually is, shown under the group
// name so a visitor doesn't have to guess what e.g. "mattpocock/skills"
// means. Hand-curated (small, stable set of origins) rather than pulled
// from any one entry's description.
const ORIGIN_SUMMARIES: Record<string, string> = {
  Personal: "Skills I wrote myself, or link in from other projects of mine.",
  superpowers:
    "Core skills library for Claude Code — TDD, systematic debugging, brainstorming, and other proven collaboration patterns.",
  "academic-research-skills":
    "A multi-agent pipeline for academic research and paper writing — literature review, drafting, and peer review.",
  "andrej-karpathy-skills": "Behavioral guidelines distilled from Andrej Karpathy's notes on common LLM coding mistakes.",
  "claude-hud": "A real-time statusline HUD for Claude Code — context health, tool activity, and todo progress at a glance.",
  "mattpocock/skills": "A general-purpose skill library, installed via npx, spanning engineering, writing, and productivity workflows.",
  "career-ops": "My own job-search command center, linked in from a separate project.",
  "vercel-labs/skills": "Vercel Labs' skill-discovery tooling for finding and installing other agent skills.",
};

// A small teaser icon per source so groups are visually distinguishable at
// a glance, not just by name. Falls back to a generic "layers" icon for any
// origin not in this hand-curated set (e.g. a newly installed plugin before
// someone adds it here).
const ORIGIN_ICONS: Record<string, IconType> = {
  Personal: FaUser,
  superpowers: FaBolt,
  "academic-research-skills": FaGraduationCap,
  "andrej-karpathy-skills": GiBrain,
  "claude-hud": FaTachometerAlt,
  "mattpocock/skills": FaToolbox,
  "career-ops": FaBriefcase,
  "vercel-labs/skills": FaCompass,
};

function GroupBlock({
  origin,
  entries,
  expanded,
  onToggle,
}: {
  origin: string;
  entries: AgentSkillEntry[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const summary = ORIGIN_SUMMARIES[origin];
  const GroupIcon = ORIGIN_ICONS[origin] ?? FaLayerGroup;
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg.card"
      p={4}
      mb={4}
      w="full"
      cursor="pointer"
      textAlign="left"
      _hover={{ borderColor: "accent" }}
    >
      <Flex align="center" gap={2} mb={1}>
        <Flex
          align="center"
          justify="center"
          boxSize={7}
          borderRadius="md"
          bg="rgba(249,115,22,0.12)"
          flexShrink={0}
        >
          <Icon as={GroupIcon} color="accent" boxSize={3.5} />
        </Flex>
        <Heading size="sm" color="fg.default">
          {origin}
        </Heading>
        <Icon as={expanded ? FaChevronDown : FaChevronRight} boxSize={2.5} color="fg.faint" ml="auto" />
      </Flex>
      {summary ? (
        <Text fontSize="xs" color="fg.faint" mb={expanded ? 2 : 0}>
          {summary}
        </Text>
      ) : null}
      <Collapse in={expanded} animateOpacity>
        <VStack align="stretch" spacing={0} mt={1}>
          {entries.map((entry) => (
            <SkillRow key={entry.slug} entry={entry} />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
}

export function SkillsClient({ skills }: { skills: AgentSkillEntry[] }) {
  const [search, setSearch] = useState("");
  const [activeSources, setActiveSources] = useState<Set<AgentSkillSource>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<AgentSkillCategory>>(new Set());

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter((s) => {
      if (activeSources.size > 0 && !activeSources.has(s.source)) return false;
      if (activeCategories.size > 0 && !activeCategories.has(s.category)) return false;
      if (!q) return true;
      const haystack = `${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [skills, search, activeSources, activeCategories]);

  const grouped = useMemo(() => {
    const byOrigin = new Map<string, AgentSkillEntry[]>();
    for (const entry of filtered) {
      const key = originLabel(entry.origin);
      const list = byOrigin.get(key) ?? [];
      list.push(entry);
      byOrigin.set(key, list);
    }
    for (const list of byOrigin.values()) {
      list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
    return [...byOrigin.entries()].sort(([a], [b]) => {
      if (a === "Personal") return 1;
      if (b === "Personal") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  // CSS `column-count` masonry re-flows every item (top-to-bottom, column by
  // column) whenever ANY item's height changes, so folding one group could
  // visibly jump every other group into a different column. Assigning each
  // group a fixed column by index instead means a group's column membership
  // never depends on rendered heights — only re-computed when the group
  // list or column count itself changes.
  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 3;
  const columns = useMemo(() => {
    const cols: Array<[string, AgentSkillEntry[]][]> = Array.from({ length: columnCount }, () => []);
    grouped.forEach(([origin, entries], i) => {
      cols[i % columnCount].push([origin, entries]);
    });
    return cols;
  }, [grouped, columnCount]);

  // Groups fold by default; a group with a curated highlight starts open
  // since that's the content worth seeing first. Seeded synchronously from
  // the full `skills` prop (not `grouped`, which depends on filter state)
  // so the first render already reflects the right state — no flash of
  // every group expanded before a later effect collapses them. Origins not
  // yet in the map (only possible if `skills` itself changes, which this
  // page never does after mount) default to expanded via the `?? true`
  // fallback below.
  const [expanded, setExpanded] = useState<Map<string, boolean>>(() => {
    const seed = new Map<string, boolean>();
    for (const entry of skills) {
      const key = originLabel(entry.origin);
      seed.set(key, (seed.get(key) ?? false) || Boolean(entry.highlightBlurb));
    }
    return seed;
  });

  function toggleGroup(origin: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(origin, !(next.get(origin) ?? true));
      return next;
    });
  }

  return (
    <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Skills
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Claude Code plugins, agent skills, and tooling installed and in active use — how I extend
        and work with AI coding agents.
      </Text>

      <InputGroup mb={4} maxW="sm">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="fg.faint" boxSize={3.5} />
        </InputLeftElement>
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="bg.card"
          borderColor="border.muted"
        />
      </InputGroup>

      <VStack align="stretch" spacing={2} mb={8}>
        <Wrap spacing={2}>
          {SOURCES.map((s) => (
            <WrapItem key={s}>
              <FilterChip
                label={SOURCE_LABELS[s]}
                active={activeSources.has(s)}
                onClick={() => toggle(activeSources, s, setActiveSources)}
              />
            </WrapItem>
          ))}
        </Wrap>
        <Wrap spacing={2}>
          {CATEGORIES.map((c) => (
            <WrapItem key={c}>
              <FilterChip
                label={CATEGORY_LABELS[c]}
                active={activeCategories.has(c)}
                onClick={() => toggle(activeCategories, c, setActiveCategories)}
              />
            </WrapItem>
          ))}
        </Wrap>
      </VStack>

      {grouped.length === 0 ? (
        <Text color="fg.faint" fontSize="sm">
          No skills match the current filters.
        </Text>
      ) : (
        <Flex gap={4} align="start">
          {columns.map((col, i) => (
            <VStack key={i} align="stretch" spacing={0} flex={1} minW={0}>
              {col.map(([origin, entries]) => (
                <GroupBlock
                  key={origin}
                  origin={origin}
                  entries={entries}
                  expanded={expanded.get(origin) ?? true}
                  onToggle={() => toggleGroup(origin)}
                />
              ))}
            </VStack>
          ))}
        </Flex>
      )}

      <HStack mt={10} spacing={1} color="fg.faint" fontSize="xs">
        <Icon as={FaCode} boxSize={3} />
        <Text>{skills.length} total, generated from this machine's Claude Code setup.</Text>
      </HStack>
    </Container>
  );
}
