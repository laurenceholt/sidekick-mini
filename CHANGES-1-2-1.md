# Changes Log: Section 1-2-1 (Inequalities)

Adding a new section **1-2** "Inequalities" to Module 1, with Lesson **1-2-1** containing 3 mini-lessons (31 steps total).

Content source: `Sidekick-mini G6 U7-B Pass A Content.md`.

---

## New step types

### 1. `tap-point`
Student taps pre-placed dots on a number line to select them.
- Single-select mode (1-2-1-1-1, 1-2-1-1-2): only one can be active at a time.
- Multi-select mode (1-2-1-1-3): tapping toggles each dot; answer is the set of selected values.

Schema:
```ts
{
  type: "tap-point",
  min, max, tickStep?, labelStep?,
  points: number[],          // tap-able dots
  targets: number[],         // correct values (1-length for single-select)
  multi?: boolean,           // default false
}
```

### 2. `inequality-build`
Student builds an inequality line by (a) optionally tapping a direction (← / →) and (b) dragging the line's open-circle start along the number line.
- `fixedDirection` to lock direction to `<` or `>` (drag-only variant).
- `fixedStart` for when only direction is chosen (rare; not used in this content).

Schema:
```ts
{
  type: "inequality-build",
  min, max, tickStep?, labelStep?,
  initialStart?: number,                 // default 0
  initialDirection?: ">" | "<",          // default null (no arrow shown)
  fixedDirection?: ">" | "<",            // if set, direction buttons hidden/locked
  targetStart: number,
  targetDirection: ">" | "<",
  unitSuffix?: string,                   // e.g. "°" for temperature
}
```

### 3. `inequality-write`
Sentence-style `[var] [sign] [num]` where each slot is either fixed text or an editable input/dropdown.

Schema:
```ts
{
  type: "inequality-write",
  leftVar?: string,           // fixed left text (e.g. "t"), else input
  leftIsInput?: boolean,      // show input for left (variable name)
  fixedSign?: ">" | "<" | "=", // if unset, dropdown of ?, >, <, =
  includeEquals?: boolean,    // if true, dropdown includes =
  rightValue?: number,        // fixed right number, else input
  rightIsInput?: boolean,     // show input for right number
  // grading
  target?: { var?: string; sign: ">" | "<" | "="; value: number };
  solutions?: number[];       // alt grading: answer is valid if every solution satisfies the inequality
  image?: string;             // optional cartoon illustration
}
```

### 4. Extensions to existing types
- `NumberLine` gets an `inequalityLine` prop: `{ start: number; direction: ">" | "<" }` rendering a green ray with an open circle and arrow head.
- `place-point`, `multiple-choice`, `number-line-choice` all pass through the `inequalityLine` field.

---

## Graphics created (all SVG, all `public/`)

| File | Used by | Description |
|------|---------|-------------|
| `rocker-icicles.svg` | 1-2-1-2-6 | Aging rock singer with icicles (cold concert) |
| `tunnel-flood.svg` | 1-2-1-2-7 | Flooded tunnel interior with floating debris |
| `reactor.svg` | 1-2-1-2-8 | Nuclear power station silhouette |
| `height-test.svg` | 1-2-1-2-9 | Height measuring sign at amusement park |
| `highway-cars.svg` | 1-2-1-2-10 | Cartoon 50s cars on highway |

---

## Files touched

### New files
- `src/components/lesson-kit/TapPoint.tsx`
- `src/components/lesson-kit/InequalityBuild.tsx`
- `src/components/lesson-kit/InequalityWrite.tsx`
- `public/rocker-icicles.svg`
- `public/tunnel-flood.svg`
- `public/reactor.svg`
- `public/height-test.svg`
- `public/highway-cars.svg`
- `scripts/insert-1-2-1.mjs` (idempotent content insertion)
- `CHANGES-1-2-1.md` (this file)

### Modified files
- `src/lib/schemas/lesson.ts` — added 3 new step types to union and interfaces; added `inequalityLine` field where applicable
- `src/components/lesson-kit/NumberLine.tsx` — renders optional green inequality line with open circle and arrow
- `src/components/lesson-kit/MultiStepShell.tsx` — import + grade + render the new step types
- `src/components/lesson-kit/PlacePoint.tsx` — passes `inequalityLine` through to NumberLine
- `src/components/lesson-kit/MultipleChoice.tsx` — passes `inequalityLine` through
- `src/components/lesson-kit/NumberLineChoice.tsx` — passes `inequalityLine` through
- `src/styles/global.css` — CSS for inequality line, direction buttons, new input layouts
- `handover.md` — added Section 1-2 to content inventory

---

## Content mini-lesson summary

### 1-2-1-1 "What's an inequality line?" (10 steps)
1. Tap greater of two dots → 8
2. Tap less of two dots → 5
3. Multi-tap greater-than-3 dots → 4, 9
4. Plot a point > 5 on inequality line
5. Plot a point < 5 on inequality line
6. Interpret inequality line (> 7) — MC
7. Interpret inequality line on -5..5 (< 0) — MC
8. Drag inequality start to 3 (direction locked <)
9. Drag inequality start to -2 (direction locked >)
10. Full build (direction + drag) → > 3

### 1-2-1-2 "Inequality sentences" (10 steps)
1. Build inequality: temperature < 3°
2. Build: t > 0
3. Build: t < 5
4. Build: a > 16 (age)
5. MC: pick a > 16 from three options
6. Sentence: t ? 2 → t > 2 (rocker image)
7. Sentence: w ? [box] → w > -3 (tunnel image)
8. Sentence: [var] ? [num] → any-var > 3 (reactor image)
9. Sentence: [var] ? [num] → any-var > 4 (height test image)
10. MC: interpret `s < 65 mph` (highway image)

### 1-2-1-3 "Solutions" (11 steps)
1. Build: > 4
2. Agree/Disagree: 10 solves n > 4 (Agree)
3. Agree/Disagree: 2 solves t > 4 (Disagree)
4. MC: -2 vs 2 for p < 0
5. Input: any > -4 for w > -4
6. MC: 200 vs 1200 for x < 1000
7. MC: ½, -½, 0 for n < 0
8. Agree/Disagree: 99 for >100 nickels (Disagree)
9. Write inequality for {7, 15, 33} → any-var > any-value ≤ 7
10. Write inequality for {3, -4, 0, 2300} → any-var > any-value ≤ -4
11. Write inequality matching shown line → any-var > 10

---

## Commits

- All changes landed in commit `fe3091d` on the `astro` branch.
- Content insertion run via `node scripts/insert-1-2-1.mjs` against Supabase `lessons_content/main` (prod).
- Post-insertion structure: Module 1 → 2 sections (s1, s2). Section s2 has Lesson l1 with 3 mini-lessons (ml1, ml2, ml3) totaling 31 steps.

## Verification

- `npm run build` passes (Astro static build, no TypeScript errors).
- Insertion script is idempotent: removes existing `s2` section before re-inserting, so re-running it safely refreshes content.
- MapView and LessonRunner require no changes — both iterate dynamically over `modules[].sections[].lessons[].miniLessons[]` and resolve step-id prefixes from array indexes.
