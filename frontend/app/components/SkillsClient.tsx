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
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FaBookOpen,
  FaCheck,
  FaChalkboardTeacher,
  FaChevronDown,
  FaChevronRight,
  FaCode,
  FaExternalLinkAlt,
  FaGlobe,
  FaPenNib,
  FaProjectDiagram,
  FaRegCopy,
  FaSearch,
} from "react-icons/fa";
import type { IconType } from "react-icons";

import type { AgentSkillEntry, WorkflowCategory } from "../lib/types";

// ---- Taxonomy ---------------------------------------------------------------
// The page's primary sections, one per AgentSkill.workflow_category. Order is
// the narrative flow (discover → write → visualize → present → build). Adapted
// from JingbiaoMei/my-agent-skills' six research-workflow categories.
type CategoryMeta = { key: Exclude<WorkflowCategory, "">; label: string; goal: string; icon: IconType };
const CATEGORIES: CategoryMeta[] = [
  {
    key: "literature",
    label: "Literature & Research",
    goal: "Systematic discovery, citation management, and evidence appraisal.",
    icon: FaBookOpen,
  },
  {
    key: "writing",
    label: "Writing & Editing",
    goal: "Publication-quality drafting, editing, and prose automation.",
    icon: FaPenNib,
  },
  {
    key: "diagramming",
    label: "Diagramming & Visualization",
    goal: "Vector figures, schematics, and reviewable visual artifacts.",
    icon: FaProjectDiagram,
  },
  {
    key: "slides",
    label: "Slides & Posters",
    goal: "Conference decks and research posters.",
    icon: FaChalkboardTeacher,
  },
  {
    key: "web",
    label: "Web & UI/UX",
    goal: "Project pages, interactive demos, and deployment.",
    icon: FaGlobe,
  },
  {
    key: "engineering",
    label: "Engineering & Agent Workflow",
    goal: "TDD, debugging, and the agent-driven development loop.",
    icon: FaCode,
  },
];

// The four-phase strategy strip: a narrative overview that doubles as a filter.
// Clicking a phase selects exactly its categories.
type Phase = { label: string; blurb: string; categories: CategoryMeta["key"][] };
const PHASES: Phase[] = [
  { label: "1 · Discover", blurb: "Find & appraise the literature.", categories: ["literature"] },
  { label: "2 · Create", blurb: "Draft, reason, and build.", categories: ["writing", "engineering"] },
  { label: "3 · Visualize", blurb: "Turn results into figures.", categories: ["diagramming"] },
  { label: "4 · Present", blurb: "Ship decks, posters & pages.", categories: ["slides", "web"] },
];

