# Claude 4.5 Sonnet Computer Use Implementation

## Overview

This directory contains an implementation of Anthropic's Claude 4.5 Sonnet with computer use capabilities to autonomously play the Heatseeker game.

The agent uses Claude's computer vision and tool use features to:
- Take screenshots of the game
- Learn game mechanics through gameplay
- Execute mouse clicks, keyboard inputs, and scrolling
- Reach the leaderboard and complete all 10 levels

## Architecture

The implementation is located in `/models/claude/` and consists of:

- **`/models/claude/src/agent.py`**: Main agent implementation with the `ComputerUseAgent` class
- **`/models/claude/tests/test_agent.py`**: Unit tests for the agent
- **`/models/claude/pyproject.toml`**: Python project configuration using `uv` package manager

## Prerequisites

### System Requirements
- Python 3.11+
- `uv` package manager (see [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/))
- Docker (for containerized execution)
- Git

### Required API Keys
- **ANTHROPIC_API_KEY**: Your Anthropic API key for Claude 4.5 Sonnet access

## Installation and Setup

### Option 1: Local Installation with uv

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Navigate to the Claude models directory**:
   ```bash
   cd /path/to/heatseeker/models/claude
   ```

3. **Create a virtual environment and install dependencies**:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv sync
   ```

4. **Set up environment variables**:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

5. **Run the agent**:
   ```bash
   python -m src.agent
   ```

### Option 2: Docker Container

1. **Build the Docker image**:
   ```bash
   docker build -f Dockerfile -t heatseeker-claude-computer-use .
   ```

2. **Run the container**:
   ```bash
   docker run -e ANTHROPIC_API_KEY="your-api-key-here" \
     heatseeker-claude-computer-use
   ```

3. **View VNC output** (optional, for visual monitoring):
   ```
   The agent runs with VNC server enabled on port 5900 (or 6080)
   Connect with: vnc://localhost:5900
   ```

## Configuration

Edit `/models/claude/src/agent.py` to customize:

- **MODEL**: The Claude model to use (default: `claude-sonnet-4-20250514`)
- **COMPUTER_USE_BETA**: Beta API flag (default: `computer-use-2025-01-24`)
- **DISPLAY_WIDTH**: Screenshot width in pixels (default: 1280)
- **DISPLAY_HEIGHT**: Screenshot height in pixels (default: 800)
- **MAX_ITERATIONS**: Maximum agent loop iterations (default: 100)

## Running the Agent

### Basic Execution

```bash
cd models/claude
python -m src.agent
```

The agent will:
1. Initialize with the game URL
2. Take screenshots to understand the current state
3. Use Claude to analyze screenshots and determine actions
4. Execute actions (click, type, scroll, etc.)
5. Continue until level 10 is completed or max iterations reached

### Custom Prompt

Modify the `initial_prompt` parameter in the `run()` method call:

```python
agent.run(
    initial_prompt="Your custom instruction here",
    url="https://heatseeker-one.vercel.app/"
)
```

### Monitoring Progress

The agent outputs:
- Iteration count and timing
- Claude's response analysis
- Tool use actions executed
- Final status upon completion

Example output:
```
Starting agent loop with prompt: I would like you to learn to play this game...
Max iterations: 100

=== Iteration 1 ===
Response stop_reason: tool_use
Tool use: computer
Tool result: Screenshot taken

=== Iteration 2 ===
Response stop_reason: tool_use
Tool use: computer
Tool result: Clicked at (640, 480)
...

=== Final Result ===
{
  "status": "completed",
  "iterations": 45,
  "conversation_history": [...]
}
```

## Testing

Run the unit tests:

```bash
cd models/claude
source .venv/bin/activate
pytest tests/ -v
```

Or with coverage:

```bash
pytest tests/ --cov=src --cov-report=html
```

## API Reference

### ComputerUseAgent Class

```python
class ComputerUseAgent:
    def __init__(self, api_key: Optional[str] = None, max_iterations: int = 100)
    def run(self, initial_prompt: str, url: str) -> dict
    def take_screenshot(self, url: str) -> str
    def process_tool_use(self, tool_use: dict, url: str) -> str
```

#### Methods

**`__init__(api_key, max_iterations)`**
- Initializes the agent with API credentials
- `api_key`: Anthropic API key (uses ANTHROPIC_API_KEY env var if None)
- `max_iterations`: Maximum loops before stopping

**`run(initial_prompt, url)`**
- Executes the agent loop
- Returns dict with `status`, `iterations`, and `conversation_history`
- Statuses: `"completed"`, `"max_iterations_reached"`, `"error"`

**`take_screenshot(url)`**
- Captures a screenshot of the game using Playwright
- Returns base64-encoded PNG image

**`process_tool_use(tool_use, url)`**
- Executes Claude's tool use requests
- Supports actions: `screenshot`, `click`, `type`, `key`, `scroll`

## Supported Tool Actions

| Action | Parameters | Example |
|--------|-----------|---------|
| `screenshot` | None | `{"action": "screenshot"}` |
| `click` | `coordinate: [x, y]` | `{"action": "click", "coordinate": [640, 480]}` |
| `type` | `text: string` | `{"action": "type", "text": "player name"}` |
| `key` | `key: string` | `{"action": "key", "key": "Enter"}` |
| `scroll` | `coordinate: [x, y]`, `direction: "up"\|"down"`, `amount: int` | `{"action": "scroll", "coordinate": [640, 400], "direction": "down", "amount": 3}` |

## Troubleshooting

### Import Errors
```
ModuleNotFoundError: No module named 'playwright'
```
Solution: Install extra dependencies:
```bash
uv pip install playwright
playwright install
```

### API Key Issues
```
ValueError: ANTHROPIC_API_KEY environment variable is required
```
Solution: Set your API key:
```bash
export ANTHROPIC_API_KEY="sk-..."
```

### Playwright Browser Issues
The agent will automatically launch a Chromium browser for screenshots. If you get browser-related errors:
```bash
playwright install chromium
```

### Rate Limiting
If you encounter rate limit errors, increase the delay between iterations in `agent.py`:
```python
time.sleep(2)  # Increase from 1 to 2 seconds
```

## Performance Notes

- **Screenshot processing**: Uses base64 encoding for API transmission
- **Token usage**: Each screenshot adds vision tokens; average cost ~500 tokens per iteration
- **Expected runtime**: Level 10 completion typically takes 30-60 iterations
- **Iteration time**: 5-10 seconds per iteration depending on network latency

## Docker Notes

The Dockerfile includes:
- Python 3.11+ environment
- All system dependencies for browser automation
- VNC server for remote visualization
- Automated script to run the agent

Build arguments:
```bash
docker build --build-arg ANTHROPIC_API_KEY="your-key" .
```

## References

- [Anthropic Computer Use Documentation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/computer-use-tool)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Heatseeker Game](https://heatseeker-one.vercel.app/)
- [Reference Implementation](https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the test cases in `tests/test_agent.py`
3. Check the Anthropic documentation links above
4. Open an issue in the repository

## License

This implementation is part of the Heatseeker project and follows the same license.
