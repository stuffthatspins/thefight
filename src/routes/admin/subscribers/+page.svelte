<script lang="ts">
  let { data } = $props<{
    subscribers: { id: string; email: string; subscribed_at: string }[];
    loadError?: string | null;
  }>();

  let searchQuery = $state('');

  const filteredSubscribers = $derived(
    data.subscribers.filter(
      (s: { email: string }) =>
        !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>Subscribers — Admin</title>
</svelte:head>

{#if data.loadError}
  <div class="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
    <p class="font-medium">Could not load data</p>
    <p class="text-sm mt-1">{data.loadError}</p>
  </div>
{/if}

<section>
  <h2 class="text-lg font-semibold text-amber-500 mb-4">Mailing List ({filteredSubscribers.length})</h2>
  <div class="mb-3">
    <input
      type="search"
      placeholder="Search by email..."
      bind:value={searchQuery}
      class="w-full max-w-xs px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500"
    />
  </div>
  <div class="rounded border border-zinc-700 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-zinc-800 text-left">
          <th class="px-4 py-2 text-zinc-400 font-medium">Email</th>
          <th class="px-4 py-2 text-zinc-400 font-medium">Subscribed</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredSubscribers as s (s.id)}
          <tr class="border-t border-zinc-700 hover:bg-zinc-800/50">
            <td class="px-4 py-2">{s.email}</td>
            <td class="px-4 py-2 text-zinc-500">{new Date(s.subscribed_at).toLocaleDateString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
