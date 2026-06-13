#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE wenxiao' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wenxiao');

    DO \$\$
    BEGIN
      CREATE USER wenxiao WITH PASSWORD 'wenxiao';
      EXCEPTION WHEN duplicate_object THEN NULL;
    END \$\$;

    GRANT ALL PRIVILEGES ON DATABASE wenxiao TO wenxiao;
EOSQL
