"use client";

import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  Link,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  FaCode,
  FaComments,
  FaGithub,
  FaHighlighter,
  FaMapMarkedAlt,
  FaProjectDiagram,
  FaRobot,
  FaShieldAlt,
  FaStar,
  FaSubway,
  FaTerminal,
  FaUserSecret,
} from "react-icons/fa";

import type { Project } from "../lib/types";
import { PaginatedGrid } from "./PaginatedGrid";

// SVG cover icon chosen per project — name first, then a tag keyword.
function iconForProject(p: Project): IconType {
  const byName: Record<string, IconType> = {
    Docs2KG: FaProjectDiagram,
    "OpenOmni Framework": FaComments,
    STIndex: FaMapMarkedAlt,
    CARE: FaShieldAlt,
    Reviewviz: FaHighlighter,
    LLMEyesim: FaRobot,
    SlimeMould: FaSubway,
    MTDSimTime: FaUserSecret,
    PentestAssist: FaTerminal,
  };
  if (byName[p.name]) return byName[p.name];

  const tags = p.tags.map((t) => t.toLowerCase());
  const has = (k: string) => tags.some((t) => t.includes(k));
  if (has("knowledge-graph")) return FaProjectDiagram;
  if (has("multimodal") || has("conversational")) return FaComments;
  if (has("spatiotemporal")) return FaMapMarkedAlt;
  if (has("safety") || has("security") || has("defense")) return FaShieldAlt;
  if (has("robot") || has("embodied")) return FaRobot;
  if (has("claude-code") || has("rebuttal")) return FaHighlighter;
  return FaCode;
}

// A few on-palette gradients so cards read like distinct cover art.
const COVERS = [
  "linear(135deg, #f97316, #ea580c)",
  "linear(135deg, #0ea5e9, #38bdf8)",
  "linear(135deg, #f97316, #38bdf8)",
  "linear(135deg, #14b8a6, #0ea5e9)",
  "linear(135deg, #ea580c, #9a3412)",
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const CoverIcon = iconForProject(project);
  return (
    <Link href={project.repoUrl} isExternal _hover={{ textDecoration: "none" }}>
      <Box
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
        bg="bg.card"
        overflow="hidden"
        h="full"
        _hover={{ borderColor: "accent", boxShadow: "0 0 0 1px rgba(249,115,22,0.25)" }}
        transition="all 0.15s ease"
      >
        <Flex h="84px" align="center" justify="center" bgGradient={COVERS[index % COVERS.length]}>
          <Icon as={CoverIcon} boxSize={9} color="whiteAlpha.900" />
        </Flex>
        <VStack align="stretch" spacing={2} p={4}>
          <Flex align="center" gap={2}>
            <Icon as={FaGithub} color="fg.faint" boxSize={3.5} />
            <Text fontWeight="700" color="fg.default" noOfLines={1}>
              {project.name}
            </Text>
            {typeof project.stars === "number" && project.stars > 0 ? (
              <HStack spacing={1} ml="auto" color="fg.faint" fontSize="sm" flexShrink={0}>
                <FaStar />
                <Text>{project.stars}</Text>
              </HStack>
            ) : null}
          </Flex>
          <Text fontSize="sm" color="fg.muted" noOfLines={2}>
            {project.description}
          </Text>
          <Wrap spacing={1.5}>
            {project.tags.slice(0, 3).map((tag) => (
              <WrapItem key={tag}>
                <Tag size="sm" bg="rgba(56,189,248,0.1)" color="ocean" fontSize="0.7em">
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      </Box>
    </Link>
  );
}

export function ProjectsClient({ projects }: { projects: Project[] }) {
  // Most-starred first; unstarred (null/0) fall to the end.
  const sorted = [...projects].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));

  return (
    <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Projects
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={8}>
        Open-source research systems and engineering projects — more on{" "}
        <Link href="https://github.com/MoeBuTa" isExternal>
          GitHub
        </Link>
        .
      </Text>
      <PaginatedGrid
        items={sorted}
        renderItem={(p, i) => <ProjectCard key={p.name} project={p} index={i} />}
      />
    </Container>
  );
}
