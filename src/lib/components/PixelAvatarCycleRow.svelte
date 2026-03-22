<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let {
		label,
		disabled = false,
		ariaPrev,
		ariaNext,
		onPrev,
		onNext,
		variant = 'text',
		value
	}: {
		label: string;
		disabled?: boolean;
		ariaPrev: string;
		ariaNext: string;
		onPrev: () => void;
		onNext: () => void;
		variant?: 'text' | 'skin';
		value: string;
	} = $props();
</script>

<div class="flex items-center gap-1.5">
	<span class="w-16 shrink-0 text-[10px] font-medium tracking-wide text-neon-text/70 uppercase"
		>{label}</span
	>
	<button
		type="button"
		{disabled}
		aria-label={ariaPrev}
		class={buttonVariants({
			variant: 'outline',
			size: 'icon',
			class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
		})}
		onclick={onPrev}
	>
		<ChevronLeft class="size-4" />
	</button>
	{#if variant === 'skin'}
		<span
			class="flex min-w-0 flex-1 items-center justify-center gap-2 font-mono text-[11px] text-neon-text/95"
			title={`#${value}`}
		>
			<span
				class="size-3.5 shrink-0 rounded border border-white/30 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
				style={`background-color: #${value}`}
				aria-hidden="true"
			></span>
			<span>#{value}</span>
		</span>
	{:else}
		<span
			class="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-neon-text/95"
			title={value}>{value}</span
		>
	{/if}
	<button
		type="button"
		{disabled}
		aria-label={ariaNext}
		class={buttonVariants({
			variant: 'outline',
			size: 'icon',
			class: 'shrink-0 border-neon-violet/35 text-neon-text hover:bg-neon-violet/15'
		})}
		onclick={onNext}
	>
		<ChevronRight class="size-4" />
	</button>
</div>
