import type { IconType } from "react-icons";
import {
  FaBrain,
  FaBug,
  FaChartLine,
  FaClipboardCheck,
  FaCloud,
  FaCloudUploadAlt,
  FaCode,
  FaCodeBranch,
  FaCommentDots,
  FaCube,
  FaCubes,
  FaDatabase,
  FaExchangeAlt,
  FaFileAlt,
  FaFlask,
  FaGlobe,
  FaInfinity,
  FaLanguage,
  FaLayerGroup,
  FaLink,
  FaLock,
  FaMemory,
  FaMobileAlt,
  FaNetworkWired,
  FaPlug,
  FaProjectDiagram,
  FaPuzzlePiece,
  FaRobot,
  FaSearch,
  FaServer,
  FaSitemap,
  FaSlidersH,
  FaSync,
  FaTable,
  FaTerminal,
  FaToolbox,
  FaTools,
  FaTrophy,
  FaUsersCog,
  FaVectorSquare,
} from "react-icons/fa";
import {
  SiAmazonaws,
  SiCss3,
  SiDjango,
  SiDocker,
  SiFastapi,
  SiFlask,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGnubash,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiMicrosoftazure,
  SiNeo4J,
  SiNextdotjs,
  SiPostgresql,
  SiPython,
  SiPytorch,
  SiReact,
  SiTailwindcss,
  SiTypescript,
  SiYaml,
} from "react-icons/si";

