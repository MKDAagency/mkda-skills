// node scripts/release.mjs sync    copies shared/learning.md into each skill
// node scripts/release.mjs check   public-safety and structure checks (exit 1)
// node scripts/release.mjs zip     check, then dist/<skill>.zip
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SKILLS = join(ROOT, "plugins/mkda/skills");
const skills = readdirSync(SKILLS).filter((n) => n.startsWith("mkda-"));
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
const cmd = process.argv[2];
const shared = join(ROOT, "shared/learning.md");
const copy = (s) => join(SKILLS, s, "references/learning.md");
if (!["sync", "check", "zip"].includes(cmd)) {
  console.error("usage: release.mjs sync|check|zip");
  process.exit(2);
}
if (cmd === "sync") for (const s of skills) copyFileSync(shared, copy(s));

const bad = [];
const FORBIDDEN = [
  [/\/Users\/[a-z]/i, "personal path"], [/second brain|obsidian/i, "private vault"], [/supabase/i, "private backend"],
  [/\bmatteo\b|kiramarios/i, "personal name"], [/@mkda_agency|mkda-platform|lovable/i, "private project"],
  [/[\w.+-]+@(?!example\.com)[\w-]+\.[a-z]{2,}/i, "email"], [/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/, "IBAN"], [/\+\d{2}[ \d]{9,}/, "phone"],
  [/\b(ghp_|gho_|github_pat_|sk-[a-z0-9-]{16}|AKIA[0-9A-Z]{12}|eyJ[A-Za-z0-9_-]{20})/, "secret"],
  [/remotion/i, "excluded dependency"],
];
// client names stay out of this public repo: one per line in a local, ignored file
const names = process.env.MKDA_PRIVATE_NAMES ?? join(ROOT, ".private-names");
const local = existsSync(names) ? readFileSync(names, "utf8").split("\n").map((x) => x.trim()).filter(Boolean) : null;
if (!local) {
  console.log("note: no private names list, client names were not checked");
  if (cmd === "zip") bad.push("the private names list is required to make a release");
}
const ALLOWED = /^(\.git(ignore|attributes)|README(\.it)?\.md|LICENSE|NOTICE|CHANGELOG\.md|\.claude-plugin\/marketplace\.json|\.github\/workflows\/check\.yml|shared\/learning\.md|scripts\/(release|test)\.mjs|plugins\/mkda\/\.claude-plugin\/plugin\.json|plugins\/mkda\/skills\/mkda-[a-z]+\/(SKILL\.md|(references|scripts|assets)\/[\w./-]+))$/;
for (const f of git("ls-files", "-co", "--exclude-standard").trim().split("\n")) {
  if (!existsSync(join(ROOT, f))) continue;
  if (!ALLOWED.test(f)) bad.push(`${f}: not in the allowed list`);
  if (lstatSync(join(ROOT, f)).isSymbolicLink()) bad.push(`${f}: symlink`);
  if (/\.ttf$/.test(f) || f === "LICENSE" || f === "scripts/release.mjs") continue;
  const text = readFileSync(join(ROOT, f), "utf8");
  const body = f.endsWith("fonts.json") ? "" : text;
  if (body.includes("\0")) bad.push(`${f}: binary file`);
  for (const [re, what] of FORBIDDEN) {
    if (/OFL-/.test(f)) continue;
    const m = body.match(re);
    if (m) bad.push(`${f}: ${what}: ${m[0]}`);
  }
  for (const n of local ?? []) if (new RegExp(`(?<!\\p{L})${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\p{L})`, "iu").test(body)) bad.push(`${f}: private name`);
}
const plugin = JSON.parse(readFileSync(join(ROOT, "plugins/mkda/.claude-plugin/plugin.json"), "utf8"));
if (!readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").includes(`## ${plugin.version}`)) bad.push(`CHANGELOG has no ${plugin.version}`);
for (const s of skills) {
  const md = readFileSync(join(SKILLS, s, "SKILL.md"), "utf8");
  const d = md.match(/^description: (.*)$/m)?.[1] ?? "";
  if (md.match(/^name: (.*)$/m)?.[1] !== s) bad.push(`${s}: name differs from folder`);
  if (!d || d.length > 200) bad.push(`${s}: description is ${d.length} characters, 1-200`);
  if (!existsSync(copy(s)) || readFileSync(copy(s), "utf8") !== readFileSync(shared, "utf8")) bad.push(`${s}: learning.md differs, run sync`);
  for (const [, l] of md.matchAll(/\]\(((?:references|scripts|assets)\/[^)]+)\)/g)) if (!existsSync(join(SKILLS, s, l))) bad.push(`${s}: broken link ${l}`);
  for (const [, l] of md.matchAll(/\b(scripts\/\w+\.(?:py|mjs))/g)) if (!existsSync(join(SKILLS, s, l))) bad.push(`${s}: missing ${l}`);
}
if (bad.length) {
  console.error("TO FIX:\n - " + bad.join("\n - "));
  process.exit(1);
}
console.log("checks ok");
if (cmd === "zip") {
  if (git("status", "--porcelain").trim()) {
    console.error("commit first: a release is made from a clean tree");
    process.exit(1);
  }
  rmSync(join(ROOT, "dist"), { recursive: true, force: true });
  mkdirSync(join(ROOT, "dist"));
  for (const s of skills) {
    execFileSync("git", ["archive", "--format=zip", `--prefix=${s}/`, "-o", join(ROOT, "dist", `${s}.zip`), `HEAD:plugins/mkda/skills/${s}`], { cwd: ROOT });
    console.log(`dist/${s}.zip`);
  }
}
