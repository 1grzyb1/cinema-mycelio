<script lang="ts">
	/** Prosty grzyb w stylu ikon (currentColor = wypełnienie). */
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	class={className}
	fill="currentColor"
	aria-hidden="true"
>
	<ellipse cx="12" cy="9" rx="8" ry="5.75" />
	<rect x="9" y="12.5" width="6" height="10.5" rx="2.25" />
</svg>
