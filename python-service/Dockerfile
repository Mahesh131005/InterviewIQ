# Dockerfile for Python Microservice
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for code compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY executor.py .
COPY complexity_analyzer.py .
COPY evaluator.py .
COPY adaptive_engine.py .
COPY ai_interviewer.py .
COPY interviewer_prompts.py .
COPY fallback_questions.json .
COPY test_executor.py .

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1
ENV PORT=5001
ENV CODE_TIMEOUT=2000
ENV MEMORY_LIMIT=256
ENV OLLAMA_HOST=host.docker.internal:11434

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Run application
CMD ["python", "app.py"]
