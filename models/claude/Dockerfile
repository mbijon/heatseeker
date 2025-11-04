FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # For VNC server (optional visualization)
    tigervnc-standalone-server \
    tigervnc-common \
    x11-utils \
    xvfb \
    # For Playwright browser
    libxdamage1 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpango-gobject-0 \
    libpangoft2-1.0-0 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libepoxy0 \
    libexpat1 \
    libfontconfig1 \
    libfreetype6 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libglvnd0 \
    libgtk-3-0 \
    libharfbuzz0b \
    libicu72 \
    libminizip1 \
    libnspr4 \
    libnss3 \
    libopengl0 \
    libpixman-1-0 \
    libpng16-16 \
    libwebp7 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcb-dri3-0 \
    libxcursor1 \
    libxext6 \
    libxfixes3 \
    libxft2 \
    libxi6 \
    libxinerama1 \
    libxkbcommon0 \
    libxkbcommon-x11-0 \
    libxkbraw1 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    zlib1g \
    # Utilities
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install --no-cache-dir uv

# Set working directory
WORKDIR /app

# Copy project files
COPY pyproject.toml .
COPY src/ src/
COPY tests/ tests/

# Create virtual environment and install dependencies
RUN uv venv /app/.venv && \
    /app/.venv/bin/uv sync

# Install Playwright browsers
RUN /app/.venv/bin/python -m playwright install chromium

# Create VNC and display directories
RUN mkdir -p /tmp/.X11-unix /home/user/.vnc
RUN chmod 1777 /tmp/.X11-unix

# Set up VNC password
RUN /app/.venv/bin/python -c "print('123456')" | vncpasswd -f > /home/user/.vnc/passwd && \
    chmod 600 /home/user/.vnc/passwd

# Create entrypoint script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Start VNC server
echo "Starting VNC server..."
vncserver :1 -geometry 1280x800 -depth 24 \
    -SecurityTypes None \
    -Xvfb "Xvfb :1 -screen 0 1280x800x24" &
sleep 2

# Export display
export DISPLAY=:1

# Activate virtual environment
source /app/.venv/bin/activate

# Run the agent
echo "Starting Claude computer use agent..."
python -m src.agent

# Keep container running
tail -f /dev/null
EOF

RUN chmod +x /app/entrypoint.sh

# Expose VNC port
EXPOSE 5900 6080

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
