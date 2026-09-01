#!/bin/bash
set -e

echo "Starting NexusOps backend..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema
echo "Pushing database schema..."
npx prisma db push --skip-generate

# Start the server
echo "Starting server..."
node dist/index.js
