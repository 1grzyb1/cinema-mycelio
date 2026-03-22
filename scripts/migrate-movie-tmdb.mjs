#!/usr/bin/env node
/**
 * Migracja tabeli `movie`: imdb_id → tmdb_id + DDL zgodny ze schema.ts (żeby drizzle-kit push nie odbudowywał tabeli dwa razy).
 * Uruchom: npm run db:migrate-movie-tmdb
 * Wymaga DATABASE_URL (np. z .env).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

function loadDatabaseUrlFromEnvFile() {
	if (process.env.DATABASE_URL) return;
	const envPath = resolve(process.cwd(), '.env');
	if (!existsSync(envPath)) return;
	const raw = readFileSync(envPath, 'utf8');
	for (const line of raw.split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const i = t.indexOf('=');
		if (i === -1) continue;
		const k = t.slice(0, i).trim();
		if (k !== 'DATABASE_URL') continue;
		let v = t.slice(i + 1).trim();
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
			v = v.slice(1, -1);
		}
		process.env.DATABASE_URL = v;
		return;
	}
}

/** Odtwarza `movie` dokładnie jak w schema.ts — inaczej drizzle robi __new_movie i zdublowany CREATE INDEX (błąd). */
function normalizeMovieTable(db) {
	db.exec('PRAGMA foreign_keys=OFF');
	db.exec('DROP INDEX IF EXISTS movie_tmdb_id_unique');
	db.exec('DROP INDEX IF EXISTS movie_imdb_id_unique');
	db.exec(`
		CREATE TABLE __movie_new (
			id text PRIMARY KEY NOT NULL,
			title text NOT NULL,
			poster_url text,
			tmdb_id text
		);
	`);
	db.exec(`
		INSERT INTO __movie_new (id, title, poster_url, tmdb_id)
		SELECT id, title, poster_url, tmdb_id FROM movie;
	`);
	db.exec('DROP TABLE movie');
	db.exec('ALTER TABLE __movie_new RENAME TO movie');
	db.exec('CREATE UNIQUE INDEX movie_tmdb_id_unique ON movie (tmdb_id)');
	db.exec('PRAGMA foreign_keys=ON');
	console.log('migrate-movie-tmdb: movie — normalizacja DDL + indeks tmdb_id');
}

loadDatabaseUrlFromEnvFile();

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('Brak DATABASE_URL (ustaw w .env lub zmiennej środowiskowej).');
	process.exit(1);
}

const dbPath = url.startsWith('file:') ? url.slice('file:'.length) : url;
const db = new Database(dbPath);

try {
	const tableExists = db
		.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='movie'")
		.get();
	if (!tableExists) {
		console.log('migrate-movie-tmdb: brak tabeli movie — pomijam (świeża baza; drizzle-kit push utworzy schemat).');
		process.exit(0);
	}

	const cols = db.prepare('PRAGMA table_info(movie)').all();
	const names = new Set(cols.map((c) => c.name));

	if (!names.has('tmdb_id')) {
		db.exec('ALTER TABLE movie ADD COLUMN tmdb_id text');
		console.log('Dodano kolumnę movie.tmdb_id');
	} else {
		console.log('Kolumna movie.tmdb_id już istnieje — pomijam ALTER.');
	}

	if (names.has('imdb_id')) {
		try {
			db.exec('ALTER TABLE movie DROP COLUMN imdb_id');
			console.log('Usunięto starą kolumnę imdb_id');
		} catch (e) {
			console.warn(
				'Nie udało się usunąć imdb_id (wymagane SQLite 3.35+). Możesz zignorować lub usunąć kolumnę ręcznie:',
				e instanceof Error ? e.message : e
			);
		}
	}

	normalizeMovieTable(db);
} finally {
	db.close();
}

console.log('Migracja zakończona.');
