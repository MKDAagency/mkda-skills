// node doctor.mjs            says what works here
// node doctor.mjs --install  installs fixed versions in ~/MKDA/.tools (ask the user first)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error(`Node ${process.versions.node} is too old: version 22 or newer is needed, from https://nodejs.org`);
  process.exit(1);
}
const { TOOLS, VERSIONS, has } = await import("./lib.mjs");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: TOOLS, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(" ")} did not finish`);
    process.exit(1);
  }
};

if (process.argv.includes("--install")) {
  mkdirSync(TOOLS, { recursive: true });
  writeFileSync(
    join(TOOLS, "package.json"),
    JSON.stringify({ name: "mkda-tools", private: true, dependencies: VERSIONS }, null, 2),
  );
  run("npm", ["install", "--no-fund", "--no-audit"]);
  run("npx", ["playwright-core", "install", "chromium"]);
}

const FFMPEG = { darwin: "brew install ffmpeg", win32: "winget install Gyan.FFmpeg", linux: "sudo apt install ffmpeg" };
let chrome = !!process.env.MKDA_CHROME && existsSync(process.env.MKDA_CHROME);
if (!chrome && has("playwright-core"))
  chrome = existsSync(createRequire(join(TOOLS, "package.json"))("playwright-core").chromium.executablePath());
const rows = [
  ["Node 22+", true, ""],
  ["slides and stories", has("playwright-core") && chrome, "node scripts/doctor.mjs --install"],
  ["video", has("hyperframes") && has("gsap"), "node scripts/doctor.mjs --install"],
  ["ffmpeg", ["ffmpeg", "ffprobe"].every((x) => spawnSync(x, ["-version"]).status === 0), FFMPEG[process.platform] ?? "https://ffmpeg.org"],
];
for (const [name, ok, how] of rows) console.log(`${ok ? "OK     " : "MISSING"} ${name}${ok ? "" : `  ->  ${how}`}`);
