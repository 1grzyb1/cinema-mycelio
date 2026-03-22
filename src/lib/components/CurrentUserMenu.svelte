<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PersonAvatar from '$lib/components/PersonAvatar.svelte';
	import PixelAvatarEditor from '$lib/components/PixelAvatarEditor.svelte';
	import PersonPickerList from '$lib/components/PersonPickerList.svelte';
	import type { PersonRow } from '$lib/person-types';
	import type { CurrentPerson } from '$lib/person-storage';
	import { setCurrentPerson } from '$lib/person-storage';

	let {
		person,
		people,
		onUpdate
	}: {
		person: CurrentPerson | null;
		people: PersonRow[];
		onUpdate: () => void;
	} = $props();

	let open = $state(false);
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let editor = $state<PixelAvatarEditor | null>(null);

	const personRow = $derived(person ? (people.find((p) => p.id === person.id) ?? null) : null);

	const displaySeed = $derived(personRow?.avatarSeed ?? person?.avatarSeed ?? '');
	const displayOptions = $derived(personRow?.avatarOptions ?? person?.avatarOptions ?? '{}');

	function toCurrentPerson(row: PersonRow): CurrentPerson {
		return {
			id: row.id,
			name: row.name,
			avatarSeed: row.avatarSeed,
			avatarOptions: row.avatarOptions
		};
	}

	function pickOther(row: PersonRow) {
		setCurrentPerson(toCurrentPerson(row));
		open = false;
		invalidateAll();
		onUpdate();
	}

	async function saveAvatar() {
		if (!person || !editor) return;
		saveError = null;
		saving = true;
		try {
			const payload = editor.getPayload();
			const res = await fetch(`/api/people/${encodeURIComponent(person.id)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					avatarSeed: payload.avatarSeed,
					avatarOptions: payload.avatarOptions
				})
			});
			const data = (await res.json()) as {
				error?: string;
				id?: string;
				avatarSeed?: string;
				avatarOptions?: string;
			};
			if (!res.ok) {
				saveError = data.error ?? 'Nie udało się zapisać awatara';
				return;
			}
			if (!data.id || data.avatarSeed === undefined || data.avatarOptions === undefined) {
				saveError = 'Nieprawidłowa odpowiedź serwera';
				return;
			}
			setCurrentPerson({
				id: data.id,
				name: person.name,
				avatarSeed: data.avatarSeed,
				avatarOptions: data.avatarOptions
			});
			open = false;
			invalidateAll();
			onUpdate();
		} catch {
			saveError = 'Błąd sieci';
		} finally {
			saving = false;
		}
	}
</script>

{#if person}
	<Dialog.Root
		bind:open
		onOpenChange={(v) => {
			if (!v) saveError = null;
		}}
	>
		<div class="flex items-start justify-start gap-2">
			<button
				type="button"
				class="group flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border border-neon-violet/30 bg-neon-base/60 px-2 py-1.5 text-left text-sm text-neon-text shadow-sm transition-colors hover:border-neon-cyan/45 hover:bg-neon-violet/15 focus:ring-2 focus:ring-neon-cyan/40 focus:outline-none"
				onclick={() => (open = true)}
				aria-haspopup="dialog"
				aria-expanded={open}
			>
				<PersonAvatar
					seed={displaySeed || person.id}
					optionsJson={displayOptions}
					class="size-9 shrink-0 rounded-md border border-neon-violet/35 bg-neon-base/80"
				/>
				<span class="min-w-0 truncate font-medium">{person.name}</span>
			</button>
		</div>

		<Dialog.Content
			class="max-h-[90vh] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto border border-neon-violet/35 bg-neon-base p-0 text-neon-text sm:max-w-md"
		>
			<Dialog.Header class="space-y-1 px-6 pt-6 pb-2">
				<Dialog.Title class="text-lg font-semibold text-neon-text">Konto</Dialog.Title>
				<Dialog.Description class="text-sm text-neon-text/70">
					Przełącz się na inną osobę lub edytuj swój pixelowy awatar.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6 px-6 pb-6">
				<section class="space-y-3 border-t border-white/10 pt-5">
					<h3 class="text-xs font-medium tracking-wide text-neon-text/65 uppercase">
						Edytuj awatar
					</h3>
					{#if open}
						<PixelAvatarEditor
							bind:this={editor}
							disabled={saving}
							initialSeed={displaySeed}
							initialOptionsJson={displayOptions}
						/>
					{/if}
					{#if saveError}
						<p class="text-sm text-rose-300/95" role="alert">{saveError}</p>
					{/if}
					<button
						type="button"
						disabled={saving}
						class={buttonVariants({
							variant: 'default',
							class: 'w-full border-neon-violet/50 bg-neon-violet/25 hover:bg-neon-violet/35'
						})}
						onclick={saveAvatar}
					>
						{saving ? 'Zapisywanie…' : 'Zapisz awatar'}
					</button>
				</section>

				<section class="space-y-2">
					<h3 class="text-xs font-medium tracking-wide text-neon-text/65 uppercase">
						Przełącz konto
					</h3>
					<PersonPickerList
						{people}
						highlightPersonId={person.id}
						disabled={saving}
						emptyMessage="Brak innych osób."
						onPick={pickOther}
					/>
				</section>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
