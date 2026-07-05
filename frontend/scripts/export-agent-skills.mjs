#!/usr/bin/env node
// Local-only tool: scans this machine's Claude Code plugins and skills into
// a JSON array for `python manage.py sync_agent_skills --from-json <path>`
// to upsert into the DB. Never run in CI/Vercel — describes local machine
// state the build can't see.
// Usage: node frontend/scripts/export-agent-skills.mjs
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const AGENTS_DIR = path.join(HOME, ".agents");
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(SCRIPT_DIR, "..", "..", "backend", "scripts", ".agent-skills-scan.json");

// ---- Workflow-category seed -------------------------------------------------
// The /skills page groups skills by research/engineering workflow function
// (see AgentSkill.WORKFLOW_CATEGORY_CHOICES), adapted from
// JingbiaoMei/my-agent-skills. This seed places skills into those sections; the
// sync backfills it onto rows that have no category yet and never overwrites an
// admin-set one, so hand-tuning in the DB sticks. A skill in neither map gets
// no category and stays unpublished (the long tail — generic doc skills, plugin
// sub-commands — is hidden until curated).
//
// ORIGIN_CATEGORY covers single-purpose repos wholesale; NAME_CATEGORY overrides
// it per-skill for multi-purpose toolkit repos (softaworks, K-Dense, anthropics)
// whose skills span several functions.
const ORIGIN_CATEGORY = {
  "kthorn/research-superpower": "literature",
  "kerim/zotero-code-execution": "literature",
  "ComposioHQ/awesome-claude-skills": "literature",
  "weklica/Firecrawl-cli": "literature",
  "vercel-labs/skills": "literature",
  "SipengXie2024/Helios-Writing": "writing",
  "nextlevelbuilder/ui-ux-pro-max-skill": "web",
  "mattpocock/skills": "engineering",
  superpowers: "engineering",
  "academic-research-skills": "literature",
  "andrej-karpathy-skills": "engineering",
  "claude-hud": "engineering",
  "career-ops": "engineering",
};
const NAME_CATEGORY = {
  // K-Dense-AI/claude-scientific-skills (spans research, diagramming, slides)
  "scientific-critical-thinking": "literature",
  "scientific-brainstorming": "literature",
  "scientific-schematics": "diagramming",
  "latex-posters": "slides",
  // softaworks/agent-toolkit (spans diagramming, slides, writing, engineering)
  "draw-io": "diagramming",
  "mermaid-diagrams": "diagramming",
  "marp-slide": "slides",
  "writing-clearly-and-concisely": "writing",
  "agent-md-refactor": "writing",
  "session-handoff": "engineering",
  "dependency-updater": "engineering",
  // ZhanlinCui/Ultimate-Agent-Skills-Collection
  "obsidian-helper": "writing",
  "obsidian-bases": "writing",
  "vercel-deploy": "web",
  // anthropics/skills — publish the CV-relevant subset only
  "frontend-design": "web",
  "web-artifacts-builder": "web",
  "webapp-testing": "web",
  "canvas-design": "diagramming",
  "algorithmic-art": "diagramming",
  "doc-coauthoring": "writing",
  "mcp-builder": "engineering",
  "skill-creator": "engineering",
  "claude-api": "engineering",
  pptx: "slides",
  // ingpoc/SKILLS
  "tufte-slide-design": "slides",
  // nextlevelbuilder (origin → web; this one is really a slides skill)
  slides: "slides",
  // JingbiaoMei/work-canvas-skill
  "work-canvas": "diagramming",
  // mattpocock/skills — origin defaults to engineering; these are writing
  "edit-article": "writing",
  "writing-beats": "writing",
  "writing-fragments": "writing",
  "writing-great-skills": "writing",
  "writing-shape": "writing",
  "obsidian-vault": "writing",
};

