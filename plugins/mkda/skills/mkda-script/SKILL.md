---
name: mkda-script
description: Writes ready-to-shoot video scripts with hooks in your voice, checked and in Word. Learns your corrections. Use for video scripts, hooks, angles, reels to film.
license: Apache-2.0
---

# mkda-script

The result is always the same: scripts written for one precise business, checked, and delivered as a document ready for the shoot.

Work and reply in the user's language. Write scripts in the language of the audience.

**Read first, every time:** [references/learning.md](references/learning.md) (the user's layer, which wins over everything here) and [references/basics.md](references/basics.md). The user's rules for this skill are in `~/MKDA/rules/script.md`.

Paths such as `scripts/check.py` are relative to this skill's folder; run them with that folder's absolute path.

## Progress

List the phases at the start (context, research, angles, writing, delivery). After each, one line with a bar: `▓▓░░░ 2/5 · Research done, now angles`.

## 1. Who it is for

The user's own brand: use `profile.md`. A client: use `clients/<name>.md`; if missing, build it with [references/new-client.md](references/new-client.md) and get a yes first. If it is not clear which, ask.

## 2. What happened to the last batch

If there is an earlier batch in `~/MKDA/output/scripts/<name>/`, read it. If the user shows what was filmed, changed or dropped, propose the rule it suggests; do not save it without a yes.

## 3. The brief

From the request: how many scripts, topic limits, landing pages, shoot date. Ask only what is missing and would change the work, in a single round. Default: 5 scripts, one per awareness level.

## 4. Research

1. Read the website and landing pages today. If a page cannot be read, say so.
2. Sort what you find: usable, to confirm, not usable, to flag.
3. Legal, medical, tax or financial topics: look for sources. If they disagree, the script gives no figures.
4. **Never repeat a topic.** Read every past script for this business and compare topics, not only titles.

## 5. Angles first

Show a table with number, awareness level, audience, angle, hook, and the closest past script. Wait for a yes. Mistakes are cheaper here.

## 6. Writing

Save `~/MKDA/output/scripts/<name>/<YYYY-MM-DD>-v<N>.json`: a list with one object per script.

Required: `n, level, persona, title, hook, body (list of lines), closing, facts, source, to_confirm, shoot_note`. Use `"none"` where there is truly nothing to say.
A safer alternative to script 2 has `n` `"2B"` and follows it.

Read each one aloud, at about 2.5 words a second. The hook names the viewer's problem or situation within 3 seconds. Rewrite what stumbles or sounds written.

```bash
python3 scripts/check.py <scripts.json> ~/MKDA/profile.md ~/MKDA/rules/script.md ~/MKDA/clients/<name>.md
```

Fix every line it reports.

## 7. Delivery

```bash
python3 scripts/build_docx.py <scripts.json> "<output.docx>" --lang <en|it|es|fr|de|pt>
```

For another language pass `--labels "HOOK|MESSAGE|CLOSING|ALTERNATIVE"`.
No Python: deliver the same layout as plain text or make the document with the tools available.
If a Drive or docs connector is available, offer to upload; do it only after a yes.
Never overwrite: each version is a new file. Say what to confirm with the business, and what was not checked.
