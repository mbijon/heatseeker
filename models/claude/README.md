# Claude 4.5 Sonnet Computer Use Agent

This is the Claude computer use implementation for the Heatseeker game. The agent uses Claude 4.5 Sonnet's computer vision and tool use capabilities to autonomously learn and play the game.

## Quick Start

### Local Setup

```bash
# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to project directory
cd models/claude

# Set up virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Install Playwright browsers
python -m playwright install chromium

# Set API key
export ANTHROPIC_API_KEY="your-key-here"

# Run the agent
python -m src.agent
```

### Docker

```bash
docker build -t heatseeker-claude .
docker run -e ANTHROPIC_API_KEY="your-key-here" heatseeker-claude
```

## Project Structure

```
models/claude/
├── src/
│   ├── __init__.py
│   └── agent.py          # Main agent implementation
├── tests/
│   └── test_agent.py     # Unit tests
├── pyproject.toml        # Project configuration (uv)
├── Dockerfile            # Docker build configuration
└── README.md             # This file
```

## Features

- **Autonomous Gameplay**: Learns game mechanics through observation
- **Computer Vision**: Analyzes screenshots to understand game state
- **Tool Use**: Executes clicks, typing, and scrolling actions
- **Leaderboard Integration**: Can submit scores with player name
- **Level Progression**: Targets completion up to level 10

## Configuration

Edit `src/agent.py` to customize:

```python
MODEL = "claude-sonnet-4-20250514"           # Model name
DISPLAY_WIDTH = 1280                         # Screenshot width
DISPLAY_HEIGHT = 800                         # Screenshot height
COMPUTER_USE_BETA = "computer-use-2025-01-24"  # Beta API flag
```

## Testing

```bash
pytest tests/ -v
```

## Full Documentation

See `/docs/computer_use/claude-4_5-api.md` for complete documentation including:
- Detailed setup instructions
- Docker containerization guide
- API reference
- Troubleshooting guide
- Performance considerations

## References

- [Anthropic Computer Use Docs](https://docs.claude.com/en/docs/agents-and-tools/tool-use/computer-use-tool)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Anthropic Computer Use Demo](https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo)
