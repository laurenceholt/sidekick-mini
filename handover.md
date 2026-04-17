# Math Sidekick — Agent Handover

## Goal

Build **Math Sidekick** (working title "Podsie"), a Duolingo-style math learning app for kids. Currently covers Module 1 "Negative Numbers and Absolute Value" with interactive number lines, thermometers, elevation diagrams, comparison operators, and equation input. The app rewards correct answers with "boba" (virtual currency) and tracks streaks.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | **Astro 6** (static output) with **React 19** islands (`client:only="react"`) |
| Language | **TypeScript** (strict mode, path alias `@/*` → `src/*`) |
| Styling | **Tailwind CSS v4** via Vite plugin + extensive custom CSS in `src/styles/global.css` |
| Database | **Supabase** (PostgreSQL). Two tables: `lessons_content` (single row, id=`main`, JSONB `data` column) and `events` (analytics). Stories stored in `stories` bucket. |
| Deployment | **Netlify** from `astro` branch. Build: `npm run build` → `dist/`. Node 22. |
| Repo | `github.com/laurenceholt/sidekick-mini`, branch **`astro`** (main development branch; `master` is legacy) |

### Key config

- `astro.config.mjs` — React integration, Tailwind, and injects `__COMMIT_SHA__` at build time via `git rev-parse --short HEAD`
- Supabase URL: `https://qwqsgfepygsfempjmquq.supabase.co` (publishable key in `src/lib/supabase.ts`)
- App container is `max-width: 600px` for game screens; `/edit` and `/data` pages expand to `1200px` via `#app:has(.edit-content, .data-view)`

---

## Content hierarchy

```
Module → Section → Lesson → MiniLesson → Step[]
```

All content lives in a single Supabase row (`lessons_content`, id=`main`). The `data` JSONB column holds:

```
{ version, modules: [{ sections: [{ lessons: [{ miniLessons: [{ steps: [...] }] }] }] }], stories: [...] }
```

Steps are typed via a discriminated union on `step.type`. Current types: `place-point`, `move-point`, `equation-input`, `multiple-choice`, `number-line-choice`, `thermometer`, `thermometer-compare`, `elevation`, `compare-sign`, `inequality-input`, `celebrate`.

Content mutations are done via **idempotent Node scripts** in `scripts/` that read the blob, mutate it, and write it back. Always check for existing data before inserting (idempotency guard).

---

## URL scheme

| Route | Purpose |
|-------|---------|
| `/` | Map view — lesson navigation tree |
| `/lesson?m=m1&s=s1&l=l1&ml=ml1&step=N` | Lesson player |
| `/edit` | Content editor (instruction text, hint buttons) |
| `/data` | Analytics dashboard (events table, bar charts) |

---

## Codebase structure

```
src/
├── components/
│   ├── lesson-kit/        # Core lesson components (18 files)
│   │   ├── LessonRunner.tsx     # Entry: loads content, resolves IDs
│   │   ├── MultiStepShell.tsx   # Orchestrator: step progression, grading, streaks, boba, fix-mistakes loop
│   │   ├── CheckFlow.tsx        # Check/Try Again/Continue button + hint button
│   │   ├── LessonScreen.tsx     # Renders instruction + child component
│   │   ├── FeedbackBox.tsx      # Correct/wrong feedback display
│   │   ├── NumberLine.tsx       # Reusable number line (ticks, labels, points)
│   │   ├── PlacePoint.tsx       # Place a dot on number line
│   │   ├── MovePoint.tsx        # Drag a dot on number line (native touch listeners)
│   │   ├── MultipleChoice.tsx   # Choice buttons (supports number line + image)
│   │   ├── NumberLineChoice.tsx # Pick from labeled points
│   │   ├── EquationInput.tsx    # Type a number/equation
│   │   ├── Thermometer.tsx      # Temperature scale (+ ThermometerCompare)
│   │   ├── Elevation.tsx        # Height/depth diagram
│   │   ├── CompareSign.tsx      # Pick > or < between two values (dropdown)
│   │   ├── InequalityInput.tsx  # Type a number to satisfy an inequality
│   │   ├── StoryOverlay.tsx     # Narrative pages between lessons
│   │   ├── StreakToast.tsx      # Streak celebration toast
│   │   └── Confetti.tsx         # Particle animation
│   ├── map/MapView.tsx          # Navigation tree with progress
│   ├── edit/EditView.tsx        # Content editor
│   └── data/DataView.tsx        # Analytics dashboard
├── lib/
│   ├── schemas/lesson.ts  # TypeScript types for all content
│   ├── content.ts         # Supabase content loader (with cache)
│   ├── events.ts          # Event logging (step_id, answer, correct, boba, commit)
│   ├── progress.ts        # localStorage progress tracking
│   ├── supabase.ts        # Supabase client
│   ├── markdown.ts        # Minimal markdown (bold, italic, nowrap absolute-value bars)
│   ├── sounds.ts          # WebAudio stubs (currently disabled)
│   └── utils.ts           # cn() Tailwind merge utility
├── pages/                 # Astro page shells (each mounts a React island)
├── layouts/Layout.astro   # Base HTML template
└── styles/global.css      # All custom CSS (~1050 lines)

scripts/                   # Idempotent Supabase content mutation scripts
public/                    # Static assets: boba.svg, boba-spilled.svg, alligator-gt.svg, godzilla-kong.svg, stories/
```

