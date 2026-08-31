FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required for building Python packages (e.g., asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application source code
COPY . .

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8001

# Run migrations then start the FastAPI application
CMD ["/bin/bash", "./start.sh"]
