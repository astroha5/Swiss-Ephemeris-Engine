# syntax=docker/dockerfile:1

# Build stage (optional, but keeps runtime clean if we later need wheels)
FROM python:3.12-slim AS base

# Prevents Python from writing .pyc files and enables unbuffered stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps
RUN apt-get update -y && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project metadata first for better caching
COPY pyproject.toml README.md LICENSE /app/
COPY swiss_calc_engine /app/swiss_calc_engine

# Install runtime dependencies
RUN pip install --upgrade pip setuptools wheel \
    && pip install .

# Runtime configuration
EXPOSE 8000
# Do not bundle Swiss Ephemeris .se1 files; mount them via volume and set EPHE_DIR
ENV EPHE_DIR="/ephe" \
    CORS_ORIGINS="*"

# Default command: run the API
CMD ["swiss-calc-api", "--host", "0.0.0.0", "--port", "8000"]

