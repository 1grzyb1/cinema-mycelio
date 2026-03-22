<script lang="ts">
	import PersonAvatar from '$lib/components/PersonAvatar.svelte';
	import type { PersonRow } from '$lib/person-types';

	let {
		people,
		highlightPersonId = null as string | null,
		disabled = false,
		emptyMessage = 'Brak osób na liście.',
		onPick
	}: {
		people: PersonRow[];
		highlightPersonId?: string | null;
		disabled?: boolean;
		emptyMessage?: string;
		onPick: (person: PersonRow) => void;
	} = $props();
</script>

{#if people.length === 0}
	<p class="text-sm text-neon-text/60">{emptyMessage}</p>
{:else}
	<ul class="max-h-48 space-y-1 overflow-y-auto pr-1">
		{#each people as p (p.id)}
			<li>
				<button
					type="button"
					{disabled}
					class="flex w-full items-center gap-3 rounded-lg border px-2 py-2 text-left text-sm text-neon-text transition-colors duration-150 ease-out focus:ring-2 focus:ring-neon-cyan/40 focus:outline-none {p.id ===
					highlightPersonId
						? 'border-neon-cyan/50 bg-neon-cyan/10'
						: 'border-transparent hover:border-neon-violet/40 hover:bg-neon-violet/15'}"
					onclick={() => onPick(p)}
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
