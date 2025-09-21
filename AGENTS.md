# Repository Guidelines

Heatseeker is a TypeScript + React puzzle game delivered through Vite. Use this guide to keep gameplay logic, UI, and tests aligned across contributions.

## Project Structure & Module Organization

- `src/` hosts the React app; `App.tsx` orchestrates rendering while `gameLogic.ts` encapsulates level math shared with tests.
- `test/` contains Vitest suites (`*.test.ts` / `*.test.tsx`) and setup helpers; `e2e/` stores Playwright specs grouped by accessibility, gameplay, and performance checks.
- Static assets live in `public/` and `docs/assets/`; Vite builds to `dist/`, and coverage artifacts are captured in `coverage/` when `npm run test:coverage` runs.
- Root-level configs (`vite.config.ts`, `tailwind.config.ts`, `playwright.config.ts`, `tsconfig.json`) are authoritative—mirror their patterns when adding new tooling.

## Build, Test, and Development Commands

- `npm install` syncs dependencies; rerun after lockfile updates or config changes.
- `npm run dev` (alias `npm start`) launches the Vite dev server on <http://localhost:5173> with hot reload.
- `npm run build` produces the production bundle; follow with `npm run preview` for a static smoke test ahead of deploys.
- `npm test` runs Vitest in watch mode; `npm run test:run` is CI-safe; `npm run test:coverage` adds coverage reporting.
- `npm run test:e2e` executes Playwright suites headless; `npm run test:e2e:ui` opens the interactive runner; `npm run test:e2e:report` replays the latest report.

## Coding Style & Naming Conventions

TypeScript `strict` settings in `tsconfig.json` are non-negotiable—treat compiler warnings as blockers. Stick to 2-space indentation, `const` for immutable references, camelCase for functions and variables, and PascalCase for components (`Heatseeker`, `GameBoard`). Colocate pure helpers in `src/gameLogic.ts` or dedicated utility modules rather than inside components. Tailwind utility classes are preferred for styling; extend `tailwind.config.ts` instead of introducing arbitrary CSS.

## Testing Guidelines

Write unit coverage alongside features. Keep mocks and fixtures in `test/`, using Testing Library patterns (`screen`, `userEvent`). For gameplay shifts, update relevant Playwright specs under `e2e/`; keep them deterministic by reusing exported helpers and seeding predictable boards. Ensure coverage stays even or increases before requesting review.

Always run `npm run test:run` (or the task-specific variant) and `npm run test:e2e` locally before declaring a task complete so regressions are caught early.

Reference related issues or incidents and flag follow-up work so reviewers can plan next steps.

## Commit & Pull Request Guidelines

Do not perform git operations or commands until you have run tests and confirmed they all pass, or until you have received feedback that all tests pass.

Craft concise, imperative commit messages mirroring current history (e.g., `Refactor heat map colors`). Always append commits with the text`-codex`. Pull requests should include: a short summary, affected commands, test evidence (`npm run test:coverage`, `npm run test:e2e:report` when touched), and UI screenshots or clips for visual changes.

Reference related issues or incidents and flag follow-up work so reviewers can plan next steps.
