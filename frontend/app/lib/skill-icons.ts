import type { IconType } from "react-icons";
import {
  FaAws,
  FaCode,
  FaDatabase,
  FaFlask,
  FaInfinity,
  FaMicrosoft,
  FaNetworkWired,
  FaPlug,
  FaProjectDiagram,
  FaRobot,
  FaSearch,
  FaToolbox,
} from "react-icons/fa";
import {
  SiDjango,
  SiDocker,
  SiGit,
  SiNextdotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiTypescript,
} from "react-icons/si";

// Lowercase-substring keyword -> icon. First match wins, so order matters where
// substrings overlap (e.g. "postgres" before "sql"). Brand logos (Simple Icons)
// where they exist, else a representative Font Awesome glyph; unmatched skills
// fall back to a generic code icon so newly-added entries still render.
const RULES: [string, IconType][] = [
  ["python", SiPython],
  ["typescript", SiTypescript],
  ["postgres", SiPostgresql],
  ["neo4j", FaProjectDiagram],
  ["cypher", FaDatabase],
  ["sql", FaDatabase],
  ["react", SiReact],
  ["next", SiNextdotjs],
  ["django", SiDjango],
  ["docker", SiDocker],
  ["git", SiGit],
  ["aws", FaAws],
  ["azure", FaMicrosoft],
  ["langgraph", FaProjectDiagram],
  ["langchain", FaRobot],
  ["vllm", FaRobot],
  ["llm", FaRobot],
  ["mcp", FaPlug],
  ["rag", FaSearch],
  ["retrieval", FaSearch],
  ["harness", FaToolbox],
  ["rest", FaNetworkWired],
  ["microservice", FaNetworkWired],
  ["ci/cd", FaInfinity],
  ["tdd", FaFlask],
];

export function skillIcon(name: string): IconType {
  const n = name.toLowerCase();
  for (const [kw, icon] of RULES) {
    if (n.includes(kw)) return icon;
  }
  return FaCode;
}