---

## How to add a new step type

1. Add the type string to `StepType` union in `src/lib/schemas/lesson.ts`
2. Add a corresponding interface extending `BaseStep`
3. Create `src/components/lesson-kit/YourType.tsx` — default export (component) + named export `gradeYourType(step, answer) → { correct, hint? }`
4. In `MultiStepShell.tsx`: import both, add grading `else if` in `handleCheck()`, add rendering `{step.type === "your-type" && <YourType ... />}` block
5. No changes needed in EditView (it's type-agnostic — just shows instruction + hintButton columns)

---

## How to add content

Write an idempotent script in `scripts/` that:
1. Connects to Supabase with the publishable key
2. Fetches `lessons_content` row where `id='main'`
3. Navigates the blob: `blob.modules[M].sections[S].lessons[L].miniLessons[ML].steps[N]`
4. Checks for existing data before inserting (idempotency guard)
5. Writes back with `update({ data: blob, updated_at: new Date().toISOString() })`
6. Run with `node scripts/your-script.mjs`

---

## Key patterns & conventions

- **Grading**: Each component exports a pure `grade*()` function. Returns `{ correct: true }` or `{ correct: false, hint?: string }`. The `hint` field here is wrong-answer feedback text.
- **Hint button**: Separate from wrong-answer `hint`. Stored as `step.hintButton` in content. Rendered by `CheckFlow.tsx` as a green-outlined button that reveals text on click.
- **Locking**: After Check, `locked = buttonState === "wrong" || buttonState === "correct"` — all interactions freeze.
- **Event IDs**: Base format `M-S-L-ML-Step`. Suffixes: `.r2`/`.r3` for retries, `.fix` for fix-mistakes pass, `.fix.r2` for fix-mistakes retries. First try has no suffix.
- **Touch drag**: MovePoint uses native `addEventListener` with `{ passive: false }` in a `useEffect` — React synthetic touch events are passive and can't `preventDefault()`.
- **Commit SHA**: Injected at build via Vite `define` as `__COMMIT_SHA__`. Displayed on map, logged with every event.
- **No em dashes**: Feedback text must not use `—` (confused with minus signs by kids).
- **Praise variety**: Correct-answer messages are randomized from pools (EASY_PRAISE, LEARNING_PRAISE, HARD_PRAISE). First step of each mini-lesson always says "+5 boba".
- **Fix-mistakes loop**: Wrong answers are tracked; after completing all steps, wrong ones are replayed.
- **Progress**: localStorage key `sidekick-progress` tracks completed mini-lessons.
- **User ID**: Derived from IP via ipify.org, stored in localStorage.
- **Always commit and push after every change** — the user tests on the deployed Netlify build.

---

## Current content

### Module 1, Section 1 (Negative Numbers and Absolute Value)

| ID | Title | Mini-lessons |
|----|-------|-------------|
| 1-1-1 | Positive and Negative Numbers | 3 MLs (10, 11, 10 steps) |
| 1-1-2 | Points on the Number Line | 2 MLs (10, 10 steps) |
| 1-1-3 | Comparing Positive and Negative Numbers | 2 MLs (10, 10 steps) |
| 1-1-4 | Absolute Value of Numbers | 1 ML (10 steps) |

### Module 1, Section 2 (Inequalities)

| ID | Title | Mini-lessons |
|----|-------|-------------|
| 1-2-1 | Introduction to Inequalities | 3 MLs (10, 10, 11 steps) |

Step types introduced in Section 1-2:
- `tap-point` — tap pre-placed dots on a number line (single or multi-select)
- `inequality-build` — tap direction (`<`/`>`) + drag open-circle start to build a ray
- `inequality-write` — sentence-style `[var] [sign] [num]` with configurable fillable slots. Grading via exact `target` or solution-set validation.
- `NumberLine` supports optional `inequalityLine: { start, direction }` for a green ray with open circle and arrow head. Propagated through PlacePoint, MultipleChoice, NumberLineChoice, EquationInput, and InequalityWrite.
- `EquationInput` supports `condition: "greaterThan"|"lessThan"` + `conditionValue` for range-based grading.

---

## PATH workaround

On this machine, Node may not be on PATH due to Xcode license issues. Scripts in `scripts/` and git operations need:

```bash
export PATH="/usr/local/bin:$PATH"
```

Prepend this before `node`, `npm`, or `git` commands.
