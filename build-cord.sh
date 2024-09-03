#!/bin/bash

if [ "$HOSTNAME" = "cord-prod" ]; then
  STATIC_PATH="cord";
else
  STATIC_PATH="cord-test";
fi

# exit on error
set -e

echo "install npm packages"
npm i

echo "build cord"
CORD_BUILD_OUTPUT=dist/generic npm run build

echo "copy external files to CDN"
aws s3 cp dist/generic/external s3://datapeople-static/$STATIC_PATH --recursive

echo "invalidate cloudfront cache"
aws cloudfront create-invalidation --distribution-id=E30AHFUM5FTUOB --paths "/$STATIC_PATH/*"

echo "build docker images"
docker compose build

echo "restart docker containers"
docker compose up -d

echo "clean unused docker images"
docker image prune -a -f

echo "wait for cache invalidation to complete"
while true; do
  sleep 5;
  [[ $(aws cloudfront list-invalidations --distribution-id=E30AHFUM5FTUOB --query "InvalidationList.Items[*].{id:Id,status:Status}[?status=='InProgress']" --output text) == "" ]] && break;
done
