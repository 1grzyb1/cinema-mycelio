<script lang="ts">
	import { pixelAvatarToDataUri, parseAvatarOptionsJson } from '$lib/pixel-avatar';
	import { cn } from '$lib/utils';

	let {
		seed,
		optionsJson,
		class: className = 'size-8 rounded-md border border-neon-violet/25 bg-neon-base/50'
	}: {
		seed: string;
		optionsJson: string | null | undefined;
		class?: string;
	} = $props();

	let dataUri = $state('');

	$effect(() => {
		const opts = parseAvatarOptionsJson(optionsJson ?? null);
		dataUri = pixelAvatarToDataUri(seed || 'fallback', opts);
	});
</script>

{#if dataUri}
	<img
		src={dataUri}
		alt=""
		class={cn(className, '[image-rendering:pixelated]')}
		aria-hidden="true"
	/>
{/if}
