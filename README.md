# Heatseeker

**Don't step in lava!** 🔥
Navigate from the bottom-left to the top-right based on the heat of each tile.

[Play Heatseeker!](https://heatseeker-one.vercel.app/)

Designed as an [ARC-AGI-3 Challenge](https://arcprize.org/arc-agi/3/) game to test AI/ML model reasoning skills: "Easy for Humans, Hard for AI." Game rules are a puzzle on purpose. **For humans...** turns out the game is fairly fun, even if figuring out the rules and color hints aren't. If you're just intersted in playing a game, see the rules below.

![Heatseeker game play, level win :smiley:](./docs/assets/heatseeker%20gameplay%20screen%20-%20level%20complete.png)
![Heatseeker game play, found the lava :anguished:](./docs/assets/heatseeker%20gameplay%20screen%20-%20game%20over.png)

## Computer Use Results

### ChatGPT

[ChatGPT-5 computer use achieved level 3.](./docs/computer_use/chatgpt-5.md)

### Claude

[Claude Opus 4.1 doesn't include computer use by default, and refused to help with coding it's own API](./docs/computer_use/claude4.md). When asked to generate python code for the Claude API with computer use enabled, Claude Opus 4.1 told me:

> Claude API Limitation: The Claude API (which I am) provides text generation and reasoning, not browser control or GUI interaction capabilities. There's no "computer interaction API" from Claude/Anthropic.

---

## Gameplay Rules

Navigate from bottom-left to top-right corner to complete each level.

* Use arrow keys to move, but AVOID landing on a lava square
* Colors show the lava count in bordering squares. Increasing heat (yellow, orange, red) means more lava on the next move:
* White = 0 lava nearby
* Light Yellow = 1 lava nearby
* Bright Yellow = 2 lavas nearby
* Orange = 3 lavas nearby
* Orange-Red = 4 lavas nearby
* Light Red = 5 lavas nearby
* Dark Red = 6 lavas nearby
* Purple Red = 7 lavas nearby
* Neon Pink = 8 lavas nearby

---

## Setup & Run

### Installation

```bash
npm install
```

### Development

```bash
npm start
# or
npm run dev
```

### Build for Production

```bash
npm run build
```

### Testing

#### Unit Tests (Vitest)

* **Game logic tests** - Core algorithms like heat calculation, lava generation, move validation
* **Component tests** - React UI components, user interactions, game states

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and show line-by-line test coverage for all source files.

#### End-to-End Tests (Playwright)

* **Game functionality** (22 tests) - Complete user workflows, game mechanics, mobile/keyboard controls
* **Accessibility** (8 tests) - Screen reader support, keyboard navigation, color contrast, WCAG compliance
* **Performance** (8 tests) - Load times, responsiveness, memory usage, concurrent operations

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# View E2E test reports
npm run test:e2e:report
```

E2E tests run across multiple browsers (Chrome, Firefox, Safari) and device types (desktop, tablet, mobile).

## Responsive Breakpoints

* Base `<640px` (mobile portrait): primary target for scaling grid/cell size; covers iPhone SE/8/X and similar compact Android devices. Grid may enable internal scroll while Move controls stay anchored.
* `sm` ≥640px: larger phones in landscape and small tablets; maintains scaled grid while restoring horizontal control layouts.
* `md` ≥768px: tablets in portrait/landscape such as iPad Mini/Air; gameplay grid approaches desktop sizing.
* `lg` ≥1024px: laptop-width viewports; grid reaches full desktop dimensions with generous control spacing.
* `xl` ≥1280px: widescreen desktops/monitors; matches existing desktop layout without additional scaling.
* `2xl` ≥1536px: very wide monitors/TVs; no additional changes planned beyond standard Tailwind defaults.

## Leaderboard

The leaderboard is backed by the Supabase Postgres database. Supabase credentials for local and remote environments live in `.env.local`; confirm they match project secrets before running database tasks.

### Common Supabase Commands

```bash
# create a new migration under supabase/migrations/
supabase migrations new descriptive_name

# apply pending migrations to the prbase database
supabase db push

# reset the local shadow database to re-run migrations
supabase db reset

# serve an edge function locally (reads env vars from .env.local)
supabase functions serve start-session --env-file .env.local

# deploy edge functions to Supabase
supabase functions deploy start-session
supabase functions deploy update-score
supabase functions deploy leaderboard
```

Whenever you change migrations or edge functions, push the code and redeploy (`supabase db push` followed by the appropriate `supabase functions deploy ...`) so the `prbase` database and functions stay synchronized with the repository.
