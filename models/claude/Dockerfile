FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install uv package manager and additional tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    python3-venv \
    && pip install --no-cache-dir uv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY pyproject.toml .
COPY src/ src/
COPY tests/ tests/

# Create virtual environment and install dependencies
RUN python3 -m venv /app/.venv
RUN /app/.venv/bin/pip install --upgrade pip setuptools wheel
RUN /app/.venv/bin/pip install -e .
RUN /app/.venv/bin/python -m playwright install chromium

# Create entrypoint script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Activate virtual environment
source /app/.venv/bin/activate

# Run the agent
echo "Starting Claude computer use agent..."
python -m src.agent
EOF

RUN chmod +x /app/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
