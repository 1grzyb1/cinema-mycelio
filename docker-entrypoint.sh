#!/bin/sh
set -eu
# Sync schema to SQLite (DATABASE_URL). --force avoids prompts in Docker; review before destructive changes.
npx drizzle-kit push --force
exec node build
