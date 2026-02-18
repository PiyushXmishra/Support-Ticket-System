#!/bin/sh
set -e

until python -c "import os, psycopg2; psycopg2.connect(host=os.environ.get('POSTGRES_HOST','db'), port=os.environ.get('POSTGRES_PORT','5432'), dbname=os.environ.get('POSTGRES_DB','support_tickets'), user=os.environ.get('POSTGRES_USER','postgres'), password=os.environ.get('POSTGRES_PASSWORD','postgres')).close()"; do
  echo "Waiting for Postgres..."
  sleep 2
done

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000