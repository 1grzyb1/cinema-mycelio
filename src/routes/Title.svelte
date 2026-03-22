<div class="logo">
	<b>Cin<span>e</span>ma<span>&nbsp;Mycel</span>io</b>
</div>

<style>
	.logo {
		contain: paint;
		text-align: center;
		width: 100%;
		margin: 0;
		padding: 0.75rem 0 1.25rem;
		user-select: none;
	}

	.logo b {
		font:
			200 clamp(2rem, 10vw, 4.5rem) 'Vibur',
			cursive;
		color: var(--neon-title-core);
		text-shadow:
			0 0 10px color-mix(in srgb, var(--neon-violet) 40%, transparent),
			0 0 28px color-mix(in srgb, var(--neon-title-glow-violet) 30%, transparent),
			0 0 2px var(--neon-title-core),
			0 0 0.55em var(--neon-title-glow-violet),
			0 0 0.2em var(--neon-title-glow-cyan),
			0 4px 6px var(--neon-shadow-deep);
	}

	@media (prefers-reduced-motion: reduce) {
		.logo b {
			text-shadow:
				0 0 8px color-mix(in srgb, var(--neon-violet) 35%, transparent),
				0 0 2px var(--neon-title-core),
				0 2px 4px var(--neon-shadow-deep);
		}
	}
</style>
