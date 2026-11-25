// node new.mjs carousel|story|reel|slide <folder> [client.md]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join, resolve } from "node:path";
import { SKILL, TOOLS, fail, has, profile } from "./lib.mjs";

const [kind, dirArg, client] = process.argv.slice(2);
const video = kind === "reel" || kind === "slide";
if (!["carousel", "story", "reel", "slide"].includes(kind) || !dirArg)
  fail("usage: node new.mjs carousel|story|reel|slide <folder> [client.md]");
if (client && !existsSync(client)) fail(`missing ${client}`);
const dir = resolve(dirArg);
if (existsSync(join(dir, "index.html"))) fail(`${dir} already has a page: choose a new folder`);
if (video && !has("gsap")) fail("The video tools are not installed. Run: node scripts/doctor.mjs");
const p = profile(client ? [resolve(client)] : []);
for (const k of ["color_background", "color_text", "color_accent", "color_dark"])
  if (!/^#[0-9a-f]{6}$/i.test(p[k])) fail(`${k} in the profile must look like #1E7A4C, found "${p[k]}"`);
for (const k of ["font_title", "font_body"])
  if (!/^[\p{L}\p{N} _-]+$/u.test(p[k])) fail(`${k} in the profile is not a font name: "${p[k]}"`);

const assets = join(dir, "assets");
mkdirSync(assets, { recursive: true });
for (const f of ["Inter.ttf", "Fraunces.ttf"]) copyFileSync(join(SKILL, "assets/fonts", f), join(assets, f));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const logo = (key) => {
  const f = p[key].replace(/^~(?=[\\/])/, homedir());
  if (!f) return `<span class="wordmark">${esc(p.brand)}</span>`;
  if (!existsSync(f)) fail(`${key} in the profile does not exist: ${f}`);
  const name = `${key}${extname(f)}`;
  copyFileSync(f, join(assets, name));
  return `<img class="logo" src="assets/${name}" alt="${esc(p.brand)}">`;
};
const values = {
  LANG: esc([p.languages].flat()[0]), BRAND: esc(p.brand), HANDLE: esc(p.handle),
  LOGO_LIGHT: logo("logo_light"), LOGO_DARK: logo("logo_dark"), FORMAT: kind,
  HEIGHT: kind === "reel" || kind === "story" ? 1920 : 1350, DURATION: kind === "reel" ? 20 : 6,
  BG: p.color_background, TEXT: p.color_text, ACCENT: p.color_accent, DARK: p.color_dark,
  TITLE: p.font_title, BODY: p.font_body,
};
const fill = (f) => readFileSync(f, "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => values[k] ?? m);
writeFileSync(join(dir, "index.html"), fill(join(SKILL, "assets", `${kind}.html`)));
writeFileSync(join(assets, "theme.css"), fill(join(SKILL, "assets", "theme.css")));
writeFileSync(join(dir, "job.json"), JSON.stringify({ kind, client: client ? resolve(client) : null }, null, 2));
if (video) {
  copyFileSync(join(TOOLS, "node_modules/gsap/dist/gsap.min.js"), join(assets, "gsap.min.js"));
  writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }, null, 2));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: kind, name: kind }, null, 2));
}
console.log(`ready: ${join(dir, "index.html")}`);
