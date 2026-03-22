<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PersonAvatar from '$lib/components/PersonAvatar.svelte';
	import {
		PIXEL_CLOTHING,
		PIXEL_EYES,
		PIXEL_HAIR,
		PIXEL_HAT,
		PIXEL_MOUTH,
		PIXEL_SKIN,
		defaultPixelOptionsForForm,
		type PixelArtOptions
	} from '$lib/pixel-avatar';
	import { setCurrentPerson, type CurrentPerson } from '$lib/person-storage';

	type PersonRow = {
		id: string;
		name: string;
		avatarSeed: string;
		avatarOptions: string;
	};

	let {
		people,
		onComplete
	}: {
		people: PersonRow[];
		onComplete: () => void;
	} = $props();

	const defaults = defaultPixelOptionsForForm();

	let newName = $state('');
	let submitError = $state<string | null>(null);
	let submitting = $state(false);

	let avatarSeed = $state(crypto.randomUUID());
	let hair = $state<(typeof PIXEL_HAIR)[number]>(
		(defaults.hair?.[0] as (typeof PIXEL_HAIR)[number]) ?? 'short12'
	);
	let eyes = $state<(typeof PIXEL_EYES)[number]>(
		(defaults.eyes?.[0] as (typeof PIXEL_EYES)[number]) ?? 'variant06'
	);
	let mouth = $state<(typeof PIXEL_MOUTH)[number]>(
		(defaults.mouth?.[0] as (typeof PIXEL_MOUTH)[number]) ?? 'happy07'
	);
	let clothing = $state<(typeof PIXEL_CLOTHING)[number]>(
		(defaults.clothing?.[0] as (typeof PIXEL_CLOTHING)[number]) ?? 'variant12'
	);
	let hat = $state<(typeof PIXEL_HAT)[number]>(
		(defaults.hat?.[0] as (typeof PIXEL_HAT)[number]) ?? 'variant05'
	);
	let skin = $state<(typeof PIXEL_SKIN)[number]>(
		(defaults.skinColor?.[0] as (typeof PIXEL_SKIN)[number]) ?? 'ffdbac'
	);

	function cycle<T extends string>(arr: readonly T[], current: T, delta: -1 | 1): T {
		let i = arr.indexOf(current);
		if (i < 0) i = 0;
		const n = arr.length;
		return arr[(i + delta + n) % n]!;
	}

	function buildAvatarOptions(): Partial<PixelArtOptions> {
		return {
			hair: [hair],
			eyes: [eyes],
			mouth: [mouth],
			clothing: [clothing],
			hat: [hat],
			hatProbability: 100,
			skinColor: [skin]
		};
	}

	const previewOptionsJson = $derived(JSON.stringify(buildAvatarOptions()));

	function randomizeAvatar() {
		avatarSeed = crypto.randomUUID();
		hair = PIXEL_HAIR[Math.floor(Math.random() * PIXEL_HAIR.length)]!;
		eyes = PIXEL_EYES[Math.floor(Math.random() * PIXEL_EYES.length)]!;
		mouth = PIXEL_MOUTH[Math.floor(Math.random() * PIXEL_MOUTH.length)]!;
		clothing = PIXEL_CLOTHING[Math.floor(Math.random() * PIXEL_CLOTHING.length)]!;
		hat = PIXEL_HAT[Math.floor(Math.random() * PIXEL_HAT.length)]!;
		skin = PIXEL_SKIN[Math.floor(Math.random() * PIXEL_SKIN.length)]!;
	}

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
		submitting = true;
		try {
			const res = await fetch('/api/people', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					avatarSeed,
					avatarOptions: buildAvatarOptions()
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
				<div
					class="flex flex-col gap-4 rounded-lg border border-neon-violet/20 bg-neon-violet/5 p-4 sm:flex-row sm:items-start sm:gap-5"
				>
					<div class="flex shrink-0 flex-col items-center gap-2 sm:w-[7.5rem]">
						<p class="text-xs font-medium tracking-wide text-neon-text/65 uppercase">Podgląd</p>
						<PersonAvatar
							seed={avatarSeed}
							optionsJson={previewOptionsJson}
							class="size-24 rounded-lg border-2 border-neon-cyan/30 bg-neon-base/80 shadow-[0_0_24px_rgb(168_85_247/0.25)]"
						/>
						<button
							type="button"
							class={buttonVariants({
								variant: 'outline',
								size: 'sm',
								class: 'border-neon-cyan/40 text-neon-text hover:bg-neon-cyan/10'
							})}
							onclick={randomizeAvatar}
							disabled={submitting}
						>
							Losuj wygląd
						</button>
					</div>

					<div class="min-w-0 flex-1 space-y-2.5 pt-0 sm:pt-6">
						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Skóra</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Jaśniejszy odcień skóry"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (skin = cycle(PIXEL_SKIN, skin, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="flex min-w-0 flex-1 items-center justify-center gap-2 font-mono text-[11px] text-neon-text/95"
								title={`#${skin}`}
							>
								<span
									class="size-3.5 shrink-0 rounded border border-white/30 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
									style={`background-color: #${skin}`}
									aria-hidden="true"
								></span>
								<span>#{skin}</span>
							</span>
							<button
								type="button"
								disabled={submitting}
								aria-label="Ciemniejszy odcień skóry"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (skin = cycle(PIXEL_SKIN, skin, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Włosy</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Poprzedni wariant włosów"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (hair = cycle(PIXEL_HAIR, hair, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
								title={hair}>{hair}</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Następny wariant włosów"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (hair = cycle(PIXEL_HAIR, hair, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Oczy</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Poprzedni wariant oczu"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (eyes = cycle(PIXEL_EYES, eyes, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
								title={eyes}>{eyes}</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Następny wariant oczu"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (eyes = cycle(PIXEL_EYES, eyes, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Usta</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Poprzedni wariant ust"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (mouth = cycle(PIXEL_MOUTH, mouth, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
								title={mouth}>{mouth}</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Następny wariant ust"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (mouth = cycle(PIXEL_MOUTH, mouth, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Ubranie</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Poprzednie ubranie"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (clothing = cycle(PIXEL_CLOTHING, clothing, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
								title={clothing}>{clothing}</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Następne ubranie"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (clothing = cycle(PIXEL_CLOTHING, clothing, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<span
								class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
								>Czapka</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Poprzednia czapka"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (hat = cycle(PIXEL_HAT, hat, -1))}
							>
								<ChevronLeft class="size-4" />
							</button>
							<span
								class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
								title={hat}>{hat}</span
							>
							<button
								type="button"
								disabled={submitting}
								aria-label="Następna czapka"
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
								})}
								onclick={() => (hat = cycle(PIXEL_HAT, hat, 1))}
							>
								<ChevronRight class="size-4" />
							</button>
						</div>
					</div>
				</div>

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
				{#if people.length === 0}
					<p class="text-sm text-neon-text/60">
						Nikt jeszcze nie dołączył — utwórz pierwszą osobę powyżej.
					</p>
				{:else}
					<ul class="max-h-48 space-y-1 overflow-y-auto pr-1">
						{#each people as p (p.id)}
							<li>
								<button
									type="button"
									class="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-neon-text transition-colors duration-150 ease-out hover:border-neon-violet/40 hover:bg-neon-violet/15 focus:ring-2 focus:ring-neon-cyan/40 focus:outline-none"
									onclick={() => pick(p)}
								>
									<PersonAvatar
										seed={p.avatarSeed || p.id}
										optionsJson={p.avatarOptions}
										class="size-9 shrink-0 rounded-md border border-neon-violet/25 bg-neon-base/50"
									/>
									<span class="min-w-0 truncate font-medium">{p.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
