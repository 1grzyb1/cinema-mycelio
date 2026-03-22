import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const person = sqliteTable('person', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	/** DiceBear PRNG seed — set at creation so preview matches saved avatar */
	avatarSeed: text('avatar_seed').notNull().default(''),
	/** JSON: partial @dicebear/pixel-art Options (seed is avatarSeed column) */
	avatarOptions: text('avatar_options').notNull().default('{}')
});

export const movie = sqliteTable('movie', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	posterUrl: text('poster_url'),
	/** The Movie Database movie id (np. "335") — unikalny gdy ustawiony */
	tmdbId: text('tmdb_id').unique()
});

export const rating = sqliteTable(
	'rating',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		movieId: text('movie_id')
			.notNull()
			.references(() => movie.id, { onDelete: 'cascade' }),
		personId: text('person_id')
			.notNull()
			.references(() => person.id, { onDelete: 'cascade' }),
		score: integer('score').notNull()
	},
	(table) => [uniqueIndex('rating_movie_person_unique').on(table.movieId, table.personId)]
);
