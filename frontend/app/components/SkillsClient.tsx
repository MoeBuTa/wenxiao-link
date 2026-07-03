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

import type { AgentSkillCategory, AgentSkillEntry } from "../lib/types";

const CATEGORY_ICONS: Record<AgentSkillCategory, IconType> = {
  skill: FaPuzzlePiece,
  command: FaTerminal,
  agent: FaRobot,
};

// Repo-level presentation metadata, curated. `description` is normalized from
// each repo's own GitHub description (kept to a similar ~13-word length so
// cards line up); `tags` is a hand-picked trio that doubles as the filter
// taxonomy. Keyed by the same value the cards group on (origin, or the skill
// name for origin-less self-authored entries). A repo not listed here falls
// back to its primary skill's DB description/tags.
type RepoMeta = { description: string; tags: string[] };
const REPO_META: Record<string, RepoMeta> = {
  superpowers: {
    description: "A software-development methodology and skills framework for coding agents — TDD, debugging, collaboration.",
    tags: ["engineering", "methodology", "debugging"],
  },
  "mattpocock/skills": {
    description: "Agent skills for engineers to improve code quality, alignment, and everyday workflow efficiency.",
    tags: ["engineering", "code-quality", "workflow"],
  },
  "andrej-karpathy-skills": {
    description: "Guidelines for better Claude Code behavior, drawn from Karpathy's notes on common LLM coding mistakes.",
    tags: ["engineering", "code-quality", "guidelines"],
  },
  "academic-research-skills": {
    description: "A Claude Code skill suite for academic research: literature review through peer review and publication.",
    tags: ["academic", "research", "peer-review"],
  },
  reviewviz: {
    description: "Turns peer-review comments into an interactive HTML page for planning rebuttals efficiently.",
    tags: ["academic", "peer-review", "visualization"],
  },
  "work-canvas": {
    description: "Turns an AI agent's work into self-contained, offline-viewable HTML pages for review.",
    tags: ["visualization", "reporting", "productivity"],
  },
  "career-ops": {
    description: "An AI-powered job-search system that evaluates offers, generates tailored CVs, and tracks applications.",
    tags: ["job-search", "automation", "productivity"],
  },
  "claude-hud": {
    description: "A Claude Code plugin showing real-time context usage, tool activity, and task progress in the statusline.",
    tags: ["tooling", "monitoring", "statusline"],
  },
  "vercel-labs/skills": {
    description: "The CLI for the open agent-skills ecosystem — install reusable instruction sets across 70+ coding agents.",
    tags: ["tooling", "skill-discovery", "cli"],
  },
};

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
  description: string;
  tags: string[];
  entries: AgentSkillEntry[];
};

function repoDescription(key: string, entries: AgentSkillEntry[]): string {
  return REPO_META[key]?.description || entries[0].highlightBlurb || entries[0].description;
}

function repoTags(key: string, entries: AgentSkillEntry[]): string[] {
  return (REPO_META[key]?.tags ?? entries[0].tags).slice(0, 3);
}

// One card per repo, not per individual skill — a repo that ships many skills
// (mattpocock/skills: 39, superpowers: 14) would otherwise flood the page.
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
    list.sort((a, b) => a.name.localeCompare(b.name));
    groups.push({
      key,
      name: key,
      url: list.find((e) => e.url)?.url ?? "",
      description: repoDescription(key, list),
      tags: repoTags(key, list),
      entries: list,
    });
  }

  groups.sort((a, b) => a.name.localeCompare(b.name));
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
  const { name, url, description, tags, entries } = group;
  const single = entries.length === 1;
  const CategoryIcon = CATEGORY_ICONS[entries[0].category];

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

      <Text fontSize="xs" color="fg.muted" mt={1.5}>
        {description}
      </Text>

      {tags.length > 0 ? (
        <Wrap spacing={1} mt={1.5}>
          {tags.map((tag) => (
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
          <Text fontSize="xs" color="fg.faint" mt={2}>
            {entries[0].description}
          </Text>
        ) : (
          <VStack align="stretch" spacing={1.5} mt={2}>
            {entries.map((entry) => (
              <Box key={entry.slug}>
                <Text fontSize="xs" fontWeight="600" color="fg.default">
                  {entry.name}
                </Text>
                <Text fontSize="xs" color="fg.muted">
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
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const allGroups = useMemo(() => groupByRepo(skills), [skills]);

  // Filter taxonomy = the union of every repo card's tags, sorted.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const g of allGroups) for (const t of g.tags) set.add(t);
    return [...set].sort();
  }, [allGroups]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allGroups.filter((g) => {
      if (activeTags.size > 0 && !g.tags.some((t) => activeTags.has(t))) return false;
      if (!q) return true;
      const haystack = `${g.name} ${g.description} ${g.tags.join(" ")} ${g.entries
        .map((e) => `${e.name} ${e.description} ${e.tags.join(" ")}`)
        .join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allGroups, search, activeTags]);

  // Fixed column assignment (not CSS `column-count`) so expanding/collapsing
  // one card never reflows every other card into a different column.
  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 3;
  const columns = useMemo(() => {
    const cols: RepoGroup[][] = Array.from({ length: columnCount }, () => []);
    groups.forEach((group, i) => cols[i % columnCount].push(group));
    return cols;
  }, [groups, columnCount]);

  // Every card folds by default.
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

      <Wrap spacing={2} mb={8}>
        {allTags.map((tag) => (
          <WrapItem key={tag}>
            <FilterChip label={tag} active={activeTags.has(tag)} onClick={() => toggleTag(tag)} />
          </WrapItem>
        ))}
      </Wrap>

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
