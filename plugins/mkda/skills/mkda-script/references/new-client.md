# A new client

1. Look before asking: website, social profiles, material the user has.
2. Draft `~/MKDA/clients/<name>.md`:

```markdown
---
brand: ""
languages: [en]
brand_min_mentions: 0
words: [60, 110]
banned: []
---
## What they do and for whom
## Voice and shape of the message
## Client rules
## Industry research (date and source)
## Never
## Batches
```

3. Ask only what is missing, once. Write it after a yes.
4. After each batch, add a table under `## Batches`: title, level, audience, call to action, status. Dropped scripts stay, with the reason.

`words` are the limits for spoken text. For languages where spaces do not separate words, set `words: [0, 99999]` and judge by reading aloud.
