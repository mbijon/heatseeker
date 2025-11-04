"""Main entry point for running Claude computer use."""

import asyncio
import os
import sys

from src.agent import ComputerUseAgent


async def main():
    """Main entry point for running the agent."""
    prompt = (
        "I would like you to learn to play this game: https://heatseeker-one.vercel.app/. "
        "If you successfully reach a Leaderboard score, please enter your name as 'Claude 4.5'. "
        "Keep playing until you complete level 10."
    )

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    # Create agent
    agent = ComputerUseAgent(
        api_key=api_key,
        headless=os.getenv("HEADLESS", "false").lower() == "true",
    )

    try:
        messages = await agent.run(prompt)
        print(f"\nAgent completed. Total messages: {len(messages)}")
        return messages
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

