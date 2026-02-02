FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt /app/
# Ensure requirements.txt exists or just install manually if list is small
# For this prototype:
RUN pip install django djangorestframework django-cors-headers psycopg2-binary

COPY . /app/

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
