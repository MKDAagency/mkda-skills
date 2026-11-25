# Motion

Adapted for HyperFrames from [motion-skills by iart.ai](https://github.com/iart-ai/motion-skills), MIT (see LICENSE-motion-skills.txt).

Static first: if the layout is not clear standing still, movement will not save it.

| To show | Use | How |
|---|---|---|
| a title | kinetic type | mask each line, `yPercent: 110` to `0`, 0.5 s, stagger 0.08 s by line, 0.05 by word, 0.03 by letter. Letters only for a few words |
| a number | counter | tween a value, round it, `font-variant-numeric: tabular-nums`; end on the true figure |
| a comparison | bars | grow with `scaleX` from a fixed origin, same scale, label last; axis from zero |
| a screen | zoom on the point | show it whole, hold, then scale and move so the point lands in the centre, hold |
| a process | diagram | draw lines with `strokeDashoffset`, then the node the line reaches |
| an idea by hand | whiteboard | draw one stroke group per sentence, in the order it is spoken |
| parts of a thing | isometric | separate along one axis, name one part at a time |
| someone speaking | captions | 3-5 words a time, active word in the accent colour, in the safe area |
| a name and role | lower third | in 0.4 s, hold 3 s at least, out 0.3 s |
| time left | countdown | fixed width digits, the last second still |
| a year or summary | recap | one figure a scene, one transition family, biggest last |

## Timing

- In: 0.4-0.6 s, `power3.out` or `expo.out`. Out: 0.2-0.35 s, `power2.in`. Moving across: `power2.inOut`.
- Whole entrance within 0.8 s. Then stillness: reading needs it.
- Overlap starts by 20-40% so scenes join. Out of a scene goes the way the next comes in.
- Springs and bounces only on small things that respond to something.
- Animate `transform`, `opacity`, `clip-path`. Avoid big blurs and layout properties.
- Splitting text: keep the full sentence in `aria-label`.

## Transitions with a cause

Match cut (a shape becomes another), push (the thing leaving drags the next), zoom through (into the point that is explained), wipe by an object, hard cut on a word. Use 3-5 kinds, never the same entrance twice in a row.
