#!/bin/bash
set -e

echo "Building Next.js..."
npm run build

echo "Building for Cloudflare..."
npx opennextjs-cloudflare build

echo "Build complete! Output in .open-next/"
