# Use Python 3.11 on Alpine Linux
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE backend.settings_production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libc6-dev \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create logs directory
RUN mkdir -p logs


# Make startup script executable
RUN chmod +x startup.sh

# Expose port
EXPOSE 8000


# Use gunicorn as the production server
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
