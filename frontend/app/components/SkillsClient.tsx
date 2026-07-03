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
  Link,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaCode,
  FaExternalLinkAlt,
  FaMagic,
  FaPuzzlePiece,
  FaRobot,
  FaSearch,
  FaTerminal,
} from "react-icons/fa";
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

// Each skill is its own top-level card: name (linked) + up to 3 tags always
// visible; the description only shows once expanded, so a 75-entry catalog
// stays scannable at a glance.
function SkillCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: AgentSkillEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const CategoryIcon = CATEGORY_ICONS[entry.category];
  const isHighlighted = Boolean(entry.highlightBlurb);
  // A skill invoked via a documented set of commands (e.g. academic-paper,
  // triggered by ars-plan/ars-outline/...) is shown under its repo name —
  // the internal skill id isn't meaningful on its own once several skills
  // from the same repo all have their own usage lists. A skill with no such
  // set (brainstorming, tdd, career-ops...) keeps its own name.
  const hasUsageSet = entry.usage.length > 0;
  const displayName = hasUsageSet && entry.origin ? entry.origin : entry.name;
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
      borderColor={isHighlighted ? "accent" : "border.muted"}
      borderRadius="lg"
      bg="bg.card"
      p={3}
      mb={3}
      w="full"
      cursor="pointer"
      textAlign="left"
      boxShadow={isHighlighted ? "0 0 0 1px rgba(249,115,22,0.25)" : undefined}
      _hover={{ borderColor: "accent" }}
    >
      <Flex align="center" gap={2}>
        <Icon as={CategoryIcon} color={isHighlighted ? "accent" : "fg.faint"} boxSize={3} flexShrink={0} />
        {entry.url ? (
          <Link
            href={entry.url}
            isExternal
            onClick={(e) => e.stopPropagation()}
            fontSize="sm"
            fontWeight={isHighlighted ? "700" : "600"}
            color="fg.default"
            noOfLines={1}
            _hover={{ color: "accent", textDecoration: "underline" }}
          >
            {displayName}
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight={isHighlighted ? "700" : "600"} color="fg.default" noOfLines={1}>
            {displayName}
          </Text>
        )}
        {entry.url ? <Icon as={FaExternalLinkAlt} color="fg.faint" boxSize={2} flexShrink={0} /> : null}
        {isHighlighted ? <Icon as={FaMagic} color="accent" boxSize={2.5} flexShrink={0} /> : null}
        <Icon as={expanded ? FaChevronDown : FaChevronRight} boxSize={2.5} color="fg.faint" ml="auto" flexShrink={0} />
      </Flex>
      {entry.tags.length > 0 ? (
        <Wrap spacing={1} mt={1.5}>
          {entry.tags.slice(0, 3).map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" bg="bg.subtle" color="fg.muted" fontSize="0.65em" px={1.5} py={0}>
                {tag}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      ) : null}
      {hasUsageSet ? (
        <Text fontSize="xs" color="fg.faint" mt={1.5}>
          Usage: {entry.usage.slice(0, 3).join(", ")}
        </Text>
      ) : null}
      <Collapse in={expanded} animateOpacity>
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {isHighlighted ? entry.highlightBlurb : entry.description}
        </Text>
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

  // Curated highlights first (by highlightOrder), then everything else
  // alphabetically — there's no origin grouping anymore, so this ordering is
  // what surfaces the featured entries up top.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ao = a.highlightOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.highlightOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  // Fixed column assignment (not CSS `column-count`) so expanding/collapsing
  // one card never reflows every other card into a different column.
  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 3;
  const columns = useMemo(() => {
    const cols: AgentSkillEntry[][] = Array.from({ length: columnCount }, () => []);
    sorted.forEach((entry, i) => cols[i % columnCount].push(entry));
    return cols;
  }, [sorted, columnCount]);

  // Each card folds to name + tags by default; a curated highlight starts
  // expanded since that's the content worth seeing first. Seeded
  // synchronously from the full `skills` prop so the first render is
  // already correct.
  const [expanded, setExpanded] = useState<Map<string, boolean>>(() => {
    const seed = new Map<string, boolean>();
    for (const entry of skills) seed.set(entry.slug, Boolean(entry.highlightBlurb));
    return seed;
  });

  function toggleCard(slug: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(slug, !(next.get(slug) ?? false));
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

      {sorted.length === 0 ? (
        <Text color="fg.faint" fontSize="sm">
          No skills match the current filters.
        </Text>
      ) : (
        <Flex gap={4} align="start">
          {columns.map((col, i) => (
            <VStack key={i} align="stretch" spacing={0} flex={1} minW={0}>
              {col.map((entry) => (
                <SkillCard
                  key={entry.slug}
                  entry={entry}
                  expanded={expanded.get(entry.slug) ?? false}
                  onToggle={() => toggleCard(entry.slug)}
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
