// node text.mjs <file.txt> [...]   banned words and machine-sounding writing. --selftest
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bannedIn, fail, frontmatter, profile } from "./lib.mjs";

// shortcut: phrases for English and Italian only; other languages get rhythm, dashes and banned words
const STOCK = [
  /\bin today's (digital |fast-paced )?world\b/i, /\bgame[ -]?changer\b/i, /\bunlock (your|the) (full )?potential\b/i,
  /\bdelve\b/i, /\bnot only\b[^.?!]{1,60}\bbut also\b/i, /\bit's not just\b[^.?!]{1,60}\bit's\b/i, /\bseamless(ly)?\b/i,
  /(^|\n)\s*the (result|truth|secret|difference)\s*\?/i, /\bin conclusion\b/i,
  /\bnel mondo (digitale )?di oggi\b/i, /\bsblocca(re)? (il|tutto il) (tuo )?potenziale\b/i, /\bun vero e proprio\b/i,
  /\bnon solo\b[^.?!]{1,60}\bma anche\b/i, /\bscopriamo insieme\b/i, /(^|\n)\s*(il risultato|la verità|il segreto)\s*\?/i,
];

export function problems(text, banned = []) {
  const out = bannedIn(text, ["—", ...banned]).map((w) => `banned: ${w}`);
  for (const re of STOCK) {
    const m = text.match(re);
    if (m) out.push(`sounds like a machine: "${m[0].trim()}"`);
  }
  const n = text.split(/[.!?。！？\n]+/).map((s) => s.trim().split(/\s+/).filter(Boolean).length).filter((x) => x >= 3);
  if (n.length >= 5) {
    const mean = n.reduce((a, b) => a + b, 0) / n.length;
    if (Math.sqrt(n.reduce((a, b) => a + (b - mean) ** 2, 0) / n.length) / mean < 0.25) out.push("sentences all the same length");
  }
  if ((text.match(/[\p{L}']+, [\p{L}']+,? (and|e|y|et|und) [\p{L}']+/gu) ?? []).length >= 3) out.push("too many lists of three");
  return out;
}

const files = process.argv.slice(2);
if (files[0] === "--selftest") {
  assert.deepEqual(frontmatter('---\r\nbanned: [cheap, "a, b"]\r\nbrand: "X"\r\n---\r\n'), { banned: ["cheap", "a, b"], brand: "X" });
  assert.deepEqual(problems("Cheap — a real game changer.", ["cheap"]).length, 3);
  assert.deepEqual(problems("Cheaper è più bello.", ["cheap", "pi"]), []);
  assert.ok(problems("One two three four. One two three four. One two three four. One two three four. One two three four.").length);
  console.log("selftest ok");
} else {
  if (!files.length) fail("usage: node text.mjs <file.txt> [...]");
  let bad = 0;
  const { banned } = profile();
  for (const f of files) {
    const p = problems(readFileSync(f, "utf8"), banned);
    bad += p.length;
    console.log(p.length ? `${f}\n - ${p.join("\n - ")}` : `${f}: OK`);
  }
  process.exit(bad ? 1 : 0);
}
