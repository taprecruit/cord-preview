#!/bin/bash

# exit on error
set -e

echo "install npm packages"
npm i

echo "build cord"
CORD_BUILD_OUTPUT=dist/generic npm run build

echo "copy static and sdk files"
aws s3 cp dist/generic/external/static s3://datapeople-static/cord/static --recursive
aws s3 cp dist/generic/external/sdk s3://datapeople-static/cord/sdk --recursive

echo "invalidate cloudfront cache"
aws cloudfront create-invalidation --distribution-id=E30AHFUM5FTUOB --paths '/cord/*'

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
