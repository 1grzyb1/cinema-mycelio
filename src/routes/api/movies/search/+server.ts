import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { TmdbMovieListItem, TmdbSearchMovieRaw } from '$lib/tmdb-types';
import type { RequestHandler } from './$types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

function yearFromReleaseDate(s: string | undefined): string {
	if (!s || s.length < 4) return '';
	return s.slice(0, 4);
}

function mapResult(m: TmdbSearchMovieRaw): TmdbMovieListItem {
	const posterUrl =
		m.poster_path && m.poster_path.length > 0 ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null;
	return {
		tmdbId: String(m.id),
		title: m.title,
		year: yearFromReleaseDate(m.release_date),
		posterUrl
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) {
		return json({ results: [] as TmdbMovieListItem[], searchError: null as string | null });
	}

	const key = env.TMDB_API_KEY;
	if (!key) {
		return json({
			results: [] as TmdbMovieListItem[],
			searchError: 'Brak TMDB_API_KEY w konfiguracji serwera'
		});
	}

	const u = new URL('https://api.themoviedb.org/3/search/movie');
	u.searchParams.set('query', q);
	u.searchParams.set('language', 'pl-PL');
	u.searchParams.set('api_key', key);

	let data: { results?: TmdbSearchMovieRaw[] };
	try {
		const res = await fetch(u);
		if (res.status === 401) {
			return json({
				results: [] as TmdbMovieListItem[],
				searchError: 'Nieprawidłowy klucz TMDB (401)'
			});
		}
		if (!res.ok) {
			return json({
				results: [] as TmdbMovieListItem[],
				searchError: 'Nie udało się połączyć z The Movie Database'
			});
		}
		data = (await res.json()) as typeof data;
	} catch {
		return json({
			results: [] as TmdbMovieListItem[],
			searchError: 'Błąd sieci przy zapytaniu do TMDB'
		});
	}

	const raw = data.results ?? [];
	return json({
		results: raw.map(mapResult),
		searchError: null
	});
};
