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

type RepoGroup = {
  key: string;
  name: string;
  url: string;
  isHighlighted: boolean;
  highlightOrder: number;
  entries: AgentSkillEntry[];
};

// One card per repo, not per individual skill — a repo that ships many
// skills (mattpocock/skills: ~40, superpowers: 14) would otherwise flood
// the page with near-identical-looking cards. Repos with no public origin
// (self-authored, no shared repo) are their own one-skill "repo".
function groupByRepo(entries: AgentSkillEntry[]): RepoGroup[] {
  const byKey = new Map<string, AgentSkillEntry[]>();
  for (const entry of entries) {
    const key = entry.origin.trim() || entry.name;
    const list = byKey.get(key) ?? [];
    list.push(entry);
    byKey.set(key, list);
  }

  const groups: RepoGroup[] = [];
  for (const [key, list] of byKey) {
    list.sort((a, b) => {
      const ao = a.highlightOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.highlightOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    const highlightOrder = list.reduce(
      (min, e) => (e.highlightOrder !== null ? Math.min(min, e.highlightOrder) : min),
      Number.POSITIVE_INFINITY,
    );
    groups.push({
      key,
      name: key,
      url: list.find((e) => e.url)?.url ?? "",
      isHighlighted: list.some((e) => Boolean(e.highlightBlurb)),
      highlightOrder,
      entries: list,
    });
  }

  groups.sort((a, b) => {
    if (a.highlightOrder !== b.highlightOrder) return a.highlightOrder - b.highlightOrder;
    return a.name.localeCompare(b.name);
  });
  return groups;
}

function RepoCard({
  group,
  expanded,
  onToggle,
}: {
  group: RepoGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { name, url, entries } = group;
  const single = entries.length === 1;
  const topNames = entries.slice(0, 3).map((e) => e.name);
  const primaryCategory = entries[0].category;
  const CategoryIcon = CATEGORY_ICONS[primaryCategory];

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
      p={3}
      mb={3}
      w="full"
      cursor="pointer"
      textAlign="left"
      _hover={{ borderColor: "accent" }}
    >
      <Flex align="center" gap={2}>
        <Icon as={CategoryIcon} color="fg.faint" boxSize={3} flexShrink={0} />
        {url ? (
          <Link
            href={url}
            isExternal
            onClick={(e) => e.stopPropagation()}
            fontSize="sm"
            fontWeight="600"
            color="fg.default"
            noOfLines={1}
            _hover={{ color: "accent", textDecoration: "underline" }}
          >
            {name}
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight="600" color="fg.default" noOfLines={1}>
            {name}
          </Text>
        )}
        {url ? <Icon as={FaExternalLinkAlt} color="fg.faint" boxSize={2} flexShrink={0} /> : null}
        <Icon as={expanded ? FaChevronDown : FaChevronRight} boxSize={2.5} color="fg.faint" ml="auto" flexShrink={0} />
      </Flex>

      {!single ? (
        <Text fontSize="xs" color="fg.faint" mt={1.5}>
          Usage: {topNames.join(", ")}
          {entries.length > 3 ? ` +${entries.length - 3} more` : ""}
        </Text>
      ) : entries[0].tags.length > 0 ? (
        <Wrap spacing={1} mt={1.5}>
          {entries[0].tags.slice(0, 3).map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" bg="bg.subtle" color="fg.muted" fontSize="0.65em" px={1.5} py={0}>
                {tag}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      ) : null}

      <Collapse in={expanded} animateOpacity>
        {single ? (
          <Text fontSize="xs" color="fg.muted" mt={2} noOfLines={2}>
            {entries[0].highlightBlurb || entries[0].description}
          </Text>
        ) : (
          <VStack align="stretch" spacing={1.5} mt={2}>
            {entries.map((entry) => (
              <Box key={entry.slug}>
                <Text fontSize="xs" fontWeight="600" color="fg.default">
                  {entry.name}
                </Text>
                <Text fontSize="xs" color="fg.muted" noOfLines={2}>
                  {entry.highlightBlurb || entry.description}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
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

  const groups = useMemo(() => groupByRepo(filtered), [filtered]);

  // Fixed column assignment (not CSS `column-count`) so expanding/collapsing
  // one card never reflows every other card into a different column.
  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 3;
  const columns = useMemo(() => {
    const cols: RepoGroup[][] = Array.from({ length: columnCount }, () => []);
    groups.forEach((group, i) => cols[i % columnCount].push(group));
    return cols;
  }, [groups, columnCount]);

  // Every card folds by default — no highlighting/auto-expand special case.
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());

  function toggleGroup(key: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(key, !(next.get(key) ?? false));
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

      {groups.length === 0 ? (
        <Text color="fg.faint" fontSize="sm">
          No skills match the current filters.
        </Text>
      ) : (
        <Flex gap={4} align="start">
          {columns.map((col, i) => (
            <VStack key={i} align="stretch" spacing={0} flex={1} minW={0}>
              {col.map((group) => (
                <RepoCard
                  key={group.key}
                  group={group}
                  expanded={expanded.get(group.key) ?? false}
                  onToggle={() => toggleGroup(group.key)}
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
