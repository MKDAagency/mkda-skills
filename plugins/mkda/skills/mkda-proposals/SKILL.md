---
name: mkda-proposals
description: Creates 16:9 PDF business proposals and quotes in the user's brand, with their own services and prices, learning from every correction. Use when asked for a proposal or quote.
license: Apache-2.0
---

# mkda-proposals

The result is always the same: a 16:9 PDF proposal for one precise client, in the user's brand, checked page by page.

Work in the user's language; write the proposal in the client's language.

**Read first, every time:** [references/learning.md](references/learning.md) (the user's layer, which wins over everything here), [references/rules.md](references/rules.md), [references/pages.md](references/pages.md). The user's rules are in `~/MKDA/rules/proposals.md`.

Paths such as `scripts/build.py` are relative to this skill's folder; run them with that folder's absolute path.

## Progress

List the phases (context, questions, outline, writing, checks, delivery). After each, one line with a bar: `▓▓░░░░ 2/6 · Questions done, now outline`.

## 1. Context

Read the profile, the client file and earlier proposals in `~/MKDA/output/proposals/<client>/`. Do not ask what they already say. Then read the client's website and social pages: what they sell, since when, where, how they speak.

## 2. Questions, all in one round

Only what is still missing:

- services and quantities;
- **the price of every item**, currency, whether tax is included and how it must be shown;
- payment terms, duration, validity;
- the client's situation, contact person, date on the cover.

Prices always come from the user: the list in the profile is a starting point to confirm. Never work out tax, gross or net on your own. This is a commercial proposal, not legal or tax advice.

## 3. Outline first

In chat: page titles, what each one tells the client in a line, prices. Wait for a yes. A page with nothing of its own to say is merged here.

## 4. Writing

Folder: `~/MKDA/output/proposals/<client>/source/`, with `proposal.template.html` copied from `assets/template.html` and images in `assets/img/`.

- Keep CSS and structure. Colours come from the profile, or from the client when the user wants that: change the variables in `:root`.
- Replace every `[PLACEHOLDER]` and remove blocks that do not apply. Set `lang` and `dir` on `<html>`.
- Client photos: `python3 scripts/get_images.py <source> URL...`, only from the client's own pages or material the user may use. Look at them before using them. No good photos: typographic pages, never stock.
- Images are `{{IMG:name.jpg}}`. `{{LOGO_LIGHT}}` and `{{LOGO_DARK}}` are the user's logo for light and dark backgrounds; without a logo the brand name is written.

## 5. Build and check

Needs Python 3.9+ with `playwright`, `pillow`, `pypdf` and Chromium. If missing, ask before installing, then:

```bash
python3 -m venv ~/MKDA/.tools/py
~/MKDA/.tools/py/bin/python -m pip install playwright pillow pypdf
~/MKDA/.tools/py/bin/python -m playwright install chromium
```

(On Windows: `.tools\py\Scripts\python`.) Run the scripts with that Python:

```bash
python scripts/build.py "<source>" "<output>/YYYY-MM-DD - Proposal <Client> vN.pdf" --profile ~/MKDA/profile.md --title "<title>"
python scripts/check.py "<source>" "<pdf>" ~/MKDA/profile.md ~/MKDA/rules/proposals.md
```

`build.py` also writes preview sheets and prints their paths. **Look at every sheet**: big empty areas, cut text, badly cropped photos, prices that differ between pages. Fix and rebuild. Never overwrite a delivered version.

Where Chromium cannot run, make the same pages with the document tools available and say which checks were not possible.

## 6. Delivery

Give the PDF, the page count and the prices used. Say what you added without being asked, so it can be checked. Offer to draft an email or upload it, only through connected tools and **never send without a yes**. Record version, date, services and prices in the client file.
