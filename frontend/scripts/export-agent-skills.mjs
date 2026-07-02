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

    for (const skillFile of walk(installPath, (n) => n === "SKILL.md")) {
      const fm = frontmatterOf(skillFile);
      out.push({
        name: fm.name ?? path.basename(path.dirname(skillFile)),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "skill",
      });
    }

    for (const cmdFile of walk(
      installPath,
      (n, full) => n.endsWith(".md") && path.basename(path.dirname(full)) === "commands",
    )) {
      const fm = frontmatterOf(cmdFile);
      out.push({
        name: fm.name ?? slugName(cmdFile),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "command",
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
    if (stat.isSymbolicLink()) {
      const resolved = fs.realpathSync(entryPath);
      if (resolved.startsWith(npxSkillsRoot)) {
        source = "npx-package";
        origin = lockSkills[entry.name]?.source ?? "";
      } else {
        source = "linked-project";
        origin = resolved;
      }
    }

    out.push({
      name: fm.name ?? entry.name,
      description: fm.description ?? "",
      source,
      origin,
      category: "skill",
    });
  }
  return out;
}

const fresh = [...collectPlugins(), ...collectUserSkills()].sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(fresh, null, 2)}\n`);
console.log(`Wrote ${fresh.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);
