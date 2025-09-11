# Heatseeker - ARC-AGI-3 Game

## Project Description

Heatseeker is a navigation puzzle game designed to follow ARC-AGI-3 specifications. Players must navigate from the bottom-left corner to the top-right corner of a grid while avoiding hidden lava squares, using color-coded heat signatures to detect proximity to danger.

## Game Rules

- **Objective**: Navigate from bottom-left to top-right corner without stepping on lava
- **Controls**: Arrow keys (desktop) or touch buttons (mobile)
- **Heat Signatures**: Colors indicate nearby lava count:
  - Light Grey = 0 adjacent lava squares
  - Light Yellow = 1 adjacent lava square
  - Yellow = 2 adjacent lava squares
  - Bright Yellow = 3 adjacent lava squares
  - Light Yellow-Orange = 4 adjacent lava squares
  - Deep Yellow-Orange = 5 adjacent lava squares
  - Light Orange-Red = 6 adjacent lava squares
  - Light Red = 7 adjacent lava squares
  - Neon Pink = 8 adjacent lava squares
- **Failure**: Stepping on a lava square (turns black) ends the game
- **Success**: Reaching the green target square completes the level

## Level Progression

1. **Level 1**: 10x10 grid, 1-5 lava squares
2. **Level 2**: 10x10 grid, 5-15 lava squares
3. **Level 3**: 20x20 grid, 20-40 lava squares
4. **Level 4**: 32x32 grid, 40-100 lava squares
5. **Level 5**: 40x40 grid, 100-200 lava squares
6. **Level 6**: 50x50 grid, 250-750 lava squares
7. **Level 7**: 64x64 grid, 400-800 lava squares
8. **Level 8**: 64x64 grid, 800-1600 lava squares
9. **Level 9**: 100x100 grid, 1600-2400 lava squares
10. **Level 10**: 100x100 grid, 2000-5000 lava squares

## ARC-AGI-3 Compliance

- **Grid-based**: All gameplay on 2D grids with colored squares
- **16 colors maximum**: Uses 14 distinct colors for game elements
- **Core knowledge priors**: Spatial reasoning, pattern recognition, risk assessment
- **No language/cultural symbols**: Pure visual pattern-based gameplay
- **Human intuitive**: Easy for humans to understand in under 1 minute
- **AI challenging**: Requires exploration, memory, planning, and strategic thinking

## File Structure

```
heatseeker-game/
├── claude.md                 # This file
├── package.json             # Node.js dependencies
├── src/
│   ├── App.js              # Main React component
│   ├── index.js            # React app entry point
│   └── index.css           # Tailwind CSS imports
├── public/
│   ├── index.html          # HTML template
│   └── manifest.json       # PWA manifest
└── README.md               # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Create new React app
npx create-react-app heatseeker-game
cd heatseeker-game

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind (update tailwind.config.js)
# Add to content: ["./src/**/*.{js,jsx,ts,tsx}"]

# Update src/index.css with Tailwind directives
```

### Running the Game
```bash
npm start
```

## Current Implementation

The game is implemented as a single React component (`HeatSeekerGame`) with the following key features:

### State Management
- `currentLevel`: Current level (0-9)
- `playerPos`: Player position {x, y}
- `lavaSquares`: Set of lava square coordinates
- `visitedSquares`: Map of visited squares and their heat signatures
- `gameState`: 'playing', 'won', or 'lost'
- `moves`: Current level move count
- `totalMoves`: Cumulative moves across all levels
- `gameStarted`: Whether game has been started

### Core Functions
- `generateLavaSquares()`: Creates random lava placement for current level
- `calculateHeat(x, y, lavaSet)`: Counts adjacent lava squares
- `countAdjacentLava(x, y)`: Heat calculation using current game state
- `initializeLevel()`: Sets up new level with proper starting square heat
- `movePlayer(direction)`: Handles player movement and game logic
- `getSquareColor(x, y, size)`: Determines square color based on game state
- `getHeatColor(count)`: Maps heat count to color class

### Key Implementation Details
- Starting square immediately shows correct heat signature (no flickering)
- Mobile controls with D-pad style button layout
- Keyboard controls with arrow key support
- Dual score tracking (level + total moves)
- Responsive design for different grid sizes
- Safe zones guaranteed at start (bottom-left) and target (top-right)

## Development Notes

### Recent Bug Fixes
1. **Starting square flickering**: Fixed by using unified heat calculation logic
2. **Mobile controls not working**: Fixed by ensuring proper function dependencies
3. **Incorrect starting heat**: Fixed by using same calculation for init and movement

### Design Decisions
- Heat signature colors follow intuitive temperature gradient (cool → warm)
- Progressive difficulty scaling across 10 levels
- Mobile-first design with touch-friendly controls
- Immediate visual feedback for all player actions
- No undo mechanism to maintain ARC-AGI-3 challenge level

## Technical Architecture

### Color System
```javascript
const getHeatColor = (adjacentLavaCount) => {
  switch (adjacentLavaCount) {
    case 0: return 'bg-gray-300';    // Light grey
    case 1: return 'bg-yellow-200';  // Light yellow
    case 2: return 'bg-yellow-300';  // Yellow
    case 3: return 'bg-yellow-400';  // Bright yellow
    case 4: return 'bg-yellow-500';  // Light yellow-orange
    case 5: return 'bg-orange-400';  // Deep yellow-orange
    case 6: return 'bg-orange-500';  // Light orange-red
    case 7: return 'bg-red-400';     // Light red
    case 8: return 'bg-pink-400';    // Neon pink
    default: return 'bg-white';
  }
};
```

### Grid Rendering
- Dynamic grid sizing based on level requirements
- Minimum cell size for mobile compatibility
- CSS Grid layout for precise square alignment
- Blue ring indicator for player position
- Responsive sizing for different screen sizes

## Future Enhancements

Potential improvements that could be made:
- Add sound effects for movement and events
- Implement replay system to review completed levels
- Add difficulty settings (more/fewer lava squares)
- Create level editor for custom puzzles
- Add leaderboard system for move efficiency
- Implement hint system for stuck players
- Add colorblind accessibility options

## Testing Considerations

Key areas to test:
- Starting square heat signature accuracy
- Mobile touch controls responsiveness
- Keyboard controls across different browsers
- Grid rendering on various screen sizes
- Score tracking accuracy across level transitions
- Lava placement randomization
- Game state persistence through level changes

The game is designed to be a complete, playable implementation of the ARC-AGI-3 specification with robust error handling and cross-platform compatibility.