<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Vibur&display=swap" rel="stylesheet" />
</svelte:head>

<ModeWatcher defaultMode="dark" />
<Toaster richColors position="top-center" />
<div class="neon-mesh" aria-hidden="true"></div>
<div class="layout-shell">
	{@render children()}
</div>
