---
name: mkda-content
description: Creates Instagram carousels, stories, reels and captions in the user's brand, from idea to finished files, learning from every correction. Use when asked for social content.
license: Apache-2.0
---

# mkda-content

An idea becomes a carousel (4:5), stories (9:16), a reel (9:16) and captions, in the user's brand, checked by eye and by script.

Work and reply in the user's language. Write content in the language of the audience.

**Read first, every time:** [references/learning.md](references/learning.md) (the user's layer, which wins over everything here) and [references/basics.md](references/basics.md). The user's rules are in `~/MKDA/rules/content.md`.
When you reach them: [references/design.md](references/design.md) for slides and stories, [references/video.md](references/video.md) and [references/motion.md](references/motion.md) for anything that moves, [references/caption.md](references/caption.md) for captions.

Paths such as `scripts/build.mjs` are relative to this skill's folder; run them with that folder's absolute path.

## Progress

List the phases (research, storyboard, design, checks, delivery). After each, one line with a bar: `▓▓░░░ 2/5 · Storyboard done, now design`.

## 1. What to make

Default: carousel, stories and reel, two captions. If the user asks for one piece, make that one. Ask only if there are several ideas or something is missing that cannot be found.
No idea yet: propose 5 topics from the profile and today's research, each with who it helps and what they will be able to do.

## 2. Tools

```bash
node scripts/doctor.mjs
```

It says what works here and how to install the rest. **Install only after a yes** (`node scripts/doctor.mjs --install` puts fixed versions in `~/MKDA/.tools` and downloads a browser).
No Node or no browser: deliver texts, storyboard and scene-by-scene direction, and say which checks were not possible. Never pretend a file was rendered.

## 3. Research

Today, on the web, starting from official pages. Save `research.md` in the job folder: date, sources, how the thing really works, what is uncertain. Check `~/MKDA/output/content/` so a topic is not repeated without meaning to.
When the user gives a post or video as reference, study its structure and rhythm; do not copy its words, footage, images or look.

## 4. Storyboard first

In `research.md` and in chat: the goal ("after this you can..."), the line worth sending to a friend, the slide titles in a row, what each slide shows and where its image comes from, the reel scene by scene. Wait for a yes, unless the user's rules say to go on.

## 5. Make it

```bash
node scripts/new.mjs carousel <job>/carousel
node scripts/new.mjs story <job>/stories
node scripts/new.mjs reel <job>/reel
```

Add a client file as last argument when the job is for a client.
Job folder: `~/MKDA/output/content/<YYYY-MM-DD>-<short-name>/`. `new.mjs` copies the starting page with the profile's colours, fonts, logo and handle. The starting pages are a base to redesign, not a look to repeat: compare with the last three jobs and change composition, background and lead image.

## 6. Check

```bash
node scripts/build.mjs <job>/carousel          # JPG files, sheet.jpg and checks
node scripts/build.mjs <job>/stories
node scripts/video.mjs check <job>/reel        # reading time, safe areas, overlaps, contrast, still ending
node scripts/video.mjs render <job>/reel       # MP4 plus frames.jpg, two frames a second
node scripts/text.mjs <job>/caption.txt        # banned words and machine-sounding writing
```

Fix every problem reported. Then **look at** `sheet.jpg` and `frames.jpg`, every one: unreadable, covered, cut, empty or false things are fixed before delivery.
Last, read as a beginner: one line per slide and scene on what someone new to the topic understands. If it does not lead to the goal, rewrite it.

## 7. Delivery

Show the sheets, the video and the captions in text blocks, the results of the checks, and what was not checked. Files are numbered in publishing order. Never publish or schedule anything without a yes.
