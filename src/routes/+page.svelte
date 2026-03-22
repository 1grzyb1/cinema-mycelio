<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import Title from './Title.svelte';
	import JoinAsModal from '$lib/components/JoinAsModal.svelte';
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

	<section class="mx-auto flex w-full max-w-2xl flex-col items-center space-y-15">
		<header class="relative min-h-[4.5rem] w-full">
			<div class="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-2">
				<div class="pointer-events-auto w-full max-w-3xl">
					<Title />
				</div>
			</div>
		</header>

		{#if form && typeof form === 'object' && 'message' in form && form.message}
			<p role="alert" class="w-full text-center text-sm text-destructive">{String(form.message)}</p>
		{/if}

		<div class="w-full gap-4 flex flex-col items-end">
			<AddMovieDialog />
			<MovieList
				movies={data.movies}
				ratingsByMovie={data.ratingsByMovie}
				currentPersonId={currentPerson?.id ?? null}
			/>
		</div>
	</section>
</div>
