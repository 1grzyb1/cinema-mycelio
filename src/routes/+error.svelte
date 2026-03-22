<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
	<h1 class="text-lg font-semibold text-neon-text">Nie udało się załadować strony</h1>
	<p class="max-w-md text-sm text-neon-text/75">
		{page.error?.message ?? 'Spróbuj odświeżyć lub wróć później.'}
	</p>
</div>
