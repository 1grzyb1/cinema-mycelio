#!/bin/sh
set -eu
# Stare bazy (imdb_id): dodaj tmdb_id zanim drizzle-kit porówna schemat — inaczej push potrafi wywalić się i zablokować start.
node scripts/migrate-movie-tmdb.mjs
# Reszta schematu (DATABASE_URL). --force = bez promptów w Dockerze.
npx drizzle-kit push --force
exec node build
