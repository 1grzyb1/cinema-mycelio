<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PixelAvatarEditor from '$lib/components/PixelAvatarEditor.svelte';
	import PersonPickerList from '$lib/components/PersonPickerList.svelte';
	import type { PersonRow } from '$lib/person-types';
	import { setCurrentPerson, type CurrentPerson } from '$lib/person-storage';

	let {
		people,
		onComplete
	}: {
		people: PersonRow[];
		onComplete: () => void;
	} = $props();

	let newName = $state('');
	let submitError = $state<string | null>(null);
	let submitting = $state(false);
	let editor = $state<PixelAvatarEditor | null>(null);

	function toCurrentPerson(p: PersonRow): CurrentPerson {
		return {
			id: p.id,
			name: p.name,
			avatarSeed: p.avatarSeed,
			avatarOptions: p.avatarOptions
		};
	}

	function pick(person: PersonRow) {
		setCurrentPerson(toCurrentPerson(person));
		onComplete();
	}

	async function createAndJoin(e: Event) {
		e.preventDefault();
		submitError = null;
		const name = newName.trim();
		if (!name) {
			submitError = 'Podaj nazwę.';
			return;
		}
		if (!editor) {
			submitError = 'Edytor awatara nie jest gotowy.';
			return;
		}
		submitting = true;
		try {
			const payload = editor.getPayload();
			const res = await fetch('/api/people', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					avatarSeed: payload.avatarSeed,
					avatarOptions: payload.avatarOptions
				})
			});
			const data = (await res.json()) as {
				error?: string;
				id?: string;
				name?: string;
				avatarSeed?: string;
				avatarOptions?: string;
			};
			if (res.status === 409) {
				submitError = data.error ?? 'Ta nazwa jest już zajęta';
				return;
			}
			if (!res.ok) {
				submitError = data.error ?? 'Nie udało się utworzyć konta';
				return;
			}
			if (!data.id || !data.name || !data.avatarSeed || data.avatarOptions === undefined) {
				submitError = 'Nieprawidłowa odpowiedź serwera';
				return;
			}
			setCurrentPerson({
				id: data.id,
				name: data.name,
				avatarSeed: data.avatarSeed,
				avatarOptions: data.avatarOptions
			});
			onComplete();
		} catch {
			submitError = 'Błąd sieci. Spróbuj ponownie.';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root open={true}>
	<Dialog.Content
		showCloseButton={false}
		interactOutsideBehavior="ignore"
		escapeKeydownBehavior="ignore"
		class="max-h-[90vh] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto border border-neon-violet/35 bg-neon-base p-0 text-neon-text sm:max-w-md"
	>
		<Dialog.Header class="space-y-1 px-6 pt-6 pb-2">
			<Dialog.Title class="text-center text-xl font-semibold tracking-tight text-neon-text">
				Dołącz jako
			</Dialog.Title>
			<Dialog.Description class="text-center text-sm text-neon-text/70">
				Pixelowy awatar, nowa osoba lub wybór z listy
			</Dialog.Description>
		</Dialog.Header>

		<div class="px-6 pb-6">
			<form class="space-y-4" onsubmit={createAndJoin}>
				<PixelAvatarEditor bind:this={editor} disabled={submitting} />

				<label class="sr-only" for="join-name">Nazwa</label>
				<input
					id="join-name"
					type="text"
					maxlength="64"
					autocomplete="off"
					bind:value={newName}
					disabled={submitting}
					placeholder="Wpisz nazwę…"
					class="w-full rounded-lg border border-neon-violet/30 bg-neon-base px-3 py-2 text-sm text-neon-text outline-none placeholder:text-neon-text-dim/80 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/40"
				/>
				<button
					type="submit"
					disabled={submitting}
					class={buttonVariants({
						variant: 'default',
						class: 'w-full border-neon-violet/50 bg-neon-violet/25 hover:bg-neon-violet/35'
					})}
				>
					{submitting ? 'Tworzenie…' : 'Utwórz i dołącz'}
				</button>
				{#if submitError}
					<p class="text-center text-sm text-rose-300/95" role="status">{submitError}</p>
				{/if}
			</form>

			<div class="mt-6 border-t border-white/10 pt-4">
				<p class="mb-2 text-xs font-medium tracking-wide text-neon-text/65 uppercase">
					Lub wybierz z listy
				</p>
				<PersonPickerList
					{people}
					disabled={submitting}
					emptyMessage="Nikt jeszcze nie dołączył — utwórz pierwszą osobę powyżej."
					onPick={pick}
				/>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
