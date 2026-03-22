<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Star from '@lucide/svelte/icons/star';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import PersonAvatar from '$lib/components/PersonAvatar.svelte';

	type MovieRow = {
		id: string;
		title: string;
		posterUrl: string | null;
		avgScore: number;
		ratingCount: number;
	};

	type RatingEntry = {
		personId: string;
		personName: string;
		personAvatarSeed: string;
		personAvatarOptions: string;
		score: number;
	};

	let {
		movies,
		ratingsByMovie,
		currentPersonId,
		currentPersonProfile = null
	}: {
		movies: MovieRow[];
		ratingsByMovie: Record<string, RatingEntry[]>;
		currentPersonId: string | null;
		/** Do optymistycznego wpisu przy pierwszej ocenie (gdy nie ma invalidate) */
		currentPersonProfile?: {
			id: string;
			name: string;
			avatarSeed?: string;
			avatarOptions?: string;
		} | null;
	} = $props();

	const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	/** Jedna otwarta sekcja naraz (jak wcześniej single accordion). */
	let openMovieId = $state<string | null>(null);

	let deleteTarget = $state<{ id: string; title: string } | null>(null);

	/** Po zapisie bez invalidate średnie z serwera są stare — tu trzymamy tylko Twoją ocenę do UI */
	let optimisticMyScore = $state<Record<string, number>>({});

	function myScore(movieId: string): number | undefined {
		if (!currentPersonId) return undefined;
		return ratingsByMovie[movieId]?.find((r) => r.personId === currentPersonId)?.score;
	}

	function effectiveMyScore(movieId: string): number | undefined {
		const o = optimisticMyScore[movieId];
		if (o != null) return o;
		return myScore(movieId);
	}

	function ratingEntriesFor(movieId: string): RatingEntry[] {
		const base = ratingsByMovie[movieId] ?? [];
		const opt = optimisticMyScore[movieId];
		if (opt == null || !currentPersonId) return base;
		const i = base.findIndex((r) => r.personId === currentPersonId);
		if (i === -1) {
			if (
				currentPersonProfile &&
				currentPersonProfile.id === currentPersonId &&
				base.every((r) => r.personId !== currentPersonId)
			) {
				return [
					...base,
					{
						personId: currentPersonProfile.id,
						personName: currentPersonProfile.name,
						personAvatarSeed: currentPersonProfile.avatarSeed ?? '',
						personAvatarOptions: currentPersonProfile.avatarOptions ?? '{}',
						score: opt
					}
				].sort((a, b) => a.personName.localeCompare(b.personName, 'pl'));
			}
			return base;
		}
		const copy = [...base];
		copy[i] = { ...copy[i], score: opt };
		return copy;
	}
</script>

