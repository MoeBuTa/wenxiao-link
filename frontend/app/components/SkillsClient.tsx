"use client";

import {
  Box,
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
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FaCode, FaMagic, FaPuzzlePiece, FaRobot, FaSearch, FaTerminal } from "react-icons/fa";
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

function SkillCard({ entry }: { entry: AgentSkillEntry }) {
  const CategoryIcon = CATEGORY_ICONS[entry.category];
  const isHighlighted = Boolean(entry.highlightBlurb);
  return (
    <Box
      borderWidth="1px"
      borderColor={isHighlighted ? "accent" : "border.muted"}
      borderRadius="lg"
      bg="bg.card"
      p={4}
      h="full"
      boxShadow={isHighlighted ? "0 0 0 1px rgba(249,115,22,0.25)" : undefined}
    >
      <VStack align="stretch" spacing={2}>
        <Flex align="center" gap={2}>
          <Icon as={CategoryIcon} color="fg.faint" boxSize={3.5} />
          <Text fontWeight="700" color="fg.default" noOfLines={1}>
            {entry.name}
          </Text>
          {isHighlighted ? (
            <Icon as={FaMagic} color="accent" boxSize={3.5} ml="auto" flexShrink={0} />
          ) : null}
        </Flex>
        <Text fontSize="sm" color="fg.muted" noOfLines={isHighlighted ? undefined : 3}>
          {isHighlighted ? entry.highlightBlurb : entry.description}
        </Text>
        <Wrap spacing={1.5}>
          <WrapItem>
            <Tag size="sm" bg="rgba(56,189,248,0.1)" color="ocean" fontSize="0.7em">
              {SOURCE_LABELS[entry.source]}
            </Tag>
          </WrapItem>
          {entry.tags.slice(0, 3).map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" bg="bg.subtle" color="fg.muted" fontSize="0.7em">
                {tag}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </Box>
  );
}

function originLabel(origin: string): string {
  return origin.trim() || "Personal";
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
        <VStack align="stretch" spacing={8}>
          {grouped.map(([origin, entries]) => (
            <Box key={origin}>
              <Heading size="sm" color="fg.muted" mb={3}>
                {origin}
              </Heading>
              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                gap={4}
              >
                {entries.map((entry) => (
                  <SkillCard key={entry.slug} entry={entry} />
                ))}
              </Box>
            </Box>
          ))}
        </VStack>
      )}

      <HStack mt={10} spacing={1} color="fg.faint" fontSize="xs">
        <Icon as={FaCode} boxSize={3} />
        <Text>{skills.length} total, generated from this machine's Claude Code setup.</Text>
      </HStack>
    </Container>
  );
}
