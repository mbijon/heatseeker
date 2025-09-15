# Heatseeker

**Don't step in lava!**
Navigate from the bottom-left to the top-right based on the heat of each tile.

Designed as an [ARC-AGI-3 Challenge](https://arcprize.org/arc-agi/3/) game to test AI/ML model reasoning skills: "Easy for Humans, Hard for AI." Game rules are a puzzle on purpose. **For humans...** if you're just intersted in playing a game, see the rules below.

![Heatseeker game play, level win](./docs/assets/heatseeker%20gameplay%20screen%20-%20game%20over.png)
![Heatseeker game play, found the level](./docs/assets/heatseeker%20gameplay%20screen%20-%20level%20complete.png)

## Gameplay Rules

Navigate from bottom-left to top-right corner to complete each level.

* Use arrow keys to move, but AVOID landing on a lava square
* Colors show the lava count in bordering squares. Increasing heat (yellow, orange, red) means more lava on the next move:
  * Light Grey = 0 nearby
  * Light Yellow = 1 nearby
  * Yellow = 2 nearby
  * Bright Yellow = 3 nearby
  * Yellow-Orange = 4 nearby
  * Orange = 5 nearby
  * Orange-Red = 6 nearby
  * Light Red = 7 nearby
  * Neon Pink = 8 nearby

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