// Lowercase-substring keyword -> [icon, colour]. First match wins, so order
// matters where substrings overlap (e.g. "postgres" before "sql", "fastapi"
// before "api", "github" before "git"). Colours are official brand hex where a
// logo exists, otherwise a representative hue per domain. A few brands whose
// logos are pure black/white ("accent") fall back to the site accent so they
// stay visible in both colour modes. Unmatched skills get a neutral code icon.
const RULES: [string, IconType, string][] = [
  // — Machine learning & deep learning —
  ["pytorch", SiPytorch, "#EE4C2C"],
  ["hugging", FaRobot, "#FFD21E"],
  ["transformers", FaLayerGroup, "#6366F1"],
  ["rlhf", FaBrain, "#F43F5E"],
  ["grpo", FaBrain, "#F43F5E"],
  ["reinforcement", FaBrain, "#F43F5E"],
  ["reward", FaTrophy, "#F59E0B"],
  ["lora", FaSlidersH, "#A855F7"],
  ["peft", FaSlidersH, "#A855F7"],
  ["fine-tun", FaSlidersH, "#A855F7"],
  ["embedding", FaVectorSquare, "#8B5CF6"],
  ["model evaluation", FaClipboardCheck, "#0EA5E9"],
  ["nlp", FaLanguage, "#10B981"],
  ["deep learning", FaBrain, "#F43F5E"],
  ["neural", FaProjectDiagram, "#F43F5E"],

  // — AI, LLM & agent systems —
  ["graphrag", FaProjectDiagram, "#6366F1"],
  ["agentic rag", FaSearch, "#14B8A6"],
  ["rag", FaSearch, "#14B8A6"],
  ["retrieval", FaSearch, "#14B8A6"],
  ["langchain", FaLink, "#1C9C7C"],
  ["langgraph", FaProjectDiagram, "#FF6F61"],
  ["mcp", FaPlug, "#D97757"],
  ["function calling", FaCode, "#3B82F6"],
  ["tool use", FaTools, "#F59E0B"],
  ["multi-agent", FaUsersCog, "#8B5CF6"],
  ["llm agents", FaRobot, "#6366F1"],
  ["llm skills", FaPuzzlePiece, "#22C55E"],
  ["skill", FaPuzzlePiece, "#22C55E"],
  ["prompt", FaCommentDots, "#EC4899"],
  ["context engineering", FaLayerGroup, "#6366F1"],
  ["memory", FaMemory, "#0EA5E9"],
  ["planning", FaSitemap, "#6366F1"],
  ["workflow", FaProjectDiagram, "#6366F1"],
  ["orchestration", FaProjectDiagram, "#6366F1"],
  ["openclaw", FaRobot, "#D97757"],
  ["harness", FaToolbox, "#F59E0B"],
  ["loop", FaInfinity, "#6366F1"],
  ["llm", FaRobot, "#6366F1"],

  // — Programming languages —
  ["python", SiPython, "#3776AB"],
  ["typescript", SiTypescript, "#3178C6"],
  ["javascript", SiJavascript, "#F7DF1E"],
  ["bash", SiGnubash, "#4EAA25"],
  ["yaml", SiYaml, "#CB171E"],
  ["json", SiJson, "#F59E0B"],
  ["tailwind", SiTailwindcss, "#06B6D4"],
  ["html", SiHtml5, "#E34F26"],
  ["css", SiCss3, "#1572B6"],

  // — Databases & knowledge graphs —
  ["neo4j", SiNeo4J, "#4581C3"],
  ["postgres", SiPostgresql, "#4169E1"],
  ["pgvector", FaVectorSquare, "#4169E1"],
  ["vector database", FaVectorSquare, "#8B5CF6"],
  ["faiss", FaVectorSquare, "#4267B2"],
  ["pinecone", FaVectorSquare, "#22C55E"],
  ["chroma", FaVectorSquare, "#FF6B6B"],
  ["knowledge graph", FaProjectDiagram, "#0EA5E9"],
  ["graph database", FaProjectDiagram, "#0EA5E9"],
  ["graph", FaProjectDiagram, "#0EA5E9"],
  ["relational", FaTable, "#3B82F6"],
  ["data model", FaSitemap, "#0EA5E9"],
  ["query", FaDatabase, "#3B82F6"],
  ["cypher", FaDatabase, "#008CC1"],
  ["sql", FaDatabase, "#00618A"],
  ["vector", FaVectorSquare, "#8B5CF6"],

  // — Backend & API —
  ["django", SiDjango, "#44B78B"],
  ["fastapi", SiFastapi, "#009688"],
  ["flask", SiFlask, "accent"],
  ["rest", FaNetworkWired, "#10B981"],
  ["microservice", FaCubes, "#10B981"],
  ["api integration", FaExchangeAlt, "#10B981"],
  ["api", FaPlug, "#10B981"],
  ["backend", FaServer, "#10B981"],
  ["server-side", FaServer, "#10B981"],
  ["web service", FaGlobe, "#10B981"],
  ["authentication", FaLock, "#F59E0B"],
  ["auth", FaLock, "#F59E0B"],

  // — Frontend —
  ["react", SiReact, "#61DAFB"],
  ["next", SiNextdotjs, "accent"],
  ["ui component", FaCube, "#06B6D4"],
  ["responsive", FaMobileAlt, "#06B6D4"],
  ["frontend", FaCode, "#06B6D4"],

  // — Cloud, MLOps & DevOps —
  ["docker", SiDocker, "#2496ED"],
  ["azure", SiMicrosoftazure, "#0078D4"],
  ["aws", SiAmazonaws, "#FF9900"],
  ["github actions", SiGithubactions, "#2088FF"],
  ["ci/cd", FaInfinity, "#0284C7"],
  ["containeri", FaCubes, "#2496ED"],
  ["deployment", FaCloudUploadAlt, "#0284C7"],
  ["deploy", FaCloudUploadAlt, "#0284C7"],
  ["model serving", FaServer, "#0284C7"],
  ["serving", FaServer, "#0284C7"],
  ["experiment tracking", FaChartLine, "#0284C7"],
  ["ml pipeline", FaProjectDiagram, "#0284C7"],
  ["pipeline", FaProjectDiagram, "#0284C7"],
  ["cloud infrastructure", FaCloud, "#0284C7"],
  ["cloud", FaCloud, "#0284C7"],

  // — Software engineering & dev tools —
  ["tdd", FaFlask, "#7C3AED"],
  ["claude code", FaRobot, "#D97757"],
  ["codex", FaTerminal, "#10A37F"],
  ["github", SiGithub, "accent"],
  ["git", SiGit, "#F05032"],
  ["debugging", FaBug, "#EF4444"],
  ["unit test", FaFlask, "#7C3AED"],
  ["test automation", FaFlask, "#7C3AED"],
  ["testing", FaFlask, "#7C3AED"],
  ["test", FaFlask, "#7C3AED"],
  ["code review", FaClipboardCheck, "#7C3AED"],
  ["agile", FaSync, "#7C3AED"],
  ["documentation", FaFileAlt, "#64748B"],
  ["version control", FaCodeBranch, "#F05032"],
  ["server", FaServer, "#10B981"],
];

function match(name: string): [IconType, string] | null {
  const n = name.toLowerCase();
  for (const [kw, icon, color] of RULES) {
    if (n.includes(kw)) return [icon, color];
  }
  return null;
}

export function skillIcon(name: string): IconType {
  return match(name)?.[0] ?? FaCode;
}

// Brand/domain colour for a skill. Returns either a hex string or the "accent"
// theme token (for pure black/white brand logos), or "accent" as the default.
export function skillColor(name: string): string {
  return match(name)?.[1] ?? "accent";
}
