// node build.mjs <folder>   draws each slide to export/NN.jpg, makes sheet.jpg, reports problems (exit 1)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { bannedIn, browser, fail, profile, url } from "./lib.mjs";
import { worstContrast } from "./contrast.mjs";

const FORMATS = {
  carousel: { h: 1350, top: 88, bottom: 88, min: 6, max: 10, small: 28 },
  story: { h: 1920, top: 250, bottom: 340, min: 5, max: 6, small: 36 },
};

const dir = resolve(process.argv[2] ?? ".");
const html = join(dir, "index.html");
if (!existsSync(html)) fail(`missing ${html}: node new.mjs carousel|story <folder>`);
const job = existsSync(join(dir, "job.json")) ? JSON.parse(readFileSync(join(dir, "job.json"), "utf8")) : {};
const prof = profile(job.client ? [job.client] : []);
const out = join(dir, "export");
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/^\d\d\.jpg$/.test(f)) rmSync(join(out, f));

const b = await browser();
const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(url(html), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready.then(() => 1));
const name = await page.evaluate(() => document.body.dataset.format);
const F = FORMATS[name];
if (!F) fail('set <body data-format="carousel"> or "story"');
const slides = await page.$$(".slide");
const bad = [];
if (slides.length < F.min || slides.length > F.max) bad.push(`SLIDE COUNT: ${slides.length}, expected ${F.min}-${F.max}`);
const jpgs = [];

for (const [i, s] of slides.entries()) {
  const n = i + 1;
  const jpg = await s.screenshot({ type: "jpeg", quality: 92 });
  writeFileSync(join(out, `${String(n).padStart(2, "0")}.jpg`), jpg);
  jpgs.push(jpg);
  const { problems, texts, words } = await s.evaluate((slide, F) => {
    const problems = [];
    const S = slide.getBoundingClientRect();
    if (Math.round(S.width) !== 1080 || Math.round(S.height) !== F.h) problems.push(`SIZE: ${S.width}x${S.height}`);
    for (const m of slide.querySelectorAll("img")) if (!m.naturalWidth) problems.push(`MISSING IMAGE: ${m.getAttribute("src")}`);
    const blocks = [...slide.querySelectorAll("*")].filter(
      (e) =>
        !e.closest("svg") &&
        getComputedStyle(e).visibility !== "hidden" &&
        [...e.childNodes].some((c) => c.nodeType === 3 && c.data.trim()) &&
        getComputedStyle(e).display !== "inline",
    );
    const texts = blocks.map((e, k) => {
      const g = document.createRange();
      g.selectNodeContents(e);
      const r = g.getBoundingClientRect();
      const cs = getComputedStyle(e);
      e.dataset.t = k;
      const t = e.textContent.trim().replace(/\s+/g, " ");
      const x = { k, t: t.slice(0, 40), l: r.left - S.left, r: r.right - S.left, top: r.top - S.top, b: r.bottom - S.top, size: parseFloat(cs.fontSize), weight: +cs.fontWeight, color: cs.color, over: !!e.closest("[data-over]") };
      if (x.l < 0 || x.r > 1080 || x.top < 0 || x.b > F.h || e.scrollWidth > e.clientWidth + 2) problems.push(`TEXT CUT: "${x.t}"`);
      else if (x.top < F.top - 1 || x.b > F.h - F.bottom + 1) problems.push(`OUT OF SAFE AREA: "${x.t}"`);
      if (x.size < F.small) problems.push(`SMALL TEXT: "${x.t}" ${x.size}px, at least ${F.small}`);
      if (/^H[12]$/.test(e.tagName)) {
        const lines = new Set([...g.getClientRects()].map((q) => Math.round(q.bottom / 8))).size;
        if (lines > (e.tagName === "H1" ? 3 : 2)) problems.push(`LONG TITLE: "${x.t}" ${lines} lines`);
      }
      return x;
    });
    for (let a = 0; a < texts.length; a++)
      for (let c = a + 1; c < texts.length; c++) {
        const [p, q] = [texts[a], texts[c]];
        if (p.over || q.over || blocks[a].contains(blocks[c]) || blocks[c].contains(blocks[a])) continue;
        if (Math.min(p.r, q.r) - Math.max(p.l, q.l) > 3 && Math.min(p.b, q.b) - Math.max(p.top, q.top) > 3)
          problems.push(`OVERLAP: "${p.t}" and "${q.t}"`);
      }
    for (const m of slide.querySelectorAll("img:not(.bg):not([data-over])")) {
      const r = m.getBoundingClientRect();
      for (const p of texts)
        if (!p.over && Math.min(p.r, r.right - S.left) - Math.max(p.l, r.left - S.left) > 3 && Math.min(p.b, r.bottom - S.top) - Math.max(p.top, r.top - S.top) > 3)
          problems.push(`OVERLAP: "${p.t}" and image ${m.getAttribute("src")}`);
    }
    return { problems, texts, words: slide.innerText };
  }, F);
  bad.push(...problems.map((x) => `slide ${n}: ${x}`));
  bad.push(...bannedIn(words, ["—", ...prof.banned]).map((w) => `slide ${n}: BANNED: ${w}`));
  if (/\[[A-Z][A-Z0-9 ,.'-]{3,}/.test(words)) bad.push(`slide ${n}: PLACEHOLDER`);
  if (name === "story" && words.trim().split(/\s+/).length > 20) bad.push(`slide ${n}: more than 20 words`);
  for (const x of texts) {
    await s.evaluate((el, k) => (el.querySelector(`[data-t="${k}"]`).style.visibility = "hidden"), x.k);
    const box = await s.boundingBox();
    const clip = { x: Math.max(0, x.l), y: box.y + Math.max(0, x.top), width: Math.min(1080, x.r) - Math.max(0, x.l), height: Math.min(F.h, x.b) - Math.max(0, x.top) };
    if (clip.width > 4 && clip.height > 4) {
      const scroll = await page.evaluate(() => scrollY);
      const png = await page.screenshot({ clip: { ...clip, y: clip.y + scroll }, fullPage: true });
      const need = x.size >= 32 || (x.size >= 24 && x.weight >= 700) ? 3 : 4.5;
      const c = await worstContrast(page, png, x.color);
      if (c < need) bad.push(`slide ${n}: LOW CONTRAST: "${x.t}" ${c.toFixed(1)}:1, at least ${need}`);
    }
    await s.evaluate((el, k) => (el.querySelector(`[data-t="${k}"]`).style.visibility = ""), x.k);
  }
}
const w = 360;
await page.setViewportSize({ width: (w + 12) * 4 + 12, height: 100 });
await page.setContent(
  `<body style="margin:12px;display:grid;grid-template-columns:repeat(4,${w}px);gap:12px;background:#888">${jpgs
    .map((j) => `<img style="width:${w}px" src="data:image/jpeg;base64,${j.toString("base64")}">`)
    .join("")}</body>`,
);
await page.waitForFunction(() => [...document.images].every((m) => m.complete));
await page.screenshot({ path: join(dir, "sheet.jpg"), fullPage: true, type: "jpeg", quality: 85 });
await b.close();
console.log(`${slides.length} slides -> ${out}\nlook at: ${join(dir, "sheet.jpg")}`);
console.log(bad.length ? "TO FIX:\n - " + bad.join("\n - ") : "CHECKS OK");
process.exit(bad.length ? 1 : 0);
