# Slides and stories

One `<section class="slide">` per slide. The format is on `<body data-format="carousel">` (1080×1350) or `"story"` (1080×1920).
CSS variables come from the profile: `--bg --text --accent --dark --title --body`.

Pieces in `theme.css`: `.dark`, `.tint`, `.photo` (full image `img.bg` with `.veil`), `.screen` (framed screenshot), `.step` (number), `.recap`, `.close`, `.mark` (accent word), `.note` (annotation). Compose new ones freely.

- One lead element per slide, big. One bold gesture, not three.
- Accent colour is for the word or point that matters, never a full background.
- Change background and composition from slide to slide and from the last job.
- Safe area: 88 px at top and bottom in carousels; 250 top and 340 bottom in stories.
- Text at least 28 px in carousels, 36 in stories. Blocks at least 48 px apart.
- Text never covers text, lines or the important part of an image. Wanted annotations get `data-over`.
- Logo and handle only on cover and close.
- Other alphabets: set a font that has them in the profile and is installed on the computer. Set `lang` and `dir` on `<html>`.

`build.mjs` reports: `MISSING IMAGE`, `TEXT CUT`, `OUT OF SAFE AREA`, `OVERLAP`, `SMALL TEXT`, `LONG TITLE`, `LOW CONTRAST`, `SLIDE COUNT`, `BANNED`, `PLACEHOLDER`. It cannot judge beauty, truth or a badly cropped face: look at the sheet.

A slide that is a video: make it with `new.mjs slide <job>/slide-03`, render it and keep the JPG of the same slide as a still.