// Only real skills carry a workflow category; commands/agents are rolled up or
// stay hidden. Match on the local folder name (kebab) and the frontmatter name.
function workflowCategoryOf({ name, folder, origin, category }) {
  if (category !== "skill") return "";
  const keys = [folder, name].filter(Boolean).map((s) => s.toLowerCase());
  for (const k of keys) if (NAME_CATEGORY[k]) return NAME_CATEGORY[k];
  return ORIGIN_CATEGORY[origin] ?? "";
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function walk(dir, matchFile) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, matchFile));
    else if (entry.isFile() && matchFile(entry.name, full)) results.push(full);
  }
  return results;
}

// Some third-party SKILL.md/command frontmatter has unquoted YAML that
// js-yaml rejects (an inline "word: text" in `description:` reads as a
// nested mapping key). Fall back to a best-effort line scrape so one
// malformed file doesn't abort the run.
function naiveFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const nameMatch = block.match(/^name:\s*(.+)$/m);
  const descMatch = block.match(/^description:\s*(.+)$/m);
  const clean = (s) => s?.trim().replace(/^["'>|]+\s*/, "").replace(/["']$/, "");
  return {
    name: nameMatch ? clean(nameMatch[1]) : undefined,
    description: descMatch ? clean(descMatch[1]) : "",
  };
}

function frontmatterOf(file) {
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return matter(raw).data;
  } catch {
    return naiveFrontmatter(raw);
  }
}

function slugName(file) {
  return path.basename(file, ".md");
}

// Some plugins ship a "set" of commands that are really just different modes
// of one underlying skill (e.g. academic-research-skills' ars-* commands
// each say `Skill entry: \`academic-paper/SKILL.md\`.`). Detect that
// convention so those commands can be rolled up into their parent skill's
// "usage" list downstream, instead of showing as 10 disconnected cards.
function parentSkillOf(body) {
  const match = body.match(/Skill entry:\s*`([^/`]+)\/SKILL\.md`/);
  return match ? match[1] : undefined;
}

// Plugin repo URL, best-effort: prefer the plugin's own manifest, fall back
// to the marketplace it was installed from (~/.claude/plugins/cache/<marketplace>/...
// maps to a `repo` entry in known_marketplaces.json) when the manifest itself
// doesn't list one (e.g. a plugin with no repository/homepage field).
// The marketplace a plugin was installed from is the first path segment under
// ~/.claude/plugins/cache/<marketplace>/... — it's both the key into
// known_marketplaces.json and the `@marketplace` half of the install command.
function marketplaceKeyOf(installPath) {
  const marker = `${path.sep}cache${path.sep}`;
  const idx = installPath.indexOf(marker);
  if (idx < 0) return "";
  return installPath.slice(idx + marker.length).split(path.sep)[0];
}

function marketplaceRepoUrl(installPath) {
  const marketplaces = readJsonSafe(path.join(CLAUDE_DIR, "plugins", "known_marketplaces.json")) ?? {};
  const repo = marketplaces[marketplaceKeyOf(installPath)]?.source?.repo;
  return repo ? `https://github.com/${repo}` : "";
}

function pluginUrl(installPath, manifest) {
  return manifest?.repository || manifest?.homepage || marketplaceRepoUrl(installPath);
}

