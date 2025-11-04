# Claude 4.5 Sonnet Computer Use for Heatseeker

This document describes how to run the Claude 4.5 Sonnet computer use implementation to autonomously play the Heatseeker game.

## Overview

The Claude 4.5 Sonnet computer use implementation allows Claude to interact with the Heatseeker game through browser automation. Claude receives screenshots of the game and can perform actions like clicking, typing, and pressing keys to learn and play the game.

## Prerequisites

- Docker and Docker Compose installed
- Anthropic API key with access to Claude 4.5 Sonnet
- The computer use beta feature enabled in your Anthropic account

## Setup

### 1. Navigate to the Claude Implementation Directory

```bash
cd models/claude
```

### 2. Set Environment Variables

Create a `.env` file in the `models/claude` directory (or set environment variables):

```bash
ANTHROPIC_API_KEY=your_api_key_here
HEADLESS=false  # Set to true for headless mode (no GUI)
```

Alternatively, you can set these when running Docker:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
export HEADLESS=false
```

### 3. Build the Docker Image

```bash
docker-compose build
```

This will:

- Install Python 3.11 and system dependencies
- Install Playwright and browser binaries
- Set up the Python environment with uv
- Install all required Python packages

## Running the Computer Use Agent

### Option 1: Using Docker Compose (Recommended)

```bash
docker-compose up
```

This will:

1. Start the container with the agent
2. Launch a browser (headless or visible depending on `HEADLESS` setting)
3. Navigate to the Heatseeker game
4. Begin the agent loop where Claude learns and plays the game

### Option 2: Using Docker Run

```bash
docker build -t claude-heatseeker .
docker run -it \
  -e ANTHROPIC_API_KEY=your_api_key_here \
  -e HEADLESS=false \
  claude-heatseeker
```

### Option 3: Running Locally (Without Docker)

If you prefer to run locally without Docker:

1. Install uv package manager:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Create virtual environment:

   ```bash
   cd models/claude
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   uv pip install -e .
   uv pip install playwright
   playwright install chromium
   ```

4. Set environment variable:

   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

5. Run the agent:
   ```bash
   python -m src.main
   ```

## How It Works

1. **Initialization**: The agent starts a browser and navigates to the Heatseeker game URL.

2. **Screenshot Capture**: An initial screenshot is taken and sent to Claude along with the prompt.

3. **Agent Loop**:

   - Claude receives the screenshot and analyzes the game state
   - Claude requests computer actions (clicks, key presses, typing) through the computer use tool
   - The agent executes these actions in the browser
   - A new screenshot is taken after actions complete
   - The screenshot is sent back to Claude as the tool result
   - The loop continues until Claude completes the task or reaches the iteration limit

4. **Gameplay**: Claude must discover the game rules through observation and gameplay. The prompt explicitly instructs Claude to:
   - Learn to play the game
   - Enter "Claude 4.5" as the name if reaching a leaderboard score
   - Continue playing until completing level 10

## Configuration Options

### Environment Variables

- `ANTHROPIC_API_KEY` (required): Your Anthropic API key
- `HEADLESS` (optional): Set to `true` for headless mode (no browser GUI), `false` for visible browser (default: `false`)

### Agent Parameters

You can modify the agent parameters in `src/agent.py`:

- `model`: Claude model to use (default: `claude-4-5-sonnet-20241022`)
- `max_iterations`: Maximum tool use iterations (default: 1000)
- `display_width`: Browser viewport width (default: 1920)
- `display_height`: Browser viewport height (default: 1080)

## Troubleshooting

### Browser Doesn't Start

- Ensure all system dependencies are installed (Docker handles this automatically)
- For local runs, make sure Playwright browsers are installed: `playwright install chromium`
- Check that display/X11 forwarding is set up if running in GUI mode

### API Errors

- Verify your `ANTHROPIC_API_KEY` is correct and has access to Claude 4.5 Sonnet
- Ensure the computer use beta feature is enabled in your Anthropic account
- Check API rate limits and usage quotas

### Container Issues

- If the container exits immediately, check logs: `docker-compose logs`
- For permission issues, ensure Docker has proper permissions
- For network issues, verify the game URL is accessible from the container

### Screenshot/Image Issues

- Ensure the browser viewport size matches the display dimensions
- Check that the game loads correctly in the browser
- Verify base64 encoding is working (check logs for errors)

## Monitoring Progress

The agent prints progress information to stdout:

- Iteration count
- Tool use actions
- Errors (if any)

You can view logs in real-time:

```bash
docker-compose logs -f
```

## Stopping the Agent

- Press `Ctrl+C` to stop the agent gracefully
- The browser will be closed and the conversation history will be preserved

## Testing

Run unit tests to verify the implementation:

```bash
# In Docker
docker-compose run claude-agent pytest

# Or locally
cd models/claude
source .venv/bin/activate
pytest
```

## Project Structure

```
models/claude/
├── src/
│   ├── __init__.py
│   ├── agent.py          # Main agent loop
│   ├── browser.py        # Browser automation controller
│   └── main.py           # Entry point
├── tests/
│   ├── __init__.py
│   ├── test_agent.py     # Agent tests
│   └── test_browser.py   # Browser controller tests
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml        # Python project configuration
└── README.md
```

## References

- [Anthropic Claude Computer Use Documentation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/computer-use-tool#claude-4-models)
- [Anthropic Computer Use Demo](https://github.com/anthropics/claude-quickstarts/tree/main/computer-use-demo)
- [Playwright Documentation](https://playwright.dev/python/)

## Notes

- The agent is designed to learn the game rules through observation, not by being given instructions
- Claude will attempt to complete level 10, which may take many iterations
- The implementation uses the computer use beta feature (`computer-use-2025-01-24`)
- Screenshots are sent as base64-encoded PNG images
- All actions are executed through Playwright browser automation
