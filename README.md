# MKDA Skills

Three skills for Claude by [MKDA Digital Marketing Agency](https://mkdaagency.com). They work in **your** brand and learn from **your** corrections. [Italiano](README.it.md)

| Skill | What you get |
|---|---|
| `mkda-script` | video scripts ready to shoot, in a Word document with tick boxes |
| `mkda-content` | Instagram carousels, stories, reels and captions |
| `mkda-proposals` | 16:9 PDF proposals with your services and your prices |

## Install

**Claude Code** (terminal, desktop app's Code tab, VS Code):

```
/plugin marketplace add MKDAagency/mkda-skills
/plugin install mkda@mkda-skills
```

Then write, for example, `/mkda:mkda-script` or just "write 5 video scripts for my business".

**Claude app**: download the zip of the skill you want from [Releases](https://github.com/MKDAagency/mkda-skills/releases) and upload it in the skills settings. Code execution must be on. Video needs tools on your computer: in the app you may get the scene-by-scene direction instead of the finished video.

## How they learn

The first time, the skill asks about your brand and saves it in `~/MKDA/` on your computer. Every time you correct it, the correction becomes your rule.

- **MKDA basics**: our method. We improve it with each release.
- **Your layer**: brand, voice, rules, prices. Only you change it. It wins over the basics, updates never touch it, and it stays even if you uninstall.

Nothing is sent to MKDA. Back up the `~/MKDA` folder to keep what the skills learned. In the Claude app the skill gives you an updated `mkda-profile.md`: put it in your Project, otherwise it will not be remembered.

## Updates

Automatic updates are off by default for third-party plugins. To turn them on: `/plugin`, **Marketplaces**, `mkda-skills`, enable auto-update. By hand: `/plugin marketplace update mkda-skills`, then `/plugin update mkda@mkda-skills`. In the app, upload the new zip.

## What they need

- `mkda-script`: Python 3.9+, nothing to install.
- `mkda-proposals`: Python with Playwright, Pillow and pypdf.
- `mkda-content`: Node 22+, and ffmpeg for video.

The skill checks, explains, and asks before installing. Developed on macOS; scripts are also tested on Linux and Windows.

Skills run commands on your computer: read them before installing, as with any plugin.

## Licence

[Apache-2.0](LICENSE). The MKDA name and logo are not included. Only MKDA publishes updates here.