function collectPlugins() {
  const installed = readJsonSafe(path.join(CLAUDE_DIR, "plugins", "installed_plugins.json"));
  const out = [];
  if (!installed?.plugins) return out;

  for (const [key, installs] of Object.entries(installed.plugins)) {
    const install = installs[0];
    if (!install) continue;
    const installPath = install.installPath;
    const manifest = readJsonSafe(path.join(installPath, ".claude-plugin", "plugin.json"));
    const pluginName = manifest?.name ?? key.split("@")[0];
    const url = pluginUrl(installPath, manifest);
    // Repo-level install shortcut: one `/plugin install name@marketplace` per
    // plugin (mirrors the repo-level `npx skills add` for npx packages).
    const marketplaceKey = marketplaceKeyOf(installPath);
    const installCommand = marketplaceKey ? `/plugin install ${pluginName}@${marketplaceKey}` : "";

    for (const skillFile of walk(installPath, (n) => n === "SKILL.md")) {
      const fm = frontmatterOf(skillFile);
      const folder = path.basename(path.dirname(skillFile));
      out.push({
        name: fm.name ?? folder,
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "skill",
        url,
        installCommand,
        workflowCategory: workflowCategoryOf({ name: fm.name, folder, origin: pluginName, category: "skill" }),
      });
    }

    for (const cmdFile of walk(
      installPath,
      (n, full) => n.endsWith(".md") && path.basename(path.dirname(full)) === "commands",
    )) {
      const fm = frontmatterOf(cmdFile);
      const raw = fs.readFileSync(cmdFile, "utf-8");
      out.push({
        name: fm.name ?? slugName(cmdFile),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "command",
        url,
        parentSkill: parentSkillOf(raw),
      });
    }

    for (const agentFile of walk(
      installPath,
      (n, full) => n.endsWith(".md") && path.basename(path.dirname(full)) === "agents",
    )) {
      const fm = frontmatterOf(agentFile);
      out.push({
        name: fm.name ?? slugName(agentFile),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "agent",
        url,
      });
    }
  }
  return out;
}

function collectUserSkills() {
  const skillsDir = path.join(CLAUDE_DIR, "skills");
  const lock = readJsonSafe(path.join(AGENTS_DIR, ".skill-lock.json"));
  const lockSkills = lock?.skills ?? {};
  const out = [];
  if (!fs.existsSync(skillsDir)) return out;

  const npxSkillsRoot = path.join(AGENTS_DIR, "skills");
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    const entryPath = path.join(skillsDir, entry.name);
    const stat = fs.lstatSync(entryPath);
    const skillMd = path.join(entryPath, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const fm = frontmatterOf(skillMd);

    let source = "self-authored";
    let origin = "";
    let url = "";
    if (stat.isSymbolicLink()) {
      const resolved = fs.realpathSync(entryPath);
      if (resolved.startsWith(npxSkillsRoot)) {
        source = "npx-package";
        const lockEntry = lockSkills[entry.name];
        origin = lockEntry?.source ?? "";
        // Deep-link to the skill's own file in its source repo, e.g.
        // https://github.com/mattpocock/skills/blob/main/skills/.../SKILL.md
        // Best-effort: assumes the repo's default branch is "main".
        if (lockEntry?.sourceUrl && lockEntry?.skillPath) {
          const repoUrl = lockEntry.sourceUrl.replace(/\.git$/, "");
          url = `${repoUrl}/blob/main/${lockEntry.skillPath}`;
        }
      } else {
        source = "linked-project";
        // Use the project directory name, not the full local filesystem
        // path — a raw absolute path is ugly on a public page and leaks
        // local directory structure. Project root is whatever precedes
        // "/.claude/skills/..." in the resolved symlink target.
        const marker = "/.claude/skills/";
        const idx = resolved.indexOf(marker);
        origin = idx >= 0 ? path.basename(resolved.slice(0, idx)) : path.basename(resolved);
      }
    }

    out.push({
      name: fm.name ?? entry.name,
      description: fm.description ?? "",
      source,
      origin,
      category: "skill",
      url,
      folder: entry.name,
      workflowCategory: workflowCategoryOf({ name: fm.name, folder: entry.name, origin, category: "skill" }),
    });
  }

  // Repo-level install shortcut: one `npx skills add <repo>` per source repo
  // (not per fine-grained skill), so a card for a 39-skill toolkit like
  // mattpocock/skills shows a single high-level command.
  for (const e of out) {
    if (e.source === "npx-package" && e.origin) e.installCommand = `npx skills add ${e.origin}`;
    delete e.folder;
  }
  return out;
}

const fresh = [...collectPlugins(), ...collectUserSkills()].sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(fresh, null, 2)}\n`);
console.log(`Wrote ${fresh.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);
