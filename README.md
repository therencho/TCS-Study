# TCS Study

Short, self-checking practice for Theoretical Computer Science I (Prof. Martens, Bayreuth).
Every answer is checked by a fixed key or a deterministic algorithm — no AI grading, no accounts needed.

This is on-the-go practice, not a replacement for the notes, slides or exercise sheets.

## Use it

- **Daily mix:** 10 items — due reviews first, then new items weighted by exam points.
- **Modules:** practise one chapter at a time (Phase 1 · Basics; Phase 2 · Advanced follows).
- **Mistakes:** redo the last items you got wrong.
- **Your data:** progress lives in your browser. Export / import a backup to move it between devices.
- **Report a mistake** on any item if a key or explanation looks wrong.

Spaced repetition uses 5 Leitner boxes (1, 2, 4, 8, 16 days). A wrong answer sends an item back to box 1
and it comes back once more at the end of the session.

## Develop

```bash
npm install
npm run dev        # runs the content pipeline, then next dev
npm run build      # content pipeline + production build
npm run content    # only validate content
```

## Content

Items are YAML files under `content/`, validated by `scripts/build-content.ts`:

1. each item is parsed against its block schema (`src/lib/items.ts`, zod),
2. structural checks run (gaps match answers, chips exist, buckets exist, exactly one correct reason, …),
3. the answer key is run through the same checker the browser uses (`src/lib/check.ts`).

Any failure stops the build, so a broken item never deploys. The output is `src/generated/content.json`
(generated, not committed).

### Block types (Phase 1 engine)

| Block | YAML `block` | What you do |
| --- | --- | --- |
| Fill the blanks | `cloze` | Type into gaps; normalised match against accepted answers |
| Place the symbols | `chip-cloze` | Tap symbol chips into gaps (chips are consumed) |
| Match | `match` | Pair left with right; optional extra distractors |
| Put in order | `order` | Build a proof from steps; distractors; optional partial order via `before` |
| Sort | `buckets` | Put each item into a category |
| Fill the table | `grid` | Dropdown or typed cells; `normalize: set` for set notation |
| True or false, and why | `tf` | Verdict + exactly one correct justification |

### Example item

```yaml
- id: B1-tf-card-eps          # <module>-<slug>, stable forever (progress is keyed by it)
  module: B1
  phase: 1
  block: tf
  refs: ["Def 1.3"]           # slide numbering, as in the official exam list
  exam_seen: ["Mar26-1c"]     # optional
  difficulty: 1
  prompt: True or false? Then pick the justification.
  statement: "|{ε}| = 0"
  answer: false
  reasons:
    - { text: "{ε} has exactly one element, the empty word, so |{ε}| = 1.", correct: true }
    - { text: "ε has length 0, so the set {ε} is empty." }
  explain: |
    Don't confuse the length of a word with the size of a set.
```

Authoring rules: own words only, cite the slide number, no lecture PDFs, slides or exam scans;
past exam questions are rewritten with changed languages, numbers and instances.

## Stack

Next.js (App Router) · TypeScript · React · Tailwind CSS · KaTeX · IndexedDB (idb-keyval) · Vercel.
Planned: Neon (Postgres) for mistake reports, answer statistics and optional sync; Clerk for optional sign-in.

## License

MIT