{#if movies.length === 0}
	<p class="text-sm text-neon-text/70">Brak filmów — dodaj pierwszy poniżej.</p>
{:else}
	<div class="mx-auto w-full max-w-2xl space-y-2">
		{#each movies as m, i (m.id)}
			<Collapsible.Root
				open={openMovieId === m.id}
				onOpenChange={(open) => {
					openMovieId = open ? m.id : null;
				}}
				class="rounded-lg border border-neon-violet/25 bg-neon-base/35 px-1"
			>
				<Collapsible.Trigger
					class="flex w-full items-center justify-between gap-3 rounded-lg border-neon-violet/40 px-3 py-3 text-left text-sm font-medium text-neon-text transition-colors duration-150 ease-out outline-none hover:bg-neon-violet/10 focus-visible:ring-2 focus-visible:ring-neon-cyan/40 data-[state=open]:border-neon-violet/50"
				>
					<span class="flex min-w-0 flex-1 items-center justify-between gap-3 pr-1">
						<span class="flex min-w-0 flex-1 items-center gap-3">
							<span
								class="w-8 shrink-0 text-center text-sm font-semibold text-neon-text-dim tabular-nums"
								aria-hidden="true"
							>
								{i + 1}
							</span>
							{#if m.posterUrl}
								<img
									src={m.posterUrl}
									alt=""
									class="size-11 shrink-0 rounded bg-neon-violet/10 object-cover"
									loading="lazy"
									decoding="async"
								/>
							{:else}
								<div
									class="flex size-11 shrink-0 items-center justify-center rounded bg-neon-violet/15 text-xs text-neon-text-dim/90"
								>
									—
								</div>
							{/if}
							<span class="truncate font-medium">{m.title}</span>
						</span>
						<span class="shrink-0 text-sm text-neon-text/80 tabular-nums">
							{m.avgScore > 0 ? m.avgScore.toFixed(1) : '—'}
							<span class="text-amber-400/90">★</span>
							<span class="ml-1 text-neon-text-dim/90">({m.ratingCount})</span>
						</span>
					</span>
					<ChevronDown
						class="size-4 shrink-0 text-neon-text/70 transition-transform duration-200 {openMovieId ===
						m.id
							? 'rotate-180'
							: ''}"
					/>
				</Collapsible.Trigger>
				<Collapsible.Content
					class="overflow-hidden px-3 pb-3 text-sm text-neon-text data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
				>
					<div class="space-y-3 border-t border-neon-violet/15 pt-3">
						<div>
							<p class="mb-1 text-xs font-medium tracking-wide text-neon-text/65 uppercase">
								Oceny osób
							</p>
							{#if !ratingEntriesFor(m.id).length}
								<p class="text-sm text-neon-text/60">Jeszcze nikt nie ocenił.</p>
							{:else}
								<ul class="space-y-1 text-sm">
									{#each ratingEntriesFor(m.id) as r (r.personId)}
										<li
											class="flex items-center justify-between gap-4 border-b border-white/5 py-1 last:border-0"
										>
											<span class="flex min-w-0 items-center gap-2">
												<PersonAvatar
													seed={r.personAvatarSeed || r.personId}
													optionsJson={r.personAvatarOptions}
													class="size-7 shrink-0 rounded border border-neon-violet/20 bg-neon-base/50"
												/>
												<span class="truncate">{r.personName}</span>
											</span>
											<span class="shrink-0 text-amber-400/95 tabular-nums">{r.score}/10 ★</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>

						<div>
							<p class="mb-2 text-xs font-medium tracking-wide text-neon-text/65 uppercase">
								Twoja ocena (1–10)
							</p>
							{#if !currentPersonId}
								<p class="text-sm text-neon-text/60">Dołącz jako osoba, aby móc oceniać.</p>
							{:else}
								<form
									method="POST"
									action="?/rate"
									use:enhance={() => {
										return async ({ result, update, formData }) => {
											await update({ reset: false, invalidateAll: false });
											if (result.type === 'success') {
												const movieId = String(formData.get('movieId') ?? '');
												const score = Number(formData.get('score'));
												if (movieId && Number.isInteger(score)) {
													optimisticMyScore = { ...optimisticMyScore, [movieId]: score };
												}
												toast.success('Wynik zapisano pomyślnie');
											}
										};
									}}
									class="inline-block w-full"
								>
									<input type="hidden" name="movieId" value={m.id} />
									<input type="hidden" name="personId" value={currentPersonId} />
									<div class="flex flex-wrap gap-1">
										{#each scores as n (n)}
											<button
												type="submit"
												name="score"
												value={String(n)}
												title={`Ocena ${n} / 10`}
												aria-label={`Oceń na ${n} z 10`}
												class="inline-flex size-6 items-center justify-center rounded-md border border-neon-violet/30 bg-transparent transition-colors duration-150 ease-out hover:border-neon-cyan/50 hover:bg-neon-violet/20 focus:ring-2 focus:ring-neon-cyan/40 focus:outline-none"
											>
												<Star
													class="size-4 {n <= (effectiveMyScore(m.id) ?? 0)
														? 'fill-amber-400 text-amber-300'
														: 'text-neon-text-dim'}"
												/>
											</button>
										{/each}
									</div>
									{#if effectiveMyScore(m.id)}
										<p class="mt-2 text-xs text-neon-text/60">
											Zapisano: {effectiveMyScore(m.id)}/10 — wybierz gwiazdkę, aby zmienić.
										</p>
									{/if}
								</form>
							{/if}
						</div>

						<div class="flex justify-end border-t border-neon-violet/15 pt-3">
							<button
								type="button"
								class="rounded-md px-2 py-1.5 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 focus:ring-2 focus:outline-none focus-visible:ring-destructive/30"
								onclick={() => (deleteTarget = { id: m.id, title: m.title })}
							>
								Usuń film
							</button>
						</div>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</div>
{/if}

{#if deleteTarget}
	{@const pendingDelete = deleteTarget}
	<Dialog.Root
		open={true}
		onOpenChange={(open) => {
			if (!open) deleteTarget = null;
		}}
	>
		<Dialog.Content class="border border-neon-violet/30 bg-neon-base text-neon-text sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="text-neon-text">Usunąć film?</Dialog.Title>
				<Dialog.Description class="text-neon-text/75">
					Czy na pewno usunąć „{pendingDelete.title}”? Wszystkie oceny dla tego filmu zostaną
					usunięte.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" onclick={() => (deleteTarget = null)}>
					Anuluj
				</Button>
				<form
					method="POST"
					action="?/deleteMovie"
					class="inline"
					use:enhance={() => {
						const id = pendingDelete.id;
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								if (openMovieId === id) openMovieId = null;
								deleteTarget = null;
							}
						};
					}}
				>
					<input type="hidden" name="movieId" value={pendingDelete.id} />
					<Button type="submit" variant="destructive">Usuń</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
