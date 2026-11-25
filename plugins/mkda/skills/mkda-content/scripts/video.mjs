// node video.mjs check <folder>                 reading time, safe area, overlaps, contrast, still ending
// node video.mjs render <folder> [out.mp4]      MP4, frames.jpg (2 frames a second), real specs
// node video.mjs format <video> [--ratio 9:16|4:5] [--mute] [--from s] [--for s] [--out file.mp4]
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { TOOLS, bannedIn, browser, fail, has, profile, url } from "./lib.mjs";
import { worstContrast } from "./contrast.mjs";

const run = (cmd, args, opt = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opt });
  if (r.error?.code === "ENOENT") fail(`${cmd} is missing. Run: node scripts/doctor.mjs`);
  if (r.status !== 0) fail(`${cmd} failed\n${(r.stderr || r.stdout || "").slice(-1500)}`);
  return r.stdout;
};

async function check(dir) {
  const html = join(dir, "index.html");
  if (!existsSync(html)) fail(`missing ${html}: node new.mjs reel <folder>`);
  const job = existsSync(join(dir, "job.json")) ? JSON.parse(readFileSync(join(dir, "job.json"), "utf8")) : {};
  const prof = profile(job.client ? [job.client] : []);
  const b = await browser();
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(url(html), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => 1));
  const r = await page.evaluate(() => {
    const root = document.querySelector("[data-composition-id][data-duration]");
    const tl = Object.values(window.__timelines ?? {})[0];
    if (!root || !tl) return null;
    const duration = Number(root.dataset.duration);
    const height = Number(root.dataset.height);
    const end = Math.max(0, ...tl.getChildren(true, true, false).map((t) => {
      let s = t.startTime();
      for (let p = t.parent; p && p !== tl; p = p.parent) s += p.startTime();
      return s + t.totalDuration();
    }));
    const opacity = (el) => {
      let o = 1;
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const c = getComputedStyle(e);
        if (c.display === "none" || c.visibility === "hidden" || /inset\([^)]*(9\d|100)%/.test(c.clipPath)) return 0;
        o *= Number(c.opacity);
      }
      return o;
    };
    const box = (el) => {
      const g = document.createRange();
      g.selectNodeContents(el);
      return el.matches("[data-line]") ? g.getBoundingClientRect() : el.getBoundingClientRect();
    };
    const lines = [...document.querySelectorAll("[data-line]")];
    const all = [...lines, ...document.querySelectorAll("[data-block]")];
    const state = lines.map((el) => ({ el, text: el.textContent.trim().replace(/\s+/g, " "), seen: 0, out: 0 }));
    const touch = new Map();
    const [top, low] = height === 1920 ? [168, 1600] : [60, height - 60];
    for (let k = 0; k < duration * 10; k++) {
      const t = k / 10;
      tl.seek(t, false);
      window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t, waitUntil() {} } }));
      for (const s of state) {
        if (opacity(s.el) <= 0.6) continue;
        const q = box(s.el);
        s.seen += 0.1;
        s.first ??= t;
        s.last = t;
        if (q.top < top || q.bottom > low || q.left < 0 || q.right > 1080) s.out += 0.1;
      }
      const vis = all.filter((e) => opacity(e) > 0.15 && !e.closest("[data-over]"));
      for (let a = 0; a < vis.length; a++)
        for (let c = a + 1; c < vis.length; c++) {
          if (vis[a].contains(vis[c]) || vis[c].contains(vis[a])) continue;
          const [p, q] = [box(vis[a]), box(vis[c])];
          if (Math.min(p.right, q.right) - Math.max(p.left, q.left) > 3 && Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top) > 3) {
            const key = [vis[a], vis[c]].map((e) => e.textContent.trim().slice(0, 40) || e.id || e.className).join(" | ");
            touch.set(key, [...(touch.get(key) ?? []), t]);
          }
        }
    }
    return { duration, height, end, kind: document.body.dataset.format, lines: state.map(({ el, ...x }) => x), touch: [...touch].map(([k, v]) => `${k} (${v[0]}-${v.at(-1)} s)`), network: [...document.querySelectorAll("script[src],link[href],img[src],video[src]")].map((e) => e.getAttribute("src") || e.getAttribute("href")).filter((x) => /^https?:|^\/\//.test(x)), missing: [...document.images].filter((m) => !m.naturalWidth).map((m) => m.getAttribute("src")) };
  });
  if (!r) fail("NO TIMELINE: the page needs data-composition-id, data-duration and window.__timelines");
  const bad = [...r.touch.map((x) => `OVERLAP: ${x}`), ...r.network.map((x) => `NETWORK: ${x} must be a local file`), ...r.missing.map((x) => `MISSING IMAGE: ${x}`)];
  if (!r.lines.length) bad.push("NO LINES: mark each sentence with data-line");
  if (r.kind === "reel" && (r.duration < 20 || r.duration > 30)) bad.push(`LENGTH: ${r.duration} s, a reel is 20-30`);
  if (r.end > r.duration - 0.99) bad.push(`ENDING NOT STILL: last movement ends at ${r.end.toFixed(1)} s of ${r.duration}`);
  if (r.lines.length && !r.lines.some((x) => x.first === 0)) bad.push("FRAME 0 HAS NO SENTENCE");
  for (const [i, x] of r.lines.entries()) {
    const n = x.text.split(" ").length;
    const need = Math.max(1.5, n * 0.3);
    if (x.seen + 0.05 < need) bad.push(`TOO FAST: "${x.text}" stays ${x.seen.toFixed(1)} s, needs ${need.toFixed(1)}`);
    if (n > 14) bad.push(`LONG LINE: "${x.text}" ${n} words`);
    if (x.out > 0.5) bad.push(`OUT OF SAFE AREA: "${x.text}" for ${x.out.toFixed(1)} s`);
    if (/\[[A-Z][A-Z0-9 ,.'-]{3,}/.test(x.text)) bad.push(`PLACEHOLDER: "${x.text}"`);
    bad.push(...bannedIn(x.text, ["—", ...prof.banned]).map((w) => `BANNED: ${w}`));
    if (x.first == null) continue;
    const at = x.first + (x.last - x.first) * 0.75;
    const c = await page.evaluate(({ i, at, h }) => {
      Object.values(window.__timelines)[0].seek(at, false);
      window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: at, waitUntil() {} } }));
      const el = document.querySelectorAll("[data-line]")[i];
      const g = document.createRange();
      g.selectNodeContents(el);
      const q = g.getBoundingClientRect();
      const color = getComputedStyle(el).color;
      el.style.color = "transparent";
      for (const d of el.querySelectorAll("*")) d.style.color = "transparent";
      const [l, t] = [Math.max(0, q.left), Math.max(0, q.top)];
      return { color, x: l, y: t, width: Math.min(1080, q.right) - l, height: Math.min(h, q.bottom) - t };
    }, { i, at, h: r.height });
    if (c.width > 4 && c.height > 4) {
      const { color, ...clip } = c;
      const ratio = await worstContrast(page, await page.screenshot({ clip }), color);
      if (ratio < 3) bad.push(`LOW CONTRAST: "${x.text}" ${ratio.toFixed(1)}:1 at ${at.toFixed(1)} s`);
    }
    await page.evaluate((i) => {
      const el = document.querySelectorAll("[data-line]")[i];
      for (const d of [el, ...el.querySelectorAll("*")]) d.style.color = "";
    }, i);
  }
  await b.close();
  console.log(bad.length ? "TO FIX:\n - " + [...new Set(bad)].join("\n - ") : "MOTION OK");
  return bad.length ? 1 : 0;
}

