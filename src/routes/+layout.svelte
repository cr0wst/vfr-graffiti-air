<script>
	import '../app.css';
	import Header from '$lib/Header.svelte';
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<slot />
	<div
		class="w-full bg-zinc-900 flex flex-col items-center justify-center p-2 text-xs font-thin text-zinc-400"
	>
		<div>
			GraffitiAir &copy; {new Date().getFullYear()}
			<a href="https://github.com/cr0wst" class="text-white hover:text-zinc-400"
			>Steve Crow (cr0wst)</a
			>
		</div>
	</div>
</div>