// A repo shipping owner/repo-shaped origins links straight to GitHub; plugins
// and linked projects fall back to a member skill's own deep link.
function repoUrl(origin: string, skills: AgentSkillEntry[]): string {
  if (/^[\w.-]+\/[\w.-]+$/.test(origin)) return `https://github.com/${origin}`;
  return skills.find((s) => s.url)?.url ?? "";
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---- Install chip -----------------------------------------------------------
// Shows the actual repo-level command (so the method — `npx skills add …` vs
// `/plugin install …` — is self-evident) and copies it on click. The method
// prefix leads the string, so end-truncation never hides it.

function InstallChip({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Flex
      as="button"
      onClick={(e) => {
        e.stopPropagation();
        copyText(command).then((ok) => {
          if (!ok) return;
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      align="center"
      gap={1.5}
      maxW={{ base: "180px", sm: "300px" }}
      px={2}
      py={1}
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      bg="bg.subtle"
      color={copied ? "accent" : "fg.muted"}
      _hover={{ borderColor: "accent", color: "accent" }}
      title={`Copy: ${command}`}
      flexShrink={0}
    >
      <Icon as={copied ? FaCheck : FaRegCopy} boxSize={2.5} flexShrink={0} />
      <Text fontFamily="mono" fontSize="0.7em" fontWeight="500" noOfLines={1}>
        {copied ? "copied!" : command}
      </Text>
    </Flex>
  );
}

// ---- One skill row ----------------------------------------------------------

function SkillRow({ skill, indent, install }: { skill: AgentSkillEntry; indent?: boolean; install?: string }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(skill.description || skill.usage.length || skill.tags.length);

  return (
    <Box pl={indent ? 5 : 0} py={1.5} borderTopWidth={indent ? "1px" : 0} borderColor="border.muted">
      <Flex align="center" gap={2}>
        <Box
          as={hasDetail ? "button" : "div"}
          onClick={hasDetail ? () => setOpen((v) => !v) : undefined}
          flex="1"
          minW={0}
          textAlign="left"
          cursor={hasDetail ? "pointer" : "default"}
        >
          <Flex align="center" gap={1.5}>
            {hasDetail ? (
              <Icon as={open ? FaChevronDown : FaChevronRight} boxSize={2} color="fg.faint" flexShrink={0} />
            ) : null}
            <Text fontSize="sm" fontWeight="600" color="fg.default" noOfLines={1}>
              {skill.name}
            </Text>
          </Flex>
        </Box>
        {install ? <InstallChip command={install} /> : null}
        {skill.url ? (
          <Link href={skill.url} isExternal onClick={(e) => e.stopPropagation()} color="fg.faint" _hover={{ color: "accent" }}>
            <Icon as={FaExternalLinkAlt} boxSize={2.5} />
          </Link>
        ) : null}
      </Flex>

      <Collapse in={open} animateOpacity>
        <Box pl={hasDetail ? 3.5 : 0} pt={1.5} pb={1}>
          <Text fontSize="xs" color="fg.muted" whiteSpace="pre-wrap">
            {skill.description}
          </Text>
          {skill.usage.length > 0 ? (
            <Wrap spacing={1} mt={2}>
              {skill.usage.map((u) => (
                <WrapItem key={u}>
                  <Tag size="sm" bg="bg.subtle" color="fg.muted" fontFamily="mono" fontSize="0.65em" px={1.5} py={0}>
                    {u}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---- A repo sub-group within a category -------------------------------------
// Single-skill origins render as one plain row; multi-skill origins collapse
// under a repo header so a big toolkit (mattpocock: 39) never floods a section.

type RepoBlock = { origin: string; url: string; skills: AgentSkillEntry[] };

function groupByOrigin(skills: AgentSkillEntry[]): RepoBlock[] {
  const byOrigin = new Map<string, AgentSkillEntry[]>();
  for (const s of skills) {
    const key = s.origin.trim() || s.name;
    (byOrigin.get(key) ?? byOrigin.set(key, []).get(key)!).push(s);
  }
  const blocks: RepoBlock[] = [];
  for (const [origin, list] of byOrigin) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    blocks.push({ origin, url: repoUrl(origin, list), skills: list });
  }
  // Multi-skill repos first (they anchor the section), then singles A→Z.
  blocks.sort((a, b) => b.skills.length - a.skills.length || a.origin.localeCompare(b.origin));
  return blocks;
}

function RepoBlockView({ block, defaultOpen }: { block: RepoBlock; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  // All skills in a repo share one repo-level install command.
  const install = block.skills.find((s) => s.installCommand)?.installCommand ?? "";
  if (block.skills.length === 1) return <SkillRow skill={block.skills[0]} install={install} />;

  return (
    <Box>
      <Flex align="center" gap={1.5} py={1.5}>
        <Flex
          as="button"
          onClick={() => setOpen((v) => !v)}
          align="center"
          gap={1.5}
          flex="1"
          minW={0}
          textAlign="left"
          cursor="pointer"
          _hover={{ "& .repo-name": { color: "accent" } }}
        >
          <Icon as={open ? FaChevronDown : FaChevronRight} boxSize={2.5} color="fg.faint" flexShrink={0} />
          <Text className="repo-name" fontSize="sm" fontWeight="700" color="fg.default" fontFamily="mono" noOfLines={1}>
            {block.origin}
          </Text>
          <Text fontSize="xs" color="fg.faint" flexShrink={0}>
            {block.skills.length} skills
          </Text>
        </Flex>
        {install ? <InstallChip command={install} /> : null}
        {block.url ? (
          <Link href={block.url} isExternal color="fg.faint" _hover={{ color: "accent" }} flexShrink={0}>
            <Icon as={FaExternalLinkAlt} boxSize={2.5} />
          </Link>
        ) : null}
      </Flex>
      <Collapse in={open} animateOpacity>
        <Box>
          {block.skills.map((s) => (
            <SkillRow key={s.slug} skill={s} indent />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---- Page -------------------------------------------------------------------

export function SkillsClient({ skills }: { skills: AgentSkillEntry[] }) {
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [byRepo, setByRepo] = useState(false);

  function toggleCat(key: string) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectPhase(p: Phase) {
    setActiveCats((prev) => {
      const same = prev.size === p.categories.length && p.categories.every((c) => prev.has(c));
      return same ? new Set() : new Set<string>(p.categories);
    });
  }

  // Search + category filter, applied once; both views read from this.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter((s) => {
      if (activeCats.size > 0 && !activeCats.has(s.workflowCategory)) return false;
      if (!q) return true;
      return `${s.name} ${s.origin} ${s.description} ${s.usage.join(" ")}`.toLowerCase().includes(q);
    });
  }, [skills, search, activeCats]);

  const sections = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        blocks: groupByOrigin(filtered.filter((s) => s.workflowCategory === cat.key)),
      })).filter((sec) => sec.blocks.length > 0),
    [filtered],
  );

  const repoBlocks = useMemo(() => groupByOrigin(filtered), [filtered]);

  return (
    <Container maxW="5xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Skills
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Claude Code plugins, agent skills, and tooling installed and in active use — organized by where
        they fit in a research and engineering workflow. Each repo links to its source and shows its
        one-line install command (<Box as="span" fontFamily="mono" fontSize="0.85em" color="fg.default">npx skills add …</Box>{" "}
        or <Box as="span" fontFamily="mono" fontSize="0.85em" color="fg.default">/plugin install …</Box>) — click it to copy.
      </Text>

      {/* Workflow-phase strategy strip */}
      <Flex gap={2} mb={6} direction={{ base: "column", sm: "row" }}>
        {PHASES.map((p) => {
          const active = p.categories.every((c) => activeCats.has(c)) && activeCats.size === p.categories.length;
          return (
            <Box
              key={p.label}
              as="button"
              onClick={() => selectPhase(p)}
              flex="1"
              textAlign="left"
              borderWidth="1px"
              borderColor={active ? "accent" : "border.muted"}
              bg={active ? "bg.subtle" : "bg.card"}
              borderRadius="md"
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ borderColor: "accent" }}
            >
              <Text fontSize="xs" fontWeight="700" color={active ? "accent" : "fg.default"}>
                {p.label}
              </Text>
              <Text fontSize="0.7em" color="fg.muted" mt={0.5}>
                {p.blurb}
              </Text>
            </Box>
          );
        })}
      </Flex>

      {/* Search + view toggle */}
      <Flex gap={3} mb={3} align="center" wrap="wrap">
        <InputGroup maxW="sm" flex="1" minW="200px">
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
        <HStack spacing={0} borderWidth="1px" borderColor="border.muted" borderRadius="md" overflow="hidden">
          {[
            { key: false, label: "By workflow" },
            { key: true, label: "By repo" },
          ].map((v) => (
            <Box
              key={String(v.key)}
              as="button"
              onClick={() => setByRepo(v.key)}
              px={3}
              py={1.5}
              fontSize="xs"
              fontWeight="600"
              bg={byRepo === v.key ? "accent" : "bg.card"}
              color={byRepo === v.key ? "coal.900" : "fg.muted"}
              _hover={byRepo === v.key ? {} : { bg: "bg.subtle" }}
            >
              {v.label}
            </Box>
          ))}
        </HStack>
      </Flex>

      {/* Category filter chips */}
      <Wrap spacing={2} mb={8}>
        {CATEGORIES.map((c) => {
          const active = activeCats.has(c.key);
          return (
            <WrapItem key={c.key}>
              <Tag
                as="button"
                onClick={() => toggleCat(c.key)}
                size="md"
                cursor="pointer"
                bg={active ? "accent" : "bg.card"}
                color={active ? "coal.900" : "fg.muted"}
                borderWidth="1px"
                borderColor={active ? "accent" : "border.muted"}
                fontWeight={active ? "700" : "500"}
                _hover={{ borderColor: "accent" }}
              >
                <Icon as={c.icon} boxSize={3} mr={1.5} />
                {c.label}
              </Tag>
            </WrapItem>
          );
        })}
      </Wrap>

      {filtered.length === 0 ? (
        <Text color="fg.faint" fontSize="sm">
          No skills match the current filters.
        </Text>
      ) : byRepo ? (
        // ---- By-repo view: flat list of repo groups ----
        <VStack align="stretch" spacing={1} divider={<Box borderTopWidth="1px" borderColor="border.muted" />}>
          {repoBlocks.map((block) => (
            <RepoBlockView key={block.origin} block={block} defaultOpen={false} />
          ))}
        </VStack>
      ) : (
        // ---- By-workflow view: category sections ----
        <VStack align="stretch" spacing={10}>
          {sections.map(({ cat, blocks }) => (
            <Box key={cat.key}>
              <Flex align="center" gap={2} mb={1}>
                <Icon as={cat.icon} color="accent" boxSize={4} />
                <Heading size="sm" color="fg.default">
                  {cat.label}
                </Heading>
                <Text fontSize="xs" color="fg.faint">
                  {blocks.reduce((n, b) => n + b.skills.length, 0)}
                </Text>
              </Flex>
              <Text fontSize="xs" color="fg.muted" fontStyle="italic" mb={2}>
                {cat.goal}
              </Text>
              <VStack align="stretch" spacing={0} divider={<Box borderTopWidth="1px" borderColor="border.muted" />}>
                {blocks.map((block) => (
                  <RepoBlockView key={block.origin} block={block} defaultOpen={false} />
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}

      <HStack mt={12} spacing={1} color="fg.faint" fontSize="xs">
        <Icon as={FaCode} boxSize={3} />
        <Text>
          {skills.length} skills across {sections.length || CATEGORIES.length} workflow categories, generated from
          this machine's Claude Code setup.
        </Text>
      </HStack>
    </Container>
  );
}
