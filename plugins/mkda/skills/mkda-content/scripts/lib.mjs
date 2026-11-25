import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const HOME = process.env.MKDA_HOME || join(homedir(), "MKDA");
export const TOOLS = join(HOME, ".tools", "node");
// its own folder: installing must not clean up browsers other programs use
process.env.PLAYWRIGHT_BROWSERS_PATH = join(HOME, ".tools", "browsers");
export const SKILL = join(import.meta.dirname, "..");
export const VERSIONS = { "playwright-core": "1.65.1", gsap: "3.15.0", hyperframes: "0.8.230" };
export const DEFAULTS = {
  brand: "", handle: "", website: "", languages: ["en"], banned: [],
  color_background: "#F6F4F0", color_text: "#17181C", color_accent: "#2F5BD8", color_dark: "#14161D",
  font_title: "Fraunces", font_body: "Inter", logo_light: "", logo_dark: "",
};

// shortcut: one-line keys only, enough while learning.md keeps that rule
export function frontmatter(text) {
  const out = {};
  const head = text.match(/^﻿?---\s*\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  for (const row of head.split(/\r?\n/)) {
    const m = row.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const v = m[2].trim();
    const clean = (s) => s.trim().replace(/^["']|["']$/g, "");
    out[m[1]] = /^\[.*\]$/.test(v)
      ? [...v.slice(1, -1).matchAll(/\s*(?:"[^"]*"|'[^']*'|[^,]+)/g)].map((x) => clean(x[0])).filter(Boolean)
      : clean(v);
  }
  return out;
}

// later files win, banned words add up: profile, then this skill's rules, then the client
export function profile(extra = []) {
  const files = [join(HOME, "profile.md"), join(HOME, "rules", "content.md"), ...extra];
  const p = { ...DEFAULTS };
  const banned = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const x = frontmatter(readFileSync(f, "utf8"));
    banned.push(...[x.banned ?? []].flat());
    for (const [k, v] of Object.entries(x)) if (v !== "" && v.length !== 0) p[k] = v;
  }
  p.banned = banned;
  return p;
}

export function bannedIn(text, words) {
  return words.filter((w) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu").test(text),
  );
}

export const has = (pkg) => existsSync(join(TOOLS, "node_modules", pkg, "package.json"));

export function fail(message) {
  console.error(message);
  process.exit(1);
}

export async function browser() {
  if (!has("playwright-core")) fail("The drawing tools are not installed. Run: node scripts/doctor.mjs");
  const { chromium } = createRequire(join(TOOLS, "package.json"))("playwright-core");
  try {
    return await chromium.launch({
      executablePath: process.env.MKDA_CHROME || undefined,
      args: ["--allow-file-access-from-files"],
    });
  } catch (e) {
    return fail(`The browser did not start. Run: node scripts/doctor.mjs\n${String(e.message).split("\n")[0]}`);
  }
}

export const url = (path) => pathToFileURL(path).href;
