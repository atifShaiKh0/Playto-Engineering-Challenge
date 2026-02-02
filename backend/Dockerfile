FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies required to build some Python packages
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential libpq-dev git \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

# Copy project files
COPY . /app

WORKDIR /app/backend

# Make entrypoint executable
RUN chmod +x /app/backend/entrypoint.sh

# Collect static files (optional, but good practice)
RUN python manage.py collectstatic --noinput || true

# Use entrypoint script to run migrations then gunicorn
ENTRYPOINT ["/app/backend/entrypoint.sh"]
