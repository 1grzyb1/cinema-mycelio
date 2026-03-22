<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import Title from './Title.svelte';
	import JoinAsModal from '$lib/components/JoinAsModal.svelte';
	import CurrentUserMenu from '$lib/components/CurrentUserMenu.svelte';
	import AddMovieDialog from '$lib/components/AddMovieDialog.svelte';
	import MovieList from '$lib/components/MovieList.svelte';
	import { getCurrentPerson, type CurrentPerson } from '$lib/person-storage';

	let { data, form }: PageProps = $props();

	let showJoinModal = $state(false);
	let currentPerson = $state<CurrentPerson | null>(null);

	onMount(() => {
		currentPerson = getCurrentPerson();
		showJoinModal = currentPerson === null;
	});

	/** Merge localStorage person with server row so avatar fields stay fresh after invalidate */
	const activePerson = $derived.by((): CurrentPerson | null => {
		const cp = currentPerson;
		if (!cp) return null;
		const row = data.people.find((p) => p.id === cp.id);
		if (row) {
			return {
				id: row.id,
				name: row.name,
				avatarSeed: row.avatarSeed,
				avatarOptions: row.avatarOptions
			};
		}
		return cp;
	});
</script>

<div class="flex w-full flex-col items-stretch gap-6 px-4 py-6 md:px-8">
	{#if showJoinModal}
		<JoinAsModal
			people={data.people}
			onComplete={() => {
				showJoinModal = false;
				currentPerson = getCurrentPerson();
			}}
		/>
	{/if}

	<section class="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 md:gap-10">
		<header class="flex w-full flex-col gap-4 md:gap-5">
			<div class="w-full min-w-0">
				<Title />
			</div>
			<div class="flex w-full items-start justify-between gap-3">
				<div class="min-w-0">
					{#if activePerson}
						<CurrentUserMenu
							person={activePerson}
							people={data.people}
							onUpdate={() => {
								currentPerson = getCurrentPerson();
							}}
						/>
					{/if}
				</div>
				<div class="shrink-0">
					<AddMovieDialog />
				</div>
			</div>
		</header>

		{#if form && typeof form === 'object' && 'message' in form && form.message}
			<p role="alert" class="w-full text-center text-sm text-destructive">{String(form.message)}</p>
		{/if}

		<div class="w-full">
			<MovieList
				movies={data.movies}
				ratingsByMovie={data.ratingsByMovie}
				currentPersonId={currentPerson?.id ?? null}
			/>
		</div>
	</section>
</div>
