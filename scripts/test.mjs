// node scripts/test.mjs   no dependencies: works on macOS, Linux and Windows
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const S = join(import.meta.dirname, "../plugins/mkda/skills");
const home = mkdtempSync(join(tmpdir(), "mkda-"));
const env = { ...process.env, MKDA_HOME: home, PYTHONUTF8: "1" };
const py = process.platform === "win32" ? "python" : "python3";
const run = (cmd, ...a) => {
  const r = spawnSync(cmd, a, { env, encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};
const ok = (r) => assert.equal(r.code, 0, r.out);

for (const s of ["script", "proposals"]) ok(run(py, join(S, `mkda-${s}/scripts/check.py`), "--selftest"));
const C = join(S, "mkda-content/scripts");
ok(run(process.execPath, join(C, "text.mjs"), "--selftest"));

// no tools installed: a clear message, no stack trace
const doctor = run(process.execPath, join(C, "doctor.mjs"));
ok(doctor);
assert.match(doctor.out, /MISSING slides/);
for (const a of [["new.mjs", "reel", join(home, "r")], ["video.mjs", "render", home]]) {
  const r = run(process.execPath, join(C, a[0]), ...a.slice(1));
  assert.equal(r.code, 1);
  assert.match(r.out, /not installed/);
  assert.doesNotMatch(r.out, /at .*:\d+:\d+/);
}

// two brands do not mix; client wins over profile; nothing is overwritten
writeFileSync(join(home, "profile.md"), '---\nbrand: "Uno <&>"\ncolor_accent: "#112233"\nbanned: [cheap]\n---\n');
mkdirSync(join(home, "clients"));
const client = join(home, "clients/due.md");
writeFileSync(client, '---\nbrand: "Due"\ncolor_accent: "#445566"\nbanned: [luxury]\n---\n');
ok(run(process.execPath, join(C, "new.mjs"), "carousel", join(home, "a")));
ok(run(process.execPath, join(C, "new.mjs"), "story", join(home, "b"), client));
const read = (...p) => readFileSync(join(home, ...p), "utf8");
assert.match(read("a/assets/theme.css"), /#112233/);
assert.match(read("a/index.html"), /Uno &lt;&amp;&gt;/);
assert.match(read("b/assets/theme.css"), /#445566/);
assert.doesNotMatch(read("b/index.html") + read("b/assets/theme.css"), /Uno|#112233/);
assert.equal(run(process.execPath, join(C, "new.mjs"), "carousel", join(home, "a")).code, 1);
writeFileSync(join(home, "c.txt"), "A cheap idea.");
assert.equal(run(process.execPath, join(C, "text.mjs"), join(home, "c.txt")).code, 1);

// the document builds and is never overwritten
const script = { n: 1, title: "Più & <x>", hook: "a", body: ["b"], closing: "c" };
writeFileSync(join(home, "s.json"), JSON.stringify([script]));
const docx = [join(S, "mkda-script/scripts/build_docx.py"), join(home, "s.json"), join(home, "s.docx"), "--lang", "it"];
ok(run(py, ...docx));
assert.ok(existsSync(join(home, "s.docx")));
assert.equal(run(py, ...docx).code, 1);
console.log("tests ok");
