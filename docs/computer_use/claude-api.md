# Anthropic Claude Computer-Use Integration

This guide describes how to run the Claude integration that plays Heatseeker via Anthropic's official computer-use API and how to execute the accompanying tests.

## Prerequisites

- Python 3.11 or newer
- An Anthropic API key with computer-use beta access (`ANTHROPIC_API_KEY`)
- [Playwright browsers](https://playwright.dev/python/docs/browsers) installed locally

It is recommended to work inside a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

## Installation

Install the Python dependencies for the Claude integration and download Playwright's browser binaries:

```bash
pip install -r models/claude/requirements.txt
playwright install chromium
```

## Running Claude on Heatseeker

The integration streams Claude's actions while it plays the live production build at `https://heatseeker-one.vercel.app`. Export your API key and invoke the helper module:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
python -m models.claude.run
```

The script prints each event as Claude interacts with the remote workstation (for example: opening the site, clicking on-screen controls, or summarising the run). Customise token and sampling behaviour with `--max-output-tokens` and `--temperature` if needed.

## Running Tests

The automated tests rely on `pytest` and Playwright:

```bash
pytest models/claude/tests
```

The suite validates both the prompt content—using Playwright to parse the rendered instructions—and the HTTP payload emitted to Anthropic's API.

## Troubleshooting

- **403 or network proxy errors**: ensure the environment allows outbound HTTPS traffic to `api.anthropic.com`.
- **Playwright errors about missing browsers**: rerun `playwright install chromium` inside the active virtual environment.
- **Missing API key**: set `ANTHROPIC_API_KEY` before running `python -m models.claude.run`; the client raises a descriptive error otherwise.
