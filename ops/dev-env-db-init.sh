#!/bin/bash

# Prepares Cord's role and database on the shared taprecruit-dev-env postgres
# container. Safe to run repeatedly. Connects as the postgres superuser given
# by PGHOST/PGUSER/PGPASSWORD, because only a superuser may create the
# uuid-ossp extension.

set -euo pipefail

: "${CORD_DB_USER:=cord}"
: "${CORD_DB_PASSWORD:=cord}"
: "${CORD_DB_NAME:=cord_db}"

echo "Waiting for postgres at $PGHOST..."
until pg_isready -q; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 \
  --variable=userName="$CORD_DB_USER" \
  --variable=password="$CORD_DB_PASSWORD" \
  template1 <<'EOF'
SELECT format('CREATE ROLE %I LOGIN CREATEDB PASSWORD %L', :'userName', :'password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'userName')
\gexec
EOF

psql -v ON_ERROR_STOP=1 \
  --variable=userName="$CORD_DB_USER" \
  --variable=dbName="$CORD_DB_NAME" \
  template1 <<'EOF'
-- template0 sidesteps "collation version mismatch" errors on template1 when
-- the data directory was initialised by an older postgres image
SELECT format('CREATE DATABASE %I OWNER %I TEMPLATE template0', :'dbName', :'userName')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'dbName')
\gexec
EOF

psql -v ON_ERROR_STOP=1 "$CORD_DB_NAME" <<'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

echo "Cord database '$CORD_DB_NAME' is ready."
