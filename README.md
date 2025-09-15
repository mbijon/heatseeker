# Heatseeker
Don't step in lava! Navigate from the bottom-left to the top-right based on the heat of each tile. ARC-AGI-3 challenge game.

## Setup & Running

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

### Run Tests

#### Unit Tests (Vitest)
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

**Unit Test Coverage**: The project includes comprehensive unit tests (33 tests total):
- **Game logic tests** (21 tests) - Core algorithms like heat calculation, lava generation, move validation
- **Component tests** (12 tests) - React UI components, user interactions, game states

Coverage reports are generated in the `coverage/` directory and show line-by-line test coverage for all source files.

#### End-to-End Tests (Playwright)
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

**E2E Test Coverage**: Comprehensive browser-based tests covering:
- **Game functionality** (22 tests) - Complete user workflows, game mechanics, mobile/keyboard controls
- **Accessibility** (8 tests) - Screen reader support, keyboard navigation, color contrast, WCAG compliance
- **Performance** (8 tests) - Load times, responsiveness, memory usage, concurrent operations

E2E tests run across multiple browsers (Chrome, Firefox, Safari) and device types (desktop, tablet, mobile).

## Playable Artifact
https://claude.ai/public/artifacts/9d8cebe2-dcac-48a7-8779-23d95d2beee6
