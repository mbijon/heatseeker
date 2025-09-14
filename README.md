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

**Test Coverage**: The project includes comprehensive unit tests (33 tests total):
- **Game logic tests** (21 tests) - Core algorithms like heat calculation, lava generation, move validation
- **Component tests** (12 tests) - React UI components, user interactions, game states

Coverage reports are generated in the `coverage/` directory and show line-by-line test coverage for all source files.

## Playable Artifact
https://claude.ai/public/artifacts/9d8cebe2-dcac-48a7-8779-23d95d2beee6
