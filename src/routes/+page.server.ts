import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { movie, person, rating } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const people = await db
		.select({
			id: person.id,
			name: person.name,
			avatarSeed: person.avatarSeed,
			avatarOptions: person.avatarOptions
		})
		.from(person)
		.orderBy(asc(person.name));

	const movies = await db
		.select({ id: movie.id, title: movie.title, posterUrl: movie.posterUrl })
		.from(movie);
	const allRatings = await db
		.select({
			movieId: rating.movieId,
			personId: rating.personId,
			score: rating.score
		})
		.from(rating);

	const agg = new Map<string, { sum: number; count: number }>();
	for (const r of allRatings) {
		const cur = agg.get(r.movieId) ?? { sum: 0, count: 0 };
		cur.sum += r.score;
		cur.count += 1;
		agg.set(r.movieId, cur);
	}

	const moviesSorted = [...movies]
		.map((m) => {
			const a = agg.get(m.id);
			return {
				id: m.id,
				title: m.title,
				posterUrl: m.posterUrl,
				avgScore: a ? a.sum / a.count : 0,
				ratingCount: a?.count ?? 0
			};
		})
		.sort((a, b) => {
			if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
			return a.title.localeCompare(b.title, 'pl');
		});

	const metaByPerson = new Map(
		people.map((p) => [
			p.id,
			{ name: p.name, avatarSeed: p.avatarSeed, avatarOptions: p.avatarOptions }
		])
	);
	const ratingsByMovie: Record<
		string,
		{
			personId: string;
			personName: string;
			personAvatarSeed: string;
			personAvatarOptions: string;
			score: number;
		}[]
	> = {};

	for (const r of allRatings) {
		const list = ratingsByMovie[r.movieId] ?? [];
		const meta = metaByPerson.get(r.personId);
		list.push({
			personId: r.personId,
			personName: meta?.name ?? '?',
			personAvatarSeed: meta?.avatarSeed ?? '',
			personAvatarOptions: meta?.avatarOptions ?? '{}',
			score: r.score
		});
		ratingsByMovie[r.movieId] = list;
	}
	for (const id of Object.keys(ratingsByMovie)) {
		ratingsByMovie[id].sort((x, y) => x.personName.localeCompare(y.personName, 'pl'));
	}

	return { people, movies: moviesSorted, ratingsByMovie };
};

export const actions = {
	addMovie: async ({ request }) => {
		const db = getDb();
		const data = await request.formData();
		const tmdbId = String(data.get('tmdbId') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const posterUrlRaw = String(data.get('posterUrl') ?? '').trim();
		const posterUrl = posterUrlRaw && posterUrlRaw !== 'N/A' ? posterUrlRaw : null;

		if (!tmdbId || !title) {
			return fail(400, { message: 'Wybierz film z listy wyszukiwania' });
		}
		if (title.length > 240) {
			return fail(400, { message: 'Tytuł jest za długi' });
		}
		if (!/^\d+$/.test(tmdbId)) {
			return fail(400, { message: 'Nieprawidłowy identyfikator TMDB' });
		}

		try {
			await db.insert(movie).values({
				title,
				tmdbId,
				posterUrl
			});
		} catch (e) {
			if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
				return fail(409, { message: 'Ten film jest już na liście' });
			}
			throw e;
		}
		return { success: true };
	},
	rate: async ({ request }) => {
		const db = getDb();
		const data = await request.formData();
		const movieId = String(data.get('movieId') ?? '');
		const personId = String(data.get('personId') ?? '');
		const scoreRaw = Number(data.get('score'));
		if (!movieId || !personId) return fail(400, { message: 'Brak danych' });
		if (!Number.isInteger(scoreRaw) || scoreRaw < 1 || scoreRaw > 10) {
			return fail(400, { message: 'Ocena musi być liczbą od 1 do 10' });
		}

		const [pRow] = await db.select({ id: person.id }).from(person).where(eq(person.id, personId));
		if (!pRow) return fail(400, { message: 'Nieznana osoba' });
		const [mRow] = await db.select({ id: movie.id }).from(movie).where(eq(movie.id, movieId));
		if (!mRow) return fail(400, { message: 'Nieznany film' });

		await db
			.insert(rating)
			.values({ movieId, personId, score: scoreRaw })
			.onConflictDoUpdate({
				target: [rating.movieId, rating.personId],
				set: { score: scoreRaw }
			});

		return { success: true };
	},
	deleteMovie: async ({ request }) => {
		const db = getDb();
		const data = await request.formData();
		const movieId = String(data.get('movieId') ?? '').trim();
		if (!movieId) {
			return fail(400, { message: 'Brak identyfikatora filmu' });
		}

		const [mRow] = await db.select({ id: movie.id }).from(movie).where(eq(movie.id, movieId));
		if (!mRow) {
			return fail(404, { message: 'Film nie istnieje' });
		}

		await db.delete(movie).where(eq(movie.id, movieId));
		return { success: true };
	}
} satisfies Actions;