function render(dir, outArg) {
  if (!has("hyperframes")) fail("The video tools are not installed. Run: node scripts/doctor.mjs");
  const out = resolve(outArg ?? join(dir, "video.mp4"));
  if (existsSync(out)) fail(`${out} already exists: give a new name`);
  const pkg = join(TOOLS, "node_modules/hyperframes");
  const bin = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).bin;
  run(process.execPath, [join(pkg, typeof bin === "string" ? bin : bin.hyperframes), "render", "-o", out], { cwd: dir, stdio: ["ignore", "inherit", "pipe"], env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1" } });
  const sheet = join(dir, "frames.jpg");
  const seconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", out]));
  run("ffmpeg", ["-v", "error", "-y", "-i", out, "-vf", `fps=2,scale=200:-1,tile=10x${Math.ceil(seconds / 5)}`, "-frames:v", "1", "-q:v", "3", sheet]);
  const spec = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate:format=duration", "-of", "default=nw=1", out]);
  console.log(`${out}\n${spec.trim()}\nlook at: ${sheet}`);
  return 0;
}

function format(file, rest) {
  if (!existsSync(file)) fail(`missing ${file}`);
  const arg = (k, d) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : d);
  const ratio = arg("--ratio", "9:16");
  const size = { "9:16": [1080, 1920], "4:5": [1080, 1350] }[ratio];
  if (!size) fail("--ratio is 9:16 or 4:5");
  const out = resolve(arg("--out", join(dirname(file), `${basename(file, extname(file))}-${ratio.replace(":", "x")}.mp4`)));
  if (existsSync(out)) fail(`${out} already exists: give a new name with --out`);
  const r = ratio.replace(":", "/");
  run("ffmpeg", [
    "-v", "warning", ...(arg("--from") ? ["-ss", arg("--from")] : []), "-i", file, ...(arg("--for") ? ["-t", arg("--for")] : []),
    "-vf", `crop=w='min(iw,ih*(${r}))':h='min(ih,iw/(${r}))',scale=${size[0]}:${size[1]}:flags=lanczos,setsar=1,fps=30,format=yuv420p`,
    "-c:v", "libx264", "-crf", "18", "-profile:v", "high", ...(rest.includes("--mute") ? ["-an"] : ["-c:a", "aac", "-b:a", "192k"]),
    "-movflags", "+faststart", out,
  ]);
  console.log(out);
  return 0;
}

const [cmd, target, ...rest] = process.argv.slice(2);
if (!["check", "render", "format"].includes(cmd) || !target) fail("usage: node video.mjs check|render|format <folder or video>");
const path = resolve(target);
process.exit(cmd === "check" ? await check(path) : cmd === "render" ? render(path, rest[0]) : format(path, rest));
