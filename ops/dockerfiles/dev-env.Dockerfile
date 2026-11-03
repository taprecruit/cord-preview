# syntax=docker/dockerfile:1

# Development image for running Cord inside taprecruit-dev-env.
# Only dependencies are baked in; the source tree is bind-mounted at runtime
# (see docker-compose.dev-env.yml) and built in watch mode by
# ops/dev-env-start.sh.
FROM node:26-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /radical

# node_modules must be installed inside the image so native modules (e.g.
# sharp) are built for Linux rather than taken from the macOS host.
COPY package.json package-lock.json ./
COPY patches ./patches
# Workspace manifests, so npm links node_modules/@cord-sdk/* to the sources
COPY --parents opensource/sdk-js/packages/*/package.json ./
RUN npm ci && rm -rf /root/.npm

ENV NODE_ENV=development

CMD ["./ops/dev-env-start.sh"]
