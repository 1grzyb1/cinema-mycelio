/** Odpowiedź API GET /3/search/movie (fragment) */
export type TmdbSearchMovieRaw = {
	id: number;
	title: string;
	release_date?: string;
	poster_path?: string | null;
};

/** Wynik zwracany do klienta (formularz + lista) */
export type TmdbMovieListItem = {
	tmdbId: string;
	title: string;
	year: string;
	posterUrl: string | null;
};
