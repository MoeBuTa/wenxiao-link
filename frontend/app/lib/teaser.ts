// Blog posts have no stored cover image. Instead the teaser (cover gradient +
// icon) is *derived from the post's tags*, so it's stable and free:
//   - a curated tag (see CURATED below) uses its pinned look;
//   - any other tag deterministically generates one from the post's primary
//     (first) tag — the same tag always yields the same cover.
// To pin a specific look for a tag, add a CURATED entry. To get a brand-new
// cover, just use a new primary tag. See frontend/docs/blog-authoring.md.
import type { IconType } from "react-icons";
import {
  FaBook,
  FaBrain,
  FaChartLine,
  FaCode,
  FaCube,
  FaDatabase,
  FaFlask,
  FaHighlighter,
  FaLightbulb,
  FaMapMarkedAlt,
  FaNetworkWired,
  FaPenNib,
  FaRobot,
  FaServer,
  FaTerminal,
} from "react-icons/fa";

export type Teaser = { gradient: string; Icon: IconType };

// Gradient palette in the site's orange→ocean→teal family. Uncurated tags get
// a stable pick from here (hashed), so a post's cover never shifts around.
const GRADIENTS = [
  "linear(135deg, #f97316, #ea580c)",
  "linear(135deg, #0ea5e9, #38bdf8)",
  "linear(135deg, #f97316, #38bdf8)",
  "linear(135deg, #14b8a6, #0ea5e9)",
  "linear(135deg, #ea580c, #9a3412)",
  "linear(135deg, #6366f1, #38bdf8)",
  "linear(135deg, #0ea5e9, #14b8a6)",
  "linear(135deg, #f59e0b, #f97316)",
];

const ICON_POOL: IconType[] = [
  FaPenNib,
  FaRobot,
  FaBrain,
  FaDatabase,
  FaCode,
  FaFlask,
  FaBook,
  FaLightbulb,
  FaNetworkWired,
  FaChartLine,
  FaCube,
];

// Curated tags → a pinned look. `match` strings are tested case-insensitively
// as substrings of the post's tags (so "peer-review" also matches a
// "peer-review-2026" tag). First curated row that matches any tag wins.
const CURATED: { match: string[]; teaser: Teaser }[] = [
  { match: ["reviewviz", "peer-review", "rebuttal"], teaser: { gradient: GRADIENTS[0], Icon: FaHighlighter } },
  { match: ["pentest", "cybersecurity", "security"], teaser: { gradient: GRADIENTS[4], Icon: FaTerminal } },
  { match: ["stindex", "spatiotemporal", "rag", "retrieval"], teaser: { gradient: GRADIENTS[1], Icon: FaMapMarkedAlt } },
  { match: ["self-hosting", "engineering", "meta", "infra"], teaser: { gradient: GRADIENTS[3], Icon: FaServer } },
  { match: ["llm", "agent", "agents"], teaser: { gradient: GRADIENTS[5], Icon: FaRobot } },
];

// FNV-1a — small, stable string hash (deterministic across server & client).
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function teaserForTags(tags: string[]): Teaser {
  const lower = tags.map((t) => t.toLowerCase());
  for (const { match, teaser } of CURATED) {
    if (lower.some((t) => match.some((m) => t.includes(m)))) return teaser;
  }
  const h = hash(lower[0] ?? "post");
  return {
    gradient: GRADIENTS[h % GRADIENTS.length],
    Icon: ICON_POOL[(h >>> 8) % ICON_POOL.length],
  };
}
