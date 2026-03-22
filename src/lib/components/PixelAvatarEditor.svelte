<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PersonAvatar from '$lib/components/PersonAvatar.svelte';
	import PixelAvatarCycleRow from '$lib/components/PixelAvatarCycleRow.svelte';
	import {
		PIXEL_CLOTHING,
		PIXEL_EYES,
		PIXEL_HAIR,
		PIXEL_HAT,
		PIXEL_MOUTH,
		PIXEL_SKIN,
		buildPixelAvatarOptions,
		cyclePixelChoice,
		defaultPixelOptionsForForm,
		hydrateEditorFromOptionsJson,
		isValidAvatarSeed,
		type PixelEditorFields
	} from '$lib/pixel-avatar';

	let {
		disabled = false,
		/** When set, load fields from JSON; otherwise use default palette */
		initialOptionsJson = null as string | null,
		/** When set and valid, keep this seed (edit mode); otherwise random UUID */
		initialSeed = null as string | null
	}: {
		disabled?: boolean;
		initialOptionsJson?: string | null;
		initialSeed?: string | null;
	} = $props();

	function resolveHydrationJson(): string {
		if (initialOptionsJson != null && String(initialOptionsJson).length > 0) {
			return String(initialOptionsJson);
		}
		return JSON.stringify(defaultPixelOptionsForForm());
	}

	let fields = $state<PixelEditorFields>(hydrateEditorFromOptionsJson(resolveHydrationJson()));

	let avatarSeed = $state(
		initialSeed != null && isValidAvatarSeed(String(initialSeed))
			? String(initialSeed)
			: crypto.randomUUID()
	);

	const previewOptionsJson = $derived(JSON.stringify(buildPixelAvatarOptions(fields)));

	$effect(() => {
		const json = resolveHydrationJson();
		fields = hydrateEditorFromOptionsJson(json);
		if (initialSeed != null && isValidAvatarSeed(String(initialSeed))) {
			avatarSeed = String(initialSeed);
		}
	});

	function randomizeAll() {
		avatarSeed = crypto.randomUUID();
		fields = {
			hair: PIXEL_HAIR[Math.floor(Math.random() * PIXEL_HAIR.length)]!,
			eyes: PIXEL_EYES[Math.floor(Math.random() * PIXEL_EYES.length)]!,
			mouth: PIXEL_MOUTH[Math.floor(Math.random() * PIXEL_MOUTH.length)]!,
			clothing: PIXEL_CLOTHING[Math.floor(Math.random() * PIXEL_CLOTHING.length)]!,
			hat: PIXEL_HAT[Math.floor(Math.random() * PIXEL_HAT.length)]!,
			skin: PIXEL_SKIN[Math.floor(Math.random() * PIXEL_SKIN.length)]!
		};
	}

	export function getPayload(): { avatarSeed: string; avatarOptions: string } {
		return {
			avatarSeed,
			avatarOptions: JSON.stringify(buildPixelAvatarOptions(fields))
		};
	}

	export function randomizeAppearance() {
		randomizeAll();
	}
</script>

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
			onclick={randomizeAll}
			{disabled}
		>
			Losuj wygląd
		</button>
	</div>

	<div class="min-w-0 flex-1 space-y-2.5 pt-0 sm:pt-6">
		<PixelAvatarCycleRow
			label="Skóra"
			{disabled}
			variant="skin"
			value={fields.skin}
			ariaPrev="Jaśniejszy odcień skóry"
			ariaNext="Ciemniejszy odcień skóry"
			onPrev={() => (fields = { ...fields, skin: cyclePixelChoice(PIXEL_SKIN, fields.skin, -1) })}
			onNext={() => (fields = { ...fields, skin: cyclePixelChoice(PIXEL_SKIN, fields.skin, 1) })}
		/>
		<PixelAvatarCycleRow
			label="Włosy"
			{disabled}
			value={fields.hair}
			ariaPrev="Poprzedni wariant włosów"
			ariaNext="Następny wariant włosów"
			onPrev={() => (fields = { ...fields, hair: cyclePixelChoice(PIXEL_HAIR, fields.hair, -1) })}
			onNext={() => (fields = { ...fields, hair: cyclePixelChoice(PIXEL_HAIR, fields.hair, 1) })}
		/>
		<PixelAvatarCycleRow
			label="Oczy"
			{disabled}
			value={fields.eyes}
			ariaPrev="Poprzedni wariant oczu"
			ariaNext="Następny wariant oczu"
			onPrev={() => (fields = { ...fields, eyes: cyclePixelChoice(PIXEL_EYES, fields.eyes, -1) })}
			onNext={() => (fields = { ...fields, eyes: cyclePixelChoice(PIXEL_EYES, fields.eyes, 1) })}
		/>
		<PixelAvatarCycleRow
			label="Usta"
			{disabled}
			value={fields.mouth}
			ariaPrev="Poprzedni wariant ust"
			ariaNext="Następny wariant ust"
			onPrev={() => (fields = { ...fields, mouth: cyclePixelChoice(PIXEL_MOUTH, fields.mouth, -1) })}
			onNext={() => (fields = { ...fields, mouth: cyclePixelChoice(PIXEL_MOUTH, fields.mouth, 1) })}
		/>
		<PixelAvatarCycleRow
			label="Ubranie"
			{disabled}
			value={fields.clothing}
			ariaPrev="Poprzednie ubranie"
			ariaNext="Następne ubranie"
			onPrev={() =>
				(fields = { ...fields, clothing: cyclePixelChoice(PIXEL_CLOTHING, fields.clothing, -1) })}
			onNext={() =>
				(fields = { ...fields, clothing: cyclePixelChoice(PIXEL_CLOTHING, fields.clothing, 1) })}
		/>
		<PixelAvatarCycleRow
			label="Czapka"
			{disabled}
			value={fields.hat}
			ariaPrev="Poprzednia czapka"
			ariaNext="Następna czapka"
			onPrev={() => (fields = { ...fields, hat: cyclePixelChoice(PIXEL_HAT, fields.hat, -1) })}
			onNext={() => (fields = { ...fields, hat: cyclePixelChoice(PIXEL_HAT, fields.hat, 1) })}
		/>
	</div>
</div>
