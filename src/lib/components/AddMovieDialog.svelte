<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import type { OmdbSearchItem } from '$lib/omdb-types';

	let open = $state(false);
	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let results = $state<OmdbSearchItem[]>([]);
	let omdbError = $state<string | null>(null);
	let loading = $state(false);

	const DEBOUNCE_MS = 380;

	$effect(() => {
		const q = searchQuery;
		const id = setTimeout(() => {
			debouncedQuery = q;
		}, DEBOUNCE_MS);
		return () => clearTimeout(id);
	});

	$effect(() => {
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			results = [];
			omdbError = null;
			loading = false;
			return;
		}

		let cancelled = false;
		loading = true;
		omdbError = null;

		fetch(`/api/movies/search?q=${encodeURIComponent(q)}`)
			.then((r) => r.json() as Promise<{ results: OmdbSearchItem[]; omdbError: string | null }>)
			.then((data) => {
				if (cancelled) return;
				results = data.results ?? [];
				omdbError = data.omdbError ?? null;
			})
			.catch(() => {
				if (cancelled) return;
				results = [];
				omdbError = 'Błąd wczytywania wyników';
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default', class: 'shrink-0' })}>
		Dodaj film
	</Dialog.Trigger>
	<Dialog.Content
		class="max-h-[85vh] max-w-[calc(100%-2rem)] gap-0 overflow-hidden border border-neon-violet/30 bg-neon-base p-0 text-neon-text sm:max-w-lg"
	>
		<Dialog.Header class="space-y-1 border-b border-neon-violet/20 px-4 py-3">
			<Dialog.Title class="text-base font-semibold text-neon-text">Dodaj film</Dialog.Title>
		</Dialog.Header>

		<div class="px-4 py-3">
			<label class="sr-only text-neon-text/75" for="omdb-search">Szukaj</label>
			<input
				id="omdb-search"
				type="search"
				bind:value={searchQuery}
				autocomplete="off"
				placeholder="Tytuł filmu…"
				class="w-full rounded-lg border border-neon-violet/35 bg-neon-base px-3 py-2 text-sm text-neon-text outline-none placeholder:text-neon-text-dim/70 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/35"
			/>
			{#if loading}
				<p class="mt-2 text-xs text-neon-text/60">Szukanie…</p>
			{/if}
			{#if omdbError}
				<p role="status" class="mt-2 text-xs text-destructive">{omdbError}</p>
			{/if}
		</div>

		<div class="max-h-[min(50vh,320px)] overflow-y-auto px-2 pb-2">
			<ul class="space-y-1.5 pb-2">
				{#each results as item (item.imdbID)}
					<li>
						<form
							method="POST"
							action="?/addMovie"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') {
										open = false;
										searchQuery = '';
										results = [];
										omdbError = null;
									}
								};
							}}
							class="block"
						>
							<input type="hidden" name="imdbId" value={item.imdbID} />
							<input type="hidden" name="title" value={`${item.Title} (${item.Year})`} />
							<input
								type="hidden"
								name="posterUrl"
								value={item.Poster === 'N/A' ? '' : item.Poster}
							/>
							<button
								type="submit"
								class="flex w-full items-center gap-3 rounded-lg border border-neon-violet/25 border-transparent p-2 text-left transition-colors duration-150 hover:border-neon-violet/45 hover:bg-neon-violet/15"
							>
								{#if item.Poster && item.Poster !== 'N/A'}
									<img
										src={item.Poster}
										alt=""
										class="size-14 shrink-0 rounded bg-neon-violet/10 object-cover"
										loading="lazy"
										decoding="async"
									/>
								{:else}
									<div
										class="flex size-14 shrink-0 items-center justify-center rounded bg-neon-violet/15 text-[10px] text-neon-text-dim"
									>
										brak
									</div>
								{/if}
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium text-neon-text">{item.Title}</span
									>
									<span class="text-xs text-neon-text/65">{item.Year}</span>
								</span>
							</button>
						</form>
					</li>
				{/each}
			</ul>
			{#if debouncedQuery.length >= 2 && !loading && !omdbError && results.length === 0}
				<p class="px-4 pb-4 text-center text-sm text-neon-text/60">Brak wyników.</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
