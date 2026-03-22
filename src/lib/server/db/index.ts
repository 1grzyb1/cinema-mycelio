import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let _db: BetterSQLite3Database<typeof schema> | undefined;

/** Opens the DB file from `DATABASE_URL` on first use (not at import time — avoids needing env during `vite build`). */
export function getDb() {
	if (!_db) {
		const url = env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		_db = drizzle(new Database(url), { schema });
	}
	return _db;
}
