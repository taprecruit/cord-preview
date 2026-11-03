#!/bin/bash

# Container entry point for running Cord in development mode inside
# taprecruit-dev-env (see docker-compose.dev-env.yml). A trimmed-down
# ops/local-dev.sh: dependencies (postgres, redis) are separate containers and
# node_modules is baked into the image.

set -euo pipefail

cd "$(dirname "$0")"/..

if ! test -f localhost/localhost.key || ! test -f localhost/localhost.crt; then
  echo >&2 "Missing localhost/localhost.{key,crt}."
  echo >&2 "Run scripts/generate-localhost-certificates.sh on the host first."
  exit 1
fi

if test -f /certs/rootCA.pem; then
  export NODE_EXTRA_CA_CERTS=/certs/rootCA.pem
fi

# Exported for build/index.mjs and the servers, which load it via dotenv.
export DOTENV_CONFIG_PATH="${DOTENV_CONFIG_PATH:-ops/dev-env.env}"
set -a
# shellcheck source=dev-env.env
. "$DOTENV_CONFIG_PATH"
set +a

echo "Waiting for postgres at $POSTGRES_HOST:$POSTGRES_PORT..."
until pg_isready -q -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  sleep 1
done

npm run migrate

# Application used by the local taprecruit-app (its cord.app_id/cord.secret
# params must match these values).
PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -q \
  -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" \
  --variable=customerID="$DEV_ENV_CUSTOMER_ID" \
  --variable=applicationID="$DEV_ENV_APPLICATION_ID" \
  --variable=applicationSecret="$DEV_ENV_APPLICATION_SECRET" <<'EOF'
INSERT INTO cord.customers (id, name)
VALUES (:'customerID', 'taprecruit-dev-env')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cord.applications (id, name, "sharedSecret", "customerID")
VALUES (:'applicationID', 'taprecruit-dev-env', :'applicationSecret', :'customerID')
ON CONFLICT (id) DO UPDATE SET "sharedSecret" = EXCLUDED."sharedSecret";
EOF

# Only what the servers need: the default target list also builds every
# scripts/*.ts, and building everything in one go peaks at ~3GB, enough to get
# the Docker VM's OOM killer involved. The initial build goes one target at a
# time for the same reason.
TARGETS=(server docsServer external admin consoleReactApp docsClient)
for target in "${TARGETS[@]}"; do
  ./build/index.mjs --mode=development --clean --target="$target"
done

trap 'kill $(jobs -p) 2>/dev/null' EXIT

./build/index.mjs --mode=development --watch --skipInitialBuild \
  --target="$(IFS=,; echo "${TARGETS[*]}")" &

npm run start-external-dev &

npx nodemon --watch dist/server/index.js --watch "$DOTENV_CONFIG_PATH" \
  --ext '*' --delay 300 \
  --exec 'node -r dotenv/config --enable-source-maps ./dist/server/index.js' &

npx nodemon --watch dist/docs/server/index.js --watch "$DOTENV_CONFIG_PATH" \
  --ext '*' --delay 300 \
  --exec 'node -r dotenv/config --enable-source-maps ./dist/docs/server/index.js' &

# If any of the processes above exits, stop the container so the restart
# policy brings everything back up together.
wait -n
