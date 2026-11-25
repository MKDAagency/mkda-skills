# Reels and moving pieces

Videos are HTML pages rendered by [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0). Animation uses GSAP, downloaded by `doctor.mjs --install` under its own licence.

`new.mjs reel` makes a 1080×1920 page, `new.mjs slide` a 1080×1350 one.

- Root: `data-composition-id`, `data-start="0"`, `data-duration` in seconds, `data-width`, `data-height`.
- One paused GSAP timeline in `window.__timelines["main"]`. Everything must be seekable: no timers, no random, no CSS animation, no requests to the network.
- Each sentence is an element with `data-line`. Screens and images that text must not touch get `data-block`.
- Wanted annotations get `data-over`.

## Rules

- Length 20-30 s for a reel, 4-8 for a moving slide or story.
- Frame 0 already shows the question or promise **and** the real thing. The question closes only at the end.
- A visual change every 1-3 s, with pauses to read.
- A sentence stays for 0.3 s a word, never under 1.5 s. 14 words at most.
- Reels and stories: text and important things between 168 and 1600 px from the top.
- The last second is still.
- At least 3 ways of moving and 4 framings, each pointing at something. Not the opening, main transition or close of the last three reels.
- Show the real thing (app, product, footage), not a metaphor of it.

## Direction first

In `research.md`: three ideas in a line each, the one chosen, the object that crosses the video, then the beats with second, framing, movement and **what on screen causes the next scene**.

## Footage

`node scripts/video.mjs format <video> --ratio 9:16 [--mute] [--from 3 --for 15]` crops and converts to H.264, 30 fps.
Music: none is added. The user picks it, so the rights are theirs to check.

## If the tools are missing

Deliver the direction as a table (second, what is seen, sentence, movement, cause) so it can be edited in any app.
