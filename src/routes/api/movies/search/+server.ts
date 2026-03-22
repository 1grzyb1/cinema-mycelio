import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { OmdbSearchItem } from '$lib/omdb-types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) {
		return json({ results: [] as OmdbSearchItem[], omdbError: null as string | null });
	}

	const key = env.OMDB_API_KEY;
	if (!key) {
		return json({
			results: [] as OmdbSearchItem[],
			omdbError: 'Brak OMDB_API_KEY w konfiguracji serwera'
		});
	}

	const u = new URL('https://www.omdbapi.com/');
	u.searchParams.set('apikey', key);
	u.searchParams.set('s', q);
	u.searchParams.set('type', 'movie');

	let data: {
		Response: string;
		Search?: OmdbSearchItem[];
		Error?: string;
	};
	try {
		const res = await fetch(u);
		console.log(JSON.stringify(res));
		if (!res.ok) {
			return json({
				results: [] as OmdbSearchItem[],
				omdbError: 'Nie udało się połączyć z OMDb'
			});
		}
		data = (await res.json()) as typeof data;
	} catch {
		return json({
			results: [] as OmdbSearchItem[],
			omdbError: 'Błąd sieci przy zapytaniu do OMDb'
		});
	}

	if (data.Response === 'False') {
		return json({
			results: [] as OmdbSearchItem[],
			omdbError: data.Error ?? 'Brak wyników'
		});
	}

	return json({ results: data.Search ?? [], omdbError: null });
};
